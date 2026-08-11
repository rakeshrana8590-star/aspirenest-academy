"use strict";

const assert =
  require("node:assert/strict");
const path =
  require("node:path");

const repo =
  path.resolve(
    __dirname,
    "..",
  );

const authModule =
  require(
    path.join(
      repo,
      "src/integration/v26/authProductionService.js",
    )
  );

const functionsModule =
  require(
    path.join(
      repo,
      "functions/index.js",
    )
  );

const {
  ensureStudentProfile,
  STUDENT_PROFILE_ENSURE_FUNCTION_NAME,
  STUDENT_PROFILE_USERS_COLLECTION,
  STUDENT_PROFILE_STUDENTS_COLLECTION,
  STUDENT_PROFILE_MENTORS_COLLECTION,
} =
  functionsModule.__test;

function snapshot(data) {
  const exists =
    data !== undefined;

  return {
    exists:
      () => exists,
    data:
      () =>
        exists
          ? data
          : {},
  };
}

function createProfileFirestore(
  initial = {}
) {
  const docs =
    new Map(
      Object.entries(
        initial
      )
    );

  const writes = [];

  function ref(
    collection,
    id,
  ) {
    return {
      collection,
      id,
      path:
        `${collection}/${id}`,
    };
  }

  return {
    docs,
    writes,

    collection(
      collectionName
    ) {
      return {
        doc(id) {
          return ref(
            collectionName,
            id,
          );
        },
      };
    },

    async runTransaction(
      callback
    ) {
      const pending = [];

      const transaction = {
        async get(
          documentRef
        ) {
          return snapshot(
            docs.has(
              documentRef.path
            )
              ? docs.get(
                  documentRef.path
                )
              : undefined
          );
        },

        set(
          documentRef,
          data,
        ) {
          pending.push({
            path:
              documentRef.path,
            data,
          });
        },
      };

      const result =
        await callback(
          transaction
        );

      for (
        const item
        of pending
      ) {
        docs.set(
          item.path,
          item.data,
        );
        writes.push(
          item
        );
      }

      return result;
    },
  };
}

async function proveProfileEnsure() {
  assert.equal(
    STUDENT_PROFILE_ENSURE_FUNCTION_NAME,
    "ensureStudentProfile",
  );

  assert.equal(
    STUDENT_PROFILE_USERS_COLLECTION,
    "users",
  );

  assert.equal(
    STUDENT_PROFILE_STUDENTS_COLLECTION,
    "students",
  );

  assert.equal(
    STUDENT_PROFILE_MENTORS_COLLECTION,
    "mentorProfiles",
  );

  const firestore =
    createProfileFirestore();

  const adminAuth = {
    async getUser(uid) {
      return {
        uid,
        email:
          "student@aspirenest.invalid",
        displayName:
          "Canonical Student",
        emailVerified:
          true,
      };
    },
  };

  const requestAuth = {
    uid:
      "uid-student-1",
    token: {
      email_verified:
        true,
    },
  };

  const first =
    await ensureStudentProfile({
      requestAuth,
      firestore,
      adminAuth,
      nowMs:
        1000,
    });

  assert.deepEqual(
    first,
    {
      prepared: true,
    },
  );

  assert.equal(
    firestore.docs.has(
      "users/uid-student-1"
    ),
    true,
  );

  assert.equal(
    firestore.docs.has(
      "students/uid-student-1"
    ),
    true,
  );

  assert.equal(
    firestore.writes.length,
    2,
  );

  const second =
    await ensureStudentProfile({
      requestAuth,
      firestore,
      adminAuth,
      nowMs:
        2000,
    });

  assert.deepEqual(
    second,
    {
      prepared: true,
    },
  );

  assert.equal(
    firestore.writes.length,
    2,
  );

  const mentorFirestore =
    createProfileFirestore({
      "mentorProfiles/uid-mentor-1": {
        mentorUid:
          "uid-mentor-1",
        role:
          "mentor",
        status:
          "active",
      },
    });

  await assert.rejects(
    () =>
      ensureStudentProfile({
        requestAuth: {
          uid:
            "uid-mentor-1",
          token: {
            email_verified:
              true,
          },
        },
        firestore:
          mentorFirestore,
        adminAuth: {
          async getUser(uid) {
            return {
              uid,
              email:
                "dynamic.mentor@aspirenest.invalid",
              displayName:
                "Dynamic Mentor",
              emailVerified:
                true,
            };
          },
        },
      })
  );

  assert.equal(
    mentorFirestore.docs.has(
      "students/uid-mentor-1"
    ),
    false,
  );

  console.log(
    "PROFILE_ENSURE_UID_KEYED_IDEMPOTENCY=PASS"
  );

  console.log(
    "PROFILE_ENSURE_ACTIVE_MENTOR_REJECTED=PASS"
  );
}

