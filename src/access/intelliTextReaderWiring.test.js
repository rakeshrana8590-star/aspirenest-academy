import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe("Phase 8B-3 Native Reader wiring", () => {
  test("App imports and mounts the native reader route", () => {
    const source = read("src/App.js");

    expect(source).toContain(
      "StudentNativeReaderRoute"
    );
    expect(source).toContain(
      'path="/ctet-tet/notes/read/:textbookId"'
    );
    expect(source).toMatch(
      /buildNoteAccessDecision=\{\s*buildStudentNoteAccessDecision\s*\}/
    );
  });

  test("chapter cards use READ for native delivery", () => {
    const source = read(
      "src/components/notes/student/StudentNotesChapterRoute.jsx"
    );

    expect(source).toContain(
      "NOTES_ACTIONS.READ"
    );
    expect(source).toContain(
      "isNativeIntelliTextNote(note)"
    );
    expect(source).toContain(
      "handleNativeNoteAccess={openNativeNote}"
    );
  });

  test("legacy PDF opening remains wired separately", () => {
    const source = read(
      "src/components/notes/student/StudentNoteCards.jsx"
    );

    expect(source).toContain(
      'typeof handleNoteAccess === "function"'
    );
    expect(source).toContain(
      'typeof handleNativeNoteAccess === "function"'
    );
    expect(source).toContain(
      '"Start Reading"'
    );
    expect(source).toContain(
      '"Open PDF"'
    );
  });

  test("the catalog accepts native or PDF resources", () => {
    const source = read(
      "src/components/notes/shared/notesUtils.js"
    );

    expect(source).toContain(
      "hasReadableNoteContent(item)"
    );
    expect(source).toContain(
      "hasNativeIntelliText(note)"
    );
    expect(source).toContain(
      "hasNotePdf(note)"
    );
  });

  test("the reader uses central READ authorization", () => {
    const source = read(
      "src/components/notes/student/StudentNativeReaderRoute.jsx"
    );

    expect(source).toContain(
      "NOTES_ACTIONS.READ"
    );
    expect(source).toContain(
      "buildNoteAccessDecision"
    );
    expect(source).toContain(
      "accessPresentation.canOpen"
    );
  });

  test("the renderer never uses raw HTML injection", () => {
    const source = read(
      "src/components/notes/student/IntelliTextBlockRenderer.jsx"
    );

    expect(source).not.toContain(
      "dangerouslySetInnerHTML"
    );
    expect(source).not.toContain(
      "innerHTML"
    );
  });

  test("reader source has no raw PDF delivery dependency", () => {
    const files = [
      "src/access/intelliTextReaderModel.js",
      "src/access/intelliTextReaderProgress.js",
      "src/components/notes/student/StudentNativeReaderRoute.jsx",
      "src/components/notes/student/IntelliTextBlockRenderer.jsx",
    ];

    files.forEach((file) => {
      const source = read(file);

      expect(source).not.toContain(
        "pdfUrl"
      );
      expect(source).not.toContain(
        "assetUrl"
      );
      expect(source).not.toContain(
        "window.open"
      );
    });
  });

  test("reader foundation performs no Firestore or callable writes", () => {
    const files = [
      "src/access/intelliTextReaderModel.js",
      "src/access/intelliTextReaderProgress.js",
      "src/components/notes/student/StudentNativeReaderRoute.jsx",
    ];

    files.forEach((file) => {
      const source = read(file);

      expect(source).not.toContain(
        "firebase/firestore"
      );
      expect(source).not.toContain(
        "firebase/functions"
      );
      expect(source).not.toContain(
        "setDoc("
      );
      expect(source).not.toContain(
        "addDoc("
      );
    });
  });

  test("the Notes CSS index imports the reader stylesheet", () => {
    const source = read(
      "src/styles/notes/studentNotes.css"
    );

    expect(source).toContain(
      '@import "./student/studentNativeReader.css";'
    );
  });

  test("Phase 8B-4 study actions are not implemented", () => {
    const source = read(
      "src/components/notes/student/StudentNativeReaderRoute.jsx"
    );

    expect(source).not.toContain(
      "Create Flashcard"
    );
    expect(source).not.toContain(
      "Mark as Doubt"
    );
    expect(source).not.toContain(
      "Save Highlight"
    );
  });
});
