import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAttemptStorageKey } from "./examAttemptStorage.js";
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
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

import { useSubmittedMockTestAnswers } from "./mockSubmissionReceiptService.js";

/* === P0 legacy historical summary-only policy v2 === */
const findLatestSavedResultForRoute = (
  mockResults = [],
  routeTestId = "",
  user = {}
) => {
  const expectedTestId = String(routeTestId || "").trim();
  const expectedUid = String(user?.uid || "").trim();
  const expectedEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  if (
    !expectedTestId ||
    (!expectedUid && !expectedEmail)
  ) {
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
      ).trim();

      if (itemTestId !== expectedTestId) {
        return false;
      }

      const itemUid = String(
        item?.uid ||
          item?.studentUid ||
          item?.ownerUid ||
          item?.userId ||
          ""
      ).trim();

      if (expectedUid && itemUid) {
        return itemUid === expectedUid;
      }

      const itemEmail = String(
        item?.email ||
          item?.studentEmail ||
          item?.userEmail ||
          item?.ownerEmail ||
          ""
      )
        .trim()
        .toLowerCase();

      return Boolean(
        expectedEmail &&
          itemEmail === expectedEmail
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
};

const buildHistoricalSummaryTest = (
  routeTestId = "",
  savedResult = {}
) => ({
  id: String(routeTestId || "").trim(),
  section: "mockTest",
  status: "historical-summary-only",
  title:
    savedResult?.testTitle ||
    savedResult?.title ||
    "Historical Mock Test",
  subject:
    savedResult?.subject ||
    "Subject",
  chapter:
    savedResult?.chapter ||
    "Complete Test",
  planType:
    savedResult?.planType ||
    savedResult?.accessPlan ||
    "FREE",
  examType:
    savedResult?.examType ||
    "CTET/TET",
  testType:
    savedResult?.testType ||
    "Mock Test",
  totalQuestions:
    Number(savedResult?.totalQuestions || 0),
  totalMarks:
    Number(savedResult?.totalMarks || 0),
  attemptLimit: "1",
  leaderboardMode: "disabled",
  resultPublishMode: "instant",
  questions: [],
});

export default function ExamReviewRoute({
  universalContent,
  getMockTestAccessStatus,
  mockAttemptAnswers,
  mockAttemptState,
  user,
  loadUserMockResults,
  mockResults = [],
  mockResultsLoaded = false,
  mockResultsLoadError = "",
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeResultAttemptId = decodeURIComponent(testId || "");

  const sourceTest = (Array.isArray(universalContent)
    ? universalContent
    : []
  ).find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeResultAttemptId
  );

  const legacySavedResultForRoute = React.useMemo(
    () =>
      findLatestSavedResultForRoute(
        mockResults,
        activeResultAttemptId,
        user
      ),
    [
      mockResults,
      activeResultAttemptId,
      user?.uid,
      user?.email,
    ]
  );

  const isHistoricalSummaryOnly =
    !sourceTest &&
    Boolean(legacySavedResultForRoute);

  const isHistoricalRecoveryPending =
    !sourceTest &&
    !legacySavedResultForRoute &&
    Boolean(user?.email) &&
    !mockResultsLoaded;

  const test =
    sourceTest ||
    (
      isHistoricalSummaryOnly ||
      isHistoricalRecoveryPending
        ? buildHistoricalSummaryTest(
            activeResultAttemptId,
            legacySavedResultForRoute || {}
          )
        : null
    );

  const accessStatus = isHistoricalSummaryOnly
    ? "HISTORICAL_SUMMARY_ONLY"
    : isHistoricalRecoveryPending
    ? "HISTORICAL_RECOVERY_PENDING"
    : getMockTestAccessStatus(test);

  /* === P0 saved mock-review recovery v1 === */
  const [reviewRecoveryRetry, setReviewRecoveryRetry] =
    React.useState(0);
  const loadUserMockResultsRef = React.useRef(
    loadUserMockResults
  );

  React.useEffect(() => {
    loadUserMockResultsRef.current = loadUserMockResults;
  }, [loadUserMockResults]);

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
          item?.uid ||
            item?.studentUid ||
            item?.ownerUid ||
            item?.userId ||
            ""
        ).trim();

        const itemEmail = String(
          item?.email ||
            item?.studentEmail ||
            item?.userEmail ||
            item?.ownerEmail ||
            ""
        )
          .trim()
          .toLowerCase();

        const sameOwner =
          expectedUid && itemUid
            ? itemUid === expectedUid
            : Boolean(
                expectedEmail &&
                  itemEmail === expectedEmail
              );

        return itemTestId === expectedTestId && sameOwner;
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
  }, [mockResults, test?.id, user?.email]);

  const submittedAnswerReleaseEligible = React.useMemo(() => {
    if (
      !test?.id ||
      !user?.uid ||
      isHistoricalSummaryOnly ||
      isHistoricalRecoveryPending
    ) {
      return false;
    }

    const liveState = mockAttemptState?.[test.id] || {};
    const storedState = safeParseJson(
      localStorage.getItem(getAttemptStorageKey(test.id))
    );

    return Boolean(
      liveState?.isSubmitted === true ||
        storedState?.isSubmitted === true ||
        savedResultForTest
    );
  }, [
    mockAttemptState,
    savedResultForTest,
    test?.id,
    user?.uid,
    isHistoricalSummaryOnly,
    isHistoricalRecoveryPending,
  ]);

  const submittedAnswerRelease = useSubmittedMockTestAnswers({
    test,
    user,
    enabled: submittedAnswerReleaseEligible,
  });

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
  }, [test?.id, user?.email, reviewRecoveryRetry]);

  const liveAttemptState = mockAttemptState?.[test?.id] || {};

  const storedAttemptState = safeParseJson(
    localStorage.getItem(getAttemptStorageKey(test?.id))
  );

  const activeAttemptState = liveAttemptState?.isSubmitted
    ? liveAttemptState
    : storedAttemptState?.isSubmitted
    ? storedAttemptState
    : {};

  const hasLocalSubmittedAttempt =
    activeAttemptState?.isSubmitted === true;
  const hasHistoricalSubmission =
    hasLocalSubmittedAttempt || Boolean(savedResultForTest);

  if (
    isHistoricalSummaryOnly &&
    savedResultForTest
  ) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Detailed review unavailable for this legacy test</h3>
          <p>
            Your saved score, percentage, correct/wrong counts, and
            attempt history remain preserved. The original question and
            correct-answer source for this older deleted test is not
            available, so a question-wise review or explanation cannot be
            reconstructed safely.
          </p>
          <button
            className="btnLink"
            onClick={() =>
              navigate(
                `/ctet-tet/mock-tests/result/${activeResultAttemptId}`
              )
            }
          >
            Back to Saved Result
          </button>
        </div>
      </section>
    );
  }

  if (hasHistoricalSubmission && submittedAnswerRelease.loading) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Preparing secure review</h3>
          <p>Your submitted answer key is being restored securely.</p>
        </div>
      </section>
    );
  }

  if (hasHistoricalSubmission && submittedAnswerRelease.error) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Answer key could not be loaded</h3>
          <p>{submittedAnswerRelease.error}</p>
          <button
            className="btnLink"
            onClick={() => window.location.reload()}
          >
            Retry Review
          </button>
        </div>
      </section>
    );
  }

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
    !hasLocalSubmittedAttempt &&
    user?.email &&
    !mockResultsLoaded
  ) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Preparing your review</h3>
          <p>
            Your submitted answers are being securely restored.
          </p>
        </div>
      </section>
    );
  }

  if (
    !hasLocalSubmittedAttempt &&
    user?.email &&
    mockResultsLoaded &&
    mockResultsLoadError &&
    !savedResultForTest
  ) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Review could not be loaded</h3>
          <p>{mockResultsLoadError}</p>
          <button
            className="btnLink"
            onClick={() =>
              setReviewRecoveryRetry((current) => current + 1)
            }
          >
            Retry Review
          </button>
        </div>
      </section>
    );
  }

  if (
    (
      accessStatus === "PLAN_LOCKED" ||
      accessStatus === "EXPIRED_MEMBERSHIP"
    ) &&
    !hasHistoricalSubmission
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

  if (
    accessStatus === "UPCOMING" &&
    !hasHistoricalSubmission
  ) {
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

  if (
    accessStatus === "EXPIRED" &&
    !hasHistoricalSubmission
  ) {
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

  if (!hasHistoricalSubmission) {
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

  const storedLegacyAnswers = safeParseJson(
    localStorage.getItem(`mockAttemptAnswers_${test.id}`)
  );

  const liveNewAnswers = liveAttemptState?.answers || {};
  const storedNewAnswers = storedAttemptState?.answers || {};
  const activeNewAnswers = activeAttemptState?.answers || {};
  const recoveredAnswers = savedResultForTest?.answers || {};
  const liveLegacyAnswers = mockAttemptAnswers?.[test.id] || {};

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
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Detailed review unavailable</h3>
          <p>
            Your result is preserved, but this older attempt does not
            contain a saved answer snapshot.
          </p>
          <button
            className="btnLink"
            onClick={() =>
              navigate(`/ctet-tet/mock-tests/result/${test.id}`)
            }
          >
            Back to Result
          </button>
        </div>
      </section>
    );
  }

  const questions =
    submittedAnswerRelease.test?.questions ||
    test.questions ||
    [];

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
