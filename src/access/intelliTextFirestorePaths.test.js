import {
  buildIntelliTextBlockPath,
  buildIntelliTextBlocksPath,
  buildIntelliTextRootPath,
  buildIntelliTextSectionPath,
  buildIntelliTextSectionsPath,
  buildStudentLearningCollectionPath,
  buildStudentLearningDocumentPath,
  buildStudentLearningRootPath,
  isOwnerScopedStudentLearningPath,
} from "./intelliTextFirestorePaths";

describe("IntelliText Firestore paths", () => {
  test("builds the canonical textbook root path", () => {
    expect(buildIntelliTextRootPath("note_piaget")).toBe(
      "learningTexts/note_piaget"
    );
  });

  test("builds the sections collection path", () => {
    expect(buildIntelliTextSectionsPath("note_piaget")).toBe(
      "learningTexts/note_piaget/sections"
    );
  });

  test("builds an exact section path", () => {
    expect(
      buildIntelliTextSectionPath(
        "note_piaget",
        "overview"
      )
    ).toBe(
      "learningTexts/note_piaget/sections/overview"
    );
  });

  test("builds the blocks collection path", () => {
    expect(
      buildIntelliTextBlocksPath(
        "note_piaget",
        "overview"
      )
    ).toBe(
      "learningTexts/note_piaget/sections/overview/blocks"
    );
  });

  test("builds an exact immutable block path", () => {
    expect(
      buildIntelliTextBlockPath(
        "note_piaget",
        "overview",
        "definition_01"
      )
    ).toBe(
      "learningTexts/note_piaget/sections/overview/blocks/definition_01"
    );
  });

  test("rejects slash-containing content IDs", () => {
    expect(() =>
      buildIntelliTextBlockPath(
        "note_piaget",
        "overview",
        "definition/01"
      )
    ).toThrow("blockId must use 1-128");
  });

  test("builds the private student-learning root", () => {
    expect(buildStudentLearningRootPath("student_01")).toBe(
      "studentLearning/student_01"
    );
  });

  test("builds an annotations collection path", () => {
    expect(
      buildStudentLearningCollectionPath(
        "student_01",
        "annotations"
      )
    ).toBe(
      "studentLearning/student_01/annotations"
    );
  });

  test("builds an exact private bookmark document path", () => {
    expect(
      buildStudentLearningDocumentPath(
        "student_01",
        "bookmarks",
        "bookmark_01"
      )
    ).toBe(
      "studentLearning/student_01/bookmarks/bookmark_01"
    );
  });

  test("prepares every approved private workspace collection", () => {
    [
      "annotations",
      "bookmarks",
      "flashcards",
      "mastery",
      "mistakes",
      "readingProgress",
      "revisionQueue",
    ].forEach((collectionName) => {
      expect(
        buildStudentLearningCollectionPath(
          "student_01",
          collectionName
        )
      ).toContain(`/${collectionName}`);
    });
  });

  test("rejects unsupported student collections", () => {
    expect(() =>
      buildStudentLearningCollectionPath(
        "student_01",
        "publicNotes"
      )
    ).toThrow("Unsupported student learning collection");
  });

  test("recognizes an owner-scoped path", () => {
    expect(
      isOwnerScopedStudentLearningPath(
        "studentLearning/student_01/annotations/a1",
        "student_01"
      )
    ).toBe(true);
  });

  test("rejects a sibling student's path", () => {
    expect(
      isOwnerScopedStudentLearningPath(
        "studentLearning/student_02/annotations/a1",
        "student_01"
      )
    ).toBe(false);
  });
});
