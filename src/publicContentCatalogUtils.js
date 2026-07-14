export const PUBLIC_CONTENT_SCHEMA_VERSION = 1;

export const PROTECTED_ANSWER_FIELD_NAMES = Object.freeze([
  "answer",
  "correctanswer",
  "correctoption",
  "correctoptionindex",
  "answerkey",
  "solution",
  "solutions",
  "explanation",
  "explanations",
  "rationale",
]);

export const PROTECTED_ASSET_FIELD_NAMES = Object.freeze([
  "pdfurl",
  "fileurl",
  "videourl",
  "downloadurl",
  "resourceurl",
  "joinurl",
  "liveurl",
  "meetingurl",
  "replayurl",
  "recordingurl",
  "ctaurl",
  "ctalink",
  "sourceurl",
  "asseturl",
  "documenturl",
  "worksheeturl",
  "driveurl",
  "url",
  "urls",
]);

const DIRECT_ASSET_FIELDS = Object.freeze([
  "fileUrl",
  "pdfUrl",
  "videoUrl",
  "downloadUrl",
  "assetUrl",
  "resourceUrl",
  "sourceUrl",
  "joinUrl",
  "liveUrl",
  "meetingUrl",
  "replayUrl",
  "recordingUrl",
  "ctaUrl",
  "ctaLink",
  "documentUrl",
  "worksheetUrl",
  "driveUrl",
  "url",
  "urls",
]);

const ANSWER_FIELDS = new Set(PROTECTED_ANSWER_FIELD_NAMES);
const ASSET_FIELDS = new Set(PROTECTED_ASSET_FIELD_NAMES);

export const normalizePublicCatalogFieldName = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");


export const isCanonicalPublicContentItem = (contentItem = {}) => {
  const sourceId = String(contentItem.sourceId || "").trim();
  const itemId = String(contentItem.id || "").trim();

  return (
    String(contentItem.sourceCollection || "").trim() === "contentItems" &&
    Boolean(sourceId) &&
    Boolean(itemId) &&
    sourceId === itemId &&
    Number(contentItem.publicSchemaVersion) ===
      PUBLIC_CONTENT_SCHEMA_VERSION
  );
};

const isPlainObject = (value) => {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const clonePublicCatalogValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(clonePublicCatalogValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        clonePublicCatalogValue(item),
      ])
    );
  }

  return value;
};

const isNonEmptyProtectedValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
};

export const sanitizePublicContentValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizePublicContentValue);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const publicValue = {};

  Object.entries(value).forEach(([key, child]) => {
    const normalizedKey = normalizePublicCatalogFieldName(key);

    if (ANSWER_FIELDS.has(normalizedKey)) return;
    if (ASSET_FIELDS.has(normalizedKey)) return;

    publicValue[key] = sanitizePublicContentValue(child);
  });

  return publicValue;
};

export const extractProtectedDirectAssets = (contentItem = {}) =>
  DIRECT_ASSET_FIELDS.reduce((assets, fieldName) => {
    const value = contentItem?.[fieldName];

    if (isNonEmptyProtectedValue(value)) {
      assets[fieldName] = clonePublicCatalogValue(value);
    }

    return assets;
  }, {});

const walkProtectedValues = (
  value,
  {
    prefix = "",
    depth = 0,
    maxDepth = 12,
    output = [],
  } = {}
) => {
  if (depth > maxDepth) return output;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walkProtectedValues(item, {
        prefix: `${prefix}[${index}]`,
        depth: depth + 1,
        maxDepth,
        output,
      });
    });

    return output;
  }

  if (!isPlainObject(value)) return output;

  Object.entries(value).forEach(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    output.push({
      key,
      path,
      value: child,
    });

    walkProtectedValues(child, {
      prefix: path,
      depth: depth + 1,
      maxDepth,
      output,
    });
  });

  return output;
};

export const extractProtectedAnswerEntries = (contentItem = {}) =>
  walkProtectedValues(contentItem)
    .filter(({ key, value }) => {
      const normalizedKey = normalizePublicCatalogFieldName(key);

      return (
        ANSWER_FIELDS.has(normalizedKey) &&
        isNonEmptyProtectedValue(value)
      );
    })
    .map(({ path, value }) => ({
      path,
      value: clonePublicCatalogValue(value),
    }))
    .sort((first, second) => first.path.localeCompare(second.path));

export const normalizePublicContentStatus = (contentItem = {}) => {
  const rawStatus = String(
    contentItem.status ||
      contentItem.publishStatus ||
      contentItem.state ||
      ""
  )
    .trim()
    .toLowerCase();

  if (rawStatus) return rawStatus;

  if (
    contentItem.isPublished === true ||
    contentItem.published === true
  ) {
    return "published";
  }

  return "draft";
};

export const isPubliclyPublishedContent = (contentItem = {}) =>
  ["published", "publish", "active", "live"].includes(
    normalizePublicContentStatus(contentItem)
  );

export const inspectProtectedContentPayload = (contentItem = {}) => {
  const directAssets = extractProtectedDirectAssets(contentItem);
  const answerEntries = extractProtectedAnswerEntries(contentItem);

  return {
    directAssets,
    answerEntries,
    hasDirectAssets: Object.keys(directAssets).length > 0,
    hasAnswers: answerEntries.length > 0,
    hasProtectedPayload:
      Object.keys(directAssets).length > 0 ||
      answerEntries.length > 0,
  };
};

export const buildPublicContentPayload = (
  contentId = "",
  contentItem = {}
) => {
  const normalizedId = String(contentId || contentItem.id || "").trim();

  if (!normalizedId) {
    throw new Error("Public content payload requires a content id.");
  }

  const protectedPayload = inspectProtectedContentPayload(contentItem);

  return {
    ...sanitizePublicContentValue(contentItem),
    id: normalizedId,
    sourceCollection: "contentItems",
    sourceId: normalizedId,
    status: "published",
    publicSchemaVersion: PUBLIC_CONTENT_SCHEMA_VERSION,
    hasProtectedAsset: protectedPayload.hasProtectedPayload,
    hasProtectedAnswers: protectedPayload.hasAnswers,
  };
};
