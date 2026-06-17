import { useParams } from "react-router-dom";

export default function AdminMockTestSubjectRoute({
  universalContent = [],
  navigate,
}) {
  const { subjectName = "" } = useParams();

  const activeSubject = decodeURIComponent(subjectName || "");

  const mockTests = universalContent.filter(
    (item) =>
      item.section === "mockTest" &&
      item.subject === activeSubject
  );

  const chapters = [
    ...new Set(
      mockTests
        .map((test) => test.chapter)
        .filter(Boolean)
    ),
  ];

  return (
    <section className="coursePages">
      <div className="sectionHeader">
        <span className="badge">MOCK TEST SUBJECT</span>

        <h1>{activeSubject}</h1>

        <p>
          Browse all chapters and mock tests inside this subject.
        </p>
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/subjects")
            }
          >
            ← Back to Subjects
          </button>

          <button
            className="publishButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/add")
            }
          >
            + Add Mock Test
          </button>
        </div>
      </div>

      <div className="contentStudioList">
        <h3>Chapters in {activeSubject}</h3>

        {chapters.length === 0 ? (
          <div className="contentStudioItem">
            <strong>No chapters found.</strong>
            <p>Add mock tests under this subject first.</p>
          </div>
        ) : (
          <div className="contentStudioGrid">
            {chapters.map((chapterName) => {
              const chapterTests = mockTests.filter(
                (test) => test.chapter === chapterName
              );

              return (
                <button
                  key={chapterName}
                  className="publishButton"
                  onClick={() =>
                    navigate(
                      `/admin/content/mock-tests/${encodeURIComponent(
                        activeSubject
                      )}/${encodeURIComponent(chapterName)}`
                    )
                  }
                >
                  {chapterName}
                  <br />
                  <small>
                    {chapterTests.length} Test
                    {chapterTests.length > 1 ? "s" : ""}
                  </small>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
