import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  ASPIRENEST_MENTOR_EMAIL,
  normalizeAspireNestEmail,
  resolveAspireNestRole,
} from "../auth/aspireNestIdentity";
import {
  canV8AccessResource,
  isV8EntitlementActive,
  normalizeV8Plan,
  resolveV8EffectivePlan,
  resolveV8RecordPlan,
  resolveV8ResourcePlan,
  v8EntitlementMatchesResource,
} from "./v8EntitlementPolicy";

const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();
const upper = (value = "") => clean(value).toUpperCase();
const unique = (items = []) => [...new Set(items.filter(Boolean))];

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const dateLabel = (value, fallback = "Not recorded") => {
  const millis = toMillis(value);
  if (!millis) return fallback;
  return new Date(millis).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dateOnly = (value, fallback = "No due date") => {
  const millis = toMillis(value);
  if (!millis) return fallback;
  return new Date(millis).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const slug = (value = "general") =>
  lower(value || "general")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u0900-\u097f]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";

const docsToRecords = (snapshot) =>
  snapshot.docs.map((item) => ({ ...(item.data() || {}), id: item.id }));

const validLegacyAssetUrl = (value = "") => {
  const url = lower(value);
  return Boolean(
    url &&
      url !== "#" &&
      url !== "coming-soon" &&
      url !== "coming soon" &&
      !url.startsWith("javascript:")
  );
};

const hasLegacyCurrentAffairsAsset = (record = {}) =>
  record.hasProtectedAsset === true ||
  Boolean(clean(record.protectedAssetId || record.assetId)) ||
  validLegacyAssetUrl(record.fileUrl || record.pdfUrl || record.pdf || record.url || record.sourceUrl);

const normalizeLegacyCurrentAffairsRecord = (record = {}) => {
  const month = clean(record.month || `${clean(record.cmsMonth)} ${clean(record.year || record.duration || record.cmsDuration)}`) || "Current Affairs";
  const week = clean(record.week || record.weekName || record.chapter || record.chapterName) || "Monthly PDFs";
  const title = clean(record.title) || `${month} Current Affairs`;
  const planType = upper(record.planType || record.accessPlan || record.plan || record.type || "FREE");
  const explicitStatus = lower(record.status || record.publishStatus);
  const explicitPublished = record.isPublished === true || record.published === true || record.active === true;
  const status = explicitStatus || (explicitPublished || hasLegacyCurrentAffairsAsset(record) ? "published" : "draft");
  const id =
    clean(record.resourceId || record.id) ||
    slug(`${title}-${month}-${week}-${planType}-${clean(record.fileUrl || record.pdfUrl || record.url)}`);
  const monthId = slug(month);
  return {
    ...record,
    id,
    resourceId: id,
    resourceType: "current-affairs",
    contentType: "current-affairs",
    section: "currentAffairs",
    module: "currentAffairs",
    itemType: record.itemType || "currentAffairsPdf",
    title,
    subject: clean(record.subject || record.subjectName) || "Current Affairs",
    chapter: week,
    month,
    monthId,
    monthKey: monthId,
    week,
    planType,
    status,
    canonicalRoute: `/ctet-tet/current-affairs/${encodeURIComponent(monthId)}/read/${encodeURIComponent(id)}`,
    __v8Source: "currentAffairs",
  };
};

const normalizeLegacyRoadmapRecord = (record = {}) => {
  const id = clean(record.roadmapId || record.resourceId || record.id);
  const title = clean(record.title || record.name) || "Study Roadmap";
  const examType = clean(record.examType || record.subject || record.subjectName) || "CTET/TET";
  const startDate = clean(record.startDate);
  const endDate = clean(record.endDate);
  return {
    ...record,
    id,
    resourceId: id,
    roadmapId: id,
    resourceType: "roadmap",
    contentType: "roadmap",
    section: "roadmaps",
    module: "roadmaps",
    title,
    subject: examType,
    subjectName: examType,
    chapter: clean(record.chapter || record.durationLabel) || [startDate, endDate].filter(Boolean).join(" → "),
    planType: upper(record.planType || record.accessPlan || record.requiredPlan || "FREE"),
    status: lower(record.status || record.publishStatus || "draft"),
    totalDays: record.totalDays || record.daysCount || record.durationDays || "",
    canonicalRoute: id ? `/ctet-tet/roadmaps/${encodeURIComponent(id)}` : "/ctet-tet/roadmaps",
    __v8Source: "studyRoadmaps",
  };
};

const hasReadableLegacyNoteAsset = (record = {}) =>
  record.hasProtectedAsset === true ||
  Boolean(clean(record.protectedAssetId || record.assetId)) ||
  validLegacyAssetUrl(record.pdfUrl || record.fileUrl || record.pdf || record.sourceUrl || record.url);

const normalizeLegacyNoteRecord = (record = {}) => {
  const id = clean(record.resourceId || record.noteId || record.id);
  const title = clean(record.title || record.name) || "Untitled Note";
  const category = clean(record.category || record.subject || record.subjectName || record.chapter || record.chapterName) || "General";
  const explicitStatus = lower(record.status || record.publishStatus);
  const status = explicitStatus || (hasReadableLegacyNoteAsset(record) ? "published" : "draft");
  const planType = upper(record.planType || record.accessPlan || record.plan || record.type || "FREE");
  return {
    ...record,
    id,
    resourceId: id,
    resourceType: "PDF Note",
    contentType: "PDF",
    itemType: "legacyPdfNote",
    section: "notes",
    module: "notes",
    title,
    subject: clean(record.subject || record.subjectName) || category,
    subjectName: clean(record.subjectName || record.subject) || category,
    chapter: clean(record.chapter || record.chapterName) || category,
    planType,
    accessPlan: planType,
    status,
    pdfUrl: clean(record.pdfUrl || record.fileUrl || record.pdf || record.sourceUrl || record.url),
    fileUrl: clean(record.fileUrl || record.pdfUrl || record.pdf || record.sourceUrl || record.url),
    pageCount: record.pageCount || record.pages || "",
    canonicalRoute: clean(record.canonicalRoute || record.route) || "/ctet-tet/notes",
    __v8Source: "notes",
  };
};

const normalizeExperienceEventRecord = (record = {}) => {
  const rawType = upper(record.type || record.eventType || record.sourceType);
  const liveLike = ["LIVE_CLASS", "LIVE", "WEBINAR", "WORKSHOP", "DOUBT_SESSION", "SPECIAL_SESSION", "MARATHON"]
    .some((token) => rawType.includes(token));
  if (!liveLike) return null;
  const id = clean(record.resourceId || record.eventId || record.id);
  const status = lower(record.status || record.publishStatus || "scheduled");
  const replay = Boolean(clean(record.replayUrl)) || ["replay", "completed", "ended"].includes(status);
  return {
    ...record,
    id,
    resourceId: id,
    resourceType: replay ? "replay" : "live",
    contentType: replay ? "replay" : "live",
    itemType: replay ? "experienceReplay" : "experienceLiveSession",
    section: "live",
    module: "live",
    title: clean(record.title || record.name) || "AspireNest Live Session",
    subject: clean(record.subject || record.subjectName) || "Live Learning",
    subjectName: clean(record.subjectName || record.subject) || "Live Learning",
    chapter: clean(record.chapter || record.description),
    planType: upper(record.planType || record.accessPlan || record.requiredPlan || "FREE"),
    status,
    startsAt: record.startsAt || record.startAt || record.scheduledAt,
    joinUrl: clean(record.joinUrl || record.ctaUrl || record.meetingUrl),
    replayUrl: clean(record.replayUrl),
    canonicalRoute: replay ? "/student#live/replays" : "/student#live/upcoming",
    __v8Source: "experienceEvents",
  };
};

const normalizeMentorLiveSessionRecord = (record = {}) => {
  const id = clean(record.resourceId || record.sessionId || record.id);
  const status = lower(record.status || "scheduled");
  const replay = Boolean(clean(record.replayUrl)) || ["replay", "ended", "completed"].includes(status);
  return {
    ...record,
    id,
    resourceId: id,
    resourceType: replay ? "replay" : "live",
    contentType: replay ? "replay" : "live",
    itemType: replay ? "mentorReplay" : "mentorLiveSession",
    section: "live",
    module: "live",
    title: clean(record.title) || "Mentor Live Session",
    subject: clean(record.subject || record.group) || "Live Learning",
    subjectName: clean(record.subject || record.group) || "Live Learning",
    chapter: clean(record.chapter || record.group),
    planType: upper(record.planType || record.accessPlan || record.requiredPlan || "MENTORSHIP"),
    status,
    startsAt: record.startsAt || record.startAt || record.scheduledAt,
    joinUrl: clean(record.joinUrl || record.meetingUrl),
    replayUrl: clean(record.replayUrl),
    canonicalRoute: replay ? "/student#live/replays" : "/student#live/upcoming",
    __v8Source: "mentorLiveSessions",
  };
};


const sourceTokens = (record = {}) =>
  unique([
    record.__v8Source,
    ...(Array.isArray(record.sourceCollections) ? record.sourceCollections : []),
    record.sourceCollection,
    record.collectionName,
    record.legacyCollection,
    record.module,
    record.section,
    record.moduleKey,
    record.featureKey,
  ]).map(lower);

const fieldTokens = (record = {}) =>
  unique([
    record.resourceType,
    record.contentType,
    record.itemType,
    record.type,
    record.deliveryType,
    record.sourceType,
    record.assetType,
    record.category,
    record.moduleName,
  ]).map(lower);

const tokenHas = (tokens = [], values = []) =>
  tokens.some((token) => values.some((value) => token.includes(value)));

export const resolveV8CanonicalResourceType = (record = {}) => {
  const sources = sourceTokens(record);
  const fields = fieldTokens(record);
  const route = lower(record.canonicalRoute || record.route || record.studentRoute || record.openRoute);
  const explicitSection = lower(record.section || record.contentSection)
    .replace(/[^a-z0-9]+/g, "");
  const explicitModule = lower(record.module || record.moduleKey)
    .replace(/[^a-z0-9]+/g, "");
  const explicitOwner = explicitSection || explicitModule;

  // contentItems.section is the existing production content authority.
  // It must win before month/year or generic PDF metadata is considered.
  if (["currentaffairs", "currentaffair"].includes(explicitOwner)) return "current-affairs";
  if (["notes", "note", "subjectpdf", "coursematerial", "freeresource"].includes(explicitOwner)) return "note";
  if (["recordedvideo", "videos", "video"].includes(explicitOwner)) return "video";
  if (["mockpdf", "mocktest", "mocktests", "practice", "quiz"].includes(explicitOwner)) return "test";
  if (["roadmap", "roadmaps", "studyroadmap", "aspirepath"].includes(explicitOwner)) return "roadmap";
  if (["replay", "replays"].includes(explicitOwner)) return "replay";
  if (["live", "livereplays", "livesessions"].includes(explicitOwner)) {
    return Boolean(clean(record.replayUrl)) || ["replay", "ended", "completed"].includes(lower(record.status))
      ? "replay"
      : "live";
  }

  // Compatibility fallback for records that genuinely have no module owner.
  if (
    tokenHas(sources, ["currentaffair", "current-affair", "current_affair"]) ||
    route.includes("/current-affairs/") ||
    (clean(record.week || record.weekName) && tokenHas(fields, ["current", "affair"]))
  ) return "current-affairs";

  if (
    tokenHas(sources, ["studyroadmap", "roadmap", "aspirepath"]) ||
    route.includes("/roadmaps/") ||
    clean(record.roadmapId) ||
    Array.isArray(record.days) ||
    Number(record.totalDays || record.daysCount || 0) > 0
  ) return "roadmap";

  if (
    tokenHas(sources, ["mocktest", "mock-test", "mock_test", "questionbank"]) ||
    route.includes("/mock-tests/") ||
    clean(record.testId || record.mockTestId) ||
    Array.isArray(record.questions) ||
    Number(record.questionsCount || record.questionCount || 0) > 0 ||
    tokenHas(fields, ["mock", "test", "quiz", "practice"])
  ) return "test";

  const replaySignal =
    tokenHas(sources, ["replay"]) ||
    tokenHas(fields, ["replay"]) ||
    Boolean(clean(record.replayUrl));
  if (replaySignal) return "replay";

  if (
    tokenHas(sources, ["live", "mentorlivesession", "experienceevent"]) ||
    tokenHas(fields, ["live", "webinar", "workshop", "doubt_session", "special_session", "marathon"]) ||
    Boolean(clean(record.joinUrl || record.meetingUrl))
  ) return "live";

  if (
    tokenHas(sources, ["video"]) ||
    route.includes("/videos/") ||
    tokenHas(fields, ["video", "recordedclass", "recorded-class", "classroom"]) ||
    Boolean(clean(record.videoId || record.videoUrl || record.youtubeUrl))
  ) return "video";

  return "note";
};

const normalizeCanonicalModuleOwnership = (record = {}) => {
  const family = resolveV8CanonicalResourceType(record);
  const id = clean(
    record.resourceId ||
      record.itemId ||
      record.textbookId ||
      record.videoId ||
      record.testId ||
      record.mockTestId ||
      record.roadmapId ||
      record.id
  );

  if (family === "current-affairs") {
    const month = clean(record.month || `${clean(record.cmsMonth)} ${clean(record.year || record.duration || record.cmsDuration)}`) || "Current Affairs";
    const monthId = clean(record.monthId || record.monthKey) || slug(month);
    const explicit = clean(record.canonicalRoute || record.route || record.studentRoute || record.openRoute);
    return {
      ...record,
      resourceType: "current-affairs",
      contentType: "current-affairs",
      itemType: record.itemType || "currentAffairsPdf",
      section: "currentAffairs",
      module: "currentAffairs",
      month,
      monthId,
      monthKey: monthId,
      canonicalRoute: explicit.includes("/current-affairs/")
        ? explicit
        : id
          ? `/ctet-tet/current-affairs/${encodeURIComponent(monthId)}/read/${encodeURIComponent(id)}`
          : "/ctet-tet/current-affairs",
    };
  }

  if (family === "roadmap") {
    const explicit = clean(record.canonicalRoute || record.route || record.studentRoute || record.openRoute);
    return {
      ...record,
      resourceType: "roadmap",
      contentType: "roadmap",
      section: "roadmaps",
      module: "roadmaps",
      canonicalRoute: explicit.includes("/roadmaps/")
        ? explicit
        : id
          ? `/ctet-tet/roadmaps/${encodeURIComponent(id)}`
          : "/ctet-tet/roadmaps",
    };
  }

  if (family === "test") {
    return { ...record, resourceType: record.resourceType || "test", section: "mockTests", module: "mockTests" };
  }
  if (family === "video") {
    return { ...record, resourceType: record.resourceType || "video", section: "videos", module: "videos" };
  }
  if (family === "live" || family === "replay") {
    return { ...record, resourceType: family, contentType: family, section: "live", module: "live" };
  }
  return { ...record, section: "notes", module: "notes" };
};

const mergeDefinedResourceFields = (base = {}, incoming = {}) => {
  const merged = { ...base };
  Object.entries(incoming).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim() && clean(merged[key])) return;
    if (Array.isArray(value) && value.length === 0 && Array.isArray(merged[key]) && merged[key].length) return;
    merged[key] = value;
  });
  return merged;
};

