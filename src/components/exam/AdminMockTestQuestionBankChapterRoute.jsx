import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestQuestionBankChapterRoute({
  universalContent,
  navigate,
}) {
  const { subjectName, chapterName } = useParams();

  const activeSubject = decodeURIComponent(subjectName || "");
  const activeChapter = decodeURIComponent(chapterName || "");

  const normalize = (value = "") => value.toString().trim().toLowerCase();

  const chapterTests = universalContent.filter(
    (item) =>
      item.section === "mockTest" &&
      normalize(item.subject) === normalize(activeSubject) &&
      normalize(item.chapter) === normalize(activeChapter)
  );

  const questions = chapterTests.flatMap((test) =>
    (test.questions || []).map((question, index) => ({
      ...question,
      testId: test.id,
      testTitle: test.title,
      planType: test.planType,
      testStatus: test.status,
      questionNumber: index + 1,
    }))
  );

  const publishedTests = chapterTests.filter(
    (test) => test.status === "published"
  ).length;

  const easyQuestions = questions.filter(
    (question) => question.level === "Easy"
  ).length;

  const mediumQuestions = questions.filter(
    (question) => question.level === "Medium"
  ).length;

  const hardQuestions = questions.filter(
    (question) => question.level === "Hard"
  ).length;

  const getAnswerLabel = (question) => {
    if (question.answer === "option1") {
      return `A. ${question.option1 || "-"}`;
    }

    if (question.answer === "option2") {
      return `B. ${question.option2 || "-"}`;
    }

    if (question.answer === "option3") {
      return `C. ${question.option3 || "-"}`;
    }

    if (question.answer === "option4") {
      return `D. ${question.option4 || "-"}`;
    }

    return question.answer || "Not set";
  };

  return (
    <section className="coursePages adminMockQuestionBankPage adminMockQuestionBankChapterPage">
      <div className="adminMockQbHero">
        <div className="adminMockQbHeroCopy">
          <span className="badge">QUESTION BANK CHAPTER</span>

          <h1>{activeChapter}</h1>

          <p>
            {activeSubject} chapter question pool — review options, correct
            answers, explanations, difficulty, plan, and source test in one
            premium chapter workspace.
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
                navigate(
                  `/admin/content/mock-tests/question-bank/${encodeURIComponent(
                    activeSubject
                  )}`
                )
              }
            >
              ← Back to Subject
            </button>
          </div>
        </div>

        <div className="adminMockQbSystemCard">
          <div className="adminMockQbSystemTop">
            <span>CHAPTER STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockQbSystemGrid">
            <div>
              <strong>{questions.length}</strong>
              <span>Questions</span>
            </div>

            <div>
              <strong>{chapterTests.length}</strong>
              <span>Tests</span>
            </div>

            <div>
              <strong>{publishedTests}</strong>
              <span>Published</span>
            </div>

            <div>
              <strong>{easyQuestions}</strong>
              <span>Easy level</span>
            </div>
          </div>

          <div className="adminMockQbFlow">
            <span>Chapter</span>
            <i />
            <span>Question</span>
            <i />
            <span>Answer</span>
          </div>
        </div>
      </div>

      <div className="mockManageStatsGrid">
        <div className="mockManageStatCard">
          <span>Total Questions</span>
          <strong>{questions.length}</strong>
          <p>Inside this chapter</p>
        </div>

        <div className="mockManageStatCard">
          <span>Easy</span>
          <strong>{easyQuestions}</strong>
          <p>Foundation level</p>
        </div>

        <div className="mockManageStatCard">
          <span>Medium</span>
          <strong>{mediumQuestions}</strong>
          <p>Practice level</p>
        </div>

        <div className="mockManageStatCard">
          <span>Hard</span>
          <strong>{hardQuestions}</strong>
          <p>Advanced level</p>
        </div>
      </div>

      <div className="adminMockQbBrowsePanel">
        <div className="adminMockQbBrowseHeader">
          <span>Chapter Question Pool</span>

          <h2>Questions in {activeChapter}</h2>

          <p>
            Every question is shown with options, correct answer, explanation,
            and exam metadata so admin can review the pool without opening the
            student exam flow.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="adminMockQbEmptyBrowse">
            <strong>No questions found.</strong>
            <p>Add questions under this chapter first.</p>
          </div>
        ) : (
          <div className="adminMockQbChapterQuestionGrid">
            {questions.map((question, index) => (
              <article
                className="adminMockQbChapterQuestionCard"
                key={`${question.testTitle}-${index}`}
              >
                <div className="adminMockQbChapterQuestionTop">
                  <div>
                    <span>Question {index + 1}</span>

                    <h2>{question.question || "Question text not added."}</h2>
                  </div>

                  <div className="adminMockQbChapterBadges">
                    <small>{question.level || "Easy"}</small>
                    <small>{question.questionType || "Single Correct"}</small>
                    <small>{question.language || "English"}</small>
                  </div>
                </div>

                <div className="adminMockQbChapterOptionGrid">
                  <div>
                    <span>A</span>
                    <p>{question.option1 || "-"}</p>
                  </div>

                  <div>
                    <span>B</span>
                    <p>{question.option2 || "-"}</p>
                  </div>

                  <div>
                    <span>C</span>
                    <p>{question.option3 || "-"}</p>
                  </div>

                  <div>
                    <span>D</span>
                    <p>{question.option4 || "-"}</p>
                  </div>
                </div>

                <div className="adminMockQbChapterAnswerGrid">
                  <div>
                    <span>Correct Answer</span>
                    <strong>{getAnswerLabel(question)}</strong>
                  </div>

                  <div>
                    <span>Marks</span>
                    <strong>
                      +{question.positiveMarks || "1"} / -
                      {question.negativeMarks || "0"}
                    </strong>
                  </div>

                  <div>
                    <span>Source Test</span>
                    <strong>{question.testTitle || "Mock Test"}</strong>
                  </div>
                </div>

                <div className="adminMockQbChapterExplanation">
                  <span>Explanation</span>

                  <p>{question.explanation || "No explanation added."}</p>
                </div>

                <div className="adminMockQbChapterMeta">
                  <span>{question.planType || "FREE"}</span>
                  <span>{question.testStatus || "draft"}</span>
                  <span>{question.tag || "No Tag"}</span>
                </div>
              </article>
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
          onClick={() =>
            navigate(
              `/admin/content/mock-tests/question-bank/${encodeURIComponent(
                activeSubject
              )}`
            )
          }
        >
          ← Back to {activeSubject}
        </button>
      </div>
    </section>
  );
}