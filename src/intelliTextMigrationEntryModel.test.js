import {
  INTELLITEXT_MIGRATION_PATH,
  isIntelliTextMigrationPath,
  resolveMigrationAdminState,
} from "./intelliTextMigrationEntryModel";

describe("IntelliText migration entry model", () => {
  test("owns only the exact migration path", () => {
    expect(isIntelliTextMigrationPath(INTELLITEXT_MIGRATION_PATH)).toBe(true);
    expect(isIntelliTextMigrationPath(`${INTELLITEXT_MIGRATION_PATH}/`)).toBe(true);
    expect(isIntelliTextMigrationPath("/admin")).toBe(false);
    expect(isIntelliTextMigrationPath("/admin/content/notes")).toBe(false);
  });

  test("requires the authenticated Admin session", () => {
    expect(resolveMigrationAdminState({}).state).toBe("AUTH_LOADING");
    expect(resolveMigrationAdminState({ session: { ready: true, role: "student" } }).state)
      .toBe("ADMIN_REQUIRED");
  });

  test("uses live Admin resources when ready", () => {
    const resource = { id: "note-1", type: "PDF Note", status: "Published" };
    const result = resolveMigrationAdminState({
      session: { ready: true, role: "admin" },
      adminData: { ready: true, resources: [resource], sourceErrors: {} },
    });
    expect(result.state).toBe("READY");
    expect(result.resources).toEqual([resource]);
  });
});
