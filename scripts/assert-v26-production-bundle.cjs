#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  assertProductionBundle,
} = require('./v26-production-bundle-lib.cjs');

const repoRoot = path.resolve(__dirname, '..');
const bundleRoot = process.argv[2];

if (!bundleRoot) {
  console.error(
    'Usage: node scripts/assert-v26-production-bundle.cjs <bundle-directory>',
  );
  process.exit(2);
}

try {
  const result = assertProductionBundle({
    bundleRoot: path.resolve(bundleRoot),
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
