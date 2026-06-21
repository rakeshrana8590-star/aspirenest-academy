export const ACCESS_PLAN_TYPES = Object.freeze({
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  MENTORSHIP: "MENTORSHIP",
});

export const ACCESS_PLAN_ORDER = Object.freeze([
  ACCESS_PLAN_TYPES.FREE,
  ACCESS_PLAN_TYPES.BASIC,
  ACCESS_PLAN_TYPES.PREMIUM,
  ACCESS_PLAN_TYPES.MENTORSHIP,
]);

export const ACCESS_PLAN_LEVELS = Object.freeze({
  [ACCESS_PLAN_TYPES.FREE]: 0,
  [ACCESS_PLAN_TYPES.BASIC]: 1,
  [ACCESS_PLAN_TYPES.PREMIUM]: 2,
  [ACCESS_PLAN_TYPES.MENTORSHIP]: 3,
});

export const ACCESS_STATUS = Object.freeze({
  ACTIVE: "active",
  PENDING: "pending",
  EXPIRED: "expired",
  BLOCKED: "blocked",
});

export const ACCESS_ACTIVE_STATUS_VALUES = new Set([
  ACCESS_STATUS.ACTIVE,
  "approved",
  "paid",
  "success",
  "verified",
  "live",
]);

export const ACCESS_BLOCKED_STATUS_VALUES = new Set([
  ACCESS_STATUS.EXPIRED,
  ACCESS_STATUS.BLOCKED,
  "cancelled",
  "rejected",
  "failed",
]);

export const ACCESS_SOURCE = Object.freeze({
  PAYMENT: "payment",
  ADMIN_MANUAL: "admin_manual",
  BULK_IMPORT: "bulk_import",
  TRIAL: "trial",
});

export const ACCESS_COURSE = Object.freeze({
  CTET_TET: "CTET_TET",
});

export const ACCESS_MODULE = Object.freeze({
  NOTES: "notes",
  MOCK_TEST: "mockTest",
  VIDEO: "video",
  CURRENT_AFFAIRS: "currentAffairs",
  ROADMAP: "roadmap",
});

export const ACCESS_ADMIN_ROLES = new Set([
  "admin",
  "super_admin",
  "owner",
]);
