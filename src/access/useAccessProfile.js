import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  canAccessContent,
  isAccessActive,
  isAccessExpired,
  normalizeAccessPlan,
  normalizeScopeType,
  resolveBestPlanAccess,
} from "./accessUtils";
import {
  claimPendingAccessIdentity,
  getAccessByEmail,
  getAccessByUid,
} from "./accessService";
import {
  filterAccessRecordsForVerifiedPrincipal,
} from "./accessIdentityClaim";
import {
  buildAdaptiveShellState,
} from "./adaptiveShellModel";
import {
  buildAdaptiveShellNavigation,
} from "./adaptiveShellNavigation";
import {
  buildMyAccessModel,
} from "./myAccessModel";

const EMPTY_ACCESS_RECORDS = [];

const BLOCKED_STATUSES = new Set([
  ACCESS_STATUS.BLOCKED,
  "cancelled",
  "rejected",
  "failed",
]);

const resolveFallbackPlan = (profile = {}, fallbackPlanType = ACCESS_PLAN_TYPES.FREE) => {
  const directPlan =
    profile.planType ||
    profile.subscriptionType ||
    profile.accessPlan ||
    profile.currentPlan ||
    fallbackPlanType;

  const normalizedPlan = normalizeAccessPlan(directPlan);

  if (normalizedPlan !== ACCESS_PLAN_TYPES.FREE) {
    return normalizedPlan;
  }

  if (profile.isPremium === true || profile.isPremiumUser === true) {
    return ACCESS_PLAN_TYPES.PREMIUM;
  }

  return ACCESS_PLAN_TYPES.FREE;
};

const resolveFallbackExpiry = (profile = {}, fallbackExpiry = null) =>
  profile.membershipExpiry ||
  profile.expiryDate ||
  profile.accessUntil ||
  profile.validUntil ||
  fallbackExpiry ||
  null;

const resolveAccessExpiry = (accessRecord = null, fallbackExpiry = null) => {
  if (!accessRecord) return fallbackExpiry || null;

  return (
    accessRecord.accessUntil ||
    accessRecord.expiryDate ||
    accessRecord.validUntil ||
    fallbackExpiry ||
    null
  );
};

const getAccessStatusValue = (record = null) =>
  String(record?.status || "").trim().toLowerCase();

const isBlockedAccessRecord = (record = null) =>
  BLOCKED_STATUSES.has(getAccessStatusValue(record));

const buildFallbackAccess = ({
  user = null,
  profile = {},
  fallbackPlanType = ACCESS_PLAN_TYPES.FREE,
  fallbackExpiry = null,
} = {}) => {
  const email = String(user?.email || profile?.email || "").trim().toLowerCase();
  const uid = String(user?.uid || profile?.uid || "").trim();
  const planType = resolveFallbackPlan(profile, fallbackPlanType);
  const accessUntil = resolveFallbackExpiry(profile, fallbackExpiry);

  return {
    id: "fallback-profile-access",
    email,
    normalizedEmail: email,
    uid,
    planType,
    scopeType: ACCESS_SCOPE_TYPES.PLAN,
    status: ACCESS_STATUS.ACTIVE,
    source: "profile_fallback",
    accessUntil,
  };
};

const getPlanRecords = (accessRecords = []) =>
  (Array.isArray(accessRecords) ? accessRecords : []).filter(
    (record) => normalizeScopeType(record?.scopeType) === ACCESS_SCOPE_TYPES.PLAN
  );

const getLatestPlanRecord = (accessRecords = []) => {
  const records = getPlanRecords(accessRecords);

  if (!records.length) return null;

  return [...records].sort((first, second) => {
    const firstTime = new Date(
      first.accessUntil || first.expiryDate || first.validUntil || first.updatedAt || 0
    ).getTime() || 0;
    const secondTime = new Date(
      second.accessUntil || second.expiryDate || second.validUntil || second.updatedAt || 0
    ).getTime() || 0;

    return secondTime - firstTime;
  })[0];
};

