import {
  INTELLITEXT_FLASHCARD_SOURCE_KINDS,
  INTELLITEXT_FLASHCARD_STATES,
  INTELLITEXT_RECALL_RATINGS,
  INTELLITEXT_REVISION_LIMITS,
  INTELLITEXT_REVISION_SCHEMA_VERSION,
  INTELLITEXT_REVISION_SHARE_STATES,
  INTELLITEXT_REVISION_SOURCE_KINDS,
  INTELLITEXT_REVISION_STATES,
  IntelliTextRevisionContractError,
  createIntelliTextFlashcardRecord,
  createIntelliTextFlashcardUpdate,
  createIntelliTextRevisionQueueRecord,
  createIntelliTextRevisionReviewUpdate,
  createIntelliTextRevisionStateUpdate,
} from "./intelliTextRevisionContract";

const timestamp = new Date("2026-07-19T09:30:00.000Z");

const anchor = () => ({
  endOffset: 12,
  exactText: "Core concept",
  prefix: "Before ",
  startOffset: 0,
  suffix: " after",
});

const shared = () => ({
  blockId: "block_1",
  contentVersion: 2,
  createdAt: timestamp,
  noteTitle: "Learning Note",
  sectionId: "section_1",
  sectionTitle: "Foundation",
  textbookId: "note_1",
  uid: "student_1",
  updatedAt: timestamp,
});

const flashcard = (overrides = {}) => ({
  ...shared(),
  answer: "The answer",
  flashcardId: "flashcard_1",
  prompt: "What is the concept?",
  selectionAnchor: anchor(),
  sourceId: "flashcard_1",
  sourceKind: "SELECTION",
  ...overrides,
});

const revision = (overrides = {}) => ({
  ...shared(),
  answer: "The answer",
  dueAt: timestamp,
  intervalDays: 0,
  lastRating: null,
  lastReviewedAt: null,
  prompt: "What is the concept?",
  recallStreak: 0,
  reviewCount: 0,
  revisionId: "flashcard_1",
  selectionAnchor: anchor(),
  sourceId: "flashcard_1",
  sourceKind: "FLASHCARD",
  ...overrides,
});

test("revision schema version is one", () => {
  expect(INTELLITEXT_REVISION_SCHEMA_VERSION).toBe(1);
});

test("flashcard source kinds match approved contract", () => {
  expect(INTELLITEXT_FLASHCARD_SOURCE_KINDS).toEqual({
    ANNOTATION: "ANNOTATION",
    MANUAL: "MANUAL",
    SELECTION: "SELECTION",
  });
});

test("revision source kinds match approved contract", () => {
  expect(INTELLITEXT_REVISION_SOURCE_KINDS).toEqual({
    FLASHCARD: "FLASHCARD",
    SELECTION: "SELECTION",
  });
});

test("flashcard states match approved contract", () => {
  expect(INTELLITEXT_FLASHCARD_STATES).toEqual({
    ACTIVE: "ACTIVE",
    ARCHIVED: "ARCHIVED",
  });
});

test("revision states match approved contract", () => {
  expect(INTELLITEXT_REVISION_STATES).toEqual({
    ACTIVE: "ACTIVE",
    ARCHIVED: "ARCHIVED",
    MASTERED: "MASTERED",
    PAUSED: "PAUSED",
  });
});

test("recall ratings match approved contract", () => {
  expect(INTELLITEXT_RECALL_RATINGS).toEqual({
    AGAIN: "AGAIN",
    EASY: "EASY",
    GOOD: "GOOD",
    HARD: "HARD",
  });
});

test("share state is private only", () => {
  expect(INTELLITEXT_REVISION_SHARE_STATES).toEqual({
    PRIVATE: "PRIVATE",
  });
});

test("revision limits match approved boundary", () => {
  expect(INTELLITEXT_REVISION_LIMITS).toEqual({
    ANSWER: 3000,
    LABEL: 300,
    MAX_FLASHCARDS_PER_LOAD: 100,
    MAX_INTERVAL_DAYS: 180,
    MAX_REVISION_ITEMS_PER_LOAD: 100,
    PROMPT: 1000,
    SELECTION_TEXT: 2000,
  });
});

