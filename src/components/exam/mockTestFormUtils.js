export const createEmptyMockQuestion = () => ({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    answer: "",
    explanation: "",
    level: "Easy",
    questionType: "Single Correct",
    language: "English",
    tag: "",
    positiveMarks: "1",
    negativeMarks: "0",
    questionstatus: "draft",
    saveToQuestionBank: "yes",
  });
  
  export const createDefaultMockTestForm = () => ({
    title: "",
    planType: "FREE",
    subject: "",
    chapter: "",
    examType: "CTET",
    testType: "Chapter Test",
  
    duration: "30",
    totalQuestions: "10",
    marksPerQuestion: "1",
    negativeMarks: "0",
    passingMarks: "0",
  
    examDifficulty: "Mixed",
    examLanguage: "English",
  
    attemptLimit: "unlimited",
    resultPublishMode: "instant",
  
    shuffleQuestions: "no",
    shuffleOptions: "no",
  
    navigationMode: "free",
    allowPause: "yes",
    calculatorAllowed: "no",
  
    questionSource: "manual",
  
    fullscreenMode: "no",
    tabSwitchDetection: "no",
    copyPasteProtection: "no",
    autoSubmitOnViolation: "no",
  
    leaderboardMode: "disabled",
  
    timerMode: "globalTimer",
    perQuestionTimeValue: "1",
    perQuestionTimeUnit: "min",
    autoSubmitOnTimeUp: "yes",
  
    scheduleType: "alwaysAvailable",
    examStartDate: "",
    examStartTime: "",
    examEndDate: "",
    examEndTime: "",
  
    recurringMode: "none",
    weeklyTestDay: "",
    monthlyTestDate: "",
  
    liveEventMode: "no",
    scholarshipMode: "no",
  
    examInstructions: "",
  
    status: "published",
  });
  
  export const buildMockTestFormFromTest = (test = {}) => ({
    title: test.title || "",
    planType: test.planType || "FREE",
    subject: test.subject || "",
    chapter: test.chapter || "",
    examType: test.examType || "CTET",
    testType: test.testType || "Chapter Test",
  
    duration:
      test.duration?.toString() ||
      test.durationMinutes?.toString() ||
      "30",
  
    totalQuestions:
      test.totalQuestions?.toString() ||
      test.questions?.length?.toString() ||
      "10",
  
    marksPerQuestion: test.marksPerQuestion?.toString() || "1",
    negativeMarks: test.negativeMarks?.toString() || "0",
    passingMarks: test.passingMarks?.toString() || "0",
  
    examDifficulty: test.examDifficulty || "Mixed",
    examLanguage: test.examLanguage || "English",
  
    attemptLimit: test.attemptLimit || "unlimited",
    resultPublishMode: test.resultPublishMode || "instant",
  
    shuffleQuestions: test.shuffleQuestions || "no",
    shuffleOptions: test.shuffleOptions || "no",
  
    navigationMode: test.navigationMode || "free",
    allowPause: test.allowPause || "yes",
    calculatorAllowed: test.calculatorAllowed || "no",
  
    questionSource: test.questionSource || "manual",
  
    fullscreenMode: test.fullscreenMode || "no",
    tabSwitchDetection: test.tabSwitchDetection || "no",
    copyPasteProtection: test.copyPasteProtection || "no",
    autoSubmitOnViolation: test.autoSubmitOnViolation || "no",
  
    leaderboardMode: test.leaderboardMode || "disabled",
  
    timerMode: test.timerMode || "globalTimer",
    perQuestionTimeValue: test.perQuestionTimeValue || "1",
    perQuestionTimeUnit: test.perQuestionTimeUnit || "min",
    autoSubmitOnTimeUp: test.autoSubmitOnTimeUp || "yes",
  
    scheduleType: test.scheduleType || "alwaysAvailable",
    examStartDate: test.examStartDate || "",
    examStartTime: test.examStartTime || "",
    examEndDate: test.examEndDate || "",
    examEndTime: test.examEndTime || "",
  
    recurringMode: test.recurringMode || "none",
    weeklyTestDay: test.weeklyTestDay || "",
    monthlyTestDate: test.monthlyTestDate || "",
  
    liveEventMode: test.liveEventMode || "no",
    scholarshipMode: test.scholarshipMode || "no",
  
    examInstructions: test.examInstructions || "",
  
    status: test.status || "draft",
  });
  
  export const buildMockTestQuestionsFormFromTest = (test = {}) =>
    test.questions?.length
      ? test.questions.map((question) => ({
          question: question.question || "",
          option1: question.option1 || "",
          option2: question.option2 || "",
          option3: question.option3 || "",
          option4: question.option4 || "",
          answer: question.answer || "",
          explanation: question.explanation || "",
          level: question.level || "Easy",
          questionType: question.questionType || "Single Correct",
          language: question.language || "English",
          tag: question.tag || "",
          positiveMarks: question.positiveMarks?.toString() || "1",
          negativeMarks: question.negativeMarks?.toString() || "0",
          questionStatus: question.questionStatus || "published",
          saveToQuestionBank: question.saveToQuestionBank || "yes",
        }))
      : [createEmptyMockQuestion()];