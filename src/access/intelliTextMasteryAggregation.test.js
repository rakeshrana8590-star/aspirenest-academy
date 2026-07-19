import {
  buildChapterMasterySnapshot,
  buildEvaluatedQuestionId,
  buildMistakesFromEvaluatedQuestions,
  calculateIntelliTextPracticeSnapshot,
  calculateIntelliTextReadingScore,
  calculateIntelliTextRevisionSnapshot,
  calculateWeightedMasteryScore,
  createEvaluatedMockQuestion,
  deriveWeakConcepts,
  groupMappedQuestionsByChapter,
} from "./intelliTextMasteryAggregation";

const now = new Date("2026-07-19T10:00:00.000Z");

const mappedQuestion = (overrides = {}) => ({
  answered: true,
  blockId: "block_1",
  conceptId: "concept_1",
  conceptLabel: "Learning",
  contentVersion: 2,
  correct: false,
  questionId: "question_1",
  questionIndex: 0,
  sectionId: "section_1",
  textbookId: "note_1",
  ...overrides,
});

const testData = {
  chapter: "Learning Theory",
  id: "test_1",
  subject: "Pedagogy",
  title: "Mock 1",
};

test("question id uses explicit questionId", () => {
  expect(buildEvaluatedQuestionId({ questionId: "q_1" }, 0)).toBe("q_1");
});

test("question id falls back to index", () => {
  expect(buildEvaluatedQuestionId({}, 2)).toBe("question_3");
});

test("question id sanitizes unsafe source", () => {
  expect(buildEvaluatedQuestionId({ id: "Question 1 / A" }, 0)).toBe(
    "question_1_a"
  );
});

test("evaluated question preserves complete mapping", () => {
  const item = createEvaluatedMockQuestion({
    answered: true,
    correct: false,
    question: mappedQuestion(),
    questionIndex: 0,
  });
  expect(item.conceptId).toBe("concept_1");
  expect(item.contentVersion).toBe(2);
});

test("evaluated question coerces flags", () => {
  const item = createEvaluatedMockQuestion({
    answered: 1,
    correct: 0,
    question: {},
  });
  expect(item.answered).toBe(true);
  expect(item.correct).toBe(false);
});

test("correct questions do not create mistakes", () => {
  expect(
    buildMistakesFromEvaluatedQuestions({
      attemptId: "attempt_1",
      evaluatedQuestions: [mappedQuestion({ correct: true })],
      now,
      resultId: "result_1",
      test: testData,
      uid: "student_1",
    })
  ).toHaveLength(0);
});

test("wrong question creates WRONG mistake", () => {
  const [item] = buildMistakesFromEvaluatedQuestions({
    attemptId: "attempt_1",
    evaluatedQuestions: [mappedQuestion()],
    now,
    resultId: "result_1",
    test: testData,
    uid: "student_1",
  });
  expect(item.sourceKind).toBe("WRONG");
});

test("unanswered question creates UNANSWERED mistake", () => {
  const [item] = buildMistakesFromEvaluatedQuestions({
    attemptId: "attempt_1",
    evaluatedQuestions: [mappedQuestion({ answered: false })],
    now,
    resultId: "result_1",
    test: testData,
    uid: "student_1",
  });
  expect(item.sourceKind).toBe("UNANSWERED");
});

test("unanswered retry is due before wrong retry", () => {
  const [wrong, skipped] = buildMistakesFromEvaluatedQuestions({
    attemptId: "attempt_1",
    evaluatedQuestions: [
      mappedQuestion({ questionId: "wrong" }),
      mappedQuestion({ answered: false, questionId: "skip", questionIndex: 1 }),
    ],
    now,
    resultId: "result_1",
    test: testData,
    uid: "student_1",
  });
  expect(skipped.retryDueAt.getTime()).toBeLessThan(wrong.retryDueAt.getTime());
});

test("unmapped wrong question creates private entry without exact link", () => {
  const [item] = buildMistakesFromEvaluatedQuestions({
    attemptId: "attempt_1",
    evaluatedQuestions: [
      mappedQuestion({
        blockId: "",
        conceptId: "",
        conceptLabel: "",
        contentVersion: 0,
        sectionId: "",
        textbookId: "",
      }),
    ],
    now,
    resultId: "result_1",
    test: testData,
    uid: "student_1",
  });
  expect(item.conceptId).toBe("");
  expect(item.textbookId).toBe("");
});

