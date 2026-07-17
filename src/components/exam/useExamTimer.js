import { useEffect, useMemo, useRef } from "react";
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

const EXAM_ATTEMPT_PATH = "/ctet-tet/mock-tests/attempt/";

const getAttemptTestIdFromPathname = (pathname = "") => {
  if (!pathname.includes(EXAM_ATTEMPT_PATH)) return "";

  return decodeURIComponent(pathname.split("/")[4] || "");
};

export const useExamTimer = ({
  locationPathname = "",
  universalContent = [],
  setMockAttemptState,
  navigate,
  submitRuntimeContextRef = null,
}) => {
  const autoSubmittedRef = useRef({});

  const submitAuthorizer = useMemo(
    () =>
      createMockTestSubmitAuthorizer({
        getCurrentUser: () => {
          const context =
            submitRuntimeContextRef?.current || {};

          return {
            uid: context.user?.uid,
            email: context.user?.email,
          };
        },
      }),
    [submitRuntimeContextRef]
  );

  useEffect(() => {
    const testId = getAttemptTestIdFromPathname(locationPathname);

    if (!testId) return;

    const activeTimerTest = universalContent.find(
      (item) =>
        item.section === "mockTest" &&
        item.id === testId
    );

    if (!activeTimerTest) return;

    const isNoTimer = activeTimerTest.timerMode === "noTimer";

    const defaultTimeLeft = isNoTimer
      ? 0
      : getExamTimerSeconds(activeTimerTest);

    const restoredState = restoreAttemptState(
      activeTimerTest,
      defaultTimeLeft
    );
    const runtimeContext =
      submitRuntimeContextRef?.current || {};
    const ownedRestoredState = {
      ...restoredState,
      ownerUid:
        restoredState.ownerUid ||
        runtimeContext.user?.uid ||
        "",
      ownerEmail:
        restoredState.ownerEmail ||
        runtimeContext.user?.email ||
        "",
      status: restoredState.isSubmitted
        ? "submitted"
        : restoredState.status || "in_progress",
    };

    saveAttemptState(testId, ownedRestoredState);

    setMockAttemptState((prev) => ({
      ...prev,
      [testId]: ownedRestoredState,
    }));

    if (isNoTimer || ownedRestoredState.isSubmitted) {
      return;
    }

    let active = true;

    const timer = setInterval(() => {
      const currentState = restoreAttemptState(
        activeTimerTest,
        defaultTimeLeft
      );

      if (currentState.isSubmitted) {
        return;
      }

      const currentTime = Number(
        currentState.timeLeft ?? defaultTimeLeft
      );

      if (currentTime <= 0) {
        return;
      }

      const nextTime = Math.max(0, currentTime - 1);

      const shouldAutoSubmit =
        nextTime === 0 &&
        activeTimerTest.autoSubmitOnTimeUp !== "no";

      const nextState = {
        ...currentState,
        timeLeft: nextTime,
      };

      saveAttemptState(testId, nextState);

      setMockAttemptState((prev) => ({
        ...prev,
        [testId]: nextState,
      }));

      if (
        shouldAutoSubmit &&
        !autoSubmittedRef.current[testId]
      ) {
        autoSubmittedRef.current[testId] = "pending";
        clearInterval(timer);

        const context =
          submitRuntimeContextRef?.current || {};

        submitAuthorizer({
          test: activeTimerTest,
          user: context.user,
          role: context.role,
          isAdminUser: context.isAdminUser,
          accessProfile: context.accessProfile,
          planCatalog: context.planCatalog,
          attemptState: nextState,
        }).then((authorization) => {
          if (
            authorization?.state !==
              MOCK_TEST_SUBMIT_RUNTIME_STATES.READY ||
            authorization?.canSubmit !== true ||
            !Number.isFinite(
              Number(authorization?.submittedAtMs)
            )
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
            ...nextState,
            ownerUid:
              authorization.attempt?.ownerUid ||
              nextState.ownerUid ||
              context.user?.uid ||
              "",
            ownerEmail:
              authorization.attempt?.ownerEmail ||
              nextState.ownerEmail ||
              context.user?.email ||
              "",
            status: "submitted",
            submittedAt:
              authorization.submittedAtMs,
            isSubmitted: true,
            forceSubmittedReason: "Time is over",
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

          saveAttemptState(testId, finalState);

          setMockAttemptState((prev) => ({
            ...prev,
            [testId]: finalState,
          }));

          autoSubmittedRef.current[testId] = "submitted";

          if (active) {
            toast.success(
              "Time is over. Test submitted automatically ✅"
            );

            setTimeout(() => {
              navigate(
                `/ctet-tet/mock-tests/result/${testId}`
              );
            }, 300);
          }
        });
      }
    }, 1000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [
    locationPathname,
    universalContent,
    setMockAttemptState,
    navigate,
    submitAuthorizer,
    submitRuntimeContextRef,
  ]);
};
