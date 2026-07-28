const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();
const upper = (value = "") => clean(value).toUpperCase();

export const V8_PLAN_LEVELS = Object.freeze({
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
});

export const normalizeV8Plan = (value = "FREE") => {
  const plan = upper(value).replace(/[\s_-]+/g, "_");
  if (["MENTOR", "MENTORSHIP", "MENTOR_GUIDED", "MENTOR-GUIDED"].includes(plan)) return "MENTORSHIP";
  if (["PREMIUM", "PRO", "PAID"].includes(plan)) return "PREMIUM";
  if (plan === "BASIC") return "BASIC";
  return "FREE";
};

export const resolveV8RecordPlan = (record = {}) => {
  const candidates = [
    record.planCode,
    record.planType,
    record.plan,
    record.accessPlan,
    record.requiredPlan,
    record.currentPlan,
    record.subscriptionType,
    record.premiumPlan,
    record.premiumStatus,
    record.membershipPlan,
    record.target,
  ];
  for (const candidate of candidates) {
    const raw = upper(candidate);
    if (!raw || ["TRUE", "FALSE", "ACTIVE", "EXPIRED", "VERIFIED"].includes(raw)) continue;
    return normalizeV8Plan(raw);
  }
  return record.isPremium === true ? "PREMIUM" : "FREE";
};

export const normalizeV8Module = (value = "") => {
  const key = lower(value).replace(/[^a-z0-9]+/g, "");
  if (!key) return "";
  if (key.includes("currentaffair")) return "currentAffairs";
  if (key.includes("roadmap") || key.includes("aspirepath")) return "roadmap";
  if (key.includes("mock") || key.includes("test") || key.includes("practice")) return "mockTest";
  if (key.includes("video") || key.includes("live") || key.includes("replay") || key.includes("class")) return "video";
  if (key.includes("note") || key.includes("intellitext") || key.includes("learningtext") || key.includes("pdf")) return "notes";
  return key;
};

export const resolveV8ResourcePlan = (record = {}, resourceType = "") => {
  const plan = resolveV8RecordPlan(record);
  const module = normalizeV8Module(
    resourceType || record.resourceType || record.contentType || record.itemType || record.section || record.module || record.type
  );
  // Founder-approved migration: only Mentorship-tier Notes move to Premium.
  if (module === "notes" && plan === "MENTORSHIP") return "PREMIUM";
  return plan;
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

export const isV8EntitlementActive = (record = {}, now = Date.now()) => {
  const status = lower(record.status || record.accessStatus || "active");
  if (["revoked", "expired", "inactive", "disabled", "cancelled", "denied", "blocked", "rejected", "failed"].includes(status)) return false;
  const starts = toMillis(record.accessFrom || record.startsAt || record.startDate || record.validFrom);
  const expires = toMillis(record.accessUntil || record.expiresAt || record.endDate || record.validUntil || record.expiryDate);
  if (starts && starts > now) return false;
  if (expires && expires <= now && record.noExpiry !== true && record.untilManualChange !== true) return false;
  return !status || ["active", "approved", "verified", "granted", "paid", "success", "live"].includes(status);
};

const resourceIds = (resource = {}) => [
  resource.id,
  resource.resourceId,
  resource.itemId,
  resource.textbookId,
  resource.videoId,
  resource.testId,
  resource.mockTestId,
  resource.roadmapId,
].map(clean).filter(Boolean);

export const v8EntitlementMatchesResource = (grant = {}, resource = {}, now = Date.now()) => {
  if (!isV8EntitlementActive(grant, now)) return false;
  const scope = lower(grant.scopeType || grant.scope || grant.accessScope || "plan");
  const ids = resourceIds(resource);
  if (scope === "item") {
    const itemId = clean(grant.itemId || grant.resourceId || grant.target);
    return Boolean(itemId && ids.includes(itemId));
  }
  if (scope === "bundle") {
    const itemIds = Array.isArray(grant.itemIds || grant.resourceIds)
      ? (grant.itemIds || grant.resourceIds).map(clean)
      : [];
    return itemIds.some((id) => ids.includes(id));
  }
  if (scope === "module") {
    const grantModule = normalizeV8Module(grant.module || grant.moduleKey || grant.target);
    const resourceModule = normalizeV8Module(resource.module || resource.moduleKey || resource.section || resource.resourceType || resource.contentType || resource.type);
    if (!grantModule || grantModule !== resourceModule) return false;
  }
  return (V8_PLAN_LEVELS[resolveV8RecordPlan(grant)] ?? 0) >=
    (V8_PLAN_LEVELS[resolveV8ResourcePlan(resource)] ?? 0);
};

export const resolveV8EffectivePlan = ({ profile = {}, accessRecords = [] } = {}) => {
  const candidates = [isV8EntitlementActive(profile) ? resolveV8RecordPlan(profile) : "FREE"];
  (Array.isArray(accessRecords) ? accessRecords : []).forEach((record) => {
    const scope = lower(record.scopeType || record.scope || record.accessScope || "plan");
    if (scope === "plan" && isV8EntitlementActive(record)) candidates.push(resolveV8RecordPlan(record));
  });
  return candidates.reduce(
    (best, candidate) => (V8_PLAN_LEVELS[candidate] ?? 0) > (V8_PLAN_LEVELS[best] ?? 0) ? candidate : best,
    "FREE"
  );
};

export const canV8AccessResource = ({ resource = {}, accessRecords = [], userPlan = "FREE", now = Date.now() } = {}) => {
  const requiredPlan = resolveV8ResourcePlan(resource);
  if (requiredPlan === "FREE") return true;
  if ((V8_PLAN_LEVELS[normalizeV8Plan(userPlan)] ?? 0) >= (V8_PLAN_LEVELS[requiredPlan] ?? 0)) return true;
  return (Array.isArray(accessRecords) ? accessRecords : []).some((record) =>
    v8EntitlementMatchesResource(record, { ...resource, requiredPlan }, now)
  );
};

export const __private__ = { clean, lower, upper, toMillis, resourceIds };
