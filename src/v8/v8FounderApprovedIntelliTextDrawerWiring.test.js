import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Founder-approved IntelliText drawer wiring", () => {
  const index = read("src/index.js");
  const app = read("public/app.js");
  const styles = read("public/styles.css");
  const bootstrap = read("public/v8-route-bootstrap.js");
  const roleRuntime = read("src/v8/v8RoleRuntime.js");
  const runtime = read("src/v8/v8IntelliTextDrawerRuntime.js");
  const publicIndex = read("public/index.html");

  test("removes the rejected standalone full-page reader from the active bundle", () => {
    expect(index).not.toContain('import "./intelliTextStudentReaderEntry";');
    expect(index).toContain('import "./v8/v8IntelliTextDrawerRuntime";');
    expect(app).not.toContain("aspirenestIntelliTextStudentReaderRoot");
  });

  test("proves public/app.js is the active integrated Student shell", () => {
    expect(publicIndex).toContain('<script src="/app.js" defer></script>');
    expect(publicIndex).toContain('<link rel="stylesheet" href="/styles.css" />');
  });

  test("opens canonical deep links in Learning Notes with the approved drawer", () => {
    expect(bootstrap).toContain('hash = `#learning/reader/${studentReaderId}`;');
    expect(roleRuntime).toContain("isV8StudentReaderPath(activePath)");
    expect(app).toContain("FOUNDER_APPROVED_INTELLITEXT_DRAWER");
    expect(app).toContain("renderIntelliTextReader(state.readerResourceId)");
    expect(app).toContain("runtime.load(id)");
  });

  test("keeps one approved UI with side panel and full screen choices", () => {
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
      "Contents",
    ].forEach((label) => expect(app).toContain(label));
    expect(styles).toContain('[data-intellitext-mode="side"]');
    expect(styles).toContain('[data-intellitext-mode="full"]');
    expect(app).toContain("aspirenest:intellitext:reader-mode:v1");
  });

  test("preserves exact published identity and real private study clients", () => {
    expect(app).toContain('data-intellitext-block="true"');
    expect(app).toContain('data-textbook-id=');
    expect(app).toContain('data-section-id=');
    expect(app).toContain('data-block-id=');
    expect(app).toContain('runtime.capture');
    expect(app).toContain('runtime.create(action, input)');
    expect(app).toContain("runtime.loadWorkspace");
    expect(app).toContain("runtime.applyAnnotations");
    expect(runtime).toContain("createIntelliTextStudyWorkspaceClient");
    expect(runtime).toContain("createIntelliTextRevisionClient");
    expect(runtime).toContain("applyIntelliTextAnnotationDecorations");
  });

  test("keeps entitled Student access fail-closed and Admin review available", () => {
    expect(app).toContain("isAdminReviewSession");
    expect(app).toContain("!isAdminReviewSession() && r.state === 'locked'");
    expect(app).toContain("!isAdminReviewSession() && (r.state === 'locked' || r.state === 'expired')");
  });

  test("publishes browser-auditable section, block and content-version identity", () => {
    expect(app).toContain("intellitextSectionCount");
    expect(app).toContain("intellitextBlockCount");
    expect(app).toContain("intellitextContentVersion");
  });
});
