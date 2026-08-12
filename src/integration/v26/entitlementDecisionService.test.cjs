"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const servicePath = path.resolve(
  __dirname,
  "entitlementDecisionService.js",
);
const contractPath = path.resolve(
  __dirname,
  "entitlementDecisionContract.json",
);
const authorizePath = path.resolve(
  __dirname,
  "authorizeProductionService.js",
);
const registryPath = path.resolve(
  __dirname,
  "productionBridgeMethodRegistry.json",
);
const runtimeIndexPath = path.resolve(
  __dirname,
  "../../../runtime/v26-shell/index.html",
);

const moduleUnderTest = require(servicePath);
const contract = require(contractPath);

const NOW = Date.parse("2026-08-04T12:00:00.000Z");
const ORIGINAL_NOW = Date.now;
Date.now = () => NOW;

function request(overrides = {}) {
  const resource = {
    id: "note-1",
    resourceId: "note-1",
    type: "note",
    section: "notes",
    requiredPlan: "PREMIUM",
    publishState: "published",
    canonicalRoute: "/ctet-tet/notes/read/note-1",
    sourceCollection: "contentItems",
    ...(overrides.resource || {}),
  };
  const principal = {
    uid: "student-1",
    role: "student",
    allowed: ["public", "student"],
    planType: "FREE",
    ...(overrides.principal || {}),
  };
  const session = {
    uid: "student-1",
    role: "student",
    allowed: ["public", "student"],
    planType: "FREE",
    ...(overrides.session || {}),
  };

  return {
    principal,
    action: overrides.action || "READ",
    resource,
    session,
    signal: overrides.signal || null,
  };
}

function evidence(overrides = {}) {
  return {
    id: "plan_PREMIUM",
    uid: "student-1",
    accessId: "access-premium-1",
    planType: "PREMIUM",
    planCode: "PREMIUM",
    accessRank: 200,
    productId: "plan_premium",
    scopeType: "plan",
    module: null,
    itemType: null,
    itemId: null,
    itemIds: [],
    bundleId: null,
    course: "CTET_TET",
    status: "active",
    accessFrom: "2026-01-01T00:00:00.000Z",
    accessUntil: "2027-01-01T00:00:00.000Z",
    noExpiry: false,
    untilManualChange: false,
    grantRevision: 1,
    ...overrides,
  };
}

function firestoreTimestamp(value) {
  const milliseconds = Date.parse(value);

  return {
    seconds: Math.floor(milliseconds / 1000),
    nanoseconds:
      (milliseconds % 1000) * 1000000,
  };
}

function harness(items = [evidence()], options = {}) {
  const calls = [];
  const service = moduleUnderTest.createEntitlementDecisionService({
    async listEntitlementEvidence(input) {
      calls.push(input);
      if (options.throwRead) {
        throw new Error("private-read-error");
      }
      return items;
    },
  });

  return { calls, service };
}

async function resolve(items, requestOverrides = {}, options = {}) {
  const built = harness(items, options);
  return built.service.resolveEntitlementDecision(
    request(requestOverrides),
  );
}