const canonicalResourceAliases = (record = {}) => {
  const type = resourceType(record);
  const id = clean(
    record.resourceId ||
      record.itemId ||
      record.textbookId ||
      record.videoId ||
      record.testId ||
      record.mockTestId ||
      record.roadmapId ||
      record.id
  );
  const title = lower(record.title || record.name || record.heading);
  const aliases = [];
  if (id) aliases.push(`id:${type}:${id}`);
  unique([
    clean(record.sourceRecordId),
    clean(record.legacyId),
    clean(record.migratedFromId),
    clean(record.sourceId),
  ]).forEach((sourceId) => aliases.push(`id:${type}:${sourceId}`));
  const asset = lower(
    record.protectedAssetId ||
      record.assetId ||
      record.pdfUrl ||
      record.fileUrl ||
      record.pdf ||
      record.videoUrl ||
      record.youtubeUrl ||
      record.replayUrl
  );
  if (asset) aliases.push(`asset:${type}:${asset}`);

  if (type === "current-affairs" && title) {
    const month = lower(record.month || record.cmsMonth || record.year || record.duration);
    const week = lower(record.week || record.weekName || record.chapter || record.chapterName || "monthly-pdfs");
    aliases.push(`signature:${type}:${title}:${month}:${week}`);
  } else if (type === "roadmap" && title) {
    const examType = lower(record.examType || record.subject || record.subjectName || "ctet-tet");
    const startDate = lower(record.startDate || record.chapter || record.chapterName);
    aliases.push(`signature:${type}:${title}:${examType}:${startDate}`);
  } else if (title) {
    const subject = lower(record.subject || record.subjectName || record.moduleName);
    const chapter = lower(record.chapter || record.chapterName);
    aliases.push(`signature:${type}:${title}:${subject}:${chapter}`);
  }

  return aliases.length ? aliases : [`anonymous:${type}:${slug(JSON.stringify(record))}`];
};

