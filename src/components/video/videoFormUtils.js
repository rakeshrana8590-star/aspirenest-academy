import {
  LIVE_CLASS_STATUS,
  LIVE_PLATFORMS,
  VIDEO_CLASS_MODES,
  VIDEO_CONTENT_TYPE,
  VIDEO_SECTION,
  VIDEO_SOURCE_TYPES,
  VIDEO_STATUS,
} from "./videoConstants.js";

import {
  createVideoSlug,
  isVideoContentItem,
  normalizeClassMode,
  normalizePlanType,
  normalizeVideoStatus,
  normalizeVideoText,
} from "./videoUtils.js";

export const VIDEO_FORM_DEFAULTS = {
  classMode: VIDEO_CLASS_MODES.RECORDED,

  title: "",
  planType: "FREE",
  subject: "",
  chapter: "",
  customSubject: "",
  customChapter: "",

  videoUrl: "",
  fileUrl: "",
  thumbnailUrl: "",
  duration: "",
  mentorName: "",

  liveStartDate: "",
  liveStartTime: "",
  liveEndDate: "",
  liveEndTime: "",
  livePlatform: LIVE_PLATFORMS.YOUTUBE_LIVE,
  liveStatus: "SCHEDULED",
  joinUrl: "",
  replayUrl: "",
  liveInstructions: "",

  status: VIDEO_STATUS.PUBLISHED,
  sourceType: VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,
};

export const createDefaultVideoForm = () => ({
  ...VIDEO_FORM_DEFAULTS,
});

export const buildVideoFormFromItem = (item = {}) => {
  const classMode = normalizeClassMode(item.classMode || item.mode);

  return {
    ...createDefaultVideoForm(),

    classMode,

    title: item.title || "",
    planType: normalizePlanType(item.planType || "FREE"),
    subject: item.subject || "",
    chapter: item.chapter || "",
    customSubject: "",
    customChapter: "",

    videoUrl: item.videoUrl || item.fileUrl || "",
    fileUrl: item.fileUrl || item.videoUrl || "",
    thumbnailUrl: item.thumbnailUrl || "",
    duration: item.duration || "",
    mentorName: item.mentorName || "",

    liveStartDate: item.liveStartDate || "",
    liveStartTime: item.liveStartTime || "",
    liveEndDate: item.liveEndDate || "",
    liveEndTime: item.liveEndTime || "",
    livePlatform:
      item.livePlatform ||
      (classMode === VIDEO_CLASS_MODES.LIVE
        ? item.sourceType
        : LIVE_PLATFORMS.YOUTUBE_LIVE) ||
      LIVE_PLATFORMS.YOUTUBE_LIVE,
    liveStatus:
      item.liveStatus ||
      (item.isCancelled ? LIVE_CLASS_STATUS.CANCELLED : "SCHEDULED"),
    joinUrl: item.joinUrl || "",
    replayUrl: item.replayUrl || "",
    liveInstructions: item.liveInstructions || "",

    status: normalizeVideoStatus(item.status || VIDEO_STATUS.PUBLISHED),
    sourceType: item.sourceType || VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,
  };
};

export const createSlugFromVideoText = (value = "") => createVideoSlug(value);

export const getFinalVideoSubject = (videoForm = {}) =>
  (videoForm.subject === "CUSTOM"
    ? videoForm.customSubject
    : videoForm.subject || ""
  ).trim();

export const getFinalVideoChapter = (videoForm = {}) =>
  (videoForm.chapter === "CUSTOM"
    ? videoForm.customChapter
    : videoForm.chapter || ""
  ).trim();

export const isRecordedVideoForm = (videoForm = {}) =>
  normalizeClassMode(videoForm.classMode) === VIDEO_CLASS_MODES.RECORDED;

export const isLiveVideoForm = (videoForm = {}) =>
  normalizeClassMode(videoForm.classMode) === VIDEO_CLASS_MODES.LIVE;

export const getVideoOptionLabel = (item) => {
  if (!item) return "";

  if (typeof item === "string") return item;

  return (
    item.name ||
    item.title ||
    item.subject ||
    item.chapter ||
    item.label ||
    ""
  );
};

export const getUniqueVideoLabels = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    const label = getVideoOptionLabel(item).trim();

    if (!label) return;

    const key = normalizeVideoText(label);

    if (!map.has(key)) {
      map.set(key, label);
    }
  });

  return [...map.values()];
};