test("mistake aggregation requires explicit date", () => {
  expect(() =>
    buildMistakesFromEvaluatedQuestions({
      attemptId: "attempt_1",
      evaluatedQuestions: [mappedQuestion()],
      resultId: "result_1",
      test: testData,
      uid: "student_1",
    })
  ).toThrow("explicit valid Date");
});

test("weak concepts ignores unmapped mistakes", () => {
  expect(
    deriveWeakConcepts({
      mistakes: [{ conceptId: "", state: "OPEN" }],
      now,
    })
  ).toHaveLength(0);
});

test("weak concepts groups by concept id", () => {
  const result = deriveWeakConcepts({
    mistakes: [
      {
        conceptId: "concept_1",
        conceptLabel: "Learning",
        retryDueAt: now,
        state: "OPEN",
      },
      {
        conceptId: "concept_1",
        conceptLabel: "Learning",
        retryDueAt: now,
        state: "RETRY_DUE",
      },
    ],
    now,
  });
  expect(result).toHaveLength(1);
  expect(result[0].mistakeCount).toBe(2);
});

test("weak concepts counts overdue retries", () => {
  const result = deriveWeakConcepts({
    mistakes: [
      {
        conceptId: "concept_1",
        conceptLabel: "Learning",
        retryDueAt: new Date(now.getTime() - 1),
        state: "OPEN",
      },
    ],
    now,
  });
  expect(result[0].overdueCount).toBe(1);
});

test("weak concepts ignores resolved mistakes", () => {
  expect(
    deriveWeakConcepts({
      mistakes: [
        {
          conceptId: "concept_1",
          state: "RESOLVED",
        },
      ],
      now,
    })
  ).toHaveLength(0);
});

test("weak concepts sorts overdue first", () => {
  const result = deriveWeakConcepts({
    mistakes: [
      {
        conceptId: "later",
        conceptLabel: "Later",
        retryDueAt: new Date(now.getTime() + 1000),
        state: "OPEN",
      },
      {
        conceptId: "due",
        conceptLabel: "Due",
        retryDueAt: new Date(now.getTime() - 1000),
        state: "OPEN",
      },
    ],
    now,
  });
  expect(result[0].conceptId).toBe("due");
});

test("reading score uses progress percent", () => {
  expect(calculateIntelliTextReadingScore({ progressPercent: 64 })).toBe(64);
});

test("reading score clamps above 100", () => {
  expect(calculateIntelliTextReadingScore({ progressPercent: 140 })).toBe(100);
});

test("reading score defaults to zero", () => {
  expect(calculateIntelliTextReadingScore()).toBe(0);
});

test("revision snapshot counts mastered and archived", () => {
  expect(
    calculateIntelliTextRevisionSnapshot([
      { state: "MASTERED" },
      { state: "ARCHIVED" },
      { state: "ACTIVE" },
    ])
  ).toEqual({ completed: 2, score: 67, total: 3 });
});

test("empty revision snapshot is zero", () => {
  expect(calculateIntelliTextRevisionSnapshot([])).toEqual({
    completed: 0,
    score: 0,
    total: 0,
  });
});

test("practice snapshot uses mapped questions only", () => {
  const result = calculateIntelliTextPracticeSnapshot({
    evaluatedQuestions: [
      mappedQuestion({ correct: true }),
      mappedQuestion({
        conceptId: "",
        conceptLabel: "",
        textbookId: "",
        sectionId: "",
        blockId: "",
        contentVersion: 0,
      }),
    ],
  });
  expect(result.mappedQuestionCount).toBe(1);
  expect(result.correctCount).toBe(1);
});

test("practice accuracy is correct ratio", () => {
  const result = calculateIntelliTextPracticeSnapshot({
    evaluatedQuestions: [
      mappedQuestion({ correct: true }),
      mappedQuestion({ questionId: "q2", questionIndex: 1 }),
    ],
  });
  expect(result.practiceAccuracy).toBe(50);
});

