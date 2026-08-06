const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  fileURLToPath,
  pathToFileURL,
} = require("node:url");

const root = path.join(__dirname, "..");
const registry = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "src/integration/v26/productionBridgeMethodRegistry.json"
    ),
    "utf8"
  )
);
const rows = Array.isArray(registry)
  ? registry
  : registry.methods || registry.rows || registry.entries || [];
const methodNames = rows.map((row) => String(row.name || "").trim());
const initialMethods = [
  "authorize",
  "getSession",
  "login",
  "logout",
  "openCanonical",
];
const bridgeApi = require(
  path.join(
    root,
    "src/integration/v26/productionBridgeFoundation.js"
  )
);

const baseConfig = {
  REACT_APP_FIREBASE_API_KEY: "test-api-key",
  REACT_APP_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  REACT_APP_FIREBASE_PROJECT_ID: "test-project",
  REACT_APP_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
  REACT_APP_FIREBASE_APP_ID: "1:test:web:test",
  REACT_APP_FIREBASE_MEASUREMENT_ID: "G-TEST",
};

const makeCalls = () => ({
  initializeApp: 0,
  getApps: 0,
  getApp: 0,
  getAuth: 0,
  getFirestore: 0,
  getStorage: 0,
  getFunctions: 0,
  getAnalytics: 0,
  connectAuthEmulator: 0,
  connectFirestoreEmulator: 0,
  connectStorageEmulator: 0,
  connectFunctionsEmulator: 0,
});

const makeFactories = () => ({
  firestoreAdapter: 0,
  roleAdapter: 0,
  authAdapter: 0,
  authService: 0,
  canonicalService: 0,
  entitlementService: 0,
  authorizeService: 0,
});

const numericCallTotal = (calls) =>
  Object.values(calls)
    .filter((value) => Number.isInteger(value))
    .reduce((sum, value) => sum + value, 0);

