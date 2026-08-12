#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { ref, uploadString, getBytes } = require("firebase/storage");

(async () => {
  const projectId = process.env.GCLOUD_PROJECT || "demo-aspirenest-lp4";
  const rules = fs.readFileSync(path.resolve(__dirname, "../../../storage.rules"), "utf8");
  const env = await initializeTestEnvironment({ projectId, storage: { rules } });
  try {
    const student = env.authenticatedContext("u1", { email:"u1@example.com", role:"student" }).storage();
    const admin = env.authenticatedContext("admin1", { email:"aspirenestplatform@gmail.com", role:"admin" }).storage();
    await assertFails(uploadString(ref(student, "videos/premium/v1.mp4"), "x"));
    await assertSucceeds(uploadString(ref(admin, "videos/premium/v1.mp4"), "x"));
    await assertFails(getBytes(ref(student, "videos/premium/v1.mp4")));
    await assertSucceeds(getBytes(ref(admin, "videos/premium/v1.mp4")));
    await assertFails(uploadString(ref(student, "notes/n1/book.pdf"), "x"));
    await assertSucceeds(uploadString(ref(admin, "notes/n1/book.pdf"), "x"));
    console.log("LP4_STORAGE_RULES=PASS");
  } finally {
    await env.cleanup();
  }
})().catch((error) => { console.error(error); process.exit(1); });
