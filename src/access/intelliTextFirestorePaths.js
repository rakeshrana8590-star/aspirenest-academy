import {
  INTELLITEXT_STUDENT_COLLECTIONS,
} from "./intelliTextConstants";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_COLLECTIONS = Object.freeze({
  ROOT: "learningTexts",
  SECTIONS: "sections",
  AUTHORING_VERSIONS: "authoringVersions",
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

export function buildIntelliTextAuthoringVersionsPath(textbookId) {
  return [
    buildIntelliTextRootPath(textbookId),
    INTELLITEXT_COLLECTIONS.AUTHORING_VERSIONS,
  ].join("/");
}

export function buildIntelliTextAuthoringVersionPath(
  textbookId,
  versionId
) {
  return [
    buildIntelliTextAuthoringVersionsPath(textbookId),
    normalizeIntelliTextId(versionId, "versionId"),
  ].join("/");
}

export function buildIntelliTextAuthoringSectionsPath(
  textbookId,
  versionId
) {
  return [
    buildIntelliTextAuthoringVersionPath(textbookId, versionId),
    INTELLITEXT_COLLECTIONS.SECTIONS,
  ].join("/");
}

export function buildIntelliTextAuthoringSectionPath(
  textbookId,
  versionId,
  sectionId
) {
  return [
    buildIntelliTextAuthoringSectionsPath(textbookId, versionId),
    normalizeIntelliTextId(sectionId, "sectionId"),
  ].join("/");
}

export function buildIntelliTextAuthoringBlocksPath(
  textbookId,
  versionId,
  sectionId
) {
  return [
    buildIntelliTextAuthoringSectionPath(
      textbookId,
      versionId,
      sectionId
    ),
    INTELLITEXT_COLLECTIONS.BLOCKS,
  ].join("/");
}

export function buildIntelliTextAuthoringBlockPath(
  textbookId,
  versionId,
  sectionId,
  blockId
) {
  return [
    buildIntelliTextAuthoringBlocksPath(
      textbookId,
      versionId,
      sectionId
    ),
    normalizeIntelliTextId(blockId, "blockId"),
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
