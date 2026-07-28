import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";

import { auth, db, storage } from "../firebase";
import {
  INTELLITEXT_AUTHORING_VERSION_STATES,
} from "./intelliTextAuthoringContract";
import {
  intelliTextAuthoringClient,
} from "./intelliTextAuthoringClient";
import {
  buildIntelliTextMigrationDraftInput,
  getCanonicalMigrationNoteId,
  normalizeIntelliTextMigrationBundle,
  selectCanonicalPublishedMigrationNotes,
} from "./intelliTextPdfMigrationContract";

const ADMIN_EMAIL = "aspirenestplatform@gmail.com";
const CONTENT_ITEMS_COLLECTION = "contentItems";
const MIGRATION_VISUAL_STORAGE_ROOT = "notes/intellitext-migration";

const DEFAULT_STORAGE_API = Object.freeze({
  getDownloadURL,
  ref,
  uploadString,
});

export class IntelliTextPdfMigrationClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextPdfMigrationClientError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextPdfMigrationClientError(code, message);
};

const clean = (value = "") => String(value ?? "").trim();
const cleanEmail = (value = "") => clean(value).toLowerCase();

const requireAdmin = (authAdapter = auth) => {
  const user = authAdapter?.currentUser;
  if (!user?.uid || cleanEmail(user.email) !== ADMIN_EMAIL) {
    fail(
      "MIGRATION_ADMIN_REQUIRED",
      "Only the authenticated AspireNest Admin can migrate existing Notes."
    );
  }
  return user;
};

const canonicalNotesById = (universalContent = []) =>
  new Map(
    selectCanonicalPublishedMigrationNotes(universalContent)
      .map((item) => [getCanonicalMigrationNoteId(item), item])
      .filter(([id]) => Boolean(id))
  );


const inlineImageDescriptor = (value = "") => {
  const source = clean(value);
  const match = source.match(/^data:image\/(jpeg|png|webp);base64,/i);
  if (!match) return null;
  const format = match[1].toLowerCase();
  return Object.freeze({
    contentType: `image/${format}`,
    extension: format === "jpeg" ? "jpg" : format,
    source,
  });
};

const countInlineMigrationVisuals = (draftInput = {}) =>
  (draftInput.sections || []).reduce(
    (total, section) =>
      total +
      (section.blocks || []).filter((block) =>
        Boolean(inlineImageDescriptor(block?.payload?.src))
      ).length,
    0
  );

export async function materializeIntelliTextMigrationVisuals({
  draftInput,
  storageAdapter = storage,
  storageApi = DEFAULT_STORAGE_API,
  onProgress = () => {},
} = {}) {
  if (!draftInput?.textbookId || !draftInput?.versionId) {
    fail(
      "MIGRATION_DRAFT_IDENTITY_REQUIRED",
      "Migration visuals require textbookId and versionId before upload."
    );
  }

  const total = countInlineMigrationVisuals(draftInput);
  let completed = 0;
  const sections = [];

  for (const section of draftInput.sections || []) {
    const blocks = [];
    for (const block of section.blocks || []) {
      const descriptor = inlineImageDescriptor(block?.payload?.src);
      if (!descriptor) {
        blocks.push(block);
        continue;
      }

      const objectPath = [
        MIGRATION_VISUAL_STORAGE_ROOT,
        draftInput.textbookId,
        draftInput.versionId,
        section.sectionId,
        `${block.blockId}.${descriptor.extension}`,
      ].join("/");
      const objectRef = storageApi.ref(storageAdapter, objectPath);

      onProgress({
        completed,
        total,
        objectPath,
        state: "UPLOADING_VISUAL",
      });

      await storageApi.uploadString(
        objectRef,
        descriptor.source,
        "data_url",
        {
          contentType: descriptor.contentType,
          customMetadata: {
            blockId: clean(block.blockId),
            sectionId: clean(section.sectionId),
            textbookId: clean(draftInput.textbookId),
            versionId: clean(draftInput.versionId),
          },
        }
      );
      const downloadUrl = await storageApi.getDownloadURL(objectRef);
      completed += 1;

      blocks.push({
        ...block,
        payload: {
          ...(block.payload || {}),
          src: downloadUrl,
          storageBacked: true,
          storagePath: objectPath,
        },
      });

      onProgress({
        completed,
        total,
        objectPath,
        state: "VISUAL_UPLOADED",
      });
    }
    sections.push({ ...section, blocks });
  }

  return Object.freeze({
    ...draftInput,
    sections: Object.freeze(sections),
    uploadedVisualCount: completed,
  });
}

const normalizeImportError = (error) => Object.freeze({
  code: clean(error?.code || error?.name || "MIGRATION_IMPORT_FAILED"),
  message: clean(error?.message || "Migration draft import failed."),
});

