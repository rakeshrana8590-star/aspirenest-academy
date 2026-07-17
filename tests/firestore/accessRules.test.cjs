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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
  planCode: "PREMIUM",
  accessRank: 200,
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
  purchaseTermsSnapshot: null,
  termsSnapshot: null,
  priceVersion: null,
  validityMode: "CUSTOM_WINDOW",
  noExpiry: false,
  untilManualChange: false,
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
  ...overrides
} = {}) => ({
  id: entitlementId,
  uid: STUDENT_UID,
  email: STUDENT_EMAIL,
  normalizedEmail: STUDENT_EMAIL,
  accessId,
  planType: "PREMIUM",
  planCode: "PREMIUM",
  accessRank: 200,
  productId: null,
  purchaseTermsSnapshot: null,
  termsSnapshot: null,
  priceVersion: null,
  validityMode: "CUSTOM_WINDOW",
  noExpiry: false,
  untilManualChange: false,
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
  grantKey: null,
  grantFamilyKey: null,
  grantRevision: 0,
  updatedAt: serverTimestamp(),
  ...overrides,
});

const DYNAMIC_PRODUCT_ID = "plan_ctet_crash_45";
const DYNAMIC_PLAN_CODE = "CTET_CRASH_45";
const DYNAMIC_ACCESS_RANK = 150;
const DYNAMIC_PRICE_VERSION = 4;
const DYNAMIC_PRICE_EFFECTIVE_FROM = new Date(
  "2026-07-01T00:00:00.000Z"
);
const DYNAMIC_ACCESS_FROM = "2026-07-15";
const DYNAMIC_ACCESS_UNTIL = "2030-01-01";
const DYNAMIC_ACCESS_FROM_DATE = new Date(
  "2026-07-15T00:00:00.000Z"
);
const DYNAMIC_ACCESS_UNTIL_DATE = new Date(
  "2030-01-01T00:00:00.000Z"
);
const DYNAMIC_CAPTURED_AT = new Date(
  "2026-07-15T12:00:00.000Z"
);

const activePlanProduct = (overrides = {}) => ({
  productId: DYNAMIC_PRODUCT_ID,
  planCode: DYNAMIC_PLAN_CODE,
  planType: DYNAMIC_PLAN_CODE,
  title: "CTET Crash 45",
  name: "CTET Crash 45",
  description: "Forty-five day CTET plan",
  course: "CTET_TET",
  scopeType: "plan",
  accessRank: DYNAMIC_ACCESS_RANK,
  priceINR: 799,
  price: 799,
  compareAtPriceINR: 999,
  compareAtPrice: 999,
  currency: "INR",
  priceVersion: DYNAMIC_PRICE_VERSION,
  priceEffectiveFrom: DYNAMIC_PRICE_EFFECTIVE_FROM,
  validityMode: "ADMIN_DEFINED",
  defaultValidityDays: 30,
  validityDays: 30,
  allowNoExpiry: true,
  adminControlsValidity: true,
  fixed365DayValidity: false,
  supportsCustomWindow: true,
  supportsUntilManualChange: true,
  accessFrom: null,
  accessUntil: null,
  status: "active",
  isActive: true,
  notes: "",
  adminNote: "",
  ...overrides,
});

const dynamicPaymentProductSnapshot = (
  product = activePlanProduct(),
  capturedAt = DYNAMIC_CAPTURED_AT
) => ({
  productId: product.productId,
  planCode: product.planCode,
  planType: product.planCode,
  title: product.title,
  description: product.description,
  accessRank: product.accessRank,
  scopeType: "plan",
  priceINR: product.priceINR,
  compareAtPriceINR: product.compareAtPriceINR,
  currency: product.currency,
  priceVersion: product.priceVersion,
  priceEffectiveFrom: product.priceEffectiveFrom,
  validityMode: product.validityMode,
  defaultValidityDays: product.defaultValidityDays,
  allowNoExpiry: product.allowNoExpiry,
  fixed365DayValidity: false,
  capturedAt,
});

