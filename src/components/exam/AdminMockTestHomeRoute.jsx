import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminMockTestHomeRoute() {
  const navigate = useNavigate();

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">MOCK TEST CMS</span>

        <h1>Mock Tests Manager</h1>

        <p>
          Manage CTET/TET mock tests, plan-wise test series,
          subjects, chapters, question banks, answers, results,
          and student practice systems.
        </p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioGrid">
          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/add")
            }
          >
            ➕ Add Examination
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/question-bank")
            }
          >
            📚 Question Bank
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/manage")
            }
          >
            📂 Manage Mock Tests
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/plan/FREE")
            }
          >
            FREE Mock Tests
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/plan/BASIC")
            }
          >
            BASIC Mock Tests
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/plan/PREMIUM")
            }
          >
            PREMIUM Mock Tests
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/plan/MENTORSHIP")
            }
          >
            MENTORSHIP Mock Tests
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/subjects")
            }
          >
            📚 Subjects
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/chapters")
            }
          >
            📖 Chapters
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/test-series")
            }
          >
            🧪 Test Series
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/published")
            }
          >
            ✅ Published Tests
          </button>

          <button
            onClick={() =>
              navigate("/admin/content/mock-tests/results")
            }
          >
            📊 Test Results
          </button>

          <button
            className="contentStudioBtn"
            onClick={() =>
              navigate("/admin/content/mock-tests/leaderboard")
            }
          >
            🏆 Leaderboard
          </button>

          <button
            className="contentStudioBtn"
            onClick={() =>
              navigate("/admin/content/mock-tests/analytics")
            }
          >
            📈 Analytics
          </button>

          <button
            onClick={() =>
              navigate("/admin/content")
            }
          >
            ← Back to Content Studio
          </button>
        </div>
      </div>
    </section>
  );
}