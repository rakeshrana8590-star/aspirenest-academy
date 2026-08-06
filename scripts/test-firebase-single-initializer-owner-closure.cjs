const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

const read = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");

const projectConfig = read(
  "src/firebaseProjectConfig.js"
);
const firebase = read("src/firebase.js");
const provider = read(
  "src/integration/v26/browser/"
  + "productionProviderFirebaseRuntime.js"
);
const wiringTest = read(
  "src/firebaseEmulatorWiring.test.js"
);

const initializeCallCount = [
  firebase,
  provider,
].reduce(
  (count, source) =>
    count
    + (
      source.match(/\binitializeApp\s*\(/g)
      || []
    ).length,
  0
);

assert.equal(initializeCallCount, 1);
assert.match(
  firebase,
  /getApps\(\)\.length[\s\S]*getApp\(\)[\s\S]*initializeApp\(firebaseConfig\)/
);
assert.ok(
  firebase.indexOf(
    "resolveFirebaseProjectConfig()"
  )
  < firebase.indexOf(
    "initializeApp(firebaseConfig)"
  )
);
assert.doesNotMatch(
  provider,
  /from\s+["']firebase\/app["']/
);
assert.doesNotMatch(
  provider,
  /\binitializeApp\s*\(/
);
assert.match(
  provider,
  /productionProviderFirebaseRuntime/
);
assert.match(
  provider,
  /FIREBASE_PROVIDER_RUNTIME_DISABLED/
);
assert.match(
  wiringTest,
  /firebaseProjectRuntime\\\.config/
);
assert.match(
  wiringTest,
  /app\\s\*&&\\s\*!firebaseEmulatorRuntime\\\.enabled/
);
assert.doesNotMatch(
  [
    projectConfig,
    firebase,
    provider,
    wiringTest,
  ].join("\n"),
  /productionFirebaseConfig/
);
assert.match(
  projectConfig,
  /FIREBASE_ENVIRONMENT_REQUIRED/
);
assert.match(
  projectConfig,
  /FIREBASE_CONFIG_REQUIRED_FIELDS_MISSING/
);

console.log(
  "BROWSER_INITIALIZE_APP_OWNER_COUNT=1/1_PASS"
);
console.log(
  "PROVIDER_SINGLETON_REUSE_CONTRACT=PASS"
);
console.log(
  "PROVIDER_EXPLICIT_FAIL_CLOSED_STATE=PASS"
);
console.log(
  "VALIDATION_BEFORE_INITIALIZATION=PASS"
);
console.log(
  "EXISTING_WIRING_TEST_AMENDMENT=PASS"
);
console.log(
  "STALE_PRODUCTION_CONFIG_AUTHORITY=ABSENT"
);
console.log(
  "REAL_FIREBASE_NETWORK_OR_WRITE=NO_BY_DESIGN"
);
