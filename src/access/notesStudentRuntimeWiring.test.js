const fs = require("fs");
const path = require("path");

const readSource = (relativePath) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    "utf8"
  );

describe(
  "Phase 8A-4 student Notes callable runtime wiring",
  () => {
    test(
      "App imports the student Notes runtime and canonical action",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "buildStudentNotesRuntimeDecision"
        );
        expect(source).toContain(
          "resolveStudentNotesProtectedAsset"
        );
        expect(source).toContain(
          "classifyStudentNotesRuntimeError"
        );
        expect(source).toContain(
          "NOTES_ACTIONS"
        );
      }
    );

    test(
      "App builds the card decision from the live central access profile",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "const buildStudentNoteAccessDecision"
        );
        expect(source).toContain(
          "accessProfile,"
        );
        expect(source).toContain(
          "planCatalog:"
        );
      }
    );

    test(
      "student open resolves through the callable and opens only the server URL",
      () => {
        const source = readSource("src/App.js");
        const start = source.indexOf(
          "const handleNoteAccess = async"
        );
        const end = source.indexOf(
          "const handlePremiumSectionAccess",
          start
        );
        const handler = source.slice(start, end);

        expect(handler).toContain(
          "resolveStudentNotesProtectedAsset"
        );
        expect(handler).toContain(
          "runtimeResult.asset.assetUrl"
        );
        expect(handler).toContain(
          'window.open('
        );
        expect(handler).not.toContain(
          "note.pdfUrl"
        );
        expect(handler).not.toContain(
          "note.fileUrl"
        );
      }
    );

    test(
      "student open no longer reads protected assets directly from Firestore",
      () => {
        const source = readSource("src/App.js");
        const start = source.indexOf(
          "const handleNoteAccess = async"
        );
        const end = source.indexOf(
          "const handlePremiumSectionAccess",
          start
        );
        const handler = source.slice(start, end);

        expect(handler).not.toContain(
          "readProtectedContentAsset"
        );
        expect(handler).not.toContain(
          "getProtectedContentUrl"
        );
      }
    );

    test(
      "runtime errors fail closed into login, pricing, or retry UX",
      () => {
        const source = readSource("src/App.js");
        const start = source.indexOf(
          "const handleNoteAccess = async"
        );
        const end = source.indexOf(
          "const handlePremiumSectionAccess",
          start
        );
        const handler = source.slice(start, end);

        expect(handler).toContain(
          "classifyStudentNotesRuntimeError"
        );
        expect(handler).toContain(
          'navigate("/login")'
        );
        expect(handler).toContain(
          'navigate("/ctet-tet/pricing")'
        );
        expect(handler).toContain(
          "alert(failure.message)"
        );
      }
    );

    test(
      "chapter route builds and passes an independent decision per note",
      () => {
        const source = readSource(
          "src/components/notes/student/StudentNotesChapterRoute.jsx"
        );

        expect(source).toContain(
          "buildNoteAccessDecision"
        );
        expect(source).toContain(
          "const accessDecision ="
        );
        expect(source).toContain(
          "accessDecision={accessDecision}"
        );
      }
    );

    test(
      "PDF card prefers central decision presentation",
      () => {
        const source = readSource(
          "src/components/notes/student/StudentNoteCards.jsx"
        );

        expect(source).toContain(
          "getStudentNotesAccessPresentation"
        );
        expect(source).toContain(
          "accessDecision"
        );
        expect(source).toContain(
          "presentation.buttonLabel"
        );
        expect(source).toContain(
          "aria-busy={presentation.busy}"
        );
      }
    );

    test(
      "PDF card never reconstructs or directly opens a raw URL",
      () => {
        const source = readSource(
          "src/components/notes/student/StudentNoteCards.jsx"
        );

        expect(source).not.toContain(
          "getNotePdfUrl"
        );
        expect(source).not.toContain(
          "window.open("
        );
        expect(source).not.toContain(
          "pdfUrl,"
        );
        expect(source).not.toContain(
          "fileUrl:"
        );
      }
    );
  }
);
