"use strict";

const { createHash, randomUUID } = require("node:crypto");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { HttpsError } = require("firebase-functions/v2/https");

const ROLE_AUTHORITY_COLLECTION = "roleAuthorities";
const IDENTITY_AUDIT_COLLECTION = "identityAuditLogs";
const LEARNER_PROFILE_COLLECTION = "learnerProfiles";
const MENTOR_PROFILE_COLLECTION = "mentorProfiles";
const ACCOUNT_DEVICE_COLLECTION = "accountDeviceSessions";

const FIXED_ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const FIXED_MENTOR_EMAIL = "dr.varshamaru@gmail.com";

const VALID_ROLES = Object.freeze([
  "student",
  "mentor",
  "admin",
]);

const VALID_ACCOUNT_STATUSES = Object.freeze([
  "active",
  "suspended",
  "blocked",
  "deletion-pending",
]);

const RECENT_AUTH_MAX_AGE_SECONDS = 15 * 60;

const STUDENT_PROFILE_FIELDS = Object.freeze([
  "fullName",
  "name",
  "phone",
  "targetExam",
  "state",
  "city",
  "language",
  "qualification",
]);

const cleanText = (value = "", maxLength = 300) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const cleanEmail = (value = "") =>
  cleanText(value, 320).toLowerCase();

const normalizeRole = (value = "") =>
  cleanText(value, 40).toLowerCase();

const normalizeAccountStatus = (value = "") =>
  cleanText(value, 60).toLowerCase();

const finiteInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const authTimeSeconds = (requestAuth = null) =>
  finiteInteger(requestAuth?.token?.auth_time, 0);

const emailVerified = (requestAuth = null) =>
  requestAuth?.token?.email_verified === true;

const principalFromRequest = (requestAuth = null) => {
  const uid = cleanText(requestAuth?.uid, 128);
  const email = cleanEmail(requestAuth?.token?.email);

  if (!uid || !email || !emailVerified(requestAuth)) {
    throw new HttpsError(
      "unauthenticated",
      "Verified sign-in is required."
    );
  }

  return Object.freeze({
    uid,
    email,
    authTime: authTimeSeconds(requestAuth),
    token: requestAuth?.token || {},
  });
};

const normalizeRoleAuthorityRecord = ({
  uid = "",
  email = "",
  record = {},
} = {}) => {
  const safeUid = cleanText(uid, 128);
  const safeEmail = cleanEmail(email);
  const raw = record && typeof record === "object"
    ? record
    : {};

  if (safeEmail === FIXED_ADMIN_EMAIL) {
    return Object.freeze({
      uid: safeUid,
      role: "admin",
      accountStatus: "active",
      authorityVersion:
        Math.max(1, finiteInteger(raw.authorityVersion, 1)),
      tokensValidAfterSeconds:
        Math.max(0, finiteInteger(raw.tokensValidAfterSeconds, 0)),
      source: "fixed_admin",
    });
  }

  if (safeEmail === FIXED_MENTOR_EMAIL) {
    const statusCandidate =
      normalizeAccountStatus(raw.accountStatus);
    const accountStatus =
      VALID_ACCOUNT_STATUSES.includes(statusCandidate)
        ? statusCandidate
        : "active";

    return Object.freeze({
      uid: safeUid,
      role: "mentor",
      accountStatus,
      authorityVersion:
        Math.max(1, finiteInteger(raw.authorityVersion, 1)),
      tokensValidAfterSeconds:
        Math.max(0, finiteInteger(raw.tokensValidAfterSeconds, 0)),
      source: "fixed_mentor",
    });
  }

  const roleCandidate = normalizeRole(raw.role);
  const statusCandidate =
    normalizeAccountStatus(raw.accountStatus);

  return Object.freeze({
    uid: safeUid,
    role:
      VALID_ROLES.includes(roleCandidate)
        ? roleCandidate
        : "student",
    accountStatus:
      VALID_ACCOUNT_STATUSES.includes(statusCandidate)
        ? statusCandidate
        : "active",
    authorityVersion:
      Math.max(1, finiteInteger(raw.authorityVersion, 1)),
    tokensValidAfterSeconds:
      Math.max(0, finiteInteger(raw.tokensValidAfterSeconds, 0)),
    source:
      raw && Object.keys(raw).length
        ? "role_authority"
        : "default_student",
  });
};

