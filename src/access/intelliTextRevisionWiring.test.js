import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const app = read("src/App.js");
const studentIndex = read("src/components/notes/student/index.js");
const notesLibrary = read(
  "src/components/notes/student/StudentNotesLibraryRoute.jsx"
);
const readerWorkspace = read(
  "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
);
const workspaceRoute = read(
  "src/components/notes/student/MyStudyWorkspaceRoute.jsx"
);
const flashcardReview = read(
  "src/components/notes/student/IntelliTextFlashcardReview.jsx"
);
const revisionQueue = read(
  "src/components/notes/student/IntelliTextRevisionQueue.jsx"
);
const contract = read("src/access/intelliTextRevisionContract.js");
const scheduler = read("src/access/intelliTextRevisionScheduler.js");
const client = read("src/access/intelliTextRevisionClient.js");
const css = read(
  "src/styles/notes/student/studentNativeReader.css"
);
const rules = read("firestore.rules");
const nativeReader = read(
  "src/components/notes/student/StudentNativeReaderRoute.jsx"
);
const notesRuntime = read("src/access/notesStudentAssetRuntime.js");
const authoringRoute = read(
  "src/components/notes/admin/AdminIntelliTextAuthoringRoute.jsx"
);

test("App imports My Study Workspace route", () => {
  expect(app).toContain("MyStudyWorkspaceRoute");
});

test("App wires exact My Study Workspace path", () => {
  expect(app).toContain('path="/ctet-tet/notes/my-study-workspace"');
});

test("App passes authenticated user into workspace route", () => {
  expect(app).toMatch(/<MyStudyWorkspaceRoute\s+user=\{user\}/);
});

test("student notes index exports My Study Workspace route", () => {
  expect(studentIndex).toContain(
    'export { default as MyStudyWorkspaceRoute } from "./MyStudyWorkspaceRoute";'
  );
});

test("Notes library exposes My Study Workspace entry", () => {
  expect(notesLibrary).toContain("Open My Study Workspace");
  expect(notesLibrary).toContain(
    'navigate("/ctet-tet/notes/my-study-workspace")'
  );
});

test("reader selection toolbar exposes Create Flashcard", () => {
  expect(readerWorkspace).toContain("Create Flashcard");
  expect(readerWorkspace).toContain("createFlashcardFromSelection");
});

test("reader selection toolbar exposes Add to Revision", () => {
  expect(readerWorkspace).toContain("Add to Revision");
  expect(readerWorkspace).toContain("addSelectionToRevision");
});

test("selection actions preserve captured version-aware identity", () => {
  expect(readerWorkspace).toContain("...selectionCandidate");
  expect(readerWorkspace).toContain("selectionAnchor?.exactText");
});

test("Create Flashcard uses explicit two-record client action", () => {
  expect(readerWorkspace).toContain(
    "revisionClient.createFlashcardFromSelection"
  );
  expect(client).toContain("writes: 2");
});

test("Add to Revision uses one-write client action", () => {
  expect(readerWorkspace).toContain(
    "revisionClient.addSelectionToRevision"
  );
  expect(client).toContain("writes: 1");
});

test("flashcard creation uses Firestore batch", () => {
  expect(client).toContain("firestoreApi.writeBatch");
  expect(client).toContain("batch.set(flashcardReference, flashcard)");
  expect(client).toContain("batch.set(revisionReference, revisionItem)");
});

test("revision scheduler requires explicit now", () => {
  expect(scheduler).toContain("normalizeIntelliTextRevisionNow(now)");
  expect(client).toContain("EXPLICIT_NOW_REQUIRED");
});

test("client time is never wired into access decision", () => {
  expect(client).not.toContain("buildNoteAccessDecision");
  expect(scheduler).not.toContain("entitlement");
  expect(scheduler).not.toContain("accessUntil");
});

