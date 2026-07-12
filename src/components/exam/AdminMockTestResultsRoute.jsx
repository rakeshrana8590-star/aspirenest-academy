import { useEffect, useMemo, useRef, useState } from "react";

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

  if (percentage !== null) {
    return Math.round(percentage);
  }

  const accuracy = toNumber(result.accuracy, null);

  if (accuracy !== null) {
    return Math.round(accuracy);
  }

  const score = toNumber(result.score, 0);
  const totalMarks = toNumber(result.totalMarks, 0);

  if (totalMarks <= 0) return 0;

  return Math.round((score / totalMarks) * 100);
};

const formatSubmittedAt = (value) => {
  if (!value) return "Not recorded";

  try {
    let dateValue = value;

    if (typeof value?.toDate === "function") {
      dateValue = value.toDate();
    } else if (value?.seconds) {
      dateValue = new Date(value.seconds * 1000);
    } else {
      dateValue = new Date(value);
    }

    if (Number.isNaN(dateValue.getTime())) return "Not recorded";

    return dateValue.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Not recorded";
  }
};

export default function AdminMockTestResultsRoute({
  universalContent = [],
  mockResults = [],
  loadAllMockResults,
  loadLeaderboard,
  navigate,
}) {
  const [searchText, setSearchText] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const hasLoadedAllResultsRef = useRef(false);

  useEffect(() => {
    if (
      hasLoadedAllResultsRef.current ||
      typeof loadAllMockResults !== "function"
    ) {
      return;
    }

    hasLoadedAllResultsRef.current = true;
    loadAllMockResults();
  }, [loadAllMockResults]);

  const mockTests = useMemo(
    () => universalContent.filter((item) => item.section === "mockTest"),
    [universalContent]
  );

  const attemptResults = useMemo(
    () => (Array.isArray(mockResults) ? mockResults : []),
    [mockResults]
  );

  const subjectOptions = useMemo(() => {
    const subjects = [
      ...mockTests.map((test) => test.subject),
      ...attemptResults.map((result) => result.subject),
    ].filter(Boolean);

    return [...new Set(subjects)].sort();
  }, [mockTests, attemptResults]);

  const filteredResults = useMemo(() => {
    const cleanSearch = searchText.trim().toLowerCase();

    return attemptResults.filter((result) => {
      const subjectMatched =
        subjectFilter === "all" || result.subject === subjectFilter;

      const searchMatched =
        !cleanSearch ||
        getStudentLabel(result).toLowerCase().includes(cleanSearch) ||
        getTestTitle(result).toLowerCase().includes(cleanSearch) ||
        String(result.subject || "").toLowerCase().includes(cleanSearch) ||
        String(result.chapter || "").toLowerCase().includes(cleanSearch);

      return subjectMatched && searchMatched;
    });
  }, [attemptResults, searchText, subjectFilter]);

  const totalAttempts = attemptResults.length;

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

  const bestAccuracy =
    totalAttempts > 0
      ? Math.max(...attemptResults.map((result) => getResultPercentage(result)))
      : 0;

  const totalCorrect = attemptResults.reduce(
    (sum, result) => sum + toNumber(result.correctCount, 0),
    0
  );

  const totalWrong = attemptResults.reduce(
    (sum, result) => sum + toNumber(result.wrongCount, 0),
    0
  );

  const testPerformance = useMemo(
    () =>
      mockTests.map((test) => {
        const testResults = attemptResults.filter(
          (result) => result.testId === test.id || result.mockTestId === test.id
        );

        const attempts = testResults.length;

        const averageTestScore =
          attempts > 0
            ? Math.round(
                testResults.reduce(
                  (sum, result) => sum + toNumber(result.score, 0),
                  0
                ) / attempts
              )
            : 0;

        const averageTestAccuracy =
          attempts > 0
            ? Math.round(
                testResults.reduce(
                  (sum, result) => sum + getResultPercentage(result),
                  0
                ) / attempts
              )
            : 0;

        return {
          ...test,
          attempts,
          averageScore: averageTestScore,
          averageAccuracy: averageTestAccuracy,
        };
      }),
    [mockTests, attemptResults]
  );

  const topPerformers = useMemo(
    () =>
      [...filteredResults]
        .sort((a, b) => getResultPercentage(b) - getResultPercentage(a))
        .slice(0, 6),
    [filteredResults]
  );

  const weakChapters = useMemo(() => {
    const chapterMap = new Map();

    attemptResults.forEach((result) => {
      const chapter = result.chapter || "Unknown Chapter";
      const subject = result.subject || "Unknown Subject";
      const current = chapterMap.get(chapter) || {
        chapter,
        subject,
        attempts: 0,
        accuracyTotal: 0,
      };

      current.attempts += 1;
      current.accuracyTotal += getResultPercentage(result);

      chapterMap.set(chapter, current);
    });

    return [...chapterMap.values()]
      .map((chapterItem) => ({
        ...chapterItem,
        averageAccuracy:
          chapterItem.attempts > 0
            ? Math.round(chapterItem.accuracyTotal / chapterItem.attempts)
            : 0,
      }))
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .slice(0, 8);
  }, [attemptResults]);

  const handleRefreshResults = async () => {
    await Promise.all([
      loadAllMockResults?.(),
      loadLeaderboard?.(),
    ]);
  };

  return (
    <section className="coursePages adminMockResultsPage">
      <div className="adminMockResultsHero">
        <div className="adminMockResultsHeroCopy">
          <span className="badge">RESULTS ANALYTICS</span>

          <h1>Mock Test Results Command Center</h1>

          <p>
            A premium admin cockpit for CTET/TET mock-test attempts, accuracy,
            weak chapters, student performance, and test-wise health.
          </p>

          <div className="adminMockResultsHeroActions">
            <button
              type="button"
              className="adminMockResultsPrimaryBtn"
              onClick={handleRefreshResults}
            >
              Refresh Results
            </button>

            <button
              type="button"
              className="adminMockResultsGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/published")}
            >
              Published Tests
            </button>

            <button
              type="button"
              className="adminMockResultsGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockResultsSystemCard">
          <div className="adminMockResultsSystemTop">
            <span>SYSTEM STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockResultsSystemGrid">
            <div>
              <strong>{mockTests.length}</strong>
              <span>Total tests</span>
            </div>

            <div>
              <strong>{totalAttempts}</strong>
              <span>Attempts</span>
            </div>

            <div>
              <strong>{averageAccuracy}%</strong>
              <span>Avg accuracy</span>
            </div>

            <div>
              <strong>{bestAccuracy}%</strong>
              <span>Best accuracy</span>
            </div>
          </div>

          <div className="adminMockResultsFlow">
            <span>Tests</span>
            <i />
            <span>Attempts</span>
            <i />
            <span>Analyze</span>
          </div>
        </div>
      </div>

      <div className="adminMockResultsKpiGrid">
        <div className="adminMockResultsKpiCard">
          <span>Total Tests</span>
          <strong>{mockTests.length}</strong>
          <p>Created exams</p>
        </div>

        <div className="adminMockResultsKpiCard">
          <span>Total Attempts</span>
          <strong>{totalAttempts}</strong>
          <p>Saved results</p>
        </div>

        <div className="adminMockResultsKpiCard">
          <span>Average Score</span>
          <strong>{averageScore}</strong>
          <p>Across attempts</p>
        </div>

        <div className="adminMockResultsKpiCard">
          <span>Average Accuracy</span>
          <strong>{averageAccuracy}%</strong>
          <p>Student accuracy</p>
        </div>
      </div>

      <div className="adminMockResultsToolbar">
        <div>
          <span>Search results</span>
          <input
            type="text"
            value={searchText}
            placeholder="Student, test, subject, chapter..."
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div>
          <span>Subject filter</span>
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjectOptions.map((subject) => (
              <option value={subject} key={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="adminMockResultsGhostBtn"
          onClick={() => {
            setSearchText("");
            setSubjectFilter("all");
          }}
        >
          Clear Filter
        </button>
      </div>

      <div className="adminMockResultsCommandGrid">
        <div className="adminMockResultsPanel adminMockResultsPanelLarge">
          <div className="adminMockResultsPanelHeader">
            <div>
              <span>TEST-WISE PERFORMANCE</span>
              <h2>Mock Test Health</h2>
            </div>

            <small>{testPerformance.length} tests</small>
          </div>

          {testPerformance.length === 0 ? (
            <div className="adminMockResultsEmpty">
              No mock tests found for analytics.
            </div>
          ) : (
            <div className="adminMockResultsTestGrid">
              {testPerformance.map((test) => (
                <article className="adminMockResultsTestCard" key={test.id}>
                  <strong>{test.title}</strong>

                  <p>
                    {test.planType || "FREE"} • {test.subject || "Subject"} •{" "}
                    {test.chapter || "Chapter"}
                  </p>

                  <div className="adminMockResultsMiniStats">
                    <span>Attempts {test.attempts}</span>
                    <span>Score {test.averageScore}</span>
                    <span>Accuracy {test.averageAccuracy}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="adminMockResultsPanel">
          <div className="adminMockResultsPanelHeader">
            <div>
              <span>TOP PERFORMERS</span>
              <h2>Best Attempts</h2>
            </div>

            <small>{topPerformers.length}</small>
          </div>

          {topPerformers.length === 0 ? (
            <div className="adminMockResultsEmpty">No attempts available yet.</div>
          ) : (
            <div className="adminMockResultsTopList">
              {topPerformers.map((result, index) => (
                <article
                  className="adminMockResultsTopCard"
                  key={result.id || `${getStudentLabel(result)}-${index}`}
                >
                  <div className="adminMockResultsRank">#{index + 1}</div>

                  <div>
                    <strong>{getStudentLabel(result)}</strong>
                    <p>{getTestTitle(result)}</p>
                  </div>

                  <div className="adminMockResultsScorePill">
                    {getResultPercentage(result)}%
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adminMockResultsPanel">
        <div className="adminMockResultsPanelHeader">
          <div>
            <span>STUDENT-WISE RESULTS</span>
            <h2>Attempt Records</h2>
          </div>

          <small>{filteredResults.length} attempts</small>
        </div>

        {filteredResults.length === 0 ? (
          <div className="adminMockResultsEmpty">
            No result matched the selected filters.
          </div>
        ) : (
          <div className="adminMockResultsStudentGrid">
            {filteredResults.map((result, index) => (
              <article
                className="adminMockResultsStudentCard"
                key={result.id || `${getStudentLabel(result)}-${index}`}
              >
                <div className="adminMockResultsStudentTop">
                  <div>
                    <strong>{getStudentLabel(result)}</strong>
                    <p>{getTestTitle(result)}</p>
                  </div>

                  <div className="adminMockResultsScorePill">
                    {getResultPercentage(result)}%
                  </div>
                </div>

                <div className="adminMockResultsMetaLine">
                  <span>{result.subject || "Subject"}</span>
                  <span>{result.chapter || "Chapter"}</span>
                  <span>
                    {formatSubmittedAt(
                      result.submittedAt ||
                        result.createdAt ||
                        result.completedAt
                    )}
                  </span>
                </div>

                <div className="adminMockResultsMiniStats">
                  <span>
                    Score {result.score || 0}/{result.totalMarks || 0}
                  </span>
                  <span>Correct {result.correctCount || 0}</span>
                  <span>Wrong {result.wrongCount || 0}</span>
                  <span>Skipped {result.skippedCount || 0}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockResultsPanel">
        <div className="adminMockResultsPanelHeader">
          <div>
            <span>WEAK CHAPTERS</span>
            <h2>Needs Attention</h2>
          </div>

          <small>{weakChapters.length} chapters</small>
        </div>

        {weakChapters.length === 0 ? (
          <div className="adminMockResultsEmpty">No weak chapter data yet.</div>
        ) : (
          <div className="adminMockResultsWeakGrid">
            {weakChapters.map((chapterItem) => (
              <article
                className="adminMockResultsWeakCard"
                key={chapterItem.chapter}
              >
                <div>
                  <strong>{chapterItem.chapter}</strong>
                  <p>{chapterItem.subject}</p>
                </div>

                <div className="adminMockResultsMiniStats">
                  <span>{chapterItem.attempts} Attempts</span>
                  <span>{chapterItem.averageAccuracy}% Avg Accuracy</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