const dynamicPaymentPayload = (
  product = activePlanProduct(),
  overrides = {}
) => ({
  orderId: "ASP-DYNAMIC-001",
  userId: STUDENT_UID,
  upiLink: "upi://pay?pa=aspirenest@upi",
  studentEmail: STUDENT_EMAIL,
  studentMobile: "9999999999",
  studentName: "Student",
  planName: product.title,
  planType: product.planCode,
  planCode: product.planCode,
  productId: product.productId,
  accessRank: product.accessRank,
  amount: product.priceINR,
  currency: product.currency,
  priceVersion: product.priceVersion,
  priceEffectiveFrom: product.priceEffectiveFrom,
  productSnapshot: dynamicPaymentProductSnapshot(product),
  fixed365DayValidity: false,
  status: "pending_payment",
  studentProof: "",
  adminProof: "",
  matchStatus: "waiting",
  createdAt: DYNAMIC_CAPTURED_AT,
  ...overrides,
});

const dynamicPlanTermsSnapshot = (
  product = activePlanProduct(),
  overrides = {}
) => ({
  productId: product.productId,
  planCode: product.planCode,
  planType: product.planCode,
  accessRank: product.accessRank,
  priceINR: product.priceINR,
  compareAtPriceINR: product.compareAtPriceINR,
  currency: product.currency,
  priceVersion: product.priceVersion,
  priceEffectiveFrom: product.priceEffectiveFrom,
  validityMode: "CUSTOM_WINDOW",
  accessFrom: DYNAMIC_ACCESS_FROM_DATE,
  accessUntil: DYNAMIC_ACCESS_UNTIL_DATE,
  noExpiry: false,
  untilManualChange: false,
  capturedAt: DYNAMIC_CAPTURED_AT,
  ...overrides,
});

const dynamicKeyAccessPayload = ({
  keyId,
  product = activePlanProduct(),
  overrides = {},
} = {}) => {
  const purchaseTermsSnapshot =
    dynamicPlanTermsSnapshot(product);
  const payload = baseAccessRecord({
    uid: STUDENT_UID,
    planType: product.planCode,
    planCode: product.planCode,
    accessRank: product.accessRank,
    productId: product.productId,
    purchaseTermsSnapshot,
    termsSnapshot: purchaseTermsSnapshot,
    priceVersion: product.priceVersion,
    validityMode: "CUSTOM_WINDOW",
    noExpiry: false,
    untilManualChange: false,
    source: "redeem_key",
    accessKeyId: keyId,
    accessFrom: DYNAMIC_ACCESS_FROM,
    accessUntil: DYNAMIC_ACCESS_UNTIL,
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
    createdAt: DYNAMIC_CAPTURED_AT,
    updatedAt: DYNAMIC_CAPTURED_AT,
    ...overrides,
  });

  delete payload.updatedBy;
  return payload;
};

const dynamicEntitlementPayload = ({
  accessId,
  product = activePlanProduct(),
  source = "redeem_key",
  overrides = {},
} = {}) => {
  const purchaseTermsSnapshot =
    dynamicPlanTermsSnapshot(product);

  return entitlementPayload({
    accessId,
    entitlementId: `plan_${product.planCode}`,
    source,
    planType: product.planCode,
    planCode: product.planCode,
    accessRank: product.accessRank,
    productId: product.productId,
    purchaseTermsSnapshot,
    termsSnapshot: purchaseTermsSnapshot,
    priceVersion: product.priceVersion,
    validityMode: "CUSTOM_WINDOW",
    noExpiry: false,
    untilManualChange: false,
    accessFrom: DYNAMIC_ACCESS_FROM,
    accessUntil: DYNAMIC_ACCESS_UNTIL,
    ...overrides,
  });
};

