export default function AdminMockTestChaptersRoute({
    universalContent,
    navigate,
  }) {
    const mockTests = (universalContent || []).filter(
      (item) => item.section === "mockTest"
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
          <span className="badge">MOCK TEST CHAPTERS</span>
  
          <h1>Mock Test Chapter Library</h1>
  
          <p>Browse all chapters and open their mock tests.</p>
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
          <h3>All Mock Test Chapters</h3>
  
          {chapters.length === 0 ? (
            <div className="contentStudioItem">
              <strong>No chapters found.</strong>
              <p>Add mock tests first to generate chapters.</p>
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
                        `/admin/content/mock-tests/chapters/${encodeURIComponent(
                          chapterName
                        )}`
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
  