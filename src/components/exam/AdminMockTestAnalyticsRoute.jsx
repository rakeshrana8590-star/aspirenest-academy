export default function AdminMockTestAnalyticsRoute({
    mockResults = [],
    universalContent = [],
    navigate,
  }) {
    const attemptResults = mockResults || [];
  
    const mockTests = universalContent.filter(
      (item) => item.section === "mockTest"
    );
  
    const totalAttempts = attemptResults.length;
  
    const totalStudents = new Set(
      attemptResults.map(
        (result) => result.studentEmail || result.email || "Unknown"
      )
    ).size;
  
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            attemptResults.reduce(
              (sum, result) => sum + Number(result.score || 0),
              0
            ) / totalAttempts
          )
        : 0;
  
    const averageAccuracy =
      totalAttempts > 0
        ? Math.round(
            attemptResults.reduce(
              (sum, result) =>
                sum + Number(result.accuracy || result.percentage || 0),
              0
            ) / totalAttempts
          )
        : 0;
  
    const averagePercentage =
      totalAttempts > 0
        ? Math.round(
            attemptResults.reduce(
              (sum, result) => sum + Number(result.percentage || 0),
              0
            ) / totalAttempts
          )
        : 0;
  
    const passedAttempts = attemptResults.filter(
      (result) =>
        Number(result.percentage || 0) >= Number(result.passingMarks || 0)
    ).length;
  
    const passRate =
      totalAttempts > 0
        ? Math.round((passedAttempts / totalAttempts) * 100)
        : 0;
  
    const testAnalytics = mockTests
      .map((test) => {
        const testResults = attemptResults.filter(
          (result) => result.testId === test.id
        );
  
        const avgAccuracy =
          testResults.length > 0
            ? Math.round(
                testResults.reduce(
                  (sum, result) =>
                    sum + Number(result.accuracy || result.percentage || 0),
                  0
                ) / testResults.length
              )
            : 0;
  
        const avgScore =
          testResults.length > 0
            ? Math.round(
                testResults.reduce(
                  (sum, result) => sum + Number(result.score || 0),
                  0
                ) / testResults.length
              )
            : 0;
  
        return {
          ...test,
          attempts: testResults.length,
          avgAccuracy,
          avgScore,
        };
      })
      .sort((a, b) => b.attempts - a.attempts);
  
    const weakChapters = Object.values(
      attemptResults.reduce((acc, result) => {
        const key = `${result.subject || "Subject"}-${
          result.chapter || "Chapter"
        }`;
  
        if (!acc[key]) {
          acc[key] = {
            subject: result.subject || "Subject",
            chapter: result.chapter || "Chapter",
            attempts: 0,
            totalAccuracy: 0,
          };
        }
  
        acc[key].attempts += 1;
        acc[key].totalAccuracy += Number(
          result.accuracy || result.percentage || 0
        );
  
        return acc;
      }, {})
    )
      .map((item) => ({
        ...item,
        averageAccuracy: Math.round(item.totalAccuracy / item.attempts),
      }))
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .slice(0, 6);
  
    const topPerformers = [...attemptResults]
      .sort(
        (a, b) =>
          Number(b.percentage || 0) - Number(a.percentage || 0)
      )
      .slice(0, 6);
  
    const recentAttempts = [...attemptResults]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt || 0);
  
        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt || 0);
  
        return dateB - dateA;
      })
      .slice(0, 8);
  
    return (
      <section className="coursePages resultsAnalyticsPage">
        <div className="sectionHeader">
          <span className="badge">MOCK TEST ANALYTICS</span>
  
          <h1>Mock Test Analytics</h1>
  
          <p>
            Track attempts, accuracy, weak chapters, top performers, and
            test-wise performance.
          </p>
        </div>
  
        <div className="mockManageStatsGrid">
          <div className="mockManageStatCard">
            <span>Total Attempts</span>
            <strong>{totalAttempts}</strong>
          </div>
  
          <div className="mockManageStatCard">
            <span>Total Students</span>
            <strong>{totalStudents}</strong>
          </div>
  
          <div className="mockManageStatCard">
            <span>Average Score</span>
            <strong>{averageScore}</strong>
          </div>
  
          <div className="mockManageStatCard">
            <span>Average Accuracy</span>
            <strong>{averageAccuracy}%</strong>
          </div>
  
          <div className="mockManageStatCard">
            <span>Average Percentage</span>
            <strong>{averagePercentage}%</strong>
          </div>
  
          <div className="mockManageStatCard">
            <span>Pass Rate</span>
            <strong>{passRate}%</strong>
          </div>
        </div>
  
        <div className="contentStudioForm">
          <div className="contentStudioActions">
            <button
              className="backButton"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back to Mock Tests
            </button>
  
            <button
              className="publishButton"
              onClick={() => navigate("/admin/content/mock-tests/results")}
            >
              View Detailed Results
            </button>
  
            <button
              className="publishButton"
              onClick={() => navigate("/admin/content/mock-tests/leaderboard")}
            >
              View Leaderboard
            </button>
          </div>
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Test-wise Performance</h3>
            <span>{testAnalytics.length} tests</span>
          </div>
  
          {testAnalytics.length === 0 ? (
            <div className="resultsEmptyCard">No mock tests found.</div>
          ) : (
            <div className="resultsCompactGrid">
              {testAnalytics.map((test) => (
                <div className="resultsMetricCard" key={test.id}>
                  <strong>{test.title}</strong>
  
                  <p>
                    {test.planType || "FREE"} • {test.subject || "Subject"} •{" "}
                    {test.chapter || "Chapter"}
                  </p>
  
                  <div className="resultsMiniStats">
                    <span>Attempts {test.attempts}</span>
                    <span>Avg Score {test.avgScore}</span>
                    <span>Avg Accuracy {test.avgAccuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Weak Chapters</h3>
            <span>{weakChapters.length} chapters</span>
          </div>
  
          {weakChapters.length === 0 ? (
            <div className="resultsEmptyCard">No weak chapter data yet.</div>
          ) : (
            <div className="resultsCompactGrid">
              {weakChapters.map((item) => (
                <div
                  className="resultsWeakCard"
                  key={`${item.subject}-${item.chapter}`}
                >
                  <strong>{item.chapter}</strong>
                  <p>{item.subject}</p>
  
                  <div className="resultsMiniStats">
                    <span>Attempts {item.attempts}</span>
                    <span>Avg Accuracy {item.averageAccuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Top Performers</h3>
            <span>{topPerformers.length} students</span>
          </div>
  
          {topPerformers.length === 0 ? (
            <div className="resultsEmptyCard">No performers yet.</div>
          ) : (
            <div className="resultsCompactGrid">
              {topPerformers.map((result, index) => (
                <div className="resultsStudentCard" key={result.id || index}>
                  <div>
                    <strong>
                      #{index + 1} {" "}
                      {result.studentName ||
                        result.studentEmail ||
                        result.email ||
                        "Student"}
                    </strong>
  
                    <p>{result.testTitle || "Mock Test"}</p>
                  </div>
  
                  <div className="resultsScoreBadge">
                    {result.percentage || 0}%
                  </div>
  
                  <div className="resultsMiniStats">
                    <span>
                      Score {result.score || 0}/{result.totalMarks || 0}
                    </span>
                    <span>
                      Accuracy {result.accuracy || result.percentage || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Recent Attempts</h3>
            <span>{recentAttempts.length} latest</span>
          </div>
  
          {recentAttempts.length === 0 ? (
            <div className="resultsEmptyCard">No recent attempts yet.</div>
          ) : (
            <div className="resultsCompactGrid">
              {recentAttempts.map((result, index) => (
                <div className="resultsStudentCard" key={result.id || index}>
                  <div>
                    <strong>
                      {result.studentName ||
                        result.studentEmail ||
                        result.email ||
                        "Student"}
                    </strong>
  
                    <p>{result.testTitle || "Mock Test"}</p>
                  </div>
  
                  <div className="resultsScoreBadge">
                    {result.percentage || 0}%
                  </div>
  
                  <div className="resultsMiniStats">
                    <span>Correct {result.correctCount || 0}</span>
                    <span>Wrong {result.wrongCount || 0}</span>
                    <span>Skipped {result.skippedCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }
  