export const buildV8CanonicalResourceRecords = ({
  contentItems = [],
  legacyNotes = [],
  currentAffairs = [],
  studyRoadmaps = [],
  experienceEvents = [],
  mentorLiveSessions = [],
} = {}) => {
  const sourceRows = [
    ...(Array.isArray(legacyNotes) ? legacyNotes : []).map(normalizeLegacyNoteRecord),
    ...(Array.isArray(currentAffairs) ? currentAffairs : []).map(normalizeLegacyCurrentAffairsRecord),
    ...(Array.isArray(studyRoadmaps) ? studyRoadmaps : []).map(normalizeLegacyRoadmapRecord),
    ...(Array.isArray(experienceEvents) ? experienceEvents : []).map(normalizeExperienceEventRecord).filter(Boolean),
    ...(Array.isArray(mentorLiveSessions) ? mentorLiveSessions : []).map(normalizeMentorLiveSessionRecord),
    ...(Array.isArray(contentItems) ? contentItems : []).map((record) => ({ ...record, __v8Source: "contentItems" })),
  ];

  const recordsByKey = new Map();
  const aliasOwner = new Map();

  sourceRows.forEach((record) => {
    const aliases = canonicalResourceAliases(record);
    const existingKey = aliases.map((alias) => aliasOwner.get(alias)).find(Boolean);
    const key = existingKey || aliases[0];
    const previous = recordsByKey.get(key) || {};
    const merged = mergeDefinedResourceFields(previous, record);
    const sourceCollections = unique([
      ...(Array.isArray(previous.sourceCollections) ? previous.sourceCollections : []),
      previous.__v8Source,
      record.__v8Source,
    ]);
    recordsByKey.set(key, normalizeCanonicalModuleOwnership({ ...merged, sourceCollections }));
    aliases.forEach((alias) => aliasOwner.set(alias, key));
  });

  return [...recordsByKey.values()];
};

