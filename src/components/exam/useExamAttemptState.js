import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  getAttemptOwnerScope,
  isAttemptStateOwnedByIdentity,
  restoreAttemptState,
  saveAttemptState,
  setAttemptStorageIdentity,
} from "./examAttemptStorage.js";
import {
  getGoToQuestionState,
  getSelectAnswerState,
  getClearResponseState,
  getMarkForReviewAndNextState,
  getSaveAndNextState,
  getSubmitAttemptState,
  getTimeLeftState,
} from "./examAttemptActions.js";

const safeAttemptMap = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const sanitizeOwnedAttemptMap = (
  value,
  ownerIdentity
) =>
  Object.entries(safeAttemptMap(value)).reduce(
    (ownedAttempts, [testId, state]) => {
      if (
        isAttemptStateOwnedByIdentity(
          state,
          testId,
          ownerIdentity
        )
      ) {
        ownedAttempts[testId] = state;
      }

      return ownedAttempts;
    },
    {}
  );

export const useExamAttemptState = (
  universalContent = [],
  user = null
) => {
  const ownerIdentity = useMemo(
    () => ({
      uid: user?.uid || "",
      email: user?.email || "",
    }),
    [user?.uid, user?.email]
  );
  const ownerScope = getAttemptOwnerScope(ownerIdentity);

  setAttemptStorageIdentity(ownerIdentity);

  const [attemptContainer, setAttemptContainer] = useState({
    ownerScope,
    attempts: {},
  });

  const mockAttemptState =
    attemptContainer.ownerScope === ownerScope
      ? attemptContainer.attempts
      : {};

  const setMockAttemptState = useCallback(
    (nextValue) => {
      setAttemptContainer((previousContainer) => {
        const currentAttempts =
          previousContainer.ownerScope === ownerScope
            ? previousContainer.attempts
            : {};
        const resolvedAttempts =
          typeof nextValue === "function"
            ? nextValue(currentAttempts)
            : nextValue;

        return {
          ownerScope,
          attempts: sanitizeOwnedAttemptMap(
            resolvedAttempts,
            ownerIdentity
          ),
        };
      });
    },
    [ownerIdentity, ownerScope]
  );

  const updateAttemptState = useCallback(
    (testId, updater) => {
      if (
        !testId ||
        !ownerScope ||
        typeof updater !== "function"
      ) {
        return;
      }

      setMockAttemptState((previousAttempts) => {
        const activeTest = universalContent.find(
          (item) =>
            item.section === "mockTest" &&
            item.id === testId
        );
        const liveState = previousAttempts[testId];
        const currentState =
          liveState &&
          isAttemptStateOwnedByIdentity(
            liveState,
            testId,
            ownerIdentity
          )
            ? liveState
            : restoreAttemptState(
                activeTest,
                0,
                ownerIdentity
              );
        const nextState = updater(currentState);

        if (
          !saveAttemptState(
            testId,
            nextState,
            ownerIdentity
          )
        ) {
          return previousAttempts;
        }

        return {
          ...previousAttempts,
          [testId]: {
            ...nextState,
            testId,
            ownerUid: ownerIdentity.uid,
            ownerEmail: String(
              ownerIdentity.email || ""
            ).toLowerCase(),
          },
        };
      });
    },
    [
      ownerIdentity,
      ownerScope,
      setMockAttemptState,
      universalContent,
    ]
  );

  const goToAttemptQuestion = useCallback(
    (testId, index, paletteRangeStart = 0) => {
      updateAttemptState(testId, (state) =>
        getGoToQuestionState(
          state,
          index,
          paletteRangeStart
        )
      );
    },
    [updateAttemptState]
  );

  const selectAttemptAnswer = useCallback(
    (testId, index, optionKey) => {
      updateAttemptState(testId, (state) =>
        getSelectAnswerState(state, index, optionKey)
      );
    },
    [updateAttemptState]
  );

  const clearAttemptResponse = useCallback(
    (testId, index) => {
      updateAttemptState(testId, (state) =>
        getClearResponseState(state, index)
      );
    },
    [updateAttemptState]
  );

  const markAttemptForReviewAndNext = useCallback(
    (testId, index, totalQuestions) => {
      updateAttemptState(testId, (state) =>
        getMarkForReviewAndNextState(
          state,
          index,
          totalQuestions
        )
      );
    },
    [updateAttemptState]
  );

  const saveAttemptAndNext = useCallback(
    (testId, index, totalQuestions) => {
      updateAttemptState(testId, (state) =>
        getSaveAndNextState(
          state,
          index,
          totalQuestions
        )
      );
    },
    [updateAttemptState]
  );

  const submitAttemptState = useCallback(
    (testId) => {
      updateAttemptState(testId, (state) =>
        getSubmitAttemptState(state)
      );
    },
    [updateAttemptState]
  );

  const updateAttemptTimeLeft = useCallback(
    (testId, timeLeft) => {
      updateAttemptState(testId, (state) =>
        getTimeLeftState(state, timeLeft)
      );
    },
    [updateAttemptState]
  );

  return {
    mockAttemptState,
    setMockAttemptState,
    updateAttemptState,
    goToAttemptQuestion,
    selectAttemptAnswer,
    clearAttemptResponse,
    markAttemptForReviewAndNext,
    saveAttemptAndNext,
    submitAttemptState,
    updateAttemptTimeLeft,
  };
};
