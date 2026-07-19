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
} = require("firebase/firestore");

const PROJECT_ID = "aspirenest-phase8b7-rules";
const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const STUDENT_UID = "student-uid";
const OTHER_UID = "other-uid";
const MISTAKE_ID = "mistake_1";
const MASTERY_ID = "mastery_1";
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

const mistakeRef = (database, uid = STUDENT_UID, id = MISTAKE_ID) =>
  doc(database, "studentLearning", uid, "mistakeBook", id);
const masteryRef = (database, uid = STUDENT_UID, id = MASTERY_ID) =>
  doc(database, "studentLearning", uid, "masteryProgress", id);
const mistakeCollection = (database, uid = STUDENT_UID) =>
  collection(database, "studentLearning", uid, "mistakeBook");
const masteryCollection = (database, uid = STUDENT_UID) =>
  collection(database, "studentLearning", uid, "masteryProgress");
const studentLearningRef = (database, uid = STUDENT_UID) =>
  doc(database, "studentLearning", uid);

const futureTimestamp = () =>
  Timestamp.fromMillis(Date.now() + 2 * 86400000);
const seededTimestamp = () =>
  Timestamp.fromMillis(Date.now() - 5000);

const validMistake = (overrides = {}) => ({
  attemptId: "attempt_1",
  blockId: "block_1",
  chapter: "Learning",
  conceptId: "concept_1",
  conceptLabel: "Learning",
  contentVersion: 2,
  createdAt: serverTimestamp(),
  firstSeenAt: serverTimestamp(),
  lastSeenAt: serverTimestamp(),
  mistakeId: MISTAKE_ID,
  occurrenceCount: 1,
  questionId: "question_1",
  questionIndex: 0,
  resolvedAt: null,
  resultId: "result_1",
  retriedAt: null,
  retryDueAt: futureTimestamp(),
  schemaVersion: 1,
  sectionId: "section_1",
  shareState: "PRIVATE",
  sourceKind: "WRONG",
  state: "OPEN",
  subject: "Pedagogy",
  testId: "test_1",
  testTitle: "Mock 1",
  textbookId: "note_1",
  uid: STUDENT_UID,
  updatedAt: serverTimestamp(),
  ...overrides,
});

const validUnmappedMistake = (overrides = {}) =>
  validMistake({
    blockId: "",
    conceptId: "",
    conceptLabel: "",
    contentVersion: 0,
    sectionId: "",
    textbookId: "",
    ...overrides,
  });

const validMastery = (overrides = {}) => ({
  calculatedAt: serverTimestamp(),
  chapterId: "learning",
  chapterLabel: "Learning",
  contentVersion: 2,
  correctCount: 8,
  createdAt: serverTimestamp(),
  mappedQuestionCount: 10,
  masteryId: MASTERY_ID,
  masteryScore: 85,
  mistakeCount: 2,
  overdueRetryCount: 0,
  practiceAccuracy: 80,
  practiceScore: 80,
  readingScore: 90,
  resolvedMistakeCount: 1,
  revisionCompleted: 4,
  revisionScore: 80,
  revisionTotal: 5,
  schemaVersion: 1,
  shareState: "PRIVATE",
  state: "EXAM_READY",
  textbookId: "note_1",
  uid: STUDENT_UID,
  updatedAt: serverTimestamp(),
  ...overrides,
});

const seedMistake = async (overrides = {}) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const time = seededTimestamp();
    await setDoc(
      mistakeRef(context.firestore()),
      validMistake({
        createdAt: time,
        firstSeenAt: time,
        lastSeenAt: time,
        updatedAt: time,
        ...overrides,
      })
    );
  });
};

const seedMastery = async (overrides = {}) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const time = seededTimestamp();
    await setDoc(
      masteryRef(context.firestore()),
      validMastery({
        calculatedAt: time,
        createdAt: time,
        updatedAt: time,
        ...overrides,
      })
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

// Mistake Book owner isolation and read surface.
test("owner can create mapped private mistake", async () => {
  await assertSucceeds(setDoc(mistakeRef(studentDb()), validMistake()));
});

test("owner can create unmapped private mistake", async () => {
  await assertSucceeds(
    setDoc(mistakeRef(studentDb()), validUnmappedMistake())
  );
});

test("owner can create unanswered mistake", async () => {
  await assertSucceeds(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ sourceKind: "UNANSWERED" })
    )
  );
});

test("owner can get own mistake", async () => {
  await seedMistake();
  await assertSucceeds(getDoc(mistakeRef(studentDb())));
});

test("owner can list own mistake book", async () => {
  await seedMistake();
  await assertSucceeds(getDocs(mistakeCollection(studentDb())));
});

test("other student cannot get mistake", async () => {
  await seedMistake();
  await assertFails(getDoc(mistakeRef(otherDb())));
});

