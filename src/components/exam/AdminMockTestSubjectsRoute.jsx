import React from "react";

export default function AdminMockTestSubjectsRoute({
  universalContent,
  navigate,
}) {
  const mockTests = universalContent.filter(
    (item) => item.section === "mockTest"
  );

  const subjects = [
    ...new Set(
      mockTests
        .map((test) => test.subject)
        .filter(Boolean)
    ),
  ];

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">MOCK TEST SUBJECTS</span>

        <h1>Mock Test Subject Library</h1>

        <p>
          Browse all mock test subjects and open their chapters, tests,
          and question collections.
        </p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests")}
          >
            ← Back to Mock Tests Manager
          </button>

          <button
            className="publishButton"
            onClick={() => navigate("/admin/content/mock-tests/add")}
          >
            + Add Mock Test
          </button>
        </div>
      </div>

      <div className="contentStudioList">
        <h3>All Mock Test Subjects</h3>

        {subjects.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No subjects found.</strong>
            <p>Add mock tests first to generate subjects.</p>
          </div>
        ) : (
          <div className="contentStudioGrid">
            {subjects.map((subjectName) => {
              const subjectTests = mockTests.filter(
                (test) => test.subject === subjectName
              );

              return (
                <button
                  key={subjectName}
                  className="publishButton"
                  onClick={() =>
                    navigate(
                      `/admin/content/mock-tests/${encodeURIComponent(
                        subjectName
                      )}`
                    )
                  }
                >
                  {subjectName}
                  <br />
                  <small>
                    {subjectTests.length} Test
                    {subjectTests.length > 1 ? "s" : ""}
                  </small>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
