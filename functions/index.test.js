"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  HttpsError,
} = require("firebase-functions/v2/https");
const functionsModule =
  require("./index.js");
const {
  STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME,
  STUDENT_ACCOUNT_REGISTRATION_ROLE,
  STUDENT_ACCOUNT_REGISTRATION_USERNAME_MIN_LENGTH,
  STUDENT_ACCOUNT_REGISTRATION_USERNAME_MAX_LENGTH,
  STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE,
  STUDENT_ACCOUNT_REGISTRATION_PASSWORD_PATTERN,
  normalizeStudentAccountRegistrationRequest,
  claimStudentRegistrationUsername,
  registerStudentAccount,
  USERNAME_COLLECTION,
  USERNAME_USERS_COLLECTION,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_RESERVED_USERNAMES,
  normalizeUsernameForIdentity,
  validateUsernameForIdentity,
  checkUsernameAvailability,
  resolveUsernamePrincipal,
  USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME,
  IDENTITY_TOOLKIT_PASSWORD_SIGNIN_URL,
  normalizeUsernamePasswordSignInRequest,
  postIdentityToolkitPasswordSignIn,
  USERNAME_SIGNIN_RATE_LIMIT_COLLECTION,
  USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS,
  USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_MAX_ATTEMPTS,
  USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_MAX_ATTEMPTS,
  USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
  USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
  normalizeUsernameSignInRateLimitOrigin,
  buildUsernameSignInRateLimitDocumentId,
  buildUsernameSignInRateLimitState,
  enforceUsernameSignInRateLimit,
  signInWithUsernameAndPassword,
  buildMockTestServerTimeResponse,
  buildMockTestLeaderboardProjection,
  buildPrivateLeaderboardId,
  buildPublicLeaderboardId,
  buildPublicLeaderboardName,
  loadOwnedSubmittedMockResult,
  shouldReplaceMockTestLeaderboardEntry,
  normalizeNotesAssetResolverRequest,
  isNotesEntitlementActive,
  notesEntitlementMatchesResource,
  resolveNotesEntitlementEvidence,
  pickNotesProtectedAssetUrl,
  loadNotesEntitlements,
  resolveNotesProtectedAsset,
} = functionsModule.__test;

const SERVER_TIME_AUTH = {
  uid: "student-1",
};

const AUTH = {
  uid: "student-1",
  token: {
    email: "student@example.com",
    name: "Rakesh Rana",
  },
};

const LEADERBOARD_DATA = {
  testId: "mock-1",
  testTitle: "CTET Mega Mock",
  leaderboardMode: "liveLeaderboard",
  studentEmail: "forged@example.com",
  email: "forged@example.com",
  uid: "forged-uid",
  studentName: "Forged Name",
  subject: "CDP",
  chapter: "Learning",
  planType: "PREMIUM",
  examType: "CTET",
  testType: "Full",
  score: 42,
  totalMarks: 50,
  percentage: 84,
  accuracy: 88,
  correctCount: 42,
  wrongCount: 5,
  skippedCount: 3,
  totalQuestions: 50,
  durationSeconds: 1200,
  attemptId: "attempt-1",
  attemptStartedAt: 1000,
  attemptSubmittedAt: 2000,
  attemptNumber: 1,
  answers: {
    question1: "A",
  },
  correctAnswer: "A",
};


const RATE_LIMIT_RAW_REQUEST = Object.freeze({
  ip: "203.0.113.8",
  socket: Object.freeze({
    remoteAddress: "203.0.113.8",
  }),
});

const RATE_LIMIT_NOW_MS =
  1_700_000_000_000;

const createUsernameFirestore = ({
  usernames = {},
  users = {},
  rateLimits = {},
} = {}) => {
  const rateLimitStore = new Map(
    Object.entries(rateLimits)
  );
  const readLog = [];
  const writeLog = [];

  const snapshotFor = (
    collectionName,
    documentId
  ) => {
    let source = {};

    if (
      collectionName ===
      USERNAME_COLLECTION
    ) {
      source = usernames;
    } else if (
      collectionName ===
      USERNAME_USERS_COLLECTION
    ) {
      source = users;
    }

    if (
      collectionName ===
      USERNAME_SIGNIN_RATE_LIMIT_COLLECTION
    ) {
      const hasRecord =
        rateLimitStore.has(
          documentId
        );
      const record = hasRecord
        ? rateLimitStore.get(
            documentId
          )
        : null;

      return {
        exists:
          hasRecord
          && record !== null,
        data: () => record,
      };
    }

    const hasRecord =
      Object.prototype.hasOwnProperty.call(
        source,
        documentId
      );
    const record = hasRecord
      ? source[documentId]
      : null;

    return {
      exists:
        hasRecord
        && record !== null,
      data: () => record,
    };
  };

  const createRef = (
    collectionName,
    documentId
  ) => ({
    __collectionName:
      collectionName,
    __documentId:
      documentId,
    get: async () => {
      readLog.push({
        collectionName,
        documentId,
        source: "direct",
      });
      return snapshotFor(
        collectionName,
        documentId
      );
    },
  });

  const firestore = {
    collection:
      (collectionName) => ({
        doc:
          (documentId) =>
            createRef(
              collectionName,
              documentId
            ),
      }),

    async runTransaction(worker) {
      const stagedWrites = [];

      const transaction = {
        async get(ref) {
          readLog.push({
            collectionName:
              ref.__collectionName,
            documentId:
              ref.__documentId,
            source:
              "transaction",
          });

          return snapshotFor(
            ref.__collectionName,
            ref.__documentId
          );
        },

        set(ref, data) {
          stagedWrites.push({
            ref,
            data,
          });
        },
      };

      const result =
        await worker(transaction);

      for (
        const {
          ref,
          data,
        }
        of stagedWrites
      ) {
        if (
          ref.__collectionName ===
            USERNAME_SIGNIN_RATE_LIMIT_COLLECTION
        ) {
          rateLimitStore.set(
            ref.__documentId,
            data
          );
        }

        writeLog.push({
          collectionName:
            ref.__collectionName,
          documentId:
            ref.__documentId,
          data,
        });
      }

      return result;
    },

    __rateLimitStore:
      rateLimitStore,
    __readLog:
      readLog,
    __writeLog:
      writeLog,
  };

  return firestore;
};



const createStudentRegistrationAuth = ({
  createError = null,
  deleteError = null,
  uid = "uid-created-001",
} = {}) => {
  const calls = [];

  return {
    calls,

    async createUser(payload) {
      calls.push({
        name:
          "createUser",
        payload,
      });

      if (createError) {
        throw createError;
      }

      return {
        uid,
      };
    },

    async deleteUser(receivedUid) {
      calls.push({
        name:
          "deleteUser",
        uid:
          receivedUid,
      });

      if (deleteError) {
        throw deleteError;
      }
    },
  };
};

