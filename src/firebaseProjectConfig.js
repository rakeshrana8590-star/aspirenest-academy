const FIREBASE_ENVIRONMENTS = Object.freeze([
  "local",
  "staging",
  "production",
]);

const FIREBASE_REQUIRED_CONFIG_FIELDS = Object.freeze([
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
]);

const FIREBASE_OPTIONAL_CONFIG_FIELDS = Object.freeze([
  "measurementId",
]);

const FIREBASE_ENV_FIELD_MAP = Object.freeze({
  apiKey: "REACT_APP_FIREBASE_API_KEY",
  authDomain: "REACT_APP_FIREBASE_AUTH_DOMAIN",
  projectId: "REACT_APP_FIREBASE_PROJECT_ID",
  storageBucket: "REACT_APP_FIREBASE_STORAGE_BUCKET",
  messagingSenderId:
    "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REACT_APP_FIREBASE_APP_ID",
  measurementId: "REACT_APP_FIREBASE_MEASUREMENT_ID",
});

const normalizeText = (value = "") =>
  String(value ?? "").trim();

const disabledResult = ({
  code,
  environment = "",
  missingFields = [],
}) =>
  Object.freeze({
    enabled: false,
    environment,
    config: null,
    error: Object.freeze({
      code,
      missingFields: Object.freeze([...missingFields]),
    }),
  });

export const resolveFirebaseProjectConfig = ({
  env = process.env,
} = {}) => {
  const environment = normalizeText(
    env.REACT_APP_ASPIRENEST_ENVIRONMENT
  ).toLowerCase();

  if (!environment) {
    return disabledResult({
      code: "FIREBASE_ENVIRONMENT_REQUIRED",
    });
  }

  if (!FIREBASE_ENVIRONMENTS.includes(environment)) {
    return disabledResult({
      code: "FIREBASE_ENVIRONMENT_INVALID",
      environment,
    });
  }

  const config = {};

  for (const field of [
    ...FIREBASE_REQUIRED_CONFIG_FIELDS,
    ...FIREBASE_OPTIONAL_CONFIG_FIELDS,
  ]) {
    const value = normalizeText(
      env[FIREBASE_ENV_FIELD_MAP[field]]
    );

    if (value) {
      config[field] = value;
    }
  }

  const missingFields =
    FIREBASE_REQUIRED_CONFIG_FIELDS.filter(
      (field) => !config[field]
    );

  if (missingFields.length) {
    return disabledResult({
      code: "FIREBASE_CONFIG_REQUIRED_FIELDS_MISSING",
      environment,
      missingFields,
    });
  }

  return Object.freeze({
    enabled: true,
    environment,
    config: Object.freeze({ ...config }),
    error: null,
  });
};
