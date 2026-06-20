import React, { useMemo, useState } from "react";
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

const STATUS_FILTERS = ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"];

function getVisibleStatus(note = {}) {
  const status = getNoteStatus(note);

  if (!status) return "draft";

  return status;
}

function getStatusLabel(note = {}) {
  return getVisibleStatus(note).toUpperCase();
}

export default function AdminNotesManageRoute({
  universalContent = [],
  notesPlanFilter = "ALL",
  setNotesPlanFilter = () => {},
  onEditNote,
  onDeleteNote,
}) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  const notes = useMemo(
    () => universalContent.filter((item) => isNotesContent(item)),
    [universalContent]
  );

  const filteredNotes = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return notes.filter((note) => {
      const planMatch =
        notesPlanFilter === "ALL" || getNotePlan(note) === notesPlanFilter;

      const statusMatch =
        statusFilter === "ALL" ||
        getVisibleStatus(note).toUpperCase() === statusFilter;

      const haystack = [
        note.title,
        note.description,
        getNoteSubject(note),
        getNoteChapter(note),
        getNotePlan(note),
        getStatusLabel(note),
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = !query || haystack.includes(query);

      return planMatch && statusMatch && searchMatch;
    });
  }, [notes, notesPlanFilter, searchText, statusFilter]);

  const pdfReadyCount = filteredNotes.filter((note) => hasNotePdf(note)).length;
  const missingPdfCount = filteredNotes.length - pdfReadyCount;
  const publishedCount = filteredNotes.filter(
    (note) => getVisibleStatus(note) === "published"
  ).length;

  const openPdf = (note) => {
    const pdfUrl = getNotePdfUrl(note);

    if (!pdfUrl) {
      window.alert("PDF URL missing for this note.");
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
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
  };

  return (
    <section className="coursePages adminMockPlanPage adminNotesPlanAlignedPage">
      <section className="adminNotesLaunchHero">
        <div className="adminNotesLaunchHeroCopy">
          <span className="adminNotesLaunchBadge">MANAGE NOTES</span>

          <h1>Notes Control Room</h1>

          <p>
            Review every saved note, verify PDF readiness, edit metadata,
            open source PDFs, and safely remove wrong content before student
            launch.
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
              onClick={() => navigate("/admin/content/notes")}
            >
              ← Back to Notes
            </button>
          </div>

          <div className="adminNotesLaunchTrustRow">
            <span>✓ PDF audit</span>
            <span>✓ Edit safe</span>
            <span>✓ Plan filter</span>
            <span>✓ Delete confirm</span>
          </div>
        </div>

        <div className="adminNotesLaunchSystemCard">
          <div className="adminNotesLaunchSystemTop">
            <span>Notes Audit</span>
            <strong>Admin Workspace</strong>
          </div>

          <div className="adminNotesLaunchTitleCard">
            <span className="adminNotesLaunchIcon">📘</span>

            <div>
              <h3>Manage Notes</h3>
              <p>CTET / TET NOTES CMS</p>
            </div>
          </div>

          <div className="adminNotesLaunchSystemGrid">
            <div className="adminNotesLaunchFeatureCard">
              <strong>{filteredNotes.length}</strong>
              <span>Filtered Notes</span>
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
              <strong>{missingPdfCount}</strong>
              <span>Needs Fix</span>
            </div>
          </div>

          <div className="adminNotesLaunchSystemFlow">
            <span>Plan</span>
            <i />
            <span>Subject</span>
            <i />
            <span>Chapter</span>
            <i />
            <span>PDF</span>
          </div>
        </div>
      </section>

      <div className="adminMockPlanKpiGrid">
        <div className="adminMockPlanKpiCard">
          <span>Total Notes</span>
          <strong>{notes.length}</strong>
          <p>All notes saved in CMS</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Filtered</span>
          <strong>{filteredNotes.length}</strong>
          <p>Current filter results</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>PDF Ready</span>
          <strong>{pdfReadyCount}</strong>
          <p>Notes with valid PDF source</p>
        </div>

        <div className="adminMockPlanKpiCard">
          <span>Needs Fix</span>
          <strong>{missingPdfCount}</strong>
          <p>Missing PDF/source URL</p>
        </div>
      </div>

      <div className="adminMockPlanPanel adminNotesManagePanel">
        <div className="adminMockPlanPanelHeader">
          <div>
            <span>NOTES AUDIT LIBRARY</span>
            <h2>Manage saved notes</h2>
          </div>

          <small>{filteredNotes.length} notes</small>
        </div>

        <div className="adminNotesManageToolbar">
          <div className="adminNotesManageFilterGroup">
            <span>Plan</span>

            {["ALL", ...NOTES_PLAN_ORDER].map((plan) => (
              <button
                type="button"
                key={plan}
                className={notesPlanFilter === plan ? "isActive" : ""}
                onClick={() => setNotesPlanFilter(plan)}
              >
                {plan}
              </button>
            ))}
          </div>

          <div className="adminNotesManageFilterGroup">
            <span>Status</span>

            {STATUS_FILTERS.map((status) => (
              <button
                type="button"
                key={status}
                className={statusFilter === status ? "isActive" : ""}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search title, subject, chapter..."
          />
        </div>

        {filteredNotes.length === 0 ? (
          <div className="adminMockPlanEmpty">
            <strong>No notes found.</strong>
            <p>Change filters or add a new note PDF.</p>
          </div>
        ) : (
          <div className="adminNotesManageGrid">
            {filteredNotes.map((note) => {
              const pdfReady = hasNotePdf(note);
              const subject = getNoteSubject(note);
              const chapter = getNoteChapter(note);
              const plan = getNotePlan(note);
              const status = getStatusLabel(note);

              return (
                <article className="adminNotesManageCard" key={note.id}>
                  <div className="adminNotesManageCardTop">
                    <span className="adminNotesManageIcon">📄</span>

                    <div>
                      <strong>{note.title || "Untitled Note"}</strong>
                      <small>
                        {plan} • {subject} • {chapter}
                      </small>
                    </div>

                    <em className={pdfReady ? "isReady" : "needsFix"}>
                      {pdfReady ? "PDF READY" : "PDF MISSING"}
                    </em>
                  </div>

                  <p>
                    {note.description ||
                      "No description added. Review metadata before launch."}
                  </p>

                  <div className="adminNotesManageMetaGrid">
                    <div>
                      <span>Status</span>
                      <strong>{status}</strong>
                    </div>

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
                  </div>

                  <div className="adminNotesManageActions">
                    <button
                      type="button"
                      onClick={() => openPdf(note)}
                      disabled={!pdfReady}
                    >
                      Open PDF
                    </button>

                    <button type="button" onClick={() => editNote(note)}>
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteNote(note)}
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

      <div className="adminMockPlanBottomActions">
        <button
          type="button"
          className="adminMockPlanPrimaryBtn"
          onClick={() => navigate("/admin/content/notes/form")}
        >
          + Add Note PDF
        </button>

        <button
          type="button"
          className="adminMockPlanGhostBtn"
          onClick={() => navigate("/admin/content/notes")}
        >
          ← Back to Notes Manager
        </button>
      </div>
    </section>
  );
}