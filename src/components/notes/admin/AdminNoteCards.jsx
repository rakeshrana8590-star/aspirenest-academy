import React from "react";

import {
  getAdminNoteHealth,
  getAdminPlanLabel,
} from "../shared/adminNotesUtils";

import {
  getNoteChapter,
  getNotePdfUrl,
  getNotePlan,
  getNoteStatus,
  getNoteSubject,
} from "../shared/notesUtils";

export function AdminNotesPlanCard({ plan, onOpen }) {
  return (
    <button
      type="button"
      className="adminNotesPlanCard"
      onClick={onOpen}
    >
      <div className="adminNotesCardTop">
        <span className="adminNotesCardIcon">📘</span>
        <span className="adminNotesPlanPill">{plan.planName}</span>
      </div>

      <h3>{plan.label}</h3>

      <p>
        Review notes, subjects, chapters, published PDFs, and student-visible
        material for this plan.
      </p>

      <div className="adminNotesMiniGrid">
        <div>
          <strong>{plan.totalNotes}</strong>
          <span>Total notes</span>
        </div>

        <div>
          <strong>{plan.publishedPdfs}</strong>
          <span>Published PDFs</span>
        </div>

        <div>
          <strong>{plan.subjects}</strong>
          <span>Subjects</span>
        </div>

        <div>
          <strong>{plan.chapters}</strong>
          <span>Chapters</span>
        </div>
      </div>

      <div className="adminNotesCardFooter">
        <span>
          {plan.statusCounts.pdfMissing > 0
            ? `${plan.statusCounts.pdfMissing} PDF missing`
            : "Ready for review"}
        </span>

        <strong>Open →</strong>
      </div>
    </button>
  );
}

export function AdminNotesSubjectCard({
  subject,
  planName,
  onOpen,
}) {
  return (
    <button
      type="button"
      className="adminNotesSubjectCard"
      onClick={onOpen}
    >
      <div className="adminNotesCardTop">
        <span className="adminNotesCardIcon">📚</span>
        <span className="adminNotesPlanPill">{planName}</span>
      </div>

      <h3>{subject.title}</h3>

      <p>Open subject-wise chapter shelves and PDF notes.</p>

      <div className="adminNotesMiniGrid">
        <div>
          <strong>{subject.count}</strong>
          <span>Notes</span>
        </div>

        <div>
          <strong>{planName}</strong>
          <span>Plan</span>
        </div>
      </div>

      <div className="adminNotesCardFooter">
        <span>Open subject</span>
        <strong>Continue →</strong>
      </div>
    </button>
  );
}

export function AdminNotesChapterCard({
  chapter,
  planName,
  onOpen,
}) {
  return (
    <button
      type="button"
      className="adminNotesChapterCard"
      onClick={onOpen}
    >
      <div className="adminNotesCardTop">
        <span className="adminNotesCardIcon">📄</span>
        <span className="adminNotesPlanPill">{planName}</span>
      </div>

      <h3>{chapter.title}</h3>

      <p>Review chapter PDFs mapped to the selected subject.</p>

      <div className="adminNotesMiniGrid">
        <div>
          <strong>{chapter.count}</strong>
          <span>PDF notes</span>
        </div>

        <div>
          <strong>{planName}</strong>
          <span>Plan</span>
        </div>
      </div>

      <div className="adminNotesCardFooter">
        <span>Open chapter</span>
        <strong>Continue →</strong>
      </div>
    </button>
  );
}

export function AdminNotePdfCard({
  note,
  onEdit,
  onOpenPdf,
}) {
  const planName = getNotePlan(note);
  const health = getAdminNoteHealth(note);
  const pdfUrl = getNotePdfUrl(note);
  const status = getNoteStatus(note) || "draft";

  return (
    <article className="adminNotePdfCard">
      <div className="adminNotesCardTop">
        <span className="adminNotesCardIcon">📑</span>

        <div className="adminNotesPdfBadges">
          <span>{planName}</span>
          <span>{status}</span>
        </div>
      </div>

      <h3>{note.title || "Untitled note"}</h3>

      <p>{note.description || "Chapter-wise PDF note."}</p>

      <div className="adminNotesMiniGrid">
        <div>
          <strong>{getNoteSubject(note)}</strong>
          <span>Subject</span>
        </div>

        <div>
          <strong>{getNoteChapter(note)}</strong>
          <span>Chapter</span>
        </div>

        <div>
          <strong>{pdfUrl ? "Ready" : "Missing"}</strong>
          <span>PDF</span>
        </div>

        <div>
          <strong>{health.isReadyForStudent ? "Live" : "Fix"}</strong>
          <span>Student</span>
        </div>
      </div>

      {health.issues.length > 0 && (
        <div className="adminNotesIssueStrip">
          {health.issues.slice(0, 3).join(" • ")}
        </div>
      )}

      <div className="adminNotesCardFooter">
        <span>{health.isReadyForStudent ? "Student visible" : "Needs review"}</span>

        <div className="adminNotesPdfActions">
          <button type="button" onClick={() => onEdit?.(note)}>
            Edit
          </button>

          <button
            type="button"
            disabled={!pdfUrl}
            onClick={() => onOpenPdf?.(note)}
          >
            Open PDF
          </button>
        </div>
      </div>
    </article>
  );
}

export function AdminNotesQuickActionCard({
  icon = "📘",
  title,
  text,
  onOpen,
}) {
  return (
    <button
      type="button"
      className="adminNotesQuickActionCard"
      onClick={onOpen}
    >
      <span>{icon}</span>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <strong>Open →</strong>
    </button>
  );
}

export function AdminNotesStatusCard({
  label,
  value,
  text,
}) {
  return (
    <div className="adminNotesStatusCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}

export { getAdminPlanLabel };