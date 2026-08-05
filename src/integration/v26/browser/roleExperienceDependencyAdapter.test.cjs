"use strict";

const assert = require("node:assert/strict");
const adapterModule = require(
  "./roleExperienceDependencyAdapter.js",
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
      return Object.freeze([
        "public",
        "student",
        "mentor",
        "admin",
      ]);
    }

    if (email === MENTOR_EMAIL) {
      return Object.freeze([
        "public",
        "student",
        "mentor",
      ]);
    }

    return Object.freeze([
      "public",
      "student",
    ]);
  },
});

function user(overrides = {}) {
  return {
    uid: "student-1",
    email: "student@example.com",
    displayName: "Student One",
    emailVerified: true,
    ...overrides,
  };
}

function createFixture({
  records = {},
  failures = new Set(),
} = {}) {
  const calls = [];

  const adapter =
    adapterModule.createRoleExperienceDependencyAdapter({
      identityContract,
      async readProfileByCollection(request) {
        calls.push(request);

        const key = `${request.collection}/${request.uid}`;

        if (failures.has(key)) {
          throw new Error("private-read-detail");
        }

        return records[key] || {};
      },
    });

  return {
    adapter,
    calls,
  };
}

async function main() {
  let count = 0;

  async function verify(callback) {
    await callback();
    count += 1;
  }

  await verify(async () => {
    assert.throws(
      () =>
        adapterModule.createRoleExperienceDependencyAdapter(),
      /dependencies are required/,
    );
  });

  await verify(async () => {
    assert.throws(
      () =>
        adapterModule.createRoleExperienceDependencyAdapter({
          identityContract,
        }),
      /readProfileByCollection/,
    );
  });

  await verify(async () => {
    const badIdentity = {
      ...identityContract,
      ASPIRENEST_ADMIN_EMAIL: "other@example.com",
    };

    assert.throws(
      () =>
        adapterModule.createRoleExperienceDependencyAdapter({
          identityContract: badIdentity,
          readProfileByCollection: async () => ({}),
        }),
      /fixed-email authority is invalid/,
    );
  });

  await verify(async () => {
    const { adapter, calls } = createFixture({
      records: {
        "users/admin-1": {
          role: "student",
          fullName: "Admin Name",
        },
      },
    });
    const firebaseUser = user({
      uid: "admin-1",
      email: ` ${ADMIN_EMAIL.toUpperCase()} `,
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "admin",
    );
    assert.deepEqual(
      adapter.resolveAllowedExperiences(
        firebaseUser,
        profile,
      ),
      ["public", "student", "mentor", "admin"],
    );
    assert.deepEqual(
      calls.map((item) => item.collection),
      ["users"],
    );
  });

  await verify(async () => {
    const failures = new Set([
      "users/admin-1",
    ]);
    const { adapter } = createFixture({ failures });
    const firebaseUser = user({
      uid: "admin-1",
      email: ADMIN_EMAIL,
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "admin",
    );
  });

  await verify(async () => {
    const { adapter, calls } = createFixture({
      records: {
        "users/mentor-1": {
          fullName: "Designated Mentor",
        },
        "mentorProfiles/mentor-1": {
          mentorUid: "mentor-1",
          role: "mentor",
          status: "inactive",
          degree: "PhD",
        },
      },
    });
    const firebaseUser = user({
      uid: "mentor-1",
      email: MENTOR_EMAIL,
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "mentor",
    );
    assert.equal(profile.degree, "PhD");
    assert.deepEqual(
      calls.map((item) => item.collection),
      ["users", "mentorProfiles"],
    );
  });

  await verify(async () => {
    const failures = new Set([
      "users/mentor-1",
      "mentorProfiles/mentor-1",
    ]);
    const { adapter } = createFixture({ failures });
    const firebaseUser = user({
      uid: "mentor-1",
      email: MENTOR_EMAIL,
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "mentor",
    );
  });

  await verify(async () => {
    const { adapter, calls } = createFixture({
      records: {
        "users/dynamic-1": {
          fullName: "User Record",
          username: "user-record",
        },
        "mentorProfiles/dynamic-1": {
          mentorUid: "dynamic-1",
          role: "mentor",
          status: "active",
          fullName: "Mentor Record",
          username: "mentor-record",
        },
      },
    });
    const firebaseUser = user({
      uid: "dynamic-1",
      email: "dynamic@example.com",
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "mentor",
    );
    assert.equal(profile.fullName, "Mentor Record");
    assert.equal(profile.username, "mentor-record");
    assert.deepEqual(
      adapter.resolveAllowedExperiences(
        firebaseUser,
        profile,
      ),
      ["public", "student", "mentor"],
    );
    assert.deepEqual(
      calls.map((item) => item.collection),
      ["users", "mentorProfiles"],
    );
  });

  for (const mentorRecord of [
    {
      mentorUid: "other",
      role: "mentor",
      status: "active",
    },
    {
      mentorUid: "dynamic-1",
      role: "student",
      status: "active",
    },
    {
      mentorUid: "dynamic-1",
      role: "mentor",
      status: "inactive",
    },
    {
      mentorUid: "dynamic-1",
      role: "mentor",
      status: "blocked",
    },
  ]) {
    await verify(async () => {
      const { adapter, calls } = createFixture({
        records: {
          "users/dynamic-1": {
            fullName: "User Record",
          },
          "mentorProfiles/dynamic-1": mentorRecord,
          "students/dynamic-1": {
            fullName: "Student Record",
            username: "student-record",
          },
        },
      });
      const firebaseUser = user({
        uid: "dynamic-1",
        email: "dynamic@example.com",
      });
      const profile =
        await adapter.loadAccountProfile(firebaseUser);

      assert.equal(
        adapter.resolveRole(firebaseUser, profile),
        "student",
      );
      assert.equal(profile.fullName, "Student Record");
      assert.equal(profile.username, "student-record");
      assert.deepEqual(
        calls.map((item) => item.collection),
        ["users", "mentorProfiles", "students"],
      );
    });
  }

  await verify(async () => {
    const failures = new Set([
      "mentorProfiles/dynamic-1",
    ]);
    const { adapter } = createFixture({
      records: {
        "users/dynamic-1": {
          role: "mentor",
          status: "active",
        },
        "students/dynamic-1": {
          role: "mentor",
          status: "active",
        },
      },
      failures,
    });
    const firebaseUser = user({
      uid: "dynamic-1",
      email: "dynamic@example.com",
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "student",
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/student-1": {
          fullName: "User Name",
          planType: "basic",
          role: "admin",
        },
        "mentorProfiles/student-1": {},
        "students/student-1": {
          fullName: "Student Name",
          username: "learner",
          planType: "premium",
          role: "mentor",
        },
      },
    });
    const firebaseUser = user();
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(profile.fullName, "Student Name");
    assert.equal(profile.username, "learner");
    assert.equal(profile.planType, "PREMIUM");
    assert.equal(profile.role, "student");
    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "student",
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/dynamic-1": {},
        "mentorProfiles/dynamic-1": {
          mentorUid: "dynamic-1",
          role: "mentor",
          status: "active",
        },
      },
    });
    const firebaseUser = user({
      uid: "dynamic-1",
      email: "dynamic@example.com",
    });
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.deepEqual(
      Object.getOwnPropertySymbols(profile).length,
      0,
    );
    assert.deepEqual(
      Object.getOwnPropertySymbols({ ...profile }).length,
      0,
    );
    assert.equal(
      JSON.stringify(profile).includes(
        "AspireNestV26TrustedRoleEvidence",
      ),
      false,
    );

    const cloned = { ...profile };
    assert.equal(
      adapter.resolveRole(firebaseUser, cloned),
      "student",
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/dynamic-1": {},
        "mentorProfiles/dynamic-1": {
          mentorUid: "dynamic-1",
          role: "mentor",
          status: "active",
        },
      },
    });
    const mentorUser = user({
      uid: "dynamic-1",
      email: "dynamic@example.com",
    });
    const mentorProfile =
      await adapter.loadAccountProfile(mentorUser);
    const studentUser = user({
      uid: "student-2",
      email: "student-2@example.com",
    });
    const forged = {};
    const attackerSymbol = Symbol(
      "AspireNestV26TrustedRoleEvidence",
    );

    Object.defineProperty(
      forged,
      attackerSymbol,
      {
        enumerable: false,
        value: Object.freeze({
          uid: "student-2",
          email: "student-2@example.com",
          role: "mentor",
          dynamicMentor: true,
        }),
      },
    );

    assert.deepEqual(
      Object.getOwnPropertySymbols(mentorProfile).length,
      0,
    );
    assert.equal(
      adapter.resolveRole(studentUser, forged),
      "student",
    );
    assert.deepEqual(
      adapter.resolveAllowedExperiences(
        studentUser,
        forged,
      ),
      ["public", "student"],
    );
  });

  await verify(async () => {
    const attackerAdapter =
      adapterModule.createRoleExperienceDependencyAdapter({
        identityContract,
        async readProfileByCollection({ collection, uid }) {
          if (collection === "mentorProfiles") {
            return {
              mentorUid: uid,
              role: "mentor",
              status: "active",
            };
          }

          return {};
        },
      });
    const legitimateAdapter =
      adapterModule.createRoleExperienceDependencyAdapter({
        identityContract,
        async readProfileByCollection() {
          return {};
        },
      });
    const firebaseUser = user({
      uid: "student-cross-instance",
      email: "student-cross-instance@example.com",
    });
    const attackerProfile =
      await attackerAdapter.loadAccountProfile(firebaseUser);

    assert.equal(
      attackerAdapter.resolveRole(
        firebaseUser,
        attackerProfile,
      ),
      "mentor",
    );
    assert.equal(
      legitimateAdapter.resolveRole(
        firebaseUser,
        attackerProfile,
      ),
      "student",
    );
    assert.deepEqual(
      legitimateAdapter.resolveAllowedExperiences(
        firebaseUser,
        attackerProfile,
      ),
      ["public", "student"],
    );
  });

  await verify(async () => {
    const { adapter } = createFixture();
    const firebaseUser = user();
    const forged = {
      uid: "student-1",
      email: "student@example.com",
      role: "admin",
      status: "active",
      mentorUid: "student-1",
    };

    assert.equal(
      adapter.resolveRole(firebaseUser, forged),
      "student",
    );
    assert.deepEqual(
      adapter.resolveAllowedExperiences(
        firebaseUser,
        forged,
        "admin",
      ),
      ["public", "student"],
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/dynamic-1": {},
        "mentorProfiles/dynamic-1": {
          mentorUid: "dynamic-1",
          role: "mentor",
          status: "active",
        },
      },
    });
    const firstUser = user({
      uid: "dynamic-1",
      email: "dynamic@example.com",
    });
    const profile =
      await adapter.loadAccountProfile(firstUser);
    const differentUser = user({
      uid: "different-1",
      email: "dynamic@example.com",
    });

    assert.equal(
      adapter.resolveRole(differentUser, profile),
      "student",
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/dynamic-1": {},
        "mentorProfiles/dynamic-1": {
          mentorUid: "dynamic-1",
          role: "mentor",
          status: "active",
        },
      },
    });
    const firstUser = user({
      uid: "dynamic-1",
      email: "dynamic@example.com",
    });
    const profile =
      await adapter.loadAccountProfile(firstUser);
    const differentEmailUser = user({
      uid: "dynamic-1",
      email: "changed@example.com",
    });

    assert.equal(
      adapter.resolveRole(
        differentEmailUser,
        profile,
      ),
      "student",
    );
  });

  await verify(async () => {
    const { adapter } = createFixture();
    const profile = await adapter.loadAccountProfile({
      email: "missing-uid@example.com",
    });

    assert.deepEqual(profile, {});
    assert.equal(Object.isFrozen(profile), true);
  });

  await verify(async () => {
    const { adapter, calls } = createFixture();
    await adapter.loadAccountProfile(user());

    assert.equal(calls.length, 3);

    for (const call of calls) {
      assert.equal(Object.isFrozen(call), true);
      assert.deepEqual(
        Object.keys(call).sort(),
        ["collection", "uid"],
      );
    }
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/student-1": {
          email: "forged-admin@example.com",
          normalizedEmail: ADMIN_EMAIL,
          role: "admin",
        },
        "mentorProfiles/student-1": {},
        "students/student-1": {},
      },
    });
    const firebaseUser = user();
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "student",
    );
  });

  await verify(async () => {
    const malicious = {};

    Object.defineProperty(
      malicious,
      "role",
      {
        enumerable: true,
        get() {
          throw new Error("private-getter-detail");
        },
      },
    );

    const { adapter } = createFixture({
      records: {
        "users/student-1": malicious,
        "mentorProfiles/student-1": {},
        "students/student-1": {},
      },
    });
    const firebaseUser = user();
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(
      adapter.resolveRole(firebaseUser, profile),
      "student",
    );
  });

  await verify(async () => {
    const polluted = Object.create(null);

    Object.defineProperty(
      polluted,
      "__proto__",
      {
        enumerable: true,
        value: {
          elevated: true,
        },
      },
    );

    Object.defineProperty(
      polluted,
      "constructor",
      {
        enumerable: true,
        value: {
          elevated: true,
        },
      },
    );

    const { adapter } = createFixture({
      records: {
        "users/student-1": polluted,
        "mentorProfiles/student-1": {},
        "students/student-1": {},
      },
    });
    const profile =
      await adapter.loadAccountProfile(user());

    assert.equal(profile.elevated, undefined);
    assert.equal(
      Object.getPrototypeOf(profile),
      Object.prototype,
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/student-1": [],
        "mentorProfiles/student-1": [],
        "students/student-1": [],
      },
    });
    const profile =
      await adapter.loadAccountProfile(user());

    assert.equal(
      adapter.resolveRole(user(), profile),
      "student",
    );
  });

  await verify(async () => {
    const { adapter } = createFixture({
      records: {
        "users/student-1": {},
        "mentorProfiles/student-1": {},
        "students/student-1": {},
      },
    });
    const firebaseUser = user();
    const profile =
      await adapter.loadAccountProfile(firebaseUser);

    assert.equal(Object.isFrozen(profile), true);
    assert.deepEqual(
      adapter.resolveAllowedExperiences(
        firebaseUser,
        profile,
      ),
      ["public", "student"],
    );
  });

  console.log(
    `ROLE_ADAPTER_CASES=${count}/${count}_PASS`,
  );
  console.log("FIXED_ADMIN_EMAIL_AUTHORITY=PASS");
  console.log("DESIGNATED_MENTOR_EMAIL_AUTHORITY=PASS");
  console.log("DYNAMIC_ACTIVE_MENTOR_PROFILE_AUTHORITY=PASS");
  console.log("INACTIVE_OR_MISMATCHED_MENTOR_FAIL_CLOSED=PASS");
  console.log("PROFILE_COLLECTION_PRECEDENCE=PASS");
  console.log("CALLER_ROLE_ESCALATION_REJECTED=PASS");
  console.log("TRUSTED_EVIDENCE_CLOSURE_PRIVATE=PASS");
  console.log("TRUSTED_EVIDENCE_NOT_DISCOVERABLE_OR_SERIALIZED=PASS");
  console.log("UID_EMAIL_EVIDENCE_BINDING=PASS");
  console.log("TRUSTED_EVIDENCE_FORGERY_REJECTED=PASS");
  console.log("TRUSTED_EVIDENCE_ADAPTER_INSTANCE_ISOLATION=PASS");
  console.log("ALLOWED_EXPERIENCE_MATRIX=PASS");
  console.log("READ_FAILURE_FAIL_CLOSED=PASS");
  console.log("MALICIOUS_ACCESSOR_SANITIZATION=PASS");
  console.log("PROTOTYPE_POLLUTION_KEYS_REJECTED=PASS");
  console.log("NON_RECORD_EVIDENCE_REJECTED=PASS");
  console.log("READ_DEPENDENCY_INPUT_ALLOWLIST=PASS");
  console.log("ROLE_EXPERIENCE_ADAPTER_TEST_STATUS=GREEN");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
