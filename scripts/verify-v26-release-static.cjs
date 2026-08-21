#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const tests = Object.freeze([
  'src/integration/v26/productionBridgeFoundation.test.cjs',
  'src/integration/v26/authProductionService.test.cjs',
  'src/integration/v26/authorizeProductionService.test.cjs',
  'src/integration/v26/accessProductionService.test.cjs',
  'src/integration/v26/canonicalResourceService.test.cjs',
  'src/integration/v26/entitlementDecisionService.test.cjs',
  'src/integration/v26/lp4LearningProductionService.test.cjs',
  'src/integration/v26/lp5AcademyOperationsProductionService.test.cjs',
  'src/integration/v26/lp5MentorProfileProductionService.test.cjs',
  'src/integration/v26/lp5PackSecurityContract.test.cjs',
  'src/integration/v26/lp5Phase51SecurityContract.test.cjs',
  'src/integration/v26/browser/productionProviderEntry.test.cjs',
  'scripts/build-v26-production-provider-lp4.test.cjs',
  'scripts/test-v26-provider-runtime-closure-lp4.cjs'
]);

let passed = 0;

for (const relative of tests) {
  console.log(`\n[release-verify] START ${relative}`);
  const result = spawnSync(process.execPath, [relative], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(result.error.stack || String(result.error));
    process.exit(20);
  }

  if (result.status !== 0) {
    console.error(`[release-verify] RED ${relative} exit=${result.status}`);
    process.exit(21);
  }

  passed += 1;
  console.log(`[release-verify] GREEN ${relative}`);
}

console.log(`\nASPIRENEST_V26_RELEASE_VERIFY=GREEN`);
console.log(`ASPIRENEST_V26_RELEASE_VERIFY_TEST_FILES=${passed}/${tests.length}`);
