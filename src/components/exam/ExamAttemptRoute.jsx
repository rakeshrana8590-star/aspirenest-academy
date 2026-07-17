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
import {
  MOCK_TEST_ATTEMPT_GATE_STATES,
} from "../../access/mockTestAttemptRuntimeGate";
import {
  MOCK_TEST_ATTEMPT_ENTRY_STATES,
  useMockTestAttemptEntryRuntime,
} from "../../access/useMockTestAttemptEntryRuntime";
import {
  MOCK_TEST_SUBMIT_RUNTIME_STATES,
  createMockTestSubmitAuthorizer,
} from "../../access/mockTestSubmitRuntime";

function ExamAttemptRuntime({
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
  role,
  isAdminUser,
  accessProfile,
  planCatalog,
  runtimeGate,
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

  const submitAuthorizer = React.useMemo(
    () =>
      createMockTestSubmitAuthorizer({
        getCurrentUser: () => ({
          uid: user?.uid,
          email: user?.email,
        }),
      }),
    [user?.uid, user?.email]
  );

  const [submitRuntimeState, setSubmitRuntimeState] =
    React.useState({
      state: MOCK_TEST_SUBMIT_RUNTIME_STATES.IDLE,
      message: "",
      errorCode: null,
    });
  const submissionInFlightRef = React.useRef(false);
  const forceSubmitAttemptedRef = React.useRef(false);
  const [forceSubmitRetryVersion, setForceSubmitRetryVersion] =
    React.useState(0);

  const accessStatus =
    runtimeGate?.canActivateAttemptRuntime === true
      ? "AVAILABLE"
      : getMockTestAccessStatus(test);

  const questions = test?.questions || [];
  const mockRules = getMockTestRules(test);

  const isRuleEnabled = (value) => {
    const normalizedValue = String(value || "")
      .toLowerCase()
      .trim();

    return (
      value === true ||
      normalizedValue === "yes" ||
      normalizedValue === "required" ||
      normalizedValue === "enabled" ||
      normalizedValue === "on"
    );
  };

  const isFullscreenRequired = isRuleEnabled(test?.fullscreenMode);

  const isSequentialNavigation =
    mockRules.navigationMode === "sequential";

  const isCalculatorAllowed = isRuleEnabled(
    mockRules.calculatorAllowed
  );

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
      createDefaultAttemptState(
        test,
        defaultTimerSeconds,
        user
      )
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

  const [isExamFullscreenActive, setIsExamFullscreenActive] =
    React.useState(() =>
      typeof document !== "undefined"
        ? Boolean(document.fullscreenElement)
        : false
    );

  React.useEffect(() => {
    const handleFullscreenState = () => {
      setIsExamFullscreenActive(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenState
    );

    handleFullscreenState();

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenState
      );
    };
  }, []);

  const enterExamFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsExamFullscreenActive(true);
    } catch {
      toast.error(
        "Please allow fullscreen to continue this mock test."
      );
    }
  };

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

  const authorizeAndPersistSubmission = React.useCallback(
    async ({
      forceSubmittedReason = "",
      successMessage = "Test submitted successfully ✅",
    } = {}) => {
      if (
        !test ||
        !attemptState ||
        submissionInFlightRef.current
      ) {
        return null;
      }

      submissionInFlightRef.current = true;
      setSubmitRuntimeState({
        state: MOCK_TEST_SUBMIT_RUNTIME_STATES.LOADING,
        message:
          "Verifying ownership, access, and trusted server time before submission.",
        errorCode: null,
      });

      let authorization;

      try {
        authorization = await submitAuthorizer({
          test,
          user,
          role,
          isAdminUser,
          accessProfile,
          planCatalog,
          attemptState,
        });
      } catch (error) {
        authorization = {
          state: MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
          canSubmit: false,
          errorCode:
            error?.code ||
            "mock_test_submit_authorization_failed",
          message:
            error?.message ||
            "Secure submission could not be verified.",
        };
      }

      if (
        authorization?.state !==
          MOCK_TEST_SUBMIT_RUNTIME_STATES.READY ||
        authorization?.canSubmit !== true ||
        !Number.isFinite(
          Number(authorization?.submittedAtMs)
        )
      ) {
        const message =
          authorization?.message ||
          "Secure submission could not be verified. Your attempt remains open.";

        setSubmitRuntimeState({
          state:
            authorization?.state ||
            MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
          message,
          errorCode:
            authorization?.errorCode ||
            "mock_test_submit_not_authorized",
        });
        submissionInFlightRef.current = false;
        toast.error(message);
        return authorization;
      }

      const finalState = {
        ...attemptState,
        ownerUid:
          authorization.attempt?.ownerUid ||
          attemptState.ownerUid ||
          user?.uid ||
          "",
        ownerEmail:
          authorization.attempt?.ownerEmail ||
          attemptState.ownerEmail ||
          user?.email ||
          "",
        status: "submitted",
        submittedAt: authorization.submittedAtMs,
        isSubmitted: true,
        ...(forceSubmittedReason
          ? { forceSubmittedReason }
          : {}),
        submissionAuthorization: {
          action: "submit",
          purpose: "mock_test_submit",
          source: "server",
          requestId:
            authorization.requestId || null,
          authorizedAt:
            authorization.submittedAtMs,
        },
      };

      saveAttemptState(test.id, finalState, user);

      setMockAttemptState((prev) => ({
        ...prev,
        [test.id]: finalState,
      }));

      setSubmitRuntimeState({
        state: MOCK_TEST_SUBMIT_RUNTIME_STATES.READY,
        message: successMessage,
        errorCode: null,
      });
      submissionInFlightRef.current = false;
      toast.success(successMessage);

      return authorization;
    },
    [
      test,
      attemptState,
      submitAuthorizer,
      user,
      role,
      isAdminUser,
      accessProfile,
      planCatalog,
      setMockAttemptState,
    ]
  );

  React.useEffect(() => {
    if (
      !test ||
      !attemptState ||
      !shouldForceSubmit ||
      forceSubmitAttemptedRef.current
    ) {
      return undefined;
    }

    let active = true;
    let redirectTimer = null;
    forceSubmitAttemptedRef.current = true;

    authorizeAndPersistSubmission({
      forceSubmittedReason:
        "Violation limit exceeded",
      successMessage:
        "Violation limit exceeded. Test auto-submitted.",
    }).then((authorization) => {
      if (
        active &&
        authorization?.state ===
          MOCK_TEST_SUBMIT_RUNTIME_STATES.READY &&
        authorization?.canSubmit === true
      ) {
        redirectTimer = setTimeout(() => {
          navigate(
            `/ctet-tet/mock-tests/result/${test.id}`
          );
        }, 300);
      }
    });

    return () => {
      active = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [
    test,
    attemptState,
    shouldForceSubmit,
    authorizeAndPersistSubmission,
    navigate,
    forceSubmitRetryVersion,
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

    setSubmitRuntimeState({
      state: MOCK_TEST_SUBMIT_RUNTIME_STATES.IDLE,
      message: "",
      errorCode: null,
    });
    setSubmitConfirmTestId(test.id);
  };

  const confirmFinalSubmit = async () => {
    if (!test || !attemptState) return;

    const authorization =
      await authorizeAndPersistSubmission();

    if (
      authorization?.state !==
        MOCK_TEST_SUBMIT_RUNTIME_STATES.READY ||
      authorization?.canSubmit !== true
    ) {
      return;
    }

    setSubmitConfirmTestId(null);
    navigate(`/ctet-tet/mock-tests/result/${test.id}`);
  };

  const cancelFinalSubmit = () => {
    if (
      submitRuntimeState.state ===
      MOCK_TEST_SUBMIT_RUNTIME_STATES.LOADING
    ) {
      return;
    }

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
    const isSubmitError = [
      MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
      MOCK_TEST_SUBMIT_RUNTIME_STATES.DENIED,
    ].includes(submitRuntimeState.state);

    return (
      <section
        className="premiumExamPage"
        data-submit-runtime-state={
          submitRuntimeState.state
        }
      >
        <div className="pdfMiniCard">
          <span>Secure Auto-Submit</span>
          <h3>
            {isSubmitError
              ? "Auto-submit verification unavailable"
              : "Verifying secure submission"}
          </h3>
          <p>
            {submitRuntimeState.message ||
              "The violation threshold was reached. Ownership, access, and trusted server time are being verified before submission."}
          </p>

          {isSubmitError && (
            <div>
              <button
                type="button"
                className="btnLink"
                onClick={() => {
                  forceSubmitAttemptedRef.current = false;
                  setSubmitRuntimeState({
                    state:
                      MOCK_TEST_SUBMIT_RUNTIME_STATES.IDLE,
                    message: "",
                    errorCode: null,
                  });
                  setForceSubmitRetryVersion(
                    (current) => current + 1
                  );
                }}
              >
                Retry Secure Submit
              </button>

              <button
                type="button"
                className="btnLink"
                onClick={() =>
                  navigate("/ctet-tet/mock-tests")
                }
              >
                Back to Mock Tests
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="premiumExamPage">
      <div className="premiumExamShell" key={test.id}>
        {submitConfirmTestId === test.id && (
          <div className="examSubmitConfirmBackdrop" role="presentation">
            <div
              className="examSubmitConfirmModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exam-submit-confirm-title"
            >
              <div className="examSubmitConfirmHeader">
                <span className="examSubmitConfirmBadge">
                  Final Submission
                </span>

                <h3 id="exam-submit-confirm-title">Submit Test?</h3>

                <p>
                  Please review your attempt summary before final
                  submission. Once submitted, this attempt will be
                  locked.
                </p>
              </div>

              <div className="examSubmitConfirmStats">
                <div className="submitStat answered">
                  <span>Answered</span>
                  <strong>
                    {answeredCount}/{questions.length}
                  </strong>
                </div>

                <div className="submitStat review">
                  <span>Review</span>
                  <strong>{markedCount}</strong>
                </div>

                <div className="submitStat pending">
                  <span>Not Answered</span>
                  <strong>{notAnsweredCount}</strong>
                </div>

                <div className="submitStat notVisited">
                  <span>Not Visited</span>
                  <strong>{notVisitedCount}</strong>
                </div>
              </div>

              <div className="examSubmitConfirmWarning">
                Result will be generated only after ownership, access,
                and trusted server time are verified. You cannot edit
                answers after an authorized submission.
              </div>

              {[
                MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
                MOCK_TEST_SUBMIT_RUNTIME_STATES.DENIED,
              ].includes(submitRuntimeState.state) && (
                <div className="examSubmitConfirmWarning">
                  {submitRuntimeState.message}
                </div>
              )}

              <div className="examSubmitConfirmActions">
                <button
                  type="button"
                  className="examSubmitCancelBtn"
                  onClick={cancelFinalSubmit}
                  disabled={
                    submitRuntimeState.state ===
                    MOCK_TEST_SUBMIT_RUNTIME_STATES.LOADING
                  }
                >
                  Continue Exam
                </button>

                <button
                  type="button"
                  className="examSubmitConfirmBtn"
                  onClick={confirmFinalSubmit}
                  disabled={
                    submitRuntimeState.state ===
                    MOCK_TEST_SUBMIT_RUNTIME_STATES.LOADING
                  }
                >
                  {submitRuntimeState.state ===
                  MOCK_TEST_SUBMIT_RUNTIME_STATES.LOADING
                    ? "Verifying Secure Submit..."
                    : "Yes, Submit Test"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isFullscreenRequired && !isExamFullscreenActive && (
          <div className="examFullscreenGate">
            <div className="examFullscreenGateCard">
              <span>Fullscreen Required</span>

              <h3>Enter fullscreen to continue exam</h3>

              <p>
                This test requires fullscreen mode. Exiting fullscreen
                may be counted as an exam violation.
              </p>

              <button type="button" onClick={enterExamFullscreen}>
                Enter Fullscreen
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
          />
        </div>
      </div>
    </section>
  );
}

const getAttemptEntryStateCopy = ({
  state = "",
  gate = null,
  message = "",
} = {}) => {
  if (
    state ===
    MOCK_TEST_ATTEMPT_ENTRY_STATES.LOADING
  ) {
    return {
      label: "Secure Check",
      title: "Verifying attempt access",
      message:
        message ||
        "Your entitlement and active test window are being verified before the exam engine starts.",
      actionLabel: "Back to Mock Tests",
      recoveryRoute:
        "/ctet-tet/mock-tests",
      canRetry: false,
    };
  }

  if (
    state ===
    MOCK_TEST_ATTEMPT_ENTRY_STATES.ERROR
  ) {
    return {
      label: "Verification Error",
      title: "Attempt access unavailable",
      message:
        message ||
        "Trusted attempt access could not be verified. The test remains closed.",
      actionLabel: "Back to Mock Tests",
      recoveryRoute:
        gate?.recoveryRoute ||
        "/ctet-tet/mock-tests",
      canRetry: true,
    };
  }

  switch (gate?.state) {
    case MOCK_TEST_ATTEMPT_GATE_STATES.NOT_FOUND:
      return {
        label: "Not Found",
        title: "Test not found",
        message:
          "This mock test is not available anymore.",
        actionLabel: "Back to Mock Tests",
        recoveryRoute:
          "/ctet-tet/mock-tests",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.UNPUBLISHED:
      return {
        label: "Unavailable",
        title: "Test unavailable",
        message:
          "This mock test is not published yet.",
        actionLabel: "Back to Mock Tests",
        recoveryRoute:
          "/ctet-tet/mock-tests",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.LOGIN_REQUIRED:
      return {
        label: "Login Required",
        title: "Login required",
        message:
          "Please login before attempting this mock test.",
        actionLabel: "Login to Continue",
        recoveryRoute: "/login",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.LOCKED:
      return {
        label: "Plan Locked",
        title: "Mock-test access required",
        message:
          "This test is not included in your current valid access.",
        actionLabel: "View Pricing",
        recoveryRoute:
          gate?.recoveryRoute ||
          "/ctet-tet/pricing",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.BLOCKED:
      return {
        label: "Access Blocked",
        title: "Account access needs attention",
        message:
          "Review My Access before opening protected mock tests.",
        actionLabel: "Review My Access",
        recoveryRoute:
          gate?.recoveryRoute ||
          "/my-access",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.UPCOMING:
      return {
        label: "Upcoming",
        title: "Test upcoming",
        message:
          "This mock test is scheduled for a future date or time.",
        actionLabel: "Back to Mock Tests",
        recoveryRoute:
          "/ctet-tet/mock-tests",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.CLOSED:
      return {
        label: "Closed",
        title: "Test window closed",
        message:
          "This mock test window is closed.",
        actionLabel: "Back to Mock Tests",
        recoveryRoute:
          "/ctet-tet/mock-tests",
        canRetry: false,
      };

    case MOCK_TEST_ATTEMPT_GATE_STATES.INVALID_SCHEDULE:
      return {
        label: "Schedule Error",
        title: "Test schedule unavailable",
        message:
          "The test schedule is invalid, so this attempt remains closed.",
        actionLabel: "Back to Mock Tests",
        recoveryRoute:
          "/ctet-tet/mock-tests",
        canRetry: false,
      };

    default:
      return {
        label: "Access Denied",
        title: "Attempt unavailable",
        message:
          "This mock-test attempt could not be authorized.",
        actionLabel: "Back to Mock Tests",
        recoveryRoute:
          gate?.recoveryRoute ||
          "/ctet-tet/mock-tests",
        canRetry: false,
      };
  }
};

export default function ExamAttemptRoute({
  universalContent = [],
  user = null,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
  onRuntimeGateChange = null,
  timerRuntime = null,
  ...runtimeProps
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeAttemptTestId =
    decodeURIComponent(testId || "");

  const test = universalContent.find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeAttemptTestId
  );

  const entryRuntime =
    useMockTestAttemptEntryRuntime({
      test,
      user,
      role,
      isAdminUser,
      accessProfile,
      planCatalog,
    });

  React.useEffect(() => {
    if (
      typeof onRuntimeGateChange !==
      "function"
    ) {
      return undefined;
    }

    onRuntimeGateChange({
      testId: entryRuntime.testId,
      canActivateTimer:
        entryRuntime.canActivateTimer ===
        true,
      canActivateSecurity:
        entryRuntime.canActivateSecurity ===
        true,
      trustedTimeEvidence:
        entryRuntime.providerResult?.evidence || null,
    });

    return () => {
      onRuntimeGateChange({
        testId: entryRuntime.testId,
        canActivateTimer: false,
        canActivateSecurity: false,
        trustedTimeEvidence: null,
      });
    };
  }, [
    onRuntimeGateChange,
    entryRuntime.testId,
    entryRuntime.canActivateTimer,
    entryRuntime.canActivateSecurity,
    entryRuntime.providerResult?.evidence,
  ]);

  const isEntryRuntimeReady =
    entryRuntime.state ===
      MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
    entryRuntime.canActivateAttemptRuntime;
  const isTimerRuntimeForCurrentTest =
    timerRuntime?.testId === activeAttemptTestId;
  const isTimerRuntimeReady =
    isTimerRuntimeForCurrentTest &&
    timerRuntime?.canRenderAttempt === true;

  if (isEntryRuntimeReady && isTimerRuntimeReady) {
    return (
      <ExamAttemptRuntime
        {...runtimeProps}
        universalContent={universalContent}
        user={user}
        role={role}
        isAdminUser={isAdminUser}
        accessProfile={accessProfile}
        planCatalog={planCatalog}
        runtimeGate={entryRuntime.gate}
      />
    );
  }

  if (isEntryRuntimeReady) {
    const isTimerError =
      isTimerRuntimeForCurrentTest &&
      timerRuntime?.state === "error";

    return (
      <section
        className="premiumExamPage"
        data-attempt-timer-state={
          isTimerRuntimeForCurrentTest
            ? timerRuntime?.state || "loading"
            : "loading"
        }
      >
        <div className="pdfMiniCard">
          <span>
            {isTimerError
              ? "Timer Verification Error"
              : "Secure Timer Check"}
          </span>
          <h3>
            {isTimerError
              ? "Exam timer unavailable"
              : "Reconciling exam timer"}
          </h3>
          <p>
            {isTimerError
              ? timerRuntime?.message ||
                "Trusted timer verification failed, so the attempt remains closed."
              : "Your saved remaining time is being reconciled with trusted server time before questions open."}
          </p>

          <div>
            {isTimerError &&
              typeof timerRuntime?.retry === "function" && (
                <button
                  type="button"
                  className="btnLink"
                  onClick={timerRuntime.retry}
                >
                  Retry Timer Verification
                </button>
              )}

            <button
              type="button"
              className="btnLink"
              onClick={() =>
                navigate("/ctet-tet/mock-tests")
              }
            >
              Back to Mock Tests
            </button>
          </div>
        </div>
      </section>
    );
  }

  const stateCopy =
    getAttemptEntryStateCopy({
      state: entryRuntime.state,
      gate: entryRuntime.gate,
      message: entryRuntime.message,
    });

  return (
    <section
      className="premiumExamPage"
      data-attempt-entry-state={
        entryRuntime.state
      }
      data-attempt-gate-state={
        entryRuntime.gate?.state || ""
      }
    >
      <div className="pdfMiniCard">
        <span>{stateCopy.label}</span>
        <h3>{stateCopy.title}</h3>
        <p>{stateCopy.message}</p>

        <div>
          {stateCopy.canRetry && (
            <button
              type="button"
              className="btnLink"
              onClick={entryRuntime.retry}
            >
              Try Again
            </button>
          )}

          <button
            type="button"
            className="btnLink"
            onClick={() =>
              navigate(
                stateCopy.recoveryRoute
              )
            }
          >
            {stateCopy.actionLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
