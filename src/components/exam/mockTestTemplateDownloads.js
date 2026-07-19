import * as XLSX from "xlsx";

export const downloadMockTestXlsxTemplate = () => {
  const testInfoRows = [
    { Field: "Test Title", Value: "Sample CTET Subject Test" },
    { Field: "Plan", Value: "PREMIUM" },
    { Field: "Exam Type", Value: "CTET" },
    { Field: "Test Type", Value: "Subject Test" },
    { Field: "Subject", Value: "Child Development & Pedagogy" },
    { Field: "Chapter", Value: "Complete CDP" },
    { Field: "Duration Minutes", Value: 200 },
    { Field: "Total Questions", Value: 2 },
    { Field: "Marks Per Question", Value: 1 },
    { Field: "Negative Marks", Value: 0 },
    { Field: "Passing Marks", Value: 0 },
    { Field: "Exam Difficulty", Value: "Mixed" },
    { Field: "Exam Language", Value: "English" },
    { Field: "Attempt Limit", Value: "unlimited" },
    { Field: "Result Publish Mode", Value: "instant" },
    { Field: "Shuffle Questions", Value: "no" },
    { Field: "Shuffle Options", Value: "no" },
    { Field: "Navigation Mode", Value: "free" },
    { Field: "Allow Pause", Value: "yes" },
    { Field: "Calculator Allowed", Value: "no" },
    { Field: "Question Source", Value: "xlsxImport" },
    { Field: "Fullscreen Mode", Value: "no" },
    { Field: "Tab Switch Detection", Value: "no" },
    { Field: "Copy Paste Protection", Value: "no" },
    { Field: "Auto Submit On Violation", Value: "no" },
    { Field: "Leaderboard Mode", Value: "disabled" },
    { Field: "Timer Mode", Value: "globalTimer" },
    { Field: "Per Question Time Value", Value: 1 },
    { Field: "Per Question Time Unit", Value: "min" },
    { Field: "Auto Submit On Time Up", Value: "yes" },
    { Field: "Schedule Type", Value: "alwaysAvailable" },
    { Field: "Exam Start Date", Value: "" },
    { Field: "Exam Start Time", Value: "" },
    { Field: "Exam End Date", Value: "" },
    { Field: "Exam End Time", Value: "" },
    { Field: "Recurring Mode", Value: "none" },
    { Field: "Weekly Test Day", Value: "" },
    { Field: "Monthly Test Date", Value: "" },
    { Field: "Live Event Mode", Value: "no" },
    { Field: "Scholarship Mode", Value: "no" },
    { Field: "Exam Instructions", Value: "" },
    { Field: "Status", Value: "draft" },
  ];

  const questionRows = [
    {
      "Question Number": 1,
      Question: "Sample question text",
      "Option A": "Option A",
      "Option B": "Option B",
      "Option C": "Option C",
      "Option D": "Option D",
      "Correct Answer": "Option A",
      Explanation: "Sample explanation",
      "Difficulty Level": "Easy",
      "Question Type": "Single Correct",
      Language: "English",
      Tag: "",
      "Positive Marks": 1,
      "Negative Marks": 0,
      "Question Status": "published",
      "Save To Question Bank": "yes",
      "Concept ID": "child_development",
      "Concept Label": "Child Development",
      "Textbook ID": "cdp_note_1",
      "Section ID": "section_1",
      "Block ID": "block_1",
      "Content Version": 1,
    },
  ];

  const testInfoSheet = XLSX.utils.json_to_sheet(testInfoRows);
  const questionsSheet = XLSX.utils.json_to_sheet(questionRows);

  testInfoSheet["!cols"] = [{ wch: 35 }, { wch: 45 }];
  questionsSheet["!cols"] = [
    { wch: 18 },
    { wch: 70 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 22 },
    { wch: 65 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
    { wch: 32 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, testInfoSheet, "Test Info");
  XLSX.utils.book_append_sheet(workbook, questionsSheet, "Questions");

  XLSX.writeFile(workbook, "mock-test-two-sheet-import-template.xlsx");
};

export const downloadMockTestCsvTemplate = () => {
  const headers = [
    "Test Title",
    "Plan",
    "Exam Type",
    "Test Type",
    "Subject",
    "Chapter",
    "Duration Minutes",
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
    "Concept ID",
    "Concept Label",
    "Textbook ID",
    "Section ID",
    "Block ID",
    "Content Version",
  ];

  const sampleRow = [
    "Sample CTET Test",
    "FREE",
    "CTET",
    "Chapter Test",
    "Child Development & Pedagogy",
    "Growth and Development",
    "30",
    "1",
    "Sample question text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option A",
    "Sample explanation",
    "Easy",
    "English",
    "1",
    "0",
    "published",
    "child_development",
    "Child Development",
    "cdp_note_1",
    "section_1",
    "block_1",
    "1",
  ];

  const safeCsvValue = (value = "") =>
    `"${value.toString().replace(/"/g, '""')}"`;

  const csvContent = [
    headers.map(safeCsvValue).join(","),
    sampleRow.map(safeCsvValue).join(","),
  ].join("\n");

  const csvBlob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const downloadUrl = URL.createObjectURL(csvBlob);

  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = "mock-test-import-template.csv";

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(downloadUrl);
};