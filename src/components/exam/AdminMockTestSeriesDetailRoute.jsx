import React from "react";
import { useParams } from "react-router-dom";

import { updateContentItemWithMirrors } from "../../publicContentCatalogService";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
  createEmptyMockQuestion,
} from "./mockTestFormUtils.js";

export default function AdminMockTestSeriesDetailRoute({
  db,
  universalContent = [],
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  loadContentItemsFromFirestore,
  handleDeleteLocalContentItem,
  navigate,
}) {
  const { seriesName } = useParams();
  const activeSeries = decodeURIComponent(seriesName || "Mock Test");

  const seriesTests = (universalContent || []).filter(
    (item) =>
      item.section === "mockTest" &&
      (item.testType || "Mock Test") === activeSeries
  );

  const totalTests = seriesTests.length;

  const totalQuestions = seriesTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const totalPublished = seriesTests.filter(
    (test) => test.status === "published"
  ).length;

  const totalDraft = seriesTests.filter(
    (test) => (test.status || "draft") !== "published"
  ).length;

  const subjectCount = [
    ...new Set(seriesTests.map((test) => test.subject).filter(Boolean)),
  ].length;

  const chapterCount = [
    ...new Set(seriesTests.map((test) => test.chapter).filter(Boolean)),
  ].length;

  const premiumCount = seriesTests.filter(
    (test) => test.planType === "PREMIUM"
  ).length;

  const avgDuration =
    totalTests === 0
      ? 0
      : Math.round(
          seriesTests.reduce(
            (total, test) => total + Number(test.duration || 0),
            0
          ) / totalTests
        );

  const handleEditTest = (test) => {
    setEditingMockTestId(test.id);

    setMockTestForm(buildMockTestFormFromTest(test));

    setMockTestQuestionsForm(
      test.questions?.length
        ? buildMockTestQuestionsFormFromTest(test)
        : [createEmptyMockQuestion()]
    );

    navigate("/admin/content/mock-tests/add");
  };

  const handleToggleStatus = async (test) => {
    const newStatus =
      test.status === "published" ? "unpublished" : "published";

    await updateContentItemWithMirrors(test.id, {
      status: newStatus,
      updatedAt: new Date(),
    });

    await loadContentItemsFromFirestore();

    alert(
      newStatus === "published"
        ? "Mock test published successfully ✅"
        : "Mock test unpublished successfully ✅"
    );
  };

  const handleDeleteTest = (test) => {
    if (
      window.confirm(
        `Delete "${test.title}" permanently?\n\nThis action cannot be undone.`
      )
    ) {
      handleDeleteLocalContentItem(test.id);
    }
  };

  const getStatusLabel = (status = "draft") =>
    status === "published" ? "Published" : "Unpublished";

  return (
    <section className="coursePages adminMockSeriesDetailPage">
      <div className="adminMockSeriesDetailHero">
        <div className="adminMockSeriesDetailHeroCopy">
          <span className="badge">TEST SERIES DETAIL</span>

          <h1>{activeSeries} Command Center</h1>

          <p>
            Review every mock test inside this series, verify plan access,
            subject coverage, duration, questions, publish state, and safely
            control preview, edit, publish, or delete actions.
          </p>

          <div className="adminMockSeriesDetailHeroActions">
            <button
              type="button"
              className="adminMockSeriesDetailPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockSeriesDetailGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/test-series")}
            >
              ← Back to Series
            </button>

            <button
              type="button"
              className="adminMockSeriesDetailGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>
          </div>
        </div>

        <div className="adminMockSeriesDetailSystemCard">
          <div className="adminMockSeriesDetailSystemTop">
            <span>SERIES STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockSeriesDetailSystemGrid">
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

            <div>
              <strong>{premiumCount}</strong>
              <span>Premium</span>
            </div>
          </div>

          <div className="adminMockSeriesDetailFlow">
            <span>Preview</span>
            <i />
            <span>Edit</span>
            <i />
            <span>Publish</span>
          </div>
        </div>
      </div>

      <div className="adminMockSeriesDetailKpiGrid">
        <div className="adminMockSeriesDetailKpiCard">
          <span>Total Tests</span>
          <strong>{totalTests}</strong>
          <p>Tests inside this series</p>
        </div>

        <div className="adminMockSeriesDetailKpiCard">
          <span>Total Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Questions connected</p>
        </div>

        <div className="adminMockSeriesDetailKpiCard">
          <span>Subjects</span>
          <strong>{subjectCount}</strong>
          <p>Subject coverage</p>
        </div>

        <div className="adminMockSeriesDetailKpiCard">
          <span>Avg Duration</span>
          <strong>{avgDuration}</strong>
          <p>Minutes per test</p>
        </div>
      </div>

      <div className="adminMockSeriesDetailMiniGrid">
        <div className="adminMockSeriesDetailMiniCard">
          <span>Published</span>
          <strong>{totalPublished}</strong>
          <p>Student-visible tests</p>
        </div>

        <div className="adminMockSeriesDetailMiniCard">
          <span>Unpublished</span>
          <strong>{totalDraft}</strong>
          <p>Draft or hidden tests</p>
        </div>

        <div className="adminMockSeriesDetailMiniCard">
          <span>Chapters</span>
          <strong>{chapterCount}</strong>
          <p>Chapter coverage</p>
        </div>

        <div className="adminMockSeriesDetailMiniCard">
          <span>Premium</span>
          <strong>{premiumCount}</strong>
          <p>Paid plan tests</p>
        </div>
      </div>

      <div className="adminMockSeriesDetailPanel">
        <div className="adminMockSeriesDetailPanelHeader">
          <div>
            <span>SERIES TEST LIBRARY</span>
            <h2>Tests in {activeSeries}</h2>
          </div>

          <small>{seriesTests.length} tests</small>
        </div>

        {seriesTests.length === 0 ? (
          <div className="adminMockSeriesDetailEmpty">
            <strong>No tests found.</strong>
            <p>Add mock tests under this test series first.</p>
          </div>
        ) : (
          <div className="adminMockSeriesDetailGrid">
            {seriesTests.map((test) => (
              <article className="adminMockSeriesDetailCard" key={test.id}>
                <div className="adminMockSeriesDetailCardTop">
                  <div>
                    <span className="adminMockSeriesDetailPlanPill">
                      {test.planType || "FREE"}
                    </span>

                    <h3>{test.title || "Untitled Mock Test"}</h3>

                    <p>
                      {test.subject || "No Subject"} •{" "}
                      {test.chapter || "No Chapter"} •{" "}
                      {test.testType || activeSeries}
                    </p>
                  </div>

                  <span
                    className={
                      test.status === "published"
                        ? "adminMockSeriesDetailStatusPill isPublished"
                        : "adminMockSeriesDetailStatusPill"
                    }
                  >
                    {getStatusLabel(test.status)}
                  </span>
                </div>

                <div className="adminMockSeriesDetailStats">
                  <div>
                    <span>Questions</span>
                    <strong>{test.questions?.length || 0}</strong>
                  </div>

                  <div>
                    <span>Duration</span>
                    <strong>{test.duration || 0} min</strong>
                  </div>

                  <div>
                    <span>Exam</span>
                    <strong>{test.examType || "CTET/TET"}</strong>
                  </div>

                  <div>
                    <span>Difficulty</span>
                    <strong>{test.examDifficulty || "Mixed"}</strong>
                  </div>
                </div>

                <div className="adminMockSeriesDetailMetaLine">
                  <span>{test.resultPublishMode || "instant"}</span>
                  <span>{test.leaderboardMode || "disabled"}</span>
                  <span>{test.examLanguage || "English"}</span>
                </div>

                <div className="adminMockSeriesDetailActions">
                  <button
                    type="button"
                    className="adminMockSeriesDetailPrimaryBtn"
                    onClick={() =>
                      navigate(`/admin/content/mock-tests/preview/${test.id}`)
                    }
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className="adminMockSeriesDetailGhostBtn"
                    onClick={() => handleEditTest(test)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="adminMockSeriesDetailGhostBtn"
                    onClick={() => handleToggleStatus(test)}
                  >
                    {test.status === "published" ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    className="adminMockSeriesDetailDangerBtn"
                    onClick={() => handleDeleteTest(test)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockSeriesDetailBottomActions">
        <button
          type="button"
          className="adminMockSeriesDetailPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Mock Test
        </button>

        <button
          type="button"
          className="adminMockSeriesDetailGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/test-series")}
        >
          ← Back to Test Series
        </button>

        <button
          type="button"
          className="adminMockSeriesDetailGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests")}
        >
          ← Back to Mock Tests Manager
        </button>
      </div>
    </section>
  );
}