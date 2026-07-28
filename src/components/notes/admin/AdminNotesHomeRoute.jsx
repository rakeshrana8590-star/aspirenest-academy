import React from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminNotes,
  getAdminNotesHealthSummary,
  getAdminNotesPlanSummary,
} from "../shared/adminNotesUtils";
import { buildRealNotesBindingReport } from "../shared/realNotesBinding";

export default function AdminNotesHomeRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();

  const adminNotes = getAdminNotes(universalContent);
  const planSummary = getAdminNotesPlanSummary(universalContent);
  const healthSummary = getAdminNotesHealthSummary(adminNotes);
  const realNotesBinding = buildRealNotesBindingReport(universalContent);

  const systemStats = [
    {
      value: adminNotes.length,
      label: "Admin Notes",
    },
    {
      value: planSummary.length,
      label: "Plans",
    },
    {
      value: healthSummary.ready,
      label: "Student Visible",
    },
    {
      value:
        healthSummary.missingPdf > 0
          ? `${healthSummary.missingPdf} Fix`
          : "Live",
      label: "PDF Health",
    },
  ];

  const primaryActions = [
    {
      icon: "✦",
      label: "Builder",
      title: "Add Note PDF",
      description:
        "Create notes with plan, subject, chapter, PDF URL, status, and publishing settings.",
      route: "/admin/content/notes/form",
      tone: "orange",
    },
    {
      icon: "▣",
      label: "Manager",
      title: "Manage Notes",
      description:
        "Edit, preview, publish, unpublish, archive, and control every saved note.",
      route: "/admin/content/notes/manage",
      tone: "blue",
    },
    {
      icon: "◈",
      label: "Structure",
      title: "Subject Library",
      description:
        "Review notes by subject and keep Plan → Subject → Chapter → PDF flow clean.",
      route: "/admin/content/notes/subjects",
      tone: "green",
    },
    {
      icon: "✓",
      label: "Student Visible",
      title: "Published PDFs",
      description:
        "Audit all notes currently visible to students across free and paid shelves.",
      route: "/admin/content/notes/pdfs",
      tone: "purple",
    },
  ];

  const compactActions = [
    {
      title: "Subjects",
      meta: "Subject structure",
      route: "/admin/content/notes/subjects",
    },
    {
      title: "Chapters",
      meta: "Chapter grouping",
      route: "/admin/content/notes/chapters",
    },
    {
      title: "PDF Library",
      meta: "Student-visible audit",
      route: "/admin/content/notes/pdfs",
    },
    ...planSummary.map((plan) => ({
      title: `${plan.planName} Shelf`,
      meta: `${plan.publishedPdfs} published PDFs`,
      route: `/admin/content/notes/plan/${plan.planName}`,
    })),
    {
      title: "Manage Notes",
      meta: "Edit and publish",
      route: "/admin/content/notes/manage",
    },
    {
      title: "Content Studio",
      meta: "Back to main studio",
      route: "/admin/content",
    },
  ];

  return (
    <section className="coursePages adminMockHomePage adminNotesMockAlignedPage">
      <div className="adminMockHomeShell">
        <section className="adminNotesLaunchHero">
          <div className="adminNotesLaunchHeroCopy">
            <span className="adminNotesLaunchBadge">NOTES CMS</span>

            <h1>Notes Manager</h1>

            <p>
              A premium command center for CTET/TET notes — create PDFs,
              manage subject libraries, control chapter mapping, publish safely,
              and audit student-visible material.
            </p>

            <div className="adminNotesLaunchHeroActions">
              <button
                type="button"
                className="adminNotesLaunchPrimaryBtn"
                onClick={() => navigate("/admin/content/notes/form")}
              >
                Add Note PDF
              </button>

              <button
                type="button"
                className="adminNotesLaunchGhostBtn"
                onClick={() => navigate("/admin/content/notes/manage")}
              >
                Manage Notes
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
              <span>Notes Command</span>
              <strong>Admin Workspace</strong>
            </div>

            <div className="adminNotesLaunchTitleCard">
              <span className="adminNotesLaunchIcon">📘</span>

              <div>
                <h3>Notes Manager</h3>
                <p>CTET / TET NOTES CMS</p>
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

        <section className={`realNotesAdminBinding status-${realNotesBinding.status}`} aria-label="Real Notes source">
          <div>
            <span>REAL NOTES SOURCE</span>
            <h2>{realNotesBinding.readableNotes} existing notes connected to the V8 Drive</h2>
            <p>
              Existing contentItems remain the single source of truth. No duplicate Notes database, no re-upload, and no plan or entitlement reset.
            </p>
          </div>
          <div className="realNotesAdminBindingStats">
            <div><strong>{realNotesBinding.publishedNotes}</strong><span>Published</span></div>
            <div><strong>{realNotesBinding.nativeIntelliText}</strong><span>IntelliText</span></div>
            <div><strong>{realNotesBinding.protectedAssets}</strong><span>Protected assets</span></div>
            <div><strong>{realNotesBinding.legacyPdfFallback}</strong><span>PDF fallback</span></div>
          </div>
          <button type="button" onClick={() => navigate("/ctet-tet/notes?adminPreview=student")}>Preview real Notes</button>
        </section>

        <section className="adminMockCommandCenter">
          <div className="adminMockSectionTitle">
            <span>Admin notes system</span>
            <h2>Core notes workflow</h2>
            <p>
              Most-used notes actions stay above the fold. Structure, plans,
              PDF health, and student visibility stay available from the right
              rail.
            </p>
          </div>

          <div className="adminMockCommandLayout">
            <div className="adminMockPrimaryGrid">
              {primaryActions.map((action) => (
                <button
                  type="button"
                  key={action.route}
                  className={`adminMockActionCard adminMockTone-${action.tone}`}
                  onClick={() => navigate(action.route)}
                >
                  <span className="adminMockActionTop">
                    <span className="adminMockActionIcon" aria-hidden="true">
                      {action.icon}
                    </span>

                    <span className="adminMockActionArrow" aria-hidden="true">
                      →
                    </span>
                  </span>

                  <span className="adminMockActionLabel">{action.label}</span>

                  <strong>{action.title}</strong>

                  <small>{action.description}</small>
                </button>
              ))}
            </div>

            <aside
              className="adminMockQuickRail"
              aria-label="Admin notes shortcuts"
            >
              <div className="adminMockQuickRailHeader">
                <span>Quick Access</span>
                <strong>Structure · Plans · PDFs</strong>
              </div>

              <div className="adminMockQuickList">
                {compactActions.map((action) => (
                  <button
                    type="button"
                    key={action.route}
                    onClick={() => navigate(action.route)}
                  >
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.meta}</small>
                    </span>

                    <em aria-hidden="true">→</em>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <div className="adminMockHomeFooter">
          <button
            type="button"
            className="adminMockBackButton"
            onClick={() => navigate("/admin/content")}
          >
            ← Back to Content Studio
          </button>
        </div>
      </div>
    </section>
  );
}