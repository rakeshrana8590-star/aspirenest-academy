import {
  createFirebaseStudentAccountRegistration,
  STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME,
  STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE,
} from "./studentAccountRegistrationClient";

jest.mock("firebase/functions", () => ({
  httpsCallable: jest.fn(),
}));

describe(
  "AspireNest Student account registration callable client",
  () => {
    test("requires the canonical Firebase Functions instance", () => {
      expect(() =>
        createFirebaseStudentAccountRegistration({
          functionsInstance: null,
        })
      ).toThrow(
        "Canonical Firebase Functions instance is required."
      );
    });

    test("sends only the Student-registration allowlist and preserves password bytes", async () => {
      const callable = jest.fn(
        async () => ({
          data: {
            prepared: true,
            uid:
              "must-not-propagate",
            email:
              "must-not-propagate@example.invalid",
            role:
              "must-not-propagate",
          },
        })
      );
      const callableFactory =
        jest.fn(() => callable);
      const functionsInstance = {
        name: "canonical-functions",
      };

      const register =
        createFirebaseStudentAccountRegistration({
          functionsInstance,
          callableFactory,
        });

      const result = await register({
        fullName:
          " Synthetic Aspirant ",
        username:
          " Learner_One ",
        email:
          " ASPIRANT@EXAMPLE.INVALID ",
        password:
          "  Strong1!Password  ",
        role:
          "admin",
        requestedRole:
          "mentor",
        activeRole:
          "admin",
        allowedRoles: [
          "admin",
        ],
        createdAt:
          "client-controlled",
        returnTo:
          "#admin",
        targetExam:
          "CTET",
        language:
          "English",
      });

      expect(
        callableFactory
      ).toHaveBeenCalledWith(
        functionsInstance,
        STUDENT_ACCOUNT_REGISTRATION_FUNCTION_NAME,
        { timeout: 20000 }
      );

      expect(callable).toHaveBeenCalledWith({
        fullName:
          "Synthetic Aspirant",
        username:
          "Learner_One",
        email:
          "aspirant@example.invalid",
        password:
          "  Strong1!Password  ",
      });

      expect(result).toEqual({
        prepared: true,
      });

      expect(Object.keys(result)).toEqual([
        "prepared",
      ]);
    });

    test("returns neutral error object without throwing when callable fails", async () => {
      const register =
        createFirebaseStudentAccountRegistration({
          functionsInstance: {},
          callableFactory:
            jest.fn(() =>
              jest.fn(async () => {
                throw new Error(
                  "RAW_SERVER_SECRET"
                );
              })
            ),
        });

      await expect(
        register({
          fullName:
            "Synthetic Aspirant",
          username:
            "learner_one",
          email:
            "aspirant@example.invalid",
          password:
            "Strong1!Password",
        })
      ).resolves.toEqual({
        error:
          STUDENT_ACCOUNT_REGISTRATION_PUBLIC_FAILURE,
      });
    });

    test("fails closed locally for incomplete input without calling Firebase", async () => {
      const callableFactory =
        jest.fn();

      const register =
        createFirebaseStudentAccountRegistration({
          functionsInstance: {},
          callableFactory,
        });

      await expect(
        register({
          fullName:
            "Synthetic Aspirant",
          username:
            "",
          email:
            "aspirant@example.invalid",
          password:
            "Strong1!Password",
        })
      ).resolves.toEqual({
        error:
          "Account could not be created.",
      });

      expect(
        callableFactory
      ).not.toHaveBeenCalled();
    });

    test("caches callable construction without caching registration responses", async () => {
      const callable = jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            prepared: true,
          },
        })
        .mockRejectedValueOnce(
          new Error(
            "SECOND_CALL_FAILURE"
          )
        );
      const callableFactory =
        jest.fn(() => callable);

      const register =
        createFirebaseStudentAccountRegistration({
          functionsInstance: {},
          callableFactory,
        });

      const payload = {
        fullName:
          "Synthetic Aspirant",
        username:
          "learner_one",
        email:
          "aspirant@example.invalid",
        password:
          "Strong1!Password",
      };

      await expect(
        register(payload)
      ).resolves.toEqual({
        prepared: true,
      });

      await expect(
        register(payload)
      ).resolves.toEqual({
        error:
          "Account could not be created.",
      });

      expect(
        callableFactory
      ).toHaveBeenCalledTimes(1);
      expect(
        callable
      ).toHaveBeenCalledTimes(2);
    });
  }
);
