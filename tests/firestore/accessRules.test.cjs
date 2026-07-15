const fs = require("node:fs");
const path = require("node:path");
const {
  after,
  afterEach,
  before,
  test,
} = require("node:test");
const assert = require("node:assert/strict");

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-rules-test";
const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const STUDENT_EMAIL = "student@example.com";
const STUDENT_UID = "student-uid";
const OTHER_EMAIL = "other@example.com";
const OTHER_UID = "other-uid";
const FUTURE_DATE = new Date("2030-01-01T00:00:00.000Z");

let testEnv;

const emulatorAddress = () => {
  const value =
    process.env.FIRESTORE_EMULATOR_HOST ||
    "127.0.0.1:8080";
  const [host, rawPort] = value.split(":");

  return {
    host,
    port: Number(rawPort),
  };
};

const adminDb = () =>
  testEnv
    .authenticatedContext("admin-uid", {
      email: ADMIN_EMAIL,
    })
    .firestore();

const studentDb = () =>
  testEnv
    .authenticatedContext(STUDENT_UID, {
      email: STUDENT_EMAIL,
    })
    .firestore();

const otherStudentDb = () =>
  testEnv
    .authenticatedContext(OTHER_UID, {
      email: OTHER_EMAIL,
    })
    .firestore();

const anonymousDb = () =>
  testEnv.unauthenticatedContext().firestore();

const seed = async (callback) =>
  testEnv.withSecurityRulesDisabled(
    async (context) => callback(context.firestore())
  );

const baseAccessRecord = (overrides = {}) => ({
  email: STUDENT_EMAIL,
  normalizedEmail: STUDENT_EMAIL,
  uid: null,
  planType: "PREMIUM",
  scopeType: "plan",
  status: "active",
  source: "admin_manual",
  course: "CTET_TET",
  module: null,
  itemType: null,
  itemId: null,
  itemTitle: "",
  itemIds: [],
  bundleId: null,
  productId: null,
  accessKeyId: null,
  campaignId: null,
  campaignName: "",
  campaignSource: "",
  learnerName: "Student",
  name: "Student",
  phone: "",
  accessFrom: null,
  accessUntil: FUTURE_DATE,
  notes: "",
  adminNote: "",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  createdBy: "admin-uid",
  actorEmail: ADMIN_EMAIL,
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedBy: "admin-uid",
  ...overrides,
});

const entitlementPayload = ({
  accessId,
  entitlementId = "plan_PREMIUM",
  source = "admin_manual",
} = {}) => ({
  id: entitlementId,
  uid: STUDENT_UID,
  email: STUDENT_EMAIL,
  normalizedEmail: STUDENT_EMAIL,
  accessId,
  planType: "PREMIUM",
  scopeType: "plan",
  module: null,
  itemType: null,
  itemId: null,
  itemIds: [],
  bundleId: null,
  course: "CTET_TET",
  status: "active",
  source,
  accessFrom: null,
  accessUntil: FUTURE_DATE,
  updatedAt: serverTimestamp(),
});

before(async () => {
  const { host, port } = emulatorAddress();
  const rules = fs.readFileSync(
    path.join(process.cwd(), "firestore.rules"),
    "utf8"
  );

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port,
      rules,
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

test("anonymous access-engine reads are denied", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", "access-1"),
      baseAccessRecord()
    );
  });

  await assertFails(
    getDoc(doc(anonymousDb(), "studentAccess", "access-1"))
  );
});

test("student can read own UID access", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", "access-1"),
      baseAccessRecord({ uid: STUDENT_UID })
    );
  });

  await assertSucceeds(
    getDoc(doc(studentDb(), "studentAccess", "access-1"))
  );
});

test("student cannot read another UID access", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", "access-1"),
      baseAccessRecord({
        uid: OTHER_UID,
        email: OTHER_EMAIL,
        normalizedEmail: OTHER_EMAIL,
      })
    );
  });

  await assertFails(
    getDoc(doc(studentDb(), "studentAccess", "access-1"))
  );
});

test("admin can create access and student cannot", async () => {
  await assertSucceeds(
    setDoc(
      doc(adminDb(), "studentAccess", "admin-created"),
      baseAccessRecord()
    )
  );

  await assertFails(
    setDoc(
      doc(studentDb(), "studentAccess", "student-created"),
      baseAccessRecord({
        uid: STUDENT_UID,
        createdBy: STUDENT_UID,
        actorEmail: STUDENT_EMAIL,
      })
    )
  );
});

