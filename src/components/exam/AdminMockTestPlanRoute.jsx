import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestPlanRoute({
  universalContent = [],
  navigate,
}) {
  const { planType } = useParams();
  const activePlan = decodeURIComponent(planType || "FREE");

  const planMockTests = universalContent.filter(
    (item) =>
      item.section === "mockTest" &&
      (item.planType || "FREE") === activePlan
  );

  const subjectsInPlan = [
    ...new Set(
      planMockTests
        .map((test) => test.subject)
        .filter(Boolean)
    ),
  ];

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">
          {activePlan} MOCK TESTS
        </span>

        <h1>{activePlan} Mock Test Library</h1>

        <p>
          Manage subjects, chapters, and mock tests inside the {activePlan} plan.
        </p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests")}
          >
            ← Back to Mock Tests Manager
          </button>

          <button
            className="publishButton"
            onClick={() => navigate("/admin/content/mock-tests/add")}
          >
            + Add Mock Test
          </button>
        </div>
      </div>

      <div className="contentStudioList">
        <h3>Subjects in {activePlan}</h3>

        {subjectsInPlan.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No subjects found.</strong>
            <p>Add a mock test in this plan first.</p>
          </div>
        ) : (
          <div className="contentStudioGrid">
            {subjectsInPlan.map((subjectName) => (
              <button
                key={subjectName}
                className="publishButton"
                onClick={() =>
                  navigate(
                    `/admin/content/mock-tests/plan/${activePlan}/${encodeURIComponent(
                      subjectName
                    )}`
                  )
                }
              >
                {subjectName}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
