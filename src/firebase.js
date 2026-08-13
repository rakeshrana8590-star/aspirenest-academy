import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
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

const appCheckSiteKey = String(
  process.env
    .REACT_APP_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY ||
    ""
).trim();

const appCheckRequired =
  Boolean(app) &&
  !firebaseEmulatorRuntime.enabled &&
  ["staging", "production"].includes(
    firebaseProjectRuntime.environment
  );

let appCheck = null;
let appCheckInitializationErrorCode = "";

if (appCheckRequired) {
  if (!appCheckSiteKey) {
    appCheckInitializationErrorCode =
      "FIREBASE_APPCHECK_SITE_KEY_REQUIRED";
  } else {
    try {
      appCheck = initializeAppCheck(app, {
        provider:
          new ReCaptchaEnterpriseProvider(
            appCheckSiteKey
          ),
        isTokenAutoRefreshEnabled: true,
      });
    } catch {
      appCheck = null;
      appCheckInitializationErrorCode =
        "FIREBASE_APPCHECK_INITIALIZATION_FAILED";
    }
  }
}

const firebaseRuntimeReady =
  Boolean(app) &&
  (
    !appCheckRequired ||
    Boolean(appCheck)
  );

export const firebaseAppCheckRuntime =
  Object.freeze({
    required: appCheckRequired,
    enabled: Boolean(appCheck),
    provider:
      appCheckRequired
        ? "RECAPTCHA_ENTERPRISE"
        : "NOT_REQUIRED",
    errorCode:
      appCheckInitializationErrorCode,
  });

export const firebaseInitializationRuntime =
  Object.freeze({
    enabled: firebaseRuntimeReady,
    environment: firebaseProjectRuntime.environment,
    errorCode:
      firebaseProjectRuntime.error?.code ||
      initializationErrorCode ||
      appCheckInitializationErrorCode,
    missingFields: Object.freeze([
      ...(firebaseProjectRuntime.error?.missingFields || []),
      ...(
        appCheckRequired && !appCheckSiteKey
          ? ["appCheckRecaptchaEnterpriseKey"]
          : []
      ),
    ]),
  });

export const auth =
  firebaseRuntimeReady
    ? getAuth(app)
    : null;

export const db =
  firebaseRuntimeReady
    ? getFirestore(app)
    : null;

export const storage =
  firebaseRuntimeReady
    ? getStorage(app)
    : null;

export const functions =
  firebaseRuntimeReady
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
  firebaseRuntimeReady &&
  !firebaseEmulatorRuntime.enabled
    ? getAnalytics(app)
    : null;

export default app;
