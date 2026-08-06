#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const webpack = require('webpack');

const repoRoot = path.resolve(
  process.env.ASPIRENEST_REPO_ROOT
    || path.join(__dirname, '..'),
);

const providerEntryPath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'browser',
  'productionProviderEntry.js',
);
const bridgePath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'productionBridgeFoundation.js',
);
const registryPath = path.join(
  repoRoot,
  'src',
  'integration',
  'v26',
  'productionBridgeMethodRegistry.json',
);
const adapterPath = path.join(
  repoRoot,
  'runtime',
  'v26-shell',
  'integration',
  'aspirenest-adapter.js',
);
const providerBuildPath = path.join(
  repoRoot,
  'scripts',
  'build-v26-production-provider.cjs',
);

const initialMethods = Object.freeze([
  'authorize',
  'getSession',
  'login',
  'logout',
  'openCanonical',
]);

const workRoot = fs.mkdtempSync(
  path.join(
    os.tmpdir(),
    'aspirenest-v26-runtime-closure-',
  ),
);
const stubsRoot = path.join(workRoot, 'stubs');
const harnessEntryPath = path.join(
  workRoot,
  'productionProviderRuntimeClosureEntry.js',
);
const bundlePath = path.join(
  workRoot,
  'aspirenest-production-provider-runtime-closure.js',
);

fs.mkdirSync(stubsRoot, { recursive: true });

const write = (name, text) => {
  const target = path.join(stubsRoot, name);
  fs.writeFileSync(target, text, 'utf8');
  return target;
};

const toImport = (filePath) =>
  filePath.split(path.sep).join('/');

const firebaseRuntimeStub = write(
  'firebaseRuntime.js',
  `export const auth = Object.freeze({ currentUser: null });
export const db = Object.freeze({});
export default Object.freeze({});
`,
);

const firebaseAuthStub = write(
  'firebaseAuth.js',
  `const touch = (name) => {
  globalThis.__aspirenestS191Harness.sdkCalls[name] += 1;
};
export class GoogleAuthProvider {
  constructor() {
    touch('GoogleAuthProvider');
  }
}
export const signInWithEmailAndPassword = (...args) => {
  touch('signInWithEmailAndPassword');
  return globalThis.__aspirenestS191Harness.sdkCall(
    'signInWithEmailAndPassword',
    args,
  );
};
export const signInWithPopup = (...args) => {
  touch('signInWithPopup');
  return globalThis.__aspirenestS191Harness.sdkCall(
    'signInWithPopup',
    args,
  );
};
export const signOut = (...args) => {
  touch('signOut');
  return globalThis.__aspirenestS191Harness.sdkCall(
    'signOut',
    args,
  );
};
`,
);

const firestoreStub = write(
  'firestore.js',
  `const touch = (name) => {
  globalThis.__aspirenestS191Harness.sdkCalls[name] += 1;
};
export const collection = (...args) => {
  touch('collection');
  return Object.freeze({ args });
};
export const doc = (...args) => {
  touch('doc');
  return Object.freeze({ args });
};
export const getDoc = (...args) => {
  touch('getDoc');
  return globalThis.__aspirenestS191Harness.sdkCall(
    'getDoc',
    args,
  );
};
export const getDocs = (...args) => {
  touch('getDocs');
  return globalThis.__aspirenestS191Harness.sdkCall(
    'getDocs',
    args,
  );
};
`,
);

const identityStub = write(
  'identity.js',
  `export const placeholder = true;
`,
);

const authServiceStub = write(
  'authProductionService.js',
  `export const createAuthProductionService = () =>
  Object.freeze({
    getSession: () =>
      globalThis.__aspirenestS191Harness.invoke(
        'getSession',
        null,
        null,
      ),
    login: (payload) =>
      globalThis.__aspirenestS191Harness.invoke(
        'login',
        payload,
        null,
      ),
    logout: () =>
      globalThis.__aspirenestS191Harness.invoke(
        'logout',
        null,
        null,
      ),
  });
`,
);

