import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getNoteChapter,
  getNotePdfUrl,
  getNotePlan,
  getNoteStatus,
  getNoteSubject,
  hasNotePdf,
  isNotesContent,
  NOTES_PLAN_ORDER,
} from "../shared/notesUtils";

const STATUS_FILTERS = [
  { id: "ALL", label: "All Status" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "unpublished", label: "Unpublished" },
  { id: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { id: "latest", label: "Latest First" },
  { id: "title", label: "Title A-Z" },
  { id: "plan", label: "Plan" },
  { id: "status", label: "Status" },
];

const PAGE_SIZE = 6;

function getNoteId(note = {}, index = 0) {
  return note.id || `${note.title || "note"}-${index}`;
}

function getStatusLabel(note = {}) {
  return (getNoteStatus(note) || "draft").toUpperCase();
}

function getTimeValue(value) {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

export default function AdminNotesManageRoute({
  universalContent = [],
  notesPlanFilter = "ALL",
  setNotesPlanFilter = () => {},
  onEditNote,
  onDeleteNote,
  onBackfillProtectedNotesAssets,
}) {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("latest");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeMenuPosition, setActiveMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [page, setPage] = useState(1);

  const notes = useMemo(
    () => universalContent.filter((item) => isNotesContent(item)),
    [universalContent]
  );

  const planCounts = useMemo(() => {
    const counts = {
      ALL: notes.length,
      FREE: 0,
      BASIC: 0,
      PREMIUM: 0,
      MENTORSHIP: 0,
    };

    notes.forEach((note) => {
      const plan = getNotePlan(note);

      if (counts[plan] !== undefined) {
        counts[plan] += 1;
      }
    });

    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const filtered = notes.filter((note) => {
      const plan = getNotePlan(note);
      const status = getNoteStatus(note);

      const planMatch = notesPlanFilter === "ALL" || plan === notesPlanFilter;
      const statusMatch = statusFilter === "ALL" || status === statusFilter;

      const haystack = [
        note.title,
        note.description,
        plan,
        status,
        getNoteSubject(note),
        getNoteChapter(note),
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = !query || haystack.includes(query);

      return planMatch && statusMatch && searchMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sortMode === "plan") {
        return getNotePlan(a).localeCompare(getNotePlan(b));
      }

      if (sortMode === "status") {
        return getNoteStatus(a).localeCompare(getNoteStatus(b));
      }

      return (
        getTimeValue(b.updatedAt || b.createdAt) -
        getTimeValue(a.updatedAt || a.createdAt)
      );
    });
  }, [notes, notesPlanFilter, searchText, sortMode, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredNotes.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedNotes = filteredNotes.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const selectedNotes = filteredNotes.filter((note, index) =>
    selectedIds.includes(getNoteId(note, index))
  );

  const publishedCount = filteredNotes.filter(
    (note) => getNoteStatus(note) === "published"
  ).length;
  const draftCount = filteredNotes.filter(
    (note) => getNoteStatus(note) === "draft"
  ).length;
  const archivedCount = filteredNotes.filter(
    (note) => getNoteStatus(note) === "archived"
  ).length;
  const pdfReadyCount = filteredNotes.filter((note) => hasNotePdf(note)).length;
  const missingPdfCount = filteredNotes.length - pdfReadyCount;

  useEffect(() => {
    if (!activeMenuId) return;

    const closeMenu = () => setActiveMenuId(null);

    const closeOnOutsideClick = (event) => {
      const target = event.target;

      if (
        target?.closest?.(".adminNotesManageActionMenu") ||
        target?.closest?.(".adminNotesManageMenuButton")
      ) {
        return;
      }

      closeMenu();
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeMenuId]);

  const openActionMenu = (event, id) => {
    event.stopPropagation();

    if (activeMenuId === id) {
      setActiveMenuId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 248;
    const menuHeight = 300;
    const gap = 12;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + gap;

    const top = openUp
      ? Math.max(gap, rect.top - menuHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - menuHeight - gap);

    const left = Math.min(
      Math.max(gap, rect.right - menuWidth),
      window.innerWidth - menuWidth - gap
    );

    setActiveMenuPosition({
      top,
      left,
    });

    setActiveMenuId(id);
  };

  const resetToFirstPage = () => {
    setPage(1);
    setSelectedIds([]);
  };

  const openPdf = (note) => {
    const pdfUrl = getNotePdfUrl(note);

    if (!pdfUrl) {
      window.alert("PDF URL missing for this note.");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const copyPdfLink = async (note) => {
    const pdfUrl = getNotePdfUrl(note);

    if (!pdfUrl) {
      window.alert("PDF URL missing for this note.");
      return;
    }

    try {
      await navigator.clipboard.writeText(pdfUrl);
      window.alert("PDF link copied.");
    } catch (error) {
      window.prompt("Copy PDF link:", pdfUrl);
    }
  };

  const exportNoteJson = (note) => {
    const fileName = `${(note.title || "note")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "note"}-export.json`;

    const blob = new Blob([JSON.stringify(note, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const editNote = (note) => {
    if (typeof onEditNote === "function") {
      onEditNote(note);
      return;
    }

    navigate("/admin/content/notes/form");
  };

  const deleteNote = (note) => {
    const confirmDelete = window.confirm(
      `Delete "${note.title || "this note"}" permanently?\n\n` +
        "Students may lose access to this content.\n\n" +
        "This action cannot be undone."
    );

    if (!confirmDelete) return;

    if (typeof onDeleteNote === "function") {
      onDeleteNote(note);
    }

    setSelectedIds((current) =>
      current.filter((id) => id !== getNoteId(note))
    );
  };

  const toggleSelected = (note, index) => {
    const id = getNoteId(note, index);

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const selectVisible = () => {
    setSelectedIds(
      pagedNotes.map((note, index) =>
        getNoteId(note, (safePage - 1) * PAGE_SIZE + index)
      )
    );
  };

  const deleteSelected = () => {
    if (selectedNotes.length === 0) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedNotes.length} selected notes permanently?\n\n` +
        "Students may lose access to these PDFs.\n\n" +
        "This action cannot be undone."
    );

    if (!confirmDelete) return;

    selectedNotes.forEach((note) => {
      if (typeof onDeleteNote === "function") {
        onDeleteNote(note);
      }
    });

    setSelectedIds([]);
  };

  return (
    <section className="coursePages adminNotesManagePage">
      <section className="adminNotesLaunchHero">
        <div className="adminNotesLaunchHeroCopy">
          <span className="adminNotesLaunchBadge">MANAGE NOTES</span>

          <h1>Notes Control Room</h1>

          <p>
            Review every canonical CTET/TET note, preserve its PDF fallback,
            and open the controlled IntelliText authoring studio from one command center.
          </p>

          <div className="adminNotesLaunchHeroActions">
            <button
              type="button"
              className="adminNotesLaunchPrimaryBtn"
              onClick={() => navigate("/admin/content/notes/form")}
            >
              + Add Note PDF
            </button>

            <button
              type="button"
              className="adminNotesLaunchGhostBtn"
              onClick={() => navigate("/admin/content/notes/intellitext")}
            >
              ✦ Native Authoring
            </button>

            {typeof onBackfillProtectedNotesAssets === "function" ? (
              <button
                type="button"
                className="adminNotesLaunchGhostBtn"
                onClick={onBackfillProtectedNotesAssets}
              >
                🔒 Sync Protected PDFs
              </button>
            ) : null}

            <button
              type="button"
              className="adminNotesLaunchGhostBtn"
              onClick={() => navigate("/admin/content/notes")}
            >
              ← Back
            </button>
          </div>

          <div className="adminNotesLaunchTrustRow">
            <span>✓ PDF audit</span>
            <span>✓ Edit safe</span>
            <span>✓ Export ready</span>
            <span>✓ Delete confirm</span>
          </div>
        </div>

        <div className="adminNotesLaunchSystemCard">
          <div className="adminNotesLaunchSystemTop">
            <span>Manager Status</span>
            <strong>Live</strong>
          </div>

          <div className="adminNotesLaunchTitleCard">
            <span className="adminNotesLaunchIcon">📘</span>

            <div>
              <h3>Notes Manager</h3>
              <p>CTET / TET NOTES CMS</p>
            </div>
          </div>

          <div className="adminNotesLaunchSystemGrid">
            <div className="adminNotesLaunchFeatureCard">
              <strong>{notes.length}</strong>
              <span>Total Notes</span>
            </div>

            <div className="adminNotesLaunchFeatureCard">
              <strong>{publishedCount}</strong>
              <span>Published</span>
            </div>

            <div className="adminNotesLaunchFeatureCard">
              <strong>{pdfReadyCount}</strong>
              <span>PDF Ready</span>
            </div>

            <div className="adminNotesLaunchFeatureCard">
              <strong>{selectedIds.length}</strong>
              <span>Selected</span>
            </div>
          </div>

          <div className="adminNotesLaunchSystemFlow">
            <span>Filter</span>
            <i />
            <span>Select</span>
            <i />
            <span>Action</span>
            <i />
            <span>PDF</span>
          </div>
        </div>
      </section>

      <section className="adminNotesManageFilters">
        <div className="adminNotesManageFilterGrid">
          <label>
            <span>Search Notes</span>
            <input
              type="search"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                resetToFirstPage();
              }}
              placeholder="Search by title, subject, chapter, plan..."
            />
          </label>

          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                resetToFirstPage();
              }}
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Sort</span>
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value);
                resetToFirstPage();
              }}
            >
              {SORT_OPTIONS.map((sort) => (
                <option key={sort.id} value={sort.id}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="adminNotesManagePlanTabs">
          {["ALL", ...NOTES_PLAN_ORDER].map((plan) => (
            <button
              type="button"
              key={plan}
              className={notesPlanFilter === plan ? "isActive" : ""}
              onClick={() => {
                setNotesPlanFilter(plan);
                resetToFirstPage();
              }}
            >
              <span>{plan}</span>
              <strong>{planCounts[plan] || 0}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="adminNotesManageKpis">
        <div>
          <span>Filtered Notes</span>
          <strong>{filteredNotes.length}</strong>
          <p>Current search result</p>
        </div>

        <div>
          <span>Published</span>
          <strong>{publishedCount}</strong>
          <p>Student-visible PDFs</p>
        </div>

        <div>
          <span>Draft</span>
          <strong>{draftCount}</strong>
          <p>Build mode notes</p>
        </div>

        <div>
          <span>Archived</span>
          <strong>{archivedCount}</strong>
          <p>Hidden records</p>
        </div>

        <div className="isDark">
          <span>PDF Ready</span>
          <strong>{pdfReadyCount}</strong>
          <p>Source URL available</p>
        </div>

        <div className="isDark">
          <span>Needs Fix</span>
          <strong>{missingPdfCount}</strong>
          <p>Missing PDF/source URL</p>
        </div>

        <div className="isDark">
          <span>Plans</span>
          <strong>{NOTES_PLAN_ORDER.length}</strong>
          <p>Access shelves</p>
        </div>

        <div className="isDark">
          <span>Selected</span>
          <strong>{selectedIds.length}</strong>
          <p>Ready for action</p>
        </div>
      </section>

      <section className="adminNotesManageBulkBar">
        <div>
          <span>Selected Notes</span>
          <strong>{selectedIds.length}</strong>
        </div>

        <div>
          <button type="button" onClick={selectVisible}>
            Select Visible
          </button>

          <button type="button" onClick={() => setSelectedIds([])}>
            Clear Selected
          </button>

          <button
            type="button"
            className="danger"
            disabled={selectedIds.length === 0}
            onClick={deleteSelected}
          >
            Delete Selected
          </button>
        </div>
      </section>

      <section className="adminNotesManageLibrary">
        <div className="adminNotesManageLibraryHeader">
          <div>
            <span>Saved Notes</span>
            <h2>Notes Control Library</h2>
          </div>

          <small>
            Page {safePage} / {pageCount}
          </small>
        </div>

        {pagedNotes.length === 0 ? (
          <div className="adminNotesManageEmpty">
            <strong>No notes found.</strong>
            <p>Change filters or add a new PDF note.</p>
          </div>
        ) : (
          <div className="adminNotesManageList">
            {pagedNotes.map((note, pageIndex) => {
              const realIndex = (safePage - 1) * PAGE_SIZE + pageIndex;
              const id = getNoteId(note, realIndex);
              const selected = selectedIds.includes(id);
              const pdfReady = hasNotePdf(note);
              const plan = getNotePlan(note);
              const subject = getNoteSubject(note);
              const chapter = getNoteChapter(note);
              const status = getStatusLabel(note);

              return (
                <article
                  className={`adminNotesManageCard ${
                    selected ? "isSelected" : ""
                  }`}
                  key={id}
                >
                  <button
                    type="button"
                    className="adminNotesManageSelect"
                    onClick={() => toggleSelected(note, realIndex)}
                  >
                    <span>{selected ? "✓" : ""}</span>
                    <strong>Select</strong>
                  </button>

                  <div className="adminNotesManageCardBody">
                    <div className="adminNotesManageTitleRow">
                      <div>
                        <span className="adminNotesManagePill">{plan}</span>
                        <span
                          className={`adminNotesManagePill ${
                            pdfReady ? "isReady" : "needsFix"
                          }`}
                        >
                          {pdfReady ? "PDF Ready" : "Missing PDF"}
                        </span>
                        <span className="adminNotesManagePill">{status}</span>
                      </div>

                      <h3>{note.title || "Untitled Note"}</h3>

                      <p>
                        {subject} • {chapter}
                      </p>
                    </div>

                    <div className="adminNotesManageMetaGrid">
                      <div>
                        <span>Plan</span>
                        <strong>{plan}</strong>
                      </div>

                      <div>
                        <span>Subject</span>
                        <strong>{subject}</strong>
                      </div>

                      <div>
                        <span>Chapter</span>
                        <strong>{chapter}</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>{status}</strong>
                      </div>
                    </div>

                    <div className="adminNotesManageDescription">
                      <span>Description</span>
                      <p>
                        {note.description ||
                          "No description added. Review metadata before launch."}
                      </p>
                    </div>

                    <div className="adminNotesManageActions">
                      <button
                        type="button"
                        disabled={!pdfReady}
                        onClick={() => openPdf(note)}
                      >
                        Open PDF
                      </button>

                      <button type="button" onClick={() => editNote(note)}>
                        Edit
                      </button>

                      <button
                        type="button"
                        className="adminNotesNativeAuthoringButton"
                        onClick={() =>
                          navigate(
                            `/admin/content/notes/intellitext/${encodeURIComponent(
                              note.id
                            )}`
                          )
                        }
                      >
                        Open IntelliText Studio
                      </button>

                      <div className="adminNotesManageActionMenuWrap">
                        <button
                          type="button"
                          className="adminNotesManageMenuButton"
                          onClick={(event) => openActionMenu(event, id)}
                        >
                          Actions ▾
                        </button>

                        {activeMenuId === id ? (
                          <div
                          className="adminNotesManageActionMenu"
                          style={{
                            top: `${activeMenuPosition.top}px`,
                            left: `${activeMenuPosition.left}px`,
                          }}
                        >
                            <button
                              type="button"
                              disabled={!pdfReady}
                              onClick={() => {
                                openPdf(note);
                                setActiveMenuId(null);
                              }}
                            >
                              📄 Open PDF
                            </button>

                            <button
                              type="button"
                              disabled={!pdfReady}
                              onClick={() => {
                                copyPdfLink(note);
                                setActiveMenuId(null);
                              }}
                            >
                              🔗 Copy PDF Link
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                exportNoteJson(note);
                                setActiveMenuId(null);
                              }}
                            >
                              📦 Export JSON
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                editNote(note);
                                setActiveMenuId(null);
                              }}
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigate(
                                  `/admin/content/notes/intellitext/${encodeURIComponent(
                                    note.id
                                  )}`
                                );
                                setActiveMenuId(null);
                              }}
                            >
                              ✦ Open IntelliText Studio
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                deleteNote(note);
                                setActiveMenuId(null);
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="adminNotesManagePagination">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            ← Previous
          </button>

          <strong>
            Page {safePage} of {pageCount}
          </strong>

          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
          >
            Next →
          </button>
        </div>
      </section>

      <section className="adminNotesManageTools">
        <div>
          <span>Notes Data Tools</span>
          <h2>PDF Management Shortcuts</h2>
        </div>

        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/content/notes/form")}
          >
            + Add Note PDF
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/content/notes/pdfs")}
          >
            Published PDFs
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/content/notes/intellitext")}
          >
            IntelliText Authoring
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/content/notes")}
          >
            ← Back to Notes Manager
          </button>
        </div>
      </section>
    </section>
  );
}