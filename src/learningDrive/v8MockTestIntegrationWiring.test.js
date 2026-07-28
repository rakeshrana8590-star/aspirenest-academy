import fs from "fs";
import path from "path";

const runtime = fs.readFileSync(path.join(__dirname, "V8LearningDriveRuntime.jsx"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "../../public/learning-drive-v8/app.js"), "utf8");
const root = fs.readFileSync(path.join(__dirname, "../App.js"), "utf8");

describe("V8 real Mock Test integration wiring", () => {
  test("passes the real catalog, owned results and public leaderboard into the approved shadow runtime", () => {
    expect(runtime).toContain("buildV8RealMockTestsRuntime");
    expect(runtime).toContain("realMockTests: realMockTestsRuntime.resources");
    expect(runtime).toContain("mockTestResults: realMockTestsRuntime.results");
    expect(runtime).toContain("mockTestLeaderboard: realMockTestsRuntime.leaderboard");
    expect(root).toContain("mockResults={mockResults}");
    expect(root).toContain("mockLeaderboardEntries={mockLeaderboardPublicEntries}");
  });

  test("keeps real Start, Result, Review, History and Drive-style Practice touchpoints", () => {
    expect(app).toContain("runtimeRealMockTests");
    expect(app).toContain("mergeIntegratedResources");
    expect(app).toContain("/ctet-tet/mock-tests/history");
    expect(app).toContain("result?.reviewRoute");
    expect(app).toContain("state.context==='leaderboard'");
    expect(app).not.toContain("Attempt authorization passed in smoke mode");
  });
});
