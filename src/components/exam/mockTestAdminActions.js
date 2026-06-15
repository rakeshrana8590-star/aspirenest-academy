import * as XLSX from "xlsx";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    updateDoc,
  } from "firebase/firestore";

import { db } from "../../firebase";

export const duplicateMockTestAsDraft = async ({
  test,
  reloadContent,
}) => {
  if (!test?.id) {
    return false;
  }

  const clonePayload = {
    ...test,
    title: `${test.title || "Mock Test"} - Copy`,
    status: "draft",
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    clonedFrom: test.id,
  };

  delete clonePayload.id;

  await addDoc(collection(db, "contentItems"), clonePayload);

  if (typeof reloadContent === "function") {
    await reloadContent();
  }

  return true;
};

export const updateMockTestStatus = async ({
    test,
    status,
    reloadContent,
    extraFields = {},
  }) => {
    if (!test?.id || !status) {
      return false;
    }
  
    await updateDoc(doc(db, "contentItems", test.id), {
      status,
      ...extraFields,
      updatedAt: new Date(),
    });
  
    if (typeof reloadContent === "function") {
      await reloadContent();
    }
  
    return true;
  };
  
  export const toggleMockTestFeatured = async ({
    test,
    reloadContent,
  }) => {
    if (!test?.id) {
      return false;
    }
  
    await updateDoc(doc(db, "contentItems", test.id), {
      isFeatured: !test.isFeatured,
      updatedAt: new Date(),
    });
  
    if (typeof reloadContent === "function") {
      await reloadContent();
    }
  
    return true;
  };

  export const buildMockTestStartLink = ({
    test,
    origin = window.location.origin,
  }) => {
    if (!test?.id) {
      return "";
    }
  
    return `${origin}/ctet-tet/mock-tests/start/${test.id}`;
  };
  
  export const copyMockTestStartLink = async ({ test }) => {
    const link = buildMockTestStartLink({ test });
  
    if (!link) {
      return false;
    }
  
    await navigator.clipboard.writeText(link);
  
    return true;
  };

  export const deleteMockTest = async ({
    test,
    reloadContent,
  }) => {
    if (!test?.id) {
      return false;
    }
  
    await deleteDoc(doc(db, "contentItems", test.id));
  
    if (typeof reloadContent === "function") {
      await reloadContent();
    }
  
    return true;
  };

  const getSafeMockTestFileName = (title = "mock-test") =>
  title
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "mock-test";

export const exportMockTestJson = ({ test }) => {
  if (!test?.id) {
    return false;
  }

  const exportPayload = {
    ...test,
    exportedAt: new Date().toISOString(),
    exportedFrom: "AspireNest Academy",
  };

  const jsonBlob = new Blob(
    [JSON.stringify(exportPayload, null, 2)],
    { type: "application/json" }
  );

  const downloadUrl = URL.createObjectURL(jsonBlob);

  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `${getSafeMockTestFileName(
    test.title || "mock-test"
  )}.json`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(downloadUrl);

  return true;
};

