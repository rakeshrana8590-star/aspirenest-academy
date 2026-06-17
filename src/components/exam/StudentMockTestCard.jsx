import React from "react";
import { useNavigate } from "react-router-dom";

import { getAttemptStorageKey } from "./examAttemptStorage.js";

export default function StudentMockTestCard({
  test,
  hasPlanAccess = () => false,
}) {
  const navigate = useNavigate();

  const getSavedAttempt = () => {
    try {
      return JSON.parse(
        localStorage.getItem(getAttemptStorageKey(test.id)) || "{}"
      );
    } catch {
      return {};
    }
  };

  const savedCardAttempt = getSavedAttempt();

  const hasSubmittedCardAttempt =
    savedCardAttempt?.isSubmitted === true;

  const hasStartedCardAttempt =
    Boolean(savedCardAttempt?.startedAt) &&
    !hasSubmittedCardAttempt;

  const isPlanLocked =
    test.planType !== "FREE" &&
    !hasPlanAccess(test.planType);

  const totalQuestions =
    Number(test.totalQuestions || test.questions?.length || 0);

  const duration =
    test.durationMinutes || test.duration || "Not set";

  const totalMarks =
    Number(test.totalMarks) ||
    totalQuestions * Number(test.marksPerQuestion || 1);

  const accessLabel = isPlanLocked
    ? "Locked"
    : hasSubmittedCardAttempt
    ? "Completed"
    : hasStartedCardAttempt
    ? "Resume"
    : "Ready";

  const actionLabel = isPlanLocked
    ? "Unlock Plan"
    : hasSubmittedCardAttempt
    ? "View Result"
    : hasStartedCardAttempt
    ? "Resume Test"
    : "Start Test";

  const handleOpenTest = () => {
    if (isPlanLocked) {
      navigate("/ctet-tet/pricing");
      return;
    }

    navigate(
      hasSubmittedCardAttempt
        ? `/ctet-tet/mock-tests/result/${test.id}`
        : `/ctet-tet/mock-tests/start/${test.id}`
    );
  };

  return (
    <article
      className={`mockTestPremiumCard ${
        hasSubmittedCardAttempt ? "isCompleted" : ""
      }`}
    >
      <div className="mockTestPremiumTop">
        <div className="mockTestPremiumIcon">📝</div>

        <div className="mockTestPremiumBadges">
          <span>{test.planType || "FREE"}</span>
          <span>{accessLabel}</span>
        </div>
      </div>

      <h3>{test.title}</h3>

      <p className="mockTestPremiumMeta">
        {test.subject || "Subject"} • {test.chapter || "Complete Test"}
      </p>

      <div className="mockTestPremiumStats">
        <div>
          <span>Questions</span>
          <strong>{totalQuestions}</strong>
        </div>

        <div>
          <span>Duration</span>
          <strong>{duration} min</strong>
        </div>

        <div>
          <span>Marks</span>
          <strong>{totalMarks}</strong>
        </div>

        <div>
          <span>Type</span>
          <strong>{test.testType || "Mock Test"}</strong>
        </div>
      </div>

      <div className="mockTestPremiumFooter">
        <div>
          <span>Access</span>
          <strong>{isPlanLocked ? "Plan Required" : "Available"}</strong>
        </div>

        <button
          type="button"
          className="mockTestPremiumButton"
          onClick={handleOpenTest}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}