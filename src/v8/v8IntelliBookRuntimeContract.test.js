import fs from "fs";
import path from "path";

const reader = fs.readFileSync(
  path.join(process.cwd(), "public/learning-drive-v8/intellibook.js"),
  "utf8"
);
const styles = fs.readFileSync(
  path.join(process.cwd(), "public/learning-drive-v8/intellibook.css"),
  "utf8"
);

describe("AspireNest IntelliBook learner contract", () => {
  test("keeps exact Book View and semantic Study View in one reader", () => {
    expect(reader).toContain(">Book View</button>");
    expect(reader).toContain(">Study View</button>");
    expect(reader).toContain("activateStudy");
    expect(reader).toContain("activateBook");
    expect(reader).toContain("currentTextbookId");
  });

  test("supports phone, page, spread, search, zoom and download", () => {
    [
      "Continuous Scroll",
      "Single page",
      "Book spread",
      "Search this book",
      "Download PDF",
      "ArrowLeft",
      "ArrowRight",
      "touchstart",
      "zoom-in",
      "zoom-out",
    ].forEach((marker) => expect(reader).toContain(marker));
    expect(styles).toContain("@media (max-width: 640px)");
    expect(styles).toContain(".intelliBookPages.is-spread");
  });

  test("makes PDF text selectable and reuses private IntelliText actions", () => {
    expect(reader).toContain('data-intellitext-block="true"');
    expect(reader).toContain("pdf-page-${pageNumber}-text");
    expect(reader).toContain("api.applyAnnotations");
    expect(reader).toContain("loadWorkspace(book.textbookId)");
    ["highlight", "underline", "note", "doubt", "flashcard", "revision", "bookmark"].forEach(
      (action) => expect(reader).toContain(action)
    );
  });

  test("retains exact page visuals as the visual truth", () => {
    expect(reader).toContain("page.render({");
    expect(reader).toContain("getTextContentCompat");
    expect(reader).toContain("streamTextContent(options).getReader()");
    expect(reader).toContain("intelliBookTextLayer");
    expect(styles).toContain(".intelliBookPageSurface canvas");
    expect(styles).toContain(".intelliBookTextLayer");
  });
});
