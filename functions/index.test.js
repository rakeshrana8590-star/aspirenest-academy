"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  HttpsError,
} = require("firebase-functions/v2/https");
const {
  buildMockTestServerTimeResponse,
  buildMockTestLeaderboardProjection,
  buildPrivateLeaderboardId,
  buildPublicLeaderboardId,
  buildPublicLeaderboardName,
  loadOwnedSubmittedMockResult,
  shouldReplaceMockTestLeaderboardEntry,
} = require("./index.js").__test;

const SERVER_TIME_AUTH = {
  uid: "student-1",
};

const AUTH = {
  uid: "student-1",
  token: {
    email: "student@example.com",
    name: "Rakesh Rana",
  },
};

const LEADERBOARD_DATA = {
  testId: "mock-1",
  testTitle: "CTET Mega Mock",
  leaderboardMode: "liveLeaderboard",
  studentEmail: "forged@example.com",
  email: "forged@example.com",
  uid: "forged-uid",
  studentName: "Forged Name",
  subject: "CDP",
  chapter: "Learning",
  planType: "PREMIUM",
  examType: "CTET",
  testType: "Full",
  score: 42,
  totalMarks: 50,
  percentage: 84,
  accuracy: 88,
  correctCount: 42,
  wrongCount: 5,
  skippedCount: 3,
  totalQuestions: 50,
  durationSeconds: 1200,
  attemptId: "attempt-1",
  attemptStartedAt: 1000,
  attemptSubmittedAt: 2000,
  attemptNumber: 1,
  answers: {
    question1: "A",
  },
  correctAnswer: "A",
};

test("returns the minimal authenticated server-time response", () => {
  const result =
    buildMockTestServerTimeResponse({
      auth: SERVER_TIME_AUTH,
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-1",
      },
      now: () => 123456,
      makeRequestId: () => "clock-1",
    });

  assert.deepEqual(result, {
    source: "server",
    serverNowMs: 123456,
    requestId: "clock-1",
    authenticated: true,
    uid: "student-1",
  });
  assert.equal(
    Object.isFrozen(result),
    true
  );
});

test("rejects an unauthenticated server-time request", () => {
  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        data: {
          purpose: "mock_test_attempt",
          testId: "mock-1",
        },
      }),
    (error) =>
      error instanceof HttpsError &&
      error.code === "unauthenticated"
  );
});

test("rejects unsupported purpose and missing test id", () => {
  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: SERVER_TIME_AUTH,
        data: {
          purpose: "other",
          testId: "mock-1",
        },
      }),
    (error) =>
      error.code ===
      "invalid-argument"
  );

  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: SERVER_TIME_AUTH,
        data: {
          purpose: "mock_test_submit",
          testId: "",
        },
      }),
    (error) =>
      error.code ===
      "invalid-argument"
  );
});

test("never accepts a client supplied timestamp", () => {
  const result =
    buildMockTestServerTimeResponse({
      auth: SERVER_TIME_AUTH,
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-1",
        serverNowMs: 1,
      },
      now: () => 999999,
      makeRequestId: () => "clock-2",
    });

  assert.equal(
    result.serverNowMs,
    999999
  );
});

test("builds separate private and public-safe leaderboard records", () => {
  const projection =
    buildMockTestLeaderboardProjection({
      auth: AUTH,
      data: LEADERBOARD_DATA,
      now: () => 123456789,
    });

  assert.equal(
    projection.privateRecord.ownerUid,
    AUTH.uid
  );
  assert.equal(
    projection.privateRecord.ownerEmail,
    AUTH.token.email
  );
  assert.equal(
    projection.privateRecord.studentEmail,
    AUTH.token.email
  );
  assert.equal(
    projection.privateRecord.studentName,
    AUTH.token.name
  );
  assert.equal(
    projection.publicRecord.displayName,
    "Rakesh R."
  );
  assert.equal(
    projection.publicRecord.testId,
    "mock-1"
  );
  assert.equal(
    projection.publicRecord.score,
    42
  );
  assert.equal(
    projection.publicRecord.publicEntryId,
    projection.publicEntryId
  );

  [
    "uid",
    "ownerUid",
    "email",
    "ownerEmail",
    "studentEmail",
    "studentName",
    "attemptId",
    "attemptStartedAt",
    "attemptSubmittedAt",
    "answers",
    "correctAnswer",
    "leaderboardKey",
    "privateEntryId",
  ].forEach((field) => {
    assert.equal(
      Object.hasOwn(
        projection.publicRecord,
        field
      ),
      false,
      `Public projection exposed ${field}`
    );
  });

  assert.equal(
    Object.isFrozen(
      projection.privateRecord
    ),
    true
  );
  assert.equal(
    Object.isFrozen(
      projection.publicRecord
    ),
    true
  );
});

