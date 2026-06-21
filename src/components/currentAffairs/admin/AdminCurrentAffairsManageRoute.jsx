import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function getCaPdfUrl(item = {}) {
  return (
    item.fileUrl ||
    item.pdfUrl ||
    item.sourceUrl ||
    item.downloadUrl ||
    item.materialUrl ||
    ""
  );
}

function getCaStatus(item = {}) {
  return String(item.status || item.publishStatus || "draft")
    .trim()
    .toLowerCase();
}

function getCaPlan(item = {}) {
  return String(item.planType || item.plan || item.accessPlan || "FREE")
    .trim()
    .toUpperCase();
}

function getCaMonth(item = {}) {
  return String(item.month || item.monthName || "Month not set").trim();
}

function getCaChapter(item = {}) {
  return String(item.chapter || item.week || item.subject || "General").trim();
}

function getCaTitle(item = {}) {
  return String(item.title || item.name || "Untitled Current Affair").trim();
}

function getDateValue(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getDateValue(value);

  if (!date) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status) {
  if (status === "published") return "Published";
  if (status === "draft") return "Draft";
  if (status === "unpublished") return "Unpublished";
  if (status === "archived") return "Archived";
  return status || "Draft";
}

function sortCaItems(items, sortMode) {
  const nextItems = [...items];

  if (sortMode === "title") {
    return nextItems.sort((a, b) => getCaTitle(a).localeCompare(getCaTitle(b)));
  }

  if (sortMode === "month") {
    return nextItems.sort((a, b) => getCaMonth(a).localeCompare(getCaMonth(b)));
  }

  if (sortMode === "oldest") {
    return nextItems.sort((a, b) => {
      const aTime = getDateValue(a.createdAt)?.getTime() || 0;
      const bTime = getDateValue(b.createdAt)?.getTime() || 0;
      return aTime - bTime;
    });
  }

  return nextItems.sort((a, b) => {
    const aTime =
      getDateValue(a.updatedAt)?.getTime() ||
      getDateValue(a.createdAt)?.getTime() ||
      0;

    const bTime =
      getDateValue(b.updatedAt)?.getTime() ||
      getDateValue(b.createdAt)?.getTime() ||
      0;

    return bTime - aTime;
  });
}

