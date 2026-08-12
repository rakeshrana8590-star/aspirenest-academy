"use strict";

const {
  createHash,
  randomUUID,
} = require("node:crypto");
const {
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const {
  Timestamp,
  getFirestore,
} = require("firebase-admin/firestore");
const {
  getAuth,
} = require("firebase-admin/auth");
const {
  HttpsError,
  onCall,
} = require("firebase-functions/v2/https");
const {
  createLp2IdentityAuthorityService,
} = require("./lp2IdentityAuthority");
const {
  createLp4LearningAuthority,
} = require("./lp4LearningAuthority");
const {
  getStorage,
} = require("firebase-admin/storage");

if (!getApps().length) {
  initializeApp();
}

const lp2IdentityAuthorityService =
  createLp2IdentityAuthorityService();

const lp4LearningAuthorityService =
  createLp4LearningAuthority({
    firestore: getFirestore(),
    storage: getStorage(),
    serverTimestamp: () => Timestamp.now(),
  });

const LP4_LEARNING_CALLABLE_OPTIONS = Object.freeze({
  region: "asia-south1",
  invoker: "public",
  timeoutSeconds: 60,
  memory: "512MiB",
  maxInstances: 20,
});

const LP2_IDENTITY_CALLABLE_OPTIONS =
  Object.freeze({
    region: "asia-south1",
    invoker: "public",
    timeoutSeconds: 20,
    memory: "256MiB",
    maxInstances: 10,
  });

const LEADERBOARD_PRIVATE_COLLECTION =
  "mockLeaderboard";
const LEADERBOARD_PUBLIC_COLLECTION =
  "mockLeaderboardPublic";

const ALLOWED_PURPOSES = new Set([
  "mock_test_attempt",
  "mock_test_submit",
]);


const NOTES_RESOLVER_FUNCTION_NAME =
  "resolveNotesProtectedAsset";
const NOTES_CONTENT_COLLECTION =
  "contentItems";
const NOTES_ASSET_COLLECTION =
  "protectedContentAssets";
const NOTES_ENTITLEMENTS_COLLECTION =
  "studentEntitlements";
const NOTES_ENTITLEMENT_ITEMS_COLLECTION =
  "items";
const NOTES_ADMIN_EMAILS = new Set([
  "aspirenestplatform@gmail.com",
]);

const NOTES_ASSET_ACTIONS = new Set([
  "OPEN",
  "READ",
  "DOWNLOAD",
]);

const NOTES_ACTIVE_ACCESS_STATUSES = new Set([
  "active",
  "approved",
  "paid",
  "success",
  "verified",
  "live",
]);

const NOTES_PLAN_RANKS = Object.freeze({
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
});

const NOTES_OPEN_URL_FIELDS = Object.freeze([
  "pdfUrl",
  "fileUrl",
  "sourceUrl",
  "assetUrl",
  "downloadUrl",
]);

const NOTES_DOWNLOAD_URL_FIELDS = Object.freeze([
  "downloadUrl",
  "pdfUrl",
  "fileUrl",
  "sourceUrl",
  "assetUrl",
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const cleanText = (
  value = "",
  maxLength = 200
) =>
  cleanString(value)
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const normalizeMode = (value = "") =>
  cleanString(value)
    .replace(/\s+/g, "")
    .toLowerCase();


const USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME =
  "signInWithUsernameAndPassword";
const IDENTITY_TOOLKIT_PASSWORD_SIGNIN_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
const USERNAME_PASSWORD_MAX_LENGTH = 4096;
const USERNAME_API_KEY_MAX_LENGTH = 256;

const usernameSignInFailure = () =>
  new HttpsError(
    "unauthenticated",
    "Sign-in could not be completed."
  );

const normalizeUsernamePasswordSignInRequest = (
  data = {}
) => {
  const username = cleanString(
    data?.username
  );
  const password = String(
    data?.password ?? ""
  );
  const apiKey = cleanString(
    data?.apiKey
  );

  if (
    !username
    || !password
    || !apiKey
    || password.length >
      USERNAME_PASSWORD_MAX_LENGTH
    || apiKey.length >
      USERNAME_API_KEY_MAX_LENGTH
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Sign-in could not be completed."
    );
  }

  return Object.freeze({
    username,
    password,
    apiKey,
  });
};

const postIdentityToolkitPasswordSignIn =
  async ({
    apiKey = "",
    email = "",
    password = "",
    fetchFn = globalThis.fetch,
  } = {}) => {
    if (typeof fetchFn !== "function") {
      throw new HttpsError(
        "failed-precondition",
        "Sign-in could not be completed."
      );
    }

    let response;

    try {
      response = await fetchFn(
        `${IDENTITY_TOOLKIT_PASSWORD_SIGNIN_URL}`
          + `?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: Object.freeze({
            "Content-Type":
              "application/json",
          }),
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );
    } catch (_) {
      throw usernameSignInFailure();
    }

    let body = {};

    try {
      body = await response.json();
    } catch (_) {
      body = {};
    }

    if (!response?.ok) {
      throw usernameSignInFailure();
    }

    const idToken = cleanString(
      body?.idToken
    );
    const localId = cleanString(
      body?.localId
    );

    if (!idToken || !localId) {
      throw usernameSignInFailure();
    }

    return Object.freeze({
      idToken,
      localId,
    });
  };

const signInWithUsernameAndPassword =
  async ({
    data = {},
    rawRequest = null,
    firestore = getFirestore(),
    adminAuth = getAuth(),
    fetchFn = globalThis.fetch,
    nowMs = Date.now(),
  } = {}) => {
    const request =
      normalizeUsernamePasswordSignInRequest(
        data
      );

    await enforceUsernameSignInRateLimit({
      rawRequest,
      username: request.username,
      firestore,
      nowMs,
    });

    const principal =
      await resolveUsernamePrincipal({
        username: request.username,
        firestore,
      });

    if (!principal) {
      throw usernameSignInFailure();
    }

    const passwordResult =
      await postIdentityToolkitPasswordSignIn({
        apiKey: request.apiKey,
        email: principal.email,
        password: request.password,
        fetchFn,
      });

    let decoded;

    try {
      decoded = await adminAuth.verifyIdToken(
        passwordResult.idToken
      );
    } catch (_) {
      throw usernameSignInFailure();
    }

    const verifiedUid = cleanString(
      decoded?.uid || decoded?.sub
    );

    if (
      !verifiedUid
      || verifiedUid !== principal.uid
      || passwordResult.localId !==
        principal.uid
    ) {
      throw usernameSignInFailure();
    }

    let customToken = "";

    try {
      customToken = cleanString(
        await adminAuth.createCustomToken(
          principal.uid
        )
      );
    } catch (_) {
      throw new HttpsError(
        "internal",
        "Sign-in could not be completed."
      );
    }

    if (!customToken) {
      throw new HttpsError(
        "internal",
        "Sign-in could not be completed."
      );
    }

    return Object.freeze({
      customToken,
    });
  };

const STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME =
  "registerStudentAccount";
const STUDENT_ACCOUNT_REGISTRATION_ROLE =
  "student";
const STUDENT_ACCOUNT_REGISTRATION_USERNAME_MIN_LENGTH =
  4;
const STUDENT_ACCOUNT_REGISTRATION_USERNAME_MAX_LENGTH =
  24;
const STUDENT_ACCOUNT_REGISTRATION_FULL_NAME_MAX_LENGTH =
  160;
const STUDENT_ACCOUNT_REGISTRATION_EMAIL_MAX_LENGTH =
  320;
const STUDENT_ACCOUNT_REGISTRATION_PASSWORD_MAX_LENGTH =
  4096;
const STUDENT_ACCOUNT_REGISTRATION_PASSWORD_PATTERN =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;
const STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE =
  "Account could not be created.";

const studentAccountRegistrationFailure = () =>
  new HttpsError(
    "failed-precondition",
    STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE
  );

const normalizeStudentAccountRegistrationRequest = (
  data = {}
) => {
  const fullName = cleanString(
    data?.fullName
  );
  const username = cleanString(
    data?.username
  );
  const email = normalizeEmail(
    data?.email
  );
  const password = String(
    data?.password ?? ""
  );
  const usernameValidation =
    validateUsernameForIdentity(
      username
    );
  const normalizedUsername =
    usernameValidation.normalizedUsername;

  if (
    !fullName
    || fullName.length >
      STUDENT_ACCOUNT_REGISTRATION_FULL_NAME_MAX_LENGTH
    || !email
    || email.length >
      STUDENT_ACCOUNT_REGISTRATION_EMAIL_MAX_LENGTH
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
    || !password
    || password.length >
      STUDENT_ACCOUNT_REGISTRATION_PASSWORD_MAX_LENGTH
    || !STUDENT_ACCOUNT_REGISTRATION_PASSWORD_PATTERN.test(
      password
    )
    || !usernameValidation.ok
    || normalizedUsername.length <
      STUDENT_ACCOUNT_REGISTRATION_USERNAME_MIN_LENGTH
    || normalizedUsername.length >
      STUDENT_ACCOUNT_REGISTRATION_USERNAME_MAX_LENGTH
  ) {
    throw studentAccountRegistrationFailure();
  }

  return Object.freeze({
    fullName,
    username:
      normalizedUsername,
    normalizedUsername,
    email,
    password,
    role:
      STUDENT_ACCOUNT_REGISTRATION_ROLE,
  });
};

const claimStudentRegistrationUsername =
  async ({
    firestore = getFirestore(),
    uid = "",
    username = "",
    normalizedUsername = "",
    nowMs = Date.now(),
  } = {}) => {
    const cleanUid =
      cleanString(uid);
    const canonicalUsername =
      normalizeUsernameForIdentity(
        normalizedUsername || username
      );
    const safeNowMs =
      Number(nowMs);

    if (
      !cleanUid
      || !canonicalUsername
      || !Number.isFinite(safeNowMs)
      || !firestore
      || typeof firestore.runTransaction !==
        "function"
    ) {
      throw studentAccountRegistrationFailure();
    }

    const usernameRef =
      firestore
        .collection(USERNAME_COLLECTION)
        .doc(canonicalUsername);

    await firestore.runTransaction(
      async (transaction) => {
        const snapshot =
          await transaction.get(
            usernameRef
          );

        if (snapshotExists(snapshot)) {
          throw studentAccountRegistrationFailure();
        }

        const timestamp =
          Timestamp.fromMillis(
            safeNowMs
          );

        transaction.set(
          usernameRef,
          {
            uid:
              cleanUid,
            username:
              canonicalUsername,
            normalizedUsername:
              canonicalUsername,
            status:
              "active",
            createdAt:
              timestamp,
            updatedAt:
              timestamp,
          }
        );
      }
    );

    return Object.freeze({
      claimed: true,
      normalizedUsername:
        canonicalUsername,
    });
  };

const registerStudentAccount =
  async ({
    data = {},
    firestore = getFirestore(),
    adminAuth = getAuth(),
    nowMs = Date.now(),
  } = {}) => {
    const request =
      normalizeStudentAccountRegistrationRequest(
        data
      );

    if (
      !adminAuth
      || typeof adminAuth.createUser !==
        "function"
      || typeof adminAuth.deleteUser !==
        "function"
    ) {
      throw studentAccountRegistrationFailure();
    }

    let createdUid = "";

    try {
      const createdUser =
        await adminAuth.createUser({
          email:
            request.email,
          password:
            request.password,
          displayName:
            request.fullName,
          emailVerified:
            false,
          disabled:
            false,
        });

      createdUid =
        cleanString(
          createdUser?.uid
        );

      if (!createdUid) {
        throw studentAccountRegistrationFailure();
      }

      await claimStudentRegistrationUsername({
        firestore,
        uid:
          createdUid,
        username:
          request.username,
        normalizedUsername:
          request.normalizedUsername,
        nowMs,
      });

      return Object.freeze({
        prepared: true,
      });
    } catch (_) {
      if (createdUid) {
        try {
          await adminAuth.deleteUser(
            createdUid
          );
        } catch (_) {
          throw studentAccountRegistrationFailure();
        }
      }

      throw studentAccountRegistrationFailure();
    }
  };


const STUDENT_PROFILE_ENSURE_FUNCTION_NAME =
  "ensureStudentProfile";
const STUDENT_PROFILE_USERS_COLLECTION =
  "users";
const STUDENT_PROFILE_STUDENTS_COLLECTION =
  "students";
const STUDENT_PROFILE_MENTORS_COLLECTION =
  "mentorProfiles";
const STUDENT_PROFILE_FIXED_ADMIN_EMAIL =
  "aspirenestplatform@gmail.com";
const STUDENT_PROFILE_FIXED_MENTOR_EMAIL =
  "dr.varshamaru@gmail.com";
const STUDENT_PROFILE_PUBLIC_FAILURE =
  "Account profile could not be prepared.";

const studentProfileEnsureFailure = (
  code = "failed-precondition"
) =>
  new HttpsError(
    code,
    STUDENT_PROFILE_PUBLIC_FAILURE
  );

const ensureStudentProfile = async ({
  requestAuth = null,
  firestore = getFirestore(),
  adminAuth = getAuth(),
  nowMs = Date.now(),
} = {}) => {
  const uid =
    cleanString(
      requestAuth?.uid
    );
  const tokenVerified =
    requestAuth?.token
      ?.email_verified === true;
  const safeNowMs =
    Number(nowMs);

  if (
    !uid
    || !tokenVerified
    || !Number.isFinite(safeNowMs)
    || !firestore
    || typeof firestore.runTransaction !==
      "function"
    || !adminAuth
    || typeof adminAuth.getUser !==
      "function"
  ) {
    throw studentProfileEnsureFailure(
      "unauthenticated"
    );
  }

  let authUser;

  try {
    authUser =
      await adminAuth.getUser(uid);
  } catch (_) {
    throw studentProfileEnsureFailure(
      "unauthenticated"
    );
  }

  const email =
    normalizeEmail(
      authUser?.email
    );
  const displayName =
    cleanString(
      authUser?.displayName
    );

  if (
    cleanString(
      authUser?.uid
    ) !== uid
    || authUser?.emailVerified !== true
    || !email
    || email ===
      STUDENT_PROFILE_FIXED_ADMIN_EMAIL
    || email ===
      STUDENT_PROFILE_FIXED_MENTOR_EMAIL
  ) {
    throw studentProfileEnsureFailure(
      "permission-denied"
    );
  }

  const userRef =
    firestore
      .collection(
        STUDENT_PROFILE_USERS_COLLECTION
      )
      .doc(uid);

  const studentRef =
    firestore
      .collection(
        STUDENT_PROFILE_STUDENTS_COLLECTION
      )
      .doc(uid);

  const mentorRef =
    firestore
      .collection(
        STUDENT_PROFILE_MENTORS_COLLECTION
      )
      .doc(uid);

  try {
    await firestore.runTransaction(
      async (transaction) => {
        const [
          userSnapshot,
          studentSnapshot,
          mentorSnapshot,
        ] = await Promise.all([
          transaction.get(
            userRef
          ),
          transaction.get(
            studentRef
          ),
          transaction.get(
            mentorRef
          ),
        ]);

        const mentorRecord =
          snapshotData(
            mentorSnapshot
          );

        const activeMentor =
          snapshotExists(
            mentorSnapshot
          )
          && cleanString(
            mentorRecord.mentorUid
          ) === uid
          && normalizeMode(
            mentorRecord.role
          ) === "mentor"
          && normalizeMode(
            mentorRecord.status
          ) === "active";

        if (activeMentor) {
          throw studentProfileEnsureFailure(
            "permission-denied"
          );
        }

        const timestamp =
          Timestamp.fromMillis(
            safeNowMs
          );

        if (
          !snapshotExists(
            userSnapshot
          )
        ) {
          transaction.set(
            userRef,
            {
              uid,
              email,
              normalizedEmail:
                email,
              displayName,
              createdAt:
                timestamp,
              updatedAt:
                timestamp,
            }
          );
        }

        if (
          !snapshotExists(
            studentSnapshot
          )
        ) {
          transaction.set(
            studentRef,
            {
              uid,
              createdAt:
                timestamp,
              updatedAt:
                timestamp,
            }
          );
        }
      }
    );
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    throw studentProfileEnsureFailure();
  }

  return Object.freeze({
    prepared: true,
  });
};

const USERNAME_COLLECTION =
  "usernames";
const USERNAME_USERS_COLLECTION =
  "users";
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;

const USERNAME_SIGNIN_RATE_LIMIT_COLLECTION =
  "authAttemptRateLimits";
const USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS =
  10 * 60 * 1000;
const USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_MAX_ATTEMPTS =
  60;
const USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_MAX_ATTEMPTS =
  10;
const USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE =
  "origin";
const USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE =
  "origin_identifier";
const USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_MAX_LENGTH =
  256;

const USERNAME_RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "aspirenest",
  "aspirenestacademy",
  "aspirenest_admin",
  "founder",
  "mentor",
  "moderator",
  "owner",
  "root",
  "student",
  "support",
  "system",
]);

const normalizeUsernameForIdentity = (
  value = ""
) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const validateUsernameForIdentity = (
  value = ""
) => {
  const normalizedUsername =
    normalizeUsernameForIdentity(value);

  if (
    normalizedUsername.length <
    USERNAME_MIN_LENGTH
  ) {
    return Object.freeze({
      ok: false,
      normalizedUsername,
      reason: "USERNAME_TOO_SHORT",
    });
  }

  if (
    normalizedUsername.length >
    USERNAME_MAX_LENGTH
  ) {
    return Object.freeze({
      ok: false,
      normalizedUsername,
      reason: "USERNAME_TOO_LONG",
    });
  }

  if (
    !/^[a-z][a-z0-9_]*$/.test(
      normalizedUsername
    )
  ) {
    return Object.freeze({
      ok: false,
      normalizedUsername,
      reason: "USERNAME_INVALID_FORMAT",
    });
  }

  if (
    USERNAME_RESERVED_USERNAMES.has(
      normalizedUsername
    )
  ) {
    return Object.freeze({
      ok: false,
      normalizedUsername,
      reason: "USERNAME_RESERVED",
    });
  }

  return Object.freeze({
    ok: true,
    normalizedUsername,
    reason: "USERNAME_AVAILABLE_FOR_CHECK",
  });
};

const snapshotExists = (snapshot) => {
  if (!snapshot) return false;
  if (typeof snapshot.exists === "function") {
    return snapshot.exists();
  }
  return snapshot.exists === true;
};

const snapshotData = (snapshot) => {
  if (!snapshot) return {};
  if (typeof snapshot.data === "function") {
    return snapshot.data() || {};
  }
  return (
    snapshot.data
    && typeof snapshot.data === "object"
      ? snapshot.data
      : {}
  );
};

const usernameSignInRateLimitFailure = () =>
  new HttpsError(
    "resource-exhausted",
    "Sign-in could not be completed."
  );

const normalizeUsernameSignInRateLimitOrigin = (
  rawRequest = null
) => {
  const origin = cleanString(
    rawRequest?.ip
    || rawRequest?.socket?.remoteAddress
  ).toLowerCase();

  if (
    !origin
    || origin.length >
      USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_MAX_LENGTH
  ) {
    throw usernameSignInRateLimitFailure();
  }

  return origin;
};

const buildUsernameSignInRateLimitDocumentId = ({
  scope = "",
  origin = "",
  normalizedUsername = "",
} = {}) => {
  const normalizedScope =
    cleanString(scope);
  const canonicalOrigin =
    cleanString(origin).toLowerCase();
  const canonicalUsername =
    normalizeUsernameForIdentity(
      normalizedUsername
    );

  let material = "";

  if (
    normalizedScope ===
      USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE
  ) {
    material =
      `origin\n${canonicalOrigin}`;
  } else if (
    normalizedScope ===
      USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE
  ) {
    material =
      "origin-identifier\n"
      + canonicalOrigin
      + "\n"
      + canonicalUsername;
  } else {
    throw usernameSignInRateLimitFailure();
  }

  if (!canonicalOrigin) {
    throw usernameSignInRateLimitFailure();
  }

  return createHash("sha256")
    .update(material)
    .digest("hex");
};

const usernameSignInRateLimitTimestampMs = (
  value
) => {
  if (
    value
    && typeof value.toMillis === "function"
  ) {
    const millis = Number(
      value.toMillis()
    );
    return Number.isFinite(millis)
      ? millis
      : 0;
  }

  const millis = Number(value);
  return Number.isFinite(millis)
    ? millis
    : 0;
};

const buildUsernameSignInRateLimitState = ({
  snapshot = null,
  scope = "",
  limit = 1,
  nowMs = Date.now(),
  windowMs =
    USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS,
} = {}) => {
  const safeNowMs = Number(nowMs);
  const safeWindowMs = Number(windowMs);
  const safeLimit = Number(limit);

  if (
    !Number.isFinite(safeNowMs)
    || !Number.isFinite(safeWindowMs)
    || safeWindowMs <= 0
    || !Number.isInteger(safeLimit)
    || safeLimit <= 0
  ) {
    throw usernameSignInRateLimitFailure();
  }

  const record =
    snapshotExists(snapshot)
      ? snapshotData(snapshot)
      : {};

  const existingCount = Number(
    record?.count || 0
  );
  const expiresAtMs =
    usernameSignInRateLimitTimestampMs(
      record?.expiresAt
    );
  const existingWindowStartedAtMs =
    usernameSignInRateLimitTimestampMs(
      record?.windowStartedAt
    );

  const activeWindow =
    expiresAtMs > safeNowMs;

  const currentCount =
    activeWindow
    && Number.isFinite(existingCount)
    && existingCount > 0
      ? Math.floor(existingCount)
      : 0;

  if (
    activeWindow
    && currentCount >= safeLimit
  ) {
    return Object.freeze({
      blocked: true,
      scope,
      count: currentCount,
      windowStartedAtMs:
        existingWindowStartedAtMs,
      expiresAtMs,
    });
  }

  const windowStartedAtMs =
    activeWindow
      ? (
          existingWindowStartedAtMs
          || safeNowMs
        )
      : safeNowMs;

  return Object.freeze({
    blocked: false,
    scope,
    count: currentCount + 1,
    windowStartedAtMs,
    expiresAtMs:
      activeWindow
        ? expiresAtMs
        : safeNowMs + safeWindowMs,
  });
};

const enforceUsernameSignInRateLimit =
  async ({
    rawRequest = null,
    username = "",
    firestore = getFirestore(),
    nowMs = Date.now(),
    windowMs =
      USERNAME_SIGNIN_RATE_LIMIT_WINDOW_MS,
    originLimit =
      USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_MAX_ATTEMPTS,
    originIdentifierLimit =
      USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_MAX_ATTEMPTS,
  } = {}) => {
    if (
      !firestore
      || typeof firestore.runTransaction !==
        "function"
    ) {
      throw usernameSignInRateLimitFailure();
    }

    const safeNowMs = Number(nowMs);

    if (!Number.isFinite(safeNowMs)) {
      throw usernameSignInRateLimitFailure();
    }

    const origin =
      normalizeUsernameSignInRateLimitOrigin(
        rawRequest
      );

    const normalizedUsername =
      normalizeUsernameForIdentity(
        username
      );

    const collection = firestore.collection(
      USERNAME_SIGNIN_RATE_LIMIT_COLLECTION
    );

    const buckets = [
      Object.freeze({
        scope:
          USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
        limit: originLimit,
        ref: collection.doc(
          buildUsernameSignInRateLimitDocumentId({
            scope:
              USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_SCOPE,
            origin,
          })
        ),
      }),
      Object.freeze({
        scope:
          USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
        limit: originIdentifierLimit,
        ref: collection.doc(
          buildUsernameSignInRateLimitDocumentId({
            scope:
              USERNAME_SIGNIN_RATE_LIMIT_ORIGIN_IDENTIFIER_SCOPE,
            origin,
            normalizedUsername,
          })
        ),
      }),
    ];

    try {
      await firestore.runTransaction(
        async (transaction) => {
          const snapshots =
            await Promise.all(
              buckets.map(
                (bucket) =>
                  transaction.get(
                    bucket.ref
                  )
              )
            );

          const states = buckets.map(
            (bucket, index) =>
              buildUsernameSignInRateLimitState({
                snapshot:
                  snapshots[index],
                scope:
                  bucket.scope,
                limit:
                  bucket.limit,
                nowMs:
                  safeNowMs,
                windowMs,
              })
          );

          if (
            states.some(
              (state) => state.blocked
            )
          ) {
            throw usernameSignInRateLimitFailure();
          }

          const updatedAt =
            Timestamp.fromMillis(
              safeNowMs
            );

          states.forEach(
            (state, index) => {
              transaction.set(
                buckets[index].ref,
                {
                  scope:
                    state.scope,
                  count:
                    state.count,
                  windowStartedAt:
                    Timestamp.fromMillis(
                      state.windowStartedAtMs
                    ),
                  updatedAt,
                  expiresAt:
                    Timestamp.fromMillis(
                      state.expiresAtMs
                    ),
                }
              );
            }
          );
        }
      );
    } catch (error) {
      if (
        error instanceof HttpsError
        && error.code ===
          "resource-exhausted"
      ) {
        throw error;
      }

      throw new HttpsError(
        "unavailable",
        "Sign-in could not be completed."
      );
    }

    return Object.freeze({
      allowed: true,
    });
  };

const readUsernameDocument = async ({
  firestore = getFirestore(),
  normalizedUsername = "",
} = {}) => {
  const username = cleanString(
    normalizedUsername
  );
  if (!username) return null;
  return firestore
    .collection(USERNAME_COLLECTION)
    .doc(username)
    .get();
};

const checkUsernameAvailability = async ({
  data = {},
  firestore = getFirestore(),
} = {}) => {
  const validation =
    validateUsernameForIdentity(
      data?.username
    );

  if (!validation.ok) {
    return Object.freeze({
      available: false,
    });
  }

  const snapshot =
    await readUsernameDocument({
      firestore,
      normalizedUsername:
        validation.normalizedUsername,
    });

  return Object.freeze({
    available: !snapshotExists(snapshot),
  });
};

const resolveUsernamePrincipal = async ({
  username = "",
  firestore = getFirestore(),
} = {}) => {
  const validation =
    validateUsernameForIdentity(username);
  if (!validation.ok) return null;

  const usernameSnapshot =
    await readUsernameDocument({
      firestore,
      normalizedUsername:
        validation.normalizedUsername,
    });
  if (!snapshotExists(usernameSnapshot)) {
    return null;
  }

  const usernameRecord =
    snapshotData(usernameSnapshot);
  const uid = cleanString(
    usernameRecord.uid
  );
  const usernameStatus = normalizeMode(
    usernameRecord.status || "active"
  );
  if (!uid || usernameStatus !== "active") {
    return null;
  }

  const userSnapshot = await firestore
    .collection(USERNAME_USERS_COLLECTION)
    .doc(uid)
    .get();
  if (!snapshotExists(userSnapshot)) {
    return null;
  }

  const userRecord =
    snapshotData(userSnapshot);
  const email = normalizeEmail(
    userRecord.normalizedEmail
    || userRecord.email
  );
  if (!email) return null;

  return Object.freeze({
    uid,
    email,
    username:
      validation.normalizedUsername,
  });
};

const toFiniteNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
};

const clampNumber = (
  value,
  minimum,
  maximum,
  fallback = minimum
) =>
  Math.min(
    maximum,
    Math.max(
      minimum,
      toFiniteNumber(value, fallback)
    )
  );

const toEpochMs = (value) => {
  if (!value) return null;

  if (
    typeof value?.toMillis === "function"
  ) {
    const millis = Number(value.toMillis());
    return Number.isFinite(millis) &&
      millis > 0
      ? millis
      : null;
  }

  if (
    typeof value?.seconds === "number"
  ) {
    const millis =
      Number(value.seconds) * 1000;
    return Number.isFinite(millis) &&
      millis > 0
      ? millis
      : null;
  }

  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) &&
      millis > 0
      ? millis
      : null;
  }

  const numeric = Number(value);

  if (
    Number.isFinite(numeric) &&
    numeric > 0
  ) {
    return numeric <
      10_000_000_000
      ? numeric * 1000
      : numeric;
  }

  const parsed = new Date(value);
  const millis = parsed.getTime();

  return Number.isFinite(millis) &&
    millis > 0
    ? millis
    : null;
};

const toTimestamp = (
  value,
  fallbackMs = null
) => {
  const millis =
    toEpochMs(value) ??
    toEpochMs(fallbackMs);

  return millis
    ? Timestamp.fromMillis(millis)
    : null;
};

const hashValue = (value = "") =>
  createHash("sha256")
    .update(cleanString(value))
    .digest("hex");

const buildPrivateLeaderboardId = ({
  uid,
  testId,
  leaderboardMode,
} = {}) =>
  hashValue(
    `private|${uid}|${testId}|${leaderboardMode}`
  );

const buildPublicLeaderboardId = ({
  uid,
  testId,
  leaderboardMode,
} = {}) =>
  hashValue(
    `public|${uid}|${testId}|${leaderboardMode}`
  );

const buildPublicLeaderboardName = (
  value = ""
) => {
  const raw = cleanText(
    value || "AspireNest Learner",
    80
  );

  if (!raw) {
    return "AspireNest Learner";
  }

  if (raw.includes("@")) {
    const [name = "student"] =
      raw.split("@");
    return `${
      cleanText(name, 20).slice(0, 2) ||
      "st"
    }***`;
  }

  const parts = raw
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "AspireNest Learner";
  }

  if (parts.length === 1) {
    return parts[0].length > 8
      ? `${parts[0].slice(0, 6)}…`
      : parts[0];
  }

  return `${parts[0]} ${
    parts[1][0] || ""
  }.`.trim();
};

const requireAuthenticatedUser = (
  auth = null
) => {
  const uid = cleanString(auth?.uid);
  const email = normalizeEmail(
    auth?.token?.email
  );

  if (!uid || !email) {
    throw new HttpsError(
      "unauthenticated",
      "Verified login is required."
    );
  }

  return Object.freeze({
    uid,
    email,
    tokenName: cleanText(
      auth?.token?.name,
      80
    ),
  });
};

const buildMockTestServerTimeResponse = ({
  auth = null,
  data = {},
  now = () => Date.now(),
  makeRequestId = () => randomUUID(),
  storage = getStorage(),
} = {}) => {
  const uid = cleanString(auth?.uid);

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Verified login is required."
    );
  }

  const purpose = cleanString(
    data?.purpose
  );
  const testId = cleanString(
    data?.testId
  );

  if (!ALLOWED_PURPOSES.has(purpose)) {
    throw new HttpsError(
      "invalid-argument",
      "Unsupported server-time purpose."
    );
  }

  if (!testId || testId.length > 200) {
    throw new HttpsError(
      "invalid-argument",
      "A valid mock-test id is required."
    );
  }

  const serverNowMs = Number(now());
  const requestId = cleanString(
    makeRequestId()
  );

  if (
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  if (!requestId) {
    throw new HttpsError(
      "internal",
      "Server request identifier is unavailable."
    );
  }

  return Object.freeze({
    source: "server",
    serverNowMs,
    requestId,
    authenticated: true,
    uid,
  });
};

const buildMockTestLeaderboardProjection = ({
  auth = null,
  data = {},
  now = () => Date.now(),
} = {}) => {
  const {
    uid,
    email,
    tokenName,
  } = requireAuthenticatedUser(auth);

  const testId = cleanText(
    data?.testId,
    200
  );
  const leaderboardMode = normalizeMode(
    data?.leaderboardMode
  );
  const attemptId = cleanText(
    data?.attemptId,
    300
  );

  if (!testId) {
    throw new HttpsError(
      "invalid-argument",
      "A valid mock-test id is required."
    );
  }

  if (
    !leaderboardMode ||
    leaderboardMode === "disabled"
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Leaderboard is not enabled for this mock test."
    );
  }

  if (!attemptId) {
    throw new HttpsError(
      "invalid-argument",
      "A submitted attempt id is required."
    );
  }

  const serverNowMs = Number(now());

  if (
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  const score = clampNumber(
    data?.score,
    -100000,
    100000,
    0
  );
  const totalMarks = clampNumber(
    data?.totalMarks,
    0,
    100000,
    0
  );
  const percentage = clampNumber(
    data?.percentage,
    0,
    100,
    0
  );
  const accuracy = clampNumber(
    data?.accuracy,
    0,
    100,
    0
  );
  const correctCount = clampNumber(
    data?.correctCount,
    0,
    100000,
    0
  );
  const wrongCount = clampNumber(
    data?.wrongCount,
    0,
    100000,
    0
  );
  const skippedCount = clampNumber(
    data?.skippedCount,
    0,
    100000,
    0
  );
  const totalQuestions = clampNumber(
    data?.totalQuestions,
    0,
    100000,
    0
  );
  const durationSeconds = clampNumber(
    data?.durationSeconds,
    0,
    31_536_000,
    0
  );
  const attemptNumber = clampNumber(
    data?.attemptNumber,
    1,
    100000,
    1
  );

  const privateEntryId =
    buildPrivateLeaderboardId({
      uid,
      testId,
      leaderboardMode,
    });
  const publicEntryId =
    buildPublicLeaderboardId({
      uid,
      testId,
      leaderboardMode,
    });
  const timestamp =
    Timestamp.fromMillis(serverNowMs);
  const studentName = cleanText(
    tokenName ||
      data?.studentName ||
      email,
    80
  );
  const displayName =
    buildPublicLeaderboardName(
      studentName || email
    );

  const sharedFields = {
    schemaVersion: 1,
    testId,
    testTitle: cleanText(
      data?.testTitle,
      200
    ),
    leaderboardMode,
    subject: cleanText(
      data?.subject,
      120
    ),
    chapter: cleanText(
      data?.chapter,
      160
    ),
    planType: cleanText(
      data?.planType || "FREE",
      80
    ),
    examType: cleanText(
      data?.examType,
      120
    ),
    testType: cleanText(
      data?.testType,
      120
    ),
    score,
    totalMarks,
    percentage,
    accuracy,
    correctCount,
    wrongCount,
    skippedCount,
    totalQuestions,
    durationSeconds,
    rankScore: percentage,
    rankTieBreakerScore: score,
    source: "authenticated_callable",
    updatedAt: timestamp,
  };

  const privateRecord = Object.freeze({
    ...sharedFields,
    privateEntryId,
    publicEntryId,
    leaderboardKey: privateEntryId,
    ownerUid: uid,
    ownerEmail: email,
    studentEmail: email,
    studentName:
      studentName || email,
    attemptId,
    attemptStartedAt: toTimestamp(
      data?.attemptStartedAt
    ),
    attemptSubmittedAt:
      toTimestamp(
        data?.attemptSubmittedAt,
        serverNowMs
      ),
    attemptNumber,
    startedAt: toTimestamp(
      data?.startedAt
    ),
    endedAt: toTimestamp(
      data?.endedAt,
      serverNowMs
    ),
    createdAt: timestamp,
  });

  const publicRecord = Object.freeze({
    ...sharedFields,
    publicEntryId,
    displayName,
    projectionVersion: 1,
    createdAt: timestamp,
  });

  return Object.freeze({
    privateEntryId,
    publicEntryId,
    privateRecord,
    publicRecord,
  });
};

const shouldReplaceMockTestLeaderboardEntry = (
  existing = null,
  candidate = {}
) => {
  if (!existing) return true;

  if (
    cleanString(existing.attemptId) &&
    cleanString(existing.attemptId) ===
      cleanString(candidate.attemptId)
  ) {
    return true;
  }

  const existingRank = toFiniteNumber(
    existing.rankScore ??
      existing.percentage,
    0
  );
  const candidateRank = toFiniteNumber(
    candidate.rankScore ??
      candidate.percentage,
    0
  );

  if (candidateRank > existingRank) {
    return true;
  }

  if (candidateRank < existingRank) {
    return false;
  }

  const existingTie = toFiniteNumber(
    existing.rankTieBreakerScore ??
      existing.score,
    0
  );
  const candidateTie = toFiniteNumber(
    candidate.rankTieBreakerScore ??
      candidate.score,
    0
  );

  return candidateTie > existingTie;
};

const loadOwnedSubmittedMockResult = async ({
  auth = null,
  data = {},
  firestore = getFirestore(),
} = {}) => {
  const {
    uid,
    email,
  } = requireAuthenticatedUser(auth);
  const testId = cleanText(
    data?.testId,
    200
  );
  const attemptId = cleanText(
    data?.attemptId,
    300
  );

  if (!testId || !attemptId) {
    throw new HttpsError(
      "invalid-argument",
      "A submitted mock-test attempt is required."
    );
  }

  const snapshot = await firestore
    .collection("mockResults")
    .where(
      "attemptKey",
      "==",
      attemptId
    )
    .where(
      "email",
      "==",
      email
    )
    .limit(10)
    .get();

  const ownedResult = snapshot.docs
    .map((document) => ({
      id: document.id,
      ...(document.data() || {}),
    }))
    .find(
      (result) =>
        cleanString(
          result.testId ||
            result.mockTestId ||
            result.contentId
        ) === testId &&
        normalizeEmail(
          result.email ||
            result.studentEmail
        ) === email &&
        cleanString(
          result.attemptKey ||
            result.attemptId
        ) === attemptId
    );

  if (!ownedResult) {
    throw new HttpsError(
      "failed-precondition",
      "An owned submitted result is required before leaderboard projection."
    );
  }

  return Object.freeze({
    uid,
    email,
    result: ownedResult,
  });
};

const upsertMockTestLeaderboardProjection = async ({
  auth = null,
  data = {},
  firestore = getFirestore(),
  storage = getStorage(),
  now = () => Date.now(),
} = {}) => {
  const ownedResult =
    await loadOwnedSubmittedMockResult({
      auth,
      data,
      firestore,
    });
  const result = ownedResult.result;
  const projection =
    buildMockTestLeaderboardProjection({
      auth,
      data: {
        ...data,
        testId:
          result.testId ||
          result.mockTestId ||
          data.testId,
        testTitle:
          result.testTitle ||
          data.testTitle,
        studentName:
          result.studentName ||
          data.studentName,
        subject:
          result.subject ||
          data.subject,
        chapter:
          result.chapter ||
          data.chapter,
        planType:
          result.planType ||
          data.planType,
        examType:
          result.examType ||
          data.examType,
        testType:
          result.testType ||
          data.testType,
        score: result.score,
        totalMarks:
          result.totalMarks,
        percentage:
          result.percentage,
        accuracy: result.accuracy,
        correctCount:
          result.correctCount,
        wrongCount:
          result.wrongCount,
        skippedCount:
          result.skippedCount,
        totalQuestions:
          result.totalQuestions,
        durationSeconds:
          result.durationSeconds,
        attemptId:
          result.attemptKey ||
          result.attemptId,
        attemptStartedAt:
          result.attemptStartedAt,
        attemptSubmittedAt:
          result.attemptSubmittedAt,
        attemptNumber:
          result.attemptNumber,
        startedAt:
          result.startedAt,
        endedAt:
          result.endedAt,
      },
      now,
    });

  const privateRef = firestore
    .collection(
      LEADERBOARD_PRIVATE_COLLECTION
    )
    .doc(projection.privateEntryId);
  const publicRef = firestore
    .collection(
      LEADERBOARD_PUBLIC_COLLECTION
    )
    .doc(projection.publicEntryId);

  return firestore.runTransaction(
    async (transaction) => {
      const existingSnapshot =
        await transaction.get(privateRef);
      const existing =
        existingSnapshot.exists
          ? existingSnapshot.data()
          : null;

      if (
        !shouldReplaceMockTestLeaderboardEntry(
          existing,
          projection.privateRecord
        )
      ) {
        return Object.freeze({
          saved: false,
          reason: "not_better",
          publicEntryId:
            projection.publicEntryId,
        });
      }

      const createdAt =
        existing?.createdAt ||
        projection.privateRecord.createdAt;

      transaction.set(
        privateRef,
        {
          ...projection.privateRecord,
          createdAt,
        },
        { merge: false }
      );
      transaction.set(
        publicRef,
        {
          ...projection.publicRecord,
          createdAt,
        },
        { merge: false }
      );

      return Object.freeze({
        saved: true,
        reason: "saved",
        publicEntryId:
          projection.publicEntryId,
      });
    }
  );
};



const normalizeNotesAssetAction = (
  value = ""
) => cleanString(value).toUpperCase();

const normalizeNotesPlanCode = (
  value = ""
) => {
  const planCode = cleanString(value)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  if (
    planCode === "MENTOR" ||
    planCode === "MENTORING"
  ) {
    return "MENTORSHIP";
  }

  return planCode || "FREE";
};

const normalizeNotesScope = (
  value = ""
) => cleanString(value).toLowerCase();

const normalizeNotesModule = (
  value = ""
) => cleanString(value)
  .replace(/[^a-zA-Z0-9]+/g, "")
  .toLowerCase();

const normalizeNotesItemType = (
  value = ""
) => cleanString(value)
  .replace(/[^a-zA-Z0-9]+/g, "")
  .toLowerCase();

const getNotesPlanRank = (
  record = {}
) => {
  const explicitRank = Number(
    record.accessRank ??
      record.planRank ??
      record.requiredAccessRank
  );

  if (
    Number.isFinite(explicitRank) &&
    explicitRank >= 0
  ) {
    return explicitRank;
  }

  const planCode = normalizeNotesPlanCode(
    record.planCode ||
      record.planType ||
      record.requiredPlan ||
      "FREE"
  );

  return NOTES_PLAN_RANKS[planCode] ?? -1;
};

const getNotesItemIds = (
  record = {}
) => {
  const values =
    record.itemIds ||
    record.resourceIds ||
    record.items ||
    [];

  return Array.isArray(values)
    ? values
        .map(cleanString)
        .filter(Boolean)
    : [];
};

const isNotesPublishedRecord = (
  record = {}
) =>
  cleanString(record.status).toLowerCase() ===
  "published";

const isNotesCatalogRecord = (
  record = {}
) =>
  cleanString(record.section).toLowerCase() ===
  "notes";

const isNotesEntitlementActive = (
  record = {},
  {
    uid = "",
    email = "",
    nowMs = Date.now(),
  } = {}
) => {
  const status = cleanString(
    record.status || "active"
  ).toLowerCase();

  if (
    !NOTES_ACTIVE_ACCESS_STATUSES.has(
      status
    )
  ) {
    return false;
  }

  const recordUid = cleanString(record.uid);
  const recordEmail = normalizeEmail(
    record.normalizedEmail ||
      record.email
  );
  const principalUid = cleanString(uid);
  const principalEmail = normalizeEmail(email);

  if (
    recordUid &&
    recordUid !== principalUid
  ) {
    return false;
  }

  if (
    recordEmail &&
    principalEmail &&
    recordEmail !== principalEmail
  ) {
    return false;
  }

  const currentTime = Number(nowMs);

  if (
    !Number.isFinite(currentTime) ||
    currentTime <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  const rawAccessFrom =
    record.accessFrom ??
    record.startDate ??
    null;
  const rawAccessUntil =
    record.accessUntil ??
    record.expiryDate ??
    record.validUntil ??
    null;
  const accessFrom = toEpochMs(rawAccessFrom);
  const accessUntil = toEpochMs(rawAccessUntil);
  const hasAccessFrom =
    rawAccessFrom !== null &&
    rawAccessFrom !== undefined &&
    rawAccessFrom !== "";
  const hasAccessUntil =
    rawAccessUntil !== null &&
    rawAccessUntil !== undefined &&
    rawAccessUntil !== "";

  if (hasAccessFrom && accessFrom === null) {
    return false;
  }

  if (hasAccessUntil && accessUntil === null) {
    return false;
  }

  if (
    accessFrom !== null &&
    accessFrom > currentTime
  ) {
    return false;
  }

  if (
    accessUntil !== null &&
    accessUntil < currentTime
  ) {
    return false;
  }

  return true;
};

const notesEntitlementMatchesResource = ({
  record = {},
  note = {},
  noteId = "",
} = {}) => {
  const scope = normalizeNotesScope(
    record.scopeType || record.scope
  );
  const moduleName = normalizeNotesModule(
    record.module
  );
  const itemType = normalizeNotesItemType(
    record.itemType
  );
  const normalizedNoteId = cleanString(noteId);
  const requiredRank = getNotesPlanRank(note);
  const recordRank = getNotesPlanRank(record);
  const moduleMatches =
    moduleName === "notes";
  const itemTypeMatches =
    !itemType || itemType === "notespdf";

  if (scope === "item") {
    return (
      moduleMatches &&
      itemTypeMatches &&
      cleanString(
        record.itemId ||
          record.resourceId ||
          record.noteId
      ) === normalizedNoteId
    );
  }

  if (scope === "bundle") {
    return (
      moduleMatches &&
      itemTypeMatches &&
      getNotesItemIds(record).includes(
        normalizedNoteId
      )
    );
  }

  if (scope === "module") {
    return (
      requiredRank >= 0 &&
      moduleMatches &&
      recordRank >= requiredRank
    );
  }

  if (scope === "plan") {
    return (
      requiredRank >= 0 &&
      recordRank >= requiredRank
    );
  }

  return false;
};

const resolveNotesEntitlementEvidence = ({
  note = {},
  noteId = "",
  entitlements = [],
  uid = "",
  email = "",
  nowMs = Date.now(),
} = {}) => {
  const requiredRank = getNotesPlanRank(note);

  if (requiredRank === 0) {
    return Object.freeze({
      allowed: true,
      scopeType: "free",
      entitlementId: null,
    });
  }

  const scopePriority = Object.freeze({
    item: 0,
    bundle: 1,
    module: 2,
    plan: 3,
  });

  const candidates = (
    Array.isArray(entitlements)
      ? entitlements
      : []
  )
    .filter((record) =>
      isNotesEntitlementActive(record, {
        uid,
        email,
        nowMs,
      })
    )
    .filter((record) =>
      notesEntitlementMatchesResource({
        record,
        note,
        noteId,
      })
    )
    .sort((first, second) => {
      const firstScope = normalizeNotesScope(
        first.scopeType || first.scope
      );
      const secondScope = normalizeNotesScope(
        second.scopeType || second.scope
      );
      const scopeDifference =
        (scopePriority[firstScope] ?? 99) -
        (scopePriority[secondScope] ?? 99);

      if (scopeDifference !== 0) {
        return scopeDifference;
      }

      const rankDifference =
        getNotesPlanRank(second) -
        getNotesPlanRank(first);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      return cleanString(first.id).localeCompare(
        cleanString(second.id)
      );
    });

  const selected = candidates[0] || null;

  if (!selected) {
    return Object.freeze({
      allowed: false,
      scopeType: "",
      entitlementId: null,
    });
  }

  return Object.freeze({
    allowed: true,
    scopeType: normalizeNotesScope(
      selected.scopeType || selected.scope
    ),
    entitlementId:
      cleanString(selected.id) || null,
  });
};

const pickNotesProtectedAssetUrl = ({
  asset = {},
  action = "OPEN",
} = {}) => {
  const normalizedAction =
    normalizeNotesAssetAction(action);
  const fields =
    normalizedAction === "DOWNLOAD"
      ? NOTES_DOWNLOAD_URL_FIELDS
      : NOTES_OPEN_URL_FIELDS;
  const urls =
    asset.urls &&
    typeof asset.urls === "object"
      ? asset.urls
      : {};

  for (const fieldName of fields) {
    const value = cleanString(
      urls[fieldName]
    );

    if (!value) continue;

    try {
      const parsed = new URL(value);

      if (parsed.protocol === "https:") {
        return value;
      }
    } catch {
      // Continue to the next server-stored URL.
    }
  }

  return "";
};

const normalizeNotesAssetResolverRequest = ({
  auth = null,
  data = {},
} = {}) => {
  const principal =
    requireAuthenticatedUser(auth);
  const noteId = cleanText(
    data?.noteId,
    200
  );
  const action =
    normalizeNotesAssetAction(
      data?.action
    );

  if (!noteId) {
    throw new HttpsError(
      "invalid-argument",
      "A valid Notes resource id is required."
    );
  }

  if (!NOTES_ASSET_ACTIONS.has(action)) {
    throw new HttpsError(
      "invalid-argument",
      "Unsupported Notes asset action."
    );
  }

  return Object.freeze({
    ...principal,
    noteId,
    action,
  });
};

const loadNotesEntitlements = async ({
  firestore,
  uid,
} = {}) => {
  const snapshot = await firestore
    .collection(
      NOTES_ENTITLEMENTS_COLLECTION
    )
    .doc(uid)
    .collection(
      NOTES_ENTITLEMENT_ITEMS_COLLECTION
    )
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() || {}),
  }));
};

const resolveNotesProtectedAsset = async ({
  auth = null,
  data = {},
  firestore = getFirestore(),
  storage = getStorage(),
  now = () => Date.now(),
  makeRequestId = () => randomUUID(),
} = {}) => {
  const request =
    normalizeNotesAssetResolverRequest({
      auth,
      data,
    });
  const serverNowMs = Number(now());

  if (
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  const requestId = cleanString(
    makeRequestId()
  );

  if (!requestId) {
    throw new HttpsError(
      "internal",
      "Server request identifier is unavailable."
    );
  }

  const noteRef = firestore
    .collection(NOTES_CONTENT_COLLECTION)
    .doc(request.noteId);
  const assetRef = firestore
    .collection(NOTES_ASSET_COLLECTION)
    .doc(request.noteId);
  const [noteSnapshot, assetSnapshot] =
    await Promise.all([
      noteRef.get(),
      assetRef.get(),
    ]);

  if (!noteSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Notes resource is unavailable."
    );
  }

  const note = {
    id: noteSnapshot.id,
    ...(noteSnapshot.data() || {}),
  };

  if (
    !isNotesCatalogRecord(note) ||
    !isNotesPublishedRecord(note)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Notes resource is unavailable."
    );
  }

  if (
    note.hasProtectedAsset !== true
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset is unavailable."
    );
  }

  if (!assetSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Protected Notes asset is unavailable."
    );
  }

  const asset = {
    id: assetSnapshot.id,
    ...(assetSnapshot.data() || {}),
  };

  if (
    cleanString(asset.contentId) &&
    cleanString(asset.contentId) !==
      request.noteId
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset identity is invalid."
    );
  }

  if (
    !isNotesPublishedRecord(asset)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset is unavailable."
    );
  }

  const isAdminRequest = NOTES_ADMIN_EMAILS.has(
    normalizeEmail(request.email)
  );
  const entitlements =
    isAdminRequest || getNotesPlanRank(note) === 0
      ? []
      : await loadNotesEntitlements({
          firestore,
          uid: request.uid,
        });
  const access = isAdminRequest
    ? Object.freeze({
        allowed: true,
        scopeType: "admin",
      })
    : resolveNotesEntitlementEvidence({
        note,
        noteId: request.noteId,
        entitlements,
        uid: request.uid,
        email: request.email,
        nowMs: serverNowMs,
      });

  if (!access.allowed) {
    throw new HttpsError(
      "permission-denied",
      "Notes access is not available for this account."
    );
  }

  let assetUrl =
    pickNotesProtectedAssetUrl({
      asset,
      action: request.action,
    });

  if (!assetUrl && cleanString(asset.storagePath)) {
    try {
      const [signedUrl] = await storage.bucket().file(cleanString(asset.storagePath)).getSignedUrl({
        action: "read",
        expires: serverNowMs + 10 * 60 * 1000,
      });
      assetUrl = cleanString(signedUrl);
    } catch {
      assetUrl = "";
    }
  }

  if (!assetUrl) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset URL is unavailable."
    );
  }

  return Object.freeze({
    authorized: true,
    source: "server_authorized",
    noteId: request.noteId,
    action: request.action,
    assetUrl,
    accessScope: access.scopeType,
    serverNowMs,
    requestId,
  });
};


exports.lp4LearningOperation = onCall(
  LP4_LEARNING_CALLABLE_OPTIONS,
  async (request) => {
    try {
      return await lp4LearningAuthorityService.operation(
        request.auth,
        request.data,
      );
    } catch (error) {
      const code = String(error && error.lp4Code || "");
      const map = {
        UNAUTHENTICATED: "unauthenticated", FORBIDDEN: "permission-denied", INVALID_REQUEST: "invalid-argument",
        NOT_FOUND: "not-found", CONFLICT: "aborted", WINDOW_CLOSED: "failed-precondition",
        FAILED_PRECONDITION: "failed-precondition", PROVIDER_UNAVAILABLE: "unavailable"
      };
      throw new HttpsError(
        map[code] || "internal",
        String(error && error.message || "LP4 learning operation failed.").slice(0,300),
        error && error.details ? error.details : undefined,
      );
    }
  },
);

exports.setAccountRoleAuthority = onCall(
  LP2_IDENTITY_CALLABLE_OPTIONS,
  (request) =>
    lp2IdentityAuthorityService
      .setAccountRoleAuthority({
        requestAuth: request.auth,
        data: request.data,
      })
);

exports.setAccountStatus = onCall(
  LP2_IDENTITY_CALLABLE_OPTIONS,
  (request) =>
    lp2IdentityAuthorityService
      .setAccountStatus({
        requestAuth: request.auth,
        data: request.data,
      })
);

exports.revokeOwnSessions = onCall(
  LP2_IDENTITY_CALLABLE_OPTIONS,
  (request) =>
    lp2IdentityAuthorityService
      .revokeOwnSessions({
        requestAuth: request.auth,
      })
);

exports.saveStudentProfile = onCall(
  LP2_IDENTITY_CALLABLE_OPTIONS,
  (request) =>
    lp2IdentityAuthorityService
      .saveStudentProfile({
        requestAuth: request.auth,
        data: request.data,
      })
);

exports.loadAccountSecurity = onCall(
  LP2_IDENTITY_CALLABLE_OPTIONS,
  (request) =>
    lp2IdentityAuthorityService
      .loadAccountSecurity({
        requestAuth: request.auth,
        rawRequest: request.rawRequest,
      })
);


exports.ensureStudentProfile = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 20,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    ensureStudentProfile({
      requestAuth:
        request.auth,
    })
);

exports.registerStudentAccount = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 20,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    registerStudentAccount({
      data: request.data,
    })
);

exports.signInWithUsernameAndPassword = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 15,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    signInWithUsernameAndPassword({
      data: request.data,
      rawRequest: request.rawRequest,
    })
);

exports.checkUsernameAvailability = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 10,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    checkUsernameAvailability({
      data: request.data,
    })
);

exports.getMockTestServerTime = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 10,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    buildMockTestServerTimeResponse({
      auth: request.auth,
      data: request.data,
    })
);



exports.resolveNotesProtectedAsset = onCall(
  {
    region: "asia-south1",
    invoker: "public",
    timeoutSeconds: 15,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    resolveNotesProtectedAsset({
      auth: request.auth,
      data: request.data,
      storage: getStorage(),
    })
);

exports.upsertMockTestLeaderboardEntry =
  onCall(
    {
      region: "asia-south1",
      timeoutSeconds: 15,
      memory: "256MiB",
      maxInstances: 10,
    },
    (request) =>
      upsertMockTestLeaderboardProjection({
        auth: request.auth,
        data: request.data,
      })
  );

exports.__test = Object.freeze({

  STUDENT_PROFILE_ENSURE_FUNCTION_NAME,
  STUDENT_PROFILE_USERS_COLLECTION,
  STUDENT_PROFILE_STUDENTS_COLLECTION,
  STUDENT_PROFILE_MENTORS_COLLECTION,
  STUDENT_PROFILE_PUBLIC_FAILURE,
  ensureStudentProfile,
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
  USERNAME_PASSWORD_MAX_LENGTH,
  USERNAME_API_KEY_MAX_LENGTH,
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
  NOTES_RESOLVER_FUNCTION_NAME,
  NOTES_CONTENT_COLLECTION,
  NOTES_ASSET_COLLECTION,
  NOTES_ENTITLEMENTS_COLLECTION,
  NOTES_ENTITLEMENT_ITEMS_COLLECTION,
  normalizeNotesAssetResolverRequest,
  isNotesEntitlementActive,
  notesEntitlementMatchesResource,
  resolveNotesEntitlementEvidence,
  pickNotesProtectedAssetUrl,
  loadNotesEntitlements,
  resolveNotesProtectedAsset,
  LEADERBOARD_PRIVATE_COLLECTION,
  LEADERBOARD_PUBLIC_COLLECTION,
  buildMockTestServerTimeResponse,
  buildMockTestLeaderboardProjection,
  buildPrivateLeaderboardId,
  buildPublicLeaderboardId,
  buildPublicLeaderboardName,
  loadOwnedSubmittedMockResult,
  shouldReplaceMockTestLeaderboardEntry,
  upsertMockTestLeaderboardProjection,
});
