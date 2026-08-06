import app, {
  auth,
  db,
  firebaseInitializationRuntime,
} from "../../../firebase.js";

const providerEnabled = Boolean(
  firebaseInitializationRuntime.enabled &&
  app &&
  auth &&
  db
);

export const productionProviderFirebaseRuntime =
  Object.freeze({
    enabled: providerEnabled,
    app: providerEnabled ? app : null,
    auth: providerEnabled ? auth : null,
    db: providerEnabled ? db : null,
    environment:
      firebaseInitializationRuntime.environment,
    error: providerEnabled
      ? null
      : Object.freeze({
          code:
            firebaseInitializationRuntime.errorCode ||
            "FIREBASE_PROVIDER_RUNTIME_DISABLED",
          missingFields: Object.freeze([
            ...firebaseInitializationRuntime.missingFields,
          ]),
        }),
  });

export {
  auth,
  db,
  firebaseInitializationRuntime,
};

export default app;
