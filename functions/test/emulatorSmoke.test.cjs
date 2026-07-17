"use strict";

const assert = require("node:assert/strict");

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "demo-aspirenest-local";
const host =
  process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST ||
  "127.0.0.1:5001";
const endpoint =
  `http://${host}/${projectId}/asia-south1/getMockTestServerTime`;

(async () => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-emulator-1",
      },
    }),
  });

  const payload = await response.json();
  const status = String(
    payload?.error?.status || ""
  ).toUpperCase();

  assert.equal(
    status,
    "UNAUTHENTICATED",
    `Expected authenticated callable rejection, got ${response.status}: ${JSON.stringify(payload)}`
  );

  console.log("PHASE7FD_FUNCTIONS_EMULATOR_UNAUTHENTICATED_GUARD=GREEN");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
