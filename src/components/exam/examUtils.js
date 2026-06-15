const getActualQuestionIndex = (attemptState = {}, displayIndex) => {
  return attemptState.questionOrder?.[displayIndex] ?? displayIndex;
};

export const getPaletteStatusClass = (attemptState = {}, index) => {
  const actualQuestionIndex = getActualQuestionIndex(
    attemptState,
    index
  );

  const isAnswered = Boolean(
    attemptState.answers?.[actualQuestionIndex]
  );

  const isMarked = Boolean(
    attemptState.marked?.[actualQuestionIndex]
  );

  const isVisited = Boolean(
    attemptState.visited?.[actualQuestionIndex]
  );

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
    .map((_, displayIndex) => displayIndex)
    .filter((displayIndex) => {
      const actualQuestionIndex = getActualQuestionIndex(
        attemptState,
        displayIndex
      );

      const isAnswered = Boolean(
        attemptState.answers?.[actualQuestionIndex]
      );

      const isMarked = Boolean(
        attemptState.marked?.[actualQuestionIndex]
      );

      const isVisited = Boolean(
        attemptState.visited?.[actualQuestionIndex]
      );

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
  const answeredCount = questions.filter((_, displayIndex) => {
    const actualQuestionIndex = getActualQuestionIndex(
      attemptState,
      displayIndex
    );

    return attemptState.answers?.[actualQuestionIndex];
  }).length;

  const markedCount = questions.filter((_, displayIndex) => {
    const actualQuestionIndex = getActualQuestionIndex(
      attemptState,
      displayIndex
    );

    return attemptState.marked?.[actualQuestionIndex];
  }).length;

  const visitedCount = questions.filter((_, displayIndex) => {
    const actualQuestionIndex = getActualQuestionIndex(
      attemptState,
      displayIndex
    );

    return attemptState.visited?.[actualQuestionIndex];
  }).length;

  const notAnsweredCount = questions.filter(
    (_, displayIndex) => {
      const actualQuestionIndex = getActualQuestionIndex(
        attemptState,
        displayIndex
      );

      return (
        attemptState.visited?.[actualQuestionIndex] &&
        !attemptState.answers?.[actualQuestionIndex]
      );
    }
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