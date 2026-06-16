export const VIDEO_CLASS_MODE = {
    RECORDED: "RECORDED",
    LIVE: "LIVE",
  };
  
  export const LIVE_CLASS_STATUS = {
    RECORDED: "RECORDED",
    NOT_SCHEDULED: "NOT_SCHEDULED",
    UPCOMING: "UPCOMING",
    JOIN_NOW: "JOIN_NOW",
    REPLAY_AVAILABLE: "REPLAY_AVAILABLE",
    ENDED: "ENDED",
  };
  
  export const normalizeVideoText = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/%20/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");
  
  export const createVideoSlug = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/%20/g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  
  export const normalizePlanType = (value = "FREE") =>
    value?.toString().trim().toUpperCase() || "FREE";
  
  export const normalizeVideoStatus = (value = "published") =>
    value?.toString().trim().toLowerCase() || "published";
  
  export const normalizeClassMode = (value = "RECORDED") =>
    value?.toString().trim().toUpperCase() === "LIVE"
      ? VIDEO_CLASS_MODE.LIVE
      : VIDEO_CLASS_MODE.RECORDED;
  
  export const isVideoContentItem = (item = {}) =>
    item.section === "recordedVideo" ||
    item.section === "video" ||
    item.contentType === "VIDEO";
  
  export const isPublishedVideoItem = (item = {}) =>
    normalizeVideoStatus(item.status) === "published";
  
  export const isLiveClass = (item = {}) =>
    normalizeClassMode(item.classMode || item.mode) === VIDEO_CLASS_MODE.LIVE;
  
  export const isRecordedClass = (item = {}) =>
    normalizeClassMode(item.classMode || item.mode) === VIDEO_CLASS_MODE.RECORDED;
  
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
  
      if (url.hostname.includes("youtu.be")) {
        return url.pathname.replace("/", "").split("?")[0];
      }
  
      if (url.hostname.includes("youtube.com")) {
        if (url.searchParams.get("v")) {
          return url.searchParams.get("v");
        }
  
        const pathParts = url.pathname.split("/").filter(Boolean);
  
        if (pathParts[0] === "embed" && pathParts[1]) {
          return pathParts[1];
        }
  
        if (pathParts[0] === "live" && pathParts[1]) {
          return pathParts[1];
        }
  
        if (pathParts[0] === "shorts" && pathParts[1]) {
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
  
  export const getLiveClassStatus = (item = {}) => {
    if (!isLiveClass(item)) {
      return LIVE_CLASS_STATUS.RECORDED;
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
  
    if (startDateTime && endDateTime && now >= startDateTime && now <= endDateTime) {
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
  
      return item.replayUrl || item.joinUrl || "";
    }
  
    return getVideoSourceUrl(item);
  };
  
  export const isExternalClassroomSource = (sourceUrl = "") => {
    if (!sourceUrl) return false;
  
    return !buildSafeYouTubeEmbedUrl(sourceUrl);
  };

  /* =========================
   BACKWARD COMPATIBILITY
   Old video admin components still import these names.
========================= */

export const getVideoClassMode = (item = {}) =>
normalizeClassMode(item.classMode || item.mode);

export const normalizeVideoValue = (value = "") =>
normalizeVideoText(value);