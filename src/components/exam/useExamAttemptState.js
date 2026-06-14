import { useState } from "react";
import {
  restoreAttemptState,
  saveAttemptState,
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

export const useExamAttemptState = (universalContent = []) => {
  const [mockAttemptState, setMockAttemptState] = useState({});

  const updateAttemptState = (testId, updater) => {
    if (!testId || typeof updater !== "function") return;

    setMockAttemptState((prev) => {
      const activeTest = universalContent.find(
        (item) =>
          item.section === "mockTest" &&
          item.id === testId
      );

      const currentState =
        prev[testId] || restoreAttemptState(activeTest, 0);

      const nextState = updater(currentState);

      saveAttemptState(testId, nextState);

      return {
        ...prev,
        [testId]: nextState,
      };
    });
  };

  const goToAttemptQuestion = (
    testId,
    index,
    paletteRangeStart = 0
  ) => {
    updateAttemptState(testId, (state) =>
      getGoToQuestionState(state, index, paletteRangeStart)
    );
  };

  const selectAttemptAnswer = (testId, index, optionKey) => {
    updateAttemptState(testId, (state) =>
      getSelectAnswerState(state, index, optionKey)
    );
  };

  const clearAttemptResponse = (testId, index) => {
    updateAttemptState(testId, (state) =>
      getClearResponseState(state, index)
    );
  };

  const markAttemptForReviewAndNext = (
    testId,
    index,
    totalQuestions
  ) => {
    updateAttemptState(testId, (state) =>
      getMarkForReviewAndNextState(
        state,
        index,
        totalQuestions
      )
    );
  };

  const saveAttemptAndNext = (
    testId,
    index,
    totalQuestions
  ) => {
    updateAttemptState(testId, (state) =>
      getSaveAndNextState(state, index, totalQuestions)
    );
  };

  const submitAttemptState = (testId) => {
    updateAttemptState(testId, (state) =>
      getSubmitAttemptState(state)
    );
  };

  const updateAttemptTimeLeft = (testId, timeLeft) => {
    updateAttemptState(testId, (state) =>
      getTimeLeftState(state, timeLeft)
    );
  };

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