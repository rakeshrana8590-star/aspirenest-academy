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

  if (accessStatus === "UPCOMING") {
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

  if (accessStatus === "EXPIRED") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Test expired</h3>
          <p>This mock test window is closed.</p>
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
  const totalQuestions = questions.length;

  const savedAttemptState = JSON.parse(
    localStorage.getItem(getAttemptStorageKey(test.id)) || "{}"
  );

  if (!savedAttemptState?.isSubmitted) {
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

  const newStoredAnswers = savedAttemptState?.answers || {};

  const oldStoredAnswers = JSON.parse(
    localStorage.getItem(`mockAttemptAnswers_${test.id}`) || "{}"
  );

  const liveAttemptAnswers =
    mockAttemptState?.[test.id]?.answers || {};

  const attemptAnswers =
    Object.keys(liveAttemptAnswers).length > 0
      ? liveAttemptAnswers
      : Object.keys(newStoredAnswers).length > 0
      ? newStoredAnswers
      : oldStoredAnswers;

  const questionOrder =
    savedAttemptState?.questionOrder?.length
      ? savedAttemptState.questionOrder
      : questions.map((_, index) => index);

  const resultQuestions = questionOrder
    .map((actualQuestionIndex) => questions[actualQuestionIndex])
    .filter(Boolean);

  const correctCount = resultQuestions.filter(
    (question, index) => {
      const actualQuestionIndex = questionOrder[index];

      return (
        attemptAnswers[actualQuestionIndex] &&
        attemptAnswers[actualQuestionIndex] === question.answer
      );
    }
  ).length;

  const skippedCount = resultQuestions.filter((_, index) => {
    const actualQuestionIndex = questionOrder[index];

    return !attemptAnswers[actualQuestionIndex];
  }).length;

  const wrongCount =
    totalQuestions - correctCount - skippedCount;

  const accuracy =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  const totalMarks =
    Number(test.totalMarks) ||
    totalQuestions * Number(test.marksPerQuestion || 1);

  const score = resultQuestions.reduce((sum, question, index) => {
    const actualQuestionIndex = questionOrder[index];
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
  }, 0);

  const percentage =
    totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0;

  const leaderboardEnabled =
    test.leaderboardMode &&
    test.leaderboardMode !== "disabled";

  const canShowLeaderboardButton =
    leaderboardEnabled || isAdmin(user);

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

            rankScore: percentage,
            rankTieBreakerScore: score,

            createdAt: new Date(),
          });
        }
      }

      await loadUserMockResults(user.email);
      await loadLeaderboard();
      await loadMockLeaderboardEntries();

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

  const AutoSaveMockResult = () => {
    React.useEffect(() => {
      if (!test?.id || !user?.email) return;

      const autoSaveKey = `mockResultAutoSaved_${test.id}_${user.email}`;

      if (sessionStorage.getItem(autoSaveKey)) {
        return;
      }

      sessionStorage.setItem(autoSaveKey, "yes");

      saveToLeaderboard(false);
    }, [test?.id, user?.email]);

    return null;
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

            <AutoSaveMockResult />

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