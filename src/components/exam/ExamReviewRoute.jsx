import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAttemptStorageKey } from "./examAttemptStorage.js";

export default function ExamReviewRoute({
  universalContent,
  getMockTestAccessStatus,
  mockAttemptAnswers,
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeResultAttemptId = decodeURIComponent(testId || "");

  const test = universalContent.find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeResultAttemptId
  );

  const accessStatus = getMockTestAccessStatus(test);

  if (accessStatus === "NOT_FOUND") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Review not found</h3>
          <p>This review is not available anymore.</p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "UNPUBLISHED") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Review unavailable</h3>
          <p>This mock test is not published.</p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "LOGIN_REQUIRED") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Login required</h3>
          <p>Please login to view review.</p>
          <button
            className="btnLink"
            onClick={() => navigate("/login")}
          >
            Login to Continue
          </button>
        </div>
      </section>
    );
  }

  if (
    accessStatus === "PLAN_LOCKED" ||
    accessStatus === "EXPIRED_MEMBERSHIP"
  ) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Plan required</h3>
          <p>
            This review needs {test.planType || "PREMIUM"} access.
          </p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/pricing")}
          >
            View Pricing
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "UPCOMING") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Test upcoming</h3>

          <p>
            This mock test is scheduled for a future date or time.
          </p>

          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "EXPIRED") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Test expired</h3>

          <p>This mock test window is closed.</p>

          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  const storedAttemptState = JSON.parse(
    localStorage.getItem(getAttemptStorageKey(test.id)) || "{}"
  );

  if (!storedAttemptState?.isSubmitted) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Review locked</h3>

          <p>
            Please submit the mock test before viewing solutions.
          </p>

          <button
            className="btnLink"
            onClick={() =>
              navigate(`/ctet-tet/mock-tests/attempt/${test.id}`)
            }
          >
            Continue Test
          </button>
        </div>
      </section>
    );
  }

  const storedLegacyAnswers = JSON.parse(
    localStorage.getItem(`mockAttemptAnswers_${test.id}`) || "{}"
  );

  const storedNewAnswers = storedAttemptState?.answers || {};

  const liveAttemptAnswers = mockAttemptAnswers?.[test.id] || {};

  const attemptAnswers =
    Object.keys(liveAttemptAnswers).length > 0
      ? liveAttemptAnswers
      : Object.keys(storedNewAnswers).length > 0
      ? storedNewAnswers
      : storedLegacyAnswers;

  const questions = test.questions || [];

  const questionOrder =
    storedAttemptState?.questionOrder?.length
      ? storedAttemptState.questionOrder
      : questions.map((_, index) => index);

  const reviewQuestions = questionOrder
    .map((actualQuestionIndex) => questions[actualQuestionIndex])
    .filter(Boolean);

  const correctCount = reviewQuestions.filter(
    (question, index) => {
      const actualQuestionIndex = questionOrder[index];

      return (
        attemptAnswers[actualQuestionIndex] &&
        attemptAnswers[actualQuestionIndex] === question.answer
      );
    }
  ).length;

  const skippedCount = reviewQuestions.filter((_, index) => {
    const actualQuestionIndex = questionOrder[index];

    return !attemptAnswers[actualQuestionIndex];
  }).length;

  const wrongCount =
    reviewQuestions.length - correctCount - skippedCount;

  const getOptionLabel = (answerKey = "") => {
    const optionMap = {
      option1: "A",
      option2: "B",
      option3: "C",
      option4: "D",
    };

    return optionMap[answerKey] || answerKey || "—";
  };

  const getOptionText = (question, answerKey) => {
    if (!answerKey) return "Not Attempted";

    return question?.[answerKey] || answerKey || "Not Attempted";
  };

  return (
    <section className="notesSubjectRoutePage">
      <div key={test.id}>
        <button
          className="btnLink"
          onClick={() => navigate(-1)}
        >
          ← Back to Result
        </button>

        <span className="notesSubjectRouteBadge">
          ANSWER REVIEW
        </span>

        <h1>{test.title}</h1>

        <p>
          Review your answers, correct answers, and explanations.
        </p>

        <div className="reviewSummaryGrid">
          <div>
            <strong>{questions.length}</strong>
            <span>Total</span>
          </div>

          <div>
            <strong>{correctCount}</strong>
            <span>Correct</span>
          </div>

          <div>
            <strong>{wrongCount}</strong>
            <span>Wrong</span>
          </div>

          <div>
            <strong>{skippedCount}</strong>
            <span>Skipped</span>
          </div>
        </div>

        <div className="reviewQuestionPalette">
          {reviewQuestions.map((question, index) => {
            const actualQuestionIndex = questionOrder[index];
            const userAnswer = attemptAnswers[actualQuestionIndex];

            const isCorrect =
              userAnswer && userAnswer === question.answer;

            const isSkipped = !userAnswer;

            return (
              <a
                key={index}
                href={`#review-q-${index + 1}`}
                className={`reviewPaletteDot ${
                  isSkipped
                    ? "isSkipped"
                    : isCorrect
                    ? "isCorrect"
                    : "isWrong"
                }`}
              >
                {index + 1}
              </a>
            );
          })}
        </div>

        <div className="reviewAnswerGrid">
          {reviewQuestions.map((question, index) => {
            const actualQuestionIndex = questionOrder[index];
            const userAnswer = attemptAnswers[actualQuestionIndex];

            const isCorrect =
              userAnswer && userAnswer === question.answer;

            const isSkipped = !userAnswer;

            return (
              <details
                id={`review-q-${index + 1}`}
                className={`reviewAnswerCard ${
                  isSkipped
                    ? "isSkipped"
                    : isCorrect
                    ? "isCorrect"
                    : "isWrong"
                }`}
                key={index}
              >
                <summary>
                  <div className="reviewQuestionTop">
                    <span className="reviewQuestionNo">
                      Q{index + 1}
                    </span>

                    <span className="reviewStatusPill">
                      {isSkipped
                        ? "Skipped"
                        : isCorrect
                        ? "Correct"
                        : "Wrong"}
                    </span>
                  </div>

                  <div className="reviewAnswerLine">
                    <span>
                      Your:{" "}
                      <strong>
                        {isSkipped
                          ? "—"
                          : getOptionLabel(userAnswer)}
                      </strong>
                    </span>

                    <span>
                      Correct:{" "}
                      <strong>
                        {getOptionLabel(question.answer)}
                      </strong>
                    </span>
                  </div>
                </summary>

                <div className="reviewQuestionBody">
                  <p className="reviewQuestionText">
                    {question.question}
                  </p>

                  <div className="reviewOptionsList">
                    {["option1", "option2", "option3", "option4"].map(
                      (optionKey) => (
                        <div
                          key={optionKey}
                          className={`reviewOptionItem ${
                            question.answer === optionKey
                              ? "correctOption"
                              : userAnswer === optionKey
                              ? "selectedOption"
                              : ""
                          }`}
                        >
                          <strong>{getOptionLabel(optionKey)}.</strong>{" "}
                          {question[optionKey]}
                        </div>
                      )
                    )}
                  </div>

                  <div className="reviewAnswerDetails">
                    <p>
                      Your Answer:{" "}
                      <strong>
                        {getOptionText(question, userAnswer)}
                      </strong>
                    </p>

                    <p>
                      Correct Answer:{" "}
                      <strong>
                        {getOptionText(question, question.answer)}
                      </strong>
                    </p>
                  </div>

                  {question.explanation && (
                    <div className="reviewExplanation">
                      <strong>Explanation:</strong>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>

        <button
          className="btnLink"
          onClick={() =>
            navigate("/ctet-tet/mock-tests/history")
          }
        >
          My Attempts History
        </button>
      </div>
    </section>
  );
}