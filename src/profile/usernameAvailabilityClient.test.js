import {
  createFirebaseUsernameAvailabilityCall,
  USERNAME_AVAILABILITY_FUNCTION_NAME,
} from "./usernameAvailabilityClient";

jest.mock("firebase/functions", () => ({
  httpsCallable: jest.fn(),
}));

describe(
  "AspireNest username availability callable client",
  () => {
    test("requires the canonical Firebase Functions instance", () => {
      expect(() =>
        createFirebaseUsernameAvailabilityCall({
          functionsInstance: null,
        })
      ).toThrow(
        "Canonical Firebase Functions instance is required."
      );
    });

    test("uses the canonical Functions instance and minimal username payload", async () => {
      const callable = jest.fn(
        async (payload) => ({
          data: { available: true },
          payload,
        })
      );
      const callableFactory =
        jest.fn(() => callable);
      const functionsInstance = {
        name: "canonical-functions",
      };
      const check =
        createFirebaseUsernameAvailabilityCall({
          functionsInstance,
          callableFactory,
        });

      const result = await check({
        username: " Learner_One ",
      });
      expect(callableFactory).toHaveBeenCalledWith(
        functionsInstance,
        USERNAME_AVAILABILITY_FUNCTION_NAME,
        { timeout: 10000 }
      );
      expect(callable).toHaveBeenCalledWith({
        username: "Learner_One",
      });
      expect(result).toEqual({ available: true });
    });

    test("never propagates UID/email fields from a callable response", async () => {
      const callable = jest.fn(
        async () => ({
          data: {
            available: false,
            uid: "must-not-propagate",
            email:
              "must-not-propagate@example.invalid",
            normalizedEmail:
              "must-not-propagate@example.invalid",
          },
        })
      );
      const check =
        createFirebaseUsernameAvailabilityCall({
          functionsInstance: {},
          callableFactory:
            jest.fn(() => callable),
        });
      const result = await check({
        username: "taken_user",
      });
      expect(result).toEqual({ available: false });
      expect(Object.keys(result)).toEqual([
        "available",
      ]);
    });

    test("fails closed locally for a blank username without calling Firebase", async () => {
      const callableFactory = jest.fn();
      const check =
        createFirebaseUsernameAvailabilityCall({
          functionsInstance: {},
          callableFactory,
        });
      await expect(
        check({ username: "   " })
      ).resolves.toEqual({ available: false });
      expect(callableFactory).not.toHaveBeenCalled();
    });

    test("caches the callable instance without caching availability responses", async () => {
      const callable = jest
        .fn()
        .mockResolvedValueOnce({
          data: { available: true },
        })
        .mockResolvedValueOnce({
          data: { available: false },
        });
      const callableFactory =
        jest.fn(() => callable);
      const check =
        createFirebaseUsernameAvailabilityCall({
          functionsInstance: {},
          callableFactory,
        });
      await expect(
        check({ username: "learner_one" })
      ).resolves.toEqual({ available: true });
      await expect(
        check({ username: "learner_one" })
      ).resolves.toEqual({ available: false });
      expect(callableFactory).toHaveBeenCalledTimes(1);
      expect(callable).toHaveBeenCalledTimes(2);
    });
  }
);
