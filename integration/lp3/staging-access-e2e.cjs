"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repo = path.resolve(process.argv[2] || ".");
const outFile = path.resolve(process.argv[3] || "lp3-stage39-report.json");
const projectId = String(process.argv[4] || "").trim();
const adminPath = path.resolve(process.argv[5] || "");

if (projectId !== "aspirenest-platform-staging") {
  throw new Error(`Exact staging project required; received ${projectId || "<blank>"}.`);
}
if (!fs.existsSync(adminPath)) {
  throw new Error(`firebase-admin package not found at ${adminPath}`);
}

const admin = require(adminPath);
const canonicalModule = require(path.join(repo, "src/integration/v26/canonicalResourceService.js"));
const entitlementModule = require(path.join(repo, "src/integration/v26/entitlementDecisionService.js"));
const authorizeModule = require(path.join(repo, "src/integration/v26/authorizeProductionService.js"));

const migrationReportPath = path.join(repo, "integration/lp3/migration-dry-run-report.json");
const migrationReport = JSON.parse(fs.readFileSync(migrationReportPath, "utf8"));
if (migrationReport.project !== projectId) {
  throw new Error("Phase 3.3 migration report is for a different project.");
}
if (migrationReport.migrationTreatment !== "ADAPTER_PRESERVE_NO_DESTRUCTIVE_REWRITE") {
  throw new Error("Unexpected Phase 3.3 migration treatment.");
}
if ((migrationReport.duplicateResourceIds || []).length || (migrationReport.orphanEntitlementProjections || []).length || (migrationReport.duplicateUserEmails || []).length) {
  throw new Error("Phase 3.3 dry-run contains unresolved migration conflicts.");
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});
const db = admin.firestore();
const auth = admin.auth();

const ROOT_COLLECTIONS = [
  "contentItems",
  "experienceEvents",
  "currentAffairs",
  "studyRoadmaps",
  "notes",
  "learningTexts",
  "courses",
  "mentorLiveSessions",
  "studentAccess",
  "studentEntitlements",
  "users",
  "accessAuditLogs",
  "studentAccessRequests",
  "mentorAccessRequests",
  "accessNotifications",
  "accessBulkImports",
  "accessBulkImportRows",
  "accessProducts",
  "accessKeys",
  "accessInvites",
];
const RESOURCE_COLLECTIONS = new Set([
  "contentItems", "experienceEvents", "currentAffairs", "studyRoadmaps",
  "notes", "learningTexts", "courses", "mentorLiveSessions",
]);

