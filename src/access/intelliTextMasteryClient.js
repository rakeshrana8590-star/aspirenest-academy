import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";
import {
  buildExactTextbookSectionRoute,
} from "./mockTestConceptLinkingContract";
import {
  INTELLITEXT_MASTERY_LIMITS,
  INTELLITEXT_MISTAKE_STATES,
  buildIntelliTextAttemptIdentity,
  buildIntelliTextResultIdentity,
  createIntelliTextMistakeStateUpdate,
  hasExactMistakeSectionLink,
} from "./intelliTextMasteryContract";
import {
  buildChapterMasterySnapshot,
  buildMistakesFromEvaluatedQuestions,
  deriveWeakConcepts,
  groupMappedQuestionsByChapter,
} from "./intelliTextMasteryAggregation";
import {
  readIntelliTextProgress,
} from "./intelliTextReaderProgress";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export class IntelliTextMasteryClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextMasteryClientError";
    this.code = code;
  }
}

const DEFAULT_FIRESTORE_API = Object.freeze({
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  timestampFromDate: (value) => Timestamp.fromDate(value),
  updateDoc,
  writeBatch,
});

const fail = (code, message) => {
  throw new IntelliTextMasteryClientError(code, message);
};

const asExplicitDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  fail(
    "EXPLICIT_NOW_REQUIRED",
    "Mock mastery operations require an explicit valid Date."
  );
};

const timestampMillis = (value) => {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return Number(value) || 0;
};

const timestampDate = (value, fallback) => {
  const millis = timestampMillis(value);

  if (millis > 0) {
    return new Date(millis);
  }

  return new Date(fallback.getTime());
};

const snapshotRecords = (snapshot) => {
  const records = [];

  snapshot?.forEach?.((item) => {
    records.push({ id: item.id, ...item.data() });
  });

  return records;
};

const sortMistakes = (items = []) =>
  [...items].sort(
    (left, right) =>
      timestampMillis(right.lastSeenAt || right.updatedAt) -
        timestampMillis(left.lastSeenAt || left.updatedAt) ||
      String(left.mistakeId || "").localeCompare(
        String(right.mistakeId || "")
      )
  );

const sortMastery = (items = []) =>
  [...items].sort(
    (left, right) =>
      Number(right.masteryScore || 0) - Number(left.masteryScore || 0) ||
      String(left.chapterLabel || "").localeCompare(
        String(right.chapterLabel || "")
      )
  );

const buildPrivateCollectionPath = (uid, collectionName) =>
  `studentLearning/${normalizeIntelliTextId(uid, "uid")}/${collectionName}`;

const buildPrivateDocumentPath = (uid, collectionName, recordId) =>
  `${buildPrivateCollectionPath(uid, collectionName)}/${normalizeIntelliTextId(
    recordId,
    "recordId"
  )}`;

