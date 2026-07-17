import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

import {
  restoreAttemptState,
  saveAttemptState,
} from "./examAttemptStorage.js";

import { getExamTimerSeconds } from "./examUtils.js";
import {
  MOCK_TEST_SUBMIT_RUNTIME_STATES,
  createMockTestSubmitAuthorizer,
} from "../../access/mockTestSubmitRuntime";
import {
  MOCK_TEST_SERVER_TIME_PROVIDER_STATES,
  createMockTestServerTimeProvider,
} from "../../access/mockTestServerTimeProvider";
import {
  requestMockTestServerTime,
} from "../../access/mockTestFirebaseServerTimeClient";
import {
  resolveMockTestTrustedTime,
} from "../../access/mockTestTrustedTime";
import {
  MOCK_TEST_TIMER_RUNTIME_STATES,
  advanceMockTestAttemptTimer,
  reconcileMockTestAttemptTimer,
} from "../../access/mockTestTimerRuntime";

const EXAM_ATTEMPT_PATH = "/ctet-tet/mock-tests/attempt/";

const getAttemptTestIdFromPathname = (pathname = "") => {
  if (!pathname.includes(EXAM_ATTEMPT_PATH)) return "";

  return decodeURIComponent(pathname.split("/")[4] || "");
};

const getMonotonicNow = () => {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }

  return Date.now();
};

const freezeTimerState = ({
  state = MOCK_TEST_TIMER_RUNTIME_STATES.IDLE,
  testId = "",
  message = "",
  errorCode = "",
  timeLeft = 0,
  trustedNowMs = null,
  requestId = "",
} = {}) =>
  Object.freeze({
    state,
    testId: String(testId || "").trim(),
    message: String(message || "").trim(),
    errorCode: String(errorCode || "").trim() || null,
    timeLeft: Math.max(0, Math.floor(Number(timeLeft) || 0)),
    trustedNowMs: Number.isFinite(Number(trustedNowMs))
      ? Number(trustedNowMs)
      : null,
    requestId: String(requestId || "").trim() || null,
    isReady: [
      MOCK_TEST_TIMER_RUNTIME_STATES.READY,
      MOCK_TEST_TIMER_RUNTIME_STATES.NO_TIMER,
      MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED,
    ].includes(state),
    canRenderAttempt: [
      MOCK_TEST_TIMER_RUNTIME_STATES.READY,
      MOCK_TEST_TIMER_RUNTIME_STATES.NO_TIMER,
      MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED,
    ].includes(state),
  });

