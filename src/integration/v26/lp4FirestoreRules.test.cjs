#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc } = require("firebase/firestore");

(async () => {
  const projectId = process.env.GCLOUD_PROJECT || "demo-aspirenest-lp4";
  const rules = fs.readFileSync(path.resolve(__dirname, "../../../firestore.rules"), "utf8");
  const env = await initializeTestEnvironment({ projectId, firestore: { rules } });
  try {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "studentLearning", "u1_note1"), { ownerUid:"u1", resourceId:"note1", progress:40 });
      await setDoc(doc(db, "studentLearningActions", "a1"), { ownerUid:"u1", resourceId:"note1" });
      await setDoc(doc(db, "mockAttempts", "attempt1"), { ownerUid:"u1", testId:"test1", status:"active" });
      await setDoc(doc(db, "studyRoadmapProgress", "u1_r1"), { ownerUid:"u1", resourceId:"r1" });
      await setDoc(doc(db, "liveAttendance", "u1_live1"), { ownerUid:"u1", sessionId:"live1" });
      await setDoc(doc(db, "lp4AuditLogs", "audit1"), { actorUid:"u1" });
      await setDoc(doc(db, "lp4Idempotency", "idem1"), { ownerUid:"u1" });
      await setDoc(doc(db, "currentAffairsCorrections", "c1"), { resourceId:"ca1", appendOnly:true });
    });

    const own = env.authenticatedContext("u1", { email:"u1@example.com", role:"student" }).firestore();
    const other = env.authenticatedContext("u2", { email:"u2@example.com", role:"student" }).firestore();
    const admin = env.authenticatedContext("admin1", { email:"aspirenestplatform@gmail.com", role:"admin" }).firestore();

    await assertSucceeds(getDoc(doc(own, "studentLearning", "u1_note1")));
    await assertFails(getDoc(doc(other, "studentLearning", "u1_note1")));
    await assertFails(setDoc(doc(own, "studentLearning", "u1_note2"), { ownerUid:"u1", resourceId:"note2" }));
    await assertSucceeds(getDoc(doc(own, "mockAttempts", "attempt1")));
    await assertFails(getDoc(doc(other, "mockAttempts", "attempt1")));
    await assertSucceeds(getDoc(doc(own, "studyRoadmapProgress", "u1_r1")));
    await assertSucceeds(getDoc(doc(own, "liveAttendance", "u1_live1")));
    await assertFails(getDoc(doc(own, "lp4Idempotency", "idem1")));
    await assertSucceeds(getDoc(doc(admin, "lp4AuditLogs", "audit1")));
    await assertFails(getDoc(doc(own, "lp4AuditLogs", "audit1")));
    await assertSucceeds(getDoc(doc(own, "currentAffairsCorrections", "c1")));
    await assertFails(setDoc(doc(own, "currentAffairsCorrections", "c2"), { resourceId:"ca1" }));
    console.log("LP4_FIRESTORE_RULES=PASS");
  } finally {
    await env.cleanup();
  }
})().catch((error) => { console.error(error); process.exit(1); });
