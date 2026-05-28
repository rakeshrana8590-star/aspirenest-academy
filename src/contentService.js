import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import {
  CONTENT_STATUS,
  createContentItem,
  validateContentItem,
} from "./contentSystem";

const CONTENT_COLLECTION = "contentItems";

export const addContentItem = async (contentData) => {
  const item = createContentItem(contentData);
  const validationError = validateContentItem(item);

  if (validationError) {
    throw new Error(validationError);
  }

  const docRef = await addDoc(
    collection(db, CONTENT_COLLECTION),
    item
  );

  return docRef.id;
};

export const loadPublishedContent = async (section) => {
  const q = query(
    collection(db, CONTENT_COLLECTION),
    where("section", "==", section),
    where("status", "==", CONTENT_STATUS.PUBLISHED),
    orderBy("createdAt", "desc")
  );

  let snapshot;

try {
  snapshot = await getDocs(q);
} catch (error) {
  console.warn(
    "Universal CMS collection not ready yet:",
    error
  );

  return [];
}

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

export const updateContentItem = async (contentId, updates) => {
  await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
    ...updates,
    updatedAt: new Date(),
  });
};

export const deleteContentItem = async (contentId) => {
  await deleteDoc(doc(db, CONTENT_COLLECTION, contentId));
};

export const unpublishContentItem = async (contentId) => {
  await updateContentItem(contentId, {
    status: CONTENT_STATUS.UNPUBLISHED,
  });
};

export const archiveContentItem = async (contentId) => {
  await updateContentItem(contentId, {
    status: CONTENT_STATUS.ARCHIVED,
  });
};