import {
  INTELLITEXT_ACCESS_SCOPE_TYPES,
  INTELLITEXT_BLOCK_TYPES,
  INTELLITEXT_DELIVERY_MODES,
  INTELLITEXT_DELIVERY_RESULTS,
  INTELLITEXT_MIGRATION_STATES,
  INTELLITEXT_PUBLICATION_STATES,
  INTELLITEXT_RESOURCE_TYPE,
  INTELLITEXT_RETIREMENT_GATES,
  INTELLITEXT_SCHEMA_VERSION,
} from "./intelliTextConstants";

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

const RAW_PDF_FIELD_NAMES = new Set([
  "directassets",
  "downloadurl",
  "fileurl",
  "pdfurl",
  "protectedurl",
  "rawpdfurl",
]);

export class IntelliTextContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextContractError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new IntelliTextContractError(code, message);
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function normalizeRequiredText(value, field, maxLength = 500) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    fail("REQUIRED_TEXT_MISSING", `${field} is required.`);
  }

  if (normalized.length > maxLength) {
    fail(
      "TEXT_TOO_LONG",
      `${field} must be ${maxLength} characters or fewer.`
    );
  }

  return normalized;
}

function normalizeOptionalText(value, field, maxLength = 2000) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return normalizeRequiredText(value, field, maxLength);
}

function normalizeInteger(
  value,
  field,
  { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}
) {
  const normalized = Number(value);

  if (
    !Number.isSafeInteger(normalized) ||
    normalized < minimum ||
    normalized > maximum
  ) {
    fail(
      "INTEGER_INVALID",
      `${field} must be an integer from ${minimum} to ${maximum}.`
    );
  }

  return normalized;
}

function normalizeEnum(value, field, allowedValues) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (!allowedValues.includes(normalized)) {
    fail(
      "ENUM_INVALID",
      `${field} must be one of: ${allowedValues.join(", ")}.`
    );
  }

  return normalized;
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function cloneJsonValue(value, path = "payload") {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      fail("JSON_VALUE_INVALID", `${path} contains a non-finite number.`);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item, index) =>
        cloneJsonValue(item, `${path}[${index}]`)
      )
    );
  }

  if (!isPlainObject(value)) {
    fail(
      "JSON_VALUE_INVALID",
      `${path} must contain JSON-safe plain objects only.`
    );
  }

  const output = {};

  Object.entries(value).forEach(([key, item]) => {
    if (item === undefined) {
      fail(
        "JSON_VALUE_INVALID",
        `${path}.${key} cannot be undefined.`
      );
    }

    const normalizedKey = key.trim().toLowerCase();

    if (RAW_PDF_FIELD_NAMES.has(normalizedKey)) {
      fail(
        "RAW_PDF_FIELD_FORBIDDEN",
        `${path}.${key} cannot contain a raw PDF delivery field.`
      );
    }

    output[key] = cloneJsonValue(item, `${path}.${key}`);
  });

  return freezeRecord(output);
}

export function normalizeIntelliTextId(value, field = "id") {
  const normalized = String(value ?? "").trim();

  if (!ID_PATTERN.test(normalized)) {
    fail(
      "ID_INVALID",
      `${field} must use 1-128 letters, numbers, underscores, or hyphens.`
    );
  }

  return normalized;
}

export function assertNoRawPdfDeliveryFields(value) {
  cloneJsonValue(value, "record");
  return true;
}

export function createIntelliTextAccessDescriptor(input = {}) {
  const textbookId = normalizeIntelliTextId(
    input.textbookId,
    "textbookId"
  );
  const scopeType = normalizeEnum(
    input.scopeType,
    "scopeType",
    Object.values(INTELLITEXT_ACCESS_SCOPE_TYPES)
  );
  const scopeId = normalizeIntelliTextId(
    input.scopeId,
    "scopeId"
  );
  const planCode = normalizeOptionalText(
    input.planCode,
    "planCode",
    64
  );

  return freezeRecord({
    planCode,
    resourceId: textbookId,
    resourceType: INTELLITEXT_RESOURCE_TYPE,
    scopeId,
    scopeType,
  });
}

export function createIntelliTextRoot(input = {}) {
  assertNoRawPdfDeliveryFields(input);

  const textbookId = normalizeIntelliTextId(
    input.textbookId,
    "textbookId"
  );
  const deliveryMode = normalizeEnum(
    input.deliveryMode,
    "deliveryMode",
    Object.values(INTELLITEXT_DELIVERY_MODES)
  );
  const publicationState = normalizeEnum(
    input.publicationState ?? "DRAFT",
    "publicationState",
    Object.values(INTELLITEXT_PUBLICATION_STATES)
  );
  const migrationState = normalizeEnum(
    input.migrationState ?? "NOT_STARTED",
    "migrationState",
    Object.values(INTELLITEXT_MIGRATION_STATES)
  );
  const contentVersion = normalizeInteger(
    input.contentVersion ?? 1,
    "contentVersion",
    { minimum: 1 }
  );
  const sectionCount = normalizeInteger(
    input.sectionCount ?? 0,
    "sectionCount",
    { minimum: 0 }
  );
  const legacyContentId = normalizeOptionalText(
    input.legacyContentId,
    "legacyContentId",
    128
  );

  if (
    deliveryMode === INTELLITEXT_DELIVERY_MODES.LEGACY_PDF &&
    !legacyContentId
  ) {
    fail(
      "LEGACY_CONTENT_ID_REQUIRED",
      "LEGACY_PDF delivery requires legacyContentId."
    );
  }

  const access = createIntelliTextAccessDescriptor({
    textbookId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    planCode: input.planCode,
  });

  return freezeRecord({
    access,
    chapterId: normalizeIntelliTextId(
      input.chapterId,
      "chapterId"
    ),
    contentVersion,
    createdAt: input.createdAt ?? null,
    deliveryMode,
    migration: freezeRecord({
      legacyContentId,
      legacyFallbackPreserved: Boolean(legacyContentId),
      nativeReady: Boolean(input.nativeReady),
      state: migrationState,
    }),
    publicationState,
    resourceType: INTELLITEXT_RESOURCE_TYPE,
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    sectionCount,
    subjectId: normalizeIntelliTextId(
      input.subjectId,
      "subjectId"
    ),
    textbookId,
    title: normalizeRequiredText(input.title, "title", 300),
    updatedAt: input.updatedAt ?? null,
  });
}

