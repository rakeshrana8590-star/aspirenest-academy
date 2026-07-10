import {
  EXPERIENCE_CTA_TYPES,
  EXPERIENCE_EVENT_STATUS,
  EXPERIENCE_EVENT_TYPES,
} from "./experienceConstants";
import {
  getExperienceDate,
  normalizeExperienceEvent,
  normalizeExperienceText,
} from "./experienceEventUtils";
import {
  EXPERIENCE_NOTIFICATION_SOURCE_TYPES,
  getExperienceEventLinkedSource,
  getExperienceSourceRoute,
} from "./experienceNotificationSourceUtils";

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_PRESENTATION = Object.freeze({
  [EXPERIENCE_EVENT_STATUS.DRAFT]: {
    label: "Draft",
    tone: "neutral",
  },
  [EXPERIENCE_EVENT_STATUS.SCHEDULED]: {
    label: "Upcoming",
    tone: "upcoming",
  },
  [EXPERIENCE_EVENT_STATUS.PUBLISHED]: {
    label: "Available",
    tone: "published",
  },
  [EXPERIENCE_EVENT_STATUS.LIVE]: {
    label: "Live Now",
    tone: "live",
  },
  [EXPERIENCE_EVENT_STATUS.COMPLETED]: {
    label: "Completed",
    tone: "completed",
  },
  [EXPERIENCE_EVENT_STATUS.CANCELLED]: {
    label: "Cancelled",
    tone: "cancelled",
  },
  [EXPERIENCE_EVENT_STATUS.EXPIRED]: {
    label: "Expired",
    tone: "expired",
  },
  [EXPERIENCE_EVENT_STATUS.ARCHIVED]: {
    label: "Archived",
    tone: "neutral",
  },
});

const TYPE_PRESENTATION = Object.freeze({
  [EXPERIENCE_EVENT_TYPES.LIVE_CLASS]: {
    icon: "LIVE",
    tone: "live",
    primaryLive: "Join Live Class",
    primaryDefault: "View Class Schedule",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
    secondaryLabel: "View Classes",
  },

  [EXPERIENCE_EVENT_TYPES.MOCK_TEST]: {
    icon: "MT",
    tone: "mock",
    primaryLive: "Start Mock Test",
    primaryDefault: "View Mock Test",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST,
    secondaryLabel: "View Mock Tests",
  },

  [EXPERIENCE_EVENT_TYPES.RANK_CHALLENGE]: {
    icon: "RK",
    tone: "mock",
    primaryLive: "Join Challenge",
    primaryDefault: "View Challenge",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.MOCK_TEST,
    secondaryLabel: "View Mock Tests",
  },

  [EXPERIENCE_EVENT_TYPES.MARATHON]: {
    icon: "MR",
    tone: "live",
    primaryLive: "Join Marathon",
    primaryDefault: "View Marathon",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
    secondaryLabel: "View Classes",
  },

  [EXPERIENCE_EVENT_TYPES.DOUBT_SESSION]: {
    icon: "Q",
    tone: "mentor",
    primaryLive: "Join Doubt Session",
    primaryDefault: "View Session",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
    secondaryLabel: "View Classes",
  },

  [EXPERIENCE_EVENT_TYPES.WEBINAR]: {
    icon: "WB",
    tone: "live",
    primaryLive: "Join Webinar",
    primaryDefault: "View Webinar",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
    secondaryLabel: "View Classes",
  },

  [EXPERIENCE_EVENT_TYPES.WORKSHOP]: {
    icon: "WS",
    tone: "live",
    primaryLive: "Join Workshop",
    primaryDefault: "View Workshop",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
    secondaryLabel: "View Classes",
  },

  [EXPERIENCE_EVENT_TYPES.REVISION]: {
    icon: "RV",
    tone: "revision",
    primaryLive: "Start Revision",
    primaryDefault: "View Revision",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.NOTES,
    secondaryLabel: "View Notes",
  },

  [EXPERIENCE_EVENT_TYPES.SPECIAL_SESSION]: {
    icon: "SP",
    tone: "featured",
    primaryLive: "Join Special Session",
    primaryDefault: "View Special Session",
    sourceType:
      EXPERIENCE_NOTIFICATION_SOURCE_TYPES.VIDEO,
    secondaryLabel: "View Classes",
  },

  [EXPERIENCE_EVENT_TYPES.ANNOUNCEMENT]: {
    icon: "!",
    tone: "announcement",
    primaryLive: "View Announcement",
    primaryDefault: "View Announcement",
    sourceType: "",
    secondaryLabel: "Learning Hub",
  },
});

const cleanText = (value = "") =>
  normalizeExperienceText(value);

