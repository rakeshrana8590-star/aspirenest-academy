import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminNotesHero from "./AdminNotesHero";
import AdminNotesEmptyState from "./AdminNotesEmptyState";

import {
  AdminNotesChapterCard,
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

import { normalizeNoteText } from "../shared/notesUtils";

function findAdminSubject(subjects = [], subjectName = "") {
  const activeSubject = normalizeNoteText(subjectName);

  return subjects.find(
    (subject) =>
      normalizeNoteText(subject.id) === activeSubject ||
      normalizeNoteText(subject.title) === activeSubject
  );
}

export default function AdminNotesSubjectRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();
  const { planType, subjectName } = useParams();

  const activePlan = decodeURIComponent(planType || "FREE").toUpperCase();
  const activeSubject = decodeURIComponent(subjectName || "");

  const planLabel = getAdminPlanLabel(activePlan);
  const planNotes = getAdminNotesByPlan(universalContent, activePlan);

  const subjects = getUniqueAdminNoteSubjects(planNotes);
  const subjectInfo = findAdminSubject(subjects, activeSubject);

  const subjectNotes = getAdminNotesBySubject(planNotes, activeSubject);
  const chapters = getUniqueAdminNoteChapters(subjectNotes);

  const statusCounts = getAdminNotesStatusCounts(subjectNotes);
  const healthSummary = getAdminNotesHealthSummary(subjectNotes);
  const subjectTitle = subjectInfo?.title || "Subject Notes";

  return (
    <section className="adminNotesPage">
      <AdminNotesHero
        badge={`${activePlan} NOTES`}
        title={subjectTitle}
        text={`Review chapter-wise notes and PDF readiness inside ${planLabel}.`}
        stats={[
          {
            label: "Chapters",
            value: chapters.length,
          },
          {
            label: "Notes",
            value: subjectNotes.length,
          },
          {
            label: "Published",
            value: statusCounts.published,
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
                navigate(`/admin/content/notes/plan/${activePlan}`)
              }
            >
              ← Back to Plan
            </button>
          </>
        }
      />

      <div className="adminNotesStatusGrid">
        <AdminNotesStatusCard
          label="Student Visible"
          value={healthSummary.ready}
          text="Published PDFs from this subject visible to students."
        />

        <AdminNotesStatusCard
          label="Missing PDF"
          value={healthSummary.missingPdf}
          text="Subject notes missing PDF/source URL."
        />

        <AdminNotesStatusCard
          label="Draft"
          value={statusCounts.draft}
          text="Subject notes saved as draft."
        />

        <AdminNotesStatusCard
          label="Archived"
          value={statusCounts.archived}
          text="Subject notes archived from public flow."
        />
      </div>

      <div className="adminNotesShelf">
        <div className="adminNotesShelfHeader">
          <span>{subjectTitle}</span>

          <h2>Chapter-wise notes control</h2>

          <p>
            Open a chapter to review exact PDF notes. Only notes from selected
            plan and subject are shown here.
          </p>
        </div>

        {chapters.length === 0 ? (
          <AdminNotesEmptyState
            icon="📄"
            title="No chapters found"
            text="Create notes for this subject to build chapter-wise PDF control."
            action={
              <button
                type="button"
                className="adminNotesPrimaryBtn"
                onClick={() => navigate("/admin/content/notes/form")}
              >
                + Add Chapter Note
              </button>
            }
          />
        ) : (
          <div className="adminNotesPlanGrid">
            {chapters.map((chapter) => {
              const chapterNotes = getAdminNotesByChapter(
                subjectNotes,
                chapter.id
              );

              return (
                <AdminNotesChapterCard
                  key={chapter.id}
                  chapter={{
                    ...chapter,
                    count: chapterNotes.length,
                  }}
                  planName={activePlan}
                  onOpen={() =>
                    navigate(
                      `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                        activeSubject
                      )}/${encodeURIComponent(chapter.id)}`
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}