test("student registration policy rejects weak password and invalid username before writes", async () => {
  assert.equal(
    STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME,
    "registerStudentAccount"
  );
  assert.equal(
    STUDENT_ACCOUNT_REGISTRATION_ROLE,
    "student"
  );
  assert.equal(
    STUDENT_ACCOUNT_REGISTRATION_USERNAME_MIN_LENGTH,
    4
  );
  assert.equal(
    STUDENT_ACCOUNT_REGISTRATION_USERNAME_MAX_LENGTH,
    24
  );
  assert.equal(
    STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE,
    "Account could not be created."
  );
  assert.equal(
    STUDENT_ACCOUNT_REGISTRATION_PASSWORD_PATTERN.test(
      "Strong1!Password"
    ),
    true
  );

  const auth =
    createStudentRegistrationAuth();
  const firestore =
    createUsernameFirestore();

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "valid_user",
          email:
            "aspirant@example.invalid",
          password:
            "weakpass",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
      && error.message.includes(
        "Account could not be created."
      )
  );

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "abc",
          email:
            "aspirant@example.invalid",
          password:
            "Strong1!Password",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
  );

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "admin",
          email:
            "aspirant@example.invalid",
          password:
            "Strong1!Password",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
  );

  assert.equal(
    auth.calls.length,
    0
  );
  assert.equal(
    firestore.__writeLog.length,
    0
  );
});

test("student registration normalizes request and ignores client role authority", () => {
  const request =
    normalizeStudentAccountRegistrationRequest({
      fullName:
        " Synthetic Aspirant ",
      username:
        " Learner One ",
      email:
        " ASPIRANT@EXAMPLE.INVALID ",
      password:
        "Strong1!Password",
      role:
        "admin",
      requestedRole:
        "mentor",
      activeRole:
        "admin",
      allowedRoles: [
        "admin",
      ],
      returnTo:
        "#admin",
      createdAt:
        "client-controlled",
    });

  assert.deepEqual(
    request,
    {
      fullName:
        "Synthetic Aspirant",
      username:
        "learner_one",
      normalizedUsername:
        "learner_one",
      email:
        "aspirant@example.invalid",
      password:
        "Strong1!Password",
      role:
        "student",
    }
  );

  assert.equal(
    Object.isFrozen(request),
    true
  );
});

test("student registration auth create failure has no username side effect", async () => {
  const auth =
    createStudentRegistrationAuth({
      createError:
        new Error(
          "EMAIL_EXISTS"
        ),
    });
  const firestore =
    createUsernameFirestore();

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "learner_one",
          email:
            "duplicate@example.invalid",
          password:
            "Strong1!Password",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
      && error.message.includes(
        "Account could not be created."
      )
  );

  assert.deepEqual(
    auth.calls.map(
      (call) => call.name
    ),
    [
      "createUser",
    ]
  );

  assert.equal(
    firestore.__writeLog.length,
    0
  );
});

test("student registration success creates auth identity then claims username with no sensitive profile fields", async () => {
  const auth =
    createStudentRegistrationAuth();
  const firestore =
    createUsernameFirestore();

  const result =
    await registerStudentAccount({
      data: {
        fullName:
          "Synthetic Aspirant",
        username:
          " Learner One ",
        email:
          "ASPIRANT@EXAMPLE.INVALID",
        password:
          "Strong1!Password",
        role:
          "admin",
      },
      adminAuth:
        auth,
      firestore,
      nowMs:
        1_700_000_000_000,
    });

  assert.deepEqual(
    result,
    {
      prepared: true,
    }
  );
  assert.equal(
    Object.isFrozen(result),
    true
  );

  assert.deepEqual(
    auth.calls.map(
      (call) => call.name
    ),
    [
      "createUser",
    ]
  );

  assert.deepEqual(
    auth.calls[0].payload,
    {
      email:
        "aspirant@example.invalid",
      password:
        "Strong1!Password",
      displayName:
        "Synthetic Aspirant",
      emailVerified:
        false,
      disabled:
        false,
    }
  );

  const usernameWrite =
    firestore.__writeLog.find(
      (write) =>
        write.collectionName ===
          USERNAME_COLLECTION
    );

  assert(usernameWrite);
  assert.equal(
    usernameWrite.documentId,
    "learner_one"
  );

  assert.deepEqual(
    Object.keys(
      usernameWrite.data
    ).sort(),
    [
      "createdAt",
      "normalizedUsername",
      "status",
      "uid",
      "updatedAt",
      "username",
    ].sort()
  );

  assert.equal(
    usernameWrite.data.uid,
    "uid-created-001"
  );
  assert.equal(
    usernameWrite.data.username,
    "learner_one"
  );
  assert.equal(
    usernameWrite.data.normalizedUsername,
    "learner_one"
  );
  assert.equal(
    usernameWrite.data.status,
    "active"
  );

  assert.equal(
    Object.hasOwn(
      usernameWrite.data,
      "email"
    ),
    false
  );
  assert.equal(
    Object.hasOwn(
      usernameWrite.data,
      "password"
    ),
    false
  );

  for (
    const forbidden
    of [
      "uid",
      "email",
      "username",
      "customToken",
      "authenticated",
    ]
  ) {
    assert.equal(
      Object.hasOwn(
        result,
        forbidden
      ),
      false
    );
  }

  assert.equal(
    firestore.__writeLog.some(
      (write) =>
        write.collectionName ===
          "users"
        || write.collectionName ===
          "students"
    ),
    false
  );
});

test("student registration username collision deletes just-created auth user", async () => {
  const auth =
    createStudentRegistrationAuth();
  const firestore =
    createUsernameFirestore({
      usernames: {
        learner_one: {
          uid:
            "uid-existing",
          status:
            "active",
        },
      },
    });

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "learner_one",
          email:
            "new@example.invalid",
          password:
            "Strong1!Password",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
      && error.message.includes(
        "Account could not be created."
      )
  );

  assert.deepEqual(
    auth.calls.map(
      (call) => call.name
    ),
    [
      "createUser",
      "deleteUser",
    ]
  );
  assert.equal(
    auth.calls[1].uid,
    "uid-created-001"
  );
});

test("student registration transaction infrastructure failure deletes just-created auth user", async () => {
  const auth =
    createStudentRegistrationAuth();

  const firestore = {
    collection() {
      return {
        doc(documentId) {
          return {
            __documentId:
              documentId,
          };
        },
      };
    },

    async runTransaction() {
      throw new Error(
        "TRANSACTION_FAILED"
      );
    },
  };

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "learner_one",
          email:
            "new@example.invalid",
          password:
            "Strong1!Password",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
  );

  assert.deepEqual(
    auth.calls.map(
      (call) => call.name
    ),
    [
      "createUser",
      "deleteUser",
    ]
  );
});

test("student registration compensation failure fails closed with neutral public error", async () => {
  const auth =
    createStudentRegistrationAuth({
      deleteError:
        new Error(
          "DELETE_FAILED_SECRET"
        ),
    });

  const firestore =
    createUsernameFirestore({
      usernames: {
        learner_one: {
          uid:
            "uid-existing",
          status:
            "active",
        },
      },
    });

  await assert.rejects(
    () =>
      registerStudentAccount({
        data: {
          fullName:
            "Synthetic Aspirant",
          username:
            "learner_one",
          email:
            "new@example.invalid",
          password:
            "Strong1!Password",
        },
        adminAuth:
          auth,
        firestore,
      }),
    (error) =>
      error instanceof HttpsError
      && error.message ===
        "Account could not be created."
      && !String(error).includes(
        "DELETE_FAILED_SECRET"
      )
  );

  assert.deepEqual(
    auth.calls.map(
      (call) => call.name
    ),
    [
      "createUser",
      "deleteUser",
    ]
  );
});

