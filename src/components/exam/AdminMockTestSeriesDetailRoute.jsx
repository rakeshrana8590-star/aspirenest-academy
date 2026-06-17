import React from "react";
import { useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
  createEmptyMockQuestion,
} from "./mockTestFormUtils.js";

export default function AdminMockTestSeriesDetailRoute({
  db,
  universalContent,
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  loadContentItemsFromFirestore,
  handleDeleteLocalContentItem,
  navigate,
}) {
  const { seriesName } = useParams();
  const activeSeries = decodeURIComponent(seriesName || "");

  const seriesTests = universalContent.filter(
    (item) =>
      item.section === "mockTest" &&
      (item.testType || "Mock Test") === activeSeries
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

    await updateDoc(doc(db, "contentItems", test.id), {
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

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">TEST SERIES DETAIL</span>

        <h1>{activeSeries}</h1>

        <p>Browse all mock tests inside this test series.</p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests/test-series")}
          >
            ← Back to Test Series
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
        <h3>Tests in {activeSeries}</h3>

        {seriesTests.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No tests found.</strong>
            <p>Add mock tests under this test series first.</p>
          </div>
        ) : (
          seriesTests.map((test) => (
            <div className="contentStudioItem" key={test.id}>
              <strong>{test.title}</strong>

              <p>
                {test.planType || "FREE"} • {test.subject || "No Subject"} •{" "}
                {test.chapter || "No Chapter"} • {test.testType || "Mock Test"} •{" "}
                {test.status || "draft"}
              </p>

              <p>
                {test.questions?.length || 0} Questions • {test.duration || 0} min •{" "}
                {test.examType || "CTET/TET"}
              </p>

              <div className="contentStudioActions">
                <button
                  className="publishButton"
                  onClick={() =>
                    navigate(`/admin/content/mock-tests/preview/${test.id}`)
                  }
                >
                  Preview
                </button>

                <button
                  className="publishButton"
                  onClick={() => handleEditTest(test)}
                >
                  Edit
                </button>

                <button
                  className="backButton"
                  onClick={() => handleToggleStatus(test)}
                >
                  {test.status === "published" ? "Unpublish" : "Publish"}
                </button>

                <button
                  className="deleteContentButton"
                  onClick={() => handleDeleteTest(test)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