export const useExamTimer = ({
  locationPathname = "",
  universalContent = [],
  setMockAttemptState,
  navigate,
  submitRuntimeContextRef = null,
}) => {
  const autoSubmittedRef = useRef({});
  const [retryVersion, setRetryVersion] = useState(0);
  const [timerRuntime, setTimerRuntime] = useState(
    freezeTimerState()
  );

  const serverTimeProvider = useMemo(
    () =>
      createMockTestServerTimeProvider({
        callServerTime: requestMockTestServerTime,
        getCurrentUser: () => {
          const context = submitRuntimeContextRef?.current || {};

          return {
            uid: context.user?.uid,
            email: context.user?.email,
          };
        },
      }),
    [submitRuntimeContextRef]
  );

  const submitAuthorizer = useMemo(
    () =>
      createMockTestSubmitAuthorizer({
        getCurrentUser: () => {
          const context = submitRuntimeContextRef?.current || {};

          return {
            uid: context.user?.uid,
            email: context.user?.email,
          };
        },
      }),
    [submitRuntimeContextRef]
  );

  const retry = useCallback(() => {
    setRetryVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    const testId = getAttemptTestIdFromPathname(locationPathname);
    let active = true;
    let timer = null;
    let redirectTimer = null;

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    if (!testId) {
      setTimerRuntime(freezeTimerState());

      return () => {
        active = false;
        stopTimer();
      };
    }

    const activeTimerTest = universalContent.find(
      (item) =>
        item.section === "mockTest" &&
        item.id === testId
    );

    if (!activeTimerTest) {
      setTimerRuntime(
        freezeTimerState({
          state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
          testId,
          errorCode: "timer_test_not_found",
          message: "The mock-test timer could not find this test.",
        })
      );

      return () => {
        active = false;
        stopTimer();
      };
    }

    autoSubmittedRef.current[testId] = null;

    setTimerRuntime(
      freezeTimerState({
        state: MOCK_TEST_TIMER_RUNTIME_STATES.LOADING,
        testId,
        message:
          activeTimerTest.timerMode === "noTimer"
            ? "Preparing the mock-test attempt."
            : "Reconciling the exam timer with trusted server time.",
      })
    );

    const authorizeTimeUpSubmission = async ({
      attemptState,
      context,
    }) => {
      if (autoSubmittedRef.current[testId]) return;

      autoSubmittedRef.current[testId] = "pending";

      let authorization;

      try {
        authorization = await submitAuthorizer({
          test: activeTimerTest,
          user: context.user,
          role: context.role,
          isAdminUser: context.isAdminUser,
          accessProfile: context.accessProfile,
          planCatalog: context.planCatalog,
          attemptState,
        });
      } catch (error) {
        authorization = {
          state: MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
          canSubmit: false,
          message:
            error?.message ||
            "Secure time-up submission could not be verified.",
        };
      }

      if (
        authorization?.state !==
          MOCK_TEST_SUBMIT_RUNTIME_STATES.READY ||
        authorization?.canSubmit !== true ||
        !Number.isFinite(Number(authorization?.submittedAtMs))
      ) {
        autoSubmittedRef.current[testId] = "failed";

        if (active) {
          toast.error(
            authorization?.message ||
              "Time is over, but secure submission could not be verified. Use Submit to retry."
          );
        }

        return;
      }

      const finalState = {
        ...attemptState,
        ownerUid:
          authorization.attempt?.ownerUid ||
          attemptState.ownerUid ||
          context.user?.uid ||
          "",
        ownerEmail:
          authorization.attempt?.ownerEmail ||
          attemptState.ownerEmail ||
          context.user?.email ||
          "",
        status: "submitted",
        submittedAt: authorization.submittedAtMs,
        isSubmitted: true,
        forceSubmittedReason: "Time is over",
        submissionAuthorization: {
          action: "submit",
          purpose: "mock_test_submit",
          source: "server",
          requestId: authorization.requestId || null,
          authorizedAt: authorization.submittedAtMs,
        },
      };

      saveAttemptState(testId, finalState, context.user);

      setMockAttemptState((prev) => ({
        ...prev,
        [testId]: finalState,
      }));

      autoSubmittedRef.current[testId] = "submitted";

      if (active) {
        toast.success(
          "Time is over. Test submitted automatically ✅"
        );

        redirectTimer = setTimeout(() => {
          navigate(`/ctet-tet/mock-tests/result/${testId}`);
        }, 300);
      }
    };

    const initializeTimer = async () => {
      const context = submitRuntimeContextRef?.current || {};
      const isNoTimer = activeTimerTest.timerMode === "noTimer";
      const defaultTimeLeft = isNoTimer
        ? 0
        : getExamTimerSeconds(activeTimerTest);
      let trustedTimeEvidence = null;

      if (!isNoTimer) {
        const reusableEntryEvidence = resolveMockTestTrustedTime({
          evidence: context.trustedTimeEvidence,
          checkedAtClientMs: Date.now(),
        });

        if (reusableEntryEvidence?.isTrusted === true) {
          trustedTimeEvidence = reusableEntryEvidence;
        } else {
          const providerResult = await serverTimeProvider.load({
            purpose: "mock_test_timer_resume",
            testId,
          });

          if (
            providerResult?.state !==
              MOCK_TEST_SERVER_TIME_PROVIDER_STATES.READY ||
            providerResult?.isReady !== true ||
            providerResult?.evidence?.isTrusted !== true
          ) {
            if (active) {
              setTimerRuntime(
                freezeTimerState({
                  state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
                  testId,
                  errorCode:
                    providerResult?.errorCode ||
                    "trusted_timer_time_unavailable",
                  message:
                    providerResult?.message ||
                    "Trusted server time is unavailable, so the timer remains closed.",
                })
              );
            }

            return;
          }

          trustedTimeEvidence = providerResult.evidence;
        }
      }

      if (!active) return;

      const restoredState = restoreAttemptState(
        activeTimerTest,
        defaultTimeLeft,
        context.user
      );
      const ownedRestoredState = {
        ...restoredState,
        ownerUid:
          restoredState.ownerUid || context.user?.uid || "",
        ownerEmail:
          restoredState.ownerEmail || context.user?.email || "",
        status: restoredState.isSubmitted
          ? "submitted"
          : restoredState.status || "in_progress",
      };
      const reconciliation = reconcileMockTestAttemptTimer({
        test: activeTimerTest,
        attemptState: ownedRestoredState,
        defaultTimeLeft,
        trustedTimeEvidence,
        checkedAtClientMs: Date.now(),
      });

      if (!reconciliation.isReady || !reconciliation.attemptState) {
        if (active) {
          setTimerRuntime(
            freezeTimerState({
              state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
              testId,
              errorCode:
                reconciliation.errorCode ||
                "timer_reconciliation_failed",
              message:
                reconciliation.message ||
                "The exam timer could not be reconciled safely.",
            })
          );
        }

        return;
      }

      const reconciledState = reconciliation.attemptState;

      saveAttemptState(testId, reconciledState, context.user);

      setMockAttemptState((prev) => ({
        ...prev,
        [testId]: reconciledState,
      }));

      if (active) {
        setTimerRuntime(
          freezeTimerState({
            state: reconciliation.state,
            testId,
            timeLeft: reconciliation.timeLeft,
            trustedNowMs: reconciliation.trustedNowMs,
            requestId: reconciliation.requestId,
          })
        );
      }

      if (isNoTimer || reconciledState.isSubmitted) return;

      if (
        reconciliation.timeLeft <= 0 &&
        activeTimerTest.autoSubmitOnTimeUp !== "no"
      ) {
        await authorizeTimeUpSubmission({
          attemptState: reconciledState,
          context,
        });
        return;
      }

      if (reconciliation.timeLeft <= 0) return;

      const trustedBaseMs = Number(reconciliation.trustedNowMs);
      const monotonicBaseMs = getMonotonicNow();

      const tick = () => {
        const currentState = restoreAttemptState(
          activeTimerTest,
          defaultTimeLeft,
          context.user
        );

        if (currentState.isSubmitted) {
          stopTimer();
          return;
        }

        const monotonicElapsedMs = Math.max(
          0,
          getMonotonicNow() - monotonicBaseMs
        );
        const estimatedTrustedNowMs =
          trustedBaseMs + monotonicElapsedMs;
        const advanced = advanceMockTestAttemptTimer({
          test: activeTimerTest,
          attemptState: currentState,
          defaultTimeLeft,
          trustedNowMs: estimatedTrustedNowMs,
        });

        if (!advanced.isReady || !advanced.attemptState) {
          stopTimer();

          if (active) {
            setTimerRuntime(
              freezeTimerState({
                state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
                testId,
                errorCode:
                  advanced.errorCode ||
                  "timer_runtime_advance_failed",
                message:
                  advanced.message ||
                  "The trusted timer runtime stopped safely.",
              })
            );
          }

          return;
        }

        const nextState = advanced.attemptState;
        const shouldPersist =
          Number(nextState.timeLeft) !==
            Number(currentState.timeLeft) ||
          Number(nextState.timerRuntime?.questionIndex) !==
            Number(currentState.timerRuntime?.questionIndex) ||
          Number(nextState.timerRuntime?.deadlineAtServerMs) !==
            Number(currentState.timerRuntime?.deadlineAtServerMs);

        if (shouldPersist) {
          saveAttemptState(testId, nextState, context.user);

          setMockAttemptState((prev) => ({
            ...prev,
            [testId]: nextState,
          }));
        }

        if (active) {
          setTimerRuntime(
            freezeTimerState({
              state: advanced.state,
              testId,
              timeLeft: advanced.timeLeft,
              trustedNowMs: advanced.trustedNowMs,
              requestId: advanced.requestId,
            })
          );
        }

        if (advanced.timeLeft > 0) return;

        stopTimer();

        if (
          activeTimerTest.autoSubmitOnTimeUp !== "no" &&
          !autoSubmittedRef.current[testId]
        ) {
          authorizeTimeUpSubmission({
            attemptState: nextState,
            context,
          });
        }
      };

      tick();

      if (
        reconciliation.timeLeft > 0 &&
        !autoSubmittedRef.current[testId]
      ) {
        timer = setInterval(tick, 250);
      }
    };

    initializeTimer();

    return () => {
      active = false;
      stopTimer();

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [
    locationPathname,
    universalContent,
    setMockAttemptState,
    navigate,
    submitAuthorizer,
    serverTimeProvider,
    submitRuntimeContextRef,
    retryVersion,
  ]);

  return Object.freeze({
    ...timerRuntime,
    retry,
  });
};