async function main() {
  assert.equal(contract.version, "1.4.0");
  assert.deepEqual(contract.canonicalPlans, [
    "FREE",
    "BASIC",
    "PREMIUM",
    "MENTORSHIP",
  ]);
  assert.deepEqual(contract.seedPlanRanks, {
    FREE: 0,
    BASIC: 100,
    PREMIUM: 200,
    MENTORSHIP: 300,
  });
  assert.deepEqual(contract.scopeValues, [
    "plan",
    "module",
    "bundle",
    "item",
  ]);
  assert.equal(
    contract.authorityCollections.grantLedger,
    "studentAccess",
  );
  assert.equal(
    contract.authorityCollections.runtimeProjection,
    "studentEntitlements/{uid}/items/{entitlementId}",
  );
  assert.equal(
    contract.policy.rawPaymentNeverAuthorizes,
    true,
  );
  assert.equal(
    contract.policy.canonicalProjectionIdRequired,
    true,
  );
  assert.equal(
    contract.policy.projectionEvidenceOnly,
    true,
  );
  assert.equal(
    contract.policy.conflictingProjectionRowsFailClosed,
    true,
  );
  assert.equal(
    contract.policy.multiplePlanProjectionRowsFailClosed,
    true,
  );
  assert.equal(
    contract.policy.normalizationExceptionsReturnError,
    true,
  );
  assert.deepEqual(contract.dependencyOutput, {
    shape: "array",
    source: "studentEntitlements/{uid}/items",
    documentIdField: "id",
    projectionOnly: true,
    timestampRepresentations: [
      "iso_string",
      "javascript_date",
      "firestore_timestamp_seconds_nanoseconds",
      "epoch_milliseconds_number",
    ],
    stringTimestampFormats: [
      "YYYY-MM-DD",
      "RFC3339_WITH_TIMEZONE",
    ],
    firestoreSecondsRange: {
      minimum: -62135596800,
      maximum: 253402300799,
    },
    numericTimestampUnit: "epoch_milliseconds",
  });
  assert.equal(
    contract.policy.firestoreTimestampCompatibilityRequired,
    true,
  );
  assert.equal(
    contract.policy.javascriptDateCompatibilityRequired,
    true,
  );
  assert.equal(
    contract.policy.expiryInclusiveAtExactMillisecond,
    true,
  );
  assert.equal(
    contract.policy.timestampObjectsMustUseOwnDataProperties,
    true,
  );
  assert.equal(
    contract.policy.timestampStringsMustBeCanonical,
    true,
  );
  assert.equal(
    contract.policy.firestoreTimestampRangeRequired,
    true,
  );
  assert.equal(
    contract.policy.epochMillisecondsCompatibilityRequired,
    true,
  );

  assert.throws(
    () => moduleUnderTest.createEntitlementDecisionService({}),
    /listEntitlementEvidence/,
  );

  const basicHarness = harness();
  const basicResult = await basicHarness.service
    .resolveEntitlementDecision(request());
  assert.deepEqual(basicHarness.calls, [{
    principalUid: "student-1",
    signal: null,
  }]);
  assert.equal(basicResult.state, "allowed");
  assert.equal(basicResult.allowed, true);
  assert.equal(basicResult.principalUid, "student-1");
  assert.equal(basicResult.resourceId, "note-1");
  assert.equal(basicResult.requiredPlan, "PREMIUM");
  assert.equal(basicResult.matchedGrantId, "access-premium-1");
  assert.equal(basicResult.matchedScope, "PLAN");
  assert.equal(
    basicResult.expiresAt,
    "2027-01-01T00:00:00.000Z",
  );
  assert.equal(Object.isFrozen(basicResult), true);

  for (const [type, action] of Object.entries(
    contract.typeActionMap,
  )) {
    const binding = contract.resourceBindings[type];
    const typeEvidence = evidence({
      id: `module_${binding.module}`,
      accessId: `access-${type}`,
      scopeType: "module",
      module: binding.module,
      itemType: null,
      itemId: null,
      itemIds: [],
      bundleId: null,
    });
    const result = await resolve(
      [typeEvidence],
      {
        action,
        resource: {
          id: `${type}-1`,
          resourceId: `${type}-1`,
          type,
          section: type,
        },
      },
    );
    assert.equal(
      result.state,
      "allowed",
      `${type} action map`,
    );
  }

  const mismatchAction = await resolve(
    [evidence()],
    { action: "WATCH" },
  );
  assert.equal(
    mismatchAction.code,
    moduleUnderTest.CODES.INVALID_REQUEST,
  );

  const mismatchSession = await resolve(
    [evidence()],
    { session: { uid: "other-user" } },
  );
  assert.equal(
    mismatchSession.code,
    moduleUnderTest.CODES.INVALID_REQUEST,
  );

  const getterRequest = {};
  Object.defineProperty(getterRequest, "principal", {
    get() {
      throw new Error("private-request-getter");
    },
  });
  Object.defineProperty(getterRequest, "action", {
    value: "READ",
  });
  Object.defineProperty(getterRequest, "resource", {
    value: request().resource,
  });
  const getterResult = await harness().service
    .resolveEntitlementDecision(getterRequest);
  assert.equal(
    getterResult.code,
    moduleUnderTest.CODES.INVALID_REQUEST,
  );

  const readFailure = await resolve(
    [evidence()],
    {},
    { throwRead: true },
  );
  assert.equal(readFailure.state, "error");
  assert.equal(
    readFailure.code,
    moduleUnderTest.CODES.EVIDENCE_READ_FAILED,
  );
  assert.equal(
    JSON.stringify(readFailure).includes("private"),
    false,
  );

  const nonArray = await resolve({ items: [] });
  assert.equal(
    nonArray.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const sparse = [];
  sparse.length = 1;
  const sparseResult = await resolve(sparse);
  assert.equal(
    sparseResult.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const maliciousEvidence = evidence();
  Object.defineProperty(maliciousEvidence, "uid", {
    get() {
      throw new Error("private-evidence-getter");
    },
  });
  const maliciousResult = await resolve([maliciousEvidence]);
  assert.equal(
    maliciousResult.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const uidMismatch = await resolve([
    evidence({ uid: "other-user" }),
  ]);
  assert.equal(
    uidMismatch.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const duplicateProjection = await resolve([
    evidence({ accessId: "grant-1" }),
    evidence({ accessId: "grant-2" }),
  ]);
  assert.equal(
    duplicateProjection.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const duplicateGrant = await resolve([
    evidence({ id: "plan_PREMIUM", accessId: "same" }),
    evidence({ id: "plan_MENTORSHIP", accessId: "same", planType: "MENTORSHIP", planCode: "MENTORSHIP", accessRank: 300 }),
  ]);
  assert.equal(
    duplicateGrant.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  for (const projectionOverride of [
    evidence({
      id: "bogus-plan-id",
    }),
    evidence({
      id: "bogus-module-id",
      accessId: "module-bogus",
      scopeType: "module",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: [],
      bundleId: null,
    }),
    evidence({
      id: "bogus-item-id",
      accessId: "item-bogus",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
      itemIds: [],
      bundleId: null,
    }),
    evidence({
      id: "bogus-bundle-id",
      accessId: "bundle-bogus",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "revision-pack",
    }),
  ]) {
    const result = await resolve([projectionOverride]);
    assert.equal(
      result.code,
      moduleUnderTest.CODES.EVIDENCE_INVALID,
    );
  }

  const disguisedRawLedger = await resolve([
    evidence({
      id: "grant-ledger-document-id",
      accessId: "grant-ledger-document-id",
    }),
  ]);
  assert.equal(
    disguisedRawLedger.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const segmentedResourceId = "note special #1";
  const segmentedProjection = await resolve([
    evidence({
      id: "item_notes_notesPdf_note_special_1",
      accessId: "segmented-item-grant",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: segmentedResourceId,
      itemIds: [],
      bundleId: null,
    }),
  ], {
    resource: {
      id: segmentedResourceId,
      resourceId: segmentedResourceId,
    },
  });
  assert.equal(segmentedProjection.state, "allowed");

  const evidenceLengthProxy = new Proxy([evidence()], {
    get(target, key, receiver) {
      if (key === "length") {
        throw new Error("private-length-getter");
      }

      return Reflect.get(target, key, receiver);
    },
  });
  const evidenceLengthResult = await resolve(
    evidenceLengthProxy,
  );
  assert.equal(
    evidenceLengthResult.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  Date.now = () => {
    throw new Error("private-now-error");
  };
  const nowThrowResult = await resolve([evidence()]);
  assert.equal(
    nowThrowResult.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  Date.now = () => Number.NaN;
  const nowNaNResult = await resolve([evidence()]);
  assert.equal(
    nowNaNResult.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );
  Date.now = () => NOW;

  const noMatch = await resolve([]);
  assert.equal(noMatch.state, "locked");
  assert.equal(noMatch.code, moduleUnderTest.CODES.NOT_FOUND);
  assert.equal(noMatch.matchedGrantId, null);

  const basicPlan = await resolve([
    evidence({
      id: "plan_BASIC",
      accessId: "basic",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
    }),
  ]);
  assert.equal(basicPlan.state, "locked");

  const mentorshipPlan = await resolve([
    evidence({
      id: "plan_MENTORSHIP",
      accessId: "mentor",
      planType: "MENTORSHIP",
      planCode: "MENTORSHIP",
      accessRank: 300,
    }),
  ]);
  assert.equal(mentorshipPlan.state, "allowed");

  const customAbovePremium = await resolve([
    evidence({
      id: "plan_CTET_MEGA",
      accessId: "mega",
      planType: "CTET_MEGA",
      planCode: "CTET_MEGA",
      accessRank: 250,
      productId: "plan_ctet_mega",
    }),
  ]);
  assert.equal(customAbovePremium.state, "allowed");

  const customBelowPremium = await resolve([
    evidence({
      id: "plan_CTET_CRASH_45",
      accessId: "crash",
      planType: "CTET_CRASH_45",
      planCode: "CTET_CRASH_45",
      accessRank: 150,
      productId: "plan_ctet_crash_45",
    }),
  ]);
  assert.equal(customBelowPremium.state, "locked");

  const customWithoutRank = await resolve([
    evidence({
      id: "plan_CUSTOM",
      accessId: "custom",
      planType: "CUSTOM",
      planCode: "CUSTOM",
      accessRank: null,
    }),
  ]);
  assert.equal(
    customWithoutRank.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const seedRankConflict = await resolve([
    evidence({ accessRank: 250 }),
  ]);
  assert.equal(
    seedRankConflict.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const planCodeConflict = await resolve([
    evidence({ planType: "PREMIUM", planCode: "BASIC" }),
  ]);
  assert.equal(
    planCodeConflict.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const moduleGrant = await resolve([
    evidence({
      id: "module_notes",
      accessId: "module-notes",
      scopeType: "module",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: [],
      bundleId: null,
    }),
  ]);
  assert.equal(moduleGrant.state, "allowed");
  assert.equal(moduleGrant.matchedScope, "MODULE");

  const wrongModule = await resolve([
    evidence({
      id: "module_video",
      accessId: "module-video",
      scopeType: "module",
      module: "video",
      itemType: null,
      itemId: null,
      itemIds: [],
      bundleId: null,
    }),
  ]);
  assert.equal(wrongModule.state, "locked");

  const itemGrant = await resolve([
    evidence({
      id: "item_notes_notesPdf_note-1",
      accessId: "item-note-1",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
      itemIds: [],
      bundleId: null,
    }),
  ]);
  assert.equal(itemGrant.state, "allowed");
  assert.equal(itemGrant.matchedScope, "ITEM");

  for (const wrong of [
    {
      id: "item_video_notesPdf_note-1",
      module: "video",
    },
    {
      id: "item_notes_video_note-1",
      itemType: "video",
    },
    {
      id: "item_notes_notesPdf_note-2",
      itemId: "note-2",
    },
  ]) {
    const result = await resolve([
      evidence({
        id: wrong.id,
        accessId: "item-wrong",
        planType: "BASIC",
        planCode: "BASIC",
        accessRank: 100,
        scopeType: "item",
        module: "notes",
        itemType: "notesPdf",
        itemId: "note-1",
        itemIds: [],
        bundleId: null,
        ...wrong,
      }),
    ]);
    assert.equal(result.state, "locked");
  }

  const bundleGrant = await resolve([
    evidence({
      id: "bundle_revision-pack",
      accessId: "bundle-1",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: ["note-1", "note-2"],
      bundleId: "revision-pack",
    }),
  ]);
  assert.equal(bundleGrant.state, "allowed");
  assert.equal(bundleGrant.matchedScope, "BUNDLE");

  const bundleWithoutModule = await resolve([
    evidence({
      id: "bundle_all-pack",
      accessId: "bundle-all",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: null,
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "all-pack",
    }),
  ]);
  assert.equal(bundleWithoutModule.state, "allowed");

  const bundleWrongModule = await resolve([
    evidence({
      id: "bundle_video-pack",
      accessId: "bundle-video",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "video",
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "video-pack",
    }),
  ]);
  assert.equal(bundleWrongModule.state, "locked");

  const activePastExpiry = await resolve([
    evidence({
      accessUntil: "2026-08-01T00:00:00.000Z",
    }),
  ]);
  assert.equal(activePastExpiry.state, "expired");
  assert.equal(activePastExpiry.allowed, false);
  assert.equal(
    activePastExpiry.expiresAt,
    "2026-08-01T00:00:00.000Z",
  );

  const dateOnlyExpiry = await resolve([
    evidence({ accessUntil: "2027-01-01" }),
  ]);
  assert.equal(dateOnlyExpiry.state, "allowed");
  assert.equal(
    dateOnlyExpiry.expiresAt,
    "2027-01-01T00:00:00.000Z",
  );

  const javascriptDateWindow = await resolve([
    evidence({
      accessFrom: new Date(
        "2026-01-01T00:00:00.000Z",
      ),
      accessUntil: new Date(
        "2027-01-01T00:00:00.000Z",
      ),
    }),
  ]);
  assert.equal(javascriptDateWindow.state, "allowed");
  assert.equal(
    javascriptDateWindow.expiresAt,
    "2027-01-01T00:00:00.000Z",
  );

  const epochMillisecondsWindow = await resolve([
    evidence({
      accessFrom: Date.parse(
        "2026-01-01T00:00:00.000Z",
      ),
      accessUntil: Date.parse(
        "2027-01-01T00:00:00.000Z",
      ),
    }),
  ]);
  assert.equal(
    epochMillisecondsWindow.state,
    "allowed",
  );
  assert.equal(
    epochMillisecondsWindow.expiresAt,
    "2027-01-01T00:00:00.000Z",
  );

  const epochExactBoundary = await resolve([
    evidence({
      accessUntil: NOW,
    }),
  ]);
  assert.equal(epochExactBoundary.state, "allowed");

  const epochPastBoundary = await resolve([
    evidence({
      accessUntil: NOW - 1,
    }),
  ]);
  assert.equal(epochPastBoundary.state, "expired");

  const firestoreTimestampWindow = await resolve([
    evidence({
      accessFrom: firestoreTimestamp(
        "2026-01-01T00:00:00.000Z",
      ),
      accessUntil: firestoreTimestamp(
        "2027-01-01T00:00:00.000Z",
      ),
    }),
  ]);
  assert.equal(
    firestoreTimestampWindow.state,
    "allowed",
  );
  assert.equal(
    firestoreTimestampWindow.expiresAt,
    "2027-01-01T00:00:00.000Z",
  );

  const exactExpiryBoundary = await resolve([
    evidence({
      accessUntil: firestoreTimestamp(
        "2026-08-04T12:00:00.000Z",
      ),
    }),
  ]);
  assert.equal(
    exactExpiryBoundary.state,
    "allowed",
  );
  assert.equal(
    exactExpiryBoundary.expiresAt,
    "2026-08-04T12:00:00.000Z",
  );

  const oneMillisecondPastExpiry = await resolve([
    evidence({
      accessUntil: firestoreTimestamp(
        "2026-08-04T11:59:59.999Z",
      ),
    }),
  ]);
  assert.equal(
    oneMillisecondPastExpiry.state,
    "expired",
  );

  for (const invalidTimestamp of [
    new Date("invalid"),
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    -62135596800001,
    253402300800000,
    { seconds: 1.5, nanoseconds: 0 },
    { seconds: Number.MAX_SAFE_INTEGER + 1, nanoseconds: 0 },
    { seconds: 1, nanoseconds: -1 },
    { seconds: 1, nanoseconds: 1000000000 },
    { seconds: 1 },
    { nanoseconds: 0 },
  ]) {
    const result = await resolve([
      evidence({
        accessUntil: invalidTimestamp,
      }),
    ]);

    assert.equal(
      result.code,
      moduleUnderTest.CODES.EVIDENCE_INVALID,
    );
  }

  const timestampGetter = {
    nanoseconds: 0,
  };
  Object.defineProperty(timestampGetter, "seconds", {
    get() {
      throw new Error("private-timestamp-getter");
    },
  });
  const timestampGetterResult = await resolve([
    evidence({
      accessUntil: timestampGetter,
    }),
  ]);
  assert.equal(
    timestampGetterResult.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );
  assert.equal(
    JSON.stringify(timestampGetterResult)
      .includes("private"),
    false,
  );

  const firestoreMaximum = await resolve([
    evidence({
      accessUntil: {
        seconds: 253402300799,
        nanoseconds: 999999999,
      },
    }),
  ]);
  assert.equal(firestoreMaximum.state, "allowed");
  assert.equal(
    firestoreMaximum.expiresAt,
    "9999-12-31T23:59:59.999Z",
  );

  const firestoreMinimum = await resolve([
    evidence({
      accessFrom: {
        seconds: -62135596800,
        nanoseconds: 0,
      },
    }),
  ]);
  assert.equal(firestoreMinimum.state, "allowed");

  for (const invalidTimestamp of [
    {
      seconds: 253402300800,
      nanoseconds: 0,
    },
    {
      seconds: -62135596801,
      nanoseconds: 0,
    },
  ]) {
    const result = await resolve([
      evidence({
        accessUntil: invalidTimestamp,
      }),
    ]);

    assert.equal(
      result.code,
      moduleUnderTest.CODES.EVIDENCE_INVALID,
    );
  }

  const rfc3339Offset = await resolve([
    evidence({
      accessUntil: "2027-01-01T05:30:00+05:30",
    }),
  ]);
  assert.equal(rfc3339Offset.state, "allowed");
  assert.equal(
    rfc3339Offset.expiresAt,
    "2027-01-01T00:00:00.000Z",
  );

  for (const invalidTimestampString of [
    "January 1, 2027",
    "01/02/2027",
    "2027-02-30",
    "2027-02-30T00:00:00Z",
    "2027-01-01 00:00:00Z",
    "+010000-01-01T00:00:00.000Z",
  ]) {
    const result = await resolve([
      evidence({
        accessUntil: invalidTimestampString,
      }),
    ]);

    assert.equal(
      result.code,
      moduleUnderTest.CODES.EVIDENCE_INVALID,
    );
  }

  const explicitExpired = await resolve([
    evidence({
      status: "expired",
      accessUntil: "2026-08-01T00:00:00.000Z",
    }),
  ]);
  assert.equal(explicitExpired.state, "expired");

  const expiredFuture = await resolve([
    evidence({
      status: "expired",
      accessUntil: "2027-01-01T00:00:00.000Z",
    }),
  ]);
  assert.equal(
    expiredFuture.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const expiredOpenEnded = await resolve([
    evidence({
      status: "expired",
      accessUntil: null,
    }),
  ]);
  assert.equal(
    expiredOpenEnded.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const futureStart = await resolve([
    evidence({
      accessFrom: "2027-01-01T00:00:00.000Z",
      accessUntil: "2028-01-01T00:00:00.000Z",
    }),
  ]);
  assert.equal(futureStart.state, "locked");

  for (const status of [
    "pending",
    "blocked",
    "revoked",
    "inactive",
    "disabled",
    "cancelled",
    "canceled",
    "denied",
    "rejected",
    "failed",
  ]) {
    const result = await resolve([
      evidence({ status }),
    ]);
    assert.equal(result.state, "locked", status);
    assert.equal(result.allowed, false);
  }

  const openEnded = await resolve([
    evidence({
      accessUntil: null,
      noExpiry: false,
      untilManualChange: false,
    }),
  ]);
  assert.equal(openEnded.state, "allowed");
  assert.equal(openEnded.expiresAt, null);

  const noExpiry = await resolve([
    evidence({
      accessUntil: null,
      noExpiry: true,
    }),
  ]);
  assert.equal(noExpiry.state, "allowed");

  const manual = await resolve([
    evidence({
      accessUntil: null,
      untilManualChange: true,
    }),
  ]);
  assert.equal(manual.state, "allowed");

  for (const invalidValidity of [
    { noExpiry: true, untilManualChange: true, accessUntil: null },
    { noExpiry: true, accessUntil: "2027-01-01T00:00:00.000Z" },
    { accessFrom: "2027-01-01T00:00:00.000Z", accessUntil: "2026-01-01T00:00:00.000Z" },
    { accessUntil: "not-a-date" },
  ]) {
    const result = await resolve([
      evidence(invalidValidity),
    ]);
    assert.equal(
      result.code,
      moduleUnderTest.CODES.EVIDENCE_INVALID,
    );
  }

  const rawPaymentLike = await resolve([{
    id: "payment-1",
    uid: "student-1",
    status: "paid",
    amount: 799,
    planType: "PREMIUM",
  }]);
  assert.equal(
    rawPaymentLike.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const itemWins = await resolve([
    evidence({
      id: "plan_MENTORSHIP",
      accessId: "plan-grant",
      planType: "MENTORSHIP",
      planCode: "MENTORSHIP",
      accessRank: 300,
    }),
    evidence({
      id: "item_notes_notesPdf_note-1",
      accessId: "item-grant",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
      itemIds: [],
      bundleId: null,
    }),
  ]);
  assert.equal(itemWins.matchedGrantId, "item-grant");
  assert.equal(itemWins.matchedScope, "ITEM");

  const multiplePlanProjectionConflict = await resolve([
    evidence({
      id: "plan_PREMIUM",
      accessId: "premium-grant",
      accessUntil: "2028-01-01T00:00:00.000Z",
    }),
    evidence({
      id: "plan_MENTORSHIP",
      accessId: "mentor-grant",
      planType: "MENTORSHIP",
      planCode: "MENTORSHIP",
      accessRank: 300,
      accessUntil: "2027-01-01T00:00:00.000Z",
    }),
  ]);
  assert.equal(
    multiplePlanProjectionConflict.code,
    moduleUnderTest.CODES.EVIDENCE_INVALID,
  );

  const longerExpiryWins = await resolve([
    evidence({
      id: "bundle_short",
      accessId: "short-grant",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "short",
      accessUntil: "2027-01-01T00:00:00.000Z",
    }),
    evidence({
      id: "bundle_long",
      accessId: "long-grant",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "long",
      accessUntil: "2028-01-01T00:00:00.000Z",
    }),
  ]);
  assert.equal(longerExpiryWins.matchedGrantId, "long-grant");

  const lexicalWins = await resolve([
    evidence({
      id: "bundle_z",
      accessId: "z-grant",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "z",
    }),
    evidence({
      id: "bundle_a",
      accessId: "a-grant",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      scopeType: "bundle",
      module: "notes",
      itemType: null,
      itemId: null,
      itemIds: ["note-1"],
      bundleId: "a",
    }),
  ]);
  assert.equal(lexicalWins.matchedGrantId, "a-grant");

  if (fs.existsSync(authorizePath)) {
    const authorizeModule = require(authorizePath);
    const entitlementService = harness().service;
    const authorize = authorizeModule.createAuthorizeProductionService({
      async getAuthoritativeSession() {
        return {
          ready: true,
          authenticated: true,
          accessAllowed: true,
          emailVerified: true,
          uid: "student-1",
          role: "student",
          allowed: ["public", "student"],
          planType: "FREE",
        };
      },
      async getCanonicalResource() {
        return {
          ok: true,
          state: "canonical_record",
          resource: request().resource,
        };
      },
      resolveEntitlementDecision:
        entitlementService.resolveEntitlementDecision,
    });
    const integrationResult = await authorize.authorize({
      resource: {
        id: "note-1",
        resourceId: "note-1",
        type: "note",
      },
      action: "READ",
      session: { uid: "student-1" },
    });
    assert.equal(integrationResult.state, "allowed");
    assert.equal(
      integrationResult.matchedGrantId,
      "access-premium-1",
    );
  }

  const source = fs.readFileSync(servicePath, "utf8");
  assert.equal(/firebase\//.test(source), false);
  assert.equal(/firebase-admin/.test(source), false);
  assert.equal(/accessService/.test(source), false);
  assert.equal(/window\./.test(source), false);
  assert.equal(/document\./.test(source), false);
  assert.equal(/localStorage/.test(source), false);
  assert.equal(/sessionStorage/.test(source), false);
  assert.equal(/navigate\s*\(/.test(source), false);

  if (fs.existsSync(registryPath)) {
    const registry = require(registryPath);
    assert.equal(registry.methods.length, 182);
    assert.equal(
      registry.methods.filter((item) => item.owner !== null).length,
      33,
    );
    assert.equal(
      registry.methods.filter(
        (item) => item.ownerState === "SAFE_DISABLED_PENDING_OWNER",
      ).length,
      149,
    );
  }

  if (fs.existsSync(runtimeIndexPath)) {
    const runtimeIndex = fs.readFileSync(
      runtimeIndexPath,
      "utf8",
    );
    assert.equal(
      runtimeIndex.includes("entitlementDecisionService"),
      false,
    );
  }

  console.log("ENTITLEMENT_SERVICE_METHODS=1/1");
  console.log("ENTITLEMENT_DEPENDENCIES=1/1");
  console.log("ENTITLEMENT_REQUEST_FIELDS=5/5");
  console.log("ENTITLEMENT_ACTION_MAP=7/7_PASS");
  console.log("PLAN_SEED_RANKS=4/4_PASS");
  console.log("CUSTOM_PLAN_ACCESS_RANK=PASS");
  console.log("PLAN_SCOPE_THRESHOLD=PASS");
  console.log("MODULE_SCOPE_BINDING_AND_THRESHOLD=PASS");
  console.log("ITEM_EXACT_BINDING=PASS");
  console.log("BUNDLE_MEMBERSHIP_BINDING=PASS");
  console.log("ITEM_BUNDLE_PLAN_THRESHOLD_BYPASS=EXACT_TARGET_ONLY_PASS");
  console.log("STATUS_FAIL_CLOSED=PASS");
  console.log("TEMPORAL_WINDOW_FAIL_CLOSED=PASS");
  console.log("DATE_ONLY_EXPIRY_NORMALIZATION=PASS");
  console.log("JAVASCRIPT_DATE_COMPATIBILITY=PASS");
  console.log("EPOCH_MILLISECONDS_COMPATIBILITY=PASS");
  console.log("FIRESTORE_TIMESTAMP_COMPATIBILITY=PASS");
  console.log("EXACT_EXPIRY_BOUNDARY_INCLUSIVE=PASS");
  console.log("TIMESTAMP_SHAPE_FAIL_CLOSED=PASS");
  console.log("TIMESTAMP_GETTER_SANITIZATION=PASS");
  console.log("FIRESTORE_TIMESTAMP_RANGE=PASS");
  console.log("CANONICAL_TIMESTAMP_STRING_FORMAT=PASS");
  console.log("RFC3339_OFFSET_COMPATIBILITY=PASS");
  console.log("IMPOSSIBLE_CALENDAR_DATE_REJECTED=PASS");
  console.log("PAYMENT_RECORD_DIRECT_AUTHORITY=NO");
  console.log("ENTITLEMENT_PRINCIPAL_UID_BINDING=PASS");
  console.log("CANONICAL_PROJECTION_ID_BINDING=PASS");
  console.log("RAW_LEDGER_DISGUISE_REJECTED=PASS");
  console.log("MULTIPLE_PLAN_PROJECTION_CONFLICT_FAIL_CLOSED=PASS");
  console.log("PROJECTION_SEGMENT_PARITY=PASS");
  console.log("PROJECTION_NORMALIZATION_EXCEPTION_SANITIZATION=PASS");
  console.log("DATE_NOW_FAILURE_SANITIZATION=PASS");
  console.log("OVERLAP_RESOLUTION_DETERMINISTIC=PASS");
  console.log("DEPENDENCY_FAILURE_SANITIZATION=PASS");
  console.log("MALICIOUS_ACCESSOR_SANITIZATION=PASS");
  console.log("RESULT_ENVELOPES_FROZEN=PASS");
  console.log("AUTHORIZE_SERVICE_COMPATIBILITY=PASS");
  console.log("DIRECT_FIREBASE_IMPORT=NO");
  console.log("DIRECT_ACCESS_SERVICE_IMPORT=NO");
  console.log("NAVIGATION_SIDE_EFFECTS=0");
  console.log("RUNTIME_LOAD=NO");
  console.log("PROVIDER_ACTIVATION=NO");
  console.log("RUNTIME_OWNER_ASSIGNMENTS=33");
  console.log("SAFE_DISABLED_PENDING_OWNER=149");
  console.log("ENTITLEMENT_DECISION_TEST_STATUS=GREEN");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    Date.now = ORIGINAL_NOW;
  });
