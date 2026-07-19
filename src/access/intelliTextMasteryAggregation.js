import {
  INTELLITEXT_MASTERY_WEIGHTS,
  INTELLITEXT_MISTAKE_SOURCE_KINDS,
  INTELLITEXT_MISTAKE_STATES,
  buildIntelliTextMasteryId,
  createIntelliTextMasteryRecord,
  createIntelliTextMistakeRecord,
} from "./intelliTextMasteryContract";
import {
  hasCompleteMockQuestionConceptLink,
} from "./mockTestConceptLinkingContract";

const DAY_MS = 24 * 60 * 60 * 1000;

const cleanText = (value = "") => String(value ?? "").trim();

const clampScore = (value) =>
  Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

const toDate = (value, fallback = null) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  if (typeof value?.toDate === "function") {
    return toDate(value.toDate(), fallback);
  }

  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const toSafeId = (value, fallback) => {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);

  return normalized || fallback;
};

export function buildEvaluatedQuestionId(question = {}, questionIndex = 0) {
  return toSafeId(
    question.questionId ||
      question.id ||
      question.questionNumber ||
      `question_${questionIndex + 1}`,
    `question_${questionIndex + 1}`
  );
}

export function createEvaluatedMockQuestion({
  answered,
  correct,
  question = {},
  questionIndex = 0,
} = {}) {
  return Object.freeze({
    answered: Boolean(answered),
    blockId: cleanText(question.blockId),
    conceptId: cleanText(question.conceptId),
    conceptLabel: cleanText(question.conceptLabel),
    contentVersion: Number(question.contentVersion) || 0,
    correct: Boolean(correct),
    questionId: buildEvaluatedQuestionId(question, questionIndex),
    questionIndex: Math.max(0, Math.round(Number(questionIndex) || 0)),
    sectionId: cleanText(question.sectionId),
    textbookId: cleanText(question.textbookId),
  });
}

export function buildMistakesFromEvaluatedQuestions({
  attemptId,
  evaluatedQuestions = [],
  now,
  resultId,
  test = {},
  uid,
} = {}) {
  const explicitNow = toDate(now);

  if (!explicitNow) {
    throw new Error("Mistake aggregation requires an explicit valid Date.");
  }

  return evaluatedQuestions
    .filter((item) => !item.correct)
    .map((item) => {
      const mapped = hasCompleteMockQuestionConceptLink(item);
      const retryDueAt = new Date(
        explicitNow.getTime() + (item.answered ? 2 : 1) * DAY_MS
      );

      return createIntelliTextMistakeRecord({
        attemptId,
        blockId: mapped ? item.blockId : "",
        chapter: test.chapter || "",
        conceptId: mapped ? item.conceptId : "",
        conceptLabel: mapped ? item.conceptLabel : "",
        contentVersion: mapped ? item.contentVersion : 0,
        createdAt: explicitNow,
        firstSeenAt: explicitNow,
        lastSeenAt: explicitNow,
        occurrenceCount: 1,
        questionId: item.questionId,
        questionIndex: item.questionIndex,
        resolvedAt: null,
        resultId,
        retriedAt: null,
        retryDueAt,
        sectionId: mapped ? item.sectionId : "",
        sourceKind: item.answered
          ? INTELLITEXT_MISTAKE_SOURCE_KINDS.WRONG
          : INTELLITEXT_MISTAKE_SOURCE_KINDS.UNANSWERED,
        state: INTELLITEXT_MISTAKE_STATES.OPEN,
        subject: test.subject || "",
        testId: test.id,
        testTitle: test.title || "",
        textbookId: mapped ? item.textbookId : "",
        uid,
        updatedAt: explicitNow,
      });
    });
}

export function deriveWeakConcepts({
  mistakes = [],
  now,
} = {}) {
  const explicitNow = toDate(now, new Date(0));
  const groups = new Map();

  mistakes
    .filter(
      (item) =>
        item?.conceptId &&
        [
          INTELLITEXT_MISTAKE_STATES.OPEN,
          INTELLITEXT_MISTAKE_STATES.RETRY_DUE,
          INTELLITEXT_MISTAKE_STATES.RETRIED,
        ].includes(item.state)
    )
    .forEach((item) => {
      const current = groups.get(item.conceptId) || {
        conceptId: item.conceptId,
        conceptLabel: item.conceptLabel || item.conceptId,
        mistakeCount: 0,
        overdueCount: 0,
        sectionId: item.sectionId || "",
        textbookId: item.textbookId || "",
      };
      const due = toDate(item.retryDueAt);

      current.mistakeCount += 1;
      current.overdueCount +=
        due && due.getTime() <= explicitNow.getTime() ? 1 : 0;
      groups.set(item.conceptId, current);
    });

  return Object.freeze(
    [...groups.values()]
      .sort(
        (left, right) =>
          right.overdueCount - left.overdueCount ||
          right.mistakeCount - left.mistakeCount ||
          left.conceptLabel.localeCompare(right.conceptLabel)
      )
      .map((item) => Object.freeze(item))
  );
}

export function calculateIntelliTextReadingScore(progress = null) {
  return clampScore(progress?.progressPercent || 0);
}

