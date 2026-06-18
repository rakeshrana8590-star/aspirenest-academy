import { useMemo } from "react";

import {
  createVideoSlug,
  isLiveClass,
  isPublishedVideoItem,
  isRecordedClass,
  isVideoContentItem,
  normalizePlanType,
  normalizeVideoStatus,
  normalizeVideoText,
} from "./videoUtils.js";

const uniqueByKey = (items = [], getKey) => {
  const map = new Map();

  items.forEach((item) => {
    const key = getKey(item);

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return [...map.values()];
};

const isPublishedContent = (item = {}) =>
  normalizeVideoStatus(item.status || "published") === "published";

const getItemSubjectKey = (item = {}) => normalizeVideoText(item.subject || "");

const getItemChapterKey = (item = {}) => normalizeVideoText(item.chapter || "");

const getItemChapterSlug = (item = {}) => createVideoSlug(item.chapter || "");

const isNotesContentItem = (item = {}) => {
  if (isVideoContentItem(item)) return false;

  const section = normalizeVideoText(item.section || "");
  const contentType = String(item.contentType || "").trim().toLowerCase();
  const sourceType = String(item.sourceType || "").trim().toLowerCase();
  const type = String(item.type || "").trim().toLowerCase();

  return (
    section === "notes" ||
    section.includes("notes") ||
    type === "note" ||
    type === "notes" ||
    contentType === "pdf" ||
    contentType === "document" ||
    contentType.includes("pdf") ||
    sourceType === "pdf"
  );
};

const isSameSubject = (first = {}, second = {}) => {
  const firstSubject = getItemSubjectKey(first);
  const secondSubject = getItemSubjectKey(second);

  return Boolean(firstSubject && secondSubject && firstSubject === secondSubject);
};

const isSameChapter = (first = {}, second = {}) => {
  const firstChapter = getItemChapterKey(first);
  const secondChapter = getItemChapterKey(second);

  return Boolean(firstChapter && secondChapter && firstChapter === secondChapter);
};

const isSameLearningNode = (first = {}, second = {}) => {
  const sameSubject = isSameSubject(first, second);
  const sameChapter = isSameChapter(first, second);

  if (getItemSubjectKey(first) && getItemChapterKey(first)) {
    return sameSubject && sameChapter;
  }

  if (getItemSubjectKey(first)) {
    return sameSubject;
  }

  if (getItemChapterKey(first)) {
    return sameChapter;
  }

  return false;
};

export function useVideoLibrary(universalContent = []) {
  return useMemo(() => {
    const allVideos = universalContent.filter(isVideoContentItem);

    const publishedVideos = allVideos.filter(isPublishedVideoItem);

    const recordedVideos = publishedVideos.filter(isRecordedClass);

    const liveClasses = publishedVideos.filter(isLiveClass);

    const notes = universalContent
      .filter(isNotesContentItem)
      .filter(isPublishedContent);

    const getClassMode = (item = {}) =>
      isLiveClass(item) ? "LIVE" : "RECORDED";

    const normalizeText = (value = "") => normalizeVideoText(value);

    const createSlug = (value = "") => createVideoSlug(value);

    const normalizePlan = (value = "FREE") => normalizePlanType(value);

    const normalizeStatus = (value = "published") =>
      normalizeVideoStatus(value);

    const isPublished = (item = {}) => isPublishedVideoItem(item);

    const getPlans = () => {
      return ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((plan) => {
        const planItems = publishedVideos.filter(
          (item) => normalizePlan(item.planType) === plan
        );

        return {
          id: plan,
          title: plan,
          count: planItems.length,
          recordedCount: planItems.filter(isRecordedClass).length,
          liveCount: planItems.filter(isLiveClass).length,
        };
      });
    };

    const getSubjects = (plan = "") => {
      const activePlan = plan ? normalizePlan(plan) : "";

      const sourceItems = publishedVideos.filter((item) => {
        if (!activePlan) return true;

        return normalizePlan(item.planType) === activePlan;
      });

      return uniqueByKey(
        sourceItems
          .filter((item) => item.subject)
          .map((item) => {
            const name = String(item.subject || "").trim();

            const subjectItems = sourceItems.filter(
              (video) => normalizeText(video.subject) === normalizeText(name)
            );

            return {
              id: createSlug(name),
              name,
              title: name,
              slug: createSlug(name),
              count: subjectItems.length,
              liveCount: subjectItems.filter(isLiveClass).length,
              recordedCount: subjectItems.filter(isRecordedClass).length,
            };
          }),
        (subject) => subject.slug
      );
    };

    const getSubjectNameFromRoute = (subjectId = "") => {
      const activeSlug = createSlug(decodeURIComponent(subjectId || ""));

      const subject = getSubjects().find(
        (item) =>
          item.slug === activeSlug ||
          normalizeText(item.name) === normalizeText(subjectId)
      );

      return subject?.name || decodeURIComponent(subjectId || "");
    };

    const getChapters = ({ plan = "", subjectId = "" } = {}) => {
      const activePlan = plan ? normalizePlan(plan) : "";
      const activeSubjectName = getSubjectNameFromRoute(subjectId);

      const sourceItems = publishedVideos.filter((item) => {
        const matchesPlan =
          !activePlan || normalizePlan(item.planType) === activePlan;

        const matchesSubject =
          !activeSubjectName ||
          normalizeText(item.subject) === normalizeText(activeSubjectName) ||
          createSlug(item.subject) === createSlug(subjectId);

        return matchesPlan && matchesSubject && item.chapter;
      });

      return uniqueByKey(
        sourceItems.map((item) => {
          const chapterName = String(item.chapter || "").trim();

          const chapterItems = sourceItems.filter(
            (video) =>
              normalizeText(video.chapter) === normalizeText(chapterName)
          );

          return {
            id: createSlug(chapterName),
            name: chapterName,
            title: chapterName,
            slug: createSlug(chapterName),
            count: chapterItems.length,
            liveCount: chapterItems.filter(isLiveClass).length,
            recordedCount: chapterItems.filter(isRecordedClass).length,
          };
        }),
        (chapter) => chapter.slug
      );
    };

    const getChapterItems = ({
      plan = "",
      subjectId = "",
      chapterId = "",
    } = {}) => {
      const activePlan = plan ? normalizePlan(plan) : "";
      const activeSubjectName = getSubjectNameFromRoute(subjectId);
      const activeChapterSlug = createSlug(decodeURIComponent(chapterId || ""));

      const items = publishedVideos.filter((item) => {
        const matchesPlan =
          !activePlan || normalizePlan(item.planType) === activePlan;

        const matchesSubject =
          !activeSubjectName ||
          normalizeText(item.subject) === normalizeText(activeSubjectName) ||
          createSlug(item.subject) === createSlug(subjectId);

        const matchesChapter =
          !activeChapterSlug ||
          getItemChapterSlug(item) === activeChapterSlug ||
          normalizeText(item.chapter) === normalizeText(chapterId);

        return matchesPlan && matchesSubject && matchesChapter;
      });

      const chapterNotes = notes.filter((note) => {
        const matchesSubject =
          !activeSubjectName ||
          normalizeText(note.subject) === normalizeText(activeSubjectName) ||
          createSlug(note.subject) === createSlug(subjectId);

        const matchesChapter =
          !activeChapterSlug ||
          getItemChapterSlug(note) === activeChapterSlug ||
          normalizeText(note.chapter) === normalizeText(chapterId);

        return matchesSubject && matchesChapter;
      });

      return {
        all: items,
        liveClasses: items.filter(isLiveClass),
        recordedLessons: items.filter(isRecordedClass),
        notes: chapterNotes,
      };
    };

    const getVideoById = (videoId = "") => {
      const activeId = decodeURIComponent(videoId || "");

      return (
        allVideos.find(
          (item) =>
            item.id === activeId ||
            item.videoId === activeId ||
            item.classId === activeId
        ) || null
      );
    };

    const getRelatedNotes = (video = {}) => {
      if (!video) return [];

      return notes
        .filter((note) => isSameLearningNode(video, note))
        .slice(0, 6);
    };

    const getRelatedVideos = (video = {}) => {
      if (!video) return [];

      return publishedVideos
        .filter((item) => item.id !== video.id)
        .filter((item) => isSameLearningNode(video, item))
        .slice(0, 8);
    };

    return {
      allVideos,
      publishedVideos,
      recordedVideos,
      liveClasses,
      notes,
      getClassMode,
      getPlans,
      getSubjects,
      getSubjectNameFromRoute,
      getChapters,
      getChapterItems,
      getVideoById,
      getRelatedNotes,
      getRelatedVideos,
      normalizeText,
      createSlug,
      normalizePlan,
      normalizeStatus,
      isPublished,
      isNotesContentItem,
      isSameSubject,
      isSameChapter,
      isSameLearningNode,
    };
  }, [universalContent]);
}

export default useVideoLibrary;