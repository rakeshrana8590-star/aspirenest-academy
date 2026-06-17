export default function AdminMockTestLeaderboardRoute({
    mockLeaderboardEntries = [],
    loadMockLeaderboardEntries,
    navigate,
  }) {
    const leaderboardEntries = mockLeaderboardEntries || [];
  
    const sortedEntries = [...leaderboardEntries].sort(
      (a, b) =>
        Number(b.percentage || 0) - Number(a.percentage || 0) ||
        Number(b.score || 0) - Number(a.score || 0)
    );
  
    const bestByStudent = Object.values(
      sortedEntries.reduce((acc, entry) => {
        const key =
          entry.studentEmail ||
          entry.email ||
          entry.studentName ||
          `student-${entry.id}`;
  
        const current = acc[key];
  
        if (
          !current ||
          Number(entry.percentage || 0) > Number(current.percentage || 0) ||
          (Number(entry.percentage || 0) === Number(current.percentage || 0) &&
            Number(entry.score || 0) > Number(current.score || 0))
        ) {
          acc[key] = entry;
        }
  
        return acc;
      }, {})
    ).sort(
      (a, b) =>
        Number(b.percentage || 0) - Number(a.percentage || 0) ||
        Number(b.score || 0) - Number(a.score || 0)
    );
  
    const totalRankedStudents = bestByStudent.length;
  
    const highestScore =
      bestByStudent.length > 0
        ? Math.max(...bestByStudent.map((entry) => Number(entry.score || 0)))
        : 0;
  
    const averageAccuracy =
      bestByStudent.length > 0
        ? Math.round(
            bestByStudent.reduce(
              (sum, entry) => sum + Number(entry.accuracy || 0),
              0
            ) / bestByStudent.length
          )
        : 0;
  
    const subjectLeaders = Object.values(
      sortedEntries
        .filter((entry) => entry.subject)
        .reduce((acc, entry) => {
          const key = entry.subject;
  
          const current = acc[key];
  
          if (
            !current ||
            Number(entry.percentage || 0) > Number(current.percentage || 0) ||
            (Number(entry.percentage || 0) === Number(current.percentage || 0) &&
              Number(entry.score || 0) > Number(current.score || 0))
          ) {
            acc[key] = entry;
          }
  
          return acc;
        }, {})
    );
  
    const recentWinners = [...leaderboardEntries]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt || 0);
  
        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt || 0);
  
        return dateB - dateA;
      })
      .slice(0, 6);
  
    return (
      <section className="coursePages leaderboardPage">
        <div className="sectionHeader">
          <span className="badge">LEADERBOARD</span>
  
          <h1>Mock Test Leaderboard</h1>
  
          <p>
            Rank top students, subject champions, and latest leaderboard entries
            from real mock test attempts.
          </p>
        </div>
  
        <div className="leaderboardTopBar">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests")}
          >
            ← Back
          </button>
  
          <button className="publishButton" onClick={loadMockLeaderboardEntries}>
            Refresh Leaderboard
          </button>
  
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests/results")}
          >
            View Results
          </button>
        </div>
  
        <div className="leaderboardKpiGrid">
          <div className="leaderboardKpiCard">
            <span>Ranked Students</span>
            <strong>{totalRankedStudents}</strong>
            <small>Unique best scores</small>
          </div>
  
          <div className="leaderboardKpiCard">
            <span>Total Entries</span>
            <strong>{leaderboardEntries.length}</strong>
            <small>All leaderboard saves</small>
          </div>
  
          <div className="leaderboardKpiCard">
            <span>Highest Score</span>
            <strong>{highestScore}</strong>
            <small>Best score</small>
          </div>
  
          <div className="leaderboardKpiCard">
            <span>Avg Accuracy</span>
            <strong>{averageAccuracy}%</strong>
            <small>Unique ranked students</small>
          </div>
        </div>
  
        <div className="leaderboardPodium">
          <div className="leaderboardSectionHeader">
            <h3>Top 3 Podium</h3>
            <span>Unique champions</span>
          </div>
  
          {bestByStudent.length === 0 ? (
            <div className="leaderboardEmptyCard">No leaderboard entries yet.</div>
          ) : (
            <div className="leaderboardPodiumGrid">
              {bestByStudent.slice(0, 3).map((entry, index) => (
                <div
                  className={`leaderboardPodiumCard rank${index + 1}`}
                  key={entry.id || index}
                >
                  <div className="leaderboardRankBadge">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
  
                  <strong>
                    {entry.studentName ||
                      entry.studentEmail ||
                      entry.email ||
                      "Student"}
                  </strong>
  
                  <p>{entry.testTitle || "Mock Test"}</p>
  
                  <div className="leaderboardMiniStats">
                    <span>
                      Score {entry.score || 0}/{entry.totalMarks || 0}
                    </span>
                    <span>{entry.percentage || 0}%</span>
                    <span>Accuracy {entry.accuracy || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="leaderboardSection">
          <div className="leaderboardSectionHeader">
            <h3>Global Rankings</h3>
            <span>{bestByStudent.length} students</span>
          </div>
  
          {bestByStudent.length === 0 ? (
            <div className="leaderboardEmptyCard">
              Leaderboard will appear after students submit leaderboard-enabled
              tests.
            </div>
          ) : (
            <div className="leaderboardTable">
              {bestByStudent.map((entry, index) => (
                <div className="leaderboardRow" key={entry.id || index}>
                  <div className="leaderboardRank">#{index + 1}</div>
  
                  <div className="leaderboardStudent">
                    <strong>
                      {entry.studentName ||
                        entry.studentEmail ||
                        entry.email ||
                        "Student"}
                    </strong>
  
                    <span>
                      {entry.testTitle || "Mock Test"} •{" "}
                      {entry.subject || "Subject"} • {entry.chapter || "Chapter"}
                    </span>
                  </div>
  
                  <div className="leaderboardScore">
                    <strong>
                      {entry.score || 0}/{entry.totalMarks || 0}
                    </strong>
                    <span>Score</span>
                  </div>
  
                  <div className="leaderboardScore">
                    <strong>{entry.percentage || 0}%</strong>
                    <span>Percentage</span>
                  </div>
  
                  <div className="leaderboardScore">
                    <strong>{entry.accuracy || 0}%</strong>
                    <span>Accuracy</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="leaderboardSection">
          <div className="leaderboardSectionHeader">
            <h3>Subject-wise Leaders</h3>
            <span>{subjectLeaders.length} subjects</span>
          </div>
  
          {subjectLeaders.length === 0 ? (
            <div className="leaderboardEmptyCard">
              Subject leaders will appear after leaderboard entries are available.
            </div>
          ) : (
            <div className="leaderboardCompactGrid">
              {subjectLeaders.map((entry, index) => (
                <div
                  className="leaderboardSubjectCard"
                  key={`${entry.subject}-${index}`}
                >
                  <strong>{entry.subject}</strong>
  
                  <p>
                    {entry.studentName ||
                      entry.studentEmail ||
                      entry.email ||
                      "Student"}
                  </p>
  
                  <div className="leaderboardMiniStats">
                    <span>{entry.percentage || 0}%</span>
                    <span>Score {entry.score || 0}</span>
                    <span>Accuracy {entry.accuracy || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <div className="leaderboardSection">
          <div className="leaderboardSectionHeader">
            <h3>Recent Winners</h3>
            <span>Latest ranked entries</span>
          </div>
  
          {recentWinners.length === 0 ? (
            <div className="leaderboardEmptyCard">No recent winners yet.</div>
          ) : (
            <div className="leaderboardCompactGrid">
              {recentWinners.map((entry, index) => (
                <div className="leaderboardRecentCard" key={entry.id || index}>
                  <strong>
                    {entry.studentName ||
                      entry.studentEmail ||
                      entry.email ||
                      "Student"}
                  </strong>
  
                  <p>{entry.testTitle || "Mock Test"}</p>
  
                  <div className="leaderboardMiniStats">
                    <span>{entry.percentage || 0}%</span>
                    <span>{entry.accuracy || 0}% accuracy</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }
  