import React from "react";
import { useNavigate } from "react-router-dom";

import {
  canAccessNotePlan,
  getNoteChapter,
  getNotePlan,
  getNoteSubject,
} from "../shared/notesUtils";

import "../../../styles/notes/aspireNestNotesAppleV4.css";

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const noteId = (note = {}) =>
  String(note.id || note.slug || note.title || "").trim();

const normalize = (value = "") =>
  String(value || "").trim().toLowerCase();

const isPublishedNote = (note = {}) =>
  normalize(note.section) === "notes" &&
  ["published", "live"].includes(normalize(note.status));

const isAssignedNote = (note = {}) =>
  Boolean(
    note.assigned ||
      note.isAssigned ||
      note.assignedTo ||
      note.assignmentId
  );

const readSaved = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

export default function StudentNotesLibraryRoute({
  universalContent = [],
  handleNoteAccess,
  hasPlanAccess,
  user,
}) {
  const navigate = useNavigate();

  const savedKey = React.useMemo(
    () => `aspirenest:notes:saved:${user?.uid || user?.email || "guest"}`,
    [user?.uid, user?.email]
  );

  const [planFilter, setPlanFilter] = React.useState("ALL");
  const [subjectFilter, setSubjectFilter] = React.useState("ALL");
  const [accessFilter, setAccessFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");
  const [savedIds, setSavedIds] = React.useState(() => readSaved(savedKey));

  React.useEffect(() => {
    setSavedIds(readSaved(savedKey));
  }, [savedKey]);

  React.useEffect(() => {
    document.documentElement.classList.add("aspireNotesAppleScrollRoot");
    document.body.classList.add("aspireNotesAppleScrollBody");
    return () => {
      document.documentElement.classList.remove("aspireNotesAppleScrollRoot");
      document.body.classList.remove("aspireNotesAppleScrollBody");
    };
  }, []);

  const publishedNotes = React.useMemo(() => {
    const seen = new Set();

    return universalContent
      .filter(isPublishedNote)
      .filter((note) => {
        const id = noteId(note);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [universalContent]);

  const planCounts = React.useMemo(() => {
    const counts = Object.fromEntries(PLAN_ORDER.map((plan) => [plan, 0]));
    publishedNotes.forEach((note) => {
      const plan = getNotePlan(note);
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return counts;
  }, [publishedNotes]);

  const subjects = React.useMemo(() => {
    const map = new Map();

    publishedNotes.forEach((note) => {
      const subject = getNoteSubject(note);
      const key = normalize(subject);
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, { key, label: subject, count: 0 });
      }
      map.get(key).count += 1;
    });

    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [publishedNotes]);

  const canOpenNote = React.useCallback(
    (note) => {
      const plan = getNotePlan(note);

      return canAccessNotePlan({
        planName: plan,
        hasPlanAccess,
        accessOptions: {
          module: "notes",
          itemType: "notesPdf",
          itemId: noteId(note),
        },
      });
    },
    [hasPlanAccess]
  );

  const canAccessPlan = React.useCallback(
    (plan) =>
      canAccessNotePlan({
        planName: plan,
        hasPlanAccess,
        accessOptions: {
          module: "notes",
        },
      }),
    [hasPlanAccess]
  );

  const filteredNotes = React.useMemo(() => {
    return publishedNotes.filter((note) => {
      const plan = getNotePlan(note);
      const subject = normalize(getNoteSubject(note));
      const id = noteId(note);

      if (planFilter !== "ALL" && plan !== planFilter) return false;
      if (subjectFilter !== "ALL" && subject !== subjectFilter) return false;

      if (accessFilter === "access" && !canOpenNote(note)) return false;
      if (accessFilter === "free" && plan !== "FREE") return false;
      if (accessFilter === "assigned" && !isAssignedNote(note)) return false;
      if (accessFilter === "saved" && !savedIds.has(id)) return false;

      return true;
    });
  }, [
    publishedNotes,
    planFilter,
    subjectFilter,
    accessFilter,
    savedIds,
    canOpenNote,
  ]);

  const setSaved = (note) => {
    const id = noteId(note);
    if (!id) return;

    const next = new Set(savedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    setSavedIds(next);

    try {
      window.localStorage.setItem(savedKey, JSON.stringify([...next]));
    } catch {
      // Saved state is only a device-local convenience.
    }
  };

  const openNote = (note) => {
    if (typeof handleNoteAccess === "function") {
      handleNoteAccess(note);
      return;
    }

    navigate("/ctet-tet/notes");
  };

  return (
    <section className="studentNotesAppleV4" data-view={view}>
      <div className="notesPremiumHeading">
        <div>
          <span className="notesPremiumEyebrow">CTET / TET NOTES</span>
          <h1>Notes</h1>
          <p>
            Choose a plan and subject, then open the exact published note.
            Your existing AspireNest access is checked again when the note opens.
          </p>
        </div>

        <button
          type="button"
          className="notesPremiumAccessButton"
          onClick={() => navigate("/my-profile")}
        >
          Open My Access
        </button>
      </div>

      <div className="notesPremiumFilters">
        <div className="notesPremiumFilterRow">
          <div className="notesPremiumFilterLabel">
            <strong>Plans</strong>
            <span>{publishedNotes.length} notes</span>
          </div>

          <div className="notesPremiumChipScroller">
            <button
              type="button"
              className={`notesPremiumChip ${
                planFilter === "ALL" ? "active" : ""
              }`}
              onClick={() => setPlanFilter("ALL")}
            >
              <span>All Plans</span>
              <small>{publishedNotes.length}</small>
            </button>

            {PLAN_ORDER.map((plan) => {
              const access = canAccessPlan(plan);

              return (
                <button
                  type="button"
                  key={plan}
                  className={`notesPremiumChip notesPremiumPlanChip ${
                    planFilter === plan ? "active" : ""
                  }`}
                  onClick={() => setPlanFilter(plan)}
                >
                  <span>{plan}</span>
                  <small>{planCounts[plan] || 0}</small>
                  <em className={access ? "hasAccess" : "lockedAccess"}>
                    {access ? "Access" : "Locked"}
                  </em>
                </button>
              );
            })}
          </div>
        </div>

        <div className="notesPremiumFilterRow">
          <div className="notesPremiumFilterLabel">
            <strong>Subjects</strong>
            <span>{subjects.length} subjects</span>
          </div>

          <div className="notesPremiumChipScroller">
            <button
              type="button"
              className={`notesPremiumChip ${
                subjectFilter === "ALL" ? "active" : ""
              }`}
              onClick={() => setSubjectFilter("ALL")}
            >
              All Subjects
            </button>

            {subjects.map((subject) => (
              <button
                type="button"
                key={subject.key}
                className={`notesPremiumChip ${
                  subjectFilter === subject.key ? "active" : ""
                }`}
                onClick={() => setSubjectFilter(subject.key)}
              >
                <span>{subject.label}</span>
                <small>{subject.count}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="notesPremiumFilterRow notesPremiumUtilityRow">
          <div className="notesPremiumUtilityChips">
            {[
              ["all", "All Content"],
              ["access", "My Access"],
              ["free", "Free"],
              ["assigned", "Assigned"],
              ["saved", "Saved"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={`notesPremiumChip ${
                  accessFilter === id ? "active" : ""
                }`}
                onClick={() => setAccessFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="notesPremiumViewToggle" aria-label="Notes view">
            <button
              type="button"
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              ☷
            </button>
            <button
              type="button"
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              ▦
            </button>
          </div>
        </div>
      </div>

      <div className="notesPremiumResultsMeta">
        <strong>{filteredNotes.length}</strong>
        <span>notes in this view</span>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="notesPremiumGrid">
          {filteredNotes.map((note) => {
            const id = noteId(note);
            const plan = getNotePlan(note);
            const subject = getNoteSubject(note);
            const chapter = getNoteChapter(note);
            const access = canOpenNote(note);
            const saved = savedIds.has(id);

            return (
              <article className="notesPremiumCard" key={id}>
                <button
                  type="button"
                  className="notesPremiumCardOpen"
                  onClick={() => openNote(note)}
                  aria-label={`Open ${note.title || "note"}`}
                >
                  <div className="notesPremiumThumb">
                    <span className="notesPremiumTypeIcon">N</span>
                    <span
                      className={`notesPremiumState ${
                        access ? "open" : "locked"
                      }`}
                    >
                      {access ? "Open" : "Locked"}
                    </span>
                  </div>

                  <div className="notesPremiumCardBody">
                    <div className="notesPremiumMeta">
                      <small>Note • {subject}</small>
                      <span>{plan}</span>
                    </div>

                    <h3>{note.title || "Study Note"}</h3>

                    <p>
                      {note.description ||
                        note.subtitle ||
                        chapter ||
                        "Chapter-wise study material"}
                    </p>

                    <div className="notesPremiumProgress">
                      <span />
                    </div>
                  </div>
                </button>

                <div className="notesPremiumCardFooter">
                  <small>{chapter || "Open resource"}</small>

                  <button
                    type="button"
                    className={`notesPremiumSave ${saved ? "saved" : ""}`}
                    onClick={() => setSaved(note)}
                    aria-label={saved ? "Remove saved note" : "Save note"}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="notesPremiumEmpty">
          <span>⌕</span>
          <h3>No notes match this filter</h3>
          <p>
            Choose All Plans or All Subjects to see the published Notes library.
          </p>
        </div>
      )}
    </section>
  );
}
