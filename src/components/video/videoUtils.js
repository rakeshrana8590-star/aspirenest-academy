import {
  LIVE_CLASS_STATUS as CORE_LIVE_CLASS_STATUS,
  VIDEO_CLASS_MODES,
  VIDEO_PLAN_ORDER,
  VIDEO_STATUS,
} from "./videoConstants.js";

export const VIDEO_CLASS_MODE = VIDEO_CLASS_MODES;

export const LIVE_CLASS_STATUS = {
  RECORDED: "RECORDED",
  SCHEDULED: "SCHEDULED",
  LIVE_NOW: "LIVE_NOW",
  ...CORE_LIVE_CLASS_STATUS,
};

export const normalizeVideoText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");

export const createVideoSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizePlanType = (value = "FREE") => {
  const finalValue = String(value || "FREE").trim().toUpperCase();

  return finalValue || "FREE";
};

export const normalizeVideoStatus = (value = VIDEO_STATUS.PUBLISHED) => {
  const finalValue = String(value || VIDEO_STATUS.PUBLISHED)
    .trim()
    .toLowerCase();

  return finalValue || VIDEO_STATUS.PUBLISHED;
};

export const normalizeClassMode = (value = VIDEO_CLASS_MODES.RECORDED) => {
  const finalValue = String(value || VIDEO_CLASS_MODES.RECORDED)
    .trim()
    .toUpperCase();

  return finalValue === VIDEO_CLASS_MODES.LIVE
    ? VIDEO_CLASS_MODES.LIVE
    : VIDEO_CLASS_MODES.RECORDED;
};

export const isVideoContentItem = (item = {}) => {
  const section = normalizeVideoText(item.section || "");
  const contentType = String(item.contentType || "").trim().toUpperCase();
  const classMode = String(item.classMode || item.mode || "")
    .trim()
    .toUpperCase();

  return (
    section === "recordedvideo" ||
    section === "video" ||
    section.includes("video") ||
    contentType === "VIDEO" ||
    classMode === VIDEO_CLASS_MODES.LIVE ||
    classMode === VIDEO_CLASS_MODES.RECORDED ||
    Boolean(item.videoUrl || item.replayUrl || item.joinUrl || item.liveUrl)
  );
};

export const isPublishedVideoItem = (item = {}) =>
  normalizeVideoStatus(item.status) === VIDEO_STATUS.PUBLISHED;

export const isLiveClass = (item = {}) =>
  normalizeClassMode(item.classMode || item.mode) === VIDEO_CLASS_MODES.LIVE;

export const isRecordedClass = (item = {}) =>
  normalizeClassMode(item.classMode || item.mode) ===
  VIDEO_CLASS_MODES.RECORDED;

export const getVideoSourceUrl = (item = {}) => {
  if (isLiveClass(item)) {
    return (
      item.replayUrl ||
      item.recordingUrl ||
      item.joinUrl ||
      item.liveUrl ||
      item.videoUrl ||
      item.fileUrl ||
      item.sourceUrl ||
      item.url ||
      ""
    );
  }

  return item.videoUrl || item.fileUrl || item.sourceUrl || item.url || "";
};

