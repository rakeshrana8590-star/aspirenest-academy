import { buildV8RealMockTestsRuntime } from "./v8RealMockTestsRuntimeModel";

const freeTest = {
  id: "free-test",
  section: "mockTest",
  status: "published",
  title: "Free CTET Mock Test",
  description: "Public-safe description",
  planType: "FREE",
  subject: "CDP",
  chapter: "Growth",
  durationMinutes: 30,
  totalQuestions: 30,
  totalMarks: 30,
  questions: [{ text: "must not leak" }],
};

const premiumTest = {
  id: "premium-test",
  section: "mockTest",
  status: "published",
  title: "Premium CTET Mock Test",
  planType: "PREMIUM",
  subject: "Mathematics",
  chapter: "Numbers",
  durationMinutes: 60,
  totalQuestions: 50,
  totalMarks: 50,
  questions: [{ text: "must not leak" }],
};

describe("V8 real Mock Test runtime projection", () => {
  test("projects real tests into Drive resources and preserves canonical start routes", () => {
    const runtime = buildV8RealMockTestsRuntime({
      universalContent: [freeTest, premiumTest],
      accessProfile: { activeRecords: [], planCatalog: [] },
      now: Date.now(),
    });

    const free = runtime.resources.find((item) => item.id === "free-test");
    const premium = runtime.resources.find((item) => item.id === "premium-test");

    expect(free.state).toBe("open");
    expect(free.route).toBe("/ctet-tet/mock-tests/start/free-test");
    expect(premium.state).toBe("locked");
    expect(JSON.stringify(runtime.resources)).not.toContain("must not leak");
    expect(JSON.stringify(runtime.resources)).not.toContain("questions");
    expect(JSON.stringify(runtime.resources)).not.toContain("answers");
  });

  test("projects only public-safe result and leaderboard fields", () => {
    const runtime = buildV8RealMockTestsRuntime({
      universalContent: [freeTest],
      accessProfile: { activeRecords: [], planCatalog: [] },
      mockResults: [
        {
          id: "result-1",
          testId: "free-test",
          testTitle: "Free CTET Mock Test",
          percentage: 84,
          answers: { 1: "A" },
          email: "private@example.com",
          uid: "private-uid",
        },
      ],
      mockLeaderboardEntries: [
        {
          id: "public-1",
          testId: "free-test",
          displayName: "R***",
          rank: 1,
          percentage: 92,
          email: "must-not-pass@example.com",
        },
      ],
    });

    expect(runtime.results[0].route).toBe(
      "/ctet-tet/mock-tests/result/free-test"
    );
    expect(runtime.results[0].reviewRoute).toBe(
      "/ctet-tet/mock-tests/review/free-test"
    );
    expect(JSON.stringify(runtime.results)).not.toContain("answers");
    expect(JSON.stringify(runtime.results)).not.toContain("private@example.com");
    expect(JSON.stringify(runtime.leaderboard)).not.toContain("must-not-pass@example.com");
    expect(runtime.resources[0].recent).toBe(true);
    expect(runtime.resources[0].progress).toBe(100);
  });
});
