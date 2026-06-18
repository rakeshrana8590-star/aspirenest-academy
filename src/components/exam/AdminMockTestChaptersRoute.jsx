import React from "react";

export default function AdminMockTestChaptersRoute({
  universalContent = [],
  navigate,
}) {
  const mockTests = (universalContent || []).filter(
    (item) => item.section === "mockTest"
  );

  const chapterCards = [
    ...new Set(mockTests.map((test) => test.chapter).filter(Boolean)),
  ]
    .sort()
    .map((chapterName) => {
      const chapterTests = mockTests.filter(
        (test) => test.chapter === chapterName
      );

      const subjectCount = [
        ...new Set(chapterTests.map((test) => test.subject).filter(Boolean)),
      ].length;

      const questionCount = chapterTests.reduce(
        (total, test) => total + (test.questions?.length || 0),
        0
      );

      const publishedCount = chapterTests.filter(
        (test) => test.status === "published"
      ).length;

      const premiumCount = chapterTests.filter(
        (test) => test.planType === "PREMIUM"
      ).length;

      return {
        chapterName,
        testCount: chapterTests.length,
        subjectCount,
        questionCount,
        publishedCount,
        premiumCount,
      };
    });

  const totalChapters = chapterCards.length;

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
    <section className="coursePages adminMockChaptersPage">
      <div className="adminMockChaptersHero">
        <div className="adminMockChaptersHeroCopy">
          <span className="badge">MOCK TEST CHAPTERS</span>

          <h1>Mock Test Chapter Library</h1>

          <p>
            Browse all chapter-wise mock-test pools, subject coverage, question
            strength, and published readiness from one premium chapter command
            center.
          </p>

          <div className="adminMockChaptersHeroActions">
            <button
              type="button"
              className="adminMockChaptersPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockChaptersGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>

            <button
              type="button"
              className="adminMockChaptersGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockChaptersSystemCard">
          <div className="adminMockChaptersSystemTop">
            <span>CHAPTER STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockChaptersSystemGrid">
            <div>
              <strong>{totalChapters}</strong>
              <span>Chapters</span>
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

          <div className="adminMockChaptersFlow">
            <span>Chapter</span>
            <i />
            <span>Tests</span>
            <i />
            <span>Questions</span>
          </div>
        </div>
      </div>

      <div className="adminMockChaptersKpiGrid">
        <div className="adminMockChaptersKpiCard">
          <span>Total Chapters</span>
          <strong>{totalChapters}</strong>
          <p>Chapter-wise exam pools</p>
        </div>

        <div className="adminMockChaptersKpiCard">
          <span>Total Tests</span>
          <strong>{totalTests}</strong>
          <p>All mock-test records</p>
        </div>

        <div className="adminMockChaptersKpiCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Questions connected</p>
        </div>

        <div className="adminMockChaptersKpiCard">
          <span>Published</span>
          <strong>{totalPublished}</strong>
          <p>Student-visible tests</p>
        </div>
      </div>

      <div className="adminMockChaptersPanel">
        <div className="adminMockChaptersPanelHeader">
          <div>
            <span>CHAPTER LIBRARY</span>
            <h2>Open Chapter Pools</h2>
          </div>

          <small>{chapterCards.length} chapters</small>
        </div>

        {chapterCards.length === 0 ? (
          <div className="adminMockChaptersEmpty">
            <strong>No chapters found.</strong>
            <p>Add mock tests first to generate chapter pools.</p>
          </div>
        ) : (
          <div className="adminMockChaptersGrid">
            {chapterCards.map((chapter) => (
              <button
                type="button"
                key={chapter.chapterName}
                className="adminMockChaptersCard"
                onClick={() => navigate("/admin/content/mock-tests/question-bank")}
              >
                <span className="adminMockChaptersIcon" aria-hidden="true">
                  📖
                </span>

                <span className="adminMockChaptersBody">
                  <strong>{chapter.chapterName}</strong>

                  <small>
                    {chapter.subjectCount} Subjects • {chapter.testCount} Tests
                    • {chapter.questionCount} Questions •{" "}
                    {chapter.publishedCount} Published • {chapter.premiumCount}{" "}
                    Premium
                  </small>
                </span>

                <span className="adminMockChaptersArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockChaptersBottomActions">
        <button
          type="button"
          className="adminMockChaptersPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Mock Test
        </button>

        <button
          type="button"
          className="adminMockChaptersGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          Manage Tests
        </button>

        <button
          type="button"
          className="adminMockChaptersGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests")}
        >
          ← Back to Mock Tests Manager
        </button>
      </div>
    </section>
  );
}