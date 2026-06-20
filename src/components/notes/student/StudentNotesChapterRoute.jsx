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

  return (
    <section className="studentNotesPage">
      <StudentNotesHero
        badge={`${activePlan} NOTES CHAPTER`}
        title={chapterInfo?.title || "Chapter PDFs"}
        text="Open student-visible PDF notes from the correct subject and chapter node."
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
            value: subjectInfo?.title || activePlan,
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

            <h2>Available PDF notes</h2>

            <p>
              Open chapter PDFs from one connected notes system. Access remains
              plan-aware and linked with the student learning flow.
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
            {chapterNotes.map((note) => (
              <StudentNotePdfCard
                key={note.id}
                note={note}
                handleNoteAccess={handleNoteAccess}
                hasPlanAccess={hasPlanAccess}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}