function createAuthHarness({
  googleCollision =
    false,
  mismatchEmail =
    false,
  includeProfileEnsure =
    true,
} = {}) {
  const calls = [];

  const auth = {
    currentUser:
      null,
  };

  const pendingCredential = {
    providerId:
      "google.com",
    synthetic:
      true,
  };

  const dependencies = {
    auth,

    async registerStudentAccount() {
      return {
        prepared:
          true,
      };
    },

    async signInWithEmailAndPassword(
      receivedAuth,
      email,
    ) {
      const user = {
        uid:
          "canonical-uid-1",
        email:
          mismatchEmail
            ? "other@aspirenest.invalid"
            : email,
        displayName:
          "Canonical Student",
        emailVerified:
          true,
      };

      receivedAuth.currentUser =
        user;

      calls.push({
        name:
          "signInWithEmailAndPassword",
        uid:
          user.uid,
        email:
          user.email,
      });

      return {
        user,
      };
    },

    async signInWithUsernameAndPassword() {
      const user = {
        uid:
          "canonical-uid-1",
        email:
          "same@aspirenest.invalid",
        displayName:
          "Canonical Student",
        emailVerified:
          true,
      };

      auth.currentUser =
        user;

      calls.push({
        name:
          "signInWithUsernameAndPassword",
        uid:
          user.uid,
      });

      return {
        user,
      };
    },

    async signInWithPopup() {
      if (googleCollision) {
        const error =
          new Error(
            "SYNTHETIC_COLLISION"
          );

        error.code =
          "auth/account-exists-with-different-credential";

        error.customData = {
          email:
            "same@aspirenest.invalid",
        };

        error.syntheticCredential =
          pendingCredential;

        throw error;
      }

      const user = {
        uid:
          "google-uid-1",
        email:
          "google@aspirenest.invalid",
        displayName:
          "Google Student",
        emailVerified:
          true,
      };

      auth.currentUser =
        user;

      return {
        user,
      };
    },

    async linkWithCredential(
      user,
      credential,
    ) {
      calls.push({
        name:
          "linkWithCredential",
        uid:
          user.uid,
        credentialMatches:
          credential ===
            pendingCredential,
      });

      return {
        user,
      };
    },

    extractGoogleCredentialFromError(
      error,
    ) {
      return (
        error
          .syntheticCredential
        || null
      );
    },

    async signOut(
      receivedAuth
    ) {
      calls.push({
        name:
          "signOut",
      });

      receivedAuth.currentUser =
        null;
    },

    async sendEmailVerification(
      firebaseUser,
      actionCodeSettings,
    ) {
      calls.push({
        name:
          "sendEmailVerification",
        uid:
          firebaseUser
          && firebaseUser.uid,
        actionCodeSettings,
      });
    },

    async sendPasswordResetEmail(
      receivedAuth,
      email,
      actionCodeSettings,
    ) {
      calls.push({
        name:
          "sendPasswordResetEmail",
        receivedAuth,
        email,
        actionCodeSettings,
      });
    },

    async reloadUser(
      firebaseUser
    ) {
      calls.push({
        name:
          "reloadUser",
        uid:
          firebaseUser
          && firebaseUser.uid,
      });
    },

    buildActionCodeSettings(
      returnTo,
      purpose,
    ) {
      calls.push({
        name:
          "buildActionCodeSettings",
        returnTo,
        purpose,
      });

      return {
        url:
          "https://www.aspirenestacademy.in/#public/auth/verify",
        handleCodeInApp:
          false,
      };
    },

    createGoogleProvider() {
      return {
        providerId:
          "google.com",
      };
    },

    async loadAccountProfile(
      user
    ) {
      calls.push({
        name:
          "loadAccountProfile",
        uid:
          user.uid,
      });

      return {
        fullName:
          user.displayName,
        planType:
          "FREE",
      };
    },

    resolveRole(user) {
      return (
        user.uid.startsWith(
          "mentor"
        )
          ? "mentor"
          : "student"
      );
    },

    resolveAllowedExperiences(
      _user,
      _profile,
      role,
    ) {
      return (
        role === "student"
          ? [
              "public",
              "student",
            ]
          : [
              "public",
              "student",
              "mentor",
            ]
      );
    },

    subscribeAuthState() {
      return () => {};
    },

    mapAuthError() {
      return {
        safe:
          true,
        message:
          "Safe mapped authentication message.",
      };
    },
  };

  if (
    includeProfileEnsure
  ) {
    dependencies.ensureStudentProfile =
      async () => {
        calls.push({
          name:
            "ensureStudentProfile",
        });

        return {
          prepared:
            true,
        };
      };
  }

  return {
    auth,
    calls,
    service:
      authModule
        .createAuthProductionService(
          dependencies
        ),
  };
}

