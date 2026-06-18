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

const AUTO_LIVE_STATUS = "SCHEDULED";

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
  liveStatus: AUTO_LIVE_STATUS,
  joinUrl: "",
  replayUrl: "",
  liveInstructions: "",

  status: VIDEO_STATUS.PUBLISHED,
  sourceType: VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,
};

export const createDefaultVideoForm = () => ({
  ...VIDEO_FORM_DEFAULTS,
});

const cleanText = (value = "") => String(value || "").trim();

const getLiveStatusValue = (value = AUTO_LIVE_STATUS) =>
  String(value || AUTO_LIVE_STATUS).trim().toUpperCase();

const isCancelledLiveStatus = (value = "") =>
  getLiveStatusValue(value) === LIVE_CLASS_STATUS.CANCELLED;

const hasDateTimePair = (dateValue = "", timeValue = "") =>
  Boolean(cleanText(dateValue) && cleanText(timeValue));

const getDateTimeValue = (dateValue = "", timeValue = "") => {
  if (!hasDateTimePair(dateValue, timeValue)) return null;

  const date = new Date(`${dateValue}T${timeValue}`);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const buildVideoFormFromItem = (item = {}) => {
  const classMode = normalizeClassMode(item.classMode || item.mode);
  const isCancelled = item.isCancelled === true || item.cancelled === true;

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
    liveStatus: isCancelled
      ? LIVE_CLASS_STATUS.CANCELLED
      : item.liveStatus || item.liveClassStatus || AUTO_LIVE_STATUS,
    joinUrl: item.joinUrl || item.liveUrl || item.meetingUrl || "",
    replayUrl: item.replayUrl || item.recordingUrl || "",
    liveInstructions: item.liveInstructions || "",

    status: normalizeVideoStatus(item.status || VIDEO_STATUS.PUBLISHED),
    sourceType: item.sourceType || VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,
  };
};

export const createSlugFromVideoText = (value = "") => createVideoSlug(value);

export const getFinalVideoSubject = (videoForm = {}) =>
  cleanText(
    videoForm.subject === "CUSTOM"
      ? videoForm.customSubject
      : videoForm.subject || ""
  );

