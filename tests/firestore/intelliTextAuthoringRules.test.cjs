const fs = require("node:fs");
const path = require("node:path");
const {
  after,
  afterEach,
  before,
  test,
} = require("node:test");

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-phase8b5-rules";
const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const STUDENT_UID = "student-uid";
const OTHER_UID = "other-uid";
const TEXTBOOK_ID = "note_1";
let testEnv;

const emulatorAddress = () => {
  const value = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const [host, rawPort] = value.split(":");
  return { host, port: Number(rawPort) };
};

const adminDb = () =>
  testEnv.authenticatedContext("admin-uid", { email: ADMIN_EMAIL }).firestore();
const studentDb = () =>
  testEnv.authenticatedContext(STUDENT_UID, {
    email: "student@example.com",
  }).firestore();
const otherDb = () =>
  testEnv.authenticatedContext(OTHER_UID, {
    email: "other@example.com",
  }).firestore();
const anonymousDb = () => testEnv.unauthenticatedContext().firestore();

const rootPath = (textbookId = TEXTBOOK_ID) =>
  doc(studentDb(), "learningTexts", textbookId);
const sectionPath = (database, sectionId = "section_1") =>
  doc(database, "learningTexts", TEXTBOOK_ID, "sections", sectionId);
const blockPath = (database, blockId = "block_1") =>
  doc(
    database,
    "learningTexts",
    TEXTBOOK_ID,
    "sections",
    "section_1",
    "blocks",
    blockId
  );
const versionPath = (database, versionId = "v1") =>
  doc(database, "learningTexts", TEXTBOOK_ID, "authoringVersions", versionId);
const draftSectionPath = (database, sectionId = "section_1") =>
  doc(
    database,
    "learningTexts",
    TEXTBOOK_ID,
    "authoringVersions",
    "v1",
    "sections",
    sectionId
  );
const draftBlockPath = (database, blockId = "block_1") =>
  doc(
    database,
    "learningTexts",
    TEXTBOOK_ID,
    "authoringVersions",
    "v1",
    "sections",
    "section_1",
    "blocks",
    blockId
  );

const publishedRoot = (overrides = {}) => ({
  access: {
    publicRead: false,
    readEntitlementIds: ["plan_PREMIUM"],
    requiredPlanCode: "PREMIUM",
  },
  blockCount: 1,
  chapterId: "chapter_1",
  contentVersion: 1,
  deliveryMode: "NATIVE_TEXT",
  nativeReady: true,
  publicationState: "PUBLISHED",
  publishedVersionId: "v1",
  resourceType: "NOTE",
  schemaVersion: 1,
  sectionCount: 1,
  subjectId: "cdp",
  textbookId: TEXTBOOK_ID,
  title: "Native Note",
  ...overrides,
});

const activeEntitlement = (overrides = {}) => ({
  accessFrom: Timestamp.fromMillis(Date.now() - 60_000),
  accessUntil: Timestamp.fromMillis(Date.now() + 3_600_000),
  noExpiry: false,
  status: "active",
  untilManualChange: false,
  ...overrides,
});

const seed = async ({ root, entitlement, uid = STUDENT_UID } = {}) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    if (root) {
      await setDoc(doc(database, "learningTexts", TEXTBOOK_ID), root);
      await setDoc(sectionPath(database), {
        blockCount: 1,
        contentVersion: 1,
        order: 0,
        published: true,
        sectionId: "section_1",
        textbookId: TEXTBOOK_ID,
        title: "Section",
      });
      await setDoc(blockPath(database), {
        blockId: "block_1",
        contentVersion: 1,
        order: 0,
        payload: { text: "Protected content" },
        published: true,
        sectionId: "section_1",
        textbookId: TEXTBOOK_ID,
        type: "PARAGRAPH",
      });
    }
    if (entitlement) {
      await setDoc(
        doc(
          database,
          "studentEntitlements",
          uid,
          "items",
          "plan_PREMIUM"
        ),
        entitlement
      );
    }
  });
};

