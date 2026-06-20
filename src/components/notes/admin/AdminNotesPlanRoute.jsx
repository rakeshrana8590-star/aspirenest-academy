import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminNotesHero from "./AdminNotesHero";
import AdminNotesEmptyState from "./AdminNotesEmptyState";

import {
  AdminNotesSubjectCard,
  AdminNotesStatusCard,
} from "./AdminNoteCards";

import {
  getAdminNotesByPlan,
  getAdminNotesHealthSummary,
  getAdminNotesStatusCounts,
  getAdminPlanLabel,
  getUniqueAdminNoteSubjects,
} from "../shared/adminNotesUtils";

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

  return (
    <section className="adminNotesPage">
      <AdminNotesHero
        badge={`${activePlan} NOTES`}
        title={`${planLabel} Control`}
        text="Review subjects, chapters, PDF readiness, publish status, and student visibility for this plan."
        stats={[
          {
            label: "Total Notes",
            value: planNotes.length,
          },
          {
            label: "Subjects",
            value: subjects.length,
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
              onClick={() => navigate("/admin/content/notes")}
            >
              ← Back to Notes
            </button>
          </>
        }
      />

      <div className="adminNotesStatusGrid">
        <AdminNotesStatusCard
          label="Student Visible"
          value={healthSummary.ready}
          text="Published notes with PDF URL ready for student side."
        />

        <AdminNotesStatusCard
          label="Missing PDF"
          value={healthSummary.missingPdf}
          text="Notes that need a PDF/source URL."
        />

        <AdminNotesStatusCard
          label="Draft"
          value={statusCounts.draft}
          text="Saved notes not public yet."
        />

        <AdminNotesStatusCard
          label="Archived"
          value={statusCounts.archived}
          text="Hidden notes kept for admin reference."
        />
      </div>

      <div className="adminNotesShelf">
        <div className="adminNotesShelfHeader">
          <span>{planLabel}</span>

          <h2>Subject-wise notes control</h2>

          <p>
            Open a subject to review its chapters and PDF notes. Only notes
            mapped to this plan are shown here.
          </p>
        </div>

        {subjects.length === 0 ? (
          <AdminNotesEmptyState
            icon="📘"
            title="No subjects found"
            text="Create or publish notes for this plan to build the subject library."
            action={
              <button
                type="button"
                className="adminNotesPrimaryBtn"
                onClick={() => navigate("/admin/content/notes/form")}
              >
                + Add First Note
              </button>
            }
          />
        ) : (
          <div className="adminNotesPlanGrid">
            {subjects.map((subject) => (
              <AdminNotesSubjectCard
                key={subject.id}
                subject={subject}
                planName={activePlan}
                onOpen={() =>
                  navigate(
                    `/admin/content/notes/plan/${activePlan}/${encodeURIComponent(
                      subject.id
                    )}`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}