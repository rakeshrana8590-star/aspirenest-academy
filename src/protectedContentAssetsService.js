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
  "recordingUrl",
  "meetingUrl",
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

export const readProtectedVideoAssetForDecision = async ({
  assetId = "",
  videoId = "",
  decision = {},
} = {}) => {
  const normalizedAssetId = cleanString(assetId || videoId);
  const normalizedVideoId = cleanString(videoId);

  if (!normalizedAssetId || !normalizedVideoId) {
    throw new Error("Protected video asset requires assetId and videoId.");
  }

  if (
    decision?.allowed !== true ||
    decision?.canWatch !== true ||
    decision?.canResolveAsset !== true ||
    cleanString(decision?.videoId) !== normalizedVideoId
  ) {
    throw new Error("Protected video asset authorization denied.");
  }

  return readProtectedContentAsset(normalizedAssetId);
};
