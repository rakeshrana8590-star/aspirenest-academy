#!/usr/bin/env node
'use strict';

const path = require('path');
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

try {
  const result = prepareProductionBundle({
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
  });

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
