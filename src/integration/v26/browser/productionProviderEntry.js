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
  getIdTokenResult,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import {
  httpsCallable,
} from "firebase/functions";

import * as identityContract from "../../../auth/aspireNestIdentity.js";
import * as bridgeNamespace from "../productionBridgeFoundation.js";
import * as authServiceNamespace from "../authProductionService.js";
import * as canonicalServiceNamespace from "../canonicalResourceService.js";
import * as entitlementServiceNamespace from "../entitlementDecisionService.js";
import * as authorizeServiceNamespace from "../authorizeProductionService.js";
import * as accessProductionServiceNamespace from "../accessProductionService.js";
import * as lp4LearningServiceNamespace from "../lp4LearningProductionService.js";
import * as lp5MentorProfileServiceNamespace from "../lp5MentorProfileProductionService.js";
import * as lp5AcademyOperationsServiceNamespace from "../lp5AcademyOperationsProductionService.js";
import * as accessServiceNamespace from "../../../access/accessService.js";
import * as mentorServiceNamespace from "../../../mentor/mentorService.js";
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
const accessProductionServiceApi = moduleApi(accessProductionServiceNamespace);
const lp4LearningServiceApi = moduleApi(lp4LearningServiceNamespace);
const lp5MentorProfileServiceApi = moduleApi(lp5MentorProfileServiceNamespace);
const lp5AcademyOperationsServiceApi = moduleApi(lp5AcademyOperationsServiceNamespace);
const accessServiceApi = moduleApi(accessServiceNamespace);
const mentorServiceApi = moduleApi(mentorServiceNamespace);
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
const createAccessProductionService = requiredFactory(
  accessProductionServiceApi,
  "createAccessProductionService",
);
const createLp4LearningProductionService = requiredFactory(
  lp4LearningServiceApi,
  "createLp4LearningProductionService",
);
const lp4LearningMethodPolicies = lp4LearningServiceApi.METHOD_POLICIES;
const createLp5MentorProfileProductionService = requiredFactory(
  lp5MentorProfileServiceApi,
  "createLp5MentorProfileProductionService",
);
const lp5MentorProfileMethodPolicies = lp5MentorProfileServiceApi.METHOD_POLICIES;
const createLp5AcademyOperationsProductionService = requiredFactory(
  lp5AcademyOperationsServiceApi,
  "createLp5AcademyOperationsProductionService",
);
const lp5AcademyOperationsMethodPolicies = lp5AcademyOperationsServiceApi.METHOD_POLICIES;
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
  && functions
);

const handlerRegistry = createHandlerRegistry();

let firestoreReadDependencyAdapter = null;
let roleExperienceDependencyAdapter = null;
let firebaseAuthDependencyAdapter = null;
let authProductionService = null;
let canonicalResourceService = null;
let entitlementDecisionService = null;
let authorizeProductionService = null;
let accessProductionService = null;
let lp4LearningProductionService = null;
let lp5MentorProfileProductionService = null;
let lp5AcademyOperationsProductionService = null;
let lp4LearningOperationCall = null;
let lp5MentorProfileOperationCall = null;
let lp5AcademyOperationsOperationCall = null;
let usernameAvailabilityCall = null;
let usernamePasswordSignIn = null;
let studentAccountRegistration = null;
let studentProfileEnsure = null;
let revokeOwnSessionsCall = null;
let saveStudentProfileCall = null;
let loadAccountSecurityCall = null;

