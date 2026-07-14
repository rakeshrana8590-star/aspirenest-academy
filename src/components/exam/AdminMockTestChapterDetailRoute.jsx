import React from "react";
import { useParams } from "react-router-dom";

import { updateContentItemWithMirrors } from "../../publicContentCatalogService";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./mockTestFormUtils.js";

export default function AdminMockTestChapterDetailRoute({
  db,
  universalContent,
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  loadContentItemsFromFirestore,
  handleDeleteLocalContentItem,
  navigate,
}) {
  const { chapterName } = useParams();
  const activeChapter = decodeURIComponent(chapterName || "");

  const mockTests = universalContent.filter(
    (item) => item.section === "mockTest" && item.chapter === activeChapter
  );

  const handleEditTest = (test) => {
    setEditingMockTestId(test.id);
    setMockTestForm(buildMockTestFormFromTest(test));
    setMockTestQuestionsForm(buildMockTestQuestionsFormFromTest(test));
    navigate("/admin/content/mock-tests/add");
  };

  const handleTogglePublish = async (test) => {
    const newStatus = test.status === "published" ? "unpublished" : "published";

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

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">MOCK TEST CHAPTER</span>

        <h1>{activeChapter}</h1>

        <p>Browse all tests inside this chapter.</p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/admin/content/mock-tests/chapters")}
          >
            ← Back to Chapters
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
        <h3>Tests in {activeChapter}</h3>

        {mockTests.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No tests found.</strong>

            <p>Add mock tests first.</p>
          </div>
        ) : (
          mockTests.map((test) => (
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
                  onClick={() => handleTogglePublish(test)}
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
