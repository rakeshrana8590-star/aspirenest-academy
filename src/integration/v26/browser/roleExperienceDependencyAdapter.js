(function exposeAspireNestV26RoleExperienceDependencyAdapter(
  root,
  factory,
) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (
    root
    && !root.AspireNestV26RoleExperienceDependencyAdapter
  ) {
    Object.defineProperty(
      root,
      'AspireNestV26RoleExperienceDependencyAdapter',
      {
        configurable: false,
        enumerable: false,
        writable: false,
        value: api,
      },
    );
  }
})(
  typeof globalThis !== 'undefined' ? globalThis : this,
  function createAspireNestV26RoleExperienceDependencyAdapterModule() {
    'use strict';

    const COLLECTIONS = Object.freeze({
      USERS: 'users',
      STUDENTS: 'students',
      MENTOR_PROFILES: 'mentorProfiles',
    });

    const ALLOWED_COLLECTIONS = Object.freeze(
      new Set(Object.values(COLLECTIONS)),
    );


    function cleanText(value) {
      return String(value == null ? '' : value).trim();
    }

    function safeRecord(value) {
      if (
        !value
        || typeof value !== 'object'
        || Array.isArray(value)
      ) {
        return {};
      }

      let descriptors;

      try {
        descriptors = Object.getOwnPropertyDescriptors(
          value,
        );
      } catch (_) {
        return {};
      }

      const record = {};

      for (const [key, descriptor] of Object.entries(
        descriptors,
      )) {
        if (
          key === '__proto__'
          || key === 'prototype'
          || key === 'constructor'
          || descriptor.enumerable !== true
          || !Object.prototype.hasOwnProperty.call(
            descriptor,
            'value',
          )
        ) {
          continue;
        }

        record[key] = descriptor.value;
      }

      return record;
    }

    function validateIdentityContract(identityContract) {
      const requiredFunctions = [
        'normalizeAspireNestEmail',
        'getAspireNestAllowedExperiences',
      ];

      if (
        !identityContract
        || typeof identityContract !== 'object'
      ) {
        throw new TypeError(
          'Role adapter requires an identity contract.',
        );
      }

      for (const name of requiredFunctions) {
        if (typeof identityContract[name] !== 'function') {
          throw new TypeError(
            `Role adapter identity function missing: ${name}`,
          );
        }
      }

      const roles = identityContract.ASPIRENEST_ROLES;

      if (
        !roles
        || roles.ADMIN !== 'admin'
        || roles.MENTOR !== 'mentor'
        || roles.STUDENT !== 'student'
      ) {
        throw new TypeError(
          'Role adapter identity roles are invalid.',
        );
      }

      const adminEmail = identityContract.normalizeAspireNestEmail(
        identityContract.ASPIRENEST_ADMIN_EMAIL,
      );
      const mentorEmail = identityContract.normalizeAspireNestEmail(
        identityContract.ASPIRENEST_MENTOR_EMAIL,
      );

      if (
        adminEmail !== 'aspirenestplatform@gmail.com'
        || mentorEmail !== 'dr.varshamaru@gmail.com'
      ) {
        throw new TypeError(
          'Role adapter fixed-email authority is invalid.',
        );
      }
    }

    function validateDependencies(dependencies) {
      if (
        !dependencies
        || typeof dependencies !== 'object'
      ) {
        throw new TypeError(
          'Role adapter dependencies are required.',
        );
      }

      validateIdentityContract(
        dependencies.identityContract,
      );

      if (
        typeof dependencies.readProfileByCollection
        !== 'function'
      ) {
        throw new TypeError(
          'Role adapter readProfileByCollection dependency '
            + 'is required.',
        );
      }
    }

    function createRoleExperienceDependencyAdapter(
      dependencies,
    ) {
      validateDependencies(dependencies);

      const {
        identityContract,
        readProfileByCollection,
      } = dependencies;

      const trustedRoleEvidence = new WeakMap();

      const {
        ASPIRENEST_ADMIN_EMAIL,
        ASPIRENEST_MENTOR_EMAIL,
        ASPIRENEST_ROLES,
        normalizeAspireNestEmail,
        getAspireNestAllowedExperiences,
      } = identityContract;

      const adminEmail = normalizeAspireNestEmail(
        ASPIRENEST_ADMIN_EMAIL,
      );
      const mentorEmail = normalizeAspireNestEmail(
        ASPIRENEST_MENTOR_EMAIL,
      );

      async function safeRead(collection, uid) {
        if (!ALLOWED_COLLECTIONS.has(collection)) {
          return Object.freeze({});
        }

        try {
          const record = await readProfileByCollection(
            Object.freeze({
              collection,
              uid,
            }),
          );

          return safeRecord(record);
        } catch (_) {
          return Object.freeze({});
        }
      }

      function isActiveDynamicMentor(record, uid) {
        const value = safeRecord(record);

        return (
          cleanText(value.mentorUid) === uid
          && cleanText(value.role).toLowerCase()
            === ASPIRENEST_ROLES.MENTOR
          && cleanText(value.status).toLowerCase()
            === 'active'
        );
      }

      function roleForEmail(email) {
        if (email === adminEmail) {
          return ASPIRENEST_ROLES.ADMIN;
        }

        if (email === mentorEmail) {
          return ASPIRENEST_ROLES.MENTOR;
        }

        return ASPIRENEST_ROLES.STUDENT;
      }

      function attachTrustedEvidence(profile, evidence) {
        trustedRoleEvidence.set(
          profile,
          Object.freeze({
            uid: evidence.uid,
            email: evidence.email,
            role: evidence.role,
            dynamicMentor:
              evidence.dynamicMentor === true,
          }),
        );

        return profile;
      }

      async function loadAccountProfile(firebaseUser) {
        const uid = cleanText(
          firebaseUser && firebaseUser.uid,
        );
        const email = normalizeAspireNestEmail(
          firebaseUser && firebaseUser.email,
        );

        if (!uid) {
          return Object.freeze({});
        }

        const fixedRole = roleForEmail(email);
        const usersRecord = await safeRead(
          COLLECTIONS.USERS,
          uid,
        );

        let secondaryRecord = {};
        let role = fixedRole;
        let dynamicMentor = false;

        if (fixedRole === ASPIRENEST_ROLES.ADMIN) {
          secondaryRecord = {};
        } else {
          const mentorRecord = await safeRead(
            COLLECTIONS.MENTOR_PROFILES,
            uid,
          );

          if (
            fixedRole === ASPIRENEST_ROLES.MENTOR
            || isActiveDynamicMentor(mentorRecord, uid)
          ) {
            role = ASPIRENEST_ROLES.MENTOR;
            dynamicMentor = (
              fixedRole !== ASPIRENEST_ROLES.MENTOR
            );
            secondaryRecord = mentorRecord;
          } else {
            role = ASPIRENEST_ROLES.STUDENT;
            secondaryRecord = await safeRead(
              COLLECTIONS.STUDENTS,
              uid,
            );
          }
        }

        const merged = Object.assign(
          {},
          safeRecord(usersRecord),
          safeRecord(secondaryRecord),
        );

        const profile = {
          ...merged,
          uid,
          email:
            cleanText(merged.email)
            || cleanText(firebaseUser && firebaseUser.email),
          normalizedEmail: normalizeAspireNestEmail(
            merged.normalizedEmail
            || merged.email
            || email,
          ),
          username: cleanText(merged.username),
          fullName: cleanText(
            merged.fullName
            || merged.name
            || merged.displayName
            || (firebaseUser && firebaseUser.displayName),
          ),
          planType: cleanText(
            merged.planType
            || merged.subscriptionType
            || merged.currentPlan,
          ).toUpperCase(),
          role,
        };

        attachTrustedEvidence(profile, {
          uid,
          email,
          role,
          dynamicMentor,
        });

        return Object.freeze(profile);
      }

      function readTrustedEvidence(
        firebaseUser,
        profile,
      ) {
        const uid = cleanText(
          firebaseUser && firebaseUser.uid,
        );
        const email = normalizeAspireNestEmail(
          firebaseUser && firebaseUser.email,
        );

        if (!uid || !profile || typeof profile !== 'object') {
          return null;
        }

        let evidence;

        try {
          evidence = trustedRoleEvidence.get(profile);
        } catch (_) {
          return null;
        }

        if (
          !evidence
          || typeof evidence !== 'object'
          || evidence.uid !== uid
          || evidence.email !== email
        ) {
          return null;
        }

        return evidence;
      }

      function resolveRole(firebaseUser, profile) {
        const email = normalizeAspireNestEmail(
          firebaseUser && firebaseUser.email,
        );
        const fixedRole = roleForEmail(email);

        if (fixedRole === ASPIRENEST_ROLES.ADMIN) {
          return ASPIRENEST_ROLES.ADMIN;
        }

        if (fixedRole === ASPIRENEST_ROLES.MENTOR) {
          return ASPIRENEST_ROLES.MENTOR;
        }

        const evidence = readTrustedEvidence(
          firebaseUser,
          profile,
        );

        if (
          evidence
          && evidence.role === ASPIRENEST_ROLES.MENTOR
          && evidence.dynamicMentor === true
        ) {
          return ASPIRENEST_ROLES.MENTOR;
        }

        return ASPIRENEST_ROLES.STUDENT;
      }

      function resolveAllowedExperiences(
        firebaseUser,
        profile,
      ) {
        const role = resolveRole(firebaseUser, profile);
        let authorityIdentity = firebaseUser;

        if (role === ASPIRENEST_ROLES.ADMIN) {
          authorityIdentity = {
            email: adminEmail,
          };
        } else if (role === ASPIRENEST_ROLES.MENTOR) {
          authorityIdentity = {
            email: mentorEmail,
          };
        }

        const values = getAspireNestAllowedExperiences(
          authorityIdentity,
        );

        return Object.freeze(
          Array.isArray(values)
            ? [...values]
            : ['public'],
        );
      }

      return Object.freeze({
        loadAccountProfile,
        resolveRole,
        resolveAllowedExperiences,
      });
    }

    return Object.freeze({
      COLLECTIONS,
      createRoleExperienceDependencyAdapter,
    });
  },
);
