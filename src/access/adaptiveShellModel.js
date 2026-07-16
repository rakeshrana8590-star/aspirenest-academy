import {
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  getInitialSeedPlan,
  normalizeAccessRank,
  normalizePlanCode,
} from "./accessPlanCatalog";
import {
  isAccessActive,
  isAccessExpired,
  normalizeScopeType,
} from "./accessUtils";

export const ADAPTIVE_SHELL_MODES = Object.freeze({
  GUEST: "guest",
  LOADING: "loading",
  ERROR: "error",
  ADMIN: "admin",
  ACTIVE: "active",
  PARTIAL: "partial",
  FREE: "free",
  EXPIRED: "expired",
  BLOCKED: "blocked",
});

const BLOCKED_STATUS_VALUES = new Set([
  ACCESS_STATUS.BLOCKED,
  "cancelled",
  "rejected",
  "failed",
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const getStatusValue = (record = {}) =>
  cleanString(record?.status).toLowerCase();

const toComparableTime = (value) => {
  if (!value) return 0;

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const parsed =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);
  const time = parsed.getTime();

  return Number.isFinite(time) ? time : 0;
};

const getPlanCode = (record = {}) =>
  normalizePlanCode(
    record.planCode ||
      record.planType ||
      "FREE"
  );

const getPlanRank = (record = {}) =>
  normalizeAccessRank(
    record.accessRank ??
      record.planRank ??
      record.rank,
    {
      planCode: getPlanCode(record),
      required: false,
    }
  );

const getPlanExpiryTime = (record = {}) => {
  if (
    record.noExpiry === true ||
    record.untilManualChange === true
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return toComparableTime(
    record.accessUntil ||
      record.expiryDate ||
      record.validUntil
  );
};

const getPlanActivityTime = (record = {}) =>
  Math.max(
    toComparableTime(record.updatedAt),
    toComparableTime(record.createdAt),
    toComparableTime(record.grantedAt),
    toComparableTime(record.approvedAt)
  );

const humanizePlanCode = (planCode = "FREE") =>
  normalizePlanCode(planCode)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (token) =>
        token.charAt(0).toUpperCase() +
        token.slice(1)
    )
    .join(" ");

const getPlanLabel = (
  record = {},
  planCode = "FREE"
) => {
  const directLabel = cleanString(
    record.planTitle ||
      record.productTitle ||
      record.planName ||
      record.productName ||
      record.displayName
  );

  if (directLabel) return directLabel;

  return (
    getInitialSeedPlan(planCode)?.title ||
    humanizePlanCode(planCode)
  );
};

const isPlanRecord = (record = {}) =>
  normalizeScopeType(record.scopeType) ===
  ACCESS_SCOPE_TYPES.PLAN;

const isBlockedPlanRecord = (record = {}) =>
  isPlanRecord(record) &&
  BLOCKED_STATUS_VALUES.has(
    getStatusValue(record)
  );

const isExpiredPlanRecord = (record = {}) =>
  isPlanRecord(record) &&
  isAccessExpired(
    record.accessUntil ||
      record.expiryDate ||
      record.validUntil
  );

const comparePlanRecords = (
  first = {},
  second = {}
) => {
  const firstRank = getPlanRank(first);
  const secondRank = getPlanRank(second);
  const rankDifference =
    (secondRank ?? -1) -
    (firstRank ?? -1);

  if (rankDifference !== 0) {
    return rankDifference;
  }

  const expiryDifference =
    getPlanExpiryTime(second) -
    getPlanExpiryTime(first);

  if (
    Number.isFinite(expiryDifference) &&
    expiryDifference !== 0
  ) {
    return expiryDifference;
  }

  if (
    getPlanExpiryTime(second) ===
      Number.POSITIVE_INFINITY &&
    getPlanExpiryTime(first) !==
      Number.POSITIVE_INFINITY
  ) {
    return 1;
  }

  if (
    getPlanExpiryTime(first) ===
      Number.POSITIVE_INFINITY &&
    getPlanExpiryTime(second) !==
      Number.POSITIVE_INFINITY
  ) {
    return -1;
  }

  return (
    getPlanActivityTime(second) -
    getPlanActivityTime(first)
  );
};

export const resolveAdaptiveShellPlan = (
  accessRecords = []
) => {
  const activePlanRecords = (
    Array.isArray(accessRecords)
      ? accessRecords
      : []
  ).filter(
    (record) =>
      record &&
      isPlanRecord(record) &&
      isAccessActive(record)
  );

  if (!activePlanRecords.length) {
    return null;
  }

  const record = [
    ...activePlanRecords,
  ].sort(comparePlanRecords)[0];
  const planCode = getPlanCode(record);
  const accessRank = getPlanRank(record);

  if (
    planCode !== "FREE" &&
    accessRank === null
  ) {
    return null;
  }

  return Object.freeze({
    id: cleanString(record.id) || null,
    planCode,
    planType: planCode,
    label: getPlanLabel(
      record,
      planCode
    ),
    accessRank,
    productId:
      cleanString(
        record.productId
      ) || null,
    accessUntil:
      record.accessUntil ||
      record.expiryDate ||
      record.validUntil ||
      null,
    noExpiry:
      record.noExpiry === true,
    untilManualChange:
      record.untilManualChange === true,
    source:
      cleanString(record.source) || null,
    isCustomPlan:
      !getInitialSeedPlan(planCode),
    record,
  });
};

const summarizeActiveScopes = (
  accessRecords = []
) => {
  const activeRecords = (
    Array.isArray(accessRecords)
      ? accessRecords
      : []
  ).filter(
    (record) =>
      record &&
      isAccessActive(record)
  );
  const counts = {
    plan: 0,
    module: 0,
    item: 0,
    bundle: 0,
  };

  activeRecords.forEach((record) => {
    const scopeType =
      normalizeScopeType(
        record.scopeType
      );

    if (
      Object.prototype.hasOwnProperty.call(
        counts,
        scopeType
      )
    ) {
      counts[scopeType] += 1;
    }
  });

  return Object.freeze({
    total: activeRecords.length,
    ...counts,
  });
};

export const buildAdaptiveShellState = ({
  user = null,
  accessRecords = [],
  loading = false,
  error = null,
  isAdminUser = false,
} = {}) => {
  const isAuthenticated =
    Boolean(user?.uid || user?.email);
  const scopeSummary =
    summarizeActiveScopes(
      accessRecords
    );
  const activePlan =
    resolveAdaptiveShellPlan(
      accessRecords
    );

  if (!isAuthenticated) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.GUEST,
      isAuthenticated: false,
      isAdminUser: false,
      isFailClosed: false,
      canUseProtectedNavigation: false,
      accountRoleLabel: "Login",
      accessLabel: "Start Learning",
      activePlan: null,
      scopeSummary,
    });
  }

  if (loading) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.LOADING,
      isAuthenticated: true,
      isAdminUser:
        Boolean(isAdminUser),
      isFailClosed: true,
      canUseProtectedNavigation: false,
      accountRoleLabel:
        isAdminUser
          ? "Admin"
          : "Student",
      accessLabel:
        "Checking access",
      activePlan: null,
      scopeSummary,
    });
  }

  if (error) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.ERROR,
      isAuthenticated: true,
      isAdminUser:
        Boolean(isAdminUser),
      isFailClosed: true,
      canUseProtectedNavigation: false,
      accountRoleLabel:
        isAdminUser
          ? "Admin"
          : "Student",
      accessLabel:
        "Access unavailable",
      activePlan: null,
      scopeSummary,
    });
  }

  if (isAdminUser) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.ADMIN,
      isAuthenticated: true,
      isAdminUser: true,
      isFailClosed: false,
      canUseProtectedNavigation: true,
      accountRoleLabel: "Admin",
      accessLabel: "Admin Access",
      activePlan,
      scopeSummary,
    });
  }

  if (activePlan) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.ACTIVE,
      isAuthenticated: true,
      isAdminUser: false,
      isFailClosed: false,
      canUseProtectedNavigation: true,
      accountRoleLabel: "Student",
      accessLabel:
        activePlan.label,
      activePlan,
      scopeSummary,
    });
  }

  const safeRecords = Array.isArray(
    accessRecords
  )
    ? accessRecords
    : [];
  const hasUnresolvedActivePlan =
    safeRecords.some(
      (record) =>
        record &&
        isPlanRecord(record) &&
        isAccessActive(record)
    );

  if (hasUnresolvedActivePlan) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.ERROR,
      isAuthenticated: true,
      isAdminUser: false,
      isFailClosed: true,
      canUseProtectedNavigation: false,
      accountRoleLabel: "Student",
      accessLabel:
        "Access unavailable",
      activePlan: null,
      scopeSummary,
    });
  }

  const hasBlockedPlan =
    safeRecords.some(
      isBlockedPlanRecord
    );
  const hasExpiredPlan =
    safeRecords.some(
      isExpiredPlanRecord
    );

  if (hasBlockedPlan) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.BLOCKED,
      isAuthenticated: true,
      isAdminUser: false,
      isFailClosed: true,
      canUseProtectedNavigation: false,
      accountRoleLabel: "Student",
      accessLabel: "Access blocked",
      activePlan: null,
      scopeSummary,
    });
  }

  if (hasExpiredPlan) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.EXPIRED,
      isAuthenticated: true,
      isAdminUser: false,
      isFailClosed: true,
      canUseProtectedNavigation: false,
      accountRoleLabel: "Student",
      accessLabel: "Access expired",
      activePlan: null,
      scopeSummary,
    });
  }

  if (
    scopeSummary.module > 0 ||
    scopeSummary.item > 0 ||
    scopeSummary.bundle > 0
  ) {
    return Object.freeze({
      mode:
        ADAPTIVE_SHELL_MODES.PARTIAL,
      isAuthenticated: true,
      isAdminUser: false,
      isFailClosed: false,
      canUseProtectedNavigation: true,
      accountRoleLabel: "Student",
      accessLabel: "Partial Access",
      activePlan: null,
      scopeSummary,
    });
  }

  return Object.freeze({
    mode:
      ADAPTIVE_SHELL_MODES.FREE,
    isAuthenticated: true,
    isAdminUser: false,
    isFailClosed: false,
    canUseProtectedNavigation: false,
    accountRoleLabel: "Student",
    accessLabel: "Free Access",
    activePlan: null,
    scopeSummary,
  });
};
