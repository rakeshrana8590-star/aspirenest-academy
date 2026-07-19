import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getNoteChapter,
  getNotePlan,
  getNoteSubject,
  isNotesContent,
} from "../shared/notesUtils";
import IntelliTextAuthoringStudio from "./IntelliTextAuthoringStudio";

export default function AdminIntelliTextAuthoringRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();
  const { textbookId = "" } = useParams();
  const decodedTextbookId = decodeURIComponent(textbookId || "");
  const notes = useMemo(
    () => universalContent.filter((item) => isNotesContent(item)),
    [universalContent]
  );
  const canonicalNote = useMemo(
    () =>
      notes.find(
        (note) => String(note.id || "").trim() === decodedTextbookId
      ) || null,
    [decodedTextbookId, notes]
  );

  if (!decodedTextbookId) {
    return (
      <section className="coursePages intelliTextAuthoringCatalog">
        <header>
          <button
            type="button"
            onClick={() => navigate("/admin/content/notes/manage")}
          >
            ← Notes Manager
          </button>
          <span>NATIVE AUTHORING</span>
          <h1>Select the canonical Notes resource</h1>
          <p>
            IntelliText attaches to the existing contentItems document. It never creates a duplicate plan-owned note.
          </p>
        </header>

        <div className="intelliTextAuthoringCatalogGrid">
          {notes.map((note) => (
            <article key={note.id}>
              <span>{getNotePlan(note)}</span>
              <h2>{note.title || "Untitled note"}</h2>
              <p>
                {getNoteSubject(note) || "No subject"} • {getNoteChapter(note) || "No chapter"}
              </p>
              <code>{note.id}</code>
              <button
                type="button"
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
            </article>
          ))}
        </div>

        {notes.length === 0 ? (
          <div className="intelliTextAuthoringState">
            <span>NO CANONICAL NOTES</span>
            <h2>Create the catalog note first</h2>
            <p>
              Use the existing Notes CMS to create the canonical contentItems record before native authoring.
            </p>
          </div>
        ) : null}
      </section>
    );
  }

  if (!canonicalNote) {
    return (
      <section className="coursePages intelliTextAuthoringState">
        <span>CANONICAL NOTE NOT FOUND</span>
        <h1>Native authoring cannot open this identity.</h1>
        <p>
          The textbookId must equal an existing Notes contentItems document ID. No duplicate note was created.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/content/notes/intellitext")}
        >
          Select canonical note
        </button>
      </section>
    );
  }

  return (
    <section className="coursePages intelliTextAuthoringRoute">
      <IntelliTextAuthoringStudio
        canonicalNote={canonicalNote}
        onBack={() => navigate("/admin/content/notes/manage")}
      />
    </section>
  );
}
