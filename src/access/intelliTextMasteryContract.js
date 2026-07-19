import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";
import {
  normalizeMockQuestionConceptLink,
} from "./mockTestConceptLinkingContract";

export const INTELLITEXT_MASTERY_SCHEMA_VERSION = 1;

export const INTELLITEXT_MISTAKE_SOURCE_KINDS = Object.freeze({
  UNANSWERED: "UNANSWERED",
  WRONG: "WRONG",
});

export const INTELLITEXT_MISTAKE_STATES = Object.freeze({
  ARCHIVED: "ARCHIVED",
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  RETRIED: "RETRIED",
  RETRY_DUE: "RETRY_DUE",
});

export const INTELLITEXT_MASTERY_STATES = Object.freeze({
  BUILDING: "BUILDING",
  EXAM_READY: "EXAM_READY",
  RETRY_DUE: "RETRY_DUE",
  STARTING: "STARTING",
  STRONG: "STRONG",
});

export const INTELLITEXT_MASTERY_SHARE_STATES = Object.freeze({
  PRIVATE: "PRIVATE",
});

export const INTELLITEXT_MASTERY_LIMITS = Object.freeze({
  LABEL: 300,
  MAX_MASTERY_ITEMS_PER_LOAD: 100,
  MAX_MISTAKES_PER_LOAD: 150,
  MAX_QUESTION_INDEX: 500,
  SCORE: 100,
});

export const INTELLITEXT_MASTERY_WEIGHTS = Object.freeze({
  PRACTICE: 40,
  READING: 30,
  REVISION: 30,
});

export class IntelliTextMasteryContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextMasteryContractError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextMasteryContractError(code, message);
};

const cleanText = (value = "") => String(value ?? "").trim();

const normalizeText = (
  value,
  field,
  { maximum = INTELLITEXT_MASTERY_LIMITS.LABEL, required = false } = {}
) => {
  const normalized = cleanText(value);

  if (required && !normalized) {
    fail("TEXT_REQUIRED", `${field} is required.`);
  }

  if (normalized.length > maximum) {
    fail("TEXT_TOO_LONG", `${field} must be ${maximum} characters or fewer.`);
  }

  return normalized;
};

const normalizeInteger = (
  value,
  field,
  { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}
) => {
  const normalized = Number(value);

  if (
    !Number.isSafeInteger(normalized) ||
    normalized < minimum ||
    normalized > maximum
  ) {
    fail(
      "INTEGER_INVALID",
      `${field} must be an integer from ${minimum} to ${maximum}.`
    );
  }

  return normalized;
};

const normalizeScore = (value, field) =>
  normalizeInteger(value, field, {
    maximum: INTELLITEXT_MASTERY_LIMITS.SCORE,
  });

const normalizeEnum = (value, field, allowed) => {
  const normalized = cleanText(value).toUpperCase();

  if (!allowed.includes(normalized)) {
    fail("ENUM_INVALID", `${field} must be one of: ${allowed.join(", ")}.`);
  }

  return normalized;
};

const normalizeTimestamp = (
  value,
  field,
  { required = false } = {}
) => {
  if (value == null) {
    if (required) {
      fail("TIMESTAMP_REQUIRED", `${field} is required.`);
    }

    return null;
  }

  if (value instanceof Date && Number.isNaN(value.getTime())) {
    fail("TIMESTAMP_INVALID", `${field} must be a valid timestamp.`);
  }

  return value;
};

const normalizeOptionalId = (value, field) => {
  const normalized = cleanText(value);
  return normalized ? normalizeIntelliTextId(normalized, field) : "";
};

const hashText = (value = "", seed = 2166136261) => {
  let hash = seed >>> 0;
  const input = String(value || "");

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash.toString(36).padStart(7, "0");
};

const stableId = (prefix, parts = []) => {
  const normalized = parts.map((part) => cleanText(part));

  if (normalized.some((part) => !part)) {
    fail("IDENTITY_INCOMPLETE", `${prefix} identity is incomplete.`);
  }

  return normalizeIntelliTextId(
    `${prefix}_${hashText(normalized.join("|"))}`,
    `${prefix}Id`
  );
};

export function buildIntelliTextResultIdentity(value) {
  return stableId("result", [value]);
}

export function buildIntelliTextAttemptIdentity(value) {
  return stableId("attempt", [value]);
}

export function buildIntelliTextMistakeId({
  questionId,
  resultId,
} = {}) {
  return stableId("mistake", [resultId, questionId]);
}

export function buildIntelliTextMasteryId({
  chapterId,
  textbookId,
} = {}) {
  return stableId("mastery", [textbookId, chapterId]);
}