const buildAtomicKeyRedemptionBatch = ({
  db,
  keyId,
  accessId,
  entitlementId,
  auditId,
  accessPayload,
  entitlement,
  metadata = {},
}) => {
  const batch = writeBatch(db);

  batch.set(doc(db, "studentAccess", accessId), accessPayload);
  batch.set(
    doc(
      db,
      "studentEntitlements",
      STUDENT_UID,
      "items",
      entitlementId
    ),
    entitlement
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
      ...metadata,
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

  return batch;
};

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

test("anonymous pricing query reads only active plan products", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", DYNAMIC_PRODUCT_ID),
      activePlanProduct()
    );
    await setDoc(
      doc(db, "accessProducts", "plan_inactive"),
      activePlanProduct({
        productId: "plan_inactive",
        planCode: "INACTIVE_PLAN",
        planType: "INACTIVE_PLAN",
        status: "inactive",
        isActive: false,
      })
    );
  });

  const catalogQuery = query(
    collection(anonymousDb(), "accessProducts"),
    where("scopeType", "==", "plan"),
    where("status", "==", "active"),
    where("isActive", "==", true)
  );
  const snapshot = await assertSucceeds(
    getDocs(catalogQuery)
  );

  assert.equal(snapshot.size, 1);
  assert.equal(snapshot.docs[0].id, DYNAMIC_PRODUCT_ID);
});

test("anonymous reader cannot fetch an inactive plan product", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", "plan_inactive"),
      activePlanProduct({
        productId: "plan_inactive",
        planCode: "INACTIVE_PLAN",
        planType: "INACTIVE_PLAN",
        status: "inactive",
        isActive: false,
      })
    );
  });

  await assertFails(
    getDoc(
      doc(anonymousDb(), "accessProducts", "plan_inactive")
    )
  );
});

test("student can create a catalog-bound dynamic payment request", async () => {
  const product = activePlanProduct();

  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", product.productId),
      product
    );
  });

  await assertSucceeds(
    setDoc(
      doc(studentDb(), "payments", "dynamic-payment"),
      dynamicPaymentPayload(product)
    )
  );
});

test("student cannot tamper with dynamic payment amount or rank", async () => {
  const product = activePlanProduct();

  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", product.productId),
      product
    );
  });

  await assertFails(
    setDoc(
      doc(studentDb(), "payments", "tampered-payment"),
      dynamicPaymentPayload(product, {
        amount: product.priceINR + 1,
        accessRank: product.accessRank + 1,
      })
    )
  );
});

test("legacy student payment without catalog snapshot fails closed", async () => {
  await assertFails(
    setDoc(doc(studentDb(), "payments", "legacy-payment"), {
      orderId: "ASP-LEGACY",
      userId: STUDENT_UID,
      upiLink: "upi://pay?pa=aspirenest@upi",
      studentEmail: STUDENT_EMAIL,
      studentMobile: "9999999999",
      studentName: "Student",
      planName: "Premium",
      amount: 1499,
      status: "pending_payment",
      studentProof: "",
      adminProof: "",
      matchStatus: "waiting",
      createdAt: DYNAMIC_CAPTURED_AT,
    })
  );
});

test("dynamic product-linked key redemption preserves catalog snapshot", async () => {
  const product = activePlanProduct();
  const keyId = "DYNAMIC-KEY-001";
  const accessId = "dynamic-key-access";
  const entitlementId = `plan_${product.planCode}`;
  const auditId = "dynamic-key-audit";

  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", product.productId),
      product
    );
    await setDoc(doc(db, "accessKeys", keyId), {
      code: keyId,
      normalizedCode: keyId,
      productId: product.productId,
      campaignId: null,
      campaignName: "",
      campaignSource: "",
      course: product.course,
      planType: product.planCode,
      planCode: product.planCode,
      accessRank: product.accessRank,
      purchaseTermsSnapshot: null,
      termsSnapshot: null,
      priceVersion: product.priceVersion,
      validityMode: "CUSTOM_WINDOW",
      noExpiry: false,
      untilManualChange: false,
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
      accessFrom: DYNAMIC_ACCESS_FROM,
      accessUntil: DYNAMIC_ACCESS_UNTIL,
      validityDays: 0,
      notes: "",
      adminNote: "",
    });
  });

  const db = studentDb();
  const batch = writeBatch(db);
  const accessPayload = dynamicKeyAccessPayload({
    keyId,
    product,
  });
  const entitlement = dynamicEntitlementPayload({
    accessId,
    product,
  });

  batch.set(doc(db, "studentAccess", accessId), accessPayload);
  batch.set(
    doc(
      db,
      "studentEntitlements",
      STUDENT_UID,
      "items",
      entitlementId
    ),
    entitlement
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
      productId: product.productId,
      planCode: product.planCode,
      accessRank: product.accessRank,
      priceVersion: product.priceVersion,
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

test("dynamic product-linked key rejects catalog rank tampering", async () => {
  const product = activePlanProduct();
  const keyId = "DYNAMIC-KEY-TAMPER";
  const accessId = "dynamic-tampered-access";
  const entitlementId = `plan_${product.planCode}`;
  const auditId = "dynamic-tampered-audit";

  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", product.productId),
      product
    );
    await setDoc(doc(db, "accessKeys", keyId), {
      code: keyId,
      normalizedCode: keyId,
      productId: product.productId,
      course: product.course,
      planType: product.planCode,
      planCode: product.planCode,
      accessRank: product.accessRank,
      priceVersion: product.priceVersion,
      validityMode: "CUSTOM_WINDOW",
      noExpiry: false,
      untilManualChange: false,
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
      accessFrom: DYNAMIC_ACCESS_FROM,
      accessUntil: DYNAMIC_ACCESS_UNTIL,
      validityDays: 0,
    });
  });

  const db = studentDb();
  const batch = writeBatch(db);
  const accessPayload = dynamicKeyAccessPayload({
    keyId,
    product,
    overrides: {
      accessRank: product.accessRank + 500,
    },
  });
  const entitlement = dynamicEntitlementPayload({
    accessId,
    product,
    overrides: {
      accessRank: product.accessRank + 500,
    },
  });

  batch.set(doc(db, "studentAccess", accessId), accessPayload);
  batch.set(
    doc(
      db,
      "studentEntitlements",
      STUDENT_UID,
      "items",
      entitlementId
    ),
    entitlement
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

  await assertFails(batch.commit());
});

