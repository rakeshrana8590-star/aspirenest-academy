import {
    LIVE_PLATFORMS,
    VIDEO_CLASS_MODES,
    VIDEO_SOURCE_TYPES,
    VIDEO_STATUS,
  } from "./videoConstants.js";
  
  export const createDefaultVideoForm = () => ({
    classMode: VIDEO_CLASS_MODES.RECORDED,
  
    title: "",
    planType: "",
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
    joinUrl: "",
    replayUrl: "",
    liveInstructions: "",
  
    status: VIDEO_STATUS.PUBLISHED,
    sourceType: VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,
  });
  
  export const buildVideoFormFromItem = (item = {}) => ({
    classMode: item.classMode || VIDEO_CLASS_MODES.RECORDED,
  
    title: item.title || "",
    planType: item.planType || "FREE",
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
    livePlatform: item.livePlatform || LIVE_PLATFORMS.YOUTUBE_LIVE,
    joinUrl: item.joinUrl || "",
    replayUrl: item.replayUrl || "",
    liveInstructions: item.liveInstructions || "",
  
    status: item.status || VIDEO_STATUS.PUBLISHED,
    sourceType: item.sourceType || VIDEO_SOURCE_TYPES.YOUTUBE_PUBLIC,
  });
  
  export const normalizeVideoText = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");
  
  export const createSlugFromVideoText = (value = "") =>
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  
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
    (videoForm.classMode || VIDEO_CLASS_MODES.RECORDED) ===
    VIDEO_CLASS_MODES.RECORDED;
  
  export const isLiveVideoForm = (videoForm = {}) =>
    videoForm.classMode === VIDEO_CLASS_MODES.LIVE;