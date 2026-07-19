import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";
import {
  INTELLITEXT_FLASHCARD_SOURCE_KINDS,
  INTELLITEXT_FLASHCARD_STATES,
  INTELLITEXT_REVISION_LIMITS,
  INTELLITEXT_REVISION_SOURCE_KINDS,
  INTELLITEXT_REVISION_STATES,
  createIntelliTextFlashcardRecord,
  createIntelliTextFlashcardUpdate,
  createIntelliTextRevisionQueueRecord,
  createIntelliTextRevisionReviewUpdate,
  createIntelliTextRevisionStateUpdate,
} from "./intelliTextRevisionContract";
import {
  partitionIntelliTextRevisionQueue,
  scheduleIntelliTextRevision,
} from "./intelliTextRevisionScheduler";
import {
  buildStudentLearningCollectionPath,
  buildStudentLearningDocumentPath,
} from "./intelliTextFirestorePaths";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";
import {
  normalizeIntelliTextStudyUid,
} from "./intelliTextStudyWorkspaceContract";

export class IntelliTextRevisionClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextRevisionClientError";
    this.code = code;
  }
}

const DEFAULT_FIRESTORE_API = Object.freeze({
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  timestampFromDate: (value) => Timestamp.fromDate(value),
  updateDoc,
  writeBatch,
});

const fail = (code, message) => {
  throw new IntelliTextRevisionClientError(code, message);
};

const timestampMillis = (value) => {
  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
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

  return records;
};

const sortFlashcards = (items = []) =>
  [...items].sort((left, right) => {
    const timeDifference =
      timestampMillis(right.updatedAt || right.createdAt) -
      timestampMillis(left.updatedAt || left.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return String(left.flashcardId || "").localeCompare(
      String(right.flashcardId || "")
    );
  });

const asExplicitDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  fail(
    "EXPLICIT_NOW_REQUIRED",
    "Revision operations require an explicit valid Date."
  );
};

