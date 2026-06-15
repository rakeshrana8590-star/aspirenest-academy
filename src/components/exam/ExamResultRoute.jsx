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

const AutoSaveMockResult = ({
  testId,
  userEmail,
  saveToLeaderboard,
}) => {
  React.useEffect(() => {
    if (!testId || !userEmail) return;

    const autoSaveKey = `mockResultAutoSaved_${testId}_${userEmail}`;

    if (sessionStorage.getItem(autoSaveKey)) {
      return;
    }

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

  if (accessStatus === "NOT_FOUND") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Result not found</h3>
          <p>This mock test result is not available anymore.</p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
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

  const hasSubmittedAttempt =
    activeAttemptState?.isSubmitted === true;

  if (accessStatus === "UNPUBLISHED") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Result unavailable</h3>
          <p>This mock test is not published right now.</p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "LOGIN_REQUIRED") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Login required</h3>
          <p>Please login to view your result.</p>
          <button
            className="btnLink"
            onClick={() => navigate("/login")}
          >
            Login to Continue
          </button>
        </div>
      </section>
    );
  }

  if (
    accessStatus === "PLAN_LOCKED" ||
    accessStatus === "EXPIRED_MEMBERSHIP"
  ) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Plan required</h3>
          <p>
            This result needs {test.planType || "PREMIUM"} access.
          </p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/pricing")}
          >
            View Pricing
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "UPCOMING" && !hasSubmittedAttempt) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Test upcoming</h3>
          <p>
            This mock test is scheduled for a future date or time.
          </p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  if (accessStatus === "EXPIRED" && !hasSubmittedAttempt) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Result locked</h3>
          <p>
            This mock test window is closed and no submitted attempt
            was found on this device.
          </p>
          <button
            className="btnLink"
            onClick={() => navigate("/ctet-tet/mock-tests")}
          >
            Back to Mock Tests
          </button>
        </div>
      </section>
    );
  }

  if (!hasSubmittedAttempt) {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Result locked</h3>
          <p>Please submit the mock test before viewing result.</p>
          <button
            className="btnLink"
            onClick={() =>
              navigate(`/ctet-tet/mock-tests/attempt/${test.id}`)
            }
          >
            Continue Test
          </button>
        </div>
      </section>
    );
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

  const wrongCount =
    totalQuestions - correctCount - skippedCount;

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

  const leaderboardEnabled =
    test.leaderboardMode &&
    test.leaderboardMode !== "disabled";

  const canShowLeaderboardButton =
    leaderboardEnabled || isAdmin(user);

  const startedAt = Number(activeAttemptState.startedAt || Date.now());
  const endedAt = Number(activeAttemptState.submittedAt || Date.now());

  const durationSeconds = Math.max(
    0,
    Math.round((endedAt - startedAt) / 1000)
  );

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

  return (
    <section className="notesSubjectRoutePage">
      <div key={test.id}>
        <span className="notesSubjectRouteBadge">
          MOCK TEST RESULT
        </span>

        <h1>Result: {test.title}</h1>

        <p>
          {test.planType} · {test.subject} · {test.chapter}
        </p>

        <div className="pdfShelfRow">
          <div className="pdfMiniCard">
            <div className="pdfIcon">🏆</div>

            <h3>Score Summary</h3>

            <p>Total Questions: {totalQuestions}</p>
            <p>Correct: {correctCount}</p>
            <p>Wrong: {wrongCount}</p>
            <p>Skipped: {skippedCount}</p>

            <p>
              Score: {score} / {totalMarks}
            </p>

            <span>Accuracy: {accuracy}%</span>

            {canShowLeaderboardButton && (
              <p>
                Leaderboard: {test.leaderboardMode || "disabled"}
              </p>
            )}

            <button
              className="btnLink"
              onClick={() =>
                navigate(`/ctet-tet/mock-tests/review/${test.id}`)
              }
            >
              Review Answers
            </button>

            <AutoSaveMockResult
              testId={test.id}
              userEmail={user?.email || ""}
              saveToLeaderboard={saveToLeaderboard}
            />

            {canShowLeaderboardButton && (
              <button
                className="btnLink"
                onClick={() => saveToLeaderboard(true)}
              >
                Sync Result
              </button>
            )}
          </div>

          <div className="pdfMiniCard">
            <div className="pdfIcon">📊</div>

            <h3>Performance</h3>

            <p>Percentage: {percentage}%</p>

            <span>
              {percentage >= 80
                ? "Excellent"
                : percentage >= 50
                ? "Good Attempt"
                : "Needs Revision"}
            </span>

            <button
              className="btnLink"
              onClick={() => navigate("/ctet-tet/mock-tests")}
            >
              Back to Mock Tests
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}