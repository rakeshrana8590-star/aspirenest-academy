import {
  INTELLITEXT_ACCESS_SCOPE_TYPES,
  INTELLITEXT_BLOCK_TYPES,
  INTELLITEXT_DELIVERY_MODES,
  INTELLITEXT_MIGRATION_STATES,
  INTELLITEXT_PUBLICATION_STATES,
  INTELLITEXT_RETIREMENT_GATES,
  INTELLITEXT_SCHEMA_VERSION,
  INTELLITEXT_SPARK_LIMITS,
  INTELLITEXT_STUDENT_COLLECTIONS,
} from "./intelliTextConstants";

describe("IntelliText constants", () => {
  test("locks schema version one", () => {
    expect(INTELLITEXT_SCHEMA_VERSION).toBe(1);
  });

  test("supports legacy PDF and native text coexistence", () => {
    expect(INTELLITEXT_DELIVERY_MODES).toEqual({
      LEGACY_PDF: "LEGACY_PDF",
      NATIVE_TEXT: "NATIVE_TEXT",
    });
  });

  test("locks the publication lifecycle", () => {
    expect(Object.values(INTELLITEXT_PUBLICATION_STATES)).toEqual([
      "ARCHIVED",
      "DRAFT",
      "PUBLISHED",
    ]);
  });

  test("locks the gradual migration lifecycle", () => {
    expect(Object.values(INTELLITEXT_MIGRATION_STATES)).toEqual([
      "CONVERTED",
      "IN_PROGRESS",
      "NOT_STARTED",
      "READY_FOR_REVIEW",
      "RETIRED",
    ]);
  });

  test("matches existing Access Engine scope types", () => {
    expect(Object.values(INTELLITEXT_ACCESS_SCOPE_TYPES)).toEqual([
      "BUNDLE",
      "ITEM",
      "MODULE",
      "PLAN",
    ]);
  });

  test("includes approved premium textbook block types", () => {
    expect(INTELLITEXT_BLOCK_TYPES).toEqual(
      expect.arrayContaining([
        "DEFINITION",
        "EXAM_POINT",
        "FORMULA",
        "HEADING",
        "MCQ",
        "MENTOR_TIP",
        "PARAGRAPH",
        "REVISION_BOX",
        "SUMMARY",
        "TABLE",
      ])
    );
  });

  test("prepares private student workspace collections", () => {
    expect(INTELLITEXT_STUDENT_COLLECTIONS).toEqual([
      "annotations",
      "bookmarks",
      "flashcards",
      "mastery",
      "mistakes",
      "readingProgress",
      "revisionQueue",
    ]);
  });

  test("requires every per-note PDF retirement gate", () => {
    expect(INTELLITEXT_RETIREMENT_GATES).toEqual([
      "accessVerified",
      "annotationVerified",
      "founderApproved",
      "nativeReady",
      "readerVerified",
      "rollbackReady",
      "studentTested",
    ]);
  });

  test("locks bounded Spark read limits", () => {
    expect(INTELLITEXT_SPARK_LIMITS).toMatchObject({
      MAX_BLOCK_PAGE_SIZE: 50,
      MAX_PRELOADED_SECTIONS: 1,
      MAX_SECTION_PAGE_SIZE: 10,
      MIN_PROGRESS_WRITE_DEBOUNCE_MS: 5000,
    });
  });

  test("exports immutable collections and limits", () => {
    expect(Object.isFrozen(INTELLITEXT_BLOCK_TYPES)).toBe(true);
    expect(Object.isFrozen(INTELLITEXT_SPARK_LIMITS)).toBe(true);
    expect(Object.isFrozen(INTELLITEXT_STUDENT_COLLECTIONS)).toBe(true);
  });
});