test("keeps trusted username normalization aligned with the canonical profile contract", () => {
  assert.equal(USERNAME_MIN_LENGTH, 3);
  assert.equal(USERNAME_MAX_LENGTH, 24);
  assert.equal(
    USERNAME_RESERVED_USERNAMES.has(
      "aspirenest"
    ),
    true
  );

  const vectors = [
    [" Rakesh Rana ", "rakesh_rana"],
    ["Rakesh.Rana", "rakeshrana"],
    ["Rakesh--Rana", "rakeshrana"],
    ["__Alpha___01__", "alpha_01"],
  ];
  for (const [input, expected] of vectors) {
    assert.equal(
      normalizeUsernameForIdentity(input),
      expected
    );
  }

  assert.equal(
    validateUsernameForIdentity(
      "aspirenest"
    ).reason,
    "USERNAME_RESERVED"
  );
  assert.equal(
    validateUsernameForIdentity("ab").reason,
    "USERNAME_TOO_SHORT"
  );
  assert.equal(
    validateUsernameForIdentity(
      "1learner"
    ).reason,
    "USERNAME_INVALID_FORMAT"
  );
  assert.equal(
    validateUsernameForIdentity(
      "valid_learner"
    ).ok,
    true
  );
});

test("public username availability returns only a boolean availability field", async () => {
  const firestore = createUsernameFirestore({
    usernames: {
      taken_user: {
        uid: "uid-existing",
        status: "active",
      },
    },
  });

  const available =
    await checkUsernameAvailability({
      data: { username: " New.User " },
      firestore,
    });
  const unavailable =
    await checkUsernameAvailability({
      data: { username: "taken_user" },
      firestore,
    });
  const reserved =
    await checkUsernameAvailability({
      data: { username: "admin" },
      firestore,
    });

  assert.deepEqual(available, {
    available: true,
  });
  assert.deepEqual(unavailable, {
    available: false,
  });
  assert.deepEqual(reserved, {
    available: false,
  });
  assert.deepEqual(
    Object.keys(available),
    ["available"]
  );
  assert.equal(Object.isFrozen(available), true);
});

test("trusted username principal resolver follows username UID to canonical user email", async () => {
  const firestore = createUsernameFirestore({
    usernames: {
      learner_one: {
        uid: "uid-1",
        status: "active",
      },
      inactive_one: {
        uid: "uid-2",
        status: "blocked",
      },
      blank_uid: {
        uid: "",
        status: "active",
      },
    },
    users: {
      "uid-1": {
        normalizedEmail:
          "Learner@One.Example",
      },
      "uid-2": {
        normalizedEmail:
          "blocked@example.invalid",
      },
    },
  });

  const principal =
    await resolveUsernamePrincipal({
      username: " Learner One ",
      firestore,
    });
  assert.deepEqual(principal, {
    uid: "uid-1",
    email: "learner@one.example",
    username: "learner_one",
  });
  assert.equal(Object.isFrozen(principal), true);

  assert.equal(
    await resolveUsernamePrincipal({
      username: "inactive_one",
      firestore,
    }),
    null
  );
  assert.equal(
    await resolveUsernamePrincipal({
      username: "blank_uid",
      firestore,
    }),
    null
  );
  assert.equal(
    await resolveUsernamePrincipal({
      username: "missing_user",
      firestore,
    }),
    null
  );
});

test("trusted username principal resolver is not exposed as a public callable", () => {
  assert.equal(
    Object.hasOwn(
      functionsModule,
      "checkUsernameAvailability"
    ),
    true
  );
  assert.equal(
    Object.hasOwn(
      functionsModule,
      "resolveUsernamePrincipal"
    ),
    false
  );
});

test("normalizes trusted username-password sign-in request without changing password bytes", () => {
  const request =
    normalizeUsernamePasswordSignInRequest({
      username: " Learner_One ",
      password: "  Keep These Spaces  ",
      apiKey: "synthetic-web-api-key",
    });

  assert.deepEqual(request, {
    username: "Learner_One",
    password: "  Keep These Spaces  ",
    apiKey: "synthetic-web-api-key",
  });
  assert.equal(Object.isFrozen(request), true);

  assert.throws(
    () =>
      normalizeUsernamePasswordSignInRequest({
        username: "",
        password: "password-value",
        apiKey: "synthetic-web-api-key",
      }),
    (error) =>
      error instanceof HttpsError
      && error.code === "invalid-argument"
  );
});

test("builds deterministic privacy-preserving username sign-in rate-limit keys", () => {
  assert.equal(
    USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS,
    600000
  );
  assert.equal(
    USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_MAX_ATTEMPTS,
    60
  );
  assert.equal(
    USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_MAX_ATTEMPTS,
    10
  );

  const origin =
    normalizeUsernameSignInRateLimitOrigin({
      ip: " 203.0.113.8 ",
      socket: {
        remoteAddress:
          "198.51.100.10",
      },
    });

  assert.equal(
    origin,
    "203.0.113.8"
  );

  const originKey =
    buildUsernameSignInRateLimitDocumentId({
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
      origin,
    });

  const pairKey =
    buildUsernameSignInRateLimitDocumentId({
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
      origin,
      normalizedUsername:
        " Learner One ",
    });

  assert.match(
    originKey,
    /^[a-f0-9]{64}$/
  );
  assert.match(
    pairKey,
    /^[a-f0-9]{64}$/
  );
  assert.notEqual(
    originKey,
    pairKey
  );

  const pairKeyAgain =
    buildUsernameSignInRateLimitDocumentId({
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
      origin:
        "203.0.113.8",
      normalizedUsername:
        "learner_one",
    });

  assert.equal(
    pairKey,
    pairKeyAgain
  );
  assert.equal(
    pairKey.includes(
      "203.0.113.8"
    ),
    false
  );
  assert.equal(
    pairKey.includes(
      "learner_one"
    ),
    false
  );
});

