import {
  ACCESS_ACTIVE_STATUS_VALUES,
  ACCESS_ADMIN_ROLES,
  ACCESS_BLOCKED_STATUS_VALUES,
  ACCESS_PLAN_LEVELS,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";

export const normalizeAccessPlan = (planType = ACCESS_PLAN_TYPES.FREE) => {
  const value = String(planType || ACCESS_PLAN_TYPES.FREE).trim().toUpperCase();

  if (value === "MENTOR" || value === "MENTORSHIP") return ACCESS_PLAN_TYPES.MENTORSHIP;
  if (value === "PREMIUM" || value === "PRO" || value === "PAID") return ACCESS_PLAN_TYPES.PREMIUM;
  if (value === "BASIC") return ACCESS_PLAN_TYPES.BASIC;
  if (value === "FREE") return ACCESS_PLAN_TYPES.FREE;

  return ACCESS_PLAN_TYPES.FREE;
};

export const getPlanLevel = (planType = ACCESS_PLAN_TYPES.FREE) =>
  ACCESS_PLAN_LEVELS[normalizeAccessPlan(planType)] ?? ACCESS_PLAN_LEVELS.FREE;

export const isAccessExpired = (accessUntil) => {
  if (!accessUntil) return false;

  const rawDate = typeof accessUntil?.toDate === "function" ? accessUntil.toDate() : accessUntil;
  const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return true;

  return parsedDate.getTime() < Date.now();
};

export const isAccessActive = (accessRecord = {}) => {
  if (!accessRecord) return false;

  const status = String(accessRecord.status || ACCESS_STATUS.ACTIVE).trim().toLowerCase();

  if (ACCESS_BLOCKED_STATUS_VALUES.has(status)) return false;
  if (!ACCESS_ACTIVE_STATUS_VALUES.has(status)) return false;
  if (isAccessExpired(accessRecord.accessUntil || accessRecord.expiryDate || accessRecord.validUntil)) return false;

  return true;
};

export const canUsePlan = (userPlan = ACCESS_PLAN_TYPES.FREE, requiredPlan = ACCESS_PLAN_TYPES.FREE) => {
  const normalizedRequiredPlan = normalizeAccessPlan(requiredPlan);

  if (normalizedRequiredPlan === ACCESS_PLAN_TYPES.FREE) return true;

  return getPlanLevel(userPlan) >= getPlanLevel(normalizedRequiredPlan);
};

export const normalizeScopeType = (scopeType = ACCESS_SCOPE_TYPES.PLAN) => {
  const value = String(scopeType || ACCESS_SCOPE_TYPES.PLAN).trim().toLowerCase();

  if (value === ACCESS_SCOPE_TYPES.MODULE) return ACCESS_SCOPE_TYPES.MODULE;
  if (value === ACCESS_SCOPE_TYPES.ITEM) return ACCESS_SCOPE_TYPES.ITEM;
  if (value === ACCESS_SCOPE_TYPES.BUNDLE) return ACCESS_SCOPE_TYPES.BUNDLE;

  return ACCESS_SCOPE_TYPES.PLAN;
};

export const isPlanScopedAccessRecord = (record = {}) =>
  normalizeScopeType(record?.scopeType) === ACCESS_SCOPE_TYPES.PLAN;

export const getActiveAccessRecords = (accessRecords = []) =>
  Array.isArray(accessRecords)
    ? accessRecords.filter((record) => record && isAccessActive(record))
    : [];

export const resolveBestAccess = (accessRecords = []) => {
  const activeRecords = getActiveAccessRecords(accessRecords);

  if (!activeRecords.length) return null;

  return [...activeRecords].sort((first, second) => {
    const planDiff = getPlanLevel(second.planType) - getPlanLevel(first.planType);
    if (planDiff !== 0) return planDiff;

    const firstTime = new Date(first.accessUntil || first.expiryDate || first.validUntil || 0).getTime() || 0;
    const secondTime = new Date(second.accessUntil || second.expiryDate || second.validUntil || 0).getTime() || 0;

    return secondTime - firstTime;
  })[0];
};

export const resolveBestPlanAccess = (accessRecords = []) =>
  resolveBestAccess(
    Array.isArray(accessRecords)
      ? accessRecords.filter((record) => isPlanScopedAccessRecord(record))
      : []
  );

export const hasAdminAccessBypass = ({ isAdmin = false, role = "" } = {}) => {
  if (isAdmin) return true;
  return ACCESS_ADMIN_ROLES.has(String(role || "").trim().toLowerCase());
};

export const accessRecordMatchesModule = (record = {}, module = "") => {
  if (!module) return false;

  const scopeType = normalizeScopeType(record.scopeType);

  if (scopeType !== ACCESS_SCOPE_TYPES.MODULE) return false;

  return String(record.module || "").trim() === String(module || "").trim();
};

export const accessRecordMatchesItem = (
  record = {},
  { module = "", itemType = "", itemId = "" } = {}
) => {
  if (!itemId) return false;

  const scopeType = normalizeScopeType(record.scopeType);

  if (
    scopeType !== ACCESS_SCOPE_TYPES.ITEM &&
    scopeType !== ACCESS_SCOPE_TYPES.BUNDLE
  ) {
    return false;
  }

  if (module && record.module && record.module !== module) {
    return false;
  }

  if (itemType && record.itemType && record.itemType !== itemType) {
    return false;
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    return String(record.itemId || "") === String(itemId || "");
  }

  return (
    Array.isArray(record.itemIds) &&
    record.itemIds.map((value) => String(value)).includes(String(itemId))
  );
};

const uniqueActiveRecords = (accessRecord = null, accessRecords = []) => {
  const records = [accessRecord, ...(Array.isArray(accessRecords) ? accessRecords : [])];
  const seen = new Set();

  return records.filter((record) => {
    if (!record || !isAccessActive(record)) return false;

    const key =
      String(record.id || "") ||
      [
        normalizeScopeType(record.scopeType),
        record.module || "",
        record.itemType || "",
        record.itemId || "",
        record.bundleId || "",
        normalizeAccessPlan(record.planType),
      ].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export const canAccessContent = ({
  requiredPlan = ACCESS_PLAN_TYPES.FREE,
  accessRecord = null,
  accessRecords = [],
  module = "",
  itemType = "",
  itemId = "",
  isAdmin = false,
  role = "",
} = {}) => {
  if (hasAdminAccessBypass({ isAdmin, role })) return true;

  const normalizedRequiredPlan = normalizeAccessPlan(requiredPlan);

  if (normalizedRequiredPlan === ACCESS_PLAN_TYPES.FREE) return true;

  const activeRecords = uniqueActiveRecords(accessRecord, accessRecords);

  if (itemId) {
    const hasExactItemAccess = activeRecords.some((record) =>
      accessRecordMatchesItem(record, { module, itemType, itemId })
    );

    if (hasExactItemAccess) return true;
  }

  if (module) {
    const hasModuleAccess = activeRecords.some((record) =>
      accessRecordMatchesModule(record, module) &&
      canUsePlan(record.planType, normalizedRequiredPlan)
    );

    if (hasModuleAccess) return true;
  }

  const bestPlanAccess = resolveBestPlanAccess(activeRecords);

  return Boolean(
    bestPlanAccess &&
    canUsePlan(bestPlanAccess.planType, normalizedRequiredPlan)
  );
};
