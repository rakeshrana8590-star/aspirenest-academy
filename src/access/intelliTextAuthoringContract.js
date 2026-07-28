import {
  INTELLITEXT_BLOCK_TYPES,
  INTELLITEXT_DELIVERY_MODES,
  INTELLITEXT_PUBLICATION_STATES,
  INTELLITEXT_RESOURCE_TYPE,
  INTELLITEXT_SCHEMA_VERSION,
} from "./intelliTextConstants";
import {
  createIntelliTextBlock,
  createIntelliTextSection,
  normalizeIntelliTextId as normalizeBaseIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_AUTHORING_SCHEMA_VERSION = 1;

export const INTELLITEXT_AUTHORING_VERSION_STATES = Object.freeze({
  ARCHIVED: "ARCHIVED",
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  READY_FOR_REVIEW: "READY_FOR_REVIEW",
});

export const INTELLITEXT_AUTHORING_PREVIEW_MODES = Object.freeze({
  DESKTOP: "DESKTOP",
  MOBILE: "MOBILE",
});

export const INTELLITEXT_AUTHORING_LIMITS = Object.freeze({
  MAX_BLOCKS_PER_VERSION: 180,
  MAX_PUBLISH_BATCH_WRITES: 450,
  MAX_READ_ENTITLEMENT_IDS: 6,
  MAX_SECTIONS_PER_VERSION: 30,
});

export class IntelliTextAuthoringContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextAuthoringContractError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextAuthoringContractError(code, message);
};

const normalizeIntelliTextId = (value, field) => {
  try {
    return normalizeBaseIntelliTextId(value, field);
  } catch (error) {
    if (error?.code) {
      fail(error.code, error.message);
    }

    throw error;
  }
};

const cleanText = (value = "") => String(value ?? "").trim();

const cleanUpper = (value = "") => cleanText(value).toUpperCase();

const normalizeInteger = (
  value,
  field,
  { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}
) => {
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
};

const normalizeRequiredText = (value, field, maximum = 500) => {
  const normalized = cleanText(value);

  if (!normalized) {
    fail("REQUIRED_TEXT_MISSING", `${field} is required.`);
  }

  if (normalized.length > maximum) {
    fail("TEXT_TOO_LONG", `${field} must be ${maximum} characters or fewer.`);
  }

  return normalized;
};

const normalizeOptionalText = (value, field, maximum = 2000) => {
  const normalized = cleanText(value);

  if (!normalized) return null;

  return normalizeRequiredText(normalized, field, maximum);
};

const freezeArray = (items = []) => Object.freeze([...items]);

const freezeRecord = (value = {}) => Object.freeze(value);

const normalizeVersionState = (value) => {
  const normalized = cleanUpper(value || "DRAFT");

  if (!Object.values(INTELLITEXT_AUTHORING_VERSION_STATES).includes(normalized)) {
    fail(
      "VERSION_STATE_INVALID",
      "versionState must be DRAFT, READY_FOR_REVIEW, PUBLISHED, or ARCHIVED."
    );
  }

  return normalized;
};

const normalizePublicationState = (value) => {
  const normalized = cleanUpper(value || "DRAFT");

  if (!Object.values(INTELLITEXT_PUBLICATION_STATES).includes(normalized)) {
    fail(
      "PUBLICATION_STATE_INVALID",
      "publicationState must be DRAFT, PUBLISHED, or ARCHIVED."
    );
  }

  return normalized;
};

const normalizeEntitlementIds = (values = []) => {
  if (!Array.isArray(values)) {
    fail("ENTITLEMENT_IDS_INVALID", "readEntitlementIds must be an array.");
  }

  const normalized = values
    .map((value) => cleanText(value))
    .filter(Boolean)
    .map((value) => normalizeIntelliTextId(value, "readEntitlementId"));

  const unique = [...new Set(normalized)];

  if (unique.length > INTELLITEXT_AUTHORING_LIMITS.MAX_READ_ENTITLEMENT_IDS) {
    fail(
      "ENTITLEMENT_IDS_LIMIT_EXCEEDED",
      `No more than ${INTELLITEXT_AUTHORING_LIMITS.MAX_READ_ENTITLEMENT_IDS} entitlement IDs are allowed.`
    );
  }

  return freezeArray(unique);
};

