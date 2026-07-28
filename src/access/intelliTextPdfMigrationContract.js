import {
  INTELLITEXT_AUTHORING_LIMITS,
} from "./intelliTextAuthoringContract";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_PDF_MIGRATION_SCHEMA_VERSION = 1;
export const INTELLITEXT_PDF_MIGRATION_EXPECTED_NOTES = 48;
export const INTELLITEXT_PDF_MIGRATION_MAX_DATA_URL_LENGTH = 850000;

export class IntelliTextPdfMigrationContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextPdfMigrationContractError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextPdfMigrationContractError(code, message);
};

const clean = (value = "") => String(value ?? "").trim();
const upper = (value = "") => clean(value).toUpperCase();
const freeze = (value) => Object.freeze(value);
const freezeArray = (value = []) => freeze([...value]);

const lower = (value = "") => clean(value).toLowerCase();

const normalizeNotesPlanCode = (value = "FREE") => {
  const plan = upper(value || "FREE");
  return plan === "MENTORSHIP" ? "PREMIUM" : plan;
};

export const getCanonicalMigrationNoteId = (item = {}) =>
  clean(
    item.resourceId ||
      item.id ||
      item.textbookId ||
      item.intelliTextId ||
      item.learningTextId ||
      ""
  );

export const getCanonicalMigrationPlanCode = (item = {}, fallback = "FREE") =>
  normalizeNotesPlanCode(
    item.planType ||
      item.plan ||
      item.accessPlan ||
      item.planCode ||
      item.access ||
      item.requiredPlanCode ||
      fallback ||
      "FREE"
  );

export const isCanonicalPublishedMigrationNote = (item = {}) => {
  const section = lower(
    item.section || item.contentSection || item.module || item.moduleKey || ""
  );
  const type = lower(
    item.type ||
      item.resourceType ||
      item.contentType ||
      item.itemType ||
      item.deliveryType ||
      ""
  );
  const status = lower(
    item.status || item.publishStatus || item.visibility || item.state || ""
  );

  const blockedStatus = [
    "draft",
    "staged",
    "unpublished",
    "inactive",
    "hidden",
    "archived",
    "deleted",
  ].includes(status);
  const publishedStatus =
    item.isPublished === true ||
    item.published === true ||
    item.active === true ||
    ["published", "active", "open", "public"].includes(status);

  const explicitlyOtherModule =
    ["currentaffairs", "current-affairs", "roadmaps", "roadmap", "videos", "video", "mocktest", "mock-test", "tests", "test", "live", "replay"].includes(section) ||
    /(current[ -]?affairs|roadmap|aspirepath|video|mock|test|live|replay)/.test(type);

  const noteOwned =
    ["notes", "note", "subjectpdf", "coursematerial"].includes(section) ||
    /(pdf[ -]?note|native[ -]?note|intellitext|learningtext|native_text|(^|[ -])note($|[ -]))/.test(type);

  return Boolean(
    getCanonicalMigrationNoteId(item) &&
      noteOwned &&
      !explicitlyOtherModule &&
      !blockedStatus &&
      publishedStatus
  );
};

export const selectCanonicalPublishedMigrationNotes = (items = []) => {
  const byId = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!isCanonicalPublishedMigrationNote(item)) return;
    const id = getCanonicalMigrationNoteId(item);
    if (!byId.has(id)) byId.set(id, item);
  });
  return [...byId.values()];
};

const requireText = (value, field, maximum = 500) => {
  const normalized = clean(value);
  if (!normalized) fail("REQUIRED_TEXT_MISSING", `${field} is required.`);
  if (normalized.length > maximum) {
    fail("TEXT_TOO_LONG", `${field} must be ${maximum} characters or fewer.`);
  }
  return normalized;
};

const requireInteger = (value, field, minimum = 0) => {
  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < minimum) {
    fail("INTEGER_INVALID", `${field} must be an integer of ${minimum} or more.`);
  }
  return normalized;
};