test("UID-keyed users document is allowed", async () => {
  await assertSucceeds(
    setDoc(doc(studentDb(), "users", STUDENT_UID), {
      uid: STUDENT_UID,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      role: "student",
      isPremium: false,
      subscriptionType: "FREE",
      premiumStatus: "FREE",
    })
  );
});

test("email-keyed users document is denied even to admin", async () => {
  await assertFails(
    setDoc(doc(adminDb(), "users", STUDENT_EMAIL), {
      uid: STUDENT_UID,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      role: "student",
    })
  );
});

test("student cannot create another UID user document", async () => {
  await assertFails(
    setDoc(doc(studentDb(), "users", OTHER_UID), {
      uid: OTHER_UID,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      role: "student",
    })
  );
});

test("student cannot mutate premium projection fields", async () => {
  await seed(async (db) => {
    await setDoc(doc(db, "users", STUDENT_UID), {
      uid: STUDENT_UID,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      role: "student",
      isPremium: false,
      subscriptionType: "FREE",
      premiumStatus: "FREE",
    });
  });

  await assertFails(
    updateDoc(doc(studentDb(), "users", STUDENT_UID), {
      isPremium: true,
      subscriptionType: "PREMIUM",
      premiumStatus: "ACTIVE",
    })
  );
});

test("verified UID claim succeeds only with coupled audit and entitlement", async () => {
  const accessId = "claim-access";
  const auditId = "claim-audit";
  const entitlementId = "plan_PREMIUM";

  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", accessId),
      baseAccessRecord()
    );
  });

  const db = studentDb();
  const batch = writeBatch(db);

  batch.update(doc(db, "studentAccess", accessId), {
    uid: STUDENT_UID,
    identityClaimedAt: serverTimestamp(),
    identityClaimedByUid: STUDENT_UID,
    identityClaimedByEmail: STUDENT_EMAIL,
    identityClaimSource: "verified_uid_claim",
    identityClaimAuditId: auditId,
    identityClaimEntitlementId: entitlementId,
    updatedAt: serverTimestamp(),
    updatedBy: STUDENT_UID,
  });
  batch.set(
    doc(
      db,
      "studentEntitlements",
      STUDENT_UID,
      "items",
      entitlementId
    ),
    entitlementPayload({ accessId, entitlementId })
  );
  batch.set(doc(db, "accessAuditLogs", auditId), {
    action: "claim_pending_access_identity",
    accessId,
    email: STUDENT_EMAIL,
    uid: STUDENT_UID,
    before: { uid: null },
    after: {
      uid: STUDENT_UID,
      entitlementId,
      auditId,
    },
    metadata: {
      source: "verified_uid_claim",
      atomic: true,
      entitlementId,
    },
    createdAt: serverTimestamp(),
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
    actorRole: "student",
  });

  await assertSucceeds(batch.commit());
});

test("verified UID claim without audit is denied", async () => {
  const accessId = "claim-access";

  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", accessId),
      baseAccessRecord()
    );
  });

  await assertFails(
    updateDoc(doc(studentDb(), "studentAccess", accessId), {
      uid: STUDENT_UID,
      identityClaimedAt: serverTimestamp(),
      identityClaimedByUid: STUDENT_UID,
      identityClaimedByEmail: STUDENT_EMAIL,
      identityClaimSource: "verified_uid_claim",
      identityClaimAuditId: "missing-audit",
      identityClaimEntitlementId: "",
      updatedAt: serverTimestamp(),
      updatedBy: STUDENT_UID,
    })
  );
});

test("wrong-email UID claim is denied", async () => {
  const accessId = "claim-access";

  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", accessId),
      baseAccessRecord({
        email: OTHER_EMAIL,
        normalizedEmail: OTHER_EMAIL,
      })
    );
  });

  await assertFails(
    updateDoc(doc(studentDb(), "studentAccess", accessId), {
      uid: STUDENT_UID,
      identityClaimedAt: serverTimestamp(),
      identityClaimedByUid: STUDENT_UID,
      identityClaimedByEmail: STUDENT_EMAIL,
      identityClaimSource: "verified_uid_claim",
      identityClaimAuditId: "claim-audit",
      identityClaimEntitlementId: "",
      updatedAt: serverTimestamp(),
      updatedBy: STUDENT_UID,
    })
  );
});

