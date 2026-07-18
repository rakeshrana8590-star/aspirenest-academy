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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-phase8b4-rules";
const STUDENT_UID = "student-uid";
const OTHER_UID = "other-uid";
const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
let testEnv;

const emulatorAddress = () => {
  const value = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const [host, rawPort] = value.split(":");
  return { host, port: Number(rawPort) };
};

const studentDb = () =>
  testEnv.authenticatedContext(STUDENT_UID, {
    email: "student@example.com",
  }).firestore();

const otherDb = () =>
  testEnv.authenticatedContext(OTHER_UID, {
    email: "other@example.com",
  }).firestore();

const adminDb = () =>
  testEnv.authenticatedContext("admin-uid", {
    email: ADMIN_EMAIL,
  }).firestore();

const anonymousDb = () => testEnv.unauthenticatedContext().firestore();

const annotationPayload = (overrides = {}) => ({
  schemaVersion: 1,
  annotationId: "annotation_1",
  uid: STUDENT_UID,
  textbookId: "textbook_1",
  sectionId: "section_1",
  blockId: "block_1",
  contentVersion: 2,
  type: "HIGHLIGHT",
  state: "ACTIVE",
  shareState: "PRIVATE",
  selectionAnchor: {
    exactText: "selected text",
    prefix: "before ",
    suffix: " after",
    startOffset: 7,
    endOffset: 20,
  },
  body: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const bookmarkPayload = (overrides = {}) => ({
  schemaVersion: 1,
  bookmarkId: "bookmark_1",
  uid: STUDENT_UID,
  textbookId: "textbook_1",
  sectionId: "section_1",
  blockId: "block_1",
  contentVersion: 2,
  shareState: "PRIVATE",
  label: "Key section",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

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

test("owner can create and read a private annotation", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertSucceeds(setDoc(reference, annotationPayload()));
  await assertSucceeds(getDoc(reference));
});

test("anonymous user cannot read or create annotations", async () => {
  const reference = doc(
    anonymousDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, annotationPayload()));
});

test("another student cannot read list update or delete annotations", async () => {
  const ownerReference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertSucceeds(setDoc(ownerReference, annotationPayload()));

  const otherReference = doc(
    otherDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertFails(getDoc(otherReference));
  await assertFails(
    getDocs(
      collection(
        otherDb(),
        "studentLearning",
        STUDENT_UID,
        "annotations"
      )
    )
  );
  await assertFails(updateDoc(otherReference, { body: "forged" }));
  await assertFails(deleteDoc(otherReference));
});

test("admin browser context has no private annotation bypass", async () => {
  const reference = doc(
    adminDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, annotationPayload()));
});

test("forged annotation payload UID is denied", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertFails(
    setDoc(reference, annotationPayload({ uid: OTHER_UID }))
  );
});

test("non-private annotation share state is denied", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertFails(
    setDoc(reference, annotationPayload({ shareState: "SHARED" }))
  );
});

test("immutable annotation anchor update is denied", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertSucceeds(setDoc(reference, annotationPayload()));
  await assertFails(
    updateDoc(reference, {
      blockId: "block_2",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can update annotation body and state", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "annotation_1"
  );
  await assertSucceeds(setDoc(reference, annotationPayload()));
  await assertSucceeds(
    updateDoc(reference, {
      body: "Updated private text",
      state: "RESOLVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("note and doubt require a non-empty body", async () => {
  const noteReference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "note_1"
  );
  const doubtReference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "annotations",
    "doubt_1"
  );
  await assertFails(
    setDoc(
      noteReference,
      annotationPayload({ annotationId: "note_1", type: "NOTE" })
    )
  );
  await assertFails(
    setDoc(
      doubtReference,
      annotationPayload({ annotationId: "doubt_1", type: "DOUBT" })
    )
  );
});

test("owner can create read update and delete a bookmark", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "bookmarks",
    "bookmark_1"
  );
  await assertSucceeds(setDoc(reference, bookmarkPayload()));
  await assertSucceeds(getDoc(reference));
  await assertSucceeds(
    updateDoc(reference, {
      label: "Updated label",
      updatedAt: serverTimestamp(),
    })
  );
  await assertSucceeds(deleteDoc(reference));
});

test("another student cannot read or write bookmarks", async () => {
  const reference = doc(
    otherDb(),
    "studentLearning",
    STUDENT_UID,
    "bookmarks",
    "bookmark_1"
  );
  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, bookmarkPayload()));
});

test("admin browser context has no bookmark bypass", async () => {
  const reference = doc(
    adminDb(),
    "studentLearning",
    STUDENT_UID,
    "bookmarks",
    "bookmark_1"
  );
  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, bookmarkPayload()));
});

test("parent studentLearning document is not readable or writable", async () => {
  const reference = doc(studentDb(), "studentLearning", STUDENT_UID);
  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, { uid: STUDENT_UID }));
});

test("unrelated studentLearning collections remain denied", async () => {
  const reference = doc(
    studentDb(),
    "studentLearning",
    STUDENT_UID,
    "flashcards",
    "flashcard_1"
  );
  await assertFails(getDoc(reference));
  await assertFails(setDoc(reference, { uid: STUDENT_UID }));
});
