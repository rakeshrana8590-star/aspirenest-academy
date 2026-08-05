"use strict";

const assert = require("node:assert/strict");
const adapterModule = require(
  "./firestoreReadDependencyAdapter.js"
);
const contract = require(
  "./firestoreReadDependencyAdapterContract.json"
);

function documentSnapshot(
  id,
  data,
  exists = true,
) {
  return {
    id,
    exists() {
      return exists;
    },
    data() {
      return data;
    },
  };
}

function querySnapshot(documents) {
  return {
    docs: documents,
  };
}

function createHarness(overrides = {}) {
  const calls = [];
  const documents = new Map();
  let queryDocuments = [];
  let afterRead = null;

  const dependencies = {
    db: Object.freeze({ name: "db" }),
    doc(...args) {
      calls.push(["doc", ...args.slice(1)]);
      return Object.freeze({
        kind: "doc",
        args,
      });
    },
    collection(...args) {
      calls.push(["collection", ...args.slice(1)]);
      return Object.freeze({
        kind: "collection",
        args,
      });
    },
    async getDoc(reference) {
      calls.push(["getDoc", reference.args.slice(1)]);
      const key = reference.args.slice(1).join("/");
      const value = documents.has(key)
        ? documents.get(key)
        : documentSnapshot(
          reference.args.at(-1),
          {},
          false,
        );
      if (afterRead) {
        afterRead();
      }
      return value;
    },
    async getDocs(reference) {
      calls.push(["getDocs", reference.args.slice(1)]);
      if (afterRead) {
        afterRead();
      }
      return querySnapshot(queryDocuments);
    },
    ...overrides,
  };

  return {
    calls,
    documents,
    setQueryDocuments(value) {
      queryDocuments = value;
    },
    setAfterRead(callback) {
      afterRead = callback;
    },
    adapter:
      adapterModule.createFirestoreReadDependencyAdapter(
        dependencies,
      ),
  };
}

async function expectRejectCode(promise, code) {
  await assert.rejects(
    promise,
    (error) => (
      error
      && error.code === code
    ),
  );
}