const INTERNAL_EVENT_ROUTE_HOSTS = new Set([
  "aspirenestacademy.in",
  "www.aspirenestacademy.in",
  "aspirenest-academy.vercel.app",
  "localhost",
  "127.0.0.1",
]);

const isHttpRoute = (route = "") =>
  /^https?:\/\//i.test(cleanText(route));

const getRouteUrl = (route = "") => {
  const normalized = cleanText(route);
  if (!normalized || !isHttpRoute(normalized)) return null;

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
};

const getCurrentEventHost = () => {
  if (typeof window === "undefined") return "";

  return cleanText(window.location?.hostname).toLowerCase();
};

const isInternalEventRoute = (route = "") => {
  const normalized = cleanText(route);
  if (!normalized) return false;
  if (normalized.startsWith("/")) return true;

  const parsed = getRouteUrl(normalized);
  if (!parsed) return false;

  const hostname = parsed.hostname.toLowerCase();
  const currentHost = getCurrentEventHost();

  return (
    INTERNAL_EVENT_ROUTE_HOSTS.has(hostname) ||
    Boolean(currentHost && hostname === currentHost)
  );
};

const normalizeInternalEventRoute = (route = "") => {
  const normalized = cleanText(route);
  if (!normalized) return "";
  if (normalized.startsWith("/")) return normalized;

  const parsed = getRouteUrl(normalized);
  if (!parsed || !isInternalEventRoute(normalized)) {
    return normalized;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
};

const isExternalRoute = (route = "") =>
  isHttpRoute(route) && !isInternalEventRoute(route);

const getNormalizedEvent = (event = {}) => {
  if (
    event?.type &&
    event?.typeLabel &&
    event?.status &&
    event?.cta
  ) {
    return event;
  }

  return normalizeExperienceEvent(
    event.raw || event
  );
};

const getTypePresentation = (type) =>
  TYPE_PRESENTATION[type] ||
  TYPE_PRESENTATION[
    EXPERIENCE_EVENT_TYPES.ANNOUNCEMENT
  ];

const getModuleRoute = (sourceType) =>
  sourceType
    ? getExperienceSourceRoute(sourceType, {})
    : "/ctet-tet";

const getHeadlineLabel = (
  typeLabel,
  status,
  featured
) => {
  if (status === EXPERIENCE_EVENT_STATUS.LIVE) {
    return `Live ${typeLabel}`;
  }

  if (featured) {
    return `Today’s Featured ${typeLabel}`;
  }

  if (
    status === EXPERIENCE_EVENT_STATUS.SCHEDULED
  ) {
    return `Upcoming ${typeLabel}`;
  }

  return typeLabel;
};

export const getExperienceEventPresentation = (
  event = {}
) => {
  const normalized = getNormalizedEvent(event);
  const typeMeta = getTypePresentation(
    normalized.type
  );

  const statusMeta =
    STATUS_PRESENTATION[normalized.status] ||
    STATUS_PRESENTATION[
      EXPERIENCE_EVENT_STATUS.PUBLISHED
    ];

  const startAt = getExperienceDate(
    normalized.startAt
  );

  const endAt = getExperienceDate(
    normalized.endAt
  );

  const isLive =
    normalized.status ===
    EXPERIENCE_EVENT_STATUS.LIVE;

  const scheduleAt =
    isLive && endAt ? endAt : startAt;

  const countdownAt = isLive ? endAt : startAt;

  const scheduleLabel = isLive
    ? endAt
      ? "Ends"
      : "Started"
    : "Starts";

  const linkedSource =
    getExperienceEventLinkedSource(normalized);

  const linkedRoute = linkedSource
    ? getExperienceSourceRoute(
        linkedSource.sourceType,
        { id: linkedSource.sourceId }
      )
    : "";

  const eventRoute = cleanText(
    normalized.cta?.url ||
      normalized.ctaUrl ||
      normalized.raw?.ctaUrl ||
      normalized.raw?.ctaLink
  );

  /*
   * External meeting/live links must remain primary.
   * For internal routes, exact linked content wins over
   * generic manually entered module routes.
   */
  const primaryRoute = isExternalRoute(eventRoute)
      ? eventRoute
      : linkedRoute ||
        normalizeInternalEventRoute(eventRoute) ||
        getModuleRoute(typeMeta.sourceType);

  const secondarySourceType =
    linkedSource?.sourceType ||
    typeMeta.sourceType;

  const secondaryRoute = getModuleRoute(
    secondarySourceType
  );

  const primaryLabel =
    normalized.status ===
    EXPERIENCE_EVENT_STATUS.LIVE
      ? typeMeta.primaryLive
      : typeMeta.primaryDefault;

  return {
    type: normalized.type,
    typeLabel: normalized.typeLabel,
    status: normalized.status,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    headlineLabel: getHeadlineLabel(
      normalized.typeLabel,
      normalized.status,
      normalized.featured
    ),
    icon: typeMeta.icon,
    tone: typeMeta.tone,
    featured: Boolean(normalized.featured),
    mentorPresence: Boolean(
      normalized.mentorPresence ??
        normalized.raw?.mentorPresence
    ),
    timing: {
      startAt,
      endAt,
      scheduleAt,
      scheduleLabel,
      countdownAt,
      countdownLabel:
        isLive && endAt ? "Ends in" : "Starts in",
      countdownCompletedLabel:
        isLive && endAt
          ? "Ended"
          : isLive
            ? "Live now"
            : "Started",
    },
    linkedSource,
    linkedRoute,
    primaryCta: {
      type:
        normalized.cta?.type ||
        EXPERIENCE_CTA_TYPES.VIEW_DETAILS,
      label: primaryLabel,
      route: primaryRoute,
      external: isExternalRoute(primaryRoute),
    },
    secondaryCta: {
      label: typeMeta.secondaryLabel,
      route: secondaryRoute,
      external: false,
    },
    mentorName:
      cleanText(normalized.mentorName) ||
      "Dr. Varsha D. Maru",
    event: normalized,
  };
};

const getSpotlightRank = (
  event,
  nowMs
) => {
  const startMs =
    getExperienceDate(event.startAt)?.getTime() ||
    Number.MAX_SAFE_INTEGER;

  const startsSoon =
    event.status ===
      EXPERIENCE_EVENT_STATUS.SCHEDULED &&
    startMs >= nowMs &&
    startMs - nowMs <= DAY_MS;

  if (
    event.status === EXPERIENCE_EVENT_STATUS.LIVE
  ) {
    return 0;
  }

  if (event.featured && startsSoon) {
    return 1;
  }

  if (event.featured) {
    return 2;
  }

  if (startsSoon) {
    return 3;
  }

  if (
    event.status ===
    EXPERIENCE_EVENT_STATUS.SCHEDULED
  ) {
    return 4;
  }

  return 5;
};

export const selectExperienceSpotlightEvent = (
  events = [],
  nowValue = new Date()
) => {
  const now =
    getExperienceDate(nowValue) || new Date();

  const nowMs = now.getTime();

  const selectable = (
    Array.isArray(events) ? events : []
  )
    .map((event) =>
      getNormalizedEvent(event)
    )
    .filter((event) =>
      [
        EXPERIENCE_EVENT_STATUS.LIVE,
        EXPERIENCE_EVENT_STATUS.SCHEDULED,
        EXPERIENCE_EVENT_STATUS.PUBLISHED,
      ].includes(event.status)
    );

  return (
    [...selectable]
      .sort((first, second) => {
        const rankDiff =
          getSpotlightRank(first, nowMs) -
          getSpotlightRank(second, nowMs);

        if (rankDiff !== 0) {
          return rankDiff;
        }

        const priorityDiff =
          Number(second.priority || 0) -
          Number(first.priority || 0);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const firstTime =
          getExperienceDate(
            first.startAt
          )?.getTime() ||
          Number.MAX_SAFE_INTEGER;

        const secondTime =
          getExperienceDate(
            second.startAt
          )?.getTime() ||
          Number.MAX_SAFE_INTEGER;

        return firstTime - secondTime;
      })[0] || null
  );
};

export const getExperienceEventContractIssues = (
  event = {}
) => {
  const normalized = getNormalizedEvent(event);
  const typeMeta = getTypePresentation(
    normalized.type
  );

  const linkedSource =
    getExperienceEventLinkedSource(normalized);

  const startAt = getExperienceDate(
    normalized.startAt
  );

  const endAt = getExperienceDate(
    normalized.endAt
  );

  const issues = [];

  if (
    startAt &&
    endAt &&
    endAt.getTime() <= startAt.getTime()
  ) {
    issues.push({
      level: "error",
      code: "END_BEFORE_START",
      message:
        "Event end time must be after start time.",
    });
  }

  if (
    normalized.status ===
      EXPERIENCE_EVENT_STATUS.LIVE &&
    !endAt
  ) {
    issues.push({
      level: "warning",
      code: "LIVE_WITHOUT_END",
      message:
        "A live event without an end time can remain live indefinitely.",
    });
  }

  if (
    linkedSource?.sourceType &&
    typeMeta.sourceType &&
    linkedSource.sourceType !==
      typeMeta.sourceType
  ) {
    issues.push({
      level: "error",
      code: "SOURCE_TYPE_MISMATCH",
      message:
        `${normalized.typeLabel} should link to ` +
        `${typeMeta.sourceType}, not ` +
        `${linkedSource.sourceType}.`,
    });
  }

  return issues;
};