async function runScenario(
  name,
  env,
  {
    existingApp = false,
    initializeThrows = false,
  } = {}
) {
  const calls = makeCalls();
  const factories = makeFactories();
  const existingAppObject = {
    name: "[DEFAULT]",
    options: { existing: true },
  };
  const windowObject = {};
  windowObject.window = windowObject;

  const context = vm.createContext({
    console,
    process: { env: { ...env } },
    window: windowObject,
    globalThis: windowObject,
    Buffer,
    Set,
    Map,
    WeakMap,
    WeakSet,
    Object,
    String,
    Number,
    Boolean,
    Error,
    TypeError,
    Array,
    Date,
    Math,
    JSON,
    RegExp,
    Promise,
    URL,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
  });

  const cache = new Map();

  const firebaseDefinitions = {
    "firebase/app": {
      getApps: () => {
        calls.getApps += 1;
        return existingApp ? [existingAppObject] : [];
      },
      getApp: () => {
        calls.getApp += 1;
        return existingAppObject;
      },
      initializeApp: (config) => {
        calls.initializeApp += 1;
        if (initializeThrows) {
          throw new Error("synthetic initialization failure");
        }
        return {
          name: "[DEFAULT]",
          options: config,
        };
      },
    },
    "firebase/analytics": {
      getAnalytics: (app) => {
        calls.getAnalytics += 1;
        return { kind: "analytics", app };
      },
    },
    "firebase/auth": {
      getAuth: (app) => {
        calls.getAuth += 1;
        return { kind: "auth", app };
      },
      connectAuthEmulator: () => {
        calls.connectAuthEmulator += 1;
      },
      GoogleAuthProvider: function GoogleAuthProvider() {},
      signInWithEmailAndPassword: async () => {
        throw new Error("unexpected auth SDK call");
      },
      signInWithPopup: async () => {
        throw new Error("unexpected auth SDK call");
      },
      signOut: async () => {
        throw new Error("unexpected auth SDK call");
      },
    },
    "firebase/firestore": {
      getFirestore: (app) => {
        calls.getFirestore += 1;
        return { kind: "db", app };
      },
      connectFirestoreEmulator: () => {
        calls.connectFirestoreEmulator += 1;
      },
      collection: (...args) => ({ kind: "collection", args }),
      doc: (...args) => ({ kind: "doc", args }),
      getDoc: async () => {
        throw new Error("unexpected Firestore read");
      },
      getDocs: async () => {
        throw new Error("unexpected Firestore read");
      },
    },
    "firebase/storage": {
      getStorage: (app) => {
        calls.getStorage += 1;
        return { kind: "storage", app };
      },
      connectStorageEmulator: () => {
        calls.connectStorageEmulator += 1;
      },
    },
    "firebase/functions": {
      getFunctions: (app, region) => {
        calls.getFunctions += 1;
        return { kind: "functions", app, region };
      },
      connectFunctionsEmulator: () => {
        calls.connectFunctionsEmulator += 1;
      },
    },
  };

  const providerDefinitions = {
    "authProductionService.js": {
      createAuthProductionService: () => {
        factories.authService += 1;
        return Object.freeze({
          getSession: async () =>
            Object.freeze({ scenario: name, method: "getSession" }),
          login: async (payload) =>
            Object.freeze({ scenario: name, method: "login", payload }),
          logout: async () =>
            Object.freeze({ scenario: name, method: "logout" }),
        });
      },
    },
    "canonicalResourceService.js": {
      createCanonicalResourceService: () => {
        factories.canonicalService += 1;
        return Object.freeze({
          getCanonicalResource: async (payload) =>
            Object.freeze({
              scenario: name,
              method: "openCanonical",
              payload,
            }),
        });
      },
    },
    "entitlementDecisionService.js": {
      createEntitlementDecisionService: () => {
        factories.entitlementService += 1;
        return Object.freeze({
          resolveEntitlementDecision: async () =>
            Object.freeze({ allowed: true }),
        });
      },
    },
    "authorizeProductionService.js": {
      createAuthorizeProductionService: () => {
        factories.authorizeService += 1;
        return Object.freeze({
          authorize: async (payload) =>
            Object.freeze({
              scenario: name,
              method: "authorize",
              payload,
            }),
        });
      },
    },
    "roleExperienceDependencyAdapter.js": {
      createRoleExperienceDependencyAdapter: () => {
        factories.roleAdapter += 1;
        return Object.freeze({
          loadAccountProfile: async () => null,
          resolveRole: () => "student",
          resolveAllowedExperiences: () => Object.freeze(["student"]),
        });
      },
    },
    "firestoreReadDependencyAdapter.js": {
      createFirestoreReadDependencyAdapter: ({ db }) => {
        assert.ok(db);
        factories.firestoreAdapter += 1;
        return Object.freeze({
          readProfileByCollection: async () => null,
          readResourceById: async () => null,
          listEntitlementEvidence: async () => [],
        });
      },
    },
    "firebaseAuthDependencyAdapter.js": {
      createFirebaseAuthDependencyAdapter: ({ auth }) => {
        assert.ok(auth);
        factories.authAdapter += 1;
        return Object.freeze({
          createAuthoritativeSessionReader: () =>
            async () => Object.freeze({
              ready: true,
              authenticated: false,
              accessAllowed: false,
              emailVerified: false,
              uid: "",
              role: "",
              allowed: Object.freeze(["public"]),
              planType: "FREE",
            }),
        });
      },
    },
  };

  const synthetic = (identifier, definition) => {
    if (cache.has(identifier)) {
      return cache.get(identifier);
    }
    const names = Object.keys(definition);
    const module = new vm.SyntheticModule(
      names,
      function setExports() {
        for (const exportName of names) {
          this.setExport(exportName, definition[exportName]);
        }
      },
      { context, identifier }
    );
    cache.set(identifier, module);
    return module;
  };

  const defaultSynthetic = (identifier, value) =>
    synthetic(identifier, { default: value });

  const resolveLocal = (specifier, parentIdentifier) => {
    const parentPath = fileURLToPath(parentIdentifier);
    let resolved = path.resolve(path.dirname(parentPath), specifier);
    if (!path.extname(resolved)) {
      resolved += ".js";
    }
    return resolved;
  };

  const loadFile = async (file) => {
    const identifier = pathToFileURL(file).href;
    if (cache.has(identifier)) {
      return cache.get(identifier);
    }
    if (file.endsWith(".json")) {
      return defaultSynthetic(
        identifier,
        JSON.parse(fs.readFileSync(file, "utf8"))
      );
    }

    const basename = path.basename(file);
    if (basename === "productionBridgeFoundation.js") {
      return defaultSynthetic(identifier, bridgeApi);
    }
    if (basename === "aspireNestIdentity.js") {
      return defaultSynthetic(identifier, Object.freeze({}));
    }
    if (providerDefinitions[basename]) {
      return defaultSynthetic(identifier, providerDefinitions[basename]);
    }

    const source = fs.readFileSync(file, "utf8");
    const module = new vm.SourceTextModule(source, {
      context,
      identifier,
    });
    cache.set(identifier, module);

    await module.link(async (specifier, referencingModule) => {
      if (firebaseDefinitions[specifier]) {
        return synthetic(
          `stub:${specifier}`,
          firebaseDefinitions[specifier]
        );
      }
      if (specifier === "@aspirenest/firebase-runtime") {
        return loadFile(
          path.join(
            root,
            "src/integration/v26/browser/productionProviderFirebaseRuntime.js"
          )
        );
      }
      if (specifier.startsWith(".")) {
        return loadFile(
          resolveLocal(specifier, referencingModule.identifier)
        );
      }
      throw new Error(`Unexpected import: ${specifier}`);
    });

    return module;
  };

  const entryModule = await loadFile(
    path.join(
      root,
      "src/integration/v26/browser/productionProviderEntry.js"
    )
  );
  await entryModule.evaluate();

  return {
    name,
    calls,
    factories,
    provider: windowObject.__aspirenestExactResourceAdapter,
  };
}

