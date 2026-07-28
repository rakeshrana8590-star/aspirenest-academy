import fs from "fs";
import path from "path";

const cssPath = path.join(__dirname, "examLayoutLock.css");
const css = fs.readFileSync(cssPath, "utf8");
const attempt = fs.readFileSync(
  path.join(__dirname, "../../components/exam/ExamAttemptRoute.jsx"),
  "utf8"
);
const importUtils = fs.readFileSync(
  path.join(__dirname, "../../components/exam/mockTestImportUtils.js"),
  "utf8"
);
const templateUtils = fs.readFileSync(
  path.join(__dirname, "../../components/exam/mockTestTemplateDownloads.js"),
  "utf8"
);

describe("AspireNest Drive-style Mock Test visual contract", () => {
  test("applies one continuous Drive visual language from library through admin and exam focus mode", () => {
    expect(css).toContain("ASPIRENEST MOCK TEST — LEARNING DRIVE EXPERIENCE v1");
    expect(css).toContain(".mockStudentPage");
    expect(css).toContain(".examStartPage");
    expect(css).toContain(".premiumExamPage");
    expect(css).toContain(".examResultPage");
    expect(css).toContain(".reviewSummaryGrid");
    expect(css).toContain(".adminMockHomePage");
    expect(css).toContain("--an-drive-navy-900");
    expect(css).toContain("--an-drive-orange-600");
  });

  test("keeps the existing real attempt engine and secure workflow mounted", () => {
    expect(attempt).toContain("useMockTestAttemptEntryRuntime");
    expect(attempt).toContain("createMockTestSubmitAuthorizer");
    expect(attempt).toContain("<ExamHeader");
    expect(attempt).toContain("<QuestionWorkspace");
    expect(attempt).toContain("<PalettePanel");
    expect(attempt).toContain("saveAttemptAndNext");
    expect(attempt).toContain("markAttemptForReviewAndNext");
  });

  test("keeps future admin import and templates available", () => {
    expect(importUtils).toContain("importMockTestJsonAsDraft");
    expect(importUtils).toContain("XLSX");
    expect(importUtils).toContain("contentItems");
    expect(templateUtils).toContain("XLSX");
  });
});
