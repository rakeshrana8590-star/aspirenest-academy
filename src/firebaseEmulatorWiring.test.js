import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/firebase.js"),
  "utf8"
);

test("wires Firebase Auth to the local emulator", () => {
  expect(source).toContain("connectAuthEmulator");
  expect(source).toMatch(
    /connectAuthEmulator\([\s\S]*disableWarnings:\s*true/
  );
});

test("wires Firestore to the local emulator", () => {
  expect(source).toContain("connectFirestoreEmulator");
  expect(source).toMatch(
    /connectFirestoreEmulator\(db,\s*host,\s*firestorePort\)/
  );
});

test("wires Storage to a local fail-closed emulator endpoint", () => {
  expect(source).toContain("connectStorageEmulator");
  expect(source).toMatch(
    /connectStorageEmulator\(storage,\s*host,\s*storagePort\)/
  );
});

test("keeps Functions on the local emulator in browser acceptance mode", () => {
  expect(source).toContain("connectFunctionsEmulator");
  expect(source).toMatch(
    /connectFunctionsEmulator\([\s\S]*functionsPort/
  );
});

test("resolves emulator mode before Firebase initialization", () => {
  expect(
    source.indexOf("resolveFirebaseEmulatorRuntime")
  ).toBeLessThan(source.indexOf("initializeApp(firebaseConfig)"));
});

test("uses validated Firebase runtime configuration before initialization", () => {
  expect(source).toContain("buildFirebaseRuntimeConfig");
  expect(source).toMatch(
    /buildFirebaseRuntimeConfig\([\s\S]*firebaseProjectRuntime\.config/
  );
});

test("disables Analytics during local browser acceptance", () => {
  expect(source).toMatch(
    /analytics\s*=\s*[\s\S]*app\s*&&\s*!firebaseEmulatorRuntime\.enabled[\s\S]*\?\s*getAnalytics\(app\)[\s\S]*:\s*null/
  );
});

test("guards emulator connections against hot-reload duplication", () => {
  expect(source).toContain(
    "__ASPIRENEST_FIREBASE_EMULATOR_CONNECTIONS__"
  );
  expect(source).toContain("connectOnce");
});
