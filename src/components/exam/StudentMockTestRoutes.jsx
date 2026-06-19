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

const getPublishedMockTests = (universalContent = []) =>
  universalContent.filter(
    (test) =>
      test.section === "mockTest" &&
      test.status === "published"
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

      <div className="mockStudentShelf">
        <div className="mockStudentShelfHeader">
          <span>Mock Test Library</span>
          <h2>Choose your preparation plan</h2>
        </div>

        <div className="mockStudentPlanGrid">
          {MOCK_PLAN_ORDER.map((planName) => {
            const planTests = getPlanMockTests(
              universalContent,
              planName
            );

            const subjects = buildSubjectList(planTests);

            return (
              <button
                type="button"
                className="mockStudentPlanCard"
                key={planName}
                onClick={() =>
                  navigate(`/ctet-tet/mock-tests/plan/${planName}`)
                }
              >
                <div className="mockStudentPlanTop">
                  <span className="mockStudentPlanIcon">
                    {PLAN_ICONS[planName]}
                  </span>

                  <span className="mockStudentPlanPill">
                    {planName}
                  </span>
                </div>

                <h3>{PLAN_LABELS[planName]}</h3>

                <p>
                  {subjects.length > 0
                    ? `${subjects.length} subjects available`
                    : "Published mock tests will appear here."}
                </p>

                <div className="mockStudentPlanStats">
                  <span>{planTests.length} Tests</span>
                  <strong>Open →</strong>
                </div>
              </button>
            );
          })}
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

  return (
    <section className="mockStudentPage">
      <MockStudentHero
        badge={`${activePlan} MOCK TESTS`}
        title={`${activePlan} Subject Library`}
        text="Choose a subject to open chapters and available tests."
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
            label: "Access",
            value: activePlan,
          },
        ]}
      />

      <div className="mockStudentShelf">
        <div className="mockStudentShelfHeader">
          <span>{activePlan} Plan</span>
          <h2>Subject-wise test library</h2>
        </div>

        {subjects.length === 0 ? (
          <MockEmptyState
            title="No mock tests yet"
            text="Published mock tests for this plan will appear here."
          />
        ) : (
          <div className="mockStudentGrid">
            {subjects.map((subject) => (
              <button
                type="button"
                className="mockStudentTile"
                key={subject.id}
                onClick={() =>
                  navigate(
                    `/ctet-tet/mock-tests/plan/${activePlan}/${encodeURIComponent(
                      subject.id
                    )}`
                  )
                }
              >
                <div className="mockStudentTileIcon">📝</div>

                <h3>{subject.title}</h3>

                <p>{subject.description}</p>

                <span>{subject.count} Test{subject.count > 1 ? "s" : ""}</span>
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

  return (
    <section className="mockStudentPage">
      <MockStudentHero
        badge={`${activePlan} MOCK TESTS`}
        title={activeSubject || "Subject Library"}
        text="Subject-wise chapters with structured practice tests."
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
            label: "Plan",
            value: activePlan,
          },
        ]}
      />

      <div className="mockStudentShelf">
        <div className="mockStudentShelfHeader">
          <span>{activeSubject}</span>
          <h2>Choose chapter</h2>
        </div>

        {chapters.length === 0 ? (
          <MockEmptyState
            title="No chapters found"
            text="Published chapter tests for this subject will appear here."
          />
        ) : (
          <div className="mockStudentGrid">
            {chapters.map((chapter) => (
              <button
                type="button"
                className="mockStudentTile"
                key={chapter.id}
                onClick={() =>
                  navigate(
                    `/ctet-tet/mock-tests/plan/${activePlan}/${encodeURIComponent(
                      activeSubject
                    )}/${encodeURIComponent(chapter.id)}`
                  )
                }
              >
                <div className="mockStudentTileIcon">📚</div>

                <h3>{chapter.title}</h3>

                <p>{chapter.description}</p>

                <span>{chapter.count} Test{chapter.count > 1 ? "s" : ""}</span>
              </button>
            ))}
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
        text="Chapter-wise available mock tests. Select a test to start practice."
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

      <div className="mockStudentShelf">
        <div className="mockStudentShelfHeader">
          <span>{activeSubject}</span>
          <h2>Available mock tests</h2>
        </div>

        {chapterTests.length === 0 ? (
          <MockEmptyState
            title="No tests found"
            text="Published mock tests for this chapter will appear here."
          />
        ) : (
          <div className="mockStudentTestGrid">
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