test("dynamic entitlement cannot diverge from its access snapshot", async () => {
  const product = activePlanProduct();
  const accessId = "dynamic-existing-access";

  await seed(async (db) => {
    await setDoc(
      doc(db, "studentAccess", accessId),
      dynamicKeyAccessPayload({
        keyId: "DYNAMIC-SEED-KEY",
        product,
      })
    );
  });

  await assertFails(
    setDoc(
      doc(
        studentDb(),
        "studentEntitlements",
        STUDENT_UID,
        "items",
        `plan_${product.planCode}`
      ),
      dynamicEntitlementPayload({
        accessId,
        product,
        overrides: {
          priceVersion: product.priceVersion + 1,
        },
      })
    )
  );
});

test("validity-days-only product key redemption fails closed", async () => {
  const product = activePlanProduct({
    defaultValidityDays: 30,
    validityDays: 30,
    accessFrom: null,
    accessUntil: null,
  });
  const keyId = "DYNAMIC-DAYS-ONLY";
  const accessId = "dynamic-days-only-access";
  const entitlementId = `plan_${product.planCode}`;
  const auditId = "dynamic-days-only-audit";

  await seed(async (db) => {
    await setDoc(
      doc(db, "accessProducts", product.productId),
      product
    );
    await setDoc(doc(db, "accessKeys", keyId), {
      code: keyId,
      normalizedCode: keyId,
      productId: product.productId,
      course: product.course,
      planType: product.planCode,
      planCode: product.planCode,
      accessRank: product.accessRank,
      priceVersion: product.priceVersion,
      validityMode: "ADMIN_DEFINED",
      noExpiry: false,
      untilManualChange: false,
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
      accessFrom: null,
      accessUntil: null,
      validityDays: 30,
    });
  });

  const db = studentDb();
  const accessPayload = dynamicKeyAccessPayload({
    keyId,
    product,
    overrides: {
      accessFrom: "2026-07-15",
      accessUntil: "2099-01-01",
    },
  });
  const entitlement = dynamicEntitlementPayload({
    accessId,
    product,
    overrides: {
      accessFrom: "2026-07-15",
      accessUntil: "2099-01-01",
    },
  });
  const batch = buildAtomicKeyRedemptionBatch({
    db,
    keyId,
    accessId,
    entitlementId,
    auditId,
    accessPayload,
    entitlement,
  });

  await assertFails(batch.commit());
});