export function createIntelliTextRevisionClient({
  authAdapter = auth,
  dbAdapter = db,
  firestoreApi = DEFAULT_FIRESTORE_API,
} = {}) {
  const currentUid = () => {
    const uid = authAdapter?.currentUser?.uid;

    if (!uid) {
      fail(
        "AUTH_REQUIRED",
        "Sign in before using My Study Workspace."
      );
    }

    return normalizeIntelliTextStudyUid(uid);
  };

  const collectionReference = (uid, collectionName) =>
    firestoreApi.collection(
      dbAdapter,
      buildStudentLearningCollectionPath(uid, collectionName)
    );

  const documentReference = (
    uid,
    collectionName,
    recordId
  ) =>
    firestoreApi.doc(
      dbAdapter,
      buildStudentLearningDocumentPath(
        uid,
        collectionName,
        recordId
      )
    );

  const loadCollection = async ({
    uid,
    collectionName,
    maximum,
  }) => {
    const constrainedQuery = firestoreApi.query(
      collectionReference(uid, collectionName),
      firestoreApi.limit(maximum)
    );
    const snapshot = await firestoreApi.getDocs(constrainedQuery);
    return recordsFromSnapshot(snapshot);
  };

  const sharedSnapshot = (input = {}) => ({
    blockId: normalizeIntelliTextId(input.blockId, "blockId"),
    contentVersion: Number(input.contentVersion),
    noteTitle: input.noteTitle || "",
    sectionId: normalizeIntelliTextId(input.sectionId, "sectionId"),
    sectionTitle: input.sectionTitle || "",
    selectionAnchor: input.selectionAnchor ?? null,
    textbookId: normalizeIntelliTextId(input.textbookId, "textbookId"),
  });

  const createFlashcardPair = async ({
    input,
    now,
    sourceKind,
  }) => {
    const uid = currentUid();
    const explicitNow = asExplicitDate(now);
    const flashcards = collectionReference(uid, "flashcards");
    const flashcardReference = firestoreApi.doc(flashcards);
    const flashcardId = normalizeIntelliTextId(
      flashcardReference.id,
      "flashcardId"
    );
    const revisionReference = documentReference(
      uid,
      "revisionQueue",
      flashcardId
    );
    const timestamp = firestoreApi.serverTimestamp();
    const dueAt = firestoreApi.timestampFromDate(explicitNow);
    const snapshot = sharedSnapshot(input);
    const flashcard = createIntelliTextFlashcardRecord({
      ...snapshot,
      answer: input.answer,
      createdAt: timestamp,
      flashcardId,
      prompt: input.prompt,
      sourceId: input.sourceId || flashcardId,
      sourceKind,
      state: INTELLITEXT_FLASHCARD_STATES.ACTIVE,
      uid,
      updatedAt: timestamp,
    });
    const revisionItem = createIntelliTextRevisionQueueRecord({
      ...snapshot,
      answer: flashcard.answer,
      createdAt: timestamp,
      dueAt,
      intervalDays: 0,
      lastRating: null,
      lastReviewedAt: null,
      prompt: flashcard.prompt,
      recallStreak: 0,
      reviewCount: 0,
      revisionId: flashcardId,
      sourceId: flashcardId,
      sourceKind: INTELLITEXT_REVISION_SOURCE_KINDS.FLASHCARD,
      state: INTELLITEXT_REVISION_STATES.ACTIVE,
      uid,
      updatedAt: timestamp,
    });
    const batch = firestoreApi.writeBatch(dbAdapter);

    batch.set(flashcardReference, flashcard);
    batch.set(revisionReference, revisionItem);
    await batch.commit();

    return Object.freeze({
      flashcard,
      revisionItem,
      writes: 2,
    });
  };

  return Object.freeze({
    async loadWorkspace({ now }) {
      const uid = currentUid();
      const explicitNow = asExplicitDate(now);
      const [flashcards, revisionItems] = await Promise.all([
        loadCollection({
          uid,
          collectionName: "flashcards",
          maximum:
            INTELLITEXT_REVISION_LIMITS.MAX_FLASHCARDS_PER_LOAD,
        }),
        loadCollection({
          uid,
          collectionName: "revisionQueue",
          maximum:
            INTELLITEXT_REVISION_LIMITS.MAX_REVISION_ITEMS_PER_LOAD,
        }),
      ]);
      const partition = partitionIntelliTextRevisionQueue(
        revisionItems,
        explicitNow
      );

      return Object.freeze({
        due: partition.due,
        flashcards: Object.freeze(sortFlashcards(flashcards)),
        inactive: partition.inactive,
        revisionItems: Object.freeze(revisionItems),
        uid,
        upcoming: partition.upcoming,
      });
    },

    async createFlashcardFromSelection(input = {}, { now } = {}) {
      return createFlashcardPair({
        input,
        now,
        sourceKind: INTELLITEXT_FLASHCARD_SOURCE_KINDS.SELECTION,
      });
    },

    async createFlashcardFromAnnotation(input = {}, { now } = {}) {
      return createFlashcardPair({
        input,
        now,
        sourceKind: INTELLITEXT_FLASHCARD_SOURCE_KINDS.ANNOTATION,
      });
    },

    async createManualFlashcard(input = {}, { now } = {}) {
      return createFlashcardPair({
        input,
        now,
        sourceKind: INTELLITEXT_FLASHCARD_SOURCE_KINDS.MANUAL,
      });
    },

    async addSelectionToRevision(input = {}, { now } = {}) {
      const uid = currentUid();
      const explicitNow = asExplicitDate(now);
      const targetCollection = collectionReference(uid, "revisionQueue");
      const targetDocument = firestoreApi.doc(targetCollection);
      const revisionId = normalizeIntelliTextId(
        targetDocument.id,
        "revisionId"
      );
      const timestamp = firestoreApi.serverTimestamp();
      const record = createIntelliTextRevisionQueueRecord({
        ...sharedSnapshot(input),
        answer:
          input.answer ||
          input.selectionAnchor?.exactText ||
          "Saved revision concept",
        createdAt: timestamp,
        dueAt: firestoreApi.timestampFromDate(explicitNow),
        intervalDays: 0,
        lastRating: null,
        lastReviewedAt: null,
        prompt: input.prompt || "Recall this saved concept.",
        recallStreak: 0,
        reviewCount: 0,
        revisionId,
        sourceId: revisionId,
        sourceKind: INTELLITEXT_REVISION_SOURCE_KINDS.SELECTION,
        state: INTELLITEXT_REVISION_STATES.ACTIVE,
        uid,
        updatedAt: timestamp,
      });

      await firestoreApi.setDoc(targetDocument, record);

      return Object.freeze({
        revisionItem: record,
        writes: 1,
      });
    },

    async updateFlashcard(flashcardId, changes = {}) {
      const uid = currentUid();
      const update = createIntelliTextFlashcardUpdate({
        ...changes,
        updatedAt: firestoreApi.serverTimestamp(),
      });

      await firestoreApi.updateDoc(
        documentReference(uid, "flashcards", flashcardId),
        update
      );

      return update;
    },

    async updateRevisionState(revisionId, state) {
      const uid = currentUid();
      const update = createIntelliTextRevisionStateUpdate({
        state,
        updatedAt: firestoreApi.serverTimestamp(),
      });

      await firestoreApi.updateDoc(
        documentReference(uid, "revisionQueue", revisionId),
        update
      );

      return update;
    },

    async reviewRevisionItem(revisionId, rating, { now } = {}) {
      const uid = currentUid();
      const explicitNow = asExplicitDate(now);
      const reference = documentReference(
        uid,
        "revisionQueue",
        revisionId
      );
      const snapshot = await firestoreApi.getDoc(reference);

      if (!snapshot?.exists?.()) {
        fail(
          "REVISION_ITEM_NOT_FOUND",
          "This revision item is no longer available."
        );
      }

      const scheduled = scheduleIntelliTextRevision({
        current: snapshot.data(),
        now: explicitNow,
        rating,
      });
      const update = createIntelliTextRevisionReviewUpdate({
        ...scheduled,
        dueAt: firestoreApi.timestampFromDate(scheduled.dueAt),
        lastReviewedAt: firestoreApi.timestampFromDate(
          scheduled.lastReviewedAt
        ),
        updatedAt: firestoreApi.serverTimestamp(),
      });

      await firestoreApi.updateDoc(reference, update);
      return update;
    },

    async deleteFlashcard(flashcardId) {
      const uid = currentUid();
      const normalizedId = normalizeIntelliTextId(
        flashcardId,
        "flashcardId"
      );
      const batch = firestoreApi.writeBatch(dbAdapter);

      batch.delete(
        documentReference(uid, "flashcards", normalizedId)
      );
      batch.delete(
        documentReference(uid, "revisionQueue", normalizedId)
      );
      await batch.commit();
      return true;
    },

    async deleteRevisionItem(revisionId) {
      const uid = currentUid();
      await firestoreApi.deleteDoc(
        documentReference(uid, "revisionQueue", revisionId)
      );
      return true;
    },
  });
}

export const intelliTextRevisionClient =
  createIntelliTextRevisionClient();