export const getFinalVideoChapter = (videoForm = {}) =>
  cleanText(
    videoForm.chapter === "CUSTOM"
      ? videoForm.customChapter
      : videoForm.chapter || ""
  );

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
  const finalSubject = getFinalVideoSubject(videoForm);
  const finalChapter = getFinalVideoChapter(videoForm);

  if (!cleanText(videoForm.title)) {
    return "Class title required.";
  }

  if (!cleanText(videoForm.planType)) {
    return "Plan type required.";
  }

  if (!finalSubject) {
    return "Subject required.";
  }

  if (!finalChapter) {
    return "Chapter required.";
  }

  if (
    classMode === VIDEO_CLASS_MODES.RECORDED &&
    !cleanText(videoForm.videoUrl)
  ) {
    return "Recorded lesson video URL required.";
  }

  if (classMode === VIDEO_CLASS_MODES.LIVE) {
    const liveStatus = getLiveStatusValue(videoForm.liveStatus);
    const isCancelled = isCancelledLiveStatus(liveStatus);
    const hasJoinUrl = Boolean(cleanText(videoForm.joinUrl));
    const hasReplayUrl = Boolean(cleanText(videoForm.replayUrl));

    if (!isCancelled && !hasJoinUrl && !hasReplayUrl) {
      return "Live class join URL or replay URL required.";
    }

    if (!isCancelled && !hasReplayUrl) {
      if (!cleanText(videoForm.liveStartDate)) {
        return "Live class start date required.";
      }

      if (!cleanText(videoForm.liveStartTime)) {
        return "Live class start time required.";
      }
    }

    if (cleanText(videoForm.liveEndDate) && !cleanText(videoForm.liveEndTime)) {
      return "Live class end time required when end date is added.";
    }

    if (cleanText(videoForm.liveEndTime) && !cleanText(videoForm.liveEndDate)) {
      return "Live class end date required when end time is added.";
    }

    if (
      hasDateTimePair(videoForm.liveStartDate, videoForm.liveStartTime) &&
      hasDateTimePair(videoForm.liveEndDate, videoForm.liveEndTime)
    ) {
      const startDateTime = getDateTimeValue(
        videoForm.liveStartDate,
        videoForm.liveStartTime
      );

      const endDateTime = getDateTimeValue(
        videoForm.liveEndDate,
        videoForm.liveEndTime
      );

      if (!startDateTime || !endDateTime) {
        return "Live class date/time is invalid.";
      }

      if (endDateTime < startDateTime) {
        return "Live class end time cannot be before start time.";
      }
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
  const finalSubject = getFinalVideoSubject(videoForm);
  const finalChapter = getFinalVideoChapter(videoForm);

  return universalContent.find((item) => {
    if (editId && item.id === editId) return false;

    if (!isVideoContentItem(item)) return false;

    const itemMode = normalizeClassMode(item.classMode || item.mode);

    const sameCore =
      normalizeVideoText(item.title) === normalizeVideoText(videoForm.title) &&
      normalizePlanType(item.planType) === normalizePlanType(videoForm.planType) &&
      normalizeVideoText(item.subject) === normalizeVideoText(finalSubject) &&
      normalizeVideoText(item.chapter) === normalizeVideoText(finalChapter) &&
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
  const liveStatus = getLiveStatusValue(videoForm.liveStatus);
  const isCancelled = isLive && isCancelledLiveStatus(liveStatus);

  const finalSubject = getFinalVideoSubject(videoForm);
  const finalChapter = getFinalVideoChapter(videoForm);

  const recordedUrl = cleanText(videoForm.videoUrl);
  const replayUrl = cleanText(videoForm.replayUrl);
  const joinUrl = cleanText(videoForm.joinUrl);

  const sourceType = isLive
    ? videoForm.livePlatform || LIVE_PLATFORMS.YOUTUBE_LIVE
    : videoForm.sourceType || VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC;

  const playableUrl = isLive ? replayUrl : recordedUrl;

  return {
    section: VIDEO_SECTION,
    contentType: VIDEO_CONTENT_TYPE,
    classMode,

    title: cleanText(videoForm.title),
    planType: normalizePlanType(videoForm.planType),
    subject: finalSubject,
    chapter: finalChapter,
    thumbnailUrl: cleanText(videoForm.thumbnailUrl),
    duration: cleanText(videoForm.duration),
    mentorName: cleanText(videoForm.mentorName),
    status: normalizeVideoStatus(videoForm.status),
    updatedAt: now,

    sourceType,

    videoUrl: playableUrl,
    fileUrl: playableUrl,
    sourceUrl: playableUrl,

    liveStartDate: isLive ? cleanText(videoForm.liveStartDate) : "",
    liveStartTime: isLive ? cleanText(videoForm.liveStartTime) : "",
    liveEndDate: isLive ? cleanText(videoForm.liveEndDate) : "",
    liveEndTime: isLive ? cleanText(videoForm.liveEndTime) : "",
    livePlatform: isLive
      ? videoForm.livePlatform || LIVE_PLATFORMS.YOUTUBE_LIVE
      : "",
    liveStatus: isLive ? liveStatus : "",
    liveClassStatus: isLive ? liveStatus : "",
    scheduleStatus: isLive ? liveStatus : "",
    isCancelled,
    cancelled: isCancelled,
    joinUrl: isLive ? joinUrl : "",
    liveUrl: isLive ? joinUrl : "",
    meetingUrl: isLive ? joinUrl : "",
    replayUrl: isLive ? replayUrl : "",
    recordingUrl: isLive ? replayUrl : "",
    liveInstructions: isLive ? cleanText(videoForm.liveInstructions) : "",
  };
};

export { normalizeVideoText };