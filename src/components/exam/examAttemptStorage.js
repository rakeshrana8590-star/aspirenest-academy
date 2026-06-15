const shuffleExamArray = (items = []) => {
  const clonedItems = [...items];

  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [clonedItems[index], clonedItems[randomIndex]] = [
      clonedItems[randomIndex],
      clonedItems[index],
    ];
  }

  return clonedItems;
};

const buildQuestionOrder = (test = {}) => {
  const defaultOrder = (test?.questions || []).map(
    (_, index) => index
  );

  if (test?.shuffleQuestions === "yes") {
    return shuffleExamArray(defaultOrder);
  }

  return defaultOrder;
};

const isValidQuestionOrder = (order, totalQuestions) => {
  if (!Array.isArray(order)) return false;
  if (order.length !== totalQuestions) return false;

  const sortedOrder = [...order].sort((a, b) => a - b);

  return sortedOrder.every(
    (item, index) => item === index
  );
};

const safeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

export const getAttemptStorageKey = (testId) =>
  `aspireExamAttempt_${testId}`;

export const createDefaultAttemptState = (
  test,
  defaultTimeLeft = 0
) => {
  const questionOrder = buildQuestionOrder(test);
  const firstActualQuestionIndex = questionOrder[0] ?? 0;

  return {
    testId: test?.id || "",
    currentIndex: 0,
    questionOrder,
    answers: {},
    marked: {},
    visited: {
      [firstActualQuestionIndex]: true,
    },
    paletteRangeStart: 0,
    timeLeft: defaultTimeLeft,
    startedAt: Date.now(),
    submittedAt: null,
    isSubmitted: false,
  };
};

export const saveAttemptState = (testId, state) => {
  if (!testId || !state) return;

  try {
    localStorage.setItem(
      getAttemptStorageKey(testId),
      JSON.stringify(state)
    );
  } catch {
    // Storage can fail in private mode or full quota.
  }
};

export const restoreAttemptState = (
  test,
  defaultTimeLeft = 0
) => {
  const baseState = createDefaultAttemptState(
    test,
    defaultTimeLeft
  );

  if (!test?.id) {
    return baseState;
  }

  try {
    const saved = localStorage.getItem(
      getAttemptStorageKey(test.id)
    );

    if (!saved) {
      return baseState;
    }

    const parsedState = JSON.parse(saved) || {};
    const totalQuestions = test?.questions?.length || 0;

    const questionOrder = isValidQuestionOrder(
      parsedState.questionOrder,
      totalQuestions
    )
      ? parsedState.questionOrder
      : baseState.questionOrder;

    const safeCurrentIndex = Number.isInteger(
      parsedState.currentIndex
    )
      ? Math.min(
          Math.max(parsedState.currentIndex, 0),
          Math.max(totalQuestions - 1, 0)
        )
      : baseState.currentIndex;

    const currentActualQuestionIndex =
      questionOrder[safeCurrentIndex] ?? safeCurrentIndex;

    const visited = {
      ...safeObject(parsedState.visited),
    };

    if (!Object.keys(visited).length) {
      visited[currentActualQuestionIndex] = true;
    }

    return {
      ...baseState,
      ...parsedState,
      testId: test.id,
      currentIndex: safeCurrentIndex,
      questionOrder,
      answers: safeObject(parsedState.answers),
      marked: safeObject(parsedState.marked),
      visited,
      paletteRangeStart: Number.isInteger(
        parsedState.paletteRangeStart
      )
        ? parsedState.paletteRangeStart
        : baseState.paletteRangeStart,
      timeLeft: Number.isFinite(Number(parsedState.timeLeft))
        ? Number(parsedState.timeLeft)
        : baseState.timeLeft,
      isSubmitted: parsedState.isSubmitted === true,
      submittedAt: parsedState.submittedAt || null,
      startedAt: parsedState.startedAt || baseState.startedAt,
    };
  } catch {
    return baseState;
  }
};