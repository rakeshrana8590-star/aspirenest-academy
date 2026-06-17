import { useParams } from "react-router-dom";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./mockTestFormUtils.js";

export default function AdminMockTestPreviewRoute({
  universalContent,
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  navigate,
}) {
  const { testId } = useParams();

  const previewTest = universalContent.find(
    (item) => item.id === testId && item.section === "mockTest"
  );

  if (!previewTest) {
    return (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">MOCK TEST PREVIEW</span>

          <h1>Test Not Found</h1>

          <p>This mock test may have been deleted or not loaded yet.</p>
        </div>

        <button
          className="backButton"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          ← Back to Manage Mock Tests
        </button>
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
            questionStatus: "published",
            saveToQuestionBank: "yes",
          },
        ];

  const handleEditTest = () => {
    setEditingMockTestId(previewTest.id);
    setMockTestForm(buildMockTestFormFromTest(previewTest));
    setMockTestQuestionsForm(buildMockTestQuestionsFormFromTest(previewTest));
    navigate("/admin/content/mock-tests/add");
  };

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">MOCK TEST PREVIEW</span>

        <h1>{previewTest.title}</h1>

        <p>
          {previewTest.planType} • {previewTest.subject} • {previewTest.chapter} •{" "}
          {previewTest.testType} • {previewTest.duration || previewTest.durationMinutes} min
        </p>
      </div>

      <div className="contentStudioList">
        {safeQuestions.map((questionItem, index) => (
          <div className="contentStudioItem" key={index}>
            <strong>
              Q{index + 1}. {questionItem.question}
            </strong>

            <p>A. {questionItem.option1}</p>
            <p>B. {questionItem.option2}</p>
            <p>C. {questionItem.option3}</p>
            <p>D. {questionItem.option4}</p>

            <p>
              <strong>Correct:</strong>{" "}
              {questionItem.answer === "option1"
                ? `A. ${questionItem.option1 || "-"}`
                : questionItem.answer === "option2"
                ? `B. ${questionItem.option2 || "-"}`
                : questionItem.answer === "option3"
                ? `C. ${questionItem.option3 || "-"}`
                : questionItem.answer === "option4"
                ? `D. ${questionItem.option4 || "-"}`
                : questionItem.answer || "Not set"}
            </p>

            <p>
              <strong>Explanation:</strong>{" "}
              {questionItem.explanation || "No explanation added."}
            </p>

            <p>
              {questionItem.level} • {questionItem.questionType} •{" "}
              {questionItem.language} • {questionItem.tag || "No Tag"}
            </p>
          </div>
        ))}
      </div>

      <div className="contentStudioActions">
        <button className="publishButton" onClick={handleEditTest}>
          Edit Test
        </button>

        <button
          className="backButton"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          ← Back to Manage
        </button>
      </div>
    </section>
  );
}
