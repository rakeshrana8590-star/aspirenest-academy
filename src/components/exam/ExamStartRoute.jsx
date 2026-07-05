import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAttemptStorageKey } from "./examAttemptStorage.js";

const safeParseJson = (value, fallback = {}) => {
  try {
    return JSON.parse(value || "{}") || fallback;
  } catch {
    return fallback;
  }
};

const isRuleEnabled = (value) => {
  const normalizedValue = String(value || "")
    .toLowerCase()
    .trim();

  return (
    value === true ||
    normalizedValue === "yes" ||
    normalizedValue === "required" ||
    normalizedValue === "enabled" ||
    normalizedValue === "on"
  );
};

const getDisplayValue = (value, fallback = "Not set") =>
  value || value === 0 ? value : fallback;

const parseAttemptLimit = (value) => {
  const normalized = String(value || "unlimited").trim().toLowerCase();

  if (!normalized || normalized === "unlimited" || normalized === "0") {
    return { isUnlimited: true, max: null };
  }

  const max = Number.parseInt(normalized, 10);

  if (Number.isFinite(max) && max > 0) {
    return { isUnlimited: false, max };
  }

  return { isUnlimited: true, max: null };
};

const countSubmittedMockAttempts = (mockResults = [], testId = "", email = "") =>
  (Array.isArray(mockResults) ? mockResults : []).filter((result) => {
    const sameTest =
      result?.testId === testId ||
      result?.mockTestId === testId ||
      result?.testID === testId ||
      result?.contentId === testId;

    const sameStudent =
      !email ||
      result?.email === email ||
      result?.studentEmail === email ||
      result?.userEmail === email;

    return sameTest && sameStudent;
  }).length;

const hasSavedMockAttempt = (mockResults = [], attemptSaveKey = "") =>
  Boolean(attemptSaveKey) &&
  (Array.isArray(mockResults) ? mockResults : []).some(
    (result) =>
      result?.attemptKey === attemptSaveKey ||
      result?.attemptId === attemptSaveKey
  );

