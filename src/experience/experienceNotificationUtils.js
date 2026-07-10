import {
  buildExperienceEventKey,
  getExperienceDate,
} from "./experienceEventUtils";
import {
  buildExperienceLinkedSourceKey,
  getExperienceEventLinkedSource,
  getExperienceSourceItemId,
  getExperienceSourceItemTitle,
  getExperienceSourceItemType,
  getExperienceSourceRoute,
} from "./experienceNotificationSourceUtils";

const MAX_READ_KEYS = 300;
const MAX_ANNOUNCEMENT_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_CONTENT_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const cleanText = (value = "") => String(value || "").trim();

const stableHash = (value = "") => {
  const text = cleanText(value);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
};

const getPublishedDate = (item = {}) =>
  getExperienceDate(item.publishedAt) ||
  getExperienceDate(item.updatedAt) ||
  getExperienceDate(item.createdAt) ||
  null;

const isRecentDate = (date, nowMs, maximumAgeMs = MAX_CONTENT_AGE_MS) => {
  if (!date) return false;
  const age = nowMs - date.getTime();
  return age >= 0 && age <= maximumAgeMs;
};

const getItemPlan = (item = {}) =>
  cleanText(item.planType || item.accessPlan || item.plan).toUpperCase();

const getContentFingerprint = (kind, item = {}) =>
  stableHash(
    [
      kind,
      getExperienceSourceItemTitle(item),
      item.subject,
      item.chapter,
      item.month,
      item.week,
      item.year,
      item.pdfUrl,
      item.fileUrl,
      item.videoUrl,
      item.liveUrl,
      item.replayUrl,
    ]
      .map(cleanText)
      .join("|")
  );

export const getNotificationStorageKey = (user) => {
  const identity = cleanText(user?.uid || user?.email || "guest").toLowerCase();
  return `aspirenest:ctet-notifications:read:${encodeURIComponent(identity || "guest")}`;
};

export const loadReadNotificationKeys = (storageKey) => {
  if (typeof window === "undefined" || !window.localStorage || !storageKey) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((key) => typeof key === "string")
      : [];
  } catch {
    return [];
  }
};

export const saveReadNotificationKeys = (storageKey, keys = []) => {
  if (typeof window === "undefined" || !window.localStorage || !storageKey) {
    return;
  }

  try {
    const uniqueKeys = Array.from(
      new Set(keys.filter((key) => typeof key === "string"))
    ).slice(-MAX_READ_KEYS);

    window.localStorage.setItem(storageKey, JSON.stringify(uniqueKeys));
  } catch {
    // Read-state failure must never break the app.
  }
};

export const formatNotificationTime = (value, nowValue = new Date()) => {
  const date = getExperienceDate(value);
  const now = getExperienceDate(nowValue) || new Date();
  if (!date) return "Recently";

  const difference = date.getTime() - now.getTime();
  const minutes = Math.max(1, Math.round(Math.abs(difference) / 60000));

  if (minutes < 60) return difference > 0 ? `In ${minutes}m` : `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return difference > 0 ? `In ${hours}h` : `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days <= 7) return difference > 0 ? `In ${days}d` : `${days}d ago`;

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const buildAnnouncementNotification = (announcement = {}, nowMs) => {
  const title = cleanText(announcement.title);
  const message = cleanText(announcement.message);
  if (!title && !message) return null;

  const createdAt = getExperienceDate(announcement.createdAt);
  const createdAtMs = createdAt ? createdAt.getTime() : nowMs;
  if (createdAt && nowMs - createdAtMs > MAX_ANNOUNCEMENT_AGE_MS) return null;

  const fallbackId = stableHash(
    [title, message, createdAt ? createdAt.toISOString() : ""].join("|")
  );

  return {
    key: `announcement:${cleanText(announcement.id || fallbackId)}`,
    source: "announcement",
    title: title || "AspireNest announcement",
    message: message || "A new academy update is available.",
    badge: "Announcement",
    tone: "announcement",
    icon: "!",
    route: "/announcements",
    timeAt: createdAt,
    sortAt: createdAtMs,
    priority: 2,
    dedupeRank: 2,
  };
};