before(async () => {
  const { host, port } = emulatorAddress();
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port,
      rules: fs.readFileSync(
        path.join(process.cwd(), "firestore.rules"),
        "utf8"
      ),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

test("admin can create the learning text root", async () => {
  await assertSucceeds(
    setDoc(doc(adminDb(), "learningTexts", TEXTBOOK_ID), publishedRoot())
  );
});

test("admin can update the learning text root", async () => {
  const reference = doc(adminDb(), "learningTexts", TEXTBOOK_ID);
  await assertSucceeds(setDoc(reference, publishedRoot()));
  await assertSucceeds(updateDoc(reference, { title: "Updated" }));
});

test("admin can delete the learning text root", async () => {
  const reference = doc(adminDb(), "learningTexts", TEXTBOOK_ID);
  await assertSucceeds(setDoc(reference, publishedRoot()));
  await assertSucceeds(deleteDoc(reference));
});

test("admin can create and read an authoring version", async () => {
  const reference = versionPath(adminDb());
  await assertSucceeds(setDoc(reference, { versionId: "v1" }));
  await assertSucceeds(getDoc(reference));
});

test("admin can create and read a draft section", async () => {
  const reference = draftSectionPath(adminDb());
  await assertSucceeds(setDoc(reference, { sectionId: "section_1" }));
  await assertSucceeds(getDoc(reference));
});

test("admin can create and read a draft block", async () => {
  const reference = draftBlockPath(adminDb());
  await assertSucceeds(setDoc(reference, { blockId: "block_1" }));
  await assertSucceeds(getDoc(reference));
});

test("student cannot read authoring version", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(versionPath(context.firestore()), { versionId: "v1" });
  });
  await assertFails(getDoc(versionPath(studentDb())));
});

test("student cannot read draft section", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(draftSectionPath(context.firestore()), {
      sectionId: "section_1",
    });
  });
  await assertFails(getDoc(draftSectionPath(studentDb())));
});

test("student cannot read draft block", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(draftBlockPath(context.firestore()), { blockId: "block_1" });
  });
  await assertFails(getDoc(draftBlockPath(studentDb())));
});

test("anonymous user cannot read authoring version", async () => {
  await assertFails(getDoc(versionPath(anonymousDb())));
});

test("student cannot create authoring version", async () => {
  await assertFails(setDoc(versionPath(studentDb()), { versionId: "v1" }));
});

test("student cannot write published root", async () => {
  await assertFails(setDoc(rootPath(), publishedRoot()));
});

test("student cannot write published section", async () => {
  await assertFails(setDoc(sectionPath(studentDb()), { sectionId: "section_1" }));
});

test("student cannot write published block", async () => {
  await assertFails(setDoc(blockPath(studentDb()), { blockId: "block_1" }));
});

test("anonymous user can get an explicitly public published root", async () => {
  await seed({
    root: publishedRoot({
      access: {
        publicRead: true,
        readEntitlementIds: [],
        requiredPlanCode: "FREE",
      },
    }),
  });
  await assertSucceeds(
    getDoc(doc(anonymousDb(), "learningTexts", TEXTBOOK_ID))
  );
});

test("anonymous user can list public published sections", async () => {
  await seed({
    root: publishedRoot({
      access: {
        publicRead: true,
        readEntitlementIds: [],
        requiredPlanCode: "FREE",
      },
    }),
  });
  await assertSucceeds(
    getDocs(collection(anonymousDb(), "learningTexts", TEXTBOOK_ID, "sections"))
  );
});

test("anonymous user can get public published block", async () => {
  await seed({
    root: publishedRoot({
      access: {
        publicRead: true,
        readEntitlementIds: [],
        requiredPlanCode: "FREE",
      },
    }),
  });
  await assertSucceeds(getDoc(blockPath(anonymousDb())));
});

test("anonymous user cannot list learning text roots", async () => {
  await seed({
    root: publishedRoot({
      access: {
        publicRead: true,
        readEntitlementIds: [],
        requiredPlanCode: "FREE",
      },
    }),
  });
  await assertFails(getDocs(collection(anonymousDb(), "learningTexts")));
});

test("student with active entitlement can get protected root", async () => {
  await seed({ root: publishedRoot(), entitlement: activeEntitlement() });
  await assertSucceeds(getDoc(rootPath()));
});

