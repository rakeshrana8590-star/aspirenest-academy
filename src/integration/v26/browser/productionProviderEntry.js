import {
  auth,
  db,
  productionProviderFirebaseRuntime,
} from "@aspirenest/firebase-runtime";
import {
  functions,
} from "../../../firebase.js";
import {
  createFirebaseUsernameAvailabilityCall,
} from "../../../profile/usernameAvailabilityClient.js";
import {
  createFirebaseUsernamePasswordSignIn,
} from "../../../profile/usernamePasswordSignInClient.js";
import {
  createFirebaseStudentAccountRegistration,
} from "../../../profile/studentAccountRegistrationClient.js";
import {
  createFirebaseStudentProfileEnsure,
} from "../../../profile/studentProfileEnsureClient.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  linkWithCredential,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import * as identityContract from "../../../auth/aspireNestIdentity.js";
import * as bridgeNamespace from "../productionBridgeFoundation.js";
import * as authServiceNamespace from "../authProductionService.js";
import * as canonicalServiceNamespace from "../canonicalResourceService.js";
import * as entitlementServiceNamespace from "../entitlementDecisionService.js";
import * as authorizeServiceNamespace from "../authorizeProductionService.js";
import * as roleAdapterNamespace from "./roleExperienceDependencyAdapter.js";
import * as firestoreAdapterNamespace from "./firestoreReadDependencyAdapter.js";
import * as firebaseAuthAdapterNamespace from "./firebaseAuthDependencyAdapter.js";
import methodRegistryDocument from "../productionBridgeMethodRegistry.json";

const PROVIDER_GLOBAL = "__aspirenestExactResourceAdapter";
const EXPECTED_METHOD_COUNT = 182;

const moduleApi = (namespace) => {
  const candidate =
    namespace
    && namespace.default
    && typeof namespace.default === "object"
      ? namespace.default
      : namespace;

  if (
    !candidate
    || typeof candidate !== "object"
    || Array.isArray(candidate)
  ) {
    throw new TypeError(
      "Provider composition module export is invalid.",
    );
  }

  return candidate;
};

const requiredFactory = (api, name) => {
  const factory = api[name];

  if (typeof factory !== "function") {
    throw new TypeError(
      `Provider composition factory is missing: ${name}`,
    );
  }

  return factory;
};

const bridgeApi = moduleApi(bridgeNamespace);
const authServiceApi = moduleApi(authServiceNamespace);
const canonicalServiceApi = moduleApi(
  canonicalServiceNamespace,
);
const entitlementServiceApi = moduleApi(
  entitlementServiceNamespace,
);
const authorizeServiceApi = moduleApi(
  authorizeServiceNamespace,
);
const roleAdapterApi = moduleApi(roleAdapterNamespace);
const firestoreAdapterApi = moduleApi(
  firestoreAdapterNamespace,
);
const firebaseAuthAdapterApi = moduleApi(
  firebaseAuthAdapterNamespace,
);

const createHandlerRegistry = requiredFactory(
  bridgeApi,
  "createHandlerRegistry",
);
const createAdapterSurface = requiredFactory(
  bridgeApi,
  "createAdapterSurface",
);
const createAuthProductionService = requiredFactory(
  authServiceApi,
  "createAuthProductionService",
);
const createCanonicalResourceService = requiredFactory(
  canonicalServiceApi,
  "createCanonicalResourceService",
);
const createEntitlementDecisionService = requiredFactory(
  entitlementServiceApi,
  "createEntitlementDecisionService",
);
const createAuthorizeProductionService = requiredFactory(
  authorizeServiceApi,
  "createAuthorizeProductionService",
);
const createRoleExperienceDependencyAdapter = requiredFactory(
  roleAdapterApi,
  "createRoleExperienceDependencyAdapter",
);
const createFirestoreReadDependencyAdapter = requiredFactory(
  firestoreAdapterApi,
  "createFirestoreReadDependencyAdapter",
);
const createFirebaseAuthDependencyAdapter = requiredFactory(
  firebaseAuthAdapterApi,
  "createFirebaseAuthDependencyAdapter",
);

const registryRows = Array.isArray(methodRegistryDocument)
  ? methodRegistryDocument
  : (
    methodRegistryDocument.methods
    || methodRegistryDocument.rows
    || methodRegistryDocument.entries
    || []
  );

if (
  !Array.isArray(registryRows)
  || registryRows.length !== EXPECTED_METHOD_COUNT
) {
  throw new TypeError(
    "Production provider method registry is invalid.",
  );
}

const methodNames = registryRows.map((row) =>
  String(row && row.name ? row.name : "").trim()
);