const isSystemicImportError = (error = {}) => {
  const haystack = `${error.code || ""} ${error.message || ""}`.toLowerCase();
  return [
    "permission-denied",
    "unauthenticated",
    "migration_admin_required",
    "storage/unauthorized",
    "storage/unauthenticated",
    "resource-exhausted",
    "quota",
  ].some((token) => haystack.includes(token));
};

export async function loadIntelliTextMigrationBundle({
  url = "http://127.0.0.1:4191/intellitext-migration-bundle.json",
  fetchImpl = globalThis.fetch,
  expectedNoteCount = 48,
} = {}) {
  if (typeof fetchImpl !== "function") {
    fail("MIGRATION_FETCH_UNAVAILABLE", "Migration bundle fetch is unavailable.");
  }

  let response;
  try {
    response = await fetchImpl(url, {
      cache: "no-store",
      credentials: "omit",
    });
  } catch (error) {
    fail(
      "MIGRATION_BUNDLE_UNREACHABLE",
      "The local structured migration bundle server is not running."
    );
  }

  if (!response?.ok) {
    fail(
      "MIGRATION_BUNDLE_HTTP_ERROR",
      `Migration bundle returned HTTP ${response?.status || "error"}.`
    );
  }

  const payload = await response.json();
  return normalizeIntelliTextMigrationBundle(payload, { expectedNoteCount });
}

export async function importIntelliTextMigrationDraft({
  migrationNote,
  canonicalNote,
  overwriteExistingDraft = false,
  authAdapter = auth,
  dbAdapter = db,
  storageAdapter = storage,
  authoringClient = intelliTextAuthoringClient,
  firestoreApi = { doc, serverTimestamp, updateDoc },
  storageApi = DEFAULT_STORAGE_API,
  onVisualProgress = () => {},
} = {}) {
  const admin = requireAdmin(authAdapter);
  const workspace = await authoringClient.loadAuthoringWorkspace(
    migrationNote.textbookId
  );

  if (workspace?.editableVersion && overwriteExistingDraft !== true) {
    return Object.freeze({
      action: "SKIPPED_EXISTING_DRAFT",
      textbookId: migrationNote.textbookId,
      versionId:
        workspace.editableVersion.versionId || workspace.editableVersion.id || "",
    });
  }

  const draftInput = buildIntelliTextMigrationDraftInput({
    migrationNote,
    canonicalNote,
    root: workspace?.root || null,
  });

  const storageBackedDraftInput = await materializeIntelliTextMigrationVisuals({
    draftInput,
    storageAdapter,
    storageApi,
    onProgress: onVisualProgress,
  });

  const saved = await authoringClient.saveDraftVersion({
    ...storageBackedDraftInput,
    versionState: INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT,
  });

  await firestoreApi.updateDoc(
    firestoreApi.doc(
      dbAdapter,
      CONTENT_ITEMS_COLLECTION,
      migrationNote.textbookId
    ),
    {
      canonicalRoute: `/ctet-tet/notes/read/${encodeURIComponent(
        migrationNote.textbookId
      )}`,
      migrationBlockCount: migrationNote.blockCount,
      migrationPageCount: migrationNote.pageCount,
      migrationSourceSha256: migrationNote.sourceSha256,
      migrationState: "READY_FOR_REVIEW",
      migrationTextFidelity: migrationNote.quality.textFidelity,
      migrationVisualPages: migrationNote.quality.visualPages,
      nativeReady: false,
      targetDeliveryMode: "NATIVE_TEXT",
      textbookId: migrationNote.textbookId,
      updatedAt: firestoreApi.serverTimestamp(),
      updatedBy: admin.uid,
    }
  );

  return Object.freeze({
    action: "DRAFT_IMPORTED",
    blockCount: migrationNote.blockCount,
    pageCount: migrationNote.pageCount,
    textbookId: migrationNote.textbookId,
    versionId: draftInput.versionId,
    graph: saved?.graph || null,
    uploadedVisualCount: Number(storageBackedDraftInput.uploadedVisualCount || 0),
  });
}

