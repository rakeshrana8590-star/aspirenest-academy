import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import {
  INTELLITEXT_AUTHORING_LIMITS,
  INTELLITEXT_AUTHORING_VERSION_STATES,
  assertIntelliTextVersionPublishable,
  buildIntelliTextCanonicalContentPatch,
  createIntelliTextAuthoringVersion,
  createIntelliTextPublishedBlock,
  createIntelliTextPublishedRoot,
  createIntelliTextPublishedSection,
  validateIntelliTextAuthoringDraft,
} from "./intelliTextAuthoringContract";
import {
  buildIntelliTextAuthoringBlockPath,
  buildIntelliTextAuthoringBlocksPath,
  buildIntelliTextAuthoringSectionPath,
  buildIntelliTextAuthoringSectionsPath,
  buildIntelliTextAuthoringVersionPath,
  buildIntelliTextAuthoringVersionsPath,
  buildIntelliTextBlockPath,
  buildIntelliTextBlocksPath,
  buildIntelliTextRootPath,
  buildIntelliTextSectionPath,
  buildIntelliTextSectionsPath,
} from "./intelliTextFirestorePaths";
import { normalizeIntelliTextId } from "./intelliTextDataContract";

const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const CONTENT_ITEMS_COLLECTION = "contentItems";

const DEFAULT_FIRESTORE_API = Object.freeze({
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
});

export class IntelliTextAuthoringClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextAuthoringClientError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextAuthoringClientError(code, message);
};

const cleanEmail = (value = "") => String(value ?? "").trim().toLowerCase();

const snapshotRecord = (snapshot) =>
  snapshot?.exists?.()
    ? Object.freeze({ id: snapshot.id, ...snapshot.data() })
    : null;

const recordsFromSnapshot = (snapshot) => {
  const records = [];
  snapshot?.forEach?.((item) => {
    records.push({ id: item.id, ...item.data() });
  });
  return records;
};

const sortByOrder = (records = []) =>
  [...records].sort(
    (left, right) => Number(left.order || 0) - Number(right.order || 0)
  );

const timestampMillis = (value) => {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
};

const sortVersions = (versions = []) =>
  [...versions].sort(
    (left, right) =>
      Number(right.contentVersion || 0) - Number(left.contentVersion || 0) ||
      timestampMillis(right.updatedAt) - timestampMillis(left.updatedAt)
  );

