import {
  INTELLITEXT_AUTHORING_PATH_PREFIX,
  getIntelliTextAuthoringTextbookId,
  isIntelliTextAuthoringPath,
  resolveAuthoringAdminState,
} from "./intelliTextAuthoringEntryModel";

describe("real V8 IntelliText authoring entry", () => {
  const path = `${INTELLITEXT_AUTHORING_PATH_PREFIX}note_1`;

  test("owns the exact canonical authoring path family", () => {
    expect(isIntelliTextAuthoringPath(path)).toBe(true);
    expect(getIntelliTextAuthoringTextbookId(path)).toBe("note_1");
    expect(isIntelliTextAuthoringPath("/admin/content/notes/migration")).toBe(false);
  });

  test("requires the Admin session", () => {
    expect(resolveAuthoringAdminState({ pathname: path }).state).toBe("AUTH_LOADING");
    expect(
      resolveAuthoringAdminState({
        pathname: path,
        session: { ready: true, role: "student" },
      }).state
    ).toBe("ADMIN_REQUIRED");
  });

  test("resolves the same canonical Note ID from live Admin data", () => {
    const result = resolveAuthoringAdminState({
      pathname: path,
      session: { ready: true, role: "admin" },
      adminData: {
        ready: true,
        resources: [
          { resourceId: "note_1", type: "PDF Note", status: "Published" },
          { resourceId: "ca_1", type: "Current Affairs", status: "Published" },
        ],
      },
    });
    expect(result.state).toBe("READY");
    expect(result.resource.id).toBe("note_1");
  });
});
