import { collection, limit, onSnapshot, query } from "firebase/firestore";

import {
  ASPIRENEST_MENTOR_EMAIL,
  isAspireNestStaffEmail,
  normalizeAspireNestEmail,
} from "../auth/aspireNestIdentity";
import { buildV8RealLearnerDirectory } from "./v8LearnerDirectory";
import { applyAspireNestDefaultMentorPolicy } from "./v8DefaultMentorPolicy";
import { buildV8CanonicalResourceRecords, resolveV8CanonicalResourceType } from "./v8PlatformLiveData";
import { resolveV8ResourcePlan } from "./v8EntitlementPolicy";

const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();
const upper = (value = "") => clean(value).toUpperCase();
const titleCase = (value = "") => {
  const text = clean(value).toLowerCase();
  return text ? text.replace(/(^|[\s_-])\w/g, (match) => match.toUpperCase()).replace(/[_-]+/g, " ") : "";
};

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

const dateOnly = (value, fallback = "No expiry") => {
  const millis = toMillis(value);
  if (!millis) return fallback;
  return new Date(millis).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const amountLabel = (value) => {
  const text = clean(value);
  if (!text) return "₹0";
  if (text.includes("₹")) return text;
  const numeric = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? `₹${numeric.toLocaleString("en-IN")}` : text;
};

const docsToRecords = (snapshot) => snapshot.docs.map((item) => ({ ...(item.data() || {}), id: item.id }));
const normalizedStatus = (record = {}, fallback = "Active") =>
  titleCase(record.status || record.accessStatus || record.paymentStatus || fallback) || fallback;

const learnerByIdentity = (learners = []) => {
  const map = new Map();
  learners.forEach((learner) => {
    [learner.uid, learner.id, ...(learner.uidAliases || [])]
      .map(clean)
      .filter(Boolean)
      .forEach((uid) => map.set(`uid:${uid}`, learner));
    [learner.email, ...(learner.emailAliases || [])]
      .map(normalizeAspireNestEmail)
      .filter(Boolean)
      .forEach((email) => map.set(`email:${email}`, learner));
  });
  return map;
};

const resolveLearner = (record = {}, index = new Map()) => {
  const uids = [record.uid, record.userId, record.studentUid, record.learnerUid, record.id]
    .map(clean)
    .filter(Boolean);
  for (const uid of uids) {
    const learner = index.get(`uid:${uid}`);
    if (learner) return learner;
  }
  const emails = [record.email, record.normalizedEmail, record.studentEmail, record.learnerEmail]
    .map(normalizeAspireNestEmail)
    .filter(Boolean);
  for (const email of emails) {
    const learner = index.get(`email:${email}`);
    if (learner) return learner;
  }
  return null;
};

const resourceType = (record = {}) => ({
  note: (() => {
    const raw = clean(record.resourceType || record.contentType || record.itemType || record.deliveryType).toLowerCase();
    return raw.includes("pdf") || clean(record.pdfUrl || record.fileUrl) ? "PDF Note" : "Native Note";
  })(),
  video: "Video",
  test: "Mock Test",
  "current-affairs": "Current Affairs",
  roadmap: "Roadmap",
  live: "Live Class",
  replay: "Replay",
})[resolveV8CanonicalResourceType(record)] || "Native Note";

const normalizeResource = (record = {}) => {
  const type = resourceType(record);
  const status = titleCase(record.status || record.publishStatus || record.visibility || "Draft");
  const plan = resolveV8ResourcePlan({
    ...record,
    planType:
      record.access ||
      record.planType ||
      record.accessPlan ||
      record.planCode ||
      record.plan ||
      (Array.isArray(record.includedPlanKeys) ? record.includedPlanKeys.at(-1) : "") ||
      (record.isFree === true ? "FREE" : ""),
  }, type);
  const delivery = clean(record.deliveryType || record.delivery || record.sourceType || record.assetType) ||
    (type === "Video" ? "Protected Player" : type === "Mock Test" ? "Exam Engine" : "Canonical Resource");
  const countValue =
    record.blockCount ||
    record.questionsCount ||
    record.questionCount ||
    record.pageCount ||
    record.pages ||
    record.duration ||
    record.totalDays ||
    record.count;

  return {
    id: clean(record.resourceId || record.id),
    title: clean(record.title || record.name || record.heading) || "Untitled resource",
    type,
    subject: clean(record.subject || record.subjectName || record.subjectId || record.moduleName) || "General",
    chapter: clean(record.chapter || record.chapterName || record.chapterId),
    summary: clean(record.summary || record.description || record.subtitle),
    status: status || "Draft",
    access: plan,
    delivery,
    updated: dateOnly(record.updatedAt || record.publishedAt || record.createdAt),
    updatedMillis: toMillis(record.updatedAt || record.publishedAt || record.createdAt),
    count: countValue ? clean(countValue) : "",
  };
};

const normalizeGrant = (record = {}, learnerIndex = new Map()) => {
  const learner = resolveLearner(record, learnerIndex);
  const scope = upper(record.scopeType || record.scope || record.accessScope || "PLAN");
  const target = clean(
    record.itemId || record.bundleId || record.module || record.planCode || record.planType || record.productId || record.target
  );
  const title = clean(
    record.itemTitle || record.title || record.productName || record.planName || record.campaignName
  ) || (scope === "PLAN" ? `${upper(record.planCode || record.planType || target || "FREE")} Learning Access` : target || `${scope} access`);

  return {
    id: clean(record.id || record.accessId || record.grantKey),
    learnerId: learner?.id || clean(record.uid || record.studentUid || record.userId) || normalizeAspireNestEmail(record.email),
    learnerName: learner?.name || clean(record.learnerName || record.name) || normalizeAspireNestEmail(record.email).split("@")[0],
    learnerEmail: learner?.email || normalizeAspireNestEmail(record.email || record.normalizedEmail),
    scope,
    target,
    title,
    source: clean(record.source || record.campaignSource || record.grantSource) || "Admin access engine",
    status: normalizedStatus(record),
    starts: dateOnly(record.accessFrom || record.startsAt || record.startDate, "Immediate"),
    startsMillis: toMillis(record.accessFrom || record.startsAt || record.startDate),
    expires: record.noExpiry === true || record.untilManualChange === true
      ? "Until manual change"
      : dateOnly(record.accessUntil || record.expiresAt || record.endDate),
    expiresMillis: toMillis(record.accessUntil || record.expiresAt || record.endDate),
  };
};

const normalizePayment = (record = {}, learnerIndex = new Map()) => {
  const learner = resolveLearner(record, learnerIndex);
  return {
    id: clean(record.id || record.orderId || record.paymentId),
    learnerId: learner?.id || clean(record.userId || record.uid || record.studentUid),
    learner: learner?.name || clean(record.learnerName || record.studentName || record.name) || normalizeAspireNestEmail(record.studentEmail || record.email).split("@")[0] || "Learner",
    email: learner?.email || normalizeAspireNestEmail(record.studentEmail || record.email),
    plan: upper(record.planCode || record.planType || record.planName || record.productName) || "FREE",
    amount: amountLabel(record.amount || record.price || record.paidAmount),
    method: clean(record.method || record.paymentMethod || record.gateway) || "UPI",
    reference: clean(record.reference || record.utr || record.orderId || record.studentUtr || record.adminUtr) || "No reference",
    date: dateLabel(record.updatedAt || record.verifiedAt || record.requestedAt || record.createdAt),
    dateMillis: toMillis(record.updatedAt || record.verifiedAt || record.requestedAt || record.createdAt),
    status: normalizedStatus(record, "Pending"),
    accessProvisioned: record.accessProvisioned === true || record.accessEngineSynced === true || record.provisioned === true,
  };
};

const mentorCandidates = ({ users = [], mentorProfiles = [] } = {}) => {
  const records = [
    ...(Array.isArray(users) ? users : []),
    ...(Array.isArray(mentorProfiles) ? mentorProfiles : []),
  ].filter((record) => {
    const email = normalizeAspireNestEmail(record.email || record.normalizedEmail);
    const role = clean(record.role).toLowerCase();
    return email === ASPIRENEST_MENTOR_EMAIL || role === "mentor";
  });

  const map = new Map();
  records.forEach((record, index) => {
    const email = normalizeAspireNestEmail(record.email || record.normalizedEmail);
    const uid = clean(record.mentorUid || record.uid || record.userId || record.id);
    const key = email ? `email:${email}` : uid ? `uid:${uid}` : `mentor:${index}`;
    const previous = map.get(key) || {};
    map.set(key, { ...previous, ...record, uid: uid || previous.uid, email: email || previous.email });
  });
  return [...map.values()];
};

const normalizeMentors = ({ users = [], mentorProfiles = [], mentorAssignments = [] } = {}) =>
  mentorCandidates({ users, mentorProfiles }).map((mentor, index) => {
    const uid = clean(mentor.mentorUid || mentor.uid || mentor.userId || mentor.id);
    const email = normalizeAspireNestEmail(mentor.email || mentor.normalizedEmail);
    const assignments = (Array.isArray(mentorAssignments) ? mentorAssignments : []).filter((assignment) => {
      const assignmentUid = clean(assignment.mentorUid || assignment.mentorId);
      const assignmentEmail = normalizeAspireNestEmail(assignment.mentorEmail);
      return (uid && assignmentUid === uid) || (email && assignmentEmail === email);
    });
    return {
      id: uid || email || `mentor:${index}`,
      uid,
      name: clean(mentor.displayName || mentor.fullName || mentor.name || mentor.mentorName) || (email === ASPIRENEST_MENTOR_EMAIL ? "Dr. Varsha Maru" : "Mentor"),
      email,
      learners: new Set(assignments.map((assignment) => clean(assignment.studentUid || assignment.learnerUid)).filter(Boolean)).size,
      assignments: assignments.length,
      questions: Number(mentor.pendingQuestions || mentor.questions || 0) || 0,
      status: normalizedStatus(mentor),
    };
  }).sort((first, second) => first.name.localeCompare(second.name, "en", { sensitivity: "base" }));

const auditTarget = (record = {}) => {
  const metadata = record.metadata || {};
  const after = record.after || {};
  return clean(
    record.target ||
      record.targetLabel ||
      record.itemTitle ||
      metadata.target ||
      metadata.itemTitle ||
      after.itemTitle ||
      record.email ||
      record.uid ||
      record.accessId
  ) || "Platform operation";
};

const normalizeAudit = (record = {}, source = "audit") => ({
  id: clean(record.id || record.auditId || record.eventId),
  time: dateLabel(record.createdAt || record.updatedAt || record.occurredAt || record.timestamp),
  timeMillis: toMillis(record.createdAt || record.updatedAt || record.occurredAt || record.timestamp),
  actor: clean(record.actorName || record.actorEmail || record.createdBy || record.actorUid || record.actorRole) || "System",
  action: upper(record.action || record.eventType || record.type || source),
  target: auditTarget(record),
  result: upper(record.result || record.decision || record.status || "SUCCESS"),
  reason: clean(record.reason || record.reasonCode || record.metadata?.reason || record.metadata?.decisionReason) || source,
  evidence: record.before || record.after || record.metadata ? {
    before: record.before || null,
    after: record.after || null,
    metadata: record.metadata || {},
    source,
  } : null,
});

const normalizeProduct = (record = {}) => ({
  id: clean(record.productId || record.id || record.planCode || record.bundleId),
  scopeType: lower(record.scopeType || record.scope || (record.bundleId ? "bundle" : "plan")),
  planCode: upper(record.planCode || record.code || record.productCode || record.title) || "PRODUCT",
  bundleId: clean(record.bundleId || (lower(record.scopeType || record.scope) === "bundle" ? record.productId || record.id : "")),
  title: clean(record.title || record.name || record.productName || record.planName) || "Access product",
  description: clean(record.description || record.summary || record.subtitle || record.marketingLabel),
  price: amountLabel(record.priceINR ?? record.price ?? record.amount ?? 0),
  priceINR: Number(record.priceINR ?? record.price ?? record.amount ?? 0) || 0,
  accessRank: Number(record.accessRank ?? record.rank ?? 0) || 0,
  status: record.isActive === false ? "Inactive" : normalizedStatus(record, "Active"),
  validityMode: upper(record.validityMode || record.validityType || "ADMIN_DEFINED"),
  defaultValidityDays: Number(record.defaultValidityDays ?? record.validityDays ?? 0) || null,
  moduleKeys: Array.isArray(record.moduleKeys)
    ? record.moduleKeys.map(upper).filter(Boolean)
    : Array.isArray(record.includedModuleKeys)
      ? record.includedModuleKeys.map(upper).filter(Boolean)
      : [],
  itemIds: Array.isArray(record.itemIds)
    ? record.itemIds.map(clean).filter(Boolean)
    : Array.isArray(record.resourceIds)
      ? record.resourceIds.map(clean).filter(Boolean)
      : [],
});

const normalizeClaim = (record = {}) => ({
  id: clean(record.id || record.inviteId || record.inviteCode),
  email: normalizeAspireNestEmail(record.email || record.normalizedEmail),
  scope: upper(record.scopeType || record.scope || "ITEM"),
  target: clean(record.itemId || record.bundleId || record.module || record.planCode || record.target || record.accessId),
  status: clean(record.uid || record.claimedUid) ? normalizedStatus(record, "Claimed") : normalizedStatus(record, "Pending UID claim"),
  created: dateLabel(record.createdAt || record.updatedAt),
});

export const buildV8AdminLiveData = ({
  users = [],
  students = [],
  learnerProfiles = [],
  studentAccess = [],
  contentItems = [],
  legacyNotes = [],
  currentAffairs = [],
  studyRoadmaps = [],
  mentorLiveSessions = [],
  payments = [],
  mentorProfiles = [],
  mentorAssignments = [],
  mentorStudentLinks = [],
  accessAuditLogs = [],
  accessActionLogs = [],
  experienceEvents = [],
  accessInvites = [],
  accessProducts = [],
  now = Date.now(),
} = {}) => {
  const identityLearners = buildV8RealLearnerDirectory({
    users,
    students,
    profiles: learnerProfiles,
    accessRecords: studentAccess,
    now,
  });
  const baseMentors = normalizeMentors({ users, mentorProfiles, mentorAssignments });
  const relationshipProjection = applyAspireNestDefaultMentorPolicy({
    learners: identityLearners,
    mentors: baseMentors,
    mentorStudentLinks,
  });
  const learners = relationshipProjection.learners.filter((learner = {}) =>
    ![learner.email, ...(learner.emailAliases || [])]
      .map(normalizeAspireNestEmail)
      .filter(Boolean)
      .some(isAspireNestStaffEmail)
  );
  const mentors = relationshipProjection.mentors;
  const learnerIndex = learnerByIdentity(learners);
  const resources = buildV8CanonicalResourceRecords({
    contentItems,
    legacyNotes,
    currentAffairs,
    studyRoadmaps,
    experienceEvents,
    mentorLiveSessions,
  })
    .map(normalizeResource)
    .filter((resource) => resource.id)
    .sort((first, second) => second.updatedMillis - first.updatedMillis);
  const grants = (Array.isArray(studentAccess) ? studentAccess : [])
    .map((record) => normalizeGrant(record, learnerIndex))
    .filter((grant) => grant.id)
    .sort((first, second) => (second.startsMillis || second.expiresMillis) - (first.startsMillis || first.expiresMillis));
  const normalizedPayments = (Array.isArray(payments) ? payments : [])
    .map((record) => normalizePayment(record, learnerIndex))
    .filter((payment) => payment.id)
    .sort((first, second) => second.dateMillis - first.dateMillis);
  const audit = [
    ...(Array.isArray(accessAuditLogs) ? accessAuditLogs : []).map((record) => normalizeAudit(record, "accessAuditLogs")),
    ...(Array.isArray(accessActionLogs) ? accessActionLogs : []).map((record) => normalizeAudit(record, "accessActionLogs")),
    ...(Array.isArray(experienceEvents) ? experienceEvents : []).map((record) => normalizeAudit(record, "experienceEvents")),
  ]
    .filter((record) => record.id)
    .sort((first, second) => second.timeMillis - first.timeMillis);
  const pendingClaims = (Array.isArray(accessInvites) ? accessInvites : [])
    .filter((record) => {
      const status = clean(record.status).toLowerCase();
      return !clean(record.uid || record.claimedUid) && !["used", "claimed", "cancelled", "expired", "revoked"].includes(status);
    })
    .map(normalizeClaim);

  return {
    learners,
    resources,
    grants,
    payments: normalizedPayments,
    mentors,
    audit,
    pendingClaims,
    defaultMentor: relationshipProjection.defaultMentor,
    missingRelationshipLearners: relationshipProjection.missingRelationshipLearners,
    products: (Array.isArray(accessProducts) ? accessProducts : [])
      .map(normalizeProduct)
      .filter((product) => product.id)
      .sort((first, second) => first.accessRank - second.accessRank),
  };
};

const COLLECTIONS = Object.freeze({
  users: "users",
  students: "students",
  learnerProfiles: "learnerProfiles",
  studentAccess: "studentAccess",
  contentItems: "contentItems",
  studyRoadmaps: "studyRoadmaps",
  payments: "payments",
  mentorProfiles: "mentorProfiles",
  mentorAssignments: "mentorAssignments",
  mentorStudentLinks: "mentorStudentLinks",
  accessAuditLogs: "accessAuditLogs",
  accessActionLogs: "accessActionLogs",
  experienceEvents: "experienceEvents",
  mentorLiveSessions: "mentorLiveSessions",
  accessInvites: "accessInvites",
  accessProducts: "accessProducts",
});

export const subscribeV8AdminLiveData = ({
  db,
  onLoading = () => {},
  onChange = () => {},
  onError = () => {},
  maxCount = 500,
} = {}) => {
  if (!db) throw new Error("Firestore is required for Admin live-data subscription.");

  const safeLimit = Math.max(1, Math.min(1000, Number(maxCount) || 500));
  const state = Object.fromEntries(Object.keys(COLLECTIONS).map((key) => [key, null]));
  const errors = {};
  let stopped = false;

  const emit = () => {
    if (stopped || Object.values(state).some((value) => !Array.isArray(value))) return;
    onChange({
      ...buildV8AdminLiveData(state),
      sourceErrors: { ...errors },
      sourceStatus: Object.fromEntries(Object.keys(COLLECTIONS).map((key) => [key, errors[key] ? "error" : state[key].length ? "ready" : "empty"])),
      sourceCounts: Object.fromEntries(Object.keys(COLLECTIONS).map((key) => [key, state[key].length])),
    });
  };

  const watch = (stateKey, collectionName) => {
    const source = collection(db, collectionName);
    return onSnapshot(
      query(source, limit(safeLimit)),
      (snapshot) => {
        state[stateKey] = docsToRecords(snapshot).filter((record) =>
          stateKey !== "mentorStudentLinks" || Boolean(clean(record.mentorUid) && clean(record.studentUid))
        );
        delete errors[stateKey];
        emit();
      },
      (error) => {
        state[stateKey] = [];
        errors[stateKey] = error?.message || String(error);
        emit();
        if (!stopped) onError(error, collectionName);
      }
    );
  };

  onLoading();
  const unsubscribe = Object.entries(COLLECTIONS).map(([stateKey, collectionName]) => watch(stateKey, collectionName));
  return () => {
    stopped = true;
    unsubscribe.forEach((stop) => {
      try {
        stop();
      } catch (_) {}
    });
  };
};
