import React from "react";

export default function AdminMockTestSubjectsRoute({
  universalContent = [],
  navigate,
}) {
  const mockTests = (universalContent || []).filter(
    (item) => item.section === "mockTest"
  );

  const subjectCards = [
    ...new Set(mockTests.map((test) => test.subject).filter(Boolean)),
  ]
    .sort()
    .map((subjectName) => {
      const subjectTests = mockTests.filter(
        (test) => test.subject === subjectName
      );

      const chapterCount = [
        ...new Set(subjectTests.map((test) => test.chapter).filter(Boolean)),
      ].length;

      const questionCount = subjectTests.reduce(
        (total, test) => total + (test.questions?.length || 0),
        0
      );

      const publishedCount = subjectTests.filter(
        (test) => test.status === "published"
      ).length;

      return {
        subjectName,
        testCount: subjectTests.length,
        chapterCount,
        questionCount,
        publishedCount,
      };
    });

  const totalSubjects = subjectCards.length;

  const totalTests = mockTests.length;

  const totalQuestions = mockTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const totalPublished = mockTests.filter(
    (test) => test.status === "published"
  ).length;

  const totalChapters = [
    ...new Set(mockTests.map((test) => test.chapter).filter(Boolean)),
  ].length;

  return (
    <section className="coursePages adminMockSubjectsPage">
      <div className="adminMockSubjectsHero">
        <div className="adminMockSubjectsHeroCopy">
          <span className="badge">MOCK TEST SUBJECTS</span>

          <h1>Mock Test Subject Library</h1>

          <p>
            Browse all mock-test subjects, chapter coverage, live question
            pools, and published exam readiness from one premium subject command
            center.
          </p>

          <div className="adminMockSubjectsHeroActions">
            <button
              type="button"
              className="adminMockSubjectsPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockSubjectsGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>

            <button
              type="button"
              className="adminMockSubjectsGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockSubjectsSystemCard">
          <div className="adminMockSubjectsSystemTop">
            <span>SUBJECT STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockSubjectsSystemGrid">
            <div>
              <strong>{totalSubjects}</strong>
              <span>Subjects</span>
            </div>

            <div>
              <strong>{totalTests}</strong>
              <span>Total tests</span>
            </div>

            <div>
              <strong>{totalChapters}</strong>
              <span>Chapters</span>
            </div>

            <div>
              <strong>{totalPublished}</strong>
              <span>Published</span>
            </div>
          </div>

          <div className="adminMockSubjectsFlow">
            <span>Subject</span>
            <i />
            <span>Chapter</span>
            <i />
            <span>Test</span>
          </div>
        </div>
      </div>

      <div className="adminMockSubjectsKpiGrid">
        <div className="adminMockSubjectsKpiCard">
          <span>Total Subjects</span>
          <strong>{totalSubjects}</strong>
          <p>Subject-wise exam pools</p>
        </div>

        <div className="adminMockSubjectsKpiCard">
          <span>Total Tests</span>
          <strong>{totalTests}</strong>
          <p>All mock-test records</p>
        </div>

        <div className="adminMockSubjectsKpiCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Questions connected</p>
        </div>

        <div className="adminMockSubjectsKpiCard">
          <span>Published</span>
          <strong>{totalPublished}</strong>
          <p>Student-visible tests</p>
        </div>
      </div>

      <div className="adminMockSubjectsPanel">
        <div className="adminMockSubjectsPanelHeader">
          <div>
            <span>SUBJECT LIBRARY</span>
            <h2>Open Subject Pools</h2>
          </div>

          <small>{subjectCards.length} subjects</small>
        </div>

        {subjectCards.length === 0 ? (
          <div className="adminMockSubjectsEmpty">
            <strong>No subjects found.</strong>
            <p>Add mock tests first to generate subject pools.</p>
          </div>
        ) : (
          <div className="adminMockSubjectsGrid">
            {subjectCards.map((subject) => (
              <button
                type="button"
                key={subject.subjectName}
                className="adminMockSubjectsCard"
                onClick={() => navigate("/admin/content/mock-tests/question-bank")}
              >
                <span className="adminMockSubjectsIcon" aria-hidden="true">
                  📚
                </span>

                <span className="adminMockSubjectsBody">
                  <strong>{subject.subjectName}</strong>

                  <small>
                    {subject.chapterCount} Chapters • {subject.testCount} Tests
                    • {subject.questionCount} Questions •{" "}
                    {subject.publishedCount} Published
                  </small>
                </span>

                <span className="adminMockSubjectsArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockSubjectsBottomActions">
        <button
          type="button"
          className="adminMockSubjectsPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Mock Test
        </button>

        <button
          type="button"
          className="adminMockSubjectsGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          Manage Tests
        </button>

        <button
          type="button"
          className="adminMockSubjectsGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests")}
        >
          ← Back to Mock Tests Manager
        </button>
      </div>
    </section>
  );
}