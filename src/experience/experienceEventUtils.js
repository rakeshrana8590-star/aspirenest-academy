import {
  EXPERIENCE_CTA_TYPES,
  EXPERIENCE_EVENT_STATUS,
  EXPERIENCE_EVENT_TYPE_LABELS,
  EXPERIENCE_EVENT_TYPES,
} from "./experienceConstants";

export const normalizeExperienceText = (value = "") =>
  String(value || "").trim();

export const normalizeExperienceType = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  return Object.values(EXPERIENCE_EVENT_TYPES).includes(normalized)
    ? normalized
    : EXPERIENCE_EVENT_TYPES.ANNOUNCEMENT;
};

export const normalizeExperienceStatus = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return Object.values(EXPERIENCE_EVENT_STATUS).includes(normalized)
    ? normalized
    : EXPERIENCE_EVENT_STATUS.DRAFT;
};

export const getExperienceDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getExperienceEventTypeLabel = (type = "") =>
  EXPERIENCE_EVENT_TYPE_LABELS[normalizeExperienceType(type)] || "Experience";

export const getExperienceEventStatus = (event = {}, nowValue = new Date()) => {
  const manualStatus = normalizeExperienceStatus(event.status);
  const now = getExperienceDate(nowValue) || new Date();
  const startAt = getExperienceDate(event.startAt);
  const endAt = getExperienceDate(event.endAt);

  if (manualStatus === EXPERIENCE_EVENT_STATUS.ARCHIVED) {
    return EXPERIENCE_EVENT_STATUS.ARCHIVED;
  }

  if (manualStatus === EXPERIENCE_EVENT_STATUS.CANCELLED) {
    return EXPERIENCE_EVENT_STATUS.CANCELLED;
  }

  if (manualStatus === EXPERIENCE_EVENT_STATUS.DRAFT) {
    return EXPERIENCE_EVENT_STATUS.DRAFT;
  }

  if (manualStatus === EXPERIENCE_EVENT_STATUS.COMPLETED) {
    return EXPERIENCE_EVENT_STATUS.COMPLETED;
  }

  if (endAt && now > endAt) {
    return EXPERIENCE_EVENT_STATUS.EXPIRED;
  }

  if (startAt && now < startAt) {
    return EXPERIENCE_EVENT_STATUS.SCHEDULED;
  }

  if (startAt && endAt && now >= startAt && now <= endAt) {
    return EXPERIENCE_EVENT_STATUS.LIVE;
  }

  if (manualStatus === EXPERIENCE_EVENT_STATUS.LIVE) {
    return EXPERIENCE_EVENT_STATUS.LIVE;
  }

  if (startAt && !endAt && now >= startAt) {
    return EXPERIENCE_EVENT_STATUS.LIVE;
  }

  return manualStatus || EXPERIENCE_EVENT_STATUS.PUBLISHED;
};

export const isPublicExperienceEvent = (event = {}, nowValue = new Date()) => {
  const status = getExperienceEventStatus(event, nowValue);

  return [
    EXPERIENCE_EVENT_STATUS.SCHEDULED,
    EXPERIENCE_EVENT_STATUS.PUBLISHED,
    EXPERIENCE_EVENT_STATUS.LIVE,
  ].includes(status);
};

export const getExperienceEventCta = (event = {}) => {
  const type = normalizeExperienceType(event.type);
  const status = getExperienceEventStatus(event);

  if (event.ctaType || event.ctaLabel || event.ctaUrl) {
    return {
      type: event.ctaType || EXPERIENCE_CTA_TYPES.VIEW_DETAILS,
      label: event.ctaLabel || "View Details",
      url: event.ctaUrl || "",
    };
  }

  if (type === EXPERIENCE_EVENT_TYPES.LIVE_CLASS) {
    return {
      type: EXPERIENCE_CTA_TYPES.JOIN_LIVE,
      label: status === EXPERIENCE_EVENT_STATUS.LIVE ? "Join Live" : "View Schedule",
      url: event.joinUrl || event.liveUrl || event.ctaUrl || "",
    };
  }

  if (type === EXPERIENCE_EVENT_TYPES.MOCK_TEST) {
    return {
      type: EXPERIENCE_CTA_TYPES.START_MOCK,
      label: "Open Mock Test",
      url: event.mockTestUrl || event.ctaUrl || "",
    };
  }

  return {
    type: EXPERIENCE_CTA_TYPES.VIEW_DETAILS,
    label: "View Details",
    url: event.ctaUrl || "",
  };
};

export const normalizeExperienceEvent = (event = {}) => {
  const type = normalizeExperienceType(event.type);
  const status = getExperienceEventStatus(event);

  return {
    id: event.id || "",
    title: normalizeExperienceText(event.title),
    description: normalizeExperienceText(event.description),
    type,
    typeLabel: getExperienceEventTypeLabel(type),
    status,
    subject: normalizeExperienceText(event.subject),
    chapter: normalizeExperienceText(event.chapter),
    mentorName: normalizeExperienceText(event.mentorName),
    planType: normalizeExperienceText(event.planType || "FREE"),
    startAt: event.startAt || null,
    endAt: event.endAt || null,
    priority: Number(event.priority || 0),
    featured: Boolean(event.featured),
    cta: getExperienceEventCta(event),
    sourceType: normalizeExperienceText(event.sourceType),
    sourceId: normalizeExperienceText(event.sourceId),
    raw: event,
  };
};

export const sortExperienceEvents = (events = []) =>
  [...events].sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;

    if (aFeatured !== bFeatured) return bFeatured - aFeatured;

    const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;

    const aTime = getExperienceDate(a.startAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    const bTime = getExperienceDate(b.startAt)?.getTime() || Number.MAX_SAFE_INTEGER;

    return aTime - bTime;
  });