const published = (record = {}) => {
  const statuses = [record.status, record.publishStatus, record.visibility]
    .map(lower)
    .filter(Boolean);
  if (statuses.some((value) => ["draft", "staged", "unpublished", "inactive", "hidden"].includes(value))) return false;
  if (record.isPublished === true || record.published === true || record.active === true) return true;
  if (statuses.some((value) => ["published", "active", "open", "public", "scheduled", "live", "replay", "ended", "completed"].includes(value))) return true;
  return record.__v8Source === "currentAffairs" && hasLegacyCurrentAffairsAsset(record);
};

const resourceType = (record = {}) => resolveV8CanonicalResourceType(record);

const planCode = (record = {}) => resolveV8RecordPlan(record);

const activeAccess = (record = {}, now = Date.now()) => isV8EntitlementActive(record, now);

const resourceIdentity = (resource = {}) =>
  unique([
    clean(resource.id),
    clean(resource.resourceId),
    clean(resource.itemId),
    clean(resource.textbookId),
    clean(resource.videoId),
    clean(resource.testId),
    clean(resource.mockTestId),
    clean(resource.roadmapId),
  ]);

const accessMatchesResource = (grant = {}, resource = {}, now = Date.now()) =>
  v8EntitlementMatchesResource(grant, resource, now);

