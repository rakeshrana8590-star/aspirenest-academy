import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestPlanSubjectRoute({
  universalContent = [],
  navigate,
}) {
  const { planType = "", subjectName = "" } = useParams();

  const activePlan = decodeURIComponent(planType || "");
  const activeSubject = decodeURIComponent(subjectName || "");

  const subjectMockTests = universalContent.filter(
    (item) =>
      item.section === "mockTest" &&
      (item.planType || "FREE") === activePlan &&
      item.subject === activeSubject
  );

  const chaptersInSubject = [
    ...new Set(
      subjectMockTests
        .map((test) => test.chapter)
        .filter(Boolean)
    ),
  ];

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">{activePlan} SUBJECT MOCKS</span>

        <h1>{activeSubject}</h1>

        <p>Manage chapters and mock tests inside this subject.</p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate(`/admin/content/mock-tests/plan/${activePlan}`)
            }
          >
            ← Back to {activePlan}
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
        <h3>Chapters in {activeSubject}</h3>

        {chaptersInSubject.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No chapters found.</strong>
            <p>Add a mock test with chapter under this subject first.</p>
          </div>
        ) : (
          <div className="contentStudioGrid">
            {chaptersInSubject.map((chapterName) => (
              <button
                key={chapterName}
                className="publishButton"
                onClick={() =>
                  navigate(
                    `/admin/content/mock-tests/plan/${activePlan}/${encodeURIComponent(
                      activeSubject
                    )}/${encodeURIComponent(chapterName)}`
                  )
                }
              >
                {chapterName}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