const normalizePayload = (payload = {}, path = "payload") => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail("PAYLOAD_INVALID", `${path} must be a plain object.`);
  }

  const normalized = { ...payload };
  const imageSource = clean(
    normalized.src || normalized.url || normalized.imageUrl || ""
  );

  if (imageSource.startsWith("data:image/")) {
    if (imageSource.length > INTELLITEXT_PDF_MIGRATION_MAX_DATA_URL_LENGTH) {
      fail(
        "MIGRATION_IMAGE_TOO_LARGE",
        `${path} contains a visual larger than the approved Firestore block limit.`
      );
    }

    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imageSource)) {
      fail("MIGRATION_IMAGE_INVALID", `${path} contains an invalid image data URL.`);
    }
  }

  return freeze(normalized);
};

const normalizeBlock = (block = {}, sectionIndex, blockIndex) => {
  const type = upper(block.type);
  if (!type) {
    fail(
      "BLOCK_TYPE_MISSING",
      `notes[].sections[${sectionIndex}].blocks[${blockIndex}].type is required.`
    );
  }

  return freeze({
    blockId: normalizeIntelliTextId(
      block.blockId,
      `sections[${sectionIndex}].blocks[${blockIndex}].blockId`
    ),
    payload: normalizePayload(
      block.payload || {},
      `sections[${sectionIndex}].blocks[${blockIndex}].payload`
    ),
    type,
  });
};

const normalizeSection = (section = {}, sectionIndex) => {
  const blocks = Array.isArray(section.blocks) ? section.blocks : [];
  if (blocks.length === 0) {
    fail("MIGRATION_SECTION_EMPTY", `Section ${sectionIndex + 1} has no blocks.`);
  }

  return freeze({
    blocks: freezeArray(
      blocks.map((block, blockIndex) =>
        normalizeBlock(block, sectionIndex, blockIndex)
      )
    ),
    sectionId: normalizeIntelliTextId(
      section.sectionId,
      `sections[${sectionIndex}].sectionId`
    ),
    summary: clean(section.summary) || null,
    title: requireText(section.title, `sections[${sectionIndex}].title`, 300),
  });
};

const normalizeQuality = (quality = {}) => {
  const blockingIssues = Array.isArray(quality.blockingIssues)
    ? quality.blockingIssues.map((item) => clean(item)).filter(Boolean)
    : [];
  const visualPages = Array.isArray(quality.visualPages)
    ? quality.visualPages
        .map((page) => Number(page))
        .filter((page) => Number.isSafeInteger(page) && page > 0)
    : [];

  return freeze({
    autoPublishEligible:
      quality.autoPublishEligible === true &&
      blockingIssues.length === 0 &&
      upper(quality.textFidelity) === "PASS",
    blockingIssues: freezeArray([...new Set(blockingIssues)]),
    blockTextSha256: requireText(
      quality.blockTextSha256,
      "quality.blockTextSha256",
      64
    ),
    sourceTextSha256: requireText(
      quality.sourceTextSha256,
      "quality.sourceTextSha256",
      64
    ),
    textFidelity: upper(quality.textFidelity),
    visualPages: freezeArray([...new Set(visualPages)].sort((a, b) => a - b)),
    visualReviewRequired:
      quality.visualReviewRequired === true || visualPages.length > 0,
  });
};

export function normalizeIntelliTextMigrationNote(input = {}) {
  const sections = Array.isArray(input.sections) ? input.sections : [];
  if (sections.length === 0) {
    fail("MIGRATION_SECTIONS_MISSING", "A migrated Note requires sections.");
  }
  if (sections.length > INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION) {
    fail(
      "MIGRATION_SECTION_LIMIT",
      `A migrated Note may contain at most ${INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION} sections.`
    );
  }

  const normalizedSections = sections.map(normalizeSection);
  const blockCount = normalizedSections.reduce(
    (count, section) => count + section.blocks.length,
    0
  );
  if (blockCount > INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION) {
    fail(
      "MIGRATION_BLOCK_LIMIT",
      `A migrated Note may contain at most ${INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION} blocks.`
    );
  }

  const quality = normalizeQuality(input.quality || {});
  if (
    quality.textFidelity !== "PASS" ||
    quality.sourceTextSha256 !== quality.blockTextSha256
  ) {
    fail(
      "MIGRATION_TEXT_FIDELITY_FAILED",
      "Extracted source text and IntelliText block text must have the same SHA-256."
    );
  }

  return freeze({
    blockCount,
    chapterId: normalizeIntelliTextId(input.chapterId, "chapterId"),
    pageCount: requireInteger(input.pageCount, "pageCount", 1),
    planCode: normalizeNotesPlanCode(input.planCode || "FREE"),
    quality,
    sections: freezeArray(normalizedSections),
    sourceSha256: requireText(input.sourceSha256, "sourceSha256", 64),
    subjectId: normalizeIntelliTextId(input.subjectId, "subjectId"),
    textbookId: normalizeIntelliTextId(input.textbookId, "textbookId"),
    title: requireText(input.title, "title", 300),
  });
}