export default function ExamStartRoute({
  universalContent,
  getMockTestAccessStatus,
  getMockTestScheduleStatus,
  getMockTestRules,
  setMockAttemptState,
  mockResults = [],
  user,
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeStartMockTestId = decodeURIComponent(testId || "");

  const test = universalContent.find(
    (item) =>
      item.section === "mockTest" && item.id === activeStartMockTestId
  );

  const accessStatus = getMockTestAccessStatus(test);

  const renderStateCard = ({
    label,
    title,
    message,
    actionLabel,
    onAction,
  }) => (
    <section className="examStartPage">
      <div className="examStartShell">
        <div className="examStartStateCard">
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
      title: "Test not found",
      message: "This mock test is not available anymore.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  const savedStartAttempt = safeParseJson(
    localStorage.getItem(getAttemptStorageKey(test.id))
  );

  const hasStartedAttempt =
    Boolean(savedStartAttempt?.startedAt) &&
    !savedStartAttempt?.isSubmitted;

  const hasSubmittedAttempt = savedStartAttempt?.isSubmitted === true;

  if (accessStatus === "UNPUBLISHED") {
    return renderStateCard({
      label: "Unpublished",
      title: "Test unavailable",
      message: "This mock test is not published yet.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (accessStatus === "LOGIN_REQUIRED") {
    return renderStateCard({
      label: "Login Required",
      title: "Login before starting",
      message: "Please login before starting this mock test.",
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
      title: "Upgrade required",
      message: `This mock test needs ${
        test.planType || "PREMIUM"
      } access.`,
      actionLabel: "View Pricing",
      onAction: () => navigate("/ctet-tet/pricing"),
    });
  }

  if (accessStatus === "UPCOMING" && !hasSubmittedAttempt) {
    return renderStateCard({
      label: "Upcoming",
      title: "Test not started yet",
      message: "This mock test is scheduled for a future date or time.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  if (accessStatus === "EXPIRED" && !hasSubmittedAttempt) {
    return renderStateCard({
      label: "Expired",
      title: "Test window closed",
      message: "This mock test window is closed.",
      actionLabel: "Back to Mock Tests",
      onAction: () => navigate("/ctet-tet/mock-tests"),
    });
  }

  const totalQuestions = test.questions?.length || 0;
  const durationValue = test.durationMinutes || test.duration || "";
  const durationText = durationValue ? `${durationValue}` : "Not specified";
  const durationLabel = durationValue ? `${durationValue} min` : "Not set";
  const marksPerQuestion = Number(test.marksPerQuestion || 1);
  const negativeMarks = Number(test.negativeMarks || 0);
  const totalMarks =
    Number(test.totalMarks) || totalQuestions * marksPerQuestion;
  const passingMarks = Number(test.passingMarks || 0);
  const scheduleStatus = getMockTestScheduleStatus(test);

  const attemptLimitInfo = parseAttemptLimit(test.attemptLimit);
  const activeAttemptSaveKey =
    savedStartAttempt?.startedAt || savedStartAttempt?.submittedAt
      ? `${test.id}_${user?.email || "anonymous"}_${
          savedStartAttempt.startedAt || savedStartAttempt.submittedAt
        }`
      : "";
  const savedSubmittedCount = countSubmittedMockAttempts(
    mockResults,
    test.id,
    user?.email
  );
  const hasSavedCurrentAttempt = hasSavedMockAttempt(
    mockResults,
    activeAttemptSaveKey
  );
  const submittedAttemptCount =
    savedSubmittedCount +
    (hasSubmittedAttempt && !hasSavedCurrentAttempt ? 1 : 0);
  const isAttemptLimitReached =
    !attemptLimitInfo.isUnlimited &&
    submittedAttemptCount >= attemptLimitInfo.max;

  const startPageRules = getMockTestRules(test);
  const isPauseAllowed = isRuleEnabled(startPageRules.allowPause);

  const isFullscreenRequired = isRuleEnabled(test.fullscreenMode);
  const isTabSwitchEnabled = isRuleEnabled(test.tabSwitchDetection);
  const isCopyPasteProtected = isRuleEnabled(test.copyPasteProtection);
  const isCalculatorAllowed = isRuleEnabled(startPageRules.calculatorAllowed);
  const isAutoSubmitOnViolation = isRuleEnabled(test.autoSubmitOnViolation);

  const clearCurrentAttemptState = () => {
    localStorage.removeItem(getAttemptStorageKey(test.id));
    localStorage.removeItem(`mockAttemptAnswers_${test.id}`);

    if (typeof setMockAttemptState === "function") {
      setMockAttemptState((prev) => {
        const next = { ...(prev || {}) };
        delete next[test.id];
        return next;
      });
    }
  };

  const handleStartTest = () => {
    if (hasSubmittedAttempt) {
      if (isAttemptLimitReached) {
        navigate(`/ctet-tet/mock-tests/result/${test.id}`);
        return;
      }

      clearCurrentAttemptState();
      navigate(`/ctet-tet/mock-tests/attempt/${test.id}`);
      return;
    }

    if (hasStartedAttempt && !isPauseAllowed) {
      clearCurrentAttemptState();
    }

    navigate(`/ctet-tet/mock-tests/attempt/${test.id}`);
  };

  const primaryActionLabel =
    hasSubmittedAttempt && isAttemptLimitReached
      ? "View Result"
      : hasSubmittedAttempt
      ? "Attempt Again"
      : hasStartedAttempt && isPauseAllowed
      ? "Resume Test"
      : "Begin Test";

  return (
    <section className="examStartPage">
      <div className="examStartShell">
        <div className="examStartTopBar">
          <button
            type="button"
            className="examStartBackBtn"
            onClick={() => navigate(-1)}
          >
            ← Back to Tests
          </button>

          <div className="examStartTopNote">
            <span></span>
            Timer starts only after entering attempt screen
          </div>
        </div>

        <div className="examStartLaunch">
          <div className="examStartHeroContent">
            <div className="examStartHeroMeta">
              <span className="examStartBadge">Mock Test Start</span>
              <span className="examStartSchedulePill">
                {scheduleStatus}
              </span>
            </div>

            <h1>{test.title}</h1>

            <p>
              {test.planType || "FREE"} · {test.subject || "Subject"} ·{" "}
              {test.chapter || "Complete Test"}
            </p>

            <div className="examStartQuickGrid">
              <div>
                <span>Questions</span>
                <strong>{totalQuestions}</strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>{durationLabel}</strong>
              </div>

              <div>
                <span>Total Marks</span>
                <strong>{totalMarks}</strong>
              </div>

              <div>
                <span>Type</span>
                <strong>{test.testType || "Mock Test"}</strong>
              </div>
            </div>
          </div>

          <aside className="examStartActionPanel">
            <span className="examStartActionLabel">
              {hasSubmittedAttempt
                ? "Attempt Completed"
                : hasStartedAttempt
                ? "Attempt in Progress"
                : "Ready to Begin"}
            </span>

            <strong>{primaryActionLabel}</strong>

            <p>
              Review the rules once. Your attempt, timer, answers, and
              result flow will unlock after this step.
            </p>

            <div className="examStartActionChecks">
              <div>
                <span>Plan</span>
                <strong>{getDisplayValue(test.planType)}</strong>
              </div>

              <div>
                <span>Pause</span>
                <strong>{isPauseAllowed ? "Allowed" : "Not allowed"}</strong>
              </div>
            </div>

            <button type="button" onClick={handleStartTest}>
              {primaryActionLabel}
            </button>
          </aside>
        </div>

        <div className="examStartGrid">
          <div className="examStartCard examStartOverviewCard">
            <div className="examStartCardHead">
              <div className="examStartCardIcon">📝</div>
              <div>
                <h3>Exam Overview</h3>
                <p>Core test configuration</p>
              </div>
            </div>

            <div className="examStartMetricGrid">
              <div>
                <span>Questions</span>
                <strong>{totalQuestions}</strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>{durationText} min</strong>
              </div>

              <div>
                <span>Total Marks</span>
                <strong>{totalMarks}</strong>
              </div>

              <div>
                <span>Negative</span>
                <strong>{negativeMarks}</strong>
              </div>
            </div>

            <div className="examStartInfoList">
              <p>
                <span>Marks per Question</span>
                <strong>{marksPerQuestion}</strong>
              </p>

              <p>
                <span>Passing Marks</span>
                <strong>{passingMarks || "Not set"}</strong>
              </p>

              <p>
                <span>Leaderboard</span>
                <strong>{test.leaderboardMode || "Disabled"}</strong>
              </p>
            </div>
          </div>

          <div className="examStartCard">
            <div className="examStartCardHead">
              <div className="examStartCardIcon">🛡️</div>
              <div>
                <h3>Exam Rules</h3>
                <p>Security and control mode</p>
              </div>
            </div>

            <div className="examStartRuleList">
              <div className={isFullscreenRequired ? "active" : ""}>
                <strong>Fullscreen</strong>
                <span>
                  {isFullscreenRequired ? "Required" : "Not required"}
                </span>
              </div>

              <div className={isTabSwitchEnabled ? "active" : ""}>
                <strong>Tab Switch</strong>
                <span>
                  {isTabSwitchEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className={isCopyPasteProtected ? "active" : ""}>
                <strong>Copy / Paste</strong>
                <span>
                  {isCopyPasteProtected ? "Protected" : "Disabled"}
                </span>
              </div>

              <div className={isAutoSubmitOnViolation ? "active danger" : ""}>
                <strong>Violation Auto Submit</strong>
                <span>
                  {isAutoSubmitOnViolation ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className={isCalculatorAllowed ? "active" : ""}>
                <strong>Calculator</strong>
                <span>
                  {isCalculatorAllowed ? "Allowed" : "Not allowed"}
                </span>
              </div>
            </div>
          </div>

          <div className="examStartCard examStartInstructionCard">
            <div className="examStartCardHead">
              <div className="examStartCardIcon">📋</div>
              <div>
                <h3>Instructions</h3>
                <p>Before you begin</p>
              </div>
            </div>

            <ul>
              <li>Read every question carefully before answering.</li>
              <li>Your timer starts after clicking Begin Test.</li>
              <li>You can mark questions for review during the test.</li>
              <li>Submit is required before result and review unlock.</li>
              <li>Do not refresh the page during active attempt.</li>
            </ul>

            {test.examInstructions && (
              <div className="examStartCustomInstruction">
                {test.examInstructions}
              </div>
            )}
          </div>

          <div className="examStartCard examStartStatusCard">
            <div className="examStartCardHead">
              <div className="examStartCardIcon">⚡</div>
              <div>
                <h3>Attempt Status</h3>
                <p>Current attempt state</p>
              </div>
            </div>

            <div className="examStartStatusBox">
              <strong>
                {hasSubmittedAttempt
                  ? "Submitted"
                  : hasStartedAttempt
                  ? "In Progress"
                  : "Not Started"}
              </strong>

              <span>
                {hasSubmittedAttempt
                  ? "Your result is ready."
                  : hasStartedAttempt && isPauseAllowed
                  ? "You can resume your attempt."
                  : "A fresh attempt will start."}
              </span>
            </div>

            <div className="examStartInfoList">
              <p>
                <span>Schedule</span>
                <strong>{scheduleStatus}</strong>
              </p>

              <p>
                <span>Navigation</span>
                <strong>{startPageRules.navigationMode || "free"}</strong>
              </p>

              <p>
                <span>Pause</span>
                <strong>{isPauseAllowed ? "Allowed" : "Not allowed"}</strong>
              </p>
            </div>

            <button
              type="button"
              className="examStartSecondaryAction"
              onClick={handleStartTest}
            >
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}