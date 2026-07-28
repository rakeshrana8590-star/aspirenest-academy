import {
  intelliTextPublishedContentClient,
} from "../access/intelliTextPublishedContentClient";
import {
  createIntelliTextStudyWorkspaceClient,
} from "../access/intelliTextStudyWorkspaceClient";
import {
  createIntelliTextRevisionClient,
} from "../access/intelliTextRevisionClient";
import {
  applyIntelliTextAnnotationDecorations,
  captureIntelliTextSelection,
  clearIntelliTextAnnotationDecorations,
} from "../access/intelliTextSelectionAnchor";
import {
  INTELLITEXT_ANNOTATION_TYPES,
} from "../access/intelliTextStudyWorkspaceContract";
import {
  normalizeMigratedTextbookForPremiumReader,
} from "./v8SemanticMigrationCompatibility";

const READY_EVENT = "aspirenest:intellitext-drawer-runtime-ready";
let installed = false;

const clean = (value = "") => String(value ?? "").trim();

const selectionAction = (action = "") => [
  "highlight",
  "underline",
  "note",
  "doubt",
  "flashcard",
  "revision",
].includes(clean(action).toLowerCase());

export function installV8IntelliTextDrawerRuntime({
  publishedClient = intelliTextPublishedContentClient,
  studyClient = createIntelliTextStudyWorkspaceClient(),
  revisionClient = createIntelliTextRevisionClient(),
  captureSelection = captureIntelliTextSelection,
  windowAdapter = typeof window !== "undefined" ? window : null,
} = {}) {
  if (!windowAdapter) return null;
  if (installed && windowAdapter.__aspirenestIntelliTextDrawerRuntime) {
    return windowAdapter.__aspirenestIntelliTextDrawerRuntime;
  }

  const api = Object.freeze({
    async load(textbookId) {
      const id = clean(textbookId);
      if (!id) throw new Error("A stable published Note ID is required.");
      const published = await publishedClient.loadPublishedTextbook(id);
      return normalizeMigratedTextbookForPremiumReader(published);
    },

    async loadWorkspace(textbookId) {
      const id = clean(textbookId);
      if (!id) throw new Error("A stable published Note ID is required.");
      return studyClient.loadTextbookWorkspace(id);
    },

    applyAnnotations({
      rootElement,
      annotations = [],
      contentVersion,
    } = {}) {
      return applyIntelliTextAnnotationDecorations({
        rootElement,
        annotations,
        contentVersion,
      });
    },

    clearAnnotations(rootElement) {
      return clearIntelliTextAnnotationDecorations(rootElement);
    },

    capture({ selection, rootElement } = {}) {
      return captureSelection({ selection, rootElement });
    },

    async create(action, input = {}) {
      const normalized = clean(action).toLowerCase();
      const base = {
        textbookId: clean(input.textbookId || input.resourceId),
        sectionId: clean(input.sectionId),
        blockId: clean(input.blockId),
        contentVersion: Math.max(1, Number(input.contentVersion) || 1),
      };

      if (selectionAction(normalized) && !input.selectionAnchor) {
        throw new Error("Select text inside one learning block first.");
      }

      if (normalized === "highlight" || normalized === "underline") {
        return studyClient.createAnnotation({
          ...base,
          selectionAnchor: input.selectionAnchor,
          body: "",
          type: normalized === "highlight"
            ? INTELLITEXT_ANNOTATION_TYPES.HIGHLIGHT
            : INTELLITEXT_ANNOTATION_TYPES.UNDERLINE,
        });
      }

      if (normalized === "note" || normalized === "doubt") {
        const body = clean(input.body || input.note);
        if (!body) throw new Error("Write the private note before saving.");
        return studyClient.createAnnotation({
          ...base,
          selectionAnchor: input.selectionAnchor,
          body,
          type: normalized === "note"
            ? INTELLITEXT_ANNOTATION_TYPES.NOTE
            : INTELLITEXT_ANNOTATION_TYPES.DOUBT,
        });
      }

      if (normalized === "bookmark") {
        return studyClient.createBookmark({
          ...base,
          label: clean(input.label || input.sectionTitle || "Saved section"),
        });
      }

      const revisionInput = {
        ...base,
        selectionAnchor: input.selectionAnchor,
        answer: clean(input.answer || input.selectionAnchor?.exactText),
        noteTitle: clean(input.noteTitle),
        prompt: clean(input.prompt || "Recall this saved concept."),
        sectionTitle: clean(input.sectionTitle),
      };

      if (normalized === "flashcard") {
        if (!revisionInput.prompt || !revisionInput.answer) {
          throw new Error("Flashcard prompt and answer are required.");
        }
        return revisionClient.createFlashcardFromSelection(
          revisionInput,
          { now: new Date() }
        );
      }

      if (normalized === "revision") {
        return revisionClient.addSelectionToRevision(
          revisionInput,
          { now: new Date() }
        );
      }

      throw new Error("Unsupported IntelliText study action.");
    },
  });

  installed = true;
  windowAdapter.__aspirenestIntelliTextDrawerRuntime = api;
  const EventConstructor =
    windowAdapter.CustomEvent ||
    (typeof CustomEvent !== "undefined" ? CustomEvent : null);
  if (EventConstructor) {
    windowAdapter.dispatchEvent?.(
      new EventConstructor(READY_EVENT, { detail: { ready: true } })
    );
  }
  return api;
}

export function resetV8IntelliTextDrawerRuntimeForTests(windowAdapter = globalThis) {
  installed = false;
  if (windowAdapter) delete windowAdapter.__aspirenestIntelliTextDrawerRuntime;
}

installV8IntelliTextDrawerRuntime();
