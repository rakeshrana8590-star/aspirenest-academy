import { useMemo } from "react";

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getStudentLabel = (result) =>
  result.studentName ||
  result.studentEmail ||
  result.email ||
  result.userEmail ||
  "Student";

const getTestTitle = (result) =>
  result.testTitle || result.title || result.mockTestTitle || "Mock Test";

const getResultPercentage = (result) => {
  const percentage = toNumber(result.percentage, null);

  if (percentage !== null) return Math.round(percentage);

  const accuracy = toNumber(result.accuracy, null);

  if (accuracy !== null) return Math.round(accuracy);

  const score = toNumber(result.score, 0);
  const totalMarks = toNumber(result.totalMarks, 0);

  if (totalMarks <= 0) return 0;

  return Math.round((score / totalMarks) * 100);
};

const getCreatedTime = (value) => {
  if (!value) return 0;

  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().getTime();
    }

    if (value?.seconds) {
      return value.seconds * 1000;
    }

    const dateValue = new Date(value).getTime();

    return Number.isNaN(dateValue) ? 0 : dateValue;
  } catch {
    return 0;
  }
};

export default function AdminMockTestAnalyticsRoute({
  mockResults = [],
  universalContent = [],
  navigate,
}) {
  const attemptResults = Array.isArray(mockResults) ? mockResults : [];

  const mockTests = useMemo(
    () => universalContent.filter((item) => item.section === "mockTest"),
    [universalContent]
  );

  const totalAttempts = attemptResults.length;

  const totalStudents = useMemo(
    () =>
      new Set(
        attemptResults.map(
          (result) =>
            result.studentEmail ||
            result.email ||
            result.userEmail ||
            result.studentName ||
            "Unknown"
        )
      ).size,
    [attemptResults]
  );

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          attemptResults.reduce(
            (sum, result) => sum + toNumber(result.score, 0),
            0
          ) / totalAttempts
        )
      : 0;

  const averageAccuracy =
    totalAttempts > 0
      ? Math.round(
          attemptResults.reduce(
            (sum, result) => sum + getResultPercentage(result),
            0
          ) / totalAttempts
        )
      : 0;

  const totalCorrect = attemptResults.reduce(
    (sum, result) => sum + toNumber(result.correctCount, 0),
    0
  );

  const totalWrong = attemptResults.reduce(
    (sum, result) => sum + toNumber(result.wrongCount, 0),
    0
  );

  const totalSkipped = attemptResults.reduce(
    (sum, result) => sum + toNumber(result.skippedCount, 0),
    0
  );

  const passedAttempts = attemptResults.filter((result) => {
    const percentage = getResultPercentage(result);
    const passingMarks = toNumber(result.passingMarks, 0);

    if (passingMarks <= 0) return percentage >= 40;

    return percentage >= passingMarks;
  }).length;

  const passRate =
    totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  const testAnalytics = useMemo(
    () =>
      mockTests
        .map((test) => {
          const testResults = attemptResults.filter(
            (result) => result.testId === test.id || result.mockTestId === test.id
          );

          const attempts = testResults.length;

          const avgAccuracy =
            attempts > 0
              ? Math.round(
                  testResults.reduce(
                    (sum, result) => sum + getResultPercentage(result),
                    0
                  ) / attempts
                )
              : 0;

          const avgScore =
            attempts > 0
              ? Math.round(
                  testResults.reduce(
                    (sum, result) => sum + toNumber(result.score, 0),
                    0
                  ) / attempts
                )
              : 0;

          return {
            ...test,
            attempts,
            avgAccuracy,
            avgScore,
          };
        })
        .sort((a, b) => b.attempts - a.attempts),
    [mockTests, attemptResults]
  );

  const weakChapters = useMemo(() => {
    const chapterMap = new Map();

    attemptResults.forEach((result) => {
      const key = `${result.subject || "Subject"}-${result.chapter || "Chapter"}`;

      const current = chapterMap.get(key) || {
        subject: result.subject || "Subject",
        chapter: result.chapter || "Chapter",
        attempts: 0,
        totalAccuracy: 0,
      };

      current.attempts += 1;
      current.totalAccuracy += getResultPercentage(result);

      chapterMap.set(key, current);
    });

    return [...chapterMap.values()]
      .map((item) => ({
        ...item,
        averageAccuracy:
          item.attempts > 0 ? Math.round(item.totalAccuracy / item.attempts) : 0,
      }))
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .slice(0, 8);
  }, [attemptResults]);

  const topPerformers = useMemo(
    () =>
      [...attemptResults]
        .sort(
          (a, b) =>
            getResultPercentage(b) - getResultPercentage(a) ||
            toNumber(b.score, 0) - toNumber(a.score, 0)
        )
        .slice(0, 6),
    [attemptResults]
  );

  const recentAttempts = useMemo(
    () =>
      [...attemptResults]
        .sort(
          (a, b) =>
            getCreatedTime(b.createdAt || b.submittedAt || b.completedAt) -
            getCreatedTime(a.createdAt || a.submittedAt || a.completedAt)
        )
        .slice(0, 8),
    [attemptResults]
  );

  return (
    <section className="coursePages adminMockAnalyticsPage">
      <div className="adminMockAnalyticsHero">
        <div className="adminMockAnalyticsHeroCopy">
          <span className="badge">MOCK TEST ANALYTICS</span>

          <h1>Mock Test Analytics Command Center</h1>

          <p>
            Track attempts, accuracy, pass rate, weak chapters, top performers,
            recent attempts, and test-wise health from one premium analytics
            cockpit.
          </p>

          <div className="adminMockAnalyticsHeroActions">
            <button
              type="button"
              className="adminMockAnalyticsPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/results")}
            >
              View Detailed Results
            </button>

            <button
              type="button"
              className="adminMockAnalyticsGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/leaderboard")}
            >
              View Leaderboard
            </button>

            <button
              type="button"
              className="adminMockAnalyticsGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockAnalyticsSystemCard">
          <div className="adminMockAnalyticsSystemTop">
            <span>ANALYTICS STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockAnalyticsSystemGrid">
            <div>
              <strong>{totalAttempts}</strong>
              <span>Attempts</span>
            </div>

            <div>
              <strong>{totalStudents}</strong>
              <span>Students</span>
            </div>

            <div>
              <strong>{averageAccuracy}%</strong>
              <span>Avg accuracy</span>
            </div>

            <div>
              <strong>{passRate}%</strong>
              <span>Pass rate</span>
            </div>
          </div>

          <div className="adminMockAnalyticsFlow">
            <span>Attempt</span>
            <i />
            <span>Analyze</span>
            <i />
            <span>Improve</span>
          </div>
        </div>
      </div>

      <div className="adminMockAnalyticsKpiGrid">
        <div className="adminMockAnalyticsKpiCard">
          <span>Total Attempts</span>
          <strong>{totalAttempts}</strong>
          <p>Submitted mock tests</p>
        </div>

        <div className="adminMockAnalyticsKpiCard">
          <span>Total Students</span>
          <strong>{totalStudents}</strong>
          <p>Unique student records</p>
        </div>

        <div className="adminMockAnalyticsKpiCard">
          <span>Average Score</span>
          <strong>{averageScore}</strong>
          <p>Across all attempts</p>
        </div>

        <div className="adminMockAnalyticsKpiCard">
          <span>Pass Rate</span>
          <strong>{passRate}%</strong>
          <p>Performance benchmark</p>
        </div>
      </div>

      <div className="adminMockAnalyticsInsightGrid">
        <div className="adminMockAnalyticsInsightCard">
          <span>Total Correct</span>
          <strong>{totalCorrect}</strong>
        </div>

        <div className="adminMockAnalyticsInsightCard">
          <span>Total Wrong</span>
          <strong>{totalWrong}</strong>
        </div>

        <div className="adminMockAnalyticsInsightCard">
          <span>Total Skipped</span>
          <strong>{totalSkipped}</strong>
        </div>

        <div className="adminMockAnalyticsInsightCard">
          <span>Average Accuracy</span>
          <strong>{averageAccuracy}%</strong>
        </div>
      </div>

      <div className="adminMockAnalyticsCommandGrid">
        <div className="adminMockAnalyticsPanel adminMockAnalyticsPanelLarge">
          <div className="adminMockAnalyticsPanelHeader">
            <div>
              <span>TEST-WISE PERFORMANCE</span>
              <h2>Mock Test Health</h2>
            </div>

            <small>{testAnalytics.length} tests</small>
          </div>

          {testAnalytics.length === 0 ? (
            <div className="adminMockAnalyticsEmpty">
              No mock tests found for analytics.
            </div>
          ) : (
            <div className="adminMockAnalyticsTestGrid">
              {testAnalytics.map((test) => (
                <article className="adminMockAnalyticsTestCard" key={test.id}>
                  <strong>{test.title}</strong>

                  <p>
                    {test.planType || "FREE"} • {test.subject || "Subject"} •{" "}
                    {test.chapter || "Chapter"}
                  </p>

                  <div className="adminMockAnalyticsMiniStats">
                    <span>Attempts {test.attempts}</span>
                    <span>Avg Score {test.avgScore}</span>
                    <span>Avg Accuracy {test.avgAccuracy}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="adminMockAnalyticsPanel">
          <div className="adminMockAnalyticsPanelHeader">
            <div>
              <span>WEAK CHAPTERS</span>
              <h2>Needs Attention</h2>
            </div>

            <small>{weakChapters.length}</small>
          </div>

          {weakChapters.length === 0 ? (
            <div className="adminMockAnalyticsEmpty">
              No weak chapter data yet.
            </div>
          ) : (
            <div className="adminMockAnalyticsCompactGrid">
              {weakChapters.map((item) => (
                <article
                  className="adminMockAnalyticsWeakCard"
                  key={`${item.subject}-${item.chapter}`}
                >
                  <strong>{item.chapter}</strong>

                  <p>{item.subject}</p>

                  <div className="adminMockAnalyticsMiniStats">
                    <span>Attempts {item.attempts}</span>
                    <span>Avg Accuracy {item.averageAccuracy}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adminMockAnalyticsCommandGrid">
        <div className="adminMockAnalyticsPanel">
          <div className="adminMockAnalyticsPanelHeader">
            <div>
              <span>TOP PERFORMERS</span>
              <h2>Best Student Attempts</h2>
            </div>

            <small>{topPerformers.length} students</small>
          </div>

          {topPerformers.length === 0 ? (
            <div className="adminMockAnalyticsEmpty">No performers yet.</div>
          ) : (
            <div className="adminMockAnalyticsCompactGrid">
              {topPerformers.map((result, index) => (
                <article
                  className="adminMockAnalyticsStudentCard"
                  key={result.id || `${getStudentLabel(result)}-${index}`}
                >
                  <div className="adminMockAnalyticsStudentTop">
                    <div>
                      <strong>
                        #{index + 1} {getStudentLabel(result)}
                      </strong>

                      <p>{getTestTitle(result)}</p>
                    </div>

                    <div className="adminMockAnalyticsScorePill">
                      {getResultPercentage(result)}%
                    </div>
                  </div>

                  <div className="adminMockAnalyticsMiniStats">
                    <span>
                      Score {result.score || 0}/{result.totalMarks || 0}
                    </span>
                    <span>
                      Accuracy {result.accuracy || getResultPercentage(result)}%
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="adminMockAnalyticsPanel">
          <div className="adminMockAnalyticsPanelHeader">
            <div>
              <span>RECENT ATTEMPTS</span>
              <h2>Latest Activity</h2>
            </div>

            <small>{recentAttempts.length} latest</small>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="adminMockAnalyticsEmpty">
              No recent attempts yet.
            </div>
          ) : (
            <div className="adminMockAnalyticsCompactGrid">
              {recentAttempts.map((result, index) => (
                <article
                  className="adminMockAnalyticsStudentCard"
                  key={result.id || `${getStudentLabel(result)}-${index}`}
                >
                  <div className="adminMockAnalyticsStudentTop">
                    <div>
                      <strong>{getStudentLabel(result)}</strong>

                      <p>{getTestTitle(result)}</p>
                    </div>

                    <div className="adminMockAnalyticsScorePill">
                      {getResultPercentage(result)}%
                    </div>
                  </div>

                  <div className="adminMockAnalyticsMiniStats">
                    <span>Correct {result.correctCount || 0}</span>
                    <span>Wrong {result.wrongCount || 0}</span>
                    <span>Skipped {result.skippedCount || 0}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}