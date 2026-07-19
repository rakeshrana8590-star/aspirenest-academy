import React from "react";
import { useNavigate } from "react-router-dom";

import StudentNotesHero from "./StudentNotesHero";
import { StudentNotesPlanCard } from "./StudentNoteCards";

import {
  NOTES_PLAN_ORDER,
  getNotesPdfCount,
  getPlanNotes,
} from "../shared/notesUtils";

export default function StudentNotesLibraryRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();

  const publishedNotes = NOTES_PLAN_ORDER.flatMap((planName) =>
    getPlanNotes(universalContent, planName)
  );

  return (
    <section className="studentNotesPage">
      <StudentNotesHero
        badge="CTET / TET NOTES"
        title="Notes & Revision Library"
        text="Access plan-wise, subject-wise, and chapter-wise PDF notes inside one premium AspireNest revision system."
        stats={[
          {
            label: "Published PDFs",
            value: getNotesPdfCount(publishedNotes),
          },
          {
            label: "Plans",
            value: NOTES_PLAN_ORDER.length,
          },
          {
            label: "Mode",
            value: "Premium",
          },
        ]}
      />

      <section className="intelliTextRevisionLibraryEntry">
        <div>
          <span>MY PRIVATE PREPARATION SYSTEM</span>
          <h2>Flashcards, active recall, and due-date revision</h2>
          <p>
            Open one owner-only workspace for flashcards created from
            IntelliText selections, manual recall cards, and your personal
            revision queue.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/ctet-tet/notes/my-study-workspace")
          }
        >
          Open My Study Workspace →
        </button>
      </section>

      <div className="studentNotesShelf studentNotesPlanShelf">
        <div className="studentNotesShelfHeader">
          <span>Notes Library</span>

          <h2>Choose your revision plan</h2>

          <p>
            Select a plan shelf and continue into subject-wise, chapter-wise,
            and PDF-wise notes without leaving the AspireNest learning flow.
          </p>
        </div>

        <div className="studentNotesPlanGrid">
          {NOTES_PLAN_ORDER.map((planName) => (
            <StudentNotesPlanCard
              key={planName}
              planName={planName}
              notes={getPlanNotes(universalContent, planName)}
              onOpen={() => navigate(`/ctet-tet/notes/plan/${planName}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}