const claimsForAuthority = ({
  customClaims = {},
  authority,
} = {}) => Object.freeze({
  ...(customClaims && typeof customClaims === "object"
    ? customClaims
    : {}),
  aspirenestRole: authority.role,
  aspirenestAccountStatus: authority.accountStatus,
  aspirenestAuthorityVersion: authority.authorityVersion,
});

const claimsMatchAuthority = ({
  token = {},
  authority = {},
} = {}) => (
  normalizeRole(token.aspirenestRole) === authority.role
  && normalizeAccountStatus(
    token.aspirenestAccountStatus
  ) === authority.accountStatus
  && finiteInteger(
    token.aspirenestAuthorityVersion,
    0
  ) === authority.authorityVersion
);

const isTokenAtOrAfterRevocation = ({
  requestAuth = null,
  authority = {},
} = {}) => {
  const threshold =
    Math.max(
      0,
      finiteInteger(
        authority.tokensValidAfterSeconds,
        0
      )
    );

  if (!threshold) {
    return true;
  }

  return authTimeSeconds(requestAuth) > threshold;
};

const tokenValidAfterSeconds = (userRecord = {}) => {
  const ms = Date.parse(
    String(userRecord.tokensValidAfterTime || "")
  );

  return Number.isFinite(ms)
    ? Math.floor(ms / 1000)
    : 0;
};

const calculateStudentProfileCompletion = (
  profile = {}
) => {
  const fields = [
    "fullName",
    "phone",
    "targetExam",
    "state",
    "city",
    "language",
    "qualification",
  ];

  const complete =
    fields.filter(
      (field) => cleanText(profile[field], 500)
    ).length;

  return Object.freeze({
    percentage:
      Math.round(
        (complete / fields.length) * 100
      ),
    missingFields:
      fields.filter(
        (field) => !cleanText(profile[field], 500)
      ),
  });
};

const coarseDeviceMetadata = (rawRequest = null) => {
  const headers =
    rawRequest && typeof rawRequest === "object"
      ? rawRequest.headers || {}
      : {};
  const userAgent = cleanText(
    headers["user-agent"]
      || headers["User-Agent"]
      || "",
    800
  );
  const lowered = userAgent.toLowerCase();
  const platform =
    lowered.includes("android") ? "Android"
      : lowered.includes("iphone") || lowered.includes("ipad") ? "iOS"
        : lowered.includes("windows") ? "Windows"
          : lowered.includes("mac os") || lowered.includes("macintosh") ? "macOS"
            : lowered.includes("linux") ? "Linux"
              : "Unknown";
  const browser =
    lowered.includes("edg/") ? "Edge"
      : lowered.includes("firefox/") ? "Firefox"
        : lowered.includes("chrome/") || lowered.includes("crios/") ? "Chrome"
          : lowered.includes("safari/") ? "Safari"
            : "Unknown";
  const hash = createHash("sha256")
    .update(userAgent || "unknown-user-agent")
    .digest("hex")
    .slice(0, 24);

  return Object.freeze({
    deviceKey: hash,
    platform,
    browser,
  });
};

const sanitizeStudentProfile = (
  payload = {}
) => {
  const source =
    payload && typeof payload === "object"
      ? (
          payload.profile
          && typeof payload.profile === "object"
            ? payload.profile
            : payload
        )
      : {};

  const sanitized = {};

  for (const field of STUDENT_PROFILE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(
      source,
      field
    )) {
      continue;
    }

    sanitized[field] =
      cleanText(source[field], 500);
  }

  if (
    !sanitized.fullName
    && sanitized.name
  ) {
    sanitized.fullName =
      sanitized.name;
  }

  delete sanitized.name;

  return Object.freeze(sanitized);
};

const assertRecentAuth = ({
  principal,
  nowMs = Date.now(),
} = {}) => {
  const nowSeconds =
    Math.floor(Number(nowMs) / 1000);
  const authTime =
    finiteInteger(principal?.authTime, 0);

  if (
    !Number.isFinite(nowSeconds)
    || !authTime
    || authTime > nowSeconds + 60
    || nowSeconds - authTime >
      RECENT_AUTH_MAX_AGE_SECONDS
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Recent authentication is required."
    );
  }
};

