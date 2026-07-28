import {
  NOTES_ACTIONS,
} from "../access/notesActionPolicy";
import {
  buildCanonicalNoteReaderRoute,
  getNoteChapter,
  getNotePlan,
  getNoteSubject,
  getNoteTextbookId,
  getPublishedNotes,
  hasNativeIntelliText,
  normalizeNoteText,
} from "../components/notes/shared/notesUtils";

const clean = (value = "") => String(value ?? "").trim();

const freezeResources = (resources = []) =>
  Object.freeze(resources.map((resource) => Object.freeze(resource)));

const stateForDecision = (decision = null) => {
  if (!decision || decision.reason === "access_loading") return "loading";
  if (
    decision.allowed === true &&
    (decision.canReadAsset === true || decision.canResolveAsset === true)
  ) {
    return "open";
  }
  return "locked";
};

const planLabel = (value = "FREE") => {
  const plan = clean(value).toUpperCase() || "FREE";
  return plan === "MENTORSHIP"
    ? "Mentor-Guided"
    : plan[0] + plan.slice(1).toLowerCase();
};

export const buildV8RealNotesRuntime = ({
  contentItems = [],
  buildNoteAccessDecision,
} = {}) => {
  const notes = getPublishedNotes(contentItems);
  const entries = notes.map((note, index) => {
    const nativeReady = hasNativeIntelliText(note);
    const action = nativeReady
      ? NOTES_ACTIONS.READ
      : NOTES_ACTIONS.OPEN;
    const decision =
      typeof buildNoteAccessDecision === "function"
        ? buildNoteAccessDecision(note, action)
        : null;
    const resourceId = clean(note.id || getNoteTextbookId(note));
    const subject = getNoteSubject(note);
    const chapter = getNoteChapter(note);

    return Object.freeze({
      note,
      resource: Object.freeze({
        id: resourceId,
        resourceId,
        type: "note",
        title: clean(note.title) || "Untitled Note",
        subtitle: `${subject} • ${chapter}`,
        subject: normalizeNoteText(subject) || "general",
        subjectName: subject,
        chapter,
        plan: planLabel(getNotePlan(note)),
        state: stateForDecision(decision),
        progress: Number(note.progressPercent || note.progress || 0) || 0,
        duration: clean(note.estimatedReadingTime || note.duration) ||
          (note.pages ? `${note.pages} pages` : "IntelliText note"),
        assigned: note.assigned === true,
        recent: note.recent === true,
        saved: note.saved === true,
        native: nativeReady,
        nativeReady,
        integrated: true,
        migrationState: nativeReady ? "PUBLISHED" : "CONVERSION_REQUIRED",
        canonicalRoute: buildCanonicalNoteReaderRoute(note),
        description: clean(note.description) ||
          "AspireNest premium study note connected to the canonical Notes resource.",
        thumb: Array.isArray(note.thumb) ? note.thumb : ["#dfe9ff", "#fff4e4"],
        order: Number(note.order ?? index),
      }),
      action,
      decision,
    });
  });

  const byId = new Map(entries.map((entry) => [entry.resource.id, entry]));
  const resources = freezeResources(
    entries
      .map((entry) => entry.resource)
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  );

  return Object.freeze({
    byId,
    entries: Object.freeze(entries),
    resources,
    total: resources.length,
    nativeReady: resources.filter((resource) => resource.nativeReady).length,
    conversionRequired: resources.filter((resource) => !resource.nativeReady).length,
    signature: resources
      .map((resource) => `${resource.id}:${resource.state}:${resource.nativeReady ? 1 : 0}`)
      .join("|"),
  });
};
