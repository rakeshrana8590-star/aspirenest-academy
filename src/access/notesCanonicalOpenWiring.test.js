import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("P14 G17 C2 V3 canonical Notes opening and IntelliText migration wiring", () => {
  test("the approved V8 shell receives real contentItems Notes", () => {
    const app = read("src/App.js");
    const runtime = read("src/learningDrive/V8LearningDriveRuntime.jsx");
    const model = read("src/learningDrive/v8RealNotesRuntimeModel.js");

    expect(app).toContain("universalContent={universalContent}");
    expect(app).toContain("buildNoteAccessDecision={buildStudentNoteAccessDecision}");
    expect(runtime).toContain("realNotes: realNotesRuntime.resources");
    expect(runtime).toContain("__aspirenestOpenCanonicalResource");
    expect(model).toContain("getPublishedNotes(contentItems)");
    expect(model).toContain("buildCanonicalNoteReaderRoute(note)");
  });

  test("the current cumulative V8 asset merges real Notes without replacing live non-Note modules", () => {
    const v8 = read("public/learning-drive-v8/app.js");

    expect(v8).toContain("integratedNotesEnabled");
    expect(v8).toContain("mergeIntegratedResources");
    expect(v8).toContain("integratedMockTestsEnabled");
    expect(v8).toContain("runtimeRealMockTests");
    expect(v8).toContain("liveResources.filter((item) => item.type !== 'note')");
    expect(v8).toContain("window.__aspirenestOpenCanonicalResource");
    expect(v8).toContain("runtimeContext.realNotes");
    expect(v8).not.toContain("note-piaget");
  });

  test("new Notes are canonical drafts and cannot publish before IntelliText", () => {
    const app = read("src/App.js");

    expect(app).toContain('deliveryMode: "NATIVE_TEXT"');
    expect(app).toContain('nativeReady: false');
    expect(app).toContain('publicationState: "DRAFT"');
    expect(app).toContain('migrationState: "AUTHORING_REQUIRED"');
    expect(app).toContain("Create Note & Open IntelliText Studio");
    expect(app).toContain("createdIntelliTextNoteId = notesRef.id");
    expect(app).toContain("/admin/content/notes/intellitext/${encodeURIComponent(");
    expect(app).toContain("createdIntelliTextNoteId");
  });

  test("publishing IntelliText makes the same canonical Note student-visible", () => {
    const contract = read("src/access/intelliTextAuthoringContract.js");

    expect(contract).toContain('status: "Published"');
    expect(contract).toContain('migrationState: "PUBLISHED"');
    expect(contract).toContain("/ctet-tet/notes/read/${encodeURIComponent(");
    expect(contract).toContain("nativeReady: true");
  });

  test("native READ and legacy rollback OPEN use the same central access builder", () => {
    const policy = read("src/access/notesActionPolicy.js");
    const runtime = read("src/learningDrive/v8RealNotesRuntimeModel.js");

    expect(policy).toContain("NATIVE_CONTENT_REQUIRED");
    expect(policy).toContain("const isNativeRead");
    expect(runtime).toContain("NOTES_ACTIONS.READ");
    expect(runtime).toContain("NOTES_ACTIONS.OPEN");
    expect(runtime).toContain("buildNoteAccessDecision(note, action)");
  });
});
