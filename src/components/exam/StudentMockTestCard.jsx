import React from "react";
import { useNavigate } from "react-router-dom";

import { getAttemptStorageKey } from "./examAttemptStorage.js";

export default function StudentMockTestCard({
  test,
  hasPlanAccess,
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
  const hasSubmittedCardAttempt = savedCardAttempt?.isSubmitted;

  return (
    <div className="pdfMiniCard" key={test.id}>
      <div className="pdfIcon">📝</div>

      <h3>{test.title}</h3>

      <p>
        {test.subject} · {test.chapter}
      </p>

      <span>
        {test.planType} · {test.testType || "Mock Test"}
      </span>

      <button
        className="btnLink"
        onClick={() => {
          if (
            test.planType !== "FREE" &&
            !hasPlanAccess(test.planType)
          ) {
            navigate("/ctet-tet/pricing");
            return;
          }

          navigate(
            hasSubmittedCardAttempt
              ? `/ctet-tet/mock-tests/result/${test.id}`
              : `/ctet-tet/mock-tests/start/${test.id}`
          );
        }}
      >
        {hasSubmittedCardAttempt ? "View Result" : "Start Test"}
      </button>
    </div>
  );
}