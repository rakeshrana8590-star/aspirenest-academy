import { useParams } from "react-router-dom";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./mockTestFormUtils.js";

const getCorrectAnswerLabel = (questionItem) => {
  if (questionItem.answer === "option1") {
    return `A. ${questionItem.option1 || "-"}`;
  }

  if (questionItem.answer === "option2") {
    return `B. ${questionItem.option2 || "-"}`;
  }

  if (questionItem.answer === "option3") {
    return `C. ${questionItem.option3 || "-"}`;
  }

  if (questionItem.answer === "option4") {
    return `D. ${questionItem.option4 || "-"}`;
  }

  return questionItem.answer || "Not set";
};

const getQuestionStatusLabel = (status) => {
  if (status === "published") return "Published";
  if (status === "draft") return "Draft";
  if (status === "unpublished") return "Unpublished";
  return status || "Draft";
};

const getStatusClass = (status) => {
  if (status === "published") return "isPublished";
  if (status === "unpublished") return "isUnpublished";
  if (status === "archived") return "isArchived";
  return "isDraft";
};

export default function AdminMockTestPreviewRoute({
  universalContent = [],
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  navigate,
}) {
  const { testId } = useParams();

  const safeContent = Array.isArray(universalContent) ? universalContent : [];

  const previewTest = safeContent.find(
    (item) => item.id === testId && item.section === "mockTest"
  );

  if (!previewTest) {
    return (
      <section className="coursePages adminMockPreviewPage">
        <div className="adminMockPreviewCommandHero">
          <div className="adminMockPreviewHeroCopy">
            <span className="badge">MOCK TEST PREVIEW</span>

            <h1>Test Not Found</h1>

            <p>This mock test may have been deleted or not loaded yet.</p>

            <div className="adminMockPreviewHeroActions">
              <button
                type="button"
                className="adminMockPreviewGhostBtn"
                onClick={() => navigate("/admin/content/mock-tests/manage")}
              >
                ← Back to Manage Mock Tests
              </button>
            </div>
          </div>

          <div className="adminMockPreviewSystemCard">
            <div className="adminMockPreviewSystemTop">
              <span>PREVIEW STATUS</span>
              <strong>Missing</strong>
            </div>

            <div className="adminMockPreviewSystemGrid">
              <div>
                <strong>0</strong>
                <span>Questions</span>
              </div>

              <div>
                <strong>0</strong>
                <span>Total marks</span>
              </div>

              <div>
                <strong>0</strong>
                <span>Duration</span>
              </div>

              <div>
                <strong>Safe</strong>
                <span>No test loaded</span>
              </div>
            </div>
          </div>
        </div>

        <div className="adminMockPreviewEmpty">
          <strong>No preview available</strong>
          <p>Go back to Manage Mock Tests and open a valid test preview.</p>

          <button
            type="button"
            className="adminMockPreviewGhostBtn"
            onClick={() => navigate("/admin/content/mock-tests/manage")}
          >
            ← Back to Manage Mock Tests
          </button>
        </div>
      </section>
    );
  }

  const safeQuestions =
    previewTest.questions?.length > 0
      ? previewTest.questions.map((question) => ({
          question: question.question || "",
          option1: question.option1 || "",
          option2: question.option2 || "",
          option3: question.option3 || "",
          option4: question.option4 || "",
          answer: question.answer || "",
          explanation: question.explanation || "",
          level: question.level || "Easy",
          questionType: question.questionType || "Single Correct",
          language: question.language || "English",
          tag: question.tag || "",
          positiveMarks: question.positiveMarks?.toString() || "1",
          negativeMarks: question.negativeMarks?.toString() || "0",
          questionStatus: question.questionStatus || "published",
          saveToQuestionBank: question.saveToQuestionBank || "yes",
        }))
      : [
          {
            question: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            answer: "",
            explanation: "",
            level: "Easy",
            questionType: "Single Correct",
            language: "English",
            tag: "",
            positiveMarks: "1",
            negativeMarks: "0",
            questionStatus: "draft",
            saveToQuestionBank: "yes",
          },
        ];

  const durationMinutes =
    previewTest.duration || previewTest.durationMinutes || "0";

  const totalQuestions = safeQuestions.length;

  const publishedQuestions = safeQuestions.filter(
    (questionItem) => questionItem.questionStatus === "published"
  ).length;

  const savedToBank = safeQuestions.filter(
    (questionItem) => questionItem.saveToQuestionBank === "yes"
  ).length;

  const totalMarks = safeQuestions.reduce((sum, questionItem) => {
    const marks = Number(questionItem.positiveMarks || 0);
    return sum + (Number.isNaN(marks) ? 0 : marks);
  }, 0);

  const negativeMarksCount = safeQuestions.filter((questionItem) => {
    const marks = Number(questionItem.negativeMarks || 0);
    return !Number.isNaN(marks) && marks > 0;
  }).length;

  const missingAnswerCount = safeQuestions.filter(
    (questionItem) => !questionItem.answer
  ).length;

  const handleEditTest = () => {
    setEditingMockTestId(previewTest.id);
    setMockTestForm(buildMockTestFormFromTest(previewTest));
    setMockTestQuestionsForm(buildMockTestQuestionsFormFromTest(previewTest));
    navigate("/admin/content/mock-tests/add");
  };

  const testStatus = previewTest.status || "draft";

  return (
    <section className="coursePages adminMockPreviewPage">
      <div className="adminMockPreviewCommandHero">
        <div className="adminMockPreviewHeroCopy">
          <span className="badge">MOCK TEST PREVIEW</span>

          <h1>{previewTest.title || "Untitled Mock Test"}</h1>

          <p>
            Preview the complete exam configuration, student-visible question
            paper, correct answers, marks, security readiness, and question bank
            mapping before publishing.
          </p>

          <div className="adminMockPreviewHeroActions">
            <button
              type="button"
              className="adminMockPreviewPrimaryBtn"
              onClick={handleEditTest}
            >
              Edit Test
            </button>

            <button
              type="button"
              className="adminMockPreviewGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              ← Back to Manage
            </button>
          </div>
        </div>

        <div className="adminMockPreviewSystemCard">
          <div className="adminMockPreviewSystemTop">
            <span>PREVIEW STATUS</span>
            <strong className={getStatusClass(testStatus)}>{testStatus}</strong>
          </div>

          <div className="adminMockPreviewSystemGrid">
            <div>
              <strong>{totalQuestions}</strong>
              <span>Total questions</span>
            </div>

            <div>
              <strong>{totalMarks}</strong>
              <span>Total marks</span>
            </div>

            <div>
              <strong>{durationMinutes}</strong>
              <span>Minutes</span>
            </div>

            <div>
              <strong>{missingAnswerCount}</strong>
              <span>Missing answers</span>
            </div>
          </div>

          <div className="adminMockPreviewFlow">
            <span>Config</span>
            <i />
            <span>Questions</span>
            <i />
            <span>Publish</span>
          </div>
        </div>
      </div>

      <div className="adminMockPreviewMetaHero">
        <div>
          <span>Plan Shelf</span>
          <strong>{previewTest.planType || "FREE"}</strong>
        </div>

        <div>
          <span>Subject</span>
          <strong>{previewTest.subject || "No Subject"}</strong>
        </div>

        <div>
          <span>Chapter</span>
          <strong>{previewTest.chapter || "No Chapter"}</strong>
        </div>

        <div>
          <span>Test Type</span>
          <strong>{previewTest.testType || "Mock Test"}</strong>
        </div>
      </div>

      <div className="adminMockPreviewStatsGrid">
        <div className="adminMockPreviewStatCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Preview-ready question set</p>
        </div>

        <div className="adminMockPreviewStatCard">
          <span>Total Marks</span>
          <strong>{totalMarks}</strong>
          <p>Based on positive marks</p>
        </div>

        <div className="adminMockPreviewStatCard">
          <span>Live Questions</span>
          <strong>{publishedQuestions}</strong>
          <p>Questions ready for student side</p>
        </div>

        <div className="adminMockPreviewStatCard">
          <span>Saved To Bank</span>
          <strong>{savedToBank}</strong>
          <p>Question bank mapped items</p>
        </div>
      </div>

      <div className="adminMockPreviewMetaPanel">
        <div>
          <span>Exam Type</span>
          <strong>{previewTest.examType || "Not set"}</strong>
        </div>

        <div>
          <span>Difficulty</span>
          <strong>{previewTest.examDifficulty || "Not set"}</strong>
        </div>

        <div>
          <span>Language</span>
          <strong>{previewTest.examLanguage || "Not set"}</strong>
        </div>

        <div>
          <span>Test Status</span>
          <strong className={getStatusClass(testStatus)}>{testStatus}</strong>
        </div>

        <div>
          <span>Negative Marking</span>
          <strong>{negativeMarksCount}</strong>
        </div>

        <div>
          <span>Duration</span>
          <strong>{durationMinutes} min</strong>
        </div>
      </div>

      {missingAnswerCount > 0 && (
        <div className="adminMockPreviewWarning">
          <strong>{missingAnswerCount} question needs attention.</strong>
          <span>Correct answer is missing in one or more questions.</span>
        </div>
      )}

      <div className="adminMockPreviewPaperHeader">
        <div>
          <span>QUESTION PAPER PREVIEW</span>
          <h2>Student-visible Paper</h2>
        </div>

        <small>{totalQuestions} questions</small>
      </div>

      <div className="adminMockPreviewQuestionList">
        {safeQuestions.map((questionItem, index) => (
          <article className="adminMockPreviewQuestionCard" key={index}>
            <div className="adminMockPreviewQuestionTop">
              <div>
                <span>Question {index + 1}</span>
                <h2>{questionItem.question || "Question text not added."}</h2>
              </div>

              <div className="adminMockPreviewQuestionBadges">
                <small>{questionItem.level}</small>
                <small>{questionItem.questionType}</small>
                <small>{getQuestionStatusLabel(questionItem.questionStatus)}</small>
              </div>
            </div>

            <div className="adminMockPreviewOptionGrid">
              <div>
                <span>A</span>
                <p>{questionItem.option1 || "-"}</p>
              </div>

              <div>
                <span>B</span>
                <p>{questionItem.option2 || "-"}</p>
              </div>

              <div>
                <span>C</span>
                <p>{questionItem.option3 || "-"}</p>
              </div>

              <div>
                <span>D</span>
                <p>{questionItem.option4 || "-"}</p>
              </div>
            </div>

            <div className="adminMockPreviewAnswerBox">
              <div>
                <span>Correct Answer</span>
                <strong>{getCorrectAnswerLabel(questionItem)}</strong>
              </div>

              <div>
                <span>Marks</span>
                <strong>
                  +{questionItem.positiveMarks || "0"} / -
                  {questionItem.negativeMarks || "0"}
                </strong>
              </div>

              <div>
                <span>Question Bank</span>
                <strong>
                  {questionItem.saveToQuestionBank === "yes" ? "Saved" : "No"}
                </strong>
              </div>
            </div>

            <div className="adminMockPreviewExplanation">
              <span>Explanation</span>
              <p>{questionItem.explanation || "No explanation added."}</p>
            </div>

            <div className="adminMockPreviewQuestionFoot">
              <span>{questionItem.language}</span>
              <span>{questionItem.tag || "No Tag"}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="adminMockPreviewBottomActions">
        <button
          type="button"
          className="adminMockPreviewPrimaryBtn"
          onClick={handleEditTest}
        >
          Edit Test
        </button>

        <button
          type="button"
          className="adminMockPreviewGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          ← Back to Manage
        </button>
      </div>
    </section>
  );
}