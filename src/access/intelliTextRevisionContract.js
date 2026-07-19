import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";
import {
  createIntelliTextStudySelectionAnchor,
  normalizeIntelliTextStudyUid,
} from "./intelliTextStudyWorkspaceContract";

export const INTELLITEXT_REVISION_SCHEMA_VERSION = 1;

export const INTELLITEXT_FLASHCARD_SOURCE_KINDS = Object.freeze({
  ANNOTATION: "ANNOTATION",
  MANUAL: "MANUAL",
  SELECTION: "SELECTION",
});

export const INTELLITEXT_REVISION_SOURCE_KINDS = Object.freeze({
  FLASHCARD: "FLASHCARD",
  SELECTION: "SELECTION",
});

export const INTELLITEXT_FLASHCARD_STATES = Object.freeze({
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
});

export const INTELLITEXT_REVISION_STATES = Object.freeze({
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  MASTERED: "MASTERED",
  PAUSED: "PAUSED",
});

export const INTELLITEXT_RECALL_RATINGS = Object.freeze({
  AGAIN: "AGAIN",
  EASY: "EASY",
  GOOD: "GOOD",
  HARD: "HARD",
});

export const INTELLITEXT_REVISION_SHARE_STATES = Object.freeze({
  PRIVATE: "PRIVATE",
});

export const INTELLITEXT_REVISION_LIMITS = Object.freeze({
  ANSWER: 3000,
  LABEL: 300,
  MAX_FLASHCARDS_PER_LOAD: 100,
  MAX_INTERVAL_DAYS: 180,
  MAX_REVISION_ITEMS_PER_LOAD: 100,
  PROMPT: 1000,
  SELECTION_TEXT: 2000,
});

export class IntelliTextRevisionContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextRevisionContractError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextRevisionContractError(code, message);
};

const freeze = (value) => Object.freeze(value);

const normalizeEnum = (value, field, allowed) => {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (!allowed.includes(normalized)) {
    fail(
      "ENUM_INVALID",
      `${field} must be one of: ${allowed.join(", ")}.`
    );
  }

  return normalized;
};

