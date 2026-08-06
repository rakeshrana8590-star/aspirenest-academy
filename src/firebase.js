import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  resolveFirebaseProjectConfig,
} from "./firebaseProjectConfig";
import {
  connectAuthEmulator,
  getAuth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
} from "firebase/storage";
import {
  connectFunctionsEmulator,
  getFunctions,
} from "firebase/functions";
import {
  buildFirebaseRuntimeConfig,
  resolveFirebaseEmulatorRuntime,
} from "./firebaseEmulatorRuntime";

export const firebaseEmulatorRuntime =
  resolveFirebaseEmulatorRuntime();

export const firebaseProjectRuntime =
  resolveFirebaseProjectConfig();

const firebaseConfig = firebaseProjectRuntime.enabled
  ? buildFirebaseRuntimeConfig(
      firebaseProjectRuntime.config,
      firebaseEmulatorRuntime
    )
  : null;

let app = null;
let initializationErrorCode = "";

if (firebaseConfig) {
  try {
    app = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig);
  } catch {
    app = null;
    initializationErrorCode =
      "FIREBASE_INITIALIZATION_FAILED";
  }
}

export const firebaseInitializationRuntime =
  Object.freeze({
    enabled: Boolean(app),
    environment: firebaseProjectRuntime.environment,
    errorCode:
      firebaseProjectRuntime.error?.code ||
      initializationErrorCode,
    missingFields: Object.freeze([
      ...(firebaseProjectRuntime.error?.missingFields || []),
    ]),
  });

export const auth = app ? getAuth(app) : null;

export const db = app ? getFirestore(app) : null;

export const storage = app ? getStorage(app) : null;

export const functions = app
  ? getFunctions(app, "asia-south1")
  : null;

const runtimeGlobal =
  typeof globalThis !== "undefined" ? globalThis : {};
const registryKey =
  "__ASPIRENEST_FIREBASE_EMULATOR_CONNECTIONS__";
const connectionRegistry =
  runtimeGlobal[registryKey] instanceof Set
    ? runtimeGlobal[registryKey]
    : new Set();

runtimeGlobal[registryKey] = connectionRegistry;

const connectOnce = (serviceKey, connector) => {
  const key =
    `${app.name}:` +
    `${firebaseEmulatorRuntime.projectId}:` +
    serviceKey;

  if (connectionRegistry.has(key)) return;

  connector();
  connectionRegistry.add(key);
};

if (app && firebaseEmulatorRuntime.enabled) {
  const {
    host,
    authPort,
    firestorePort,
    storagePort,
    functionsPort,
  } = firebaseEmulatorRuntime;

  connectOnce("auth", () => {
    connectAuthEmulator(
      auth,
      `http://${host}:${authPort}`,
      { disableWarnings: true }
    );
  });

  connectOnce("firestore", () => {
    connectFirestoreEmulator(db, host, firestorePort);
  });

  connectOnce("storage", () => {
    connectStorageEmulator(storage, host, storagePort);
  });

  connectOnce("functions", () => {
    connectFunctionsEmulator(
      functions,
      host,
      functionsPort
    );
  });
}

export const analytics =
  app && !firebaseEmulatorRuntime.enabled
    ? getAnalytics(app)
    : null;

export default app;
