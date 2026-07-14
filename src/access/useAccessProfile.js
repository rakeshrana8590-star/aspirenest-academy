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

const getAccessStatusValue = (record = null) =>
  String(record?.status || "").trim().toLowerCase();

const isBlockedAccessRecord = (record = null) =>
  BLOCKED_STATUSES.has(getAccessStatusValue(record));

const getAccessExpiry = (record = null) =>
  record?.accessUntil || record?.expiryDate || record?.validUntil || null;

export default function useAccessProfile({
  user = null,
  profile = {},
  enabled = true,
} = {}) {
  const [loading, setLoading] = useState(false);
  const [accessRecords, setAccessRecords] = useState(EMPTY_ACCESS_RECORDS);
  const [error, setError] = useState(null);

  const uid = String(user?.uid || profile?.uid || "").trim();
  const email = String(user?.email || profile?.email || "").trim().toLowerCase();

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
        const recordId = record?.id || "";
        const recordUid = record?.uid || "";
        const recordEmail = record?.normalizedEmail || record?.email || "";
        const recordPlan = record?.planType || "";
        const recordScope = record?.scopeType || "";
        const recordItem = record?.itemId || "";
        const key = recordId || [
          recordUid,
          recordEmail,
          recordPlan,
          recordScope,
          recordItem,
        ].join("-");

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

  const bestActiveAccess = useMemo(
    () => resolveBestAccess(accessRecords),
    [accessRecords]
  );

  const bestPlanAccess = useMemo(
    () => resolveBestAccess(
      accessRecords.filter(
        (record) => normalizeScopeType(record?.scopeType) === ACCESS_SCOPE_TYPES.PLAN
      )
    ),
    [accessRecords]
  );

  const activePlan = normalizeAccessPlan(
    bestPlanAccess?.planType || ACCESS_PLAN_TYPES.FREE
  );
  const membershipExpiry = getAccessExpiry(bestActiveAccess);
  const isBlocked = !bestActiveAccess && accessRecords.some(isBlockedAccessRecord);
  const isExpired = !bestActiveAccess && accessRecords.some((record) =>
    isAccessExpired(getAccessExpiry(record))
  );
  const hasActiveAccess = Boolean(
    bestActiveAccess && isAccessActive(bestActiveAccess)
  );

  const accessStatus = isBlocked
    ? ACCESS_STATUS.BLOCKED
    : isExpired
      ? ACCESS_STATUS.EXPIRED
      : hasActiveAccess
        ? ACCESS_STATUS.ACTIVE
        : ACCESS_STATUS.PENDING;

  const hasAccess = useCallback(
    (requiredPlan = ACCESS_PLAN_TYPES.FREE, options = {}) =>
      canAccessContent({
        requiredPlan,
        accessRecord: bestPlanAccess,
        accessRecords,
        course: options.course || "",
        module: options.module || "",
        itemType: options.itemType || "",
        itemId: options.itemId || "",
      }),
    [bestPlanAccess, accessRecords]
  );

  const canAccessModule = useCallback(
    (module = ACCESS_MODULE.NOTES, requiredPlan = ACCESS_PLAN_TYPES.FREE, options = {}) => {
      if (!module) return hasAccess(requiredPlan, options);

      return canAccessContent({
        requiredPlan,
        accessRecord: bestPlanAccess,
        accessRecords,
        course: options.course || "",
        module,
      });
    },
    [bestPlanAccess, accessRecords, hasAccess]
  );

  const canAccessItem = useCallback(
    ({
      course = "",
      module = "",
      itemType = "",
      itemId = "",
      requiredPlan = ACCESS_PLAN_TYPES.FREE,
    } = {}) =>
      canAccessContent({
        requiredPlan,
        accessRecord: bestPlanAccess,
        accessRecords,
        course,
        module,
        itemType,
        itemId,
      }),
    [bestPlanAccess, accessRecords]
  );

  return {
    loading,
    error,
    accessRecords,
    bestAccess: bestPlanAccess,
    bestActiveAccess,
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
