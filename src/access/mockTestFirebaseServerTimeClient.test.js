import {
  createFirebaseMockTestServerTimeCall,
} from "./mockTestFirebaseServerTimeClient";

jest.mock("../firebase", () => ({
  auth: {
    currentUser: null,
  },
  functions: {
    name: "functions-instance",
  },
}));

jest.mock("firebase/functions", () => ({
  httpsCallable: jest.fn(),
}));

describe(
  "AspireNest Firebase server-time callable client",
  () => {
    test("requires an authenticated current user before calling Firebase", async () => {
      const mockCallableFactory = jest.fn();
      const call =
        createFirebaseMockTestServerTimeCall({
          authInstance: {
            currentUser: null,
          },
          functionsInstance: {},
          callableFactory:
            mockCallableFactory,
        });

      await expect(
        call({
          testId: "mock-1",
        })
      ).rejects.toMatchObject({
        code: "auth/unauthenticated",
      });
      expect(
        mockCallableFactory
      ).not.toHaveBeenCalled();
    });

    test("uses the regional functions instance and minimal payload", async () => {
      const mockCallable = jest.fn(
        async (payload) => ({
          data: {
            source: "server",
            requestId: "clock-1",
            serverNowMs: 123,
          },
          payload,
        })
      );
      const mockCallableFactory =
        jest.fn(() => mockCallable);
      const functionsInstance = {
        name: "regional-functions",
      };
      const call =
        createFirebaseMockTestServerTimeCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance,
          callableFactory:
            mockCallableFactory,
        });

      await call({
        purpose:
          "mock_test_attempt",
        testId: " mock-1 ",
      });

      expect(
        mockCallableFactory
      ).toHaveBeenCalledWith(
        functionsInstance,
        "getMockTestServerTime",
        { timeout: 10000 }
      );
      expect(mockCallable).toHaveBeenCalledWith({
        purpose:
          "mock_test_attempt",
        testId: "mock-1",
      });
    });

    test("caches the callable instance without caching a response", async () => {
      const mockCallable = jest.fn(
        async () => ({ data: {} })
      );
      const mockCallableFactory =
        jest.fn(() => mockCallable);
      const call =
        createFirebaseMockTestServerTimeCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance: {},
          callableFactory:
            mockCallableFactory,
        });

      await call({ testId: "mock-1" });
      await call({ testId: "mock-1" });

      expect(
        mockCallableFactory
      ).toHaveBeenCalledTimes(1);
      expect(mockCallable).toHaveBeenCalledTimes(2);
    });
  }
);
