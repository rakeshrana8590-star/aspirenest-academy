"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { HttpsError } =
  require("firebase-functions/v2/https");
const {
  createLp2IdentityAuthorityService,
  normalizeRoleAuthorityRecord,
  claimsMatchAuthority,
  sanitizeStudentProfile,
} = require("./lp2IdentityAuthority.js");

const NOW = 1_800_000_000_000;
const NOW_SECONDS = Math.floor(NOW / 1000);

const requestAuth = ({
  uid,
  email,
  role = "",
  status = "",
  version = 0,
  authTime = NOW_SECONDS - 60,
} = {}) => ({
  uid,
  token: {
    email,
    email_verified: true,
    auth_time: authTime,
    ...(role ? { aspirenestRole: role } : {}),
    ...(status
      ? { aspirenestAccountStatus: status }
      : {}),
    ...(version
      ? { aspirenestAuthorityVersion: version }
      : {}),
  },
});

const createFirestore = ({
  records = {},
} = {}) => {
  const store = new Map(
    Object.entries(records)
  );

  const refFor = (
    collection,
    id
  ) => ({
    __key: `${collection}/${id}`,
    async get() {
      const key =
        `${collection}/${id}`;
      const exists =
        store.has(key);
      return {
        exists,
        data: () =>
          exists
            ? store.get(key)
            : undefined,
      };
    },
    async set(value, options = {}) {
      const key =
        `${collection}/${id}`;
      const existing =
        store.get(key) || {};
      store.set(
        key,
        options?.merge
          ? {
              ...existing,
              ...value,
            }
          : value
      );
    },
  });

  return {
    collection(collection) {
      return {
        doc(id) {
          return refFor(
            collection,
            id
          );
        },
      };
    },
    __store: store,
  };
};

const createAdminAuth = ({
  users = {},
} = {}) => {
  const records =
    new Map(
      Object.entries(users)
    );
  const calls = [];
  let revocationCounter = 1;

  const requireUser = (uid) => {
    if (!records.has(uid)) {
      const error =
        new Error("USER_NOT_FOUND");
      error.code =
        "auth/user-not-found";
      throw error;
    }
    return records.get(uid);
  };

  return {
    calls,
    async getUser(uid) {
      const record =
        requireUser(uid);
      return {
        ...record,
        customClaims: {
          ...(record.customClaims || {}),
        },
        providerData:
          [...(record.providerData || [])],
        metadata:
          { ...(record.metadata || {}) },
      };
    },
    async setCustomUserClaims(
      uid,
      claims
    ) {
      const record =
        requireUser(uid);
      record.customClaims = {
        ...claims,
      };
      calls.push({
        op: "setCustomUserClaims",
        uid,
        claims: { ...claims },
      });
    },
    async revokeRefreshTokens(uid) {
      const record =
        requireUser(uid);
      revocationCounter += 1;
      record.tokensValidAfterTime =
        new Date(
          NOW
          + revocationCounter * 1000
        ).toISOString();
      calls.push({
        op: "revokeRefreshTokens",
        uid,
      });
    },
    async updateUser(uid, payload) {
      const record =
        requireUser(uid);
      Object.assign(
        record,
        payload
      );
      calls.push({
        op: "updateUser",
        uid,
        payload: { ...payload },
      });
      return {
        ...record,
      };
    },
  };
};

const fixture = ({
  firestoreRecords = {},
  users = {},
} = {}) => {
  const firestore =
    createFirestore({
      records: firestoreRecords,
    });
  const adminAuth =
    createAdminAuth({
      users,
    });

  const service =
    createLp2IdentityAuthorityService({
      adminAuth,
      firestore,
      now: () => NOW,
    });

  return {
    service,
    firestore,
    adminAuth,
  };
};

test("authority normalization keeps fixed Admin and Mentor separate from commercial plan", () => {
  assert.deepEqual(
    normalizeRoleAuthorityRecord({
      uid: "founder",
      email:
        "ASPIRENESTPLATFORM@GMAIL.COM",
      record: {
        role: "student",
        accountStatus: "blocked",
      },
    }),
    {
      uid: "founder",
      role: "admin",
      accountStatus: "active",
      authorityVersion: 1,
      tokensValidAfterSeconds: 0,
      source: "fixed_admin",
    }
  );

  assert.equal(
    normalizeRoleAuthorityRecord({
      uid: "mentor",
      email: "dr.varshamaru@gmail.com",
      record: {
        role: "student",
        accountStatus: "suspended",
      },
    }).role,
    "mentor"
  );
});

test("custom claims must match role authority exactly", () => {
  const authority = {
    role: "mentor",
    accountStatus: "active",
    authorityVersion: 4,
  };

  assert.equal(
    claimsMatchAuthority({
      token: {
        aspirenestRole: "mentor",
        aspirenestAccountStatus: "active",
        aspirenestAuthorityVersion: 4,
      },
      authority,
    }),
    true
  );

  assert.equal(
    claimsMatchAuthority({
      token: {
        aspirenestRole: "admin",
        aspirenestAccountStatus: "active",
        aspirenestAuthorityVersion: 4,
      },
      authority,
    }),
    false
  );
});

