import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentNotesHero from "./StudentNotesHero";
import StudentNotesEmptyState from "./StudentNotesEmptyState";
import { StudentNotePdfCard } from "./StudentNoteCards";

import {
  buildNotesChapterList,
  buildNotesSubjectList,
  getChapterNotes,
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

function findNotesChapter(chapters = [], chapterId = "") {
  const activeChapter = normalizeNoteText(chapterId);

  return chapters.find(
    (chapter) =>
      normalizeNoteText(chapter.id) === activeChapter ||
      normalizeNoteText(chapter.title) === activeChapter
  );
}

export default function StudentNotesChapterRoute({
  universalContent = [],
  handleNoteAccess,
  hasPlanAccess,
  buildNoteAccessDecision,
}) {
  const navigate = useNavigate();
  const { plan, subjectId, chapterId } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const activeSubject = decodeURIComponent(subjectId || "");
  const activeChapter = decodeURIComponent(chapterId || "");

  const planNotes = getPlanNotes(universalContent, activePlan);
  const subjects = buildNotesSubjectList(planNotes);
  const subjectInfo = findNotesSubject(subjects, activeSubject);

  const subjectNotes = getSubjectNotes(planNotes, activeSubject);
  const chapters = buildNotesChapterList(subjectNotes);
  const chapterInfo = findNotesChapter(chapters, activeChapter);

  const chapterNotes = getChapterNotes(subjectNotes, activeChapter);
  const subjectTitle = subjectInfo?.title || "Subject Notes";
  const chapterTitle = chapterInfo?.title || "Chapter PDF Notes";

  return (
    <section className="studentNotesPage">
      <StudentNotesHero
        badge={`${activePlan} NOTES`}
        title={chapterTitle}
        text={`Open PDF notes from ${subjectTitle}.`}
        backLabel="Back to Chapters"
        onBack={() =>
          navigate(
            `/ctet-tet/notes/plan/${activePlan}/${encodeURIComponent(
              activeSubject
            )}`
          )
        }
        stats={[
          {
            label: "PDFs",
            value: getNotesPdfCount(chapterNotes),
          },
          {
            label: "Subject",
            value: subjectTitle,
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
            <span>{subjectTitle}</span>

            <h2>Available PDF notes</h2>

            <p>
              Open chapter PDFs from this subject. Only published notes from
              the selected plan, subject, and chapter appear here.
            </p>
          </div>

          <div className="studentNotesLevelStatus">
            <strong>{chapterNotes.length}</strong>
            <span>Ready PDFs</span>
          </div>
        </div>

        {chapterNotes.length === 0 ? (
          <StudentNotesEmptyState
            title="No PDFs found"
            text="Published PDFs for this chapter will appear here."
          />
        ) : (
          <div className="studentNotesPdfGrid">
            {chapterNotes.map((note) => {
              const accessDecision =
                typeof buildNoteAccessDecision ===
                "function"
                  ? buildNoteAccessDecision(note)
                  : null;

              return (
                <StudentNotePdfCard
                  key={note.id}
                  note={note}
                  handleNoteAccess={handleNoteAccess}
                  hasPlanAccess={hasPlanAccess}
                  accessDecision={accessDecision}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
