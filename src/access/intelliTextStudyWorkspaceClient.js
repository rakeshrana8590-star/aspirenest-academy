import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";
import {
  INTELLITEXT_ANNOTATION_TYPES,
  createIntelliTextAnnotationRecord,
  createIntelliTextAnnotationUpdate,
  createIntelliTextBookmarkRecord,
  createIntelliTextBookmarkUpdate,
  normalizeIntelliTextStudyUid,
} from "./intelliTextStudyWorkspaceContract";
import {
  buildStudentLearningCollectionPath,
  buildStudentLearningDocumentPath,
} from "./intelliTextFirestorePaths";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export class IntelliTextStudyWorkspaceClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextStudyWorkspaceClientError";
    this.code = code;
  }
}

const DEFAULT_FIRESTORE_API = Object.freeze({
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
});

const fail = (code, message) => {
  throw new IntelliTextStudyWorkspaceClientError(code, message);
};

const timestampMillis = (value) => {
  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return Number(value) || 0;
};

const recordsFromSnapshot = (snapshot) => {
  const records = [];

  snapshot?.forEach?.((item) => {
    records.push({
      id: item.id,
      ...item.data(),
    });
  });

  return records.sort(
    (left, right) =>
      timestampMillis(right.updatedAt || right.createdAt) -
      timestampMillis(left.updatedAt || left.createdAt)
  );
};

export function createIntelliTextStudyWorkspaceClient({
  authAdapter = auth,
  dbAdapter = db,
  firestoreApi = DEFAULT_FIRESTORE_API,
} = {}) {
  const currentUid = () => {
    const uid = authAdapter?.currentUser?.uid;

    if (!uid) {
      fail("AUTH_REQUIRED", "Sign in before using the private study workspace.");
    }

    return normalizeIntelliTextStudyUid(uid);
  };

  const collectionReference = (uid, collectionName) =>
    firestoreApi.collection(
      dbAdapter,
      buildStudentLearningCollectionPath(uid, collectionName)
    );

  const documentReference = (uid, collectionName, recordId) =>
    firestoreApi.doc(
      dbAdapter,
      buildStudentLearningDocumentPath(uid, collectionName, recordId)
    );

  const loadCollection = async ({
    uid,
    collectionName,
    textbookId,
  }) => {
    const normalizedTextbookId = normalizeIntelliTextId(
      textbookId,
      "textbookId"
    );
    const workspaceQuery = firestoreApi.query(
      collectionReference(uid, collectionName),
      firestoreApi.where("textbookId", "==", normalizedTextbookId)
    );
    const snapshot = await firestoreApi.getDocs(workspaceQuery);
    return recordsFromSnapshot(snapshot);
  };

  return Object.freeze({
    async loadTextbookWorkspace(textbookId) {
      const uid = currentUid();
      const [annotations, bookmarks] = await Promise.all([
        loadCollection({
          uid,
          collectionName: "annotations",
          textbookId,
        }),
        loadCollection({
          uid,
          collectionName: "bookmarks",
          textbookId,
        }),
      ]);

      return Object.freeze({
        annotations: Object.freeze(annotations),
        bookmarks: Object.freeze(bookmarks),
        uid,
      });
    },

    async createAnnotation(input = {}) {
      const uid = currentUid();
      const targetCollection = collectionReference(uid, "annotations");
      const targetDocument = firestoreApi.doc(targetCollection);
      const timestamp = firestoreApi.serverTimestamp();
      const record = createIntelliTextAnnotationRecord({
        ...input,
        annotationId: targetDocument.id,
        uid,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await firestoreApi.setDoc(targetDocument, record);
      return record;
    },

    async updateAnnotation(annotationId, changes = {}) {
      const uid = currentUid();
      const update = createIntelliTextAnnotationUpdate({
        ...changes,
        updatedAt: firestoreApi.serverTimestamp(),
      });

      await firestoreApi.updateDoc(
        documentReference(uid, "annotations", annotationId),
        update
      );

      return update;
    },

    async deleteAnnotation(annotationId) {
      const uid = currentUid();
      await firestoreApi.deleteDoc(
        documentReference(uid, "annotations", annotationId)
      );
      return true;
    },

    async createBookmark(input = {}) {
      const uid = currentUid();
      const targetCollection = collectionReference(uid, "bookmarks");
      const targetDocument = firestoreApi.doc(targetCollection);
      const timestamp = firestoreApi.serverTimestamp();
      const record = createIntelliTextBookmarkRecord({
        ...input,
        bookmarkId: targetDocument.id,
        uid,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await firestoreApi.setDoc(targetDocument, record);
      return record;
    },

    async updateBookmark(bookmarkId, changes = {}) {
      const uid = currentUid();
      const update = createIntelliTextBookmarkUpdate({
        ...changes,
        updatedAt: firestoreApi.serverTimestamp(),
      });

      await firestoreApi.updateDoc(
        documentReference(uid, "bookmarks", bookmarkId),
        update
      );

      return update;
    },

    async deleteBookmark(bookmarkId) {
      const uid = currentUid();
      await firestoreApi.deleteDoc(
        documentReference(uid, "bookmarks", bookmarkId)
      );
      return true;
    },

    annotationTypes: INTELLITEXT_ANNOTATION_TYPES,
  });
}

export const intelliTextStudyWorkspaceClient =
  createIntelliTextStudyWorkspaceClient();
