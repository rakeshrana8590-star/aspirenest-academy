import {
  ACCESS_BULK_IMPORT_STATUS,
  ACCESS_BULK_ROW_STATUS,
  buildBulkAccessDryRun,
  buildBulkAccessRowId,
  parseBulkAccessInput,
  resolveBulkImportStatus,
  selectResumableBulkAccessRows,
  summarizeBulkAccessRows,
} from "./accessBulkLifecycle";

const grantData = {
  course: "CTET_TET",
  scopeType: "plan",
  planType: "PREMIUM",
  status: "active",
  source: "bulk_import",
};

describe("AspireNest bulk access lifecycle", () => {
  test("parses newline, comma and semicolon input", () => {
    const rows = parseBulkAccessInput(
      "a@example.com, b@example.com;c@example.com"
    );

    expect(rows.map((row) => row.email)).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
  });

  test("extracts an email from a labeled line", () => {
    const [row] = parseBulkAccessInput(
      "Learner One <Student@Example.com>"
    );

    expect(row.email).toBe("student@example.com");
    expect(row.valid).toBe(true);
  });

  test("marks invalid email input", () => {
    const [row] = parseBulkAccessInput("not-an-email");

    expect(row.valid).toBe(false);
  });

  test("marks duplicate input rows", () => {
    const rows = parseBulkAccessInput(
      "student@example.com\nSTUDENT@example.com"
    );

    expect(rows.every((row) => row.duplicateInInput)).toBe(
      true
    );
  });

  test("row id is deterministic", () => {
    const first = buildBulkAccessRowId({
      importId: "bulk-1",
      rowNumber: 2,
      email: "Student@Example.com",
    });
    const second = buildBulkAccessRowId({
      importId: "bulk-1",
      rowNumber: 2,
      email: "student@example.com",
    });

    expect(first).toBe(second);
  });

  test("row id requires import and row number", () => {
    expect(() =>
      buildBulkAccessRowId({
        importId: "",
        rowNumber: 0,
      })
    ).toThrow(
      "Bulk row id requires import id and row number."
    );
  });

  test("dry run identifies ready rows", () => {
    const dryRun = buildBulkAccessDryRun({
      importId: "bulk-1",
      rawEmails: "student@example.com",
      grantData,
      existingRecordsByEmail: {},
    });

    expect(dryRun.processableRows).toHaveLength(1);
    expect(dryRun.rows[0].status).toBe(
      ACCESS_BULK_ROW_STATUS.READY
    );
  });

  test("dry run skips repeated pasted email", () => {
    const dryRun = buildBulkAccessDryRun({
      importId: "bulk-1",
      rawEmails:
        "student@example.com\nstudent@example.com",
      grantData,
    });

    expect(dryRun.rows[0].status).toBe(
      ACCESS_BULK_ROW_STATUS.READY
    );
    expect(dryRun.rows[1].status).toBe(
      ACCESS_BULK_ROW_STATUS.DUPLICATE_INPUT
    );
  });

  test("dry run detects matching logical grant", () => {
    const dryRun = buildBulkAccessDryRun({
      importId: "bulk-1",
      rawEmails: "student@example.com",
      grantData,
      existingRecordsByEmail: {
        "student@example.com": [
          {
            id: "existing-1",
            email: "student@example.com",
            normalizedEmail: "student@example.com",
            scopeType: "plan",
            planType: "PREMIUM",
            course: "CTET_TET",
            status: "active",
          },
        ],
      },
    });

    expect(dryRun.rows[0]).toMatchObject({
      status: ACCESS_BULK_ROW_STATUS.EXISTING_MATCH,
      existingAccessId: "existing-1",
      processable: false,
    });
  });

  test("dry run blocks conflicting uid candidates", () => {
    const dryRun = buildBulkAccessDryRun({
      importId: "bulk-1",
      rawEmails: "student@example.com",
      grantData: {
        ...grantData,
        uid: "uid-1",
      },
      existingRecordsByEmail: {
        "student@example.com": [
          {
            id: "existing-1",
            uid: "uid-2",
            email: "student@example.com",
            normalizedEmail: "student@example.com",
            scopeType: "plan",
            planType: "PREMIUM",
            course: "CTET_TET",
            status: "active",
          },
        ],
      },
    });

    expect(dryRun.rows[0].status).toBe(
      ACCESS_BULK_ROW_STATUS.IDENTITY_CONFLICT
    );
  });

  test("dry run blocks global email identity ambiguity across different targets", () => {
    const dryRun = buildBulkAccessDryRun({
      importId: "bulk-1",
      rawEmails: "student@example.com",
      grantData: {
        ...grantData,
        scopeType: "item",
        module: "notes",
        itemType: "notesPdf",
        itemId: "note-new",
      },
      existingRecordsByEmail: {
        "student@example.com": [
          {
            id: "old-plan-a",
            uid: "uid-a",
            email: "student@example.com",
            normalizedEmail: "student@example.com",
            scopeType: "plan",
            planType: "PREMIUM",
            course: "CTET_TET",
            status: "active",
          },
          {
            id: "old-plan-b",
            uid: "uid-b",
            email: "student@example.com",
            normalizedEmail: "student@example.com",
            scopeType: "plan",
            planType: "BASIC",
            course: "CTET_TET",
            status: "active",
          },
        ],
      },
    });

    expect(dryRun.rows[0].status).toBe(
      ACCESS_BULK_ROW_STATUS.IDENTITY_CONFLICT
    );
  });

  test("dry run enforces the safe row limit", () => {
    expect(() =>
      buildBulkAccessDryRun({
        importId: "bulk-1",
        rawEmails:
          "a@example.com\nb@example.com\nc@example.com",
        grantData,
        maxRows: 2,
      })
    ).toThrow(
      "Bulk import exceeds the safe row limit."
    );
  });

  test("failed and ready rows are resumable", () => {
    const rows = selectResumableBulkAccessRows([
      { status: ACCESS_BULK_ROW_STATUS.READY },
      { status: ACCESS_BULK_ROW_STATUS.FAILED },
      { status: ACCESS_BULK_ROW_STATUS.SUCCEEDED },
    ]);

    expect(rows).toHaveLength(2);
  });

  test("summary counts row outcomes", () => {
    const summary = summarizeBulkAccessRows([
      { status: ACCESS_BULK_ROW_STATUS.SUCCEEDED },
      { status: ACCESS_BULK_ROW_STATUS.FAILED },
      { status: ACCESS_BULK_ROW_STATUS.INVALID },
    ]);

    expect(summary.total).toBe(3);
    expect(summary.counts.succeeded).toBe(1);
    expect(summary.counts.failed).toBe(1);
    expect(summary.counts.invalid).toBe(1);
    expect(summary.hasFailures).toBe(true);
  });

  test("completed import has no remaining rows", () => {
    expect(
      resolveBulkImportStatus([
        { status: ACCESS_BULK_ROW_STATUS.SUCCEEDED },
        { status: ACCESS_BULK_ROW_STATUS.SKIPPED },
      ])
    ).toBe(ACCESS_BULK_IMPORT_STATUS.COMPLETED);
  });

  test("failed rows produce partial import status", () => {
    expect(
      resolveBulkImportStatus([
        { status: ACCESS_BULK_ROW_STATUS.SUCCEEDED },
        { status: ACCESS_BULK_ROW_STATUS.FAILED },
      ])
    ).toBe(ACCESS_BULK_IMPORT_STATUS.PARTIAL);
  });

  test("running row produces running import status", () => {
    expect(
      resolveBulkImportStatus([
        { status: ACCESS_BULK_ROW_STATUS.RUNNING },
      ])
    ).toBe(ACCESS_BULK_IMPORT_STATUS.RUNNING);
  });

  test("ready row produces planned import status", () => {
    expect(
      resolveBulkImportStatus([
        { status: ACCESS_BULK_ROW_STATUS.READY },
      ])
    ).toBe(ACCESS_BULK_IMPORT_STATUS.PLANNED);
  });

  test("empty rows fail closed", () => {
    expect(resolveBulkImportStatus([])).toBe(
      ACCESS_BULK_IMPORT_STATUS.FAILED
    );
  });
});