const buildEventNotification = (event = {}, nowMs) => {
  const status = cleanText(event.status).toLowerCase();
  if (!["live", "scheduled", "published"].includes(status)) return null;

  const title = cleanText(event.title);
  if (!title) return null;

  const startAt =
    getExperienceDate(event.startAt) ||
    getExperienceDate(event.raw?.createdAt) ||
    null;

  const fallbackId =
    buildExperienceEventKey(event) ||
    stableHash(
      [event.type, title, startAt ? startAt.toISOString() : ""].join("|")
    );

  const linkedSource = getExperienceEventLinkedSource(event);
  const linkedKey = linkedSource
    ? buildExperienceLinkedSourceKey(
        linkedSource.sourceType,
        linkedSource.sourceId
      )
    : "";

  const isLive = status === "live";
  const isFeatured = Boolean(event.featured);

  return {
    key: linkedKey || `experience-event:${cleanText(event.id || fallbackId)}`,
    groupKey: linkedKey,
    source: "experience-event",
    title,
    message:
      cleanText(event.description) ||
      [event.subject, event.chapter].map(cleanText).filter(Boolean).join(" • ") ||
      "AspireNest learning update for CTET/TET learners.",
    badge: isLive ? "Live now" : isFeatured ? "Featured" : "Upcoming",
    tone: isLive ? "live" : isFeatured ? "featured" : "event",
    icon: isLive ? "LIVE" : cleanText(event.typeLabel).slice(0, 1) || "E",
    route: cleanText(event.cta?.url || event.ctaUrl || "/ctet-tet"),
    timeAt: startAt,
    sortAt: startAt ? startAt.getTime() : nowMs,
    priority: isLive ? 4 : isFeatured ? 3 : 1,
    dedupeRank: isLive ? 4 : isFeatured ? 3 : linkedKey ? 2.5 : 1,
    sortMode: isLive || isFeatured ? "recent" : "upcoming",
  };
};

const CONTENT_META = {
  notes: { badge: "New Notes", icon: "N", tone: "note" },
  mockTest: { badge: "New Mock Test", icon: "T", tone: "mock" },
  recordedVideo: { badge: "New Video", icon: "V", tone: "video" },
  currentAffairs: { badge: "Current Affairs", icon: "CA", tone: "current-affairs" },
};

const buildContentNotification = (item = {}, nowMs, forcedKind = "") => {
  const kind = getExperienceSourceItemType(item, forcedKind);
  const meta = CONTENT_META[kind];
  if (!meta) return null;

  const publishedAt = getPublishedDate(item);
  if (!isRecentDate(publishedAt, nowMs)) return null;

  const title = getExperienceSourceItemTitle(item);
  if (!title) return null;

  const fingerprint = getContentFingerprint(kind, item);
  const exactItemId = getExperienceSourceItemId(item);
  const itemId = exactItemId || fingerprint;
  const linkedKey = exactItemId
    ? buildExperienceLinkedSourceKey(kind, exactItemId)
    : "";

  const detail =
    [getItemPlan(item), item.subject, item.chapter || item.month || item.week]
      .map(cleanText)
      .filter(Boolean)
      .join(" • ") ||
    cleanText(item.description) ||
    "New learning content is available.";

  return {
    key: linkedKey || `content:${kind}:${itemId}`,
    groupKey: linkedKey,
    dedupeKey: `content-fingerprint:${kind}:${fingerprint}`,
    source: "published-content",
    title,
    message: detail,
    badge: meta.badge,
    tone: meta.tone,
    icon: meta.icon,
    route: getExperienceSourceRoute(kind, item),
    timeAt: publishedAt,
    sortAt: publishedAt.getTime(),
    priority: 2,
    dedupeRank: 2,
  };
};

