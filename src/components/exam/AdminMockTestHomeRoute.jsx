import React from "react";
import { useNavigate } from "react-router-dom";

const primaryActions = [
  {
    icon: "✦",
    label: "Builder",
    title: "Add Examination",
    description:
      "Create exam rules, timing, schedule, marks, questions, security, and publishing settings.",
    route: "/admin/content/mock-tests/add",
    tone: "orange",
  },
  {
    icon: "▣",
    label: "Manager",
    title: "Manage Tests",
    description:
      "Edit, preview, publish, unpublish, duplicate-check, and control every saved test.",
    route: "/admin/content/mock-tests/manage",
    tone: "blue",
  },
  {
    icon: "◈",
    label: "Question System",
    title: "Question Bank",
    description:
      "Reuse saved questions by subject and chapter without rebuilding papers again.",
    route: "/admin/content/mock-tests/question-bank",
    tone: "green",
  },
  {
    icon: "✓",
    label: "Student Visible",
    title: "Published Tests",
    description:
      "Audit all tests currently visible to students across free and premium shelves.",
    route: "/admin/content/mock-tests/published",
    tone: "purple",
  },
];

const compactActions = [
  {
    title: "Subjects",
    meta: "Syllabus structure",
    route: "/admin/content/mock-tests/subjects",
  },
  {
    title: "Chapters",
    meta: "Chapter grouping",
    route: "/admin/content/mock-tests/chapters",
  },
  {
    title: "Test Series",
    meta: "Weekly / monthly campaigns",
    route: "/admin/content/mock-tests/test-series",
  },
  {
    title: "FREE Shelf",
    meta: "Public access audit",
    route: "/admin/content/mock-tests/plan/FREE",
  },
  {
    title: "BASIC Shelf",
    meta: "Basic plan content",
    route: "/admin/content/mock-tests/plan/BASIC",
  },
  {
    title: "PREMIUM Shelf",
    meta: "Paid exam content",
    route: "/admin/content/mock-tests/plan/PREMIUM",
  },
  {
    title: "MENTORSHIP Shelf",
    meta: "Guided preparation",
    route: "/admin/content/mock-tests/plan/MENTORSHIP",
  },
  {
    title: "Results",
    meta: "Attempts and scores",
    route: "/admin/content/mock-tests/results",
  },
  {
    title: "Leaderboard",
    meta: "Top performers",
    route: "/admin/content/mock-tests/leaderboard",
  },
  {
    title: "Analytics",
    meta: "Exam intelligence",
    route: "/admin/content/mock-tests/analytics",
  },
];

const systemStats = [
  { value: "21", label: "Admin routes protected" },
  { value: "4", label: "Plan shelves" },
  { value: "1", label: "Create → Publish → Result" },
  { value: "Live", label: "Question bank + analytics" },
];

export default function AdminMockTestHomeRoute() {
  const navigate = useNavigate();

  return (
    <section className="coursePages adminMockHomePage">
      <div className="adminMockHomeShell">
        <section className="adminMockHomeHero">
          <div className="adminMockHeroCopy">
            <span className="adminMockKicker">MOCK TEST CMS</span>

            <h1>Mock Tests Manager</h1>

            <p>
              A premium command center for CTET/TET examinations — build tests,
              manage question banks, control plan shelves, publish safely, and
              track student performance.
            </p>

            <div className="adminMockHeroActions">
              <button
                type="button"
                className="adminMockPrimaryButton"
                onClick={() => navigate("/admin/content/mock-tests/add")}
              >
                Add Examination
              </button>

              <button
                type="button"
                className="adminMockSecondaryButton"
                onClick={() => navigate("/admin/content/mock-tests/manage")}
              >
                Manage Tests
              </button>
            </div>
          </div>

          <aside
            className="adminMockSystemPanel"
            aria-label="Mock test system status"
          >
            <div className="adminMockPanelHeader">
              <span>System Status</span>
              <strong>Admin ON</strong>
            </div>

            <div className="adminMockStatGrid">
              {systemStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="adminMockFlowLine">
              <span>Create</span>
              <i />
              <span>Publish</span>
              <i />
              <span>Analyze</span>
            </div>
          </aside>
        </section>

        <section className="adminMockCommandCenter">
          <div className="adminMockSectionTitle">
            <span>Admin mock system</span>
            <h2>Core exam workflow</h2>
            <p>
              Most-used mock test actions stay above the fold. Structure,
              results, plans, and analytics stay available from the right rail.
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
              aria-label="Admin mock shortcuts"
            >
              <div className="adminMockQuickRailHeader">
                <span>Quick Access</span>
                <strong>Structure · Plans · Results</strong>
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