export const validateVideoClassForm = (videoForm = {}) => {
  const classMode = normalizeClassMode(videoForm.classMode);

  if (!videoForm.title?.trim()) {
    return "Class title required.";
  }

  if (!videoForm.planType?.trim()) {
    return "Plan type required.";
  }

  if (!videoForm.subject?.trim()) {
    return "Subject required.";
  }

  if (!videoForm.chapter?.trim()) {
    return "Chapter required.";
  }

  if (
    classMode === VIDEO_CLASS_MODES.RECORDED &&
    !videoForm.videoUrl?.trim()
  ) {
    return "Recorded lesson video URL required.";
  }

  if (classMode === VIDEO_CLASS_MODES.LIVE) {
    if (!videoForm.liveStartDate?.trim()) {
      return "Live class start date required.";
    }

    if (!videoForm.liveStartTime?.trim()) {
      return "Live class start time required.";
    }

    if (!videoForm.joinUrl?.trim()) {
      return "Live class join URL required.";
    }

    if (videoForm.liveEndDate && !videoForm.liveEndTime) {
      return "Live class end time required when end date is added.";
    }

    if (videoForm.liveEndTime && !videoForm.liveEndDate) {
      return "Live class end date required when end time is added.";
    }

    if (
      videoForm.liveEndDate &&
      videoForm.liveEndTime &&
      new Date(`${videoForm.liveEndDate}T${videoForm.liveEndTime}`) <
        new Date(`${videoForm.liveStartDate}T${videoForm.liveStartTime}`)
    ) {
      return "Live class end time cannot be before start time.";
    }
  }

  return "";
};

export const findDuplicateVideoClass = ({
  universalContent = [],
  videoForm = {},
  editId = "",
} = {}) => {
  const classMode = normalizeClassMode(videoForm.classMode);

  return universalContent.find((item) => {
    if (editId && item.id === editId) return false;

    if (!isVideoContentItem(item)) return false;

    const itemMode = normalizeClassMode(item.classMode || item.mode);

    const sameCore =
      normalizeVideoText(item.title) === normalizeVideoText(videoForm.title) &&
      normalizePlanType(item.planType) === normalizePlanType(videoForm.planType) &&
      normalizeVideoText(item.subject) ===
        normalizeVideoText(videoForm.subject) &&
      normalizeVideoText(item.chapter) ===
        normalizeVideoText(videoForm.chapter) &&
      itemMode === classMode;

    if (!sameCore) return false;

    if (classMode === VIDEO_CLASS_MODES.LIVE) {
      return (
        item.liveStartDate === videoForm.liveStartDate &&
        item.liveStartTime === videoForm.liveStartTime
      );
    }

    return true;
  });
};

export const buildVideoSavePayload = (videoForm = {}) => {
  const now = new Date();
  const classMode = normalizeClassMode(videoForm.classMode);
  const isLive = classMode === VIDEO_CLASS_MODES.LIVE;
  const recordedUrl = videoForm.videoUrl?.trim() || "";
  const replayUrl = videoForm.replayUrl?.trim() || "";
  const liveStatus = videoForm.liveStatus || "SCHEDULED";
  const isCancelled = liveStatus === LIVE_CLASS_STATUS.CANCELLED;

  return {
    section: VIDEO_SECTION,
    contentType: VIDEO_CONTENT_TYPE,
    classMode,

    title: videoForm.title.trim(),
    planType: normalizePlanType(videoForm.planType),
    subject: videoForm.subject.trim(),
    chapter: videoForm.chapter.trim(),
    thumbnailUrl: videoForm.thumbnailUrl?.trim() || "",
    duration: videoForm.duration?.trim() || "",
    mentorName: videoForm.mentorName?.trim() || "",
    status: normalizeVideoStatus(videoForm.status),
    updatedAt: now,

    sourceType: isLive
      ? videoForm.livePlatform || LIVE_PLATFORMS.YOUTUBE_LIVE
      : videoForm.sourceType || VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,

    videoUrl: isLive ? replayUrl : recordedUrl,
    fileUrl: isLive ? replayUrl : recordedUrl,

    liveStartDate: isLive ? videoForm.liveStartDate || "" : "",
    liveStartTime: isLive ? videoForm.liveStartTime || "" : "",
    liveEndDate: isLive ? videoForm.liveEndDate || "" : "",
    liveEndTime: isLive ? videoForm.liveEndTime || "" : "",
    livePlatform: isLive
      ? videoForm.livePlatform || LIVE_PLATFORMS.YOUTUBE_LIVE
      : "",
    liveStatus: isLive ? liveStatus : "",
    isCancelled: isLive ? isCancelled : false,
    joinUrl: isLive ? videoForm.joinUrl?.trim() || "" : "",
    replayUrl: isLive ? replayUrl : "",
    liveInstructions: isLive ? videoForm.liveInstructions?.trim() || "" : "",
  };
};

export { normalizeVideoText };