const createLp2IdentityAuthorityService = ({
  adminAuth = getAuth(),
  firestore = getFirestore(),
  now = () => Date.now(),
} = {}) => {
  if (
    !adminAuth
    || typeof adminAuth.getUser !== "function"
    || typeof adminAuth.setCustomUserClaims !== "function"
    || typeof adminAuth.revokeRefreshTokens !== "function"
    || typeof adminAuth.updateUser !== "function"
  ) {
    throw new TypeError(
      "LP2 identity authority requires Firebase Admin Auth."
    );
  }

  if (
    !firestore
    || typeof firestore.collection !== "function"
  ) {
    throw new TypeError(
      "LP2 identity authority requires Firestore."
    );
  }

  const authorityRef = (uid) =>
    firestore
      .collection(ROLE_AUTHORITY_COLLECTION)
      .doc(uid);

  const auditRef = () =>
    firestore
      .collection(IDENTITY_AUDIT_COLLECTION)
      .doc(randomUUID());

  const learnerProfileRef = (uid) =>
    firestore
      .collection(LEARNER_PROFILE_COLLECTION)
      .doc(uid);

  const mentorProfileRef = (uid) =>
    firestore
      .collection(MENTOR_PROFILE_COLLECTION)
      .doc(uid);

  const accountDeviceRef = (uid, deviceKey) =>
    firestore
      .collection(ACCOUNT_DEVICE_COLLECTION)
      .doc(`${uid}_${deviceKey}`);

  const getAuthoritySnapshot =
    async (uid) => {
      const snapshot =
        await authorityRef(uid).get();

      if (
        !snapshot
        || snapshot.exists !== true
      ) {
        return Object.freeze({});
      }

      const data =
        typeof snapshot.data === "function"
          ? snapshot.data()
          : {};

      return Object.freeze({
        ...(data && typeof data === "object"
          ? data
          : {}),
      });
    };

  const getEffectiveAuthority =
    async ({
      uid,
      email,
    }) => {
      const authorityRecord =
        await getAuthoritySnapshot(uid);

      if (
        authorityRecord
        && Object.keys(authorityRecord).length
      ) {
        return normalizeRoleAuthorityRecord({
          uid,
          email,
          record: authorityRecord,
        });
      }

      const fixed = normalizeRoleAuthorityRecord({
        uid,
        email,
        record: {},
      });

      if (fixed.source !== "default_student") {
        return fixed;
      }

      const mentorSnapshot = await mentorProfileRef(uid).get();
      const mentorRecord =
        mentorSnapshot?.exists === true
          && typeof mentorSnapshot.data === "function"
          ? mentorSnapshot.data() || {}
          : {};

      if (
        cleanText(mentorRecord.mentorUid, 128) === cleanText(uid, 128)
        && normalizeRole(mentorRecord.role) === "mentor"
        && normalizeAccountStatus(mentorRecord.status) === "active"
      ) {
        return Object.freeze({
          uid: cleanText(uid, 128),
          role: "mentor",
          accountStatus: "active",
          authorityVersion: 1,
          tokensValidAfterSeconds: 0,
          source: "legacy_active_mentor_profile",
        });
      }

      return fixed;
    };

  const assertOperationalPrincipal =
    async (requestAuth) => {
      const principal =
        principalFromRequest(requestAuth);

      const authority =
        await getEffectiveAuthority({
          uid: principal.uid,
          email: principal.email,
        });

      if (
        authority.accountStatus !== "active"
        || !isTokenAtOrAfterRevocation({
          requestAuth,
          authority,
        })
      ) {
        throw new HttpsError(
          "permission-denied",
          "This account is not active."
        );
      }

      return Object.freeze({
        principal,
        authority,
      });
    };

  const assertAdminActor =
    async (requestAuth) => {
      const {
        principal,
        authority,
      } =
        await assertOperationalPrincipal(
          requestAuth
        );

      if (principal.email === FIXED_ADMIN_EMAIL) {
        assertRecentAuth({
          principal,
          nowMs: now(),
        });

        return Object.freeze({
          principal,
          authority,
        });
      }

      if (
        authority.role !== "admin"
        || !claimsMatchAuthority({
          token: principal.token,
          authority,
        })
      ) {
        throw new HttpsError(
          "permission-denied",
          "Admin authority is required."
        );
      }

      assertRecentAuth({
        principal,
        nowMs: now(),
      });

      return Object.freeze({
        principal,
        authority,
      });
    };

  const writeAudit =
    async ({
      actor,
      action,
      targetUid,
      before,
      after,
      reason = "",
    }) => {
      await auditRef().set({
        actorUid:
          cleanText(actor?.uid, 128),
        actorEmail:
          cleanEmail(actor?.email),
        action:
          cleanText(action, 80),
        targetUid:
          cleanText(targetUid, 128),
        before:
          before && typeof before === "object"
            ? before
            : {},
        after:
          after && typeof after === "object"
            ? after
            : {},
        reason:
          cleanText(reason, 500),
        createdAt:
          new Date(Number(now())),
      });
    };

  const persistAuthority =
    async ({
      targetUser,
      authority,
      actor,
      action,
      reason,
      before,
    }) => {
      const customClaims =
        claimsForAuthority({
          customClaims:
            targetUser.customClaims || {},
          authority,
        });

      await adminAuth
        .setCustomUserClaims(
          targetUser.uid,
          customClaims
        );

      await adminAuth
        .revokeRefreshTokens(
          targetUser.uid
        );

      const afterRevoke =
        await adminAuth.getUser(
          targetUser.uid
        );

      const finalAuthority =
        Object.freeze({
          ...authority,
          tokensValidAfterSeconds:
            tokenValidAfterSeconds(afterRevoke),
        });

      await authorityRef(
        targetUser.uid
      ).set(
        {
          uid: targetUser.uid,
          role: finalAuthority.role,
          accountStatus:
            finalAuthority.accountStatus,
          authorityVersion:
            finalAuthority.authorityVersion,
          tokensValidAfterSeconds:
            finalAuthority.tokensValidAfterSeconds,
          updatedAt:
            new Date(Number(now())),
          updatedBy:
            actor.uid,
          updatedByEmail:
            actor.email,
        },
        { merge: true }
      );

      await writeAudit({
        actor,
        action,
        targetUid: targetUser.uid,
        before,
        after: finalAuthority,
        reason,
      });

      return finalAuthority;
    };

  const setAccountRoleAuthority =
    async ({
      requestAuth = null,
      data = {},
    } = {}) => {
      const {
        principal: actor,
      } =
        await assertAdminActor(
          requestAuth
        );

      const targetUid =
        cleanText(data?.targetUid, 128);
      const requestedRole =
        normalizeRole(data?.role);
      const reason =
        cleanText(data?.reason, 500);

      if (
        !targetUid
        || !VALID_ROLES.includes(
          requestedRole
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Target UID and role are required."
        );
      }

      const targetUser =
        await adminAuth.getUser(
          targetUid
        );
      const targetEmail =
        cleanEmail(targetUser?.email);

      if (
        targetEmail === FIXED_ADMIN_EMAIL
        && requestedRole !== "admin"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Founder Admin authority cannot be demoted."
        );
      }

      if (
        targetEmail === FIXED_MENTOR_EMAIL
        && requestedRole !== "mentor"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Designated Mentor authority cannot be reassigned."
        );
      }

      const before =
        await getEffectiveAuthority({
          uid: targetUid,
          email: targetEmail,
        });

      const authority =
        Object.freeze({
          uid: targetUid,
          role:
            targetEmail === FIXED_ADMIN_EMAIL
              ? "admin"
              : targetEmail === FIXED_MENTOR_EMAIL
                ? "mentor"
                : requestedRole,
          accountStatus:
            before.accountStatus,
          authorityVersion:
            Math.max(
              1,
              before.authorityVersion + 1
            ),
          tokensValidAfterSeconds:
            before.tokensValidAfterSeconds,
        });

      const after =
        await persistAuthority({
          targetUser,
          authority,
          actor,
          action:
            "SET_ACCOUNT_ROLE_AUTHORITY",
          reason,
          before,
        });

      return Object.freeze({
        prepared: true,
        uid: targetUid,
        role: after.role,
        accountStatus:
          after.accountStatus,
        authorityVersion:
          after.authorityVersion,
        sessionsRevoked: true,
      });
    };

  const setAccountStatus =
    async ({
      requestAuth = null,
      data = {},
    } = {}) => {
      const {
        principal: actor,
      } =
        await assertAdminActor(
          requestAuth
        );

      const targetUid =
        cleanText(data?.targetUid, 128);
      const status =
        normalizeAccountStatus(
          data?.accountStatus
          || data?.status
        );
      const reason =
        cleanText(data?.reason, 500);

      if (
        !targetUid
        || !VALID_ACCOUNT_STATUSES
          .includes(status)
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Target UID and account status are required."
        );
      }

      const targetUser =
        await adminAuth.getUser(
          targetUid
        );
      const targetEmail =
        cleanEmail(targetUser?.email);

      if (
        targetEmail === FIXED_ADMIN_EMAIL
        && status !== "active"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Founder Admin account cannot be disabled here."
        );
      }

      const before =
        await getEffectiveAuthority({
          uid: targetUid,
          email: targetEmail,
        });

      await adminAuth.updateUser(
        targetUid,
        {
          disabled:
            status !== "active",
        }
      );

      const authority =
        Object.freeze({
          uid: targetUid,
          role: before.role,
          accountStatus: status,
          authorityVersion:
            Math.max(
              1,
              before.authorityVersion + 1
            ),
          tokensValidAfterSeconds:
            before.tokensValidAfterSeconds,
        });

      const after =
        await persistAuthority({
          targetUser:
            await adminAuth.getUser(
              targetUid
            ),
          authority,
          actor,
          action:
            "SET_ACCOUNT_STATUS",
          reason,
          before,
        });

      return Object.freeze({
        prepared: true,
        uid: targetUid,
        role: after.role,
        accountStatus:
          after.accountStatus,
        disabled:
          status !== "active",
        sessionsRevoked: true,
      });
    };

  const revokeOwnSessions =
    async ({
      requestAuth = null,
    } = {}) => {
      const {
        principal,
        authority,
      } =
        await assertOperationalPrincipal(
          requestAuth
        );

      const targetUser =
        await adminAuth.getUser(
          principal.uid
        );

      const normalizedAuthority =
        Object.freeze({
          ...authority,
          authorityVersion:
            Math.max(
              1,
              authority.authorityVersion
            ),
        });

      await adminAuth
        .setCustomUserClaims(
          principal.uid,
          claimsForAuthority({
            customClaims:
              targetUser.customClaims || {},
            authority:
              normalizedAuthority,
          })
        );

      await adminAuth
        .revokeRefreshTokens(
          principal.uid
        );

      const refreshed =
        await adminAuth.getUser(
          principal.uid
        );

      const threshold =
        tokenValidAfterSeconds(
          refreshed
        );

      await authorityRef(
        principal.uid
      ).set(
        {
          uid: principal.uid,
          role:
            normalizedAuthority.role,
          accountStatus:
            normalizedAuthority.accountStatus,
          authorityVersion:
            normalizedAuthority.authorityVersion,
          tokensValidAfterSeconds:
            threshold,
          lastRevokedAt:
            new Date(Number(now())),
          updatedAt:
            new Date(Number(now())),
          updatedBy:
            principal.uid,
          updatedByEmail:
            principal.email,
        },
        { merge: true }
      );

      await writeAudit({
        actor: principal,
        action: "REVOKE_OWN_SESSIONS",
        targetUid: principal.uid,
        before: authority,
        after: {
          ...normalizedAuthority,
          tokensValidAfterSeconds:
            threshold,
        },
        reason:
          "User-requested session revocation",
      });

      return Object.freeze({
        prepared: true,
        sessionsRevoked: true,
      });
    };

  const saveStudentProfile =
    async ({
      requestAuth = null,
      data = {},
    } = {}) => {
      const {
        principal,
        authority,
      } =
        await assertOperationalPrincipal(
          requestAuth
        );

      if (
        authority.role !== "student"
        || principal.email ===
          FIXED_ADMIN_EMAIL
        || principal.email ===
          FIXED_MENTOR_EMAIL
      ) {
        throw new HttpsError(
          "permission-denied",
          "Student profile write is not available for this account."
        );
      }

      const authUser =
        await adminAuth.getUser(
          principal.uid
        );

      if (
        authUser.disabled === true
        || authUser.emailVerified !== true
        || cleanEmail(authUser.email) !==
          principal.email
      ) {
        throw new HttpsError(
          "permission-denied",
          "Student profile write is not available for this account."
        );
      }

      const safeProfile =
        sanitizeStudentProfile(data);
      const completion =
        calculateStudentProfileCompletion(
          safeProfile
        );
      const ref =
        learnerProfileRef(
          principal.uid
        );
      const existing =
        await ref.get();
      const createdAt =
        existing?.exists === true
          ? undefined
          : new Date(Number(now()));

      const record = {
        ...safeProfile,
        uid: principal.uid,
        email: principal.email,
        normalizedEmail:
          principal.email,
        role: "student",
        emailVerified: true,
        profileCompletion:
          completion.percentage,
        profileMissingFields:
          completion.missingFields,
        profileStatus:
          completion.percentage >= 100
            ? "complete"
            : "incomplete",
        source:
          "v26-server-student-self",
        updatedAt:
          new Date(Number(now())),
        updatedBy:
          principal.uid,
      };

      if (createdAt) {
        record.createdAt =
          createdAt;
        record.createdBy =
          principal.uid;
      }

      await ref.set(
        record,
        { merge: true }
      );

      return Object.freeze({
        prepared: true,
        profile: Object.freeze({
          ...safeProfile,
          uid: principal.uid,
          email: principal.email,
          role: "student",
          profileCompletion:
            completion.percentage,
          profileStatus:
            record.profileStatus,
        }),
      });
    };

  const loadAccountSecurity =
    async ({
      requestAuth = null,
      rawRequest = null,
    } = {}) => {
      const {
        principal,
        authority,
      } =
        await assertOperationalPrincipal(
          requestAuth
        );
      const authUser =
        await adminAuth.getUser(
          principal.uid
        );
      const device = coarseDeviceMetadata(rawRequest);

      await accountDeviceRef(
        principal.uid,
        device.deviceKey
      ).set(
        {
          uid: principal.uid,
          deviceKey: device.deviceKey,
          platform: device.platform,
          browser: device.browser,
          authTimeSeconds: principal.authTime,
          role: authority.role,
          accountStatus: authority.accountStatus,
          lastSeenAt: new Date(Number(now())),
          source: "lp2-account-security",
        },
        { merge: true }
      );

      const providerIds =
        Array.isArray(
          authUser.providerData
        )
          ? authUser.providerData
            .map(
              (entry) =>
                cleanText(
                  entry?.providerId,
                  80
                )
            )
            .filter(Boolean)
          : [];

      return Object.freeze({
        prepared: true,
        uid: principal.uid,
        email: principal.email,
        emailVerified:
          authUser.emailVerified === true,
        role: authority.role,
        accountStatus:
          authority.accountStatus,
        disabled:
          authUser.disabled === true,
        providerIds:
          Object.freeze(
            [...new Set(providerIds)]
          ),
        createdAt:
          cleanText(
            authUser.metadata
              ?.creationTime,
            100
          ),
        lastSignInAt:
          cleanText(
            authUser.metadata
              ?.lastSignInTime,
            100
          ),
        tokensValidAfterTime:
          cleanText(
            authUser
              .tokensValidAfterTime,
            100
          ),
        otherDevicesRevocable: true,
        sessionAuthority:
          "firebase_refresh_tokens",
        deviceTracking:
          "privacy_safe_coarse_metadata",
        currentDevice: Object.freeze({
          deviceKey: device.deviceKey,
          platform: device.platform,
          browser: device.browser,
        }),
      });
    };

  return Object.freeze({
    setAccountRoleAuthority,
    setAccountStatus,
    revokeOwnSessions,
    saveStudentProfile,
    loadAccountSecurity,
    getEffectiveAuthority,
    assertAdminActor,
    assertOperationalPrincipal,
  });
};

module.exports = Object.freeze({
  ROLE_AUTHORITY_COLLECTION,
  IDENTITY_AUDIT_COLLECTION,
  LEARNER_PROFILE_COLLECTION,
  MENTOR_PROFILE_COLLECTION,
  ACCOUNT_DEVICE_COLLECTION,
  FIXED_ADMIN_EMAIL,
  FIXED_MENTOR_EMAIL,
  VALID_ROLES,
  VALID_ACCOUNT_STATUSES,
  RECENT_AUTH_MAX_AGE_SECONDS,
  STUDENT_PROFILE_FIELDS,
  cleanText,
  cleanEmail,
  normalizeRole,
  normalizeAccountStatus,
  finiteInteger,
  principalFromRequest,
  normalizeRoleAuthorityRecord,
  claimsForAuthority,
  claimsMatchAuthority,
  isTokenAtOrAfterRevocation,
  tokenValidAfterSeconds,
  calculateStudentProfileCompletion,
  coarseDeviceMetadata,
  sanitizeStudentProfile,
  assertRecentAuth,
  createLp2IdentityAuthorityService,
});
