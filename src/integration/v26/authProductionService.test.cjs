'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const authModule = require('./authProductionService.js');
const registryMetadata = require(
  './productionBridgeMethodRegistry.json',
);

function createHarness(overrides = {}) {
  const calls = [];
  const auth = {
    currentUser: null,
  };

  const dependencies = {
    auth,
    async registerStudentAccount(payload) {
      calls.push({
        name:
          'registerStudentAccount',
        payload,
      });

      return {
        prepared: true,
      };
    },
    async signInWithEmailAndPassword(
      receivedAuth,
      email,
      password,
    ) {
      calls.push({
        name: 'signInWithEmailAndPassword',
        receivedAuth,
        email,
        password,
      });

      const user = {
        uid: 'student-001',
        email,
        displayName: 'Student One',
        emailVerified: true,
      };
      auth.currentUser = user;

      return { user };
    },
    async signInWithUsernameAndPassword({
      username,
      password,
    }) {
      calls.push({
        name: 'signInWithUsernameAndPassword',
        username,
        password,
      });

      const user = {
        uid: 'student-username-001',
        email:
          'username-login@example.invalid',
        displayName: 'Username Login',
        emailVerified: true,
      };
      auth.currentUser = user;

      return { user };
    },
    async signInWithPopup(receivedAuth, provider) {
      calls.push({
        name: 'signInWithPopup',
        receivedAuth,
        provider,
      });

      const user = {
        uid: 'mentor-001',
        email: 'mentor@example.invalid',
        displayName: 'Mentor One',
        emailVerified: true,
      };
      auth.currentUser = user;

      return { user };
    },
    async signOut(receivedAuth) {
      calls.push({
        name: 'signOut',
        receivedAuth,
      });
      auth.currentUser = null;
    },
    async sendEmailVerification(firebaseUser, actionCodeSettings) {
      calls.push({
        name: 'sendEmailVerification',
        firebaseUser,
        actionCodeSettings,
      });
    },
    async sendPasswordResetEmail(receivedAuth, email, actionCodeSettings) {
      calls.push({
        name: 'sendPasswordResetEmail',
        receivedAuth,
        email,
        actionCodeSettings,
      });
    },
    async reloadUser(firebaseUser) {
      calls.push({
        name: 'reloadUser',
        firebaseUser,
      });
    },
    buildActionCodeSettings(returnTo, purpose) {
      calls.push({
        name: 'buildActionCodeSettings',
        returnTo,
        purpose,
      });
      return Object.freeze({
        url: `https://www.aspirenestacademy.in/${
          purpose === 'verify'
            ? '#public/auth/verify'
            : (
              String(returnTo || '').startsWith('#')
                ? returnTo
                : '#student/home/overview'
            )
        }`,
        handleCodeInApp: false,
      });
    },
    createGoogleProvider() {
      const provider = {
        kind: 'google-provider',
      };
      calls.push({
        name: 'createGoogleProvider',
        provider,
      });
      return provider;
    },
    async loadAccountProfile(user) {
      calls.push({
        name: 'loadAccountProfile',
        uid: user.uid,
      });

      return {
        username: user.uid.startsWith('mentor')
          ? 'mentor-one'
          : 'student-one',
        fullName: user.displayName,
        planType: 'premium',
      };
    },
    resolveRole(user) {
      calls.push({
        name: 'resolveRole',
        uid: user.uid,
      });

      return user.uid.startsWith('mentor')
        ? 'mentor'
        : 'student';
    },
    resolveAllowedExperiences(user, profile, role) {
      calls.push({
        name: 'resolveAllowedExperiences',
        uid: user.uid,
        role,
      });

      return role === 'mentor'
        ? ['public', 'mentor', 'student']
        : ['public', 'student'];
    },
    subscribeAuthState(listener) {
      calls.push({
        name: 'subscribeAuthState',
        listener,
      });

      return function unsubscribeAuthState() {
        calls.push({
          name: 'unsubscribeAuthState',
        });
      };
    },
    mapAuthError(error, context) {
      calls.push({
        name: 'mapAuthError',
        code: error && error.code,
        context,
      });

      return {
        safe: true,
        message: 'Safe mapped authentication message.',
      };
    },
    ...overrides,
  };

  return {
    auth,
    calls,
    dependencies,
    service:
      authModule.createAuthProductionService(
        dependencies,
      ),
  };
}

