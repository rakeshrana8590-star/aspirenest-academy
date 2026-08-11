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
    return String(value || "")
      .trim()
      .toLowerCase();
  },
  getAspireNestAllowedExperiences(identity = null) {
    const email =
      String(identity?.email || "")
        .trim()
        .toLowerCase();

    if (email === ADMIN_EMAIL) {
      return [
        "public",
        "student",
        "mentor",
        "admin",
      ];
    }

    if (email === MENTOR_EMAIL) {
      return [
        "public",
        "student",
        "mentor",
      ];
    }

    return [
      "public",
      "student",
    ];
  },
});

const user = ({
  uid = "dynamic",
  email = "dynamic@example.invalid",
} = {}) => ({
  uid,
  email,
  displayName: "Dynamic User",
  emailVerified: true,
});

const create = ({
  roleAuthority = {},
  claims = {},
  records = {},
} = {}) =>
  adapterModule
    .createRoleExperienceDependencyAdapter({
      identityContract,
      async readProfileByCollection({
        collection,
        uid,
      }) {
        return (
          records[
            `${collection}/${uid}`
          ] || {}
        );
      },
      async readRoleAuthority() {
        return roleAuthority;
      },
      async readAuthClaims() {
        return claims;
      },
    });

(async () => {
  let count = 0;
  const verify = async (fn) => {
    await fn();
    count += 1;
  };

  await verify(async () => {
    const adapter = create({
      roleAuthority: {
        uid: "dynamic-admin",
        role: "admin",
        accountStatus: "active",
        authorityVersion: 3,
        tokensValidAfterSeconds: 0,
      },
      claims: {
        aspirenestRole: "admin",
        aspirenestAccountStatus: "active",
        aspirenestAuthorityVersion: 3,
      },
      records: {
        "users/dynamic-admin": {
          fullName: "Dynamic Admin",
          role: "student",
        },
      },
    });
    const firebaseUser = user({
      uid: "dynamic-admin",
      email: "dynamic-admin@example.invalid",
    });
    const profile =
      await adapter.loadAccountProfile(
        firebaseUser
      );

    assert.equal(
      adapter.resolveRole(
        firebaseUser,
        profile
      ),
      "admin"
    );
    assert.deepEqual(
      adapter.resolveAllowedExperiences(
        firebaseUser,
        profile
      ),
      [
        "public",
        "student",
        "mentor",
        "admin",
      ]
    );
    assert.equal(
      profile.accountStatus,
      "active"
    );
  });

  await verify(async () => {
    const adapter = create({
      roleAuthority: {
        uid: "dynamic-mentor",
        role: "mentor",
        accountStatus: "active",
        authorityVersion: 5,
      },
      claims: {
        aspirenestRole: "student",
        aspirenestAccountStatus: "active",
        aspirenestAuthorityVersion: 5,
      },
      records: {
        "mentorProfiles/dynamic-mentor": {},
        "students/dynamic-mentor": {
          fullName: "Student Fallback",
        },
      },
    });
    const firebaseUser = user({
      uid: "dynamic-mentor",
      email: "dynamic-mentor@example.invalid",
    });
    const profile =
      await adapter.loadAccountProfile(
        firebaseUser
      );

    assert.equal(
      adapter.resolveRole(
        firebaseUser,
        profile
      ),
      "student"
    );
  });

  await verify(async () => {
    const adapter = create({
      roleAuthority: {
        uid: "blocked-user",
        role: "mentor",
        accountStatus: "blocked",
        authorityVersion: 7,
        tokensValidAfterSeconds: 10,
      },
      claims: {},
      records: {
        "mentorProfiles/blocked-user": {},
        "students/blocked-user": {},
      },
    });
    const firebaseUser = user({
      uid: "blocked-user",
      email: "blocked@example.invalid",
    });
    const profile =
      await adapter.loadAccountProfile(
        firebaseUser
      );

    assert.equal(
      profile.accountStatus,
      "blocked"
    );
    assert.equal(
      profile.authorityVersion,
      7
    );
  });

  await verify(async () => {
    const adapter = create({
      roleAuthority: {
        uid: "student-authority",
        role: "student",
        accountStatus: "active",
        authorityVersion: 2,
      },
      claims: {},
      records: {
        "students/student-authority": {
          fullName: "Real Student",
          role: "admin",
        },
      },
    });
    const firebaseUser = user({
      uid: "student-authority",
      email: "student-authority@example.invalid",
    });
    const profile =
      await adapter.loadAccountProfile(
        firebaseUser
      );

    assert.equal(
      adapter.resolveRole(
        firebaseUser,
        profile
      ),
      "student"
    );
    assert.equal(
      profile.role,
      "student"
    );
  });

  console.log(
    `LP2_ROLE_AUTHORITY_ADAPTER=${count}/${count}_PASS`
  );
  console.log(
    "DYNAMIC_ADMIN_REQUIRES_SERVER_DOC_PLUS_MATCHING_CLAIM=PASS"
  );
  console.log(
    "BLOCKED_STATUS_FROM_SERVER_AUTHORITY=PASS"
  );
  console.log(
    "STUDENT_PROFILE_ROLE_FORGERY_IGNORED=PASS"
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