async function assertDisabledScenario(
  scenario,
  expectedRuntimeCode,
  expectedInitializeCalls
) {
  assert.ok(scenario.provider);
  assert.equal(Object.keys(scenario.provider).length, 182);
  assert.equal(Object.isFrozen(scenario.provider), true);

  for (const value of Object.values(scenario.factories)) {
    assert.equal(value, 0);
  }

  assert.equal(
    scenario.calls.initializeApp,
    expectedInitializeCalls
  );
  assert.equal(scenario.calls.getAuth, 0);
  assert.equal(scenario.calls.getFirestore, 0);
  assert.equal(scenario.calls.getStorage, 0);
  assert.equal(scenario.calls.getFunctions, 0);
  assert.equal(scenario.calls.getAnalytics, 0);

  let disabled = 0;
  for (const method of methodNames) {
    const result = await scenario.provider[method](
      Object.freeze({ method }),
      Object.freeze({
        requestId: `${scenario.name}-${method}-request`,
        correlationId: `${scenario.name}-${method}-correlation`,
      })
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "PRODUCTION_HANDLER_DISABLED");
    assert.equal(
      result.details.ownerState,
      "SAFE_DISABLED_FIREBASE_RUNTIME"
    );
    assert.equal(
      result.details.runtimeCode,
      expectedRuntimeCode
    );
    disabled += 1;
  }
  assert.equal(disabled, 182);
}

async function assertEnabledScenario(
  scenario,
  {
    initializeCalls,
    getAppCalls,
    analyticsCalls,
    emulatorConnections,
  }
) {
  assert.ok(scenario.provider);
  assert.equal(Object.keys(scenario.provider).length, 182);
  assert.equal(Object.isFrozen(scenario.provider), true);

  for (const value of Object.values(scenario.factories)) {
    assert.equal(value, 1);
  }

  assert.equal(scenario.calls.initializeApp, initializeCalls);
  assert.equal(scenario.calls.getApp, getAppCalls);
  assert.equal(scenario.calls.getAuth, 1);
  assert.equal(scenario.calls.getFirestore, 1);
  assert.equal(scenario.calls.getStorage, 1);
  assert.equal(scenario.calls.getFunctions, 1);
  assert.equal(scenario.calls.getAnalytics, analyticsCalls);
  assert.equal(
    scenario.calls.connectAuthEmulator
      + scenario.calls.connectFirestoreEmulator
      + scenario.calls.connectStorageEmulator
      + scenario.calls.connectFunctionsEmulator,
    emulatorConnections
  );

  let success = 0;
  let disabled = 0;

  for (const method of methodNames) {
    const result = await scenario.provider[method](
      Object.freeze({ method }),
      Object.freeze({
        requestId: `${scenario.name}-${method}-request`,
        correlationId: `${scenario.name}-${method}-correlation`,
      })
    );

    if (initialMethods.includes(method)) {
      assert.equal(result.ok, true);
      assert.equal(result.code, "OK");
      success += 1;
    } else {
      assert.equal(result.ok, false);
      assert.equal(result.code, "PRODUCTION_HANDLER_DISABLED");
      assert.equal(
        result.details.ownerState,
        "SAFE_DISABLED_PENDING_OWNER"
      );
      disabled += 1;
    }
  }

  assert.equal(success, 5);
  assert.equal(disabled, 177);
}

