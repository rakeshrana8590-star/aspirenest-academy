import React from "react";

export default function AppDashboard({ setActiveSection, setActiveAdminTab, user, isAdmin }) {
  return (
    <section className="appDashboard">
      <div className="appDashboardHeader">
        <span className="dashboardBadge">
          AspireNest Learning Hub
        </span>

        <h1>Choose what you want to study today</h1>

        <p>
          Open any section directly without scrolling the full website.
        </p>
      </div>

      <div className="dashboardGrid">

        {/* Courses */}
        <div className="dashboardCard">
          <span>📚</span>

          <h3>Courses</h3>

          <p>
            CTET/TET learning paths and topic-wise preparation.
          </p>

          <button
            onClick={() => setActiveSection("courses")}
          >
            Open
          </button>
        </div>
{/* Learning Paths */}
<div className="dashboardCard">
  <span>🎯</span>

  <h3>Learning Paths</h3>

  <p>
    Beginner to premium structured learning programs.
  </p>

  <button
    onClick={() => setActiveSection("learning-paths")}
  >
    Open
  </button>
</div>
        {/* Notes */}
        <div className="dashboardCard">
          <span>📝</span>

          <h3>Notes</h3>

          <p>
            Premium and free revision notes for quick learning.
          </p>

          <button
            onClick={() => setActiveSection("notes")}
          >
            Open
          </button>
        </div>

        {/* Mock Tests */}
        <div className="dashboardCard">
          <span>🧪</span>

          <h3>Mock Tests</h3>

          <p>
            Practice tests, score tracking and exam preparation.
          </p>

          <button
            onClick={() => setActiveSection("mock-tests")}
          >
            Open
          </button>
        </div>

        {/* Current Affairs */}
        <div className="dashboardCard">
          <span>📰</span>

          <h3>Current Affairs</h3>

          <p>
            Monthly PDF updates and exam-focused current affairs.
          </p>

          <button
            onClick={() => setActiveSection("current-affairs")}
          >
            Open
          </button>
        </div>

        {/* Premium */}
        <div className="dashboardCard">
          <span>👑</span>

          <h3>Premium</h3>

          <p>
            Unlock full course, mock tests, notes and mentorship.
          </p>

          <button
            onClick={() => setActiveSection("pricing")}
          >
            Open
          </button>
        </div>

        {isAdmin(user) && (
  <div className="dashboardCard">
    <span>🛠️</span>

    <h3>Admin Panel</h3>

    <p>
      Manage students, notes, mock tests, announcements and analytics.
    </p>

    <button
      onClick={() => setActiveSection("admin-panel")}
    >
      Open
    </button>
  </div>
)}
        {/* Progress */}
        {/* Announcements */}
<div className="dashboardCard">
  <span>📢</span>

  <h3>Announcements</h3>

  <p>
    Latest updates, exam alerts and important platform notifications.
  </p>

  <button
   onClick={() => {
    setActiveAdminTab("Announcements");
    setActiveSection("admin-panel");
  }}
  >
    Open
  </button>
</div>
        <div className="dashboardCard">
          <span>📊</span>

          <h3>My Progress</h3>

          <p>
            Student dashboard, analytics and learning progress.
          </p>

          <button
            onClick={() => setActiveSection("student-profile")}
          >
            Open
          </button>
        </div>

      </div>
    </section>
  );
}