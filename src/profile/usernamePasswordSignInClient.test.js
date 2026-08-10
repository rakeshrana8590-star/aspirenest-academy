import {
  createFirebaseUsernamePasswordSignIn,
  USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME,
} from "./usernamePasswordSignInClient";

jest.mock("firebase/auth", () => ({
  signInWithCustomToken: jest.fn(),
}));

jest.mock("firebase/functions", () => ({
  httpsCallable: jest.fn(),
}));

describe(
  "AspireNest username-password sign-in client",
  () => {
    const createAuth = () => ({
      app: {
        options: {
          apiKey:
            "synthetic-web-api-key",
        },
      },
    });

    test("requires canonical Auth, Functions and API-key authority", () => {
      expect(() =>
        createFirebaseUsernamePasswordSignIn({
          authInstance: null,
          functionsInstance: {},
        })
      ).toThrow(
        "Canonical Firebase Auth instance is required."
      );

      expect(() =>
        createFirebaseUsernamePasswordSignIn({
          authInstance: createAuth(),
          functionsInstance: null,
        })
      ).toThrow(
        "Canonical Firebase Functions instance is required."
      );

      expect(() =>
        createFirebaseUsernamePasswordSignIn({
          authInstance: {
            app: {
              options: {},
            },
          },
          functionsInstance: {},
        })
      ).toThrow(
        "Canonical Firebase API key is required."
      );
    });

    test("uses canonical API key, callable and custom-token sign-in without returning UID/email mapping", async () => {
      const callable = jest.fn(
        async () => ({
          data: {
            customToken:
              "synthetic-custom-token",
            uid: "must-not-propagate",
            email:
              "must-not-propagate@example.invalid",
          },
        })
      );
      const callableFactory =
        jest.fn(() => callable);
      const customTokenSignIn =
        jest.fn(
          async (authInstance, token) => ({
            user: {
              uid: "uid-1",
              email:
                "learner@example.invalid",
              emailVerified: true,
            },
            authInstance,
            token,
          })
        );
      const authInstance = createAuth();

      const signIn =
        createFirebaseUsernamePasswordSignIn({
          authInstance,
          functionsInstance: {
            name: "canonical-functions",
          },
          callableFactory,
          customTokenSignIn,
        });

      const credential = await signIn({
        username: " Learner_One ",
        password: "  Keep Password Bytes  ",
      });

      expect(callableFactory).toHaveBeenCalledWith(
        {
          name: "canonical-functions",
        },
        USERNAME_PASSWORD_SIGNIN_FUNCTION_NAME,
        { timeout: 15000 }
      );
      expect(callable).toHaveBeenCalledWith({
        username: "Learner_One",
        password: "  Keep Password Bytes  ",
        apiKey: "synthetic-web-api-key",
      });
      expect(customTokenSignIn).toHaveBeenCalledWith(
        authInstance,
        "synthetic-custom-token"
      );
      expect(credential.user.uid).toBe(
        "uid-1"
      );
      expect(
        Object.prototype.hasOwnProperty.call(
          credential,
          "uid"
        )
      ).toBe(false);
      expect(
        Object.prototype.hasOwnProperty.call(
          credential,
          "email"
        )
      ).toBe(false);
    });

    test("fails closed when callable omits the custom token", async () => {
      const signIn =
        createFirebaseUsernamePasswordSignIn({
          authInstance: createAuth(),
          functionsInstance: {},
          callableFactory:
            jest.fn(() =>
              jest.fn(async () => ({
                data: {
                  uid: "must-not-propagate",
                  email:
                    "must-not-propagate@example.invalid",
                },
              }))
            ),
          customTokenSignIn: jest.fn(),
        });

      await expect(
        signIn({
          username: "learner_one",
          password: "password-value",
        })
      ).rejects.toThrow(
        "Username sign-in could not be completed."
      );
    });

    test("rejects blank username/password before calling Firebase", async () => {
      const callableFactory = jest.fn();
      const signIn =
        createFirebaseUsernamePasswordSignIn({
          authInstance: createAuth(),
          functionsInstance: {},
          callableFactory,
          customTokenSignIn: jest.fn(),
        });

      await expect(
        signIn({
          username: " ",
          password: "password-value",
        })
      ).rejects.toThrow(
        "Username and password are required."
      );

      await expect(
        signIn({
          username: "learner_one",
          password: "",
        })
      ).rejects.toThrow(
        "Username and password are required."
      );

      expect(
        callableFactory
      ).not.toHaveBeenCalled();
    });

    test("caches callable construction but never caches credentials", async () => {
      const callable = jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            customToken: "token-1",
          },
        })
        .mockResolvedValueOnce({
          data: {
            customToken: "token-2",
          },
        });
      const callableFactory =
        jest.fn(() => callable);
      const customTokenSignIn =
        jest.fn(
          async (_auth, token) => ({
            user: {
              uid: token,
              emailVerified: true,
            },
          })
        );
      const signIn =
        createFirebaseUsernamePasswordSignIn({
          authInstance: createAuth(),
          functionsInstance: {},
          callableFactory,
          customTokenSignIn,
        });

      await signIn({
        username: "learner_one",
        password: "password-one",
      });
      await signIn({
        username: "learner_one",
        password: "password-two",
      });

      expect(
        callableFactory
      ).toHaveBeenCalledTimes(1);
      expect(callable).toHaveBeenCalledTimes(2);
      expect(
        customTokenSignIn
      ).toHaveBeenCalledTimes(2);
    });
  }
);