const canonicalRoute = (record = {}, type = resourceType(record)) => {
  const explicit = clean(record.canonicalRoute || record.route || record.studentRoute || record.openRoute);
  if (explicit.startsWith("/")) return explicit;
  const id = clean(
    record.resourceId ||
      record.textbookId ||
      record.videoId ||
      record.testId ||
      record.mockTestId ||
      record.roadmapId ||
      record.id
  );
  if (type === "note" && clean(record.textbookId || record.intelliTextId || record.learningTextId)) {
    return `/ctet-tet/notes/read/${encodeURIComponent(clean(record.textbookId || record.intelliTextId || record.learningTextId))}`;
  }
  if ((type === "video" || type === "replay" || type === "live") && id) {
    return `/ctet-tet/videos/watch/${encodeURIComponent(id)}`;
  }
  if (type === "test" && id) return `/ctet-tet/mock-tests/start/${encodeURIComponent(id)}`;
  if (type === "current-affairs") {
    const monthId = clean(record.monthId || record.monthKey);
    return monthId && id
      ? `/ctet-tet/current-affairs/${encodeURIComponent(monthId)}/read/${encodeURIComponent(id)}`
      : "/ctet-tet/current-affairs";
  }
  if (type === "roadmap" && id) return `/ctet-tet/roadmaps/${encodeURIComponent(id)}`;
  if (type === "video" || type === "replay" || type === "live") return "/ctet-tet/videos";
  if (type === "test") return "/ctet-tet/mock-tests";
  if (type === "roadmap") return "/ctet-tet/roadmaps";
  return "/ctet-tet/notes";
};

const normalizeResource = ({ record = {}, grants = [], assignments = [], userPlan = "FREE", now = Date.now() } = {}) => {
  const type = resourceType(record);
  const ids = resourceIdentity(record);
  const assignment = assignments.find((item) => ids.includes(clean(item.resourceId || item.itemId)));
  const requiredPlan = resolveV8ResourcePlan(record, type);
  const access = canV8AccessResource({
    resource: { ...record, resourceType: type, requiredPlan },
    accessRecords: grants,
    userPlan,
    now,
  });
  const expires = Math.max(
    0,
    ...grants
      .filter((grant) => accessMatchesResource(grant, { ...record, requiredPlan }, now))
      .map((grant) => toMillis(grant.accessUntil || grant.expiresAt || grant.validUntil))
  );
  const status = lower(record.status || record.publishStatus);
  const resourceId = clean(record.resourceId || record.id);
  const subjectName = clean(record.subject || record.subjectName || record.subjectId || record.moduleName) || "General";
  const updatedMillis = toMillis(record.updatedAt || record.publishedAt || record.createdAt);
  const progress = Math.max(0, Math.min(100, Number(record.progress || record.learningProgress || 0) || 0));
  return {
    id: resourceId,
    resourceId,
    type,
    title: clean(record.title || record.name || record.heading) || "Untitled resource",
    subtitle: clean(record.subtitle || record.chapter || record.chapterName || record.description) || `${subjectName} learning resource`,
    subject: slug(subjectName),
    subjectName,
    chapter: clean(record.chapter || record.chapterName || record.chapterId),
    plan: requiredPlan === "FREE" ? "Free" : requiredPlan.charAt(0) + requiredPlan.slice(1).toLowerCase(),
    requiredPlan,
    state: access ? "open" : expires && expires <= now ? "expired" : status === "published" ? "locked" : "locked",
    progress,
    duration: clean(record.duration || record.pageCount || record.pages || record.questionCount || record.totalDays || "Open resource"),
    assigned: Boolean(assignment),
    assignmentId: clean(assignment?.assignmentId || assignment?.id),
    assignmentStatus: clean(assignment?.status),
    assignmentDue: dateOnly(assignment?.dueAt),
    recent: Boolean(updatedMillis && now - updatedMillis <= 30 * 24 * 60 * 60 * 1000),
    native: type === "note" && Boolean(record.learningTextId || record.intelliTextId || record.textbookId),
    description: clean(record.summary || record.description || record.subtitle),
    route: canonicalRoute(record, type),
    updated: dateOnly(updatedMillis, "Not recorded"),
    updatedMillis,
    source: record,
  };
};

const normalizeAssignment = (record = {}) => ({
  id: clean(record.assignmentId || record.id),
  assignmentId: clean(record.assignmentId || record.id),
  learnerId: clean(record.studentUid || record.learnerUid),
  resourceId: clean(record.resourceId || record.itemId),
  title: clean(record.title) || "Learning assignment",
  due: dateOnly(record.dueAt),
  dueMillis: toMillis(record.dueAt),
  status: clean(record.status || "assigned"),
  access: clean(record.accessState || "HAS_ACCESS"),
  objective: clean(record.objective),
  feedbackCount: Number(record.feedbackCount || 0),
  updatedAt: dateLabel(record.updatedAt || record.createdAt),
});

const normalizeQuestion = (record = {}) => ({
  id: clean(record.questionId || record.id),
  questionId: clean(record.questionId || record.id),
  learnerId: clean(record.studentUid || record.learnerUid),
  resourceId: clean(record.resourceId),
  title: clean(record.question || record.title) || "Learner question",
  question: clean(record.question || record.title),
  answer: clean(record.answer),
  time: dateLabel(record.updatedAt || record.createdAt),
  status: clean(record.status || (record.answer ? "answered" : "open")),
});

const normalizeSession = (record = {}) => ({
  id: clean(record.sessionId || record.id),
  title: clean(record.title) || "Mentor live session",
  when: dateLabel(record.startsAt || record.scheduledAt || record.startAt),
  startsAt: toMillis(record.startsAt || record.scheduledAt || record.startAt),
  group: clean(record.group || record.learnerGroup || "Assigned learners"),
  status: clean(record.status || "scheduled"),
  joinUrl: clean(record.joinUrl || record.meetingUrl || record.youtubeUrl),
  replayUrl: clean(record.replayUrl),
});

