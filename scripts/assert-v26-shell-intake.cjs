#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  assertProductionBundle,
  listFiles,
} = require('./v26-production-bundle-lib.cjs');

const repoRoot = path.resolve(__dirname, '..');
const runtimeRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, 'runtime', 'v26-shell');

const manifestPath = path.join(
  repoRoot,
  'config',
  'v26-shell-source-manifest.tsv',
);
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

function sha256File(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

function readManifest(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const header = lines.shift();

  if (header !== 'path\tbytes\tsha256') {
    throw new Error('Unexpected V26 shell source-manifest header.');
  }

  return lines.map((line) => {
    const [relativePath, bytes, sha256] = line.split('\t');
    return {
      path: relativePath,
      bytes: Number(bytes),
      sha256,
    };
  });
}

try {
  const manifest = readManifest(manifestPath);
  const actualFiles = listFiles(runtimeRoot);

  if (manifest.length !== 14 || actualFiles.length !== 14) {
    throw new Error(
      `Exact V26 shell must contain 14 files; manifest=${manifest.length}, actual=${actualFiles.length}`,
    );
  }

  const manifestPaths = manifest.map((row) => row.path).sort();

  if (JSON.stringify(manifestPaths) !== JSON.stringify(actualFiles)) {
    throw new Error('Runtime shell file set differs from source manifest.');
  }

  for (const row of manifest) {
    const filePath = path.join(runtimeRoot, row.path);
    const stat = fs.statSync(filePath);

    if (stat.size !== row.bytes) {
      throw new Error(`Byte-size mismatch: ${row.path}`);
    }

    if (sha256File(filePath) !== row.sha256) {
      throw new Error(`SHA256 mismatch: ${row.path}`);
    }
  }

  const bundleAssertion = assertProductionBundle({
    bundleRoot: runtimeRoot,
    allowlistPath,
    denylistPath,
  });

  const indexText = fs.readFileSync(
    path.join(runtimeRoot, 'index.html'),
    'utf8',
  );
  const appText = fs.readFileSync(
    path.join(runtimeRoot, 'app.js'),
    'utf8',
  );
  const swText = fs.readFileSync(
    path.join(runtimeRoot, 'sw.js'),
    'utf8',
  );

  const forbiddenShellPatterns = [
    ['iframe-shell', /<iframe\b/i],
    ['demo-adapter', /demo-adapter\.js/],
    ['old-v8-bootstrap', /v8-route-bootstrap\.js/],
    ['old-learning-drive-assets', /learning-drive-v8\//],
  ];

  const violations = [];

  for (const [label, pattern] of forbiddenShellPatterns) {
    for (const [name, text] of [
      ['index.html', indexText],
      ['app.js', appText],
      ['sw.js', swText],
    ]) {
      if (pattern.test(text)) {
        violations.push(`${name}:${label}`);
      }
    }
  }

  if (violations.length) {
    throw new Error(
      `Forbidden duplicate-shell markers found: ${violations.join(', ')}`,
    );
  }

  console.log(JSON.stringify({
    ok: true,
    runtimeRoot,
    manifestRows: manifest.length,
    actualFileCount: actualFiles.length,
    bundleAssertion,
    iframeShellOwner: false,
    visibleShellOwner: 'AN_V26',
    routeOwner: 'AN_V26/app.js',
  }, null, 2));
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