export function createIntelliTextAccessMapping(input = {}) {
  const publicRead = input.publicRead === true;
  const readEntitlementIds = normalizeEntitlementIds(
    input.readEntitlementIds || []
  );

  if (!publicRead && readEntitlementIds.length === 0) {
    fail(
      "ACCESS_MAPPING_REQUIRED",
      "Protected IntelliText content requires at least one entitlement ID."
    );
  }

  return freezeRecord({
    publicRead,
    readEntitlementIds,
    requiredPlanCode: normalizeOptionalText(
      input.requiredPlanCode,
      "requiredPlanCode",
      64
    ),
  });
}

const normalizeAuthoringTimestampLike = (value, fieldName) => {
  if (value == null) return null;

  const normalizeDate = (date) => {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
      fail(
        "TIMESTAMP_INVALID",
        `${fieldName} must be a valid timestamp-like value.`
      );
    }

    return date.toISOString();
  };

  if (value instanceof Date) return normalizeDate(value);
  if (typeof value?.toDate === "function") return normalizeDate(value.toDate());

  if (typeof value?.toMillis === "function") {
    const millis = Number(value.toMillis());

    if (!Number.isFinite(millis)) {
      fail(
        "TIMESTAMP_INVALID",
        `${fieldName} must be a valid timestamp-like value.`
      );
    }

    return normalizeDate(new Date(millis));
  }

  // Preserve Firestore write sentinels such as serverTimestamp().
  return value;
};

export function createIntelliTextAuthoringVersion(input = {}) {
  const textbookId = normalizeIntelliTextId(input.textbookId, "textbookId");
  const versionId = normalizeIntelliTextId(input.versionId, "versionId");
  const contentVersion = normalizeInteger(
    input.contentVersion,
    "contentVersion",
    { minimum: 1 }
  );
  const baseContentVersion = normalizeInteger(
    input.baseContentVersion ?? Math.max(0, contentVersion - 1),
    "baseContentVersion",
    { minimum: 0 }
  );

  if (contentVersion !== baseContentVersion + 1) {
    fail(
      "VERSION_SEQUENCE_INVALID",
      "contentVersion must be exactly one greater than baseContentVersion."
    );
  }

  return freezeRecord({
    access: createIntelliTextAccessMapping(input.access || {}),
    baseContentVersion,
    chapterId: normalizeIntelliTextId(input.chapterId, "chapterId"),
    contentVersion,
    createdAt: normalizeAuthoringTimestampLike(input.createdAt, "createdAt"),
    createdBy: normalizeIntelliTextId(input.createdBy, "createdBy"),
    draftFingerprint: normalizeRequiredText(
      input.draftFingerprint,
      "draftFingerprint",
      128
    ),
    previewAudit: freezeRecord({
      desktop: input.previewAudit?.desktop === true,
      mobile: input.previewAudit?.mobile === true,
      studentExperience: input.previewAudit?.studentExperience === true,
    }),
    publicationState: normalizePublicationState(
      input.publicationState || "DRAFT"
    ),
    publishedAt: normalizeAuthoringTimestampLike(input.publishedAt, "publishedAt"),
    publishedBy: input.publishedBy
      ? normalizeIntelliTextId(input.publishedBy, "publishedBy")
      : null,
    schemaVersion: INTELLITEXT_AUTHORING_SCHEMA_VERSION,
    sectionCount: normalizeInteger(
      input.sectionCount ?? 0,
      "sectionCount",
      {
        minimum: 0,
        maximum: INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION,
      }
    ),
    blockCount: normalizeInteger(input.blockCount ?? 0, "blockCount", {
      minimum: 0,
      maximum: INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION,
    }),
    subjectId: normalizeIntelliTextId(input.subjectId, "subjectId"),
    textbookId,
    title: normalizeRequiredText(input.title, "title", 300),
    updatedAt: normalizeAuthoringTimestampLike(input.updatedAt, "updatedAt"),
    updatedBy: normalizeIntelliTextId(input.updatedBy, "updatedBy"),
    versionId,
    versionState: normalizeVersionState(input.versionState || "DRAFT"),
  });
}

