import {
  ACCESS_ACTIVE_STATUS_VALUES,
  ACCESS_ADMIN_ROLES,
  ACCESS_BLOCKED_STATUS_VALUES,
  ACCESS_PLAN_LEVELS,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
} from "./accessConstants";

const KNOWN_ACCESS_PLANS = new Set(Object.values(ACCESS_PLAN_TYPES));

const KNOWN_ACCESS_SCOPES = new Set(
  Object.values(ACCESS_SCOPE_TYPES).map((value) =>
    String(value || "").trim().toLowerCase()
  )
);

export const normalizeAccessPlan = (planType = ACCESS_PLAN_TYPES.FREE) => {
  const value = String(planType || ACCESS_PLAN_TYPES.FREE).trim().toUpperCase();

  if (value === "MENTOR" || value === "MENTORSHIP") return ACCESS_PLAN_TYPES.MENTORSHIP;
  if (value === "PREMIUM" || value === "PRO" || value === "PAID") return ACCESS_PLAN_TYPES.PREMIUM;
  if (value === "BASIC") return ACCESS_PLAN_TYPES.BASIC;
  if (value === "FREE") return ACCESS_PLAN_TYPES.FREE;

  return ACCESS_PLAN_TYPES.FREE;
};

export const isKnownAccessPlan = (planType) =>
  KNOWN_ACCESS_PLANS.has(String(planType || "").trim().toUpperCase());

export const isKnownAccessScope = (scopeType) =>
  KNOWN_ACCESS_SCOPES.has(
    String(scopeType || "").trim().toLowerCase()
  );

export const getPlanLevel = (planType = ACCESS_PLAN_TYPES.FREE) =>
  ACCESS_PLAN_LEVELS[normalizeAccessPlan(planType)] ?? ACCESS_PLAN_LEVELS.FREE;