export function normalizeIntelliTextMigrationBundle(
  input = {},
  { expectedNoteCount = INTELLITEXT_PDF_MIGRATION_EXPECTED_NOTES } = {}
) {
  if (Number(input.schemaVersion) !== INTELLITEXT_PDF_MIGRATION_SCHEMA_VERSION) {
    fail("MIGRATION_SCHEMA_INVALID", "Unsupported migration bundle schemaVersion.");
  }

  const notes = Array.isArray(input.notes) ? input.notes : [];
  if (notes.length !== expectedNoteCount) {
    fail(
      "MIGRATION_NOTE_COUNT_MISMATCH",
      `Migration bundle contains ${notes.length} Notes; expected ${expectedNoteCount}.`
    );
  }

  const normalizedNotes = notes.map(normalizeIntelliTextMigrationNote);
  const ids = normalizedNotes.map((note) => note.textbookId);
  if (new Set(ids).size !== ids.length) {
    fail("MIGRATION_DUPLICATE_NOTE_ID", "Migration bundle contains duplicate textbookId values.");
  }

  return freeze({
    generatedAt: requireText(input.generatedAt, "generatedAt", 80),
    notes: freezeArray(normalizedNotes),
    projectId: requireText(input.projectId, "projectId", 128),
    schemaVersion: INTELLITEXT_PDF_MIGRATION_SCHEMA_VERSION,
    sourceCollection: requireText(input.sourceCollection, "sourceCollection", 80),
  });
}

const planEntitlementIds = (planCode, textbookId) => {
  const plan = normalizeNotesPlanCode(planCode || "FREE");
  const ids = [`item_${textbookId}`, "module_NOTES"];

  if (plan === "BASIC") ids.push("plan_BASIC", "plan_PREMIUM", "plan_MENTORSHIP");
  if (plan === "PREMIUM") ids.push("plan_PREMIUM", "plan_MENTORSHIP");
  if (plan === "MENTORSHIP") ids.push("plan_MENTORSHIP");

  return ids.slice(0, 6);
};

export function buildIntelliTextMigrationDraftInput({
  migrationNote,
  canonicalNote = {},
  root = null,
} = {}) {
  const note = normalizeIntelliTextMigrationNote(migrationNote);
  const canonicalId = normalizeIntelliTextId(
    canonicalNote.id || canonicalNote.textbookId,
    "canonicalNote.id"
  );

  if (canonicalId !== note.textbookId) {
    fail(
      "MIGRATION_CANONICAL_ID_MISMATCH",
      "Migration textbookId must equal the existing contentItems document ID."
    );
  }

  const baseContentVersion = Number(root?.contentVersion || 0);
  const contentVersion = baseContentVersion + 1;
  const versionId = normalizeIntelliTextId(
    `migration_v${contentVersion}_${note.textbookId}_${note.sourceSha256.slice(0, 8)}`.slice(
      0,
      128
    ),
    "versionId"
  );
  const planCode = getCanonicalMigrationPlanCode(
    canonicalNote,
    note.planCode || "FREE"
  );

  return freeze({
    access: freeze({
      publicRead: planCode === "FREE",
      readEntitlementIds:
        planCode === "FREE" ? freezeArray([]) : freezeArray(planEntitlementIds(planCode, note.textbookId)),
      requiredPlanCode: planCode,
    }),
    baseContentVersion,
    chapterId: note.chapterId,
    contentVersion,
    migrationSourceSha256: note.sourceSha256,
    previewAudit: freeze({
      desktop: false,
      mobile: false,
      studentExperience: false,
    }),
    sections: note.sections,
    subjectId: note.subjectId,
    textbookId: note.textbookId,
    title: note.title,
    versionId,
  });
}
