export default function AdminMockTestResultsRoute({
    universalContent = [],
    mockResults = [],
    loadLeaderboard,
    loadUserMockResults,
    user,
    navigate,
  }) {
    const mockTests = universalContent.filter(
      (item) => item.section === "mockTest"
    );
  
    const attemptResults = mockResults || [];
    const totalAttempts = attemptResults.length;
  
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
              (sum, result) => sum + Number(result.accuracy || 0),
              0
            ) / totalAttempts
          )
        : 0;
  
    const weakChapters = [
      ...new Map(
        attemptResults
          .filter((result) => result.chapter)
          .map((result) => {
            const chapterResults = attemptResults.filter(
              (item) => item.chapter === result.chapter
            );
  
            return [
              result.chapter,
              {
                chapter: result.chapter,
                subject: result.subject || "Unknown Subject",
                attempts: chapterResults.length,
                averageAccuracy: Math.round(
                  chapterResults.reduce(
                    (sum, item) => sum + Number(item.accuracy || 0),
                    0
                  ) / chapterResults.length
                ),
              },
            ];
          })
      ).values(),
    ].sort(
      (a, b) =>
        Number(a.averageAccuracy || 0) -
        Number(b.averageAccuracy || 0)
    );
  
    return (
      <section className="coursePages resultsAnalyticsPage">
        <div className="sectionHeader">
          <span className="badge">RESULTS ANALYTICS</span>
          <h1>Mock Test Results Analytics</h1>
          <p>
            Stripe-style performance dashboard for attempts, accuracy,
            tests, students, and weak chapters.
          </p>
        </div>
  
        <div className="resultsTopBar">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests")}
          >
            ← Back
          </button>
  
          <button
            className="publishButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/published")
            }
          >
            Published Tests
          </button>
  
          <button
            className="backButton"
            onClick={async () => {
              await loadLeaderboard?.();
  
              if (user?.email) {
                await loadUserMockResults?.(user.email);
              }
            }}
          >
            Refresh
          </button>
        </div>
  
        <div className="resultsKpiGrid">
          <div className="resultsKpiCard">
            <span>Total Tests</span>
            <strong>{mockTests.length}</strong>
            <small>Created exams</small>
          </div>
  
          <div className="resultsKpiCard">
            <span>Total Attempts</span>
            <strong>{totalAttempts}</strong>
            <small>Saved results</small>
          </div>
  
          <div className="resultsKpiCard">
            <span>Average Score</span>
            <strong>{averageScore}</strong>
            <small>Across attempts</small>
          </div>
  
          <div className="resultsKpiCard">
            <span>Average Accuracy</span>
            <strong>{averageAccuracy}%</strong>
            <small>Student accuracy</small>
          </div>
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Test-wise Performance</h3>
            <span>{mockTests.length} tests</span>
          </div>
  
          <div className="resultsCompactGrid">
            {mockTests.map((test) => {
              const testResults = attemptResults.filter(
                (result) => result.testId === test.id
              );
  
              const testAvgScore =
                testResults.length > 0
                  ? Math.round(
                      testResults.reduce(
                        (sum, result) =>
                          sum + Number(result.score || 0),
                        0
                      ) / testResults.length
                    )
                  : 0;
  
              const testAvgAccuracy =
                testResults.length > 0
                  ? Math.round(
                      testResults.reduce(
                        (sum, result) =>
                          sum + Number(result.accuracy || 0),
                        0
                      ) / testResults.length
                    )
                  : 0;
  
              return (
                <div className="resultsMetricCard" key={test.id}>
                  <strong>{test.title}</strong>
                  <p>
                    {test.planType || "FREE"} • {test.subject || "Subject"} • {" "}
                    {test.chapter || "Chapter"}
                  </p>
  
                  <div className="resultsMiniStats">
                    <span>Attempts {testResults.length}</span>
                    <span>Score {testAvgScore}</span>
                    <span>Accuracy {testAvgAccuracy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Student-wise Results</h3>
            <span>{attemptResults.length} attempts</span>
          </div>
  
          {attemptResults.length === 0 ? (
            <div className="resultsEmptyCard">No student results yet.</div>
          ) : (
            <div className="resultsCompactGrid">
              {attemptResults.map((result, index) => (
                <div
                  className="resultsStudentCard"
                  key={result.id || index}
                >
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
                    <span>
                      Score {result.score || 0}/{result.totalMarks || 0}
                    </span>
                    <span>Correct {result.correctCount || 0}</span>
                    <span>Wrong {result.wrongCount || 0}</span>
                    <span>Skipped {result.skippedCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="resultsSection">
          <div className="resultsSectionHeader">
            <h3>Weak Chapters Analytics</h3>
            <span>{weakChapters.length} chapters</span>
          </div>
  
          {weakChapters.length === 0 ? (
            <div className="resultsEmptyCard">
              No weak chapter data yet.
            </div>
          ) : (
            <div className="resultsCompactGrid">
              {weakChapters.map((chapterItem) => (
                <div
                  className="resultsWeakCard"
                  key={chapterItem.chapter}
                >
                  <strong>{chapterItem.chapter}</strong>
                  <p>{chapterItem.subject}</p>
  
                  <div className="resultsMiniStats">
                    <span>Attempts {chapterItem.attempts}</span>
                    <span>
                      Avg Accuracy {chapterItem.averageAccuracy || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }
  