test("conflicting UID claim is denied", async () => {
  const accessId = "claim-access";

  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", accessId),
      baseAccessRecord({ uid: OTHER_UID })
    );
  });

  await assertFails(
    updateDoc(doc(studentDb(), "studentAccess", accessId), {
      uid: STUDENT_UID,
      identityClaimedAt: serverTimestamp(),
      identityClaimedByUid: STUDENT_UID,
      identityClaimedByEmail: STUDENT_EMAIL,
      identityClaimSource: "verified_uid_claim",
      identityClaimAuditId: "claim-audit",
      identityClaimEntitlementId: "",
      updatedAt: serverTimestamp(),
      updatedBy: STUDENT_UID,
    })
  );
});

test("student cannot change access plan or status", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", "access-1"),
      baseAccessRecord({ uid: STUDENT_UID })
    );
  });

  await assertFails(
    updateDoc(doc(studentDb(), "studentAccess", "access-1"), {
      planType: "MENTORSHIP",
      status: "active",
    })
  );
});

test("bulk import ledgers are admin-only", async () => {
  await assertSucceeds(
    setDoc(doc(adminDb(), "accessBulkImports", "bulk-1"), {
      importId: "bulk-1",
      status: "planned",
    })
  );
  await assertSucceeds(
    setDoc(doc(adminDb(), "accessBulkImportRows", "row-1"), {
      importId: "bulk-1",
      rowId: "row-1",
      status: "ready",
    })
  );

  await assertFails(
    setDoc(doc(studentDb(), "accessBulkImports", "bulk-2"), {
      importId: "bulk-2",
      status: "planned",
    })
  );
  await assertFails(
    setDoc(doc(studentDb(), "accessBulkImportRows", "row-2"), {
      importId: "bulk-2",
      rowId: "row-2",
      status: "ready",
    })
  );
});

test("invite open requires atomic audit coupling", async () => {
  const inviteId = "invite-open";
  const auditId = "invite-open-audit";

  await seed(async (db) => {
    await setDoc(doc(db, "accessInvites", inviteId), {
      inviteCode: inviteId,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      inviteStatus: "pending",
      expiresAt: FUTURE_DATE,
      accessId: "access-1",
    });
  });

  const db = studentDb();
  const batch = writeBatch(db);
  batch.update(doc(db, "accessInvites", inviteId), {
    inviteStatus: "opened",
    openedAt: serverTimestamp(),
    openedByUid: STUDENT_UID,
    openedByEmail: STUDENT_EMAIL,
    openAuditId: auditId,
    updatedAt: serverTimestamp(),
    updatedBy: STUDENT_UID,
  });
  batch.set(doc(db, "accessAuditLogs", auditId), {
    action: "open_access_invite",
    accessId: "access-1",
    email: STUDENT_EMAIL,
    uid: STUDENT_UID,
    before: { inviteStatus: "pending" },
    after: { inviteStatus: "opened", openAuditId: auditId },
    metadata: {
      source: "manual_invite_link",
      inviteCode: inviteId,
      inviteId,
      atomic: true,
    },
    createdAt: serverTimestamp(),
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
    actorRole: "student",
  });

  await assertSucceeds(batch.commit());
});

test("invite open without atomic audit is denied", async () => {
  const inviteId = "invite-open";

  await seed(async (db) => {
    await setDoc(doc(db, "accessInvites", inviteId), {
      inviteCode: inviteId,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      inviteStatus: "pending",
      expiresAt: FUTURE_DATE,
      accessId: "access-1",
    });
  });

  await assertFails(
    updateDoc(doc(studentDb(), "accessInvites", inviteId), {
      inviteStatus: "opened",
      openedAt: serverTimestamp(),
      openedByUid: STUDENT_UID,
      openedByEmail: STUDENT_EMAIL,
      openAuditId: "missing-audit",
      updatedAt: serverTimestamp(),
      updatedBy: STUDENT_UID,
    })
  );
});

