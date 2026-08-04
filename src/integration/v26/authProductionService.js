(function exposeAspireNestV26AuthService(root, factory) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root && !root.AspireNestV26AuthProductionService) {
    Object.defineProperty(
      root,
      'AspireNestV26AuthProductionService',
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
  function createAspireNestV26AuthServiceModule() {
    'use strict';

    const AUTH_CODES = Object.freeze({
      INVALID_REQUEST: 'AUTH_INVALID_REQUEST',
      NOT_AUTHENTICATED: 'AUTH_NOT_AUTHENTICATED',
      EMAIL_UNVERIFIED: 'AUTH_EMAIL_UNVERIFIED',
      EMAIL_UNVERIFIED_SIGNOUT_FAILED:
        'AUTH_EMAIL_UNVERIFIED_SIGNOUT_FAILED',
      USER_MISSING: 'AUTH_USER_MISSING',
      ROLE_INVALID: 'AUTH_ROLE_INVALID',
      ROLE_RESOLUTION_FAILED: 'AUTH_ROLE_RESOLUTION_FAILED',
      ACCESS_RESOLUTION_FAILED:
        'AUTH_ACCESS_RESOLUTION_FAILED',
      PROFILE_FAILED: 'AUTH_PROFILE_FAILED',
      LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
      LOGOUT_FAILED: 'AUTH_LOGOUT_FAILED',
    });

    const VALID_ROLES = Object.freeze([
      'student',
      'mentor',
      'admin',
    ]);

    const ROLE_EXPERIENCE_MAX = Object.freeze({
      student: Object.freeze([
        'public',
        'student',
      ]),
      mentor: Object.freeze([
        'public',
        'student',
        'mentor',
      ]),
      admin: Object.freeze([
        'public',
        'student',
        'mentor',
        'admin',
      ]),
    });

    function failure(code, message, details) {
      return Object.freeze({
        ok: false,
        code,
        message: String(message || code),
        retryable: false,
        details: details || null,
      });
    }

    function cleanText(value) {
      return String(value || '').trim();
    }

    function cleanEmail(value) {
      return cleanText(value).toLowerCase();
    }

    function safeErrorMessage(
      error,
      fallback,
      mapAuthError,
      context,
    ) {
      if (typeof mapAuthError === 'function') {
        try {
          const mapped = mapAuthError(error, context);

          if (
            mapped &&
            typeof mapped === 'object' &&
            mapped.safe === true &&
            typeof mapped.message === 'string'
          ) {
            const safeMessage = mapped.message.trim();

            if (safeMessage) {
              return safeMessage.slice(0, 300);
            }
          }
        } catch (_) {
          // Error mapping must never replace the safe fallback.
        }
      }

      return fallback;
    }

    function normalizeAllowedExperiences(values, role) {
      const normalizedRole = cleanText(role).toLowerCase();
      const maximum =
        ROLE_EXPERIENCE_MAX[normalizedRole] ||
        Object.freeze(['public']);
      const maximumSet = new Set(maximum);
      const input = Array.isArray(values) ? values : [];
      const allowed = new Set(['public']);

      for (const value of input) {
        const normalized = cleanText(value).toLowerCase();

        if (maximumSet.has(normalized)) {
          allowed.add(normalized);
        }
      }

      if (VALID_ROLES.includes(normalizedRole)) {
        allowed.add(normalizedRole);
      }

      return Object.freeze([...allowed]);
    }

    function normalizePublicSession() {
      return Object.freeze({
        ready: true,
        authenticated: false,
        accessAllowed: false,
        user: null,
        uid: '',
        role: 'public',
        allowed: Object.freeze(['public']),
        email: '',
        displayName: '',
        username: '',
        planType: '',
        emailVerified: false,
        profile: Object.freeze({}),
      });
    }

    function normalizeUser(firebaseUser) {
      return Object.freeze({
        uid: cleanText(firebaseUser && firebaseUser.uid),
        email: cleanEmail(firebaseUser && firebaseUser.email),
        displayName: cleanText(
          firebaseUser && firebaseUser.displayName,
        ),
        emailVerified:
          Boolean(firebaseUser && firebaseUser.emailVerified),
      });
    }

    function validateDependencies(dependencies) {
      const requiredFunctions = [
        'signInWithEmailAndPassword',
        'signInWithPopup',
        'signOut',
        'createGoogleProvider',
        'loadAccountProfile',
        'resolveRole',
        'resolveAllowedExperiences',
      ];

      if (
        !dependencies ||
        typeof dependencies !== 'object' ||
        !dependencies.auth ||
        typeof dependencies.auth !== 'object'
      ) {
        throw new TypeError(
          'Auth production service requires an auth dependency.',
        );
      }

      for (const name of requiredFunctions) {
        if (typeof dependencies[name] !== 'function') {
          throw new TypeError(
            `Auth production service dependency missing: ${name}`,
          );
        }
      }
    }

    function createAuthProductionService(dependencies) {
      validateDependencies(dependencies);

      const {
        auth,
        signInWithEmailAndPassword,
        signInWithPopup,
        signOut,
        createGoogleProvider,
        loadAccountProfile,
        resolveRole,
        resolveAllowedExperiences,
        mapAuthError,
      } = dependencies;

      async function buildVerifiedSession(firebaseUser) {
        if (!firebaseUser || !cleanText(firebaseUser.uid)) {
          return failure(
            AUTH_CODES.USER_MISSING,
            'The authenticated user record is unavailable.',
          );
        }

        if (firebaseUser.emailVerified !== true) {
          return failure(
            AUTH_CODES.EMAIL_UNVERIFIED,
            'Verify your email before continuing.',
            {
              authenticated: true,
              accessAllowed: false,
              emailVerified: false,
            },
          );
        }

        let profile;

        try {
          profile =
            (await loadAccountProfile(firebaseUser)) || {};
        } catch (_) {
          return failure(
            AUTH_CODES.PROFILE_FAILED,
            'The account profile could not be loaded.',
            {
              authenticated: true,
              accessAllowed: false,
              emailVerified: true,
            },
          );
        }

        let role;

        try {
          role = cleanText(
            resolveRole(firebaseUser, profile),
          ).toLowerCase();
        } catch (_) {
          return failure(
            AUTH_CODES.ROLE_RESOLUTION_FAILED,
            'The account role could not be resolved.',
            {
              authenticated: true,
              accessAllowed: false,
              emailVerified: true,
            },
          );
        }

        if (!VALID_ROLES.includes(role)) {
          return failure(
            AUTH_CODES.ROLE_INVALID,
            'The account role is not authorized.',
            {
              authenticated: true,
              accessAllowed: false,
              emailVerified: true,
            },
          );
        }

        let allowed;

        try {
          allowed = normalizeAllowedExperiences(
            resolveAllowedExperiences(
              firebaseUser,
              profile,
              role,
            ),
            role,
          );
        } catch (_) {
          return failure(
            AUTH_CODES.ACCESS_RESOLUTION_FAILED,
            'Account access could not be resolved.',
            {
              authenticated: true,
              accessAllowed: false,
              emailVerified: true,
            },
          );
        }

        const normalizedUser = normalizeUser(firebaseUser);
        const normalizedProfile = Object.freeze({
          ...(profile && typeof profile === 'object'
            ? profile
            : {}),
        });

        return Object.freeze({
          ready: true,
          authenticated: true,
          accessAllowed: true,
          user: normalizedUser,
          uid: normalizedUser.uid,
          role,
          allowed,
          email:
            normalizedUser.email ||
            cleanEmail(normalizedProfile.email),
          displayName: cleanText(
            normalizedProfile.fullName ||
              normalizedProfile.name ||
              normalizedProfile.displayName ||
              normalizedUser.displayName,
          ),
          username: cleanText(normalizedProfile.username),
          planType: cleanText(
            normalizedProfile.planType ||
              normalizedProfile.subscriptionType ||
              normalizedProfile.currentPlan,
          ).toUpperCase(),
          emailVerified: true,
          profile: normalizedProfile,
        });
      }

      async function getSession() {
        const firebaseUser = auth.currentUser || null;

        if (!firebaseUser) {
          return normalizePublicSession();
        }

        return buildVerifiedSession(firebaseUser);
      }

      async function login(payload) {
        const request =
          payload && typeof payload === 'object'
            ? payload
            : {};
        const mode = cleanText(request.mode).toLowerCase();

        let credential;

        try {
          if (mode === 'email') {
            const email = cleanEmail(request.email);
            const password = String(request.password || '');

            if (!email || !password) {
              return failure(
                AUTH_CODES.INVALID_REQUEST,
                'Email and password are required.',
              );
            }

            credential = await signInWithEmailAndPassword(
              auth,
              email,
              password,
            );
          } else if (mode === 'google') {
            const provider = createGoogleProvider();

            if (!provider) {
              return failure(
                AUTH_CODES.INVALID_REQUEST,
                'Google sign-in provider is unavailable.',
              );
            }

            credential = await signInWithPopup(
              auth,
              provider,
            );
          } else {
            return failure(
              AUTH_CODES.INVALID_REQUEST,
              'Login mode must be email or google.',
            );
          }
        } catch (error) {
          return failure(
            AUTH_CODES.LOGIN_FAILED,
            safeErrorMessage(
              error,
              'Sign-in could not be completed.',
              mapAuthError,
              {
                operation: 'login',
                mode,
              },
            ),
          );
        }

        const firebaseUser =
          credential && credential.user
            ? credential.user
            : auth.currentUser || null;

        if (!firebaseUser) {
          return failure(
            AUTH_CODES.USER_MISSING,
            'The sign-in result did not contain a user.',
          );
        }

        if (firebaseUser.emailVerified !== true) {
          try {
            await signOut(auth);
          } catch (error) {
            return failure(
              AUTH_CODES.EMAIL_UNVERIFIED_SIGNOUT_FAILED,
              safeErrorMessage(
                error,
                'Email verification is required, and the '
                  + 'temporary sign-in session could not be closed.',
                mapAuthError,
                {
                  operation: 'login-unverified-signout',
                  mode,
                },
              ),
              {
                authenticated: true,
                accessAllowed: false,
                emailVerified: false,
                signedOut: false,
              },
            );
          }

          return failure(
            AUTH_CODES.EMAIL_UNVERIFIED,
            'Verify your email before continuing.',
            {
              authenticated: false,
              accessAllowed: false,
              emailVerified: false,
              signedOut: true,
            },
          );
        }

        return buildVerifiedSession(firebaseUser);
      }

      async function logout() {
        try {
          await signOut(auth);

          return Object.freeze({
            authenticated: false,
            accessAllowed: false,
            signedOut: true,
          });
        } catch (error) {
          const authenticated = Boolean(auth.currentUser);

          return failure(
            AUTH_CODES.LOGOUT_FAILED,
            safeErrorMessage(
              error,
              'Sign-out could not be completed.',
              mapAuthError,
              {
                operation: 'logout',
              },
            ),
            {
              authenticated,
              accessAllowed: false,
              signedOut: !authenticated,
            },
          );
        }
      }

      return Object.freeze({
        getSession,
        login,
        logout,
      });
    }

    return Object.freeze({
      AUTH_CODES,
      VALID_ROLES,
      ROLE_EXPERIENCE_MAX,
      createAuthProductionService,
      normalizeAllowedExperiences,
      normalizePublicSession,
    });
  },
);
