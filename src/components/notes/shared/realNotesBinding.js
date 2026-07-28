import {
  NOTES_PLAN_ORDER,
  getNoteChapter,
  getNoteDeliveryMode,
  getNotePlan,
  getNoteSubject,
  hasNativeIntelliText,
  hasNotePdf,
  isNotesContent,
  isPublishedNote,
} from "./notesUtils";
import { INTELLITEXT_DELIVERY_MODES } from "../../../access/intelliTextConstants";

export const buildRealNotesBindingReport = (contentItems = []) => {
  const notes = (Array.isArray(contentItems) ? contentItems : []).filter(
    isNotesContent
  );
  const published = notes.filter(isPublishedNote);
  const readable = published.filter(
    (note) => hasNativeIntelliText(note) || hasNotePdf(note)
  );
  const native = readable.filter(hasNativeIntelliText);
  const protectedAssets = readable.filter(
    (note) => note.hasProtectedAsset === true
  );
  const legacyPdf = readable.filter(
    (note) =>
      hasNotePdf(note) &&
      getNoteDeliveryMode(note) === INTELLITEXT_DELIVERY_MODES.LEGACY_PDF
  );
  const missingStructure = notes.filter((note = {}) => {
    const subject = String(
      note.subject || note.subjectName || note.subjectTitle || ""
    ).trim();
    const chapter = String(
      note.chapter || note.chapterName || note.topic || note.topicName || ""
    ).trim();
    return !subject || !chapter;
  });

  const byPlan = NOTES_PLAN_ORDER.reduce((summary, planName) => {
    summary[planName] = readable.filter(
      (note) => getNotePlan(note) === planName
    ).length;
    return summary;
  }, {});

  return {
    sourceCollection: "contentItems",
    duplicateNotesDatabase: false,
    realDataOnly: true,
    totalNotes: notes.length,
    publishedNotes: published.length,
    readableNotes: readable.length,
    nativeIntelliText: native.length,
    protectedAssets: protectedAssets.length,
    legacyPdfFallback: legacyPdf.length,
    draftsOrArchived: notes.length - published.length,
    publishedWithoutReadableAsset: published.length - readable.length,
    missingStructure: missingStructure.length,
    activePlans: Object.values(byPlan).filter((count) => count > 0).length,
    byPlan,
    status:
      readable.length > 0
        ? "green"
        : notes.length > 0
          ? "amber"
          : "empty",
  };
};
