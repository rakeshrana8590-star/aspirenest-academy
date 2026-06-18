import React from "react";
import { doc, updateDoc } from "firebase/firestore";

import { deleteMockTest } from "./mockTestAdminActions.js";

export default function AdminMockTestManageRoute({
  db,
  universalContent = [],
  mockResults = [],
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
  selectedMockTestIds = [],
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
  const safeContent = Array.isArray(universalContent) ? universalContent : [];
  const safeResults = Array.isArray(mockResults) ? mockResults : [];
  const safeSelectedIds = Array.isArray(selectedMockTestIds)
    ? selectedMockTestIds
    : [];

  const safePerPage = Number(mockTestsPerPage || 6);
  const activePage = Number(mockTestPage || 1);

  const normalize = (value = "") => value.toString().trim().toLowerCase();

  const getStatus = (test) => test.status || "draft";

  const getDateNumber = (value) => {
    if (!value) return 0;

    if (value?.seconds) {
      return value.seconds;
    }

    if (value?.toDate) {
      return Math.floor(value.toDate().getTime() / 1000);
    }

    const parsedDate = new Date(value).getTime();

    return Number.isNaN(parsedDate) ? 0 : Math.floor(parsedDate / 1000);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const dateValue = value?.toDate ? value.toDate() : new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
      return "-";
    }

    return dateValue.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const mockTests = safeContent.filter((item) => item.section === "mockTest");

  const getFilteredTests = () => {
    const searchText = normalize(mockTestSearch);

    return mockTests.filter((item) => {
      const matchesSearch =
        !searchText ||
        normalize(item.title).includes(searchText) ||
        normalize(item.subject).includes(searchText) ||
        normalize(item.chapter).includes(searchText) ||
        normalize(item.testType).includes(searchText) ||
        normalize(item.planType).includes(searchText);

      const matchesPlan =
        mockTestPlanFilter === "ALL" || item.planType === mockTestPlanFilter;

      const matchesStatus =
        mockTestStatusFilter === "ALL" ||
        getStatus(item) === mockTestStatusFilter;

      const matchesExam =
        mockTestExamFilter === "ALL" || item.examType === mockTestExamFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesExam;
    });
  };

  const filteredTests = getFilteredTests();

  const sortedTests = [...filteredTests].sort((a, b) => {
    const firstDate = Math.max(
      getDateNumber(a.updatedAt),
      getDateNumber(a.createdAt)
    );

    const secondDate = Math.max(
      getDateNumber(b.updatedAt),
      getDateNumber(b.createdAt)
    );

    return mockTestSortMode === "OLDEST"
      ? firstDate - secondDate
      : secondDate - firstDate;
  });

  const totalPages = Math.max(1, Math.ceil(sortedTests.length / safePerPage));

  const currentPage = Math.min(Math.max(activePage, 1), totalPages);

  const paginatedTests = sortedTests.slice(
    (currentPage - 1) * safePerPage,
    currentPage * safePerPage
  );

  const featuredTests = mockTests.filter((item) => item.isFeatured === true);

  const publishedTests = mockTests.filter(
    (item) => getStatus(item) === "published"
  );

  const draftTests = mockTests.filter((item) => getStatus(item) === "draft");

  const archivedTests = mockTests.filter(
    (item) => getStatus(item) === "archived"
  );

  const unpublishedTests = mockTests.filter(
    (item) => getStatus(item) === "unpublished"
  );

  const totalQuestions = mockTests.reduce(
    (total, test) => total + (test.questions?.length || 0),
    0
  );

  const totalAttempts = safeResults.length;

  const planTabs = [
    { label: "ALL", value: "ALL" },
    { label: "FREE", value: "FREE" },
    { label: "BASIC", value: "BASIC" },
    { label: "PREMIUM", value: "PREMIUM" },
    { label: "MENTORSHIP", value: "MENTORSHIP" },
  ];

  const getPlanCount = (planType) => {
    if (planType === "ALL") {
      return mockTests.length;
    }

    return mockTests.filter((test) => test.planType === planType).length;
  };

  const getStatusClassName = (status) => {
    const activeStatus = status || "draft";

    if (activeStatus === "published") {
      return "adminMockManageStatusPill isPublished";
    }

    if (activeStatus === "archived") {
      return "adminMockManageStatusPill isArchived";
    }

    if (activeStatus === "unpublished") {
      return "adminMockManageStatusPill isUnpublished";
    }

    return "adminMockManageStatusPill isDraft";
  };

  const getTestResults = (testId) =>
    safeResults.filter(
      (result) =>
        result.testId === testId ||
        result.mockTestId === testId ||
        result.contentId === testId
    );

  const getPerformance = (test) => {
    const testResults = getTestResults(test.id);
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

    return {
      attempts,
      averageScore,
      averageAccuracy,
    };
  };

  const resetPage = () => {
    setMockTestPage(1);
  };

  const clearFilters = () => {
    setMockTestSearch("");
    setMockTestStatusFilter("ALL");
    setMockTestExamFilter("ALL");
    setMockTestPlanFilter("ALL");
    setMockTestSortMode("LATEST");
    setMockTestPage(1);
  };

  const toggleSelection = (testId, checked) => {
    if (checked) {
      setSelectedMockTestIds([...safeSelectedIds, testId]);
      return;
    }

    setSelectedMockTestIds(safeSelectedIds.filter((id) => id !== testId));
  };

  const selectVisibleTests = () => {
    setSelectedMockTestIds(paginatedTests.map((test) => test.id));
  };

  const clearSelectedTests = () => {
    setSelectedMockTestIds([]);
  };

  const bulkUpdateStatus = async (status, label) => {
    if (safeSelectedIds.length === 0) {
      alert("Please select at least one mock test");
      return;
    }

    const confirmBulkAction = window.confirm(
      `You are about to ${label.toLowerCase()} ${
        safeSelectedIds.length
      } selected mock test(s).\n\nDo you want to continue?`
    );

    if (!confirmBulkAction) {
      return;
    }

    for (const testId of safeSelectedIds) {
      await updateDoc(doc(db, "contentItems", testId), {
        status,
        updatedAt: new Date(),
      });
    }

    await loadContentItemsFromFirestore();

    setSelectedMockTestIds([]);

    alert(`Selected mock tests ${label.toLowerCase()} ✅`);
  };

  const bulkDeleteSelected = async () => {
    if (safeSelectedIds.length === 0) {
      alert("Please select at least one mock test");
      return;
    }

    const confirmDelete = window.confirm(
      `Delete ${safeSelectedIds.length} selected mock test(s) permanently?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    for (const testId of safeSelectedIds) {
      const selectedTest = mockTests.find((item) => item.id === testId);

      if (!selectedTest) continue;

      await deleteMockTest({
        test: selectedTest,
        reloadContent: async () => {},
      });
    }

    await loadContentItemsFromFirestore();

    setSelectedMockTestIds([]);

    alert("Selected mock tests deleted permanently ✅");
  };

  return (
    <section className="coursePages adminMockManagePage">
      <div className="adminMockManageHero">
        <div className="adminMockManageHeroCopy">
          <span className="badge">MANAGE MOCK TESTS</span>

          <h1>Manage Mock Tests Command Center</h1>

          <p>
            Review, filter, publish, unpublish, archive, preview, and manage
            every CTET/TET examination test from one premium admin cockpit.
          </p>

          <div className="adminMockManageHeroActions">
            <button
              type="button"
              className="adminMockManagePrimaryBtn"
              onClick={() => navigate("/admin/content/mock-tests/add")}
            >
              + Add Mock Test
            </button>

            <button
              type="button"
              className="adminMockManageGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests/published")}
            >
              Published Tests
            </button>

            <button
              type="button"
              className="adminMockManageGhostBtn"
              onClick={() => navigate("/admin/content/mock-tests")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="adminMockManageSystemCard">
          <div className="adminMockManageSystemTop">
            <span>MANAGER STATUS</span>
            <strong>Live</strong>
          </div>

          <div className="adminMockManageSystemGrid">
            <div>
              <strong>{mockTests.length}</strong>
              <span>Total tests</span>
            </div>

            <div>
              <strong>{publishedTests.length}</strong>
              <span>Published</span>
            </div>

            <div>
              <strong>{totalQuestions}</strong>
              <span>Questions</span>
            </div>

            <div>
              <strong>{safeSelectedIds.length}</strong>
              <span>Selected</span>
            </div>
          </div>

          <div className="adminMockManageFlow">
            <span>Filter</span>
            <i />
            <span>Select</span>
            <i />
            <span>Action</span>
          </div>
        </div>
      </div>

      <div className="adminMockManageFilterPanel">
        <div className="adminMockManageFilterGrid">
          <label>
            <span>Search Tests</span>
            <input
              type="text"
              placeholder="Search by title, subject, chapter, plan, or type"
              value={mockTestSearch}
              onChange={(event) => {
                setMockTestSearch(event.target.value);
                resetPage();
              }}
            />
          </label>

          <label>
            <span>Status</span>
            <select
              value={mockTestStatusFilter}
              onChange={(event) => {
                setMockTestStatusFilter(event.target.value);
                resetPage();
              }}
            >
              <option value="ALL">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            <span>Exam</span>
            <select
              value={mockTestExamFilter}
              onChange={(event) => {
                setMockTestExamFilter(event.target.value);
                resetPage();
              }}
            >
              <option value="ALL">All Exams</option>
              <option value="CTET">CTET</option>
              <option value="TET">TET</option>
              <option value="CTET/TET">CTET/TET</option>
            </select>
          </label>

          <label>
            <span>Sort</span>
            <select
              value={mockTestSortMode}
              onChange={(event) => {
                setMockTestSortMode(event.target.value);
                resetPage();
              }}
            >
              <option value="LATEST">Latest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </label>
        </div>

        <div className="adminMockManagePlanTabs">
          {planTabs.map((plan) => (
            <button
              type="button"
              key={plan.value}
              className={
                mockTestPlanFilter === plan.value
                  ? "adminMockManagePlanTab isActive"
                  : "adminMockManagePlanTab"
              }
              onClick={() => {
                setMockTestPlanFilter(plan.value);
                resetPage();
              }}
            >
              <span>{plan.label}</span>
              <strong>{getPlanCount(plan.value)}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="adminMockManageKpiGrid">
        <div className="adminMockManageKpiCard">
          <span>Filtered Tests</span>
          <strong>{filteredTests.length}</strong>
          <p>Current search result</p>
        </div>

        <div className="adminMockManageKpiCard">
          <span>Published</span>
          <strong>{publishedTests.length}</strong>
          <p>Student-visible exams</p>
        </div>

        <div className="adminMockManageKpiCard">
          <span>Draft</span>
          <strong>{draftTests.length}</strong>
          <p>Build mode tests</p>
        </div>

        <div className="adminMockManageKpiCard">
          <span>Archived</span>
          <strong>{archivedTests.length}</strong>
          <p>Hidden records</p>
        </div>
      </div>

      <div className="adminMockManageMiniGrid">
        <div className="adminMockManageMiniCard">
          <span>Unpublished</span>
          <strong>{unpublishedTests.length}</strong>
          <p>Hidden from students</p>
        </div>

        <div className="adminMockManageMiniCard">
          <span>Total Attempts</span>
          <strong>{totalAttempts}</strong>
          <p>Saved result records</p>
        </div>

        <div className="adminMockManageMiniCard">
          <span>Featured</span>
          <strong>{featuredTests.length}</strong>
          <p>Highlighted tests</p>
        </div>

        <div className="adminMockManageMiniCard">
          <span>Selected</span>
          <strong>{safeSelectedIds.length}</strong>
          <p>Ready for bulk action</p>
        </div>
      </div>

      <div className="adminMockManageBulkBar">
        <div className="adminMockManageSelectedCount">
          <span>Selected Tests</span>
          <strong>{safeSelectedIds.length}</strong>
        </div>

        <button
          type="button"
          className="adminMockManageGhostBtn"
          onClick={selectVisibleTests}
        >
          Select Visible
        </button>

        <button
          type="button"
          className="adminMockManageGhostBtn"
          onClick={clearSelectedTests}
        >
          Clear Selected
        </button>

        <button
          type="button"
          className="adminMockManageGhostBtn"
          onClick={() => bulkUpdateStatus("published", "Published")}
        >
          Publish
        </button>

        <button
          type="button"
          className="adminMockManageGhostBtn"
          onClick={() => bulkUpdateStatus("unpublished", "Unpublished")}
        >
          Unpublish
        </button>

        <button
          type="button"
          className="adminMockManageGhostBtn"
          onClick={() => bulkUpdateStatus("archived", "Archived")}
        >
          Archive
        </button>

        <button
          type="button"
          className="adminMockManageDangerBtn"
          onClick={bulkDeleteSelected}
        >
          Delete
        </button>
      </div>

      <div className="adminMockManageFeaturedPanel">
        <div className="adminMockManagePanelHeader">
          <div>
            <span>FEATURED TESTS</span>
            <h2>Priority Mock Tests</h2>
          </div>

          <small>{featuredTests.length} featured</small>
        </div>

        {featuredTests.length === 0 ? (
          <div className="adminMockManageEmpty">
            <strong>No featured mock tests.</strong>
            <p>Mark important tests as Featured from the action menu.</p>
          </div>
        ) : (
          <div className="adminMockManageFeaturedGrid">
            {featuredTests.slice(0, 4).map((test) => (
              <article className="adminMockManageFeaturedCard" key={test.id}>
                <span>⭐ Featured</span>
                <strong>{test.title || "Untitled Mock Test"}</strong>
                <p>
                  {test.planType || "FREE"} • {test.subject || "No Subject"} •{" "}
                  {test.chapter || "No Chapter"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="adminMockManageTestsPanel">
        <div className="adminMockManagePanelHeader">
          <div>
            <span>SAVED MOCK TESTS</span>
            <h2>Test Control Library</h2>
          </div>

          <small>
            Page {currentPage} / {totalPages}
          </small>
        </div>

        {paginatedTests.length === 0 ? (
          <div className="adminMockManageEmpty">
            <strong>No mock tests found.</strong>

            <p>
              No tests match the current search or filters. Clear filters or
              create a new mock test.
            </p>

            <div className="adminMockManageEmptyActions">
              <button
                type="button"
                className="adminMockManagePrimaryBtn"
                onClick={() => navigate("/admin/content/mock-tests/add")}
              >
                + Create Mock Test
              </button>

              <button
                type="button"
                className="adminMockManageGhostBtn"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="adminMockManageTestGrid">
            {paginatedTests.map((test) => {
              const performance = getPerformance(test);
              const questionCount =
                test.totalQuestions || test.questions?.length || 0;

              return (
                <article className="adminMockManageTestCard" key={test.id}>
                  <div className="adminMockManageTestTop">
                    <label className="adminMockManageSelectBox">
                      <input
                        type="checkbox"
                        checked={safeSelectedIds.includes(test.id)}
                        onChange={(event) =>
                          toggleSelection(test.id, event.target.checked)
                        }
                      />

                      <span>Select</span>
                    </label>

                    <div className="adminMockManageTestTitleBlock">
                      <div className="adminMockManagePillRow">
                        <span className="adminMockManagePlanPill">
                          {test.planType || "FREE"}
                        </span>

                        <span className={getStatusClassName(test.status)}>
                          {getStatus(test)}
                        </span>

                        {test.isFeatured && (
                          <span className="adminMockManageFeaturedPill">
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      <h3>{test.title || "Untitled Mock Test"}</h3>

                      <p>
                        {test.subject || "No Subject"} •{" "}
                        {test.chapter || "No Chapter"} •{" "}
                        {test.testType || "Mock Test"}
                      </p>
                    </div>
                  </div>

                  <div className="adminMockManageStatStrip">
                    <div>
                      <span>Questions</span>
                      <strong>{questionCount}</strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>
                        {test.duration || test.durationMinutes || 0} min
                      </strong>
                    </div>

                    <div>
                      <span>Marks</span>
                      <strong>{test.totalMarks || 0}</strong>
                    </div>

                    <div>
                      <span>Passing</span>
                      <strong>{test.passingMarks || 0}</strong>
                    </div>
                  </div>

                  <div className="adminMockManageInfoGrid">
                    <div className="adminMockManageInfoBox">
                      <span>Performance</span>

                      <div className="adminMockManageChipRow">
                        <em>Attempts {performance.attempts}</em>
                        <em>Avg Score {performance.averageScore}</em>
                        <em>Accuracy {performance.averageAccuracy}%</em>
                      </div>
                    </div>

                    <div className="adminMockManageInfoBox">
                      <span>Configuration</span>

                      <div className="adminMockManageChipRow">
                        <em>{test.examDifficulty || "Mixed"}</em>
                        <em>{test.examLanguage || "English"}</em>
                        <em>{test.examType || "CTET/TET"}</em>
                        <em>Attempt {test.attemptLimit || "unlimited"}</em>
                        <em>Result {test.resultPublishMode || "instant"}</em>
                        <em>Nav {test.navigationMode || "free"}</em>
                      </div>
                    </div>

                    <div className="adminMockManageInfoBox">
                      <span>Security</span>

                      <div className="adminMockManageChipRow">
                        <em>Shuffle Q {test.shuffleQuestions || "no"}</em>
                        <em>Options {test.shuffleOptions || "no"}</em>
                        <em>Calculator {test.calculatorAllowed || "no"}</em>
                        <em>Pause {test.allowPause || "yes"}</em>
                      </div>
                    </div>

                    <div className="adminMockManageInfoBox">
                      <span>Schedule</span>

                      <div className="adminMockManageChipRow">
                        <em>Start {test.examStartDate || "Not scheduled"}</em>
                        <em>End {test.examEndDate || "Not scheduled"}</em>
                      </div>
                    </div>

                    <div className="adminMockManageInfoBox adminMockManageAuditBox">
                      <span>Audit</span>

                      <div className="adminMockManageChipRow">
                        <em>Created {formatDateTime(test.createdAt)}</em>
                        <em>Updated {formatDateTime(test.updatedAt)}</em>
                      </div>
                    </div>
                  </div>

                  <div className="adminMockManageCardActions">
                    <button
                      type="button"
                      className="adminMockManagePrimaryBtn"
                      onClick={() =>
                        navigate(`/admin/content/mock-tests/preview/${test.id}`)
                      }
                    >
                      Preview
                    </button>

                    <button
                      type="button"
                      className="adminMockManageGhostBtn"
                      onClick={(event) => openMockActionPortal(event, test)}
                    >
                      Actions ▾
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="adminMockManagePagination">
            <button
              type="button"
              className="adminMockManageGhostBtn"
              disabled={currentPage === 1}
              onClick={() => setMockTestPage(Math.max(currentPage - 1, 1))}
            >
              ← Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="adminMockManageGhostBtn"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setMockTestPage(Math.min(currentPage + 1, totalPages))
              }
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <div className="adminMockManageImportPanel">
        <div className="adminMockManagePanelHeader">
          <div>
            <span>IMPORT / EXPORT</span>
            <h2>Test Data Tools</h2>
          </div>

          <small>JSON + XLSX</small>
        </div>

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

        <div className="adminMockManageImportGrid">
          <button
            type="button"
            className="adminMockManageGhostBtn"
            onClick={() =>
              document.getElementById("mockJsonImportInput")?.click()
            }
          >
            Import JSON
          </button>

          <button
            type="button"
            className="adminMockManageGhostBtn"
            onClick={() =>
              document.getElementById("mockXlsxImportInput")?.click()
            }
          >
            Import XLSX
          </button>

          <input
            type="url"
            placeholder="Paste Google Drive XLSX URL"
            value={mockImportXlsxUrl}
            onChange={(event) => setMockImportXlsxUrl(event.target.value)}
          />

          <button
            type="button"
            className="adminMockManageGhostBtn"
            onClick={() => {
              alert(
                "Google Drive direct import needs backend Cloud Function.\n\nFor now: Download XLSX from Drive, then use Import XLSX."
              );
            }}
          >
            Drive Import Info
          </button>

          <button
            type="button"
            className="adminMockManagePrimaryBtn"
            onClick={handleDownloadMockTestXlsxTemplate}
          >
            Download XLSX Template
          </button>

          <button
            type="button"
            className="adminMockManagePrimaryBtn"
            onClick={() => navigate("/admin/content/mock-tests/add")}
          >
            + Add Mock Test
          </button>

          <button
            type="button"
            className="adminMockManageGhostBtn"
            onClick={() => navigate("/admin/content/mock-tests")}
          >
            ← Back to Mock Tests Manager
          </button>
        </div>
      </div>
    </section>
  );
}