test("invite redemption succeeds as one atomic batch", async () => {
  const inviteId = "invite-redeem";
  const accessId = "invite-access";
  const auditId = "invite-redeem-audit";
  const entitlementId = "plan_PREMIUM";

  await seed(async (db) => {
    await setDoc(doc(db, "accessInvites", inviteId), {
      inviteCode: inviteId,
      email: STUDENT_EMAIL,
      normalizedEmail: STUDENT_EMAIL,
      inviteStatus: "pending",
      expiresAt: FUTURE_DATE,
      accessId,
    });
    await setDoc(
      doc(db, "studentAccess", accessId),
      baseAccessRecord()
    );
  });

  const db = studentDb();
  const batch = writeBatch(db);
  batch.update(doc(db, "accessInvites", inviteId), {
    inviteStatus: "used",
    usedAt: serverTimestamp(),
    redeemedByUid: STUDENT_UID,
    redeemedByEmail: STUDENT_EMAIL,
    redeemSource: "manual_invite_link",
    redeemEntitlementId: entitlementId,
    redeemAuditId: auditId,
    updatedAt: serverTimestamp(),
    updatedBy: STUDENT_UID,
  });
  batch.update(doc(db, "studentAccess", accessId), {
    uid: STUDENT_UID,
    inviteId,
    inviteRedeemedAt: serverTimestamp(),
    inviteRedeemedByUid: STUDENT_UID,
    inviteRedeemedByEmail: STUDENT_EMAIL,
    lastInviteRedeemedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: STUDENT_UID,
  });
  batch.set(
    doc(
      db,
      "studentEntitlements",
      STUDENT_UID,
      "items",
      entitlementId
    ),
    entitlementPayload({ accessId, entitlementId })
  );
  batch.set(doc(db, "accessAuditLogs", auditId), {
    action: "redeem_access_invite",
    accessId,
    email: STUDENT_EMAIL,
    uid: STUDENT_UID,
    before: { inviteStatus: "pending", accessUid: null },
    after: {
      inviteStatus: "used",
      accessUid: STUDENT_UID,
      entitlementId,
      auditId,
    },
    metadata: {
      source: "manual_invite_link",
      inviteCode: inviteId,
      inviteId,
      entitlementId,
      atomic: true,
    },
    createdAt: serverTimestamp(),
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
    actorRole: "student",
  });

  await assertSucceeds(batch.commit());
});

test("key redemption succeeds only with all coupled documents", async () => {
  const keyId = "KEY-001";
  const accessId = "key-access";
  const entitlementId = "plan_PREMIUM";
  const auditId = "key-audit";

  await seed(async (db) => {
    await setDoc(doc(db, "accessKeys", keyId), {
      code: keyId,
      normalizedCode: keyId,
      productId: null,
      campaignId: null,
      campaignName: "",
      campaignSource: "",
      course: "CTET_TET",
      planType: "PREMIUM",
      scopeType: "plan",
      module: null,
      itemType: null,
      itemId: null,
      itemTitle: "",
      itemIds: [],
      bundleId: null,
      status: "active",
      maxUses: 1,
      usedCount: 0,
      assignedEmail: STUDENT_EMAIL,
      redeemedByEmail: null,
      redeemedByUid: null,
      redeemedAt: null,
      accessFrom: null,
      accessUntil: FUTURE_DATE,
      validityDays: 0,
      notes: "",
      adminNote: "",
    });
  });

  const db = studentDb();
  const batch = writeBatch(db);
  const keyAccessPayload = baseAccessRecord({
    uid: STUDENT_UID,
    source: "redeem_key",
    accessKeyId: keyId,
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
  });

  // The production key-redemption create payload has updatedAt but does
  // not write updatedBy on the new studentAccess document.
  delete keyAccessPayload.updatedBy;

  batch.set(
    doc(db, "studentAccess", accessId),
    keyAccessPayload
  );
  batch.set(
    doc(
      db,
      "studentEntitlements",
      STUDENT_UID,
      "items",
      entitlementId
    ),
    entitlementPayload({
      accessId,
      entitlementId,
      source: "redeem_key",
    })
  );
  batch.set(doc(db, "accessAuditLogs", auditId), {
    action: "redeem_access_key",
    accessId,
    email: STUDENT_EMAIL,
    uid: STUDENT_UID,
    before: { usedCount: 0, status: "active" },
    after: {
      usedCount: 1,
      status: "used",
      entitlementId,
      accessId,
      auditId,
    },
    metadata: {
      source: "redeem_key",
      accessKeyId: keyId,
      entitlementId,
      atomic: true,
    },
    createdAt: serverTimestamp(),
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
    actorRole: "student",
  });
  batch.update(doc(db, "accessKeys", keyId), {
    usedCount: 1,
    status: "used",
    lastRedeemedByEmail: STUDENT_EMAIL,
    lastRedeemedByUid: STUDENT_UID,
    lastRedeemedAt: serverTimestamp(),
    redeemedByEmail: STUDENT_EMAIL,
    redeemedByUid: STUDENT_UID,
    redeemedAt: serverTimestamp(),
    lastRedemptionAccessId: accessId,
    lastRedemptionEntitlementId: entitlementId,
    lastRedemptionAuditId: auditId,
    updatedAt: serverTimestamp(),
    updatedBy: STUDENT_UID,
  });

  await assertSucceeds(batch.commit());
});