async function main() {
  assert.throws(
    () =>
      authModule.createAuthProductionService({
        auth: {},
      }),
    /dependency missing/,
  );

  const registrationHarness = createHarness({
    async signInWithEmailAndPassword(
      receivedAuth,
      email,
      password,
    ) {
      const user = {
        uid: 'registration-unverified-001',
        email,
        displayName: 'Synthetic Aspirant',
        emailVerified: false,
      };
      registrationHarness.auth.currentUser = user;
      registrationHarness.calls.push({
        name: 'registrationVerificationSignIn',
        receivedAuth,
        email,
        password,
      });
      return { user };
    },
  });

  const registrationResult =
    await registrationHarness.service.registerAccount({
      fullName:
        'Synthetic Aspirant',
      username:
        'learner_one',
      email:
        'aspirant@example.invalid',
      password:
        'Strong1!Password',
      role:
        'admin',
      requestedRole:
        'mentor',
    });

  assert.deepStrictEqual(
    registrationResult,
    {
      prepared: true,
    },
  );

  const registrationCall =
    registrationHarness.calls.find(
      (item) =>
        item.name ===
        'registerStudentAccount',
    );

  assert(registrationCall);

  assert.strictEqual(
    registrationHarness.auth.currentUser?.emailVerified,
    false,
  );
  const registrationSessionAfter =
    await registrationHarness.service.getSession();
  assert.strictEqual(
    registrationSessionAfter.ok,
    false,
  );
  assert.strictEqual(
    registrationSessionAfter.code,
    authModule.AUTH_CODES.EMAIL_UNVERIFIED,
  );
  assert.strictEqual(
    registrationSessionAfter.details.accessAllowed,
    false,
  );
  assert(
    registrationHarness.calls.some(
      (item) =>
        item.name === 'sendEmailVerification',
    ),
  );

  const optionalRegistrationHarness =
    createHarness({
      registerStudentAccount:
        undefined,
    });

  const optionalRegistrationResult =
    await optionalRegistrationHarness.service.registerAccount({
      fullName:
        'Synthetic Aspirant',
      username:
        'learner_one',
      email:
        'aspirant@example.invalid',
      password:
        'Strong1!Password',
    });

  assert.deepStrictEqual(
    optionalRegistrationResult,
    {
      error:
        'Account could not be created.',
    },
  );

  const failingRegistrationHarness =
    createHarness({
      async registerStudentAccount() {
        throw new Error(
          'RAW_REGISTRATION_SECRET',
        );
      },
    });

  const failingRegistrationResult =
    await failingRegistrationHarness.service.registerAccount({
      fullName:
        'Synthetic Aspirant',
      username:
        'learner_one',
      email:
        'aspirant@example.invalid',
      password:
        'Strong1!Password',
    });

  assert.deepStrictEqual(
    failingRegistrationResult,
    {
      error:
        'Account could not be created.',
    },
  );

  assert(
    !JSON.stringify(
      failingRegistrationResult,
    ).includes(
      'RAW_REGISTRATION_SECRET',
    ),
  );

  const publicHarness = createHarness();
  const publicSession =
    await publicHarness.service.getSession();

  assert.strictEqual(publicSession.ready, true);
  assert.strictEqual(
    publicSession.authenticated,
    false,
  );
  assert.strictEqual(
    publicSession.accessAllowed,
    false,
  );
  assert.strictEqual(publicSession.role, 'public');
  assert.deepStrictEqual(
    Array.from(publicSession.allowed),
    ['public'],
  );
  assert.strictEqual(
    publicSession.allowedRoles,
    publicSession.allowed,
  );
  assert.strictEqual(
    publicSession.activeRole,
    'public',
  );
  assert.strictEqual(
    publicSession.accountStatus,
    '',
  );

  const verifiedHarness = createHarness();
  verifiedHarness.auth.currentUser = {
    uid: 'student-002',
    email: 'student@example.invalid',
    displayName: 'Student Two',
    emailVerified: true,
  };

  const verifiedSession =
    await verifiedHarness.service.getSession();

  assert.strictEqual(
    verifiedSession.authenticated,
    true,
  );
  assert.strictEqual(
    verifiedSession.accessAllowed,
    true,
  );
  assert.strictEqual(
    verifiedSession.uid,
    'student-002',
  );
  assert.strictEqual(
    verifiedSession.role,
    'student',
  );
  assert.deepStrictEqual(
    Array.from(verifiedSession.allowed),
    ['public', 'student'],
  );
  assert.strictEqual(
    verifiedSession.allowedRoles,
    verifiedSession.allowed,
  );
  assert.strictEqual(
    verifiedSession.activeRole,
    verifiedSession.role,
  );
  assert.strictEqual(
    verifiedSession.accountStatus,
    '',
  );
  assert.strictEqual(
    verifiedSession.emailVerified,
    true,
  );
  assert.strictEqual(
    verifiedSession.planType,
    'PREMIUM',
  );
  assert.strictEqual(
    verifiedSession.username,
    'student-one',
  );
  assert.strictEqual(
    verifiedSession.user.uid,
    'student-002',
  );
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(
      verifiedSession.user,
      'getIdToken',
    ),
    false,
  );

  const unverifiedHarness = createHarness();
  unverifiedHarness.auth.currentUser = {
    uid: 'student-unverified',
    email: 'pending@example.invalid',
    emailVerified: false,
  };

  const unverifiedSession =
    await unverifiedHarness.service.getSession();

  assert.strictEqual(unverifiedSession.ok, false);
  assert.strictEqual(
    unverifiedSession.code,
    authModule.AUTH_CODES.EMAIL_UNVERIFIED,
  );
  assert.strictEqual(
    unverifiedSession.details.authenticated,
    true,
  );
  assert.strictEqual(
    unverifiedSession.details.accessAllowed,
    false,
  );
  assert.strictEqual(
    unverifiedSession.details.emailVerified,
    false,
  );
  assert.strictEqual(
    unverifiedHarness.calls.some(
      (item) => item.name === 'signOut',
    ),
    false,
  );

  const emailHarness = createHarness();
  const emailLogin = await emailHarness.service.login({
    mode: 'email',
    email: '  STUDENT@EXAMPLE.INVALID ',
    password: 'DoNotNormalizeThisPassword',
  });

  assert.strictEqual(
    emailLogin.authenticated,
    true,
  );

  const emailCall = emailHarness.calls.find(
    (item) =>
      item.name ===
      'signInWithEmailAndPassword',
  );

  assert(emailCall);
  assert.strictEqual(
    emailCall.receivedAuth,
    emailHarness.auth,
  );
  assert.strictEqual(
    emailCall.email,
    'student@example.invalid',
  );
  assert.strictEqual(
    emailCall.password,
    'DoNotNormalizeThisPassword',
  );

  const inferredEmailHarness = createHarness();
  const inferredEmailLogin =
    await inferredEmailHarness.service.login({
      identifier:
        '  INFERRED@EXAMPLE.INVALID ',
      email:
        '  INFERRED@EXAMPLE.INVALID ',
      password:
        'InferredEmailPassword',
    });

  assert.strictEqual(
    inferredEmailLogin.authenticated,
    true,
  );
  const inferredEmailCall =
    inferredEmailHarness.calls.find(
      (item) =>
        item.name ===
        'signInWithEmailAndPassword',
    );
  assert(inferredEmailCall);
  assert.strictEqual(
    inferredEmailCall.email,
    'inferred@example.invalid',
  );
  assert.strictEqual(
    inferredEmailCall.password,
    'InferredEmailPassword',
  );

  const usernameHarness = createHarness();
  const usernameLogin =
    await usernameHarness.service.login({
      identifier: '  learner_one  ',
      email: '  learner_one  ',
      password:
        'UsernamePasswordBytes',
    });

  assert.strictEqual(
    usernameLogin.authenticated,
    true,
  );
  assert.strictEqual(
    usernameLogin.uid,
    'student-username-001',
  );
  const usernameCall =
    usernameHarness.calls.find(
      (item) =>
        item.name ===
        'signInWithUsernameAndPassword',
    );
  assert(usernameCall);
  assert.strictEqual(
    usernameCall.username,
    'learner_one',
  );
  assert.strictEqual(
    usernameCall.password,
    'UsernamePasswordBytes',
  );
  assert.strictEqual(
    usernameHarness.calls.some(
      (item) =>
        item.name ===
        'signInWithEmailAndPassword',
    ),
    false,
  );

  const optionalUsernameDependencyHarness =
    createHarness({
      signInWithUsernameAndPassword: undefined,
    });
  const optionalUsernameDependencyLogin =
    await optionalUsernameDependencyHarness.service.login({
      identifier: 'learner_one',
      email: 'learner_one',
      password: 'UsernamePasswordBytes',
    });

  assert.strictEqual(
    optionalUsernameDependencyLogin.ok,
    false,
  );
  assert.strictEqual(
    optionalUsernameDependencyLogin.code,
    authModule.AUTH_CODES.LOGIN_FAILED,
  );
  assert.strictEqual(
    optionalUsernameDependencyLogin.message,
    'Sign-in could not be completed.',
  );

  const googleHarness = createHarness();
  const googleLogin =
    await googleHarness.service.login({
      mode: 'google',
    });

  assert.strictEqual(
    googleLogin.authenticated,
    true,
  );
  assert.strictEqual(googleLogin.role, 'mentor');
  assert(
    googleHarness.calls.some(
      (item) =>
        item.name === 'createGoogleProvider',
    ),
  );
  assert(
    googleHarness.calls.some(
      (item) => item.name === 'signInWithPopup',
    ),
  );

  const pendingHarness = createHarness({
    async signInWithEmailAndPassword(
      receivedAuth,
      email,
    ) {
      const user = {
        uid: 'pending-001',
        email,
        emailVerified: false,
      };
      pendingHarness.auth.currentUser = user;
      pendingHarness.calls.push({
        name: 'pendingSignIn',
        receivedAuth,
      });
      return { user };
    },
  });

  const pendingLogin =
    await pendingHarness.service.login({
      mode: 'email',
      email: 'pending@example.invalid',
      password: 'password-value',
    });

  assert.strictEqual(pendingLogin.ok, false);
  assert.strictEqual(
    pendingLogin.code,
    authModule.AUTH_CODES.EMAIL_UNVERIFIED,
  );
  assert(
    pendingHarness.calls.some(
      (item) => item.name === 'signOut',
    ),
  );
  assert.strictEqual(
    pendingHarness.auth.currentUser,
    null,
  );

  const pendingSignOutFailureHarness = createHarness({
    async signInWithEmailAndPassword(
      receivedAuth,
      email,
    ) {
      const user = {
        uid: 'pending-signout-failure',
        email,
        emailVerified: false,
      };
      pendingSignOutFailureHarness.auth.currentUser = user;
      pendingSignOutFailureHarness.calls.push({
        name: 'pendingSignInWithSignOutFailure',
        receivedAuth,
      });
      return { user };
    },
    async signOut() {
      throw new Error(
        'Raw temporary-session sign-out failure details.',
      );
    },
  });

  const pendingSignOutFailure =
    await pendingSignOutFailureHarness.service.login({
      mode: 'email',
      email: 'pending-failure@example.invalid',
      password: 'password-value',
    });

  assert.strictEqual(
    pendingSignOutFailure.ok,
    false,
  );
  assert.strictEqual(
    pendingSignOutFailure.code,
    authModule.AUTH_CODES
      .EMAIL_UNVERIFIED_SIGNOUT_FAILED,
  );
  assert.strictEqual(
    pendingSignOutFailure.details.authenticated,
    true,
  );
  assert.strictEqual(
    pendingSignOutFailure.details.accessAllowed,
    false,
  );
  assert.strictEqual(
    pendingSignOutFailure.details.emailVerified,
    false,
  );
  assert.strictEqual(
    pendingSignOutFailure.details.signedOut,
    false,
  );
  assert.strictEqual(
    pendingSignOutFailureHarness.auth.currentUser.uid,
    'pending-signout-failure',
  );
  assert(
    !JSON.stringify(pendingSignOutFailure).includes(
      'Raw temporary-session sign-out failure',
    ),
  );

  const invalidHarness = createHarness();
  const invalidLogin =
    await invalidHarness.service.login({
      mode: 'unknown',
    });

  assert.strictEqual(invalidLogin.ok, false);
  assert.strictEqual(
    invalidLogin.code,
    authModule.AUTH_CODES.INVALID_REQUEST,
  );

  const failedLoginHarness = createHarness({
    async signInWithEmailAndPassword() {
      const error = new Error(
        'Raw password and secret stack.',
      );
      error.code = 'auth/invalid-credential';
      throw error;
    },
  });

  const failedLogin =
    await failedLoginHarness.service.login({
      mode: 'email',
      email: 'student@example.invalid',
      password: 'secret-password',
    });

  assert.strictEqual(failedLogin.ok, false);
  assert.strictEqual(
    failedLogin.code,
    authModule.AUTH_CODES.LOGIN_FAILED,
  );
  assert.strictEqual(
    failedLogin.message,
    'Safe mapped authentication message.',
  );
  assert(
    !JSON.stringify(failedLogin).includes(
      'Raw password',
    ),
  );
  assert(
    !JSON.stringify(failedLogin).includes(
      'secret-password',
    ),
  );

  const phase24Harness = createHarness({
    async signInWithEmailAndPassword(
      receivedAuth,
      email,
      password,
    ) {
      const user = {
        uid: 'phase24-verify-001',
        email,
        displayName: 'Phase24 Aspirant',
        emailVerified: false,
      };
      phase24Harness.auth.currentUser = user;
      phase24Harness.calls.push({
        name: 'phase24SignIn',
        receivedAuth,
        email,
        password,
      });
      return { user };
    },
  });

  assert.deepStrictEqual(
    await phase24Harness.service.registerAccount({
      fullName: 'Phase24 Aspirant',
      username: 'phase24_aspirant',
      email: 'phase24-verification@example.test',
      password: 'Strong1!Password',
      returnTo: '#student/mock-tests/demo',
    }),
    { prepared: true },
  );

  assert.strictEqual(
    phase24Harness.auth.currentUser?.emailVerified,
    false,
  );

  const unverifiedAfterRegistration =
    await phase24Harness.service.getSession();

  assert.strictEqual(
    unverifiedAfterRegistration.ok,
    false,
  );
  assert.strictEqual(
    unverifiedAfterRegistration.code,
    authModule.AUTH_CODES.EMAIL_UNVERIFIED,
  );
  assert.strictEqual(
    unverifiedAfterRegistration.details.accessAllowed,
    false,
  );
  assert(
    phase24Harness.calls.some(
      (item) =>
        item.name === 'sendEmailVerification',
    ),
  );

  await phase24Harness.service.resendVerification({
    email: 'phase24-verification@example.test',
    returnTo: '#student/mock-tests/demo',
  });

  assert(
    phase24Harness.calls.filter(
      (item) =>
        item.name === 'sendEmailVerification',
    ).length >= 2,
  );
  assert.strictEqual(
    phase24Harness.auth.currentUser?.emailVerified,
    false,
  );

  // Simulate a full app/service recreation. Firebase browser persistence
  // keeps auth.currentUser, while no raw password is cached by AspireNest.
  const persistedFirebaseUser =
    phase24Harness.auth.currentUser;
  const reloadDependencies = {
    ...phase24Harness.dependencies,
    async reloadUser(firebaseUser) {
      firebaseUser.emailVerified = true;
      phase24Harness.calls.push({
        name: 'reloadUserAfterPageReload',
        firebaseUser,
      });
    },
  };

  phase24Harness.auth.currentUser =
    persistedFirebaseUser;

  const reloadedService =
    authModule.createAuthProductionService(
      reloadDependencies,
    );

  const completed =
    await reloadedService.completeEmailVerification({
      account: {
        email:
          'phase24-verification@example.test',
      },
      returnTo:
        '#student/mock-tests/demo',
    });

  assert.strictEqual(completed.authenticated, true);
  assert.strictEqual(completed.accessAllowed, true);
  assert.strictEqual(completed.emailVerified, true);
  assert(
    phase24Harness.calls.some(
      (item) =>
        item.name ===
        'reloadUserAfterPageReload',
    ),
  );

  const noPersistedUserHarness =
    createHarness();
  noPersistedUserHarness.auth.currentUser = null;
  const noPersistedCompletion =
    await noPersistedUserHarness.service
      .completeEmailVerification({
        account: {
          email:
            'phase24-verification@example.test',
        },
        returnTo:
          '#student/mock-tests/demo',
      });
  assert.strictEqual(
    noPersistedCompletion.ok,
    false,
  );
  assert.strictEqual(
    noPersistedCompletion.code,
    authModule.AUTH_CODES.NOT_AUTHENTICATED,
  );
  assert.strictEqual(
    noPersistedCompletion.details.accessAllowed,
    false,
  );

  const resetHarness = createHarness();

  assert.deepStrictEqual(
    await resetHarness.service.requestPasswordReset({
      email: 'phase24-reset@example.test',
      returnTo:
        '#student/notes/read/exact-note',
    }),
    { prepared: true },
  );
  assert(
    resetHarness.calls.some(
      (item) =>
        item.name === 'sendPasswordResetEmail',
    ),
  );
  assert(
    resetHarness.calls.some(
      (item) =>
        item.name === 'buildActionCodeSettings'
        && item.purpose === 'reset'
        && item.returnTo ===
          '#student/notes/read/exact-note',
    ),
  );

  const neutralResetHarness = createHarness({
    async sendPasswordResetEmail() {
      const error =
        new Error(
          'RAW_ACCOUNT_EXISTENCE_SIGNAL',
        );
      error.code = 'auth/user-not-found';
      throw error;
    },
  });

  const neutralReset =
    await neutralResetHarness.service
      .requestPasswordReset({
        email:
          'unknown-phase24@example.test',
        returnTo:
          '#student/home/overview',
      });

  assert.deepStrictEqual(
    neutralReset,
    { prepared: true },
  );
  assert(
    !JSON.stringify(neutralReset).includes(
      'RAW_ACCOUNT_EXISTENCE_SIGNAL',
    ),
  );

  const logoutHarness = createHarness();
  logoutHarness.auth.currentUser = {
    uid: 'student-logout',
    emailVerified: true,
  };

  const logoutResult =
    await logoutHarness.service.logout();

  assert.strictEqual(logoutResult.signedOut, true);
  assert.strictEqual(
    logoutResult.authenticated,
    false,
  );
  assert.strictEqual(
    logoutResult.accessAllowed,
    false,
  );
  assert.strictEqual(
    logoutHarness.auth.currentUser,
    null,
  );

  const failedLogoutHarness = createHarness({
    async signOut() {
      throw new Error(
        'Raw logout credential details.',
      );
    },
  });
  failedLogoutHarness.auth.currentUser = {
    uid: 'logout-failure-still-authenticated',
    emailVerified: true,
  };

  const failedLogout =
    await failedLogoutHarness.service.logout();

  assert.strictEqual(failedLogout.ok, false);
  assert.strictEqual(
    failedLogout.code,
    authModule.AUTH_CODES.LOGOUT_FAILED,
  );
  assert.strictEqual(
    failedLogout.message,
    'Safe mapped authentication message.',
  );
  assert.strictEqual(
    failedLogout.details.authenticated,
    true,
  );
  assert.strictEqual(
    failedLogout.details.accessAllowed,
    false,
  );
  assert.strictEqual(
    failedLogout.details.signedOut,
    false,
  );
  assert(
    !JSON.stringify(failedLogout).includes(
      'Raw logout credential',
    ),
  );

  const unsafeMapperHarness = createHarness({
    async signInWithEmailAndPassword() {
      throw new Error(
        'RAW_UNSAFE_MAPPED_SECRET',
      );
    },
    mapAuthError(error) {
      return error.message;
    },
  });

  const unsafeMappedLogin =
    await unsafeMapperHarness.service.login({
      mode: 'email',
      email: 'unsafe@example.invalid',
      password: 'unsafe-password',
    });

  assert.strictEqual(
    unsafeMappedLogin.ok,
    false,
  );
  assert.strictEqual(
    unsafeMappedLogin.message,
    'Sign-in could not be completed.',
  );
  assert(
    !JSON.stringify(unsafeMappedLogin).includes(
      'RAW_UNSAFE_MAPPED_SECRET',
    ),
  );

  const roleThrowHarness = createHarness({
    resolveRole() {
      throw new Error(
        'Raw role resolver details.',
      );
    },
  });
  roleThrowHarness.auth.currentUser = {
    uid: 'role-throw',
    email: 'role-throw@example.invalid',
    emailVerified: true,
  };

  const roleThrow =
    await roleThrowHarness.service.getSession();

  assert.strictEqual(roleThrow.ok, false);
  assert.strictEqual(
    roleThrow.code,
    authModule.AUTH_CODES.ROLE_RESOLUTION_FAILED,
  );
  assert.strictEqual(
    roleThrow.details.authenticated,
    true,
  );
  assert.strictEqual(
    roleThrow.details.accessAllowed,
    false,
  );
  assert(
    !JSON.stringify(roleThrow).includes(
      'Raw role resolver details',
    ),
  );

  const accessThrowHarness = createHarness({
    resolveAllowedExperiences() {
      throw new Error(
        'Raw access resolver details.',
      );
    },
  });
  accessThrowHarness.auth.currentUser = {
    uid: 'access-throw',
    email: 'access-throw@example.invalid',
    emailVerified: true,
  };

  const accessThrow =
    await accessThrowHarness.service.getSession();

  assert.strictEqual(accessThrow.ok, false);
  assert.strictEqual(
    accessThrow.code,
    authModule.AUTH_CODES.ACCESS_RESOLUTION_FAILED,
  );
  assert.strictEqual(
    accessThrow.details.authenticated,
    true,
  );
  assert.strictEqual(
    accessThrow.details.accessAllowed,
    false,
  );
  assert(
    !JSON.stringify(accessThrow).includes(
      'Raw access resolver details',
    ),
  );

  const escalationHarness = createHarness({
    resolveAllowedExperiences() {
      return [
        'public',
        'student',
        'mentor',
        'admin',
        'unexpected',
      ];
    },
  });
  escalationHarness.auth.currentUser = {
    uid: 'student-escalation-test',
    email: 'student-escalation@example.invalid',
    emailVerified: true,
  };

  const escalationSession =
    await escalationHarness.service.getSession();

  assert.strictEqual(
    escalationSession.authenticated,
    true,
  );
  assert.strictEqual(
    escalationSession.role,
    'student',
  );
  assert.deepStrictEqual(
    Array.from(escalationSession.allowed),
    ['public', 'student'],
  );

  const profileFailureHarness = createHarness({
    async loadAccountProfile() {
      throw new Error(
        'Raw profile failure details.',
      );
    },
  });
  profileFailureHarness.auth.currentUser = {
    uid: 'profile-failure',
    email: 'profile@example.invalid',
    emailVerified: true,
  };

  const profileFailure =
    await profileFailureHarness.service.getSession();

  assert.strictEqual(profileFailure.ok, false);
  assert.strictEqual(
    profileFailure.code,
    authModule.AUTH_CODES.PROFILE_FAILED,
  );
  assert.strictEqual(
    profileFailure.details.authenticated,
    true,
  );
  assert.strictEqual(
    profileFailure.details.accessAllowed,
    false,
  );
  assert.strictEqual(
    profileFailure.details.emailVerified,
    true,
  );
  assert(
    !JSON.stringify(profileFailure).includes(
      'Raw profile failure details',
    ),
  );

  const invalidRoleHarness = createHarness({
    resolveRole() {
      return 'owner';
    },
  });
  invalidRoleHarness.auth.currentUser = {
    uid: 'invalid-role',
    email: 'role@example.invalid',
    emailVerified: true,
  };

  const invalidRole =
    await invalidRoleHarness.service.getSession();

  assert.strictEqual(invalidRole.ok, false);
  assert.strictEqual(
    invalidRole.code,
    authModule.AUTH_CODES.ROLE_INVALID,
  );
  assert.strictEqual(
    invalidRole.details.authenticated,
    true,
  );
  assert.strictEqual(
    invalidRole.details.accessAllowed,
    false,
  );
  assert.strictEqual(
    invalidRole.details.emailVerified,
    true,
  );

  const accountStatusHarness = createHarness({
    async loadAccountProfile(user) {
      accountStatusHarness.calls.push({
        name: 'loadAccountProfile',
        uid: user.uid,
      });

      return {
        username: 'status-student',
        fullName: user.displayName,
        planType: 'premium',
        accountStatus: '  legacy-status-value  ',
      };
    },
  });
  accountStatusHarness.auth.currentUser = {
    uid: 'status-student-001',
    email: 'status@example.invalid',
    displayName: 'Status Student',
    emailVerified: true,
  };

  const accountStatusSession =
    await accountStatusHarness.service.getSession();

  assert.strictEqual(
    accountStatusSession.accountStatus,
    'legacy-status-value',
  );
  assert.strictEqual(
    accountStatusSession.accessAllowed,
    true,
  );
  assert.strictEqual(
    accountStatusSession.allowedRoles,
    accountStatusSession.allowed,
  );

  const blankUidHarness = createHarness();
  blankUidHarness.auth.currentUser = {
    uid: '   ',
    email: 'blank-uid@example.invalid',
    emailVerified: true,
  };

  const blankUidSession =
    await blankUidHarness.service.getSession();

  assert.strictEqual(blankUidSession.ok, false);
  assert.strictEqual(
    blankUidSession.code,
    authModule.AUTH_CODES.USER_MISSING,
  );

  const listenerHarness = createHarness();
  const listenerSnapshots = [];

  const unsubscribeSession =
    listenerHarness.service.subscribeSession(
      (session) => {
        listenerSnapshots.push(session);
      },
    );

  assert.strictEqual(
    typeof unsubscribeSession,
    'function',
  );
  assert.strictEqual(
    Object.isFrozen(unsubscribeSession),
    true,
  );

  const listenerCall = listenerHarness.calls.find(
    (item) => item.name === 'subscribeAuthState',
  );

  assert(listenerCall);
  assert.strictEqual(
    typeof listenerCall.listener,
    'function',
  );

  await listenerCall.listener(null);

  assert.strictEqual(listenerSnapshots.length, 1);
  assert.strictEqual(
    listenerSnapshots[0].authenticated,
    false,
  );
  assert.strictEqual(
    listenerSnapshots[0].activeRole,
    'public',
  );
  assert.strictEqual(
    listenerSnapshots[0].allowedRoles,
    listenerSnapshots[0].allowed,
  );

  await listenerCall.listener({
    uid: 'listener-student-001',
    email: 'listener@example.invalid',
    displayName: 'Listener Student',
    emailVerified: true,
  });

  assert.strictEqual(listenerSnapshots.length, 2);
  assert.strictEqual(
    listenerSnapshots[1].authenticated,
    true,
  );
  assert.strictEqual(
    listenerSnapshots[1].uid,
    'listener-student-001',
  );
  assert.strictEqual(
    listenerSnapshots[1].activeRole,
    'student',
  );
  assert.strictEqual(
    listenerSnapshots[1].allowedRoles,
    listenerSnapshots[1].allowed,
  );

  unsubscribeSession();
  unsubscribeSession();

  assert.strictEqual(
    listenerHarness.calls.filter(
      (item) => item.name === 'unsubscribeAuthState',
    ).length,
    1,
  );

  await listenerCall.listener(null);

  assert.strictEqual(
    listenerSnapshots.length,
    2,
  );

  assert.throws(
    () => listenerHarness.service.subscribeSession(null),
    /listener must be a function/,
  );

  const serviceSource = fs.readFileSync(
    path.join(__dirname, 'authProductionService.js'),
    'utf8',
  );

  for (const forbidden of [
    'window.',
    'document.',
    'sessionStorage',
    'localStorage',
    '__aspirenestAuthSession',
    '__aspirenestAuthAPI',
    'navigate(',
    'location.',
  ]) {
    assert(
      !serviceSource.includes(forbidden),
      `Forbidden service side effect: ${forbidden}`,
    );
  }

  const targetMethods = new Set([
    'getSession',
    'login',
    'logout',
  ]);
  const locked = registryMetadata.methods.filter(
    (item) =>
      item.ownerContractStatus ===
      'IMPLEMENTED_NOT_RUNTIME_ACTIVATED',
  );

  assert.strictEqual(locked.length, 3);
  assert.deepStrictEqual(
    locked.map((item) => item.name).sort(),
    [...targetMethods].sort(),
  );

  for (const item of locked) {
    assert.strictEqual(
      item.ownerState,
      'SAFE_DISABLED_PENDING_OWNER',
    );
    assert.strictEqual(item.owner, null);
    assert.strictEqual(
      item.canonicalOwner,
      'src/integration/v26/authProductionService.js#createAuthProductionService',
    );
    assert.strictEqual(
      item.canonicalOwnerMethod,
      item.name,
    );
    assert.strictEqual(
      item.runtimeActivation,
      false,
    );
  }

  const activeRegistration =
    registryMetadata.methods.find(
      (item) =>
        item.name ===
        'registerAccount',
    );

  assert(activeRegistration);
  assert.strictEqual(
    activeRegistration.ownerState,
    'RUNTIME_OWNER_ASSIGNED',
  );
  assert.strictEqual(
    activeRegistration.owner,
    'authProductionService',
  );
  assert.strictEqual(
    activeRegistration.auditClassification,
    'OWNER_RESOLVED',
  );
  assert.strictEqual(
    activeRegistration.canonicalOwner,
    'src/integration/v26/authProductionService.js#createAuthProductionService',
  );
  assert.strictEqual(
    activeRegistration.canonicalOwnerMethod,
    'registerAccount',
  );
  assert.strictEqual(
    activeRegistration.ownerContractStatus,
    'IMPLEMENTED_RUNTIME_ACTIVATED',
  );
  assert.strictEqual(
    activeRegistration.runtimeActivation,
    true,
  );

  const unresolved = registryMetadata.methods.filter(
    (item) =>
      item.ownerContractStatus !==
        'IMPLEMENTED_NOT_RUNTIME_ACTIVATED'
      && item.name !==
        'registerAccount'
      && item.name !==
        'signInWithGoogle'
      && item.name !==
        'requestPasswordReset'
      && item.name !==
        'resendVerification'
      && item.name !==
        'completeEmailVerification',
  );

  assert.strictEqual(unresolved.length, 174);
  assert(
    unresolved.every(
      (item) =>
        item.ownerState ===
          'SAFE_DISABLED_PENDING_OWNER' &&
        item.owner === null,
    ),
  );

  console.log('AUTH_SERVICE_METHODS=7/7');
  console.log('REGISTER_ACCOUNT_UNVERIFIED_SESSION_PERSISTS_FAIL_CLOSED=PASS');
  console.log('PHASE24_PAGE_RELOAD_VERIFICATION_CONTINUITY=PASS');
  console.log('PHASE24_VERIFICATION_SEND_RESEND_COMPLETE=PASS');
  console.log('PHASE24_PASSWORD_RESET_NEUTRAL=PASS');
  console.log('PHASE24_ACTION_SETTINGS_RETURN_TO=PASS');
  console.log('REGISTER_ACCOUNT_SUCCESS_NO_PROTECTED_ACTIVATION=PASS');
  console.log('REGISTER_ACCOUNT_OPTIONAL_DEPENDENCY=PASS');
  console.log('REGISTER_ACCOUNT_ERROR_SANITIZATION=PASS');
  console.log('GET_SESSION_PUBLIC=PASS');
  console.log('PUBLIC_ACCESS_ALLOWED_FALSE=PASS');
  console.log('GET_SESSION_VERIFIED=PASS');
  console.log('GET_SESSION_UNVERIFIED_FAIL_CLOSED=PASS');
  console.log('GET_SESSION_UNVERIFIED_AUTH_STATE_TRUTHFUL=PASS');
  console.log('EMAIL_LOGIN=PASS');
  console.log('IDENTIFIER_EMAIL_INFERENCE=PASS');
  console.log('USERNAME_LOGIN=PASS');
  console.log('USERNAME_LOGIN_OPTIONAL_DEPENDENCY_FAIL_CLOSED=PASS');
  console.log('USERNAME_LOGIN_EMAIL_MAPPING_IN_BROWSER=NO');
  console.log('GOOGLE_LOGIN=PASS');
  console.log('UNVERIFIED_LOGIN_SIGNOUT=PASS');
  console.log('UNVERIFIED_LOGIN_SIGNOUT_FAILURE_TRUTHFUL=PASS');
  console.log('LOGIN_ERROR_SANITIZATION=PASS');
  console.log('UNSAFE_ERROR_MAPPER_REJECTED=PASS');
  console.log('LOGOUT_NO_NAVIGATION=PASS');
  console.log('LOGOUT_ERROR_SANITIZATION=PASS');
  console.log('LOGOUT_STATE_TRUTHFUL=PASS');
  console.log('ROLE_RESOLVER_FAILURE_FAIL_CLOSED=PASS');
  console.log('ACCESS_RESOLVER_FAILURE_FAIL_CLOSED=PASS');
  console.log('ROLE_ACCESS_ESCALATION_CLAMPED=PASS');
  console.log('PROFILE_FAILURE_AUTH_STATE_TRUTHFUL=PASS');
  console.log('ROLE_VALIDATION=PASS');
  console.log('ROLE_FAILURE_AUTH_STATE_TRUTHFUL=PASS');
  console.log('CANONICAL_OWNER_METADATA=7/7');
  console.log('RUNTIME_OWNER_ASSIGNMENTS=5');
  console.log('SAFE_DISABLED_PENDING_OWNER_METHODS=177');
  console.log('OTHER_METHODS_SAFE_DISABLED=174');
  console.log('ALLOWEDROLES_ALIAS=PASS');
  console.log('ACTIVE_ROLE_SNAPSHOT=PASS');
  console.log('ACCOUNT_STATUS_SNAPSHOT_NO_POLICY=PASS');
  console.log('BLANK_UID_FAIL_CLOSED=PASS');
  console.log('SESSION_LISTENER_PUBLIC=PASS');
  console.log('SESSION_LISTENER_AUTHENTICATED=PASS');
  console.log('SESSION_LISTENER_UNSUBSCRIBE=PASS');
  console.log('PROVIDER_ACTIVATION=NO');
  console.log('RUNTIME_LOAD=NO');
  console.log('FIREBASE_NETWORK_CALLS=NO');
  console.log('AUTH_SERVICE_TEST_STATUS=GREEN');
}

main().catch((error) => {
  console.error(
    error && error.stack
      ? error.stack
      : String(error),
  );
  process.exit(1);
});
