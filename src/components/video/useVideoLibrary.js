import { useMemo } from "react";

const normalizeText = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");

const createSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizePlan = (value = "FREE") =>
  value?.toString().trim().toUpperCase() || "FREE";

const normalizeStatus = (value = "published") =>
  value?.toString().trim().toLowerCase() || "published";

const getClassMode = (item = {}) =>
  (item.classMode || item.mode || "RECORDED")
    .toString()
    .trim()
    .toUpperCase();

const isVideoContent = (item = {}) => {
  return (
    item.section === "recordedVideo" ||
    item.section === "video" ||
    item.contentType === "VIDEO"
  );
};

const isPublished = (item = {}) =>
  normalizeStatus(item.status) === "published";

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
    const allVideos = universalContent.filter(isVideoContent);

    const publishedVideos = allVideos.filter(isPublished);

    const recordedVideos = publishedVideos.filter(
      (item) => getClassMode(item) === "RECORDED"
    );

    const liveClasses = publishedVideos.filter(
      (item) => getClassMode(item) === "LIVE"
    );

    const notes = universalContent.filter(
      (item) =>
        item.section === "notes" &&
        normalizeStatus(item.status) === "published"
    );

    const getPlans = () => {
      return ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"].map((plan) => {
        const planItems = publishedVideos.filter(
          (item) => normalizePlan(item.planType) === plan
        );

        return {
          id: plan,
          title: plan,
          count: planItems.length,
          recordedCount: planItems.filter(
            (item) => getClassMode(item) === "RECORDED"
          ).length,
          liveCount: planItems.filter(
            (item) => getClassMode(item) === "LIVE"
          ).length,
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
              (video) =>
                normalizeText(video.subject) === normalizeText(name)
            );

            return {
              id: createSlug(name),
              name,
              title: name,
              slug: createSlug(name),
              count: subjectItems.length,
              liveCount: subjectItems.filter(
                (video) => getClassMode(video) === "LIVE"
              ).length,
              recordedCount: subjectItems.filter(
                (video) => getClassMode(video) === "RECORDED"
              ).length,
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
            liveCount: chapterItems.filter(
              (video) => getClassMode(video) === "LIVE"
            ).length,
            recordedCount: chapterItems.filter(
              (video) => getClassMode(video) === "RECORDED"
            ).length,
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
      const activeChapterSlug = createSlug(
        decodeURIComponent(chapterId || "")
      );

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
        liveClasses: items.filter(
          (item) => getClassMode(item) === "LIVE"
        ),
        recordedLessons: items.filter(
          (item) => getClassMode(item) === "RECORDED"
        ),
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