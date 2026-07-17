"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { HttpsError } = require("firebase-functions/v2/https");
const {
  buildMockTestServerTimeResponse,
} = require("./index.js").__test;

test("returns the minimal authenticated server-time response", () => {
  const result = buildMockTestServerTimeResponse({
    auth: { uid: "student-1" },
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
  assert.equal(Object.isFrozen(result), true);
});

test("rejects an unauthenticated request", () => {
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
        auth: { uid: "student-1" },
        data: {
          purpose: "other",
          testId: "mock-1",
        },
      }),
    (error) => error.code === "invalid-argument"
  );

  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: { uid: "student-1" },
        data: {
          purpose: "mock_test_submit",
          testId: "",
        },
      }),
    (error) => error.code === "invalid-argument"
  );
});

test("never accepts a client supplied timestamp", () => {
  const result = buildMockTestServerTimeResponse({
    auth: { uid: "student-1" },
    data: {
      purpose: "mock_test_attempt",
      testId: "mock-1",
      serverNowMs: 1,
    },
    now: () => 999999,
    makeRequestId: () => "clock-2",
  });

  assert.equal(result.serverNowMs, 999999);
});
