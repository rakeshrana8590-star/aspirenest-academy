export default function AdminMockTestSeriesRoute({
    universalContent,
    navigate,
  }) {
    const mockTests = universalContent.filter(
      (item) => item.section === "mockTest"
    );
  
    const testTypes = [
      ...new Set(
        mockTests
          .map((test) => test.testType || "Mock Test")
          .filter(Boolean)
      ),
    ];
  
    return (
      <section className="coursePages">
        <div className="sectionHeader">
          <span className="badge">TEST SERIES</span>
  
          <h1>Mock Test Series</h1>
  
          <p>
            Organize AspireNest mock tests by chapter tests,
            sectional tests, full length tests, PYQ practice,
            and daily practice sets.
          </p>
        </div>
  
        <div className="contentStudioForm">
          <div className="contentStudioActions">
            <button
              className="backButton"
              onClick={() =>
                navigate("/admin/content/mock-tests")
              }
            >
              ← Back to Mock Tests Manager
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
          <h3>Available Test Series</h3>
  
          {testTypes.length === 0 ? (
            <div className="contentStudioItem">
              <strong>No test series found.</strong>
              <p>Add mock tests first to generate test series.</p>
            </div>
          ) : (
            <div className="contentStudioGrid">
              {testTypes.map((typeName) => {
                const typeTests = mockTests.filter(
                  (test) =>
                    (test.testType || "Mock Test") === typeName
                );
  
                return (
                  <button
                    key={typeName}
                    className="publishButton"
                    onClick={() =>
                      navigate(
                        `/admin/content/mock-tests/test-series/${encodeURIComponent(
                          typeName
                        )}`
                      )
                    }
                  >
                    {typeName}
                    <br />
                    <small>
                      {typeTests.length} Test
                      {typeTests.length > 1 ? "s" : ""}
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
  