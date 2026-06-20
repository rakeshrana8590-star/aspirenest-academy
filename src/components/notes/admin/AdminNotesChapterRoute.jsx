import React from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  hasNotePdf,
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
  const subjectTitle = subjectInfo?.title || "Subject Notes";
  const subjectKey = subjectInfo?.id || activeSubject;

  const subjectNotes = getAdminNotesBySubject(planNotes, activeSubject);
  const chapters = getUniqueAdminNoteChapters(subjectNotes);
  const chapterInfo = findAdminChapter(chapters, activeChapter);
  const chapterTitle = chapterInfo?.title || "Chapter PDF Notes";

  const chapterNotes = getAdminNotesByChapter(subjectNotes, activeChapter);
  const statusCounts = getAdminNotesStatusCounts(chapterNotes);
  const healthSummary = getAdminNotesHealthSummary(chapterNotes);
  const pdfReady = chapterNotes.filter((note) => hasNotePdf(note)).length;

  const systemStats = [
    { value: chapterNotes.length, label: "PDF Notes" },
    { value: statusCounts.published, label: "Published" },
    { value: pdfReady, label: "PDF Ready" },
    { value: healthSummary.ready, label: "Student Visible" },
  ];

  const openPdf = (note) => {
    const pdfUrl = getNotePdfUrl(note);

    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigate("/admin/content/notes/manage");
  };

  return (
    <section className="coursePages adminMockPlanPage adminNotesPlanAlignedPage">
      <section className="adminNotesLaunchHero">
        <div className="adminNotesLaunchHeroCopy">
          <span className="adminNotesLaunchBadge">{activePlan} NOTES</span>

          <h1>{chapterTitle}</h1>

          <p>
            Review PDF notes mapped to {subjectTitle} inside {planLabel}.
            Verify PDF readiness, publish status, and student visibility before
            launch.
          </p>

          <div className="adminNotesLaunchHeroActions">
            <button
              type="button"
              className="adminNotesLaunchPrimaryBtn"
              onClick={() => navigate("/admin/content/notes/form")}
            >
              + Add Note PDF
            </button>

            <button
              type="button"
              className="adminNotesLaunchGhostBtn"
              onClick={() => navigate("/admin/content/notes/manage")}
            >
              Manage Notes
            </button>

            <button
              type="button"
              className="adminNotesLaunchGhostBtn"
              onClick={() =>
                navigate(
                  `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                    subjectKey
                  )}`
                )
              }
            >
              ← Back
            </button>
          </div>

          <div className="adminNotesLaunchTrustRow">
            <span>✓ Plan protected</span>
            <span>✓ Subject-wise</span>
            <span>✓ Chapter PDFs</span>
            <span>✓ Publish audit</span>
          </div>
        </div>

        <div className="adminNotesLaunchSystemCard">
          <div className="adminNotesLaunchSystemTop">
            <span>Chapter Status</span>
            <strong>{activePlan}</strong>
          </div>

          <div className="adminNotesLaunchTitleCard">
            <span className="adminNotesLaunchIcon">📄</span>

            <div>
              <h3>{chapterTitle}</h3>
              <p>{subjectTitle}</p>
            </div>
          </div>

          <div className="adminNotesLaunchSystemGrid">
            {systemStats.map((stat) => (
              <div className="adminNotesLaunchFeatureCard" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="adminNotesLaunchSystemFlow">
            <span>Plan</span>
            <i />
            <span>Subject</span>
            <i />
            <span>Chapter</span>
            <i />
            <span>PDF</span>
          </div>
        </div>
      </section>

      <div className="adminMockPlanKpiGrid">
        <div className="adminMockPlanKpiCard">
          <span>PDF Notes</span>
          <strong>{chapterNotes.length}</strong>
          <p>{chapterTitle} note records</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Published</span>
          <strong>{statusCounts.published}</strong>
          <p>Student-ready notes</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>PDF Ready</span>
          <strong>{pdfReady}</strong>
          <p>Notes with PDF source</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Needs Fix</span>
          <strong>{healthSummary.needsFix}</strong>
          <p>Missing source or visibility issue</p>
        </div>
      </div>

      <div className="adminMockPlanPanel">
        <div className="adminMockPlanPanelHeader">
          <div>
            <span>CHAPTER PDF LIBRARY</span>
            <h2>Available PDF Notes</h2>
          </div>

          <small>{chapterNotes.length} PDFs</small>
        </div>

        {chapterNotes.length === 0 ? (
          <div className="adminMockPlanEmpty">
            <strong>No PDFs found.</strong>
            <p>Add a note PDF in this chapter first.</p>
          </div>
        ) : (
          <div className="adminMockPlanGrid">
            {chapterNotes.map((note) => {
              const pdfUrl = getNotePdfUrl(note);
              const noteTitle = note.title || chapterTitle;

              return (
                <button
                  type="button"
                  key={note.id}
                  className="adminMockPlanCard"
                  onClick={() => openPdf(note)}
                >
                  <span className="adminMockPlanIcon" aria-hidden="true">
                    📑
                  </span>

                  <span className="adminMockPlanBody">
                    <strong>{noteTitle}</strong>

                    <small>
                      {pdfUrl ? "PDF Ready" : "Missing PDF"} •{" "}
                      {(note.status || "draft").toUpperCase()} • {subjectTitle}
                    </small>
                  </span>

                  <span className="adminMockPlanArrow" aria-hidden="true">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="adminMockPlanBottomActions">
        <button
          type="button"
          className="adminMockPlanPrimaryBtn"
          onClick={() => navigate("/admin/content/notes/form")}
        >
          + Add Note PDF
        </button>

        <button
          type="button"
          className="adminMockPlanGhostBtn"
          onClick={() => navigate("/admin/content/notes/manage")}
        >
          Manage Notes
        </button>

        <button
          type="button"
          className="adminMockPlanGhostBtn"
          onClick={() =>
            navigate(
              `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                subjectKey
              )}`
            )
          }
        >
          ← Back to Subject
        </button>
      </div>
    </section>
  );
}