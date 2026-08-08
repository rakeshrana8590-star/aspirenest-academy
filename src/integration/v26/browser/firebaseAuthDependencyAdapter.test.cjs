"use strict";

const assert = require("node:assert/strict");
const adapterModule = require(
  "./firebaseAuthDependencyAdapter.js"
);
const contract = require(
  "./firebaseAuthDependencyAdapterContract.json"
);
const authServiceModule = require(
  "../authProductionService.js"
);
const roleAdapterModule = require(
  "./roleExperienceDependencyAdapter.js"
);

const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const MENTOR_EMAIL = "dr.varshamaru@gmail.com";

const identityContract = Object.freeze({
  ASPIRENEST_ADMIN_EMAIL: ADMIN_EMAIL,
  ASPIRENEST_MENTOR_EMAIL: MENTOR_EMAIL,
  ASPIRENEST_ROLES: Object.freeze({
    ADMIN: "admin",
    MENTOR: "mentor",
    STUDENT: "student",
  }),
  normalizeAspireNestEmail(value = "") {
    return String(value || "").trim().toLowerCase();
  },
  getAspireNestAllowedExperiences(identity = null) {
    const email = String(
      identity && identity.email || "",
    ).trim().toLowerCase();

    if (email === ADMIN_EMAIL) {
      return ["public", "student", "mentor", "admin"];
    }

    if (email === MENTOR_EMAIL) {
      return ["public", "student", "mentor"];
    }

    return ["public", "student"];
  },
});

function createRoleAdapter(records = {}) {
  return roleAdapterModule
    .createRoleExperienceDependencyAdapter({
      identityContract,
      async readProfileByCollection({
        collection,
        uid,
      }) {
        return records[`${collection}/${uid}`] || {};
      },
    });
}

function createHarness({
  currentUser = null,
  records = {},
  overrides = {},
} = {}) {
  const calls = [];
  const auth = {
    currentUser,
  };

  class GoogleAuthProvider {
    constructor() {
      this.parameters = null;
    }

    setCustomParameters(parameters) {
      calls.push([
        "setCustomParameters",
        parameters,
      ]);
      this.parameters = {
        ...parameters,
      };
    }
  }

  const dependencies = {
    auth,
    async signInWithEmailAndPassword(
      authDependency,
      email,
      password,
    ) {
      calls.push([
        "signInWithEmailAndPassword",
        authDependency,
        email,
        password,
      ]);
      return {
        user: auth.currentUser,
      };
    },
    async signInWithPopup(
      authDependency,
      provider,
    ) {
      calls.push([
        "signInWithPopup",
        authDependency,
        provider,
      ]);
      return {
        user: auth.currentUser,
      };
    },
    async signOut(authDependency) {
      calls.push([
        "signOut",
        authDependency,
      ]);
      auth.currentUser = null;
    },
    onAuthStateChanged(authDependency, listener) {
      calls.push([
        "onAuthStateChanged",
        authDependency,
        listener,
      ]);

      return function unsubscribeAuthState() {
        calls.push([
          "unsubscribeAuthState",
          authDependency,
        ]);
      };
    },
    GoogleAuthProvider,
    roleExperienceDependencyAdapter:
      createRoleAdapter(records),
    ...overrides,
  };

  return {
    auth,
    calls,
    adapter:
      adapterModule.createFirebaseAuthDependencyAdapter(
        dependencies,
      ),
  };
}

