"use strict";

const assert = require("node:assert/strict");
const authModule = require(
  "./authProductionService.js",
);

const baseUser = ({
  uid = "student-1",
  email = "student@example.invalid",
  emailVerified = true,
} = {}) => ({
  uid,
  email,
  emailVerified,
  displayName: "Student One",
  providerData: [],
});

const createService = ({
  profile = {},
  user = baseUser(),
  revokeOwnSessions = null,
} = {}) => {
  const auth = {
    currentUser: user,
  };
  const calls = [];

  const deps = {
    auth,
    registerStudentAccount:
      async () => ({ prepared: true }),
    linkWithCredential:
      async (firebaseUser) => ({
        user: firebaseUser,
      }),
    extractGoogleCredentialFromError:
      () => null,
    ensureStudentProfile:
      async () => ({ prepared: true }),
    signInWithEmailAndPassword:
      async () => ({ user }),
    signInWithUsernameAndPassword:
      async () => ({ user }),
    signInWithPopup:
      async () => ({ user }),
    signOut:
      async () => {
        calls.push("signOut");
        auth.currentUser = null;
      },
    sendEmailVerification:
      async () => {},
    sendPasswordResetEmail:
      async () => {},
    reloadUser:
      async () => {},
    buildActionCodeSettings:
      () => ({
        url: "https://example.invalid/",
        handleCodeInApp: false,
      }),
    createGoogleProvider:
      () => ({}),
    loadAccountProfile:
      async () => ({
        uid: user.uid,
        email: user.email,
        role: "student",
        accountStatus: "active",
        ...profile,
      }),
    resolveRole:
      (_firebaseUser, resolvedProfile) =>
        resolvedProfile.role || "student",
    resolveAllowedExperiences:
      (_firebaseUser, _profile, role) =>
        role === "admin"
          ? ["public", "student", "mentor", "admin"]
          : role === "mentor"
            ? ["public", "student", "mentor"]
            : ["public", "student"],
    subscribeAuthState:
      () => () => {},
    mapAuthError:
      () => null,
    ...(typeof revokeOwnSessions === "function"
      ? { revokeOwnSessions }
      : {}),
  };

  return {
    auth,
    calls,
    service:
      authModule.createAuthProductionService(
        deps
      ),
  };
};

(async () => {
  let count = 0;
  const verify = async (fn) => {
    await fn();
    count += 1;
  };

  for (const status of [
    "suspended",
    "blocked",
    "deletion-pending",
  ]) {
    await verify(async () => {
      const { service } =
        createService({
          profile: {
            accountStatus: status,
          },
        });

      const session =
        await service.getSession();

      assert.equal(
        session.ok,
        false
      );
      assert.equal(
        session.code,
        "AUTH_ACCOUNT_RESTRICTED"
      );
      assert.equal(
        session.details.accessAllowed,
        false
      );
      assert.equal(
        session.details.accountStatus,
        status
      );
    });
  }

  await verify(async () => {
    const order = [];
    const { service } =
      createService({
        revokeOwnSessions:
          async () => {
            order.push("revoke");
            return {
              sessionsRevoked: true,
            };
          },
      });

    const originalLogout =
      service.logout;

    const result =
      await originalLogout();

    assert.equal(
      result.signedOut,
      true
    );
    assert.equal(
      result.allDevicesRevoked,
      true
    );
    assert.deepEqual(
      order,
      ["revoke"]
    );
  });

  await verify(async () => {
    const { service } =
      createService({
        revokeOwnSessions:
          async () => {
            throw new Error(
              "revocation failed"
            );
          },
      });

    const result =
      await service.logout();

    assert.equal(
      result.ok,
      false
    );
    assert.equal(
      result.code,
      "AUTH_LOGOUT_FAILED"
    );
    assert.equal(
      result.details.signedOut,
      true
    );
    assert.equal(
      result.details.allDevicesRevoked,
      false
    );
  });

  console.log(
    `LP2_AUTH_STATUS_SESSION=${count}/${count}_PASS`
  );
  console.log(
    "RESTRICTED_ACCOUNT_FAIL_CLOSED=PASS"
  );
  console.log(
    "LOGOUT_SERVER_REVOCATION_BEFORE_LOCAL_SIGNOUT=PASS"
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
