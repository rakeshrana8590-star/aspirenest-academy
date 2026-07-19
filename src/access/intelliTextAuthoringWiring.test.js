const fs = require("fs");
const path = require("path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const app = read("src/App.js");
const contract = read("src/access/intelliTextAuthoringContract.js");
const client = read("src/access/intelliTextAuthoringClient.js");
const paths = read("src/access/intelliTextFirestorePaths.js");
const manage = read("src/components/notes/admin/AdminNotesManageRoute.jsx");
const adminRoute = read("src/components/notes/admin/AdminIntelliTextAuthoringRoute.jsx");
const studio = read("src/components/notes/admin/IntelliTextAuthoringStudio.jsx");
const blockEditor = read("src/components/notes/admin/IntelliTextBlockEditor.jsx");
const preview = read("src/components/notes/admin/IntelliTextPreviewPane.jsx");
const rules = read("firestore.rules");

test("admin authoring routes are registered", () => {
  expect(app).toContain('path="/admin/content/notes/intellitext"');
  expect(app).toContain('path="/admin/content/notes/intellitext/:textbookId"');
});

test("admin route remains behind requireAdmin", () => {
  expect(app).toMatch(/path="\/admin\/content\/notes\/intellitext[\s\S]*requireAdmin\(\)/);
});

test("manage route links canonical notes to the studio", () => {
  expect(manage).toContain("Open IntelliText Studio");
  expect(manage).toContain("/admin/content/notes/intellitext/");
});

test("authoring root is learningTexts and versions are nested", () => {
  expect(paths).toContain('AUTHORING_VERSIONS: "authoringVersions"');
  expect(paths).toContain("buildIntelliTextAuthoringVersionPath");
  expect(paths).toContain("buildIntelliTextAuthoringBlockPath");
});

test("contract locks six entitlement IDs and 450 writes", () => {
  expect(contract).toContain("MAX_READ_ENTITLEMENT_IDS: 6");
  expect(contract).toContain("MAX_PUBLISH_BATCH_WRITES: 450");
});

test("contract locks 30 sections and 180 blocks", () => {
  expect(contract).toContain("MAX_SECTIONS_PER_VERSION: 30");
  expect(contract).toContain("MAX_BLOCKS_PER_VERSION: 180");
});

test("contract denies canonical body embedding and raw PDF writes", () => {
  const start = contract.indexOf(
    "export function buildIntelliTextCanonicalContentPatch"
  );
  const end = contract.indexOf(
    "export function createIntelliTextPublishedRoot"
  );
  const canonicalPatchSource = contract.slice(start, end);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  expect(canonicalPatchSource).not.toContain("pdfUrl:");
  expect(canonicalPatchSource).not.toContain("sections:");
});

test("authoring client uses explicit admin identity", () => {
  expect(client).toContain('const ADMIN_EMAIL = "aspirenestplatform@gmail.com"');
  expect(client).toContain("requireAdmin");
});

test("authoring writes use batches and a publish transaction", () => {
  expect(client).toContain("writeBatch");
  expect(client).toContain("runTransaction");
  expect(client).toContain("assertIntelliTextVersionPublishable");
});

test("publish updates canonical content item only after transaction checks", () => {
  expect(client).toContain("CANONICAL_CONTENT_ITEM_MISSING");
  expect(client).toContain("buildIntelliTextCanonicalContentPatch");
  expect(client).toContain("contentItemRef(normalizedTextbookId)");
});

test("studio exposes mobile and desktop preview audit", () => {
  expect(studio).toContain("previewAudit");
  expect(preview).toContain("MOBILE");
  expect(preview).toContain("DESKTOP");
});

test("block editor uses all approved IntelliText block types", () => {
  expect(blockEditor).toContain("INTELLITEXT_BLOCK_TYPES");
  expect(blockEditor).toContain("JSON.stringify");
});

test("admin route requires a canonical content item selection", () => {
  expect(adminRoute).toContain("canonical");
  expect(adminRoute).toContain("universalContent");
});

test("rules contain admin-only draft graph", () => {
  expect(rules).toContain("match /authoringVersions/{versionId}");
  expect(rules).toContain("allow read, write: if isAdmin()");
});

test("rules contain entitlement-aware published reads", () => {
  expect(rules).toContain("hasValidLearningTextEntitlement");
  expect(rules).toContain("isPublishedLearningTextReadable");
  expect(rules).toContain("studentEntitlements");
});

test("authoring implementation has no Cloud Functions coupling", () => {
  const source = [contract, client, studio, adminRoute].join("\n");
  expect(source).not.toMatch(/firebase\/functions|httpsCallable|getFunctions\(/);
});

test("authoring implementation has no realtime listeners", () => {
  const source = [client, studio, adminRoute].join("\n");
  expect(source).not.toMatch(/\bonSnapshot\s*\(/);
});