export function createIntelliTextMasteryClient({
  authAdapter = auth,
  dbAdapter = db,
  firestoreApi = DEFAULT_FIRESTORE_API,
  storageAdapter =
    typeof window !== "undefined" ? window.localStorage : null,
} = {}) {
  const currentUid = () => {
    const uid = authAdapter?.currentUser?.uid;

    if (!uid) {
      fail("AUTH_REQUIRED", "Sign in before using private mastery records.");
    }

    return normalizeIntelliTextId(uid, "uid");
  };

  const collectionRef = (uid, collectionName) =>
    firestoreApi.collection(
      dbAdapter,
      buildPrivateCollectionPath(uid, collectionName)
    );

  const documentRef = (uid, collectionName, recordId) =>
    firestoreApi.doc(
      dbAdapter,
      buildPrivateDocumentPath(uid, collectionName, recordId)
    );

  const loadCollection = async (uid, collectionName, maximum) => {
    const snapshot = await firestoreApi.getDocs(
      firestoreApi.query(
        collectionRef(uid, collectionName),
        firestoreApi.limit(maximum)
      )
    );

    return snapshotRecords(snapshot);
  };

  return Object.freeze({
    async loadWorkspace({ now }) {
      const uid = currentUid();
      const explicitNow = asExplicitDate(now);
      const [mistakes, mastery] = await Promise.all([
        loadCollection(
          uid,
          "mistakeBook",
          INTELLITEXT_MASTERY_LIMITS.MAX_MISTAKES_PER_LOAD
        ),
        loadCollection(
          uid,
          "masteryProgress",
          INTELLITEXT_MASTERY_LIMITS.MAX_MASTERY_ITEMS_PER_LOAD
        ),
      ]);
      const mistakeBook = sortMistakes(mistakes);

      return Object.freeze({
        mastery: Object.freeze(sortMastery(mastery)),
        mistakeBook: Object.freeze(mistakeBook),
        weakConcepts: deriveWeakConcepts({
          mistakes: mistakeBook,
          now: explicitNow,
        }),
      });
    },

    async syncResultLearning({
      attemptId,
      evaluatedQuestions = [],
      now,
      resultId,
      test = {},
    } = {}) {
      const uid = currentUid();
      const explicitNow = asExplicitDate(now);
      const normalizedResultId = buildIntelliTextResultIdentity(resultId);
      const normalizedAttemptId = buildIntelliTextAttemptIdentity(
        attemptId || resultId
      );
      const [existingMistakes, existingMastery, revisionItems] =
        await Promise.all([
          loadCollection(
            uid,
            "mistakeBook",
            INTELLITEXT_MASTERY_LIMITS.MAX_MISTAKES_PER_LOAD
          ),
          loadCollection(
            uid,
            "masteryProgress",
            INTELLITEXT_MASTERY_LIMITS.MAX_MASTERY_ITEMS_PER_LOAD
          ),
          loadCollection(uid, "revisionQueue", 100),
        ]);
      const existingMistakeIds = new Set(
        existingMistakes.map((item) => item.mistakeId || item.id)
      );
      const candidateMistakes = buildMistakesFromEvaluatedQuestions({
        attemptId: normalizedAttemptId,
        evaluatedQuestions,
        now: explicitNow,
        resultId: normalizedResultId,
        test,
        uid,
      });
      const newMistakes = candidateMistakes
        .filter((item) => !existingMistakeIds.has(item.mistakeId))
        .map((item) => {
          const previousOccurrences = existingMistakes.filter(
            (existing) =>
              existing.testId === item.testId &&
              existing.questionId === item.questionId
          );
          const previousOccurrenceCount = previousOccurrences.reduce(
            (maximum, existing) =>
              Math.max(
                maximum,
                Number(existing.occurrenceCount) || 1
              ),
            0
          );
          const firstSeenAt = previousOccurrences.reduce(
            (earliest, existing) => {
              const candidate = timestampDate(
                existing.firstSeenAt,
                explicitNow
              );

              return candidate.getTime() < earliest.getTime()
                ? candidate
                : earliest;
            }, explicitNow
          );

          return Object.freeze({
            ...item,
            firstSeenAt,
            lastSeenAt: explicitNow,
            occurrenceCount: previousOccurrenceCount + 1,
          });
        });
      const allMistakes = [...existingMistakes, ...newMistakes];
      const groups = groupMappedQuestionsByChapter({
        evaluatedQuestions,
        test,
      });
      const existingMasteryById = new Map(
        existingMastery.map((item) => [item.masteryId || item.id, item])
      );
      const masteryRecords = groups.map((group) => {
        const relatedMistakes = allMistakes.filter(
          (item) =>
            item.textbookId === group.textbookId &&
            item.chapter === group.chapterLabel
        );
        const relatedRevision = revisionItems.filter(
          (item) => item.textbookId === group.textbookId
        );
        const readingProgress = readIntelliTextProgress({
          storage: storageAdapter,
          uid,
          textbookId: group.textbookId,
          contentVersion: group.contentVersion,
        });
        const provisional = buildChapterMasterySnapshot({
          ...group,
          evaluatedQuestions: group.evaluatedQuestions,
          mistakes: relatedMistakes,
          now: explicitNow,
          readingProgress,
          revisionItems: relatedRevision,
          uid,
        });
        const existing = existingMasteryById.get(provisional.masteryId);

        return {
          ...provisional,
          createdAt: existing?.createdAt || provisional.createdAt,
        };
      });
      const batch = firestoreApi.writeBatch(dbAdapter);
      const serverTime = firestoreApi.serverTimestamp();
      let writes = 0;

      newMistakes.forEach((item) => {
        batch.set(
          documentRef(uid, "mistakeBook", item.mistakeId),
          {
            ...item,
            createdAt: serverTime,
            firstSeenAt:
              item.occurrenceCount > 1
                ? firestoreApi.timestampFromDate(item.firstSeenAt)
                : serverTime,
            lastSeenAt: serverTime,
            retryDueAt: firestoreApi.timestampFromDate(item.retryDueAt),
            updatedAt: serverTime,
          }
        );
        writes += 1;
      });

      masteryRecords.forEach((item) => {
        const existing = existingMasteryById.get(item.masteryId);

        batch.set(
          documentRef(uid, "masteryProgress", item.masteryId),
          {
            ...item,
            calculatedAt: serverTime,
            createdAt: existing?.createdAt || serverTime,
            updatedAt: serverTime,
          }
        );
        writes += 1;
      });

      if (writes > 0) {
        await batch.commit();
      }

      return Object.freeze({
        idempotentSkipped: candidateMistakes.length - newMistakes.length,
        masteryRecords: Object.freeze(masteryRecords),
        mistakesCreated: newMistakes.length,
        writes,
      });
    },

    async updateMistakeState(
      mistakeId,
      state,
      { now, retryDueAt = null } = {}
    ) {
      const uid = currentUid();
      const explicitNow = asExplicitDate(now);
      const reference = documentRef(uid, "mistakeBook", mistakeId);
      const snapshot = await firestoreApi.getDoc(reference);

      if (!snapshot?.exists?.()) {
        fail("MISTAKE_NOT_FOUND", "Private mistake record was not found.");
      }

      const existing = snapshot.data();
      const update = createIntelliTextMistakeStateUpdate({
        resolvedAt:
          state === INTELLITEXT_MISTAKE_STATES.RESOLVED
            ? firestoreApi.serverTimestamp()
            : null,
        retriedAt:
          state === INTELLITEXT_MISTAKE_STATES.RETRIED
            ? firestoreApi.serverTimestamp()
            : existing.retriedAt || null,
        retryDueAt:
          retryDueAt instanceof Date
            ? firestoreApi.timestampFromDate(retryDueAt)
            : existing.retryDueAt || null,
        state,
        updatedAt: firestoreApi.serverTimestamp(),
      });

      await firestoreApi.updateDoc(reference, update);

      return Object.freeze({
        mistakeId: normalizeIntelliTextId(mistakeId, "mistakeId"),
        state: update.state,
        updatedAt: explicitNow,
      });
    },

    buildExactSectionRoute(mistake) {
      if (!hasExactMistakeSectionLink(mistake)) {
        return "";
      }

      return buildExactTextbookSectionRoute(mistake);
    },

    buildSourceReviewRoute(mistake = {}) {
      const testId = normalizeIntelliTextId(mistake.testId, "testId");
      return `/ctet-tet/mock-tests/review/${encodeURIComponent(testId)}`;
    },
  });
}

export const intelliTextMasteryClient = createIntelliTextMasteryClient();
