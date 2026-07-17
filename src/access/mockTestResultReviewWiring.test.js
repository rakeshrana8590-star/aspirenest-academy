const fs = require("fs");

const read = (path) => fs.readFileSync(path, "utf8");

describe("AspireNest result and review independent authorization wiring", () => {
  const app = read("src/App.js");
  const resultRoute = read(
    "src/components/exam/ExamResultRoute.jsx"
  );
  const reviewRoute = read(
    "src/components/exam/ExamReviewRoute.jsx"
  );
  const runtime = read(
    "src/access/mockTestResultReviewRuntime.js"
  );

  test("passes central access evidence into result and review routes", () => {
    expect(app).toMatch(
      /<ExamResultRoute[\s\S]*?accessProfile=\{accessProfile\}[\s\S]*?planCatalog=\{accessProfile\?\.planCatalog \|\| \[\]\}/
    );
    expect(app).toMatch(
      /<ExamReviewRoute[\s\S]*?accessProfile=\{accessProfile\}[\s\S]*?planCatalog=\{accessProfile\?\.planCatalog \|\| \[\]\}/
    );
  });

  test("result route requires VIEW_RESULT before exposing metrics or auto-sync", () => {
    expect(resultRoute).toContain(
      "MOCK_TEST_ACTIONS.VIEW_RESULT"
    );
    expect(resultRoute).toContain(
      "resultAuthorization.canExposeResult"
    );
    expect(resultRoute).toContain(
      "buildMockTestResultReviewRuntime"
    );
    expect(resultRoute.indexOf("resultAuthorization.canExposeResult"))
      .toBeLessThan(resultRoute.indexOf("const newStoredAnswers"));
  });

  test("review route independently requires REVIEW and canExposeAnswers", () => {
    expect(reviewRoute).toContain(
      "MOCK_TEST_ACTIONS.REVIEW"
    );
    expect(reviewRoute).toContain(
      "reviewAuthorization.canExposeAnswers"
    );
    expect(reviewRoute).toContain(
      "REVIEW_LOCKED"
    );
  });

  test("direct review refresh can restore only the current learner result", () => {
    expect(app).toMatch(
      /<ExamReviewRoute[\s\S]*?mockResults=\{mockResults\}[\s\S]*?loadUserMockResults=\{loadUserMockResults\}/
    );
    expect(reviewRoute).toContain("savedResultForTest");
    expect(reviewRoute).toContain("ownerUid");
    expect(reviewRoute).toContain("ownerEmail");
    expect(reviewRoute).toContain("recoveredAnswers");
  });

  test("central runtime fails closed for ownership, loading, errors, and release", () => {
    expect(runtime).toContain("RESULT_OWNERSHIP_DENIED");
    expect(runtime).toContain("ACCESS_LOADING");
    expect(runtime).toContain(
      "MOCK_TEST_RESULT_REVIEW_STATES.ERROR"
    );
    expect(runtime).toContain("dataError");
    expect(runtime).toContain("REVIEW_NOT_RELEASED");
    expect(runtime).toContain("canExposeAnswers");
  });
});
