#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const webpack = require('webpack');

const repoRoot = path.resolve(__dirname, '..');
const entryPath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'browser',
  'productionProviderEntry.js',
);
const defaultFirebaseRuntimePath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'browser',
  'productionProviderFirebaseRuntime.js',
);
const defaultOutputFile = path.join(
  os.tmpdir(),
  'aspirenest-v26-provider-foundation',
  'aspirenest-production-provider.js',
);

class StripSourceMapDirectivesPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      'StripSourceMapDirectivesPlugin',
      (compilation) => {
        const {
          Compilation,
          sources,
        } = compiler.webpack;

        compilation.hooks.processAssets.tap(
          {
            name: 'StripSourceMapDirectivesPlugin',
            stage:
              Compilation
                .PROCESS_ASSETS_STAGE_OPTIMIZE,
          },
          (assets) => {
            for (const name of Object.keys(assets)) {
              if (!name.endsWith('.js')) {
                continue;
              }

              const original = String(
                compilation
                  .getAsset(name)
                  .source
                  .source(),
              );

              const cleaned = original
                .replace(
                  /^[ \t]*\/\/[#@][ \t]*sourceMappingURL=[^\r\n]*(?:\r?\n|$)/gm,
                  '',
                )
                .replace(
                  /\/\*[#@][ \t]*sourceMappingURL=[\s\S]*?\*\//g,
                  '',
                );

              compilation.updateAsset(
                name,
                new sources.RawSource(cleaned),
              );
            }
          },
        );
      },
    );
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(
    path.resolve(parent),
    path.resolve(candidate),
  );

  return (
    relative === ''
    || (
      relative !== '..'
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative)
    )
  );
}

function assertTemporaryOutput(outputFile) {
  const resolved = path.resolve(outputFile);

  if (isInside(repoRoot, resolved)) {
    throw new Error(
      'Provider foundation output must remain outside the repository.',
    );
  }

  return resolved;
}

function normalizeAliases(aliases = {}) {
  if (
    !aliases
    || typeof aliases !== 'object'
    || Array.isArray(aliases)
  ) {
    throw new TypeError('Provider aliases must be an object.');
  }

  return Object.freeze({
    '@aspirenest/firebase-runtime$':
      defaultFirebaseRuntimePath,
    ...aliases,
  });
}

function normalizeResolveModules(resolveModules = []) {
  if (!Array.isArray(resolveModules)) {
    throw new TypeError(
      'Provider resolveModules must be an array.',
    );
  }

  return Object.freeze(
    [
      ...new Set(
        resolveModules
          .filter(Boolean)
          .map((item) => path.resolve(item)),
      ),
    ],
  );
}

function resolveProviderModuleRoots(
  environment = process.env,
) {
  const raw =
    environment
      .ASPIRENEST_PROVIDER_RESOLVE_MODULE_ROOTS
    || environment
      .ASPIRENEST_PROVIDER_RESOLVE_MODULE_ROOT
    || '';

  if (!raw.trim()) {
    return Object.freeze([]);
  }

  return Object.freeze(
    raw
      .split(path.delimiter)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => path.resolve(item)),
  );
}

function createProviderWebpackConfig({
  outputFile = defaultOutputFile,
  aliases = {},
  resolveModules = [],
} = {}) {
  const resolvedOutput = assertTemporaryOutput(outputFile);
  const normalizedModules =
    normalizeResolveModules(resolveModules);

  return Object.freeze({
    mode: 'production',
    context: repoRoot,
    target: ['web', 'es2020'],
    entry: entryPath,
    devtool: false,
    output: {
      path: path.dirname(resolvedOutput),
      filename: path.basename(resolvedOutput),
      iife: true,
      globalObject: 'globalThis',
      clean: false,
      compareBeforeEmit: true,
      pathinfo: false,
    },
    resolve: {
      extensions: ['.js', '.json'],
      alias: normalizeAliases(aliases),
      ...(normalizedModules.length
        ? {
            modules: [
              ...normalizedModules,
              'node_modules',
            ],
          }
        : {}),
    },
    optimization: {
      minimize: false,
      runtimeChunk: false,
      splitChunks: false,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    },
    plugins: [
      new StripSourceMapDirectivesPlugin(),
    ],
    performance: {
      hints: false,
    },
    stats: 'errors-warnings',
  });
}

function sha256File(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

function inspectSourceMapPolicy(
  outputFile,
  assetNames,
) {
  const text = fs.readFileSync(outputFile, 'utf8');
  const lineDirectivePattern =
    /^[ \t]*\/\/[#@][ \t]*sourceMappingURL=/m;
  const blockDirectivePattern =
    /\/\*[#@][ \t]*sourceMappingURL=[\s\S]*?\*\//;
  const sourceMapAssets = assetNames.filter(
    (name) => name.endsWith('.map'),
  );

  if (
    lineDirectivePattern.test(text)
    || blockDirectivePattern.test(text)
  ) {
    throw new Error(
      'Provider bundle contains a source-map magic-comment directive.',
    );
  }

  if (sourceMapAssets.length) {
    throw new Error(
      `Provider bundle emitted source-map assets: ${sourceMapAssets.join(',')}`,
    );
  }

  return Object.freeze({
    magicDirectiveCount: 0,
    sourceMapAssetCount: 0,
  });
}

function buildProviderBundle(options = {}) {
  const config = createProviderWebpackConfig(options);
  const outputFile = path.join(
    config.output.path,
    config.output.filename,
  );

  fs.mkdirSync(config.output.path, {
    recursive: true,
  });

  return new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      const details = stats.toJson({
        all: false,
        assets: true,
        errors: true,
        warnings: true,
      });

      if (stats.hasErrors()) {
        reject(
          new Error(
            details.errors
              .map((item) => item.message || String(item))
              .join('\n'),
          ),
        );
        return;
      }

      if (!fs.existsSync(outputFile)) {
        reject(
          new Error(
            'Provider bundle output was not created.',
          ),
        );
        return;
      }

      const assetNames = Object.freeze(
        (details.assets || [])
          .map((asset) => asset.name)
          .sort(),
      );
      const sourceMapPolicy =
        inspectSourceMapPolicy(
          outputFile,
          assetNames,
        );

      resolve(Object.freeze({
        outputFile,
        sha256: sha256File(outputFile),
        bytes: fs.statSync(outputFile).size,
        assetNames,
        warnings: Object.freeze(
          (details.warnings || [])
            .map((item) => item.message || String(item)),
        ),
        sourceMapPolicy,
      }));
    });
  });
}

function resolveCliOutput(argv) {
  const outputIndex = argv.indexOf('--output');

  if (outputIndex === -1) {
    return defaultOutputFile;
  }

  const value = argv[outputIndex + 1];

  if (!value || value.startsWith('--')) {
    throw new Error('--output requires a file path.');
  }

  return path.resolve(value);
}

async function main() {
  const result = await buildProviderBundle({
    outputFile: resolveCliOutput(
      process.argv.slice(2),
    ),
    resolveModules:
      resolveProviderModuleRoots(),
  });

  console.log(JSON.stringify({
    ok: true,
    temporaryOutputOnly: true,
    runtimeActivation: false,
    ...result,
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      error && error.stack
        ? error.stack
        : String(error),
    );
    process.exit(1);
  });
}

module.exports = Object.freeze({
  StripSourceMapDirectivesPlugin,
  buildProviderBundle,
  createProviderWebpackConfig,
  defaultFirebaseRuntimePath,
  defaultOutputFile,
  entryPath,
  repoRoot,
  resolveProviderModuleRoots,
});
