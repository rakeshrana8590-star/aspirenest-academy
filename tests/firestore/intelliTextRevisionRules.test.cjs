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
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-phase8b6-rules";
const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const STUDENT_UID = "student-uid";
const OTHER_UID = "other-uid";
const FLASHCARD_ID = "flashcard_1";
const SELECTION_REVISION_ID = "selection_1";
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

const flashcardRef = (database, uid = STUDENT_UID, id = FLASHCARD_ID) =>
  doc(database, "studentLearning", uid, "flashcards", id);
const revisionRef = (
  database,
  uid = STUDENT_UID,
  id = FLASHCARD_ID
) => doc(database, "studentLearning", uid, "revisionQueue", id);
const flashcardCollection = (database, uid = STUDENT_UID) =>
  collection(database, "studentLearning", uid, "flashcards");
const revisionCollection = (database, uid = STUDENT_UID) =>
  collection(database, "studentLearning", uid, "revisionQueue");

const anchor = (overrides = {}) => ({
  endOffset: 12,
  exactText: "Core concept",
  prefix: "Before ",
  startOffset: 0,
  suffix: " after",
  ...overrides,
});

const validFlashcard = (overrides = {}) => ({
  answer: "The answer",
  blockId: "block_1",
  contentVersion: 2,
  createdAt: serverTimestamp(),
  flashcardId: FLASHCARD_ID,
  noteTitle: "Learning Note",
  prompt: "What is the concept?",
  schemaVersion: 1,
  sectionId: "section_1",
  sectionTitle: "Foundation",
  selectionAnchor: anchor(),
  shareState: "PRIVATE",
  sourceId: FLASHCARD_ID,
  sourceKind: "SELECTION",
  state: "ACTIVE",
  textbookId: "note_1",
  uid: STUDENT_UID,
  updatedAt: serverTimestamp(),
  ...overrides,
});

const validRevision = (overrides = {}) => ({
  answer: "The answer",
  blockId: "block_1",
  contentVersion: 2,
  createdAt: serverTimestamp(),
  dueAt: Timestamp.fromMillis(Date.now()),
  intervalDays: 0,
  lastRating: null,
  lastReviewedAt: null,
  noteTitle: "Learning Note",
  prompt: "What is the concept?",
  recallStreak: 0,
  reviewCount: 0,
  revisionId: FLASHCARD_ID,
  schemaVersion: 1,
  sectionId: "section_1",
  sectionTitle: "Foundation",
  selectionAnchor: anchor(),
  shareState: "PRIVATE",
  sourceId: FLASHCARD_ID,
  sourceKind: "FLASHCARD",
  state: "ACTIVE",
  textbookId: "note_1",
  uid: STUDENT_UID,
  updatedAt: serverTimestamp(),
  ...overrides,
});

const validSelectionRevision = (overrides = {}) =>
  validRevision({
    revisionId: SELECTION_REVISION_ID,
    sourceId: SELECTION_REVISION_ID,
    sourceKind: "SELECTION",
    ...overrides,
  });

const createFlashcardPair = async (
  database,
  {
    flashcard = validFlashcard(),
    revision = validRevision(),
    uid = STUDENT_UID,
    id = FLASHCARD_ID,
  } = {}
) => {
  const batch = writeBatch(database);
  batch.set(flashcardRef(database, uid, id), flashcard);
  batch.set(revisionRef(database, uid, id), revision);
  return batch.commit();
};

const seedPair = async ({
  flashcard = validFlashcard(),
  revision = validRevision(),
  uid = STUDENT_UID,
  id = FLASHCARD_ID,
} = {}) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(flashcardRef(database, uid, id), {
      ...flashcard,
      createdAt: Timestamp.fromMillis(Date.now() - 1000),
      updatedAt: Timestamp.fromMillis(Date.now() - 1000),
    });
    await setDoc(revisionRef(database, uid, id), {
      ...revision,
      createdAt: Timestamp.fromMillis(Date.now() - 1000),
      updatedAt: Timestamp.fromMillis(Date.now() - 1000),
    });
  });
};

const seedSelectionRevision = async (
  revision = validSelectionRevision()
) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      revisionRef(context.firestore(), STUDENT_UID, SELECTION_REVISION_ID),
      {
        ...revision,
        createdAt: Timestamp.fromMillis(Date.now() - 1000),
        updatedAt: Timestamp.fromMillis(Date.now() - 1000),
      }
    );
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

test("owner can atomically create flashcard and paired revision", async () => {
  await assertSucceeds(createFlashcardPair(studentDb()));
});

test("flashcard create without paired revision is denied", async () => {
  await assertFails(
    setDoc(flashcardRef(studentDb()), validFlashcard())
  );
});

test("flashcard-backed revision create without paired card is denied", async () => {
  await assertFails(
    setDoc(revisionRef(studentDb()), validRevision())
  );
});

