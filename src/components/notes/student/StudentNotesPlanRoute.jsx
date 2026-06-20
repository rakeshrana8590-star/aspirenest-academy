import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentNotesHero from "./StudentNotesHero";
import StudentNotesEmptyState from "./StudentNotesEmptyState";
import { StudentNotesLevelCard } from "./StudentNoteCards";

import {
  NOTES_PLAN_LABELS,
  buildNotesSubjectList,
  getNotesPdfCount,
  getPlanNotes,
  normalizeNoteText,
} from "../shared/notesUtils";

function getPublicNotesShelfTitle(subject = {}) {
  const title = subject.title || "Notes Shelf";

  if (normalizeNoteText(title) === "ctet-tet") {
    return "CTET/TET Revision Notes";
  }

  return title;
}

function getPublicNotesShelfText(subject = {}) {
  const title = subject.title || "";

  if (normalizeNoteText(title) === "ctet-tet") {
    return "Complete CTET/TET notes arranged into chapter-wise PDF shelves.";
  }

  return subject.description || "Open chapter-wise PDF notes inside this shelf.";
}

export default function StudentNotesPlanRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();
  const { plan } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const planLabel = NOTES_PLAN_LABELS[activePlan] || `${activePlan} Notes`;

  const planNotes = getPlanNotes(universalContent, activePlan);
  const subjects = buildNotesSubjectList(planNotes);

  return (
    <section className="studentNotesPage">
      <StudentNotesHero
        badge={`${activePlan} NOTES`}
        title={`${planLabel} Library`}
        text="Choose a notes shelf and continue into chapter-wise revision PDFs."
        backLabel="Back to Notes"
        onBack={() => navigate("/ctet-tet/notes")}
        stats={[
          {
            label: "Notes Shelves",
            value: subjects.length,
          },
          {
            label: "PDFs",
            value: getNotesPdfCount(planNotes),
          },
          {
            label: "Plan",
            value: activePlan,
          },
        ]}
      />

      <div className="studentNotesShelf studentNotesLevelShelf">
        <div className="studentNotesLevelHeader">
          <div>
            <span>{planLabel}</span>

            <h2>Choose a notes shelf</h2>

            <p>
              Open a notes shelf, enter chapters, and continue into
              student-visible PDF notes from the AspireNest learning flow.
            </p>
          </div>

          <div className="studentNotesLevelStatus">
            <strong>{subjects.length}</strong>
            <span>Notes shelves</span>
          </div>
        </div>

        {subjects.length === 0 ? (
          <StudentNotesEmptyState
            title="No notes yet"
            text="Published notes for this plan will appear here."
          />
        ) : (
          <div className="studentNotesLevelGrid">
            {subjects.map((subject) => (
              <StudentNotesLevelCard
                key={subject.id}
                icon={subject.cover || "📘"}
                pill={activePlan}
                title={getPublicNotesShelfTitle(subject)}
                text={getPublicNotesShelfText(subject)}
                firstStat={{
                  label: "PDFs",
                  value: subject.count,
                }}
                secondStat={{
                  label: "Chapters",
                  value: subject.chapterCount || 1,
                }}
                footerText="Open notes shelf"
                onOpen={() =>
                  navigate(
                    `/ctet-tet/notes/plan/${activePlan}/${encodeURIComponent(
                      subject.id
                    )}`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}