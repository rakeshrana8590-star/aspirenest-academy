import { db } from "./firebase";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { buildStudentEntitlementId } from "./access/accessService";

export const PROTECTED_CONTENT_ASSETS_COLLECTION = "protectedContentAssets";

export const PROTECTED_CONTENT_URL_FIELDS = Object.freeze([
  "fileUrl",
  "pdfUrl",
  "videoUrl",
  "liveUrl",
  "joinUrl",
  "replayUrl",
  "sourceUrl",
  "downloadUrl",
  "assetUrl",
]);

const cleanString = (value = "") => String(value || "").trim();

export const pickProtectedContentUrls = (contentItem = {}) =>
  PROTECTED_CONTENT_URL_FIELDS.reduce((urls, fieldName) => {
    const value = cleanString(contentItem[fieldName]);

    if (value) {
      urls[fieldName] = value;
    }

    return urls;
  }, {});

export const hasProtectedContentUrls = (contentItem = {}) =>
  Object.keys(pickProtectedContentUrls(contentItem)).length > 0;

export const stripProtectedContentUrls = (contentItem = {}) => {
  const publicItem = { ...contentItem };

  PROTECTED_CONTENT_URL_FIELDS.forEach((fieldName) => {
    delete publicItem[fieldName];
  });

  return {
    ...publicItem,
    hasProtectedAsset: hasProtectedContentUrls(contentItem),
  };
};

export const buildProtectedContentEntitlementId = (contentItem = {}) =>
  buildStudentEntitlementId({
    planType: contentItem.planType,
    scopeType: contentItem.scopeType || "PLAN",
    module: contentItem.module || null,
    itemType: contentItem.itemType || contentItem.contentType || null,
    itemId: contentItem.itemId || contentItem.id || null,
    itemIds: Array.isArray(contentItem.itemIds) ? contentItem.itemIds : [],
    bundleId: contentItem.bundleId || null,
    course: contentItem.course || "CTET_TET",
  });

export const buildProtectedContentAssetPayload = (
  contentId = "",
  contentItem = {},
  metadata = {}
) => {
  const normalizedContentId = cleanString(contentId || contentItem.id);
  const urls = pickProtectedContentUrls(contentItem);
  const requiredEntitlementId =
    cleanString(metadata.requiredEntitlementId) ||
    buildProtectedContentEntitlementId({ ...contentItem, id: normalizedContentId });

  if (!normalizedContentId) {
    throw new Error("Protected content asset requires contentId.");
  }

  if (!Object.keys(urls).length) {
    throw new Error("Protected content asset requires at least one URL.");
  }

  return {
    contentId: normalizedContentId,
    title: cleanString(contentItem.title),
    section: cleanString(contentItem.section),
    contentType: cleanString(contentItem.contentType),
    planType: cleanString(contentItem.planType || "FREE"),
    course: cleanString(contentItem.course || "CTET_TET"),
    status: cleanString(metadata.status || contentItem.status || "draft").toLowerCase(),
    requiredEntitlementId,
    urls,
    updatedAt: serverTimestamp(),
    updatedBy: metadata.updatedBy || metadata.actorEmail || "admin",
  };
};

export const saveProtectedContentAsset = async (
  contentId = "",
  contentItem = {},
  metadata = {}
) => {
  const payload = buildProtectedContentAssetPayload(contentId, contentItem, metadata);
  const assetRef = doc(db, PROTECTED_CONTENT_ASSETS_COLLECTION, payload.contentId);

  await setDoc(
    assetRef,
    {
      ...payload,
      createdAt: metadata.createdAt || serverTimestamp(),
      createdBy: metadata.createdBy || metadata.actorEmail || "admin",
    },
    { merge: true }
  );

  return payload;
};

export const readProtectedContentAsset = async (contentId = "") => {
  const normalizedContentId = cleanString(contentId);

  if (!normalizedContentId) {
    return null;
  }

  const assetSnap = await getDoc(
    doc(db, PROTECTED_CONTENT_ASSETS_COLLECTION, normalizedContentId)
  );

  if (!assetSnap.exists()) {
    return null;
  }

  return {
    id: assetSnap.id,
    ...assetSnap.data(),
  };
};