test("legacy module product key redemption remains supported", async () => {
  const productId = "legacy-notes-module";
  const keyId = "LEGACY-MODULE-KEY";
  const accessId = "legacy-module-access";
  const entitlementId = "module_notes";
  const auditId = "legacy-module-audit";

  await seed(async (db) => {
    await setDoc(doc(db, "accessProducts", productId), {
      title: "Notes Module",
      course: "CTET_TET",
      planType: "BASIC",
      scopeType: "module",
      module: "notes",
      status: "active",
      accessUntil: FUTURE_DATE,
    });
    await setDoc(doc(db, "accessKeys", keyId), {
      code: keyId,
      normalizedCode: keyId,
      productId,
      course: "CTET_TET",
      planType: "BASIC",
      scopeType: "module",
      module: "notes",
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
      accessFrom: null,
      accessUntil: FUTURE_DATE,
      validityDays: 0,
    });
  });

  const accessPayload = baseAccessRecord({
    uid: STUDENT_UID,
    planType: "BASIC",
    planCode: "BASIC",
    accessRank: 100,
    productId,
    purchaseTermsSnapshot: null,
    termsSnapshot: null,
    priceVersion: null,
    validityMode: "CUSTOM_WINDOW",
    noExpiry: false,
    untilManualChange: false,
    scopeType: "module",
    module: "notes",
    source: "redeem_key",
    accessKeyId: keyId,
    accessFrom: null,
    accessUntil: FUTURE_DATE,
    createdBy: STUDENT_UID,
    actorEmail: STUDENT_EMAIL,
  });
  delete accessPayload.updatedBy;

  const entitlement = entitlementPayload({
    accessId,
    entitlementId,
    source: "redeem_key",
    planType: "BASIC",
    planCode: "BASIC",
    accessRank: 100,
    productId,
    purchaseTermsSnapshot: null,
    termsSnapshot: null,
    priceVersion: null,
    validityMode: "CUSTOM_WINDOW",
    noExpiry: false,
    untilManualChange: false,
    scopeType: "module",
    module: "notes",
    accessFrom: null,
    accessUntil: FUTURE_DATE,
  });

  const db = studentDb();
  const batch = buildAtomicKeyRedemptionBatch({
    db,
    keyId,
    accessId,
    entitlementId,
    auditId,
    accessPayload,
    entitlement,
    metadata: {
      productId,
      scopeType: "module",
      planCode: "BASIC",
      accessRank: 100,
    },
  });

  await assertSucceeds(batch.commit());
});

const privateLeaderboardPayload = (
  overrides = {}
) => ({
  schemaVersion: 1,
  privateEntryId: "private-entry-1",
  publicEntryId: "public-entry-1",
  leaderboardKey: "private-entry-1",
  ownerUid: STUDENT_UID,
  ownerEmail: STUDENT_EMAIL,
  studentEmail: STUDENT_EMAIL,
  studentName: "Student Example",
  testId: "mock-1",
  testTitle: "Mock Test",
  leaderboardMode: "liveleaderboard",
  score: 42,
  totalMarks: 50,
  percentage: 84,
  accuracy: 88,
  correctCount: 42,
  wrongCount: 5,
  skippedCount: 3,
  totalQuestions: 50,
  durationSeconds: 1200,
  rankScore: 84,
  rankTieBreakerScore: 42,
  attemptId: "attempt-1",
  source: "authenticated_callable",
  createdAt: new Date(
    "2026-07-17T00:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-07-17T00:00:00.000Z"
  ),
  ...overrides,
});

const publicLeaderboardPayload = (
  overrides = {}
) => ({
  schemaVersion: 1,
  projectionVersion: 1,
  publicEntryId: "public-entry-1",
  displayName: "Student E.",
  testId: "mock-1",
  testTitle: "Mock Test",
  leaderboardMode: "liveleaderboard",
  subject: "CDP",
  chapter: "Learning",
  planType: "FREE",
  examType: "CTET",
  testType: "Full",
  score: 42,
  totalMarks: 50,
  percentage: 84,
  accuracy: 88,
  correctCount: 42,
  wrongCount: 5,
  skippedCount: 3,
  totalQuestions: 50,
  durationSeconds: 1200,
  rankScore: 84,
  rankTieBreakerScore: 42,
  source: "authenticated_callable",
  createdAt: new Date(
    "2026-07-17T00:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-07-17T00:00:00.000Z"
  ),
  ...overrides,
});