const normalizeResult = (record = {}) => ({
  id: clean(record.resultId || record.id),
  testId: clean(record.testId || record.mockTestId),
  title: clean(record.testTitle || record.title) || "Mock-test result",
  score: Number(record.score || 0),
  totalMarks: Number(record.totalMarks || record.totalQuestions || 0),
  percentage: Number(record.percentage || 0),
  time: dateLabel(record.updatedAt || record.createdAt),
  route: clean(record.testId || record.mockTestId)
    ? `/ctet-tet/mock-tests/result/${encodeURIComponent(clean(record.testId || record.mockTestId))}`
    : "/ctet-tet/mock-tests/history",
});


const normalizeProduct = (record = {}) => ({
  id: clean(record.productId || record.id),
  productId: clean(record.productId || record.id),
  planCode: upper(record.planCode || record.planType || record.code || record.name || "FREE"),
  name: clean(record.displayName || record.name || record.title || record.planCode || "Learning access"),
  price: Number(record.price || record.amount || record.priceInr || 0) || 0,
  currency: upper(record.currency || "INR"),
  billingLabel: clean(record.billingLabel || record.validityLabel || record.durationLabel || ""),
  features: Array.isArray(record.features) ? record.features.map(clean).filter(Boolean) : [],
  status: clean(record.status || (record.isActive === false ? "inactive" : "active")),
  scopeType: lower(record.scopeType || "plan"),
});

const deriveSubjects = (resources = []) => {
  const palette = [
    ["#ede9ff", "#6f59c8", "A"],
    ["#e7f4ff", "#3576c8", "A"],
    ["#fff0e8", "#f47b20", "A"],
    ["#e8f8f2", "#168b68", "A"],
    ["#eaf8e3", "#5e9d48", "A"],
    ["#fff6dd", "#c58a22", "A"],
  ];
  const groups = new Map();
  resources.forEach((resource) => {
    const id = resource.subject || "general";
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(resource);
  });
  return [...groups.entries()]
    .map(([id, items], index) => {
      const [tint, accent] = palette[index % palette.length];
      const name = items[0]?.subjectName || id;
      const progress = items.length
        ? Math.round(items.reduce((total, item) => total + Number(item.progress || 0), 0) / items.length)
        : 0;
      return {
        id,
        name,
        short: clean(name).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SUB",
        icon: clean(name).charAt(0).toUpperCase() || "A",
        items: items.length,
        progress,
        tint,
        accent,
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name, "en", { sensitivity: "base" }));
};

const sourceState = (names = []) => Object.fromEntries(names.map((name) => [name, { loaded: false, records: [], error: "" }]));
const sourceSummary = (state = {}) => ({
  sourceStatus: Object.fromEntries(
    Object.entries(state).map(([name, item]) => [name, item.error ? "error" : item.loaded ? (item.records.length ? "ready" : "empty") : "loading"])
  ),
  sourceCounts: Object.fromEntries(Object.entries(state).map(([name, item]) => [name, item.records.length])),
  sourceErrors: Object.fromEntries(Object.entries(state).filter(([, item]) => item.error).map(([name, item]) => [name, item.error])),
});

const subscribeQuery = ({ name, reference, state, publish }) =>
  onSnapshot(
    reference,
    (snapshot) => {
      state[name] = { loaded: true, records: docsToRecords(snapshot), error: "" };
      publish();
    },
    (error) => {
      state[name] = { loaded: true, records: [], error: error?.message || String(error) };
      publish();
    }
  );

export const subscribeV8PublicLiveData = ({ db, onChange = () => {}, onLoading = () => {} } = {}) => {
  if (!db) throw new Error("Firestore is required for public live data.");
  const state = sourceState(["contentItems", "studyRoadmaps", "experienceEvents", "accessProducts"]);
  let stopped = false;
  onLoading();
  const publish = () => {
    if (stopped || !Object.values(state).every((item) => item.loaded)) return;
    const resources = buildV8CanonicalResourceRecords({
      contentItems: state.contentItems.records,
      studyRoadmaps: state.studyRoadmaps.records,
      experienceEvents: state.experienceEvents.records,
    }).filter(published).map((record) => normalizeResource({ record }));
    const products = state.accessProducts.records
      .map(normalizeProduct)
      .filter((product) => lower(product.status) === "active" && product.scopeType === "plan")
      .sort((first, second) => first.price - second.price);
    onChange({ ready: true, loading: false, resources, subjects: deriveSubjects(resources), products, ...sourceSummary(state) });
  };
  const unsubs = [
    subscribeQuery({ name: "contentItems", reference: query(collection(db, "contentItems"), limit(1000)), state, publish }),
    subscribeQuery({ name: "studyRoadmaps", reference: query(collection(db, "studyRoadmaps"), limit(1000)), state, publish }),
    subscribeQuery({ name: "experienceEvents", reference: query(collection(db, "experienceEvents"), limit(1000)), state, publish }),
    subscribeQuery({ name: "accessProducts", reference: query(collection(db, "accessProducts"), where("scopeType", "==", "plan"), where("status", "==", "active"), where("isActive", "==", true), limit(100)), state, publish }),
  ];
  return () => { stopped = true; unsubs.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} }); };
};

