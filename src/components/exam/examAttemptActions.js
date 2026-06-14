export const getGoToQuestionState = (
    state = {},
    index,
    paletteRangeStart = 0
  ) => ({
    ...state,
    currentIndex: index,
    paletteRangeStart,
    visited: {
      ...(state.visited || {}),
      [index]: true,
    },
  });
  
  export const getSelectAnswerState = (
    state = {},
    index,
    optionKey
  ) => ({
    ...state,
    currentIndex: index,
    answers: {
      ...(state.answers || {}),
      [index]: optionKey,
    },
    visited: {
      ...(state.visited || {}),
      [index]: true,
    },
  });
  
  export const getClearResponseState = (state = {}, index) => ({
    ...state,
    currentIndex: index,
    answers: {
      ...(state.answers || {}),
      [index]: "",
    },
    marked: {
      ...(state.marked || {}),
      [index]: false,
    },
    visited: {
      ...(state.visited || {}),
      [index]: true,
    },
  });
  
  export const getMarkForReviewAndNextState = (
    state = {},
    index,
    totalQuestions = 0
  ) => {
    const nextIndex =
      index < totalQuestions - 1 ? index + 1 : index;
  
    return {
      ...state,
      currentIndex: nextIndex,
      marked: {
        ...(state.marked || {}),
        [index]: true,
      },
      visited: {
        ...(state.visited || {}),
        [index]: true,
        [nextIndex]: true,
      },
      paletteRangeStart: Math.floor(nextIndex / 25) * 25,
    };
  };
  
  export const getSaveAndNextState = (
    state = {},
    index,
    totalQuestions = 0
  ) => {
    const nextIndex =
      index < totalQuestions - 1 ? index + 1 : index;
  
    return {
      ...state,
      currentIndex: nextIndex,
      marked: {
        ...(state.marked || {}),
        [index]: false,
      },
      visited: {
        ...(state.visited || {}),
        [index]: true,
        [nextIndex]: true,
      },
      paletteRangeStart: Math.floor(nextIndex / 25) * 25,
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