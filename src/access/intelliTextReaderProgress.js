import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_PROGRESS_SCHEMA_VERSION =
  1;

export const INTELLITEXT_PROGRESS_STORAGE_PREFIX =
  "aspirenest:intellitext:reading-progress:v1";

const cleanText = (value = "") =>
  String(value ?? "").trim();

const clampPercent = (value) =>
  Math.min(
    100,
    Math.max(
      0,
      Math.round(Number(value) || 0)
    )
  );

export function buildIntelliTextProgressKey({
  uid,
  textbookId,
} = {}) {
  const ownerId = normalizeIntelliTextId(
    uid,
    "uid"
  );
  const resourceId = normalizeIntelliTextId(
    textbookId,
    "textbookId"
  );

  return [
    INTELLITEXT_PROGRESS_STORAGE_PREFIX,
    ownerId,
    resourceId,
  ].join(":");
}

export function createIntelliTextProgressRecord(
  input = {}
) {
  return Object.freeze({
    schemaVersion:
      INTELLITEXT_PROGRESS_SCHEMA_VERSION,
    uid: normalizeIntelliTextId(
      input.uid,
      "uid"
    ),
    textbookId: normalizeIntelliTextId(
      input.textbookId,
      "textbookId"
    ),
    contentVersion: Math.max(
      1,
      Math.round(
        Number(input.contentVersion) || 1
      )
    ),
    sectionId: normalizeIntelliTextId(
      input.sectionId,
      "sectionId"
    ),
    blockId:
      cleanText(input.blockId)
        ? normalizeIntelliTextId(
            input.blockId,
            "blockId"
          )
        : null,
    progressPercent:
      clampPercent(input.progressPercent),
    updatedAt:
      cleanText(input.updatedAt) ||
      new Date().toISOString(),
  });
}

export function writeIntelliTextProgress({
  storage,
  record,
} = {}) {
  if (
    !storage ||
    typeof storage.setItem !== "function"
  ) {
    return false;
  }

  const normalized =
    createIntelliTextProgressRecord(record);
  const key =
    buildIntelliTextProgressKey(
      normalized
    );

  storage.setItem(
    key,
    JSON.stringify(normalized)
  );

  return true;
}

export function readIntelliTextProgress({
  storage,
  uid,
  textbookId,
  contentVersion,
} = {}) {
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    !cleanText(uid) ||
    !cleanText(textbookId)
  ) {
    return null;
  }

  try {
    const key =
      buildIntelliTextProgressKey({
        uid,
        textbookId,
      });
    const raw = storage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const record =
      createIntelliTextProgressRecord(
        parsed
      );

    if (
      record.uid !== uid ||
      record.textbookId !== textbookId
    ) {
      return null;
    }

    if (
      Number(contentVersion) > 0 &&
      record.contentVersion !==
        Number(contentVersion)
    ) {
      return null;
    }

    return record;
  } catch (error) {
    return null;
  }
}

export function clearIntelliTextProgress({
  storage,
  uid,
  textbookId,
} = {}) {
  if (
    !storage ||
    typeof storage.removeItem !== "function"
  ) {
    return false;
  }

  storage.removeItem(
    buildIntelliTextProgressKey({
      uid,
      textbookId,
    })
  );

  return true;
}

export function resolveContinueReadingSection({
  sections = [],
  progress = null,
} = {}) {
  if (sections.length === 0) {
    return null;
  }

  if (!progress?.sectionId) {
    return sections[0];
  }

  return (
    sections.find(
      (section) =>
        section.sectionId ===
        progress.sectionId
    ) || sections[0]
  );
}
