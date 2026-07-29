import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("AspireNest IntelliBook production wiring", () => {
  const model = read("src/learningDrive/v8ShadowRuntimeModel.js");
  const runtime = read("src/v8/v8IntelliTextDrawerRuntime.js");
  const rootIndex = read("public/index.html");
  const rootReader = read("public/intellibook.js");
  const shadowReader = read("public/learning-drive-v8/intellibook.js");
  const serviceWorker = read("public/sw.js");
  const storageRules = read("storage.rules");

  test("loads the same IntelliBook extension in root and Shadow DOM surfaces", () => {
    expect(model).toContain("`${V8_ASSET_BASE}/intellibook.css`");
    expect(model).toContain("`${V8_ASSET_BASE}/intellibook.js`");
    expect(rootIndex).toContain('<link rel="stylesheet" href="/intellibook.css" />');
    expect(rootIndex).toContain('<script src="/intellibook.js" defer></script>');
    expect(rootReader).toContain("P14_G19_M1_INTELLIBOOK_V1");
    expect(shadowReader).toContain("P14_G19_M1_INTELLIBOOK_V1");
    expect(rootReader).toBe(shadowReader);
  });

  test("loads protected PDF bytes inside the app instead of opening a raw viewer route", () => {
    expect(runtime).toContain("async loadIntelliBookDescriptor(textbookId)");
    expect(runtime).toContain("async loadIntelliBook(textbookId, { action");
    expect(runtime).toContain("requestNotesProtectedAsset");
    expect(runtime).toContain("NOTES_ACTIONS.OPEN");
    expect(runtime).toContain("NOTES_ACTIONS.DOWNLOAD");
    expect(runtime).toContain("intelliBookPdfPath");
    expect(runtime).toContain("The protected book asset is not a valid PDF");
    expect(rootReader).not.toContain("drive.google.com");
    expect(rootReader).not.toContain("<iframe");
    expect(rootReader).toContain("pdfjs.getDocument");
    expect(rootReader).toContain("action: 'OPEN'");
    expect(rootReader).toContain("action: 'DOWNLOAD'");
  });

  test("keeps the IntelliBook Storage path admin-only and resolves it through the server", () => {
    expect(storageRules).toContain("match /intellibook/{allPaths=**}");
    expect(storageRules).toContain("allow read, write: if isAdmin();");
    const block = storageRules.slice(
      storageRules.indexOf("match /intellibook/{allPaths=**}"),
      storageRules.indexOf("match /notes/{allPaths=**}")
    );
    expect(block).not.toContain("isSignedIn()");
  });

  test("evicts the old shell and caches the reader engine", () => {
    expect(serviceWorker).toContain("aspirenest-academy-shell-v3-intellibook");
    [
      "/intellibook.css",
      "/intellibook.js",
      "/learning-drive-v8/intellibook.css",
      "/learning-drive-v8/intellibook.js",
      "/vendor/pdfjs/pdf.mjs",
      "/vendor/pdfjs/pdf.worker.mjs",
    ].forEach((asset) => expect(serviceWorker).toContain(asset));
  });
});
