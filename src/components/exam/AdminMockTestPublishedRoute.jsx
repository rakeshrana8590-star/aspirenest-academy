
import { updateContentItemWithMirrors } from "../../publicContentCatalogService";

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
  const mockTests = universalContent.filter(
    (item) => item.section === "mockTest"
  );

  const publishedMockTests = mockTests.filter(
    (item) => item.status === "published"
  );

  const totalQuestions = publishedMockTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const freeTests = publishedMockTests.filter(
    (test) => test.planType === "FREE"
  ).length;

  const premiumTests = publishedMockTests.filter(
    (test) => test.planType === "PREMIUM"
  ).length;

  const subjectCount = [
    ...new Set(publishedMockTests.map((test) => test.subject).filter(Boolean)),
  ].length;

  const chapterCount = [
    ...new Set(publishedMockTests.map((test) => test.chapter).filter(Boolean)),
  ].length;

  const averageDuration =
    publishedMockTests.length > 0
      ? Math.round(
          publishedMockTests.reduce(
            (total, test) => total + Number(test.duration || 0),
            0
          ) / publishedMockTests.length
        )
      : 0;

  const handleEditTest = (test) => {
    setEditingMockTestId(test.id);
    setMockTestForm(buildMockTestFormFromTest(test));
    setMockTestQuestionsForm(buildMockTestQuestionsFormFromTest(test));
    navigate("/admin/content/mock-tests/add");
  };

  const handleUnpublishTest = async (test) => {
    const confirmUnpublish = window.confirm(
      `Unpublish "${test.title}"?\n\nStudents will lose access until it is published again.`
    );

    if (!confirmUnpublish) return;

    await updateContentItemWithMirrors(test.id, {
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
    <section className="coursePages adminMockPublishedPage">
      <div className="adminMockPublishedHero">
        <div className="adminMockPublishedHeroCopy">
          <span className="badge">PUBLISHED MOCK TESTS</span>

          <h1>Published Mock Tests Command Center</h1>

          <p>
            Review every student-visible mock test, verify plan access,
            question readiness, duration, subject coverage, and safely control
            preview, edit, unpublish, or delete actions.
          </p>

          <div className="adminMockPublishedHeroActions">
            <button
              type="button"
              className="adminMockPublishedPrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockPublishedGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/manage")}
            >
              Manage Tests
            </button>

            <button
              type="button"
              className="adminMockPublishedGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockPublishedSystemCard">
          <div className="adminMockPublishedSystemTop">
            <span>PUBLISH STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockPublishedSystemGrid">
            <div>
              <strong>{publishedMockTests.length}</strong>
              <span>Published tests</span>
            </div>

            <div>
              <strong>{totalQuestions}</strong>
              <span>Live questions</span>
            </div>

            <div>
              <strong>{subjectCount}</strong>
              <span>Subjects</span>
            </div>

            <div>
              <strong>{averageDuration}</strong>
              <span>Avg minutes</span>
            </div>
          </div>

          <div className="adminMockPublishedFlow">
            <span>Build</span>
            <i />
            <span>Publish</span>
            <i />
            <span>Student Live</span>
          </div>
        </div>
      </div>

      <div className="adminMockPublishedKpiGrid">
        <div className="adminMockPublishedKpiCard">
          <span>Published Tests</span>
          <strong>{publishedMockTests.length}</strong>
          <p>Student-visible exams</p>
        </div>

        <div className="adminMockPublishedKpiCard">
          <span>Live Questions</span>
          <strong>{totalQuestions}</strong>
          <p>Ready for students</p>
        </div>

        <div className="adminMockPublishedKpiCard">
          <span>FREE Shelf</span>
          <strong>{freeTests}</strong>
          <p>Public access tests</p>
        </div>

        <div className="adminMockPublishedKpiCard">
          <span>PREMIUM Shelf</span>
          <strong>{premiumTests}</strong>
          <p>Paid plan tests</p>
        </div>
      </div>

      <div className="adminMockPublishedPanel">
        <div className="adminMockPublishedPanelHeader">
          <div>
            <span>STUDENT-VISIBLE TESTS</span>
            <h2>Published Test Library</h2>
          </div>

          <small>{publishedMockTests.length} live</small>
        </div>

        {publishedMockTests.length === 0 ? (
          <div className="adminMockPublishedEmpty">
            <strong>No published tests found.</strong>
            <p>Publish mock tests from Manage Tests first.</p>
          </div>
        ) : (
          <div className="adminMockPublishedGrid">
            {publishedMockTests.map((test) => {
              const questionCount = test.questions?.length || 0;

              return (
                <article className="adminMockPublishedCard" key={test.id}>
                  <div className="adminMockPublishedCardTop">
                    <div>
                      <span>{test.planType || "FREE"}</span>
                      <h3>{test.title || "Untitled Mock Test"}</h3>
                    </div>

                    <small>Published</small>
                  </div>

                  <p>
                    {test.subject || "No Subject"} •{" "}
                    {test.chapter || "No Chapter"} •{" "}
                    {test.testType || "Mock Test"}
                  </p>

                  <div className="adminMockPublishedMetaGrid">
                    <div>
                      <span>Questions</span>
                      <strong>{questionCount}</strong>
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

                  <div className="adminMockPublishedMiniStats">
                    <span>{test.resultPublishMode || "Result mode"}</span>
                    <span>{test.leaderboardMode || "Leaderboard"}</span>
                    <span>{test.examLanguage || "English"}</span>
                  </div>

                  <div className="adminMockPublishedActions">
                    <button
                      type="button"
                      className="adminMockPublishedPrimaryBtn"
                      onClick={() =>
                        navigate(`/admin/content/mock-tests/preview/${test.id}`)
                      }
                    >
                      Preview
                    </button>

                    <button
                      type="button"
                      className="adminMockPublishedGhostBtn"
                      onClick={() => handleEditTest(test)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="adminMockPublishedGhostBtn"
                      onClick={() => handleUnpublishTest(test)}
                    >
                      Unpublish
                    </button>

                    <button
                      type="button"
                      className="adminMockPublishedDangerBtn"
                      onClick={() => handleDeleteTest(test)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="adminMockPublishedBottomActions">
        <button
          type="button"
          className="adminMockPublishedPrimaryBtn"
          onClick={() => navigate("/admin/content/mock-tests/add")}
        >
          + Add Mock Test
        </button>

        <button
          type="button"
          className="adminMockPublishedGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests/manage")}
        >
          Manage Tests
        </button>

        <button
          type="button"
          className="adminMockPublishedGhostBtn"
          onClick={() => navigate("/admin/content/mock-tests")}
        >
          ← Back to Mock Tests Manager
        </button>
      </div>
    </section>
  );
}