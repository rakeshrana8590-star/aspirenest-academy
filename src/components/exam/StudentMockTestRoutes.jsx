import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import StudentMockTestCard from "./StudentMockTestCard.jsx";
import "./studentMockLeaderboard.css";
import {
  getMockLeaderboardModeLabel,
  getMockLeaderboardScore,
  getPublicMockTestTitle,
  maskMockLeaderboardName,
  rankMockLeaderboardEntries,
} from "./mockLeaderboardUtils.js";

const MOCK_PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const PLAN_LABELS = {
  FREE: "Free Mock Tests",
  BASIC: "Basic Test Library",
  PREMIUM: "Premium Test Library",
  MENTORSHIP: "Mentorship Test Vault",
};

const PLAN_ICONS = {
  FREE: "📝",
  BASIC: "🔷",
  PREMIUM: "⭐",
  MENTORSHIP: "👩‍🏫",
};

const normalizeText = (value = "") =>
  value.toString().trim().toLowerCase();

const parseMockStudentScheduleDateTime = (
  dateValue = "",
  timeValue = "",
  fallbackTime = "00:00"
) => {
  const dateText = String(dateValue || "").trim();
  const timeText = String(timeValue || "").trim();

  if (!dateText) {
    return null;
  }

  const dateTimeText = dateText.includes("T")
    ? dateText
    : `${dateText}T${timeText || fallbackTime}`;

  const parsed = new Date(dateTimeText);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMockStudentScheduleStatus = (test = {}) => {
  const hasScheduleWindow = Boolean(
    test.examStartDate ||
      test.examStartTime ||
      test.examEndDate ||
      test.examEndTime
  );

  if (!hasScheduleWindow) {
    return "AVAILABLE";
  }

  const now = new Date();

  const startDateTime = parseMockStudentScheduleDateTime(
    test.examStartDate,
    test.examStartTime,
    "00:00"
  );

  const endDateTime = parseMockStudentScheduleDateTime(
    test.examEndDate,
    test.examEndTime,
    "23:59"
  );

  if (startDateTime && now < startDateTime) {
    return "UPCOMING";
  }

  if (endDateTime && now > endDateTime) {
    return "EXPIRED";
  }

  return "AVAILABLE";
};

const getPublishedMockTests = (universalContent = []) =>
  universalContent.filter(
    (test) =>
      test.section === "mockTest" &&
      test.status === "published" &&
      getMockStudentScheduleStatus(test) === "AVAILABLE"
  );

const getPlanMockTests = (universalContent = [], planName = "FREE") =>
  getPublishedMockTests(universalContent).filter(
    (test) => (test.planType || "FREE").toUpperCase() === planName
  );

const uniqueByKey = (items = [], keyGetter) =>
  [...new Map(items.map((item) => [keyGetter(item), item])).values()];

const buildSubjectList = (tests = []) =>
  uniqueByKey(
    tests
      .filter((test) => test.subject)
      .map((test) => ({
        id: test.subject.trim(),
        title: test.subject.trim(),
        description: "Chapter-wise premium mock tests",
        count: tests.filter(
          (item) =>
            normalizeText(item.subject) === normalizeText(test.subject)
        ).length,
      })),
    (subject) => normalizeText(subject.id)
  );

const buildChapterList = (tests = []) =>
  uniqueByKey(
    tests
      .filter((test) => test.chapter)
      .map((test) => ({
        id: test.chapter.trim(),
        title: test.chapter.trim(),
        description: "Open chapter tests",
        count: tests.filter(
          (item) =>
            normalizeText(item.chapter) === normalizeText(test.chapter)
        ).length,
      })),
    (chapter) => normalizeText(chapter.id)
  );

  function MockStudentHero({
    badge,
    title,
    text,
    stats = [],
    backLabel,
    onBack,
  }) {
    const primaryStat = stats[0] || {
      label: "Published Tests",
      value: "0",
    };
  
    const secondaryStat = stats[1] || {
      label: "Plans",
      value: "0",
    };
  
    const tertiaryStat = stats[2] || {
      label: "Mode",
      value: "Premium",
    };
  
    return (
      <div className="mockStudentHero">
        <div className="mockStudentCommandHero">
          <div className="mockStudentHeroCopy">
            <div className="mockStudentHeroActions">
              {backLabel && (
                <button
                  type="button"
                  className="mockStudentBackBtn"
                  onClick={onBack}
                >
                  ← {backLabel}
                </button>
              )}
  
              <span className="mockStudentBadge">{badge}</span>
            </div>
  
            <h1>{title}</h1>
  
            <p>{text}</p>
  
            <div className="mockStudentHeroButtons">
              <button
                type="button"
                className="mockStudentPrimaryBtn"
                onClick={() =>
                  document
                    .querySelector(".mockStudentShelf")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Start Practice →
              </button>
  
              <button
                type="button"
                className="mockStudentGhostBtn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Practice Center
              </button>
            </div>
  
            <div className="mockStudentTrustRow">
              <span>✓ Plan protected</span>
              <span>✓ Subject-wise</span>
              <span>✓ Chapter-wise</span>
              <span>✓ Result tracking</span>
            </div>
          </div>
  
          <div className="mockStudentSystemCard">
            <div className="mockStudentSystemTop">
              <span>NOW PRACTICING</span>
              <strong>One App • One System</strong>
            </div>
  
            <div className="mockStudentFeatureCard">
              <span>📝</span>
  
              <div>
                <strong>{title}</strong>
                <p>{badge}</p>
              </div>
            </div>
  
            <div className="mockStudentSystemGrid">
              <div>
                <strong>{primaryStat.value}</strong>
                <span>{primaryStat.label}</span>
              </div>
  
              <div>
                <strong>{secondaryStat.value}</strong>
                <span>{secondaryStat.label}</span>
              </div>
  
              <div>
                <strong>{tertiaryStat.value}</strong>
                <span>{tertiaryStat.label}</span>
              </div>
  
              <div>
                <strong>Live</strong>
                <span>Exam engine</span>
              </div>
            </div>
  
            <div className="mockStudentSystemFlow">
              <span>Plan</span>
              <i />
              <span>Subject</span>
              <i />
              <span>Chapter</span>
              <i />
              <span>Attempt</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

function MockEmptyState({ title, text }) {
  return (
    <div className="mockStudentEmpty">
      <div className="mockStudentEmptyIcon">📝</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function StudentMockTestLibraryRoute({ universalContent = [] }) {
  const navigate = useNavigate();
  const publishedTests = getPublishedMockTests(universalContent);

  return (
    <section className="mockStudentPage">
      <MockStudentHero
        badge="CTET / TET MOCK TESTS"
        title="Practice & Performance Center"
        text="Attempt plan-wise, subject-wise, and chapter-wise mock tests with score tracking and premium exam flow."
        stats={[
          {
            label: "Published Tests",
            value: publishedTests.length,
          },
          {
            label: "Plans",
            value: MOCK_PLAN_ORDER.length,
          },
          {
            label: "Mode",
            value: "Premium",
          },
        ]}
      />

      <div className="mockStudentShelf mockStudentPlanShelfV2">
        <div className="mockStudentShelfHeader mockStudentShelfHeaderV2">
          <span>Mock Test Library</span>
          <h2>Choose your preparation plan</h2>
          <p>
            Select the right plan shelf and continue into subject-wise,
            chapter-wise, and test-wise practice inside one connected exam
            system.
          </p>
        </div>

        <div className="mockStudentPlanGridV2">
          {MOCK_PLAN_ORDER.map((planName) => {
            const planTests = getPlanMockTests(universalContent, planName);
            const subjects = buildSubjectList(planTests);

            return (
              <button
                type="button"
                className={
                  planName === "PREMIUM"
                    ? "mockStudentPlanCardV2 isPremiumPlan"
                    : "mockStudentPlanCardV2"
                }
                key={planName}
                onClick={() =>
                  navigate(`/ctet-tet/mock-tests/plan/${planName}`)
                }
              >
                <div className="mockStudentPlanCardTopV2">
                  <span className="mockStudentPlanIconV2">
                    {PLAN_ICONS[planName]}
                  </span>

                  <span className="mockStudentPlanPillV2">{planName}</span>
                </div>

                <h3>{PLAN_LABELS[planName]}</h3>

                <p>
                  {subjects.length > 0
                    ? `${subjects.length} subject shelves ready for practice.`
                    : "Published mock tests will appear here after admin publishes them."}
                </p>

                <div className="mockStudentPlanStatsV2">
                  <div>
                    <strong>{planTests.length}</strong>
                    <span>Tests</span>
                  </div>

                  <div>
                    <strong>{subjects.length}</strong>
                    <span>Subjects</span>
                  </div>
                </div>

                <div className="mockStudentPlanFooterV2">
                  <span>
                    {planTests.length > 0
                      ? "Open exam shelf"
                      : "Waiting for tests"}
                  </span>

                  <strong>Open →</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mockStudentShelf mockStudentPromisePanelV2">
        <div className="mockStudentPromiseCopyV2">
          <span>ONE APP • ONE SYSTEM</span>

          <h2>No random links. No broken exam flow.</h2>

          <p>
            Plans, subjects, chapters, attempts, results, review, history, and
            leaderboard stay connected inside one premium mock-test experience.
          </p>
        </div>

        <div className="mockStudentPromiseGridV2">
          <div>
            <span>🧭</span>
            <strong>Plan Protected</strong>
            <p>Every test remains connected with plan access and student flow.</p>
          </div>

          <div>
            <span>📚</span>
            <strong>Subject-wise</strong>
            <p>Students continue from plan shelf to subject and chapter.</p>
          </div>

          <div>
            <span>📝</span>
            <strong>Exam Engine</strong>
            <p>Start, attempt, submit, result, and review stay in one system.</p>
          </div>

          <div>
            <span>🏆</span>
            <strong>Performance</strong>
            <p>History, score tracking, and leaderboard stay connected.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StudentMockTestPlanRoute({ universalContent = [] }) {
  const navigate = useNavigate();
  const { plan } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();

  const planTests = getPlanMockTests(universalContent, activePlan);
  const subjects = buildSubjectList(planTests);

  const totalQuestions = planTests.reduce(
    (sum, test) =>
      sum + Number(test.totalQuestions || test.questions?.length || 0),
    0
  );

  return (
    <section className="mockStudentPage">
      <MockStudentHero
        badge={`${activePlan} MOCK TESTS`}
        title={`${activePlan} Practice Library`}
        text="Choose a subject shelf and continue into chapter-wise mock tests with protected access and result tracking."
        backLabel="Back to Mock Tests"
        onBack={() => navigate("/ctet-tet/mock-tests")}
        stats={[
          {
            label: "Subjects",
            value: subjects.length,
          },
          {
            label: "Tests",
            value: planTests.length,
          },
          {
            label: "Questions",
            value: totalQuestions,
          },
        ]}
      />

      <div className="mockStudentShelf mockStudentLevelShelfV2">
        <div className="mockStudentLevelHeaderV2">
          <div>
            <span>{activePlan} Plan</span>

            <h2>Subject-wise test library</h2>

            <p>
              Open a subject node, enter connected chapters, and continue into
              student-visible mock tests from one premium practice flow.
            </p>
          </div>

          <div className="mockStudentLevelStatusV2">
            <strong>{planTests.length}</strong>
            <span>Published tests</span>
          </div>
        </div>

        {subjects.length === 0 ? (
          <MockEmptyState
            title="No mock tests yet"
            text="Published mock tests for this plan will appear here."
          />
        ) : (
          <div className="mockStudentLevelGridV2">
            {subjects.map((subject) => (
              <button
                type="button"
                className="mockStudentLevelCardV2"
                key={subject.id}
                onClick={() =>
                  navigate(
                    `/ctet-tet/mock-tests/plan/${activePlan}/${encodeURIComponent(
                      subject.id
                    )}`
                  )
                }
              >
                <div className="mockStudentLevelCardTopV2">
                  <span className="mockStudentLevelIconV2">📝</span>
                  <span className="mockStudentLevelPillV2">{activePlan}</span>
                </div>

                <h3>{subject.title}</h3>

                <p>{subject.description}</p>

                <div className="mockStudentLevelMiniV2">
                  <div>
                    <strong>{subject.count}</strong>
                    <span>Tests</span>
                  </div>

                  <div>
                    <strong>{totalQuestions}</strong>
                    <span>Questions</span>
                  </div>
                </div>

                <div className="mockStudentLevelFooterV2">
                  <span>Open subject shelf</span>
                  <strong>Continue →</strong>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function StudentMockTestSubjectRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();
  const { plan, subjectId } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const activeSubject = decodeURIComponent(subjectId || "");

  const subjectTests = getPlanMockTests(
    universalContent,
    activePlan
  ).filter(
    (test) =>
      normalizeText(test.subject) === normalizeText(activeSubject)
  );

  const chapters = buildChapterList(subjectTests);

  const totalQuestions = subjectTests.reduce(
    (sum, test) =>
      sum + Number(test.totalQuestions || test.questions?.length || 0),
    0
  );

  return (
    <section className="mockStudentPage">
      <MockStudentHero
        badge={`${activePlan} MOCK TESTS`}
        title={activeSubject || "Subject Library"}
        text="Open a chapter shelf and continue into student-visible mock tests with connected exam flow."
        backLabel="Back to Plan"
        onBack={() =>
          navigate(`/ctet-tet/mock-tests/plan/${activePlan}`)
        }
        stats={[
          {
            label: "Chapters",
            value: chapters.length,
          },
          {
            label: "Tests",
            value: subjectTests.length,
          },
          {
            label: "Questions",
            value: totalQuestions,
          },
        ]}
      />

      <div className="mockStudentShelf mockStudentLevelShelfV2">
        <div className="mockStudentLevelHeaderV2">
          <div>
            <span>{activeSubject || activePlan}</span>

            <h2>Chapter-wise test library</h2>

            <p>
              Continue from subject shelf into chapter-wise mock tests. Every
              chapter stays connected with plan access, attempt flow, result,
              and review.
            </p>
          </div>

          <div className="mockStudentLevelStatusV2">
            <strong>{chapters.length}</strong>
            <span>Chapter shelves</span>
          </div>
        </div>

        {chapters.length === 0 ? (
          <MockEmptyState
            title="No chapters found"
            text="Published chapter tests for this subject will appear here."
          />
        ) : (
          <div className="mockStudentLevelGridV2">
            {chapters.map((chapter) => {
              const chapterTests = subjectTests.filter(
                (test) =>
                  normalizeText(test.chapter) === normalizeText(chapter.id)
              );

              const chapterQuestions = chapterTests.reduce(
                (sum, test) =>
                  sum +
                  Number(test.totalQuestions || test.questions?.length || 0),
                0
              );

              return (
                <button
                  type="button"
                  className="mockStudentLevelCardV2"
                  key={chapter.id}
                  onClick={() =>
                    navigate(
                      `/ctet-tet/mock-tests/plan/${activePlan}/${encodeURIComponent(
                        activeSubject
                      )}/${encodeURIComponent(chapter.id)}`
                    )
                  }
                >
                  <div className="mockStudentLevelCardTopV2">
                    <span className="mockStudentLevelIconV2">📚</span>
                    <span className="mockStudentLevelPillV2">{activePlan}</span>
                  </div>

                  <h3>{chapter.title}</h3>

                  <p>{chapter.description}</p>

                  <div className="mockStudentLevelMiniV2">
                    <div>
                      <strong>{chapter.count}</strong>
                      <span>Tests</span>
                    </div>

                    <div>
                      <strong>{chapterQuestions}</strong>
                      <span>Questions</span>
                    </div>
                  </div>

                  <div className="mockStudentLevelFooterV2">
                    <span>Open chapter shelf</span>
                    <strong>Continue →</strong>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function StudentMockTestChapterRoute({
  universalContent = [],
  hasPlanAccess,
}) {
  const navigate = useNavigate();
  const { plan, subjectId, chapterId } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const activeSubject = decodeURIComponent(subjectId || "");
  const activeChapter = decodeURIComponent(chapterId || "");

  const chapterTests = getPlanMockTests(
    universalContent,
    activePlan
  ).filter(
    (test) =>
      normalizeText(test.subject) === normalizeText(activeSubject) &&
      normalizeText(test.chapter) === normalizeText(activeChapter)
  );

  const totalQuestions = chapterTests.reduce(
    (sum, test) =>
      sum + Number(test.totalQuestions || test.questions?.length || 0),
    0
  );

  return (
    <section className="mockStudentPage">
      <MockStudentHero
        badge={`${activePlan} MOCK CHAPTER`}
        title={activeChapter || "Chapter Tests"}
        text="Choose a student-visible test and continue into the protected exam start flow."
        backLabel="Back to Chapters"
        onBack={() =>
          navigate(
            `/ctet-tet/mock-tests/plan/${activePlan}/${encodeURIComponent(
              activeSubject
            )}`
          )
        }
        stats={[
          {
            label: "Tests",
            value: chapterTests.length,
          },
          {
            label: "Questions",
            value: totalQuestions,
          },
          {
            label: "Access",
            value: activePlan,
          },
        ]}
      />

      <div className="mockStudentShelf mockStudentLevelShelfV2">
        <div className="mockStudentLevelHeaderV2">
          <div>
            <span>{activeSubject || activePlan}</span>

            <h2>Available mock tests</h2>

            <p>
              Start from the correct chapter node. Every test stays connected
              with access, timer, attempt, result, review, and performance
              history.
            </p>
          </div>

          <div className="mockStudentLevelStatusV2">
            <strong>{chapterTests.length}</strong>
            <span>Ready tests</span>
          </div>
        </div>

        {chapterTests.length === 0 ? (
          <MockEmptyState
            title="No tests found"
            text="Published mock tests for this chapter will appear here."
          />
        ) : (
          <div className="mockStudentTestGrid mockStudentChapterTestGridV2">
            {chapterTests.map((test) => (
              <StudentMockTestCard
                key={test.id}
                test={test}
                hasPlanAccess={hasPlanAccess}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function StudentMockTestHistoryRoute({
    mockResults = [],
    user,
  }) {
    const navigate = useNavigate();
  
    const studentResults = mockResults.filter(
      (result) =>
        result.email === user?.email ||
        result.studentEmail === user?.email
    );
  
    const totalAttempts = studentResults.length;
  
    const bestPercentage =
      studentResults.length > 0
        ? Math.max(
            ...studentResults.map((result) =>
              Number(result.percentage || result.accuracy || 0)
            )
          )
        : 0;
  
    const averageAccuracy =
      studentResults.length > 0
        ? Math.round(
            studentResults.reduce(
              (sum, result) =>
                sum + Number(result.accuracy || result.percentage || 0),
              0
            ) / studentResults.length
          )
        : 0;
  
    return (
      <section className="mockStudentPage">
        <MockStudentHero
          badge="MY MOCK TESTS"
          title="Mock Test History"
          text="Track your submitted attempts, scores, accuracy, and result records from one premium practice dashboard."
          backLabel="Back to Mock Tests"
          onBack={() => navigate("/ctet-tet/mock-tests")}
          stats={[
            {
              label: "Attempts",
              value: totalAttempts,
            },
            {
              label: "Best Score",
              value: `${bestPercentage}%`,
            },
            {
              label: "Average Accuracy",
              value: `${averageAccuracy}%`,
            },
          ]}
        />
  
        <div className="mockStudentShelf">
          <div className="mockStudentShelfHeader">
            <span>Attempt Records</span>
            <h2>Your submitted mock tests</h2>
          </div>
  
          {studentResults.length === 0 ? (
            <MockEmptyState
              title="No attempts yet"
              text="Attempted mock tests will appear here after submission."
            />
          ) : (
            <div className="mockStudentTestGrid">
              {[...studentResults]
                .sort((a, b) => {
                  const dateA = a.createdAt?.toDate
                    ? a.createdAt.toDate()
                    : new Date(a.createdAt || 0);
  
                  const dateB = b.createdAt?.toDate
                    ? b.createdAt.toDate()
                    : new Date(b.createdAt || 0);
  
                  return dateB - dateA;
                })
                .map((result, index) => (
                  <article
                    className="mockTestPremiumCard isCompleted"
                    key={result.id || index}
                  >
                    <div className="mockTestPremiumTop">
                      <div className="mockTestPremiumIcon">🏆</div>
  
                      <div className="mockTestPremiumBadges">
                        <span>{result.planType || "MOCK"}</span>
                        <span>Submitted</span>
                      </div>
                    </div>
  
                    <h3>{result.testTitle || "Mock Test"}</h3>
  
                    <p className="mockTestPremiumMeta">
                      {result.subject || "Subject"} •{" "}
                      {result.chapter || "Chapter"}
                    </p>
  
                    <div className="mockTestPremiumStats">
                      <div>
                        <span>Score</span>
                        <strong>
                          {result.score || 0}/{result.totalMarks || 0}
                        </strong>
                      </div>
  
                      <div>
                        <span>Accuracy</span>
                        <strong>
                          {result.accuracy || result.percentage || 0}%
                        </strong>
                      </div>
  
                      <div>
                        <span>Correct</span>
                        <strong>
                          {result.correctCount || result.correct || 0}
                        </strong>
                      </div>
  
                      <div>
                        <span>Wrong / Skipped</span>
                        <strong>
                          {result.wrongCount || result.wrong || 0} /{" "}
                          {result.skippedCount || result.skipped || 0}
                        </strong>
                      </div>
                    </div>
  
                    <div className="mockTestPremiumFooter">
                      <div>
                        <span>Status</span>
                        <strong>Result Saved</strong>
                      </div>
  
                      <button
                        type="button"
                        className="mockTestPremiumButton"
                        onClick={() => {
                          if (result.testId) {
                            navigate(
                              `/ctet-tet/mock-tests/result/${result.testId}`
                            );
                            return;
                          }
  
                          navigate("/ctet-tet/mock-tests");
                        }}
                      >
                        View Result
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      </section>
    );
  }
  
  export function StudentMockLeaderboardRoute({
    mockLeaderboardEntries = [],
    universalContent = [],
    user = null,
  }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [testMenuOpen, setTestMenuOpen] = useState(false);
    const testMenuRef = useRef(null);

    useEffect(() => {
      const handlePointerDown = (event) => {
        if (
          testMenuRef.current &&
          !testMenuRef.current.contains(event.target)
        ) {
          setTestMenuOpen(false);
        }
      };

      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          setTestMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

    const testOptionsMap = new Map();

    (Array.isArray(universalContent) ? universalContent : [])
      .filter(
        (test) =>
          test.section === "mockTest" &&
          test.leaderboardMode &&
          test.leaderboardMode !== "disabled" &&
          test.id
      )
      .forEach((test) => {
        testOptionsMap.set(String(test.id), {
          id: String(test.id),
          title: getPublicMockTestTitle(test.title),
          rawTitle: test.title || "Mock Test",
          leaderboardMode: test.leaderboardMode || "",
        });
      });

    (Array.isArray(mockLeaderboardEntries)
      ? mockLeaderboardEntries
      : []
    ).forEach((entry) => {
      const id = String(
        entry.testId || entry.mockTestId || entry.contentId || ""
      ).trim();

      if (!id || testOptionsMap.has(id)) return;

      testOptionsMap.set(id, {
        id,
        title: getPublicMockTestTitle(
          entry.testTitle || entry.subject || "Mock Test"
        ),
        rawTitle:
          entry.testTitle || entry.subject || "Mock Test",
        leaderboardMode: entry.leaderboardMode || "",
      });
    });

    const testOptions = [...testOptionsMap.values()].sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    const requestedTestId = String(
      searchParams.get("testId") || ""
    ).trim();

    const selectedTest =
      testOptions.find((test) => test.id === requestedTestId) ||
      testOptions[0] ||
      null;

    const resolvedLeaderboard = rankMockLeaderboardEntries(
      mockLeaderboardEntries,
      {
        testId: selectedTest?.id || "",
        preferredMode: selectedTest?.leaderboardMode || "",
        user,
      }
    );

    const formatDuration = (value) => {
      const totalSeconds = Math.max(0, Number(value || 0));
      if (!totalSeconds) return "Time unavailable";

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.round(totalSeconds % 60);

      return minutes
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;
    };

    const decorateResult = (result) => ({
      ...result,
      displayName: maskMockLeaderboardName(result, user),
      scoreValue: getMockLeaderboardScore(result),
      scoreFraction: `${Number(result.score || 0)}/${Number(
        result.totalMarks || 0
      )}`,
      correctValue: Number(
        result.correctCount ?? result.correct ?? 0
      ),
      wrongValue: Number(
        result.wrongCount ?? result.wrong ?? 0
      ),
      skippedValue: Number(
        result.skippedCount ?? result.skipped ?? 0
      ),
      durationLabel: formatDuration(result.durationSeconds),
    });

    const rankedResults = resolvedLeaderboard.ranked.map(
      decorateResult
    );

    const topThree = rankedResults.slice(0, 3);
    const remainingResults = rankedResults.slice(3, 20);
    const ownResult =
      rankedResults.find((result) => result.isOwn) || null;
    const topScore = topThree[0]?.scoreValue || 0;
    const totalStudents = resolvedLeaderboard.total;
    const modeLabel = getMockLeaderboardModeLabel(
      selectedTest?.leaderboardMode || ""
    );
    const selectedTitle =
      selectedTest?.title || "Test-wise Leaderboard";

    const selectTest = (testId) => {
      setSearchParams(testId ? { testId } : {});
      setTestMenuOpen(false);
    };

    return (
      <section className="mockStudentPage mockLeaderboardPage">
        <MockStudentHero
          badge={modeLabel}
          title={selectedTitle}
          text={
            selectedTest
              ? "Live ranking for this selected mock test, with every student compared inside the same test."
              : "Choose a leaderboard-enabled mock test to view its rankings."
          }
          backLabel="Back to Mock Tests"
          onBack={() => navigate("/ctet-tet/mock-tests")}
          stats={[
            {
              label: "Ranked Students",
              value: totalStudents,
            },
            {
              label: "Top Score",
              value: `${topScore}%`,
            },
            {
              label: "Your Rank",
              value: ownResult ? `#${ownResult.rank}` : "—",
            },
          ]}
        />

        <div className="mockLeaderboardBoard">
          <div className="mockLeaderboardBoardHead">
            <div className="mockLeaderboardBoardTitle">
              <span>CHALLENGE LEADERBOARD</span>
              <h2>{selectedTitle}</h2>
              <p>
                Gold, Silver, and Bronze positions are calculated only
                from this selected test.
              </p>
            </div>

            <div
              className={`mockLeaderboardTestSwitcher ${
                testMenuOpen ? "isOpen" : ""
              }`.trim()}
              ref={testMenuRef}
            >
              <span>Select Test</span>

              <button
                type="button"
                className="mockLeaderboardTestButton"
                aria-haspopup="listbox"
                aria-expanded={testMenuOpen}
                disabled={!testOptions.length}
                onClick={() =>
                  setTestMenuOpen((current) => !current)
                }
              >
                <strong>
                  {selectedTest?.rawTitle ||
                    selectedTest?.title ||
                    "No leaderboard tests"}
                </strong>
                <b aria-hidden="true">⌄</b>
              </button>

              {testMenuOpen ? (
                <div
                  className="mockLeaderboardTestMenu"
                  role="listbox"
                  aria-label="Select leaderboard test"
                >
                  {testOptions.map((test) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedTest?.id === test.id}
                      className={
                        selectedTest?.id === test.id
                          ? "isSelected"
                          : ""
                      }
                      key={test.id}
                      onClick={() => selectTest(test.id)}
                    >
                      <span>{test.rawTitle || test.title}</span>
                      {selectedTest?.id === test.id ? (
                        <b>Selected</b>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {rankedResults.length === 0 ? (
            <MockEmptyState
              title={
                selectedTest
                  ? "No rankings for this test yet"
                  : "No leaderboard-enabled tests yet"
              }
              text={
                selectedTest
                  ? "Rankings will appear after students submit this selected mock test."
                  : "Publish a mock test with leaderboard mode enabled."
              }
            />
          ) : (
            <>
              <div
                className="mockLeaderboardPodium"
                aria-label="Top three leaderboard positions"
              >
                {topThree.map((result) => (
                  <article
                    className={`mockLeaderboardPodiumCard isRank${result.rank} ${
                      result.isOwn ? "isOwn" : ""
                    }`.trim()}
                    key={
                      result.id ||
                      result.leaderboardKey ||
                      `${selectedTest?.id}-${result.rank}`
                    }
                  >
                    <div className="mockLeaderboardPodiumTop">
                      <span>
                        {result.rank === 1
                          ? "GOLD"
                          : result.rank === 2
                          ? "SILVER"
                          : "BRONZE"}
                      </span>
                      {result.isOwn ? <b>YOU</b> : null}
                    </div>

                    <div className="mockLeaderboardPodiumRank">
                      <small>RANK</small>
                      <strong>#{result.rank}</strong>
                    </div>

                    <div className="mockLeaderboardPodiumIdentity">
                      <strong>{result.displayName}</strong>
                      <span>
                        {result.correctValue} correct
                        {" • "}
                        {result.durationLabel}
                      </span>
                    </div>

                    <div className="mockLeaderboardPodiumScore">
                      <strong>{result.scoreValue}%</strong>
                      <span>{result.scoreFraction} marks</span>
                    </div>
                  </article>
                ))}
              </div>

              {ownResult && ownResult.rank > 3 ? (
                <div className="mockLeaderboardOwnStrip">
                  <div>
                    <span>Your current position</span>
                    <strong>#{ownResult.rank}</strong>
                  </div>

                  <div>
                    <span>Score</span>
                    <strong>{ownResult.scoreFraction}</strong>
                  </div>

                  <div>
                    <span>Percentage</span>
                    <strong>{ownResult.scoreValue}%</strong>
                  </div>

                  <div>
                    <span>Correct</span>
                    <strong>{ownResult.correctValue}</strong>
                  </div>
                </div>
              ) : null}

              <div className="mockLeaderboardRankList">
                <div className="mockLeaderboardRankListHead">
                  <span>Rank</span>
                  <span>Student</span>
                  <span>Score</span>
                  <span>Accuracy</span>
                  <span>Correct</span>
                  <span>Time</span>
                </div>

                {remainingResults.length ? (
                  remainingResults.map((result) => (
                    <article
                      className={`mockLeaderboardRankRow ${
                        result.isOwn ? "isOwn" : ""
                      }`.trim()}
                      key={
                        result.id ||
                        result.leaderboardKey ||
                        `${selectedTest?.id}-${result.rank}`
                      }
                    >
                      <b>#{result.rank}</b>

                      <div>
                        <strong>{result.displayName}</strong>
                        {result.isOwn ? <small>YOU</small> : null}
                      </div>

                      <span>{result.scoreFraction}</span>
                      <span>{result.scoreValue}%</span>
                      <span>{result.correctValue}</span>
                      <span>{result.durationLabel}</span>
                    </article>
                  ))
                ) : (
                  <div className="mockLeaderboardRankListEmpty">
                    More ranks will appear as additional students
                    complete this test.
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mockLeaderboardBoardActions">
            <button
              type="button"
              onClick={() => navigate("/ctet-tet")}
            >
              Back to Community
            </button>

            <button
              type="button"
              className="isPrimary"
              onClick={() => navigate("/ctet-tet/mock-tests")}
            >
              Practice Mock Tests
            </button>
          </div>
        </div>
      </section>
    );
  }
