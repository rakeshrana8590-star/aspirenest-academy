import {
  buildFirebaseRuntimeConfig,
  resolveFirebaseEmulatorRuntime,
} from "./firebaseEmulatorRuntime";

const resolve = (env = {}, nodeEnv = "development") =>
  resolveFirebaseEmulatorRuntime({ env, nodeEnv });

test("keeps emulator mode disabled when the flag is absent", () => {
  expect(resolve({}).enabled).toBe(false);
});

test("keeps emulator mode disabled in production", () => {
  expect(
    resolve(
      { REACT_APP_USE_FIREBASE_EMULATORS: "true" },
      "production"
    ).enabled
  ).toBe(false);
});

test("enables emulator mode with fail-closed demo defaults", () => {
  expect(
    resolve({ REACT_APP_USE_FIREBASE_EMULATORS: "true" })
  ).toEqual({
    enabled: true,
    host: "127.0.0.1",
    projectId: "demo-aspirenest-local",
    authPort: 9099,
    firestorePort: 8080,
    storagePort: 9199,
    functionsPort: 5001,
  });
});

test("normalizes the emulator flag", () => {
  expect(
    resolve({ REACT_APP_USE_FIREBASE_EMULATORS: " TRUE " }).enabled
  ).toBe(true);
});

test("accepts localhost and IPv6 loopback", () => {
  expect(
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_EMULATOR_HOST: "localhost",
    }).host
  ).toBe("localhost");

  expect(
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_EMULATOR_HOST: "::1",
    }).host
  ).toBe("::1");
});

test("rejects non-loopback emulator hosts", () => {
  expect(() =>
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_EMULATOR_HOST: "192.168.1.4",
    })
  ).toThrow("requires localhost");
});

test("requires a demo project namespace", () => {
  expect(() =>
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_EMULATOR_PROJECT_ID: "aspirenest-platform",
    })
  ).toThrow("demo- prefix");
});

test("accepts explicit emulator ports", () => {
  expect(
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_AUTH_EMULATOR_PORT: "9198",
      REACT_APP_FIRESTORE_EMULATOR_PORT: "8181",
      REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT: "9299",
      REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT: "5101",
    })
  ).toMatchObject({
    authPort: 9198,
    firestorePort: 8181,
    storagePort: 9299,
    functionsPort: 5101,
  });
});

test("uses defaults for blank ports", () => {
  expect(
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_AUTH_EMULATOR_PORT: " ",
    }).authPort
  ).toBe(9099);
});

test("rejects invalid ports", () => {
  expect(() =>
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIRESTORE_EMULATOR_PORT: "0",
    })
  ).toThrow("between 1 and 65535");

  expect(() =>
    resolve({
      REACT_APP_USE_FIREBASE_EMULATORS: "true",
      REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT: "65536",
    })
  ).toThrow("between 1 and 65535");
});

test("preserves production Firebase configuration outside emulator mode", () => {
  const production = {
    apiKey: "real-key",
    projectId: "aspirenest-platform",
  };

  expect(
    buildFirebaseRuntimeConfig(production, { enabled: false })
  ).toEqual(production);
});

test("replaces the production namespace in emulator mode", () => {
  const result = buildFirebaseRuntimeConfig(
    {
      apiKey: "real-key",
      authDomain: "aspirenest-platform.firebaseapp.com",
      projectId: "aspirenest-platform",
      storageBucket: "aspirenest-platform.firebasestorage.app",
    },
    {
      enabled: true,
      projectId: "demo-aspirenest-local",
    }
  );

  expect(result).toMatchObject({
    apiKey: "demo-api-key",
    authDomain: "demo-aspirenest-local.firebaseapp.com",
    projectId: "demo-aspirenest-local",
    storageBucket: "demo-aspirenest-local.appspot.com",
  });
});
