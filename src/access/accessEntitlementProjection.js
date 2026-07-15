import {
  ACCESS_ACTIVE_STATUS_VALUES,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  normalizePlanCode,
  resolvePlanDescriptor,
} from "./accessPlanCatalog";
import {
  normalizeScopeType,
} from "./accessUtils";

const cleanValue = (value = "") =>
  String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanValue(value).toLowerCase();

const cleanEntitlementSegment = (value = "") =>
  cleanValue(value)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "all";

const toComparableTime = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  if (typeof value?.toDate === "function") {
    return toComparableTime(value.toDate());
  }

  if (typeof value?.seconds === "number") {
    const time = Number(value.seconds) * 1000;
    return Number.isFinite(time) ? time : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
  }

  return null;
};

const getRecordId = (record = {}) =>
  cleanValue(
    record.id ||
      record.accessId ||
      record.grantKey
  );

const getRecordStatus = (record = {}) =>
  cleanValue(
    record.status || ACCESS_STATUS.ACTIVE
  ).toLowerCase();

const getRecordUpdatedTime = (record = {}) =>
  toComparableTime(
    record.updatedAt ||
      record.lastGrantedAt ||
      record.createdAt ||
      record.accessFrom
  ) || 0;

const getAccessUntilRank = (record = {}) => {
  const rawValue =
    record.accessUntil ??
    record.expiryDate ??
    record.validUntil ??
    null;

  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ""
  ) {
    return {
      indefinite: true,
      time: Number.POSITIVE_INFINITY,
    };
  }

  const time = toComparableTime(rawValue);

  return {
    indefinite: false,
    time:
      time === null
        ? Number.NEGATIVE_INFINITY
        : time,
  };
};

const compareProjectionCandidates = (
  first = {},
  second = {}
) => {
  const firstPlan = resolvePlanDescriptor({
    planCode:
      first.planCode ||
      first.planType,
    accessRank:
      first.accessRank,
    productId:
      first.productId,
  });
  const secondPlan = resolvePlanDescriptor({
    planCode:
      second.planCode ||
      second.planType,
    accessRank:
      second.accessRank,
    productId:
      second.productId,
  });
  const firstRank =
    firstPlan.accessRank === null
      ? -1
      : firstPlan.accessRank;
  const secondRank =
    secondPlan.accessRank === null
      ? -1
      : secondPlan.accessRank;
  const planDifference =
    secondRank - firstRank;

  if (planDifference !== 0) {
    return planDifference;
  }

  if (
    firstPlan.planCode !==
      secondPlan.planCode &&
    firstPlan.accessRank === null &&
    secondPlan.accessRank === null
  ) {
    return firstPlan.planCode.localeCompare(
      secondPlan.planCode
    );
  }

  const firstUntil = getAccessUntilRank(first);
  const secondUntil = getAccessUntilRank(second);

  if (
    firstUntil.indefinite !==
    secondUntil.indefinite
  ) {
    return firstUntil.indefinite ? -1 : 1;
  }

  if (firstUntil.time !== secondUntil.time) {
    return secondUntil.time - firstUntil.time;
  }

  const updatedDifference =
    getRecordUpdatedTime(second) -
    getRecordUpdatedTime(first);

  if (updatedDifference !== 0) {
    return updatedDifference;
  }

  return getRecordId(first).localeCompare(
    getRecordId(second)
  );
};

const uniqueIds = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => cleanValue(value))
        .filter(Boolean)
    )
  ).sort((first, second) =>
    first.localeCompare(second)
  );

const safeBuildStudentEntitlementId = (
  accessRecord = {}
) => {
  try {
    return buildStudentEntitlementId(accessRecord);
  } catch {
    return null;
  }
};

export const ACCESS_PLAN_ENTITLEMENT_IDS =
  Object.freeze(
    Object.values(ACCESS_PLAN_TYPES).map(
      (planType) =>
        "plan_" +
        cleanEntitlementSegment(
          normalizePlanCode(planType)
        )
    )
  );

export const buildStudentEntitlementId = (
  accessRecord = {}
) => {
  const scopeType = normalizeScopeType(
    accessRecord.scopeType
  );

  if (scopeType === ACCESS_SCOPE_TYPES.MODULE) {
    return (
      "module_" +
      cleanEntitlementSegment(accessRecord.module)
    );
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    return [
      "item",
      cleanEntitlementSegment(accessRecord.module),
      cleanEntitlementSegment(
        accessRecord.itemType
      ),
      cleanEntitlementSegment(accessRecord.itemId),
    ].join("_");
  }

  if (scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
    return (
      "bundle_" +
      cleanEntitlementSegment(
        accessRecord.bundleId ||
          accessRecord.itemId
      )
    );
  }

  return (
    "plan_" +
    cleanEntitlementSegment(
      normalizePlanCode(
        accessRecord.planCode ||
          accessRecord.planType ||
          ACCESS_PLAN_TYPES.FREE
      )
    )
  );
};

export const recordMatchesEntitlementPrincipal = (
  record = {},
  {
    uid = "",
    email = "",
  } = {}
) => {
  const learnerUid = cleanValue(uid);
  const learnerEmail = normalizeEmail(email);
  const recordUid = cleanValue(record.uid);
  const recordEmail = normalizeEmail(
    record.normalizedEmail || record.email
  );

  if (!learnerUid) {
    return false;
  }

  if (recordUid) {
    return recordUid === learnerUid;
  }

  return Boolean(
    learnerEmail &&
      recordEmail &&
      learnerEmail === recordEmail
  );
};

