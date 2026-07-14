import { db } from "./firebase";

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  buildPublicContentPayload,
  inspectProtectedContentPayload,
  isPubliclyPublishedContent,
  normalizePublicContentStatus,
  PUBLIC_CONTENT_SCHEMA_VERSION,
} from "./publicContentCatalogUtils";

import {
  buildProtectedContentEntitlementId,
  buildProtectedMirrorAssetId,
} from "./protectedContentAssetsService";

export const RAW_CONTENT_COLLECTION = "contentItems";
export const PUBLIC_CONTENT_COLLECTION = "contentItemsPublic";
export const PROTECTED_CONTENT_COLLECTION = "protectedContentAssets";

const cleanString = (value = "") => String(value || "").trim();

const withoutDocumentId = (value = {}) => {
  const { id, ...payload } = value || {};
  return payload;
};

const withWriteTimestamps = (
  contentItem = {},
  { create = false } = {}
) => {
  const now = new Date();
  const nextItem = {
    ...withoutDocumentId(contentItem),
    updatedAt: contentItem.updatedAt || now,
  };

  if (create) {
    nextItem.createdAt = contentItem.createdAt || now;
  }

  return nextItem;
};

const buildProtectedMirrorPayload = (
  contentId = "",
  contentItem = {}
) => {
  const normalizedId = cleanString(contentId || contentItem.id);

  if (!normalizedId) {
    throw new Error("Protected content mirror requires a content id.");
  }

  const protectedPayload = inspectProtectedContentPayload(contentItem);

  if (!protectedPayload.hasProtectedPayload) {
    return null;
  }

  const assetId = buildProtectedMirrorAssetId(
    RAW_CONTENT_COLLECTION,
    normalizedId
  );
  const planType = cleanString(contentItem.planType || "FREE").toUpperCase();
  const sourceStatus = normalizePublicContentStatus(contentItem);
  const mirrorStatus = isPubliclyPublishedContent(contentItem)
    ? "published"
    : sourceStatus;
  const requiredEntitlementId =
    cleanString(contentItem.requiredEntitlementId) ||
    buildProtectedContentEntitlementId({
      ...contentItem,
      id: normalizedId,
      itemId: contentItem.itemId || normalizedId,
    });

  return {
    id: assetId,
    sourceCollection: RAW_CONTENT_COLLECTION,
    sourceId: normalizedId,
    sourceStatus,
    sourceSection: cleanString(contentItem.section),
    sourceTitle: cleanString(contentItem.title || contentItem.name),
    status: mirrorStatus,
    migrationState: "live_sync",
    migrationVersion: "public_catalog_cutover_v1",
    protectedSchemaVersion: PUBLIC_CONTENT_SCHEMA_VERSION,
    planType,
    requiredEntitlementId,
    scopeType: cleanString(contentItem.scopeType || "PLAN").toLowerCase(),
    module: cleanString(contentItem.module),
    itemType: cleanString(
      contentItem.itemType ||
        contentItem.contentType ||
        contentItem.section
    ),
    itemId: cleanString(contentItem.itemId || normalizedId),
    course: cleanString(contentItem.course || "CTET_TET"),
    payloadTypes: [
      ...(protectedPayload.hasDirectAssets ? ["direct_assets"] : []),
      ...(protectedPayload.hasAnswers ? ["answer_payload"] : []),
    ],
    directAssets: protectedPayload.directAssets,
    answerEntries: protectedPayload.answerEntries,
    updatedAt: serverTimestamp(),
    createdAt: contentItem.createdAt || serverTimestamp(),
  };
};

