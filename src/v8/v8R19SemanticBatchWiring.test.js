import fs from "fs";
import path from "path";

describe("R19 reader preservation and semantic batch wiring", () => {
  const app = fs.readFileSync(
    path.join(process.cwd(), "public/app.js"),
    "utf8"
  );
  const runtime = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/v8/v8IntelliTextDrawerRuntime.js"
    ),
    "utf8"
  );
  const semantic = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/v8/v8SemanticMigrationCompatibility.js"
    ),
    "utf8"
  );

  test("approved R18 reader UI remains the single renderer", () => {
    [
      "AspireNest IntelliText Reader",
      "Side panel",
      "Full screen",
      "Highlight",
      "Underline",
      "Personal Note",
      "Mark as Doubt",
      "Bookmark",
      "Create Flashcard",
      "Add to Revision",
      "Mark section complete",
      "Save & close",
    ].forEach((label) => expect(app).toContain(label));

    expect(app).toContain("SOURCE_METADATA");
    expect(app).toContain("SOURCE_REFERENCE");
    expect(app).toContain("SEMANTIC_GROUP");
    expect(app).toContain("TABLE_GALLERY");
    expect(app).toContain("SOURCE_REFERENCE_GALLERY");
  });

  test("runtime uses generic semantic compatibility", () => {
    expect(runtime).toContain(
      "normalizeMigratedTextbookForPremiumReader"
    );
    expect(runtime).toContain(
      "./v8SemanticMigrationCompatibility"
    );
    expect(semantic).toContain(
      "FOUNDER_APPROVED_INTELLITEXT_SEMANTIC_V2"
    );
    expect(semantic).toContain(
      "SEMANTIC_TOKEN_FIDELITY_MISMATCH"
    );
    expect(semantic).toContain("TOKEN_MULTISET_EXACT");
    expect(semantic).toContain("STRUCTURAL_TITLE");
  });
});