test("username sign-in rate limiter enforces origin and origin-identifier windows without storing raw identifiers", async () => {
  const firestore =
    createUsernameFirestore();

  for (
    let attempt = 1;
    attempt <= 2;
    attempt += 1
  ) {
    const result =
      await enforceUsernameSignInRateLimit({
        rawRequest:
          RATE_LIMIT_RAW_REQUEST,
        username:
          " Learner One ",
        firestore,
        nowMs:
          RATE_LIMIT_NOW_MS,
        originLimit: 3,
        originIdentifierLimit: 2,
      });

    assert.deepEqual(
      result,
      {
        allowed: true,
      }
    );
  }

  await assert.rejects(
    () =>
      enforceUsernameSignInRateLimit({
        rawRequest:
          RATE_LIMIT_RAW_REQUEST,
        username:
          "learner_one",
        firestore,
        nowMs:
          RATE_LIMIT_NOW_MS,
        originLimit: 3,
        originIdentifierLimit: 2,
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "resource-exhausted"
      && error.message.includes(
        "Sign-in could not be completed."
      )
  );

  assert.equal(
    firestore.__rateLimitStore.size,
    2
  );

  for (
    const record
    of firestore.__rateLimitStore.values()
  ) {
    assert.deepEqual(
      Object.keys(record).sort(),
      [
        "count",
        "expiresAt",
        "scope",
        "updatedAt",
        "windowStartedAt",
      ].sort()
    );
    assert.equal(
      Object.hasOwn(
        record,
        "ip"
      ),
      false
    );
    assert.equal(
      Object.hasOwn(
        record,
        "username"
      ),
      false
    );
    assert.equal(
      Object.hasOwn(
        record,
        "email"
      ),
      false
    );
    assert.equal(
      Object.hasOwn(
        record,
        "uid"
      ),
      false
    );
  }
});

test("username sign-in rate limiter resets the same stable documents after window expiry", async () => {
  const firestore =
    createUsernameFirestore();

  await enforceUsernameSignInRateLimit({
    rawRequest:
      RATE_LIMIT_RAW_REQUEST,
    username:
      "learner_one",
    firestore,
    nowMs:
      RATE_LIMIT_NOW_MS,
    originLimit: 2,
    originIdentifierLimit: 1,
  });

  const documentIdsBefore =
    Array.from(
      firestore.__rateLimitStore.keys()
    ).sort();

  await assert.rejects(
    () =>
      enforceUsernameSignInRateLimit({
        rawRequest:
          RATE_LIMIT_RAW_REQUEST,
        username:
          "learner_one",
        firestore,
        nowMs:
          RATE_LIMIT_NOW_MS,
        originLimit: 2,
        originIdentifierLimit: 1,
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "resource-exhausted"
  );

  await enforceUsernameSignInRateLimit({
    rawRequest:
      RATE_LIMIT_RAW_REQUEST,
    username:
      "learner_one",
    firestore,
    nowMs:
      RATE_LIMIT_NOW_MS
      + USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS
      + 1,
    originLimit: 2,
    originIdentifierLimit: 1,
  });

  const documentIdsAfter =
    Array.from(
      firestore.__rateLimitStore.keys()
    ).sort();

  assert.deepEqual(
    documentIdsAfter,
    documentIdsBefore
  );

  for (
    const record
    of firestore.__rateLimitStore.values()
  ) {
    assert.equal(
      record.count,
      1
    );
  }
});

test("username sign-in rate limiter fails closed when trusted origin context is missing", async () => {
  const firestore =
    createUsernameFirestore();

  await assert.rejects(
    () =>
      enforceUsernameSignInRateLimit({
        rawRequest: {},
        username:
          "learner_one",
        firestore,
        nowMs:
          RATE_LIMIT_NOW_MS,
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "resource-exhausted"
      && error.message.includes(
        "Sign-in could not be completed."
      )
  );

  assert.equal(
    firestore.__rateLimitStore.size,
    0
  );
});

test("username sign-in rate limit is evaluated before private resolver and password verification", async () => {
  const origin =
    normalizeUsernameSignInRateLimitOrigin(
      RATE_LIMIT_RAW_REQUEST
    );
  const normalizedUsername =
    normalizeUsernameForIdentity(
      "learner_one"
    );

  const originKey =
    buildUsernameSignInRateLimitDocumentId({
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
      origin,
    });
  const pairKey =
    buildUsernameSignInRateLimitDocumentId({
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
      origin,
      normalizedUsername,
    });

  const activeWindow = {
    count:
      USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_MAX_ATTEMPTS,
    windowStartedAt: {
      toMillis: () =>
        RATE_LIMIT_NOW_MS,
    },
    updatedAt: {
      toMillis: () =>
        RATE_LIMIT_NOW_MS,
    },
    expiresAt: {
      toMillis: () =>
        RATE_LIMIT_NOW_MS
        + USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS,
    },
  };

  const firestore =
    createUsernameFirestore({
      usernames: {
        learner_one: {
          uid: "uid-1",
          status: "active",
        },
      },
      users: {
        "uid-1": {
          normalizedEmail:
            "learner.one@example.invalid",
        },
      },
      rateLimits: {
        [originKey]: {
          ...activeWindow,
          scope:
            USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
          count: 1,
        },
        [pairKey]: {
          ...activeWindow,
          scope:
            USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
        },
      },
    });

  let fetchCalls = 0;
  let verifyCalls = 0;

  await assert.rejects(
    () =>
      signInWithUsernameAndPassword({
        data: {
          username:
            "learner_one",
          password:
            "password-value",
          apiKey:
            "synthetic-web-api-key",
        },
        rawRequest:
          RATE_LIMIT_RAW_REQUEST,
        firestore,
        adminAuth: {
          async verifyIdToken() {
            verifyCalls += 1;
            return {
              uid: "uid-1",
            };
          },
          async createCustomToken() {
            return "must-not-run";
          },
        },
        fetchFn: async () => {
          fetchCalls += 1;
          return {
            ok: false,
            async json() {
              return {};
            },
          };
        },
        nowMs:
          RATE_LIMIT_NOW_MS,
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "resource-exhausted"
  );

  assert.equal(
    fetchCalls,
    0
  );
  assert.equal(
    verifyCalls,
    0
  );

  assert.equal(
    firestore.__readLog.some(
      (entry) =>
        entry.collectionName ===
          USERNAME_COLLECTION
    ),
    false
  );
});

test("builds active username rate-limit state without mutating existing record", () => {
  const snapshot = {
    exists: true,
    data: () => ({
      count: 4,
      windowStartedAt: {
        toMillis: () =>
          RATE_LIMIT_NOW_MS - 1000,
      },
      expiresAt: {
        toMillis: () =>
          RATE_LIMIT_NOW_MS + 1000,
      },
    }),
  };

  const state =
    buildUsernameSignInRateLimitState({
      snapshot,
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
      limit: 5,
      nowMs:
        RATE_LIMIT_NOW_MS,
    });

  assert.deepEqual(
    state,
    {
      blocked: false,
      scope:
        USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
      count: 5,
      windowStartedAtMs:
        RATE_LIMIT_NOW_MS - 1000,
      expiresAtMs:
        RATE_LIMIT_NOW_MS + 1000,
    }
  );
  assert.equal(
    Object.isFrozen(state),
    true
  );
});

test("trusted username-password bridge verifies password result against current project and returns custom token only", async () => {
  const firestore = createUsernameFirestore({
    usernames: {
      learner_one: {
        uid: "uid-1",
        status: "active",
      },
    },
    users: {
      "uid-1": {
        normalizedEmail:
          "learner.one@example.invalid",
      },
    },
  });

  const fetchCalls = [];
  const fetchFn = async (url, options) => {
    fetchCalls.push({
      url,
      options,
    });

    return {
      ok: true,
      async json() {
        return {
          idToken: "synthetic-id-token",
          localId: "uid-1",
          email:
            "learner.one@example.invalid",
        };
      },
    };
  };

  const adminCalls = [];
  const adminAuth = {
    async verifyIdToken(idToken) {
      adminCalls.push({
        name: "verifyIdToken",
        idToken,
      });
      return {
        uid: "uid-1",
      };
    },
    async createCustomToken(uid) {
      adminCalls.push({
        name: "createCustomToken",
        uid,
      });
      return "synthetic-custom-token";
    },
  };

  const result =
    await signInWithUsernameAndPassword({
      data: {
        username: " Learner One ",
        password: "password-value",
        apiKey: "synthetic-web-api-key",
      },
      rawRequest:
        RATE_LIMIT_RAW_REQUEST,
      firestore,
      adminAuth,
      fetchFn,
      nowMs:
        RATE_LIMIT_NOW_MS,
    });

  assert.deepEqual(result, {
    customToken:
      "synthetic-custom-token",
  });
  assert.deepEqual(
    Object.keys(result),
    ["customToken"]
  );
  assert.equal(Object.isFrozen(result), true);
  assert.equal(fetchCalls.length, 1);
  assert.equal(
    fetchCalls[0].url,
    `${IDENTITY_TOOLKIT_PASSWORD_SIGNIN_URL}`
      + "?key=synthetic-web-api-key"
  );
  assert.deepEqual(
    JSON.parse(
      fetchCalls[0].options.body
    ),
    {
      email:
        "learner.one@example.invalid",
      password: "password-value",
      returnSecureToken: true,
    }
  );
  assert.deepEqual(adminCalls, [
    {
      name: "verifyIdToken",
      idToken: "synthetic-id-token",
    },
    {
      name: "createCustomToken",
      uid: "uid-1",
    },
  ]);
});

test("trusted username-password bridge fails closed on project or UID mismatch", async () => {
  const firestore = createUsernameFirestore({
    usernames: {
      learner_one: {
        uid: "uid-1",
        status: "active",
      },
    },
    users: {
      "uid-1": {
        normalizedEmail:
          "learner.one@example.invalid",
      },
    },
  });

  let customTokenCalls = 0;
  const adminAuth = {
    async verifyIdToken() {
      return {
        uid: "other-project-uid",
      };
    },
    async createCustomToken() {
      customTokenCalls += 1;
      return "must-not-be-created";
    },
  };

  await assert.rejects(
    () =>
      signInWithUsernameAndPassword({
        data: {
          username: "learner_one",
          password: "password-value",
          apiKey: "synthetic-web-api-key",
        },
        rawRequest:
          RATE_LIMIT_RAW_REQUEST,
        firestore,
        adminAuth,
        nowMs:
          RATE_LIMIT_NOW_MS,
        fetchFn: async () => ({
          ok: true,
          async json() {
            return {
              idToken:
                "synthetic-id-token",
              localId: "uid-1",
            };
          },
        }),
      }),
    (error) =>
      error instanceof HttpsError
      && error.code === "unauthenticated"
      && error.message.includes(
        "Sign-in could not be completed."
      )
  );

  assert.equal(customTokenCalls, 0);
});

test("trusted username-password bridge does not expose username principal resolver publicly", () => {
  assert.equal(
    USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME,
    "signInWithUsernameAndPassword"
  );
  assert.equal(
    typeof postIdentityToolkitPasswordSignIn,
    "function"
  );
  assert.equal(
    Object.hasOwn(
      functionsModule,
      "signInWithUsernameAndPassword"
    ),
    true
  );
  assert.equal(
    Object.hasOwn(
      functionsModule,
      "resolveUsernamePrincipal"
    ),
    false
  );
});

test("returns the minimal authenticated server-time response", () => {
  const result =
    buildMockTestServerTimeResponse({
      auth: SERVER_TIME_AUTH,
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-1",
      },
      now: () => 123456,
      makeRequestId: () => "clock-1",
    });

  assert.deepEqual(result, {
    source: "server",
    serverNowMs: 123456,
    requestId: "clock-1",
    authenticated: true,
    uid: "student-1",
  });
  assert.equal(
    Object.isFrozen(result),
    true
  );
});

test("rejects an unauthenticated server-time request", () => {
  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        data: {
          purpose: "mock_test_attempt",
          testId: "mock-1",
        },
      }),
    (error) =>
      error instanceof HttpsError &&
      error.code === "unauthenticated"
  );
});

test("rejects unsupported purpose and missing test id", () => {
  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: SERVER_TIME_AUTH,
        data: {
          purpose: "other",
          testId: "mock-1",
        },
      }),
    (error) =>
      error.code ===
      "invalid-argument"
  );

  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: SERVER_TIME_AUTH,
        data: {
          purpose: "mock_test_submit",
          testId: "",
        },
      }),
    (error) =>
      error.code ===
      "invalid-argument"
  );
});

