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

export const resolveBestAccess = (accessRecords = []) => {
  const activeRecords = Array.isArray(accessRecords)
    ? accessRecords.filter((record) => isAccessActive(record))
    : [];

  if (!activeRecords.length) return null;

  return activeRecords.sort((first, second) => {
    const planDiff = getPlanLevel(second.planType) - getPlanLevel(first.planType);
    if (planDiff !== 0) return planDiff;

    const firstTime = new Date(first.accessUntil || first.expiryDate || first.validUntil || 0).getTime() || 0;
    const secondTime = new Date(second.accessUntil || second.expiryDate || second.validUntil || 0).getTime() || 0;

    return secondTime - firstTime;
  })[0];
};

export const hasAdminAccessBypass = ({ isAdmin = false, role = "" } = {}) => {
  if (isAdmin) return true;
  return ACCESS_ADMIN_ROLES.has(String(role || "").trim().toLowerCase());
};

export const normalizeScopeType = (scopeType = ACCESS_SCOPE_TYPES.PLAN) => {
  const value = String(scopeType || ACCESS_SCOPE_TYPES.PLAN).trim().toLowerCase();

  if (value === ACCESS_SCOPE_TYPES.MODULE) return ACCESS_SCOPE_TYPES.MODULE;
  if (value === ACCESS_SCOPE_TYPES.ITEM) return ACCESS_SCOPE_TYPES.ITEM;
  if (value === ACCESS_SCOPE_TYPES.BUNDLE) return ACCESS_SCOPE_TYPES.BUNDLE;

  return ACCESS_SCOPE_TYPES.PLAN;
};

export const accessRecordMatchesModule = (record = {}, module = "") => {
  if (!module) return true;
  const scopeType = normalizeScopeType(record.scopeType);

  if (scopeType === ACCESS_SCOPE_TYPES.PLAN) return true;
  return record.module === module;
};

export const accessRecordMatchesItem = (
  record = {},
  { module = "", itemType = "", itemId = "" } = {}
) => {
  if (!itemId) return false;

  const scopeType = normalizeScopeType(record.scopeType);

  if (scopeType === ACCESS_SCOPE_TYPES.PLAN) return false;

  if (module && record.module && record.module !== module) {
    return false;
  }

  if (itemType && record.itemType && record.itemType !== itemType) {
    return false;
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    return record.itemId === itemId;
  }

  if (scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
    return Array.isArray(record.itemIds) && record.itemIds.includes(itemId);
  }

  return false;
};

export const canAccessContent = ({
  requiredPlan = ACCESS_PLAN_TYPES.FREE,
  userPlan = ACCESS_PLAN_TYPES.FREE,
  accessRecord = null,
  accessRecords = [],
  module = "",
  itemType = "",
  itemId = "",
  emergencyAccess = false,
  isAdmin = false,
  role = "",
} = {}) => {
  if (hasAdminAccessBypass({ isAdmin, role })) return true;
  if (emergencyAccess) return true;

  const activeRecords = [accessRecord, ...accessRecords].filter((record) =>
    record && isAccessActive(record)
  );

  if (itemId) {
    const hasExactItemAccess = activeRecords.some((record) =>
      accessRecordMatchesItem(record, { module, itemType, itemId })
    );

    if (hasExactItemAccess) return true;
  }

  if (module) {
    const hasModuleAccess = activeRecords.some((record) => {
      const scopeType = normalizeScopeType(record.scopeType);

      if (scopeType === ACCESS_SCOPE_TYPES.MODULE) {
        return accessRecordMatchesModule(record, module);
      }

      return false;
    });

    if (hasModuleAccess) return true;
  }

  if (normalizeAccessPlan(requiredPlan) === ACCESS_PLAN_TYPES.FREE) return true;

  if (
    accessRecord &&
    isAccessActive(accessRecord) &&
    canUsePlan(accessRecord.planType, requiredPlan)
  ) {
    return true;
  }

  const planRecords = activeRecords.filter(
    (record) => normalizeScopeType(record.scopeType) === ACCESS_SCOPE_TYPES.PLAN
  );

  const bestAccess = resolveBestAccess(planRecords);

  if (bestAccess && canUsePlan(bestAccess.planType, requiredPlan)) {
    return true;
  }

  return canUsePlan(userPlan, requiredPlan);
};