export function resolveIntelliTextMasteryState({
  masteryScore,
  overdueRetryCount = 0,
  practiceAccuracy = 0,
} = {}) {
  const score = normalizeScore(masteryScore, "masteryScore");
  const accuracy = normalizeScore(practiceAccuracy, "practiceAccuracy");
  const overdue = normalizeInteger(
    overdueRetryCount,
    "overdueRetryCount"
  );

  if (overdue > 0 && score >= 50) {
    return INTELLITEXT_MASTERY_STATES.RETRY_DUE;
  }

  if (score >= 85 && accuracy >= 80 && overdue === 0) {
    return INTELLITEXT_MASTERY_STATES.EXAM_READY;
  }

  if (score >= 70) {
    return INTELLITEXT_MASTERY_STATES.STRONG;
  }

  if (score >= 50) {
    return INTELLITEXT_MASTERY_STATES.RETRY_DUE;
  }

  if (score >= 25) {
    return INTELLITEXT_MASTERY_STATES.BUILDING;
  }

  return INTELLITEXT_MASTERY_STATES.STARTING;
}

export function createIntelliTextMistakeRecord(input = {}) {
  const conceptLink = normalizeMockQuestionConceptLink(input, {
    allowEmpty: true,
  });
  const resultId = normalizeIntelliTextId(input.resultId, "resultId");
  const questionId = normalizeIntelliTextId(input.questionId, "questionId");
  const mistakeId = normalizeIntelliTextId(
    input.mistakeId ||
      buildIntelliTextMistakeId({ questionId, resultId }),
    "mistakeId"
  );

  return Object.freeze({
    attemptId: normalizeIntelliTextId(input.attemptId, "attemptId"),
    blockId: conceptLink?.blockId || "",
    chapter: normalizeText(input.chapter, "chapter"),
    conceptId: conceptLink?.conceptId || "",
    conceptLabel: conceptLink?.conceptLabel || "",
    contentVersion: conceptLink?.contentVersion || 0,
    createdAt: normalizeTimestamp(input.createdAt, "createdAt", {
      required: true,
    }),
    firstSeenAt: normalizeTimestamp(input.firstSeenAt, "firstSeenAt", {
      required: true,
    }),
    lastSeenAt: normalizeTimestamp(input.lastSeenAt, "lastSeenAt", {
      required: true,
    }),
    mistakeId,
    occurrenceCount: normalizeInteger(
      input.occurrenceCount ?? 1,
      "occurrenceCount",
      { minimum: 1 }
    ),
    questionId,
    questionIndex: normalizeInteger(input.questionIndex, "questionIndex", {
      maximum: INTELLITEXT_MASTERY_LIMITS.MAX_QUESTION_INDEX,
    }),
    resolvedAt: normalizeTimestamp(input.resolvedAt, "resolvedAt"),
    resultId,
    retriedAt: normalizeTimestamp(input.retriedAt, "retriedAt"),
    retryDueAt: normalizeTimestamp(input.retryDueAt, "retryDueAt"),
    schemaVersion: INTELLITEXT_MASTERY_SCHEMA_VERSION,
    sectionId: conceptLink?.sectionId || "",
    shareState: normalizeEnum(
      input.shareState ?? INTELLITEXT_MASTERY_SHARE_STATES.PRIVATE,
      "shareState",
      [INTELLITEXT_MASTERY_SHARE_STATES.PRIVATE]
    ),
    sourceKind: normalizeEnum(
      input.sourceKind,
      "sourceKind",
      Object.values(INTELLITEXT_MISTAKE_SOURCE_KINDS)
    ),
    state: normalizeEnum(
      input.state ?? INTELLITEXT_MISTAKE_STATES.OPEN,
      "state",
      Object.values(INTELLITEXT_MISTAKE_STATES)
    ),
    subject: normalizeText(input.subject, "subject"),
    testId: normalizeIntelliTextId(input.testId, "testId"),
    testTitle: normalizeText(input.testTitle, "testTitle"),
    textbookId: conceptLink?.textbookId || "",
    uid: normalizeIntelliTextId(input.uid, "uid"),
    updatedAt: normalizeTimestamp(input.updatedAt, "updatedAt", {
      required: true,
    }),
  });
}

export function createIntelliTextMistakeStateUpdate(input = {}) {
  const state = normalizeEnum(
    input.state,
    "state",
    Object.values(INTELLITEXT_MISTAKE_STATES)
  );

  return Object.freeze({
    resolvedAt:
      state === INTELLITEXT_MISTAKE_STATES.RESOLVED
        ? normalizeTimestamp(input.resolvedAt, "resolvedAt", {
            required: true,
          })
        : null,
    retriedAt:
      state === INTELLITEXT_MISTAKE_STATES.RETRIED
        ? normalizeTimestamp(input.retriedAt, "retriedAt", {
            required: true,
          })
        : input.retriedAt ?? null,
    retryDueAt: normalizeTimestamp(input.retryDueAt, "retryDueAt"),
    state,
    updatedAt: normalizeTimestamp(input.updatedAt, "updatedAt", {
      required: true,
    }),
  });
}

