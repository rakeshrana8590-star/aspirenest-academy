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

describe("AspireNest Focused IntelliBook learner contract", () => {
  test("keeps exact Book View and semantic Study View in one reader", () => {
    expect(reader).toContain(">Book View</button>");
    expect(reader).toContain(">Study View</button>");
    expect(reader).toContain("activateStudy");
    expect(reader).toContain("activateBook");
    expect(reader).toContain("currentTextbookId");
  });

  test("implements real fit-page, fit-width and responsive page rendering", () => {
    expect(reader).toContain("scaleForPage");
    expect(reader).toContain("fitWidth");
    expect(reader).toContain("fitHeight");
    expect(reader).toContain("Math.min(fitWidth, fitHeight)");
    expect(reader).toContain("window.visualViewport?.height");
    expect(reader).toContain("ResizeObserver");
    expect(styles).toContain("--intellibook-viewport-height");
    expect(styles).toContain("height: var(--intellibook-viewport-height)");
  });

  test("supports page, scroll, spread, large edge arrows, keyboard, touch, search and download", () => {
    [
      "Continuous scroll",
      "Single page",
      "Book spread",
      "Search this book",
      "Download PDF",
      "intelliBookEdgeNav--previous",
      "intelliBookEdgeNav--next",
      "ArrowLeft",
      "ArrowRight",
      "PageUp",
      "PageDown",
      "touchstart",
      "touchend",
      "fit-page",
      "fit-width",
      "zoom-in",
      "zoom-out",
    ].forEach((marker) => expect(reader).toContain(marker));
    expect(styles).toContain(".intelliBookEdgeNav");
    expect(styles).toContain(".intelliBookMobileNav");
  });

  test("keeps every founder-approved study action and handles it directly in Book View", () => {
    expect(reader).toContain("const STUDY_ACTIONS = new Set");
    expect(reader).toContain("handleBookStudyAction");
    expect(reader).toContain("api.capture");
    expect(reader).toContain("await api.create(action");
    ["highlight", "underline", "note", "doubt", "bookmark", "flashcard", "revision"].forEach(
      (action) => expect(reader).toContain(`'${action}'`)
    );
    expect(styles).toContain(".intelliBookStudyToolbar");
    expect(styles).toContain(".intelliBookStudyPanel");
  });

  test("retains exact PDF page visuals, selectable text and private annotations", () => {
    expect(reader).toContain("page.render({");
    expect(reader).toContain("getTextContentCompat");
    expect(reader).toContain("streamTextContent(options).getReader()");
    expect(reader).toContain('data-intellitext-block="true"');
    expect(reader).toContain("api.applyAnnotations");
    expect(reader).toContain("loadWorkspace(book.textbookId)");
    expect(styles).toContain(".intelliBookPageSurface canvas");
    expect(styles).toContain(".intelliBookTextLayer");
  });
});
