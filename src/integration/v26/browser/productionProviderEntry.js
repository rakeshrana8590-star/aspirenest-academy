import {
  auth,
  db,
} from "@aspirenest/firebase-runtime";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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

const firestoreReadDependencyAdapter =
  createFirestoreReadDependencyAdapter({
    db,
    doc,
    collection,
    getDoc,
    getDocs,
  });

const roleExperienceDependencyAdapter =
  createRoleExperienceDependencyAdapter({
    identityContract,
    readProfileByCollection:
      firestoreReadDependencyAdapter.readProfileByCollection,
  });

const firebaseAuthDependencyAdapter =
  createFirebaseAuthDependencyAdapter({
    auth,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    roleExperienceDependencyAdapter,
  });

const authProductionService =
  createAuthProductionService(
    firebaseAuthDependencyAdapter,
  );

const canonicalResourceService =
  createCanonicalResourceService({
    readResourceById:
      firestoreReadDependencyAdapter.readResourceById,
  });

const entitlementDecisionService =
  createEntitlementDecisionService({
    listEntitlementEvidence:
      firestoreReadDependencyAdapter.listEntitlementEvidence,
  });

const authorizeProductionService =
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

const handlerRegistry = createHandlerRegistry();
const provider = createAdapterSurface(
  methodNames,
  handlerRegistry,
);

if (handlerRegistry.list().length !== 0) {
  throw new TypeError(
    "Provider foundation must not assign runtime owners.",
  );
}

const privateComposition = new WeakMap();

privateComposition.set(
  provider,
  Object.freeze({
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