export const subscribeV8StudentLiveData = ({ db, user, onChange = () => {}, onLoading = () => {} } = {}) => {
  if (!db || !user?.uid) throw new Error("Authenticated learner identity is required for Student live data.");
  const email = normalizeAspireNestEmail(user.email);
  const names = ["contentItems", "studyRoadmaps", "experienceEvents", "studentAccessUid", "studentAccessEmail", "assignments", "questions", "sessions", "results", "roadmapProgress", "profile"];
  const state = sourceState(names);
  let stopped = false;
  onLoading();
  const publish = () => {
    if (stopped || !Object.values(state).every((item) => item.loaded)) return;
    const grantsById = new Map();
    [...state.studentAccessUid.records, ...state.studentAccessEmail.records].forEach((record) => {
      grantsById.set(clean(record.id || record.accessId || `${record.uid}:${record.itemId}:${record.planCode}`), record);
    });
    const grants = [...grantsById.values()];
    const profile = state.profile.records[0] || {};
    const effectivePlan = resolveV8EffectivePlan({ profile, accessRecords: grants });
    const assignments = state.assignments.records.map(normalizeAssignment);
    const resources = buildV8CanonicalResourceRecords({
      contentItems: state.contentItems.records,
      studyRoadmaps: state.studyRoadmaps.records,
      experienceEvents: state.experienceEvents.records,
      mentorLiveSessions: state.sessions.records,
    })
      .filter(published)
      .map((record) => normalizeResource({ record, grants, assignments, userPlan: effectivePlan }))
      .sort((first, second) => second.updatedMillis - first.updatedMillis);
    onChange({
      ready: true,
      loading: false,
      user: { uid: user.uid, email, role: resolveAspireNestRole(user) },
      profile,
      effectivePlan,
      resources,
      subjects: deriveSubjects(resources),
      grants,
      assignments,
      questions: state.questions.records.map(normalizeQuestion),
      liveSessions: state.sessions.records.map(normalizeSession).sort((a, b) => a.startsAt - b.startsAt),
      results: state.results.records.map(normalizeResult),
      roadmapProgress: state.roadmapProgress.records,
      ...sourceSummary(state),
    });
  };
  const unsubs = [
    subscribeQuery({ name: "contentItems", reference: query(collection(db, "contentItems"), limit(1000)), state, publish }),
    subscribeQuery({ name: "studyRoadmaps", reference: query(collection(db, "studyRoadmaps"), limit(1000)), state, publish }),
    subscribeQuery({ name: "experienceEvents", reference: query(collection(db, "experienceEvents"), limit(1000)), state, publish }),
    subscribeQuery({ name: "studentAccessUid", reference: query(collection(db, "studentAccess"), where("uid", "==", user.uid), limit(500)), state, publish }),
    subscribeQuery({ name: "studentAccessEmail", reference: query(collection(db, "studentAccess"), where("normalizedEmail", "==", email), limit(500)), state, publish }),
    subscribeQuery({ name: "assignments", reference: query(collection(db, "mentorAssignments"), where("studentUid", "==", user.uid), limit(500)), state, publish }),
    subscribeQuery({ name: "questions", reference: query(collection(db, "mentorQuestions"), where("studentUid", "==", user.uid), limit(500)), state, publish }),
    subscribeQuery({ name: "sessions", reference: query(collection(db, "mentorLiveSessions"), limit(250)), state, publish }),
    subscribeQuery({ name: "results", reference: query(collection(db, "mockResults"), where("email", "==", email), limit(500)), state, publish }),
    subscribeQuery({ name: "roadmapProgress", reference: query(collection(db, "studyRoadmapProgress"), where("userId", "==", user.uid), limit(500)), state, publish }),
    onSnapshot(
      doc(db, "learnerProfiles", user.uid),
      (snapshot) => { state.profile = { loaded: true, records: snapshot.exists() ? [{ ...snapshot.data(), id: snapshot.id }] : [], error: "" }; publish(); },
      (error) => { state.profile = { loaded: true, records: [], error: error?.message || String(error) }; publish(); }
    ),
  ];
  return () => { stopped = true; unsubs.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} }); };
};