(async () => {
  let cases = 0;

  assert.equal(contract.version, "1.0.0");
  assert.deepEqual(
    contract.profileCollections,
    ["users", "students", "mentorProfiles"],
  );
  assert.deepEqual(
    contract.canonicalCollections,
    [
      "contentItems",
      "studyRoadmaps",
      "experienceEvents",
      "mentorLiveSessions",
    ],
  );
  assert.equal(
    contract.entitlementProjection.rootCollection,
    "studentEntitlements",
  );
  assert.equal(
    contract.entitlementProjection.itemsSubcollection,
    "items",
  );
  assert.equal(
    contract.authority.rawPaymentDirectAuthority,
    false,
  );
  cases += 1;

  assert.throws(
    () => (
      adapterModule.createFirestoreReadDependencyAdapter()
    ),
    /db dependency/,
  );
  cases += 1;

  assert.throws(
    () => (
      adapterModule.createFirestoreReadDependencyAdapter({
        db: {},
      })
    ),
    /dependency missing/,
  );
  cases += 1;

  const harness = createHarness();
  const { adapter } = harness;

  await expectRejectCode(
    adapter.readProfileByCollection({
      collection: "payments",
      uid: "student-1",
    }),
    adapterModule.CODES.COLLECTION_BLOCKED,
  );
  assert.equal(harness.calls.length, 0);
  cases += 1;

  await expectRejectCode(
    adapter.readResourceById({
      collection: "contentItems",
      resourceId: "../secret",
    }),
    adapterModule.CODES.INVALID_REQUEST,
  );
  cases += 1;

  await expectRejectCode(
    adapter.readResourceById({
      collection: "contentItems",
      resourceId: "%252Fsecret",
    }),
    adapterModule.CODES.INVALID_REQUEST,
  );
  cases += 1;

  const accessorRequest = {};
  Object.defineProperty(
    accessorRequest,
    "collection",
    {
      enumerable: true,
      get() {
        throw new Error("getter");
      },
    },
  );
  Object.defineProperty(
    accessorRequest,
    "uid",
    {
      enumerable: true,
      value: "student-1",
    },
  );
  await expectRejectCode(
    adapter.readProfileByCollection(accessorRequest),
    adapterModule.CODES.INVALID_REQUEST,
  );
  cases += 1;

  const missingProfile =
    await adapter.readProfileByCollection({
      collection: "users",
      uid: "student-1",
    });
  assert.equal(missingProfile, null);
  assert.deepEqual(
    harness.calls.slice(-2).map((row) => row[0]),
    ["doc", "getDoc"],
  );
  cases += 1;

  harness.documents.set(
    "users/student-1",
    documentSnapshot(
      "student-1",
      {
        name: "Student One",
        role: "admin",
      },
    ),
  );
  const profile =
    await adapter.readProfileByCollection({
      collection: "users",
      uid: "student-1",
    });
  assert.equal(profile.name, "Student One");
  assert.equal(profile.role, "admin");
  assert.equal(Object.isFrozen(profile), true);
  cases += 1;

  const maliciousData = {};
  Object.defineProperty(
    maliciousData,
    "safe",
    {
      enumerable: true,
      value: "ok",
    },
  );
  Object.defineProperty(
    maliciousData,
    "role",
    {
      enumerable: true,
      get() {
        throw new Error("getter");
      },
    },
  );
  Object.defineProperty(
    maliciousData,
    "__proto__",
    {
      enumerable: true,
      value: {
        polluted: true,
      },
    },
  );
  harness.documents.set(
    "students/student-2",
    documentSnapshot(
      "student-2",
      maliciousData,
    ),
  );
  const sanitizedProfile =
    await adapter.readProfileByCollection({
      collection: "students",
      uid: "student-2",
    });
  assert.equal(sanitizedProfile.safe, "ok");
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      sanitizedProfile,
      "role",
    ),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      sanitizedProfile,
      "__proto__",
    ),
    false,
  );
  cases += 1;

  const missingResource =
    await adapter.readResourceById({
      collection: "contentItems",
      resourceId: "note-1",
    });
  assert.deepEqual(missingResource, {
    exists: false,
  });
  assert.equal(Object.isFrozen(missingResource), true);
  cases += 1;

  harness.documents.set(
    "contentItems/note-1",
    documentSnapshot(
      "note-1",
      {
        id: "note-1",
        title: "Note 1",
        requiredPlan: "PREMIUM",
      },
    ),
  );
  const resource =
    await adapter.readResourceById({
      collection: "contentItems",
      resourceId: "note-1",
    });
  assert.equal(resource.exists, true);
  assert.equal(resource.id, "note-1");
  assert.equal(resource.record.title, "Note 1");
  assert.equal(Object.isFrozen(resource), true);
  assert.equal(Object.isFrozen(resource.record), true);
  cases += 1;

  harness.documents.set(
    "studyRoadmaps/roadmap-1",
    documentSnapshot(
      "wrong-id",
      {
        id: "roadmap-1",
      },
    ),
  );
  const wrongReaderId =
    await adapter.readResourceById({
      collection: "studyRoadmaps",
      resourceId: "roadmap-1",
    });
  assert.equal(wrongReaderId.id, "wrong-id");
  cases += 1;

  const beforeAbort = {
    aborted: true,
  };
  await expectRejectCode(
    adapter.readProfileByCollection({
      collection: "users",
      uid: "student-3",
      signal: beforeAbort,
    }),
    adapterModule.CODES.ABORTED,
  );
  cases += 1;

  const afterAbort = {
    aborted: false,
  };
  harness.setAfterRead(() => {
    afterAbort.aborted = true;
  });
  await expectRejectCode(
    adapter.readProfileByCollection({
      collection: "users",
      uid: "student-4",
      signal: afterAbort,
    }),
    adapterModule.CODES.ABORTED,
  );
  harness.setAfterRead(null);
  cases += 1;

  const badSignal = {};
  Object.defineProperty(
    badSignal,
    "aborted",
    {
      get() {
        throw new Error("signal getter");
      },
    },
  );
  await expectRejectCode(
    adapter.readProfileByCollection({
      collection: "users",
      uid: "student-5",
      signal: badSignal,
    }),
    adapterModule.CODES.ABORTED,
  );
  cases += 1;

  harness.setQueryDocuments([]);
  const noEvidence =
    await adapter.listEntitlementEvidence({
      principalUid: "student-1",
    });
  assert.deepEqual(noEvidence, []);
  assert.equal(Object.isFrozen(noEvidence), true);
  assert.deepEqual(
    harness.calls.slice(-2)[0],
    [
      "collection",
      "studentEntitlements",
      "student-1",
      "items",
    ],
  );
  cases += 1;

  const timestamp = Object.freeze({
    seconds: 1_800_000_000,
    nanoseconds: 0,
  });
  harness.setQueryDocuments([
    documentSnapshot(
      "plan_PREMIUM",
      {
        id: "forged-id",
        uid: "student-1",
        accessId: "access-1",
        scopeType: "plan",
        planCode: "PREMIUM",
        status: "active",
        accessUntil: timestamp,
      },
    ),
    documentSnapshot(
      "item_mock_test_test-1",
      {
        uid: "student-1",
        accessId: "access-2",
        scopeType: "item",
        module: "mock_test",
        itemType: "mock_test",
        itemId: "test-1",
        status: "active",
      },
    ),
  ]);
  const evidence =
    await adapter.listEntitlementEvidence({
      principalUid: "student-1",
    });
  assert.equal(evidence.length, 2);
  assert.equal(
    evidence[0].id,
    "item_mock_test_test-1",
  );
  assert.equal(evidence[1].id, "plan_PREMIUM");
  assert.equal(
    evidence[1].accessUntil,
    timestamp,
  );
  assert.equal(Object.isFrozen(evidence[0]), true);
  cases += 1;

  harness.setQueryDocuments([
    documentSnapshot(
      "plan_PREMIUM",
      {
        uid: "student-1",
      },
    ),
    documentSnapshot(
      "plan_PREMIUM",
      {
        uid: "student-1",
      },
    ),
  ]);
  await expectRejectCode(
    adapter.listEntitlementEvidence({
      principalUid: "student-1",
    }),
    adapterModule.CODES.SNAPSHOT_INVALID,
  );
  cases += 1;

  harness.setQueryDocuments(
    Array.from(
      {
        length:
          adapterModule.MAX_ENTITLEMENT_ROWS + 1,
      },
      (_, index) => (
        documentSnapshot(
          `item_${index}`,
          {
            uid: "student-1",
          },
        )
      ),
    ),
  );
  await expectRejectCode(
    adapter.listEntitlementEvidence({
      principalUid: "student-1",
    }),
    adapterModule.CODES.ROW_LIMIT,
  );
  cases += 1;

  const failingHarness = createHarness({
    async getDoc() {
      throw new Error("raw secret error");
    },
  });
  await expectRejectCode(
    failingHarness.adapter.readProfileByCollection({
      collection: "users",
      uid: "student-6",
    }),
    adapterModule.CODES.FAILED,
  );
  cases += 1;

  const invalidSnapshotHarness = createHarness({
    async getDoc() {
      return {};
    },
  });
  await expectRejectCode(
    invalidSnapshotHarness.adapter.readProfileByCollection({
      collection: "users",
      uid: "student-7",
    }),
    adapterModule.CODES.SNAPSHOT_INVALID,
  );
  cases += 1;

  assert.deepEqual(
    adapterModule.PROFILE_COLLECTIONS,
    ["users", "students", "mentorProfiles"],
  );
  assert.deepEqual(
    adapterModule.CANONICAL_COLLECTIONS,
    [
      "contentItems",
      "studyRoadmaps",
      "experienceEvents",
      "mentorLiveSessions",
    ],
  );
  assert.equal(
    adapterModule.ENTITLEMENT_ROOT,
    "studentEntitlements",
  );
  assert.equal(adapterModule.ENTITLEMENT_ITEMS, "items");
  cases += 1;


  const canonicalServiceModule = require(
    "../canonicalResourceService.js"
  );
  const entitlementServiceModule = require(
    "../entitlementDecisionService.js"
  );

  const canonicalHarness = createHarness();
  canonicalHarness.documents.set(
    "contentItems/note-canonical",
    documentSnapshot(
      "note-canonical",
      {
        id: "note-canonical",
        resourceType: "note",
        section: "notes",
        planType: "PREMIUM",
        status: "published",
        canonicalRoute:
          "/ctet-tet/notes/read/note-canonical",
      },
    ),
  );

  const canonicalService =
    canonicalServiceModule.createCanonicalResourceService({
      readResourceById:
        canonicalHarness.adapter.readResourceById,
    });
  const canonicalResult =
    await canonicalService.getCanonicalResource({
      resourceId: "note-canonical",
      resourceTypeHint: "note",
    });
  assert.equal(canonicalResult.ok, true);
  assert.equal(canonicalResult.state, "canonical_record");
  assert.equal(
    canonicalResult.resource.resourceId,
    "note-canonical",
  );
  assert.equal(
    canonicalResult.resource.requiredPlan,
    "PREMIUM",
  );
  cases += 1;

  const entitlementHarness = createHarness();
  entitlementHarness.setQueryDocuments([
    documentSnapshot(
      "plan_PREMIUM",
      {
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
        accessUntil: "2099-01-01T00:00:00.000Z",
        noExpiry: false,
        untilManualChange: false,
        grantRevision: 1,
      },
    ),
  ]);

  const entitlementService =
    entitlementServiceModule
      .createEntitlementDecisionService({
        listEntitlementEvidence:
          entitlementHarness.adapter
            .listEntitlementEvidence,
      });
  const entitlementResult =
    await entitlementService.resolveEntitlementDecision({
      principal: {
        uid: "student-1",
        role: "student",
        allowed: ["public", "student"],
        planType: "FREE",
      },
      action: "READ",
      resource: {
        id: "note-canonical",
        resourceId: "note-canonical",
        type: "note",
        section: "notes",
        requiredPlan: "PREMIUM",
        publishState: "published",
        canonicalRoute:
          "/ctet-tet/notes/read/note-canonical",
        sourceCollection: "contentItems",
      },
      session: {
        uid: "student-1",
        role: "student",
        allowed: ["public", "student"],
        planType: "FREE",
      },
      signal: null,
    });
  assert.equal(entitlementResult.allowed, true);
  assert.equal(entitlementResult.state, "allowed");
  assert.equal(
    entitlementResult.matchedGrantId,
    "access-premium-1",
  );
  cases += 1;

  assert.equal(cases, 25);

  console.log(
    `FIRESTORE_READ_ADAPTER_CASES=${cases}/${cases}_PASS`,
  );
  console.log("PROFILE_COLLECTION_ALLOWLIST=PASS");
  console.log("CANONICAL_COLLECTION_ALLOWLIST=PASS");
  console.log("ENTITLEMENT_PROJECTION_PATH=PASS");
  console.log("RAW_LEDGER_AND_PAYMENT_AUTHORITY=REJECTED");
  console.log("CALLER_COLLECTION_PATH=REJECTED");
  console.log("DOCUMENT_ID_DECODE_GUARD=PASS");
  console.log("ABORT_BEFORE_AND_AFTER_READ=PASS");
  console.log("MALICIOUS_ACCESSOR_SANITIZATION=PASS");
  console.log("PROTOTYPE_POLLUTION_KEYS_REJECTED=PASS");
  console.log("PROJECTION_DOCUMENT_ID_AUTHORITY=PASS");
  console.log("ENTITLEMENT_ROW_LIMIT=PASS");
  console.log("CANONICAL_SERVICE_READER_COMPATIBILITY=PASS");
  console.log("ENTITLEMENT_SERVICE_READER_COMPATIBILITY=PASS");
  console.log("FIRESTORE_READ_ADAPTER_TEST_STATUS=GREEN");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
