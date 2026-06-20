import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAdminNotesByPlan,
  getAdminNotesBySubject,
  getAdminNotesHealthSummary,
  getAdminNotesStatusCounts,
  getAdminPlanLabel,
  getUniqueAdminNoteChapters,
  getUniqueAdminNoteSubjects,
} from "../shared/adminNotesUtils";

import { hasNotePdf } from "../shared/notesUtils";

export default function AdminNotesPlanRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();
  const { planType } = useParams();

  const activePlan = decodeURIComponent(planType || "FREE").toUpperCase();
  const planLabel = getAdminPlanLabel(activePlan);

  const planNotes = getAdminNotesByPlan(universalContent, activePlan);
  const subjects = getUniqueAdminNoteSubjects(planNotes);
  const statusCounts = getAdminNotesStatusCounts(planNotes);
  const healthSummary = getAdminNotesHealthSummary(planNotes);

  const totalChapters = getUniqueAdminNoteChapters(planNotes).length;
  const pdfReady = planNotes.filter((note) => hasNotePdf(note)).length;

  const systemStats = [
    {
      value: subjects.length,
      label: "Subjects",
    },
    {
      value: planNotes.length,
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

  const subjectCards = subjects.map((subject) => {
    const subjectNotes = getAdminNotesBySubject(planNotes, subject.id);
    const subjectHealth = getAdminNotesHealthSummary(subjectNotes);
    const chapterCount = getUniqueAdminNoteChapters(subjectNotes).length;
    const subjectPdfReady = subjectNotes.filter((note) => hasNotePdf(note)).length;

    return {
      ...subject,
      notesCount: subjectNotes.length,
      chapterCount,
      pdfReady: subjectPdfReady,
      studentVisible: subjectHealth.ready,
    };
  });

  return (
    <section className="coursePages adminMockPlanPage adminNotesPlanAlignedPage">
      <section className="adminNotesLaunchHero">
        <div className="adminNotesLaunchHeroCopy">
          <span className="adminNotesLaunchBadge">{activePlan} NOTES</span>

          <h1>{planLabel} Library</h1>

          <p>
            Manage plan-wise notes, subject shelves, chapter coverage,
            student-visible PDFs, and PDF readiness from one premium notes
            command center.
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
              onClick={() => navigate("/admin/content/notes")}
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
            <span>Plan Status</span>
            <strong>{activePlan}</strong>
          </div>

          <div className="adminNotesLaunchTitleCard">
            <span className="adminNotesLaunchIcon">📘</span>

            <div>
              <h3>{planLabel} Library</h3>
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
          <strong>{planNotes.length}</strong>
          <p>{activePlan} plan note records</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Total Subjects</span>
          <strong>{subjects.length}</strong>
          <p>Subject-wise shelves</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Total Chapters</span>
          <strong>{totalChapters}</strong>
          <p>Chapter coverage</p>
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
            <span>PLAN SUBJECT LIBRARY</span>
            <h2>{activePlan} Subject Shelves</h2>
          </div>

          <small>{subjectCards.length} subjects</small>
        </div>

        {subjectCards.length === 0 ? (
          <div className="adminMockPlanEmpty">
            <strong>No subjects found.</strong>
            <p>Add a note PDF in this plan first.</p>
          </div>
        ) : (
          <div className="adminMockPlanGrid">
            {subjectCards.map((subject) => (
              <button
                type="button"
                key={subject.id}
                className="adminMockPlanCard"
                onClick={() =>
                  navigate(
                    `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                      subject.id
                    )}`
                  )
                }
              >
                <span className="adminMockPlanIcon" aria-hidden="true">
                  📚
                </span>

                <span className="adminMockPlanBody">
                  <strong>{subject.title}</strong>

                  <small>
                    {subject.chapterCount} Chapters • {subject.notesCount} Notes
                    • {subject.pdfReady} PDFs • {subject.studentVisible} Student
                    Visible
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
          onClick={() => navigate("/admin/content/notes")}
        >
          ← Back to Notes Manager
        </button>
      </div>
    </section>
  );
}