const canonicalServiceStub = write(
  'canonicalResourceService.js',
  `export const createCanonicalResourceService = () =>
  Object.freeze({
    getCanonicalResource: (payload) =>
      globalThis.__aspirenestS191Harness.invoke(
        'openCanonical',
        payload,
        null,
      ),
  });
`,
);

const entitlementServiceStub = write(
  'entitlementDecisionService.js',
  `export const createEntitlementDecisionService = () =>
  Object.freeze({
    resolveEntitlementDecision: async () =>
      Object.freeze({
        ok: false,
        code: 'S191_UNUSED_ENTITLEMENT',
      }),
  });
`,
);

const authorizeServiceStub = write(
  'authorizeProductionService.js',
  `export const createAuthorizeProductionService = () =>
  Object.freeze({
    authorize: (payload, transport) =>
      globalThis.__aspirenestS191Harness.invoke(
        'authorize',
        payload,
        transport,
      ),
  });
`,
);

const roleAdapterStub = write(
  'roleExperienceDependencyAdapter.js',
  `export const createRoleExperienceDependencyAdapter = () =>
  Object.freeze({});
`,
);

const firestoreAdapterStub = write(
  'firestoreReadDependencyAdapter.js',
  `export const createFirestoreReadDependencyAdapter = () =>
  Object.freeze({
    readProfileByCollection: async () => null,
    readResourceById: async () => null,
    listEntitlementEvidence: async () => [],
  });
`,
);

const firebaseAuthAdapterStub = write(
  'firebaseAuthDependencyAdapter.js',
  `export const createFirebaseAuthDependencyAdapter = () =>
  Object.freeze({
    createAuthoritativeSessionReader: () =>
      async () => Object.freeze({
        ready: true,
        authenticated: false,
        accessAllowed: false,
        emailVerified: false,
        uid: '',
        role: '',
        allowed: Object.freeze(['public']),
        planType: 'FREE',
      }),
  });
`,
);

let entryText = fs.readFileSync(
  providerEntryPath,
  'utf8',
);

const replacements = Object.freeze([
  [
    '@aspirenest/firebase-runtime',
    toImport(firebaseRuntimeStub),
  ],
  [
    'firebase/auth',
    toImport(firebaseAuthStub),
  ],
  [
    'firebase/firestore',
    toImport(firestoreStub),
  ],
  [
    '../../../auth/aspireNestIdentity.js',
    toImport(identityStub),
  ],
  [
    '../productionBridgeFoundation.js',
    toImport(bridgePath),
  ],
  [
    '../authProductionService.js',
    toImport(authServiceStub),
  ],
  [
    '../canonicalResourceService.js',
    toImport(canonicalServiceStub),
  ],
  [
    '../entitlementDecisionService.js',
    toImport(entitlementServiceStub),
  ],
  [
    '../authorizeProductionService.js',
    toImport(authorizeServiceStub),
  ],
  [
    './roleExperienceDependencyAdapter.js',
    toImport(roleAdapterStub),
  ],
  [
    './firestoreReadDependencyAdapter.js',
    toImport(firestoreAdapterStub),
  ],
  [
    './firebaseAuthDependencyAdapter.js',
    toImport(firebaseAuthAdapterStub),
  ],
  [
    '../productionBridgeMethodRegistry.json',
    toImport(registryPath),
  ],
]);

for (const [before, after] of replacements) {
  const token = `"${before}"`;

  assert.strictEqual(
    entryText.split(token).length - 1,
    1,
    `Provider entry import count mismatch: ${before}`,
  );

  entryText = entryText.replace(
    token,
    JSON.stringify(after),
  );
}

fs.writeFileSync(
  harnessEntryPath,
  entryText,
  'utf8',
);

const {
  createProviderWebpackConfig,
} = require(providerBuildPath);

const baseConfig = createProviderWebpackConfig({
  outputFile: bundlePath,
});

const config = {
  ...baseConfig,
  entry: harnessEntryPath,
};