(async () => {
  let cases = 0;

  assert.equal(contract.version, "1.1.0");
  assert.equal(
    contract.googleProvider.customParameters.prompt,
    "select_account",
  );
  assert.equal(
    contract.requiredDependencies.includes(
      "onAuthStateChanged",
    ),
    true,
  );
  assert.equal(
    contract.authServiceDependencies.includes(
      "subscribeAuthState",
    ),
    true,
  );
  assert.equal(
    contract.authoritativeSession.listener.source,
    "reviewed_auth_service_subscribeSession",
  );
  assert.equal(
    contract.authoritativeSession.listener.sdkDependency,
    "onAuthStateChanged",
  );
  assert.equal(
    contract.authoritativeSession.listener.callerSessionTrusted,
    false,
  );
  assert.equal(
    contract.authoritativeSession.listener.unsubscribeRequired,
    true,
  );
  assert.equal(
    contract.authoritativeSession.callerSessionTrusted,
    false,
  );
  assert.equal(
    contract.authoritativeSession.source,
    "reviewed_auth_service_getSession",
  );
  cases += 1;

  assert.throws(
    () => (
      adapterModule.createFirebaseAuthDependencyAdapter()
    ),
    /requires auth/,
  );
  cases += 1;

  assert.throws(
    () => (
      adapterModule.createFirebaseAuthDependencyAdapter({
        auth: {},
      })
    ),
    /dependency missing/,
  );
  cases += 1;

  assert.throws(
    () => (
      adapterModule.createFirebaseAuthDependencyAdapter({
        auth: {},
        signInWithEmailAndPassword() {},
        signInWithPopup() {},
        signOut() {},
        onAuthStateChanged() {
          return () => {};
        },
        GoogleAuthProvider() {},
        roleExperienceDependencyAdapter: {},
      })
    ),
    /role dependency missing/,
  );
  cases += 1;

  const harness = createHarness();
  const { adapter } = harness;

  assert.equal(adapter.auth, harness.auth);
  assert.equal(Object.isFrozen(adapter), true);
  cases += 1;

  const provider = adapter.createGoogleProvider();
  assert.equal(provider.parameters.prompt, "select_account");
  assert.deepEqual(
    harness.calls[0],
    [
      "setCustomParameters",
      {
        prompt: "select_account",
      },
    ],
  );
  cases += 1;

  await adapter.signInWithEmailAndPassword(
    harness.auth,
    "student@example.com",
    "password",
  );
  assert.equal(
    harness.calls.at(-1)[0],
    "signInWithEmailAndPassword",
  );
  cases += 1;

  await adapter.signInWithPopup(
    harness.auth,
    provider,
  );
  assert.equal(
    harness.calls.at(-1)[0],
    "signInWithPopup",
  );
  cases += 1;

  await adapter.signOut(harness.auth);
  assert.equal(harness.calls.at(-1)[0], "signOut");
  cases += 1;

  let observedAuthUser = null;
  const unsubscribeAuthState =
    adapter.subscribeAuthState((firebaseUser) => {
      observedAuthUser = firebaseUser;
    });

  assert.equal(
    typeof unsubscribeAuthState,
    "function",
  );

  const authStateCall = harness.calls.find(
    (item) => item[0] === "onAuthStateChanged",
  );

  assert(authStateCall);
  assert.equal(authStateCall[1], harness.auth);
  assert.equal(
    typeof authStateCall[2],
    "function",
  );

  const deliveredUser = {
    uid: "listener-delivery-001",
  };
  authStateCall[2](deliveredUser);

  assert.equal(observedAuthUser, deliveredUser);

  unsubscribeAuthState();

  assert.equal(
    harness.calls.at(-1)[0],
    "unsubscribeAuthState",
  );
  cases += 1;

  assert.throws(
    () => adapter.subscribeAuthState(null),
    /listener must be a function/,
  );
  cases += 1;

  const invalidUnsubscribeHarness = createHarness({
    overrides: {
      onAuthStateChanged() {
        return null;
      },
    },
  });

  assert.throws(
    () => (
      invalidUnsubscribeHarness.adapter
        .subscribeAuthState(() => {})
    ),
    /must return unsubscribe/,
  );
  cases += 1;

  const dynamicUser = {
    uid: "mentor-dynamic",
    email: "dynamic@example.com",
    emailVerified: true,
    displayName: "Dynamic Mentor",
  };
  const dynamicHarness = createHarness({
    currentUser: dynamicUser,
    records: {
      "users/mentor-dynamic": {
        fullName: "Dynamic Mentor",
      },
      "mentorProfiles/mentor-dynamic": {
        mentorUid: "mentor-dynamic",
        role: "mentor",
        status: "active",
      },
    },
  });
  const profile =
    await dynamicHarness.adapter.loadAccountProfile(
      dynamicUser,
    );
  assert.equal(
    dynamicHarness.adapter.resolveRole(
      dynamicUser,
      profile,
    ),
    "mentor",
  );
  assert.deepEqual(
    dynamicHarness.adapter.resolveAllowedExperiences(
      dynamicUser,
      profile,
      "mentor",
    ),
    ["public", "student", "mentor"],
  );
  cases += 1;

  const authService =
    authServiceModule.createAuthProductionService(
      dynamicHarness.adapter,
    );
  const session = await authService.getSession();
  assert.equal(session.authenticated, true);
  assert.equal(session.accessAllowed, true);
  assert.equal(session.role, "mentor");
  assert.deepEqual(
    session.allowed,
    ["public", "student", "mentor"],
  );
  assert.equal(
    session.allowedRoles,
    session.allowed,
  );
  assert.equal(
    session.activeRole,
    "mentor",
  );
  cases += 1;

  const getAuthoritativeSession =
    dynamicHarness.adapter
      .createAuthoritativeSessionReader(authService);
  assert.equal(
    Object.isFrozen(getAuthoritativeSession),
    true,
  );
  const authoritative =
    await getAuthoritativeSession({
      uid: "caller-forged",
      role: "admin",
      allowed: ["admin"],
    });
  assert.equal(authoritative.uid, "mentor-dynamic");
  assert.equal(authoritative.role, "mentor");
  cases += 1;

  assert.throws(
    () => (
      dynamicHarness.adapter
        .createAuthoritativeSessionReader({})
    ),
    /getSession/,
  );
  cases += 1;

  const unverifiedUser = {
    uid: "student-unverified",
    email: "student@example.com",
    emailVerified: false,
  };
  const unverifiedHarness = createHarness({
    currentUser: unverifiedUser,
  });
  const unverifiedAuthService =
    authServiceModule.createAuthProductionService(
      unverifiedHarness.adapter,
    );
  const unverifiedSession =
    await unverifiedAuthService.getSession();
  assert.equal(unverifiedSession.ok, false);
  assert.equal(
    unverifiedSession.code,
    authServiceModule.AUTH_CODES.EMAIL_UNVERIFIED,
  );
  assert.equal(
    unverifiedSession.details.accessAllowed,
    false,
  );
  cases += 1;

  const adminUser = {
    uid: "admin-1",
    email: ADMIN_EMAIL,
    emailVerified: true,
  };
  const failedReadRoleAdapter =
    roleAdapterModule
      .createRoleExperienceDependencyAdapter({
        identityContract,
        async readProfileByCollection() {
          throw new Error("read failed");
        },
      });
  const adminHarness = createHarness({
    currentUser: adminUser,
    overrides: {
      roleExperienceDependencyAdapter:
        failedReadRoleAdapter,
    },
  });
  const adminAuthService =
    authServiceModule.createAuthProductionService(
      adminHarness.adapter,
    );
  const adminSession =
    await adminAuthService.getSession();
  assert.equal(adminSession.role, "admin");
  assert.deepEqual(
    adminSession.allowed,
    ["public", "student", "mentor", "admin"],
  );
  cases += 1;

  class BrokenProvider {}
  const brokenHarness = createHarness({
    overrides: {
      GoogleAuthProvider: BrokenProvider,
    },
  });
  assert.throws(
    () => brokenHarness.adapter.createGoogleProvider(),
    /invalid/,
  );
  cases += 1;

  class ThrowingProvider {
    setCustomParameters() {
      throw new Error("provider secret error");
    }
  }
  const throwingHarness = createHarness({
    overrides: {
      GoogleAuthProvider: ThrowingProvider,
    },
  });
  assert.throws(
    () => throwingHarness.adapter.createGoogleProvider(),
    /could not be configured/,
  );
  cases += 1;

  const forgedRoleAdapter = {
    async loadAccountProfile() {
      return {
        role: "admin",
      };
    },
    resolveRole() {
      return "student";
    },
    resolveAllowedExperiences() {
      return ["public", "student"];
    },
  };
  const forgedHarness = createHarness({
    currentUser: {
      uid: "student-forged",
      email: "student-forged@example.com",
      emailVerified: true,
    },
    overrides: {
      roleExperienceDependencyAdapter:
        forgedRoleAdapter,
    },
  });
  const forgedAuthService =
    authServiceModule.createAuthProductionService(
      forgedHarness.adapter,
    );
  const forgedSession =
    await forgedAuthService.getSession();
  assert.equal(forgedSession.role, "student");
  assert.deepEqual(
    forgedSession.allowed,
    ["public", "student"],
  );
  cases += 1;

  assert.equal(
    adapterModule.GOOGLE_PROMPT,
    "select_account",
  );
  cases += 1;

  assert.equal(cases, 22);

  console.log(
    `FIREBASE_AUTH_ADAPTER_CASES=${cases}/${cases}_PASS`,
  );
  console.log("GOOGLE_PROVIDER_SELECT_ACCOUNT=PASS");
  console.log("AUTH_SDK_FUNCTION_DELEGATION=PASS");
  console.log("ROLE_ADAPTER_DELEGATION=PASS");
  console.log("DYNAMIC_MENTOR_AUTH_SESSION=PASS");
  console.log("UNVERIFIED_SESSION_FAIL_CLOSED=PASS");
  console.log("FIXED_ADMIN_READ_FAILURE_AUTHORITY=PASS");
  console.log("CALLER_SESSION_AUTHORITY=REJECTED");
  console.log("CALLER_PROFILE_ROLE_ESCALATION=REJECTED");
  console.log("AUTH_STATE_LISTENER_BINDING=PASS");
  console.log("AUTH_STATE_LISTENER_CALLBACK_DELIVERY=PASS");
  console.log("AUTH_STATE_LISTENER_UNSUBSCRIBE=PASS");
  console.log("ALLOWEDROLES_ALIAS=PASS");
  console.log("ACTIVE_ROLE_SNAPSHOT=PASS");
  console.log("AUTHORITATIVE_SESSION_SOURCE=AUTH_SERVICE_GET_SESSION");
  console.log("AUTHORITATIVE_SESSION_LISTENER_SOURCE=AUTH_SERVICE_SUBSCRIBE_SESSION");
  console.log("FIREBASE_AUTH_ADAPTER_TEST_STATUS=GREEN");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