const toAccessDate = (value) => {
  if (!value) return null;

  const rawDate = typeof value?.toDate === "function" ? value.toDate() : value;
  const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const isAccessExpired = (accessUntil) => {
  if (!accessUntil) return false;

  const parsedDate = toAccessDate(accessUntil);
  if (!parsedDate) return true;

  return parsedDate.getTime() <= Date.now();
};

export const isAccessNotStarted = (accessFrom) => {
  if (!accessFrom) return false;

  const parsedDate = toAccessDate(accessFrom);
  if (!parsedDate) return true;

  return parsedDate.getTime() > Date.now();
};

export const isAccessActive = (accessRecord = {}) => {
  if (!accessRecord) return false;

  const status = String(accessRecord.status || "").trim().toLowerCase();

  if (!status) return false;
  if (ACCESS_BLOCKED_STATUS_VALUES.has(status)) return false;
  if (!ACCESS_ACTIVE_STATUS_VALUES.has(status)) return false;
  if (!isKnownAccessPlan(accessRecord.planType)) return false;
  if (!isKnownAccessScope(accessRecord.scopeType)) return false;
  if (isAccessNotStarted(accessRecord.accessFrom || accessRecord.startsAt || accessRecord.startAt)) return false;
  if (isAccessExpired(accessRecord.accessUntil || accessRecord.expiryDate || accessRecord.validUntil)) return false;

  return true;
};

export const canUsePlan = (userPlan = ACCESS_PLAN_TYPES.FREE, requiredPlan = ACCESS_PLAN_TYPES.FREE) => {
  if (!isKnownAccessPlan(requiredPlan)) return false;

  const normalizedRequiredPlan = normalizeAccessPlan(requiredPlan);

  if (normalizedRequiredPlan === ACCESS_PLAN_TYPES.FREE) return true;
  if (!isKnownAccessPlan(userPlan)) return false;

  return getPlanLevel(userPlan) >= getPlanLevel(normalizedRequiredPlan);
};

export const resolveBestAccess = (accessRecords = []) => {
  const activeRecords = Array.isArray(accessRecords)
    ? accessRecords.filter((record) => isAccessActive(record))
    : [];

  if (!activeRecords.length) return null;

  return [...activeRecords].sort((first, second) => {
    const planDiff = getPlanLevel(second.planType) - getPlanLevel(first.planType);
    if (planDiff !== 0) return planDiff;

    const firstTime = toAccessDate(first.accessUntil || first.expiryDate || first.validUntil)?.getTime() || 0;
    const secondTime = toAccessDate(second.accessUntil || second.expiryDate || second.validUntil)?.getTime() || 0;

    return secondTime - firstTime;
  })[0];
};

export const hasAdminAccessBypass = ({ isAdmin = false, role = "" } = {}) => {
  if (isAdmin) return true;
  return ACCESS_ADMIN_ROLES.has(String(role || "").trim().toLowerCase());
};

export const normalizeScopeType = (scopeType = "") => {
  const value = String(scopeType || "").trim().toLowerCase();

  if (value === ACCESS_SCOPE_TYPES.PLAN) return ACCESS_SCOPE_TYPES.PLAN;
  if (value === ACCESS_SCOPE_TYPES.MODULE) return ACCESS_SCOPE_TYPES.MODULE;
  if (value === ACCESS_SCOPE_TYPES.ITEM) return ACCESS_SCOPE_TYPES.ITEM;
  if (value === ACCESS_SCOPE_TYPES.BUNDLE) return ACCESS_SCOPE_TYPES.BUNDLE;

  return "";
};

const normalizeAccessValue = (value = "") => String(value || "").trim().toLowerCase();
const normalizeAccessId = (value = "") => String(value || "").trim();

export const accessRecordMatchesCourse = (record = {}, course = "") => {
  if (!course) return true;
  return normalizeAccessValue(record.course) === normalizeAccessValue(course);
};

export const accessRecordMatchesModule = (record = {}, module = "") => {
  if (!module) return true;
  const scopeType = normalizeScopeType(record.scopeType);

  if (scopeType === ACCESS_SCOPE_TYPES.PLAN) return true;
  return normalizeAccessValue(record.module) === normalizeAccessValue(module);
};

export const accessRecordMatchesItem = (
  record = {},
  { module = "", itemType = "", itemId = "" } = {}
) => {
  if (!itemId) return false;

  const scopeType = normalizeScopeType(record.scopeType);

  if (scopeType === ACCESS_SCOPE_TYPES.PLAN || scopeType === ACCESS_SCOPE_TYPES.MODULE) {
    return false;
  }

  if (module && normalizeAccessValue(record.module) !== normalizeAccessValue(module)) {
    return false;
  }

  if (itemType && normalizeAccessValue(record.itemType) !== normalizeAccessValue(itemType)) {
    return false;
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    return normalizeAccessId(record.itemId) === normalizeAccessId(itemId);
  }

  if (scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
    return Array.isArray(record.itemIds) && record.itemIds.some(
      (recordItemId) => normalizeAccessId(recordItemId) === normalizeAccessId(itemId)
    );
  }

  return false;
};

export const canAccessContent = ({
  requiredPlan = ACCESS_PLAN_TYPES.FREE,
  accessRecord = null,
  accessRecords = [],
  course = "",
  module = "",
  itemType = "",
  itemId = "",
  isAdmin = false,
  role = "",
} = {}) => {
  if (hasAdminAccessBypass({ isAdmin, role })) return true;
  if (!isKnownAccessPlan(requiredPlan)) return false;

  const normalizedRequiredPlan = normalizeAccessPlan(requiredPlan);

  if (normalizedRequiredPlan === ACCESS_PLAN_TYPES.FREE) return true;

  const seen = new Set();
  const activeRecords = [accessRecord, ...accessRecords].filter((record) => {
    if (!record || !isAccessActive(record) || !accessRecordMatchesCourse(record, course)) {
      return false;
    }

    const key = record.id || [
      record.uid,
      record.normalizedEmail || record.email,
      record.course,
      record.scopeType,
      record.module,
      record.itemType,
      record.itemId,
      record.planType,
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (itemId) {
    const hasExactItemAccess = activeRecords.some((record) =>
      accessRecordMatchesItem(record, { module, itemType, itemId })
    );

    if (hasExactItemAccess) return true;
  }

  if (module) {
    const hasModuleAccess = activeRecords.some((record) =>
      normalizeScopeType(record.scopeType) === ACCESS_SCOPE_TYPES.MODULE &&
      accessRecordMatchesModule(record, module)
    );

    if (hasModuleAccess) return true;
  }

  const planRecords = activeRecords.filter(
    (record) => normalizeScopeType(record.scopeType) === ACCESS_SCOPE_TYPES.PLAN
  );
  const bestPlanAccess = resolveBestAccess(planRecords);

  return Boolean(
    bestPlanAccess && canUsePlan(bestPlanAccess.planType, normalizedRequiredPlan)
  );
};
