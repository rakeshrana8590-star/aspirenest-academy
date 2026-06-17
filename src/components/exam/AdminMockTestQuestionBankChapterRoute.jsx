import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestQuestionBankChapterRoute({
  universalContent,
  navigate,
}) {
  const { subjectName, chapterName } = useParams();
  const activeSubject = decodeURIComponent(subjectName || "");
  const activeChapter = decodeURIComponent(chapterName || "");

  const normalize = (value = "") =>
    value.toString().trim().toLowerCase();

  const mockTests = universalContent.filter(
    (item) =>
      item.section === "mockTest" &&
      normalize(item.subject) === normalize(activeSubject) &&
      normalize(item.chapter) === normalize(activeChapter)
  );

  const questions = mockTests.flatMap((test) =>
    (test.questions || []).map((question, index) => ({
      ...question,
      testTitle: test.title,
      planType: test.planType,
      questionNumber: index + 1,
    }))
  );

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
      <div className="sectionHeader">
        <span className="badge">QUESTION BANK CHAPTER</span>

        <h1>{activeChapter}</h1>

        <p>
          {activeSubject} • {questions.length} Questions
        </p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
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

          <button
            className="publishButton"
            onClick={() => navigate("/admin/content/mock-tests/add")}
          >
            + Add Mock Test
          </button>
        </div>
      </div>

      <div className="contentStudioList">
        <h3>Questions in {activeChapter}</h3>

        {questions.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No questions found.</strong>
            <p>Add questions under this chapter first.</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div className="contentStudioItem" key={`${question.testTitle}-${index}`}>
              <strong>
                Q{index + 1}. {question.question}
              </strong>

              <p>A. {question.option1}</p>
              <p>B. {question.option2}</p>
              <p>C. {question.option3}</p>
              <p>D. {question.option4}</p>

              <p>
                <strong>Correct:</strong> {getAnswerLabel(question)}
              </p>

              <p>
                <strong>Explanation:</strong>{" "}
                {question.explanation || "No explanation added."}
              </p>

              <p>
                {question.planType || "FREE"} • {question.level || "Easy"} •{" "}
                {question.questionType || "Single Correct"} •{" "}
                {question.language || "English"} • {question.testTitle}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
