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
      REGISTRATION_FAILED:
        'AUTH_REGISTRATION_FAILED',
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
      const allowed = Object.freeze(['public']);

      return Object.freeze({
        ready: true,
        authenticated: false,
        accessAllowed: false,
        user: null,
        uid: '',
        role: 'public',
        activeRole: 'public',
        allowed,
        allowedRoles: allowed,
        accountStatus: '',
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
        'sendEmailVerification',
        'sendPasswordResetEmail',
        'reloadUser',
        'buildActionCodeSettings',
        'createGoogleProvider',
        'loadAccountProfile',
        'resolveRole',
        'resolveAllowedExperiences',
        'subscribeAuthState',
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
        registerStudentAccount,
        linkWithCredential,
        extractGoogleCredentialFromError,
        ensureStudentProfile,
        signInWithEmailAndPassword,
        signInWithUsernameAndPassword,
        signInWithPopup,
        signOut,
        sendEmailVerification,
        sendPasswordResetEmail,
        reloadUser,
        buildActionCodeSettings,
        createGoogleProvider,
        loadAccountProfile,
        resolveRole,
        resolveAllowedExperiences,
        subscribeAuthState,
        mapAuthError,
      } = dependencies;

      let pendingGoogleLink =
        null;

      const PENDING_GOOGLE_LINK_MAX_AGE_MS =
        10 * 60 * 1000;

      function clearPendingGoogleLink() {
        pendingGoogleLink =
          null;
      }

      function capturePendingGoogleLink(
        error
      ) {
        const code =
          cleanText(
            error
              && error.code
          ).toLowerCase();

        if (
          code !==
          'auth/account-exists-with-different-credential'
        ) {
          return false;
        }

        let pendingCredential =
          null;

        try {
          if (
            typeof extractGoogleCredentialFromError ===
              'function'
          ) {
            pendingCredential =
              extractGoogleCredentialFromError(
                error,
              );
          }
        } catch (_) {
          pendingCredential =
            null;
        }

        if (
          !pendingCredential
          && error
          && typeof error ===
            'object'
          && error.credential
        ) {
          pendingCredential =
            error.credential;
        }

        const email =
          cleanEmail(
            error?.customData?.email
            || error?.email,
          );

        if (
          !pendingCredential
          || !email
        ) {
          clearPendingGoogleLink();
          return false;
        }

        pendingGoogleLink = {
          credential:
            pendingCredential,
          email,
          createdAt:
            Date.now(),
        };

        return true;
      }

      async function applyPendingGoogleLink(
        firebaseUser,
        mode,
      ) {
        if (
          mode === 'google'
        ) {
          clearPendingGoogleLink();

          return Object.freeze({
            ok: true,
            linked: false,
            user:
              firebaseUser,
          });
        }

        if (!pendingGoogleLink) {
          return Object.freeze({
            ok: true,
            linked: false,
            user:
              firebaseUser,
          });
        }

        if (
          !['email', 'username']
            .includes(mode)
        ) {
          return Object.freeze({
            ok: true,
            linked: false,
            user:
              firebaseUser,
          });
        }

        const pending =
          pendingGoogleLink;

        const ageMs =
          Date.now()
          - Number(
            pending.createdAt
            || 0
          );

        const uid =
          cleanText(
            firebaseUser
              && firebaseUser.uid
          );

        const email =
          cleanEmail(
            firebaseUser
              && firebaseUser.email
          );

        if (
          !uid
          || firebaseUser?.emailVerified !==
            true
          || !email
          || email !==
            pending.email
          || !Number.isFinite(
            ageMs
          )
          || ageMs < 0
          || ageMs >
            PENDING_GOOGLE_LINK_MAX_AGE_MS
          || typeof linkWithCredential !==
            'function'
        ) {
          clearPendingGoogleLink();

          return failure(
            AUTH_CODES.LOGIN_FAILED,
            'Sign-in could not be completed.',
          );
        }

        try {
          const result =
            await linkWithCredential(
              firebaseUser,
              pending.credential,
            );

          const linkedUser =
            result
            && result.user
              ? result.user
              : firebaseUser;

          if (
            cleanText(
              linkedUser?.uid
            ) !== uid
          ) {
            clearPendingGoogleLink();

            return failure(
              AUTH_CODES.LOGIN_FAILED,
              'Sign-in could not be completed.',
            );
          }

          clearPendingGoogleLink();

          return Object.freeze({
            ok: true,
            linked: true,
            user:
              linkedUser,
          });
        } catch (_) {
          clearPendingGoogleLink();

          return failure(
            AUTH_CODES.LOGIN_FAILED,
            'Sign-in could not be completed.',
          );
        }
      }

      async function sendVerificationForUser(
        firebaseUser,
        returnTo,
      ) {
        if (
          !firebaseUser
          || !cleanText(firebaseUser.uid)
          || firebaseUser.emailVerified === true
        ) {
          return Object.freeze({ prepared: true });
        }

        try {
          const settings = buildActionCodeSettings(
            returnTo,
            'verify',
          );
          await sendEmailVerification(
            firebaseUser,
            settings,
          );
        } catch (_) {
          return Object.freeze({ prepared: false });
        }

        return Object.freeze({ prepared: true });
      }

      async function requestPasswordReset(payload) {
        const request =
          payload && typeof payload === 'object'
            ? payload
            : {};
        const email = cleanEmail(request.email);

        if (!email) {
          return Object.freeze({ prepared: true });
        }

        try {
          const settings = buildActionCodeSettings(
            request.returnTo,
            'reset',
          );
          await sendPasswordResetEmail(
            auth,
            email,
            settings,
          );
        } catch (_) {
          // Deliberately neutral: account existence is never disclosed.
        }

        return Object.freeze({ prepared: true });
      }

      async function resendVerification(payload) {
        const request =
          payload && typeof payload === 'object'
            ? payload
            : {};
        const email = cleanEmail(request.email);
        const firebaseUser = auth.currentUser || null;

        if (
          !firebaseUser
          || !cleanText(firebaseUser.uid)
          || firebaseUser.emailVerified === true
        ) {
          return Object.freeze({ prepared: true });
        }

        if (
          email
          && cleanEmail(firebaseUser.email) !== email
        ) {
          return Object.freeze({ prepared: true });
        }

        await sendVerificationForUser(
          firebaseUser,
          request.returnTo,
        );

        return Object.freeze({ prepared: true });
      }

      async function completeEmailVerification(payload) {
        const request =
          payload && typeof payload === 'object'
            ? payload
            : {};
        const requestedEmail = cleanEmail(
          request.email || request.account?.email,
        );
        let firebaseUser = auth.currentUser || null;

        if (!firebaseUser || !cleanText(firebaseUser.uid)) {
          return failure(
            AUTH_CODES.NOT_AUTHENTICATED,
            'Sign in again to finish email verification.',
            {
              authenticated: false,
              accessAllowed: false,
              emailVerified: false,
            },
          );
        }

        if (
          requestedEmail
          && cleanEmail(firebaseUser.email) !== requestedEmail
        ) {
          return failure(
            AUTH_CODES.EMAIL_UNVERIFIED,
            'Verification could not be completed.',
            {
              authenticated: false,
              accessAllowed: false,
              emailVerified: false,
            },
          );
        }

        try {
          await reloadUser(firebaseUser);
        } catch (_) {
          // Final verified-state check below remains fail closed.
        }

        firebaseUser = auth.currentUser || firebaseUser;

        if (firebaseUser.emailVerified !== true) {
          return failure(
            AUTH_CODES.EMAIL_UNVERIFIED,
            'Verify your email before continuing.',
            {
              authenticated: false,
              accessAllowed: false,
              emailVerified: false,
            },
          );
        }

        return buildVerifiedSession(firebaseUser);
      }

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

        if (
          role === 'student'
          && typeof ensureStudentProfile ===
            'function'
        ) {
          try {
            const prepared =
              await ensureStudentProfile();

            if (
              !prepared
              || prepared.prepared !==
                true
              || prepared.error
            ) {
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

            profile =
              (await loadAccountProfile(
                firebaseUser,
              ))
              || {};

            role =
              cleanText(
                resolveRole(
                  firebaseUser,
                  profile,
                ),
              ).toLowerCase();
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

          if (
            !VALID_ROLES.includes(
              role
            )
          ) {
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
          activeRole: role,
          allowed,
          allowedRoles: allowed,
          accountStatus: cleanText(
            normalizedProfile.accountStatus,
          ),
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

      function subscribeSession(listener) {
        if (typeof listener !== 'function') {
          throw new TypeError(
            'Auth session listener must be a function.',
          );
        }

        let active = true;

        const unsubscribe = subscribeAuthState(
          async (firebaseUser) => {
            const session = firebaseUser
              ? await buildVerifiedSession(firebaseUser)
              : normalizePublicSession();

            if (active) {
              listener(session);
            }
          },
        );

        if (typeof unsubscribe !== 'function') {
          throw new TypeError(
            'Auth state subscription must return an unsubscribe function.',
          );
        }

        return Object.freeze(
          function unsubscribeSession() {
            if (!active) {
              return;
            }

            active = false;
            unsubscribe();
          },
        );
      }

      async function registerAccount(payload) {
        const request =
          payload && typeof payload === 'object'
            ? payload
            : {};

        if (
          typeof registerStudentAccount !==
          'function'
        ) {
          return Object.freeze({
            error:
              'Account could not be created.',
          });
        }

        try {
          const result =
            await registerStudentAccount(
              request,
            );

          if (
            !result
            || result.prepared !== true
            || result.error
          ) {
            return Object.freeze({
              error:
                'Account could not be created.',
            });
          }

          const email = cleanEmail(request.email);
          const password = String(request.password || '');

          if (email && password) {
            try {
              const credential =
                await signInWithEmailAndPassword(
                  auth,
                  email,
                  password,
                );
              const firebaseUser =
                credential && credential.user
                  ? credential.user
                  : auth.currentUser || null;

              if (
                firebaseUser
                && firebaseUser.emailVerified !== true
              ) {
                await sendVerificationForUser(
                  firebaseUser,
                  request.returnTo,
                );
              }
            } catch (_) {
              try {
                await signOut(auth);
              } catch (_) {
                // Preparation remains fail closed.
              }
            }
          }

          return Object.freeze({
            prepared: true,
          });
        } catch (_) {
          return Object.freeze({
            error:
              'Account could not be created.',
          });
        }
      }

      async function login(payload) {
        const request =
          payload && typeof payload === 'object'
            ? payload
            : {};
        const explicitMode =
          cleanText(request.mode).toLowerCase();
        const identifier = cleanText(
          request.identifier || request.email,
        );
        const mode =
          explicitMode ||
          (
            identifier.includes('@')
              ? 'email'
              : 'username'
          );

        let credential;

        try {
          if (mode === 'email') {
            const email = cleanEmail(
              request.email || identifier,
            );
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
          } else if (mode === 'username') {
            const username = cleanText(
              request.identifier ||
                request.username ||
                request.email,
            );
            const password = String(
              request.password || '',
            );

            if (!username || !password) {
              return failure(
                AUTH_CODES.INVALID_REQUEST,
                'Username and password are required.',
              );
            }

            if (
              typeof signInWithUsernameAndPassword !==
              'function'
            ) {
              return failure(
                AUTH_CODES.LOGIN_FAILED,
                'Sign-in could not be completed.',
              );
            }

            credential =
              await signInWithUsernameAndPassword({
                username,
                password,
              });
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
              'Login mode must be email, username, or google.',
            );
          }
        } catch (error) {
          if (
            mode === 'google'
            && capturePendingGoogleLink(
              error,
            )
          ) {
            return failure(
              AUTH_CODES.LOGIN_FAILED,
              'Google sign-in needs your existing AspireNest sign-in before it can be connected.',
            );
          }

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
          if (
            mode === 'email'
            || mode === 'username'
          ) {
            await sendVerificationForUser(
              firebaseUser,
              request.returnTo,
            );
          }

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

        const linked =
          await applyPendingGoogleLink(
            firebaseUser,
            mode,
          );

        if (
          linked
          && linked.ok ===
            false
        ) {
          try {
            await signOut(auth);
          } catch (_) {
            // Link failure remains fail closed.
          }

          return linked;
        }

        return buildVerifiedSession(
          linked?.user
          || firebaseUser,
        );
      }

      async function logout() {
        clearPendingGoogleLink();
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
        subscribeSession,
        registerAccount,
        login,
        requestPasswordReset,
        resendVerification,
        completeEmailVerification,
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
