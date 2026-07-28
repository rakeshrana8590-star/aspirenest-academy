import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getNoteChapter,
  getNotePlan,
  getNoteSubject,
  hasNativeIntelliText,
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
          <div className="intelliTextMigrationHeroCopy">
            <span>ALL-NOTES INTELLITEXT MIGRATION</span>
            <h1>Convert every existing and future Note into one IntelliText experience</h1>
            <p>
              Every card below is the existing canonical contentItems resource. PDF files remain hidden rollback sources only until that exact Note passes IntelliText publishing and student QA.
            </p>
          </div>
          <div className="intelliTextMigrationSummary" aria-label="IntelliText migration status">
            <div>
              <strong>{notes.filter(hasNativeIntelliText).length}</strong>
              <span>IntelliText ready</span>
            </div>
            <div>
              <strong>{notes.filter((note) => !hasNativeIntelliText(note)).length}</strong>
              <span>Conversion required</span>
            </div>
          </div>
        </header>

        <div className="intelliTextAuthoringCatalogGrid">
          {notes.map((note) => (
            <article key={note.id}>
              <span>{getNotePlan(note)} • {hasNativeIntelliText(note) ? "INTELLITEXT READY" : "CONVERSION REQUIRED"}</span>
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
                {hasNativeIntelliText(note) ? "Review IntelliText" : "Convert to IntelliText"}
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
