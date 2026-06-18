import React from "react";

export default function AdminMockTestSeriesRoute({
  universalContent = [],
  navigate,
}) {
  const mockTests = (universalContent || []).filter(
    (item) => item.section === "mockTest"
  );

  const seriesCards = [
    ...new Set(
      mockTests
        .map((test) => test.testType || "Mock Test")
        .filter(Boolean)
    ),
  ]
    .sort()
    .map((seriesName) => {
      const seriesTests = mockTests.filter(
        (test) => (test.testType || "Mock Test") === seriesName
      );

      const subjectCount = [
        ...new Set(seriesTests.map((test) => test.subject).filter(Boolean)),
      ].length;

      const chapterCount = [
        ...new Set(seriesTests.map((test) => test.chapter).filter(Boolean)),
      ].length;

      const questionCount = seriesTests.reduce(
        (total, test) => total + (test.questions?.length || 0),
        0
      );

      const publishedCount = seriesTests.filter(
        (test) => test.status === "published"
      ).length;

      const premiumCount = seriesTests.filter(
        (test) => test.planType === "PREMIUM"
      ).length;

      return {
        seriesName,
        testCount: seriesTests.length,
        subjectCount,
        chapterCount,
        questionCount,
        publishedCount,
        premiumCount,
      };
    });

  const totalSeries = seriesCards.length;

  const totalTests = mockTests.length;

  const totalQuestions = mockTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const totalPublished = mockTests.filter(
    (test) => test.status === "published"
  ).length;

  const totalSubjects = [
    ...new Set(mockTests.map((test) => test.subject).filter(Boolean)),
  ].length;

  return (
    <section className="coursePages adminMockSeriesPage">
      <div className="adminMockSeriesHero">
        <div className="adminMockSeriesHeroCopy">
          <span className="badge">MOCK TEST SERIES</span>

          <h1>Mock Test Series Library</h1>

          <p>
            Organize chapter tests, subject tests, full-length exams, PYQ
            practice, revision quizzes, and daily practice sets from one
            premium test-series command center.
          </p>

          <div className="adminMockSeriesHeroActions">
            <button
              type="button"
              className="adminMockSeriesPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockSeriesGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>

            <button
              type="button"
              className="adminMockSeriesGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockSeriesSystemCard">
          <div className="adminMockSeriesSystemTop">
            <span>SERIES STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockSeriesSystemGrid">
            <div>
              <strong>{totalSeries}</strong>
              <span>Series</span>
            </div>

            <div>
              <strong>{totalTests}</strong>
              <span>Total tests</span>
            </div>

            <div>
              <strong>{totalSubjects}</strong>
              <span>Subjects</span>
            </div>

            <div>
              <strong>{totalPublished}</strong>
              <span>Published</span>
            </div>
          </div>

          <div className="adminMockSeriesFlow">
            <span>Series</span>
            <i />
            <span>Tests</span>
            <i />
            <span>Publish</span>
          </div>
        </div>
      </div>

      <div className="adminMockSeriesKpiGrid">
        <div className="adminMockSeriesKpiCard">
          <span>Total Series</span>
          <strong>{totalSeries}</strong>
          <p>Exam format groups</p>
        </div>

        <div className="adminMockSeriesKpiCard">
          <span>Total Tests</span>
          <strong>{totalTests}</strong>
          <p>All mock-test records</p>
        </div>

        <div className="adminMockSeriesKpiCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Questions connected</p>
        </div>

        <div className="adminMockSeriesKpiCard">
          <span>Published</span>
          <strong>{totalPublished}</strong>
          <p>Student-visible tests</p>
        </div>
      </div>

      <div className="adminMockSeriesPanel">
        <div className="adminMockSeriesPanelHeader">
          <div>
            <span>TEST SERIES LIBRARY</span>
            <h2>Open Series Pools</h2>
          </div>

          <small>{seriesCards.length} series</small>
        </div>

        {seriesCards.length === 0 ? (
          <div className="adminMockSeriesEmpty">
            <strong>No test series found.</strong>
            <p>Add mock tests first to generate test-series pools.</p>
          </div>
        ) : (
          <div className="adminMockSeriesGrid">
            {seriesCards.map((series) => (
              <button
                type="button"
                key={series.seriesName}
                className="adminMockSeriesCard"
                onClick={() => navigate("/admin/content/mock-tests/manage")}
              >
                <span className="adminMockSeriesIcon" aria-hidden="true">
                  🧩
                </span>

                <span className="adminMockSeriesBody">
                  <strong>{series.seriesName}</strong>

                  <small>
                    {series.testCount} Tests • {series.subjectCount} Subjects •{" "}
                    {series.chapterCount} Chapters • {series.questionCount}{" "}
                    Questions • {series.publishedCount} Published •{" "}
                    {series.premiumCount} Premium
                  </small>
                </span>

                <span className="adminMockSeriesArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockSeriesBottomActions">
        <button
          type="button"
          className="adminMockSeriesPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Mock Test
        </button>

        <button
          type="button"
          className="adminMockSeriesGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          Manage Tests
        </button>

        <button
          type="button"
          className="adminMockSeriesGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests")}
        >
          ← Back to Mock Tests Manager
        </button>
      </div>
    </section>
  );
}