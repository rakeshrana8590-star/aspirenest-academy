import {
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  normalizeAndValidateGrantInput,
} from "./accessGrantContract";
import {
  assertGrantCandidateIdentitySafe,
  findGrantCandidates,
} from "./accessGrantLifecycle";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanValue = (value = "") =>
  String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanValue(value).toLowerCase();

const stableHash = (value = "") => {
  let hash = 2166136261;

  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

export const ACCESS_BULK_ROW_STATUS = Object.freeze({
  INVALID: "invalid",
  DUPLICATE_INPUT: "duplicate_input",
  EXISTING_MATCH: "existing_match",
  IDENTITY_CONFLICT: "identity_conflict",
  READY: "ready",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  SKIPPED: "skipped",
  ROLLED_BACK: "rolled_back",
  ROLLBACK_CONFLICT: "rollback_conflict",
});

export const ACCESS_BULK_IMPORT_STATUS = Object.freeze({
  PLANNED: "planned",
  RUNNING: "running",
  PARTIAL: "partial",
  COMPLETED: "completed",
  FAILED: "failed",
  ROLLING_BACK: "rolling_back",
  ROLLED_BACK: "rolled_back",
  ROLLBACK_PARTIAL: "rollback_partial",
});

export const parseBulkAccessInput = (
  rawEmails = ""
) => {
  const lines = String(rawEmails || "")
    .split(/\r?\n|,|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  const counts = new Map();
  const parsed = lines.map((line, index) => {
    const match = line.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );
    const email = normalizeEmail(
      match ? match[0] : line
    );
    const valid = Boolean(
      email && emailPattern.test(email)
    );

    if (valid) {
      counts.set(email, (counts.get(email) || 0) + 1);
    }

    return {
      rowNumber: index + 1,
      original: line,
      email,
      valid,
    };
  });

  return parsed.map((row) => ({
    ...row,
    duplicateInInput:
      row.valid && (counts.get(row.email) || 0) > 1,
  }));
};

export const buildBulkAccessRowId = ({
  importId = "",
  rowNumber = 0,
  email = "",
} = {}) => {
  const normalizedImportId = cleanValue(importId);
  const normalizedEmail = normalizeEmail(email);
  const normalizedRowNumber = Number(rowNumber);

  if (
    !normalizedImportId ||
    !Number.isInteger(normalizedRowNumber) ||
    normalizedRowNumber < 1
  ) {
    throw new Error(
      "Bulk row id requires import id and row number."
    );
  }

  return [
    normalizedImportId,
    String(normalizedRowNumber).padStart(4, "0"),
    stableHash(normalizedEmail || "invalid"),
  ].join("_");
};

const uniqueRecords = (records = []) => {
  const recordsById = new Map();

  (Array.isArray(records) ? records : [])
    .filter(Boolean)
    .forEach((record) => {
      const id = cleanValue(
        record.id || record.accessId
      );

      if (id && !recordsById.has(id)) {
        recordsById.set(id, record);
      }
    });

  return Array.from(recordsById.values());
};

export const buildBulkAccessDryRun = ({
  importId = "bulk_preview",
  rawEmails = "",
  grantData = {},
  existingRecordsByEmail = {},
  maxRows = 100,
} = {}) => {
  const parsedRows = parseBulkAccessInput(rawEmails);

  if (parsedRows.length > maxRows) {
    throw new Error(
      "Bulk import exceeds the safe row limit."
    );
  }

  const firstRowByEmail = new Map();

  parsedRows.forEach((row) => {
    if (
      row.valid &&
      !firstRowByEmail.has(row.email)
    ) {
      firstRowByEmail.set(row.email, row.rowNumber);
    }
  });

  const rows = parsedRows.map((row) => {
    const rowId = buildBulkAccessRowId({
      importId,
      rowNumber: row.rowNumber,
      email: row.email,
    });

    if (!row.valid) {
      return {
        ...row,
        rowId,
        status: ACCESS_BULK_ROW_STATUS.INVALID,
        reason: "Invalid email format",
        processable: false,
      };
    }

    if (
      firstRowByEmail.get(row.email) !==
      row.rowNumber
    ) {
      return {
        ...row,
        rowId,
        status:
          ACCESS_BULK_ROW_STATUS.DUPLICATE_INPUT,
        reason: "Duplicate email in this import",
        processable: false,
      };
    }

    const requestedGrant =
      normalizeAndValidateGrantInput({
        ...grantData,
        email: row.email,
        status:
          grantData.status ||
          ACCESS_STATUS.ACTIVE,
      });
    const existing = uniqueRecords(
      existingRecordsByEmail[row.email] || []
    );
    const planFamily =
      requestedGrant.scopeType ===
      ACCESS_SCOPE_TYPES.PLAN;
    const candidates = findGrantCandidates(
      existing,
      requestedGrant,
      { planFamily }
    );

    try {
      assertGrantCandidateIdentitySafe(
        existing,
        requestedGrant
      );
    } catch (error) {
      return {
        ...row,
        rowId,
        status:
          ACCESS_BULK_ROW_STATUS.IDENTITY_CONFLICT,
        reason:
          error?.message ||
          "Identity conflict",
        processable: false,
      };
    }

    if (candidates.length) {
      return {
        ...row,
        rowId,
        status:
          ACCESS_BULK_ROW_STATUS.EXISTING_MATCH,
        reason:
          "Matching logical grant already exists",
        processable: false,
        existingAccessId: candidates[0].id,
      };
    }

    return {
      ...row,
      rowId,
      status: ACCESS_BULK_ROW_STATUS.READY,
      reason: "Ready to create",
      processable: true,
    };
  });

  return {
    importId: cleanValue(importId),
    rows,
    summary: summarizeBulkAccessRows(rows),
    processableRows: rows.filter(
      (row) => row.processable
    ),
    blockedRows: rows.filter(
      (row) => !row.processable
    ),
  };
};

export const selectResumableBulkAccessRows = (
  rows = []
) =>
  (Array.isArray(rows) ? rows : []).filter(
    (row) =>
      row &&
      [
        ACCESS_BULK_ROW_STATUS.READY,
        ACCESS_BULK_ROW_STATUS.FAILED,
      ].includes(row.status)
  );

export const summarizeBulkAccessRows = (
  rows = []
) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const counts = Object.values(
    ACCESS_BULK_ROW_STATUS
  ).reduce(
    (summary, status) => ({
      ...summary,
      [status]: 0,
    }),
    {}
  );

  safeRows.forEach((row) => {
    const status = cleanValue(row?.status);

    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  });

  const finished =
    counts.succeeded +
    counts.invalid +
    counts.duplicate_input +
    counts.existing_match +
    counts.identity_conflict +
    counts.skipped +
    counts.rolled_back +
    counts.rollback_conflict;
  const remaining =
    counts.ready +
    counts.running +
    counts.failed;

  return {
    total: safeRows.length,
    counts,
    finished,
    remaining,
    processable:
      counts.ready + counts.failed,
    hasFailures: counts.failed > 0,
    complete: remaining === 0,
  };
};

