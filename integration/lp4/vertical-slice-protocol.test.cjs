"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const protocol = JSON.parse(fs.readFileSync(path.join(__dirname, "vertical-slice-protocol.json"), "utf8"));
const registryRaw = JSON.parse(fs.readFileSync(path.join(root, "src/integration/v26/productionBridgeMethodRegistry.json"), "utf8"));
const registry = Array.isArray(registryRaw) ? registryRaw : registryRaw.methods;
const registryNames = new Set((registry || []).map((r) => r.name || r.method));

test("4.0 protocol preserves LP3/V26 authority and diagnostic strategy", () => {
  assert.equal(protocol.phase, "4.0");
  assert.equal(protocol.authority.lp3Checkpoint, "0bf7f9780fcf96b7921545edbb1007c8009a4656");
  assert.equal(protocol.authority.lockedV26Sha256, "ee8ce82aea31f3e02a9c05d7afd9d28aa489e4dcff6a7c19674dcedf375044a4");
  assert.equal(protocol.diagnosticStrategy.firstRedStopsDiagnosticSweep, false);
  assert.equal(protocol.diagnosticStrategy.continueIndependentChecksToEnd, true);
  assert.equal(protocol.diagnosticStrategy.realExecutionFailClosed, true);
  assert.equal(protocol.phase40Scope.moduleImplementationStarted, false);
  assert.equal(protocol.phase40Scope.visibleV26Changes, 0);
});

test("server truth and mutation envelope are mandatory", () => {
  assert.equal(protocol.serverTruth.serverStateCanonical, true);
  assert.equal(protocol.serverTruth.staleLocalMayOverrideServer, false);
  assert.equal(protocol.serverTruth.protectedActionMayBeGrantedFromLocalOnly, false);
  const need = new Set([
    "ok","resourceId","resourceType","ownerUid","operationId","idempotencyKey",
    "correlationId","auditId","serverUpdatedAt","version","safeReasonCode"
  ]);
  for (const field of need) assert.ok(protocol.mutationEnvelope.requiredFields.includes(field), field);
  assert.equal(protocol.mutationEnvelope.browserMayMintAuthoritativeAuditId, false);
});

test("all LP4 module protocols and action splits are sealed", () => {
  for (const phase of ["4.1","4.2","4.3","4.4","4.5","4.6","4.7"]) {
    assert.ok(protocol.moduleProtocols[phase], phase);
    assert.ok(protocol.moduleProtocols[phase].requirements.length >= 4, phase);
  }
  assert.deepEqual(protocol.moduleProtocols["4.2"].actions, ["ATTEMPT","SUBMIT","VIEW_RESULT","REVIEW"]);
  assert.deepEqual(protocol.moduleProtocols["4.5"].actions, ["JOIN","WATCH"]);
  assert.equal(protocol.routeAndAccess.assignmentGrantsEntitlement, false);
  assert.equal(protocol.routeAndAccess.deepLinkReauthorizesAtDestination, true);
});

test("all 65 pre-audited LP4 adapter methods still exist in the post-LP3 registry", () => {
  assert.equal(protocol.lp4RelevantMethods.length, 65);
  const missing = protocol.lp4RelevantMethods.map((x) => x.method).filter((name) => !registryNames.has(name));
  assert.deepEqual(missing, []);
});

test("LP3 canonical service owners required by LP4 exist", () => {
  for (const rel of [
    "src/integration/v26/canonicalResourceService.js",
    "src/integration/v26/authorizeProductionService.js",
    "src/integration/v26/entitlementDecisionService.js",
    "src/integration/v26/accessProductionService.js",
    "firestore.rules",
    "storage.rules"
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  }
});
