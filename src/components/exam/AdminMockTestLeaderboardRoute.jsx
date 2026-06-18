import { useMemo } from "react";

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getStudentLabel = (entry) =>
  entry.studentName ||
  entry.studentEmail ||
  entry.email ||
  entry.userEmail ||
  "Student";

const getTestTitle = (entry) =>
  entry.testTitle || entry.title || entry.mockTestTitle || "Mock Test";

const getLeaderboardPercentage = (entry) =>
  Math.round(
    toNumber(
      entry.percentage,
      toNumber(entry.accuracy, 0)
    )
  );

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

export default function AdminMockTestLeaderboardRoute({
  mockLeaderboardEntries = [],
  loadMockLeaderboardEntries,
  navigate,
}) {
  const leaderboardEntries = Array.isArray(mockLeaderboardEntries)
    ? mockLeaderboardEntries
    : [];

  const sortedEntries = useMemo(
    () =>
      [...leaderboardEntries].sort(
        (a, b) =>
          getLeaderboardPercentage(b) - getLeaderboardPercentage(a) ||
          toNumber(b.score, 0) - toNumber(a.score, 0)
      ),
    [leaderboardEntries]
  );

  const bestByStudent = useMemo(
    () =>
      Object.values(
        sortedEntries.reduce((acc, entry) => {
          const key =
            entry.studentEmail ||
            entry.email ||
            entry.userEmail ||
            entry.studentName ||
            `student-${entry.id}`;

          const current = acc[key];

          const entryPercentage = getLeaderboardPercentage(entry);
          const currentPercentage = current
            ? getLeaderboardPercentage(current)
            : -1;

          if (
            !current ||
            entryPercentage > currentPercentage ||
            (entryPercentage === currentPercentage &&
              toNumber(entry.score, 0) > toNumber(current.score, 0))
          ) {
            acc[key] = entry;
          }

          return acc;
        }, {})
      ).sort(
        (a, b) =>
          getLeaderboardPercentage(b) - getLeaderboardPercentage(a) ||
          toNumber(b.score, 0) - toNumber(a.score, 0)
      ),
    [sortedEntries]
  );

  const subjectLeaders = useMemo(
    () =>
      Object.values(
        sortedEntries
          .filter((entry) => entry.subject)
          .reduce((acc, entry) => {
            const key = entry.subject;
            const current = acc[key];

            const entryPercentage = getLeaderboardPercentage(entry);
            const currentPercentage = current
              ? getLeaderboardPercentage(current)
              : -1;

            if (
              !current ||
              entryPercentage > currentPercentage ||
              (entryPercentage === currentPercentage &&
                toNumber(entry.score, 0) > toNumber(current.score, 0))
            ) {
              acc[key] = entry;
            }

            return acc;
          }, {})
      ),
    [sortedEntries]
  );

  const recentWinners = useMemo(
    () =>
      [...leaderboardEntries]
        .sort(
          (a, b) =>
            getCreatedTime(b.createdAt || b.submittedAt || b.completedAt) -
            getCreatedTime(a.createdAt || a.submittedAt || a.completedAt)
        )
        .slice(0, 6),
    [leaderboardEntries]
  );

  const topThree = bestByStudent.slice(0, 3);

  const totalRankedStudents = bestByStudent.length;

  const highestScore =
    bestByStudent.length > 0
      ? Math.max(...bestByStudent.map((entry) => toNumber(entry.score, 0)))
      : 0;

  const averageAccuracy =
    bestByStudent.length > 0
      ? Math.round(
          bestByStudent.reduce(
            (sum, entry) => sum + toNumber(entry.accuracy, getLeaderboardPercentage(entry)),
            0
          ) / bestByStudent.length
        )
      : 0;

  const averagePercentage =
    bestByStudent.length > 0
      ? Math.round(
          bestByStudent.reduce(
            (sum, entry) => sum + getLeaderboardPercentage(entry),
            0
          ) / bestByStudent.length
        )
      : 0;

  const handleRefreshLeaderboard = async () => {
    await loadMockLeaderboardEntries?.();
  };

  return (
    <section className="coursePages adminMockLeaderboardPage">
      <div className="adminMockLeaderboardHero">
        <div className="adminMockLeaderboardHeroCopy">
          <span className="badge">LEADERBOARD</span>

          <h1>Mock Test Leaderboard Command Center</h1>

          <p>
            Rank top students, subject champions, latest winners, and unique
            best scores from leaderboard-enabled mock-test attempts.
          </p>

          <div className="adminMockLeaderboardHeroActions">
            <button
              type="button"
              className="adminMockLeaderboardPrimaryBtn"
              onClick={handleRefreshLeaderboard}
            >
              Refresh Leaderboard
            </button>

            <button
              type="button"
              className="adminMockLeaderboardGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/results")}
            >
              View Results
            </button>

            <button
              type="button"
              className="adminMockLeaderboardGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockLeaderboardSystemCard">
          <div className="adminMockLeaderboardSystemTop">
            <span>RANKING STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockLeaderboardSystemGrid">
            <div>
              <strong>{totalRankedStudents}</strong>
              <span>Ranked students</span>
            </div>

            <div>
              <strong>{leaderboardEntries.length}</strong>
              <span>Total entries</span>
            </div>

            <div>
              <strong>{highestScore}</strong>
              <span>Highest score</span>
            </div>

            <div>
              <strong>{averagePercentage}%</strong>
              <span>Avg percentage</span>
            </div>
          </div>

          <div className="adminMockLeaderboardFlow">
            <span>Attempt</span>
            <i />
            <span>Score</span>
            <i />
            <span>Rank</span>
          </div>
        </div>
      </div>

      <div className="adminMockLeaderboardKpiGrid">
        <div className="adminMockLeaderboardKpiCard">
          <span>Ranked Students</span>
          <strong>{totalRankedStudents}</strong>
          <p>Unique best scores</p>
        </div>

        <div className="adminMockLeaderboardKpiCard">
          <span>Total Entries</span>
          <strong>{leaderboardEntries.length}</strong>
          <p>All leaderboard saves</p>
        </div>

        <div className="adminMockLeaderboardKpiCard">
          <span>Highest Score</span>
          <strong>{highestScore}</strong>
          <p>Best score recorded</p>
        </div>

        <div className="adminMockLeaderboardKpiCard">
          <span>Avg Accuracy</span>
          <strong>{averageAccuracy}%</strong>
          <p>Unique ranked students</p>
        </div>
      </div>

      <div className="adminMockLeaderboardPanel adminMockLeaderboardPodiumPanel">
        <div className="adminMockLeaderboardPanelHeader">
          <div>
            <span>TOP 3 PODIUM</span>
            <h2>Unique Champions</h2>
          </div>

          <small>{topThree.length} winners</small>
        </div>

        {topThree.length === 0 ? (
          <div className="adminMockLeaderboardEmpty">
            No leaderboard entries yet.
          </div>
        ) : (
          <div className="adminMockLeaderboardPodiumGrid">
            {topThree.map((entry, index) => (
              <article
                className={`adminMockLeaderboardPodiumCard adminMockLeaderboardRank${
                  index + 1
                }`}
                key={entry.id || `${getStudentLabel(entry)}-${index}`}
              >
                <div className="adminMockLeaderboardMedal">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </div>

                <strong>{getStudentLabel(entry)}</strong>

                <p>{getTestTitle(entry)}</p>

                <div className="adminMockLeaderboardMiniStats">
                  <span>
                    Score {entry.score || 0}/{entry.totalMarks || 0}
                  </span>
                  <span>{getLeaderboardPercentage(entry)}%</span>
                  <span>Accuracy {entry.accuracy || 0}%</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockLeaderboardCommandGrid">
        <div className="adminMockLeaderboardPanel adminMockLeaderboardPanelLarge">
          <div className="adminMockLeaderboardPanelHeader">
            <div>
              <span>GLOBAL RANKINGS</span>
              <h2>Student Ranking Table</h2>
            </div>

            <small>{bestByStudent.length} students</small>
          </div>

          {bestByStudent.length === 0 ? (
            <div className="adminMockLeaderboardEmpty">
              Leaderboard will appear after students submit
              leaderboard-enabled tests.
            </div>
          ) : (
            <div className="adminMockLeaderboardTable">
              {bestByStudent.map((entry, index) => (
                <article
                  className="adminMockLeaderboardRow"
                  key={entry.id || `${getStudentLabel(entry)}-${index}`}
                >
                  <div className="adminMockLeaderboardRank">#{index + 1}</div>

                  <div className="adminMockLeaderboardStudent">
                    <strong>{getStudentLabel(entry)}</strong>

                    <span>
                      {getTestTitle(entry)} • {entry.subject || "Subject"} •{" "}
                      {entry.chapter || "Chapter"}
                    </span>
                  </div>

                  <div className="adminMockLeaderboardScore">
                    <strong>
                      {entry.score || 0}/{entry.totalMarks || 0}
                    </strong>
                    <span>Score</span>
                  </div>

                  <div className="adminMockLeaderboardScore">
                    <strong>{getLeaderboardPercentage(entry)}%</strong>
                    <span>Percentage</span>
                  </div>

                  <div className="adminMockLeaderboardScore">
                    <strong>{entry.accuracy || 0}%</strong>
                    <span>Accuracy</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="adminMockLeaderboardPanel">
          <div className="adminMockLeaderboardPanelHeader">
            <div>
              <span>SUBJECT LEADERS</span>
              <h2>Top by Subject</h2>
            </div>

            <small>{subjectLeaders.length}</small>
          </div>

          {subjectLeaders.length === 0 ? (
            <div className="adminMockLeaderboardEmpty">
              Subject leaders will appear after entries are available.
            </div>
          ) : (
            <div className="adminMockLeaderboardCompactGrid">
              {subjectLeaders.map((entry, index) => (
                <article
                  className="adminMockLeaderboardSubjectCard"
                  key={`${entry.subject}-${index}`}
                >
                  <strong>{entry.subject}</strong>

                  <p>{getStudentLabel(entry)}</p>

                  <div className="adminMockLeaderboardMiniStats">
                    <span>{getLeaderboardPercentage(entry)}%</span>
                    <span>Score {entry.score || 0}</span>
                    <span>Accuracy {entry.accuracy || 0}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adminMockLeaderboardPanel">
        <div className="adminMockLeaderboardPanelHeader">
          <div>
            <span>RECENT WINNERS</span>
            <h2>Latest Ranked Entries</h2>
          </div>

          <small>{recentWinners.length} latest</small>
        </div>

        {recentWinners.length === 0 ? (
          <div className="adminMockLeaderboardEmpty">No recent winners yet.</div>
        ) : (
          <div className="adminMockLeaderboardRecentGrid">
            {recentWinners.map((entry, index) => (
              <article
                className="adminMockLeaderboardRecentCard"
                key={entry.id || `${getStudentLabel(entry)}-${index}`}
              >
                <div>
                  <strong>{getStudentLabel(entry)}</strong>

                  <p>{getTestTitle(entry)}</p>
                </div>

                <div className="adminMockLeaderboardScorePill">
                  {getLeaderboardPercentage(entry)}%
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}