export default function useAccessProfile({
  user = null,
  profile = {},
  fallbackPlanType = ACCESS_PLAN_TYPES.FREE,
  fallbackExpiry = null,
  allowLegacyProfileFallback = false,
  isAdminUser = false,
  resumeRoute = "",
  currentPath = "",
  enabled = true,
} = {}) {
  const [loading, setLoading] = useState(false);
  const [accessRecords, setAccessRecords] = useState(EMPTY_ACCESS_RECORDS);
  const [error, setError] = useState(null);

  const uid = String(user?.uid || profile?.uid || "").trim();
  const email = String(user?.email || profile?.email || "").trim().toLowerCase();

  const fallbackAccess = useMemo(
    () =>
      buildFallbackAccess({
        user,
        profile,
        fallbackPlanType,
        fallbackExpiry,
      }),
    [user, profile, fallbackPlanType, fallbackExpiry]
  );

  const loadAccessProfile = useCallback(async () => {
    if (!enabled || (!uid && !email)) {
      setAccessRecords(EMPTY_ACCESS_RECORDS);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (uid && email) {
        await claimPendingAccessIdentity({
          user: { uid, email },
        });
      }

      const [uidRecords, emailRecords] = await Promise.all([
        uid ? getAccessByUid(uid) : Promise.resolve([]),
        email ? getAccessByEmail(email) : Promise.resolve([]),
      ]);

      const mergedRecords =
        filterAccessRecordsForVerifiedPrincipal(
          [...uidRecords, ...emailRecords],
          { uid, email }
        );

      setAccessRecords(mergedRecords);
    } catch (accessError) {
      setError(accessError);
      setAccessRecords(EMPTY_ACCESS_RECORDS);
    } finally {
      setLoading(false);
    }
  }, [enabled, uid, email]);

  useEffect(() => {
    loadAccessProfile();
  }, [loadAccessProfile]);

  const bestPlanAccess = useMemo(
    () => resolveBestPlanAccess(accessRecords),
    [accessRecords]
  );

  const latestPlanAccess = useMemo(
    () => getLatestPlanRecord(accessRecords),
    [accessRecords]
  );

  const legacyFallbackAccess = allowLegacyProfileFallback ? fallbackAccess : null;
  const bestAccess = bestPlanAccess || legacyFallbackAccess;
  const activePlan = normalizeAccessPlan(
    bestPlanAccess?.planType || legacyFallbackAccess?.planType || ACCESS_PLAN_TYPES.FREE
  );
  const membershipExpiry = resolveAccessExpiry(
    bestPlanAccess || latestPlanAccess,
    allowLegacyProfileFallback ? fallbackAccess.accessUntil : null
  );

  const planRecords = getPlanRecords(accessRecords);
  const isBlocked = !bestPlanAccess && planRecords.some(isBlockedAccessRecord);
  const isExpired =
    !bestPlanAccess &&
    planRecords.some((record) =>
      isAccessExpired(record.accessUntil || record.expiryDate || record.validUntil)
    );

  const hasActiveBestAccess = bestPlanAccess
    ? isAccessActive(bestPlanAccess)
    : Boolean(legacyFallbackAccess);

  const accessStatus = error
    ? ACCESS_STATUS.ERROR
    : isBlocked
      ? ACCESS_STATUS.BLOCKED
      : isExpired
        ? ACCESS_STATUS.EXPIRED
        : hasActiveBestAccess
          ? ACCESS_STATUS.ACTIVE
          : ACCESS_STATUS.PENDING;

  const isAccessCheckUnavailable = loading || Boolean(error);

  const hasAccess = useCallback(
    (requiredPlan = ACCESS_PLAN_TYPES.FREE, options = {}) => {
      const normalizedRequiredPlan = normalizeAccessPlan(requiredPlan);

      if (normalizedRequiredPlan === ACCESS_PLAN_TYPES.FREE) return true;
      if (isAccessCheckUnavailable) return false;

      return canAccessContent({
        requiredPlan: normalizedRequiredPlan,
        accessRecord: bestPlanAccess,
        accessRecords,
        module: options.module || "",
        itemType: options.itemType || "",
        itemId: options.itemId || "",
      });
    },
    [accessRecords, bestPlanAccess, isAccessCheckUnavailable]
  );

  const canAccessModule = useCallback(
    (module = ACCESS_MODULE.NOTES, requiredPlan = ACCESS_PLAN_TYPES.FREE) => {
      if (!module) return hasAccess(requiredPlan);

      return hasAccess(requiredPlan, { module });
    },
    [hasAccess]
  );

  const canAccessItem = useCallback(
    ({
      module = "",
      itemType = "",
      itemId = "",
      requiredPlan = ACCESS_PLAN_TYPES.FREE,
    } = {}) =>
      hasAccess(requiredPlan, {
        module,
        itemType,
        itemId,
      }),
    [hasAccess]
  );

  const shellState = useMemo(
    () =>
      buildAdaptiveShellState({
        user,
        accessRecords,
        loading,
        error,
        isAdminUser,
      }),
    [
      user,
      accessRecords,
      loading,
      error,
      isAdminUser,
    ]
  );

  const shellNavigation = useMemo(
    () =>
      buildAdaptiveShellNavigation({
        shellState,
        resumeRoute,
        currentPath,
      }),
    [
      shellState,
      resumeRoute,
      currentPath,
    ]
  );

  const myAccess = useMemo(
    () =>
      buildMyAccessModel({
        user,
        accessRecords,
        shellState,
        loading,
        error,
      }),
    [
      user,
      accessRecords,
      shellState,
      loading,
      error,
    ]
  );

  return {
    loading,
    error,
    accessRecords,
    bestAccess,
    bestPlanAccess,
    activePlan,
    accessStatus,
    membershipExpiry,
    isBlocked,
    isExpired,
    isAccessCheckUnavailable,
    hasAccess,
    canAccessModule,
    canAccessItem,
    shellState,
    shellNavigation,
    myAccess,
    refreshAccess: loadAccessProfile,
  };
}
