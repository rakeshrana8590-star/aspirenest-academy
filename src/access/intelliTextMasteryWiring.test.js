import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const app = read("src/App.js");
const formUtils = read("src/components/exam/mockTestFormUtils.js");
const importUtils = read("src/components/exam/mockTestImportUtils.js");
const templates = read("src/components/exam/mockTestTemplateDownloads.js");
const adminAdd = read("src/components/exam/AdminMockTestAddRoute.jsx");
const resultRoute = read("src/components/exam/ExamResultRoute.jsx");
const reviewRoute = read("src/components/exam/ExamReviewRoute.jsx");
const workspace = read(
  "src/components/notes/student/MyStudyWorkspaceRoute.jsx"
);
const nativeReader = read(
  "src/components/notes/student/StudentNativeReaderRoute.jsx"
);
const blockRenderer = read(
  "src/components/notes/student/IntelliTextBlockRenderer.jsx"
);
const contract = read("src/access/intelliTextMasteryContract.js");
const aggregation = read("src/access/intelliTextMasteryAggregation.js");
const client = read("src/access/intelliTextMasteryClient.js");
const conceptContract = read(
  "src/access/mockTestConceptLinkingContract.js"
);
const rules = read("firestore.rules");
const reviewCss = read("src/styles/exam/reviewResult.css");
const readerCss = read(
  "src/styles/notes/student/studentNativeReader.css"
);
const attemptRoute = read("src/components/exam/ExamAttemptRoute.jsx");
const actionPolicy = read("src/access/mockTestActionPolicy.js");
const submitRuntime = read("src/access/mockTestSubmitRuntime.js");
const leaderboardClient = read("src/access/mockTestLeaderboardClient.js");

test("App persists all six question mapping fields", () => {
  [
    "conceptId",
    "conceptLabel",
    "textbookId",
    "sectionId",
    "blockId",
    "contentVersion",
  ].forEach((field) => expect(app).toContain(`${field}: conceptLink?.`));
});

test("App uses strict concept link normalizer before persistence", () => {
  expect(app).toContain("normalizeMockQuestionConceptLink(q");
  expect(app).toContain("allowEmpty: true");
});

test("question form defaults include all six optional fields", () => {
  [
    "conceptId",
    "conceptLabel",
    "textbookId",
    "sectionId",
    "blockId",
    "contentVersion",
  ].forEach((field) => expect(formUtils).toContain(`${field}: ""`));
});

test("edit form restores existing mapping", () => {
  expect(formUtils).toContain("conceptId: question.conceptId");
  expect(formUtils).toContain("contentVersion: question.contentVersion");
});

test("admin builder exposes optional mapping fields", () => {
  expect(adminAdd).toContain("Optional IntelliText concept mapping");
  expect(adminAdd).toContain('label="Concept ID"');
  expect(adminAdd).toContain('label="Content Version"');
});

test("admin mapping instructions enforce all-or-none", () => {
  expect(adminAdd).toContain("Fill all six fields together");
  expect(adminAdd).toContain("Leave all fields blank");
});

test("JSON import preserves mapping after exam normalization", () => {
  expect(importUtils).toContain("preserveMockQuestionConceptLink");
  expect(importUtils).toContain("...normalizeExamQuestion(question)");
});

test("XLSX import reads six optional mapping columns", () => {
  [
    "Concept ID",
    "Concept Label",
    "Textbook ID",
    "Section ID",
    "Block ID",
    "Content Version",
  ].forEach((column) => expect(importUtils).toContain(`row[\"${column}\"]`));
});

test("XLSX template includes all mapping columns", () => {
  expect(templates).toContain('"Concept ID"');
  expect(templates).toContain('"Content Version"');
});

test("CSV template includes all mapping columns", () => {
  expect(templates).toContain('"Textbook ID"');
  expect(templates).toContain('"Block ID"');
});

test("concept contract implements optional all-or-none policy", () => {
  expect(conceptContract).toContain("CONCEPT_LINK_INCOMPLETE");
  expect(conceptContract).toContain("hasCompleteMockQuestionConceptLink");
});

test("exact section route uses the existing native reader route", () => {
  expect(conceptContract).toContain("/ctet-tet/notes/read/");
  expect(conceptContract).toContain('source: "mistake-book"');
});

test("result route sync is additive and failure soft", () => {
  expect(resultRoute).toContain("AutoSyncMockMastery");
  expect(resultRoute).toContain("syncResultLearning");
  expect(resultRoute).toContain("will retry when this owned result is reopened");
});

test("result route evaluates without storing protected question content", () => {
  expect(resultRoute).toContain("createEvaluatedMockQuestion");
  expect(aggregation).not.toMatch(
    /\bquestion\s*:\s*question\.(?:question|text)/
  );
  expect(contract).not.toContain("correctAnswer");
});

test("result sync runs only after result authorization returns exposed", () => {
  expect(resultRoute.indexOf("if (!resultAuthorization.canExposeResult)")).toBeLessThan(
    resultRoute.indexOf("<AutoSyncMockMastery")
  );
});

test("review actions remain behind existing review authorization", () => {
  expect(reviewRoute.indexOf("if (!reviewAuthorization.canExposeAnswers)")).toBeLessThan(
    reviewRoute.indexOf("reviewMasteryActions")
  );
});

test("review route offers exact textbook return only for complete mapping", () => {
  expect(reviewRoute).toContain("hasCompleteMockQuestionConceptLink(question)");
  expect(reviewRoute).toContain("Study exact textbook section");
});

