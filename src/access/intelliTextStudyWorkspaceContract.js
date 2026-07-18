import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_STUDY_WORKSPACE_SCHEMA_VERSION = 1;

export const INTELLITEXT_ANNOTATION_TYPES = Object.freeze({
  HIGHLIGHT: "HIGHLIGHT",
  UNDERLINE: "UNDERLINE",
  NOTE: "NOTE",
  DOUBT: "DOUBT",
});

export const INTELLITEXT_ANNOTATION_STATES = Object.freeze({
  ACTIVE: "ACTIVE",
  RESOLVED: "RESOLVED",
});

export const INTELLITEXT_STUDY_SHARE_STATES = Object.freeze({
  PRIVATE: "PRIVATE",
});

export const INTELLITEXT_STUDY_LIMITS = Object.freeze({
  EXACT_TEXT: 2000,
  CONTEXT: 128,
  BODY: 4000,
  BOOKMARK_LABEL: 300,
});

export class IntelliTextStudyWorkspaceContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextStudyWorkspaceContractError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextStudyWorkspaceContractError(code, message);
};

const normalizeOptionalText = (
  value,
  field,
  maximum
) => {
  const normalized = String(value ?? "").trim();

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

const freeze = (record) => Object.freeze(record);

export function normalizeIntelliTextStudyUid(uid) {
  return normalizeIntelliTextId(uid, "uid");
}

export function createIntelliTextStudySelectionAnchor(input = {}) {
  const exactText = String(input.exactText ?? "");
  const prefix = String(input.prefix ?? "");
  const suffix = String(input.suffix ?? "");
  const startOffset = normalizeInteger(
    input.startOffset,
    "selectionAnchor.startOffset"
  );
  const endOffset = normalizeInteger(
    input.endOffset,
    "selectionAnchor.endOffset"
  );

  if (!exactText.trim()) {
    fail(
      "EMPTY_SELECTION_DENIED",
      "selectionAnchor.exactText cannot be empty."
    );
  }

  if (exactText.length > INTELLITEXT_STUDY_LIMITS.EXACT_TEXT) {
    fail(
      "SELECTION_TOO_LONG",
      `selectionAnchor.exactText must be ${INTELLITEXT_STUDY_LIMITS.EXACT_TEXT} characters or fewer.`
    );
  }

  if (
    prefix.length > INTELLITEXT_STUDY_LIMITS.CONTEXT ||
    suffix.length > INTELLITEXT_STUDY_LIMITS.CONTEXT
  ) {
    fail(
      "SELECTION_CONTEXT_TOO_LONG",
      `Selection context must be ${INTELLITEXT_STUDY_LIMITS.CONTEXT} characters or fewer.`
    );
  }

  if (endOffset <= startOffset) {
    fail(
      "SELECTION_RANGE_INVALID",
      "selectionAnchor.endOffset must be greater than startOffset."
    );
  }

  return freeze({
    endOffset,
    exactText,
    prefix,
    startOffset,
    suffix,
  });
}

export function createIntelliTextAnnotationRecord(input = {}) {
  const type = normalizeEnum(
    input.type,
    "type",
    Object.values(INTELLITEXT_ANNOTATION_TYPES)
  );
  const body = normalizeOptionalText(
    input.body,
    "body",
    INTELLITEXT_STUDY_LIMITS.BODY
  );

  if (
    [
      INTELLITEXT_ANNOTATION_TYPES.NOTE,
      INTELLITEXT_ANNOTATION_TYPES.DOUBT,
    ].includes(type) &&
    !body
  ) {
    fail(
      "ANNOTATION_BODY_REQUIRED",
      `${type} annotations require a body.`
    );
  }

  return freeze({
    annotationId: normalizeIntelliTextId(
      input.annotationId,
      "annotationId"
    ),
    blockId: normalizeIntelliTextId(
      input.blockId,
      "blockId"
    ),
    body,
    contentVersion: normalizeInteger(
      input.contentVersion,
      "contentVersion",
      { minimum: 1 }
    ),
    createdAt: input.createdAt ?? null,
    schemaVersion: INTELLITEXT_STUDY_WORKSPACE_SCHEMA_VERSION,
    sectionId: normalizeIntelliTextId(
      input.sectionId,
      "sectionId"
    ),
    selectionAnchor: createIntelliTextStudySelectionAnchor(
      input.selectionAnchor
    ),
    shareState: normalizeEnum(
      input.shareState ?? INTELLITEXT_STUDY_SHARE_STATES.PRIVATE,
      "shareState",
      [INTELLITEXT_STUDY_SHARE_STATES.PRIVATE]
    ),
    state: normalizeEnum(
      input.state ?? INTELLITEXT_ANNOTATION_STATES.ACTIVE,
      "state",
      Object.values(INTELLITEXT_ANNOTATION_STATES)
    ),
    textbookId: normalizeIntelliTextId(
      input.textbookId,
      "textbookId"
    ),
    type,
    uid: normalizeIntelliTextStudyUid(input.uid),
    updatedAt: input.updatedAt ?? null,
  });
}

export function createIntelliTextBookmarkRecord(input = {}) {
  return freeze({
    blockId: normalizeIntelliTextId(
      input.blockId,
      "blockId"
    ),
    bookmarkId: normalizeIntelliTextId(
      input.bookmarkId,
      "bookmarkId"
    ),
    contentVersion: normalizeInteger(
      input.contentVersion,
      "contentVersion",
      { minimum: 1 }
    ),
    createdAt: input.createdAt ?? null,
    label: normalizeOptionalText(
      input.label,
      "label",
      INTELLITEXT_STUDY_LIMITS.BOOKMARK_LABEL
    ),
    schemaVersion: INTELLITEXT_STUDY_WORKSPACE_SCHEMA_VERSION,
    sectionId: normalizeIntelliTextId(
      input.sectionId,
      "sectionId"
    ),
    shareState: normalizeEnum(
      input.shareState ?? INTELLITEXT_STUDY_SHARE_STATES.PRIVATE,
      "shareState",
      [INTELLITEXT_STUDY_SHARE_STATES.PRIVATE]
    ),
    textbookId: normalizeIntelliTextId(
      input.textbookId,
      "textbookId"
    ),
    uid: normalizeIntelliTextStudyUid(input.uid),
    updatedAt: input.updatedAt ?? null,
  });
}

export function createIntelliTextAnnotationUpdate(input = {}) {
  const update = {};

  if (Object.prototype.hasOwnProperty.call(input, "body")) {
    update.body = normalizeOptionalText(
      input.body,
      "body",
      INTELLITEXT_STUDY_LIMITS.BODY
    );
  }

  if (Object.prototype.hasOwnProperty.call(input, "state")) {
    update.state = normalizeEnum(
      input.state,
      "state",
      Object.values(INTELLITEXT_ANNOTATION_STATES)
    );
  }

  if (Object.keys(update).length === 0) {
    fail(
      "ANNOTATION_UPDATE_EMPTY",
      "Annotation updates require body or state."
    );
  }

  update.updatedAt = input.updatedAt ?? null;
  return freeze(update);
}

export function createIntelliTextBookmarkUpdate(input = {}) {
  if (!Object.prototype.hasOwnProperty.call(input, "label")) {
    fail(
      "BOOKMARK_UPDATE_EMPTY",
      "Bookmark updates require label."
    );
  }

  return freeze({
    label: normalizeOptionalText(
      input.label,
      "label",
      INTELLITEXT_STUDY_LIMITS.BOOKMARK_LABEL
    ),
    updatedAt: input.updatedAt ?? null,
  });
}
