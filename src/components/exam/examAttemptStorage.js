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
  
  export const getAttemptStorageKey = (testId) =>
    `aspireExamAttempt_${testId}`;
  
  export const createDefaultAttemptState = (
    test,
    defaultTimeLeft = 0
  ) => ({
    testId: test?.id || "",
    currentIndex: 0,
    questionOrder:
      test?.shuffleQuestions === "yes"
        ? shuffleExamArray(
            (test?.questions || []).map((_, index) => index)
          )
        : (test?.questions || []).map((_, index) => index),
    answers: {},
    marked: {},
    visited: { 0: true },
    paletteRangeStart: 0,
    timeLeft: defaultTimeLeft,
    startedAt: Date.now(),
    submittedAt: null,
    isSubmitted: false,
  });
  
  export const saveAttemptState = (testId, state) => {
    if (!testId || !state) return;
  
    localStorage.setItem(
      getAttemptStorageKey(testId),
      JSON.stringify(state)
    );
  };
  
  export const restoreAttemptState = (
    test,
    defaultTimeLeft = 0
  ) => {
    if (!test?.id) {
      return createDefaultAttemptState(test, defaultTimeLeft);
    }
  
    try {
      const saved = localStorage.getItem(
        getAttemptStorageKey(test.id)
      );
  
      if (!saved) {
        return createDefaultAttemptState(test, defaultTimeLeft);
      }
  
      return {
        ...createDefaultAttemptState(test, defaultTimeLeft),
        ...JSON.parse(saved),
        testId: test.id,
      };
    } catch {
      return createDefaultAttemptState(test, defaultTimeLeft);
    }
  };

