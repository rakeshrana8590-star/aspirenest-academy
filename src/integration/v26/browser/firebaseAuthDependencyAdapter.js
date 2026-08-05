(function exposeAspireNestV26FirebaseAuthDependencyAdapter(
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
    && !root.AspireNestV26FirebaseAuthDependencyAdapter
  ) {
    Object.defineProperty(
      root,
      'AspireNestV26FirebaseAuthDependencyAdapter',
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
  function createAspireNestV26FirebaseAuthDependencyAdapterModule() {
    'use strict';

    const GOOGLE_PROMPT = 'select_account';

    function validateRoleAdapter(roleAdapter) {
      const requiredFunctions = [
        'loadAccountProfile',
        'resolveRole',
        'resolveAllowedExperiences',
      ];

      if (
        !roleAdapter
        || typeof roleAdapter !== 'object'
      ) {
        throw new TypeError(
          'Firebase auth adapter requires a role adapter.',
        );
      }

      for (const name of requiredFunctions) {
        if (typeof roleAdapter[name] !== 'function') {
          throw new TypeError(
            `Firebase auth role dependency missing: ${name}`,
          );
        }
      }
    }

    function validateDependencies(dependencies) {
      const requiredFunctions = [
        'signInWithEmailAndPassword',
        'signInWithPopup',
        'signOut',
      ];

      if (
        !dependencies
        || typeof dependencies !== 'object'
        || !dependencies.auth
        || typeof dependencies.auth !== 'object'
      ) {
        throw new TypeError(
          'Firebase auth adapter requires auth.',
        );
      }

      for (const name of requiredFunctions) {
        if (typeof dependencies[name] !== 'function') {
          throw new TypeError(
            `Firebase auth dependency missing: ${name}`,
          );
        }
      }

      if (typeof dependencies.GoogleAuthProvider !== 'function') {
        throw new TypeError(
          'Firebase auth dependency missing: GoogleAuthProvider',
        );
      }

      validateRoleAdapter(
        dependencies.roleExperienceDependencyAdapter,
      );
    }

    function createFirebaseAuthDependencyAdapter(
      dependencies,
    ) {
      validateDependencies(dependencies);

      const {
        auth,
        signInWithEmailAndPassword,
        signInWithPopup,
        signOut,
        GoogleAuthProvider,
        roleExperienceDependencyAdapter,
      } = dependencies;

      function createGoogleProvider() {
        let provider;

        try {
          provider = new GoogleAuthProvider();
        } catch (_) {
          throw new TypeError(
            'Google sign-in provider could not be created.',
          );
        }

        if (
          !provider
          || typeof provider !== 'object'
          || typeof provider.setCustomParameters !== 'function'
        ) {
          throw new TypeError(
            'Google sign-in provider is invalid.',
          );
        }

        try {
          provider.setCustomParameters({
            prompt: GOOGLE_PROMPT,
          });
        } catch (_) {
          throw new TypeError(
            'Google sign-in provider could not be configured.',
          );
        }

        return provider;
      }

      function emailPasswordSignIn(
        authDependency,
        email,
        password,
      ) {
        return signInWithEmailAndPassword(
          authDependency,
          email,
          password,
        );
      }

      function popupSignIn(
        authDependency,
        provider,
      ) {
        return signInWithPopup(
          authDependency,
          provider,
        );
      }

      function firebaseSignOut(authDependency) {
        return signOut(authDependency);
      }

      function loadAccountProfile(firebaseUser) {
        return roleExperienceDependencyAdapter
          .loadAccountProfile(firebaseUser);
      }

      function resolveRole(firebaseUser, profile) {
        return roleExperienceDependencyAdapter
          .resolveRole(firebaseUser, profile);
      }

      function resolveAllowedExperiences(
        firebaseUser,
        profile,
        role,
      ) {
        return roleExperienceDependencyAdapter
          .resolveAllowedExperiences(
            firebaseUser,
            profile,
            role,
          );
      }

      function createAuthoritativeSessionReader(
        authService,
      ) {
        if (
          !authService
          || typeof authService !== 'object'
          || typeof authService.getSession !== 'function'
        ) {
          throw new TypeError(
            'Reviewed auth service getSession is required.',
          );
        }

        const getSession = authService.getSession;

        return Object.freeze(
          async function getAuthoritativeSession() {
            return getSession.call(authService);
          },
        );
      }

      return Object.freeze({
        auth,
        signInWithEmailAndPassword:
          emailPasswordSignIn,
        signInWithPopup: popupSignIn,
        signOut: firebaseSignOut,
        createGoogleProvider,
        loadAccountProfile,
        resolveRole,
        resolveAllowedExperiences,
        createAuthoritativeSessionReader,
      });
    }

    return Object.freeze({
      GOOGLE_PROMPT,
      createFirebaseAuthDependencyAdapter,
    });
  },
);
