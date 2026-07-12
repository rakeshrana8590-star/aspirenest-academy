import * as XLSX from "xlsx";
import { addDoc, collection } from "firebase/firestore";

import { db } from "../../firebase";
import { normalizeExamQuestion } from "./examAnswerUtils.js";

export const convertGoogleDriveUrlToDownloadUrl = (url = "") => {
  const fileIdMatch =
    url.match(/\/d\/([^/]+)/) ||
    url.match(/[?&]id=([^&]+)/);

  if (!fileIdMatch?.[1]) {
    return url;
  }

  return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
};

export const importMockTestJsonAsDraft = async ({
  importedTest,
  reloadContent,
}) => {
  if (!importedTest?.title || !importedTest?.questions?.length) {
    return false;
  }

  const normalizedQuestions = importedTest.questions.map((question) =>
    normalizeExamQuestion(question)
  );

  const importPayload = {
    ...importedTest,
    questions: normalizedQuestions,
    title: `${importedTest.title} - Imported`,
    section: "mockTest",
    contentType: "MOCK",
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  delete importPayload.id;

  await addDoc(collection(db, "contentItems"), importPayload);

  if (typeof reloadContent === "function") {
    await reloadContent();
  }

  return true;
};

const MAX_IMPORT_QUESTIONS = 1000;

const REQUIRED_QUESTION_COLUMNS = [
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
];

const getTestInfoMap = (testInfoRows = []) =>
  testInfoRows.reduce((acc, row) => {
    const field = row.Field?.toString().trim();
    const value = row.Value;

    if (field) {
      acc[field] = value;
    }

    return acc;
  }, {});

const buildImportedQuestionsFromRows = ({
  questionRows = [],
  testInfo = {},
}) =>
  questionRows.map((row, index) =>
    normalizeExamQuestion({
    questionNumber: Number(row["Question Number"] || index + 1),
    question: row["Question"]?.toString().trim() || "",
    option1: row["Option A"]?.toString().trim() || "",
    option2: row["Option B"]?.toString().trim() || "",
    option3: row["Option C"]?.toString().trim() || "",
    option4: row["Option D"]?.toString().trim() || "",
    answer: row["Correct Answer"]?.toString().trim() || "",
    explanation: row["Explanation"]?.toString().trim() || "",
    level:
      row["Difficulty Level"]?.toString().trim() ||
      testInfo["Exam Difficulty"]?.toString().trim() ||
      "Easy",
    questionType:
      row["Question Type"]?.toString().trim() || "Single Correct",
    language:
      row["Language"]?.toString().trim() ||
      testInfo["Exam Language"]?.toString().trim() ||
      "English",
    tag: row["Tag"]?.toString().trim() || "",
    positiveMarks: Number(
      row["Positive Marks"] || testInfo["Marks Per Question"] || 1
    ),
    negativeMarks: Number(
      row["Negative Marks"] || testInfo["Negative Marks"] || 0
    ),
    questionStatus:
      row["Question Status"]?.toString().trim() || "published",
    saveToQuestionBank:
      row["Save To Question Bank"]?.toString().trim() || "yes",
    })
  );

const validateImportedQuestions = (importedQuestions = []) =>
  importedQuestions.findIndex(
    (question) =>
      !question.question ||
      !question.option1 ||
      !question.option2 ||
      !question.option3 ||
      !question.option4 ||
      !question.answer
  );

  const buildMockTestImportPayload = ({
    title,
    testInfo = {},
    importedQuestions = [],
    sourceType = "xlsxImport",
    sourceXlsxUrl = "",
  }) => {
    const totalQuestions = importedQuestions.length;
  
    const totalMarks = importedQuestions.reduce(
      (sum, question) => sum + Number(question.positiveMarks || 0),
      0
    );
  
    return {
      title: `${title} - Imported`,
      section: "mockTest",
      contentType: "MOCK",
  
      planType: testInfo["Plan"]?.toString().trim() || "FREE",
      examType: testInfo["Exam Type"]?.toString().trim() || "CTET",
      testType:
        testInfo["Test Type"]?.toString().trim() || "Chapter Test",
  
      subject: testInfo["Subject"]?.toString().trim() || "",
      chapter: testInfo["Chapter"]?.toString().trim() || "",
  
      duration: Number(testInfo["Duration Minutes"] || 30),
      durationMinutes: Number(testInfo["Duration Minutes"] || 30),
  
      totalQuestions,
      marksPerQuestion: Number(testInfo["Marks Per Question"] || 1),
      negativeMarks: Number(testInfo["Negative Marks"] || 0),
      passingMarks: Number(testInfo["Passing Marks"] || 0),
  
      examDifficulty:
        testInfo["Exam Difficulty"]?.toString().trim() || "Mixed",
      examLanguage:
        testInfo["Exam Language"]?.toString().trim() || "English",
  
      attemptLimit:
        testInfo["Attempt Limit"]?.toString().trim() || "unlimited",
      resultPublishMode: ["instant", "afterSubmission", "manual"].includes(
        testInfo["Result Publish Mode"]?.toString().trim()
      )
        ? testInfo["Result Publish Mode"].toString().trim()
        : "instant",
  
      shuffleQuestions:
        testInfo["Shuffle Questions"]?.toString().trim() || "no",
      shuffleOptions:
        testInfo["Shuffle Options"]?.toString().trim() || "no",
  
      navigationMode:
        testInfo["Navigation Mode"]?.toString().trim() || "free",
      allowPause:
        testInfo["Allow Pause"]?.toString().trim() || "yes",
      calculatorAllowed:
        testInfo["Calculator Allowed"]?.toString().trim() || "no",
  
      questionSource: sourceType,
      ...(sourceXlsxUrl ? { sourceXlsxUrl } : {}),
  
      fullscreenMode:
        testInfo["Fullscreen Mode"]?.toString().trim() || "no",
      tabSwitchDetection:
        testInfo["Tab Switch Detection"]?.toString().trim() || "no",
      copyPasteProtection:
        testInfo["Copy Paste Protection"]?.toString().trim() || "no",
      autoSubmitOnViolation:
        testInfo["Auto Submit On Violation"]?.toString().trim() || "no",
  
      leaderboardMode:
        testInfo["Leaderboard Mode"]?.toString().trim() || "disabled",
  
      timerMode:
        testInfo["Timer Mode"]?.toString().trim() || "globalTimer",
      perQuestionTimeValue:
        testInfo["Per Question Time Value"]?.toString().trim() || "1",
      perQuestionTimeUnit:
        testInfo["Per Question Time Unit"]?.toString().trim() || "min",
      autoSubmitOnTimeUp:
        testInfo["Auto Submit On Time Up"]?.toString().trim() || "yes",
  
      scheduleType:
        testInfo["Schedule Type"]?.toString().trim() ||
        "alwaysAvailable",
      examStartDate:
        testInfo["Exam Start Date"]?.toString().trim() || "",
      examStartTime:
        testInfo["Exam Start Time"]?.toString().trim() || "",
      examEndDate:
        testInfo["Exam End Date"]?.toString().trim() || "",
      examEndTime:
        testInfo["Exam End Time"]?.toString().trim() || "",
  
      recurringMode:
        testInfo["Recurring Mode"]?.toString().trim() || "none",
      weeklyTestDay:
        testInfo["Weekly Test Day"]?.toString().trim() || "",
      monthlyTestDate:
        testInfo["Monthly Test Date"]?.toString().trim() || "",
  
      liveEventMode:
        testInfo["Live Event Mode"]?.toString().trim() || "no",
      scholarshipMode:
        testInfo["Scholarship Mode"]?.toString().trim() || "no",
  
      examInstructions:
        testInfo["Exam Instructions"]?.toString().trim() || "",
  
      status: "draft",
  
      totalMarks,
      questions: importedQuestions,
  
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  export const buildMockTestImportPayloadFromRows = ({
    testInfoRows = [],
    questionRows = [],
    sourceType = "xlsxImport",
    sourceXlsxUrl = "",
  }) => {
    if (!testInfoRows.length) {
      return {
        ok: false,
        message: "Test Info sheet is empty.",
      };
    }
  
    if (!questionRows.length) {
      return {
        ok: false,
        message: "Questions sheet is empty.",
      };
    }
  
    if (questionRows.length > MAX_IMPORT_QUESTIONS) {
      return {
        ok: false,
        message: `Maximum ${MAX_IMPORT_QUESTIONS} questions allowed per import. Please split bigger exams into parts.`,
      };
    }
  
    const missingQuestionColumns = REQUIRED_QUESTION_COLUMNS.filter(
      (column) => !(column in questionRows[0])
    );
  
    if (missingQuestionColumns.length > 0) {
      return {
        ok: false,
        message: `Missing required question column(s): ${missingQuestionColumns.join(
          ", "
        )}`,
      };
    }
  
    const testInfo = getTestInfoMap(testInfoRows);
  
    const importedQuestions = buildImportedQuestionsFromRows({
      questionRows,
      testInfo,
    });
  
    const invalidQuestionIndex =
      validateImportedQuestions(importedQuestions);
  
    if (invalidQuestionIndex !== -1) {
      return {
        ok: false,
        message: `Question ${
          invalidQuestionIndex + 1
        } is incomplete. Import cancelled.`,
      };
    }
  
    const title =
      testInfo["Test Title"]?.toString().trim() ||
      (sourceType === "googleDriveXlsxUrl"
        ? "Imported Drive XLSX Mock Test"
        : "Imported XLSX Mock Test");
  
    const totalQuestions = importedQuestions.length;
  
    const declaredTotalQuestions = Number(
      testInfo["Total Questions"] || totalQuestions
    );
  
    if (
      Number.isFinite(declaredTotalQuestions) &&
      declaredTotalQuestions > 0 &&
      declaredTotalQuestions !== totalQuestions
    ) {
      return {
        ok: false,
        message: `Total Questions mismatch.
  
  Test Info says: ${declaredTotalQuestions}
  
  Questions sheet has: ${totalQuestions}
  
  Please fix the Excel file and import again.`,
      };
    }
  
    const importPayload = buildMockTestImportPayload({
      title,
      testInfo,
      importedQuestions,
      sourceType,
      sourceXlsxUrl,
    });
  
    return {
      ok: true,
      title,
      totalQuestions,
      totalMarks: importPayload.totalMarks,
      importPayload,
    };
  };
  export const readMockTestWorkbookRowsFromArrayBuffer = (data) => {
    const workbook = XLSX.read(data, {
      type: "array",
    });
  
    const testInfoSheet = workbook.Sheets["Test Info"];
    const questionsSheet = workbook.Sheets["Questions"];
  
    if (!testInfoSheet || !questionsSheet) {
      return {
        ok: false,
        message:
          "Invalid template. File must contain 'Test Info' and 'Questions' sheets.",
      };
    }
  
    const testInfoRows = XLSX.utils.sheet_to_json(testInfoSheet, {
      defval: "",
    });
  
    const questionRows = XLSX.utils.sheet_to_json(questionsSheet, {
      defval: "",
    });
  
    return {
      ok: true,
      testInfoRows,
      questionRows,
    };
  };
