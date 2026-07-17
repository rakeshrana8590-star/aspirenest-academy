"use strict";

const assert = require("node:assert/strict");

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "demo-aspirenest-local";
const host =
  process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST ||
  "127.0.0.1:5001";

const callUnauthenticated = async ({
  functionName,
  data,
} = {}) => {
  const endpoint =
    `http://${host}/${projectId}/asia-south1/${functionName}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  const payload = await response.json();
  const status = String(
    payload?.error?.status || ""
  ).toUpperCase();

  assert.equal(
    status,
    "UNAUTHENTICATED",
    `Expected authenticated callable rejection for ${functionName}, got ${response.status}: ${JSON.stringify(payload)}`
  );
};

(async () => {
  await callUnauthenticated({
    functionName:
      "getMockTestServerTime",
    data: {
      purpose: "mock_test_attempt",
      testId: "mock-emulator-1",
    },
  });

  await callUnauthenticated({
    functionName:
      "upsertMockTestLeaderboardEntry",
    data: {
      testId: "mock-emulator-1",
      leaderboardMode:
        "liveLeaderboard",
      attemptId:
        "attempt-emulator-1",
    },
  });

  await callUnauthenticated({
    functionName:
      "resolveNotesProtectedAsset",
    data: {
      noteId: "note-emulator-1",
      action: "OPEN",
    },
  });

  console.log(
    "PHASE8A3_FUNCTIONS_EMULATOR_UNAUTHENTICATED_GUARDS=GREEN"
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