export function createIntelliTextAuthoringClient({
  authAdapter = auth,
  dbAdapter = db,
  firestoreApi = DEFAULT_FIRESTORE_API,
} = {}) {
  const requireAdmin = () => {
    const currentUser = authAdapter?.currentUser;

    if (!currentUser?.uid) {
      fail("AUTH_REQUIRED", "Sign in before using IntelliText authoring.");
    }

    if (cleanEmail(currentUser.email) !== ADMIN_EMAIL) {
      fail("ADMIN_REQUIRED", "Only the AspireNest admin may author IntelliText.");
    }

    return Object.freeze({
      email: cleanEmail(currentUser.email),
      uid: normalizeIntelliTextId(currentUser.uid, "adminUid"),
    });
  };

  const rootRef = (textbookId) =>
    firestoreApi.doc(dbAdapter, buildIntelliTextRootPath(textbookId));

  const contentItemRef = (textbookId) =>
    firestoreApi.doc(
      dbAdapter,
      CONTENT_ITEMS_COLLECTION,
      normalizeIntelliTextId(textbookId, "textbookId")
    );

  const versionRef = (textbookId, versionId) =>
    firestoreApi.doc(
      dbAdapter,
      buildIntelliTextAuthoringVersionPath(textbookId, versionId)
    );

  const authoringSectionsRef = (textbookId, versionId) =>
    firestoreApi.collection(
      dbAdapter,
      buildIntelliTextAuthoringSectionsPath(textbookId, versionId)
    );

  const publishedSectionsRef = (textbookId) =>
    firestoreApi.collection(dbAdapter, buildIntelliTextSectionsPath(textbookId));

  const loadBlocks = async ({ textbookId, versionId, sectionId, published }) => {
    const path = published
      ? buildIntelliTextBlocksPath(textbookId, sectionId)
      : buildIntelliTextAuthoringBlocksPath(textbookId, versionId, sectionId);
    const blockQuery = firestoreApi.query(
      firestoreApi.collection(dbAdapter, path),
      firestoreApi.orderBy("order", "asc"),
      firestoreApi.limit(INTELLITEXT_AUTHORING_LIMITS.MAX_BLOCKS_PER_VERSION)
    );
    const snapshot = await firestoreApi.getDocs(blockQuery);
    return sortByOrder(recordsFromSnapshot(snapshot));
  };

  const loadGraph = async ({ textbookId, versionId = "", published = false }) => {
    const normalizedTextbookId = normalizeIntelliTextId(
      textbookId,
      "textbookId"
    );
    const sectionPath = published
      ? buildIntelliTextSectionsPath(normalizedTextbookId)
      : buildIntelliTextAuthoringSectionsPath(
          normalizedTextbookId,
          normalizeIntelliTextId(versionId, "versionId")
        );
    const sectionQuery = firestoreApi.query(
      firestoreApi.collection(dbAdapter, sectionPath),
      firestoreApi.orderBy("order", "asc"),
      firestoreApi.limit(INTELLITEXT_AUTHORING_LIMITS.MAX_SECTIONS_PER_VERSION)
    );
    const sectionSnapshot = await firestoreApi.getDocs(sectionQuery);
    const sectionRecords = sortByOrder(recordsFromSnapshot(sectionSnapshot));
    const sections = await Promise.all(
      sectionRecords.map(async (section) => ({
        ...section,
        blocks: await loadBlocks({
          textbookId: normalizedTextbookId,
          versionId,
          sectionId: section.sectionId || section.id,
          published,
        }),
      }))
    );

    return Object.freeze({
      sections: Object.freeze(sections),
      textbookId: normalizedTextbookId,
      versionId: published ? null : versionId,
    });
  };

  const loadExistingDraftReferences = async ({ textbookId, versionId }) => {
    const graph = await loadGraph({ textbookId, versionId, published: false });
    const sectionRefs = [];
    const blockRefs = [];

    graph.sections.forEach((section) => {
      const sectionId = section.sectionId || section.id;
      sectionRefs.push({
        id: sectionId,
        ref: firestoreApi.doc(
          dbAdapter,
          buildIntelliTextAuthoringSectionPath(
            textbookId,
            versionId,
            sectionId
          )
        ),
      });
      section.blocks.forEach((block) => {
        const blockId = block.blockId || block.id;
        blockRefs.push({
          id: `${sectionId}/${blockId}`,
          ref: firestoreApi.doc(
            dbAdapter,
            buildIntelliTextAuthoringBlockPath(
              textbookId,
              versionId,
              sectionId,
              blockId
            )
          ),
        });
      });
    });

    return { blockRefs, sectionRefs };
  };

  const loadExistingPublishedReferences = async (textbookId) => {
    const graph = await loadGraph({ textbookId, published: true });
    const sectionRefs = [];
    const blockRefs = [];

    graph.sections.forEach((section) => {
      const sectionId = section.sectionId || section.id;
      sectionRefs.push({
        id: sectionId,
        ref: firestoreApi.doc(
          dbAdapter,
          buildIntelliTextSectionPath(textbookId, sectionId)
        ),
      });
      section.blocks.forEach((block) => {
        const blockId = block.blockId || block.id;
        blockRefs.push({
          id: `${sectionId}/${blockId}`,
          ref: firestoreApi.doc(
            dbAdapter,
            buildIntelliTextBlockPath(textbookId, sectionId, blockId)
          ),
        });
      });
    });

    return { blockRefs, sectionRefs };
  };

  return Object.freeze({
    async loadAuthoringWorkspace(textbookId) {
      requireAdmin();
      const normalizedTextbookId = normalizeIntelliTextId(
        textbookId,
        "textbookId"
      );
      const [rootSnapshot, contentSnapshot, versionsSnapshot] =
        await Promise.all([
          firestoreApi.getDoc(rootRef(normalizedTextbookId)),
          firestoreApi.getDoc(contentItemRef(normalizedTextbookId)),
          firestoreApi.getDocs(
            firestoreApi.query(
              firestoreApi.collection(
                dbAdapter,
                buildIntelliTextAuthoringVersionsPath(normalizedTextbookId)
              ),
              firestoreApi.orderBy("contentVersion", "desc"),
              firestoreApi.limit(20)
            )
          ),
        ]);
      const versions = sortVersions(recordsFromSnapshot(versionsSnapshot));
      const editableVersion =
        versions.find((version) =>
          [
            INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT,
            INTELLITEXT_AUTHORING_VERSION_STATES.READY_FOR_REVIEW,
          ].includes(version.versionState)
        ) || null;
      const graph = editableVersion
        ? await loadGraph({
            textbookId: normalizedTextbookId,
            versionId: editableVersion.versionId || editableVersion.id,
            published: false,
          })
        : null;

      return Object.freeze({
        contentItem: snapshotRecord(contentSnapshot),
        editableVersion,
        graph,
        root: snapshotRecord(rootSnapshot),
        versions: Object.freeze(versions),
      });
    },

    async saveDraftVersion(input = {}) {
      const admin = requireAdmin();
      const graph = validateIntelliTextAuthoringDraft(input);
      const [rootSnapshot, versionSnapshot, existing] = await Promise.all([
        firestoreApi.getDoc(rootRef(graph.textbookId)),
        firestoreApi.getDoc(versionRef(graph.textbookId, graph.versionId)),
        loadExistingDraftReferences({
          textbookId: graph.textbookId,
          versionId: graph.versionId,
        }),
      ]);
      const root = snapshotRecord(rootSnapshot);
      const existingVersion = snapshotRecord(versionSnapshot);

      if (
        existingVersion &&
        [
          INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED,
          INTELLITEXT_AUTHORING_VERSION_STATES.ARCHIVED,
        ].includes(existingVersion.versionState)
      ) {
        fail(
          "VERSION_IMMUTABLE",
          "Published and archived authoring snapshots cannot be overwritten."
        );
      }
      const timestamp = firestoreApi.serverTimestamp();
      const previewAudit = {
        desktop: input.previewAudit?.desktop === true,
        mobile: input.previewAudit?.mobile === true,
        studentExperience: input.previewAudit?.studentExperience === true,
      };
      const version = createIntelliTextAuthoringVersion({
        ...graph,
        createdAt: input.createdAt || timestamp,
        createdBy: input.createdBy || admin.uid,
        previewAudit,
        publicationState: "DRAFT",
        updatedAt: timestamp,
        updatedBy: admin.uid,
        versionState: input.versionState || "DRAFT",
      });
      const batch = firestoreApi.writeBatch(dbAdapter);
      const nextSectionIds = new Set(
        graph.sections.map((section) => section.sectionId)
      );
      const nextBlockIds = new Set();

      graph.sections.forEach((section) => {
        const { blocks, ...sectionRecord } = section;

        batch.set(
          firestoreApi.doc(
            dbAdapter,
            buildIntelliTextAuthoringSectionPath(
              graph.textbookId,
              graph.versionId,
              section.sectionId
            )
          ),
          {
            ...sectionRecord,
            updatedAt: timestamp,
            updatedBy: admin.uid,
          }
        );

        blocks.forEach((block) => {
          nextBlockIds.add(`${section.sectionId}/${block.blockId}`);
          batch.set(
            firestoreApi.doc(
              dbAdapter,
              buildIntelliTextAuthoringBlockPath(
                graph.textbookId,
                graph.versionId,
                section.sectionId,
                block.blockId
              )
            ),
            {
              ...block,
              updatedAt: timestamp,
              updatedBy: admin.uid,
            }
          );
        });
      });

      existing.blockRefs
        .filter(({ id }) => !nextBlockIds.has(id))
        .forEach(({ ref }) => batch.delete(ref));
      existing.sectionRefs
        .filter(({ id }) => !nextSectionIds.has(id))
        .forEach(({ ref }) => batch.delete(ref));

      batch.set(versionRef(graph.textbookId, graph.versionId), version);
      batch.set(
        rootRef(graph.textbookId),
        {
          access: graph.access,
          chapterId: graph.chapterId,
          contentVersion: Number(root?.contentVersion || 0),
          draftVersionId: graph.versionId,
          publicationState: root?.publicationState || "DRAFT",
          resourceType: "NOTE",
          schemaVersion: 1,
          subjectId: graph.subjectId,
          textbookId: graph.textbookId,
          title: graph.title,
          updatedAt: timestamp,
          updatedBy: admin.uid,
        },
        { merge: true }
      );

      await batch.commit();
      return Object.freeze({ graph, version });
    },

    async markVersionReadyForReview({
      textbookId,
      versionId,
      previewAudit,
    } = {}) {
      const admin = requireAdmin();
      const normalizedTextbookId = normalizeIntelliTextId(
        textbookId,
        "textbookId"
      );
      const normalizedVersionId = normalizeIntelliTextId(
        versionId,
        "versionId"
      );
      const versionSnapshot = await firestoreApi.getDoc(
        versionRef(normalizedTextbookId, normalizedVersionId)
      );
      const version = snapshotRecord(versionSnapshot);

      if (!version) {
        fail("VERSION_NOT_FOUND", "The authoring version does not exist.");
      }

      if (version.versionState === INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED) {
        fail("VERSION_ALREADY_PUBLISHED", "Published versions cannot return to review.");
      }

      const normalizedAudit = {
        desktop: previewAudit?.desktop === true,
        mobile: previewAudit?.mobile === true,
        studentExperience: previewAudit?.studentExperience === true,
      };

      if (!Object.values(normalizedAudit).every(Boolean)) {
        fail(
          "PREVIEW_AUDIT_INCOMPLETE",
          "Mobile, desktop, and student experience preview must be audited."
        );
      }

      const update = {
        previewAudit: normalizedAudit,
        updatedAt: firestoreApi.serverTimestamp(),
        updatedBy: admin.uid,
        versionState: INTELLITEXT_AUTHORING_VERSION_STATES.READY_FOR_REVIEW,
      };
      await firestoreApi.updateDoc(
        versionRef(normalizedTextbookId, normalizedVersionId),
        update
      );
      return Object.freeze(update);
    },

    async publishVersion({ textbookId, versionId } = {}) {
      const admin = requireAdmin();
      const normalizedTextbookId = normalizeIntelliTextId(
        textbookId,
        "textbookId"
      );
      const normalizedVersionId = normalizeIntelliTextId(
        versionId,
        "versionId"
      );
      const [draftGraph, existingPublished] = await Promise.all([
        loadGraph({
          textbookId: normalizedTextbookId,
          versionId: normalizedVersionId,
          published: false,
        }),
        loadExistingPublishedReferences(normalizedTextbookId),
      ]);
      const versionSnapshot = await firestoreApi.getDoc(
        versionRef(normalizedTextbookId, normalizedVersionId)
      );
      const version = snapshotRecord(versionSnapshot);

      if (!version) {
        fail("VERSION_NOT_FOUND", "The authoring version does not exist.");
      }

      const graph = validateIntelliTextAuthoringDraft({
        ...version,
        access: version.access,
        sections: draftGraph.sections,
        versionId: normalizedVersionId,
      });
      const deleteCount =
        existingPublished.sectionRefs.length + existingPublished.blockRefs.length;
      const rootSnapshotBeforePublish = await firestoreApi.getDoc(
        rootRef(normalizedTextbookId)
      );
      const rootBeforePublish = snapshotRecord(rootSnapshotBeforePublish);
      const previousVersionId = rootBeforePublish?.publishedVersionId || null;
      const previousVersionWrite =
        previousVersionId && previousVersionId !== normalizedVersionId ? 1 : 0;
      const totalWrites =
        graph.publishWriteCount + deleteCount + 1 + previousVersionWrite;

      if (totalWrites > INTELLITEXT_AUTHORING_LIMITS.MAX_PUBLISH_BATCH_WRITES) {
        fail(
          "PUBLISH_BATCH_LIMIT_EXCEEDED",
          "Publishing would exceed the approved Firestore write budget."
        );
      }

      const timestamp = firestoreApi.serverTimestamp();

      await firestoreApi.runTransaction(dbAdapter, async (transaction) => {
        const currentRootSnapshot = await transaction.get(
          rootRef(normalizedTextbookId)
        );
        const currentVersionSnapshot = await transaction.get(
          versionRef(normalizedTextbookId, normalizedVersionId)
        );
        const previousVersionSnapshot =
          previousVersionId && previousVersionId !== normalizedVersionId
            ? await transaction.get(
                versionRef(normalizedTextbookId, previousVersionId)
              )
            : null;
        const contentSnapshot = await transaction.get(
          contentItemRef(normalizedTextbookId)
        );
        const currentRoot = snapshotRecord(currentRootSnapshot) || {
          contentVersion: 0,
        };
        const currentVersion = snapshotRecord(currentVersionSnapshot);

        if (!contentSnapshot.exists()) {
          fail(
            "CANONICAL_CONTENT_ITEM_MISSING",
            "A canonical contentItems document is required before publishing."
          );
        }

        assertIntelliTextVersionPublishable({
          graph,
          root: currentRoot,
          version: currentVersion,
        });

        existingPublished.blockRefs.forEach(({ ref }) => transaction.delete(ref));
        existingPublished.sectionRefs.forEach(({ ref }) => transaction.delete(ref));

        graph.sections.forEach((section) => {
          transaction.set(
            firestoreApi.doc(
              dbAdapter,
              buildIntelliTextSectionPath(
                normalizedTextbookId,
                section.sectionId
              )
            ),
            createIntelliTextPublishedSection(section)
          );

          section.blocks.forEach((block) => {
            transaction.set(
              firestoreApi.doc(
                dbAdapter,
                buildIntelliTextBlockPath(
                  normalizedTextbookId,
                  section.sectionId,
                  block.blockId
                )
              ),
              createIntelliTextPublishedBlock(block)
            );
          });
        });

        const publishedRoot = createIntelliTextPublishedRoot({
          graph,
          publishedAt: timestamp,
          publishedBy: admin.uid,
          versionId: normalizedVersionId,
        });
        transaction.set(rootRef(normalizedTextbookId), publishedRoot, {
          merge: true,
        });
        if (previousVersionSnapshot?.exists?.()) {
          transaction.update(
            versionRef(normalizedTextbookId, previousVersionId),
            {
              publicationState: "ARCHIVED",
              updatedAt: timestamp,
              updatedBy: admin.uid,
              versionState: INTELLITEXT_AUTHORING_VERSION_STATES.ARCHIVED,
            }
          );
        }

        transaction.update(
          versionRef(normalizedTextbookId, normalizedVersionId),
          {
            publicationState: "PUBLISHED",
            publishedAt: timestamp,
            publishedBy: admin.uid,
            updatedAt: timestamp,
            updatedBy: admin.uid,
            versionState: INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED,
          }
        );
        transaction.set(
          contentItemRef(normalizedTextbookId),
          {
            ...buildIntelliTextCanonicalContentPatch({
              access: graph.access,
              chapterId: graph.chapterId,
              contentVersion: graph.contentVersion,
              publishedVersionId: normalizedVersionId,
              subjectId: graph.subjectId,
              textbookId: normalizedTextbookId,
              title: graph.title,
            }),
            updatedAt: timestamp,
            updatedBy: admin.uid,
          },
          { merge: true }
        );
      });

      return Object.freeze({
        contentVersion: graph.contentVersion,
        published: true,
        textbookId: normalizedTextbookId,
        versionId: normalizedVersionId,
      });
    },

    async deleteDraftVersion({ textbookId, versionId } = {}) {
      requireAdmin();
      const normalizedTextbookId = normalizeIntelliTextId(
        textbookId,
        "textbookId"
      );
      const normalizedVersionId = normalizeIntelliTextId(
        versionId,
        "versionId"
      );
      const versionSnapshot = await firestoreApi.getDoc(
        versionRef(normalizedTextbookId, normalizedVersionId)
      );
      const version = snapshotRecord(versionSnapshot);

      if (!version) return true;

      if (version.versionState === INTELLITEXT_AUTHORING_VERSION_STATES.PUBLISHED) {
        fail("PUBLISHED_DELETE_DENIED", "Published snapshots cannot be deleted.");
      }

      const existing = await loadExistingDraftReferences({
        textbookId: normalizedTextbookId,
        versionId: normalizedVersionId,
      });
      const batch = firestoreApi.writeBatch(dbAdapter);
      existing.blockRefs.forEach(({ ref }) => batch.delete(ref));
      existing.sectionRefs.forEach(({ ref }) => batch.delete(ref));
      batch.delete(versionRef(normalizedTextbookId, normalizedVersionId));
      await batch.commit();
      return true;
    },
  });
}

export const intelliTextAuthoringClient = createIntelliTextAuthoringClient();
