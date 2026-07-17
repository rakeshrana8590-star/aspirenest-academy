const fs = require("fs");
const path = require("path");

const readSource = (relativePath) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    "utf8"
  );

describe(
  "Phase 8A-2 public-safe Notes metadata wiring",
  () => {
    test(
      "App imports the pure Notes metadata sanitizer",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "buildPublicNotesMetadata"
        );
        expect(source).toContain(
          "sanitizeContentItemsForClient"
        );
        expect(source).toContain(
          'from "./access/notesPublicMetadata"'
        );
      }
    );

    test(
      "Notes CMS writes public-safe metadata instead of the raw payload",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "const publicNotesPayload ="
        );
        expect(source).toContain(
          "buildPublicNotesMetadata(notesPayload)"
        );
        expect(source).toContain(
          "publicNotesPayload"
        );
        expect(source).toContain(
          "buildPublicNotesMetadata({"
        );
      }
    );

    test(
      "Notes CMS records granular ITEM metadata for protected assets",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          'scopeType: "ITEM"'
        );
        expect(source).toContain(
          'module: "notes"'
        );
        expect(source).toContain(
          'itemType: "notesPdf"'
        );
      }
    );

    test(
      "Firestore-loaded Notes are sanitized before universalContent state",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "sanitizeContentItemsForClient("
        );
        expect(source).toContain(
          "setUniversalContent(loadedItems)"
        );
      }
    );

    test(
      "student Notes open has no legacy raw URL fallback",
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
          'let notePdfUrl = ""'
        );
        expect(handler).toContain(
          "readProtectedContentAsset(noteId)"
        );
        expect(handler).not.toContain(
          "note.pdfUrl || note.fileUrl"
        );
        expect(handler).not.toContain(
          "legacy URL fallback"
        );
      }
    );

    test(
      "student PDF cards pass metadata without reconstructing raw URLs",
      () => {
        const source = readSource(
          "src/components/notes/student/StudentNoteCards.jsx"
        );

        expect(source).toContain(
          "const hasProtectedAsset = hasNotePdf(note)"
        );
        expect(source).toContain(
          "handleNoteAccess(safeNote)"
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

    test(
      "safe Notes metadata still counts protected PDFs",
      () => {
        const source = readSource(
          "src/components/notes/shared/notesUtils.js"
        );

        expect(source).toContain(
          "note.hasProtectedAsset === true"
        );
      }
    );

    test(
      "admin edit retrieves the protected URL from the protected collection",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "Admin Notes protected asset could not be loaded:"
        );
        expect(source).toContain(
          "await readProtectedContentAsset(item.id)"
        );
        expect(source).toContain(
          "setNotesCmsPdfUrl(protectedPdfUrl)"
        );
      }
    );
  }
);
