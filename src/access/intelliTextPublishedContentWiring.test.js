const fs = require("fs");
const path = require("path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const route = read("src/components/notes/student/StudentNativeReaderRoute.jsx");
const client = read("src/access/intelliTextPublishedContentClient.js");
const contract = read("src/access/intelliTextAuthoringContract.js");
const rules = read("firestore.rules");
const app = read("src/App.js");

test("student route retains the existing READ decision", () => {
  expect(route).toContain("NOTES_ACTIONS.READ");
  expect(route).toContain("accessPresentation.canOpen");
});

test("published graph fetch occurs only after the existing access decision", () => {
  expect(route).toMatch(/accessPresentation\.canOpen !== true[\s\S]*return;/);
  expect(route).toContain("loadPublishedTextbook");
});

test("student route preserves the inline native pilot fallback", () => {
  expect(route).toContain("inlineModel");
  expect(route).toContain("publishedModel");
});

test("published client reads root then ordered sections and blocks", () => {
  expect(client).toContain("buildIntelliTextRootPath");
  expect(client).toContain("buildIntelliTextSectionsPath");
  expect(client).toContain("buildIntelliTextBlocksPath");
  expect(client).toContain('orderBy("order", "asc")');
});

test("published client has no realtime listeners", () => {
  expect(client).not.toMatch(/\bonSnapshot\s*\(/);
});

test("published client has no Cloud Functions dependency", () => {
  expect(client).not.toMatch(/firebase\/functions|httpsCallable|getFunctions\(/);
});

test("published client enforces published native ready root", () => {
  expect(client).toContain('root.publicationState !== "PUBLISHED"');
  expect(client).toContain("root.nativeReady !== true");
  expect(client).toContain('root.deliveryMode !== "NATIVE_TEXT"');
});

test("published body is sourced from learningTexts rather than contentItems", () => {
  expect(client).not.toContain("contentItems");
  expect(contract).toContain("buildIntelliTextCanonicalContentPatch");
  expect(contract).toContain("createIntelliTextPublishedSection");
  expect(contract).toContain("createIntelliTextPublishedBlock");
});

test("student route remains on the existing canonical route", () => {
  expect(app).toContain('path="/ctet-tet/notes/read/:textbookId"');
  expect(app).toContain("StudentNativeReaderRoute");
});

test("rules deny draft graph to students", () => {
  expect(rules).toContain("DIRECT_STUDENT_DRAFT_READ=DENIED");
});