test("never accepts a client supplied timestamp", () => {
  const result =
    buildMockTestServerTimeResponse({
      auth: SERVER_TIME_AUTH,
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-1",
        serverNowMs: 1,
      },
      now: () => 999999,
      makeRequestId: () => "clock-2",
    });

  assert.equal(
    result.serverNowMs,
    999999
  );
});

test("builds separate private and public-safe leaderboard records", () => {
  const projection =
    buildMockTestLeaderboardProjection({
      auth: AUTH,
      data: LEADERBOARD_DATA,
      now: () => 123456789,
    });

  assert.equal(
    projection.privateRecord.ownerUid,
    AUTH.uid
  );
  assert.equal(
    projection.privateRecord.ownerEmail,
    AUTH.token.email
  );
  assert.equal(
    projection.privateRecord.studentEmail,
    AUTH.token.email
  );
  assert.equal(
    projection.privateRecord.studentName,
    AUTH.token.name
  );
  assert.equal(
    projection.publicRecord.displayName,
    "Rakesh R."
  );
  assert.equal(
    projection.publicRecord.testId,
    "mock-1"
  );
  assert.equal(
    projection.publicRecord.score,
    42
  );
  assert.equal(
    projection.publicRecord.publicEntryId,
    projection.publicEntryId
  );

  [
    "uid",
    "ownerUid",
    "email",
    "ownerEmail",
    "studentEmail",
    "studentName",
    "attemptId",
    "attemptStartedAt",
    "attemptSubmittedAt",
    "answers",
    "correctAnswer",
    "leaderboardKey",
    "privateEntryId",
  ].forEach((field) => {
    assert.equal(
      Object.hasOwn(
        projection.publicRecord,
        field
      ),
      false,
      `Public projection exposed ${field}`
    );
  });

  assert.equal(
    Object.isFrozen(
      projection.privateRecord
    ),
    true
  );
  assert.equal(
    Object.isFrozen(
      projection.publicRecord
    ),
    true
  );
});

