import {
  hasNotePdf,
  isNotesContent,
  isPublishedNote,
} from "../components/notes/shared/notesUtils.js";
import {
  isPublishedVideoItem,
  isVideoContentItem,
} from "../components/video/videoUtils.js";
import { isPublishedCurrentAffair } from "../components/currentAffairs/shared/currentAffairsUtils.js";

const cleanText = (value = "") => String(value || "").trim();

export const EXPERIENCE_NOTIFICATION_SOURCE_TYPES = Object.freeze({
  MOCK_TEST: "mockTest",
  VIDEO: "recordedVideo",
  NOTES: "notes",
  CURRENT_AFFAIRS: "currentAffairs",
  ROADMAP: "roadmap",
});

export const normalizeExperienceSourceType = (value = "") => {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (["mocktest", "mocktests", "test", "rankchallenge"].includes(normalized)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST;
  }

  if (["recordedvideo", "video", "videos", "liveclass", "class"].includes(normalized)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO;
  }

  if (["note", "notes", "pdf"].includes(normalized)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.NOTES;
  }

  if (["currentaffair", "currentaffairs", "ca"].includes(normalized)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.CURRENT_AFFAIRS;
  }

  if (["roadmap", "aspirepath", "mission"].includes(normalized)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.ROADMAP;
  }

  return "";
};

export const getExperienceSourceItemId = (item = {}) =>
  cleanText(item.id || item.contentId || item.roadmapId);

export const getExperienceSourceItemTitle = (item = {}) =>
  cleanText(item.title || item.name || item.heading || item.testTitle);

export const getExperienceSourceItemType = (item = {}, forcedType = "") => {
  const normalizedForcedType = normalizeExperienceSourceType(forcedType);

  if (normalizedForcedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.ROADMAP) {
    return normalizedForcedType;
  }

  if (normalizedForcedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.CURRENT_AFFAIRS) {
    return isPublishedCurrentAffair(item) ? normalizedForcedType : "";
  }

  if (isNotesContent(item) && isPublishedNote(item) && hasNotePdf(item)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.NOTES;
  }

  if (
    cleanText(item.section) === "mockTest" &&
    cleanText(item.status).toLowerCase() === "published"
  ) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST;
  }

  if (isVideoContentItem(item) && isPublishedVideoItem(item)) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO;
  }

  if (
    cleanText(item.section) === "currentAffairs" &&
    isPublishedCurrentAffair(item)
  ) {
    return EXPERIENCE_NOTIFICATION_SOURCE_TYPES.CURRENT_AFFAIRS;
  }

  return "";
};

export const buildExperienceLinkedSourceKey = (sourceType, sourceId) => {
  const normalizedType = normalizeExperienceSourceType(sourceType);
  const normalizedId = cleanText(sourceId);

  if (!normalizedType || !normalizedId) return "";

  return `linked-source:${normalizedType}:${normalizedId}`;
};

const parseLinkedSourceFromUrl = (value = "") => {
  const rawUrl = cleanText(value);
  if (!rawUrl) return null;

  try {
    const pathname = new URL(rawUrl, "https://aspirenest.local").pathname;
    const routeMatchers = [
      {
        type: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST,
        pattern: /^\/ctet-tet\/mock-tests\/(?:start|attempt|result|review)\/([^/]+)\/?$/i,
      },
      {
        type: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
        pattern: /^\/ctet-tet\/videos\/watch\/([^/]+)\/?$/i,
      },
      {
        type: EXPERIENCE_NOTIFICATION_SOURCE_TYPES.ROADMAP,
        pattern: /^\/ctet-tet\/roadmaps\/([^/]+)\/?$/i,
      },
    ];

    for (const matcher of routeMatchers) {
      const match = pathname.match(matcher.pattern);
      if (match?.[1]) {
        return {
          sourceType: matcher.type,
          sourceId: decodeURIComponent(match[1]),
        };
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const getExperienceEventLinkedSource = (event = {}) => {
  const explicitType = normalizeExperienceSourceType(
    event.sourceType || event.raw?.sourceType
  );
  const explicitId = cleanText(event.sourceId || event.raw?.sourceId);

  if (explicitType && explicitId) {
    return { sourceType: explicitType, sourceId: explicitId };
  }

  return parseLinkedSourceFromUrl(
    event.cta?.url || event.ctaUrl || event.raw?.ctaUrl || event.raw?.ctaLink
  );
};

export const getExperienceSourceRoute = (sourceType, item = {}) => {
  const normalizedType = normalizeExperienceSourceType(sourceType);
  const itemId = getExperienceSourceItemId(item);

  if (normalizedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST) {
    return itemId
      ? `/ctet-tet/mock-tests/start/${encodeURIComponent(itemId)}`
      : "/ctet-tet/mock-tests";
  }

  if (normalizedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO) {
    return itemId
      ? `/ctet-tet/videos/watch/${encodeURIComponent(itemId)}`
      : "/ctet-tet/videos";
  }

  if (normalizedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.NOTES) {
    return "/ctet-tet/notes";
  }

  if (normalizedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.CURRENT_AFFAIRS) {
    return "/ctet-tet/current-affairs";
  }

  if (normalizedType === EXPERIENCE_NOTIFICATION_SOURCE_TYPES.ROADMAP) {
    return itemId
      ? `/ctet-tet/roadmaps/${encodeURIComponent(itemId)}`
      : "/ctet-tet/roadmaps";
  }

  return "/ctet-tet";
};