const build = () =>
  new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      const details = stats.toJson({
        all: false,
        assets: true,
        errors: true,
        warnings: true,
      });

      if (stats.hasErrors()) {
        reject(
          new Error(
            details.errors
              .map((item) => item.message || String(item))
              .join('\n'),
          ),
        );
        return;
      }

      if (details.warnings.length) {
        reject(
          new Error(
            details.warnings
              .map((item) => item.message || String(item))
              .join('\n'),
          ),
        );
        return;
      }

      resolve(details);
    });
  });

const createHarness = () => {
  const behavior = new Map();
  const calls = [];
  const sdkCalls = Object.fromEntries(
    [
      'GoogleAuthProvider',
      'signInWithEmailAndPassword',
      'signInWithPopup',
      'signOut',
      'collection',
      'doc',
      'getDoc',
      'getDocs',
    ].map((name) => [name, 0]),
  );

  return {
    behavior,
    calls,
    sdkCalls,
    sdkCall(name) {
      throw new Error(
        `Unexpected SDK call during runtime closure: ${name}`,
      );
    },
    invoke(method, payload, context) {
      const mode = behavior.get(method) || 'success';

      calls.push(
        Object.freeze({
          method,
          mode,
          payload,
          context,
        }),
      );

      if (mode === 'timeout') {
        return new Promise(() => {});
      }

      if (mode === 'deny') {
        return Object.freeze({
          ok: false,
          code: 'S191_METHOD_DENIED',
          message: 'Denied by deterministic runtime closure.',
          retryable: false,
          details: Object.freeze({
            method,
          }),
        });
      }

      if (mode === 'error') {
        throw new Error(
          `S191 deterministic handler error: ${method}`,
        );
      }

      return Object.freeze({
        scenario: mode,
        method,
        payload: payload === undefined ? null : payload,
      });
    },
  };
};

