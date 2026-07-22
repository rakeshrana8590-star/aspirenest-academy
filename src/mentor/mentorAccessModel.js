import {
  canAccessContent,
  isAccessActive,
  isAccessExpired,
  normalizeAccessPlan,
} from "../access/accessUtils";
import {
  MENTOR_RESOURCE_ACCESS_MAP,
  MENTOR_RESOURCE_ACCESS_STATES,
  MENTOR_RESOURCE_TYPES,
} from "./mentorConstants";

const cleanString = (value = "") => String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const firstValue = (...values) =>
  values.map(cleanString).find(Boolean) || "";

const toDate = (value) => {
  if (!value) return null;
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isSafeMentorRoute = (route = "") => {
  const value = cleanString(route);
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(value)
  );
};

export const inferMentorResourceType = (resource = {}) => {
  const explicit = normalizeText(
    resource.resourceType ||
      resource.itemType ||
      resource.section ||
      resource.type ||
      resource.kind ||
      resource.contentType
  );

  if (["notes", "note", "notespdf", "subjectpdf"].includes(explicit)) {
    return MENTOR_RESOURCE_TYPES.NOTES;
  }

  if (["video", "recordedvideo", "recordedclass"].includes(explicit)) {
    return MENTOR_RESOURCE_TYPES.VIDEO;
  }

  if (["live", "liveclass", "replay"].includes(explicit)) {
    return MENTOR_RESOURCE_TYPES.LIVE;
  }

  if (["mock", "mocktest", "mocktests", "mockpdf"].includes(explicit)) {
    return MENTOR_RESOURCE_TYPES.MOCK_TEST;
  }

  if (
    ["currentaffair", "currentaffairs", "currentaffairspdf"].includes(
      explicit
    )
  ) {
    return MENTOR_RESOURCE_TYPES.CURRENT_AFFAIRS;
  }

  if (["roadmap", "studyroadmap", "aspirepath"].includes(explicit)) {
    return MENTOR_RESOURCE_TYPES.ROADMAP;
  }

  if (resource.liveUrl || resource.joinUrl || resource.liveState) {
    return MENTOR_RESOURCE_TYPES.LIVE;
  }

  if (resource.videoUrl || resource.videoId || resource.classId) {
    return MENTOR_RESOURCE_TYPES.VIDEO;
  }

  if (resource.mockTestId || resource.testId || resource.questions) {
    return MENTOR_RESOURCE_TYPES.MOCK_TEST;
  }

  if (resource.month || resource.currentAffairsId) {
    return MENTOR_RESOURCE_TYPES.CURRENT_AFFAIRS;
  }

  if (resource.totalDays || resource.roadmapId) {
    return MENTOR_RESOURCE_TYPES.ROADMAP;
  }

  if (resource.pdfUrl || resource.noteId || resource.textbookId) {
    return MENTOR_RESOURCE_TYPES.NOTES;
  }

  return "";
};

const buildCanonicalRoute = (resource = {}, resourceType = "", resourceId = "") => {
  const explicit = firstValue(
    resource.canonicalRoute,
    resource.route,
    resource.href
  );

  if (isSafeMentorRoute(explicit)) return explicit;
  if (!resourceId) return "";

  if (resourceType === MENTOR_RESOURCE_TYPES.VIDEO || resourceType === MENTOR_RESOURCE_TYPES.LIVE) {
    return `/ctet-tet/videos/watch/${encodeURIComponent(resourceId)}`;
  }

  if (resourceType === MENTOR_RESOURCE_TYPES.MOCK_TEST) {
    return `/ctet-tet/mock-tests/start/${encodeURIComponent(resourceId)}`;
  }

  if (resourceType === MENTOR_RESOURCE_TYPES.ROADMAP) {
    return `/ctet-tet/roadmaps/${encodeURIComponent(resourceId)}`;
  }

  if (resourceType === MENTOR_RESOURCE_TYPES.CURRENT_AFFAIRS) {
    const month = firstValue(
      resource.monthId,
      resource.monthSlug,
      resource.month
    );

    return month
      ? `/ctet-tet/current-affairs/${encodeURIComponent(month)}/read/${encodeURIComponent(resourceId)}`
      : "";
  }

  if (resourceType === MENTOR_RESOURCE_TYPES.NOTES && resource.textbookId) {
    return `/ctet-tet/notes/read/${encodeURIComponent(resource.textbookId)}`;
  }

  return "";
};

const getResourceId = (resource = {}) =>
  firstValue(
    resource.resourceId,
    resource.itemId,
    resource.textbookId,
    resource.videoId,
    resource.liveClassId,
    resource.mockTestId,
    resource.testId,
    resource.roadmapId,
    resource.currentAffairsId,
    resource.id
  );

const normalizeStatus = (resource = {}) =>
  normalizeText(resource.status || resource.publishStatus || "published");