test("selection flashcard record preserves version-aware identity", () => {
  const record = createIntelliTextFlashcardRecord(flashcard());
  expect(record).toMatchObject({
    blockId: "block_1",
    contentVersion: 2,
    flashcardId: "flashcard_1",
    sectionId: "section_1",
    textbookId: "note_1",
    uid: "student_1",
  });
  expect(record.selectionAnchor.exactText).toBe("Core concept");
});

test("selection flashcard defaults to active and private", () => {
  const record = createIntelliTextFlashcardRecord(flashcard());
  expect(record.state).toBe("ACTIVE");
  expect(record.shareState).toBe("PRIVATE");
});

test("manual flashcard permits a null selection anchor", () => {
  const record = createIntelliTextFlashcardRecord(
    flashcard({
      selectionAnchor: null,
      sourceKind: "MANUAL",
    })
  );
  expect(record.selectionAnchor).toBeNull();
});

test("annotation flashcard requires source id", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ sourceId: "", sourceKind: "ANNOTATION" })
    )
  ).toThrow(
    expect.objectContaining({ code: "ANNOTATION_SOURCE_ID_REQUIRED" })
  );
});

test("selection flashcard requires selection anchor", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ selectionAnchor: null })
    )
  ).toThrow(
    expect.objectContaining({ code: "SELECTION_ANCHOR_REQUIRED" })
  );
});

test("flashcard prompt is required", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(flashcard({ prompt: "" }))
  ).toThrow(expect.objectContaining({ code: "TEXT_REQUIRED" }));
});

test("flashcard answer is required", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(flashcard({ answer: "" }))
  ).toThrow(expect.objectContaining({ code: "TEXT_REQUIRED" }));
});

test("flashcard prompt maximum is enforced", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ prompt: "p".repeat(1001) })
    )
  ).toThrow(expect.objectContaining({ code: "TEXT_TOO_LONG" }));
});

test("flashcard answer maximum is enforced", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ answer: "a".repeat(3001) })
    )
  ).toThrow(expect.objectContaining({ code: "TEXT_TOO_LONG" }));
});

test("flashcard rejects public share state", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ shareState: "PUBLIC" })
    )
  ).toThrow(expect.objectContaining({ code: "ENUM_INVALID" }));
});

test("flashcard rejects unsupported source kind", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ sourceKind: "MOCK_TEST" })
    )
  ).toThrow(expect.objectContaining({ code: "ENUM_INVALID" }));
});

test("flashcard rejects invalid content version", () => {
  expect(() =>
    createIntelliTextFlashcardRecord(
      flashcard({ contentVersion: 0 })
    )
  ).toThrow(expect.objectContaining({ code: "INTEGER_INVALID" }));
});

test("flashcard source id defaults to flashcard id", () => {
  const record = createIntelliTextFlashcardRecord(
    flashcard({ sourceId: "" })
  );
  expect(record.sourceId).toBe("flashcard_1");
});

test("flashcard record is frozen", () => {
  expect(Object.isFrozen(createIntelliTextFlashcardRecord(flashcard()))).toBe(
    true
  );
});

test("flashcard-backed revision uses deterministic identity", () => {
  const record = createIntelliTextRevisionQueueRecord(revision());
  expect(record.revisionId).toBe("flashcard_1");
  expect(record.sourceId).toBe("flashcard_1");
  expect(record.sourceKind).toBe("FLASHCARD");
});

test("flashcard-backed revision denies mismatched identity", () => {
  expect(() =>
    createIntelliTextRevisionQueueRecord(
      revision({ revisionId: "revision_2" })
    )
  ).toThrow(
    expect.objectContaining({ code: "FLASHCARD_QUEUE_IDENTITY_INVALID" })
  );
});

test("selection revision requires selection anchor", () => {
  expect(() =>
    createIntelliTextRevisionQueueRecord(
      revision({
        revisionId: "selection_1",
        selectionAnchor: null,
        sourceId: "selection_1",
        sourceKind: "SELECTION",
      })
    )
  ).toThrow(
    expect.objectContaining({ code: "SELECTION_ANCHOR_REQUIRED" })
  );
});

