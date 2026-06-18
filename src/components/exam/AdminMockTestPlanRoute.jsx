import React from "react";
import { useParams } from "react-router-dom";

export default function AdminMockTestPlanRoute({
  universalContent = [],
  navigate,
}) {
  const { planType } = useParams();
  const activePlan = decodeURIComponent(planType || "FREE");

  const normalize = (value = "") => value.toString().trim().toUpperCase();

  const planMockTests = (universalContent || []).filter(
    (item) =>
      item.section === "mockTest" &&
      normalize(item.planType || "FREE") === normalize(activePlan)
  );

  const subjectCards = [
    ...new Set(planMockTests.map((test) => test.subject).filter(Boolean)),
  ]
    .sort()
    .map((subjectName) => {
      const subjectTests = planMockTests.filter(
        (test) => test.subject === subjectName
      );

      const chapterCount = [
        ...new Set(subjectTests.map((test) => test.chapter).filter(Boolean)),
      ].length;

      const questionCount = subjectTests.reduce(
        (total, test) => total + (test.questions?.length || 0),
        0
      );

      const publishedCount = subjectTests.filter(
        (test) => test.status === "published"
      ).length;

      return {
        subjectName,
        testCount: subjectTests.length,
        chapterCount,
        questionCount,
        publishedCount,
      };
    });

  const totalTests = planMockTests.length;

  const totalSubjects = subjectCards.length;

  const totalChapters = [
    ...new Set(planMockTests.map((test) => test.chapter).filter(Boolean)),
  ].length;

  const totalQuestions = planMockTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const totalPublished = planMockTests.filter(
    (test) => test.status === "published"
  ).length;

  return (
    <section className="coursePages adminMockPlanPage">
      <div className="adminMockPlanHero">
        <div className="adminMockPlanHeroCopy">
          <span className="badge">{activePlan} MOCK TESTS</span>

          <h1>{activePlan} Mock Test Library</h1>

          <p>
            Manage plan-wise mock tests, subject pools, chapter coverage,
            student-visible exams, and question readiness from one premium plan
            command center.
          </p>

          <div className="adminMockPlanHeroActions">
            <button
              type="button"
              className="adminMockPlanPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockPlanGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>

            <button
              type="button"
              className="adminMockPlanGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockPlanSystemCard">
          <div className="adminMockPlanSystemTop">
            <span>PLAN STATUS</span>
            <strong>{activePlan}</strong>
          </div>

          <div className="adminMockPlanSystemGrid">
            <div>
              <strong>{totalSubjects}</strong>
              <span>Subjects</span>
            </div>

            <div>
              <strong>{totalTests}</strong>
              <span>Total tests</span>
            </div>

            <div>
              <strong>{totalQuestions}</strong>
              <span>Questions</span>
            </div>

            <div>
              <strong>{totalPublished}</strong>
              <span>Published</span>
            </div>
          </div>

          <div className="adminMockPlanFlow">
            <span>Plan</span>
            <i />
            <span>Subject</span>
            <i />
            <span>Publish</span>
          </div>
        </div>
      </div>

      <div className="adminMockPlanKpiGrid">
        <div className="adminMockPlanKpiCard">
          <span>Total Tests</span>
          <strong>{totalTests}</strong>
          <p>{activePlan} plan exam records</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Total Subjects</span>
          <strong>{totalSubjects}</strong>
          <p>Subject-wise pools</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Questions connected</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Published</span>
          <strong>{totalPublished}</strong>
          <p>Student-visible tests</p>
        </div>
      </div>

      <div className="adminMockPlanPanel">
        <div className="adminMockPlanPanelHeader">
          <div>
            <span>PLAN SUBJECT LIBRARY</span>
            <h2>{activePlan} Subject Pools</h2>
          </div>

          <small>{subjectCards.length} subjects</small>
        </div>

        {subjectCards.length === 0 ? (
          <div className="adminMockPlanEmpty">
            <strong>No subjects found.</strong>
            <p>Add a mock test in this plan first.</p>
          </div>
        ) : (
          <div className="adminMockPlanGrid">
            {subjectCards.map((subject) => (
              <button
                type="button"
                key={subject.subjectName}
                className="adminMockPlanCard"
                onClick={() => navigate("/admin/content/mock-tests/manage")}
              >
                <span className="adminMockPlanIcon" aria-hidden="true">
                  🧭
                </span>

                <span className="adminMockPlanBody">
                  <strong>{subject.subjectName}</strong>

                  <small>
                    {subject.chapterCount} Chapters • {subject.testCount} Tests
                    • {subject.questionCount} Questions •{" "}
                    {subject.publishedCount} Published
                  </small>
                </span>

                <span className="adminMockPlanArrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockPlanBottomActions">
        <button
          type="button"
          className="adminMockPlanPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Mock Test
        </button>

        <button
          type="button"
          className="adminMockPlanGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          Manage Tests
        </button>

        <button
          type="button"
          className="adminMockPlanGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests")}
        >
          ← Back to Mock Tests Manager
        </button>
      </div>
    </section>
  );
}