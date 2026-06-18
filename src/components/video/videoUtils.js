import {
  LIVE_CLASS_STATUS as CORE_LIVE_CLASS_STATUS,
  VIDEO_CLASS_MODES,
  VIDEO_PLAN_ORDER,
  VIDEO_STATUS,
} from "./videoConstants.js";

export const VIDEO_CLASS_MODE = VIDEO_CLASS_MODES;

export const LIVE_CLASS_STATUS = {
  RECORDED: "RECORDED",
  ...CORE_LIVE_CLASS_STATUS,
};

export const normalizeVideoText = (value = "") =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ") || "";

export const createVideoSlug = (value = "") =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "";

export const normalizePlanType = (value = "FREE") => {
  const finalValue = value?.toString().trim().toUpperCase();

  return finalValue || "FREE";
};

export const normalizeVideoStatus = (value = VIDEO_STATUS.PUBLISHED) => {
  const finalValue = value?.toString().trim().toLowerCase();

  return finalValue || VIDEO_STATUS.PUBLISHED;
};

export const normalizeClassMode = (value = VIDEO_CLASS_MODES.RECORDED) =>
  value?.toString().trim().toUpperCase() === VIDEO_CLASS_MODES.LIVE
    ? VIDEO_CLASS_MODES.LIVE
    : VIDEO_CLASS_MODES.RECORDED;

export const isVideoContentItem = (item = {}) =>
  item.section === "recordedVideo" ||
  item.section === "video" ||
  item.contentType === "VIDEO";

export const isPublishedVideoItem = (item = {}) =>
  normalizeVideoStatus(item.status) === VIDEO_STATUS.PUBLISHED;

export const isLiveClass = (item = {}) =>
  normalizeClassMode(item.classMode || item.mode) === VIDEO_CLASS_MODES.LIVE;

export const isRecordedClass = (item = {}) =>
  normalizeClassMode(item.classMode || item.mode) === VIDEO_CLASS_MODES.RECORDED;

export const getVideoSourceUrl = (item = {}) => {
  if (isLiveClass(item)) {
    return item.replayUrl || item.joinUrl || item.videoUrl || item.fileUrl || "";
  }

  return item.videoUrl || item.fileUrl || item.url || "";
};

export const extractYouTubeVideoId = (sourceUrl = "") => {
  if (!sourceUrl) return "";

  try {
    const url = new URL(sourceUrl);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.replace("/", "").split("?")[0];
    }

    if (
      hostname.endsWith("youtube.com") ||
      hostname.endsWith("youtube-nocookie.com")
    ) {
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v");
      }

      const pathParts = url.pathname.split("/").filter(Boolean);

      if (
        ["embed", "live", "shorts"].includes(pathParts[0]) &&
        pathParts[1]
      ) {
        return pathParts[1];
      }
    }

    return "";
  } catch {
    return "";
  }
};

export const buildSafeYouTubeEmbedUrl = (sourceUrl = "") => {
  const videoId = extractYouTubeVideoId(sourceUrl);

  if (!videoId) return "";

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
};

export const getDateTimeFromParts = (dateValue = "", timeValue = "") => {
  if (!dateValue) return null;

  const finalTime = timeValue || "00:00";
  const date = new Date(`${dateValue}T${finalTime}`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isCancelledLiveClass = (item = {}) => {
  const liveState = (
    item.liveStatus ||
    item.classStatus ||
    item.scheduleStatus ||
    item.status ||
    ""
  )
    .toString()
    .trim()
    .toUpperCase();

  return item.isCancelled === true || liveState === LIVE_CLASS_STATUS.CANCELLED;
};

export const getLiveClassStatus = (item = {}) => {
  if (!isLiveClass(item)) {
    return LIVE_CLASS_STATUS.RECORDED;
  }

  if (isCancelledLiveClass(item)) {
    return LIVE_CLASS_STATUS.CANCELLED;
  }

  const startDateTime = getDateTimeFromParts(
    item.liveStartDate,
    item.liveStartTime
  );

  const endDateTime = getDateTimeFromParts(
    item.liveEndDate || item.liveStartDate,
    item.liveEndTime || "23:59"
  );

  if (!startDateTime) {
    return LIVE_CLASS_STATUS.NOT_SCHEDULED;
  }

  const now = new Date();

  if (now < startDateTime) {
    return LIVE_CLASS_STATUS.UPCOMING;
  }

  if (endDateTime && now >= startDateTime && now <= endDateTime) {
    return LIVE_CLASS_STATUS.JOIN_NOW;
  }

  if (endDateTime && now > endDateTime && item.replayUrl) {
    return LIVE_CLASS_STATUS.REPLAY_AVAILABLE;
  }

  if (endDateTime && now > endDateTime) {
    return LIVE_CLASS_STATUS.ENDED;
  }

  return LIVE_CLASS_STATUS.JOIN_NOW;
};

export const getLiveStatusLabel = (status = "") => {
  const labels = {
    [LIVE_CLASS_STATUS.RECORDED]: "Recorded",
    [LIVE_CLASS_STATUS.NOT_SCHEDULED]: "Schedule Pending",
    [LIVE_CLASS_STATUS.UPCOMING]: "Upcoming",
    [LIVE_CLASS_STATUS.JOIN_NOW]: "Join Now",
    [LIVE_CLASS_STATUS.REPLAY_AVAILABLE]: "Replay Available",
    [LIVE_CLASS_STATUS.ENDED]: "Ended",
    [LIVE_CLASS_STATUS.CANCELLED]: "Cancelled",
  };

  return labels[status] || "Classroom";
};

export const getLiveStatusClassName = (status = "") => {
  const classNames = {
    [LIVE_CLASS_STATUS.RECORDED]: "liveStatusRecorded",
    [LIVE_CLASS_STATUS.NOT_SCHEDULED]: "liveStatusPending",
    [LIVE_CLASS_STATUS.UPCOMING]: "liveStatusUpcoming",
    [LIVE_CLASS_STATUS.JOIN_NOW]: "liveStatusJoinNow",
    [LIVE_CLASS_STATUS.REPLAY_AVAILABLE]: "liveStatusReplay",
    [LIVE_CLASS_STATUS.ENDED]: "liveStatusEnded",
    [LIVE_CLASS_STATUS.CANCELLED]: "liveStatusCancelled",
  };

  return classNames[status] || "liveStatusPending";
};

export const getClassroomSourceUrl = (item = {}) => {
  if (!item) return "";

  if (isLiveClass(item)) {
    const status = getLiveClassStatus(item);

    if (status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
      return item.replayUrl || "";
    }

    if (status === LIVE_CLASS_STATUS.JOIN_NOW) {
      return item.joinUrl || item.videoUrl || "";
    }

    return "";
  }

  return getVideoSourceUrl(item);
};

export const isExternalClassroomSource = (sourceUrl = "") => {
  if (!sourceUrl) return false;

  return !buildSafeYouTubeEmbedUrl(sourceUrl);
};

export const canAccessVideoPlan = ({
  requiredPlan = "FREE",
  userPlanType = "FREE",
} = {}) => {
  const requiredLevel = VIDEO_PLAN_ORDER[normalizePlanType(requiredPlan)] ?? 0;
  const userLevel = VIDEO_PLAN_ORDER[normalizePlanType(userPlanType)] ?? 0;

  return userLevel >= requiredLevel;
};

/* =========================
   BACKWARD COMPATIBILITY
   Old video admin components still import these names.
========================= */

export const getVideoClassMode = (item = {}) =>
  normalizeClassMode(item.classMode || item.mode);

export const normalizeVideoValue = (value = "") => normalizeVideoText(value);