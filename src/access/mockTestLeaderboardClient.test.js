import {
  buildMockTestLeaderboardPayload,
  createFirebaseMockTestLeaderboardCall,
} from "./mockTestLeaderboardClient";

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
  "AspireNest mock-test leaderboard callable client",
  () => {
    test("requires an authenticated current user", async () => {
      const callableFactory =
        jest.fn();
      const call =
        createFirebaseMockTestLeaderboardCall({
          authInstance: {
            currentUser: null,
          },
          functionsInstance: {},
          callableFactory,
        });

      await expect(
        call({
          testId: "mock-1",
          attemptId: "attempt-1",
        })
      ).rejects.toMatchObject({
        code: "auth/unauthenticated",
      });
      expect(
        callableFactory
      ).not.toHaveBeenCalled();
    });

    test("sends only the whitelisted result payload without client identity", async () => {
      const mockCallable = jest.fn(
        async (payload) => ({
          data: {
            saved: true,
            payload,
          },
        })
      );
      const callableFactory =
        jest.fn(() => mockCallable);
      const functionsInstance = {
        name: "regional-functions",
      };
      const call =
        createFirebaseMockTestLeaderboardCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
              email:
                "student@example.com",
            },
          },
          functionsInstance,
          callableFactory,
        });

      await call({
        testId: " mock-1 ",
        leaderboardMode:
          "liveLeaderboard",
        attemptId: " attempt-1 ",
        studentEmail:
          "forged@example.com",
        email:
          "forged@example.com",
        uid: "forged-uid",
        answers: {
          question1: "A",
        },
        correctAnswer: "A",
        score: 42,
      });

      expect(
        callableFactory
      ).toHaveBeenCalledWith(
        functionsInstance,
        "upsertMockTestLeaderboardEntry",
        { timeout: 15000 }
      );

      const payload =
        mockCallable.mock.calls[0][0];

      expect(payload).toMatchObject({
        testId: "mock-1",
        leaderboardMode:
          "liveLeaderboard",
        attemptId: "attempt-1",
        score: 42,
      });
      expect(payload).not.toHaveProperty(
        "studentEmail"
      );
      expect(payload).not.toHaveProperty(
        "email"
      );
      expect(payload).not.toHaveProperty(
        "uid"
      );
      expect(payload).not.toHaveProperty(
        "answers"
      );
      expect(payload).not.toHaveProperty(
        "correctAnswer"
      );
    });

    test("normalizes timestamps and freezes the payload", () => {
      const payload =
        buildMockTestLeaderboardPayload({
          testId: "mock-1",
          attemptId: "attempt-1",
          attemptStartedAt:
            new Date(1000),
          attemptSubmittedAt: {
            seconds: 2,
          },
        });

      expect(
        payload.attemptStartedAt
      ).toBe(1000);
      expect(
        payload.attemptSubmittedAt
      ).toBe(2000);
      expect(
        Object.isFrozen(payload)
      ).toBe(true);
    });

    test("caches the callable instance without caching responses", async () => {
      const mockCallable =
        jest.fn(async () => ({
          data: {},
        }));
      const callableFactory =
        jest.fn(() => mockCallable);
      const call =
        createFirebaseMockTestLeaderboardCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance: {},
          callableFactory,
        });

      await call({
        testId: "mock-1",
        attemptId: "attempt-1",
      });
      await call({
        testId: "mock-1",
        attemptId: "attempt-1",
      });

      expect(
        callableFactory
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCallable
      ).toHaveBeenCalledTimes(2);
    });
  }
);