const createRuntimeContext = (harness) => {
  const events = [];
  const windowObject = {
    location: {
      hash: '',
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };

  windowObject.window = windowObject;

  class RuntimeCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  const context = vm.createContext({
    window: windowObject,
    CustomEvent: RuntimeCustomEvent,
    console,
    Promise,
    Object,
    Array,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Date,
    Math,
    JSON,
    Error,
    TypeError,
    Number,
    String,
    Boolean,
    RegExp,
    Symbol,
    setTimeout,
    clearTimeout,
    AbortController,
    crypto: Object.freeze({
      randomUUID: () => crypto.randomUUID(),
    }),
    __aspirenestS191Harness: harness,
  });

  return {
    context,
    windowObject,
    events,
  };
};

const assertEnvelopeIdentity = (
  result,
  method,
  requestId,
  correlationId,
) => {
  assert.strictEqual(result.method, method);
  assert.strictEqual(result.requestId, requestId);
  assert.strictEqual(
    result.correlationId,
    correlationId,
  );
};

const invoke = async (
  adapter,
  method,
  suffix,
  options = {},
) => {
  const requestId =
    `s191-${method}-${suffix}-request`;
  const correlationId =
    `s191-${method}-${suffix}-correlation`;

  const result = await adapter[method](
    Object.freeze({
      method,
      suffix,
    }),
    Object.freeze({
      requestId,
      correlationId,
      ...options,
    }),
  );

  assertEnvelopeIdentity(
    result,
    method,
    requestId,
    correlationId,
  );

  return result;
};

(async () => {
  try {
    const details = await build();

    assert.deepStrictEqual(
      details.assets.map((item) => item.name),
      [
        'aspirenest-production-provider-runtime-closure.js',
      ],
    );

    const bundleText = fs.readFileSync(
      bundlePath,
      'utf8',
    );
    const adapterText = fs.readFileSync(
      adapterPath,
      'utf8',
    );

    const harness = createHarness();
    const runtime = createRuntimeContext(harness);

    vm.runInContext(
      bundleText,
      runtime.context,
      {
        filename: bundlePath,
      },
    );

    const provider =
      runtime.windowObject
        .__aspirenestExactResourceAdapter;

    assert.ok(provider);
    assert.strictEqual(
      Object.keys(provider).length,
      182,
    );

    vm.runInContext(
      adapterText,
      runtime.context,
      {
        filename: adapterPath,
      },
    );

    const adapter =
      runtime.windowObject.AspireNestExactAdapter;

    assert.ok(adapter);
    assert.strictEqual(adapter.mode, 'production');
    assert.deepStrictEqual(
      Array.from(adapter.missingProductionMethods),
      [],
    );

    const readyEvent = runtime.events.find(
      (item) =>
        item.type
        === 'aspirenest:exact-adapter-ready',
    );

    assert.ok(readyEvent);
    assert.strictEqual(
      readyEvent.detail.mode,
      'production',
    );

    let successPass = 0;
    let denyPass = 0;
    let timeoutPass = 0;
    let abortPass = 0;
    let retryPass = 0;
    let envelopePass = 0;

    for (const method of initialMethods) {
      harness.behavior.set(method, 'success');

      const success = await invoke(
        adapter,
        method,
        'success',
      );

      assert.strictEqual(success.ok, true);
      assert.strictEqual(success.code, 'OK');
      assert.strictEqual(success.retryable, false);
      assert.strictEqual(
        success.data.method,
        method,
      );
      successPass += 1;
      envelopePass += 1;

      harness.behavior.set(method, 'deny');

      const deny = await invoke(
        adapter,
        method,
        'deny',
      );

      assert.strictEqual(deny.ok, false);
      assert.strictEqual(
        deny.code,
        'S191_METHOD_DENIED',
      );
      assert.strictEqual(deny.retryable, false);
      denyPass += 1;
      envelopePass += 1;

      harness.behavior.set(method, 'timeout');

      const timeout = await invoke(
        adapter,
        method,
        'timeout',
        {
          timeoutMs: 15,
        },
      );

      assert.strictEqual(timeout.ok, false);
      assert.strictEqual(
        timeout.code,
        'PRODUCTION_REQUEST_TIMEOUT',
      );
      assert.strictEqual(timeout.retryable, true);
      timeoutPass += 1;
      envelopePass += 1;

      const abortController =
        new AbortController();

      const abortPromise = invoke(
        adapter,
        method,
        'abort',
        {
          timeoutMs: 1000,
          signal: abortController.signal,
        },
      );

      setTimeout(
        () => abortController.abort(),
        5,
      );

      const aborted = await abortPromise;

      assert.strictEqual(aborted.ok, false);
      assert.strictEqual(
        aborted.code,
        'PRODUCTION_REQUEST_ABORTED',
      );
      assert.strictEqual(aborted.retryable, false);
      abortPass += 1;
      envelopePass += 1;

      harness.behavior.set(method, 'success');

      const retry = await invoke(
        adapter,
        method,
        'retry-after-timeout',
      );

      assert.strictEqual(retry.ok, true);
      assert.strictEqual(retry.code, 'OK');
      assert.strictEqual(retry.retryable, false);
      assert.strictEqual(
        retry.data.method,
        method,
      );
      retryPass += 1;
      envelopePass += 1;
    }

    const safeDisabledMethods =
      Object.keys(provider)
        .filter(
          (name) => !initialMethods.includes(name),
        )
        .sort();

    assert.strictEqual(
      safeDisabledMethods.length,
      177,
    );

    let failClosedPass = 0;

    for (const method of safeDisabledMethods) {
      const requestId =
        `s191-${method}-disabled-request`;
      const correlationId =
        `s191-${method}-disabled-correlation`;

      const result = await adapter[method](
        Object.freeze({
          method,
        }),
        Object.freeze({
          requestId,
          correlationId,
          timeoutMs: 20,
        }),
      );

      assert.strictEqual(result.ok, false);
      assert.strictEqual(
        result.code,
        'PRODUCTION_HANDLER_DISABLED',
      );
      assert.strictEqual(result.retryable, false);
      assertEnvelopeIdentity(
        result,
        method,
        requestId,
        correlationId,
      );
      assert.strictEqual(
        result.details.ownerState,
        'SAFE_DISABLED_PENDING_OWNER',
      );

      failClosedPass += 1;
    }

    assert.deepStrictEqual(
      harness.sdkCalls,
      Object.fromEntries(
        Object.keys(harness.sdkCalls)
          .map((name) => [name, 0]),
      ),
    );

    const reverseHarness = createHarness();
    const reverseRuntime =
      createRuntimeContext(reverseHarness);

    vm.runInContext(
      adapterText,
      reverseRuntime.context,
      {
        filename: adapterPath,
      },
    );

    assert.strictEqual(
      reverseRuntime.windowObject
        .AspireNestExactAdapter.mode,
      'production-unavailable',
    );

    vm.runInContext(
      bundleText,
      reverseRuntime.context,
      {
        filename: bundlePath,
      },
    );

    assert.strictEqual(
      reverseRuntime.windowObject
        .AspireNestExactAdapter.mode,
      'production-unavailable',
    );

    const reverseResult =
      await reverseRuntime.windowObject
        .AspireNestExactAdapter
        .login({
          mode: 'email',
        });

    assert.strictEqual(
      reverseResult.code,
      'PRODUCTION_ADAPTER_UNAVAILABLE',
    );

    const candidateSha = crypto
      .createHash('sha256')
      .update(
        fs.readFileSync(__filename),
      )
      .digest('hex');

    console.log(
      'RUNTIME_CLOSURE_TEST_SOURCE_SHA256='
        + candidateSha,
    );
    console.log(
      'RUNTIME_CLOSURE_INSTRUMENTED_PROVIDER_BUILD=PASS',
    );
    console.log(
      'PROVIDER_GLOBAL_ASSIGNMENT=PASS',
    );
    console.log(
      'PROVIDER_METHOD_SURFACE=182/182_PASS',
    );
    console.log(
      'RUNTIME_ADAPTER_MODE=production',
    );
    console.log(
      'RUNTIME_ADAPTER_MISSING_REQUIRED_METHODS=0',
    );
    console.log(
      'RUNTIME_ADAPTER_READY_EVENT=PASS',
    );
    console.log(
      `METHOD_SUCCESS_CLOSURE=${successPass}/5_PASS`,
    );
    console.log(
      `METHOD_DENY_CLOSURE=${denyPass}/5_PASS`,
    );
    console.log(
      `METHOD_TIMEOUT_CLOSURE=${timeoutPass}/5_PASS`,
    );
    console.log(
      `METHOD_ABORT_CLOSURE=${abortPass}/5_PASS`,
    );
    console.log(
      `METHOD_RETRY_AFTER_TIMEOUT_CLOSURE=${retryPass}/5_PASS`,
    );
    console.log(
      `METHOD_ENVELOPE_AND_CORRELATION_CLOSURE=${envelopePass}/25_PASS`,
    );
    console.log(
      `SAFE_DISABLED_RUNTIME_FAIL_CLOSED=${failClosedPass}/177_PASS`,
    );
    console.log(
      'REVERSE_SCRIPT_ORDER_FAILS_CLOSED=PASS',
    );
    console.log(
      'DEPENDENCY_SDK_CALLS_DURING_PROVIDER_INIT_AND_METHOD_CLOSURE=0',
    );
    console.log(
      'REAL_FIREBASE_NETWORK_CALLS=0',
    );
    console.log(
      'FIREBASE_WRITES=0',
    );
    console.log(
      'RUNTIME_METHOD_LEVEL_CLOSURE=GREEN',
    );
    console.log(
      'PROVIDER_ACTIVATION_TEST_MODE=DETERMINISTIC_INSTRUMENTED_RUNTIME_ONLY',
    );
    console.log(
      'PROVIDER_ACTIVATION_IN_PRODUCTION_SOURCE=NO',
    );
  } finally {
    fs.rmSync(
      workRoot,
      {
        recursive: true,
        force: true,
      },
    );
  }
})().catch((error) => {
  console.error(
    error && error.stack
      ? error.stack
      : String(error),
  );
  process.exit(1);
});
