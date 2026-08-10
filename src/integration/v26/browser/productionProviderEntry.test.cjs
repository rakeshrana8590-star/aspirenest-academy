#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../..');
const entryPath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'browser',
  'productionProviderEntry.js',
);
const registryPath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'productionBridgeMethodRegistry.json',
);

const text = fs.readFileSync(entryPath, 'utf8');
const registryRaw = JSON.parse(
  fs.readFileSync(registryPath, 'utf8'),
);
const rows = Array.isArray(registryRaw)
  ? registryRaw
  : registryRaw.methods || registryRaw.rows || registryRaw.entries || [];

assert.strictEqual(rows.length, 182);
assert.strictEqual(
  rows.filter((row) => row.owner).length,
  2,
);

const requiredFragments = [
  'from "@aspirenest/firebase-runtime"',
  '../../../firebase.js',
  '../../../profile/usernameAvailabilityClient.js',
  '../../../profile/usernamePasswordSignInClient.js',
  '../../../profile/studentAccountRegistrationClient.js',
  'createFirebaseUsernameAvailabilityCall',
  'createFirebaseUsernamePasswordSignIn',
  'createFirebaseStudentAccountRegistration',
  'registerStudentAccount:',
  'signInWithUsernameAndPassword:',
  'from "firebase/auth"',
  'from "firebase/firestore"',
  '../../../auth/aspireNestIdentity.js',
  '../productionBridgeFoundation.js',
  '../authProductionService.js',
  '../canonicalResourceService.js',
  '../entitlementDecisionService.js',
  '../authorizeProductionService.js',
  './roleExperienceDependencyAdapter.js',
  './firestoreReadDependencyAdapter.js',
  './firebaseAuthDependencyAdapter.js',
  '../productionBridgeMethodRegistry.json',
  'createFirestoreReadDependencyAdapter',
  'createRoleExperienceDependencyAdapter',
  'createFirebaseAuthDependencyAdapter',
  'createAuthProductionService',
  'createCanonicalResourceService',
  'createEntitlementDecisionService',
  'createAuthorizeProductionService',
  'createHandlerRegistry',
  'createAdapterSurface',
  'handlerRegistry.register(',
  'const initialHandlerOwners = handlerRegistry.list();',
  'const expectedInitialHandlerOwners = Object.freeze([',
  'Provider initial handler owners are invalid.',
  'window.__aspirenestExactResourceAdapter = provider;',
];

for (const fragment of requiredFragments) {
  assert.ok(
    text.includes(fragment),
    `Missing provider source fragment: ${fragment}`,
  );
}

const forbiddenFragments = [
  'setDoc',
  'addDoc',
  'updateDoc',
  'deleteDoc',
  'writeBatch',
  'runTransaction',
  'runtime/v26-shell',
  'build-v26-shell',
  'aspirenest-production-provider.js',
  'Provider foundation must not assign runtime owners.',
];

for (const fragment of forbiddenFragments) {
  assert.ok(
    !text.includes(fragment),
    `Forbidden provider source fragment: ${fragment}`,
  );
}

const providerAssignmentCount = (
  text.match(
    /window\.__aspirenestExactResourceAdapter\s*=(?!=)/g,
  ) || []
).length;

assert.strictEqual(providerAssignmentCount, 1);

const registrationCallCount = (
  text.match(/handlerRegistry\.register\(/g) || []
).length;

assert.strictEqual(registrationCallCount, 8);

const expectedMethodOwnerFragments = [
  '"checkUsernameAvailability"',
  '"getSession"',
  '"login"',
  '"logout"',
  '"openCanonical"',
  '"registerAccount"',
  '"signInWithGoogle"',
  '"authorize"',
  'owner: "authProductionService"',
  'owner: "usernameAvailabilityClient"',
  'owner: "canonicalResourceService"',
  'owner: "authorizeProductionService"',
];

for (const fragment of expectedMethodOwnerFragments) {
  assert.ok(
    text.includes(fragment),
    `Missing initial handler fragment: ${fragment}`,
  );
}

assert.ok(
  text.includes(
    'JSON.stringify(initialHandlerOwners)',
  ),
);
assert.ok(
  text.includes(
    'JSON.stringify(expectedInitialHandlerOwners)',
  ),
);
assert.ok(
  !text.includes(
    'handlerRegistry.list().length !== 0',
  ),
);

const registerAccountRow = rows.find(
  (row) => row.name === 'registerAccount',
);

assert(registerAccountRow);
assert.strictEqual(
  registerAccountRow.ownerState,
  'RUNTIME_OWNER_ASSIGNED',
);
assert.strictEqual(
  registerAccountRow.owner,
  'authProductionService',
);
assert.strictEqual(
  registerAccountRow.auditClassification,
  'OWNER_RESOLVED',
);
assert.strictEqual(
  registerAccountRow.canonicalOwner,
  'src/integration/v26/authProductionService.js#createAuthProductionService',
);
assert.strictEqual(
  registerAccountRow.canonicalOwnerMethod,
  'registerAccount',
);
assert.strictEqual(
  registerAccountRow.ownerContractStatus,
  'IMPLEMENTED_RUNTIME_ACTIVATED',
);
assert.strictEqual(
  registerAccountRow.runtimeActivation,
  true,
);


const signInWithGoogleRow = rows.find(
  (row) => row.name === 'signInWithGoogle',
);

assert(signInWithGoogleRow);
assert.strictEqual(
  signInWithGoogleRow.ownerState,
  'RUNTIME_OWNER_ASSIGNED',
);
assert.strictEqual(
  signInWithGoogleRow.owner,
  'authProductionService',
);
assert.strictEqual(
  signInWithGoogleRow.auditClassification,
  'OWNER_RESOLVED',
);
assert.strictEqual(
  signInWithGoogleRow.canonicalOwner,
  'src/integration/v26/authProductionService.js#createAuthProductionService',
);
assert.strictEqual(
  signInWithGoogleRow.canonicalOwnerMethod,
  'login',
);
assert.strictEqual(
  signInWithGoogleRow.ownerContractStatus,
  'IMPLEMENTED_RUNTIME_ACTIVATED',
);
assert.strictEqual(
  signInWithGoogleRow.ownerDecisionEvidence,
  'LP2-P2.3-S2.3.3',
);
assert.strictEqual(
  signInWithGoogleRow.runtimeActivation,
  true,
);

console.log('PROVIDER_ENTRY_STATIC_CONTRACT=PASS');
console.log('PROVIDER_GLOBAL_ASSIGNMENT_COUNT=1');
console.log('PROVIDER_RUNTIME_OWNER_REGISTRATION_CALLS=8');
console.log('INITIAL_IN_MEMORY_HANDLER_OWNER_COUNT=8');
console.log('SAFE_DISABLED_METHODS_AFTER_PROVIDER_INIT=174');
console.log('FIRESTORE_WRITE_SDK_IMPORTS=0');
console.log('RUNTIME_PATH_REFERENCES=0');
console.log('METHOD_REGISTRY_ROWS=182');
console.log('PERSISTENT_REGISTRY_OWNER_ASSIGNMENTS=2');
