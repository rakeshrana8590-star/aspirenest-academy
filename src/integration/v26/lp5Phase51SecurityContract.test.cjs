"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const storage = fs.readFileSync(path.join(root, "storage.rules"), "utf8");
const app = fs.readFileSync(path.join(root, "runtime/v26-shell/app.js"), "utf8");
const registryRaw = JSON.parse(fs.readFileSync(path.join(root, "src/integration/v26/productionBridgeMethodRegistry.json"), "utf8"));
const rows = Array.isArray(registryRaw) ? registryRaw : (registryRaw.methods || []);
const contract = JSON.parse(fs.readFileSync(path.join(root, "integration/lp5/phase-5.1-production-contract.json"), "utf8"));

assert.equal(contract.phase, "5.1");
assert.equal(contract.activatedMethods.length, 11);

for (const method of contract.activatedMethods) {
  const row = rows.find((item) => item.name === method);
  assert.ok(row, method);
  assert.equal(row.ownerState, "RUNTIME_OWNER_ASSIGNED", method);
  assert.equal(row.runtimeActivation, true, method);
  assert.equal(row.owner, "lp5MentorProfileService", method);
  assert.equal(row.ownerDecisionEvidence, "LP5-PHASE-5.1-S5002", method);
}

assert.match(rules, /match \/lp5AuditLogs\/\{docId\}\s*\{\s*allow read:\s*if isAdmin\(\);\s*allow create, update, delete:\s*if false;/);
assert.match(rules, /match \/mentorProfiles\/\{mentorUid\}\s*\{\s*allow read:\s*if isAdmin\(\)\s*\|\|/);
assert.ok(!storage.includes("mentor-professional/"));
assert.match(storage, /match \/\{allPaths=\*\*\}\s*\{\s*allow read, write:\s*if false;/);

for (const token of [
  "hydrateLp5Phase51ProductionState",
  "lp5MentorProfileServerShadow",
  "lp5MentorProfileCommit",
  "await hydrateLp5Phase51ProductionState();",
  "loadPublicMentorDirectory",
  "loadMentorProfessionalProfile",
  "loadStudentProfile",
]) {
  assert.ok(app.includes(token), token);
}

assert.ok(!app.includes("production Storage upload still needs wiring"));
assert.equal((app.match(/adapter\.saveMentorProfessionalProfile/g) || []).length, 0);
assert.equal((app.match(/adapter\.saveMentorProfessionalEntry/g) || []).length, 0);
assert.equal((app.match(/adapter\.deleteMentorProfessionalEntry/g) || []).length, 0);

console.log("LP5_PHASE_5_1_SECURITY_CONTRACT=PASS");
console.log("ACTIVATED_METHODS=11");
console.log("DIRECT_MENTOR_PROFESSIONAL_STORAGE_RULE=DENY_BY_FALLBACK");