export const getProtectedContentUrl = (
  asset = {},
  preferredFields = PROTECTED_CONTENT_URL_FIELDS
) => {
  const urls = asset.urls || {};

  for (const fieldName of preferredFields) {
    const value = cleanString(urls[fieldName]);

    if (value) {
      return value;
    }
  }

  return "";
};

/* === P0 phase6h-a privacy cutover v1 === */
const PROTECTED_MIRROR_COLLECTION = "protectedContentAssets";

const normalizeProtectedMirrorSegment = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const buildProtectedMirrorAssetId = (
  sourceCollection = "contentItems",
  sourceId = ""
) => {
  const collectionSegment = normalizeProtectedMirrorSegment(
    sourceCollection
  );
  const sourceSegment = normalizeProtectedMirrorSegment(sourceId);

  if (!collectionSegment || !sourceSegment) {
    return "";
  }

  return `${collectionSegment}__${sourceSegment}`;
};

const cloneProtectedMirrorValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(cloneProtectedMirrorValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        cloneProtectedMirrorValue(item),
      ])
    );
  }

  return value;
};

const tokenizeProtectedMirrorPath = (path = "") => {
  const tokens = [];
  const matcher = /([^[.\]]+)|\[(\d+)\]/g;
  let match = matcher.exec(String(path || ""));

  while (match) {
    tokens.push(
      match[1] !== undefined
        ? match[1]
        : Number(match[2])
    );
    match = matcher.exec(String(path || ""));
  }

  return tokens;
};

const setProtectedMirrorPath = (
  target,
  path = "",
  value
) => {
  const tokens = tokenizeProtectedMirrorPath(path);
  if (!tokens.length) return target;

  let cursor = target;

  tokens.forEach((token, index) => {
    const isLast = index === tokens.length - 1;

    if (isLast) {
      cursor[token] = cloneProtectedMirrorValue(value);
      return;
    }

    const nextToken = tokens[index + 1];
    const shouldBeArray = typeof nextToken === "number";

    if (
      cursor[token] === null ||
      typeof cursor[token] !== "object"
    ) {
      cursor[token] = shouldBeArray ? [] : {};
    }

    cursor = cursor[token];
  });

  return target;
};

export const mergeProtectedContentMirror = (
  publicItem = {},
  mirror = {},
  { includeAnswers = false } = {}
) => {
  const merged = cloneProtectedMirrorValue(publicItem || {});
  const directAssets =
    mirror?.directAssets && typeof mirror.directAssets === "object"
      ? mirror.directAssets
      : mirror?.urls && typeof mirror.urls === "object"
      ? mirror.urls
      : {};

  Object.assign(merged, cloneProtectedMirrorValue(directAssets));

  if (includeAnswers) {
    const answerEntries = Array.isArray(mirror?.answerEntries)
      ? mirror.answerEntries
      : [];

    answerEntries.forEach((entry) => {
      if (!entry?.path) return;
      setProtectedMirrorPath(
        merged,
        entry.path,
        entry.value
      );
    });
  }

  return {
    ...merged,
    protectedAssetId: mirror?.id || "",
    protectedAssetLoaded: true,
  };
};

export const loadProtectedContentMirror = async ({
  sourceCollection = "contentItems",
  sourceId = "",
  includeAnswers = false,
  publicItem = {},
} = {}) => {
  const assetId = buildProtectedMirrorAssetId(
    sourceCollection,
    sourceId || publicItem?.id
  );

  if (!assetId) {
    throw new Error("Protected content mirror requires a source id.");
  }

  const snapshot = await getDoc(
    doc(db, PROTECTED_MIRROR_COLLECTION, assetId)
  );

  if (!snapshot.exists()) {
    throw new Error("Protected content is not available.");
  }

  const mirror = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  return mergeProtectedContentMirror(
    publicItem,
    mirror,
    { includeAnswers }
  );
};