export function createIntelliTextAuthoringSection(input = {}) {
  const section = createIntelliTextSection({
    ...input,
    summary: input.summary ?? null,
    published: false,
  });

  return freezeRecord({
    ...section,
    authoringVersionId: normalizeIntelliTextId(
      input.authoringVersionId,
      "authoringVersionId"
    ),
  });
}

export function createIntelliTextAuthoringBlock(input = {}) {
  const block = createIntelliTextBlock({
    ...input,
    published: false,
  });

  return freezeRecord({
    ...block,
    authoringVersionId: normalizeIntelliTextId(
      input.authoringVersionId,
      "authoringVersionId"
    ),
  });
}

const normalizeSectionDraft = ({
  rawSection,
  sectionIndex,
  textbookId,
  versionId,
  contentVersion,
}) => {
  const sectionId = normalizeIntelliTextId(
    rawSection?.sectionId,
    `sections[${sectionIndex}].sectionId`
  );
  const blocks = Array.isArray(rawSection?.blocks) ? rawSection.blocks : [];

  const normalizedBlocks = blocks.map((rawBlock, blockIndex) =>
    createIntelliTextAuthoringBlock({
      ...rawBlock,
      authoringVersionId: versionId,
      blockId: rawBlock?.blockId,
      contentVersion,
      order: blockIndex,
      sectionId,
      textbookId,
      type: rawBlock?.type,
      payload: rawBlock?.payload || {},
    })
  );

  return freezeRecord({
    ...createIntelliTextAuthoringSection({
      authoringVersionId: versionId,
      blockCount: normalizedBlocks.length,
      contentVersion,
      order: sectionIndex,
      sectionId,
      sourceTitle: rawSection?.sourceTitle === true,
      summary: rawSection?.summary ?? null,
      textbookId,
      title: rawSection?.title,
    }),
    blocks: freezeArray(normalizedBlocks),
  });
};

const assertUniqueIds = (sections = []) => {
  const sectionIds = new Set();
  const blockIds = new Set();

  sections.forEach((section) => {
    if (sectionIds.has(section.sectionId)) {
      fail("DUPLICATE_SECTION_ID", `Duplicate sectionId: ${section.sectionId}`);
    }

    sectionIds.add(section.sectionId);

    section.blocks.forEach((block) => {
      const composite = `${section.sectionId}/${block.blockId}`;

      if (blockIds.has(composite)) {
        fail("DUPLICATE_BLOCK_ID", `Duplicate blockId: ${composite}`);
      }

      blockIds.add(composite);
    });
  });
};