test("derives deterministic opaque private and public document ids", () => {
  const input = {
    uid: "student-1",
    testId: "mock-1",
    leaderboardMode: "liveleaderboard",
  };

  const privateId =
    buildPrivateLeaderboardId(input);
  const publicId =
    buildPublicLeaderboardId(input);

  assert.match(
    privateId,
    /^[a-f0-9]{64}$/
  );
  assert.match(
    publicId,
    /^[a-f0-9]{64}$/
  );
  assert.notEqual(
    privateId,
    publicId
  );
  assert.equal(
    buildPrivateLeaderboardId(input),
    privateId
  );
  assert.equal(
    buildPublicLeaderboardId(input),
    publicId
  );
});

test("masks public names at the server boundary", () => {
  assert.equal(
    buildPublicLeaderboardName(
      "Rakesh Rana"
    ),
    "Rakesh R."
  );
  assert.equal(
    buildPublicLeaderboardName(
      "student@example.com"
    ),
    "st***"
  );
  assert.equal(
    buildPublicLeaderboardName(
      "LongStudentName"
    ),
    "LongSt…"
  );
});

test("rejects unauthenticated and disabled leaderboard submissions", () => {
  assert.throws(
    () =>
      buildMockTestLeaderboardProjection({
        data: LEADERBOARD_DATA,
      }),
    (error) =>
      error.code ===
      "unauthenticated"
  );

  assert.throws(
    () =>
      buildMockTestLeaderboardProjection({
        auth: AUTH,
        data: {
          ...LEADERBOARD_DATA,
          leaderboardMode: "disabled",
        },
      }),
    (error) =>
      error.code ===
      "failed-precondition"
  );
});

test("replaces only the same attempt or a better ranked result", () => {
  const existing = {
    attemptId: "attempt-1",
    rankScore: 80,
    rankTieBreakerScore: 40,
  };

  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-1",
        rankScore: 70,
        rankTieBreakerScore: 35,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 81,
        rankTieBreakerScore: 39,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 80,
        rankTieBreakerScore: 41,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 79,
        rankTieBreakerScore: 100,
      }
    ),
    false
  );
});


test("requires an owned submitted result before projection writes", async () => {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({
      docs: [
        {
          id: "result-1",
          data: () => ({
            attemptKey:
              "attempt-1",
            attemptId:
              "attempt-1",
            testId: "mock-1",
            email:
              "student@example.com",
            score: 42,
          }),
        },
      ],
    }),
  };
  const firestore = {
    collection: (name) => {
      assert.equal(
        name,
        "mockResults"
      );
      return queryChain;
    },
  };

  const owned =
    await loadOwnedSubmittedMockResult({
      auth: AUTH,
      data: LEADERBOARD_DATA,
      firestore,
    });

  assert.equal(
    owned.uid,
    "student-1"
  );
  assert.equal(
    owned.result.id,
    "result-1"
  );
  assert.equal(
    owned.result.score,
    42
  );
});

test("fails closed when no owned submitted result matches", async () => {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({
      docs: [],
    }),
  };
  const firestore = {
    collection: () => queryChain,
  };

  await assert.rejects(
    () =>
      loadOwnedSubmittedMockResult({
        auth: AUTH,
        data: LEADERBOARD_DATA,
        firestore,
      }),
    (error) =>
      error.code ===
      "failed-precondition"
  );
});

const NOTES_AUTH = {
  uid: "student-notes-1",
  token: {
    email: "notes@example.com",
    name: "Notes Learner",
  },
};

const NOTES_NOW = 1_800_000_000_000;

const PUBLISHED_NOTE = Object.freeze({
  id: "note-1",
  section: "notes",
  module: "notes",
  itemType: "notesPdf",
  planType: "PREMIUM",
  accessRank: 2,
  status: "Published",
  hasProtectedAsset: true,
});

const PUBLISHED_ASSET = Object.freeze({
  id: "note-1",
  contentId: "note-1",
  section: "notes",
  status: "published",
  urls: {
    pdfUrl:
      "https://assets.example.com/note-1.pdf",
    downloadUrl:
      "https://assets.example.com/note-1-download.pdf",
  },
});

const buildNotesEntitlement = (
  overrides = {}
) => ({
  id: "item-notes-note-1",
  uid: NOTES_AUTH.uid,
  email: NOTES_AUTH.token.email,
  normalizedEmail:
    NOTES_AUTH.token.email,
  status: "active",
  scopeType: "item",
  module: "notes",
  itemType: "notesPdf",
  itemId: "note-1",
  itemIds: [],
  planType: "PREMIUM",
  planCode: "PREMIUM",
  accessRank: 2,
  accessFrom: NOTES_NOW - 10_000,
  accessUntil: NOTES_NOW + 10_000,
  ...overrides,
});

const createDocumentSnapshot = (
  id,
  value
) => ({
  id,
  exists: Boolean(value),
  data: () => value || undefined,
});

const createNotesFirestore = ({
  note = PUBLISHED_NOTE,
  asset = PUBLISHED_ASSET,
  entitlements = [
    buildNotesEntitlement(),
  ],
  reads = [],
} = {}) => ({
  collection: (name) => {
    reads.push(["collection", name]);

    if (name === "contentItems") {
      return {
        doc: (id) => ({
          get: async () => {
            reads.push([
              "document",
              name,
              id,
            ]);
            return createDocumentSnapshot(
              id,
              note
            );
          },
        }),
      };
    }

    if (name === "protectedContentAssets") {
      return {
        doc: (id) => ({
          get: async () => {
            reads.push([
              "document",
              name,
              id,
            ]);
            return createDocumentSnapshot(
              id,
              asset
            );
          },
        }),
      };
    }

    if (name === "studentEntitlements") {
      return {
        doc: (uid) => ({
          collection: (childName) => ({
            get: async () => {
              reads.push([
                "subcollection",
                name,
                uid,
                childName,
              ]);
              return {
                docs: entitlements.map(
                  (record, index) => ({
                    id:
                      record.id ||
                      `entitlement-${index + 1}`,
                    data: () => record,
                  })
                ),
              };
            },
          }),
        }),
      };
    }

    throw new Error(
      `Unexpected collection ${name}`
    );
  },
});

test("normalizes the minimal authenticated Notes asset request", () => {
  const request =
    normalizeNotesAssetResolverRequest({
      auth: NOTES_AUTH,
      data: {
        noteId: " note-1 ",
        action: " download ",
        pdfUrl:
          "https://forged.example/file.pdf",
        planType: "MENTORSHIP",
        entitlementId: "forged",
      },
    });

  assert.deepEqual(request, {
    uid: NOTES_AUTH.uid,
    email: NOTES_AUTH.token.email,
    tokenName: "Notes Learner",
    noteId: "note-1",
    action: "DOWNLOAD",
  });
  assert.equal(
    Object.hasOwn(request, "pdfUrl"),
    false
  );
  assert.equal(Object.isFrozen(request), true);
});

test("rejects unauthenticated, missing, and unsupported Notes asset requests", () => {
  assert.throws(
    () =>
      normalizeNotesAssetResolverRequest({
        data: {
          noteId: "note-1",
          action: "OPEN",
        },
      }),
    (error) =>
      error.code === "unauthenticated"
  );

  assert.throws(
    () =>
      normalizeNotesAssetResolverRequest({
        auth: NOTES_AUTH,
        data: {
          noteId: "",
          action: "OPEN",
        },
      }),
    (error) =>
      error.code === "invalid-argument"
  );

  assert.throws(
    () =>
      normalizeNotesAssetResolverRequest({
        auth: NOTES_AUTH,
        data: {
          noteId: "note-1",
          action: "DELETE",
        },
      }),
    (error) =>
      error.code === "invalid-argument"
  );
});

