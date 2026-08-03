#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  assertProductionBundle,
  prepareProductionBundle,
} = require('./v26-production-bundle-lib.cjs');

const repoRoot = path.resolve(__dirname, '..');
const zipPath = process.argv[2];

if (!zipPath) {
  console.error(
    'Usage: node scripts/test-v26-production-bundle.cjs <locked-v26.zip> [work-directory]',
  );
  process.exit(2);
}

const ownTemp = !process.argv[3];
const workRoot = process.argv[3]
  ? path.resolve(process.argv[3])
  : fs.mkdtempSync(path.join(os.tmpdir(), 'aspirenest-v26-test-'));
const bundleRoot = path.join(workRoot, 'production-bundle');
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

function assertExpectedFailure(label, action) {
  let failed = false;

  try {
    action();
  } catch (error) {
    failed = true;
    console.log(`EXPECTED_FAILURE_PASS=${label}`);
  }

  if (!failed) {
    throw new Error(
      `Forbidden-bundle assertion did not fail for scenario: ${label}`,
    );
  }
}

try {
  fs.rmSync(workRoot, { recursive: true, force: true });
  fs.mkdirSync(workRoot, { recursive: true });

  const prepared = prepareProductionBundle({
    zipPath: path.resolve(zipPath),
    outputRoot: bundleRoot,
    allowlistPath,
    denylistPath,
  });

  const baseline = assertProductionBundle({
    bundleRoot,
    allowlistPath,
    denylistPath,
  });

  const forbiddenDemo = path.join(
    bundleRoot,
    'integration',
    'demo-adapter.js',
  );
  fs.writeFileSync(forbiddenDemo, 'window.AspireNestDemoAdapter = {};\n');
  assertExpectedFailure('DEMO_ADAPTER_FILE', () =>
    assertProductionBundle({
      bundleRoot,
      allowlistPath,
      denylistPath,
    }),
  );
  fs.rmSync(forbiddenDemo);

  const indexPath = path.join(bundleRoot, 'index.html');
  const cleanIndex = fs.readFileSync(indexPath, 'utf8');
  fs.writeFileSync(
    indexPath,
    cleanIndex.replace(
      '<script src="integration/aspirenest-adapter.js"></script>',
      '<script src="integration/demo-adapter.js"></script>\n' +
        '  <script src="integration/aspirenest-adapter.js"></script>',
    ),
  );
  assertExpectedFailure('DEMO_ADAPTER_REFERENCE', () =>
    assertProductionBundle({
      bundleRoot,
      allowlistPath,
      denylistPath,
    }),
  );
  fs.writeFileSync(indexPath, cleanIndex);

  const evidencePath = path.join(
    bundleRoot,
    'evidence',
    'should-not-deploy.txt',
  );
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, 'forbidden\n');
  assertExpectedFailure('EVIDENCE_FILE', () =>
    assertProductionBundle({
      bundleRoot,
      allowlistPath,
      denylistPath,
    }),
  );
  fs.rmSync(path.dirname(evidencePath), {
    recursive: true,
    force: true,
  });

  const finalAssertion = assertProductionBundle({
    bundleRoot,
    allowlistPath,
    denylistPath,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        prepared,
        baseline,
        finalAssertion,
        negativeTests: 3,
        bundleRoot,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
} finally {
  if (ownTemp) {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }
}
