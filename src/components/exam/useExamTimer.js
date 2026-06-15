import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

import {
  restoreAttemptState,
  saveAttemptState,
} from "./examAttemptStorage.js";

import { getExamTimerSeconds } from "./examUtils.js";

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
}) => {
  const autoSubmittedRef = useRef({});

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

    saveAttemptState(testId, restoredState);

    setMockAttemptState((prev) => ({
      ...prev,
      [testId]: restoredState,
    }));

    if (isNoTimer || restoredState.isSubmitted) {
      return;
    }

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
        submittedAt: shouldAutoSubmit
          ? Date.now()
          : currentState.submittedAt,
        isSubmitted: shouldAutoSubmit
          ? true
          : currentState.isSubmitted,
        forceSubmittedReason: shouldAutoSubmit
          ? "Time is over"
          : currentState.forceSubmittedReason,
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
        autoSubmittedRef.current[testId] = true;

        toast.success(
          "Time is over. Test submitted automatically ✅"
        );

        setTimeout(() => {
          navigate(`/ctet-tet/mock-tests/result/${testId}`);
        }, 300);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    locationPathname,
    universalContent,
    setMockAttemptState,
    navigate,
  ]);
};