test("derives deterministic opaque private and public document ids", () => {
  const input = {
    uid: "student-1",
    testId: "mock-1",
    leaderboardMode: "liveleaderboard",
  };

  const privateId =
    buildPrivateLeaderboardId(input);
  const publicId =
    buildPublicLeaderboardId(input);

  assert.match(
    privateId,
    /^[a-f0-9]{64}$/
  );
  assert.match(
    publicId,
    /^[a-f0-9]{64}$/
  );
  assert.notEqual(
    privateId,
    publicId
  );
  assert.equal(
    buildPrivateLeaderboardId(input),
    privateId
  );
  assert.equal(
    buildPublicLeaderboardId(input),
    publicId
  );
});

test("masks public names at the server boundary", () => {
  assert.equal(
    buildPublicLeaderboardName(
      "Rakesh Rana"
    ),
    "Rakesh R."
  );
  assert.equal(
    buildPublicLeaderboardName(
      "student@example.com"
    ),
    "st***"
  );
  assert.equal(
    buildPublicLeaderboardName(
      "LongStudentName"
    ),
    "LongSt…"
  );
});

test("rejects unauthenticated and disabled leaderboard submissions", () => {
  assert.throws(
    () =>
      buildMockTestLeaderboardProjection({
        data: LEADERBOARD_DATA,
      }),
    (error) =>
      error.code ===
      "unauthenticated"
  );

  assert.throws(
    () =>
      buildMockTestLeaderboardProjection({
        auth: AUTH,
        data: {
          ...LEADERBOARD_DATA,
          leaderboardMode: "disabled",
        },
      }),
    (error) =>
      error.code ===
      "failed-precondition"
  );
});

test("replaces only the same attempt or a better ranked result", () => {
  const existing = {
    attemptId: "attempt-1",
    rankScore: 80,
    rankTieBreakerScore: 40,
  };

  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-1",
        rankScore: 70,
        rankTieBreakerScore: 35,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 81,
        rankTieBreakerScore: 39,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 80,
        rankTieBreakerScore: 41,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 79,
        rankTieBreakerScore: 100,
      }
    ),
    false
  );
});


test("requires an owned submitted result before projection writes", async () => {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({
      docs: [
        {
          id: "result-1",
          data: () => ({
            attemptKey:
              "attempt-1",
            attemptId:
              "attempt-1",
            testId: "mock-1",
            email:
              "student@example.com",
            score: 42,
          }),
        },
      ],
    }),
  };
  const firestore = {
    collection: (name) => {
      assert.equal(
        name,
        "mockResults"
      );
      return queryChain;
    },
  };

  const owned =
    await loadOwnedSubmittedMockResult({
      auth: AUTH,
      data: LEADERBOARD_DATA,
      firestore,
    });

  assert.equal(
    owned.uid,
    "student-1"
  );
  assert.equal(
    owned.result.id,
    "result-1"
  );
  assert.equal(
    owned.result.score,
    42
  );
});

test("fails closed when no owned submitted result matches", async () => {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({
      docs: [],
    }),
  };
  const firestore = {
    collection: () => queryChain,
  };

  await assert.rejects(
    () =>
      loadOwnedSubmittedMockResult({
        auth: AUTH,
        data: LEADERBOARD_DATA,
        firestore,
      }),
    (error) =>
      error.code ===
      "failed-precondition"
  );
});
