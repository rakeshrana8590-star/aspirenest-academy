export const INTELLITEXT_SCHEMA_VERSION = 1;

export const INTELLITEXT_RESOURCE_TYPE = "NOTE";

export const INTELLITEXT_DELIVERY_MODES = Object.freeze({
  LEGACY_PDF: "LEGACY_PDF",
  NATIVE_TEXT: "NATIVE_TEXT",
});

export const INTELLITEXT_DELIVERY_RESULTS = Object.freeze({
  LEGACY_PDF: "LEGACY_PDF",
  LEGACY_PDF_FALLBACK: "LEGACY_PDF_FALLBACK",
  NATIVE_TEXT: "NATIVE_TEXT",
  UNAVAILABLE: "UNAVAILABLE",
});

export const INTELLITEXT_PUBLICATION_STATES = Object.freeze({
  ARCHIVED: "ARCHIVED",
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
});

export const INTELLITEXT_MIGRATION_STATES = Object.freeze({
  CONVERTED: "CONVERTED",
  IN_PROGRESS: "IN_PROGRESS",
  NOT_STARTED: "NOT_STARTED",
  READY_FOR_REVIEW: "READY_FOR_REVIEW",
  RETIRED: "RETIRED",
});

export const INTELLITEXT_ACCESS_SCOPE_TYPES = Object.freeze({
  BUNDLE: "BUNDLE",
  ITEM: "ITEM",
  MODULE: "MODULE",
  PLAN: "PLAN",
});

export const INTELLITEXT_BLOCK_TYPES = Object.freeze([
  "BULLET_LIST",
  "COMMON_MISTAKE",
  "COMPARISON",
  "DEFINITION",
  "DIAGRAM",
  "EXAM_POINT",
  "EXAMPLE",
  "FLOWCHART",
  "FORMULA",
  "HEADING",
  "IMAGE",
  "MCQ",
  "MENTOR_TIP",
  "PARAGRAPH",
  "PRACTICE_SET",
  "REVISION_BOX",
  "SUMMARY",
  "TABLE",
  "TIMELINE",
]);

export const INTELLITEXT_STUDENT_COLLECTIONS = Object.freeze([
  "annotations",
  "bookmarks",
  "flashcards",
  "mastery",
  "mistakes",
  "readingProgress",
  "revisionQueue",
]);

export const INTELLITEXT_RETIREMENT_GATES = Object.freeze([
  "accessVerified",
  "annotationVerified",
  "founderApproved",
  "nativeReady",
  "readerVerified",
  "rollbackReady",
  "studentTested",
]);

export const INTELLITEXT_SPARK_LIMITS = Object.freeze({
  DEFAULT_BLOCK_PAGE_SIZE: 25,
  DEFAULT_PROGRESS_WRITE_DEBOUNCE_MS: 15000,
  DEFAULT_SECTION_PAGE_SIZE: 5,
  MAX_BLOCK_PAGE_SIZE: 50,
  MAX_PRELOADED_SECTIONS: 1,
  MAX_SECTION_PAGE_SIZE: 10,
  MIN_PROGRESS_WRITE_DEBOUNCE_MS: 5000,
});
