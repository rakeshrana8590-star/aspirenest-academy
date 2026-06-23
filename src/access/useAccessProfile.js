import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  canAccessContent,
  isAccessActive,
  isAccessExpired,
  normalizeAccessPlan,
  resolveBestAccess,
} from "./accessUtils";
import {
  getAccessByEmail,
  getAccessByUid,
} from "./accessService";

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
    status: ACCESS_STATUS.ACTIVE,
    source: "profile_fallback",
    accessUntil,
  };
};

export default function useAccessProfile({
  user = null,
  profile = {},
  fallbackPlanType = ACCESS_PLAN_TYPES.FREE,
  fallbackExpiry = null,
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
      const [uidRecords, emailRecords] = await Promise.all([
        uid ? getAccessByUid(uid) : Promise.resolve([]),
        email ? getAccessByEmail(email) : Promise.resolve([]),
      ]);

      const seen = new Set();
      const mergedRecords = [...uidRecords, ...emailRecords].filter((record) => {
        const recordId = record && record.id ? record.id : "";
        const recordUid = record && record.uid ? record.uid : "";
        const recordEmail = record && (record.normalizedEmail || record.email) ? record.normalizedEmail || record.email : "";
        const recordPlan = record && record.planType ? record.planType : "";
        const key = recordId || [recordUid, recordEmail, recordPlan].join("-");

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      });
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

  const bestFirestoreAccess = useMemo(
    () => resolveBestAccess(accessRecords),
    [accessRecords]
  );

  const bestAccess = bestFirestoreAccess || fallbackAccess;
  const activePlan = normalizeAccessPlan(bestAccess?.planType || fallbackAccess.planType);
  const membershipExpiry = resolveAccessExpiry(bestAccess, fallbackAccess.accessUntil);
  const isBlocked = !bestFirestoreAccess && accessRecords.some(isBlockedAccessRecord);
  const isExpired = isAccessExpired(membershipExpiry);
  const hasActiveBestAccess = bestFirestoreAccess
    ? isAccessActive(bestFirestoreAccess)
    : true;

  const accessStatus = isBlocked
    ? ACCESS_STATUS.BLOCKED
    : isExpired
      ? ACCESS_STATUS.EXPIRED
      : hasActiveBestAccess
        ? ACCESS_STATUS.ACTIVE
        : ACCESS_STATUS.PENDING;

        const hasAccess = useCallback(
          (requiredPlan = ACCESS_PLAN_TYPES.FREE, options = {}) =>
            canAccessContent({
              requiredPlan,
              userPlan: activePlan,
              accessRecord: bestFirestoreAccess,
              accessRecords,
              module: options.module || "",
              itemType: options.itemType || "",
              itemId: options.itemId || "",
              emergencyAccess: Boolean(options.emergencyAccess),
            }),
          [activePlan, bestFirestoreAccess, accessRecords]
        );

        const canAccessModule = useCallback(
          (module = ACCESS_MODULE.NOTES, requiredPlan = ACCESS_PLAN_TYPES.FREE) => {
            if (!module) return hasAccess(requiredPlan);
      
            return canAccessContent({
              requiredPlan,
              userPlan: activePlan,
              accessRecord: bestFirestoreAccess,
              accessRecords,
              module,
            });
          },
          [activePlan, bestFirestoreAccess, accessRecords, hasAccess]
        );
      
        const canAccessItem = useCallback(
          ({
            module = "",
            itemType = "",
            itemId = "",
            requiredPlan = ACCESS_PLAN_TYPES.FREE,
          } = {}) =>
            canAccessContent({
              requiredPlan,
              userPlan: activePlan,
              accessRecord: bestFirestoreAccess,
              accessRecords,
              module,
              itemType,
              itemId,
            }),
          [activePlan, bestFirestoreAccess, accessRecords]
        );

  return {
    loading,
    error,
    accessRecords,
    bestAccess,
    activePlan,
    accessStatus,
    membershipExpiry,
    isBlocked,
    isExpired,
    hasAccess,
    canAccessModule,
    canAccessItem,
    refreshAccess: loadAccessProfile,
  };
}
