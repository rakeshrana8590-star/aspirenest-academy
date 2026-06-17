import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";
import { getAttemptStorageKey } from "./examAttemptStorage.js";

const safeParseJson = (value, fallback = {}) => {
  try {
    return JSON.parse(value || "{}") || fallback;
  } catch {
    return fallback;
  }
};

const hasObjectData = (value) =>
  value && typeof value === "object" && Object.keys(value).length > 0;

const isValidQuestionOrder = (order, totalQuestions) => {
  if (!Array.isArray(order)) return false;
  if (order.length !== totalQuestions) return false;

  const sortedOrder = [...order].sort((a, b) => a - b);

  return sortedOrder.every((item, index) => item === index);
};

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
};

const getPerformanceLabel = (percentage) => {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 50) return "Good Attempt";
  return "Needs Revision";
};

const getPerformanceTone = (percentage) => {
  if (percentage >= 80) return "excellent";
  if (percentage >= 50) return "good";
  return "revision";
};

const AutoSaveMockResult = ({
  testId,
  userEmail,
  saveToLeaderboard,
}) => {
  React.useEffect(() => {
    if (!testId || !userEmail) return;

    const autoSaveKey = `mockResultAutoSaved_${testId}_${userEmail}`;

    if (sessionStorage.getItem(autoSaveKey)) return;

    sessionStorage.setItem(autoSaveKey, "yes");
    saveToLeaderboard(false);
  }, [testId, userEmail, saveToLeaderboard]);

  return null;
};

