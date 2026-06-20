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
  const subjectTitle = subjectInfo?.title || "Subject Notes";
  const subjectKey = subjectInfo?.id || activeSubject;

  const subjectNotes = getAdminNotesBySubject(planNotes, activeSubject);
  const chapters = getUniqueAdminNoteChapters(subjectNotes);

  const statusCounts = getAdminNotesStatusCounts(subjectNotes);
  const healthSummary = getAdminNotesHealthSummary(subjectNotes);
  const pdfReady = subjectNotes.filter((note) => hasNotePdf(note)).length;

  const systemStats = [
    {
      value: chapters.length,
      label: "Chapters",
    },
    {
      value: subjectNotes.length,
      label: "Total Notes",
    },
    {
      value: pdfReady,
      label: "PDF Ready",
    },
    {
      value: healthSummary.ready,
      label: "Student Visible",
    },
  ];

  const chapterCards = chapters.map((chapter) => {
    const chapterNotes = getAdminNotesByChapter(subjectNotes, chapter.id);
    const chapterHealth = getAdminNotesHealthSummary(chapterNotes);
    const chapterPdfReady = chapterNotes.filter((note) => hasNotePdf(note)).length;

    return {
      ...chapter,
      notesCount: chapterNotes.length,
      pdfReady: chapterPdfReady,
      studentVisible: chapterHealth.ready,
    };
  });

  return (
    <section className="coursePages adminMockPlanPage adminNotesPlanAlignedPage">
      <section className="adminNotesLaunchHero">
        <div className="adminNotesLaunchHeroCopy">
          <span className="adminNotesLaunchBadge">{activePlan} NOTES</span>

          <h1>{subjectTitle}</h1>

          <p>
            Review chapter-wise notes, PDF readiness, publish status, and
            student visibility inside {planLabel}.
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
                navigate(`/admin/content/notes/plan/${activePlan}`)
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
            <span>Subject Status</span>
            <strong>{activePlan}</strong>
          </div>

          <div className="adminNotesLaunchTitleCard">
            <span className="adminNotesLaunchIcon">📚</span>

            <div>
              <h3>{subjectTitle}</h3>
              <p>{activePlan} NOTES CMS</p>
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
          <span>Total Notes</span>
          <strong>{subjectNotes.length}</strong>
          <p>{subjectTitle} note records</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Total Chapters</span>
          <strong>{chapters.length}</strong>
          <p>Chapter-wise shelves</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>PDF Ready</span>
          <strong>{pdfReady}</strong>
          <p>Notes with PDF source</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Published</span>
          <strong>{statusCounts.published}</strong>
          <p>Student-ready notes</p>
        </div>
      </div>

      <div className="adminMockPlanPanel">
        <div className="adminMockPlanPanelHeader">
          <div>
            <span>SUBJECT CHAPTER LIBRARY</span>
            <h2>{subjectTitle} Chapter Shelves</h2>
          </div>

          <small>{chapterCards.length} chapters</small>
        </div>

        {chapterCards.length === 0 ? (
          <div className="adminMockPlanEmpty">
            <strong>No chapters found.</strong>
            <p>Add a note PDF in this subject first.</p>
          </div>
        ) : (
          <div className="adminMockPlanGrid">
            {chapterCards.map((chapter) => (
              <button
                type="button"
                key={chapter.id}
                className="adminMockPlanCard"
                onClick={() =>
                  navigate(
                    `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                      subjectKey
                    )}/${encodeURIComponent(chapter.id)}`
                  )
                }
              >
                <span className="adminMockPlanIcon" aria-hidden="true">
                  📄
                </span>

                <span className="adminMockPlanBody">
                  <strong>{chapter.title}</strong>

                  <small>
                    {chapter.notesCount} Notes • {chapter.pdfReady} PDFs •{" "}
                    {chapter.studentVisible} Student Visible
                  </small>
                </span>

                <span className="adminMockPlanArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
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
            navigate(`/admin/content/notes/plan/${activePlan}`)
          }
        >
          ← Back to Plan
        </button>
      </div>
    </section>
  );
}