test("other student cannot list mistake book", async () => {
  await seedMistake();
  await assertFails(getDocs(mistakeCollection(otherDb())));
});

test("admin has no private mistake read bypass", async () => {
  await seedMistake();
  await assertFails(getDoc(mistakeRef(adminDb())));
});

test("anonymous user cannot read mistake", async () => {
  await seedMistake();
  await assertFails(getDoc(mistakeRef(anonymousDb())));
});

test("student cannot create mistake under another uid", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb(), OTHER_UID),
      validMistake({ uid: OTHER_UID })
    )
  );
});

// Mistake Book schema, privacy, mapping, and immutable payload.
test("mistake document id mismatch is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ mistakeId: "different_id" })
    )
  );
});

test("public mistake share state is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ shareState: "PUBLIC" })
    )
  );
});

test("correct source kind is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ sourceKind: "CORRECT" })
    )
  );
});

test("mistake create must begin open", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ state: "RETRY_DUE" })
    )
  );
});

test("repeated mistake occurrence metadata is allowed", async () => {
  await assertSucceeds(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({
        firstSeenAt: Timestamp.fromMillis(Date.now() - 86400000),
        occurrenceCount: 2,
      })
    )
  );
});

test("mistake occurrence count below one is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ occurrenceCount: 0 })
    )
  );
});

test("mistake create requires future retry date", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ retryDueAt: Timestamp.fromMillis(Date.now() - 1000) })
    )
  );
});

test("partial question concept mapping is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validUnmappedMistake({ conceptId: "concept_1" })
    )
  );
});

test("concept label above 180 characters is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ conceptLabel: "c".repeat(181) })
    )
  );
});

test("content version zero with mapped identity is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ contentVersion: 0 })
    )
  );
});

test("question index above 500 is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ questionIndex: 501 })
    )
  );
});

test("protected question text field is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ question: "Protected question" })
    )
  );
});

test("protected correct answer field is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ correctAnswer: "A" })
    )
  );
});

test("protected explanation field is denied", async () => {
  await assertFails(
    setDoc(
      mistakeRef(studentDb()),
      validMistake({ explanation: "Protected explanation" })
    )
  );
});

// Mistake Book state transitions and immutable identity.
test("owner can mark mistake retry due", async () => {
  await seedMistake();
  await assertSucceeds(
    updateDoc(mistakeRef(studentDb()), {
      state: "RETRY_DUE",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can mark mistake retried", async () => {
  await seedMistake();
  await assertSucceeds(
    updateDoc(mistakeRef(studentDb()), {
      retriedAt: serverTimestamp(),
      state: "RETRIED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can mark mistake resolved", async () => {
  await seedMistake();
  await assertSucceeds(
    updateDoc(mistakeRef(studentDb()), {
      resolvedAt: serverTimestamp(),
      state: "RESOLVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("owner can archive mistake", async () => {
  await seedMistake();
  await assertSucceeds(
    updateDoc(mistakeRef(studentDb()), {
      state: "ARCHIVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("resolved mistake cannot transition directly to retried", async () => {
  await seedMistake({
    resolvedAt: seededTimestamp(),
    state: "RESOLVED",
  });
  await assertFails(
    updateDoc(mistakeRef(studentDb()), {
      retriedAt: serverTimestamp(),
      resolvedAt: null,
      state: "RETRIED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("retried state requires server retried timestamp", async () => {
  await seedMistake();
  await assertFails(
    updateDoc(mistakeRef(studentDb()), {
      retriedAt: Timestamp.fromMillis(Date.now() - 1000),
      state: "RETRIED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("resolved state requires server resolved timestamp", async () => {
  await seedMistake();
  await assertFails(
    updateDoc(mistakeRef(studentDb()), {
      resolvedAt: Timestamp.fromMillis(Date.now() - 1000),
      state: "RESOLVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("mistake identity mutation is denied", async () => {
  await seedMistake();
  await assertFails(
    updateDoc(mistakeRef(studentDb()), {
      questionId: "other_question",
      updatedAt: serverTimestamp(),
    })
  );
});

test("mistake occurrence mutation is denied", async () => {
  await seedMistake();
  await assertFails(
    updateDoc(mistakeRef(studentDb()), {
      occurrenceCount: 2,
      updatedAt: serverTimestamp(),
    })
  );
});

test("other student cannot update mistake", async () => {
  await seedMistake();
  await assertFails(
    updateDoc(mistakeRef(otherDb()), {
      state: "ARCHIVED",
      updatedAt: serverTimestamp(),
    })
  );
});

test("mistake delete is denied", async () => {
  await seedMistake();
  await assertFails(deleteDoc(mistakeRef(studentDb())));
});

// Mastery owner isolation and read surface.
test("owner can create exam-ready mastery", async () => {
  await assertSucceeds(setDoc(masteryRef(studentDb()), validMastery()));
});

test("owner can create strong mastery below accuracy threshold", async () => {
  await assertSucceeds(
    setDoc(
      masteryRef(studentDb()),
      validMastery({
        masteryScore: 85,
        practiceAccuracy: 79,
        state: "STRONG",
      })
    )
  );
});

test("owner can create retry-due mastery with overdue mistake", async () => {
  await assertSucceeds(
    setDoc(
      masteryRef(studentDb()),
      validMastery({
        masteryScore: 90,
        overdueRetryCount: 1,
        state: "RETRY_DUE",
      })
    )
  );
});

test("owner can get own mastery", async () => {
  await seedMastery();
  await assertSucceeds(getDoc(masteryRef(studentDb())));
});

test("owner can list own mastery", async () => {
  await seedMastery();
  await assertSucceeds(getDocs(masteryCollection(studentDb())));
});

test("other student cannot get mastery", async () => {
  await seedMastery();
  await assertFails(getDoc(masteryRef(otherDb())));
});

test("other student cannot list mastery", async () => {
  await seedMastery();
  await assertFails(getDocs(masteryCollection(otherDb())));
});

test("admin has no private mastery read bypass", async () => {
  await seedMastery();
  await assertFails(getDoc(masteryRef(adminDb())));
});

test("anonymous user cannot read mastery", async () => {
  await seedMastery();
  await assertFails(getDoc(masteryRef(anonymousDb())));
});

test("student cannot create mastery under another uid", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb(), OTHER_UID),
      validMastery({ uid: OTHER_UID })
    )
  );
});

// Mastery schema and thresholds.
test("mastery document id mismatch is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ masteryId: "different_id" })
    )
  );
});

test("public mastery share state is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ shareState: "PUBLIC" })
    )
  );
});

test("exam ready below score 85 is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ masteryScore: 84, state: "EXAM_READY" })
    )
  );
});

test("exam ready below practice accuracy 80 is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ practiceAccuracy: 79, state: "EXAM_READY" })
    )
  );
});

test("exam ready with overdue retry is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ overdueRetryCount: 1, state: "EXAM_READY" })
    )
  );
});

test("mastery score above 100 is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ masteryScore: 101 })
    )
  );
});