const callableDataInvoker = (name) => {
  const callable = httpsCallable(functions, name);

  return async (payload = {}) => {
    const response = await callable(
      payload && typeof payload === "object"
        && !Array.isArray(payload)
        ? payload
        : {},
    );

    return response && response.data
      && typeof response.data === "object"
      && !Array.isArray(response.data)
        ? response.data
        : {};
  };
};

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
      readRoleAuthority: async ({ uid } = {}) => {
        const safeUid = String(uid || "").trim();

        if (!safeUid) {
          return {};
        }

        const snapshot = await getDoc(
          doc(db, "roleAuthorities", safeUid),
        );

        return snapshot.exists()
          ? snapshot.data() || {}
          : {};
      },
      readAuthClaims: async (firebaseUser, forceRefresh) => {
        if (!firebaseUser) {
          return {};
        }

        const result = await getIdTokenResult(
          firebaseUser,
          forceRefresh === true,
        );

        return result && result.claims
          && typeof result.claims === "object"
          ? result.claims
          : {};
      },
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

  revokeOwnSessionsCall =
    callableDataInvoker("revokeOwnSessions");
  saveStudentProfileCall =
    callableDataInvoker("saveStudentProfile");
  loadAccountSecurityCall =
    callableDataInvoker("loadAccountSecurity");

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
      revokeOwnSessions:
        () => revokeOwnSessionsCall({}),
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

  accessProductionService = createAccessProductionService({
    getAuthoritativeSession: () => authProductionService.getSession(),
    getCanonicalResource: canonicalResourceService.getCanonicalResource,
    resolveVerifiedAccessUserByEmail: accessServiceApi.resolveVerifiedAccessUserByEmail,
    createManualAccess: accessServiceApi.createManualAccess,
    createBulkAccessImportPlan: accessServiceApi.createBulkAccessImportPlan,
    executeBulkAccessImport: accessServiceApi.executeBulkAccessImport,
    rollbackBulkAccessImport: accessServiceApi.rollbackBulkAccessImport,
    createAccessProduct: accessServiceApi.createAccessProduct,
    updateAccessProduct: accessServiceApi.updateAccessProduct,
    listAccessProducts: accessServiceApi.listAccessProducts,
    createAccessKey: accessServiceApi.createAccessKey,
    regenerateAccessKey: accessServiceApi.regenerateAccessKey,
    redeemAccessKeyFoundation: accessServiceApi.redeemAccessKeyFoundation,
    createAccessInvite: accessServiceApi.createAccessInvite,
    regenerateAccessInviteLink: accessServiceApi.regenerateAccessInviteLink,
    redeemAccessInvite: accessServiceApi.redeemAccessInvite,
    createStudentAccessRequest: accessServiceApi.createStudentAccessRequest,
    createMentorAccessRequest: mentorServiceApi.createMentorAccessRequest,
    listAccessRequests: accessServiceApi.listAccessRequests,
    updateAccessRequest: accessServiceApi.updateAccessRequest,
    approveAccessRequest: accessServiceApi.approveAccessRequest,
    extendAccess: accessServiceApi.extendAccess,
    revokeAccess: accessServiceApi.revokeAccess,
    restoreAccess: accessServiceApi.restoreAccess,
    loadStudentAccessWorkspace: accessServiceApi.loadStudentAccessWorkspace,
  });

  lp4LearningOperationCall = callableDataInvoker("lp4LearningOperation");
  lp4LearningProductionService = createLp4LearningProductionService({
    invokeLearningOperation: lp4LearningOperationCall,
    authorize: (payload) => authorizeProductionService.authorize(payload),
  });

  for (const method of Object.keys(lp4LearningMethodPolicies).sort()) {
    handlerRegistry.register(
      method,
      (payload, context) => lp4LearningProductionService.invoke(method, payload, context),
      Object.freeze({ owner: lp4LearningMethodPolicies[method].owner }),
    );
  }

  lp5MentorProfileOperationCall =
    callableDataInvoker("lp5MentorProfileOperation");
  lp5MentorProfileProductionService =
    createLp5MentorProfileProductionService({
      invokeAcademyOperation:
        lp5MentorProfileOperationCall,
    });

  for (const method of Object.keys(lp5MentorProfileMethodPolicies).sort()) {
    handlerRegistry.register(
      method,
      (payload, context) =>
        lp5MentorProfileProductionService.invoke(
          method,
          payload,
          context,
        ),
      Object.freeze({
        owner:
          lp5MentorProfileMethodPolicies[method].owner,
      }),
    );
  }

  lp5AcademyOperationsOperationCall =
    callableDataInvoker("lp5AcademyOperationsOperation");
  lp5AcademyOperationsProductionService =
    createLp5AcademyOperationsProductionService({
      invokeAcademyOperation:
        lp5AcademyOperationsOperationCall,
    });

  for (const method of Object.keys(lp5AcademyOperationsMethodPolicies).sort()) {
    handlerRegistry.register(
      method,
      (payload, context) =>
        lp5AcademyOperationsProductionService.invoke(
          method,
          payload,
          context,
        ),
      Object.freeze({
        owner:
          lp5AcademyOperationsMethodPolicies[method].owner,
      }),
    );
  }

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
    "saveStudentProfile",
    (payload) => saveStudentProfileCall(payload),
    Object.freeze({
      owner: "lp2IdentityAuthority",
    }),
  );

  handlerRegistry.register(
    "loadStudentAccountSecurity",
    () => loadAccountSecurityCall({}),
    Object.freeze({
      owner: "lp2IdentityAuthority",
    }),
  );

  handlerRegistry.register(
    "loadMentorAccountSecurity",
    () => loadAccountSecurityCall({}),
    Object.freeze({
      owner: "lp2IdentityAuthority",
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

  handlerRegistry.register(
    "applyBulkAccess",
    (payload) => accessProductionService.applyBulkAccess(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "approveAccessRequest",
    (payload) => accessProductionService.approveAccessRequest(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "createMentorAccessRequest",
    (payload) => accessProductionService.createMentorAccessRequest(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "createStudentAccessRequest",
    (payload) => accessProductionService.createStudentAccessRequest(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "extendAccessGrant",
    (payload) => accessProductionService.extendAccessGrant(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "listAccessRequests",
    (payload) => accessProductionService.listAccessRequests(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "loadStudentWorkspace",
    (payload) => accessProductionService.loadStudentWorkspace(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "previewBulkAccess",
    (payload) => accessProductionService.previewBulkAccess(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "redeemAccessInvite",
    (payload) => accessProductionService.redeemAccessInvite(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "redeemAccessKey",
    (payload) => accessProductionService.redeemAccessKey(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "regenerateAccessInvite",
    (payload) => accessProductionService.regenerateAccessInvite(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "regenerateAccessKey",
    (payload) => accessProductionService.regenerateAccessKey(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "restoreAccessGrant",
    (payload) => accessProductionService.restoreAccessGrant(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "revokeAccessGrant",
    (payload) => accessProductionService.revokeAccessGrant(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "rollbackBulkAccessBatch",
    (payload) => accessProductionService.rollbackBulkAccessBatch(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "saveAccessBundle",
    (payload) => accessProductionService.saveAccessBundle(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "saveAccessGrant",
    (payload) => accessProductionService.saveAccessGrant(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "saveAccessInvite",
    (payload) => accessProductionService.saveAccessInvite(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "saveAccessKey",
    (payload) => accessProductionService.saveAccessKey(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "saveAccessProduct",
    (payload) => accessProductionService.saveAccessProduct(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

  handlerRegistry.register(
    "updateAccessRequest",
    (payload) => accessProductionService.updateAccessRequest(payload),
    Object.freeze({ owner: "accessProductionService" }),
  );

}

const initialHandlerOwners = handlerRegistry.list();
const expectedInitialHandlerOwners = Object.freeze(
  registryRows
    .filter((row) => row && row.runtimeActivation === true && row.owner)
    .map((row) => Object.freeze({ method: row.name, owner: row.owner }))
    .sort((a, b) => a.method.localeCompare(b.method)),
);

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
    accessProductionService,
    lp4LearningProductionService,
    lp5MentorProfileProductionService,
    lp5AcademyOperationsProductionService,
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
