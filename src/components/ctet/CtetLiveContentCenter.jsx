import React, { useEffect, useMemo, useState } from "react";
import {
  getExperienceEventPresentation,
} from "../../experience/experienceEventPresentation";
import {
  buildExperienceLinkedSourceKey,
  getExperienceSourceItemType,
  getExperienceSourceRoute,
} from "../../experience/experienceNotificationSourceUtils";

const typeMeta = {
  announcement: { label: "Announcement", icon: "!", tone: "current", route: "/ctet-tet" },
  current: { label: "Current Affairs", icon: "CA", tone: "current", route: "/ctet-tet/current-affairs" },
  currentaffairs: { label: "Current Affairs", icon: "CA", tone: "current", route: "/ctet-tet/current-affairs" },
  doubt: { label: "Doubt Session", icon: "?", tone: "live", route: "/ctet-tet/videos" },
  doubtsession: { label: "Doubt Session", icon: "?", tone: "live", route: "/ctet-tet/videos" },
  live: { label: "Live Class", icon: "LIVE", tone: "live", route: "/ctet-tet/videos" },
  liveclass: { label: "Live Class", icon: "LIVE", tone: "live", route: "/ctet-tet/videos" },
  marathon: { label: "Marathon", icon: "MR", tone: "live", route: "/ctet-tet/videos" },
  mock: { label: "Mock Test", icon: "MT", tone: "mock", route: "/ctet-tet/mock-tests" },
  mocktest: { label: "Mock Test", icon: "MT", tone: "mock", route: "/ctet-tet/mock-tests" },
  notes: { label: "Notes", icon: "NT", tone: "notes", route: "/ctet-tet/notes" },
  rankchallenge: { label: "Rank Challenge", icon: "RK", tone: "mock", route: "/ctet-tet/mock-tests" },
  revision: { label: "Revision", icon: "RV", tone: "notes", route: "/ctet-tet/notes" },
  roadmap: { label: "Roadmap", icon: "RD", tone: "roadmap", route: "/ctet-tet/roadmaps" },
  roadmaps: { label: "Roadmap", icon: "RD", tone: "roadmap", route: "/ctet-tet/roadmaps" },
  specialsession: { label: "Special Session", icon: "SS", tone: "live", route: "/ctet-tet/videos" },
  video: { label: "Videos", icon: "VD", tone: "videos", route: "/ctet-tet/videos" },
  videos: { label: "Videos", icon: "VD", tone: "videos", route: "/ctet-tet/videos" },
  webinar: { label: "Webinar", icon: "WB", tone: "live", route: "/ctet-tet/videos" },
  workshop: { label: "Workshop", icon: "WS", tone: "live", route: "/ctet-tet/videos" },
};

const filters = [
  ["all", "All", "*"],
  ["notes", "Notes", "NT"],
  ["mock", "Mock Tests", "MT"],
  ["videos", "Videos", "VD"],
  ["current", "Current Affairs", "CA"],
  ["roadmap", "Roadmaps", "RD"],
];

const filterDetails = Object.freeze({
  all: {
    icon: "*",
    emptyTitle: "No public updates yet",
    emptyText:
      "Published events and learning resources will appear here automatically.",
    cta: "Explore Learning Hub",
    route: "/ctet-tet/courses",
  },
  notes: {
    icon: "NT",
    emptyTitle: "No Notes updates yet",
    emptyText:
      "The latest published Notes and revision resources will appear here.",
    cta: "Open Notes",
    route: "/ctet-tet/notes",
  },
  mock: {
    icon: "MT",
    emptyTitle: "No Mock Test updates yet",
    emptyText:
      "Published Mock Tests and Rank Challenges will appear here.",
    cta: "Open Mock Tests",
    route: "/ctet-tet/mock-tests",
  },
  videos: {
    icon: "VD",
    emptyTitle: "No Video updates yet",
    emptyText:
      "Published videos, live classes, webinars, and workshops will appear here.",
    cta: "Open Videos",
    route: "/ctet-tet/videos",
  },
  current: {
    icon: "CA",
    emptyTitle: "No Current Affairs updates yet",
    emptyText:
      "The latest published Current Affairs resources will appear here.",
    cta: "Open Current Affairs",
    route: "/ctet-tet/current-affairs",
  },
  roadmap: {
    icon: "RD",
    emptyTitle: "No Roadmap updates yet",
    emptyText:
      "Published AspirePath roadmaps and schedule updates will appear here.",
    cta: "Open Roadmaps",
    route: "/ctet-tet/roadmaps",
  },
});