export const extractYouTubeVideoId = (sourceUrl = "") => {
  if (!sourceUrl) return "";

  try {
    const url = new URL(sourceUrl);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (hostname === "youtu.be") {
      return pathParts[0] || "";
    }

    if (
      hostname.endsWith("youtube.com") ||
      hostname.endsWith("youtube-nocookie.com")
    ) {
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v") || "";
      }

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

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`;
};

export const extractDriveFileId = (sourceUrl = "") => {
  if (!sourceUrl) return "";

  const directMatch = String(sourceUrl).match(
    /drive\.google\.com\/file\/d\/([^/]+)/
  );
  const queryMatch = String(sourceUrl).match(/[?&]id=([^&]+)/);

  return directMatch?.[1] || queryMatch?.[1] || "";
};

export const buildSafeDriveEmbedUrl = (sourceUrl = "") => {
  const fileId = extractDriveFileId(sourceUrl);

  if (!fileId) return "";

  return `https://drive.google.com/file/d/${fileId}/preview`;
};

export const getDateTimeFromParts = (dateValue = "", timeValue = "") => {
  if (!dateValue) return null;

  const finalTime = timeValue || "00:00";
  const date = new Date(`${dateValue}T${finalTime}`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeLiveStatus = (value = "") => {
  const finalValue = String(value || "").trim().toUpperCase();

  if (!finalValue || finalValue === "SCHEDULED" || finalValue === "AUTO") {
    return "";
  }

  if (finalValue === "LIVE" || finalValue === "LIVE_NOW") {
    return LIVE_CLASS_STATUS.JOIN_NOW;
  }

  return finalValue;
};

const hasCancelledFlag = (item = {}) => {
  const status = normalizeVideoStatus(item.status || "");
  const manualStatus = normalizeLiveStatus(
    item.liveStatus ||
      item.liveClassStatus ||
      item.classStatus ||
      item.scheduleStatus
  );

  return (
    item.isCancelled === true ||
    item.cancelled === true ||
    status === "cancelled" ||
    manualStatus === LIVE_CLASS_STATUS.CANCELLED
  );
};

export const getLiveClassStatus = (item = {}, nowValue = new Date()) => {
  if (!isLiveClass(item)) {
    return LIVE_CLASS_STATUS.RECORDED;
  }

  if (hasCancelledFlag(item)) {
    return LIVE_CLASS_STATUS.CANCELLED;
  }

  const manualStatus = normalizeLiveStatus(
    item.liveStatus ||
      item.liveClassStatus ||
      item.classStatus ||
      item.scheduleStatus
  );

  const replayUrl =
    item.replayUrl || item.recordingUrl || item.videoUrl || item.fileUrl || "";
  const joinUrl = item.joinUrl || item.liveUrl || item.meetingUrl || "";

  if (manualStatus === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
    return replayUrl
      ? LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      : LIVE_CLASS_STATUS.ENDED;
  }

  if (manualStatus === LIVE_CLASS_STATUS.ENDED) {
    return replayUrl
      ? LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      : LIVE_CLASS_STATUS.ENDED;
  }

  if (manualStatus === LIVE_CLASS_STATUS.JOIN_NOW) {
    return joinUrl ? LIVE_CLASS_STATUS.JOIN_NOW : LIVE_CLASS_STATUS.UPCOMING;
  }

  if (manualStatus === LIVE_CLASS_STATUS.UPCOMING) {
    return LIVE_CLASS_STATUS.UPCOMING;
  }

  if (manualStatus === LIVE_CLASS_STATUS.NOT_SCHEDULED) {
    return replayUrl
      ? LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      : LIVE_CLASS_STATUS.NOT_SCHEDULED;
  }

  const startDateTime = getDateTimeFromParts(
    item.liveStartDate || item.startDate || item.classDate,
    item.liveStartTime || item.startTime
  );

  const endDateTime = getDateTimeFromParts(
    item.liveEndDate ||
      item.endDate ||
      item.liveStartDate ||
      item.startDate ||
      item.classDate,
    item.liveEndTime || item.endTime
  );

  if (!startDateTime) {
    return replayUrl
      ? LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      : LIVE_CLASS_STATUS.NOT_SCHEDULED;
  }

  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);

  if (Number.isNaN(now.getTime())) {
    return replayUrl
      ? LIVE_CLASS_STATUS.REPLAY_AVAILABLE
      : LIVE_CLASS_STATUS.UPCOMING;
  }

  const fallbackEndDateTime =
    endDateTime || new Date(startDateTime.getTime() + 60 * 60 * 1000);

  if (now < startDateTime) {
    return LIVE_CLASS_STATUS.UPCOMING;
  }

  if (now >= startDateTime && now <= fallbackEndDateTime) {
    return joinUrl ? LIVE_CLASS_STATUS.JOIN_NOW : LIVE_CLASS_STATUS.UPCOMING;
  }

  if (replayUrl) {
    return LIVE_CLASS_STATUS.REPLAY_AVAILABLE;
  }

  return LIVE_CLASS_STATUS.ENDED;
};

export const getLiveStatusLabel = (status = "") => {
  const normalizedStatus =
    normalizeLiveStatus(status) || String(status || "").trim().toUpperCase();

  const labels = {
    [LIVE_CLASS_STATUS.RECORDED]: "Recorded",
    [LIVE_CLASS_STATUS.SCHEDULED]: "Scheduled",
    [LIVE_CLASS_STATUS.NOT_SCHEDULED]: "Schedule Pending",
    [LIVE_CLASS_STATUS.UPCOMING]: "Upcoming",
    [LIVE_CLASS_STATUS.JOIN_NOW]: "Join Now",
    [LIVE_CLASS_STATUS.LIVE_NOW]: "Join Now",
    [LIVE_CLASS_STATUS.REPLAY_AVAILABLE]: "Replay Available",
    [LIVE_CLASS_STATUS.ENDED]: "Ended",
    [LIVE_CLASS_STATUS.CANCELLED]: "Cancelled",
  };

  return labels[normalizedStatus] || "Classroom";
};

export const getLiveClassStateLabel = getLiveStatusLabel;

export const getLiveStatusClassName = (status = "") => {
  const normalizedStatus =
    normalizeLiveStatus(status) || String(status || "").trim().toUpperCase();

  const classNames = {
    [LIVE_CLASS_STATUS.RECORDED]: "liveStatusRecorded",
    [LIVE_CLASS_STATUS.SCHEDULED]: "liveStatusUpcoming",
    [LIVE_CLASS_STATUS.NOT_SCHEDULED]: "liveStatusPending",
    [LIVE_CLASS_STATUS.UPCOMING]: "liveStatusUpcoming",
    [LIVE_CLASS_STATUS.JOIN_NOW]: "liveStatusJoinNow",
    [LIVE_CLASS_STATUS.LIVE_NOW]: "liveStatusJoinNow",
    [LIVE_CLASS_STATUS.REPLAY_AVAILABLE]: "liveStatusReplay",
    [LIVE_CLASS_STATUS.ENDED]: "liveStatusEnded",
    [LIVE_CLASS_STATUS.CANCELLED]: "liveStatusCancelled",
  };

  return classNames[normalizedStatus] || "liveStatusPending";
};

export const getClassroomSourceUrl = (item = {}) => {
  if (!item) return "";

  if (isLiveClass(item)) {
    const status = getLiveClassStatus(item);

    const joinSource =
      item.joinUrl || item.liveUrl || item.meetingUrl || "";

    const replaySource =
      item.replayUrl ||
      item.recordingUrl ||
      item.videoUrl ||
      item.fileUrl ||
      item.sourceUrl ||
      "";

    if (status === LIVE_CLASS_STATUS.CANCELLED) {
      return replaySource;
    }

    if (status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
      return replaySource;
    }

    if (status === LIVE_CLASS_STATUS.JOIN_NOW) {
      return joinSource || replaySource;
    }

    if (status === LIVE_CLASS_STATUS.UPCOMING) {
      return joinSource || replaySource;
    }

    if (status === LIVE_CLASS_STATUS.NOT_SCHEDULED) {
      return joinSource || replaySource;
    }

    if (status === LIVE_CLASS_STATUS.ENDED) {
      return replaySource;
    }

    return joinSource || replaySource;
  }

  return getVideoSourceUrl(item);
};

export const isExternalClassroomSource = (sourceUrl = "") => {
  if (!sourceUrl) return false;

  return !buildSafeYouTubeEmbedUrl(sourceUrl) && !buildSafeDriveEmbedUrl(sourceUrl);
};

export const canAccessVideoPlan = ({
  requiredPlan = "FREE",
  userPlanType = "FREE",
} = {}) => {
  const requiredLevel = VIDEO_PLAN_ORDER[normalizePlanType(requiredPlan)] ?? 0;
  const userLevel = VIDEO_PLAN_ORDER[normalizePlanType(userPlanType)] ?? 0;

  return userLevel >= requiredLevel;
};

export const hasVideoPlanAccess = (
  requiredPlan = "FREE",
  userPlanType = "FREE"
) => canAccessVideoPlan({ requiredPlan, userPlanType });

export const getVideoClassMode = (item = {}) =>
  normalizeClassMode(item.classMode || item.mode);

export const normalizeVideoValue = (value = "") => normalizeVideoText(value);