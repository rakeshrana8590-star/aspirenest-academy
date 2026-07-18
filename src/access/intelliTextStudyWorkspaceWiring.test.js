import fs from "fs";

const read = (path) =>
  fs.readFileSync(path, "utf8");

describe("Phase 8B-4 Private Study Workspace wiring", () => {
  test("Native Reader imports the private workspace", () => {
    expect(
      read("src/components/notes/student/StudentNativeReaderRoute.jsx")
    ).toContain('import IntelliTextStudyWorkspace from "./IntelliTextStudyWorkspace"');
  });

  test("Native Reader mounts workspace only in the authorized ready branch", () => {
    const source = read(
      "src/components/notes/student/StudentNativeReaderRoute.jsx"
    );
    expect(source.indexOf("<IntelliTextStudyWorkspace")).toBeGreaterThan(
      source.indexOf("if (!model?.ready)")
    );
  });

  test("Native Reader exposes the existing READ decision before workspace mount", () => {
    const source = read(
      "src/components/notes/student/StudentNativeReaderRoute.jsx"
    );
    expect(source.indexOf("NOTES_ACTIONS.READ")).toBeLessThan(
      source.indexOf("<IntelliTextStudyWorkspace")
    );
  });

  test("Native Reader exposes stable block identity attributes", () => {
    const source = read(
      "src/components/notes/student/StudentNativeReaderRoute.jsx"
    );
    [
      "data-intellitext-block=\"true\"",
      "data-textbook-id={model.textbookId}",
      "data-section-id={activeSection.sectionId}",
      "data-block-id={block.blockId}",
      "data-content-version={model.contentVersion}",
    ].forEach((marker) => expect(source).toContain(marker));
  });

  test("workspace uses the authenticated client without a UID prop", () => {
    const source = read(
      "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
    );
    expect(source).toContain("createIntelliTextStudyWorkspaceClient");
    expect(source).not.toContain("uid=");
  });

  test("workspace captures single-block selections", () => {
    const source = read(
      "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
    );
    expect(source).toContain("captureIntelliTextSelection");
    expect(source).toContain("CROSS_BLOCK_SELECTION_DENIED");
  });

  test("workspace supports all four annotation actions", () => {
    const source = read(
      "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
    );
    ["HIGHLIGHT", "UNDERLINE", "NOTE", "DOUBT"].forEach((type) =>
      expect(source).toContain(type)
    );
  });

  test("workspace includes exact bookmark return", () => {
    const source = read(
      "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
    );
    expect(source).toContain("scrollToBlock");
    expect(source).toContain("bookmark.sectionId");
    expect(source).toContain("bookmark.blockId");
  });

  test("workspace surfaces unresolved anchors", () => {
    const source = read(
      "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
    );
    expect(source).toContain("UNRESOLVED");
    expect(source).toContain("Unresolved anchors");
  });

  test("workspace has no mentor or admin read path", () => {
    const source = read(
      "src/components/notes/student/IntelliTextStudyWorkspace.jsx"
    );
    expect(source).not.toMatch(/mentor|admin/i);
  });

  test("Firestore Rules define only annotations and bookmarks", () => {
    const source = read("firestore.rules");
    expect(source).toContain("match /studentLearning/{uid}");
    expect(source).toContain("match /annotations/{annotationId}");
    expect(source).toContain("match /bookmarks/{bookmarkId}");
    expect(source).not.toContain(
      "match /studentLearning/{uid}/flashcards"
    );
  });

  test("Firestore Rules deny the parent document and require owner UID", () => {
    const source = read("firestore.rules");
    expect(source).toContain("match /studentLearning/{uid}");
    expect(source).toContain("allow read, write: if false;");
    expect(source).toContain("request.auth.uid == uid");
  });

  test("Firestore Rules enforce PRIVATE share state", () => {
    const source = read("firestore.rules");
    expect(source).toContain('data.shareState == "PRIVATE"');
  });

  test("App and package files remain outside the implementation boundary", () => {
    const source = read(
      "src/components/notes/student/StudentNativeReaderRoute.jsx"
    );
    expect(source).toContain("/ctet-tet/notes");
    expect(read("src/App.js")).not.toContain("IntelliTextStudyWorkspace");
    expect(read("package.json")).not.toContain("study-workspace");
  });
});