const normalizeText = (
  value,
  field,
  maximum,
  { required = false } = {}
) => {
  const normalized = String(value ?? "").trim();

  if (required && !normalized) {
    fail("TEXT_REQUIRED", `${field} is required.`);
  }

  if (normalized.length > maximum) {
    fail(
      "TEXT_TOO_LONG",
      `${field} must be ${maximum} characters or fewer.`
    );
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

const normalizeOptionalId = (value, field) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalizeIntelliTextId(normalized, field) : "";
};

const normalizeTimestampLike = (
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

  if (
    value instanceof Date &&
    Number.isNaN(value.getTime())
  ) {
    fail("TIMESTAMP_INVALID", `${field} must be a valid timestamp.`);
  }

  return value;
};

const normalizeSelectionAnchor = ({
  value,
  required,
} = {}) => {
  if (value == null) {
    if (required) {
      fail(
        "SELECTION_ANCHOR_REQUIRED",
        "selectionAnchor is required for selection-backed learning records."
      );
    }

    return null;
  }

  const anchor = createIntelliTextStudySelectionAnchor(value);

  if (
    anchor.exactText.length >
    INTELLITEXT_REVISION_LIMITS.SELECTION_TEXT
  ) {
    fail(
      "SELECTION_TEXT_TOO_LONG",
      `selectionAnchor.exactText must be ${INTELLITEXT_REVISION_LIMITS.SELECTION_TEXT} characters or fewer.`
    );
  }

  return anchor;
};

const normalizeSharedIdentity = (input = {}) => ({
  blockId: normalizeIntelliTextId(input.blockId, "blockId"),
  contentVersion: normalizeInteger(
    input.contentVersion,
    "contentVersion",
    { minimum: 1 }
  ),
  noteTitle: normalizeText(
    input.noteTitle,
    "noteTitle",
    INTELLITEXT_REVISION_LIMITS.LABEL
  ),
  sectionId: normalizeIntelliTextId(input.sectionId, "sectionId"),
  sectionTitle: normalizeText(
    input.sectionTitle,
    "sectionTitle",
    INTELLITEXT_REVISION_LIMITS.LABEL
  ),
  textbookId: normalizeIntelliTextId(input.textbookId, "textbookId"),
  uid: normalizeIntelliTextStudyUid(input.uid),
});

export function createIntelliTextFlashcardRecord(input = {}) {
  const sourceKind = normalizeEnum(
    input.sourceKind,
    "sourceKind",
    Object.values(INTELLITEXT_FLASHCARD_SOURCE_KINDS)
  );
  const selectionBacked = [
    INTELLITEXT_FLASHCARD_SOURCE_KINDS.SELECTION,
    INTELLITEXT_FLASHCARD_SOURCE_KINDS.ANNOTATION,
  ].includes(sourceKind);
  const flashcardId = normalizeIntelliTextId(
    input.flashcardId,
    "flashcardId"
  );
  const sourceId = normalizeOptionalId(input.sourceId, "sourceId");

  if (
    sourceKind === INTELLITEXT_FLASHCARD_SOURCE_KINDS.ANNOTATION &&
    !sourceId
  ) {
    fail(
      "ANNOTATION_SOURCE_ID_REQUIRED",
      "Annotation-backed flashcards require sourceId."
    );
  }

  return freeze({
    answer: normalizeText(
      input.answer,
      "answer",
      INTELLITEXT_REVISION_LIMITS.ANSWER,
      { required: true }
    ),
    ...normalizeSharedIdentity(input),
    createdAt: normalizeTimestampLike(
      input.createdAt,
      "createdAt",
      { required: true }
    ),
    flashcardId,
    prompt: normalizeText(
      input.prompt,
      "prompt",
      INTELLITEXT_REVISION_LIMITS.PROMPT,
      { required: true }
    ),
    schemaVersion: INTELLITEXT_REVISION_SCHEMA_VERSION,
    selectionAnchor: normalizeSelectionAnchor({
      value: input.selectionAnchor,
      required: selectionBacked,
    }),
    shareState: normalizeEnum(
      input.shareState ?? INTELLITEXT_REVISION_SHARE_STATES.PRIVATE,
      "shareState",
      [INTELLITEXT_REVISION_SHARE_STATES.PRIVATE]
    ),
    sourceId: sourceId || flashcardId,
    sourceKind,
    state: normalizeEnum(
      input.state ?? INTELLITEXT_FLASHCARD_STATES.ACTIVE,
      "state",
      Object.values(INTELLITEXT_FLASHCARD_STATES)
    ),
    updatedAt: normalizeTimestampLike(
      input.updatedAt,
      "updatedAt",
      { required: true }
    ),
  });
}

export function createIntelliTextRevisionQueueRecord(input = {}) {
  const sourceKind = normalizeEnum(
    input.sourceKind,
    "sourceKind",
    Object.values(INTELLITEXT_REVISION_SOURCE_KINDS)
  );
  const revisionId = normalizeIntelliTextId(
    input.revisionId,
    "revisionId"
  );
  const sourceId = normalizeIntelliTextId(
    input.sourceId,
    "sourceId"
  );

  if (
    sourceKind === INTELLITEXT_REVISION_SOURCE_KINDS.FLASHCARD &&
    revisionId !== sourceId
  ) {
    fail(
      "FLASHCARD_QUEUE_IDENTITY_INVALID",
      "Flashcard revisionId must equal sourceId to prevent duplicate active queue items."
    );
  }

  return freeze({
    answer: normalizeText(
      input.answer,
      "answer",
      INTELLITEXT_REVISION_LIMITS.ANSWER,
      { required: true }
    ),
    ...normalizeSharedIdentity(input),
    createdAt: normalizeTimestampLike(
      input.createdAt,
      "createdAt",
      { required: true }
    ),
    dueAt: normalizeTimestampLike(
      input.dueAt,
      "dueAt",
      { required: true }
    ),
    intervalDays: normalizeInteger(
      input.intervalDays ?? 0,
      "intervalDays",
      {
        minimum: 0,
        maximum: INTELLITEXT_REVISION_LIMITS.MAX_INTERVAL_DAYS,
      }
    ),
    lastRating:
      input.lastRating == null
        ? null
        : normalizeEnum(
            input.lastRating,
            "lastRating",
            Object.values(INTELLITEXT_RECALL_RATINGS)
          ),
    lastReviewedAt: normalizeTimestampLike(
      input.lastReviewedAt,
      "lastReviewedAt"
    ),
    prompt: normalizeText(
      input.prompt,
      "prompt",
      INTELLITEXT_REVISION_LIMITS.PROMPT,
      { required: true }
    ),
    recallStreak: normalizeInteger(
      input.recallStreak ?? 0,
      "recallStreak",
      { minimum: 0 }
    ),
    reviewCount: normalizeInteger(
      input.reviewCount ?? 0,
      "reviewCount",
      { minimum: 0 }
    ),
    revisionId,
    schemaVersion: INTELLITEXT_REVISION_SCHEMA_VERSION,
    selectionAnchor: normalizeSelectionAnchor({
      value: input.selectionAnchor,
      required:
        sourceKind === INTELLITEXT_REVISION_SOURCE_KINDS.SELECTION,
    }),
    shareState: normalizeEnum(
      input.shareState ?? INTELLITEXT_REVISION_SHARE_STATES.PRIVATE,
      "shareState",
      [INTELLITEXT_REVISION_SHARE_STATES.PRIVATE]
    ),
    sourceId,
    sourceKind,
    state: normalizeEnum(
      input.state ?? INTELLITEXT_REVISION_STATES.ACTIVE,
      "state",
      Object.values(INTELLITEXT_REVISION_STATES)
    ),
    updatedAt: normalizeTimestampLike(
      input.updatedAt,
      "updatedAt",
      { required: true }
    ),
  });
}

export function createIntelliTextFlashcardUpdate(input = {}) {
  const update = {};

  if (Object.prototype.hasOwnProperty.call(input, "prompt")) {
    update.prompt = normalizeText(
      input.prompt,
      "prompt",
      INTELLITEXT_REVISION_LIMITS.PROMPT,
      { required: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(input, "answer")) {
    update.answer = normalizeText(
      input.answer,
      "answer",
      INTELLITEXT_REVISION_LIMITS.ANSWER,
      { required: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(input, "state")) {
    update.state = normalizeEnum(
      input.state,
      "state",
      Object.values(INTELLITEXT_FLASHCARD_STATES)
    );
  }

  if (Object.keys(update).length === 0) {
    fail(
      "FLASHCARD_UPDATE_EMPTY",
      "Flashcard updates require prompt, answer, or state."
    );
  }

  update.updatedAt = normalizeTimestampLike(
    input.updatedAt,
    "updatedAt",
    { required: true }
  );

  return freeze(update);
}

export function createIntelliTextRevisionStateUpdate(input = {}) {
  return freeze({
    state: normalizeEnum(
      input.state,
      "state",
      Object.values(INTELLITEXT_REVISION_STATES)
    ),
    updatedAt: normalizeTimestampLike(
      input.updatedAt,
      "updatedAt",
      { required: true }
    ),
  });
}

export function createIntelliTextRevisionReviewUpdate(input = {}) {
  return freeze({
    dueAt: normalizeTimestampLike(
      input.dueAt,
      "dueAt",
      { required: true }
    ),
    intervalDays: normalizeInteger(
      input.intervalDays,
      "intervalDays",
      {
        minimum: 0,
        maximum: INTELLITEXT_REVISION_LIMITS.MAX_INTERVAL_DAYS,
      }
    ),
    lastRating: normalizeEnum(
      input.lastRating,
      "lastRating",
      Object.values(INTELLITEXT_RECALL_RATINGS)
    ),
    lastReviewedAt: normalizeTimestampLike(
      input.lastReviewedAt,
      "lastReviewedAt",
      { required: true }
    ),
    recallStreak: normalizeInteger(
      input.recallStreak,
      "recallStreak",
      { minimum: 0 }
    ),
    reviewCount: normalizeInteger(
      input.reviewCount,
      "reviewCount",
      { minimum: 1 }
    ),
    state: normalizeEnum(
      input.state ?? INTELLITEXT_REVISION_STATES.ACTIVE,
      "state",
      Object.values(INTELLITEXT_REVISION_STATES)
    ),
    updatedAt: normalizeTimestampLike(
      input.updatedAt,
      "updatedAt",
      { required: true }
    ),
  });
}