test("anonymous users can read only the public-safe leaderboard projection", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(
        db,
        "mockLeaderboard",
        "private-entry-1"
      ),
      privateLeaderboardPayload()
    );
    await setDoc(
      doc(
        db,
        "mockLeaderboardPublic",
        "public-entry-1"
      ),
      publicLeaderboardPayload()
    );
  });

  await assertSucceeds(
    getDoc(
      doc(
        anonymousDb(),
        "mockLeaderboardPublic",
        "public-entry-1"
      )
    )
  );
  await assertSucceeds(
    getDocs(
      collection(
        anonymousDb(),
        "mockLeaderboardPublic"
      )
    )
  );
  await assertFails(
    getDoc(
      doc(
        anonymousDb(),
        "mockLeaderboard",
        "private-entry-1"
      )
    )
  );
  await assertFails(
    getDocs(
      collection(
        anonymousDb(),
        "mockLeaderboard"
      )
    )
  );
});

test("student can read only their own private leaderboard record", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(
        db,
        "mockLeaderboard",
        "private-entry-1"
      ),
      privateLeaderboardPayload()
    );
    await setDoc(
      doc(
        db,
        "mockLeaderboard",
        "private-entry-2"
      ),
      privateLeaderboardPayload({
        privateEntryId:
          "private-entry-2",
        publicEntryId:
          "public-entry-2",
        leaderboardKey:
          "private-entry-2",
        ownerUid: OTHER_UID,
        ownerEmail: OTHER_EMAIL,
        studentEmail: OTHER_EMAIL,
        attemptId: "attempt-2",
      })
    );
  });

  await assertSucceeds(
    getDoc(
      doc(
        studentDb(),
        "mockLeaderboard",
        "private-entry-1"
      )
    )
  );
  await assertFails(
    getDoc(
      doc(
        studentDb(),
        "mockLeaderboard",
        "private-entry-2"
      )
    )
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(
          studentDb(),
          "mockLeaderboard"
        ),
        where(
          "ownerUid",
          "==",
          STUDENT_UID
        )
      )
    )
  );
  await assertFails(
    getDocs(
      collection(
        studentDb(),
        "mockLeaderboard"
      )
    )
  );
});

test("admin can read private leaderboard records", async () => {
  await seed(async (db) => {
    await setDoc(
      doc(
        db,
        "mockLeaderboard",
        "private-entry-1"
      ),
      privateLeaderboardPayload()
    );
  });

  await assertSucceeds(
    getDoc(
      doc(
        adminDb(),
        "mockLeaderboard",
        "private-entry-1"
      )
    )
  );
  await assertSucceeds(
    getDocs(
      collection(
        adminDb(),
        "mockLeaderboard"
      )
    )
  );
});

test("browser clients cannot write private or public leaderboard collections", async () => {
  const privateRef = doc(
    studentDb(),
    "mockLeaderboard",
    "private-entry-1"
  );
  const publicRef = doc(
    studentDb(),
    "mockLeaderboardPublic",
    "public-entry-1"
  );

  await assertFails(
    setDoc(
      privateRef,
      privateLeaderboardPayload()
    )
  );
  await assertFails(
    setDoc(
      publicRef,
      publicLeaderboardPayload()
    )
  );

  await seed(async (db) => {
    await setDoc(
      doc(
        db,
        "mockLeaderboard",
        "private-entry-1"
      ),
      privateLeaderboardPayload()
    );
    await setDoc(
      doc(
        db,
        "mockLeaderboardPublic",
        "public-entry-1"
      ),
      publicLeaderboardPayload()
    );
  });

  await assertFails(
    updateDoc(
      privateRef,
      { score: 50 }
    )
  );
  await assertFails(
    updateDoc(
      publicRef,
      { score: 50 }
    )
  );
  await assertFails(
    deleteDoc(privateRef)
  );
  await assertFails(
    deleteDoc(publicRef)
  );

  await assertFails(
    setDoc(
      doc(
        adminDb(),
        "mockLeaderboardPublic",
        "admin-public-write"
      ),
      publicLeaderboardPayload({
        publicEntryId:
          "admin-public-write",
      })
    )
  );
});