export function calculateIntelliTextRevisionSnapshot(items = []) {
  const total = items.length;
  const completed = items.filter((item) =>
    ["MASTERED", "ARCHIVED"].includes(item?.state)
  ).length;

  return Object.freeze({
    completed,
    score: total > 0 ? clampScore((completed / total) * 100) : 0,
    total,
  });
}

export function calculateIntelliTextPracticeSnapshot({
  evaluatedQuestions = [],
  mistakes = [],
} = {}) {
  const mappedQuestions = evaluatedQuestions.filter((item) =>
    hasCompleteMockQuestionConceptLink(item)
  );
  const correctCount = mappedQuestions.filter((item) => item.correct).length;
  const mappedQuestionCount = mappedQuestions.length;
  const practiceAccuracy =
    mappedQuestionCount > 0
      ? clampScore((correctCount / mappedQuestionCount) * 100)
      : 0;
  const mappedMistakes = mistakes.filter((item) => item?.conceptId);
  const resolvedMistakeCount = mappedMistakes.filter(
    (item) => item.state === INTELLITEXT_MISTAKE_STATES.RESOLVED
  ).length;
  const resolutionScore =
    mappedMistakes.length > 0
      ? clampScore(
          (resolvedMistakeCount / mappedMistakes.length) * 100
        )
      : practiceAccuracy;
  const practiceScore = clampScore(
    practiceAccuracy * 0.75 + resolutionScore * 0.25
  );

  return Object.freeze({
    correctCount,
    mappedQuestionCount,
    practiceAccuracy,
    practiceScore,
    resolvedMistakeCount,
  });
}

export function calculateWeightedMasteryScore({
  practiceScore = 0,
  readingScore = 0,
  revisionScore = 0,
} = {}) {
  return clampScore(
    (clampScore(readingScore) * INTELLITEXT_MASTERY_WEIGHTS.READING +
      clampScore(practiceScore) * INTELLITEXT_MASTERY_WEIGHTS.PRACTICE +
      clampScore(revisionScore) * INTELLITEXT_MASTERY_WEIGHTS.REVISION) /
      100
  );
}

export function buildChapterMasterySnapshot({
  chapterId,
  chapterLabel,
  contentVersion,
  createdAt,
  evaluatedQuestions = [],
  mistakes = [],
  now,
  readingProgress = null,
  revisionItems = [],
  textbookId,
  uid,
} = {}) {
  const explicitNow = toDate(now);

  if (!explicitNow) {
    throw new Error("Mastery aggregation requires an explicit valid Date.");
  }

  const readingScore = calculateIntelliTextReadingScore(readingProgress);
  const practice = calculateIntelliTextPracticeSnapshot({
    evaluatedQuestions,
    mistakes,
  });
  const revision = calculateIntelliTextRevisionSnapshot(revisionItems);
  const overdueRetryCount = mistakes.filter((item) => {
    if (
      ![
        INTELLITEXT_MISTAKE_STATES.OPEN,
        INTELLITEXT_MISTAKE_STATES.RETRY_DUE,
        INTELLITEXT_MISTAKE_STATES.RETRIED,
      ].includes(item?.state)
    ) {
      return false;
    }

    const due = toDate(item.retryDueAt);
    return due && due.getTime() <= explicitNow.getTime();
  }).length;
  const masteryScore = calculateWeightedMasteryScore({
    practiceScore: practice.practiceScore,
    readingScore,
    revisionScore: revision.score,
  });

  return createIntelliTextMasteryRecord({
    calculatedAt: explicitNow,
    chapterId,
    chapterLabel,
    contentVersion,
    correctCount: practice.correctCount,
    createdAt: createdAt || explicitNow,
    mappedQuestionCount: practice.mappedQuestionCount,
    masteryId: buildIntelliTextMasteryId({ chapterId, textbookId }),
    masteryScore,
    mistakeCount: mistakes.length,
    overdueRetryCount,
    practiceAccuracy: practice.practiceAccuracy,
    practiceScore: practice.practiceScore,
    readingScore,
    resolvedMistakeCount: practice.resolvedMistakeCount,
    revisionCompleted: revision.completed,
    revisionScore: revision.score,
    revisionTotal: revision.total,
    textbookId,
    uid,
    updatedAt: explicitNow,
  });
}

export function groupMappedQuestionsByChapter({
  evaluatedQuestions = [],
  test = {},
} = {}) {
  const chapterId = toSafeId(test.chapter, "chapter_1");
  const groups = new Map();

  evaluatedQuestions
    .filter((item) => hasCompleteMockQuestionConceptLink(item))
    .forEach((item) => {
      const key = `${item.textbookId}|${chapterId}`;
      const group = groups.get(key) || {
        chapterId,
        chapterLabel: cleanText(test.chapter) || "Chapter",
        contentVersion: Number(item.contentVersion),
        evaluatedQuestions: [],
        textbookId: item.textbookId,
      };

      group.evaluatedQuestions.push(item);
      groups.set(key, group);
    });

  return Object.freeze(
    [...groups.values()].map((group) =>
      Object.freeze({
        ...group,
        evaluatedQuestions: Object.freeze([...group.evaluatedQuestions]),
      })
    )
  );
}
