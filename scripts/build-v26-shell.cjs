#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  assertProductionBundle,
  listFiles,
} = require('./v26-production-bundle-lib.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(repoRoot, 'runtime', 'v26-shell');
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

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyTree(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

try {
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Canonical V26 shell source is missing: ${sourceRoot}`);
  }

  fs.rmSync(outputRoot, { recursive: true, force: true });
  copyTree(sourceRoot, outputRoot);

  const assertion = assertProductionBundle({
    bundleRoot: outputRoot,
    allowlistPath,
    denylistPath,
  });

  console.log(JSON.stringify({
    ok: true,
    sourceRoot,
    outputRoot,
    sourceFileCount: listFiles(sourceRoot).length,
    outputFileCount: listFiles(outputRoot).length,
    assertion,
  }, null, 2));
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
