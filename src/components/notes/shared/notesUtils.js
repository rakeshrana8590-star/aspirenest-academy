export const NOTES_PLAN_ORDER = [
    "FREE",
    "BASIC",
    "PREMIUM",
    "MENTORSHIP",
  ];
  
  export const NOTES_PLAN_LABELS = {
    FREE: "Free Notes",
    BASIC: "Basic Notes",
    PREMIUM: "Premium Notes",
    MENTORSHIP: "Mentorship Notes",
  };
  
  export const NOTES_PLAN_ICONS = {
    FREE: "📘",
    BASIC: "🔷",
    PREMIUM: "⭐",
    MENTORSHIP: "👩‍🏫",
  };
  
  export const NOTES_PLAN_DESCRIPTIONS = {
    FREE: "Start with free CTET/TET revision PDFs and foundation notes.",
    BASIC: "Continue with structured subject-wise and chapter-wise notes.",
    PREMIUM: "Unlock exam-ready premium notes, deep revision PDFs, and smart study material.",
    MENTORSHIP: "Access mentor-guided notes and focused material for guided preparation.",
  };
  
  export function normalizeNoteText(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  
  export function cleanNoteText(value = "", fallback = "") {
    const text = String(value || "").trim();
    return text || fallback;
  }
  
  export function createNoteSlug(value = "") {
    return normalizeNoteText(value);
  }
  
  export function getNotePlan(note = {}) {
    return String(
      note.planType ||
        note.accessPlan ||
        note.plan ||
        "FREE"
    )
      .trim()
      .toUpperCase();
  }
  
  export function getNoteStatus(note = {}) {
    return String(note.status || "")
      .trim()
      .toLowerCase();
  }
  
  export function isPublishedNote(note = {}) {
    return getNoteStatus(note) === "published";
  }
  
  export function isNotesContent(note = {}) {
    return String(note.section || "")
      .trim()
      .toLowerCase() === "notes";
  }
  
  export function getNotePdfUrl(note = {}) {
    return (
      note.pdfUrl ||
      note.fileUrl ||
      note.pdf ||
      note.sourceUrl ||
      ""
    );
  }
  
  export function hasNotePdf(note = {}) {
    return Boolean(String(getNotePdfUrl(note) || "").trim());
  }
  
  export function getNoteSubject(note = {}) {
    return cleanNoteText(
      note.subject || note.subjectName || note.subjectTitle,
      "General"
    );
  }
  
  export function getNoteChapter(note = {}) {
    return cleanNoteText(
      note.chapter ||
        note.chapterName ||
        note.topic ||
        note.topicName,
      "General"
    );
  }
  
  export function getPublishedNotes(contentItems = []) {
    return contentItems.filter(
      (item) =>
        isNotesContent(item) &&
        isPublishedNote(item) &&
        hasNotePdf(item)
    );
  }
  
  export function getPlanNotes(contentItems = [], planName = "FREE") {
    const activePlan = String(planName || "FREE").trim().toUpperCase();
  
    return getPublishedNotes(contentItems).filter(
      (note) => getNotePlan(note) === activePlan
    );
  }
  
  export function getSubjectNotes(notes = [], subjectId = "") {
    const activeSubject = normalizeNoteText(subjectId);
  
    return notes.filter((note) => {
      const subjectName = getNoteSubject(note);
  
      return (
        normalizeNoteText(subjectName) === activeSubject ||
        normalizeNoteText(note.subjectSlug) === activeSubject
      );
    });
  }
  
  export function getChapterNotes(notes = [], chapterId = "") {
    const activeChapter = normalizeNoteText(chapterId);
  
    return notes.filter((note) => {
      const chapterName = getNoteChapter(note);
  
      return (
        normalizeNoteText(chapterName) === activeChapter ||
        normalizeNoteText(note.chapterSlug) === activeChapter ||
        normalizeNoteText(note.topicSlug) === activeChapter
      );
    });
  }
  
  export function uniqueNotesByKey(items = [], getKey) {
    const seen = new Set();
  
    return items.filter((item) => {
      const key = normalizeNoteText(getKey(item));
  
      if (!key || seen.has(key)) {
        return false;
      }
  
      seen.add(key);
      return true;
    });
  }
  
  export function buildNotesSubjectList(notes = []) {
    return uniqueNotesByKey(notes, getNoteSubject)
      .map((note) => {
        const title = getNoteSubject(note);
  
        const subjectNotes = notes.filter(
          (item) =>
            normalizeNoteText(getNoteSubject(item)) === normalizeNoteText(title)
        );
  
        const chapterCount = uniqueNotesByKey(
          subjectNotes,
          getNoteChapter
        ).length;
  
        return {
          id: createNoteSlug(title),
          title,
          description:
            note.description ||
            `${chapterCount || 1} chapter shelves ready for revision.`,
          count: subjectNotes.length,
          chapterCount,
          cover: note.cover || "📘",
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }
  
  export function buildNotesChapterList(notes = []) {
    return uniqueNotesByKey(notes, getNoteChapter)
      .map((note) => {
        const title = getNoteChapter(note);
  
        const chapterNotes = notes.filter(
          (item) =>
            normalizeNoteText(getNoteChapter(item)) === normalizeNoteText(title)
        );
  
        return {
          id: createNoteSlug(title),
          title,
          description:
            note.description ||
            `${chapterNotes.length} PDF notes ready inside this chapter.`,
          count: chapterNotes.length,
          cover: note.cover || "📄",
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }
  
  export function getNotesPdfCount(notes = []) {
    return notes.filter((note) => hasNotePdf(note)).length;
  }
  
  export function canAccessNotePlan({ planName = "FREE", hasPlanAccess } = {}) {
    const activePlan = String(planName || "FREE").trim().toUpperCase();
  
    if (activePlan === "FREE") {
      return true;
    }
  
    if (typeof hasPlanAccess !== "function") {
      return false;
    }
  
    return Boolean(hasPlanAccess(activePlan));
  }