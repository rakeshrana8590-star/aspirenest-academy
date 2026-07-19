import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase";
import {
  INTELLITEXT_AUTHORING_LIMITS,
} from "./intelliTextAuthoringContract";
import {
  buildIntelliTextBlocksPath,
  buildIntelliTextRootPath,
  buildIntelliTextSectionsPath,
} from "./intelliTextFirestorePaths";
import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

const DEFAULT_FIRESTORE_API = Object.freeze({
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
});

export class IntelliTextPublishedContentClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextPublishedContentClientError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextPublishedContentClientError(code, message);
};

const recordsFromSnapshot = (snapshot) => {
  const records = [];
  snapshot?.forEach?.((item) => {
    records.push({ id: item.id, ...item.data() });
  });
  return records.sort(
    (left, right) => Number(left.order || 0) - Number(right.order || 0)
  );
};

export function createIntelliTextPublishedContentClient({
  dbAdapter = db,
  firestoreApi = DEFAULT_FIRESTORE_API,
} = {}) {
  const loadBlocks = async (textbookId, sectionId) => {
    const blockQuery = firestoreApi.query(
      firestoreApi.collection(
        dbAdapter,
        buildIntelliTextBlocksPath(textbookId, sectionId)
      ),
      firestoreApi.orderBy("order", "asc"),
      firestoreApi.limit(INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION)
    );
    const blockSnapshot = await firestoreApi.getDocs(blockQuery);
    return recordsFromSnapshot(blockSnapshot);
  };

  return Object.freeze({
    async loadPublishedTextbook(textbookId) {
      const normalizedTextbookId = normalizeIntelliTextId(
        textbookId,
        "textbookId"
      );
      const rootSnapshot = await firestoreApi.getDoc(
        firestoreApi.doc(
          dbAdapter,
          buildIntelliTextRootPath(normalizedTextbookId)
        )
      );

      if (!rootSnapshot?.exists?.()) {
        fail("PUBLISHED_ROOT_NOT_FOUND", "Published IntelliText root not found.");
      }

      const root = rootSnapshot.data();

      if (
        root.publicationState !== "PUBLISHED" ||
        root.nativeReady !== true ||
        root.deliveryMode !== "NATIVE_TEXT"
      ) {
        fail(
          "PUBLISHED_ROOT_NOT_READY",
          "The IntelliText root is not approved for student delivery."
        );
      }

      const sectionQuery = firestoreApi.query(
        firestoreApi.collection(
          dbAdapter,
          buildIntelliTextSectionsPath(normalizedTextbookId)
        ),
        firestoreApi.orderBy("order", "asc"),
        firestoreApi.limit(INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION)
      );
      const sectionSnapshot = await firestoreApi.getDocs(sectionQuery);
      const sections = recordsFromSnapshot(sectionSnapshot);

      if (sections.length === 0) {
        fail("PUBLISHED_SECTIONS_EMPTY", "Published IntelliText has no sections.");
      }

      const hydratedSections = await Promise.all(
        sections.map(async (section) => {
          const sectionId = section.sectionId || section.id;
          const blocks = await loadBlocks(normalizedTextbookId, sectionId);

          if (blocks.length === 0) {
            fail(
              "PUBLISHED_BLOCKS_EMPTY",
              `Published section ${sectionId} has no learning blocks.`
            );
          }

          return Object.freeze({
            ...section,
            blocks: Object.freeze(blocks),
            sectionId,
          });
        })
      );
      const totalBlocks = hydratedSections.reduce(
        (total, section) => total + section.blocks.length,
        0
      );

      if (totalBlocks > INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION) {
        fail(
          "PUBLISHED_BLOCK_LIMIT_EXCEEDED",
          "Published IntelliText exceeds the approved block budget."
        );
      }

      return Object.freeze({
        ...root,
        deliveryMode: "NATIVE_TEXT",
        deliveryType: "NATIVE_TEXT",
        intelliText: Object.freeze({
          access: root.access || null,
          contentVersion: root.contentVersion,
          publicationState: root.publicationState,
          publishedVersionId: root.publishedVersionId,
          sections: Object.freeze(hydratedSections),
          textbookId: normalizedTextbookId,
        }),
        nativeContent: Object.freeze({
          sections: Object.freeze(hydratedSections),
        }),
        nativeReady: true,
        publicationState: "PUBLISHED",
        sections: Object.freeze(hydratedSections),
        textbookId: normalizedTextbookId,
      });
    },
  });
}

export const intelliTextPublishedContentClient =
  createIntelliTextPublishedContentClient();
