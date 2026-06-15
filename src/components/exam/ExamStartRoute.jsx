import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAttemptStorageKey } from "./examAttemptStorage.js";

export default function ExamStartRoute({
  universalContent,
  getMockTestAccessStatus,
  getMockTestScheduleStatus,
  getMockTestRules,
  setMockAttemptState,
}) {
  const navigate = useNavigate();
  const { testId } = useParams();

  const activeStartMockTestId = decodeURIComponent(testId || "");

  const test = universalContent.find(
    (item) =>
      item.section === "mockTest" &&
      item.id === activeStartMockTestId
  );

  const accessStatus = getMockTestAccessStatus(test);

  if (accessStatus === "NOT_FOUND") {
    return (
      <section className="notesSubjectRoutePage">
        <div className="pdfMiniCard">
          <h3>Test not found</h3>
          <p>This mock test is not available anymore.</p>
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
          <h3>Test unavailable</h3>
          <p>This mock test is not published yet.</p>
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
          <p>Please login before starting this mock test.</p>
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
            This mock test needs {test.planType || "PREMIUM"} access.
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
          <p>This mock test is scheduled for a future date or time.</p>
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

  const savedStartAttempt = JSON.parse(
    localStorage.getItem(getAttemptStorageKey(test.id)) || "{}"
  );

  const hasStartedAttempt =
    savedStartAttempt?.startedAt &&
    !savedStartAttempt?.isSubmitted;

  const hasSubmittedAttempt = savedStartAttempt?.isSubmitted;

  const totalQuestions = test.questions?.length || 0;
  const durationText =
    test.durationMinutes || test.duration || "Not specified";
  const marksPerQuestion = Number(test.marksPerQuestion || 1);
  const negativeMarks = Number(test.negativeMarks || 0);
  const totalMarks =
    Number(test.totalMarks) || totalQuestions * marksPerQuestion;
  const passingMarks = Number(test.passingMarks || 0);
  const scheduleStatus = getMockTestScheduleStatus(test);

  const startPageRules = getMockTestRules(test);

  const isPauseAllowed = startPageRules.allowPause === "yes";

  return (
    <section className="notesSubjectRoutePage">
      <div key={test.id}>
        <button onClick={() => navigate(-1)}>
          ← Back to Tests
        </button>

        <span className="notesSubjectRouteBadge">
          MOCK TEST START
        </span>

        <h1>{test.title}</h1>

        <p>
          {test.planType} · {test.subject} · {test.chapter}
        </p>

        <div className="pdfShelfRow">
          <div className="pdfMiniCard">
            <div className="pdfIcon">📝</div>

            <h3>Exam Overview</h3>

            <p>Type: {test.testType || "Mock Test"}</p>
            <p>Questions: {totalQuestions}</p>
            <p>Duration: {durationText} minutes</p>
            <p>Total Marks: {totalMarks}</p>
            <p>Marks per Question: {marksPerQuestion}</p>
            <p>Negative Marks: {negativeMarks}</p>
            <p>Passing Marks: {passingMarks || "Not set"}</p>

            <span>
              {test.planType} · {scheduleStatus}
            </span>
          </div>

          <div className="pdfMiniCard">
            <div className="pdfIcon">📋</div>

            <h3>Instructions</h3>

            <p>Read every question carefully before answering.</p>
            <p>Your timer will start after clicking Begin Test.</p>
            <p>You can mark questions for review during the test.</p>
            <p>Submit is required before result and review unlock.</p>
            <p>Do not refresh the page during active attempt.</p>

            <button
              className="btnLink"
              onClick={() => {
                if (hasSubmittedAttempt) {
                  navigate(`/ctet-tet/mock-tests/result/${test.id}`);
                  return;
                }

                if (hasStartedAttempt && !isPauseAllowed) {
                  localStorage.removeItem(getAttemptStorageKey(test.id));

                  setMockAttemptState((prev) => {
                    const next = { ...prev };
                    delete next[test.id];
                    return next;
                  });
                }

                navigate(`/ctet-tet/mock-tests/attempt/${test.id}`);
              }}
            >
              {hasSubmittedAttempt
                ? "View Result"
                : hasStartedAttempt && isPauseAllowed
                ? "Resume Test"
                : "Begin Test"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}