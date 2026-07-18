import {
  INTELLITEXT_ANNOTATION_STATES,
  INTELLITEXT_ANNOTATION_TYPES,
  INTELLITEXT_STUDY_SHARE_STATES,
  createIntelliTextAnnotationRecord,
  createIntelliTextAnnotationUpdate,
  createIntelliTextBookmarkRecord,
  createIntelliTextBookmarkUpdate,
  createIntelliTextStudySelectionAnchor,
} from "./intelliTextStudyWorkspaceContract";

const anchor = () => ({
  exactText: "Learning is active construction.",
  prefix: "Meaning: ",
  suffix: " It is not passive.",
  startOffset: 9,
  endOffset: 41,
});

const annotation = (overrides = {}) => ({
  annotationId: "annotation_1",
  uid: "student_1",
  textbookId: "textbook_1",
  sectionId: "section_1",
  blockId: "block_1",
  contentVersion: 3,
  type: "HIGHLIGHT",
  selectionAnchor: anchor(),
  ...overrides,
});

const bookmark = (overrides = {}) => ({
  bookmarkId: "bookmark_1",
  uid: "student_1",
  textbookId: "textbook_1",
  sectionId: "section_1",
  blockId: "block_1",
  contentVersion: 3,
  ...overrides,
});

describe("Phase 8B-4 Private Study Workspace contract", () => {
  test("creates a highlight annotation", () => {
    expect(
      createIntelliTextAnnotationRecord(annotation())
    ).toMatchObject({
      schemaVersion: 1,
      type: INTELLITEXT_ANNOTATION_TYPES.HIGHLIGHT,
      state: INTELLITEXT_ANNOTATION_STATES.ACTIVE,
      shareState: INTELLITEXT_STUDY_SHARE_STATES.PRIVATE,
      body: "",
    });
  });

  test("creates an underline annotation", () => {
    expect(
      createIntelliTextAnnotationRecord(
        annotation({ type: "underline" })
      ).type
    ).toBe(INTELLITEXT_ANNOTATION_TYPES.UNDERLINE);
  });

  test("requires a body for a private note", () => {
    expect(() =>
      createIntelliTextAnnotationRecord(
        annotation({ type: "NOTE" })
      )
    ).toThrow("NOTE annotations require a body");
  });

  test("requires a body for a doubt", () => {
    expect(() =>
      createIntelliTextAnnotationRecord(
        annotation({ type: "DOUBT" })
      )
    ).toThrow("DOUBT annotations require a body");
  });

  test("creates a private note", () => {
    expect(
      createIntelliTextAnnotationRecord(
        annotation({
          type: "NOTE",
          body: "Connect this with constructivism.",
        })
      ).body
    ).toBe("Connect this with constructivism.");
  });

  test("creates a private doubt", () => {
    expect(
      createIntelliTextAnnotationRecord(
        annotation({
          type: "DOUBT",
          body: "Why is this exception valid?",
        })
      ).type
    ).toBe(INTELLITEXT_ANNOTATION_TYPES.DOUBT);
  });

  test("denies non-private share state", () => {
    expect(() =>
      createIntelliTextAnnotationRecord(
        annotation({ shareState: "SHARED_WITH_MENTOR" })
      )
    ).toThrow("shareState must be one of: PRIVATE");
  });

  test("denies an unsupported annotation type", () => {
    expect(() =>
      createIntelliTextAnnotationRecord(
        annotation({ type: "FLASHCARD" })
      )
    ).toThrow("type must be one of");
  });

  test("denies an empty selection", () => {
    expect(() =>
      createIntelliTextStudySelectionAnchor({
        ...anchor(),
        exactText: "   ",
      })
    ).toThrow("cannot be empty");
  });

  test("denies a reversed selection range", () => {
    expect(() =>
      createIntelliTextStudySelectionAnchor({
        ...anchor(),
        startOffset: 20,
        endOffset: 10,
      })
    ).toThrow("must be greater");
  });

  test("denies selection text over the maximum", () => {
    expect(() =>
      createIntelliTextStudySelectionAnchor({
        ...anchor(),
        exactText: "x".repeat(2001),
        endOffset: 2010,
      })
    ).toThrow("2000 characters or fewer");
  });

  test("denies selection context over the maximum", () => {
    expect(() =>
      createIntelliTextStudySelectionAnchor({
        ...anchor(),
        prefix: "x".repeat(129),
      })
    ).toThrow("128 characters or fewer");
  });

  test("creates an exact-return private bookmark", () => {
    expect(
      createIntelliTextBookmarkRecord(bookmark())
    ).toMatchObject({
      bookmarkId: "bookmark_1",
      sectionId: "section_1",
      blockId: "block_1",
      shareState: "PRIVATE",
    });
  });

  test("trims a bookmark label", () => {
    expect(
      createIntelliTextBookmarkRecord(
        bookmark({ label: "  Key definition  " })
      ).label
    ).toBe("Key definition");
  });

  test("denies a bookmark label over the maximum", () => {
    expect(() =>
      createIntelliTextBookmarkRecord(
        bookmark({ label: "x".repeat(301) })
      )
    ).toThrow("300 characters or fewer");
  });

  test("creates a body-only annotation update", () => {
    expect(
      createIntelliTextAnnotationUpdate({ body: "Updated" })
    ).toMatchObject({ body: "Updated" });
  });

  test("creates a resolved-state update", () => {
    expect(
      createIntelliTextAnnotationUpdate({ state: "RESOLVED" })
        .state
    ).toBe("RESOLVED");
  });

  test("denies an empty annotation update", () => {
    expect(() =>
      createIntelliTextAnnotationUpdate({})
    ).toThrow("require body or state");
  });

  test("creates a bookmark label update", () => {
    expect(
      createIntelliTextBookmarkUpdate({ label: "Return here" })
        .label
    ).toBe("Return here");
  });

  test("denies an empty bookmark update", () => {
    expect(() =>
      createIntelliTextBookmarkUpdate({})
    ).toThrow("require label");
  });
});