(async () => {
  assert.equal(methodNames.length, 182);
  assert.equal(new Set(methodNames).size, 182);

  const missing = await runScenario("missing", {});
  await assertDisabledScenario(
    missing,
    "FIREBASE_ENVIRONMENT_REQUIRED",
    0
  );
  assert.equal(numericCallTotal(missing.calls), 0);

  const invalid = await runScenario("invalid", {
    ...baseConfig,
    REACT_APP_ASPIRENEST_ENVIRONMENT: "preview",
  });
  await assertDisabledScenario(
    invalid,
    "FIREBASE_ENVIRONMENT_INVALID",
    0
  );
  assert.equal(numericCallTotal(invalid.calls), 0);

  const {
    REACT_APP_FIREBASE_API_KEY,
    ...withoutApiKey
  } = baseConfig;
  const missingField = await runScenario("missing-field", {
    ...withoutApiKey,
    REACT_APP_ASPIRENEST_ENVIRONMENT: "staging",
  });
  await assertDisabledScenario(
    missingField,
    "FIREBASE_CONFIG_REQUIRED_FIELDS_MISSING",
    0
  );
  assert.equal(numericCallTotal(missingField.calls), 0);

  const initFailure = await runScenario(
    "init-failure",
    {
      ...baseConfig,
      NODE_ENV: "production",
      REACT_APP_ASPIRENEST_ENVIRONMENT: "staging",
    },
    { initializeThrows: true }
  );
  await assertDisabledScenario(
    initFailure,
    "FIREBASE_INITIALIZATION_FAILED",
    1
  );

  const local = await runScenario("local", {
    ...baseConfig,
    NODE_ENV: "test",
    REACT_APP_ASPIRENEST_ENVIRONMENT: "local",
    REACT_APP_USE_FIREBASE_EMULATORS: "true",
    REACT_APP_FIREBASE_EMULATOR_PROJECT_ID:
      "demo-aspirenest-local",
  });
  await assertEnabledScenario(local, {
    initializeCalls: 1,
    getAppCalls: 0,
    analyticsCalls: 0,
    emulatorConnections: 4,
  });

  const staging = await runScenario("staging", {
    ...baseConfig,
    NODE_ENV: "production",
    REACT_APP_ASPIRENEST_ENVIRONMENT: "staging",
  });
  await assertEnabledScenario(staging, {
    initializeCalls: 1,
    getAppCalls: 0,
    analyticsCalls: 1,
    emulatorConnections: 0,
  });

  const production = await runScenario("production", {
    ...baseConfig,
    NODE_ENV: "production",
    REACT_APP_ASPIRENEST_ENVIRONMENT: "production",
  });
  await assertEnabledScenario(production, {
    initializeCalls: 1,
    getAppCalls: 0,
    analyticsCalls: 1,
    emulatorConnections: 0,
  });

  const singleton = await runScenario(
    "singleton",
    {
      ...baseConfig,
      NODE_ENV: "production",
      REACT_APP_ASPIRENEST_ENVIRONMENT: "production",
    },
    { existingApp: true }
  );
  await assertEnabledScenario(singleton, {
    initializeCalls: 0,
    getAppCalls: 1,
    analyticsCalls: 1,
    emulatorConnections: 0,
  });

  console.log(
    "FULL_PRODUCTION_PROVIDER_ENTRY_SCENARIOS=8/8_PASS"
  );
  console.log(
    "DISABLED_PROVIDER_METHOD_SURFACE=182/182_PASS"
  );
  console.log(
    "DISABLED_PROVIDER_RUNTIME_REASON_PROPAGATION=4/4_PASS"
  );
  console.log(
    "DISABLED_PROVIDER_ADAPTER_FACTORY_CALLS=0_PASS"
  );
  console.log(
    "VALID_PROVIDER_INITIAL_HANDLER_SUCCESS=5/5_PASS"
  );
  console.log(
    "VALID_PROVIDER_SAFE_DISABLED_METHODS=177/177_PASS"
  );
  console.log(
    "LOCAL_STAGING_PRODUCTION_PROVIDER_BOOTSTRAP=3/3_PASS"
  );
  console.log(
    "PROVIDER_SINGLETON_REUSE=PASS"
  );
  console.log(
    "REAL_FIREBASE_NETWORK_OR_WRITE=NO"
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