export default function AdminCurrentAffairsManageRoute({
  universalCurrentAffairs = [],
  setEditingCmsId,
  setCmsTitle,
  setCmsMonth,
  setCmsDuration,
  setCmsChapter,
  setCmsPlanType,
  setCmsFileUrl,
  setCmsStatus,
  deleteContentItem,
  loadContentItemsFromFirestore,
  planTypes = { FREE: "FREE" },
  contentStatus = { PUBLISHED: "published" },
}) {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("latest");
  const [selectedIds, setSelectedIds] = useState([]);
  const [openActionId, setOpenActionId] = useState(null);
  const [page, setPage] = useState(1);

  const pageSize = 6;

  const monthOptions = useMemo(() => {
    const months = new Set(
      universalCurrentAffairs
        .map((item) => getCaMonth(item))
        .filter((month) => month && month !== "Month not set")
    );

    return ["ALL", ...Array.from(months).sort()];
  }, [universalCurrentAffairs]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const visibleItems = universalCurrentAffairs.filter((item) => {
      const title = getCaTitle(item).toLowerCase();
      const month = getCaMonth(item);
      const chapter = getCaChapter(item).toLowerCase();
      const plan = getCaPlan(item);
      const status = getCaStatus(item);
      const pdfUrl = getCaPdfUrl(item).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        month.toLowerCase().includes(query) ||
        chapter.includes(query) ||
        plan.toLowerCase().includes(query) ||
        status.includes(query) ||
        pdfUrl.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter.toLowerCase();

      const matchesMonth = monthFilter === "ALL" || month === monthFilter;

      const matchesPlan = planFilter === "ALL" || plan === planFilter;

      return matchesSearch && matchesStatus && matchesMonth && matchesPlan;
    });

    return sortCaItems(visibleItems, sortMode);
  }, [
    universalCurrentAffairs,
    searchTerm,
    statusFilter,
    monthFilter,
    planFilter,
    sortMode,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const stats = useMemo(() => {
    const total = universalCurrentAffairs.length;

    const published = universalCurrentAffairs.filter(
      (item) => getCaStatus(item) === "published"
    ).length;

    const draft = universalCurrentAffairs.filter(
      (item) => getCaStatus(item) === "draft"
    ).length;

    const unpublished = universalCurrentAffairs.filter(
      (item) => getCaStatus(item) === "unpublished"
    ).length;

    const archived = universalCurrentAffairs.filter(
      (item) => getCaStatus(item) === "archived"
    ).length;

    const missingPdf = universalCurrentAffairs.filter(
      (item) => !getCaPdfUrl(item)
    ).length;

    return {
      total,
      published,
      draft,
      unpublished,
      archived,
      missingPdf,
      filtered: filteredItems.length,
      selected: selectedIds.length,
    };
  }, [universalCurrentAffairs, filteredItems.length, selectedIds.length]);

  const planCounts = useMemo(() => {
    const counts = {
      ALL: universalCurrentAffairs.length,
      FREE: 0,
      BASIC: 0,
      PREMIUM: 0,
      MENTORSHIP: 0,
    };

    universalCurrentAffairs.forEach((item) => {
      const plan = getCaPlan(item);
      counts[plan] = (counts[plan] || 0) + 1;
    });

    return counts;
  }, [universalCurrentAffairs]);

  const priorityItems = useMemo(() => {
    return universalCurrentAffairs
      .filter((item) => !getCaPdfUrl(item) || getCaStatus(item) !== "published")
      .slice(0, 3);
  }, [universalCurrentAffairs]);

  const resetPage = () => {
    setPage(1);
  };

  const toggleSelected = (itemId) => {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  };

  const selectVisible = () => {
    const visibleIds = paginatedItems.map((item) => item.id).filter(Boolean);

    setSelectedIds((current) => {
      const selected = new Set(current);
      visibleIds.forEach((id) => selected.add(id));
      return Array.from(selected);
    });
  };

  const clearSelected = () => {
    setSelectedIds([]);
  };

  const handleEdit = (item) => {
    setEditingCmsId(item.id);

    setCmsTitle(item.title || "");

    const monthParts = String(item.month || "").split(" ");
    setCmsMonth(monthParts[0] || "");
    setCmsDuration(monthParts[1] || "");

    setCmsChapter(item.chapter || "");
    setCmsPlanType(item.planType || planTypes.FREE);
    setCmsFileUrl(getCaPdfUrl(item));
    setCmsStatus(item.status || contentStatus.PUBLISHED);

    navigate("/admin/content/current-affairs/add");
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Delete "${getCaTitle(item)}" permanently?

Students may lose access to this current affair PDF.

This action cannot be undone.`
    );

    if (!confirmDelete) return;

    await deleteContentItem(item.id);
    await loadContentItemsFromFirestore();

    setSelectedIds((current) => current.filter((id) => id !== item.id));
    alert("Current affair deleted successfully ✅");
  };

  const handleCopyPdfLink = async (item) => {
    const pdfUrl = getCaPdfUrl(item);

    if (!pdfUrl) {
      alert("PDF link missing.");
      return;
    }

    try {
      await navigator.clipboard.writeText(pdfUrl);
      alert("PDF link copied ✅");
    } catch (error) {
      window.prompt("Copy PDF link:", pdfUrl);
    }
  };

  const openPdf = (item) => {
    const pdfUrl = getCaPdfUrl(item);

    if (!pdfUrl) {
      alert("PDF link missing.");
      return;
    }

    window.open(pdfUrl, "_blank");
  };

  return (
    <section className="coursePages">
      <div className="adminCaManagePage">
        <section className="adminCaManageFilterShell">
          <div className="adminCaManageField adminCaManageFieldWide">
            <label>Search PDFs</label>
            <input
              type="search"
              value={searchTerm}
              placeholder="Search by title, month, week, plan, status, or PDF URL"
              onChange={(event) => {
                setSearchTerm(event.target.value);
                resetPage();
              }}
            />
          </div>

          <div className="adminCaManageField">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                resetPage();
              }}
            >
              <option value="ALL">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="adminCaManageField">
            <label>Month</label>
            <select
              value={monthFilter}
              onChange={(event) => {
                setMonthFilter(event.target.value);
                resetPage();
              }}
            >
              {monthOptions.map((month) => (
                <option value={month} key={month}>
                  {month === "ALL" ? "All Months" : month}
                </option>
              ))}
            </select>
          </div>

          <div className="adminCaManageField">
            <label>Sort</label>
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value);
                resetPage();
              }}
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="month">Month A-Z</option>
            </select>
          </div>

          <div className="adminCaManagePlanTabs">
            {["ALL", "FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((plan) => (
              <button
                type="button"
                key={plan}
                className={planFilter === plan ? "active" : ""}
                onClick={() => {
                  setPlanFilter(plan);
                  resetPage();
                }}
              >
                <span>{plan}</span>
                <strong>{planCounts[plan] || 0}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="adminCaManageStatsGrid">
          <div>
            <span>Filtered PDFs</span>
            <strong>{stats.filtered}</strong>
            <p>Current search result</p>
          </div>

          <div>
            <span>Published</span>
            <strong>{stats.published}</strong>
            <p>Student-visible PDFs</p>
          </div>

          <div>
            <span>Draft</span>
            <strong>{stats.draft}</strong>
            <p>Build mode items</p>
          </div>

          <div>
            <span>Missing PDF</span>
            <strong>{stats.missingPdf}</strong>
            <p>Need source check</p>
          </div>

          <div className="dark">
            <span>Unpublished</span>
            <strong>{stats.unpublished}</strong>
            <p>Hidden from students</p>
          </div>

          <div className="dark">
            <span>Archived</span>
            <strong>{stats.archived}</strong>
            <p>Hidden records</p>
          </div>

          <div className="dark">
            <span>Total PDFs</span>
            <strong>{stats.total}</strong>
            <p>Saved current affairs</p>
          </div>

          <div className="dark">
            <span>Selected</span>
            <strong>{stats.selected}</strong>
            <p>Ready for action</p>
          </div>
        </section>

        <section className="adminCaBulkShell">
          <div className="adminCaBulkSelected">
            <span>Selected PDFs</span>
            <strong>{selectedIds.length}</strong>
          </div>

          <div className="adminCaBulkActions">
            <button type="button" onClick={selectVisible}>
              Select Visible
            </button>

            <button type="button" onClick={clearSelected}>
              Clear Selected
            </button>

            <button type="button" disabled>
              Publish
            </button>

            <button type="button" disabled>
              Unpublish
            </button>

            <button type="button" disabled>
              Archive
            </button>

            <button type="button" disabled>
              Delete
            </button>
          </div>
        </section>

        <section className="adminCaPriorityShell">
          <div className="adminCaSectionHeader">
            <div>
              <span>Priority Queue</span>
              <h2>Needs Attention</h2>
            </div>

            <strong>{priorityItems.length} priority</strong>
          </div>

          {priorityItems.length === 0 ? (
            <div className="adminCaManageNotice">
              <strong>No priority current affairs.</strong>
              <p>All visible records have clean publish and PDF source status.</p>
            </div>
          ) : (
            <div className="adminCaPriorityGrid">
              {priorityItems.map((item) => {
                const pdfUrl = getCaPdfUrl(item);
                const status = getCaStatus(item);

                return (
                  <article className="adminCaPriorityCard" key={item.id}>
                    <span>{pdfUrl ? "Review" : "Missing PDF"}</span>
                    <h3>{getCaTitle(item)}</h3>
                    <p>
                      {getCaMonth(item)} • {getCaChapter(item)} •{" "}
                      {getStatusLabel(status)}
                    </p>

                    <button type="button" onClick={() => handleEdit(item)}>
                      Fix Record
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="adminCaLibraryShell">
          <div className="adminCaSectionHeader">
            <div>
              <span>Saved Current Affairs</span>
              <h2>Current Affairs Control Library</h2>
            </div>

            <strong>
              Page {safePage} / {totalPages}
            </strong>
          </div>

          {paginatedItems.length === 0 ? (
            <div className="adminCaManageNotice">
              <strong>No current affairs matched.</strong>
              <p>Try changing search, status, month, plan, or sort filters.</p>
            </div>
          ) : (
            <div className="adminCaLibraryStack">
              {paginatedItems.map((item) => {
                const pdfUrl = getCaPdfUrl(item);
                const status = getCaStatus(item);
                const plan = getCaPlan(item);
                const isSelected = selectedIds.includes(item.id);

                return (
                  <article className="adminCaLibraryCard" key={item.id}>
                    <div className="adminCaLibrarySelect">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(item.id)}
                        aria-label={`Select ${getCaTitle(item)}`}
                      />
                      <span>Select</span>
                    </div>

                    <div className="adminCaLibraryBody">
                      <div className="adminCaLibraryTop">
                        <div>
                          <div className="adminCaLibraryPills">
                            <span className="plan">{plan}</span>
                            <span className={`status status-${status}`}>
                              {getStatusLabel(status)}
                            </span>
                            <span className={pdfUrl ? "source ready" : "source missing"}>
                              {pdfUrl ? "PDF Ready" : "PDF Missing"}
                            </span>
                          </div>

                          <h3>{getCaTitle(item)}</h3>

                          <p>
                            {getCaMonth(item)} • {getCaChapter(item)} •{" "}
                            {plan} Shelf
                          </p>
                        </div>
                      </div>

                      <div className="adminCaLibraryMetrics">
                        <div>
                          <span>Month</span>
                          <strong>{getCaMonth(item)}</strong>
                        </div>

                        <div>
                          <span>Week / Chapter</span>
                          <strong>{getCaChapter(item)}</strong>
                        </div>

                        <div>
                          <span>PDF Source</span>
                          <strong>{pdfUrl ? "Ready" : "Missing"}</strong>
                        </div>

                        <div>
                          <span>Student Access</span>
                          <strong>
                            {status === "published" ? "Live" : "Review"}
                          </strong>
                        </div>
                      </div>

                      <div className="adminCaLibraryAudit">
                        <span>Created {formatDate(item.createdAt)}</span>
                        <span>Updated {formatDate(item.updatedAt)}</span>
                      </div>

                      <div className="adminCaLibraryFooter">
                        <button
                          type="button"
                          className="adminCaPreviewBtn"
                          disabled={!pdfUrl}
                          onClick={() => openPdf(item)}
                        >
                          Open PDF
                        </button>

                        <div className="adminCaActionsWrap">
                          <button
                            type="button"
                            className="adminCaActionsBtn"
                            onClick={() =>
                              setOpenActionId((current) =>
                                current === item.id ? null : item.id
                              )
                            }
                          >
                            Actions⌄
                          </button>

                          {openActionId === item.id && (
                            <div className="adminCaActionsMenu">
                              <button type="button" onClick={() => handleEdit(item)}>
                                ✏️ Edit
                              </button>

                              <button type="button" onClick={() => openPdf(item)}>
                                📄 Open PDF
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyPdfLink(item)}
                              >
                                🔗 Copy PDF Link
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() => handleDelete(item)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="adminCaPagination">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ← Previous
            </button>

            <span>
              Page {safePage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next →
            </button>
          </div>
        </section>

        <section className="adminCaToolsShell">
          <div>
            <span>Current Affairs Tools</span>
            <h2>PDF Data Tools</h2>
          </div>

          <div className="adminCaToolsGrid">
            <button type="button" onClick={() => navigate("/admin/content/current-affairs/add")}>
              + Add Current Affair
            </button>

            <button type="button" onClick={() => navigate("/admin/content/current-affairs/months")}>
              Month Library
            </button>

            <button type="button" onClick={() => navigate("/admin/content/current-affairs/published")}>
              Published PDFs
            </button>

            <button type="button" onClick={() => navigate("/admin/content/current-affairs")}>
              ← Back to Command Center
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}