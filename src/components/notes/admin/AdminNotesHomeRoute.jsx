import React from "react";
import { useNavigate } from "react-router-dom";

import AdminNotesHero from "./AdminNotesHero";

import {
  AdminNotesPlanCard,
  AdminNotesQuickActionCard,
  AdminNotesStatusCard,
} from "./AdminNoteCards";

import {
  getAdminNotes,
  getAdminNotesHealthSummary,
  getAdminNotesPlanSummary,
  getAdminNotesStatusCounts,
} from "../shared/adminNotesUtils";

export default function AdminNotesHomeRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();

  const adminNotes = getAdminNotes(universalContent);
  const planSummary = getAdminNotesPlanSummary(universalContent);
  const statusCounts = getAdminNotesStatusCounts(adminNotes);
  const healthSummary = getAdminNotesHealthSummary(adminNotes);

  return (
    <section className="adminNotesPage">
      <AdminNotesHero
        badge="NOTES MANAGER"
        title="Notes Content Manager"
        text="Manage CTET/TET notes by plan, subject, chapter, PDF source, publish status, and student visibility."
        stats={[
          {
            label: "Total Notes",
            value: adminNotes.length,
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
              + Add New Note
            </button>

            <button
              type="button"
              className="adminNotesGhostBtn"
              onClick={() => navigate("/admin/content/notes/manage")}
            >
              Manage All Notes
            </button>

            <button
              type="button"
              className="adminNotesGhostBtn"
              onClick={() => navigate("/admin/content")}
            >
              ← Back to Content Studio
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
          text="Notes that need PDF/source URL before launch."
        />

        <AdminNotesStatusCard
          label="Draft"
          value={statusCounts.draft}
          text="Saved notes that are not public yet."
        />

        <AdminNotesStatusCard
          label="Archived"
          value={statusCounts.archived}
          text="Hidden notes kept for admin reference."
        />
      </div>

      <div className="adminNotesShelf">
        <div className="adminNotesShelfHeader">
          <span>Quick Workspace</span>

          <h2>Manage notes workflow</h2>

          <p>
            Jump into form, manage list, subject library, chapter library, or
            PDF audit without leaving the admin notes workspace.
          </p>
        </div>

        <div className="adminNotesQuickGrid">
          <AdminNotesQuickActionCard
            icon="📝"
            title="Add New Note"
            text="Create a note with plan, subject, chapter, status, and PDF source."
            onOpen={() => navigate("/admin/content/notes/form")}
          />

          <AdminNotesQuickActionCard
            icon="🧾"
            title="Manage All Notes"
            text="Review, edit, open PDF, publish status, and note health."
            onOpen={() => navigate("/admin/content/notes/manage")}
          />

          <AdminNotesQuickActionCard
            icon="📚"
            title="Subjects"
            text="Manage subject-wise notes and chapter connections."
            onOpen={() => navigate("/admin/content/notes/subjects")}
          />

          <AdminNotesQuickActionCard
            icon="📄"
            title="Chapters & PDFs"
            text="Review chapter nodes and all PDF notes in one place."
            onOpen={() => navigate("/admin/content/notes/chapters")}
          />
        </div>
      </div>

      <div className="adminNotesShelf">
        <div className="adminNotesShelfHeader">
          <span>Plan Library</span>

          <h2>Plan-wise notes control</h2>

          <p>
            Open a plan to review its subjects, chapters, published PDFs, and
            missing-source health.
          </p>
        </div>

        <div className="adminNotesPlanGrid">
          {planSummary.map((plan) => (
            <AdminNotesPlanCard
              key={plan.planName}
              plan={plan}
              onOpen={() =>
                navigate(`/admin/content/notes/plan/${plan.planName}`)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}