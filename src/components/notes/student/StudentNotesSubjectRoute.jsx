import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentNotesHero from "./StudentNotesHero";
import StudentNotesEmptyState from "./StudentNotesEmptyState";
import { StudentNotesLevelCard } from "./StudentNoteCards";

import {
  buildNotesChapterList,
  buildNotesSubjectList,
  getNotesPdfCount,
  getPlanNotes,
  getSubjectNotes,
  normalizeNoteText,
} from "../shared/notesUtils";

function findNotesSubject(subjects = [], subjectId = "") {
  const activeSubject = normalizeNoteText(subjectId);

  return subjects.find(
    (subject) =>
      normalizeNoteText(subject.id) === activeSubject ||
      normalizeNoteText(subject.title) === activeSubject
  );
}

export default function StudentNotesSubjectRoute({
  universalContent = [],
}) {
  const navigate = useNavigate();
  const { plan, subjectId } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const activeSubject = decodeURIComponent(subjectId || "");

  const planNotes = getPlanNotes(universalContent, activePlan);
  const subjects = buildNotesSubjectList(planNotes);
  const subjectInfo = findNotesSubject(subjects, activeSubject);

  const subjectNotes = getSubjectNotes(planNotes, activeSubject);
  const chapters = buildNotesChapterList(subjectNotes);

  return (
    <section className="studentNotesPage">
      <StudentNotesHero
        badge={`${activePlan} NOTES`}
        title={subjectInfo?.title || "Subject Library"}
        text="Open a chapter shelf and continue into PDF notes with connected revision flow."
        backLabel="Back to Plan"
        onBack={() => navigate(`/ctet-tet/notes/plan/${activePlan}`)}
        stats={[
          {
            label: "Chapters",
            value: chapters.length,
          },
          {
            label: "PDFs",
            value: getNotesPdfCount(subjectNotes),
          },
          {
            label: "Access",
            value: activePlan,
          },
        ]}
      />

      <div className="studentNotesShelf studentNotesLevelShelf">
        <div className="studentNotesLevelHeader">
          <div>
            <span>{subjectInfo?.title || activePlan}</span>

            <h2>Chapter-wise notes library</h2>

            <p>
              Every chapter stays connected with plan access, subject node, and
              student-visible PDF material.
            </p>
          </div>

          <div className="studentNotesLevelStatus">
            <strong>{chapters.length}</strong>
            <span>Chapter shelves</span>
          </div>
        </div>

        {chapters.length === 0 ? (
          <StudentNotesEmptyState
            title="No chapters found"
            text="Published chapter notes for this subject will appear here."
          />
        ) : (
          <div className="studentNotesLevelGrid">
            {chapters.map((chapter) => (
              <StudentNotesLevelCard
                key={chapter.id}
                icon={chapter.cover || "📄"}
                pill={activePlan}
                title={chapter.title}
                text={chapter.description}
                firstStat={{
                  label: "PDFs",
                  value: chapter.count,
                }}
                secondStat={{
                  label: "Plan",
                  value: activePlan,
                }}
                footerText="Open chapter shelf"
                onOpen={() =>
                  navigate(
                    `/ctet-tet/notes/plan/${activePlan}/${encodeURIComponent(
                      activeSubject
                    )}/${encodeURIComponent(chapter.id)}`
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