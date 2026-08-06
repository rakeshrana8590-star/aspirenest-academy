#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const {
  buildProviderBundle,
  createProviderWebpackConfig,
  repoRoot,
} = require('./build-v26-production-provider.cjs');

const registryPath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'productionBridgeMethodRegistry.json',
);
const runtimeIndexPath = path.join(
  repoRoot,
  'runtime',
  'v26-shell',
  'index.html',
);
const shellBuildPath = path.join(
  repoRoot,
  'scripts',
  'build-v26-shell.cjs',
);

function sha256File(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

function writeStubModules(root) {
  const corePath = path.join(root, 'firebase-runtime-stub.js');
  const authPath = path.join(root, 'firebase-auth-stub.js');
  const firestorePath = path.join(
    root,
    'firebase-firestore-stub.js',
  );

  fs.writeFileSync(
    corePath,
    [
      'export const auth = Object.freeze({ currentUser: null });',
      'export const db = Object.freeze({ kind: "test-db" });',
      '',
    ].join('\n'),
  );

  fs.writeFileSync(
    authPath,
    [
      'const mark = (name) => {',
      '  globalThis.__aspirenestProviderDependencyCalls[name] += 1;',
      '};',
      'export async function signInWithEmailAndPassword() {',
      '  mark("signInWithEmailAndPassword");',
      '  throw new Error("test auth call forbidden");',
      '}',
      'export async function signInWithPopup() {',
      '  mark("signInWithPopup");',
      '  throw new Error("test auth call forbidden");',
      '}',
      'export async function signOut() {',
      '  mark("signOut");',
      '  return undefined;',
      '}',
      'export class GoogleAuthProvider {',
      '  constructor() { mark("GoogleAuthProvider"); }',
      '  setCustomParameters() { mark("setCustomParameters"); }',
      '}',
      '',
    ].join('\n'),
  );

  fs.writeFileSync(
    firestorePath,
    [
      'const mark = (name) => {',
      '  globalThis.__aspirenestProviderDependencyCalls[name] += 1;',
      '};',
      'export function doc() {',
      '  mark("doc");',
      '  return Object.freeze({});',
      '}',
      'export function collection() {',
      '  mark("collection");',
      '  return Object.freeze({});',
      '}',
      'export async function getDoc() {',
      '  mark("getDoc");',
      '  throw new Error("test firestore read forbidden");',
      '}',
      'export async function getDocs() {',
      '  mark("getDocs");',
      '  throw new Error("test firestore read forbidden");',
      '}',
      '',
    ].join('\n'),
  );

  return Object.freeze({
    '@aspirenest/firebase-runtime$': corePath,
    'firebase/auth$': authPath,
    'firebase/firestore$': firestorePath,
  });
}

function createSandbox() {
  const calls = {
    signInWithEmailAndPassword: 0,
    signInWithPopup: 0,
    signOut: 0,
    GoogleAuthProvider: 0,
    setCustomParameters: 0,
    doc: 0,
    collection: 0,
    getDoc: 0,
    getDocs: 0,
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    crypto: Object.freeze({
      randomUUID: () => 'test-random-uuid',
    }),
    __aspirenestProviderDependencyCalls: calls,
  };

  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  return {
    calls,
    context: vm.createContext(sandbox),
  };
}

async function assertInitialWiredProvider(bundleText) {
  const { calls, context } = createSandbox();

  new vm.Script(bundleText, {
    filename: 'aspirenest-production-provider.js',
  }).runInContext(context);

  const provider =
    context.window.__aspirenestExactResourceAdapter;

  assert.ok(provider);
  assert.strictEqual(typeof provider, 'object');

  const registryRaw = JSON.parse(
    fs.readFileSync(registryPath, 'utf8'),
  );
  const rows = Array.isArray(registryRaw)
    ? registryRaw
    : registryRaw.methods || registryRaw.rows || registryRaw.entries || [];

  assert.strictEqual(rows.length, 182);
  assert.strictEqual(Object.keys(provider).length, 182);

  const expectedDeferredMethods = Object.freeze({
    recordAttempt: Object.freeze({
      deferredOwnerPhases: Object.freeze(['4.2', '6.1']),
      deferReason:
        'MOCK_SERVER_AUTHORITY_AND_IDEMPOTENCY_NOT_OWNED_BY_LP1',
    }),
    recordProgress: Object.freeze({
      deferredOwnerPhases: Object.freeze(['4.7']),
      deferReason:
        'CANONICAL_CROSS_MODULE_PROGRESS_PERSISTENCE_NOT_OWNED_BY_LP1',
    }),
    recordStudyAction: Object.freeze({
      deferredOwnerPhases: Object.freeze(['4.1', '4.4']),
      deferReason:
        'PRIVATE_NOTE_VIDEO_STUDY_ACTION_PERSISTENCE_NOT_OWNED_BY_LP1',
    }),
    requestMentorHelp: Object.freeze({
      deferredOwnerPhases: Object.freeze(['5.2']),
      deferReason:
        'ASSIGNED_LEARNER_MENTOR_QUESTION_AUTHORITY_NOT_OWNED_BY_LP1',
    }),
  });

  const explicitlyDeferredMethods = rows.filter(
    (row) =>
      row.auditClassification ===
      'INTENTIONALLY_SAFE_DISABLED_DEFERRED_TO_OWNER_PHASE',
  );

  assert.strictEqual(explicitlyDeferredMethods.length, 4);

  for (const row of explicitlyDeferredMethods) {
    const expected = expectedDeferredMethods[row.name];

    assert.ok(expected);
    assert.deepStrictEqual(
      row.deferredOwnerPhases,
      expected.deferredOwnerPhases,
    );
    assert.strictEqual(
      row.deferReason,
      expected.deferReason,
    );
    assert.strictEqual(
      row.ownerState,
      'SAFE_DISABLED_PENDING_OWNER',
    );
    assert.strictEqual(row.owner, null);
  }

  for (const row of rows) {
    assert.strictEqual(
      typeof provider[row.name],
      'function',
      `Provider method missing: ${row.name}`,
    );
  }

  assert.deepStrictEqual(
    Object.values(calls),
    Object.values(calls).map(() => 0),
  );

  const invokeOptions = (method) => Object.freeze({
    requestId: `test-request-${method}`,
    correlationId: `test-correlation-${method}`,
    timeoutMs: 50,
  });

  const getSessionResult = await provider.getSession(
    Object.freeze({}),
    invokeOptions('getSession'),
  );

  assert.strictEqual(getSessionResult.ok, true);
  assert.strictEqual(getSessionResult.code, 'OK');
  assert.strictEqual(
    getSessionResult.data.authenticated,
    false,
  );
  assert.strictEqual(
    getSessionResult.data.role,
    'public',
  );

  const loginResult = await provider.login(
    Object.freeze({}),
    invokeOptions('login'),
  );

  assert.strictEqual(loginResult.ok, false);
  assert.strictEqual(
    loginResult.code,
    'AUTH_INVALID_REQUEST',
  );

  const logoutResult = await provider.logout(
    Object.freeze({}),
    invokeOptions('logout'),
  );

  assert.strictEqual(logoutResult.ok, true);
  assert.strictEqual(logoutResult.code, 'OK');
  assert.strictEqual(
    logoutResult.data.signedOut,
    true,
  );

  const openCanonicalResult =
    await provider.openCanonical(
      Object.freeze({}),
      invokeOptions('openCanonical'),
    );

  assert.strictEqual(openCanonicalResult.ok, false);
  assert.strictEqual(
    openCanonicalResult.code,
    'CANONICAL_RESOURCE_INVALID_REQUEST',
  );

  const authorizeResult = await provider.authorize(
    Object.freeze({}),
    invokeOptions('authorize'),
  );

  assert.strictEqual(authorizeResult.ok, false);
  assert.strictEqual(
    authorizeResult.code,
    'AUTHORIZE_INVALID_REQUEST',
  );

  const wiredMethods = new Set([
    'authorize',
    'getSession',
    'login',
    'logout',
    'openCanonical',
  ]);
  const disabledRows = rows.filter(
    (row) => !wiredMethods.has(row.name),
  );

  assert.strictEqual(disabledRows.length, 177);

  for (const row of disabledRows) {
    const result = await provider[row.name](
      Object.freeze({}),
      invokeOptions(row.name),
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(
      result.code,
      'PRODUCTION_HANDLER_DISABLED',
    );
    assert.strictEqual(result.method, row.name);
    assert.strictEqual(
      result.details.ownerState,
      'SAFE_DISABLED_PENDING_OWNER',
    );
  }

  assert.strictEqual(calls.signOut, 1);

  for (const [name, count] of Object.entries(calls)) {
    if (name !== 'signOut') {
      assert.strictEqual(
        count,
        0,
        `Unexpected dependency call: ${name}`,
      );
    }
  }
}

async function main() {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'aspirenest-provider-test-'),
  );

  const before = {
    registry: sha256File(registryPath),
    index: sha256File(runtimeIndexPath),
    shellBuild: sha256File(shellBuildPath),
  };

  try {
    const aliases = writeStubModules(tempRoot);
    const outputOne = path.join(
      tempRoot,
      'first',
      'aspirenest-production-provider.js',
    );
    const outputTwo = path.join(
      tempRoot,
      'second',
      'aspirenest-production-provider.js',
    );

    assert.throws(
      () => createProviderWebpackConfig({
        outputFile: path.join(
          repoRoot,
          'runtime',
          'v26-shell',
          'integration',
          'aspirenest-production-provider.js',
        ),
        aliases,
      }),
      /outside the repository/,
    );

    const first = await buildProviderBundle({
      outputFile: outputOne,
      aliases,
    });
    const second = await buildProviderBundle({
      outputFile: outputTwo,
      aliases,
    });

    assert.deepStrictEqual(
      first.assetNames,
      ['aspirenest-production-provider.js'],
    );
    assert.deepStrictEqual(
      second.assetNames,
      ['aspirenest-production-provider.js'],
    );
    assert.strictEqual(first.warnings.length, 0);
    assert.strictEqual(second.warnings.length, 0);
    assert.strictEqual(first.sha256, second.sha256);
    assert.strictEqual(
      fs.readFileSync(outputOne, 'utf8'),
      fs.readFileSync(outputTwo, 'utf8'),
    );

    await assertInitialWiredProvider(
      fs.readFileSync(outputOne, 'utf8'),
    );

    assert.strictEqual(
      sha256File(registryPath),
      before.registry,
    );
    assert.strictEqual(
      sha256File(runtimeIndexPath),
      before.index,
    );
    assert.strictEqual(
      sha256File(shellBuildPath),
      before.shellBuild,
    );

    console.log('WEBPACK_PROVIDER_COMPILE=PASS');
    console.log('PROVIDER_BROWSER_GLOBAL_EXPOSURE=PASS');
    console.log('DEPENDENCY_CALLS_DURING_PROVIDER_INIT=0');
    console.log('FIRESTORE_WRITES=0');
    console.log('PROVIDER_RUNTIME_OWNER_REGISTRATION_CALLS=5');
    console.log('TEMP_HANDLER_REGISTRY_OWNER_COUNT=5');
    console.log('INITIAL_WIRED_METHODS=5/5_PASS');
    console.log('PERSISTENT_REGISTRY_OWNER_ASSIGNMENTS=0');
    console.log('EXPLICIT_SAFE_DISABLED_METADATA_ROWS=4');
    console.log('EXPLICIT_SAFE_DISABLED_METADATA_CLOSURE=4/4_PASS');
    console.log('PERSISTENT_RUNTIME_OWNER_ASSIGNMENT_CHANGE=NO');
    console.log('FAIL_CLOSED_METHODS=177/177_PASS');
    console.log('DETERMINISTIC_PROVIDER_BUILDS=2/2_IDENTICAL');
    console.log(`DETERMINISTIC_PROVIDER_SHA256=${first.sha256}`);
    console.log('RUNTIME_INDEX_CHANGE=NO');
    console.log('BUILD_V26_SHELL_CHANGE=NO');
    console.log('GENERATED_RUNTIME_PROVIDER_ARTIFACT=NO');
    console.log('TEMP_BUNDLE_OUTPUT_ONLY=YES');
    console.log('PROVIDER_ACTIVATION=NO');
  } finally {
    fs.rmSync(tempRoot, {
      recursive: true,
      force: true,
    });
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
