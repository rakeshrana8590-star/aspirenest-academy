import {
  createFirebaseStudentProfileEnsure,
  STUDENT_PROFILE_ENSURE_FUNCTION_NAME,
} from "./studentProfileEnsureClient.js";

jest.mock(
  "firebase/functions",
  () => ({
    httpsCallable:
      jest.fn(),
  })
);

describe(
  "AspireNest canonical student profile ensure client",
  () => {
    test(
      "requires canonical Firebase Functions",
      () => {
        expect(() =>
          createFirebaseStudentProfileEnsure({
            functionsInstance:
              null,
          })
        ).toThrow(
          "Canonical Firebase Functions instance is required."
        );
      }
    );

    test(
      "sends no caller identity or role payload",
      async () => {
        const callable =
          jest.fn(
            async (payload) => ({
              data: {
                prepared: true,
              },
              payload,
            })
          );

        const callableFactory =
          jest.fn(
            () => callable
          );

        const functionsInstance = {
          kind:
            "canonical-functions",
        };

        const ensure =
          createFirebaseStudentProfileEnsure({
            functionsInstance,
            callableFactory,
          });

        await expect(
          ensure()
        ).resolves.toEqual({
          prepared: true,
        });

        expect(
          callableFactory
        ).toHaveBeenCalledWith(
          functionsInstance,
          STUDENT_PROFILE_ENSURE_FUNCTION_NAME,
          { timeout: 15000 }
        );

        expect(
          callable
        ).toHaveBeenCalledWith(
          {}
        );
      }
    );

    test(
      "neutralizes callable failure",
      async () => {
        const callableFactory =
          jest.fn(
            () =>
              jest.fn(
                async () => {
                  throw new Error(
                    "RAW_PROFILE_PRIVATE_ERROR"
                  );
                }
              )
          );

        const ensure =
          createFirebaseStudentProfileEnsure({
            functionsInstance:
              {},
            callableFactory,
          });

        await expect(
          ensure()
        ).resolves.toEqual({
          error:
            "Account profile could not be prepared.",
        });
      }
    );
  }
);
