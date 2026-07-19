import {
  INTELLITEXT_MASTERY_LIMITS,
  INTELLITEXT_MASTERY_SCHEMA_VERSION,
  INTELLITEXT_MASTERY_STATES,
  INTELLITEXT_MASTERY_WEIGHTS,
  INTELLITEXT_MISTAKE_STATES,
  INTELLITEXT_MISTAKE_SOURCE_KINDS,
  IntelliTextMasteryContractError,
  buildIntelliTextMasteryId,
  buildIntelliTextMistakeId,
  createIntelliTextMasteryRecord,
  createIntelliTextMasteryUpdate,
  createIntelliTextMistakeRecord,
  createIntelliTextMistakeStateUpdate,
  hasExactMistakeSectionLink,
  resolveIntelliTextMasteryState,
} from "./intelliTextMasteryContract";

const now = new Date("2026-07-19T10:00:00.000Z");

const mapping = (overrides = {}) => ({
  blockId: "block_1",
  conceptId: "concept_1",
  conceptLabel: "Learning",
  contentVersion: 2,
  sectionId: "section_1",
  textbookId: "note_1",
  ...overrides,
});

const mistake = (overrides = {}) => ({
  attemptId: "attempt_1",
  chapter: "Chapter 1",
  createdAt: now,
  firstSeenAt: now,
  lastSeenAt: now,
  occurrenceCount: 1,
  questionId: "question_1",
  questionIndex: 0,
  resolvedAt: null,
  resultId: "result_1",
  retriedAt: null,
  retryDueAt: null,
  sourceKind: "WRONG",
  state: "OPEN",
  subject: "Pedagogy",
  testId: "test_1",
  testTitle: "Mock 1",
  uid: "student_1",
  updatedAt: now,
  ...mapping(),
  ...overrides,
});

const mastery = (overrides = {}) => ({
  calculatedAt: now,
  chapterId: "chapter_1",
  chapterLabel: "Chapter 1",
  contentVersion: 2,
  correctCount: 8,
  createdAt: now,
  mappedQuestionCount: 10,
  masteryScore: 85,
  mistakeCount: 2,
  overdueRetryCount: 0,
  practiceAccuracy: 80,
  practiceScore: 80,
  readingScore: 90,
  resolvedMistakeCount: 1,
  revisionCompleted: 8,
  revisionScore: 80,
  revisionTotal: 10,
  textbookId: "note_1",
  uid: "student_1",
  updatedAt: now,
  ...overrides,
});

test("schema version is locked", () => {
  expect(INTELLITEXT_MASTERY_SCHEMA_VERSION).toBe(1);
});

test("weights are locked to 30/40/30", () => {
  expect(INTELLITEXT_MASTERY_WEIGHTS).toEqual({
    PRACTICE: 40,
    READING: 30,
    REVISION: 30,
  });
});

test("load limits match the approved contract", () => {
  expect(INTELLITEXT_MASTERY_LIMITS.MAX_MISTAKES_PER_LOAD).toBe(150);
  expect(INTELLITEXT_MASTERY_LIMITS.MAX_MASTERY_ITEMS_PER_LOAD).toBe(100);
});

test("mistake identity is deterministic", () => {
  expect(
    buildIntelliTextMistakeId({
      resultId: "result_1",
      questionId: "question_1",
    })
  ).toBe(
    buildIntelliTextMistakeId({
      resultId: "result_1",
      questionId: "question_1",
    })
  );
});

test("different question produces different mistake id", () => {
  expect(
    buildIntelliTextMistakeId({ resultId: "result_1", questionId: "q1" })
  ).not.toBe(
    buildIntelliTextMistakeId({ resultId: "result_1", questionId: "q2" })
  );
});

test("mistake identity requires result", () => {
  expect(() =>
    buildIntelliTextMistakeId({ questionId: "q1" })
  ).toThrow("identity is incomplete");
});

test("mastery identity is deterministic", () => {
  expect(
    buildIntelliTextMasteryId({ textbookId: "note_1", chapterId: "c1" })
  ).toBe(
    buildIntelliTextMasteryId({ textbookId: "note_1", chapterId: "c1" })
  );
});

test("mastery identity changes by chapter", () => {
  expect(
    buildIntelliTextMasteryId({ textbookId: "note_1", chapterId: "c1" })
  ).not.toBe(
    buildIntelliTextMasteryId({ textbookId: "note_1", chapterId: "c2" })
  );
});