test("student with active entitlement can list protected sections", async () => {
  await seed({ root: publishedRoot(), entitlement: activeEntitlement() });
  await assertSucceeds(
    getDocs(collection(studentDb(), "learningTexts", TEXTBOOK_ID, "sections"))
  );
});

test("student with active entitlement can get protected block", async () => {
  await seed({ root: publishedRoot(), entitlement: activeEntitlement() });
  await assertSucceeds(getDoc(blockPath(studentDb())));
});

test("student without entitlement cannot get protected root", async () => {
  await seed({ root: publishedRoot() });
  await assertFails(getDoc(rootPath()));
});

test("student without entitlement cannot list protected sections", async () => {
  await seed({ root: publishedRoot() });
  await assertFails(
    getDocs(collection(studentDb(), "learningTexts", TEXTBOOK_ID, "sections"))
  );
});

test("student without entitlement cannot get protected block", async () => {
  await seed({ root: publishedRoot() });
  await assertFails(getDoc(blockPath(studentDb())));
});

test("another user's entitlement does not authorize the student", async () => {
  await seed({
    root: publishedRoot(),
    entitlement: activeEntitlement(),
    uid: OTHER_UID,
  });
  await assertFails(getDoc(rootPath()));
});

test("expired entitlement is denied", async () => {
  await seed({
    root: publishedRoot(),
    entitlement: activeEntitlement({
      accessUntil: Timestamp.fromMillis(Date.now() - 60_000),
    }),
  });
  await assertFails(getDoc(rootPath()));
});

test("future entitlement is denied before accessFrom", async () => {
  await seed({
    root: publishedRoot(),
    entitlement: activeEntitlement({
      accessFrom: Timestamp.fromMillis(Date.now() + 3_600_000),
    }),
  });
  await assertFails(getDoc(rootPath()));
});

test("revoked entitlement is denied", async () => {
  await seed({
    root: publishedRoot(),
    entitlement: activeEntitlement({ status: "revoked" }),
  });
  await assertFails(getDoc(rootPath()));
});

test("no-expiry active entitlement is allowed", async () => {
  await seed({
    root: publishedRoot(),
    entitlement: activeEntitlement({
      accessUntil: null,
      noExpiry: true,
    }),
  });
  await assertSucceeds(getDoc(rootPath()));
});

test("until-manual-change active entitlement is allowed", async () => {
  await seed({
    root: publishedRoot(),
    entitlement: activeEntitlement({
      accessUntil: null,
      untilManualChange: true,
    }),
  });
  await assertSucceeds(getDoc(rootPath()));
});

test("draft publication root is denied to student", async () => {
  await seed({
    root: publishedRoot({ publicationState: "DRAFT" }),
    entitlement: activeEntitlement(),
  });
  await assertFails(getDoc(rootPath()));
});

test("non-native root is denied to student", async () => {
  await seed({
    root: publishedRoot({ deliveryMode: "LEGACY_PDF" }),
    entitlement: activeEntitlement(),
  });
  await assertFails(getDoc(rootPath()));
});

test("nativeReady false root is denied to student", async () => {
  await seed({
    root: publishedRoot({ nativeReady: false }),
    entitlement: activeEntitlement(),
  });
  await assertFails(getDoc(rootPath()));
});

test("mismatched textbook identity is denied", async () => {
  await seed({
    root: publishedRoot({ textbookId: "different_note" }),
    entitlement: activeEntitlement(),
  });
  await assertFails(getDoc(rootPath()));
});

test("more than six entitlement IDs is denied", async () => {
  await seed({
    root: publishedRoot({
      access: {
        publicRead: false,
        readEntitlementIds: ["a", "b", "c", "d", "e", "f", "g"],
        requiredPlanCode: "PREMIUM",
      },
    }),
    entitlement: activeEntitlement(),
  });
  await assertFails(getDoc(rootPath()));
});

test("admin can read protected published graph without student entitlement", async () => {
  await seed({ root: publishedRoot() });
  await assertSucceeds(getDoc(doc(adminDb(), "learningTexts", TEXTBOOK_ID)));
  await assertSucceeds(getDoc(blockPath(adminDb())));
});
