import React from "react";

import {
  getStudentNotesAccessPresentation,
} from "../../../access/notesStudentAssetRuntime";

import {
  NOTES_PLAN_DESCRIPTIONS,
  NOTES_PLAN_ICONS,
  NOTES_PLAN_LABELS,
  buildNotesSubjectList,
  canAccessNotePlan,
  getNoteChapter,
  getNotePlan,
  getNoteSubject,
  getNotesPdfCount,
  getNotesNativeCount,
  getNotesResourceCount,
  hasNotePdf,
  isNativeIntelliTextNote,
} from "../shared/notesUtils";

export function StudentNotesPlanCard({ planName, notes = [], onOpen }) {
  const subjects = buildNotesSubjectList(notes);
  const resourceCount = getNotesResourceCount(notes);
  const nativeCount = getNotesNativeCount(notes);
  const pdfCount = getNotesPdfCount(notes);

  return (
    <button
      type="button"
      className={
        planName === "PREMIUM"
          ? "studentNotesPlanCard isPremiumNotesPlan"
          : "studentNotesPlanCard"
      }
      onClick={onOpen}
    >
      <div className="studentNotesPlanCardTop">
        <span className="studentNotesPlanIcon">
          {NOTES_PLAN_ICONS[planName] || "📘"}
        </span>

        <span className="studentNotesPlanPill">{planName}</span>
      </div>

      <h3>{NOTES_PLAN_LABELS[planName] || `${planName} Notes`}</h3>

      <p>
        {NOTES_PLAN_DESCRIPTIONS[planName] ||
          "Open subject-wise and chapter-wise notes inside one revision flow."}
      </p>

      <div className="studentNotesPlanStats">
        <div>
          <strong>{subjects.length}</strong>
          <span>Subjects</span>
        </div>

        <div>
          <strong>{resourceCount}</strong>
          <span>Notes</span>
        </div>
      </div>

      <div className="studentNotesPlanFooter">
        <span>
          {resourceCount > 0
            ? `${nativeCount} native • ${pdfCount} PDF`
            : "Waiting for study notes"}
        </span>
        <strong>Open →</strong>
      </div>
    </button>
  );
}

export function StudentNotesLevelCard({
  icon = "📘",
  pill,
  title,
  text,
  firstStat,
  secondStat,
  footerText,
  onOpen,
}) {
  return (
    <button
      type="button"
      className="studentNotesLevelCard"
      onClick={onOpen}
    >
      <div className="studentNotesLevelCardTop">
        <span className="studentNotesLevelIcon">{icon}</span>
        <span className="studentNotesLevelPill">{pill}</span>
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      <div className="studentNotesLevelMini">
        <div>
          <strong>{firstStat?.value ?? 0}</strong>
          <span>{firstStat?.label || "Items"}</span>
        </div>

        <div>
          <strong>{secondStat?.value ?? 0}</strong>
          <span>{secondStat?.label || "More"}</span>
        </div>
      </div>

      <div className="studentNotesLevelFooter">
        <span>{footerText}</span>
        <strong>Continue →</strong>
      </div>
    </button>
  );
}

export function StudentNotePdfCard({
  note,
  handleNoteAccess,
  handleNativeNoteAccess,
  hasPlanAccess,
  accessDecision = null,
}) {
  const planName = getNotePlan(note);
  const isNative = isNativeIntelliTextNote(note);
  const hasProtectedAsset = hasNotePdf(note);

  const fallbackCanOpen =
    canAccessNotePlan({
      planName,
      hasPlanAccess,
      accessOptions: {
        module: "notes",
        itemType: "notesPdf",
        itemId: note.id,
      },
    });

  const basePresentation =
    accessDecision
      ? getStudentNotesAccessPresentation(
          accessDecision
        )
      : {
          canOpen: fallbackCanOpen,
          disabled: false,
          busy: false,
          statusLabel: fallbackCanOpen
            ? "Access ready"
            : "Plan locked",
          buttonLabel: fallbackCanOpen
            ? "Open"
            : "Unlock",
        };

  const presentation = {
    ...basePresentation,
    buttonLabel:
      basePresentation.canOpen === true
        ? isNative
          ? "Start Reading"
          : "Open PDF"
        : basePresentation.buttonLabel,
  };

  const openNote = () => {
    if (presentation.disabled) {
      return;
    }

    const safeNote = {
      ...note,
      planType: planName,
      accessPlan: planName,
    };

    if (
      isNative &&
      typeof handleNativeNoteAccess === "function"
    ) {
      handleNativeNoteAccess(safeNote);
      return;
    }

    if (
      !isNative &&
      typeof handleNoteAccess === "function"
    ) {
      handleNoteAccess(safeNote);
    }
  };

  return (
    <article
      className={
        isNative
          ? "studentNotesPdfCard isNativeNote"
          : "studentNotesPdfCard"
      }
    >
      <div className="studentNotesPdfTop">
        <span className="studentNotesPdfIcon">
          {isNative ? "📖" : "📄"}
        </span>

        <div className="studentNotesPdfBadges">
          <span>{planName}</span>
          <span>
            {isNative ? "IntelliText" : getNoteSubject(note)}
          </span>
        </div>
      </div>

      <h3>{note.title || "Study Note"}</h3>

      <p>
        {note.description ||
          getNoteChapter(note) ||
          "Chapter-wise study material."}
      </p>

      <div className="studentNotesPdfMeta">
        <div>
          <span>Chapter</span>
          <strong>{getNoteChapter(note)}</strong>
        </div>

        <div>
          <span>Format</span>
          <strong>
            {isNative
              ? "Native Reader"
              : hasProtectedAsset
                ? "Protected PDF"
                : "Pending"}
          </strong>
        </div>
      </div>

      <div className="studentNotesPdfFooter">
        <span>{presentation.statusLabel}</span>

        <button
          type="button"
          onClick={openNote}
          disabled={presentation.disabled}
          aria-busy={presentation.busy}
        >
          {presentation.buttonLabel}
        </button>
      </div>
    </article>
  );
}

export const StudentNoteResourceCard =
  StudentNotePdfCard;
