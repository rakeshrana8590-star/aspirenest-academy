import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { MOCK_TEST_ACTIONS } from "../../access/mockTestActionPolicy";
import {
  MOCK_TEST_RESULT_REVIEW_STATES,
  buildMockTestResultReviewRuntime,
} from "../../access/mockTestResultReviewRuntime";
import {
  getAttemptAnswerStorageKey,
  getAttemptStorageKey,
} from "./examAttemptStorage.js";
import {
  isExamAnswerCorrect,
  normalizeExamAnswerKey,
} from "./examAnswerUtils.js";

const safeParseJson = (value, fallback = {}) => {
  try {
    return JSON.parse(value || "{}") || fallback;
  } catch {
    return fallback;
  }
};

const hasObjectData = (value) =>
  value && typeof value === "object" && Object.keys(value).length > 0;

const getResultTimestamp = (value) => {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date?.getTime?.()) ? 0 : date.getTime();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export default function ExamReviewRoute({
  universalContent,
  mockAttemptAnswers,
  mockAttemptState,
  user,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
  mockResults = [],
  mockResultsLoaded = false,
  mockResultsLoadError = "",
  loadUserMockResults,
}) {
  const navigate = useNavigate();
  const { testId } = useParams();
  const activeResultAttemptId = decodeURIComponent(testId || "");

  const test = (Array.isArray(universalContent)
    ? universalContent
    : []
  ).find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeResultAttemptId
  );

  const hasLoadedMockTestCatalog = React.useMemo(
    () =>
      (Array.isArray(universalContent)
        ? universalContent
        : []
      ).some((item) => item?.section === "mockTest"),
    [universalContent]
  );
  const [catalogWaitExpired, setCatalogWaitExpired] =
    React.useState(false);
  const [resultRecoveryRetry, setResultRecoveryRetry] =
    React.useState(0);
  const loadUserMockResultsRef = React.useRef(
    loadUserMockResults
  );

  React.useEffect(() => {
    loadUserMockResultsRef.current = loadUserMockResults;
  }, [loadUserMockResults]);

  React.useEffect(() => {
    setCatalogWaitExpired(false);

    if (test || hasLoadedMockTestCatalog) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCatalogWaitExpired(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [activeResultAttemptId, hasLoadedMockTestCatalog, test]);

  const savedResultForTest = React.useMemo(() => {
    const expectedTestId = String(test?.id || "");
    const expectedUid = String(user?.uid || "").trim();
    const expectedEmail = String(user?.email || "")
      .trim()
      .toLowerCase();

    if (!expectedTestId || (!expectedUid && !expectedEmail)) {
      return null;
    }

    return [...(Array.isArray(mockResults) ? mockResults : [])]
      .filter((item) => {
        const itemTestId = String(
          item?.testId ||
            item?.mockTestId ||
            item?.testID ||
            item?.contentId ||
            ""
        );
        const itemUid = String(
          item?.ownerUid ||
            item?.uid ||
            item?.userId ||
            item?.studentId ||
            ""
        ).trim();
        const itemEmail = String(
          item?.ownerEmail ||
            item?.email ||
            item?.studentEmail ||
            item?.userEmail ||
            ""
        )
          .trim()
          .toLowerCase();
        const hasOwnerIdentity = Boolean(itemUid || itemEmail);
        const uidMatches = itemUid
          ? Boolean(expectedUid) && itemUid === expectedUid
          : true;
        const emailMatches = itemEmail
          ? Boolean(expectedEmail) && itemEmail === expectedEmail
          : true;

        return (
          itemTestId === expectedTestId &&
          hasOwnerIdentity &&
          uidMatches &&
          emailMatches
        );
      })
      .sort(
        (first, second) =>
          getResultTimestamp(
            second?.attemptSubmittedAt ||
              second?.endedAt ||
              second?.updatedAt ||
              second?.createdAt
          ) -
          getResultTimestamp(
            first?.attemptSubmittedAt ||
              first?.endedAt ||
              first?.updatedAt ||
              first?.createdAt
          )
      )[0] || null;
  }, [mockResults, test?.id, user?.email, user?.uid]);

  React.useEffect(() => {
    const email = user?.email;
    const activeTestId = test?.id;
    const loader = loadUserMockResultsRef.current;

    if (!email || !activeTestId || typeof loader !== "function") {
      return undefined;
    }

    let isActive = true;

    Promise.resolve(loader(email)).catch((error) => {
      if (isActive) {
        console.error("Review recovery request failed:", error);
      }
    });

    return () => {
      isActive = false;
    };
  }, [resultRecoveryRetry, test?.id, user?.email]);

  const renderStateCard = ({
    title,
    message,
    actionLabel,
    onAction,
  }) => (
    <section className="notesSubjectRoutePage">
      <div className="pdfMiniCard">
        <h3>{title}</h3>
        <p>{message}</p>
        {actionLabel && typeof onAction === "function" ? (
          <button className="btnLink" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );

  const isCatalogPending =
    !test && !hasLoadedMockTestCatalog && !catalogWaitExpired;

  if (isCatalogPending) {
    return renderStateCard({
      title: "Preparing answer review",
      message:
        "Mock-test details and your owned result are being securely restored.",
      actionLabel: "",
      onAction: undefined,
    });
  }

  if (!test) {
    return renderStateCard({
      title: "Review not found",
      message: "This review is not available anymore.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  const liveAttemptState = mockAttemptState?.[test.id] || {};
  const storedAttemptState = safeParseJson(
    localStorage.getItem(getAttemptStorageKey(test.id, user))
  );
  const activeAttemptState = liveAttemptState?.isSubmitted
    ? liveAttemptState
    : storedAttemptState?.isSubmitted
    ? storedAttemptState
    : {};
  const hasSubmittedAttempt =
    activeAttemptState?.isSubmitted === true;
  const resultEvidence = hasSubmittedAttempt
    ? activeAttemptState
    : savedResultForTest;
  const reviewAuthorization =
    buildMockTestResultReviewRuntime({
      action: MOCK_TEST_ACTIONS.REVIEW,
      test,
      user,
      role,
      isAdminUser,
      accessProfile,
      planCatalog,
      result: resultEvidence,
      dataLoading: Boolean(
        !hasSubmittedAttempt &&
          user?.email &&
          !mockResultsLoaded
      ),
      dataError:
        !hasSubmittedAttempt &&
        mockResultsLoaded &&
        !savedResultForTest
          ? mockResultsLoadError
          : "",
    });

  if (!reviewAuthorization.canExposeAnswers) {
    if (
      reviewAuthorization.state ===
      MOCK_TEST_RESULT_REVIEW_STATES.UNPUBLISHED
    ) {
      return renderStateCard({
        title: "Review unavailable",
        message: "This mock test is not published right now.",
        actionLabel: "Back to Mock Tests",
        onAction: () => navigate("/ctet-tet/mock-tests"),
      });
    }

    if (
      reviewAuthorization.state ===
      MOCK_TEST_RESULT_REVIEW_STATES.LOGIN_REQUIRED
    ) {
      return renderStateCard({
        title: "Login required",
        message: "Please login to view answer review.",
        actionLabel: "Login to Continue",
        onAction: () => navigate("/login"),
      });
    }

    if (
      reviewAuthorization.state ===
      MOCK_TEST_RESULT_REVIEW_STATES.LOCKED
    ) {
      return renderStateCard({
        title: "Review access required",
        message:
          "Your current access does not include this mock-test review.",
        actionLabel: "View My Access",
        onAction: () => navigate("/ctet-tet/my-access"),
      });
    }

    if (
      reviewAuthorization.state ===
      MOCK_TEST_RESULT_REVIEW_STATES.LOADING
    ) {
      return renderStateCard({
        title: "Preparing answer review",
        message:
          "Your owned submitted result is being securely restored.",
        actionLabel: "",
        onAction: undefined,
      });
    }

    if (
      reviewAuthorization.state ===
      MOCK_TEST_RESULT_REVIEW_STATES.ERROR
    ) {
      return renderStateCard({
        title: "Review could not be verified",
        message:
          reviewAuthorization.dataError ||
          "Review authorization is temporarily unavailable. Correct answers remain protected.",
        actionLabel: mockResultsLoadError
          ? "Retry Review"
          : "Back to Mock Tests",
        onAction: mockResultsLoadError
          ? () =>
              setResultRecoveryRetry(
                (current) => current + 1
              )
          : () => navigate("/ctet-tet/mock-tests"),
      });
    }

    if (
      reviewAuthorization.state ===
      MOCK_TEST_RESULT_REVIEW_STATES.REVIEW_LOCKED
    ) {
      return renderStateCard({
        title: "Answer review not released",
        message:
          "Your result is available, but correct answers and explanations have not been released for this test.",
        actionLabel: "Back to Result",
        onAction: () =>
          navigate(`/ctet-tet/mock-tests/result/${test.id}`),
      });
    }

    if (
      [
        MOCK_TEST_RESULT_REVIEW_STATES
          .RESULT_OWNERSHIP_DENIED,
        MOCK_TEST_RESULT_REVIEW_STATES.INVALID_RESULT,
      ].includes(reviewAuthorization.state)
    ) {
      return renderStateCard({
        title: "Review unavailable",
        message:
          "This submitted result does not belong to the current account or could not be validated.",
        actionLabel: "Back to Mock Tests",
        onAction: () => navigate("/ctet-tet/mock-tests"),
      });
    }

    return renderStateCard({
      title: "Review locked",
      message:
        "Please submit this mock test before viewing correct answers and explanations.",
      actionLabel: "Continue Test",
      onAction: () =>
        navigate(`/ctet-tet/mock-tests/attempt/${test.id}`),
    });
  }

  const storedLegacyAnswers = safeParseJson(
    localStorage.getItem(getAttemptAnswerStorageKey(test.id, user))
  );

  const liveNewAnswers = liveAttemptState?.answers || {};
  const storedNewAnswers = storedAttemptState?.answers || {};
  const activeNewAnswers = activeAttemptState?.answers || {};
  const liveLegacyAnswers = mockAttemptAnswers?.[test.id] || {};
  const recoveredAnswers = savedResultForTest?.answers || {};

  const attemptAnswers = hasObjectData(activeNewAnswers)
    ? activeNewAnswers
    : hasObjectData(liveNewAnswers)
    ? liveNewAnswers
    : hasObjectData(storedNewAnswers)
    ? storedNewAnswers
    : hasObjectData(recoveredAnswers)
    ? recoveredAnswers
    : hasObjectData(liveLegacyAnswers)
    ? liveLegacyAnswers
    : storedLegacyAnswers;

  if (!hasObjectData(attemptAnswers)) {
    return renderStateCard({
      title: "Answer review unavailable",
      message:
        "Your result is verified, but answer-level review data is not available for this attempt.",
      actionLabel: "Back to Result",
      onAction: () =>
        navigate(`/ctet-tet/mock-tests/result/${test.id}`),
    });
  }

  const questions = test.questions || [];

  const questionOrder =
    activeAttemptState?.questionOrder?.length
      ? activeAttemptState.questionOrder
      : storedAttemptState?.questionOrder?.length
      ? storedAttemptState.questionOrder
      : savedResultForTest?.questionOrder?.length
      ? savedResultForTest.questionOrder
      : questions.map((_, index) => index);

  const reviewQuestions = questionOrder
    .map((actualQuestionIndex) => ({
      actualQuestionIndex,
      question: questions[actualQuestionIndex],
    }))
    .filter((item) => Boolean(item.question));

  const correctCount = reviewQuestions.filter(
    ({ actualQuestionIndex, question }) =>
      isExamAnswerCorrect(
        attemptAnswers[actualQuestionIndex],
        question.answer,
        question
      )
  ).length;

  const skippedCount = reviewQuestions.filter(
    ({ actualQuestionIndex }) => !attemptAnswers[actualQuestionIndex]
  ).length;

  const wrongCount =
    reviewQuestions.length - correctCount - skippedCount;

  const getOptionLabel = (answerKey = "", question = {}) => {
    const normalizedKey = normalizeExamAnswerKey(
      answerKey,
      question
    );

    const optionMap = {
      option1: "A",
      option2: "B",
      option3: "C",
      option4: "D",
    };

    return optionMap[normalizedKey] || normalizedKey || "—";
  };

  const getOptionText = (question, answerKey) => {
    if (!answerKey) return "Not Attempted";

    const normalizedKey = normalizeExamAnswerKey(
      answerKey,
      question
    );

    return (
      question?.[normalizedKey] ||
      answerKey ||
      "Not Attempted"
    );
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
            <strong>{reviewQuestions.length}</strong>
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
          {reviewQuestions.map(
            ({ actualQuestionIndex, question }, index) => {
              const userAnswer = attemptAnswers[actualQuestionIndex];

              const isCorrect =
                isExamAnswerCorrect(userAnswer, question.answer, question);

              const isSkipped = !userAnswer;

              return (
                <a
                  key={`review-dot-${actualQuestionIndex}`}
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
            }
          )}
        </div>

        <div className="reviewAnswerGrid">
          {reviewQuestions.map(
            ({ actualQuestionIndex, question }, index) => {
              const userAnswer = attemptAnswers[actualQuestionIndex];

              const isCorrect =
                isExamAnswerCorrect(userAnswer, question.answer, question);

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
                  key={`review-card-${actualQuestionIndex}`}
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
                            : getOptionLabel(userAnswer, question)}
                        </strong>
                      </span>

                      <span>
                        Correct:{" "}
                        <strong>
                          {getOptionLabel(question.answer, question)}
                        </strong>
                      </span>
                    </div>
                  </summary>

                  <div className="reviewQuestionBody">
                    <p className="reviewQuestionText">
                      {question.question}
                    </p>

                    <div className="reviewOptionsList">
                      {[
                        "option1",
                        "option2",
                        "option3",
                        "option4",
                      ].map((optionKey) => (
                        <div
                          key={optionKey}
                          className={`reviewOptionItem ${
                            isExamAnswerCorrect(
                              optionKey,
                              question.answer,
                              question
                            )
                              ? "correctOption"
                              : normalizeExamAnswerKey(
                                  userAnswer,
                                  question
                                ) === optionKey
                              ? "selectedOption"
                              : ""
                          }`}
                        >
                          <strong>{getOptionLabel(optionKey, question)}.</strong>{" "}
                          {question[optionKey]}
                        </div>
                      ))}
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
            }
          )}
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
