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
  prepareProductionBundle,
} = require('./v26-production-bundle-lib.cjs');

const repoRoot = path.resolve(__dirname, '..');
const zipPath = process.argv[2];
const outputRoot = process.argv[3];

if (!zipPath || !outputRoot) {
  console.error(
    'Usage: node scripts/prepare-v26-production-bundle.cjs <locked-v26.zip> <output-directory>',
  );
  process.exit(2);
}

async function main() {
  const tempRoot = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'aspirenest-v26-prepare-',
    ),
  );
  const providerFile = path.join(
    tempRoot,
    'aspirenest-production-provider.js',
  );

  try {
    const provider = await buildProviderBundle({
      outputFile: providerFile,
      resolveModules:
        resolveProviderModuleRoots(),
    });

    const prepared = prepareProductionBundle({
      zipPath: path.resolve(zipPath),
      outputRoot: path.resolve(outputRoot),
      allowlistPath: path.join(
        repoRoot,
        'config',
        'v26-production-allowlist.txt',
      ),
      denylistPath: path.join(
        repoRoot,
        'config',
        'v26-production-denylist.txt',
      ),
      providerFile,
    });

    console.log(JSON.stringify({
      ok: true,
      provider,
      prepared,
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