test("accepts only active principal-bound entitlement windows", () => {
  assert.equal(
    isNotesEntitlementActive(
      buildNotesEntitlement(),
      {
        uid: NOTES_AUTH.uid,
        email: NOTES_AUTH.token.email,
        nowMs: NOTES_NOW,
      }
    ),
    true
  );

  assert.equal(
    isNotesEntitlementActive(
      buildNotesEntitlement({
        status: "verified",
        accessUntil: null,
      }),
      {
        uid: NOTES_AUTH.uid,
        email: NOTES_AUTH.token.email,
        nowMs: NOTES_NOW,
      }
    ),
    true
  );
});

test("fails closed for blocked, future, expired, malformed, or cross-user entitlements", () => {
  const options = {
    uid: NOTES_AUTH.uid,
    email: NOTES_AUTH.token.email,
    nowMs: NOTES_NOW,
  };

  [
    buildNotesEntitlement({
      status: "blocked",
    }),
    buildNotesEntitlement({
      accessFrom: NOTES_NOW + 1,
    }),
    buildNotesEntitlement({
      accessUntil: NOTES_NOW - 1,
    }),
    buildNotesEntitlement({
      accessUntil: "not-a-date",
    }),
    buildNotesEntitlement({
      uid: "student-other",
    }),
    buildNotesEntitlement({
      email: "other@example.com",
      normalizedEmail:
        "other@example.com",
    }),
  ].forEach((record) => {
    assert.equal(
      isNotesEntitlementActive(
        record,
        options
      ),
      false
    );
  });
});