export const isEntitlementProjectionCandidateActive = (
  record = {},
  { now = Date.now() } = {}
) => {
  if (!record) {
    return false;
  }

  const status = getRecordStatus(record);

  if (!ACCESS_ACTIVE_STATUS_VALUES.has(status)) {
    return false;
  }

  const currentTime =
    now instanceof Date
      ? now.getTime()
      : Number(now);

  if (!Number.isFinite(currentTime)) {
    throw new Error(
      "Projection reference time is invalid."
    );
  }

  const accessFrom =
    record.accessFrom ??
    record.startDate ??
    null;
  const accessUntil =
    record.accessUntil ??
    record.expiryDate ??
    record.validUntil ??
    null;

  if (
    accessFrom !== null &&
    accessFrom !== undefined &&
    accessFrom !== ""
  ) {
    const accessFromTime =
      toComparableTime(accessFrom);

    if (
      accessFromTime === null ||
      accessFromTime > currentTime
    ) {
      return false;
    }
  }

  if (
    accessUntil !== null &&
    accessUntil !== undefined &&
    accessUntil !== ""
  ) {
    const accessUntilTime =
      toComparableTime(accessUntil);

    if (
      accessUntilTime === null ||
      accessUntilTime < currentTime
    ) {
      return false;
    }
  }

  return true;
};

export const selectEffectiveEntitlementRecord = (
  records = [],
  options = {}
) => {
  const activeRecords = (
    Array.isArray(records) ? records : []
  ).filter((record) =>
    isEntitlementProjectionCandidateActive(
      record,
      options
    )
  );

  if (!activeRecords.length) {
    return null;
  }

  return [...activeRecords].sort(
    compareProjectionCandidates
  )[0];
};

export const buildEffectiveEntitlementProjection = (
  accessRecords = [],
  {
    uid = "",
    email = "",
    now = Date.now(),
  } = {}
) => {
  const learnerUid = cleanValue(uid);
  const learnerEmail = normalizeEmail(email);

  if (!learnerUid) {
    throw new Error(
      "Effective entitlement projection requires uid."
    );
  }

  const principalRecords = (
    Array.isArray(accessRecords)
      ? accessRecords
      : []
  ).filter((record) =>
    recordMatchesEntitlementPrincipal(record, {
      uid: learnerUid,
      email: learnerEmail,
    })
  );

  const ignoredAccessIds = [];
  const planRecords = [];
  const targetGroups = new Map();
  const allEntitlementIds = new Set(
    ACCESS_PLAN_ENTITLEMENT_IDS
  );

  principalRecords.forEach((record) => {
    const entitlementId =
      safeBuildStudentEntitlementId(record);

    if (!entitlementId) {
      ignoredAccessIds.push(getRecordId(record));
      return;
    }

    allEntitlementIds.add(entitlementId);

    if (
      normalizeScopeType(record.scopeType) ===
      ACCESS_SCOPE_TYPES.PLAN
    ) {
      planRecords.push(record);
      return;
    }

    const records =
      targetGroups.get(entitlementId) || [];

    records.push(record);
    targetGroups.set(entitlementId, records);
  });

  const desiredEntitlements = [];
  const effectivePlan =
    selectEffectiveEntitlementRecord(
      planRecords,
      { now }
    );

  if (effectivePlan) {
    const entitlementId =
      buildStudentEntitlementId(effectivePlan);
    const activeContributors = planRecords.filter(
      (record) =>
        isEntitlementProjectionCandidateActive(
          record,
          { now }
        )
    );

    desiredEntitlements.push({
      id: entitlementId,
      effectiveRecord: effectivePlan,
      contributorAccessIds: uniqueIds(
        activeContributors.map(getRecordId)
      ),
    });
  }

  targetGroups.forEach(
    (records, entitlementId) => {
      const effectiveRecord =
        selectEffectiveEntitlementRecord(
          records,
          { now }
        );

      if (!effectiveRecord) {
        return;
      }

      desiredEntitlements.push({
        id: entitlementId,
        effectiveRecord,
        contributorAccessIds: uniqueIds(
          records
            .filter((record) =>
              isEntitlementProjectionCandidateActive(
                record,
                { now }
              )
            )
            .map(getRecordId)
        ),
      });
    }
  );

  desiredEntitlements.sort((first, second) =>
    first.id.localeCompare(second.id)
  );

  const desiredIds = new Set(
    desiredEntitlements.map(
      (entitlement) => entitlement.id
    )
  );
  const staleEntitlementIds = Array.from(
    allEntitlementIds
  )
    .filter(
      (entitlementId) =>
        !desiredIds.has(entitlementId)
    )
    .sort((first, second) =>
      first.localeCompare(second)
    );

  return {
    uid: learnerUid,
    email: learnerEmail,
    desiredEntitlements,
    staleEntitlementIds,
    evaluatedAccessIds: uniqueIds(
      principalRecords.map(getRecordId)
    ),
    ignoredAccessIds: uniqueIds(
      ignoredAccessIds
    ),
    effectivePlanAccessId:
      effectivePlan
        ? getRecordId(effectivePlan)
        : null,
    effectivePlanType:
      effectivePlan
        ? normalizePlanCode(
            effectivePlan.planCode ||
              effectivePlan.planType
          )
        : ACCESS_PLAN_TYPES.FREE,
    effectivePlanCode:
      effectivePlan
        ? normalizePlanCode(
            effectivePlan.planCode ||
              effectivePlan.planType
          )
        : ACCESS_PLAN_TYPES.FREE,
    effectivePlanAccessRank:
      effectivePlan
        ? resolvePlanDescriptor({
            planCode:
              effectivePlan.planCode ||
              effectivePlan.planType,
            accessRank:
              effectivePlan.accessRank,
            productId:
              effectivePlan.productId,
          }).accessRank
        : 0,
  };
};
