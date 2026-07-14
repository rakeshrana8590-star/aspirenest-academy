import React from "react";
import { useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./mockTestFormUtils.js";

export default function AdminMockTestPlanChapterRoute({
  db,
  universalContent,
  mockTestSearch,
  setMockTestSearch,
  mockTestStatusFilter,
  setMockTestStatusFilter,
  mockTestExamFilter,
  setMockTestExamFilter,
  mockTestSortMode,
  setMockTestSortMode,
  handleImportMockTestJson,
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  loadContentItemsFromFirestore,
  handleDeleteLocalContentItem,
  navigate,
}) {
  const { planType = "FREE", subjectName = "", chapterName = "" } =
    useParams();

  const activePlan = decodeURIComponent(planType || "FREE");
  const activeSubject = decodeURIComponent(subjectName || "");
  const activeChapter = decodeURIComponent(chapterName || "");

  const chapterMockTests = (universalContent || [])
    .filter(
      (item) =>
        item.section === "mockTest" &&
        (item.planType || "FREE") === activePlan &&
        item.subject === activeSubject &&
        item.chapter === activeChapter
    )
    .filter((test) => {
      const searchText = mockTestSearch.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        test.title?.toLowerCase().includes(searchText) ||
        test.subject?.toLowerCase().includes(searchText) ||
        test.chapter?.toLowerCase().includes(searchText);

      const matchesStatus =
        mockTestStatusFilter === "ALL" || test.status === mockTestStatusFilter;

      const matchesExam =
        mockTestExamFilter === "ALL" || test.examType === mockTestExamFilter;

      return matchesSearch && matchesStatus && matchesExam;
    })
    .sort((a, b) => {
      const firstDate = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
      const secondDate = b.createdAt?.seconds || b.updatedAt?.seconds || 0;

      return mockTestSortMode === "OLDEST"
        ? firstDate - secondDate
        : secondDate - firstDate;
    });

  const handleEditTest = (test) => {
    setEditingMockTestId(test.id);
    setMockTestForm(buildMockTestFormFromTest(test));
    setMockTestQuestionsForm(buildMockTestQuestionsFormFromTest(test));
    navigate("/admin/content/mock-tests/add");
  };

  const handleTogglePublish = async (test) => {
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
        <span className="badge">{activePlan} CHAPTER MOCKS</span>

        <h1>{activeChapter}</h1>

        <p>Review and manage mock tests inside {activeSubject}.</p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate(
                `/admin/content/mock-tests/plan/${activePlan}/${encodeURIComponent(
                  activeSubject
                )}`
              )
            }
          >
            ← Back to {activeSubject}
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
        <h3>Mock Tests in {activeChapter}</h3>

        <div className="contentStudioGrid">
          <label className="publishButton">
            Import JSON
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImportMockTestJson}
            />
          </label>

          <input
            type="text"
            placeholder="Search Test Title..."
            value={mockTestSearch}
            onChange={(event) => setMockTestSearch(event.target.value)}
          />

          <select
            value={mockTestStatusFilter}
            onChange={(event) => setMockTestStatusFilter(event.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="unpublished">Unpublished</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={mockTestExamFilter}
            onChange={(event) => setMockTestExamFilter(event.target.value)}
          >
            <option value="ALL">All Exams</option>
            <option value="CTET">CTET</option>
            <option value="TET">TET</option>
            <option value="SSC">SSC</option>
            <option value="UPSC">UPSC</option>
            <option value="NEET">NEET</option>
          </select>

          <select
            value={mockTestSortMode}
            onChange={(event) => setMockTestSortMode(event.target.value)}
          >
            <option value="LATEST">Latest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>

        {chapterMockTests.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No mock tests found.</strong>

            <p>Add a mock test under this chapter first.</p>
          </div>
        ) : (
          chapterMockTests.map((test) => (
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