export default function ExamResultRoute({
  universalContent,
  getMockTestAccessStatus,
  mockAttemptState,
  user,
  fullName,
  isAdmin,
  loadUserMockResults,
  loadLeaderboard,
  loadMockLeaderboardEntries,
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeResultAttemptId = decodeURIComponent(testId || "");

  const test = universalContent.find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeResultAttemptId
  );

  const accessStatus = getMockTestAccessStatus(test);

  const renderStateCard = ({
    label,
    title,
    message,
    actionLabel,
    onAction,
  }) => (
    <section className="examResultPage">
      <div className="examResultShell">
        <div className="examResultStateCard">
          <span>{label}</span>
          <h1>{title}</h1>
          <p>{message}</p>

          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      </div>
    </section>
  );

  if (accessStatus === "NOT_FOUND") {
    return renderStateCard({
      label: "Unavailable",
      title: "Result not found",
      message: "This mock test result is not available anymore.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  const questions = test.questions || [];

  const storedAttemptState = safeParseJson(
    localStorage.getItem(getAttemptStorageKey(test.id))
  );

  const liveAttemptState = mockAttemptState?.[test.id] || {};

  const activeAttemptState = liveAttemptState?.isSubmitted
    ? liveAttemptState
    : storedAttemptState?.isSubmitted
    ? storedAttemptState
    : {};

  const hasSubmittedAttempt = activeAttemptState?.isSubmitted === true;

  if (accessStatus === "UNPUBLISHED") {
    return renderStateCard({
      label: "Unpublished",
      title: "Result unavailable",
      message: "This mock test is not published right now.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (accessStatus === "LOGIN_REQUIRED") {
    return renderStateCard({
      label: "Login Required",
      title: "Login required",
      message: "Please login to view your result.",
      actionLabel: "Login to Continue",
      onAction: () => navigate("/login"),
    });
  }

  if (
    accessStatus === "PLAN_LOCKED" ||
    accessStatus === "EXPIRED_MEMBERSHIP"
  ) {
    return renderStateCard({
      label: "Plan Required",
      title: "Plan required",
      message: `This result needs ${test.planType || "PREMIUM"} access.`,
      actionLabel: "View Pricing",
      onAction: () => navigate("/ctet-tet/pricing"),
    });
  }

  if (accessStatus === "UPCOMING" && !hasSubmittedAttempt) {
    return renderStateCard({
      label: "Upcoming",
      title: "Test upcoming",
      message: "This mock test is scheduled for a future date or time.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (accessStatus === "EXPIRED" && !hasSubmittedAttempt) {
    return renderStateCard({
      label: "Locked",
      title: "Result locked",
      message:
        "This mock test window is closed and no submitted attempt was found on this device.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (!hasSubmittedAttempt) {
    return renderStateCard({
      label: "Locked",
      title: "Result locked",
      message: "Please submit the mock test before viewing result.",
      actionLabel: "Continue Test",
      onAction: () =>
        navigate(`/ctet-tet/mock-tests/attempt/${test.id}`),
    });
  }

  const newStoredAnswers = storedAttemptState?.answers || {};
  const liveAttemptAnswers = liveAttemptState?.answers || {};
  const activeAttemptAnswers = activeAttemptState?.answers || {};

  const oldStoredAnswers = safeParseJson(
    localStorage.getItem(`mockAttemptAnswers_${test.id}`)
  );

  const attemptAnswers = hasObjectData(activeAttemptAnswers)
    ? activeAttemptAnswers
    : hasObjectData(liveAttemptAnswers)
    ? liveAttemptAnswers
    : hasObjectData(newStoredAnswers)
    ? newStoredAnswers
    : oldStoredAnswers;

  const fallbackQuestionOrder = questions.map((_, index) => index);

  const questionOrder = isValidQuestionOrder(
    activeAttemptState?.questionOrder,
    questions.length
  )
    ? activeAttemptState.questionOrder
    : isValidQuestionOrder(
        storedAttemptState?.questionOrder,
        questions.length
      )
    ? storedAttemptState.questionOrder
    : fallbackQuestionOrder;

  const resultQuestions = questionOrder
    .map((actualQuestionIndex) => ({
      actualQuestionIndex,
      question: questions[actualQuestionIndex],
    }))
    .filter((item) => Boolean(item.question));

  const totalQuestions = resultQuestions.length;

  const correctCount = resultQuestions.filter(
    ({ actualQuestionIndex, question }) =>
      attemptAnswers[actualQuestionIndex] &&
      attemptAnswers[actualQuestionIndex] === question.answer
  ).length;

  const skippedCount = resultQuestions.filter(
    ({ actualQuestionIndex }) => !attemptAnswers[actualQuestionIndex]
  ).length;

  const wrongCount = totalQuestions - correctCount - skippedCount;

  const accuracy =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  const calculatedTotalMarks = resultQuestions.reduce(
    (sum, { question }) =>
      sum +
      Number(
        question.positiveMarks ||
          test.marksPerQuestion ||
          1
      ),
    0
  );

  const totalMarks =
    Number(test.totalMarks) ||
    calculatedTotalMarks ||
    totalQuestions * Number(test.marksPerQuestion || 1);

  const score = resultQuestions.reduce(
    (sum, { actualQuestionIndex, question }) => {
      const selected = attemptAnswers[actualQuestionIndex];

      if (!selected) return sum;

      if (selected === question.answer) {
        return (
          sum +
          Number(
            question.positiveMarks ||
              test.marksPerQuestion ||
              1
          )
        );
      }

      return (
        sum -
        Number(
          question.negativeMarks ||
            test.negativeMarks ||
            0
        )
      );
    },
    0
  );

  const percentage =
    totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0;

  const safePercentage = Math.max(0, Math.min(100, percentage));

  const leaderboardEnabled =
    test.leaderboardMode && test.leaderboardMode !== "disabled";

  const isAdminUser = Boolean(isAdmin?.(user));
  const canShowLeaderboardButton = leaderboardEnabled || isAdminUser;

  const startedAt = Number(activeAttemptState.startedAt || Date.now());
  const endedAt = Number(activeAttemptState.submittedAt || Date.now());

  const durationSeconds = Math.max(
    0,
    Math.round((endedAt - startedAt) / 1000)
  );

  const performanceLabel = getPerformanceLabel(percentage);
  const performanceTone = getPerformanceTone(percentage);

  const saveToLeaderboard = async (showAlert = true) => {
    try {
      if (!user?.email) {
        if (showAlert) {
          alert("Please login to save result");
        }

        return false;
      }

      const attemptKey = `${test.id}_${user.email}`;

      const existingResult = await getDocs(
        query(
          collection(db, "mockResults"),
          where("attemptKey", "==", attemptKey)
        )
      );

      if (existingResult.empty) {
        await addDoc(collection(db, "mockResults"), {
          attemptKey,

          testId: test.id,
          testTitle: test.title || "",

          email: user.email,
          studentEmail: user.email,
          studentName: fullName || user.email,

          subject: test.subject || "",
          chapter: test.chapter || "",
          planType: test.planType || "FREE",
          examType: test.examType || "",
          testType: test.testType || "",

          score,
          totalMarks,
          percentage,
          accuracy,

          correctCount,
          wrongCount,
          skippedCount,
          totalQuestions,
          durationSeconds,

          startedAt: activeAttemptState.startedAt || null,
          endedAt: activeAttemptState.submittedAt || null,

          createdAt: new Date(),
        });
      }

      if (leaderboardEnabled) {
        const leaderboardKey = `${test.id}_${user.email}_${test.leaderboardMode}`;

        const existingLeaderboard = await getDocs(
          query(
            collection(db, "mockLeaderboard"),
            where("leaderboardKey", "==", leaderboardKey)
          )
        );

        if (existingLeaderboard.empty) {
          await addDoc(collection(db, "mockLeaderboard"), {
            leaderboardKey,
            leaderboardMode: test.leaderboardMode,

            testId: test.id,
            testTitle: test.title || "",

            studentEmail: user.email,
            studentName: fullName || user.email,

            subject: test.subject || "",
            chapter: test.chapter || "",
            planType: test.planType || "FREE",
            examType: test.examType || "",
            testType: test.testType || "",

            score,
            totalMarks,
            percentage,
            accuracy,

            correctCount,
            wrongCount,
            skippedCount,
            totalQuestions,
            durationSeconds,

            rankScore: percentage,
            rankTieBreakerScore: score,

            startedAt: activeAttemptState.startedAt || null,
            endedAt: activeAttemptState.submittedAt || null,

            createdAt: new Date(),
          });
        }
      }

      await loadUserMockResults?.(user.email);
      await loadLeaderboard?.();
      await loadMockLeaderboardEntries?.();

      if (showAlert) {
        alert(
          leaderboardEnabled
            ? "Result and leaderboard saved ✅"
            : "Result saved ✅ Leaderboard is disabled for this test"
        );
      }

      return true;
    } catch (error) {
      console.error("Save mock result error:", error);

      if (showAlert) {
        alert("Result save failed. Please try again.");
      }

      return false;
    }
  };

  const resultMetrics = [
    {
      tone: "correct",
      label: "Correct",
      value: correctCount,
      text: "Answers matched with the answer key.",
    },
    {
      tone: "wrong",
      label: "Wrong",
      value: wrongCount,
      text: "Review these first to avoid repeat mistakes.",
    },
    {
      tone: "skipped",
      label: "Skipped",
      value: skippedCount,
      text: "Unattempted questions left during the test.",
    },
    {
      tone: "neutral",
      label: "Total Questions",
      value: totalQuestions,
      text: "Final evaluated questions in this attempt.",
    },
  ];

  return (
    <section className="examResultPage">
      <div className="examResultShell">
        <AutoSaveMockResult
          testId={test.id}
          userEmail={user?.email || ""}
          saveToLeaderboard={saveToLeaderboard}
        />

        <div className="examResultHero">
          <div className="examResultHeroContent">
            <span className="examResultBadge">Mock Test Result</span>

            <h1>{test.title}</h1>

            <p>
              {test.planType || "FREE"} · {test.subject || "Subject"} ·{" "}
              {test.chapter || "Complete Test"}
            </p>

            <div className="examResultHeroStats">
              <div>
                <span>Score</span>
                <strong>
                  {score} / {totalMarks}
                </strong>
              </div>

              <div>
                <span>Percentage</span>
                <strong>{percentage}%</strong>
              </div>

              <div>
                <span>Accuracy</span>
                <strong>{accuracy}%</strong>
              </div>

              <div>
                <span>Time</span>
                <strong>{formatDuration(durationSeconds)}</strong>
              </div>
            </div>
          </div>

          <aside className="examResultScorePanel">
            <div
              className={`examResultScoreRing ${performanceTone}`}
              style={{
                "--exam-result-percent": `${safePercentage}%`,
              }}
            >
              <div>
                <strong>{percentage}%</strong>
                <span>{performanceLabel}</span>
              </div>
            </div>

            <p>
              {percentage >= 80
                ? "Strong command. Keep revising and maintain consistency."
                : percentage >= 50
                ? "Good base. Review wrong answers and strengthen weak areas."
                : "Revision needed. Start with incorrect and skipped questions."}
            </p>

            <div className="examResultActionStack">
              <button
                type="button"
                onClick={() =>
                  navigate(`/ctet-tet/mock-tests/review/${test.id}`)
                }
              >
                Review Answers
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => navigate("/ctet-tet/mock-tests")}
              >
                Back to Mock Tests
              </button>
            </div>
          </aside>
        </div>

        <section className="examResultMetricsPanel">
          <div className="examResultMetricRail">
            {resultMetrics.map((metric) => (
              <article
                key={metric.label}
                className={`examResultMetricCard ${metric.tone}`}
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="examResultInsightGrid">
          <article className="examResultInfoCard">
            <h3>Attempt Details</h3>

            <div className="examResultInfoList">
              <p>
                <span>Student</span>
                <strong>{fullName || user?.email || "Student"}</strong>
              </p>

              <p>
                <span>Test Type</span>
                <strong>{test.testType || "Mock Test"}</strong>
              </p>

              <p>
                <span>Exam Type</span>
                <strong>{test.examType || "CTET/TET"}</strong>
              </p>

              <p>
                <span>Duration Used</span>
                <strong>{formatDuration(durationSeconds)}</strong>
              </p>
            </div>
          </article>

          <article className="examResultInfoCard examResultStatusCard">
            <h3>Result Status</h3>

            <div className="examResultStatusBox">
              <strong>{performanceLabel}</strong>
              <span>
                Score saved automatically when this result page opens.
              </span>
            </div>

            <div className="examResultInfoList">
              <p>
                <span>Leaderboard</span>
                <strong>{test.leaderboardMode || "disabled"}</strong>
              </p>

              <p>
                <span>Sync</span>
                <strong>
                  {canShowLeaderboardButton ? "Available" : "Auto saved"}
                </strong>
              </p>
            </div>

            {canShowLeaderboardButton && (
              <button
                type="button"
                className="examResultSyncButton"
                onClick={() => saveToLeaderboard(true)}
              >
                Sync Result
              </button>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}