function clean(v) {
  if (v && typeof v.toDate === "function") return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = clean(x);
    return out;
  }
  return v;
}
function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
async function walkCollection(col, rows) {
  const snap = await col.get();
  for (const doc of snap.docs) {
    rows.push({ path: doc.ref.path, data: clean(doc.data()) });
    const subs = await doc.ref.listCollections();
    for (const sub of subs) await walkCollection(sub, rows);
  }
}
async function snapshotRelevant() {
  const rows = [];
  for (const name of ROOT_COLLECTIONS) await walkCollection(db.collection(name), rows);
  rows.sort((a, b) => a.path.localeCompare(b.path));
  const counts = {};
  for (const row of rows) {
    const root = row.path.split("/")[0];
    counts[root] = (counts[root] || 0) + 1;
  }
  return { rows, counts, sha256: stableHash(rows) };
}
function reconcile(rows) {
  const duplicateResourceIds = [];
  const seenResource = new Map();
  for (const row of rows) {
    const root = row.path.split("/")[0];
    if (!RESOURCE_COLLECTIONS.has(root)) continue;
    const id = String(row.data.resourceId || row.path.split("/")[1] || "").trim();
    if (!id) continue;
    if (seenResource.has(id) && seenResource.get(id) !== row.path) {
      duplicateResourceIds.push([id, seenResource.get(id), row.path]);
    } else seenResource.set(id, row.path);
  }

  const grantIds = new Set();
  for (const row of rows) {
    if (row.path.split("/")[0] !== "studentAccess") continue;
    const id = String(row.data.id || row.data.accessId || row.path.split("/")[1] || "").trim();
    if (id) grantIds.add(id);
  }
  const orphanEntitlementProjections = [];
  for (const row of rows) {
    if (row.path.split("/")[0] !== "studentEntitlements") continue;
    if (!row.path.includes("/items/")) continue;
    const accessId = String(row.data.accessId || "").trim();
    if (accessId && !grantIds.has(accessId)) orphanEntitlementProjections.push(row.path);
  }

  const duplicateUserEmails = [];
  const seenEmail = new Map();
  for (const row of rows) {
    if (row.path.split("/")[0] !== "users") continue;
    const email = String(row.data.normalizedEmail || row.data.email || "").trim().toLowerCase();
    if (!email) continue;
    if (seenEmail.has(email) && seenEmail.get(email) !== row.path) {
      duplicateUserEmails.push([email, seenEmail.get(email), row.path]);
    } else seenEmail.set(email, row.path);
  }
  return { duplicateResourceIds, orphanEntitlementProjections, duplicateUserEmails };
}
function assertNoReconciliationMismatch(rec, label) {
  const count = rec.duplicateResourceIds.length + rec.orphanEntitlementProjections.length + rec.duplicateUserEmails.length;
  if (count) throw new Error(`${label} reconciliation mismatch count=${count}`);
}
function sessionSnapshot(user, email) {
  return Object.freeze({
    ready: true,
    authenticated: true,
    accessAllowed: true,
    user: Object.freeze({ uid: user.uid, email, displayName: "LP3 Fixture", emailVerified: true }),
    uid: user.uid,
    role: "student",
    allowed: Object.freeze(["public", "student"]),
    email,
    displayName: "LP3 Fixture",
    username: `lp3_${user.uid.slice(0, 8)}`,
    planType: "FREE",
    emailVerified: true,
    profile: Object.freeze({}),
  });
}
async function deleteIfExists(ref) {
  const snap = await ref.get();
  if (snap.exists) await ref.delete();
}