export const exportMockTestCsv = ({ test }) => {
    if (!test?.id) {
      return false;
    }
  
    const questions = test.questions || [];
  
    if (questions.length === 0) {
      return false;
    }
  
    const cleanText = (value = "") =>
      value
        ?.toString()
        .replace(/\r?\n|\r/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "";
  
    const safeCsvValue = (value = "") => {
      const text = cleanText(value).replace(/"/g, '""');
      return `"${text}"`;
    };
  
    const headers = [
      "Test Title",
      "Plan",
      "Exam Type",
      "Test Type",
      "Subject",
      "Chapter",
      "Duration Minutes",
      "Total Questions",
      "Question Number",
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
      "Explanation",
      "Difficulty Level",
      "Language",
      "Positive Marks",
      "Negative Marks",
      "Question Status",
    ];
  
    const rows = questions.map((question, index) => [
      test.title || "",
      test.planType || "FREE",
      test.examType || "",
      test.testType || "",
      test.subject || "",
      test.chapter || "",
      test.duration || test.durationMinutes || "",
      test.totalQuestions || questions.length,
      question.questionNumber || index + 1,
      question.question || "",
      question.option1 || "",
      question.option2 || "",
      question.option3 || "",
      question.option4 || "",
      question.answer || "",
      question.explanation || "",
      question.level || "",
      question.language || "",
      question.positiveMarks || test.marksPerQuestion || "",
      question.negativeMarks || test.negativeMarks || "0",
      question.questionStatus || test.status || "",
    ]);
  
    const csvContent = [
      headers.map(safeCsvValue).join(","),
      ...rows.map((row) => row.map(safeCsvValue).join(",")),
    ].join("\n");
  
    const csvBlob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
  
    const downloadUrl = URL.createObjectURL(csvBlob);
  
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${getSafeMockTestFileName(
      test.title || "mock-test"
    )}-questions.csv`;
  
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  
    URL.revokeObjectURL(downloadUrl);
  
    return true;
  };

  export const exportMockTestExcel = ({ test }) => {
    if (!test?.id) {
      return false;
    }
  
    const questions = test.questions || [];
  
    if (questions.length === 0) {
      return false;
    }
  
    const escapeHtml = (value = "") =>
      value
        ?.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;") || "";
  
    const headers = [
      "Test Title",
      "Plan",
      "Exam Type",
      "Test Type",
      "Subject",
      "Chapter",
      "Duration Minutes",
      "Total Questions",
      "Question Number",
      "Question",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer",
      "Explanation",
      "Difficulty Level",
      "Language",
      "Positive Marks",
      "Negative Marks",
      "Question Status",
    ];
  
    const rows = questions.map((question, index) => [
      test.title || "",
      test.planType || "FREE",
      test.examType || "",
      test.testType || "",
      test.subject || "",
      test.chapter || "",
      test.duration || test.durationMinutes || "",
      test.totalQuestions || questions.length,
      question.questionNumber || index + 1,
      question.question || "",
      question.option1 || "",
      question.option2 || "",
      question.option3 || "",
      question.option4 || "",
      question.answer || "",
      question.explanation || "",
      question.level || "",
      question.language || "",
      question.positiveMarks || test.marksPerQuestion || "",
      question.negativeMarks || test.negativeMarks || "0",
      question.questionStatus || test.status || "",
    ]);
  
    const tableHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>
                ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      ${row
                        .map((cell) => `<td>${escapeHtml(cell)}</td>`)
                        .join("")}
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
  
    const excelBlob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
  
    const downloadUrl = URL.createObjectURL(excelBlob);
  
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${getSafeMockTestFileName(
      test.title || "mock-test"
    )}-questions.xls`;
  
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  
    URL.revokeObjectURL(downloadUrl);
  
    return true;
  };

  export const exportMockTestXlsx = ({ test }) => {
    if (!test?.id) {
      return false;
    }
  
    const questions = test.questions || [];
  
    if (questions.length === 0) {
      return false;
    }
  
    const rows = questions.map((question, index) => ({
      "Test Title": test.title || "",
      Plan: test.planType || "FREE",
      "Exam Type": test.examType || "",
      "Test Type": test.testType || "",
      Subject: test.subject || "",
      Chapter: test.chapter || "",
      "Duration Minutes": test.duration || test.durationMinutes || "",
      "Total Questions": test.totalQuestions || questions.length,
      "Question Number": question.questionNumber || index + 1,
      Question: question.question || "",
      "Option A": question.option1 || "",
      "Option B": question.option2 || "",
      "Option C": question.option3 || "",
      "Option D": question.option4 || "",
      "Correct Answer": question.answer || "",
      Explanation: question.explanation || "",
      "Difficulty Level": question.level || "",
      Language: question.language || "",
      "Positive Marks":
        question.positiveMarks || test.marksPerQuestion || "",
      "Negative Marks":
        question.negativeMarks || test.negativeMarks || "0",
      "Question Status": question.questionStatus || test.status || "",
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(rows);
  
    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 28 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 60 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 22 },
      { wch: 60 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ];
  
    const workbook = XLSX.utils.book_new();
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  
    XLSX.writeFile(
      workbook,
      `${getSafeMockTestFileName(test.title || "mock-test")}-questions.xlsx`
    );
  
    return true;
  };