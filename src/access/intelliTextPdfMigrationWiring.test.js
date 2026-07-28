import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("universal existing and future IntelliText wiring", () => {
  test("Admin exposes the real 48-note structured migration route", () => {
    const app = read("src/App.js");
    const manage = read("src/components/notes/admin/AdminNotesManageRoute.jsx");
    const migration = read("src/components/notes/admin/AdminIntelliTextMigrationRoute.jsx");
    expect(app).toContain('path="/admin/content/notes/migration"');
    expect(manage).toContain("Migrate 48 Notes to IntelliText");
    expect(migration).toContain("readProtectedContentAsset");
    expect(migration).toContain("Prepare verified 48-Note IntelliText bundle");
    expect(migration).toContain("Import all 48 as structured IntelliText drafts");
  });

  test("future Notes remain Native IntelliText-only", () => {
    const app = read("src/App.js");
    expect(app).toContain('targetDeliveryMode: "NATIVE_TEXT"');
    expect(app).toContain('deliveryMode: "NATIVE_TEXT"');
    expect(app).toContain('deliveryType: "NATIVE_TEXT"');
    expect(app).toContain('migrationState: "AUTHORING_REQUIRED"');
    expect(app).toContain("Create Note & Open IntelliText Studio");
  });

  test("migration uses structured sections and never embeds a PDF viewer", () => {
    const route = read("src/components/notes/admin/AdminIntelliTextMigrationRoute.jsx");
    const client = read("src/access/intelliTextPdfMigrationClient.js");
    expect(route).not.toContain("<iframe");
    expect(route).not.toContain("Original Page mode");
    expect(client).toContain("saveDraftVersion");
    expect(client).toContain('targetDeliveryMode: "NATIVE_TEXT"');
  });

  test("protected exact visual references can render inside IntelliText blocks", () => {
    const renderer = read("src/components/notes/student/IntelliTextBlockRenderer.jsx");
    expect(renderer).toContain("isProtectedEmbeddedVisual");
    expect(renderer).toContain("data:image");
    expect(renderer).toContain("850000");
  });
});