if (
  methodNames.some((name) => !name)
  || new Set(methodNames).size !== EXPECTED_METHOD_COUNT
) {
  throw new TypeError(
    "Production provider method registry names are invalid.",
  );
}

const providerRuntimeEnabled = Boolean(
  productionProviderFirebaseRuntime
  && productionProviderFirebaseRuntime.enabled
  && auth
  && db
);

const handlerRegistry = createHandlerRegistry();

let firestoreReadDependencyAdapter = null;
let roleExperienceDependencyAdapter = null;
let firebaseAuthDependencyAdapter = null;
let authProductionService = null;
let canonicalResourceService = null;
let entitlementDecisionService = null;
let authorizeProductionService = null;
let usernameAvailabilityCall = null;
let usernamePasswordSignIn = null;
let studentAccountRegistration = null;
let studentProfileEnsure = null;

if (providerRuntimeEnabled) {
  firestoreReadDependencyAdapter =
    createFirestoreReadDependencyAdapter({
      db,
      doc,
      collection,
      getDoc,
      getDocs,
    });

  roleExperienceDependencyAdapter =
    createRoleExperienceDependencyAdapter({
      identityContract,
      readProfileByCollection:
        firestoreReadDependencyAdapter.readProfileByCollection,
    });

  firebaseAuthDependencyAdapter =
    createFirebaseAuthDependencyAdapter({
      auth,
      signInWithEmailAndPassword,
      signInWithPopup,
      signOut,
      sendEmailVerification,
      sendPasswordResetEmail,
      reload,
      getLocationOrigin: () =>
        window.location.origin,
      onAuthStateChanged,
      GoogleAuthProvider,
      roleExperienceDependencyAdapter,
    });

  usernamePasswordSignIn =
    createFirebaseUsernamePasswordSignIn({
      authInstance: auth,
      functionsInstance: functions,
    });

  studentAccountRegistration =
    createFirebaseStudentAccountRegistration({
      functionsInstance: functions,
    });

  studentProfileEnsure =
    createFirebaseStudentProfileEnsure({
      functionsInstance: functions,
    });

  authProductionService =
    createAuthProductionService({
      ...firebaseAuthDependencyAdapter,
      signInWithUsernameAndPassword:
        usernamePasswordSignIn,
      registerStudentAccount:
        studentAccountRegistration,
      linkWithCredential,
      extractGoogleCredentialFromError:
        (error) =>
          GoogleAuthProvider
            .credentialFromError(
              error,
            ),
      ensureStudentProfile:
        studentProfileEnsure,
    });

  usernameAvailabilityCall =
    createFirebaseUsernameAvailabilityCall({
      functionsInstance: functions,
    });

  canonicalResourceService =
    createCanonicalResourceService({
      readResourceById:
        firestoreReadDependencyAdapter.readResourceById,
    });

  entitlementDecisionService =
    createEntitlementDecisionService({
      listEntitlementEvidence:
        firestoreReadDependencyAdapter.listEntitlementEvidence,
    });

  authorizeProductionService =
    createAuthorizeProductionService({
      getAuthoritativeSession:
        firebaseAuthDependencyAdapter
          .createAuthoritativeSessionReader(
            authProductionService,
          ),
      getCanonicalResource:
        canonicalResourceService.getCanonicalResource,
      resolveEntitlementDecision:
        entitlementDecisionService.resolveEntitlementDecision,
    });

  handlerRegistry.register(
    "checkUsernameAvailability",
    (payload) =>
      usernameAvailabilityCall(payload),
    Object.freeze({
      owner: "usernameAvailabilityClient",
    }),
  );

  handlerRegistry.register(
    "getSession",
    () => authProductionService.getSession(),
    Object.freeze({
      owner: "authProductionService",
    }),
  );

  handlerRegistry.register(
    "login",
    (payload) => authProductionService.login(payload),
    Object.freeze({
      owner: "authProductionService",
    }),
  );

  handlerRegistry.register(
    "signInWithGoogle",
    (payload) =>
      authProductionService.login({
        ...(payload && typeof payload === "object"
          ? payload
          : {}),
        mode: "google",
      }),
    Object.freeze({
      owner: "authProductionService",
    }),
  );

  handlerRegistry.register(
    "registerAccount",
    (payload) =>
      authProductionService.registerAccount(
        payload,
      ),
    Object.freeze({
      owner: "authProductionService",
    }),
  );

  handlerRegistry.register(
    "requestPasswordReset",
    (payload) =>
      authProductionService
        .requestPasswordReset(payload),
    Object.freeze({
      owner:
        "authProductionService",
    }),
  );

  handlerRegistry.register(
    "resendVerification",
    (payload) =>
      authProductionService
        .resendVerification(payload),
    Object.freeze({
      owner:
        "authProductionService",
    }),
  );

  handlerRegistry.register(
    "completeEmailVerification",
    (payload) =>
      authProductionService
        .completeEmailVerification(payload),
    Object.freeze({
      owner:
        "authProductionService",
    }),
  );

  handlerRegistry.register(
    "logout",
    () => authProductionService.logout(),
    Object.freeze({
      owner: "authProductionService",
    }),
  );

  handlerRegistry.register(
    "openCanonical",
    (payload, context) =>
      canonicalResourceService.getCanonicalResource({
        ...(
          payload
          && typeof payload === "object"
          && !Array.isArray(payload)
            ? payload
            : {}
        ),
        signal: context.signal,
      }),
    Object.freeze({
      owner: "canonicalResourceService",
    }),
  );

  handlerRegistry.register(
    "authorize",
    (payload, context) =>
      authorizeProductionService.authorize(
        payload,
        Object.freeze({
          signal: context.signal,
        }),
      ),
    Object.freeze({
      owner: "authorizeProductionService",
    }),
  );
}

