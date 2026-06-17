import { doc, updateDoc } from "firebase/firestore";

import {
  buildMockTestFormFromTest,
  buildMockTestQuestionsFormFromTest,
} from "./mockTestFormUtils.js";

export default function AdminMockTestPublishedRoute({
  db,
  universalContent,
  setEditingMockTestId,
  setMockTestForm,
  setMockTestQuestionsForm,
  loadContentItemsFromFirestore,
  handleDeleteLocalContentItem,
  navigate,
}) {
  const publishedMockTests = universalContent.filter(
    (item) => item.section === "mockTest" && item.status === "published"
  );

  const handleEditTest = (test) => {
    setEditingMockTestId(test.id);
    setMockTestForm(buildMockTestFormFromTest(test));
    setMockTestQuestionsForm(buildMockTestQuestionsFormFromTest(test));
    navigate("/admin/content/mock-tests/add");
  };

  const handleUnpublishTest = async (test) => {
    await updateDoc(doc(db, "contentItems", test.id), {
      status: "unpublished",
      updatedAt: new Date(),
    });

    await loadContentItemsFromFirestore();
    alert("Mock test unpublished successfully ✅");
  };

  const handleDeleteTest = (test) => {
    if (
      window.confirm(
        `Delete "${test.title}" permanently?\n\nStudents may lose access to this published test.\n\nThis action cannot be undone.`
      )
    ) {
      handleDeleteLocalContentItem(test.id);
    }
  };

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">PUBLISHED MOCK TESTS</span>

        <h1>Published Mock Tests</h1>

        <p>
          Review all student-ready published mock tests with quick preview,
          edit, unpublish, and delete actions.
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
        <h3>Student-Visible Tests</h3>

        {publishedMockTests.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No published tests found.</strong>
            <p>Publish mock tests from Manage Mock Tests first.</p>
          </div>
        ) : (
          publishedMockTests.map((test) => (
            <div className="contentStudioItem" key={test.id}>
              <strong>{test.title}</strong>

              <p>
                {test.planType || "FREE"} • {test.subject || "No Subject"} •{" "}
                {test.chapter || "No Chapter"} •{" "}
                {test.testType || "Mock Test"}
              </p>

              <p>
                {test.questions?.length || 0} Questions • {test.duration || 0}{" "}
                min • {test.examType || "CTET/TET"}
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
                  onClick={() => handleUnpublishTest(test)}
                >
                  Unpublish
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