export const resolveBulkImportStatus = (
  rows = []
) => {
  const summary = summarizeBulkAccessRows(rows);

  if (summary.total === 0) {
    return ACCESS_BULK_IMPORT_STATUS.FAILED;
  }

  if (summary.counts.running > 0) {
    return ACCESS_BULK_IMPORT_STATUS.RUNNING;
  }

  if (summary.complete && !summary.hasFailures) {
    return ACCESS_BULK_IMPORT_STATUS.COMPLETED;
  }

  if (summary.hasFailures) {
    return ACCESS_BULK_IMPORT_STATUS.PARTIAL;
  }

  return ACCESS_BULK_IMPORT_STATUS.PLANNED;
};


export const selectRollbackableBulkAccessRows = (rows = []) =>
  (Array.isArray(rows) ? rows : []).filter(
    (row) =>
      row &&
      row.status === ACCESS_BULK_ROW_STATUS.SUCCEEDED &&
      row.accessWriteMode === "created" &&
      cleanValue(row.accessId)
  );

export const resolveBulkRollbackStatus = (rows = []) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const rollbackCreatedRows = safeRows.filter(
    (row) => row && row.accessWriteMode === "created"
  );

  if (!rollbackCreatedRows.length) {
    return ACCESS_BULK_IMPORT_STATUS.ROLLED_BACK;
  }

  if (rollbackCreatedRows.some(
    (row) => row.status === ACCESS_BULK_ROW_STATUS.ROLLBACK_CONFLICT
  )) {
    return ACCESS_BULK_IMPORT_STATUS.ROLLBACK_PARTIAL;
  }

  if (rollbackCreatedRows.every(
    (row) => row.status === ACCESS_BULK_ROW_STATUS.ROLLED_BACK
  )) {
    return ACCESS_BULK_IMPORT_STATUS.ROLLED_BACK;
  }

  return ACCESS_BULK_IMPORT_STATUS.ROLLING_BACK;
};
