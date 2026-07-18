import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  NOTES_ACTIONS,
} from "../../../access/notesActionPolicy";
import StudentNotesHero from "./StudentNotesHero";
import StudentNotesEmptyState from "./StudentNotesEmptyState";
import { StudentNotePdfCard } from "./StudentNoteCards";

import {
  buildNotesChapterList,
  buildNotesSubjectList,
  getChapterNotes,
  getNoteTextbookId,
  getNotesNativeCount,
  getNotesPdfCount,
  getNotesResourceCount,
  getPlanNotes,
  getSubjectNotes,
  isNativeIntelliTextNote,
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
  const chapterTitle = chapterInfo?.title || "Chapter Notes";
  const nativeCount = getNotesNativeCount(chapterNotes);
  const pdfCount = getNotesPdfCount(chapterNotes);

  const openNativeNote = (note) => {
    const textbookId = getNoteTextbookId(note);

    if (!textbookId) {
      return;
    }

    navigate(
      `/ctet-tet/notes/read/${encodeURIComponent(
        textbookId
      )}`
    );
  };

  return (
    <section className="studentNotesPage">
      <StudentNotesHero
        badge={`${activePlan} NOTES`}
        title={chapterTitle}
        text={`Open premium study notes from ${subjectTitle}.`}
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
            label: "Notes",
            value: getNotesResourceCount(chapterNotes),
          },
          {
            label: "Native",
            value: nativeCount,
          },
          {
            label: "PDF",
            value: pdfCount,
          },
        ]}
      />

      <div className="studentNotesShelf studentNotesLevelShelf">
        <div className="studentNotesLevelHeader">
          <div>
            <span>{subjectTitle}</span>

            <h2>Available study notes</h2>

            <p>
              Native IntelliText and protected PDF notes share one chapter
              shelf. Access is verified before either delivery mode opens.
            </p>
          </div>

          <div className="studentNotesLevelStatus">
            <strong>{chapterNotes.length}</strong>
            <span>Ready learning resources</span>
          </div>
        </div>

        {chapterNotes.length === 0 ? (
          <StudentNotesEmptyState
            title="No notes found"
            text="Published study notes for this chapter will appear here."
          />
        ) : (
          <div className="studentNotesPdfGrid">
            {chapterNotes.map((note) => {
              const isNative =
                isNativeIntelliTextNote(note);
              const action = isNative
                ? NOTES_ACTIONS.READ
                : NOTES_ACTIONS.OPEN;
              const accessDecision =
                typeof buildNoteAccessDecision ===
                "function"
                  ? buildNoteAccessDecision(
                      note,
                      action
                    )
                  : null;

              return (
                <StudentNotePdfCard
                  key={note.id}
                  note={note}
                  handleNoteAccess={handleNoteAccess}
                  handleNativeNoteAccess={openNativeNote}
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
