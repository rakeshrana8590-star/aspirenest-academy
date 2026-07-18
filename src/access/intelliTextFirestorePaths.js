import {
  INTELLITEXT_STUDENT_COLLECTIONS,
} from "./intelliTextConstants";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_COLLECTIONS = Object.freeze({
  ROOT: "learningTexts",
  SECTIONS: "sections",
  BLOCKS: "blocks",
  STUDENT_ROOT: "studentLearning",
});

function normalizeStudentCollection(value) {
  const normalized = String(value ?? "").trim();

  if (!INTELLITEXT_STUDENT_COLLECTIONS.includes(normalized)) {
    throw new Error(
      `Unsupported student learning collection: ${normalized || "(empty)"}`
    );
  }

  return normalized;
}

export function buildIntelliTextRootPath(textbookId) {
  return [
    INTELLITEXT_COLLECTIONS.ROOT,
    normalizeIntelliTextId(textbookId, "textbookId"),
  ].join("/");
}

export function buildIntelliTextSectionsPath(textbookId) {
  return [
    buildIntelliTextRootPath(textbookId),
    INTELLITEXT_COLLECTIONS.SECTIONS,
  ].join("/");
}

export function buildIntelliTextSectionPath(
  textbookId,
  sectionId
) {
  return [
    buildIntelliTextSectionsPath(textbookId),
    normalizeIntelliTextId(sectionId, "sectionId"),
  ].join("/");
}

export function buildIntelliTextBlocksPath(
  textbookId,
  sectionId
) {
  return [
    buildIntelliTextSectionPath(textbookId, sectionId),
    INTELLITEXT_COLLECTIONS.BLOCKS,
  ].join("/");
}

export function buildIntelliTextBlockPath(
  textbookId,
  sectionId,
  blockId
) {
  return [
    buildIntelliTextBlocksPath(textbookId, sectionId),
    normalizeIntelliTextId(blockId, "blockId"),
  ].join("/");
}

export function buildStudentLearningRootPath(uid) {
  return [
    INTELLITEXT_COLLECTIONS.STUDENT_ROOT,
    normalizeIntelliTextId(uid, "uid"),
  ].join("/");
}

export function buildStudentLearningCollectionPath(
  uid,
  collectionName
) {
  return [
    buildStudentLearningRootPath(uid),
    normalizeStudentCollection(collectionName),
  ].join("/");
}

export function buildStudentLearningDocumentPath(
  uid,
  collectionName,
  recordId
) {
  return [
    buildStudentLearningCollectionPath(uid, collectionName),
    normalizeIntelliTextId(recordId, "recordId"),
  ].join("/");
}

export function isOwnerScopedStudentLearningPath(path, uid) {
  const normalizedUid = normalizeIntelliTextId(uid, "uid");
  const prefix = `${INTELLITEXT_COLLECTIONS.STUDENT_ROOT}/${normalizedUid}/`;

  return String(path ?? "").startsWith(prefix);
}
