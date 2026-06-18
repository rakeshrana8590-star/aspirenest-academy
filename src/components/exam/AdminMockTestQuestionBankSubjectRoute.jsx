import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestQuestionBankSubjectRoute({
  universalContent,
  navigate,
}) {
  const { subjectName } = useParams();
  const activeSubject = decodeURIComponent(subjectName || "");

  const normalize = (value = "") => value.toString().trim().toLowerCase();

  const mockTests = universalContent.filter(
    (item) => item.section === "mockTest"
  );

  const subjectTests = mockTests.filter(
    (test) => normalize(test.subject) === normalize(activeSubject)
  );

  const chapters = [
    ...new Set(subjectTests.map((test) => test.chapter).filter(Boolean)),
  ].sort();

  const totalQuestions = subjectTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const publishedTests = subjectTests.filter(
    (test) => test.status === "published"
  ).length;

  const premiumTests = subjectTests.filter(
    (test) => test.planType === "PREMIUM"
  ).length;

  const chapterCards = chapters.map((chapterName) => {
    const chapterTests = subjectTests.filter(
      (test) => normalize(test.chapter) === normalize(chapterName)
    );

    const questionCount = chapterTests.reduce(
      (total, test) => total + (test.questions?.length || 0),
      0
    );

    const publishedCount = chapterTests.filter(
      (test) => test.status === "published"
    ).length;

    return {
      chapterName,
      testCount: chapterTests.length,
      questionCount,
      publishedCount,
    };
  });

  return (
    <section className="coursePages adminMockQuestionBankPage adminMockQuestionBankSubjectPage">
      <div className="adminMockQbHero">
        <div className="adminMockQbHeroCopy">
          <span className="badge">QUESTION BANK SUBJECT</span>

          <h1>{activeSubject}</h1>

          <p>
            Browse chapter-wise question pools, test coverage, and reusable
            exam questions inside this subject.
          </p>

          <div className="adminMockQbHeroActions">
            <button
              type="button"
              className="adminMockQbPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Examination Test
            </button>

            <button
              type="button"
              className="adminMockQbGhostBtn"
              onClick={() =>
                navigate("/admin/content/mock-tests/question-bank")
              }
            >
              ← Back to Question Bank
            </button>
          </div>
        </div>

        <div className="adminMockQbSystemCard">
          <div className="adminMockQbSystemTop">
            <span>SUBJECT STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockQbSystemGrid">
            <div>
              <strong>{chapters.length}</strong>
              <span>Chapters</span>
            </div>

            <div>
              <strong>{subjectTests.length}</strong>
              <span>Tests</span>
            </div>

            <div>
              <strong>{totalQuestions}</strong>
              <span>Questions</span>
            </div>

            <div>
              <strong>{publishedTests}</strong>
              <span>Published</span>
            </div>
          </div>

          <div className="adminMockQbFlow">
            <span>Subject</span>
            <i />
            <span>Chapter</span>
            <i />
            <span>Questions</span>
          </div>
        </div>
      </div>

      <div className="mockManageStatsGrid">
        <div className="mockManageStatCard">
          <span>Total Chapters</span>
          <strong>{chapters.length}</strong>
          <p>Chapter-wise pools</p>
        </div>

        <div className="mockManageStatCard">
          <span>Total Tests</span>
          <strong>{subjectTests.length}</strong>
          <p>Tests linked to subject</p>
        </div>

        <div className="mockManageStatCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Questions inside tests</p>
        </div>

        <div className="mockManageStatCard">
          <span>Premium Tests</span>
          <strong>{premiumTests}</strong>
          <p>Premium plan coverage</p>
        </div>
      </div>

      <div className="adminMockQbBrowsePanel">
        <div className="adminMockQbBrowseHeader">
          <span>Browse Subject</span>

          <h2>Open Chapter Pools</h2>

          <p>
            Select a chapter to view every question connected with that chapter.
            This keeps the Question Bank navigation clean and exam-builder ready.
          </p>
        </div>

        {chapterCards.length === 0 ? (
          <div className="adminMockQbEmptyBrowse">
            <strong>No chapters found.</strong>
            <p>Add mock tests with questions under this subject first.</p>
          </div>
        ) : (
          <div className="adminMockQbChapterGrid">
            {chapterCards.map((chapter) => (
              <button
                type="button"
                key={chapter.chapterName}
                className="adminMockQbChapterCard"
                onClick={() =>
                  navigate(
                    `/admin/content/mock-tests/question-bank/${encodeURIComponent(
                      activeSubject
                    )}/${encodeURIComponent(chapter.chapterName)}`
                  )
                }
              >
                <span className="adminMockQbChapterIcon" aria-hidden="true">
                  📖
                </span>

                <span className="adminMockQbChapterBody">
                  <strong>{chapter.chapterName}</strong>

                  <small>
                    {chapter.questionCount} Questions • {chapter.testCount} Tests
                    • {chapter.publishedCount} Published
                  </small>
                </span>

                <span className="adminMockQbChapterArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="contentStudioActions adminMockQbBottomActions">
        <button
          type="button"
          className="publishButton"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Examination Test
        </button>

        <button
          type="button"
          className="backButton"
          onClick={() => navigate("/admin/content/mock-tests/question-bank")}
        >
          ← Back to Question Bank
        </button>
      </div>
    </section>
  );
}