test("resolved mistakes improve practice score", () => {
  const open = calculateIntelliTextPracticeSnapshot({
    evaluatedQuestions: [mappedQuestion()],
    mistakes: [{ conceptId: "concept_1", state: "OPEN" }],
  });
  const resolved = calculateIntelliTextPracticeSnapshot({
    evaluatedQuestions: [mappedQuestion()],
    mistakes: [{ conceptId: "concept_1", state: "RESOLVED" }],
  });
  expect(resolved.practiceScore).toBeGreaterThan(open.practiceScore);
});

test("weighted score uses 30 40 30", () => {
  expect(
    calculateWeightedMasteryScore({
      readingScore: 100,
      practiceScore: 50,
      revisionScore: 0,
    })
  ).toBe(50);
});

test("weighted score clamps inputs", () => {
  expect(
    calculateWeightedMasteryScore({
      readingScore: 200,
      practiceScore: 200,
      revisionScore: 200,
    })
  ).toBe(100);
});

test("chapter snapshot combines reading practice revision", () => {
  const result = buildChapterMasterySnapshot({
    chapterId: "chapter_1",
    chapterLabel: "Learning",
    contentVersion: 2,
    evaluatedQuestions: [mappedQuestion({ correct: true })],
    mistakes: [],
    now,
    readingProgress: { progressPercent: 100 },
    revisionItems: [{ state: "MASTERED" }],
    textbookId: "note_1",
    uid: "student_1",
  });
  expect(result.masteryScore).toBe(100);
  expect(result.state).toBe("EXAM_READY");
});

test("overdue mistake blocks exam ready in snapshot", () => {
  const result = buildChapterMasterySnapshot({
    chapterId: "chapter_1",
    chapterLabel: "Learning",
    contentVersion: 2,
    evaluatedQuestions: [mappedQuestion({ correct: true })],
    mistakes: [
      {
        conceptId: "concept_1",
        retryDueAt: new Date(now.getTime() - 1000),
        state: "OPEN",
      },
    ],
    now,
    readingProgress: { progressPercent: 100 },
    revisionItems: [{ state: "MASTERED" }],
    textbookId: "note_1",
    uid: "student_1",
  });
  expect(result.overdueRetryCount).toBe(1);
  expect(result.state).toBe("RETRY_DUE");
});

test("chapter snapshot requires explicit date", () => {
  expect(() =>
    buildChapterMasterySnapshot({
      chapterId: "chapter_1",
      chapterLabel: "Learning",
      contentVersion: 2,
      textbookId: "note_1",
      uid: "student_1",
    })
  ).toThrow("explicit valid Date");
});

test("grouping ignores unmapped questions", () => {
  expect(
    groupMappedQuestionsByChapter({
      evaluatedQuestions: [
        mappedQuestion({
          conceptId: "",
          conceptLabel: "",
          textbookId: "",
          sectionId: "",
          blockId: "",
          contentVersion: 0,
        }),
      ],
      test: testData,
    })
  ).toHaveLength(0);
});

test("grouping creates one chapter per textbook", () => {
  const groups = groupMappedQuestionsByChapter({
    evaluatedQuestions: [
      mappedQuestion(),
      mappedQuestion({
        conceptId: "concept_2",
        questionId: "q2",
        questionIndex: 1,
      }),
    ],
    test: testData,
  });
  expect(groups).toHaveLength(1);
  expect(groups[0].evaluatedQuestions).toHaveLength(2);
});

test("grouping separates textbooks", () => {
  const groups = groupMappedQuestionsByChapter({
    evaluatedQuestions: [
      mappedQuestion(),
      mappedQuestion({
        textbookId: "note_2",
        questionId: "q2",
        questionIndex: 1,
      }),
    ],
    test: testData,
  });
  expect(groups).toHaveLength(2);
});

test("grouping derives safe chapter id", () => {
  const [group] = groupMappedQuestionsByChapter({
    evaluatedQuestions: [mappedQuestion()],
    test: { ...testData, chapter: "Child Development / Unit 1" },
  });
  expect(group.chapterId).toBe("child_development_unit_1");
});

test("group output is frozen", () => {
  const groups = groupMappedQuestionsByChapter({
    evaluatedQuestions: [mappedQuestion()],
    test: testData,
  });
  expect(Object.isFrozen(groups)).toBe(true);
  expect(Object.isFrozen(groups[0])).toBe(true);
});