export const normalizeMentorResource = (resource = {}, source = "content") => {
  const resourceType = inferMentorResourceType(resource);
  const resourceId = getResourceId(resource);
  const accessMapping = MENTOR_RESOURCE_ACCESS_MAP[resourceType] || null;
  const canonicalRoute = buildCanonicalRoute(
    resource,
    resourceType,
    resourceId
  );
  const status = normalizeStatus(resource);
  const published = !["draft", "unpublished", "archived", "deleted"].includes(
    status
  );

  return Object.freeze({
    resourceId,
    resourceType,
    module: accessMapping?.module || "",
    itemType: accessMapping?.itemType || "",
    title: firstValue(resource.title, resource.name, "Untitled resource"),
    subtitle: firstValue(
      resource.chapter,
      resource.subject,
      resource.month,
      resource.week
    ),
    subject: firstValue(resource.subject, resource.subjectName),
    chapter: firstValue(resource.chapter, resource.chapterName),
    requiredPlan: normalizeAccessPlan(
      resource.requiredPlan || resource.planType || resource.accessPlan || "FREE"
    ),
    canonicalRoute,
    source,
    status: status || "published",
    assignable: Boolean(
      resourceId && accessMapping && canonicalRoute && published
    ),
  });
};

export const buildMentorResourceCatalog = ({
  contentItems = [],
  roadmaps = [],
} = {}) => {
  const normalized = [
    ...(Array.isArray(contentItems) ? contentItems : []).map((item) =>
      normalizeMentorResource(item, "contentItems")
    ),
    ...(Array.isArray(roadmaps) ? roadmaps : []).map((item) =>
      normalizeMentorResource(
        {
          ...item,
          resourceType: MENTOR_RESOURCE_TYPES.ROADMAP,
          roadmapId: item.roadmapId || item.id,
        },
        "roadmaps"
      )
    ),
  ];
  const seen = new Set();

  return normalized.filter((item) => {
    const key = `${item.resourceType}:${item.resourceId}`;
    if (!item.resourceId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getExpiry = (record = {}) =>
  record.accessUntil || record.expiryDate || record.validUntil || null;

export const resolveMentorResourceAccessState = ({
  resource = {},
  accessRecords = [],
  loading = false,
  error = null,
  now = new Date(),
  expiresSoonDays = 14,
} = {}) => {
  if (loading || error) {
    return Object.freeze({
      state: MENTOR_RESOURCE_ACCESS_STATES.ACCESS_UNAVAILABLE,
      assignable: false,
      matchedAccess: null,
      expiresAt: null,
    });
  }

  if (!resource.assignable) {
    return Object.freeze({
      state: MENTOR_RESOURCE_ACCESS_STATES.NOT_ASSIGNABLE,
      assignable: false,
      matchedAccess: null,
      expiresAt: null,
    });
  }

  const activeRecords = (Array.isArray(accessRecords) ? accessRecords : []).filter(
    isAccessActive
  );
  const allowed = canAccessContent({
    requiredPlan: resource.requiredPlan,
    accessRecords: activeRecords,
    module: resource.module,
    itemType: resource.itemType,
    itemId: resource.resourceId,
  });

  if (!allowed) {
    return Object.freeze({
      state: MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED,
      assignable: false,
      matchedAccess: null,
      expiresAt: null,
    });
  }

  const matchedAccess =
    resource.requiredPlan === "FREE"
      ? null
      : activeRecords.find((record) =>
          canAccessContent({
            requiredPlan: resource.requiredPlan,
            accessRecords: [record],
            module: resource.module,
            itemType: resource.itemType,
            itemId: resource.resourceId,
          })
        ) || null;

  const expiresAt = getExpiry(matchedAccess || {});
  const expiryDate = toDate(expiresAt);
  const nowDate = toDate(now) || new Date();
  const soonThreshold = new Date(
    nowDate.getTime() + Number(expiresSoonDays || 14) * 86400000
  );

  const expiresSoon = Boolean(
    expiryDate &&
      !isAccessExpired(expiryDate) &&
      expiryDate.getTime() <= soonThreshold.getTime()
  );

  return Object.freeze({
    state: expiresSoon
      ? MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON
      : MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
    assignable: true,
    matchedAccess,
    expiresAt: expiryDate || null,
  });
};

export const buildStudentEquivalentPreview = ({
  resource = {},
  accessDecision = {},
} = {}) => {
  const state = accessDecision.state || MENTOR_RESOURCE_ACCESS_STATES.ACCESS_UNAVAILABLE;
  const canOpen = [
    MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
    MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON,
  ].includes(state);

  return Object.freeze({
    resourceId: resource.resourceId || "",
    title: resource.title || "Resource preview",
    canonicalRoute: canOpen && isSafeMentorRoute(resource.canonicalRoute)
      ? resource.canonicalRoute
      : "",
    state,
    canOpen,
    message:
      state === MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS
        ? "The student can open this resource now."
        : state === MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON
          ? "The student can open this resource, but the matched access expires soon."
          : state === MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED
            ? "The student cannot open this resource. Submit an exact access request before assigning it."
            : state === MENTOR_RESOURCE_ACCESS_STATES.NOT_ASSIGNABLE
              ? "This resource is not published or does not have a safe canonical route."
              : "The student's access could not be verified. The preview is fail-closed.",
  });
};
