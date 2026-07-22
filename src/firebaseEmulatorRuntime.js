const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

const normalizeText = (value = "") => String(value ?? "").trim();

const readPort = (value, fallback, label) => {
  const normalized = normalizeText(value);

  if (!normalized) return fallback;

  const port = Number(normalized);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${label} must be an integer between 1 and 65535.`);
  }

  return port;
};

export const resolveFirebaseEmulatorRuntime = ({
  nodeEnv = process.env.NODE_ENV,
  env = process.env,
} = {}) => {
  const requested =
    normalizeText(env.REACT_APP_USE_FIREBASE_EMULATORS).toLowerCase() ===
    "true";
  const enabled = nodeEnv !== "production" && requested;

  if (!enabled) {
    return Object.freeze({
      enabled: false,
      host: "",
      projectId: "",
      authPort: null,
      firestorePort: null,
      storagePort: null,
      functionsPort: null,
    });
  }

  const host =
    normalizeText(env.REACT_APP_FIREBASE_EMULATOR_HOST) || "127.0.0.1";

  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(
      "Firebase emulator mode requires localhost, 127.0.0.1, or ::1."
    );
  }

  const projectId =
    normalizeText(env.REACT_APP_FIREBASE_EMULATOR_PROJECT_ID) ||
    "demo-aspirenest-local";

  if (!projectId.startsWith("demo-")) {
    throw new Error(
      "Firebase emulator project ID must use the demo- prefix."
    );
  }

  return Object.freeze({
    enabled: true,
    host,
    projectId,
    authPort: readPort(
      env.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT,
      9099,
      "Auth emulator port"
    ),
    firestorePort: readPort(
      env.REACT_APP_FIRESTORE_EMULATOR_PORT,
      8080,
      "Firestore emulator port"
    ),
    storagePort: readPort(
      env.REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT,
      9199,
      "Storage emulator port"
    ),
    functionsPort: readPort(
      env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_PORT,
      5001,
      "Functions emulator port"
    ),
  });
};

export const buildFirebaseRuntimeConfig = (
  productionConfig = {},
  runtime = {}
) => {
  if (!runtime?.enabled) {
    return Object.freeze({ ...productionConfig });
  }

  return Object.freeze({
    ...productionConfig,
    apiKey: "demo-api-key",
    authDomain: `${runtime.projectId}.firebaseapp.com`,
    projectId: runtime.projectId,
    storageBucket: `${runtime.projectId}.appspot.com`,
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:demo",
    measurementId: "",
  });
};
