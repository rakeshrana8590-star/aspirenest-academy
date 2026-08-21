#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const tests = Object.freeze([
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
const failures = [];

for (const relative of tests) {
  console.log(`\n[release-verify] START ${relative}`);
  const result = spawnSync(process.execPath, [relative], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.error) {
    failures.push(`${relative}:spawn:${result.error.message}`);
    console.error(`[release-verify] RED ${relative} spawn-error`);
    continue;
  }

  if (result.status !== 0) {
    failures.push(`${relative}:exit:${result.status}`);
    console.error(`[release-verify] RED ${relative} exit=${result.status}`);
    continue;
  }

  passed += 1;
  console.log(`[release-verify] GREEN ${relative}`);
}

console.log(`\nASPIRENEST_V26_RELEASE_VERIFY_TEST_FILES=${passed}/${tests.length}`);

if (failures.length) {
  console.error(`ASPIRENEST_V26_RELEASE_VERIFY=RED`);
  console.error(`ASPIRENEST_V26_RELEASE_VERIFY_FAILURE_COUNT=${failures.length}`);
  for (const failure of failures) console.error(`ASPIRENEST_V26_RELEASE_VERIFY_FAILURE=${failure}`);
  process.exit(21);
}

console.log(`ASPIRENEST_V26_RELEASE_VERIFY=GREEN`);
console.log(`ASPIRENEST_V26_RELEASE_VERIFY_FAILURE_COUNT=0`);
