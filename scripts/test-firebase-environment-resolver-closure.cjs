const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.join(
  __dirname,
  "..",
  "src",
  "firebaseProjectConfig.js"
);

const source = fs.readFileSync(sourcePath, "utf8");
const moduleUrl =
  "data:text/javascript;base64,"
  + Buffer.from(source).toString("base64");

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

(async () => {
  const {
    resolveFirebaseProjectConfig,
  } = await import(moduleUrl);

  const missingEnvironment =
    resolveFirebaseProjectConfig({
      env: { ...baseConfig },
    });

  assert.equal(missingEnvironment.enabled, false);
  assert.equal(
    missingEnvironment.error.code,
    "FIREBASE_ENVIRONMENT_REQUIRED"
  );
  assert.equal(missingEnvironment.config, null);

  const invalidEnvironment =
    resolveFirebaseProjectConfig({
      env: {
        ...baseConfig,
        REACT_APP_ASPIRENEST_ENVIRONMENT:
          "preview",
      },
    });

  assert.equal(invalidEnvironment.enabled, false);
  assert.equal(
    invalidEnvironment.error.code,
    "FIREBASE_ENVIRONMENT_INVALID"
  );

  for (const environment of [
    "local",
    "staging",
    "production",
  ]) {
    const result = resolveFirebaseProjectConfig({
      env: {
        ...baseConfig,
        REACT_APP_ASPIRENEST_ENVIRONMENT:
          environment,
        SERVER_PRIVATE_KEY:
          "must-never-enter-browser-config",
      },
    });

    assert.equal(result.enabled, true);
    assert.equal(result.environment, environment);
    assert.deepEqual(
      Object.keys(result.config).sort(),
      [
        "apiKey",
        "appId",
        "authDomain",
        "measurementId",
        "messagingSenderId",
        "projectId",
        "storageBucket",
      ]
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        result.config,
        "SERVER_PRIVATE_KEY"
      ),
      false
    );
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.config), true);
  }

  const {
    REACT_APP_FIREBASE_API_KEY,
    ...withoutApiKey
  } = baseConfig;

  const missingField =
    resolveFirebaseProjectConfig({
      env: {
        ...withoutApiKey,
        REACT_APP_ASPIRENEST_ENVIRONMENT:
          "production",
      },
    });

  assert.equal(missingField.enabled, false);
  assert.equal(
    missingField.error.code,
    "FIREBASE_CONFIG_REQUIRED_FIELDS_MISSING"
  );
  assert.deepEqual(
    [...missingField.error.missingFields],
    ["apiKey"]
  );

  assert.equal(
    source.includes("productionFirebaseConfig"),
    false
  );
  assert.equal(
    source.includes("aspirenest-platform"),
    false
  );

  console.log(
    "FIREBASE_ENVIRONMENT_RESOLVER_CASES=6/6_PASS"
  );
  console.log(
    "EXPLICIT_LOCAL_STAGING_PRODUCTION=3/3_PASS"
  );
  console.log(
    "MISSING_OR_INVALID_CONFIG_FAIL_CLOSED=3/3_PASS"
  );
  console.log(
    "BROWSER_SAFE_CONFIG_ALLOWLIST=PASS"
  );
  console.log(
    "STALE_PRODUCTION_CONFIG_AUTHORITY=ABSENT"
  );
  console.log(
    "SILENT_PRODUCTION_FALLBACK=ABSENT"
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