(async () => {
  const startedAt = new Date().toISOString();
  const before = await snapshotRelevant();
  const beforeRec = reconcile(before.rows);
  assertNoReconciliationMismatch(beforeRec, "PRE_FIXTURE");

  const suffix = `${Date.now()}${crypto.randomBytes(3).toString("hex")}`;
  const resourceId = `lp3fixture${suffix}`.slice(0, 80);
  const grantId = `lp3grant${suffix}`.slice(0, 80);
  const projectionId = `item_notes_notesPdf_${resourceId}`;
  const auditRevokeId = `lp3auditrevoke${suffix}`.slice(0, 120);
  const auditRestoreId = `lp3auditrestore${suffix}`.slice(0, 120);
  const emails = [
    `lp3.allowed.${suffix}@example.invalid`,
    `lp3.denied.${suffix}@example.invalid`,
  ];
  const passwords = [
    `Lp3-Aa1!${crypto.randomBytes(9).toString("hex")}`,
    `Lp3-Bb2!${crypto.randomBytes(9).toString("hex")}`,
  ];
  const createdUsers = [];
  let fixtureWritten = false;
  let currentSession = null;
  const checks = [];

  const resourceRef = db.collection("contentItems").doc(resourceId);
  const grantRef = db.collection("studentAccess").doc(grantId);
  let projectionRef = null;
  let parentEntitlementRef = null;
  const auditRevokeRef = db.collection("accessAuditLogs").doc(auditRevokeId);
  const auditRestoreRef = db.collection("accessAuditLogs").doc(auditRestoreId);

  try {
    for (let i = 0; i < 2; i += 1) {
      const user = await auth.createUser({
        email: emails[i], password: passwords[i], emailVerified: true,
        disabled: false, displayName: `LP3 Staging ${i === 0 ? "Allowed" : "Denied"}`,
      });
      createdUsers.push(user);
      const verified = await auth.getUser(user.uid);
      if (!verified.emailVerified || verified.disabled) throw new Error("Disposable staging Auth account was not created in verified/active state.");
      checks.push({ check: `AUTH_ACCOUNT_${i + 1}`, uid: user.uid, result: "PASS" });
    }

    const allowedUser = createdUsers[0];
    const deniedUser = createdUsers[1];
    parentEntitlementRef = db.collection("studentEntitlements").doc(allowedUser.uid);
    projectionRef = parentEntitlementRef.collection("items").doc(projectionId);

    const now = new Date();
    const startIso = new Date(now.getTime() - 60_000).toISOString();
    const endIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const resource = {
      id: resourceId,
      resourceId,
      resourceType: "note",
      type: "note",
      section: "notes",
      title: "LP3 Staging Authorization Fixture",
      status: "published",
      publishState: "published",
      requiredPlan: "PREMIUM",
      canonicalRoute: `/ctet-tet/notes/read/${resourceId}`,
      moduleKey: "notes",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lp3Fixture: true,
    };
    const grant = {
      id: grantId,
      accessId: grantId,
      uid: allowedUser.uid,
      email: emails[0],
      normalizedEmail: emails[0],
      course: "CTET_TET",
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: resourceId,
      itemIds: [],
      bundleId: null,
      planType: "FREE",
      status: "active",
      source: "admin_manual",
      accessFrom: startIso,
      accessUntil: endIso,
      noExpiry: false,
      untilManualChange: false,
      grantRevision: 1,
      lp3Fixture: true,
    };
    const projection = {
      id: projectionId,
      uid: allowedUser.uid,
      accessId: grantId,
      planType: "FREE",
      planCode: "FREE",
      accessRank: 0,
      productId: "",
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: resourceId,
      itemIds: [],
      bundleId: null,
      course: "CTET_TET",
      status: "active",
      accessFrom: startIso,
      accessUntil: endIso,
      noExpiry: false,
      untilManualChange: false,
      grantRevision: 1,
      lp3Fixture: true,
    };

    const setupBatch = db.batch();
    setupBatch.set(resourceRef, resource);
    setupBatch.set(db.collection("users").doc(allowedUser.uid), {
      uid: allowedUser.uid, email: emails[0], normalizedEmail: emails[0],
      role: "student", accountStatus: "active", emailVerified: true, lp3Fixture: true,
    });
    setupBatch.set(db.collection("users").doc(deniedUser.uid), {
      uid: deniedUser.uid, email: emails[1], normalizedEmail: emails[1],
      role: "student", accountStatus: "active", emailVerified: true, lp3Fixture: true,
    });
    setupBatch.set(parentEntitlementRef, { uid: allowedUser.uid, lp3Fixture: true });
    await setupBatch.commit();

    await db.runTransaction(async (tx) => {
      tx.set(grantRef, grant);
      tx.set(projectionRef, projection);
    });
    fixtureWritten = true;
    checks.push({ check: "TRANSACTIONAL_CANONICAL_GRANT_AND_PROJECTION_APPLY", result: "PASS" });

    const canonicalService = canonicalModule.createCanonicalResourceService({
      readResourceById: async ({ collection, resourceId: wantedId }) => {
        const snap = await db.collection(collection).doc(wantedId).get();
        return snap.exists
          ? { exists: true, id: snap.id, record: clean(snap.data()) }
          : { exists: false };
      },
    });
    const entitlementService = entitlementModule.createEntitlementDecisionService({
      listEntitlementEvidence: async ({ principalUid }) => {
        const snap = await db.collection("studentEntitlements").doc(principalUid).collection("items").get();
        return snap.docs.map((doc) => ({ id: doc.id, ...clean(doc.data()) }));
      },
    });
    const authorizeService = authorizeModule.createAuthorizeProductionService({
      getAuthoritativeSession: async () => currentSession,
      getCanonicalResource: canonicalService.getCanonicalResource,
      resolveEntitlementDecision: entitlementService.resolveEntitlementDecision,
    });
    async function authorizeFor(user, email) {
      currentSession = sessionSnapshot(user, email);
      return authorizeService.authorize({
        action: "READ",
        resource: { id: resourceId, resourceId, type: "note" },
      });
    }

    let decision = await authorizeFor(allowedUser, emails[0]);
    if (!decision.allowed || decision.state !== "allowed" || decision.matchedScope !== "ITEM" || decision.matchedGrantId !== grantId) {
      throw new Error(`Allowed account did not receive exact ITEM authorization: ${JSON.stringify(decision)}`);
    }
    checks.push({ check: "SEPARATE_ACCOUNT_A_EXACT_ITEM_ALLOWED", result: "PASS", code: decision.code });

    decision = await authorizeFor(deniedUser, emails[1]);
    if (decision.allowed || decision.state !== "locked") {
      throw new Error(`Denied account unexpectedly opened protected resource: ${JSON.stringify(decision)}`);
    }
    checks.push({ check: "SEPARATE_ACCOUNT_B_WITHOUT_GRANT_LOCKED", result: "PASS", code: decision.code });

    await db.runTransaction(async (tx) => {
      const [grantSnap, projectionSnap] = await Promise.all([tx.get(grantRef), tx.get(projectionRef)]);
      if (!grantSnap.exists || !projectionSnap.exists) throw new Error("Fixture grant/projection disappeared before revoke.");
      tx.update(grantRef, {
        status: "blocked", revokeReason: "LP3 separate-account staging revoke proof",
        revokedAt: new Date().toISOString(), grantRevision: 2,
      });
      // Current effective-projection policy removes blocked grants from the
      // runtime projection rather than leaving a second grant authority.
      tx.delete(projectionRef);
      tx.set(auditRevokeRef, {
        action: "LP3_STAGING_SOFT_REVOKE", accessId: grantId, uid: allowedUser.uid,
        reason: "LP3 separate-account staging revoke proof", before: clean(grantSnap.data()),
        after: { status: "blocked", grantRevision: 2 }, createdAt: new Date().toISOString(), lp3Fixture: true,
      });
    });
    decision = await authorizeFor(allowedUser, emails[0]);
    if (decision.allowed || decision.state !== "locked") throw new Error("Soft-revoked access remained authorized.");
    checks.push({ check: "SOFT_REVOKE_IMMEDIATELY_LOCKS", result: "PASS", code: decision.code });

    await db.runTransaction(async (tx) => {
      const [grantSnap, projectionSnap] = await Promise.all([tx.get(grantRef), tx.get(projectionRef)]);
      if (!grantSnap.exists) throw new Error("Fixture grant disappeared before restore.");
      if (projectionSnap.exists) throw new Error("Blocked grant unexpectedly remained in effective projection.");
      if (String(grantSnap.data().status || "") !== "blocked") throw new Error("Restore precondition expected blocked grant.");
      const reason = "LP3 separate-account staging restore proof";
      tx.update(grantRef, {
        status: "active", restoreReason: reason, restoredAt: new Date().toISOString(),
        revokedAt: null, revokeReason: "", grantRevision: 3,
      });
      tx.set(projectionRef, {
        id: projectionId, uid: allowedUser.uid, accessId: grantId, planType: "FREE",
        planCode: "FREE", accessRank: 0, productId: "", scopeType: "item",
        module: "notes", itemType: "notesPdf", itemId: resourceId, itemIds: [],
        bundleId: null, course: "CTET_TET", status: "active",
        accessFrom: startIso, accessUntil: endIso, noExpiry: false,
        untilManualChange: false, grantRevision: 3, lp3Fixture: true,
      });
      tx.set(auditRestoreRef, {
        action: "LP3_STAGING_RESTORE", accessId: grantId, uid: allowedUser.uid,
        reason, before: clean(grantSnap.data()), after: { status: "active", grantRevision: 3 },
        createdAt: new Date().toISOString(), lp3Fixture: true,
      });
    });
    decision = await authorizeFor(allowedUser, emails[0]);
    if (!decision.allowed || decision.state !== "allowed" || decision.matchedScope !== "ITEM") {
      throw new Error("Reasoned restore did not restore exact ITEM authorization.");
    }
    checks.push({ check: "REASONED_RESTORE_REAUTHORIZES_EXACT_ITEM", result: "PASS", code: decision.code });

    const mid = await snapshotRelevant();
    const midRec = reconcile(mid.rows);
    assertNoReconciliationMismatch(midRec, "MID_FIXTURE");
    checks.push({ check: "MID_RUN_RECONCILIATION_ZERO_MISMATCH", result: "PASS" });
  } finally {
    if (projectionRef) await deleteIfExists(projectionRef).catch(() => {});
    if (parentEntitlementRef) await deleteIfExists(parentEntitlementRef).catch(() => {});
    await deleteIfExists(grantRef).catch(() => {});
    await deleteIfExists(resourceRef).catch(() => {});
    await deleteIfExists(auditRevokeRef).catch(() => {});
    await deleteIfExists(auditRestoreRef).catch(() => {});
    for (const user of createdUsers) {
      await deleteIfExists(db.collection("users").doc(user.uid)).catch(() => {});
      await auth.deleteUser(user.uid).catch(() => {});
    }
  }

  const after = await snapshotRelevant();
  const afterRec = reconcile(after.rows);
  assertNoReconciliationMismatch(afterRec, "POST_CLEANUP");
  if (before.sha256 !== after.sha256) {
    throw new Error(`Staging cleanup did not restore the LP3-relevant Firestore snapshot. before=${before.sha256} after=${after.sha256}`);
  }
  for (const user of createdUsers) {
    let removed = false;
    try { await auth.getUser(user.uid); }
    catch (error) { removed = error && error.code === "auth/user-not-found"; }
    if (!removed) throw new Error(`Disposable Auth user was not deleted: ${user.uid}`);
  }
  checks.push({ check: "FIRESTORE_PRE_POST_SHA_EXACT_AFTER_CLEANUP", result: "PASS", sha256: after.sha256 });
  checks.push({ check: "DISPOSABLE_AUTH_USERS_CLEANED", result: "PASS" });

  const report = {
    phase: "3.9",
    project: projectId,
    startedAt,
    completedAt: new Date().toISOString(),
    phase33MigrationTreatment: migrationReport.migrationTreatment,
    controlledMigrationApply: "NO_DESTRUCTIVE_REWRITE_REQUIRED__REPRESENTATIVE_CANONICAL_STAGING_TRANSACTION_PROVEN",
    separateAccountsCreated: createdUsers.length,
    before: { counts: before.counts, sha256: before.sha256 },
    after: { counts: after.counts, sha256: after.sha256 },
    reconciliationBefore: beforeRec,
    reconciliationAfter: afterRec,
    checks,
    productionWrites: 0,
    stagingWrites: "DISPOSABLE_FIXTURES_ONLY_CLEANED",
    rollback: "EXACT_FIXTURE_CLEANUP_PLUS_GIT_PHASE_CHECKPOINT",
    unresolvedMismatchCount: 0,
    status: "GREEN",
  };
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log("LP3_PHASE_3.9_STAGING_E2E=GREEN");
  console.log(`STAGING_PROJECT=${projectId}`);
  console.log("SEPARATE_AUTH_ACCOUNTS=2");
  console.log(`RECONCILIATION_BEFORE_SHA256=${before.sha256}`);
  console.log(`RECONCILIATION_AFTER_SHA256=${after.sha256}`);
  console.log("UNRESOLVED_MISMATCH=0");
  console.log("DISPOSABLE_STAGING_FIXTURES_CLEANED=YES");
})().catch((error) => {
  const report = {
    phase: "3.9",
    project: projectId,
    completedAt: new Date().toISOString(),
    status: "RED",
    error: String(error && error.stack || error),
    productionWrites: 0,
  };
  try { fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`); } catch (_) {}
  console.error(error && error.stack || error);
  process.exitCode = 1;
}).finally(async () => {
  try { await admin.app().delete(); } catch (_) {}
});
