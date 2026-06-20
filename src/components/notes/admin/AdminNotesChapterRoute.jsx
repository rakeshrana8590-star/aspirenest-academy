import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminNotesHero from "./AdminNotesHero";
import AdminNotesEmptyState from "./AdminNotesEmptyState";

import {
  AdminNotePdfCard,
  AdminNotesStatusCard,
} from "./AdminNoteCards";

import {
  getAdminNotesByChapter,
  getAdminNotesByPlan,
  getAdminNotesBySubject,
  getAdminNotesHealthSummary,
  getAdminNotesStatusCounts,
  getAdminPlanLabel,
  getUniqueAdminNoteChapters,
  getUniqueAdminNoteSubjects,
} from "../shared/adminNotesUtils";

import {
  getNotePdfUrl,
  normalizeNoteText,
} from "../shared/notesUtils";

function findAdminSubject(subjects = [], subjectName = "") {
  const activeSubject = normalizeNoteText(subjectName);

  return subjects.find(
    (subject) =>
      normalizeNoteText(subject.id) === activeSubject ||
      normalizeNoteText(subject.title) === activeSubject
  );
}

function findAdminChapter(chapters = [], chapterName = "") {
  const activeChapter = normalizeNoteText(chapterName);

  return chapters.find(
    (chapter) =>
      normalizeNoteText(chapter.id) === activeChapter ||
      normalizeNoteText(chapter.title) === activeChapter
  );
}

export default function AdminNotesChapterRoute({
  universalContent = [],
  onEditNote,
  onOpenNotePdf,
}) {
  const navigate = useNavigate();
  const { planType, subjectName, chapterName } = useParams();

  const activePlan = decodeURIComponent(planType || "FREE").toUpperCase();
  const activeSubject = decodeURIComponent(subjectName || "");
  const activeChapter = decodeURIComponent(chapterName || "");

  const planLabel = getAdminPlanLabel(activePlan);
  const planNotes = getAdminNotesByPlan(universalContent, activePlan);

  const subjects = getUniqueAdminNoteSubjects(planNotes);
  const subjectInfo = findAdminSubject(subjects, activeSubject);

  const subjectNotes = getAdminNotesBySubject(planNotes, activeSubject);
  const chapters = getUniqueAdminNoteChapters(subjectNotes);
  const chapterInfo = findAdminChapter(chapters, activeChapter);

  const chapterNotes = getAdminNotesByChapter(subjectNotes, activeChapter);
  const statusCounts = getAdminNotesStatusCounts(chapterNotes);
  const healthSummary = getAdminNotesHealthSummary(chapterNotes);

  const subjectTitle = subjectInfo?.title || "Subject Notes";
  const chapterTitle = chapterInfo?.title || "Chapter PDF Notes";

  const openPdf = (note) => {
    if (typeof onOpenNotePdf === "function") {
      onOpenNotePdf(note);
      return;
    }

    const pdfUrl = getNotePdfUrl(note);

    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  const editNote = (note) => {
    if (typeof onEditNote === "function") {
      onEditNote(note);
      return;
    }

    navigate("/admin/content/notes/manage");
  };

  return (
    <section className="adminNotesPage">
      <AdminNotesHero
        badge={`${activePlan} NOTES`}
        title={chapterTitle}
        text={`Review PDF notes mapped to ${subjectTitle} inside ${planLabel}.`}
        stats={[
          {
            label: "PDF Notes",
            value: chapterNotes.length,
          },
          {
            label: "Published",
            value: statusCounts.published,
          },
          {
            label: "PDF Ready",
            value: statusCounts.pdfReady,
          },
          {
            label: "Needs Fix",
            value: healthSummary.needsFix,
          },
        ]}
        actions={
          <>
            <button
              type="button"
              className="adminNotesPrimaryBtn"
              onClick={() => navigate("/admin/content/notes/form")}
            >
              + Add Note
            </button>

            <button
              type="button"
              className="adminNotesGhostBtn"
              onClick={() => navigate("/admin/content/notes/manage")}
            >
              Manage Notes
            </button>

            <button
              type="button"
              className="adminNotesGhostBtn"
              onClick={() =>
                navigate(
                  `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                    activeSubject
                  )}`
                )
              }
            >
              ← Back to Subject
            </button>
          </>
        }
      />

      <div className="adminNotesStatusGrid">
        <AdminNotesStatusCard
          label="Student Visible"
          value={healthSummary.ready}
          text="Published chapter PDFs ready for student notes flow."
        />

        <AdminNotesStatusCard
          label="Missing PDF"
          value={healthSummary.missingPdf}
          text="Chapter notes missing PDF/source URL."
        />

        <AdminNotesStatusCard
          label="Draft"
          value={statusCounts.draft}
          text="Chapter notes saved as draft."
        />

        <AdminNotesStatusCard
          label="Archived"
          value={statusCounts.archived}
          text="Chapter notes archived from student flow."
        />
      </div>

      <div className="adminNotesShelf">
        <div className="adminNotesShelfHeader">
          <span>{subjectTitle}</span>

          <h2>Available PDF notes</h2>

          <p>
            Only notes from selected plan, subject, and chapter appear here.
            Use this page to verify PDF readiness before student launch.
          </p>
        </div>

        {chapterNotes.length === 0 ? (
          <AdminNotesEmptyState
            icon="📑"
            title="No PDFs found"
            text="Create notes for this chapter to build the PDF library."
            action={
              <button
                type="button"
                className="adminNotesPrimaryBtn"
                onClick={() => navigate("/admin/content/notes/form")}
              >
                + Add PDF Note
              </button>
            }
          />
        ) : (
          <div className="adminNotesPdfGrid">
            {chapterNotes.map((note) => (
              <AdminNotePdfCard
                key={note.id}
                note={note}
                onEdit={editNote}
                onOpenPdf={openPdf}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}