test("selection revision accepts version-aware anchor", () => {
  const record = createIntelliTextRevisionQueueRecord(
    revision({
      revisionId: "selection_1",
      sourceId: "selection_1",
      sourceKind: "SELECTION",
    })
  );
  expect(record.selectionAnchor.startOffset).toBe(0);
});

test("revision schedule fields default to zero", () => {
  const record = createIntelliTextRevisionQueueRecord(revision());
  expect(record.intervalDays).toBe(0);
  expect(record.reviewCount).toBe(0);
  expect(record.recallStreak).toBe(0);
  expect(record.lastRating).toBeNull();
});

test("revision interval cannot exceed 180 days", () => {
  expect(() =>
    createIntelliTextRevisionQueueRecord(
      revision({ intervalDays: 181 })
    )
  ).toThrow(expect.objectContaining({ code: "INTEGER_INVALID" }));
});

test("revision rejects invalid last rating", () => {
  expect(() =>
    createIntelliTextRevisionQueueRecord(
      revision({ lastRating: "PERFECT" })
    )
  ).toThrow(expect.objectContaining({ code: "ENUM_INVALID" }));
});

test("revision due date is required", () => {
  expect(() =>
    createIntelliTextRevisionQueueRecord(revision({ dueAt: null }))
  ).toThrow(expect.objectContaining({ code: "TIMESTAMP_REQUIRED" }));
});

test("revision record is frozen", () => {
  expect(Object.isFrozen(createIntelliTextRevisionQueueRecord(revision()))).toBe(
    true
  );
});

test("flashcard update accepts prompt answer and state", () => {
  expect(
    createIntelliTextFlashcardUpdate({
      answer: "New answer",
      prompt: "New prompt",
      state: "ARCHIVED",
      updatedAt: timestamp,
    })
  ).toEqual({
    answer: "New answer",
    prompt: "New prompt",
    state: "ARCHIVED",
    updatedAt: timestamp,
  });
});

test("flashcard update denies empty update", () => {
  expect(() =>
    createIntelliTextFlashcardUpdate({ updatedAt: timestamp })
  ).toThrow(
    expect.objectContaining({ code: "FLASHCARD_UPDATE_EMPTY" })
  );
});

test("revision state update accepts approved state", () => {
  expect(
    createIntelliTextRevisionStateUpdate({
      state: "PAUSED",
      updatedAt: timestamp,
    }).state
  ).toBe("PAUSED");
});

test("revision state update rejects unknown state", () => {
  expect(() =>
    createIntelliTextRevisionStateUpdate({
      state: "DELETED",
      updatedAt: timestamp,
    })
  ).toThrow(expect.objectContaining({ code: "ENUM_INVALID" }));
});

test("review update requires a positive review count", () => {
  expect(() =>
    createIntelliTextRevisionReviewUpdate({
      dueAt: timestamp,
      intervalDays: 1,
      lastRating: "GOOD",
      lastReviewedAt: timestamp,
      recallStreak: 1,
      reviewCount: 0,
      updatedAt: timestamp,
    })
  ).toThrow(expect.objectContaining({ code: "INTEGER_INVALID" }));
});

test("review update preserves approved schedule fields only", () => {
  const update = createIntelliTextRevisionReviewUpdate({
    dueAt: timestamp,
    intervalDays: 3,
    lastRating: "GOOD",
    lastReviewedAt: timestamp,
    recallStreak: 2,
    reviewCount: 4,
    updatedAt: timestamp,
  });
  expect(Object.keys(update).sort()).toEqual([
    "dueAt",
    "intervalDays",
    "lastRating",
    "lastReviewedAt",
    "recallStreak",
    "reviewCount",
    "state",
    "updatedAt",
  ]);
});

test("contract errors expose stable name and code", () => {
  try {
    createIntelliTextFlashcardRecord(flashcard({ prompt: "" }));
    throw new Error("Expected validation failure");
  } catch (error) {
    expect(error).toBeInstanceOf(IntelliTextRevisionContractError);
    expect(error.name).toBe("IntelliTextRevisionContractError");
    expect(error.code).toBe("TEXT_REQUIRED");
  }
});
