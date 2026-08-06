import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { productionFirebaseConfig } from "./firebaseProjectConfig";
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

const firebaseConfig = buildFirebaseRuntimeConfig(
  productionFirebaseConfig,
  firebaseEmulatorRuntime
);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export const functions = getFunctions(app, "asia-south1");

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
  const key = `${app.name}:${firebaseEmulatorRuntime.projectId}:${serviceKey}`;

  if (connectionRegistry.has(key)) return;

  connector();
  connectionRegistry.add(key);
};

if (firebaseEmulatorRuntime.enabled) {
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

export const analytics = firebaseEmulatorRuntime.enabled
  ? null
  : getAnalytics(app);

export default app;