test("starting state is 0 to 24", () => {
  expect(resolveIntelliTextMasteryState({ masteryScore: 24 })).toBe(
    "STARTING"
  );
});

test("building state starts at 25", () => {
  expect(resolveIntelliTextMasteryState({ masteryScore: 25 })).toBe(
    "BUILDING"
  );
});

test("retry due starts at 50", () => {
  expect(resolveIntelliTextMasteryState({ masteryScore: 50 })).toBe(
    "RETRY_DUE"
  );
});

test("strong state starts at 70", () => {
  expect(resolveIntelliTextMasteryState({ masteryScore: 70 })).toBe(
    "STRONG"
  );
});

test("exam ready requires score 85", () => {
  expect(
    resolveIntelliTextMasteryState({
      masteryScore: 85,
      practiceAccuracy: 80,
      overdueRetryCount: 0,
    })
  ).toBe("EXAM_READY");
});

test("exam ready requires practice accuracy 80", () => {
  expect(
    resolveIntelliTextMasteryState({
      masteryScore: 90,
      practiceAccuracy: 79,
      overdueRetryCount: 0,
    })
  ).toBe("STRONG");
});

test("overdue retry prevents exam ready", () => {
  expect(
    resolveIntelliTextMasteryState({
      masteryScore: 95,
      practiceAccuracy: 95,
      overdueRetryCount: 1,
    })
  ).toBe("RETRY_DUE");
});

test("invalid score is denied", () => {
  expect(() =>
    resolveIntelliTextMasteryState({ masteryScore: 101 })
  ).toThrow();
});

test("mistake record stores mapping metadata", () => {
  const record = createIntelliTextMistakeRecord(mistake());
  expect(record.conceptId).toBe("concept_1");
  expect(record.blockId).toBe("block_1");
});

test("unmapped mistake is allowed", () => {
  const record = createIntelliTextMistakeRecord(
    mistake({
      blockId: "",
      conceptId: "",
      conceptLabel: "",
      contentVersion: 0,
      sectionId: "",
      textbookId: "",
    })
  );
  expect(record.conceptId).toBe("");
  expect(record.contentVersion).toBe(0);
});

test("mistake record contains no protected question text fields", () => {
  const record = createIntelliTextMistakeRecord(mistake());
  expect(record.question).toBeUndefined();
  expect(record.answer).toBeUndefined();
  expect(record.options).toBeUndefined();
  expect(record.explanation).toBeUndefined();
  expect(record.selectedAnswer).toBeUndefined();
});

test("mistake id defaults from result and question", () => {
  const record = createIntelliTextMistakeRecord(mistake());
  expect(record.mistakeId).toBe(
    buildIntelliTextMistakeId({
      resultId: "result_1",
      questionId: "question_1",
    })
  );
});

test("wrong source kind is accepted", () => {
  expect(createIntelliTextMistakeRecord(mistake()).sourceKind).toBe(
    INTELLITEXT_MISTAKE_SOURCE_KINDS.WRONG
  );
});

test("unanswered source kind is accepted", () => {
  expect(
    createIntelliTextMistakeRecord(mistake({ sourceKind: "UNANSWERED" }))
      .sourceKind
  ).toBe(INTELLITEXT_MISTAKE_SOURCE_KINDS.UNANSWERED);
});

test("correct is not a valid mistake source", () => {
  expect(() =>
    createIntelliTextMistakeRecord(mistake({ sourceKind: "CORRECT" }))
  ).toThrow();
});

test("question index maximum is enforced", () => {
  expect(() =>
    createIntelliTextMistakeRecord(mistake({ questionIndex: 501 }))
  ).toThrow();
});

test("occurrence count must be positive", () => {
  expect(() =>
    createIntelliTextMistakeRecord(mistake({ occurrenceCount: 0 }))
  ).toThrow();
});

test("mistake record is private", () => {
  expect(createIntelliTextMistakeRecord(mistake()).shareState).toBe(
    "PRIVATE"
  );
});

test("public mistake share state is denied", () => {
  expect(() =>
    createIntelliTextMistakeRecord(mistake({ shareState: "PUBLIC" }))
  ).toThrow();
});

test("mistake record is frozen", () => {
  expect(Object.isFrozen(createIntelliTextMistakeRecord(mistake()))).toBe(
    true
  );
});

