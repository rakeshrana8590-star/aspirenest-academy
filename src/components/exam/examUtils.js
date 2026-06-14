export const getPaletteStatusClass = (attemptState = {}, index) => {
    const isAnswered = Boolean(attemptState.answers?.[index]);
    const isMarked = Boolean(attemptState.marked?.[index]);
    const isVisited = Boolean(attemptState.visited?.[index]);
  
    if (isAnswered && isMarked) {
      return "paletteAnsweredReview";
    }
  
    if (!isAnswered && isMarked) {
      return "paletteMarked";
    }
  
    if (isAnswered && !isMarked) {
      return "paletteAnswered";
    }
  
    if (isVisited && !isAnswered) {
      return "paletteNotAnswered";
    }
  
    return "paletteNotVisited";
  };
  
  export const getFilteredQuestionIndexes = (
    questions = [],
    attemptState = {},
    filterType = "all"
  ) => {
    return questions
      .map((_, index) => index)
      .filter((index) => {
        const isAnswered = Boolean(attemptState.answers?.[index]);
        const isMarked = Boolean(attemptState.marked?.[index]);
        const isVisited = Boolean(attemptState.visited?.[index]);
  
        if (filterType === "answered") {
          return isAnswered;
        }
  
        if (filterType === "review") {
          return isMarked;
        }
  
        if (filterType === "notAnswered") {
          return isVisited && !isAnswered;
        }
  
        if (filterType === "notVisited") {
          return !isVisited;
        }
  
        return true;
      });
  };
  
  export const formatExamTime = (seconds = 0) => {
    const safeSeconds = Math.max(0, Number(seconds || 0));
  
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
  
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };
  
  export const getExamTimerSeconds = (test = {}) => {
    const getTimerSeconds = (value, unit) => {
      const numericValue = Number(value || 1);
  
      if (unit === "hr") return numericValue * 60 * 60;
      if (unit === "min") return numericValue * 60;
  
      return numericValue;
    };
  
    if (test.timerMode === "perQuestionTimer") {
      return getTimerSeconds(
        test.perQuestionTimeValue,
        test.perQuestionTimeUnit
      );
    }
  
    return Number(test.durationMinutes || test.duration || 30) * 60;
  };
  
  export const getExamQuestionCounts = (
    questions = [],
    attemptState = {}
  ) => {
    const answeredCount = questions.filter(
      (_, index) => attemptState.answers?.[index]
    ).length;
  
    const markedCount = questions.filter(
      (_, index) => attemptState.marked?.[index]
    ).length;
  
    const visitedCount = questions.filter(
      (_, index) => attemptState.visited?.[index]
    ).length;
  
    const notAnsweredCount = questions.filter(
      (_, index) =>
        attemptState.visited?.[index] &&
        !attemptState.answers?.[index]
    ).length;
  
    const notVisitedCount = Math.max(
      0,
      questions.length - visitedCount
    );
  
    return {
      answeredCount,
      markedCount,
      visitedCount,
      notAnsweredCount,
      notVisitedCount,
    };
  };