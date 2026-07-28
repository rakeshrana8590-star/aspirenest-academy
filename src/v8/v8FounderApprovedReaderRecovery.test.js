const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");
const read = (relative) =>
  fs.readFileSync(path.join(repoRoot, relative), "utf8");

describe("Founder-approved IntelliText recovery", () => {
  const app = read("public/app.js");
  const styles = read("public/styles.css");
  const runtime = read(
    "src/v8/v8IntelliTextDrawerRuntime.js"
  );
  const semanticCompatibility = read(
    "src/v8/v8SemanticMigrationCompatibility.js"
  );

  test("preserves the exact approved smoke-reader language", () => {
    [
      "AspireNest IntelliText Reader",
      "Open • UID-private workspace",
      "Highlight",
      "Underline",
      "Personal Note",
      "Mark as Doubt",
      "Bookmark",
      "Create Flashcard",
      "Add to Revision",
      "Contents",
      "Mark section complete",
      "Save & close",
    ].forEach((label) => expect(app).toContain(label));
  });

  test("keeps side and full as one reader without stretched raw-page presentation", () => {
    expect(app).toContain('data-reader-mode="side"');
    expect(app).toContain('data-reader-mode="full"');
    expect(styles).toContain(
      "width:min(1180px,calc(100% - 40px))"
    );
    expect(styles).toContain(
      "grid-template-columns:210px minmax(0,760px)"
    );
    expect(styles).toContain(
      ".reader-source-reference"
    );
  });

  test("loads every published graph through the generic semantic adapter while preserving the Science adapter", () => {
    expect(runtime).toContain(
      "normalizeMigratedTextbookForPremiumReader"
    );
    expect(runtime).toContain(
      "./v8SemanticMigrationCompatibility"
    );
    expect(runtime).toContain(
      "const published = await publishedClient.loadPublishedTextbook(id)"
    );

    expect(semanticCompatibility).toContain(
      "normalizeScienceMigratedTextbookForPremiumReader"
    );
    expect(semanticCompatibility).toContain(
      "if (science !== published) return science"
    );
    expect(semanticCompatibility).toContain(
      "GENERIC_PDF_SEMANTIC_PRESENTATION_R19"
    );
  });

  test("does not expose original PDF visuals as always-open dominant blocks", () => {
    expect(app).toContain(
      "View original PDF visual reference"
    );
    expect(app).toContain(
      "reader-source-reference"
    );
  });
});
