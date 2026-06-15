const getActualQuestionIndex = (state = {}, displayIndex) => {
  return state.questionOrder?.[displayIndex] ?? displayIndex;
};

const getDisplayIndexFromActual = (
  state = {},
  actualQuestionIndex
) => {
  const questionOrder = state.questionOrder || [];

  if (!questionOrder.length) {
    return actualQuestionIndex;
  }

  const displayIndex = questionOrder.indexOf(actualQuestionIndex);

  return displayIndex === -1 ? actualQuestionIndex : displayIndex;
};

export const getGoToQuestionState = (
  state = {},
  displayIndex,
  paletteRangeStart = 0
) => {
  const actualQuestionIndex = getActualQuestionIndex(
    state,
    displayIndex
  );

  return {
    ...state,
    currentIndex: displayIndex,
    paletteRangeStart,
    visited: {
      ...(state.visited || {}),
      [actualQuestionIndex]: true,
    },
  };
};

export const getSelectAnswerState = (
  state = {},
  actualQuestionIndex,
  optionKey
) => {
  const displayIndex = getDisplayIndexFromActual(
    state,
    actualQuestionIndex
  );

  return {
    ...state,
    currentIndex: displayIndex,
    answers: {
      ...(state.answers || {}),
      [actualQuestionIndex]: optionKey,
    },
    visited: {
      ...(state.visited || {}),
      [actualQuestionIndex]: true,
    },
  };
};

export const getClearResponseState = (
  state = {},
  actualQuestionIndex
) => {
  const displayIndex = getDisplayIndexFromActual(
    state,
    actualQuestionIndex
  );

  return {
    ...state,
    currentIndex: displayIndex,
    answers: {
      ...(state.answers || {}),
      [actualQuestionIndex]: "",
    },
    marked: {
      ...(state.marked || {}),
      [actualQuestionIndex]: false,
    },
    visited: {
      ...(state.visited || {}),
      [actualQuestionIndex]: true,
    },
  };
};

export const getMarkForReviewAndNextState = (
  state = {},
  actualQuestionIndex,
  totalQuestions = 0
) => {
  const displayIndex = getDisplayIndexFromActual(
    state,
    actualQuestionIndex
  );

  const nextDisplayIndex =
    displayIndex < totalQuestions - 1
      ? displayIndex + 1
      : displayIndex;

  const nextActualQuestionIndex = getActualQuestionIndex(
    state,
    nextDisplayIndex
  );

  return {
    ...state,
    currentIndex: nextDisplayIndex,
    marked: {
      ...(state.marked || {}),
      [actualQuestionIndex]: true,
    },
    visited: {
      ...(state.visited || {}),
      [actualQuestionIndex]: true,
      [nextActualQuestionIndex]: true,
    },
    paletteRangeStart:
      Math.floor(nextDisplayIndex / 25) * 25,
  };
};

export const getSaveAndNextState = (
  state = {},
  actualQuestionIndex,
  totalQuestions = 0
) => {
  const displayIndex = getDisplayIndexFromActual(
    state,
    actualQuestionIndex
  );

  const nextDisplayIndex =
    displayIndex < totalQuestions - 1
      ? displayIndex + 1
      : displayIndex;

  const nextActualQuestionIndex = getActualQuestionIndex(
    state,
    nextDisplayIndex
  );

  return {
    ...state,
    currentIndex: nextDisplayIndex,
    marked: {
      ...(state.marked || {}),
      [actualQuestionIndex]: false,
    },
    visited: {
      ...(state.visited || {}),
      [actualQuestionIndex]: true,
      [nextActualQuestionIndex]: true,
    },
    paletteRangeStart:
      Math.floor(nextDisplayIndex / 25) * 25,
  };
};

export const getSubmitAttemptState = (state = {}) => ({
  ...state,
  submittedAt: Date.now(),
  isSubmitted: true,
});

export const getTimeLeftState = (state = {}, timeLeft = 0) => ({
  ...state,
  timeLeft,
});