export function createIntelliTextSection(input = {}) {
  assertNoRawPdfDeliveryFields(input);

  return freezeRecord({
    blockCount: normalizeInteger(
      input.blockCount ?? 0,
      "blockCount",
      { minimum: 0 }
    ),
    contentVersion: normalizeInteger(
      input.contentVersion ?? 1,
      "contentVersion",
      { minimum: 1 }
    ),
    order: normalizeInteger(input.order, "order", {
      minimum: 0,
    }),
    published: Boolean(input.published),
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    sectionId: normalizeIntelliTextId(
      input.sectionId,
      "sectionId"
    ),
    summary: normalizeOptionalText(
      input.summary,
      "summary",
      2000
    ),
    textbookId: normalizeIntelliTextId(
      input.textbookId,
      "textbookId"
    ),
    title: normalizeRequiredText(input.title, "title", 300),
  });
}

export function createIntelliTextBlock(input = {}) {
  assertNoRawPdfDeliveryFields(input);

  const type = normalizeEnum(
    input.type,
    "type",
    INTELLITEXT_BLOCK_TYPES
  );

  if (!isPlainObject(input.payload)) {
    fail(
      "BLOCK_PAYLOAD_INVALID",
      "payload must be a plain object."
    );
  }

  return freezeRecord({
    blockId: normalizeIntelliTextId(
      input.blockId,
      "blockId"
    ),
    contentVersion: normalizeInteger(
      input.contentVersion ?? 1,
      "contentVersion",
      { minimum: 1 }
    ),
    order: normalizeInteger(input.order, "order", {
      minimum: 0,
    }),
    payload: cloneJsonValue(input.payload, "payload"),
    published: Boolean(input.published),
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    sectionId: normalizeIntelliTextId(
      input.sectionId,
      "sectionId"
    ),
    textbookId: normalizeIntelliTextId(
      input.textbookId,
      "textbookId"
    ),
    type,
  });
}

export function createIntelliTextContentAnchor(input = {}) {
  return freezeRecord({
    blockId: normalizeIntelliTextId(
      input.blockId,
      "blockId"
    ),
    contentVersion: normalizeInteger(
      input.contentVersion,
      "contentVersion",
      { minimum: 1 }
    ),
    sectionId: normalizeIntelliTextId(
      input.sectionId,
      "sectionId"
    ),
    textbookId: normalizeIntelliTextId(
      input.textbookId,
      "textbookId"
    ),
  });
}

export function evaluateIntelliTextDelivery(input = {}) {
  const deliveryMode = normalizeEnum(
    input.deliveryMode,
    "deliveryMode",
    Object.values(INTELLITEXT_DELIVERY_MODES)
  );
  const publicationState = normalizeEnum(
    input.publicationState,
    "publicationState",
    Object.values(INTELLITEXT_PUBLICATION_STATES)
  );
  const nativeReady = Boolean(input.nativeReady);
  const legacyFallbackAvailable = Boolean(
    input.legacyFallbackAvailable
  );

  if (
    deliveryMode === INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT &&
    publicationState ===
      INTELLITEXT_PUBLICATION_STATES.PUBLISHED &&
    nativeReady
  ) {
    return INTELLITEXT_DELIVERY_RESULTS.NATIVE_TEXT;
  }

  if (
    deliveryMode === INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT &&
    legacyFallbackAvailable
  ) {
    return INTELLITEXT_DELIVERY_RESULTS.LEGACY_PDF_FALLBACK;
  }

  if (
    deliveryMode === INTELLITEXT_DELIVERY_MODES.LEGACY_PDF &&
    legacyFallbackAvailable
  ) {
    return INTELLITEXT_DELIVERY_RESULTS.LEGACY_PDF;
  }

  return INTELLITEXT_DELIVERY_RESULTS.UNAVAILABLE;
}

export function evaluateLegacyPdfRetirement(input = {}) {
  const gateStatus = {};

  INTELLITEXT_RETIREMENT_GATES.forEach((gate) => {
    gateStatus[gate] = input[gate] === true;
  });

  const missingGates = INTELLITEXT_RETIREMENT_GATES.filter(
    (gate) => !gateStatus[gate]
  );

  return freezeRecord({
    approved: missingGates.length === 0,
    gateStatus: freezeRecord(gateStatus),
    missingGates: Object.freeze(missingGates),
  });
}

export function assertIntelliTextIdentityCompatibleUpdate(
  previous,
  next
) {
  const immutableFields = [
    "textbookId",
    "resourceType",
    "subjectId",
    "chapterId",
  ];

  immutableFields.forEach((field) => {
    if (previous?.[field] !== next?.[field]) {
      fail(
        "IMMUTABLE_IDENTITY_CHANGED",
        `${field} cannot change after creation.`
      );
    }
  });

  if (
    !Number.isSafeInteger(previous?.contentVersion) ||
    !Number.isSafeInteger(next?.contentVersion) ||
    next.contentVersion < previous.contentVersion
  ) {
    fail(
      "CONTENT_VERSION_REGRESSION",
      "contentVersion cannot decrease."
    );
  }

  return true;
}
