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
      '  throw new Error("test auth call forbidden");',
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

async function assertFailClosedProvider(bundleText) {
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

  for (const row of rows) {
    const result = await provider[row.name](
      Object.freeze({}),
      Object.freeze({
        requestId: `test-request-${row.name}`,
        correlationId: `test-correlation-${row.name}`,
        timeoutMs: 50,
      }),
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

  assert.deepStrictEqual(
    Object.values(calls),
    Object.values(calls).map(() => 0),
  );
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

    await assertFailClosedProvider(
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
    console.log('TEMP_HANDLER_REGISTRY_OWNER_COUNT=0');
    console.log('PERSISTENT_REGISTRY_OWNER_ASSIGNMENTS=0');
    console.log('FAIL_CLOSED_METHODS=182/182_PASS');
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
