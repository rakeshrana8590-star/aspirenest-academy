"use strict";

const { randomUUID } = require("node:crypto");
const {
  HttpsError,
  onCall,
} = require("firebase-functions/v2/https");

const ALLOWED_PURPOSES = new Set([
  "mock_test_attempt",
  "mock_test_submit",
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const buildMockTestServerTimeResponse = ({
  auth = null,
  data = {},
  now = () => Date.now(),
  makeRequestId = () => randomUUID(),
} = {}) => {
  const uid = cleanString(auth?.uid);

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Verified login is required."
    );
  }

  const purpose = cleanString(data?.purpose);
  const testId = cleanString(data?.testId);

  if (!ALLOWED_PURPOSES.has(purpose)) {
    throw new HttpsError(
      "invalid-argument",
      "Unsupported server-time purpose."
    );
  }

  if (!testId || testId.length > 200) {
    throw new HttpsError(
      "invalid-argument",
      "A valid mock-test id is required."
    );
  }

  const serverNowMs = Number(now());
  const requestId = cleanString(makeRequestId());

  if (!Number.isFinite(serverNowMs) || serverNowMs <= 0) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  if (!requestId) {
    throw new HttpsError(
      "internal",
      "Server request identifier is unavailable."
    );
  }

  return Object.freeze({
    source: "server",
    serverNowMs,
    requestId,
    authenticated: true,
    uid,
  });
};

exports.getMockTestServerTime = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 10,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    buildMockTestServerTimeResponse({
      auth: request.auth,
      data: request.data,
    })
);

exports.__test = Object.freeze({
  buildMockTestServerTimeResponse,
});
