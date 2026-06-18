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

export function useVideoLibrary(universalContent = []) {
  return useMemo(() => {
    const allVideos = universalContent.filter(isVideoContentItem);

    const publishedVideos = allVideos.filter(isPublishedVideoItem);

    const recordedVideos = publishedVideos.filter(isRecordedClass);

    const liveClasses = publishedVideos.filter(isLiveClass);

    const notes = universalContent.filter(
      (item) =>
        item.section === "notes" &&
        normalizeVideoStatus(item.status) === "published"
    );

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
            const name = item.subject.trim();

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
          const chapterName = item.chapter.trim();

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
          createSlug(item.chapter) === activeChapterSlug ||
          normalizeText(item.chapter) === normalizeText(chapterId);

        return matchesPlan && matchesSubject && matchesChapter;
      });

      return {
        all: items,
        liveClasses: items.filter(isLiveClass),
        recordedLessons: items.filter(isRecordedClass),
      };
    };

    const getVideoById = (videoId = "") => {
      return allVideos.find((item) => item.id === videoId) || null;
    };

    const getRelatedNotes = (video = {}) => {
      if (!video) return [];

      return notes.filter((note) => {
        const sameSubject =
          normalizeText(note.subject) === normalizeText(video.subject);

        const sameChapter =
          normalizeText(note.chapter) === normalizeText(video.chapter);

        return sameSubject || sameChapter;
      });
    };

    const getRelatedVideos = (video = {}) => {
      if (!video) return [];

      return publishedVideos.filter((item) => {
        if (item.id === video.id) return false;

        const sameSubject =
          normalizeText(item.subject) === normalizeText(video.subject);

        const sameChapter =
          normalizeText(item.chapter) === normalizeText(video.chapter);

        return sameSubject || sameChapter;
      });
    };

    return {
      allVideos,
      publishedVideos,
      recordedVideos,
      liveClasses,
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
    };
  }, [universalContent]);
}

export default useVideoLibrary;