test("selection revision can be created with one write", async () => {
  await assertSucceeds(
    setDoc(
      revisionRef(studentDb(), STUDENT_UID, SELECTION_REVISION_ID),
      validSelectionRevision()
    )
  );
});

test("owner can get own flashcard", async () => {
  await seedPair();
  await assertSucceeds(getDoc(flashcardRef(studentDb())));
});

test("owner can list own flashcards", async () => {
  await seedPair();
  await assertSucceeds(getDocs(flashcardCollection(studentDb())));
});

test("owner can get own revision item", async () => {
  await seedPair();
  await assertSucceeds(getDoc(revisionRef(studentDb())));
});

test("owner can list own revision queue", async () => {
  await seedPair();
  await assertSucceeds(getDocs(revisionCollection(studentDb())));
});

test("other student cannot get flashcard", async () => {
  await seedPair();
  await assertFails(getDoc(flashcardRef(otherDb())));
});

test("other student cannot list flashcards", async () => {
  await seedPair();
  await assertFails(getDocs(flashcardCollection(otherDb())));
});

test("other student cannot get revision item", async () => {
  await seedPair();
  await assertFails(getDoc(revisionRef(otherDb())));
});

test("other student cannot list revision queue", async () => {
  await seedPair();
  await assertFails(getDocs(revisionCollection(otherDb())));
});

test("admin has no private flashcard read bypass", async () => {
  await seedPair();
  await assertFails(getDoc(flashcardRef(adminDb())));
});

test("admin has no private revision read bypass", async () => {
  await seedPair();
  await assertFails(getDoc(revisionRef(adminDb())));
});

test("anonymous user cannot read flashcard", async () => {
  await seedPair();
  await assertFails(getDoc(flashcardRef(anonymousDb())));
});

test("anonymous user cannot read revision item", async () => {
  await seedPair();
  await assertFails(getDoc(revisionRef(anonymousDb())));
});

test("student cannot create flashcard for another uid", async () => {
  const database = studentDb();
  await assertFails(
    createFlashcardPair(database, {
      flashcard: validFlashcard({ uid: OTHER_UID }),
      revision: validRevision({ uid: OTHER_UID }),
      uid: OTHER_UID,
    })
  );
});

test("student cannot create revision for another uid", async () => {
  await assertFails(
    setDoc(
      revisionRef(studentDb(), OTHER_UID, SELECTION_REVISION_ID),
      validSelectionRevision({ uid: OTHER_UID })
    )
  );
});

test("public share state is denied on flashcard", async () => {
  await assertFails(
    createFlashcardPair(studentDb(), {
      flashcard: validFlashcard({ shareState: "PUBLIC" }),
    })
  );
});

test("public share state is denied on revision item", async () => {
  await assertFails(
    setDoc(
      revisionRef(studentDb(), STUDENT_UID, SELECTION_REVISION_ID),
      validSelectionRevision({ shareState: "PUBLIC" })
    )
  );
});

test("flashcard prompt over 1000 characters is denied", async () => {
  await assertFails(
    createFlashcardPair(studentDb(), {
      flashcard: validFlashcard({ prompt: "p".repeat(1001) }),
    })
  );
});

test("flashcard answer over 3000 characters is denied", async () => {
  await assertFails(
    createFlashcardPair(studentDb(), {
      flashcard: validFlashcard({ answer: "a".repeat(3001) }),
    })
  );
});

test("selection flashcard without anchor is denied", async () => {
  await assertFails(
    createFlashcardPair(studentDb(), {
      flashcard: validFlashcard({ selectionAnchor: null }),
    })
  );
});

test("manual flashcard with null anchor is allowed", async () => {
  await assertSucceeds(
    createFlashcardPair(studentDb(), {
      flashcard: validFlashcard({
        selectionAnchor: null,
        sourceKind: "MANUAL",
      }),
      revision: validRevision({ selectionAnchor: null }),
    })
  );
});

test("selection revision without anchor is denied", async () => {
  await assertFails(
    setDoc(
      revisionRef(studentDb(), STUDENT_UID, SELECTION_REVISION_ID),
      validSelectionRevision({ selectionAnchor: null })
    )
  );
});

test("flashcard revision id mismatch is denied", async () => {
  await assertFails(
    createFlashcardPair(studentDb(), {
      revision: validRevision({ sourceId: "different_id" }),
    })
  );
});

test("revision interval above 180 days is denied", async () => {
  await assertFails(
    setDoc(
      revisionRef(studentDb(), STUDENT_UID, SELECTION_REVISION_ID),
      validSelectionRevision({ intervalDays: 181 })
    )
  );
});

