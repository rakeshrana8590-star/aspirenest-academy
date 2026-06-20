import React from "react";

import {
  NOTES_PLAN_DESCRIPTIONS,
  NOTES_PLAN_ICONS,
  NOTES_PLAN_LABELS,
  buildNotesSubjectList,
  canAccessNotePlan,
  getNoteChapter,
  getNotePdfUrl,
  getNotePlan,
  getNoteSubject,
  getNotesPdfCount,
} from "../shared/notesUtils";

export function StudentNotesPlanCard({ planName, notes = [], onOpen }) {
  const subjects = buildNotesSubjectList(notes);
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
          <strong>{pdfCount}</strong>
          <span>PDFs</span>
        </div>
      </div>

      <div className="studentNotesPlanFooter">
        <span>{notes.length > 0 ? "Open notes shelf" : "Waiting for notes"}</span>
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
  hasPlanAccess,
}) {
  const planName = getNotePlan(note);
  const pdfUrl = getNotePdfUrl(note);

  const canOpen = canAccessNotePlan({
    planName,
    hasPlanAccess,
  });

  const openNote = () => {
    const safeNote = {
      ...note,
      pdf: pdfUrl,
      pdfUrl,
      fileUrl: pdfUrl,
      planType: planName,
      accessPlan: planName,
    };

    if (typeof handleNoteAccess === "function") {
      handleNoteAccess(safeNote);
      return;
    }

    if (canOpen && pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article className="studentNotesPdfCard">
      <div className="studentNotesPdfTop">
        <span className="studentNotesPdfIcon">📄</span>

        <div className="studentNotesPdfBadges">
          <span>{planName}</span>
          <span>{getNoteSubject(note)}</span>
        </div>
      </div>

      <h3>{note.title || "Study PDF"}</h3>

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
          <span>Source</span>
          <strong>{pdfUrl ? "PDF Ready" : "Pending"}</strong>
        </div>
      </div>

      <div className="studentNotesPdfFooter">
        <span>{canOpen ? "Access ready" : "Plan locked"}</span>

        <button type="button" onClick={openNote}>
          {canOpen ? "Open PDF" : "Unlock"}
        </button>
      </div>
    </article>
  );
}