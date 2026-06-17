import React from "react";
import { doc, updateDoc } from "firebase/firestore";

import { deleteMockTest } from "./mockTestAdminActions.js";

export default function AdminMockTestManageRoute({
  db,
  universalContent,
  mockResults,
  mockTestSearch,
  setMockTestSearch,
  mockTestStatusFilter,
  setMockTestStatusFilter,
  mockTestExamFilter,
  setMockTestExamFilter,
  mockTestSortMode,
  setMockTestSortMode,
  mockTestPlanFilter,
  setMockTestPlanFilter,
  selectedMockTestIds,
  setSelectedMockTestIds,
  mockTestPage,
  setMockTestPage,
  mockTestsPerPage,
  mockImportXlsxUrl,
  setMockImportXlsxUrl,
  loadContentItemsFromFirestore,
  handleImportMockTestJson,
  handleImportMockTestXlsx,
  handleDownloadMockTestXlsxTemplate,
  openMockActionPortal,
  navigate,
}) {
  return (
    <section className="coursePages adminMockManagePage">
            <div className="sectionHeader">
              <span className="badge">
                MANAGE MOCK TESTS
              </span>

              <h1>Manage Mock Tests</h1>

              <p>
                Review, edit, publish, unpublish,
                preview, and delete all saved CTET/TET
                mock tests from one professional manager.
              </p>
            </div>

            <div className="contentStudioForm">
              <div className="contentStudioGrid">

              <input
      type="text"
      placeholder="Search by title, subject, or chapter"
      value={mockTestSearch}
      onChange={(e) => setMockTestSearch(e.target.value)}
    />

    <select
      value={mockTestStatusFilter}
      onChange={(e) => setMockTestStatusFilter(e.target.value)}
    >
      <option value="ALL">All Status</option>
      <option value="published">Published</option>
      <option value="unpublished">Unpublished</option>
      <option value="draft">Draft</option>
      <option value="archived">Archived</option>
    </select>

    <select
      value={mockTestExamFilter}
      onChange={(e) => setMockTestExamFilter(e.target.value)}
    >
      <option value="ALL">All Exams</option>
      <option value="CTET">CTET</option>
      <option value="TET">TET</option>
      <option value="CTET/TET">CTET/TET</option>
    </select>

    <select
      value={mockTestSortMode}
      onChange={(e) => setMockTestSortMode(e.target.value)}
    >
      <option value="LATEST">Latest First</option>
      <option value="OLDEST">Oldest First</option>
    </select>

                <button
                  onClick={() =>
                    setMockTestPlanFilter("ALL")
                  }
                >
                  ALL
                </button>

                <button
                  onClick={() =>
                    setMockTestPlanFilter("FREE")
                  }
                >
                  FREE
                </button>

                <button
                  onClick={() =>
                    setMockTestPlanFilter("BASIC")
                  }
                >
                  BASIC
                </button>

                <button
                  onClick={() =>
                    setMockTestPlanFilter("PREMIUM")
                  }
                >
                  PREMIUM
                </button>

                <button
                  onClick={() =>
                    setMockTestPlanFilter("MENTORSHIP")
                  }
                >
                  MENTORSHIP
                </button>
              </div>
            </div>

            <div className="mockManageStatsGrid">
      {(() => {
        const filteredStatsTests = universalContent.filter((item) => {
          const searchText =
            mockTestSearch.trim().toLowerCase();

          const matchesSearch =
            !searchText ||
            item.title?.toLowerCase().includes(searchText) ||
            item.subject?.toLowerCase().includes(searchText) ||
            item.chapter?.toLowerCase().includes(searchText);

          const matchesPlan =
            mockTestPlanFilter === "ALL" ||
            item.planType === mockTestPlanFilter;

          const matchesStatus =
            mockTestStatusFilter === "ALL" ||
            item.status === mockTestStatusFilter;

          const matchesExam =
            mockTestExamFilter === "ALL" ||
            item.examType === mockTestExamFilter;

          return (
            item.section === "mockTest" &&
            matchesSearch &&
            matchesPlan &&
            matchesStatus &&
            matchesExam
          );
        });

        return (
          <>
            <div className="mockManageStatCard">
              <span>Filtered Tests</span>
              <strong>{filteredStatsTests.length}</strong>
            </div>

            <div className="mockManageStatCard">
              <span>Published</span>
              <strong>
                {
                  filteredStatsTests.filter(
                    (item) => item.status === "published"
                  ).length
                }
              </strong>
            </div>

            <div className="mockManageStatCard">
              <span>Draft</span>
              <strong>
                {
                  filteredStatsTests.filter(
                    (item) => item.status === "draft"
                  ).length
                }
              </strong>
            </div>

            <div className="mockManageStatCard">
              <span>Archived</span>
              <strong>
                {
                  filteredStatsTests.filter(
                    (item) => item.status === "archived"
                  ).length
                }
              </strong>
            </div>
          </>
        );
      })()}
    </div>

    <div className="mockBulkActionsBar">

    <div className="mockSelectedCount">
      <span>Selected Tests</span>
      <strong>{selectedMockTestIds.length}</strong>
    </div>

    <button
      className="backButton"
      onClick={() => {
        const visibleMockTestIds = universalContent
          .filter((item) => {
            const searchText =
              mockTestSearch.trim().toLowerCase();

            const matchesSearch =
              !searchText ||
              item.title?.toLowerCase().includes(searchText) ||
              item.subject?.toLowerCase().includes(searchText) ||
              item.chapter?.toLowerCase().includes(searchText);

            const matchesPlan =
              mockTestPlanFilter === "ALL" ||
              item.planType === mockTestPlanFilter;

            const matchesStatus =
              mockTestStatusFilter === "ALL" ||
              item.status === mockTestStatusFilter;

            const matchesExam =
              mockTestExamFilter === "ALL" ||
              item.examType === mockTestExamFilter;

            return (
              item.section === "mockTest" &&
              matchesSearch &&
              matchesPlan &&
              matchesStatus &&
              matchesExam
            );
          })
          .sort((a, b) => {
            const firstDate =
              a.createdAt?.seconds ||
              a.updatedAt?.seconds ||
              0;

            const secondDate =
              b.createdAt?.seconds ||
              b.updatedAt?.seconds ||
              0;

            return mockTestSortMode === "OLDEST"
              ? firstDate - secondDate
              : secondDate - firstDate;
          })
          .slice(
            (mockTestPage - 1) * mockTestsPerPage,
            mockTestPage * mockTestsPerPage
          )
          .map((item) => item.id);

        setSelectedMockTestIds(visibleMockTestIds);
      }}
    >
      Select All
    </button>

    <button
      className="backButton"
      onClick={() => {
        setSelectedMockTestIds([]);
      }}
    >
      Clear Selected
    </button>

    <button
      className="backButton"
      onClick={async () => {
        if (selectedMockTestIds.length === 0) {
          alert("Please select at least one mock test");
          return;
        }

        const selectedCount = selectedMockTestIds.length;

        const confirmBulkAction = window.confirm(
          `You are about to publish ${selectedCount} selected mock test(s).

    Do you want to continue?`
        );

        if (!confirmBulkAction) {
          return;
        }

        for (const testId of selectedMockTestIds) {
          await updateDoc(doc(db, "contentItems", testId), {
            status: "published",
            updatedAt: new Date(),
          });
        }

        await loadContentItemsFromFirestore();

        setSelectedMockTestIds([]);

        alert("Selected mock tests published ✅");
      }}
    >
      Publish Selected
    </button>

    <button
      className="backButton"
      onClick={async () => {
        if (selectedMockTestIds.length === 0) {
          alert("Please select at least one mock test");
          return;
        }

        const selectedCount = selectedMockTestIds.length;

        const confirmBulkAction = window.confirm(
          `You are about to unpublish ${selectedCount} selected mock test(s).

    Do you want to continue?`
        );

        if (!confirmBulkAction) {
          return;
        }

        for (const testId of selectedMockTestIds) {
          await updateDoc(doc(db, "contentItems", testId), {
            status: "unpublished",
            updatedAt: new Date(),
          });
        }

        await loadContentItemsFromFirestore();

        setSelectedMockTestIds([]);

        alert("Selected mock tests unpublished ✅");
      }}
    >
      Unpublish Selected
    </button>

    <button
      className="backButton"
      onClick={async () => {
        if (selectedMockTestIds.length === 0) {
          alert("Please select at least one mock test");
          return;
        }

        const selectedCount = selectedMockTestIds.length;

        const confirmBulkAction = window.confirm(
          `You are about to archive ${selectedCount} selected mock test(s).

    Do you want to continue?`
        );

        if (!confirmBulkAction) {
          return;
        }

        for (const testId of selectedMockTestIds) {
          await updateDoc(doc(db, "contentItems", testId), {
            status: "archived",
            updatedAt: new Date(),
          });
        }

        await loadContentItemsFromFirestore();

        setSelectedMockTestIds([]);

        alert("Selected mock tests archived ✅");
      }}
    >
      Archive Selected
    </button>

    <button
      className="dangerButton"
      onClick={async () => {
        if (selectedMockTestIds.length === 0) {
          alert("Please select at least one mock test");
          return;
        }

        const confirmDelete = window.confirm(
          `Delete ${selectedMockTestIds.length} selected mock test(s) permanently?\n\nThis action cannot be undone.`
        );

        if (!confirmDelete) return;

        for (const testId of selectedMockTestIds) {
          const selectedTest = universalContent.find(
            (item) => item.id === testId
          );

          if (!selectedTest) continue;

          await deleteMockTest({
            test: selectedTest,
            reloadContent: async () => {},
          });
        }

        await loadContentItemsFromFirestore();

        setSelectedMockTestIds([]);

        alert("Selected mock tests deleted permanently ✅");
      }}
    >
      Delete Selected
    </button>
    </div>

            <div className="contentStudioList">
            <h3>⭐ Featured Mock Tests</h3>

    {universalContent
      .filter(
        (item) =>
          item.section === "mockTest" &&
          item.isFeatured === true
      )
      .length === 0 ? (
      <div className="contentStudioItem">
        <strong>No featured mock tests.</strong>

        <p>
          Mark any important test as Featured to
          highlight it here.
        </p>
      </div>
    ) : (
      universalContent
        .filter(
          (item) =>
            item.section === "mockTest" &&
            item.isFeatured === true
        )
        .map((test) => (
          <div
            className="contentStudioItem"
            key={test.id}
          >
            <strong>
              ⭐ {test.title}
            </strong>

            <p>
              {test.subject} • {test.chapter}
            </p>
          </div>
        ))
    )}
              <h3>Saved Mock Tests</h3>

              {universalContent
      .filter((item) => {
        const searchText =
          mockTestSearch.trim().toLowerCase();

        const matchesSearch =
          !searchText ||
          item.title?.toLowerCase().includes(searchText) ||
          item.subject?.toLowerCase().includes(searchText) ||
          item.chapter?.toLowerCase().includes(searchText);

        const matchesPlan =
          mockTestPlanFilter === "ALL" ||
          item.planType === mockTestPlanFilter;

        const matchesStatus =
          mockTestStatusFilter === "ALL" ||
          item.status === mockTestStatusFilter;

        const matchesExam =
          mockTestExamFilter === "ALL" ||
          item.examType === mockTestExamFilter;

        return (
          item.section === "mockTest" &&
          matchesSearch &&
          matchesPlan &&
          matchesStatus &&
          matchesExam
        );
      }).length === 0 ? (
        <div className="contentStudioItem mockEmptyStateCard">
        <strong>No mock tests found.</strong>

        <p>
          No tests match your current search or filters.
          Try changing filters or create a new mock test.
        </p>

        <div className="contentStudioActions">
          <button
            className="publishButton"
            onClick={() =>
              navigate("/admin/content/mock-tests/add")
            }
          >
            + Create Mock Test
          </button>

          <button
            className="backButton"
            onClick={() => {
              setMockTestSearch("");
              setMockTestStatusFilter("ALL");
              setMockTestExamFilter("ALL");
              setMockTestPlanFilter("ALL");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
              ) : (
                universalContent
                .filter((item) => {
                  const searchText =
                    mockTestSearch.trim().toLowerCase();

                  const matchesSearch =
                    !searchText ||
                    item.title?.toLowerCase().includes(searchText) ||
                    item.subject?.toLowerCase().includes(searchText) ||
                    item.chapter?.toLowerCase().includes(searchText);

                  const matchesPlan =
                    mockTestPlanFilter === "ALL" ||
                    item.planType === mockTestPlanFilter;

                  const matchesStatus =
                    mockTestStatusFilter === "ALL" ||
                    item.status === mockTestStatusFilter;

                  const matchesExam =
                    mockTestExamFilter === "ALL" ||
                    item.examType === mockTestExamFilter;

                  return (
                    item.section === "mockTest" &&
                    matchesSearch &&
                    matchesPlan &&
                    matchesStatus &&
                    matchesExam
                  );
                })
                .sort((a, b) => {
                  const firstDate =
                    a.createdAt?.seconds ||
                    a.updatedAt?.seconds ||
                    0;

                  const secondDate =
                    b.createdAt?.seconds ||
                    b.updatedAt?.seconds ||
                    0;

                  return mockTestSortMode === "OLDEST"
                    ? firstDate - secondDate
                    : secondDate - firstDate;
                })
                .slice(
                  (mockTestPage - 1) * mockTestsPerPage,
                  mockTestPage * mockTestsPerPage
                )
                .map((test) => (
                    <div
                      className="contentStudioItem"
                      key={test.id}
                    >
                      <input
      type="checkbox"
      checked={selectedMockTestIds.includes(test.id)}
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedMockTestIds([
            ...selectedMockTestIds,
            test.id,
          ]);
        } else {
          setSelectedMockTestIds(
            selectedMockTestIds.filter(
              (id) => id !== test.id
            )
          );
        }
      }}
    />
    <strong>
      {test.isFeatured && "⭐ "}
      {test.title}
    </strong>
                      <div className="mockTestInfoBlock">
      <div className="mockTestPrimaryMeta">
        <span>{test.planType || "FREE"}</span>
        <span>{test.subject || "No Subject"}</span>
        <span>{test.chapter || "No Chapter"}</span>
        <span>{test.testType || "Mock Test"}</span>
        <span
      className={`mockStatusBadge ${
        test.status === "published"
          ? "statusPublished"
          : test.status === "draft"
          ? "statusDraft"
          : test.status === "archived"
          ? "statusArchived"
          : "statusUnpublished"
      }`}
    >
      {test.status || "draft"}
    </span>
      </div>

      <div className="mockTestMetaSection">
      <h5>Overview</h5>

      <div className="mockTestMetaGrid">
        <span>
          📋 {test.totalQuestions || test.questions?.length || 0} Questions
        </span>

        <span>
          ⏱ {test.duration || test.durationMinutes || 0} min
        </span>

        <span>
          🎯 {test.totalMarks || 0} Marks
        </span>

        <span>
          ✅ Passing: {test.passingMarks || 0}
        </span>
      </div>
    </div>

    <div className="mockTestMetaSection">
      <h5>Performance</h5>

      {(() => {
        const testResults = mockResults.filter(
          (result) => result.testId === test.id
        );

        const attempts = testResults.length;

        const averageScore =
          attempts > 0
            ? (
                testResults.reduce(
                  (sum, result) => sum + Number(result.score || 0),
                  0
                ) / attempts
              ).toFixed(1)
            : "0";

        const averageAccuracy =
          attempts > 0
            ? (
                testResults.reduce(
                  (sum, result) => sum + Number(result.accuracy || 0),
                  0
                ) / attempts
              ).toFixed(1)
            : "0";

        return (
          <div className="mockTestMetaGrid">
            <span>👥 Attempts: {attempts}</span>
            <span>🏆 Avg Score: {averageScore}</span>
            <span>🎯 Avg Accuracy: {averageAccuracy}%</span>
          </div>
        );
      })()}
    </div>
    <div className="mockTestMetaSection">
      <h5>Configuration</h5>

      <div className="mockTestMetaGrid">
        <span>📊 {test.examDifficulty || "Mixed"}</span>

        <span>🌐 {test.examLanguage || "English"}</span>

        <span>📝 {test.examType || "CTET/TET"}</span>

        <span>
          🔄 Attempt: {test.attemptLimit || "unlimited"}
        </span>

        <span>
          ⚡ Result: {test.resultPublishMode || "instant"}
        </span>

        <span>
          🧭 Navigation: {test.navigationMode || "free"}
        </span>

        <span>
          🔀 Shuffle Q: {test.shuffleQuestions || "no"}
        </span>

        <span>
          🎲 Options: {test.shuffleOptions || "no"}
        </span>

        <span>
          🧮 Calculator: {test.calculatorAllowed || "no"}
        </span>

        <span>
          ⏸ Pause: {test.allowPause || "yes"}
        </span>
      </div>
    </div>

    <div className="mockTestMetaSection">
      <h5>Schedule</h5>

      <div className="mockTestMetaGrid">
        <span>
          🚀 Start: {test.examStartDate || "Not scheduled"}
        </span>

        <span>
          🏁 End: {test.examEndDate || "Not scheduled"}
        </span>
      </div>
    </div>
    </div>

    <div className="mockTestMetaSection">
      <h5>Audit</h5>

      <div className="mockTestMetaGrid">
      <span>
      📅 Created:{" "}
      {test.createdAt?.toDate?.().toLocaleString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      ) || "-"}
    </span>

    <span>
      🕒 Updated:{" "}
      {test.updatedAt?.toDate?.().toLocaleString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      ) || "-"}
    </span>
      </div>
    </div>

    <div className="contentStudioActions mockTestCompactActions">

      <button
        className="backButton"
        onClick={() =>
          navigate(
            `/admin/content/mock-tests/preview/${test.id}`
          )
        }
      >
        Preview
      </button>
      <div className="mockActionMenuWrap">
      <button
        className="backButton"
        onClick={(event) =>
          openMockActionPortal(event, test)
        }
      >
        Actions ▾
      </button>
    </div>
    </div>

                    </div>
                  ))
              )}
            </div>


            {
      Math.ceil(
        universalContent.filter((item) => {
          const searchText =
            mockTestSearch.trim().toLowerCase();

          const matchesSearch =
            !searchText ||
            item.title?.toLowerCase().includes(searchText) ||
            item.subject?.toLowerCase().includes(searchText) ||
            item.chapter?.toLowerCase().includes(searchText);

          const matchesPlan =
            mockTestPlanFilter === "ALL" ||
            item.planType === mockTestPlanFilter;

          const matchesStatus =
            mockTestStatusFilter === "ALL" ||
            item.status === mockTestStatusFilter;

          const matchesExam =
            mockTestExamFilter === "ALL" ||
            item.examType === mockTestExamFilter;

          return (
            item.section === "mockTest" &&
            matchesSearch &&
            matchesPlan &&
            matchesStatus &&
            matchesExam
          );
        }).length / mockTestsPerPage
      ) > 1 && (
        <div className="mockPaginationBar">
          <button
            className="backButton"
            disabled={mockTestPage === 1}
            onClick={() =>
              setMockTestPage((prev) =>
                Math.max(prev - 1, 1)
              )
            }
          >
            ← Previous
          </button>

          <span>
            Page {mockTestPage}
          </span>

          <button
            className="backButton"
            disabled={
              mockTestPage >=
              Math.ceil(
                universalContent.filter((item) => {
                  const searchText =
                    mockTestSearch.trim().toLowerCase();

                  const matchesSearch =
                    !searchText ||
                    item.title?.toLowerCase().includes(searchText) ||
                    item.subject?.toLowerCase().includes(searchText) ||
                    item.chapter?.toLowerCase().includes(searchText);

                  const matchesPlan =
                    mockTestPlanFilter === "ALL" ||
                    item.planType === mockTestPlanFilter;

                  const matchesStatus =
                    mockTestStatusFilter === "ALL" ||
                    item.status === mockTestStatusFilter;

                  const matchesExam =
                    mockTestExamFilter === "ALL" ||
                    item.examType === mockTestExamFilter;

                  return (
                    item.section === "mockTest" &&
                    matchesSearch &&
                    matchesPlan &&
                    matchesStatus &&
                    matchesExam
                  );
                }).length / mockTestsPerPage
              )
            }
            onClick={() =>
              setMockTestPage((prev) => prev + 1)
            }
          >
            Next →
          </button>
        </div>
      )
    }

            <div className="contentStudioActions">

            <input
      type="file"
      accept=".json"
      id="mockJsonImportInput"
      style={{ display: "none" }}
      onChange={handleImportMockTestJson}
    />
    <input
      type="file"
      accept=".xlsx,.xls"
      id="mockXlsxImportInput"
      style={{ display: "none" }}
      onChange={handleImportMockTestXlsx}
    />
    <button
      className="backButton"
      onClick={() =>
        document
          .getElementById("mockJsonImportInput")
          ?.click()
      }
    >
      Import JSON
    </button>
    <button
      className="backButton"
      onClick={() =>
        document
          .getElementById("mockXlsxImportInput")
          ?.click()
      }
    >
      Import XLSX
    </button>

    <input
      type="url"
      className="contentStudioInput"
      placeholder="Paste Google Drive XLSX URL"
      value={mockImportXlsxUrl}
      onChange={(e) =>
        setMockImportXlsxUrl(e.target.value)
      }
    />

    <button
      className="publishButton"
      onClick={() => {
        alert(
          "Google Drive direct import needs backend Cloud Function.\n\nFor now: Download XLSX from Drive, then use Import XLSX."
        );
      }}
    >
      Drive Import Info
    </button>

    <button
      className="publishButton"
      onClick={handleDownloadMockTestXlsxTemplate}
    >
      Download XLSX Template
    </button>

              <button
                className="publishButton"
                onClick={() =>
                  navigate("/admin/content/mock-tests/add")
                }
              >
                + Add Mock Test
              </button>

              <button
                className="backButton"
                onClick={() =>
                  navigate("/admin/content/mock-tests")
                }
              >
                ← Back to Mock Tests Manager
              </button>
            </div>
          </section>
  );
}
