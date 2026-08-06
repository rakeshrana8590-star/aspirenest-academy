const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  fileURLToPath,
  pathToFileURL,
} = require("node:url");

const root = path.join(__dirname, "..");

const baseConfig = {
  REACT_APP_FIREBASE_API_KEY: "test-api-key",
  REACT_APP_FIREBASE_AUTH_DOMAIN:
    "test.firebaseapp.com",
  REACT_APP_FIREBASE_PROJECT_ID: "test-project",
  REACT_APP_FIREBASE_STORAGE_BUCKET:
    "test-project.appspot.com",
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID:
    "1234567890",
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
  initializedConfigs: [],
});

const numericCallTotal = (calls) =>
  Object.entries(calls)
    .filter(([, value]) => Number.isInteger(value))
    .reduce((total, [, value]) => total + value, 0);

async function runScenario(
  name,
  env,
  {
    existingApp = false,
    initializeThrows = false,
  } = {}
) {
  const calls = makeCalls();
  const existingAppObject = {
    name: "[DEFAULT]",
    options: { existing: true },
  };

  const context = vm.createContext({
    console,
    process: { env: { ...env } },
    Buffer,
    Set,
    Object,
    String,
    Number,
    Boolean,
    Error,
    Array,
    Date,
    Math,
    JSON,
    RegExp,
    Promise,
    URL,
    URLSearchParams,
  });

  const cache = new Map();

  const stubDefinitions = {
    "firebase/app": {
      getApps: () => {
        calls.getApps += 1;
        return existingApp
          ? [existingAppObject]
          : [];
      },
      getApp: () => {
        calls.getApp += 1;
        return existingAppObject;
      },
      initializeApp: (config) => {
        calls.initializeApp += 1;

        if (initializeThrows) {
          throw new Error(
            "synthetic initialization failure"
          );
        }

        calls.initializedConfigs.push(config);

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
    },
    "firebase/firestore": {
      getFirestore: (app) => {
        calls.getFirestore += 1;
        return { kind: "db", app };
      },
      connectFirestoreEmulator: () => {
        calls.connectFirestoreEmulator += 1;
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
        return {
          kind: "functions",
          app,
          region,
        };
      },
      connectFunctionsEmulator: () => {
        calls.connectFunctionsEmulator += 1;
      },
    },
  };

  const createSyntheticModule = (specifier) => {
    const identifier = `stub:${specifier}`;

    if (cache.has(identifier)) {
      return cache.get(identifier);
    }

    const definition =
      stubDefinitions[specifier];
    const names = Object.keys(definition);

    const module = new vm.SyntheticModule(
      names,
      function setExports() {
        for (const name of names) {
          this.setExport(
            name,
            definition[name]
          );
        }
      },
      {
        context,
        identifier,
      }
    );

    cache.set(identifier, module);
    return module;
  };

  const resolveLocal = (
    specifier,
    parentIdentifier
  ) => {
    const parentPath =
      fileURLToPath(parentIdentifier);
    let resolved = path.resolve(
      path.dirname(parentPath),
      specifier
    );

    if (!path.extname(resolved)) {
      resolved += ".js";
    }

    return resolved;
  };

  const loadFile = async (file) => {
    const identifier =
      pathToFileURL(file).href;

    if (cache.has(identifier)) {
      return cache.get(identifier);
    }

    const source =
      fs.readFileSync(file, "utf8");

    const module = new vm.SourceTextModule(
      source,
      {
        context,
        identifier,
      }
    );

    cache.set(identifier, module);

    await module.link(
      async (specifier, referencingModule) => {
        if (stubDefinitions[specifier]) {
          return createSyntheticModule(
            specifier
          );
        }

        if (specifier.startsWith(".")) {
          return loadFile(
            resolveLocal(
              specifier,
              referencingModule.identifier
            )
          );
        }

        throw new Error(
          `Unexpected import: ${specifier}`
        );
      }
    );

    return module;
  };

  const firebaseModule = await loadFile(
    path.join(root, "src/firebase.js")
  );
  await firebaseModule.evaluate();

  const providerModule = await loadFile(
    path.join(
      root,
      "src/integration/v26/browser/",
      "productionProviderFirebaseRuntime.js"
    )
  );
  await providerModule.evaluate();

  return {
    name,
    calls,
    firebase: firebaseModule.namespace,
    provider: providerModule.namespace,
  };
}

(async () => {
  const missing = await runScenario(
    "missing-environment",
    {}
  );

  assert.equal(
    missing.firebase
      .firebaseInitializationRuntime.enabled,
    false
  );
  assert.equal(
    missing.firebase
      .firebaseInitializationRuntime.errorCode,
    "FIREBASE_ENVIRONMENT_REQUIRED"
  );
  assert.equal(missing.firebase.default, null);
  assert.equal(missing.firebase.auth, null);
  assert.equal(missing.firebase.db, null);
  assert.equal(missing.firebase.storage, null);
  assert.equal(missing.firebase.functions, null);
  assert.equal(missing.firebase.analytics, null);
  assert.equal(
    numericCallTotal(missing.calls),
    0
  );
  assert.equal(
    missing.provider
      .productionProviderFirebaseRuntime.enabled,
    false
  );
  assert.equal(
    missing.provider
      .productionProviderFirebaseRuntime.error.code,
    "FIREBASE_ENVIRONMENT_REQUIRED"
  );

  const invalid = await runScenario(
    "invalid-environment",
    {
      ...baseConfig,
      REACT_APP_ASPIRENEST_ENVIRONMENT:
        "preview",
    }
  );

  assert.equal(
    invalid.firebase
      .firebaseInitializationRuntime.errorCode,
    "FIREBASE_ENVIRONMENT_INVALID"
  );
  assert.equal(
    numericCallTotal(invalid.calls),
    0
  );

  const {
    REACT_APP_FIREBASE_API_KEY,
    ...withoutApiKey
  } = baseConfig;

  const missingField = await runScenario(
    "missing-required-field",
    {
      ...withoutApiKey,
      REACT_APP_ASPIRENEST_ENVIRONMENT:
        "staging",
    }
  );

  assert.equal(
    missingField.firebase
      .firebaseInitializationRuntime.errorCode,
    "FIREBASE_CONFIG_REQUIRED_FIELDS_MISSING"
  );
  assert.deepEqual(
    [
      ...missingField.firebase
        .firebaseInitializationRuntime
        .missingFields,
    ],
    ["apiKey"]
  );
  assert.equal(
    numericCallTotal(missingField.calls),
    0
  );

  const local = await runScenario(
    "local-emulator",
    {
      ...baseConfig,
      NODE_ENV: "test",
      REACT_APP_ASPIRENEST_ENVIRONMENT:
        "local",
      REACT_APP_USE_FIREBASE_EMULATORS:
        "true",
      REACT_APP_FIREBASE_EMULATOR_PROJECT_ID:
        "demo-aspirenest-local",
    }
  );

  assert.equal(local.calls.initializeApp, 1);
  assert.equal(local.calls.getAuth, 1);
  assert.equal(local.calls.getFirestore, 1);
  assert.equal(local.calls.getStorage, 1);
  assert.equal(local.calls.getFunctions, 1);
  assert.equal(local.calls.getAnalytics, 0);
  assert.equal(
    local.calls.connectAuthEmulator,
    1
  );
  assert.equal(
    local.calls.connectFirestoreEmulator,
    1
  );
  assert.equal(
    local.calls.connectStorageEmulator,
    1
  );
  assert.equal(
    local.calls.connectFunctionsEmulator,
    1
  );
  assert.equal(
    local.provider
      .productionProviderFirebaseRuntime.enabled,
    true
  );

  const staging = await runScenario(
    "staging",
    {
      ...baseConfig,
      NODE_ENV: "production",
      REACT_APP_ASPIRENEST_ENVIRONMENT:
        "staging",
    }
  );

  assert.equal(staging.calls.initializeApp, 1);
  assert.equal(staging.calls.getAnalytics, 1);
  assert.equal(
    staging.provider
      .productionProviderFirebaseRuntime.enabled,
    true
  );

  const production = await runScenario(
    "production",
    {
      ...baseConfig,
      NODE_ENV: "production",
      REACT_APP_ASPIRENEST_ENVIRONMENT:
        "production",
    }
  );

  assert.equal(
    production.calls.initializeApp,
    1
  );
  assert.equal(
    production.calls.getAnalytics,
    1
  );
  assert.equal(
    production.provider
      .productionProviderFirebaseRuntime.enabled,
    true
  );

  const singleton = await runScenario(
    "singleton-reuse",
    {
      ...baseConfig,
      NODE_ENV: "production",
      REACT_APP_ASPIRENEST_ENVIRONMENT:
        "production",
    },
    {
      existingApp: true,
    }
  );

  assert.equal(
    singleton.calls.initializeApp,
    0
  );
  assert.equal(singleton.calls.getApp, 1);
  assert.equal(
    singleton.provider
      .productionProviderFirebaseRuntime.enabled,
    true
  );

  const initializationFailure =
    await runScenario(
      "initialization-failure",
      {
        ...baseConfig,
        NODE_ENV: "production",
        REACT_APP_ASPIRENEST_ENVIRONMENT:
          "staging",
      },
      {
        initializeThrows: true,
      }
    );

  assert.equal(
    initializationFailure.firebase
      .firebaseInitializationRuntime.enabled,
    false
  );
  assert.equal(
    initializationFailure.firebase
      .firebaseInitializationRuntime.errorCode,
    "FIREBASE_INITIALIZATION_FAILED"
  );
  assert.equal(
    initializationFailure.calls.getAuth,
    0
  );
  assert.equal(
    initializationFailure.calls.getFirestore,
    0
  );
  assert.equal(
    initializationFailure.calls.getStorage,
    0
  );
  assert.equal(
    initializationFailure.calls.getFunctions,
    0
  );
  assert.equal(
    initializationFailure.calls.getAnalytics,
    0
  );
  assert.equal(
    initializationFailure.provider
      .productionProviderFirebaseRuntime.enabled,
    false
  );
  assert.equal(
    initializationFailure.provider
      .productionProviderFirebaseRuntime.error.code,
    "FIREBASE_INITIALIZATION_FAILED"
  );

  console.log(
    "FULL_BOOTSTRAP_SCENARIOS=8/8_PASS"
  );
  console.log(
    "MISSING_OR_INVALID_CONFIG_SDK_CALLS=0_PASS"
  );
  console.log(
    "LOCAL_EMULATOR_CONNECTIONS=4/4_PASS"
  );
  console.log(
    "STAGING_AND_PRODUCTION_INITIALIZATION=2/2_PASS"
  );
  console.log(
    "SINGLETON_REUSE=PASS"
  );
  console.log(
    "INITIALIZATION_FAILURE_FAIL_CLOSED=PASS"
  );
  console.log(
    "PROVIDER_FAIL_CLOSED_RUNTIME=PASS"
  );
  console.log(
    "REAL_FIREBASE_NETWORK_OR_WRITE=NO"
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