const stablePayload = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stablePayload).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stablePayload(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

export function computeIntelliTextDraftFingerprint(input = {}) {
  const source = stablePayload({
    access: input.access,
    chapterId: input.chapterId,
    contentVersion: input.contentVersion,
    sections: input.sections,
    subjectId: input.subjectId,
    textbookId: input.textbookId,
    title: input.title,
  });

  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function validateIntelliTextAuthoringDraft(input = {}) {
  const textbookId = normalizeIntelliTextId(input.textbookId, "textbookId");
  const versionId = normalizeIntelliTextId(input.versionId, "versionId");
  const contentVersion = normalizeInteger(
    input.contentVersion,
    "contentVersion",
    { minimum: 1 }
  );
  const baseContentVersion = normalizeInteger(
    input.baseContentVersion ?? Math.max(0, contentVersion - 1),
    "baseContentVersion",
    { minimum: 0 }
  );
  const rawSections = Array.isArray(input.sections) ? input.sections : [];

  if (rawSections.length === 0) {
    fail("SECTION_REQUIRED", "At least one section is required.");
  }

  if (rawSections.length > INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION) {
    fail(
      "SECTION_LIMIT_EXCEEDED",
      `No more than ${INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION} sections are allowed.`
    );
  }

  const sections = rawSections.map((rawSection, sectionIndex) =>
    normalizeSectionDraft({
      rawSection,
      sectionIndex,
      textbookId,
      versionId,
      contentVersion,
    })
  );
  const blockCount = sections.reduce(
    (total, section) => total + section.blocks.length,
    0
  );

  if (blockCount === 0) {
    fail("BLOCK_REQUIRED", "At least one learning block is required.");
  }

  if (blockCount > INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION) {
    fail(
      "BLOCK_LIMIT_EXCEEDED",
      `No more than ${INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION} blocks are allowed.`
    );
  }

  assertUniqueIds(sections);

  const access = createIntelliTextAccessMapping(input.access || {});
  const title = normalizeRequiredText(input.title, "title", 300);
  const subjectId = normalizeIntelliTextId(input.subjectId, "subjectId");
  const chapterId = normalizeIntelliTextId(input.chapterId, "chapterId");
  const draftFingerprint = computeIntelliTextDraftFingerprint({
    access,
    chapterId,
    contentVersion,
    sections,
    subjectId,
    textbookId,
    title,
  });
  const publishWriteCount = 3 + sections.length + blockCount;

  if (
    publishWriteCount >
    INTELLITEXT_AUTHORING_LIMITS.MAX_PUBLISH_BATCH_WRITES
  ) {
    fail(
      "PUBLISH_BATCH_LIMIT_EXCEEDED",
      "The version exceeds the approved publish write budget."
    );
  }

  return freezeRecord({
    access,
    baseContentVersion,
    blockCount,
    chapterId,
    contentVersion,
    draftFingerprint,
    publishWriteCount,
    sections: freezeArray(sections),
    subjectId,
    textbookId,
    title,
    versionId,
  });
}

export function assertIntelliTextPreviewAuditReady(previewAudit = {}) {
  const missing = [
    previewAudit.mobile === true ? null : "mobile",
    previewAudit.desktop === true ? null : "desktop",
    previewAudit.studentExperience === true ? null : "studentExperience",
  ].filter(Boolean);

  if (missing.length > 0) {
    fail(
      "PREVIEW_AUDIT_INCOMPLETE",
      `Complete preview audit: ${missing.join(", ")}.`
    );
  }

  return true;
}

export function assertIntelliTextVersionPublishable({
  root = null,
  version = null,
  graph = null,
} = {}) {
  if (!root || !version || !graph) {
    fail("PUBLISH_INPUT_MISSING", "Root, version, and graph are required.");
  }

  if (version.versionState !== INTELLITEXT_AUTHORING_VERSION_STATES.READY_FOR_REVIEW) {
    fail(
      "VERSION_NOT_READY",
      "Only READY_FOR_REVIEW versions may be published."
    );
  }

  if (Number(root.contentVersion || 0) !== Number(version.baseContentVersion)) {
    fail(
      "STALE_DRAFT_VERSION",
      "The draft is based on an older published version."
    );
  }

  if (version.draftFingerprint !== graph.draftFingerprint) {
    fail(
      "DRAFT_FINGERPRINT_MISMATCH",
      "The draft graph changed after the version record was prepared."
    );
  }

  assertIntelliTextPreviewAuditReady(version.previewAudit || {});

  if (graph.publishWriteCount > INTELLITEXT_AUTHORING_LIMITS.MAX_PUBLISH_BATCH_WRITES) {
    fail(
      "PUBLISH_BATCH_LIMIT_EXCEEDED",
      "The version exceeds the approved publish write budget."
    );
  }

  return true;
}

export function buildIntelliTextCanonicalContentPatch({
  textbookId,
  contentVersion,
  title,
  subjectId,
  chapterId,
  access,
  publishedVersionId,
} = {}) {
  const normalizedTextbookId = normalizeIntelliTextId(
    textbookId,
    "textbookId"
  );

  return freezeRecord({
    contentVersion: normalizeInteger(contentVersion, "contentVersion", {
      minimum: 1,
    }),
    deliveryMode: INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT,
    deliveryType: INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT,
    intelliText: freezeRecord({
      access: createIntelliTextAccessMapping(access || {}),
      chapterId: normalizeIntelliTextId(chapterId, "chapterId"),
      contentVersion: normalizeInteger(contentVersion, "contentVersion", {
        minimum: 1,
      }),
      publicationState: INTELLITEXT_PUBLICATION_STATES.PUBLISHED,
      publishedVersionId: normalizeIntelliTextId(
        publishedVersionId,
        "publishedVersionId"
      ),
      subjectId: normalizeIntelliTextId(subjectId, "subjectId"),
      textbookId: normalizedTextbookId,
      title: normalizeRequiredText(title, "title", 300),
    }),
    canonicalRoute: `/ctet-tet/notes/read/${encodeURIComponent(
      normalizedTextbookId
    )}`,
    migrationState: "PUBLISHED",
    nativeReady: true,
    publicationState: INTELLITEXT_PUBLICATION_STATES.PUBLISHED,
    status: "Published",
    resourceType: INTELLITEXT_RESOURCE_TYPE,
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    textbookId: normalizedTextbookId,
  });
}

export function createIntelliTextPublishedRoot({
  graph,
  versionId,
  publishedAt = null,
  publishedBy,
} = {}) {
  if (!graph) {
    fail("GRAPH_REQUIRED", "Validated authoring graph is required.");
  }

  return freezeRecord({
    access: graph.access,
    blockCount: graph.blockCount,
    chapterId: graph.chapterId,
    contentVersion: graph.contentVersion,
    deliveryMode: INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT,
    nativeReady: true,
    publicationState: INTELLITEXT_PUBLICATION_STATES.PUBLISHED,
    publishedAt,
    publishedBy: normalizeIntelliTextId(publishedBy, "publishedBy"),
    publishedVersionId: normalizeIntelliTextId(versionId, "versionId"),
    resourceType: INTELLITEXT_RESOURCE_TYPE,
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    sectionCount: graph.sections.length,
    subjectId: graph.subjectId,
    textbookId: graph.textbookId,
    title: graph.title,
    updatedAt: publishedAt,
  });
}

export function createIntelliTextPublishedSection(section = {}) {
  return freezeRecord({
    blockCount: normalizeInteger(section.blockCount, "blockCount", {
      minimum: 0,
      maximum: INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION,
    }),
    contentVersion: normalizeInteger(
      section.contentVersion,
      "contentVersion",
      { minimum: 1 }
    ),
    order: normalizeInteger(section.order, "order", { minimum: 0 }),
    published: true,
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    sectionId: normalizeIntelliTextId(section.sectionId, "sectionId"),
    ...(section.sourceTitle === true ? { sourceTitle: true } : {}),
    summary: normalizeOptionalText(section.summary, "summary", 2000),
    textbookId: normalizeIntelliTextId(section.textbookId, "textbookId"),
    title: normalizeRequiredText(section.title, "title", 300),
  });
}

export function createIntelliTextPublishedBlock(block = {}) {
  if (!INTELLITEXT_BLOCK_TYPES.includes(cleanUpper(block.type))) {
    fail("BLOCK_TYPE_INVALID", "Unsupported IntelliText block type.");
  }

  return freezeRecord({
    blockId: normalizeIntelliTextId(block.blockId, "blockId"),
    contentVersion: normalizeInteger(block.contentVersion, "contentVersion", {
      minimum: 1,
    }),
    order: normalizeInteger(block.order, "order", { minimum: 0 }),
    payload: block.payload,
    published: true,
    schemaVersion: INTELLITEXT_SCHEMA_VERSION,
    sectionId: normalizeIntelliTextId(block.sectionId, "sectionId"),
    textbookId: normalizeIntelliTextId(block.textbookId, "textbookId"),
    type: cleanUpper(block.type),
  });
}