test("active recall hides answer until reveal", () => {
  expect(flashcardReview).toContain("answerVisible");
  expect(flashcardReview).toContain("Reveal answer");
  expect(flashcardReview).toMatch(
    /answerVisible \? \([\s\S]*intelliTextRecallAnswer/
  );
});

test("active recall exposes AGAIN HARD GOOD EASY ratings", () => {
  expect(flashcardReview).toContain("INTELLITEXT_RECALL_RATINGS");
  expect(contract).toContain('AGAIN: "AGAIN"');
  expect(contract).toContain('HARD: "HARD"');
  expect(contract).toContain('GOOD: "GOOD"');
  expect(contract).toContain('EASY: "EASY"');
});

test("review action updates queue and not flashcard content", () => {
  const reviewMethod = client.slice(
    client.indexOf("async reviewRevisionItem"),
    client.indexOf("async deleteFlashcard")
  );
  expect(reviewMethod).toContain('"revisionQueue"');
  expect(reviewMethod).not.toContain('"flashcards"');
  expect(reviewMethod).not.toContain("prompt:");
  expect(reviewMethod).not.toContain("answer:");
});

test("workspace has DUE FLASHCARDS REVISION tabs", () => {
  expect(workspaceRoute).toContain('["DUE"');
  expect(workspaceRoute).toContain('["FLASHCARDS"');
  expect(workspaceRoute).toContain('["REVISION"');
});

test("workspace loads only private flashcard and revision collections", () => {
  expect(client).toContain('collectionName: "flashcards"');
  expect(client).toContain('collectionName: "revisionQueue"');
  expect(workspaceRoute).not.toContain("loadPublishedTextbook");
});

test("source open returns through existing native reader route", () => {
  expect(workspaceRoute).toContain(
    "/ctet-tet/notes/read/${encodeURIComponent(item.textbookId)}"
  );
  expect(nativeReader).toContain("buildNoteAccessDecision");
  expect(nativeReader).toContain("accessPresentation.canOpen !== true");
});

test("expired source access remains fail closed in native reader", () => {
  expect(nativeReader.indexOf("accessPresentation.canOpen !== true")).toBeLessThan(
    nativeReader.indexOf("return (", nativeReader.indexOf("model?.ready"))
  );
});

test("revision client contains no realtime listener invocation", () => {
  expect(client).not.toMatch(/\bonSnapshot\s*\(/);
  expect(readerWorkspace).not.toMatch(/\bonSnapshot\s*\(/);
  expect(workspaceRoute).not.toMatch(/\bonSnapshot\s*\(/);
});

test("revision engine contains no Cloud Functions dependency", () => {
  const combined = [client, scheduler, contract, workspaceRoute].join("\n");
  expect(combined).not.toMatch(/httpsCallable|getFunctions|firebase-functions/);
});

test("Firestore rules add owner-only flashcard collection", () => {
  expect(rules).toContain("match /flashcards/{flashcardId}");
  expect(rules).toContain("isValidPrivateFlashcardCreate");
  expect(rules).toContain("isStudentLearningOwner(uid)");
});

test("Firestore rules add owner-only revision queue", () => {
  expect(rules).toContain("match /revisionQueue/{revisionId}");
  expect(rules).toContain("isValidPrivateRevisionCreate");
  expect(rules).toContain("isValidPrivateRevisionReviewUpdate");
});

test("Firestore rules do not add admin private-read bypass", () => {
  const studentLearningBlock = rules.slice(
    rules.indexOf("match /studentLearning/{uid}"),
    rules.indexOf("function isUidKeyedUserRequest")
  );
  expect(studentLearningBlock).not.toContain("isAdmin()");
  expect(studentLearningBlock).not.toContain("mentor");
});

test("rules require atomic flashcard queue pair", () => {
  expect(rules).toContain("hasPairedFlashcardRevisionAfter");
  expect(rules).toContain("hasPairedFlashcardAfter");
  expect(rules).toContain("existsAfter");
  expect(rules).toContain("getAfter");
});

test("legacy PDF fallback remains unchanged", () => {
  expect(notesRuntime).toContain('buttonLabel: "Open PDF"');
  expect(nativeReader).toContain(
    "The existing PDF inventory remains unchanged."
  );
});

test("admin authoring studio remains present", () => {
  expect(authoringRoute).toContain("IntelliTextAuthoringStudio");
  expect(app).toContain("AdminIntelliTextAuthoringRoute");
});

test("existing annotation and bookmark actions remain present", () => {
  expect(readerWorkspace).toContain("client.createAnnotation");
  expect(readerWorkspace).toContain("client.createBookmark");
  expect(readerWorkspace).toContain("client.deleteAnnotation");
  expect(readerWorkspace).toContain("client.deleteBookmark");
});

test("CSS includes responsive revision workspace", () => {
  expect(css).toContain(".intelliTextRevisionWorkspacePage");
  expect(css).toContain(".intelliTextFlashcardReview");
  expect(css).toContain(".intelliTextRevisionList");
  expect(css).toContain("@media (max-width: 760px)");
});

test("manual flashcard composer remains private", () => {
  expect(workspaceRoute).toContain("PRIVATE FLASHCARD");
  expect(workspaceRoute).toContain("createManualFlashcard");
  expect(contract).toContain('PRIVATE: "PRIVATE"');
});

test("revision queue supports pause resume and delete", () => {
  expect(revisionQueue).toContain('onStateChange?.(item, "PAUSED")');
  expect(revisionQueue).toContain('onStateChange?.(item, "ACTIVE")');
  expect(revisionQueue).toContain("onDelete?.(item)");
});