test("resolved update requires resolvedAt", () => {
  expect(() =>
    createIntelliTextMistakeStateUpdate({
      state: "RESOLVED",
      updatedAt: now,
    })
  ).toThrow();
});

test("retried update requires retriedAt", () => {
  expect(() =>
    createIntelliTextMistakeStateUpdate({
      state: "RETRIED",
      updatedAt: now,
    })
  ).toThrow();
});

test("open update is normalized", () => {
  expect(
    createIntelliTextMistakeStateUpdate({
      state: "open",
      updatedAt: now,
    }).state
  ).toBe(INTELLITEXT_MISTAKE_STATES.OPEN);
});

test("mastery record calculates exam-ready state", () => {
  expect(createIntelliTextMasteryRecord(mastery()).state).toBe(
    INTELLITEXT_MASTERY_STATES.EXAM_READY
  );
});

test("mastery record rejects supplied state mismatch", () => {
  expect(() =>
    createIntelliTextMasteryRecord(mastery({ state: "STRONG" }))
  ).toThrow("state must match");
});

test("mastery record uses deterministic id", () => {
  expect(createIntelliTextMasteryRecord(mastery()).masteryId).toBe(
    buildIntelliTextMasteryId({
      textbookId: "note_1",
      chapterId: "chapter_1",
    })
  );
});

test("mastery record is owner keyed", () => {
  expect(createIntelliTextMasteryRecord(mastery()).uid).toBe("student_1");
});

test("mastery record is private", () => {
  expect(createIntelliTextMasteryRecord(mastery()).shareState).toBe(
    "PRIVATE"
  );
});

test("mastery record rejects score above 100", () => {
  expect(() =>
    createIntelliTextMasteryRecord(mastery({ readingScore: 101 }))
  ).toThrow();
});

test("mastery record rejects negative counts", () => {
  expect(() =>
    createIntelliTextMasteryRecord(mastery({ mistakeCount: -1 }))
  ).toThrow();
});

test("correct count cannot exceed mapped question count", () => {
  expect(() =>
    createIntelliTextMasteryRecord(
      mastery({ correctCount: 11, mappedQuestionCount: 10 })
    )
  ).toThrow("correctCount cannot exceed mappedQuestionCount");
});

test("resolved mistakes cannot exceed total mistakes", () => {
  expect(() =>
    createIntelliTextMasteryRecord(
      mastery({ mistakeCount: 1, resolvedMistakeCount: 2 })
    )
  ).toThrow("resolvedMistakeCount cannot exceed mistakeCount");
});

test("overdue retries cannot exceed total mistakes", () => {
  expect(() =>
    createIntelliTextMasteryRecord(
      mastery({ mistakeCount: 1, overdueRetryCount: 2 })
    )
  ).toThrow("overdueRetryCount cannot exceed mistakeCount");
});

test("revision completion cannot exceed revision total", () => {
  expect(() =>
    createIntelliTextMasteryRecord(
      mastery({ revisionCompleted: 6, revisionTotal: 5 })
    )
  ).toThrow("revisionCompleted cannot exceed revisionTotal");
});

test("mastery update includes only mutable aggregate fields", () => {
  const update = createIntelliTextMasteryUpdate(mastery());
  expect(update.uid).toBeUndefined();
  expect(update.masteryId).toBeUndefined();
  expect(update.masteryScore).toBe(85);
});

test("exact link detector accepts mapped mistake", () => {
  expect(hasExactMistakeSectionLink(createIntelliTextMistakeRecord(mistake())))
    .toBe(true);
});

test("exact link detector rejects unmapped mistake", () => {
  expect(
    hasExactMistakeSectionLink(
      createIntelliTextMistakeRecord(
        mistake({
          blockId: "",
          conceptId: "",
          conceptLabel: "",
          contentVersion: 0,
          sectionId: "",
          textbookId: "",
        })
      )
    )
  ).toBe(false);
});

test("contract error exposes stable class", () => {
  try {
    createIntelliTextMistakeRecord(mistake({ sourceKind: "CORRECT" }));
    throw new Error("Expected contract error");
  } catch (error) {
    expect(error).toBeInstanceOf(IntelliTextMasteryContractError);
    expect(error.name).toBe("IntelliTextMasteryContractError");
  }
});