const applyMirrorWrites = (
  writer,
  contentId = "",
  contentItem = {}
) => {
  const normalizedId = cleanString(contentId || contentItem.id);
  const publicRef = doc(db, PUBLIC_CONTENT_COLLECTION, normalizedId);
  const protectedRef = doc(
    db,
    PROTECTED_CONTENT_COLLECTION,
    buildProtectedMirrorAssetId(RAW_CONTENT_COLLECTION, normalizedId)
  );

  if (isPubliclyPublishedContent(contentItem)) {
    writer.set(
      publicRef,
      buildPublicContentPayload(normalizedId, contentItem)
    );
  } else {
    writer.delete(publicRef);
  }

  const protectedPayload = buildProtectedMirrorPayload(
    normalizedId,
    contentItem
  );

  if (protectedPayload) {
    writer.set(protectedRef, protectedPayload);
  } else {
    writer.delete(protectedRef);
  }
};

export const createContentItemWithMirrors = async (
  contentItem = {},
  { contentId = "" } = {}
) => {
  const rawRef = contentId
    ? doc(db, RAW_CONTENT_COLLECTION, cleanString(contentId))
    : doc(collection(db, RAW_CONTENT_COLLECTION));
  const rawPayload = withWriteTimestamps(contentItem, {
    create: true,
  });
  const batch = writeBatch(db);

  batch.set(rawRef, rawPayload);
  applyMirrorWrites(batch, rawRef.id, {
    ...rawPayload,
    id: rawRef.id,
  });

  await batch.commit();

  return rawRef.id;
};

export const updateContentItemWithMirrors = async (
  contentId = "",
  updates = {}
) => {
  const normalizedId = cleanString(contentId);

  if (!normalizedId) {
    throw new Error("Content update requires a content id.");
  }

  const rawRef = doc(db, RAW_CONTENT_COLLECTION, normalizedId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(rawRef);

    if (!snapshot.exists()) {
      throw new Error("Content item not found.");
    }

    const rawUpdates = withWriteTimestamps(updates);
    const nextItem = {
      id: normalizedId,
      ...snapshot.data(),
      ...rawUpdates,
    };

    transaction.update(rawRef, rawUpdates);
    applyMirrorWrites(transaction, normalizedId, nextItem);

    return nextItem;
  });
};

export const deleteContentItemWithMirrors = async (contentId = "") => {
  const normalizedId = cleanString(contentId);

  if (!normalizedId) {
    throw new Error("Content delete requires a content id.");
  }

  const batch = writeBatch(db);

  batch.delete(doc(db, RAW_CONTENT_COLLECTION, normalizedId));
  batch.delete(doc(db, PUBLIC_CONTENT_COLLECTION, normalizedId));
  batch.delete(
    doc(
      db,
      PROTECTED_CONTENT_COLLECTION,
      buildProtectedMirrorAssetId(RAW_CONTENT_COLLECTION, normalizedId)
    )
  );

  await batch.commit();
};

export const syncContentItemMirrors = async (contentId = "") => {
  const normalizedId = cleanString(contentId);

  if (!normalizedId) {
    throw new Error("Content mirror sync requires a content id.");
  }

  const rawRef = doc(db, RAW_CONTENT_COLLECTION, normalizedId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(rawRef);

    if (!snapshot.exists()) {
      throw new Error("Content item not found.");
    }

    const contentItem = {
      id: normalizedId,
      ...snapshot.data(),
    };

    applyMirrorWrites(transaction, normalizedId, contentItem);
    return contentItem;
  });
};

const mapContentSnapshot = (snapshot) =>
  snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

export const loadRawContentItems = async () => {
  const snapshot = await getDocs(
    collection(db, RAW_CONTENT_COLLECTION)
  );

  return mapContentSnapshot(snapshot);
};

export const loadPublicContentItems = async () => {
  const snapshot = await getDocs(
    query(
      collection(db, PUBLIC_CONTENT_COLLECTION),
      where("status", "==", "published"),
      where("sourceCollection", "==", RAW_CONTENT_COLLECTION),
      where(
        "publicSchemaVersion",
        "==",
        PUBLIC_CONTENT_SCHEMA_VERSION
      )
    )
  );

  return mapContentSnapshot(snapshot);
};