export async function importIntelliTextMigrationBatch({
  bundle,
  universalContent = [],
  overwriteExistingDraft = false,
  onProgress = () => {},
  importDraft = importIntelliTextMigrationDraft,
} = {}) {
  requireAdmin(auth);
  const normalizedBundle = normalizeIntelliTextMigrationBundle(bundle);
  const canonicalById = canonicalNotesById(universalContent);
  const missingCanonicalIds = normalizedBundle.notes
    .map((note) => note.textbookId)
    .filter((id) => !canonicalById.has(id));

  if (missingCanonicalIds.length > 0) {
    fail(
      "MIGRATION_CANONICAL_NOTES_MISSING",
      `Canonical Notes missing: ${missingCanonicalIds.join(", ")}`
    );
  }

  const results = [];
  for (let index = 0; index < normalizedBundle.notes.length; index += 1) {
    const migrationNote = normalizedBundle.notes[index];
    onProgress({
      index,
      total: normalizedBundle.notes.length,
      textbookId: migrationNote.textbookId,
      title: migrationNote.title,
      state: "IMPORTING",
    });

    try {
      const result = await importDraft({
        migrationNote,
        canonicalNote: canonicalById.get(migrationNote.textbookId),
        overwriteExistingDraft,
        onVisualProgress: (visualProgress) =>
          onProgress({
            index,
            total: normalizedBundle.notes.length,
            textbookId: migrationNote.textbookId,
            title: migrationNote.title,
            state: visualProgress.state,
            visualCompleted: visualProgress.completed,
            visualTotal: visualProgress.total,
          }),
      });
      results.push(result);
      onProgress({
        index: index + 1,
        total: normalizedBundle.notes.length,
        textbookId: migrationNote.textbookId,
        title: migrationNote.title,
        state: result.action,
      });
    } catch (error) {
      const normalizedError = normalizeImportError(error);
      const failed = Object.freeze({
        action: "FAILED",
        textbookId: migrationNote.textbookId,
        error: normalizedError.message,
        errorCode: normalizedError.code,
      });
      results.push(failed);
      onProgress({
        index: index + 1,
        total: normalizedBundle.notes.length,
        textbookId: migrationNote.textbookId,
        title: migrationNote.title,
        state: "FAILED",
        error: failed.error,
        errorCode: failed.errorCode,
      });

      if (isSystemicImportError(normalizedError)) {
        normalizedBundle.notes.slice(index + 1).forEach((pendingNote) => {
          results.push(Object.freeze({
            action: "BLOCKED_AFTER_SYSTEMIC_FAILURE",
            textbookId: pendingNote.textbookId,
            error: `Blocked after ${failed.errorCode}: ${failed.error}`,
            errorCode: failed.errorCode,
          }));
        });
        break;
      }
    }
  }

  const imported = results.filter((item) => item.action === "DRAFT_IMPORTED");
  const skipped = results.filter((item) => item.action === "SKIPPED_EXISTING_DRAFT");
  const failed = results.filter((item) =>
    ["FAILED", "BLOCKED_AFTER_SYSTEMIC_FAILURE"].includes(item.action)
  );

  return Object.freeze({
    failed: Object.freeze(failed),
    imported: Object.freeze(imported),
    results: Object.freeze(results),
    skipped: Object.freeze(skipped),
    total: results.length,
  });
}

export async function publishVerifiedIntelliTextMigration({
  migrationNote,
  canonicalNote,
  previewAudit,
  authAdapter = auth,
  authoringClient = intelliTextAuthoringClient,
} = {}) {
  requireAdmin(authAdapter);

  if (
    migrationNote?.quality?.textFidelity !== "PASS" ||
    (migrationNote?.quality?.blockingIssues || []).length > 0
  ) {
    fail(
      "MIGRATION_NOTE_NOT_PUBLISHABLE",
      "Only a text-fidelity GREEN migration without blocking issues may be published."
    );
  }

  if (
    previewAudit?.desktop !== true ||
    previewAudit?.mobile !== true ||
    previewAudit?.studentExperience !== true
  ) {
    fail(
      "MIGRATION_PREVIEW_APPROVAL_REQUIRED",
      "Desktop, mobile, and student preview approval are required before publish."
    );
  }

  const workspace = await authoringClient.loadAuthoringWorkspace(
    migrationNote.textbookId
  );
  const editableVersion = workspace?.editableVersion;
  if (!editableVersion) {
    fail("MIGRATION_DRAFT_MISSING", "Import the IntelliText migration draft first.");
  }

  const versionId = editableVersion.versionId || editableVersion.id;
  await authoringClient.saveDraftVersion({
    ...editableVersion,
    access: editableVersion.access,
    baseContentVersion: Number(editableVersion.baseContentVersion || 0),
    chapterId: editableVersion.chapterId,
    contentVersion: Number(editableVersion.contentVersion || 1),
    previewAudit,
    sections: workspace.graph.sections,
    subjectId: editableVersion.subjectId,
    textbookId: migrationNote.textbookId,
    title: editableVersion.title || canonicalNote?.title || migrationNote.title,
    versionId,
    versionState: INTELLITEXT_AUTHORING_VERSION_STATES.DRAFT,
  });
  await authoringClient.markVersionReadyForReview({
    previewAudit,
    textbookId: migrationNote.textbookId,
    versionId,
  });
  return authoringClient.publishVersion({
    textbookId: migrationNote.textbookId,
    versionId,
  });
}
