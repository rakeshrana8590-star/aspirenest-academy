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
} from "../shared/notesUtils";

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
        text="Choose a subject shelf and continue into chapter-wise revision PDFs."
        backLabel="Back to Notes"
        onBack={() => navigate("/ctet-tet/notes")}
        stats={[
          {
            label: "Subjects",
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

            <h2>Choose a subject shelf</h2>

            <p>
              Open a subject, enter chapters, and continue into
              student-visible PDF notes from the AspireNest learning flow.
            </p>
          </div>

          <div className="studentNotesLevelStatus">
            <strong>{subjects.length}</strong>
            <span>Subjects</span>
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
                title={subject.title}
                text={subject.description}
                firstStat={{
                  label: "PDFs",
                  value: subject.count,
                }}
                secondStat={{
                  label: "Chapters",
                  value: subject.chapterCount || 1,
                }}
                footerText="Open subject shelf"
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