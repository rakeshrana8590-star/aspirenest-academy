import {
  ACCESS_ACTIVE_STATUS_VALUES,
  ACCESS_ADMIN_ROLES,
  ACCESS_BLOCKED_STATUS_VALUES,
  ACCESS_PLAN_LEVELS,
  ACCESS_PLAN_TYPES,
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

export const canAccessContent = ({
  requiredPlan = ACCESS_PLAN_TYPES.FREE,
  userPlan = ACCESS_PLAN_TYPES.FREE,
  accessRecord = null,
  accessRecords = [],
  isAdmin = false,
  role = "",
} = {}) => {
  if (hasAdminAccessBypass({ isAdmin, role })) return true;
  if (normalizeAccessPlan(requiredPlan) === ACCESS_PLAN_TYPES.FREE) return true;

  if (accessRecord && isAccessActive(accessRecord) && canUsePlan(accessRecord.planType, requiredPlan)) {
    return true;
  }

  const bestAccess = resolveBestAccess(accessRecords);

  if (bestAccess && canUsePlan(bestAccess.planType, requiredPlan)) {
    return true;
  }

  return canUsePlan(userPlan, requiredPlan);
};