function cleanType(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getFilterDetails(filterKey = "all") {
  return filterDetails[filterKey] || filterDetails.all;
}

function getFilterKeyForSourceType(sourceType = "", fallback = "all") {
  const key = cleanType(sourceType);

  if (key.includes("current")) return "current";
  if (key.includes("mock") || key.includes("test")) return "mock";
  if (key.includes("video") || key.includes("live")) return "videos";
  if (key.includes("roadmap")) return "roadmap";
  if (key.includes("note") || key.includes("revision")) return "notes";

  return fallback;
}

function getFilterKeyForEvent(presentation = {}) {
  const linkedFilter = getFilterKeyForSourceType(
    presentation.linkedSource?.sourceType,
    ""
  );

  if (linkedFilter) return linkedFilter;

  const typeKey = cleanType(presentation.type);

  if (typeKey.includes("mock") || typeKey.includes("challenge")) {
    return "mock";
  }

  if (typeKey.includes("revision")) return "notes";
  if (typeKey.includes("roadmap")) return "roadmap";

  if (
    typeKey.includes("live") ||
    typeKey.includes("class") ||
    typeKey.includes("webinar") ||
    typeKey.includes("workshop") ||
    typeKey.includes("marathon") ||
    typeKey.includes("session")
  ) {
    return "videos";
  }

  return "all";
}

function getFreshnessState({
  status = "",
  featured = false,
  dateValue = null,
} = {}) {
  const normalizedStatus = cleanType(status);

  if (normalizedStatus === "live") {
    return { isFresh: true, label: "LIVE" };
  }

  if (normalizedStatus === "scheduled") {
    return { isFresh: true, label: "UPCOMING" };
  }

  if (featured) {
    return { isFresh: true, label: "FEATURED" };
  }

  const date = toDate(dateValue);
  const ageMs = date ? Date.now() - date.getTime() : Number.POSITIVE_INFINITY;
  const isFresh = ageMs >= 0 && ageMs <= 7 * 24 * 60 * 60 * 1000;

  return {
    isFresh,
    label: isFresh ? "NEW" : "UPDATED",
  };
}

function getSafeSourceRoute(sourceType = "", item = {}, fallback = "/ctet-tet") {
  const route = sourceType
    ? getExperienceSourceRoute(
        sourceType,
        item?.id ? { id: item.id } : {}
      )
    : "";

  return normalizeRoute(route, fallback);
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMeta(type = "") {
  const key = cleanType(type);
  return typeMeta[key] || typeMeta[type] || typeMeta.announcement;
}

function normalizeRoute(url, fallback) {
  const target = String(url || "").trim();
  if (!target) return fallback;
  if (/^(https?:|mailto:|tel:)/i.test(target)) return target;
  return target.startsWith("/") ? target : fallback;
}

function openTarget(navigate, target) {
  if (!target) return;
  if (/^(https?:|mailto:|tel:)/i.test(target)) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }
  navigate(target);
}

function formatDateParts(value) {
  const date = toDate(value);
  if (!date) return { day: "--", date: "Soon", time: "Schedule pending" };

  return {
    day: date.toLocaleDateString("en-IN", { weekday: "short" }),
    date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function formatUpdated(value) {
  const date = toDate(value);
  if (!date) return "New";
  return `Updated ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
}

function getWeekStart(nowValue = new Date()) {
  const date = new Date(nowValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function sameDay(left, right) {
  if (!left || !right) return false;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getItemDate(item = {}) {
  return (
    toDate(item.updatedAt) ||
    toDate(item.createdAt) ||
    toDate(item.date) ||
    toDate(item.startAt) ||
    toDate(item.scheduleAt)
  );
}

function getContentMeta(item = {}) {
  const section = cleanType(item.section);
  const contentType = cleanType(item.contentType);
  const sourceType = cleanType(item.sourceType);

  if (section.includes("current")) return getMeta("current");
  if (section.includes("mock")) return getMeta("mock");
  if (section.includes("roadmap")) return getMeta("roadmap");
  if (section.includes("video") || contentType.includes("video") || sourceType.includes("youtube")) {
    return getMeta("videos");
  }
  return getMeta("notes");
}

function isChallengeEvent(event = {}) {
  const key = cleanType(event.type || event.typeLabel || event.module || event.section);
  return key === "rankchallenge" || key === "challenge" || key.includes("challenge");
}

function eventToUpdate(event = {}, index = 0) {
  const presentation = getExperienceEventPresentation(event);
  const meta = getMeta(presentation.type);
  const linkedSource = presentation.linkedSource;
  const featured = Boolean(
    event.featured || presentation.status === "live"
  );
  const freshness = getFreshnessState({
    status: presentation.status,
    featured,
    dateValue: getItemDate(event),
  });

  return {
    id: event.id || `event-${index}`,
    type: meta.tone,
    filterKey: getFilterKeyForEvent(presentation),
    sourceType: linkedSource?.sourceType || "",
    title: event.title || "AspireNest learning event",
    description:
      event.description ||
      event.subtitle ||
      event.subject ||
      "Fresh learning update synced from AspireNest Experience events.",
    updated: presentation.statusLabel,
    route: presentation.primaryCta.route,
    cta: presentation.primaryCta.label,
    source: presentation.typeLabel,
    plan: event.planType || "FREE",
    featured,
    isFresh: freshness.isFresh,
    freshnessLabel: freshness.label,
    sortAt: getItemDate(event)?.getTime() || 0,
    dedupeKey: linkedSource
      ? buildExperienceLinkedSourceKey(
          linkedSource.sourceType,
          linkedSource.sourceId
        )
      : "",
  };
}
function contentToUpdate(item = {}, index = 0) {
  const meta = getContentMeta(item);
  const sourceType = getExperienceSourceItemType(item);
  const featured = Boolean(item.featured);
  const freshness = getFreshnessState({
    featured,
    dateValue: item.updatedAt || item.createdAt || item.date,
  });

  return {
    id: item.id || `content-${index}`,
    type: meta.tone,
    filterKey: getFilterKeyForSourceType(sourceType, meta.tone),
    sourceType,
    title: item.title || item.name || "AspireNest content update",
    description:
      item.description ||
      item.chapter ||
      item.subject ||
      item.month ||
      "New learning resource published in AspireNest.",
    updated: formatUpdated(item.updatedAt || item.createdAt || item.date),
    route: getSafeSourceRoute(sourceType, item, meta.route),
    cta:
      meta.tone === "videos"
        ? "Watch"
        : meta.tone === "mock"
          ? "Start"
          : "Open",
    source: meta.label,
    plan: item.planType || item.type || "FREE",
    featured,
    isFresh: freshness.isFresh,
    freshnessLabel: freshness.label,
    sortAt: getItemDate(item)?.getTime() || 0,
    dedupeKey:
      sourceType && item.id
        ? buildExperienceLinkedSourceKey(sourceType, item.id)
        : "",
  };
}
function currentAffairToUpdate(item = {}, index = 0) {
  const meta = getMeta("current");
  const sourceType = "currentAffairs";
  const featured = Boolean(item.featured);
  const freshness = getFreshnessState({
    featured,
    dateValue: item.updatedAt || item.createdAt || item.date,
  });

  return {
    id: item.id || `current-${index}`,
    type: meta.tone,
    filterKey: "current",
    sourceType,
    title: item.title || item.month || "Current Affairs update",
    description:
      item.description ||
      item.month ||
      "Latest current affairs material is ready for revision.",
    updated: formatUpdated(item.updatedAt || item.createdAt || item.date),
    route: getSafeSourceRoute(sourceType, item, meta.route),
    cta: "Read",
    source: meta.label,
    plan: item.planType || item.type || "FREE",
    featured,
    isFresh: freshness.isFresh,
    freshnessLabel: freshness.label,
    sortAt: getItemDate(item)?.getTime() || 0,
    dedupeKey: item.id
      ? buildExperienceLinkedSourceKey(sourceType, item.id)
      : "",
  };
}
function getLeaderboardScore(entry = {}) {
  return Number(entry.percentage || entry.accuracy || entry.rankScore || 0);
}

function maskLeaderboardName(entry = {}) {
  const raw = String(entry.studentName || entry.studentEmail || entry.email || "Student").trim();
  const email = String(entry.studentEmail || entry.email || "").trim();

  if (raw.includes("@")) {
    const [name = "student"] = raw.split("@");
    return `${name.slice(0, 2)}***`;
  }

  if (email && raw === email) {
    const [name = "student"] = email.split("@");
    return `${name.slice(0, 2)}***`;
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (!parts.length) return "Student";
  if (parts.length === 1) return parts[0].length > 8 ? `${parts[0].slice(0, 6)}…` : parts[0];

  return `${parts[0]} ${parts[1][0] || ""}.`.trim();
}

function formatActivityTime(value) {
  const date = toDate(value);
  if (!date) return "Recently";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityTimestamp(value) {
  return toDate(value)?.getTime() || 0;
}

function isRecentActivityTime(value, windowDays = 45) {
  const time = getActivityTimestamp(value);
  if (!time) return false;
  return Date.now() - time <= windowDays * 24 * 60 * 60 * 1000 || time > Date.now();
}

function isOwnLeaderboardEntry(entry = {}, user = null) {
  const email = String(user?.email || "").toLowerCase();
  if (!email) return false;

  return [entry.studentEmail, entry.email]
    .map((value) => String(value || "").toLowerCase())
    .includes(email);
}

function dedupeItems(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const key = String(
      item.dedupeKey ||
        [item.id, item.route, item.title]
          .filter(Boolean)
          .join("|")
    ).toLowerCase();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function CtetLiveContentCenter({
  events = [],
  upcomingEvents = [],
  contentItems = [],
  currentAffairs = [],
  loading = false,
  mockLeaderboardEntries = [],
  user = null,
  navigate,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTvIndex, setActiveTvIndex] = useState(0);
  const [tvPaused, setTvPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const allUpdates = useMemo(() => {
    const eventItems = (Array.isArray(events) ? events : []).map(eventToUpdate);
    const moduleItems = (Array.isArray(contentItems) ? contentItems : [])
      .filter((item) => ["published", "live"].includes(String(item.status || "published").toLowerCase()))
      .map(contentToUpdate);
    const currentItems = (Array.isArray(currentAffairs) ? currentAffairs : []).map(currentAffairToUpdate);

    const merged = dedupeItems([...eventItems, ...moduleItems, ...currentItems])
      .sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || b.sortAt - a.sortAt);

    return merged.slice(0, 12);
  }, [contentItems, currentAffairs, events]);

  const visibleUpdates = useMemo(() => {
    if (activeFilter === "all") return allUpdates;

    return allUpdates.filter(
      (item) => item.filterKey === activeFilter
    );
  }, [activeFilter, allUpdates]);

  const leaderboardSnapshot = useMemo(() => {
    const source = Array.isArray(mockLeaderboardEntries) ? mockLeaderboardEntries : [];
    const ranked = [...source]
      .filter((entry) => getLeaderboardScore(entry) > 0)
      .sort(
        (a, b) =>
          getLeaderboardScore(b) - getLeaderboardScore(a) ||
          Number(b.score || 0) - Number(a.score || 0)
      )
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        displayName: maskLeaderboardName(entry),
        scoreLabel: `${getLeaderboardScore(entry)}%`,
        isOwn: isOwnLeaderboardEntry(entry, user),
      }));

    return {
      top: ranked.slice(0, 3),
      own: ranked.find((entry) => entry.isOwn) || null,
      total: ranked.length,
    };
  }, [mockLeaderboardEntries, user]);

  const recentActivityItems = useMemo(() => {
    const activity = [];

    (Array.isArray(mockLeaderboardEntries) ? mockLeaderboardEntries : []).forEach((entry, index) => {
      const activityAt =
        entry.attemptSubmittedAt ||
        entry.createdAt ||
        entry.updatedAt ||
        entry.endedAt;

      if (!isRecentActivityTime(activityAt)) return;

      activity.push({
        id: `rank-${entry.id || entry.leaderboardKey || index}`,
        tone: "rank",
        badge: "RANK",
        actor: maskLeaderboardName(entry),
        title: `${maskLeaderboardName(entry)} joined the ranking board`,
        description: `${entry.testTitle || entry.subject || "Mock Test"} • ${getLeaderboardScore(entry)}%`,
        time: formatActivityTime(activityAt),
        sortAt: getActivityTimestamp(activityAt),
        route: "/leaderboard",
      });
    });

    (Array.isArray(events) ? events : []).forEach((event, index) => {
      const activityAt =
        event.updatedAt ||
        event.createdAt ||
        event.startAt ||
        event.scheduleAt;

      if (!isRecentActivityTime(activityAt)) return;

      const presentation = getExperienceEventPresentation(event);
      const meta = getMeta(presentation.type);
      const linkedSource = presentation.linkedSource;
      activity.push({
        id: `event-${event.id || index}`,
        tone: meta.tone,
        badge: presentation.typeLabel,
        actor: "AspireNest Team",
        title:
          presentation.status === "live"
            ? `${presentation.typeLabel} is live`
            : `${presentation.typeLabel} published`,
        description: event.title || event.subject || "AspireNest event update",
        time: formatActivityTime(activityAt),
        sortAt: getActivityTimestamp(activityAt),
        route: presentation.primaryCta.route,
        dedupeKey:
          linkedSource?.sourceType && linkedSource?.sourceId
            ? buildExperienceLinkedSourceKey(
                linkedSource.sourceType,
                linkedSource.sourceId
              )
            : "",
      });
    });

    (Array.isArray(contentItems) ? contentItems : [])
      .filter((item) => ["published", "live"].includes(String(item.status || "published").toLowerCase()))
      .forEach((item, index) => {
        const activityAt = item.updatedAt || item.createdAt || item.date;
        if (!isRecentActivityTime(activityAt)) return;

        const meta = getContentMeta(item);
        const sourceType = getExperienceSourceItemType(item);
        activity.push({
          id: `content-${item.id || index}`,
          tone: meta.tone,
          badge: meta.label,
          actor: "AspireNest Team",
          title: `${meta.label} published`,
          description: item.title || item.subject || item.chapter || "New learning resource",
          time: formatActivityTime(activityAt),
          sortAt: getActivityTimestamp(activityAt),
          route: getSafeSourceRoute(sourceType, item, meta.route),
          dedupeKey:
            sourceType && item.id
              ? buildExperienceLinkedSourceKey(sourceType, item.id)
              : "",
        });
      });

    (Array.isArray(currentAffairs) ? currentAffairs : []).forEach((item, index) => {
      const activityAt = item.updatedAt || item.createdAt || item.date;
      if (!isRecentActivityTime(activityAt)) return;

      activity.push({
        id: `current-${item.id || index}`,
        tone: "current",
        badge: "Current Affairs",
        actor: "AspireNest Team",
        title: "Current Affairs updated",
        description: item.title || item.month || "Latest current affairs material",
        time: formatActivityTime(activityAt),
        sortAt: getActivityTimestamp(activityAt),
        route: getSafeSourceRoute(
          "currentAffairs",
          item,
          "/ctet-tet/current-affairs"
        ),
        dedupeKey: item.id
          ? buildExperienceLinkedSourceKey("currentAffairs", item.id)
          : "",
      });
    });

    return dedupeItems(activity)
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 6);
  }, [contentItems, currentAffairs, events, mockLeaderboardEntries]);

  const challengeItems = useMemo(() => {
    const source = Array.isArray(events) ? events : [];
    return source
      .filter(isChallengeEvent)
      .slice(0, 3)
      .map((event, index) => {
        const presentation = getExperienceEventPresentation(event);
        const dateParts = formatDateParts(
          presentation.timing?.scheduleAt ||
            event.startAt ||
            event.scheduleAt ||
            event.createdAt
        );

        return {
          id: event.id || `challenge-${index}`,
          eyebrow: presentation.headlineLabel,
          scheduleLabel:
            presentation.timing?.scheduleLabel || "Schedule",
          title: event.title || "AspireNest Rank Challenge",
          description:
            event.description ||
            event.subject ||
            "Join the active CTET/TET challenge and test your preparation with the community.",
          subject: event.subject || "CTET/TET",
          plan: event.planType || "FREE",
          time: dateParts.time,
          date: dateParts.date,
          cta: presentation.primaryCta.label,
          route: presentation.primaryCta.route,
          featured: index === 0 || Boolean(event.featured),
        };
      });
  }, [events]);

  const weekItems = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const source = Array.isArray(upcomingEvents) && upcomingEvents.length ? upcomingEvents : events;
    const weekEvents = (Array.isArray(source) ? source : [])
      .map((event) => ({ ...event, startDate: toDate(event.startAt || event.scheduleAt || event.createdAt) }))
      .filter((event) => event.startDate);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dayEvents = weekEvents.filter((event) => sameDay(event.startDate, date));
      const firstEvent = dayEvents[0];
      const presentation = firstEvent
        ? getExperienceEventPresentation(firstEvent)
        : null;
      const meta = presentation
        ? getMeta(presentation.type)
        : getMeta("announcement");
      const slotDateParts = formatDateParts(date);
      const scheduleDateParts = formatDateParts(
        presentation?.timing?.scheduleAt ||
          firstEvent?.startAt ||
          date
      );
      const scheduleTimeLabel =
        presentation?.status === "live" &&
        presentation?.timing?.scheduleAt
          ? `${presentation.timing.scheduleLabel} ${scheduleDateParts.date}, ${scheduleDateParts.time}`
          : scheduleDateParts.time;

      if (!firstEvent) {
        return {
          id: `week-empty-${index}`,
          today: sameDay(date, now) ? "TODAY" : "",
          day: date.toLocaleDateString("en-IN", { weekday: "short" }),
          date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          time: "Open slot",
          title: "No event planned yet",
          subtitle: "Follow the roadmap while the next live class, mock test, or workshop is being scheduled.",
          type: "roadmap",
          label: "Open Slot",
          cta: "Open Roadmap",
          route: "/ctet-tet/roadmaps",
          empty: true,
        };
      }

      return {
        id: firstEvent.id || `week-${index}`,
        today: sameDay(date, now) ? "TODAY" : "",
        day: slotDateParts.day,
        date: slotDateParts.date,
        time: scheduleTimeLabel,
        title: dayEvents.length > 1 ? `${dayEvents.length} events scheduled` : firstEvent.title || "AspireNest weekly learning event",
        subtitle: firstEvent.description || firstEvent.subject || "Auto-synced learning schedule",
        type: meta.tone,
        label: dayEvents.length > 1 ? "Multiple" : presentation.typeLabel,
        cta: presentation.primaryCta.label,
        route: presentation.primaryCta.route,
      };
    });
  }, [events, upcomingEvents]);

  const featured = visibleUpdates[0] || null;
  const remainingUpdates = visibleUpdates.slice(1, 5);
  const activeFilterDetails = getFilterDetails(activeFilter);

  const tvItems = useMemo(() => {
    const eventItems = (events || []).slice(0, 4).map((event, index) => {
      const presentation = getExperienceEventPresentation(event);
      return {
        id: `tv-event-${event.id || event.title || index}`,
        type: presentation.type,
        eyebrow: presentation.statusLabel.toUpperCase(),
        title: event.title || "AspireNest learning event",
        description: event.description || event.subject || "Academy update for CTET/TET learners.",
        cta: presentation.primaryCta.label,
        route: presentation.primaryCta.route,
      };
    });

    const updateItems = allUpdates.slice(0, 5).map((item) => ({
      id: `tv-update-${item.id}`,
      type: item.type,
      eyebrow: item.empty ? "NEEDS PUBLISH" : item.source || "WHAT'S NEW",
      title: item.title,
      description: item.description,
      cta: item.cta,
      route: item.route,
    }));

    const weekSpotlight = weekItems.find((item) => !item.empty) || weekItems.find((item) => item.today);
    const weekItemsForTv = weekSpotlight
      ? [
          {
            id: `tv-week-${weekSpotlight.id}`,
            type: weekSpotlight.type,
            eyebrow: weekSpotlight.today || "THIS WEEK",
            title: weekSpotlight.title,
            description: weekSpotlight.subtitle,
            cta: weekSpotlight.cta,
            route: weekSpotlight.route,
          },
        ]
      : [];

    const mergedTvItems = [...eventItems, ...updateItems, ...weekItemsForTv];
    const seenTvItems = new Set();

    return mergedTvItems
      .filter((item) => {
        const key = [item.title, item.route].filter(Boolean).join("|").toLowerCase();
        if (!key) return true;
        if (seenTvItems.has(key)) return false;
        seenTvItems.add(key);
        return true;
      })
      .slice(0, 6);
  }, [allUpdates, events, weekItems]);

  useEffect(() => {
    setActiveTvIndex((current) => (tvItems[current] ? current : 0));
  }, [tvItems]);

  useEffect(() => {
    if (tvPaused || tvItems.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveTvIndex((current) => (current + 1) % tvItems.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [tvItems.length, tvPaused]);

  const moveTv = (direction) => {
    if (tvItems.length < 2) return;
    setActiveTvIndex((current) => (current + direction + tvItems.length) % tvItems.length);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX == null) return;
    const delta = event.changedTouches[0]?.clientX - touchStartX;
    setTouchStartX(null);
    setTvPaused(false);

    if (Math.abs(delta) < 42) return;
    moveTv(delta > 0 ? -1 : 1);
  };

  const hasLiveEvent = useMemo(
    () =>
      (Array.isArray(events) ? events : []).some(
        (event) =>
          getExperienceEventPresentation(event).status ===
          "live"
      ),
    [events]
  );

  return (
    <section className="ctetS4LiveContentCenter" id="live-content-center">
      <div className="ctetS4BgGrid" />
      <div className="ctetS4Shell">
        <div className="ctetS4Hero">
          <div>
            <span className="ctetS4Eyebrow">Live Community Center</span>
            <h2>
              Community Pulse & <span>This Week</span>
            </h2>
            <p>
              Rank challenges, leaderboard movement, real academy activity, fresh updates, and weekly learning schedule in one premium screen.
            </p>
          </div>

          <div className="ctetS4SyncCard">
            <span>SYNC</span>
            <div>
              <strong>{loading
                ? "Syncing Updates"
                : hasLiveEvent
                  ? "Live Event Active"
                  : "Updates Synced"}</strong>
              <small>Synced from Notes, Mock Tests, Videos, Current Affairs, Roadmaps, and Experience events</small>
            </div>
          </div>
        </div>

        <div className="ctetS4TvStrip" aria-label="AspireNest TV">
          <div className="ctetS4TvIntro">
            <span>AspireNest TV</span>
            <h3>Live academy spotlight</h3>
            <p>Featured classes, mock tests, mentor updates, and fresh learning signals in one premium strip.</p>
            {tvItems.length > 1 ? (
              <div className="ctetS4TvControls" aria-label="AspireNest TV controls">
                <button type="button" onClick={() => moveTv(-1)} aria-label="Previous AspireNest TV item">
                  Prev
                </button>
                <strong>{activeTvIndex + 1} / {tvItems.length}</strong>
                <button type="button" onClick={() => moveTv(1)} aria-label="Next AspireNest TV item">
                  Next
                </button>
              </div>
            ) : null}
          </div>

          <div
            className="ctetS4TvRail"
            onMouseEnter={() => setTvPaused(true)}
            onMouseLeave={() => setTvPaused(false)}
            onFocus={() => setTvPaused(true)}
            onBlur={() => setTvPaused(false)}
            onTouchStart={(event) => {
              setTvPaused(true);
              setTouchStartX(event.touches[0]?.clientX ?? null);
            }}
            onTouchEnd={handleTouchEnd}
          >
            {tvItems.map((item, tvIndex) => {
              const meta = getMeta(item.type);
              const isActive = tvIndex === activeTvIndex;
              return (
                <button
                  type="button"
                  className={`ctetS4TvCard ${isActive ? "isFeatured isActive" : ""}`.trim()}
                  key={item.id}
                  onClick={() => openTarget(navigate, item.route)}
                  aria-current={isActive ? "true" : undefined}
                >
                  <b className={"ctetS4TypePill is-" + meta.tone}>{item.eyebrow}</b>
                  <span className={"ctetS4IconBox is-" + meta.tone}>{meta.icon}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                  <strong>{item.cta} ›</strong>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ctetS4CommunityPulseGrid" aria-label="AspireNest community pulse">
        <div className="ctetS4ChallengeSpotlight" aria-label="AspireNest challenge spotlight">
          <div className="ctetS4ChallengeIntro">
            <span>COMMUNITY CHALLENGE</span>
            <h3>Rank Challenge Arena</h3>
            <p>Weekly CTET/TET challenges, mock battles, and rank-focused practice will appear here from real Experience Studio events.</p>
          </div>

          <div className="ctetS4ChallengeRail">
            {challengeItems.length ? (
              challengeItems.map((item) => (
                <button
                  type="button"
                  className={`ctetS4ChallengeCard ${item.featured ? "isFeatured" : ""} ${challengeItems.length === 1 ? "isSingle" : ""}`.trim()}
                  key={item.id}
                  onClick={() => openTarget(navigate, item.route)}
                >
                  <b>{item.eyebrow}</b>
                  <div>
                    <span>{item.subject}</span>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <small>{item.scheduleLabel} {item.date} • {item.time} • {item.plan}</small>
                  </div>
                  <strong>{item.cta} ›</strong>
                </button>
              ))
            ) : (
              <div className="ctetS4ChallengeEmpty">
                <b>Challenge schedule soon</b>
                <h4>No active rank challenge published yet</h4>
                <p>Create a Rank Challenge from Admin → Experience Studio. It will appear here without touching code.</p>
                <button type="button" onClick={() => navigate("/ctet-tet/mock-tests")}>
                  Practice Mock Tests ›
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ctetS4LeaderboardSnapshot" aria-label="AspireNest leaderboard snapshot">
          <div className="ctetS4LeaderboardIntro">
            <span>LEADERBOARD SNAPSHOT</span>
            <h3>Top Rankers This Week</h3>
            <p>Privacy-safe rank snapshot from leaderboard-enabled mock test attempts.</p>
          </div>

          <div className="ctetS4LeaderboardCards">
            {leaderboardSnapshot.top.length ? (
              leaderboardSnapshot.top.map((entry) => (
                <button
                  type="button"
                  className={`ctetS4LeaderboardCard ${entry.rank === 1 ? "isTop" : ""} ${entry.isOwn ? "isOwn" : ""}`.trim()}
                  key={entry.id || entry.leaderboardKey || entry.rank}
                  onClick={() => navigate("/leaderboard")}
                >
                  <b>#{entry.rank}</b>
                  <div>
                    <strong>{entry.displayName}</strong>
                    <span>{entry.testTitle || entry.subject || "Mock Test"}</span>
                  </div>
                  <em>{entry.scoreLabel}</em>
                </button>
              ))
            ) : (
              <div className="ctetS4LeaderboardEmpty">
                <b>No public ranks yet</b>
                <span>Ranks will appear after students submit leaderboard-enabled mock tests.</span>
              </div>
            )}
          </div>

          <div className="ctetS4LeaderboardAction">
            {leaderboardSnapshot.own ? (
              <p>Your rank: <strong>#{leaderboardSnapshot.own.rank}</strong> • {leaderboardSnapshot.own.scoreLabel}</p>
            ) : (
              <p>{leaderboardSnapshot.total} ranked entries • full emails hidden</p>
            )}
            <button type="button" onClick={() => navigate("/leaderboard")}>
              View Full Leaderboard ›
            </button>
          </div>
        </div>

        <div className="ctetS4ActivityFeed" aria-label="Recent AspireNest activity feed">
          <div className="ctetS4ActivityIntro">
            <span>LIVE ACTIVITY</span>
            <h3>Recent Academy Activity</h3>
            <p>Real recent actions from mock attempts, published content, current affairs, and admin-created events.</p>
          </div>

          <div className="ctetS4ActivityList">
            {recentActivityItems.length ? (
              recentActivityItems.map((item) => (
                <button
                  type="button"
                  className={`ctetS4ActivityRow is-${item.tone}`}
                  key={item.id}
                  onClick={() => openTarget(navigate, item.route)}
                >
                  <b>{item.badge}</b>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                  <small>{item.time}</small>
                </button>
              ))
            ) : (
              <div className="ctetS4ActivityEmpty">
                <b>No recent public activity yet</b>
                <span>Fresh activity will appear after real mock attempts, event publishes, or new content updates.</span>
              </div>
            )}
          </div>
        </div>

        </div>

        <div className="ctetS4Grid">
          <article
            className={`ctetS4Panel ctetS4WhatsNewPanel ${
              featured ? "" : "isEmpty"
            }`.trim()}
          >
            <div className="ctetS4PanelHead">
              <div className="ctetS4PanelTitle">
                <span>NEW</span>
                <div>
                  <h3>What's New</h3>
                  <p>Latest updates across all modules</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/ctet-tet/courses")}>
                View All Updates <b>›</b>
              </button>
            </div>

            <div className="ctetS4Tabs" role="tablist" aria-label="Content filters">
              {filters.map(([value, label, icon]) => (
                <button
                  type="button"
                  role="tab"
                  key={value}
                  id={`ctet-s4-filter-${value}`}
                  aria-selected={activeFilter === value}
                  aria-controls="ctet-s4-whats-new-results"
                  className={activeFilter === value ? "isActive" : ""}
                  onClick={() => setActiveFilter(value)}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div
              id="ctet-s4-whats-new-results"
              className="ctetS4WhatsNewResults"
              role="tabpanel"
              aria-labelledby={`ctet-s4-filter-${activeFilter}`}
            >
              {featured ? (
                <>
                  <button
                    type="button"
                    className="ctetS4FeaturedUpdate"
                    onClick={() => openTarget(navigate, featured.route)}
                  >
                    <span className="ctetS4FeaturedRibbon">
                      {featured.freshnessLabel === "LIVE"
                        ? "Live Update"
                        : featured.featured
                          ? "Featured Update"
                          : "Latest Update"}
                    </span>
                    <i>{getMeta(featured.type).icon}</i>
                    <div>
                      <b
                        className={`ctetS4TypePill is-${
                          getMeta(featured.type).tone
                        }`}
                      >
                        {featured.source ||
                          getMeta(featured.type).label}
                      </b>
                      {featured.plan ? (
                        <b className="ctetS4PlanPill">
                          {featured.plan}
                        </b>
                      ) : null}
                      <h4>{featured.title}</h4>
                      <p>{featured.description}</p>
                      <small>{featured.updated}</small>
                    </div>
                    <strong>{featured.cta} ↗</strong>
                    <em>{featured.freshnessLabel}</em>
                  </button>

                  {remainingUpdates.length ? (
                    <div className="ctetS4UpdateList">
                      {remainingUpdates.map((item) => {
                        const meta = getMeta(item.type);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            className="ctetS4UpdateRow"
                            onClick={() =>
                              openTarget(navigate, item.route)
                            }
                          >
                            <span
                              className={`ctetS4IconBox is-${meta.tone}`}
                            >
                              {meta.icon}
                            </span>
                            <div>
                              <b
                                className={`ctetS4TypePill is-${meta.tone}`}
                              >
                                {item.source || meta.label}
                              </b>
                              {item.plan ? (
                                <b className="ctetS4PlanPill">
                                  {item.plan}
                                </b>
                              ) : null}
                              <h4>{item.title}</h4>
                              <p>{item.description}</p>
                            </div>
                            <small>{item.updated}</small>
                            <strong>{item.cta} ›</strong>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ctetS4WhatsNewSingleNote">
                      <strong>Latest matching update shown</strong>
                      <span>
                        More published updates will appear here automatically.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="ctetS4WhatsNewEmpty">
                  <span aria-hidden="true">
                    {activeFilterDetails.icon}
                  </span>
                  <strong>{activeFilterDetails.emptyTitle}</strong>
                  <p>{activeFilterDetails.emptyText}</p>
                  <button
                    type="button"
                    onClick={() =>
                      openTarget(
                        navigate,
                        activeFilterDetails.route
                      )
                    }
                  >
                    {activeFilterDetails.cta} ›
                  </button>
                </div>
              )}
            </div>
          </article>

          <article className="ctetS4Panel ctetS4WeekPanel">
            <div className="ctetS4PanelHead">
              <div className="ctetS4PanelTitle">
                <span>WEEK</span>
                <div>
                  <h3>This Week</h3>
                  <p>Current Mon-Sun learning plan</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/ctet-tet/roadmaps")}>
                Weekly Calendar
              </button>
            </div>

            <div className="ctetS4WeekList">
              {weekItems.map((item) => {
                const meta = getMeta(item.type);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`${item.today ? "ctetS4WeekRow isToday" : "ctetS4WeekRow"} ${item.empty ? "isEmpty" : ""}`.trim()}
                    onClick={() => openTarget(navigate, item.route)}
                  >
                    <div className="ctetS4DateBlock">
                      {item.today && <small>{item.today}</small>}
                      <strong>{item.day}</strong>
                      <span>{item.date}</span>
                    </div>
                    <i />
                    <div className="ctetS4WeekInfo">
                      <small>{item.time}</small>
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>
                    <b className={`ctetS4TypePill is-${meta.tone}`}>{item.label}</b>
                    <strong>{item.cta} ›</strong>
                  </button>
                );
              })}
            </div>

            <div className="ctetS4FooterNote">
              <span>OK</span>
              <p>Completed, cancelled, expired, and archived events stay out of the public week plan.</p>
              <small>No-event days remain useful and clean.</small>
            </div>
          </article>
        </div>

        <div className="ctetS4BottomTrust">
          <strong>Always Updated. Always Relevant.</strong>
          <span>We bring you the latest so you can stay ahead.</span>
        </div>
      </div>
    </section>
  );
}
