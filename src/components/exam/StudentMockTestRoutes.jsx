import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentMockTestCard from "./StudentMockTestCard.jsx";

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

const getMockScheduleMs = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    const time = value.toDate().getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = new Date(trimmed).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getMockScheduleStartMs = (test = {}) =>
  getMockScheduleMs(
    test.startTime ||
      test.startDate ||
      test.startAt ||
      test.startsAt ||
      test.scheduledStart ||
      test.scheduledStartAt ||
      test.scheduleStart ||
      test.availableFrom ||
      test.publishAt
  );

const getMockScheduleEndMs = (test = {}) =>
  getMockScheduleMs(
    test.endTime ||
      test.endDate ||
      test.endAt ||
      test.endsAt ||
      test.scheduledEnd ||
      test.scheduledEndAt ||
      test.scheduleEnd ||
      test.availableUntil ||
      test.expireAt
  );

const isMockVisibleForStudents = (test = {}) => {
  if (test.section !== "mockTest") return false;
  if (test.status !== "published" && test.status !== "live") return false;

  const now = Date.now();
  const startMs = getMockScheduleStartMs(test);
  const endMs = getMockScheduleEndMs(test);

  if (startMs && now < startMs) return false;
  if (endMs && now > endMs) return false;

  return true;
};

const getPublishedMockTests = (universalContent = []) =>
  universalContent.filter(isMockVisibleForStudents);

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
    mockResults = [],
  }) {
    const navigate = useNavigate();
  
    const rankedResults = [...mockResults]
      .sort(
        (a, b) =>
          Number(b.percentage || b.accuracy || 0) -
            Number(a.percentage || a.accuracy || 0) ||
          Number(b.score || 0) - Number(a.score || 0)
      )
      .slice(0, 20);
  
    const topScore =
      rankedResults.length > 0
        ? Number(
            rankedResults[0].percentage ||
              rankedResults[0].accuracy ||
              0
          )
        : 0;
  
    const totalStudents = new Set(
      rankedResults.map(
        (result) =>
          result.studentEmail ||
          result.email ||
          result.studentName ||
          result.id
      )
    ).size;
  
    return (
      <section className="mockStudentPage">
        <MockStudentHero
          badge="LEADERBOARD"
          title="Top Student Rankings"
          text="See top performers from submitted mock tests and compare score, accuracy, and rank."
          backLabel="Back to Mock Tests"
          onBack={() => navigate("/ctet-tet/mock-tests")}
          stats={[
            {
              label: "Ranked Entries",
              value: rankedResults.length,
            },
            {
              label: "Students",
              value: totalStudents,
            },
            {
              label: "Top Score",
              value: `${topScore}%`,
            },
          ]}
        />
  
        <div className="mockStudentShelf">
          <div className="mockStudentShelfHeader">
            <span>Performance Rankings</span>
            <h2>Leaderboard</h2>
          </div>
  
          {rankedResults.length === 0 ? (
            <MockEmptyState
              title="No rankings yet"
              text="Leaderboard will appear after students submit mock tests."
            />
          ) : (
            <div className="mockStudentTestGrid">
              {rankedResults.map((result, index) => (
                <article
                  className="mockTestPremiumCard isCompleted"
                  key={result.id || index}
                >
                  <div className="mockTestPremiumTop">
                    <div className="mockTestPremiumIcon">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : "🏆"}
                    </div>
  
                    <div className="mockTestPremiumBadges">
                      <span>Rank #{index + 1}</span>
                      <span>
                        {result.percentage || result.accuracy || 0}%
                      </span>
                    </div>
                  </div>
  
                  <h3>
                    {result.studentName ||
                      result.studentEmail ||
                      result.email ||
                      "Student"}
                  </h3>
  
                  <p className="mockTestPremiumMeta">
                    {result.testTitle || "Mock Test"}
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
                      <span>Rank</span>
                      <strong>#{index + 1}</strong>
                    </div>
  
                    <button
                      type="button"
                      className="mockTestPremiumButton"
                      onClick={() => navigate("/ctet-tet/mock-tests")}
                    >
                      Practice More
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