test("student profile sanitizer ignores role, email, access and plan authority", () => {
  assert.deepEqual(
    sanitizeStudentProfile({
      profile: {
        fullName: " Learner One ",
        phone: " 9999999999 ",
        targetExam: " CTET ",
        email: "attacker@example.com",
        role: "admin",
        planType: "MENTORSHIP",
        accessStatus: "active",
      },
    }),
    {
      fullName: "Learner One",
      phone: "9999999999",
      targetExam: "CTET",
    }
  );
});

test("founder Admin can assign dynamic Mentor and sessions are revoked", async () => {
  const {
    service,
    firestore,
    adminAuth,
  } = fixture({
    users: {
      founder: {
        uid: "founder",
        email:
          "aspirenestplatform@gmail.com",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
      target: {
        uid: "target",
        email:
          "target@example.invalid",
        emailVerified: true,
        disabled: false,
        customClaims: {
          existingClaim: "preserved",
        },
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  const result =
    await service.setAccountRoleAuthority({
      requestAuth: requestAuth({
        uid: "founder",
        email:
          "aspirenestplatform@gmail.com",
      }),
      data: {
        targetUid: "target",
        role: "mentor",
        reason: "LP2 test",
      },
    });

  assert.equal(
    result.role,
    "mentor"
  );
  assert.equal(
    result.sessionsRevoked,
    true
  );

  const authority =
    firestore.__store.get(
      "roleAuthorities/target"
    );

  assert.equal(
    authority.role,
    "mentor"
  );
  assert.equal(
    authority.accountStatus,
    "active"
  );
  assert.ok(
    authority.tokensValidAfterSeconds >
      NOW_SECONDS
  );

  const claimsCall =
    adminAuth.calls.find(
      (call) =>
        call.op ===
        "setCustomUserClaims"
    );

  assert.equal(
    claimsCall.claims.existingClaim,
    "preserved"
  );
  assert.equal(
    claimsCall.claims.aspirenestRole,
    "mentor"
  );
});

test("dynamic Admin requires matching claims and recent authentication", async () => {
  const {
    service,
  } = fixture({
    firestoreRecords: {
      "roleAuthorities/admin2": {
        uid: "admin2",
        role: "admin",
        accountStatus: "active",
        authorityVersion: 2,
        // Keep this token post-revocation so this assertion isolates
        // the separate 15-minute recent-authentication boundary.
        tokensValidAfterSeconds:
          NOW_SECONDS - 7200,
      },
    },
    users: {
      admin2: {
        uid: "admin2",
        email:
          "admin2@example.invalid",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
      target: {
        uid: "target",
        email:
          "target@example.invalid",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  await assert.rejects(
    () =>
      service.setAccountRoleAuthority({
        requestAuth: requestAuth({
          uid: "admin2",
          email:
            "admin2@example.invalid",
          role: "student",
          status: "active",
          version: 2,
        }),
        data: {
          targetUid: "target",
          role: "mentor",
        },
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "permission-denied"
  );

  await assert.rejects(
    () =>
      service.setAccountRoleAuthority({
        requestAuth: requestAuth({
          uid: "admin2",
          email:
            "admin2@example.invalid",
          role: "admin",
          status: "active",
          version: 2,
          authTime:
            NOW_SECONDS - 3600,
        }),
        data: {
          targetUid: "target",
          role: "mentor",
        },
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "failed-precondition"
  );
});

test("blocked account is disabled and server authority changes immediately", async () => {
  const {
    service,
    firestore,
    adminAuth,
  } = fixture({
    firestoreRecords: {
      "roleAuthorities/student": {
        uid: "student",
        role: "student",
        accountStatus: "active",
        authorityVersion: 1,
        tokensValidAfterSeconds: 0,
      },
    },
    users: {
      founder: {
        uid: "founder",
        email:
          "aspirenestplatform@gmail.com",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
      student: {
        uid: "student",
        email:
          "student@example.invalid",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  const result =
    await service.setAccountStatus({
      requestAuth: requestAuth({
        uid: "founder",
        email:
          "aspirenestplatform@gmail.com",
      }),
      data: {
        targetUid: "student",
        accountStatus: "blocked",
      },
    });

  assert.equal(
    result.accountStatus,
    "blocked"
  );
  assert.equal(
    result.disabled,
    true
  );

  assert.equal(
    adminAuth.calls.some(
      (call) =>
        call.op === "updateUser"
        && call.payload.disabled === true
    ),
    true
  );

  assert.equal(
    firestore.__store.get(
      "roleAuthorities/student"
    ).accountStatus,
    "blocked"
  );
});

test("Admin preview cannot save Student profile", async () => {
  const {
    service,
  } = fixture({
    users: {
      founder: {
        uid: "founder",
        email:
          "aspirenestplatform@gmail.com",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  await assert.rejects(
    () =>
      service.saveStudentProfile({
        requestAuth: requestAuth({
          uid: "founder",
          email:
            "aspirenestplatform@gmail.com",
        }),
        data: {
          profile: {
            fullName: "Forged Student",
          },
        },
      }),
    (error) =>
      error instanceof HttpsError
      && error.code ===
        "permission-denied"
  );
});

test("Student profile persistence derives identity and excludes privilege fields", async () => {
  const {
    service,
    firestore,
  } = fixture({
    users: {
      student: {
        uid: "student",
        email:
          "student@example.invalid",
        emailVerified: true,
        disabled: false,
        providerData: [
          {
            providerId: "password",
          },
        ],
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  const result =
    await service.saveStudentProfile({
      requestAuth: requestAuth({
        uid: "student",
        email:
          "student@example.invalid",
      }),
      data: {
        profile: {
          fullName: "Learner One",
          phone: "9999999999",
          email:
            "attacker@example.invalid",
          role: "admin",
          planType: "PREMIUM",
          entitlement: "all",
        },
      },
    });

  assert.equal(
    result.prepared,
    true
  );

  const stored =
    firestore.__store.get(
      "learnerProfiles/student"
    );

  assert.equal(
    stored.uid,
    "student"
  );
  assert.equal(
    stored.email,
    "student@example.invalid"
  );
  assert.equal(
    stored.role,
    "student"
  );
  assert.equal(
    "planType" in stored,
    false
  );
  assert.equal(
    "entitlement" in stored,
    false
  );
});

test("self session revocation records token epoch without changing plan or access", async () => {
  const {
    service,
    firestore,
  } = fixture({
    users: {
      student: {
        uid: "student",
        email:
          "student@example.invalid",
        emailVerified: true,
        disabled: false,
        customClaims: {},
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  const result =
    await service.revokeOwnSessions({
      requestAuth: requestAuth({
        uid: "student",
        email:
          "student@example.invalid",
      }),
    });

  assert.equal(
    result.sessionsRevoked,
    true
  );

  const authority =
    firestore.__store.get(
      "roleAuthorities/student"
    );

  assert.equal(
    authority.role,
    "student"
  );
  assert.equal(
    authority.accountStatus,
    "active"
  );
  assert.ok(
    authority.tokensValidAfterSeconds >
      NOW_SECONDS
  );
  assert.equal(
    "planType" in authority,
    false
  );
});

test("account security returns only safe provider/session metadata", async () => {
  const {
    service,
  } = fixture({
    users: {
      student: {
        uid: "student",
        email:
          "student@example.invalid",
        emailVerified: true,
        disabled: false,
        providerData: [
          {
            providerId: "password",
          },
          {
            providerId: "google.com",
          },
        ],
        metadata: {
          creationTime:
            "2026-08-11T00:00:00Z",
          lastSignInTime:
            "2026-08-11T01:00:00Z",
        },
        tokensValidAfterTime:
          "2026-08-11T00:00:00Z",
      },
    },
  });

  const result =
    await service.loadAccountSecurity({
      requestAuth: requestAuth({
        uid: "student",
        email:
          "student@example.invalid",
      }),
      rawRequest: {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0) Chrome/140.0",
        },
      },
    });

  assert.deepEqual(
    result.providerIds,
    [
      "password",
      "google.com",
    ]
  );
  assert.equal(
    result.sessionAuthority,
    "firebase_refresh_tokens"
  );
  assert.equal(
    result.deviceTracking,
    "privacy_safe_coarse_metadata"
  );
  assert.equal(
    result.currentDevice.platform,
    "Windows"
  );
  assert.equal(
    result.currentDevice.browser,
    "Chrome"
  );
  assert.equal(
    "ip" in result,
    false
  );
});

test("legacy active Mentor profile remains Mentor on the server boundary", async () => {
  const { service } = fixture({
    firestoreRecords: {
      "mentorProfiles/legacy-mentor": {
        mentorUid: "legacy-mentor",
        role: "mentor",
        status: "active",
      },
    },
    users: {
      "legacy-mentor": {
        uid: "legacy-mentor",
        email: "legacy@example.invalid",
        emailVerified: true,
        disabled: false,
        tokensValidAfterTime:
          new Date(NOW - 10000).toISOString(),
      },
    },
  });

  const authority =
    await service.getEffectiveAuthority({
      uid: "legacy-mentor",
      email: "legacy@example.invalid",
    });

  assert.equal(authority.role, "mentor");
  assert.equal(authority.accountStatus, "active");
  assert.equal(authority.source, "legacy_active_mentor_profile");
});

console.log("LP2_IDENTITY_AUTHORITY_UNIT=GREEN");
