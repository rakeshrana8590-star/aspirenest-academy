import { db } from "./firebase";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  CONTENT_STATUS,
  createContentItem,
  validateContentItem,
} from "./contentSystem";

import {
  createContentItemWithMirrors,
  deleteContentItemWithMirrors,
  PUBLIC_CONTENT_COLLECTION,
  RAW_CONTENT_COLLECTION,
  updateContentItemWithMirrors,
} from "./publicContentCatalogService";
import { PUBLIC_CONTENT_SCHEMA_VERSION } from "./publicContentCatalogUtils";

export const addContentItem = async (contentData) => {
  const item = createContentItem(contentData);
  const validationError = validateContentItem(item);

  if (validationError) {
    throw new Error(validationError);
  }

  return createContentItemWithMirrors(item);
};

export const loadPublishedContent = async (section) => {
  const q = query(
    collection(db, PUBLIC_CONTENT_COLLECTION),
    where("section", "==", section),
    where("status", "==", CONTENT_STATUS.PUBLISHED),
    where("sourceCollection", "==", RAW_CONTENT_COLLECTION),
    where(
      "publicSchemaVersion",
      "==",
      PUBLIC_CONTENT_SCHEMA_VERSION
    )
  );

  let snapshot;

  try {
    snapshot = await getDocs(q);
  } catch (error) {
    console.warn("Universal public CMS collection not ready yet:", error);
    return [];
  }

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

export const updateContentItem = async (contentId, updates) =>
  updateContentItemWithMirrors(contentId, updates);

export const deleteContentItem = async (contentId) =>
  deleteContentItemWithMirrors(contentId);

export const unpublishContentItem = async (contentId) =>
  updateContentItem(contentId, {
    status: CONTENT_STATUS.UNPUBLISHED,
  });

export const archiveContentItem = async (contentId) =>
  updateContentItem(contentId, {
    status: CONTENT_STATUS.ARCHIVED,
  });