test("matches only the exact Notes ITEM resource", () => {
  assert.equal(
    notesEntitlementMatchesResource({
      record: buildNotesEntitlement(),
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );

  assert.equal(
    notesEntitlementMatchesResource({
      record: buildNotesEntitlement({
        itemId: "note-2",
      }),
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
});

test("matches BUNDLE access only when the bundle contains the note", () => {
  const bundle = buildNotesEntitlement({
    scopeType: "bundle",
    itemId: "",
    itemIds: ["note-1", "note-2"],
    bundleId: "bundle-1",
  });

  assert.equal(
    notesEntitlementMatchesResource({
      record: bundle,
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );

  assert.equal(
    notesEntitlementMatchesResource({
      record: {
        ...bundle,
        itemIds: ["note-2"],
      },
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
});

test("requires sufficient plan rank for MODULE and PLAN access", () => {
  const moduleAccess =
    buildNotesEntitlement({
      scopeType: "module",
      itemId: "",
      accessRank: 2,
    });
  const planAccess =
    buildNotesEntitlement({
      scopeType: "plan",
      module: "",
      itemId: "",
      accessRank: 3,
    });

  assert.equal(
    notesEntitlementMatchesResource({
      record: moduleAccess,
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );
  assert.equal(
    notesEntitlementMatchesResource({
      record: planAccess,
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );

  assert.equal(
    notesEntitlementMatchesResource({
      record: {
        ...moduleAccess,
        accessRank: 1,
      },
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
  assert.equal(
    notesEntitlementMatchesResource({
      record: {
        ...planAccess,
        accessRank: 1,
      },
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
});

test("resolves FREE Notes without an entitlement", () => {
  const evidence =
    resolveNotesEntitlementEvidence({
      note: {
        ...PUBLISHED_NOTE,
        planType: "FREE",
        accessRank: 0,
      },
      noteId: "note-1",
      entitlements: [],
      uid: NOTES_AUTH.uid,
      email: NOTES_AUTH.token.email,
      nowMs: NOTES_NOW,
    });

  assert.deepEqual(evidence, {
    allowed: true,
    scopeType: "free",
    entitlementId: null,
  });
});

test("prioritizes ITEM over BUNDLE, MODULE, and PLAN evidence", () => {
  const evidence =
    resolveNotesEntitlementEvidence({
      note: PUBLISHED_NOTE,
      noteId: "note-1",
      entitlements: [
        buildNotesEntitlement({
          id: "plan-premium",
          scopeType: "plan",
          module: "",
          itemId: "",
        }),
        buildNotesEntitlement({
          id: "module-notes",
          scopeType: "module",
          itemId: "",
        }),
        buildNotesEntitlement({
          id: "bundle-notes",
          scopeType: "bundle",
          itemId: "",
          itemIds: ["note-1"],
        }),
        buildNotesEntitlement({
          id: "item-note-1",
        }),
      ],
      uid: NOTES_AUTH.uid,
      email: NOTES_AUTH.token.email,
      nowMs: NOTES_NOW,
    });

  assert.equal(evidence.allowed, true);
  assert.equal(evidence.scopeType, "item");
  assert.equal(
    evidence.entitlementId,
    "item-note-1"
  );
});

test("denies when no active entitlement matches the note", () => {
  const evidence =
    resolveNotesEntitlementEvidence({
      note: PUBLISHED_NOTE,
      noteId: "note-1",
      entitlements: [
        buildNotesEntitlement({
          itemId: "note-2",
        }),
        buildNotesEntitlement({
          status: "expired",
        }),
      ],
      uid: NOTES_AUTH.uid,
      email: NOTES_AUTH.token.email,
      nowMs: NOTES_NOW,
    });

  assert.deepEqual(evidence, {
    allowed: false,
    scopeType: "",
    entitlementId: null,
  });
});

test("selects action-aware HTTPS URLs from the protected asset only", () => {
  assert.equal(
    pickNotesProtectedAssetUrl({
      asset: PUBLISHED_ASSET,
      action: "OPEN",
    }),
    PUBLISHED_ASSET.urls.pdfUrl
  );
  assert.equal(
    pickNotesProtectedAssetUrl({
      asset: PUBLISHED_ASSET,
      action: "DOWNLOAD",
    }),
    PUBLISHED_ASSET.urls.downloadUrl
  );
  assert.equal(
    pickNotesProtectedAssetUrl({
      asset: {
        pdfUrl:
          "https://top-level.invalid/file.pdf",
        urls: {
          pdfUrl:
            "http://insecure.invalid/file.pdf",
        },
      },
      action: "OPEN",
    }),
    ""
  );
});

test("loads entitlement projections only from the authenticated UID path", async () => {
  const reads = [];
  const firestore = createNotesFirestore({
    reads,
  });

  const records = await loadNotesEntitlements({
    firestore,
    uid: NOTES_AUTH.uid,
  });

  assert.equal(records.length, 1);
  assert.equal(
    records[0].itemId,
    "note-1"
  );
  assert.deepEqual(
    reads.find(
      (entry) =>
        entry[0] === "subcollection"
    ),
    [
      "subcollection",
      "studentEntitlements",
      NOTES_AUTH.uid,
      "items",
    ]
  );
});

test("resolves an exact ITEM grant with a minimal server-authorized response", async () => {
  const result =
    await resolveNotesProtectedAsset({
      auth: NOTES_AUTH,
      data: {
        noteId: "note-1",
        action: "OPEN",
        pdfUrl:
          "https://forged.invalid/file.pdf",
        uid: "forged-user",
        planType: "MENTORSHIP",
      },
      firestore: createNotesFirestore(),
      now: () => NOTES_NOW,
      makeRequestId: () =>
        "notes-request-1",
    });

  assert.deepEqual(result, {
    authorized: true,
    source: "server_authorized",
    noteId: "note-1",
    action: "OPEN",
    assetUrl:
      PUBLISHED_ASSET.urls.pdfUrl,
    accessScope: "item",
    serverNowMs: NOTES_NOW,
    requestId: "notes-request-1",
  });
  assert.equal(
    Object.hasOwn(result, "uid"),
    false
  );
  assert.equal(
    Object.hasOwn(result, "email"),
    false
  );
  assert.equal(
    Object.hasOwn(result, "entitlementId"),
    false
  );
});

test("resolves BUNDLE access for a contained Notes item", async () => {
  const result =
    await resolveNotesProtectedAsset({
      auth: NOTES_AUTH,
      data: {
        noteId: "note-1",
        action: "READ",
      },
      firestore: createNotesFirestore({
        entitlements: [
          buildNotesEntitlement({
            scopeType: "bundle",
            itemId: "",
            itemIds: ["note-1"],
            bundleId: "bundle-1",
          }),
        ],
      }),
      now: () => NOTES_NOW,
      makeRequestId: () =>
        "notes-request-2",
    });

  assert.equal(result.accessScope, "bundle");
  assert.equal(result.action, "READ");
});

test("resolves sufficient MODULE and PLAN access", async () => {
  for (const [scopeType, moduleName] of [
    ["module", "notes"],
    ["plan", ""],
  ]) {
    const result =
      await resolveNotesProtectedAsset({
        auth: NOTES_AUTH,
        data: {
          noteId: "note-1",
          action: "DOWNLOAD",
        },
        firestore: createNotesFirestore({
          entitlements: [
            buildNotesEntitlement({
              scopeType,
              module: moduleName,
              itemId: "",
              accessRank: 3,
            }),
          ],
        }),
        now: () => NOTES_NOW,
        makeRequestId: () =>
          `notes-${scopeType}`,
      });

    assert.equal(
      result.accessScope,
      scopeType
    );
    assert.equal(
      result.assetUrl,
      PUBLISHED_ASSET.urls.downloadUrl
    );
  }
});

test("resolves authenticated FREE Notes without reading entitlements", async () => {
  const reads = [];
  const result =
    await resolveNotesProtectedAsset({
      auth: NOTES_AUTH,
      data: {
        noteId: "note-1",
        action: "OPEN",
      },
      firestore: createNotesFirestore({
        note: {
          ...PUBLISHED_NOTE,
          planType: "FREE",
          accessRank: 0,
        },
        entitlements: [],
        reads,
      }),
      now: () => NOTES_NOW,
      makeRequestId: () =>
        "notes-free",
    });

  assert.equal(result.accessScope, "free");
  assert.equal(
    reads.some(
      (entry) =>
        entry[0] === "subcollection"
    ),
    false
  );
});

test("trusted AspireNest Admin resolves published Notes without learner entitlement reads", async () => {
  const reads = [];
  const result = await resolveNotesProtectedAsset({
    auth: {
      uid: "aspirenest-admin",
      token: {
        email: "aspirenestplatform@gmail.com",
        name: "AspireNest Admin",
      },
    },
    data: {
      noteId: "note-1",
      action: "OPEN",
    },
    firestore: createNotesFirestore({
      entitlements: [],
      reads,
    }),
    now: () => NOTES_NOW,
    makeRequestId: () => "notes-admin",
  });

  assert.equal(result.accessScope, "admin");
  assert.equal(result.assetUrl, PUBLISHED_ASSET.urls.pdfUrl);
  assert.equal(
    reads.some((entry) => entry[0] === "subcollection"),
    false
  );
});

test("rejects missing, non-Notes, and unpublished catalog records", async () => {
  for (const note of [
    null,
    {
      ...PUBLISHED_NOTE,
      section: "video",
    },
    {
      ...PUBLISHED_NOTE,
      status: "Draft",
    },
  ]) {
    await assert.rejects(
      () =>
        resolveNotesProtectedAsset({
          auth: NOTES_AUTH,
          data: {
            noteId: "note-1",
            action: "OPEN",
          },
          firestore: createNotesFirestore({
            note,
          }),
          now: () => NOTES_NOW,
          makeRequestId: () =>
            "notes-denied",
        }),
      (error) =>
        [
          "not-found",
          "failed-precondition",
        ].includes(error.code)
    );
  }
});

test("rejects missing, mismatched, and unpublished protected assets", async () => {
  for (const asset of [
    null,
    {
      ...PUBLISHED_ASSET,
      contentId: "note-2",
    },
    {
      ...PUBLISHED_ASSET,
      status: "draft",
    },
  ]) {
    await assert.rejects(
      () =>
        resolveNotesProtectedAsset({
          auth: NOTES_AUTH,
          data: {
            noteId: "note-1",
            action: "OPEN",
          },
          firestore: createNotesFirestore({
            asset,
          }),
          now: () => NOTES_NOW,
          makeRequestId: () =>
            "notes-asset-denied",
        }),
      (error) =>
        [
          "not-found",
          "failed-precondition",
        ].includes(error.code)
    );
  }
});

test("rejects sibling, expired, and insufficient Notes access", async () => {
  for (const entitlement of [
    buildNotesEntitlement({
      itemId: "note-2",
    }),
    buildNotesEntitlement({
      accessUntil: NOTES_NOW - 1,
    }),
    buildNotesEntitlement({
      scopeType: "plan",
      module: "",
      itemId: "",
      accessRank: 1,
    }),
  ]) {
    await assert.rejects(
      () =>
        resolveNotesProtectedAsset({
          auth: NOTES_AUTH,
          data: {
            noteId: "note-1",
            action: "OPEN",
          },
          firestore: createNotesFirestore({
            entitlements: [entitlement],
          }),
          now: () => NOTES_NOW,
          makeRequestId: () =>
            "notes-access-denied",
        }),
      (error) =>
        error.code === "permission-denied"
    );
  }
});

test("rejects protected assets without an approved HTTPS URL", async () => {
  await assert.rejects(
    () =>
      resolveNotesProtectedAsset({
        auth: NOTES_AUTH,
        data: {
          noteId: "note-1",
          action: "OPEN",
        },
        firestore: createNotesFirestore({
          asset: {
            ...PUBLISHED_ASSET,
            urls: {
              pdfUrl:
                "http://insecure.invalid/file.pdf",
            },
          },
        }),
        now: () => NOTES_NOW,
        makeRequestId: () =>
          "notes-url-denied",
      }),
    (error) =>
      error.code === "failed-precondition"
  );
});
