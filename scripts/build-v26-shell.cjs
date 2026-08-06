#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildProviderBundle,
  resolveProviderModuleRoots,
} = require('./build-v26-production-provider.cjs');
const {
  assertProductionBundle,
  composeProductionProvider,
  listFiles,
} = require('./v26-production-bundle-lib.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(
  repoRoot,
  'runtime',
  'v26-shell',
);
const outputRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, 'build');

const allowlistPath = path.join(
  repoRoot,
  'config',
  'v26-production-allowlist.txt',
);
const denylistPath = path.join(
  repoRoot,
  'config',
  'v26-production-denylist.txt',
);

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });

  for (
    const entry
    of fs.readdirSync(
      source,
      { withFileTypes: true },
    )
  ) {
    const sourcePath = path.join(
      source,
      entry.name,
    );
    const destinationPath = path.join(
      destination,
      entry.name,
    );

    if (entry.isDirectory()) {
      copyTree(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      fs.mkdirSync(
        path.dirname(destinationPath),
        { recursive: true },
      );
      fs.copyFileSync(
        sourcePath,
        destinationPath,
      );
    }
  }
}

async function main() {
  const tempRoot = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'aspirenest-v26-shell-build-',
    ),
  );
  const providerFile = path.join(
    tempRoot,
    'aspirenest-production-provider.js',
  );

  try {
    if (!fs.existsSync(sourceRoot)) {
      throw new Error(
        `Canonical V26 shell source is missing: ${sourceRoot}`,
      );
    }

    const provider = await buildProviderBundle({
      outputFile: providerFile,
      resolveModules:
        resolveProviderModuleRoots(),
    });

    fs.rmSync(
      outputRoot,
      {
        recursive: true,
        force: true,
      },
    );
    copyTree(sourceRoot, outputRoot);

    const composition =
      composeProductionProvider({
        bundleRoot: outputRoot,
        providerFile,
      });

    const assertion = assertProductionBundle({
      bundleRoot: outputRoot,
      allowlistPath,
      denylistPath,
    });

    console.log(JSON.stringify({
      ok: true,
      sourceRoot,
      outputRoot,
      sourceFileCount:
        listFiles(sourceRoot).length,
      outputFileCount:
        listFiles(outputRoot).length,
      provider,
      composition,
      assertion,
      runtimeSourceMutation: false,
      generatedProviderCommitted: false,
    }, null, 2));
  } finally {
    fs.rmSync(
      tempRoot,
      {
        recursive: true,
        force: true,
      },
    );
  }
}

main().catch((error) => {
  console.error(
    error && error.stack
      ? error.stack
      : String(error),
  );
  process.exit(1);
});