export const subscribeV8MentorLiveData = ({ db, user, onChange = () => {}, onLoading = () => {} } = {}) => {
  if (!db || !user?.uid) throw new Error("Authenticated Mentor or Admin identity is required for Mentor live data.");
  const role = resolveAspireNestRole(user);
  if (!["mentor", "admin"].includes(role)) throw new Error("Mentor live data is restricted to Mentor and Admin accounts.");
  const names = ["settings", "contentItems", "studyRoadmaps", "experienceEvents", "learnerProfiles", "mentorLinks", "assignments", "questions", "accessRequests", "sessions"];
  const state = sourceState(names);
  let stopped = false;
  let mentorUid = role === "mentor" ? user.uid : "";
  let dynamicUnsubs = [];
  onLoading();

  const clearDynamic = () => { dynamicUnsubs.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} }); dynamicUnsubs = []; };
  const publish = () => {
    if (stopped || !Object.values(state).every((item) => item.loaded)) return;
    const links = state.mentorLinks.records.filter((record) => lower(record.status || "active") === "active");
    const linkedUids = new Set(links.map((record) => clean(record.studentUid)).filter(Boolean));
    const learners = state.learnerProfiles.records
      .filter((record) => {
        const assignedEmail = normalizeAspireNestEmail(record.mentorEmail);
        return linkedUids.has(clean(record.uid || record.id)) || assignedEmail === ASPIRENEST_MENTOR_EMAIL;
      })
      .map((record) => ({
        id: clean(record.uid || record.id),
        uid: clean(record.uid || record.id),
        name: clean(record.name || record.fullName || record.displayName || record.email) || "Learner",
        email: normalizeAspireNestEmail(record.email),
        plan: upper(record.planCode || record.planType || record.premiumStatus || "FREE"),
        status: clean(record.status || record.profileStatus || "Active"),
        progress: Math.max(0, Math.min(100, Number(record.progress || record.overallProgress || record.profileCompletion || 0) || 0)),
        accessCount: Math.max(0, Number(record.accessCount || record.entitlementCount || record.activeAccessCount || 0) || 0),
        mentor: clean(record.mentorName || "Dr. Varsha Maru"),
        lastActive: dateLabel(record.lastActiveAt || record.lastLoginAt || record.updatedAt),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    const assignments = state.assignments.records.map(normalizeAssignment);
    const resources = buildV8CanonicalResourceRecords({
      contentItems: state.contentItems.records,
      studyRoadmaps: state.studyRoadmaps.records,
      experienceEvents: state.experienceEvents.records,
      mentorLiveSessions: state.sessions.records,
    })
      .filter(published)
      .map((record) => normalizeResource({ record, userPlan: "MENTORSHIP" }))
      .sort((a, b) => b.updatedMillis - a.updatedMillis);
    onChange({
      ready: true,
      loading: false,
      mentorUid,
      learners,
      resources,
      assignments,
      questions: state.questions.records.map(normalizeQuestion),
      accessRequests: state.accessRequests.records.map((record) => ({
        id: clean(record.requestId || record.id),
        learnerId: clean(record.studentUid),
        resourceId: clean(record.resourceId),
        scope: upper(record.scopeType || "ITEM"),
        reason: clean(record.reason),
        status: clean(record.status || "pending"),
        time: dateLabel(record.updatedAt || record.createdAt),
      })),
      liveSessions: state.sessions.records.map(normalizeSession).sort((a, b) => a.startsAt - b.startsAt),
      ...sourceSummary(state),
    });
  };

  const attachMentorQueries = (uid) => {
    clearDynamic();
    mentorUid = clean(uid);
    const queryUid = mentorUid || "__missing_default_mentor__";
    dynamicUnsubs = [
      subscribeQuery({ name: "mentorLinks", reference: query(collection(db, "mentorStudentLinks"), where("mentorUid", "==", queryUid), limit(1000)), state, publish }),
      subscribeQuery({ name: "assignments", reference: query(collection(db, "mentorAssignments"), where("mentorUid", "==", queryUid), limit(1000)), state, publish }),
      subscribeQuery({ name: "questions", reference: query(collection(db, "mentorQuestions"), where("mentorUid", "==", queryUid), limit(1000)), state, publish }),
      subscribeQuery({ name: "accessRequests", reference: query(collection(db, "mentorAccessRequests"), where("mentorUid", "==", queryUid), limit(1000)), state, publish }),
      subscribeQuery({ name: "sessions", reference: query(collection(db, "mentorLiveSessions"), where("mentorUid", "==", queryUid), limit(500)), state, publish }),
    ];
  };

  const fixedUnsubs = [
    onSnapshot(
      doc(db, "platformSettings", "defaultMentor"),
      (snapshot) => {
        const record = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : {};
        state.settings = { loaded: true, records: snapshot.exists() ? [record] : [], error: "" };
        const resolvedUid = role === "mentor" ? user.uid : clean(record.mentorUid);
        if (resolvedUid !== mentorUid || !dynamicUnsubs.length) attachMentorQueries(resolvedUid);
        publish();
      },
      (error) => {
        state.settings = { loaded: true, records: [], error: error?.message || String(error) };
        if (!dynamicUnsubs.length) attachMentorQueries(mentorUid);
        publish();
      }
    ),
    subscribeQuery({ name: "contentItems", reference: query(collection(db, "contentItems"), limit(1000)), state, publish }),
    subscribeQuery({ name: "studyRoadmaps", reference: query(collection(db, "studyRoadmaps"), limit(1000)), state, publish }),
    subscribeQuery({ name: "experienceEvents", reference: query(collection(db, "experienceEvents"), limit(1000)), state, publish }),
    subscribeQuery({ name: "learnerProfiles", reference: query(collection(db, "learnerProfiles"), where("mentorEmail", "==", ASPIRENEST_MENTOR_EMAIL), limit(1000)), state, publish }),
  ];
  if (role === "mentor") attachMentorQueries(user.uid);
  return () => { stopped = true; clearDynamic(); fixedUnsubs.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} }); };
};

export const __private__ = {
  activeAccess,
  published,
  accessMatchesResource,
  normalizeV8Plan,
  resolveV8EffectivePlan,
  resolveV8ResourcePlan,
  canV8AccessResource,
  canonicalRoute,
  deriveSubjects,
  normalizeResource,
  normalizeAssignment,
  normalizeQuestion,
  normalizeSession,
  normalizeProduct,
  normalizeLegacyCurrentAffairsRecord,
  normalizeLegacyRoadmapRecord,
  normalizeLegacyNoteRecord,
  normalizeExperienceEventRecord,
  normalizeMentorLiveSessionRecord,
  resolveV8CanonicalResourceType,
  normalizeCanonicalModuleOwnership,
  canonicalResourceAliases,
  buildV8CanonicalResourceRecords,
};