const buildRoadmapNotification = (roadmap = {}, nowMs) => {
  const title = getExperienceSourceItemTitle(roadmap);
  if (!title) return null;

  const publishedAt = getPublishedDate(roadmap);
  if (!isRecentDate(publishedAt, nowMs)) return null;

  const fingerprint = stableHash(
    [
      title,
      roadmap.planType,
      roadmap.course,
      roadmap.examType,
      roadmap.startDate,
      roadmap.endDate,
    ]
      .map(cleanText)
      .join("|")
  );

  const exactItemId = getExperienceSourceItemId(roadmap);
  const roadmapId = exactItemId || fingerprint;
  const linkedKey = exactItemId
    ? buildExperienceLinkedSourceKey("roadmap", exactItemId)
    : "";

  const detail =
    [
      getItemPlan(roadmap),
      roadmap.course || roadmap.examType,
      roadmap.totalDays || roadmap.durationDays
        ? `${roadmap.totalDays || roadmap.durationDays} days`
        : "",
    ]
      .map(cleanText)
      .filter(Boolean)
      .join(" • ") ||
    "A new guided AspirePath roadmap is available.";

  return {
    key: linkedKey || `roadmap:${roadmapId}`,
    groupKey: linkedKey,
    source: "roadmap",
    title,
    message: detail,
    badge: "New Roadmap",
    tone: "roadmap",
    icon: "R",
    route: getExperienceSourceRoute("roadmap", roadmap),
    timeAt: publishedAt,
    sortAt: publishedAt.getTime(),
    priority: 2,
    dedupeRank: 2,
  };
};

const buildResultNotification = (result = {}, nowMs) => {
  const completedAt =
    getExperienceDate(result.completedAt) ||
    getExperienceDate(result.submittedAt) ||
    getExperienceDate(result.createdAt) ||
    getExperienceDate(result.updatedAt);

  if (!isRecentDate(completedAt, nowMs)) return null;

  const testId = cleanText(result.testId || result.mockTestId || result.contentId);
  const resultId = cleanText(result.id || result.attemptSaveKey || testId);
  if (!resultId) return null;

  const title = cleanText(result.testTitle || result.title) || "Mock test result";
  const percentage = Number(result.percentage);
  const score = Number(result.score);
  const totalMarks = Number(result.totalMarks || result.maxMarks);

  const detail = Number.isFinite(percentage)
    ? `${Math.round(percentage)}% score${Number.isFinite(score) ? ` • ${score}${Number.isFinite(totalMarks) ? `/${totalMarks}` : ""}` : ""}`
    : "Your mock test result is ready to review.";

  return {
    key: `mock-result:${resultId}`,
    source: "mock-result",
    title,
    message: detail,
    badge: "Result Ready",
    tone: "result",
    icon: "%",
    route: testId
      ? `/ctet-tet/mock-tests/result/${encodeURIComponent(testId)}`
      : "/ctet-tet/mock-tests/history",
    timeAt: completedAt,
    sortAt: completedAt.getTime(),
    priority: 2,
    dedupeRank: 2,
  };
};

const selectPreferredNotification = (candidate, existing) => {
  if (!existing) return candidate;
  if (candidate.dedupeRank !== existing.dedupeRank) {
    return candidate.dedupeRank > existing.dedupeRank ? candidate : existing;
  }
  return candidate.sortAt > existing.sortAt ? candidate : existing;
};

export const buildExperienceNotifications = ({
  announcements = [],
  events = [],
  contentItems = [],
  currentAffairs = [],
  roadmaps = [],
  mockResults = [],
  maxCount = 12,
  now = new Date(),
} = {}) => {
  const currentDate = getExperienceDate(now) || new Date();
  const nowMs = currentDate.getTime();

  const items = [
    ...events.map((event) => buildEventNotification(event, nowMs)),
    ...announcements.map((item) => buildAnnouncementNotification(item, nowMs)),
    ...contentItems.map((item) => buildContentNotification(item, nowMs)),
    ...currentAffairs.map((item) =>
      buildContentNotification(item, nowMs, "currentAffairs")
    ),
    ...roadmaps.map((item) => buildRoadmapNotification(item, nowMs)),
    ...mockResults.map((item) => buildResultNotification(item, nowMs)),
  ].filter(Boolean);

  const uniqueItems = new Map();

  items.forEach((item) => {
    const uniqueKey = item.groupKey || item.dedupeKey || item.key;
    uniqueItems.set(
      uniqueKey,
      selectPreferredNotification(item, uniqueItems.get(uniqueKey))
    );
  });

  return Array.from(uniqueItems.values())
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return second.priority - first.priority;
      }

      if (first.sortMode === "upcoming" && second.sortMode === "upcoming") {
        return first.sortAt - second.sortAt;
      }

      return second.sortAt - first.sortAt;
    })
    .slice(0, Math.max(1, Number(maxCount) || 12));
};