export function createIntelliTextMasteryRecord(input = {}) {
  const textbookId = normalizeIntelliTextId(input.textbookId, "textbookId");
  const chapterId = normalizeIntelliTextId(input.chapterId, "chapterId");
  const masteryId = normalizeIntelliTextId(
    input.masteryId ||
      buildIntelliTextMasteryId({ chapterId, textbookId }),
    "masteryId"
  );
  const masteryScore = normalizeScore(input.masteryScore, "masteryScore");
  const practiceAccuracy = normalizeScore(
    input.practiceAccuracy,
    "practiceAccuracy"
  );
  const overdueRetryCount = normalizeInteger(
    input.overdueRetryCount,
    "overdueRetryCount"
  );
  const mappedQuestionCount = normalizeInteger(
    input.mappedQuestionCount,
    "mappedQuestionCount"
  );
  const correctCount = normalizeInteger(input.correctCount, "correctCount");
  const mistakeCount = normalizeInteger(input.mistakeCount, "mistakeCount");
  const resolvedMistakeCount = normalizeInteger(
    input.resolvedMistakeCount,
    "resolvedMistakeCount"
  );
  const revisionTotal = normalizeInteger(
    input.revisionTotal,
    "revisionTotal"
  );
  const revisionCompleted = normalizeInteger(
    input.revisionCompleted,
    "revisionCompleted"
  );

  if (correctCount > mappedQuestionCount) {
    fail(
      "COUNT_RELATION_INVALID",
      "correctCount cannot exceed mappedQuestionCount."
    );
  }

  if (resolvedMistakeCount > mistakeCount) {
    fail(
      "COUNT_RELATION_INVALID",
      "resolvedMistakeCount cannot exceed mistakeCount."
    );
  }

  if (overdueRetryCount > mistakeCount) {
    fail(
      "COUNT_RELATION_INVALID",
      "overdueRetryCount cannot exceed mistakeCount."
    );
  }

  if (revisionCompleted > revisionTotal) {
    fail(
      "COUNT_RELATION_INVALID",
      "revisionCompleted cannot exceed revisionTotal."
    );
  }

  const state = resolveIntelliTextMasteryState({
    masteryScore,
    overdueRetryCount,
    practiceAccuracy,
  });

  if (input.state && cleanText(input.state).toUpperCase() !== state) {
    fail(
      "MASTERY_STATE_MISMATCH",
      "state must match the locked mastery thresholds."
    );
  }

  return Object.freeze({
    calculatedAt: normalizeTimestamp(input.calculatedAt, "calculatedAt", {
      required: true,
    }),
    chapterId,
    chapterLabel: normalizeText(input.chapterLabel, "chapterLabel"),
    contentVersion: normalizeInteger(
      input.contentVersion,
      "contentVersion",
      { minimum: 1 }
    ),
    correctCount,
    createdAt: normalizeTimestamp(input.createdAt, "createdAt", {
      required: true,
    }),
    mappedQuestionCount,
    masteryId,
    masteryScore,
    mistakeCount,
    overdueRetryCount,
    practiceAccuracy,
    practiceScore: normalizeScore(input.practiceScore, "practiceScore"),
    readingScore: normalizeScore(input.readingScore, "readingScore"),
    resolvedMistakeCount,
    revisionCompleted,
    revisionScore: normalizeScore(input.revisionScore, "revisionScore"),
    revisionTotal,
    schemaVersion: INTELLITEXT_MASTERY_SCHEMA_VERSION,
    shareState: normalizeEnum(
      input.shareState ?? INTELLITEXT_MASTERY_SHARE_STATES.PRIVATE,
      "shareState",
      [INTELLITEXT_MASTERY_SHARE_STATES.PRIVATE]
    ),
    state,
    textbookId,
    uid: normalizeIntelliTextId(input.uid, "uid"),
    updatedAt: normalizeTimestamp(input.updatedAt, "updatedAt", {
      required: true,
    }),
  });
}

export function createIntelliTextMasteryUpdate(input = {}) {
  const normalized = createIntelliTextMasteryRecord({
    ...input,
    createdAt: input.createdAt,
  });

  return Object.freeze({
    calculatedAt: normalized.calculatedAt,
    correctCount: normalized.correctCount,
    mappedQuestionCount: normalized.mappedQuestionCount,
    masteryScore: normalized.masteryScore,
    mistakeCount: normalized.mistakeCount,
    overdueRetryCount: normalized.overdueRetryCount,
    practiceAccuracy: normalized.practiceAccuracy,
    practiceScore: normalized.practiceScore,
    readingScore: normalized.readingScore,
    resolvedMistakeCount: normalized.resolvedMistakeCount,
    revisionCompleted: normalized.revisionCompleted,
    revisionScore: normalized.revisionScore,
    revisionTotal: normalized.revisionTotal,
    state: normalized.state,
    updatedAt: normalized.updatedAt,
  });
}

export function hasExactMistakeSectionLink(mistake = {}) {
  return Boolean(
    mistake.conceptId &&
      mistake.textbookId &&
      mistake.sectionId &&
      mistake.blockId &&
      Number(mistake.contentVersion) >= 1
  );
}

export function normalizeOptionalMasteryId(value, field) {
  return normalizeOptionalId(value, field);
}
