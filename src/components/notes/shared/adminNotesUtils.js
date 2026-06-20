import {
    NOTES_PLAN_LABELS,
    NOTES_PLAN_ORDER,
    createNoteSlug,
    getNoteChapter,
    getNotePdfUrl,
    getNotePlan,
    getNoteSubject,
    getNoteStatus,
    hasNotePdf,
    isNotesContent,
    isPublishedNote,
    normalizeNoteText,
  } from "./notesUtils";
  
  export function getAdminNotes(contentItems = []) {
    return contentItems.filter((item) => isNotesContent(item));
  }
  
  export function getAdminPlanLabel(planName = "FREE") {
    const activePlan = String(planName || "FREE").trim().toUpperCase();
  
    return NOTES_PLAN_LABELS[activePlan] || `${activePlan} Notes`;
  }
  
  export function getAdminNotesByPlan(contentItems = [], planName = "FREE") {
    const activePlan = String(planName || "FREE").trim().toUpperCase();
  
    return getAdminNotes(contentItems).filter(
      (note) => getNotePlan(note) === activePlan
    );
  }
  
  export function getStudentVisibleAdminNotes(contentItems = []) {
    return getAdminNotes(contentItems).filter(
      (note) => isPublishedNote(note) && hasNotePdf(note)
    );
  }
  
  export function getAdminNotesStatusCounts(notes = []) {
    return notes.reduce(
      (counts, note) => {
        const status = getNoteStatus(note) || "draft";
  
        if (status === "published") {
          counts.published += 1;
        } else if (status === "archived") {
          counts.archived += 1;
        } else if (status === "unpublished") {
          counts.unpublished += 1;
        } else {
          counts.draft += 1;
        }
  
        if (hasNotePdf(note)) {
          counts.pdfReady += 1;
        } else {
          counts.pdfMissing += 1;
        }
  
        return counts;
      },
      {
        published: 0,
        draft: 0,
        unpublished: 0,
        archived: 0,
        pdfReady: 0,
        pdfMissing: 0,
      }
    );
  }
  
  export function getAdminNotesPlanSummary(contentItems = []) {
    return NOTES_PLAN_ORDER.map((planName) => {
      const notes = getAdminNotesByPlan(contentItems, planName);
      const studentVisibleNotes = notes.filter(
        (note) => isPublishedNote(note) && hasNotePdf(note)
      );
  
      const subjects = getUniqueAdminNoteSubjects(notes);
      const chapters = getUniqueAdminNoteChapters(notes);
  
      return {
        id: planName,
        planName,
        label: getAdminPlanLabel(planName),
        notes,
        totalNotes: notes.length,
        publishedPdfs: studentVisibleNotes.length,
        subjects: subjects.length,
        chapters: chapters.length,
        statusCounts: getAdminNotesStatusCounts(notes),
      };
    });
  }
  
  export function getUniqueAdminNoteSubjects(notes = []) {
    const seen = new Map();
  
    notes.forEach((note) => {
      const title = getNoteSubject(note);
      const key = normalizeNoteText(title);
  
      if (!key || seen.has(key)) {
        return;
      }
  
      seen.set(key, {
        id: createNoteSlug(title),
        title,
        count: notes.filter(
          (item) =>
            normalizeNoteText(getNoteSubject(item)) === key
        ).length,
      });
    });
  
    return Array.from(seen.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }
  
  export function getUniqueAdminNoteChapters(notes = []) {
    const seen = new Map();
  
    notes.forEach((note) => {
      const title = getNoteChapter(note);
      const key = normalizeNoteText(title);
  
      if (!key || seen.has(key)) {
        return;
      }
  
      seen.set(key, {
        id: createNoteSlug(title),
        title,
        count: notes.filter(
          (item) =>
            normalizeNoteText(getNoteChapter(item)) === key
        ).length,
      });
    });
  
    return Array.from(seen.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }
  
  export function getAdminNotesBySubject(notes = [], subjectName = "") {
    const activeSubject = normalizeNoteText(subjectName);
  
    return notes.filter(
      (note) =>
        normalizeNoteText(getNoteSubject(note)) === activeSubject ||
        normalizeNoteText(note.subjectSlug) === activeSubject
    );
  }
  
  export function getAdminNotesByChapter(notes = [], chapterName = "") {
    const activeChapter = normalizeNoteText(chapterName);
  
    return notes.filter(
      (note) =>
        normalizeNoteText(getNoteChapter(note)) === activeChapter ||
        normalizeNoteText(note.chapterSlug) === activeChapter ||
        normalizeNoteText(note.topicSlug) === activeChapter
    );
  }
  
  export function getAdminNoteHealth(note = {}) {
    const issues = [];
  
    if (!String(note.title || "").trim()) {
      issues.push("Missing title");
    }
  
    if (!getNoteSubject(note)) {
      issues.push("Missing subject");
    }
  
    if (!getNoteChapter(note)) {
      issues.push("Missing chapter");
    }
  
    if (!hasNotePdf(note)) {
      issues.push("Missing PDF URL");
    }
  
    if (!getNoteStatus(note)) {
      issues.push("Missing status");
    }
  
    return {
      issues,
      isReadyForStudent:
        isPublishedNote(note) && hasNotePdf(note) && issues.length === 0,
      pdfUrl: getNotePdfUrl(note),
    };
  }
  
  export function getAdminNotesHealthSummary(notes = []) {
    return notes.reduce(
      (summary, note) => {
        const health = getAdminNoteHealth(note);
  
        if (health.isReadyForStudent) {
          summary.ready += 1;
        } else {
          summary.needsFix += 1;
        }
  
        if (!health.pdfUrl) {
          summary.missingPdf += 1;
        }
  
        return summary;
      },
      {
        ready: 0,
        needsFix: 0,
        missingPdf: 0,
      }
    );
  }