const initialHandlerOwners = handlerRegistry.list();
const expectedInitialHandlerOwners = Object.freeze([
  Object.freeze({
    method: "authorize",
    owner: "authorizeProductionService",
  }),
  Object.freeze({
    method: "checkUsernameAvailability",
    owner: "usernameAvailabilityClient",
  }),
  Object.freeze({
    method: "completeEmailVerification",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "getSession",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "login",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "logout",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "openCanonical",
    owner: "canonicalResourceService",
  }),
  Object.freeze({
    method: "registerAccount",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "requestPasswordReset",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "resendVerification",
    owner: "authProductionService",
  }),
  Object.freeze({
    method: "signInWithGoogle",
    owner: "authProductionService",
  }),
]);
const expectedProviderHandlerOwners =
  providerRuntimeEnabled
    ? expectedInitialHandlerOwners
    : Object.freeze([]);
const expectedInitialHandlerOwnersJson =
  JSON.stringify(expectedInitialHandlerOwners);
const expectedProviderHandlerOwnersJson =
  providerRuntimeEnabled
    ? expectedInitialHandlerOwnersJson
    : JSON.stringify(expectedProviderHandlerOwners);

if (
  JSON.stringify(initialHandlerOwners)
  !== expectedProviderHandlerOwnersJson
) {
  throw new TypeError(
    "Provider initial handler owners are invalid.",
  );
}

const providerInvocationRegistry =
  providerRuntimeEnabled
    ? handlerRegistry
    : Object.freeze({
        invoke: async (method, payload, options) => {
          const envelope = await handlerRegistry.invoke(
            method,
            payload,
            options,
          );
          const runtimeError =
            productionProviderFirebaseRuntime
            && productionProviderFirebaseRuntime.error
              ? productionProviderFirebaseRuntime.error
              : null;

          return Object.freeze({
            ...envelope,
            message:
              `Firebase provider runtime is disabled for ${method}.`,
            details: Object.freeze({
              ...(
                envelope.details
                && typeof envelope.details === "object"
                  ? envelope.details
                  : {}
              ),
              ownerState:
                "SAFE_DISABLED_FIREBASE_RUNTIME",
              runtimeCode:
                runtimeError
                && typeof runtimeError.code === "string"
                  ? runtimeError.code
                  : "FIREBASE_PROVIDER_RUNTIME_DISABLED",
              missingFields: Object.freeze([
                ...(
                  runtimeError
                  && Array.isArray(runtimeError.missingFields)
                    ? runtimeError.missingFields
                    : []
                ),
              ]),
            }),
          });
        },
      });

const provider = createAdapterSurface(
  methodNames,
  providerInvocationRegistry,
);

const privateComposition = new WeakMap();

privateComposition.set(
  provider,
  Object.freeze({
    providerRuntimeEnabled,
    productionProviderFirebaseRuntime,
    firestoreReadDependencyAdapter,
    roleExperienceDependencyAdapter,
    firebaseAuthDependencyAdapter,
    authProductionService,
    canonicalResourceService,
    entitlementDecisionService,
    authorizeProductionService,
    handlerRegistry,
  }),
);

if (typeof window === "undefined") {
  throw new TypeError(
    "Production provider requires a browser window.",
  );
}

if (
  Object.prototype.hasOwnProperty.call(
    window,
    PROVIDER_GLOBAL,
  )
) {
  throw new TypeError(
    "Production provider global already exists.",
  );
}

window.__aspirenestExactResourceAdapter = provider;