test("correct count above mapped count is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ correctCount: 11 })
    )
  );
});

test("resolved mistakes above mistake count is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ resolvedMistakeCount: 3 })
    )
  );
});

test("overdue retries above mistake count is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ overdueRetryCount: 3, state: "RETRY_DUE" })
    )
  );
});

test("revision completed above total is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ revisionCompleted: 6 })
    )
  );
});

test("mastery content version zero is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ contentVersion: 0 })
    )
  );
});

test("unexpected mastery field is denied", async () => {
  await assertFails(
    setDoc(
      masteryRef(studentDb()),
      validMastery({ protectedAnswer: "A" })
    )
  );
});

// Mastery mutable aggregate boundary.
test("owner can update mastery aggregate", async () => {
  await seedMastery();
  await assertSucceeds(
    updateDoc(masteryRef(studentDb()), {
      calculatedAt: serverTimestamp(),
      masteryScore: 80,
      practiceAccuracy: 80,
      practiceScore: 75,
      state: "STRONG",
      updatedAt: serverTimestamp(),
    })
  );
});

test("mastery identity mutation is denied", async () => {
  await seedMastery();
  await assertFails(
    updateDoc(masteryRef(studentDb()), {
      textbookId: "other_note",
      updatedAt: serverTimestamp(),
    })
  );
});

test("mastery created timestamp mutation is denied", async () => {
  await seedMastery();
  await assertFails(
    updateDoc(masteryRef(studentDb()), {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
});

test("mastery update must use matching state threshold", async () => {
  await seedMastery();
  await assertFails(
    updateDoc(masteryRef(studentDb()), {
      calculatedAt: serverTimestamp(),
      masteryScore: 80,
      state: "EXAM_READY",
      updatedAt: serverTimestamp(),
    })
  );
});

test("other student cannot update mastery", async () => {
  await seedMastery();
  await assertFails(
    updateDoc(masteryRef(otherDb()), {
      calculatedAt: serverTimestamp(),
      masteryScore: 80,
      state: "STRONG",
      updatedAt: serverTimestamp(),
    })
  );
});

test("mastery delete is denied", async () => {
  await seedMastery();
  await assertFails(deleteDoc(masteryRef(studentDb())));
});

// Parent studentLearning path stays closed.
test("student learning parent get is denied", async () => {
  await assertFails(getDoc(studentLearningRef(studentDb())));
});

test("student learning parent create is denied", async () => {
  await assertFails(
    setDoc(studentLearningRef(studentDb()), {
      uid: STUDENT_UID,
    })
  );
});