test("review route updates private retry and resolved states", () => {
  expect(reviewRoute).toContain('"RETRIED"');
  expect(reviewRoute).toContain('"RESOLVED"');
  expect(reviewRoute).toContain("updateMistakeState");
});

test("workspace adds exactly three mastery tabs", () => {
  expect(workspace).toContain('["MISTAKE_BOOK"');
  expect(workspace).toContain('["WEAK_CONCEPTS"');
  expect(workspace).toContain('["MASTERY"');
});

test("workspace preserves Phase 8B-6 tabs", () => {
  expect(workspace).toContain('["DUE"');
  expect(workspace).toContain('["FLASHCARDS"');
  expect(workspace).toContain('["REVISION"');
});

test("workspace loads revision and mastery clients together", () => {
  expect(workspace).toContain("Promise.all");
  expect(workspace).toContain("client.loadWorkspace");
  expect(workspace).toContain("masteryClient.loadWorkspace");
});

test("weak concepts are derived without a collection", () => {
  expect(aggregation).toContain("deriveWeakConcepts");
  expect(client).not.toContain('"weakConcepts"');
});

test("mastery weights are reading 30 practice 40 revision 30", () => {
  expect(contract).toContain("PRACTICE: 40");
  expect(contract).toContain("READING: 30");
  expect(contract).toContain("REVISION: 30");
});

test("exam ready thresholds are locked", () => {
  expect(contract).toContain("score >= 85");
  expect(contract).toContain("accuracy >= 80");
  expect(contract).toContain("overdue === 0");
});

test("mistake records omit protected payload fields", () => {
  const recordBlock = contract.slice(
    contract.indexOf("createIntelliTextMistakeRecord"),
    contract.indexOf("createIntelliTextMistakeStateUpdate")
  );
  expect(recordBlock).not.toContain("question:");
  expect(recordBlock).not.toContain("answer:");
  expect(recordBlock).not.toContain("explanation:");
  expect(recordBlock).not.toContain("selectedAnswer:");
});

test("client uses deterministic result and attempt identities", () => {
  expect(client).toContain("buildIntelliTextResultIdentity");
  expect(client).toContain("buildIntelliTextAttemptIdentity");
});

test("client skips an existing deterministic mistake", () => {
  expect(client).toContain("existingMistakeIds");
  expect(client).toContain("idempotentSkipped");
});

test("client has no realtime listener", () => {
  expect(client).not.toMatch(/\bonSnapshot\s*\(/);
  expect(workspace).not.toMatch(/\bonSnapshot\s*\(/);
});

test("mastery system has no Cloud Functions dependency", () => {
  const combined = [contract, aggregation, client, resultRoute].join("\n");
  expect(combined).not.toMatch(/httpsCallable|getFunctions|firebase-functions/);
});

test("native reader parses gated mistake-book query", () => {
  expect(nativeReader).toContain('source !== "mistake-book"');
  expect(nativeReader).toContain("contentVersion !== model?.contentVersion");
  expect(nativeReader).toContain("accessPresentation.canOpen !== true");
});

test("native reader focuses exact stable block", () => {
  expect(nativeReader).toContain("document.getElementById(targetId)");
  expect(nativeReader).toContain("isMistakeBookFocus");
  expect(blockRenderer).toContain("data-intellitext-block-content");
});

test("Firestore rules add owner-only Mistake Book", () => {
  expect(rules).toContain("match /mistakeBook/{mistakeId}");
  expect(rules).toContain("isValidPrivateMistakeCreate");
  expect(rules).toContain("isStudentLearningOwner(uid)");
});

test("Firestore rules add owner-only mastery progress", () => {
  expect(rules).toContain("match /masteryProgress/{masteryId}");
  expect(rules).toContain("isValidPrivateMasteryCreate");
});

test("Firestore rules deny admin private read bypass", () => {
  const studentBlock = rules.slice(
    rules.indexOf("match /studentLearning/{uid}"),
    rules.indexOf("function isUidKeyedUserRequest")
  );
  expect(studentBlock).not.toContain("isAdmin()");
  expect(studentBlock).not.toContain("mentor");
});

test("Firestore records are private-only", () => {
  expect(rules).toContain('data.shareState == "PRIVATE"');
  expect(rules).toContain('request.resource.data.uid == request.auth.uid');
});

test("existing attempt route is not wired to mastery", () => {
  expect(attemptRoute).not.toContain("intelliTextMastery");
  expect(attemptRoute).not.toContain("mistakeBook");
});

test("existing action policy is not wired to mastery", () => {
  expect(actionPolicy).not.toContain("MASTERY");
  expect(actionPolicy).not.toContain("MISTAKE_BOOK");
});

test("existing submit runtime is not wired to mastery", () => {
  expect(submitRuntime).not.toContain("intelliTextMastery");
  expect(submitRuntime).not.toContain("mistakeBook");
});

test("leaderboard client is not wired to mastery", () => {
  expect(leaderboardClient).not.toContain("intelliTextMastery");
  expect(leaderboardClient).not.toContain("mistakeBook");
});

test("CSS includes review mastery actions", () => {
  expect(reviewCss).toContain(".reviewMasteryActions");
  expect(reviewCss).toContain(".reviewMasteryNotice");
});

test("CSS includes responsive mastery workspace and exact focus", () => {
  expect(readerCss).toContain(".intelliTextMistakeBook");
  expect(readerCss).toContain(".intelliTextWeakConceptGrid");
  expect(readerCss).toContain(".intelliTextChapterMasteryGrid");
  expect(readerCss).toContain(".intelliTextBlock.isMistakeBookFocus");
});