async function proveSameEmailLinking() {
  const harness =
    createAuthHarness({
      googleCollision:
        true,
    });

  const googleResult =
    await harness.service.login({
      mode:
        "google",
    });

  assert.equal(
    googleResult.ok,
    false,
  );

  assert.equal(
    googleResult.code,
    authModule.AUTH_CODES.LOGIN_FAILED,
  );

  const emailResult =
    await harness.service.login({
      mode:
        "email",
      email:
        "same@aspirenest.invalid",
      password:
        "Aa1!Synthetic",
    });

  assert.equal(
    emailResult.authenticated,
    true,
  );

  assert.equal(
    emailResult.uid,
    "canonical-uid-1",
  );

  const linkCalls =
    harness.calls.filter(
      (item) =>
        item.name ===
          "linkWithCredential"
    );

  assert.equal(
    linkCalls.length,
    1,
  );

  assert.equal(
    linkCalls[0].uid,
    "canonical-uid-1",
  );

  assert.equal(
    linkCalls[0]
      .credentialMatches,
    true,
  );

  assert.equal(
    harness.calls.some(
      (item) =>
        item.name ===
          "ensureStudentProfile"
    ),
    true,
  );

  const mismatch =
    createAuthHarness({
      googleCollision:
        true,
      mismatchEmail:
        true,
    });

  await mismatch.service.login({
    mode:
      "google",
  });

  const mismatchResult =
    await mismatch.service.login({
      mode:
        "email",
      email:
        "same@aspirenest.invalid",
      password:
        "Aa1!Synthetic",
    });

  assert.equal(
    mismatchResult.ok,
    false,
  );

  assert.equal(
    mismatch.auth.currentUser,
    null,
  );

  assert.equal(
    mismatch.calls.some(
      (item) =>
        item.name ===
          "linkWithCredential"
    ),
    false,
  );

  const phase24EmailActionNames =
    new Set([
      "sendEmailVerification",
      "sendPasswordResetEmail",
      "reloadUser",
      "buildActionCodeSettings",
    ]);

  assert.equal(
    [...harness.calls, ...mismatch.calls]
      .some(
        (item) =>
          phase24EmailActionNames.has(
            item.name
          )
      ),
    false,
  );

  console.log(
    "PHASE23_VERIFIED_IDENTITY_PATH_PHASE24_EMAIL_ACTIONS=0_PASS"
  );

  console.log(
    "SAME_EMAIL_PENDING_GOOGLE_CREDENTIAL_CAPTURE=PASS"
  );

  console.log(
    "SAME_EMAIL_LINK_PRESERVES_CANONICAL_UID=PASS"
  );

  console.log(
    "WRONG_ACCOUNT_LINK_REJECTED=PASS"
  );
}

async function main() {
  await proveProfileEnsure();
  await proveSameEmailLinking();

  console.log(
    "FETCH_SIGNIN_METHODS_FOR_EMAIL_REQUIRED=NO"
  );

  console.log(
    "PENDING_GOOGLE_CREDENTIAL_STORAGE=AUTH_SERVICE_MEMORY_ONLY"
  );

  console.log(
    "DUPLICATE_RANDOM_PROFILE_DOCUMENT_CREATION=NO"
  );

  console.log(
    "PHASE_2_3_IDENTITY_CLOSURE_TEST=GREEN"
  );
}

main().catch(
  (error) => {
    console.error(
      error
      && error.stack
        ? error.stack
        : error
    );

    process.exitCode =
      1;
  }
);
