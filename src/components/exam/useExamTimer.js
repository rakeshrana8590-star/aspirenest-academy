import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  restoreAttemptState,
  saveAttemptState,
} from "./examAttemptStorage.js";
import { getExamTimerSeconds } from "./examUtils.js";

export const useExamTimer = ({
  locationPathname = "",
  universalContent = [],
  setMockAttemptState,
  navigate,
}) => {
  useEffect(() => {
    const attemptPath = "/ctet-tet/mock-tests/attempt/";

    if (!locationPathname.includes(attemptPath)) return;

    const testId = decodeURIComponent(
      locationPathname.split("/")[4] || ""
    );

    if (!testId) return;

    const activeTimerTest = universalContent.find(
      (item) =>
        item.section === "mockTest" &&
        item.id === testId
    );

    if (!activeTimerTest) return;

    const defaultTimeLeft = getExamTimerSeconds(activeTimerTest);

    const restoredState = restoreAttemptState(
      activeTimerTest,
      defaultTimeLeft
    );

    setMockAttemptState((prev) => ({
      ...prev,
      [testId]: restoredState,
    }));

    const timer = setInterval(() => {
      setMockAttemptState((prev) => {
        const currentState = prev[testId] || restoredState;

        if (currentState.isSubmitted) {
          return prev;
        }

        const nextTime =
          currentState.timeLeft <= 0
            ? 0
            : currentState.timeLeft - 1;

        const shouldAutoSubmit =
          currentState.timeLeft <= 1 && nextTime === 0;

        const nextState = {
          ...currentState,
          timeLeft: nextTime,
          submittedAt: shouldAutoSubmit
            ? Date.now()
            : currentState.submittedAt,
          isSubmitted: shouldAutoSubmit
            ? true
            : currentState.isSubmitted,
        };

        saveAttemptState(testId, nextState);

        if (shouldAutoSubmit) {
          toast.success(
            "Time is over. Test submitted automatically ✅"
          );

          setTimeout(() => {
            navigate(`/ctet-tet/mock-tests/result/${testId}`);
          }, 300);
        }

        return {
          ...prev,
          [testId]: nextState,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    locationPathname,
    universalContent,
    setMockAttemptState,
    navigate,
  ]);
};