test("key counter update without coupled writes is denied", async () => {
  const keyId = "KEY-001";

  await seed(async (db) => {
    await setDoc(doc(db, "accessKeys", keyId), {
      code: keyId,
      normalizedCode: keyId,
      productId: null,
      course: "CTET_TET",
      planType: "PREMIUM",
      scopeType: "plan",
      module: null,
      itemType: null,
      itemId: null,
      itemIds: [],
      bundleId: null,
      status: "active",
      maxUses: 1,
      usedCount: 0,
      assignedEmail: STUDENT_EMAIL,
      redeemedByEmail: null,
      redeemedByUid: null,
      accessUntil: FUTURE_DATE,
    });
  });

  await assertFails(
    updateDoc(doc(studentDb(), "accessKeys", keyId), {
      usedCount: 1,
      status: "used",
      lastRedeemedByEmail: STUDENT_EMAIL,
      lastRedeemedByUid: STUDENT_UID,
      lastRedeemedAt: serverTimestamp(),
      redeemedByEmail: STUDENT_EMAIL,
      redeemedByUid: STUDENT_UID,
      redeemedAt: serverTimestamp(),
      lastRedemptionAccessId: "missing-access",
      lastRedemptionEntitlementId: "missing-entitlement",
      lastRedemptionAuditId: "missing-audit",
      updatedAt: serverTimestamp(),
      updatedBy: STUDENT_UID,
    })
  );
});

test("audit logs are immutable", async () => {
  await seed(async (db) => {
    await setDoc(doc(db, "accessAuditLogs", "audit-1"), {
      action: "admin_action",
      actorEmail: ADMIN_EMAIL,
      actorRole: "admin",
    });
  });

  await assertFails(
    updateDoc(doc(adminDb(), "accessAuditLogs", "audit-1"), {
      action: "changed",
    })
  );
  await assertFails(
    deleteDoc(doc(adminDb(), "accessAuditLogs", "audit-1"))
  );
});

test("student cannot write another learner entitlement", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", "access-1"),
      baseAccessRecord({ uid: OTHER_UID })
    );
  });

  await assertFails(
    setDoc(
      doc(
        studentDb(),
        "studentEntitlements",
        OTHER_UID,
        "items",
        "plan_PREMIUM"
      ),
      {
        ...entitlementPayload({ accessId: "access-1" }),
        uid: OTHER_UID,
      }
    )
  );
});

test("protected content requires active entitlement", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "protectedContentAssets", "asset-1"),
      {
        status: "published",
        requiredEntitlementId: "plan_PREMIUM",
        planType: "PREMIUM",
      }
    );
  });

  await assertFails(
    getDoc(
      doc(studentDb(), "protectedContentAssets", "asset-1")
    )
  );

  await seed(async (db) => {
    await setDoc(
      doc(
        db,
        "studentEntitlements",
        STUDENT_UID,
        "items",
        "plan_PREMIUM"
      ),
      {
        id: "plan_PREMIUM",
        uid: STUDENT_UID,
        status: "active",
      }
    );
  });

  const snapshot = await assertSucceeds(
    getDoc(
      doc(studentDb(), "protectedContentAssets", "asset-1")
    )
  );

  assert.equal(snapshot.exists(), true);
});
