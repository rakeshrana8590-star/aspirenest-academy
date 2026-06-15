import React from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import ExamHeader from "./ExamHeader.jsx";
import PalettePanel from "./PalettePanel.jsx";
import QuestionWorkspace from "./QuestionWorkspace.jsx";

import {
  getFilteredQuestionIndexes,
  formatExamTime,
  getExamTimerSeconds,
  getExamQuestionCounts,
} from "./examUtils.js";

import {
  createDefaultAttemptState,
  saveAttemptState,
} from "./examAttemptStorage.js";

export default function ExamAttemptRoute({
  universalContent,
  getMockTestAccessStatus,
  getMockTestRules,
  mockAttemptState,
  setMockAttemptState,
  paletteFilter,
  setPaletteFilter,
  submitConfirmTestId,
  setSubmitConfirmTestId,
  examFontScale,
  setExamFontScale,
  fullName,
  user,
  goToAttemptQuestion,
  selectAttemptAnswer,
  clearAttemptResponse,
  markAttemptForReviewAndNext,
  saveAttemptAndNext,
  updateAttemptTimeLeft,
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeStartMockTestId = decodeURIComponent(testId || "");

  const test = universalContent.find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeStartMockTestId
  );

  const accessStatus = getMockTestAccessStatus(test);

  const questions = test?.questions || [];
  const mockRules = getMockTestRules(test);

  const isSequentialNavigation =
    mockRules.navigationMode === "sequential";

  const isCalculatorAllowed =
    mockRules.calculatorAllowed === "yes";

  const shouldShuffleOptions =
    mockRules.shuffleOptions === "yes";

  const isNoTimer = test?.timerMode === "noTimer";
  const isPerQuestionTimer =
    test?.timerMode === "perQuestionTimer";

  const timerLabel = isPerQuestionTimer
    ? "Question Time"
    : "Time Left";

  const defaultTimerSeconds = test
    ? getExamTimerSeconds(test)
    : 0;

  const attemptState = test
    ? mockAttemptState?.[test.id] ||
      createDefaultAttemptState(test, defaultTimerSeconds)
    : null;

  const currentQuestionIndex =
    Number.isInteger(attemptState?.currentIndex)
      ? attemptState.currentIndex
      : 0;

  const orderedQuestionIndexes =
    attemptState?.questionOrder?.length
      ? attemptState.questionOrder
      : questions.map((_, index) => index);

  const actualQuestionIndex =
    orderedQuestionIndexes[currentQuestionIndex] ??
    currentQuestionIndex;

  const currentQuestion = questions[actualQuestionIndex];

  const selectedAnswerKey =
    attemptState?.answers?.[actualQuestionIndex] || "";

  const timeLeft = isNoTimer
    ? 0
    : attemptState?.timeLeft ?? defaultTimerSeconds;

  const formattedTime = formatExamTime(timeLeft);

  const {
    answeredCount,
    markedCount,
    notAnsweredCount,
    notVisitedCount,
  } = attemptState
    ? getExamQuestionCounts(questions, attemptState)
    : {
        answeredCount: 0,
        markedCount: 0,
        notAnsweredCount: 0,
        notVisitedCount: 0,
      };

  const palettePageSize = 25;

  const currentRangeStart =
    Math.floor(currentQuestionIndex / palettePageSize) *
    palettePageSize;

  const finalPaletteRangeStart =
    attemptState?.paletteRangeStart ?? currentRangeStart;

  const paletteRanges = Array.from(
    {
      length: Math.ceil(questions.length / palettePageSize),
    },
    (_, rangeIndex) => {
      const start = rangeIndex * palettePageSize;
      const end = Math.min(
        start + palettePageSize,
        questions.length
      );

      return {
        start,
        end,
        label: `${start + 1}-${end}`,
      };
    }
  );

  const visiblePaletteIndexes =
    paletteFilter === "all"
      ? questions
          .map((_, index) => index)
          .slice(
            finalPaletteRangeStart,
            finalPaletteRangeStart + palettePageSize
          )
      : getFilteredQuestionIndexes(
          questions,
          attemptState,
          paletteFilter
        ).slice(0, 25);

  const optionList = React.useMemo(() => {
    if (!currentQuestion) return [];

    const baseOptions = [
      {
        key: "option1",
        label: "A",
        text:
          currentQuestion.option1 ||
          currentQuestion.options?.[0],
      },
      {
        key: "option2",
        label: "B",
        text:
          currentQuestion.option2 ||
          currentQuestion.options?.[1],
      },
      {
        key: "option3",
        label: "C",
        text:
          currentQuestion.option3 ||
          currentQuestion.options?.[2],
      },
      {
        key: "option4",
        label: "D",
        text:
          currentQuestion.option4 ||
          currentQuestion.options?.[3],
      },
    ].filter((option) => option.text);

    if (!shouldShuffleOptions) {
      return baseOptions;
    }

    return [...baseOptions].sort(() => Math.random() - 0.5);
  }, [
    currentQuestion,
    actualQuestionIndex,
    shouldShuffleOptions,
  ]);

  const totalViolationCount =
    Number(attemptState?.violations?.tabSwitchCount || 0) +
    Number(attemptState?.violations?.fullscreenExitCount || 0);

  const shouldForceSubmit =
    test?.autoSubmitOnViolation === "yes" &&
    totalViolationCount >= 5 &&
    !attemptState?.isSubmitted;

  React.useEffect(() => {
    if (!test || !attemptState || !shouldForceSubmit) return;

    const finalState = {
      ...attemptState,
      submittedAt: Date.now(),
      isSubmitted: true,
      forceSubmittedReason: "Violation limit exceeded",
    };

    saveAttemptState(test.id, finalState);

    setMockAttemptState((prev) => ({
      ...prev,
      [test.id]: finalState,
    }));

    toast.error("Violation limit exceeded. Test auto-submitted.");

    const redirectTimer = setTimeout(() => {
      navigate(`/ctet-tet/mock-tests/result/${test.id}`);
    }, 300);

    return () => clearTimeout(redirectTimer);
  }, [
    test,
    attemptState,
    shouldForceSubmit,
    setMockAttemptState,
    navigate,
  ]);

  const resetQuestionTimer = () => {
    if (!test || !isPerQuestionTimer) return;
    updateAttemptTimeLeft(test.id, defaultTimerSeconds);
  };

  const jumpToFirstFilteredQuestion = (filterType) => {
    if (!test || !attemptState) return;

    const indexes = getFilteredQuestionIndexes(
      questions,
      attemptState,
      filterType
    );

    setPaletteFilter(filterType);

    if (indexes.length === 0) return;

    const firstIndex = indexes[0];
    const firstRangeStart =
      Math.floor(firstIndex / palettePageSize) *
      palettePageSize;

    if (
      isSequentialNavigation &&
      firstIndex > currentQuestionIndex + 1
    ) {
      toast.error(
        "Sequential navigation is enabled. Please continue in order."
      );
      return;
    }

    goToAttemptQuestion(
      test.id,
      firstIndex,
      firstRangeStart
    );
  };

  const submitAttempt = () => {
    if (!test) return;
    setSubmitConfirmTestId(test.id);
  };

  const confirmFinalSubmit = () => {
    if (!test || !attemptState) return;

    const finalState = {
      ...attemptState,
      submittedAt: Date.now(),
      isSubmitted: true,
    };

    saveAttemptState(test.id, finalState);

    setMockAttemptState((prev) => ({
      ...prev,
      [test.id]: finalState,
    }));

    setSubmitConfirmTestId(null);

    toast.success("Test submitted successfully ✅");

    navigate(`/ctet-tet/mock-tests/result/${test.id}`);
  };

  const cancelFinalSubmit = () => {
    setSubmitConfirmTestId(null);
  };

  if (accessStatus === "NOT_FOUND") {
    return (
      <section className="premiumExamPage">
        <div className="pdfMiniCard">
          <h3>Test not found</h3>
          <p>This mock test is not available anymore.</p>
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
      <section className="premiumExamPage">
        <div className="pdfMiniCard">
          <h3>Test unavailable</h3>
          <p>This mock test is not published yet.</p>
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
      <section className="premiumExamPage">
        <div className="pdfMiniCard">
          <h3>Login required</h3>
          <p>Please login before attempting this mock test.</p>
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
      <section className="premiumExamPage">
        <div className="pdfMiniCard">
          <h3>Plan required</h3>
          <p>
            This mock test needs {test.planType || "PREMIUM"} access.
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
      <section className="premiumExamPage">
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
      <section className="premiumExamPage">
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

  if (attemptState?.isSubmitted) {
    return (
      <section className="premiumExamPage">
        <div className="pdfMiniCard">
          <h3>Test already submitted</h3>
          <p>Your attempt is locked. Please view your result.</p>
          <button
            className="btnLink"
            onClick={() =>
              navigate(`/ctet-tet/mock-tests/result/${test.id}`)
            }
          >
            View Result
          </button>
        </div>
      </section>
    );
  }

  if (shouldForceSubmit) {
    return null;
  }

  return (
    <section className="premiumExamPage">
      <div className="premiumExamShell" key={test.id}>
        {submitConfirmTestId === test.id && (
          <div className="mockPortalBackdrop">
            <div className="mockPortalMenu examSubmitConfirmModal">
              <h3>Submit Test?</h3>

              <p>
                Answered: {answeredCount}/{questions.length}
              </p>

              <p>Review: {markedCount}</p>
              <p>Not Answered: {notAnsweredCount}</p>
              <p>Not Visited: {notVisitedCount}</p>

              <p>
                After submission, your attempt will be locked and
                result will be generated.
              </p>

              <button
                type="button"
                className="examControlBtn primary"
                onClick={confirmFinalSubmit}
              >
                Yes, Submit Test
              </button>

              <button
                type="button"
                className="examControlBtn secondary"
                onClick={cancelFinalSubmit}
              >
                Continue Exam
              </button>
            </div>
          </div>
        )}

        <ExamHeader
          test={test}
          candidateName={fullName || user?.email || "Student"}
          isNoTimer={isNoTimer}
          timerLabel={timerLabel}
          formattedTime={formattedTime}
          currentQuestionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onSubmit={submitAttempt}
        />

        <div className="premiumExamGrid">
          <QuestionWorkspace
            questions={questions}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            selectedAnswerKey={selectedAnswerKey}
            isMarked={Boolean(
              attemptState?.marked?.[actualQuestionIndex]
            )}
            optionList={optionList}
            examFontScale={examFontScale}
            onDecreaseFont={() =>
              setExamFontScale((prev) =>
                Math.max(0.9, prev - 0.1)
              )
            }
            onResetFont={() => setExamFontScale(1)}
            onIncreaseFont={() =>
              setExamFontScale((prev) =>
                Math.min(1.3, prev + 0.1)
              )
            }
            onSelectOption={(optionKey) => {
              selectAttemptAnswer(
                test.id,
                actualQuestionIndex,
                optionKey
              );
            }}
            isFirstQuestion={currentQuestionIndex === 0}
            isLastQuestion={
              currentQuestionIndex === questions.length - 1
            }
            onPrevious={() => {
              const prevIndex = Math.max(
                0,
                currentQuestionIndex - 1
              );

              goToAttemptQuestion(
                test.id,
                prevIndex,
                Math.floor(prevIndex / 25) * 25
              );

              resetQuestionTimer();
            }}
            onClearResponse={() => {
              clearAttemptResponse(test.id, actualQuestionIndex);
            }}
            onMarkForReviewAndNext={() => {
              markAttemptForReviewAndNext(
                test.id,
                actualQuestionIndex,
                questions.length
              );

              resetQuestionTimer();
            }}
            onSaveAndNext={() => {
              saveAttemptAndNext(
                test.id,
                actualQuestionIndex,
                questions.length
              );

              resetQuestionTimer();
            }}
            onSubmit={submitAttempt}
          />

          <PalettePanel
            totalQuestions={questions.length}
            answeredCount={answeredCount}
            markedCount={markedCount}
            notAnsweredCount={notAnsweredCount}
            notVisitedCount={notVisitedCount}
            paletteRanges={paletteRanges}
            finalPaletteRangeStart={finalPaletteRangeStart}
            paletteFilter={paletteFilter}
            visiblePaletteIndexes={visiblePaletteIndexes}
            currentQuestionIndex={currentQuestionIndex}
            attemptState={attemptState}
            isCalculatorAllowed={isCalculatorAllowed}
            onRangeSelect={(rangeStart) => {
              setPaletteFilter("all");

              if (
                isSequentialNavigation &&
                rangeStart > currentQuestionIndex + 1
              ) {
                toast.error(
                  "Sequential navigation is enabled. Please continue in order."
                );
                return;
              }

              goToAttemptQuestion(
                test.id,
                rangeStart,
                rangeStart
              );

              resetQuestionTimer();
            }}
            onQuestionSelect={(index) => {
              setPaletteFilter("all");

              if (
                isSequentialNavigation &&
                index > currentQuestionIndex + 1
              ) {
                toast.error(
                  "Sequential navigation is enabled. Please continue in order."
                );
                return;
              }

              goToAttemptQuestion(
                test.id,
                index,
                Math.floor(index / 25) * 25
              );

              resetQuestionTimer();
            }}
            onOpenStatus={jumpToFirstFilteredQuestion}
            onSubmit={submitAttempt}
          />
        </div>
      </div>
    </section>
  );
}