test("invalid recall rating is denied", async () => {
  await assertFails(
    setDoc(
      revisionRef(studentDb(), STUDENT_UID, SELECTION_REVISION_ID),
      validSelectionRevision({ lastRating: "PERFECT" })
    )
  );
});

test("owner can update flashcard state", async () => {
  await seedPair();
  await assertSucceeds(
    updateDoc(flashcardRef(studentDb()), {
      state: "ARCHIVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can update flashcard prompt and answer", async () => {
  await seedPair();
  await assertSucceeds(
    updateDoc(flashcardRef(studentDb()), {
      answer: "Updated answer",
      prompt: "Updated prompt",
      updatedAt: serverTimestamp(),
    })
  );
});

test("flashcard identity mutation is denied", async () => {
  await seedPair();
  await assertFails(
    updateDoc(flashcardRef(studentDb()), {
      textbookId: "other_note",
      updatedAt: serverTimestamp(),
    })
  );
});

test("other student cannot update flashcard", async () => {
  await seedPair();
  await assertFails(
    updateDoc(flashcardRef(otherDb()), {
      state: "ARCHIVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can pause revision item", async () => {
  await seedPair();
  await assertSucceeds(
    updateDoc(revisionRef(studentDb()), {
      state: "PAUSED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can resume revision item", async () => {
  await seedPair({ revision: validRevision({ state: "PAUSED" }) });
  await assertSucceeds(
    updateDoc(revisionRef(studentDb()), {
      state: "ACTIVE",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can submit valid recall review schedule", async () => {
  await seedPair();
  await assertSucceeds(
    updateDoc(revisionRef(studentDb()), {
      dueAt: Timestamp.fromMillis(Date.now() + 3 * 86400000),
      intervalDays: 3,
      lastRating: "GOOD",
      lastReviewedAt: serverTimestamp(),
      recallStreak: 1,
      reviewCount: 1,
      state: "ACTIVE",
      updatedAt: serverTimestamp(),
    })
  );
});

test("review count must increase by exactly one", async () => {
  await seedPair();
  await assertFails(
    updateDoc(revisionRef(studentDb()), {
      dueAt: Timestamp.fromMillis(Date.now() + 3 * 86400000),
      intervalDays: 3,
      lastRating: "GOOD",
      lastReviewedAt: serverTimestamp(),
      recallStreak: 1,
      reviewCount: 2,
      state: "ACTIVE",
      updatedAt: serverTimestamp(),
    })
  );
});

test("review due date must be in future", async () => {
  await seedPair();
  await assertFails(
    updateDoc(revisionRef(studentDb()), {
      dueAt: Timestamp.fromMillis(Date.now() - 1000),
      intervalDays: 0,
      lastRating: "AGAIN",
      lastReviewedAt: serverTimestamp(),
      recallStreak: 0,
      reviewCount: 1,
      state: "ACTIVE",
      updatedAt: serverTimestamp(),
    })
  );
});

test("review cannot mutate prompt content", async () => {
  await seedPair();
  await assertFails(
    updateDoc(revisionRef(studentDb()), {
      dueAt: Timestamp.fromMillis(Date.now() + 3 * 86400000),
      intervalDays: 3,
      lastRating: "GOOD",
      lastReviewedAt: serverTimestamp(),
      prompt: "Tampered prompt",
      recallStreak: 1,
      reviewCount: 1,
      state: "ACTIVE",
      updatedAt: serverTimestamp(),
    })
  );
});

test("other student cannot update revision item", async () => {
  await seedPair();
  await assertFails(
    updateDoc(revisionRef(otherDb()), {
      state: "PAUSED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can atomically delete flashcard pair", async () => {
  await seedPair();
  const database = studentDb();
  const batch = writeBatch(database);
  batch.delete(flashcardRef(database));
  batch.delete(revisionRef(database));
  await assertSucceeds(batch.commit());
});

test("flashcard delete without paired queue delete is denied", async () => {
  await seedPair();
  await assertFails(deleteDoc(flashcardRef(studentDb())));
});

test("flashcard-backed queue delete without card delete is denied", async () => {
  await seedPair();
  await assertFails(deleteDoc(revisionRef(studentDb())));
});

test("selection revision can be deleted independently", async () => {
  await seedSelectionRevision();
  await assertSucceeds(
    deleteDoc(
      revisionRef(studentDb(), STUDENT_UID, SELECTION_REVISION_ID)
    )
  );
});

test("other student cannot delete selection revision", async () => {
  await seedSelectionRevision();
  await assertFails(
    deleteDoc(
      revisionRef(otherDb(), STUDENT_UID, SELECTION_REVISION_ID)
    )
  );
});

test("admin cannot delete private selection revision", async () => {
  await seedSelectionRevision();
  await assertFails(
    deleteDoc(
      revisionRef(adminDb(), STUDENT_UID, SELECTION_REVISION_ID)
    )
  );
});
