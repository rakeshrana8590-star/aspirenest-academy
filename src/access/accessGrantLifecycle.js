import {
  ACCESS_PLAN_LEVELS,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  buildGrantKey,
  buildGrantPrincipalRef,
  buildGrantTargetKey,
  normalizeGrantCourse,
  normalizeGrantPlanType,
  normalizeGrantScopeType,
} from "./accessGrantContract";

const BLOCKED_GRANT_STATES = new Set([
  ACCESS_STATUS.BLOCKED,
  "revoked",
]);

const ACTIVE_GRANT_STATES = new Set([
  ACCESS_STATUS.ACTIVE,
  "approved",
  "paid",
  "success",
  "verified",
  "live",
]);

const cleanValue = (value = "") => String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanValue(value).toLowerCase();

const toComparableTime = (value) => {
  if (value === null || value === undefined || value === "") {
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

const getRecordStatus = (record = {}) =>
  cleanValue(record.status || ACCESS_STATUS.ACTIVE).toLowerCase();

const getRecordIdentity = (record = {}) => ({
  uid: cleanValue(record.uid),
  email: normalizeEmail(
    record.normalizedEmail || record.email
  ),
});

const getRequestedIdentity = (grant = {}) => ({
  uid: cleanValue(grant.uid),
  email: normalizeEmail(
    grant.normalizedEmail || grant.email
  ),
});

const isSamePrincipal = (record = {}, grant = {}) => {
  const existing = getRecordIdentity(record);
  const incoming = getRequestedIdentity(grant);

  if (
    incoming.uid &&
    existing.uid &&
    incoming.uid !== existing.uid
  ) {
    return false;
  }

  if (incoming.uid && existing.uid === incoming.uid) {
    return true;
  }

  if (
    incoming.email &&
    existing.email &&
    incoming.email === existing.email
  ) {
    return true;
  }

  return false;
};

const safeRecordTargetKey = (record = {}) => {
  try {
    return buildGrantTargetKey(record);
  } catch {
    return null;
  }
};

const safeRecordCourse = (record = {}) => {
  try {
    return normalizeGrantCourse(record.course);
  } catch {
    return null;
  }
};

const safeRecordScope = (record = {}) => {
  try {
    return normalizeGrantScopeType(record.scopeType);
  } catch {
    return null;
  }
};

const getRecordCreatedTime = (record = {}) =>
  toComparableTime(
    record.createdAt ||
      record.updatedAt ||
      record.accessFrom
  ) || 0;

const getCandidateScore = (record = {}, grant = {}) => {
  const existing = getRecordIdentity(record);
  const incoming = getRequestedIdentity(grant);
  const status = getRecordStatus(record);
  let score = 0;

  if (
    incoming.uid &&
    existing.uid &&
    incoming.uid === existing.uid
  ) {
    score += 100;
  }

  if (
    incoming.email &&
    existing.email &&
    incoming.email === existing.email
  ) {
    score += 35;
  }

  if (ACTIVE_GRANT_STATES.has(status)) {
    score += 25;
  } else if (
    status === ACCESS_STATUS.PENDING ||
    status === ACCESS_STATUS.EXPIRED
  ) {
    score += 10;
  }

  if (
    cleanValue(record.grantFamilyKey) &&
    record.grantFamilyKey === buildGrantFamilyKey(grant)
  ) {
    score += 20;
  }

  if (
    cleanValue(record.grantKey) &&
    record.grantKey === grant.grantKey
  ) {
    score += 15;
  }

  return score;
};

const hashText = (value = "", seed = 2166136261) => {
  let hash = seed >>> 0;
  const input = String(value || "");

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash.toString(36).padStart(7, "0");
};

const mergeAccessFrom = (existingValue, incomingValue) =>
  existingValue || incomingValue || null;

const mergeAccessUntil = (existingRecord = null, incomingValue = null) => {
  if (!existingRecord) {
    return {
      value: incomingValue || null,
      preservedLongerValidity: false,
    };
  }

  const hasExistingField = Object.prototype.hasOwnProperty.call(
    existingRecord,
    "accessUntil"
  );
  const existingValue = existingRecord.accessUntil;

  if (
    hasExistingField &&
    (existingValue === null || existingValue === "")
  ) {
    return {
      value: existingValue || null,
      preservedLongerValidity: Boolean(incomingValue),
    };
  }

  if (!incomingValue) {
    return {
      value: existingValue || null,
      preservedLongerValidity: Boolean(existingValue),
    };
  }

  if (!existingValue) {
    return {
      value: incomingValue,
      preservedLongerValidity: false,
    };
  }

  const existingTime = toComparableTime(existingValue);
  const incomingTime = toComparableTime(incomingValue);

  if (existingTime === null) {
    return {
      value: incomingValue,
      preservedLongerValidity: false,
    };
  }

  if (incomingTime === null || existingTime >= incomingTime) {
    return {
      value: existingValue,
      preservedLongerValidity:
        incomingTime !== null && existingTime > incomingTime,
    };
  }

  return {
    value: incomingValue,
    preservedLongerValidity: false,
  };
};

const resolveAuthoritativeIdentity = (
  existingRecord = null,
  incomingGrant = {}
) => {
  const incomingUid = cleanValue(incomingGrant.uid);
  const existingUid = cleanValue(existingRecord?.uid);
  const incomingEmail = normalizeEmail(
    incomingGrant.normalizedEmail || incomingGrant.email
  );
  const existingEmail = normalizeEmail(
    existingRecord?.normalizedEmail || existingRecord?.email
  );
  const uid = incomingUid || existingUid;
  const email = incomingEmail || existingEmail;
  const principalRef = buildGrantPrincipalRef({
    uid,
    email,
    allowEmailPrincipal: true,
  });

  return {
    uid: uid || null,
    email: email || null,
    normalizedEmail: email,
    principalRef,
  };
};

const resolveFinalPlanType = ({
  existingRecord = null,
  incomingGrant = {},
} = {}) => {
  const incomingPlan = normalizeGrantPlanType(
    incomingGrant.planType
  );

  if (
    normalizeGrantScopeType(incomingGrant.scopeType) !==
      ACCESS_SCOPE_TYPES.PLAN ||
    !existingRecord
  ) {
    return {
      planType: incomingPlan,
      preservedHigherPlan: false,
    };
  }

  const existingPlan = normalizeGrantPlanType(
    existingRecord.planType
  );
  const existingLevel = ACCESS_PLAN_LEVELS[existingPlan] || 0;
  const incomingLevel = ACCESS_PLAN_LEVELS[incomingPlan] || 0;

  if (existingLevel > incomingLevel) {
    return {
      planType: existingPlan,
      preservedHigherPlan: true,
    };
  }

  return {
    planType: incomingPlan,
    preservedHigherPlan: false,
  };
};

export const buildGrantFamilyKey = (grant = {}) => {
  const principalRef =
    cleanValue(grant.principalRef) ||
    buildGrantPrincipalRef({
      uid: grant.uid,
      email: grant.normalizedEmail || grant.email,
      allowEmailPrincipal: true,
    });
  const course = normalizeGrantCourse(grant.course);
  const scopeType = normalizeGrantScopeType(grant.scopeType);

  if (scopeType === ACCESS_SCOPE_TYPES.PLAN) {
    return [
      principalRef,
      course,
      ACCESS_SCOPE_TYPES.PLAN,
      "plan-family",
    ].join("|");
  }

  return (
    cleanValue(grant.grantKey) ||
    buildGrantKey({
      principalRef,
      course,
      scopeType,
      planType: grant.planType,
      module: grant.module,
      itemType: grant.itemType,
      itemId: grant.itemId,
      bundleId: grant.bundleId,
    })
  );
};

export const buildDeterministicGrantDocumentId = (
  grantFamilyKey = ""
) => {
  const normalizedKey = cleanValue(grantFamilyKey);

  if (!normalizedKey) {
    throw new Error("Grant family key is required.");
  }

  const firstHash = hashText(normalizedKey, 2166136261);
  const secondHash = hashText(
    normalizedKey.split("").reverse().join(""),
    2246822519
  );
  const safeTail = normalizedKey
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(-48);

  return [
    "grant",
    firstHash + secondHash,
    safeTail || "access",
  ].join("_");
};

export const isGrantCandidate = (
  record = {},
  grant = {},
  { planFamily = false } = {}
) => {
  if (!isSamePrincipal(record, grant)) {
    return false;
  }

  const existingCourse = safeRecordCourse(record);
  const incomingCourse = normalizeGrantCourse(grant.course);

  if (!existingCourse || existingCourse !== incomingCourse) {
    return false;
  }

  const existingScope = safeRecordScope(record);
  const incomingScope = normalizeGrantScopeType(grant.scopeType);

  if (!existingScope || existingScope !== incomingScope) {
    return false;
  }

  if (
    planFamily &&
    incomingScope === ACCESS_SCOPE_TYPES.PLAN
  ) {
    return true;
  }

  const existingTargetKey = safeRecordTargetKey(record);

  return Boolean(
    existingTargetKey &&
      existingTargetKey === buildGrantTargetKey(grant)
  );
};

export const findGrantCandidates = (
  records = [],
  grant = {},
  options = {}
) =>
  (Array.isArray(records) ? records : [])
    .filter((record) =>
      isGrantCandidate(record, grant, options)
    )
    .sort((first, second) => {
      const scoreDifference =
        getCandidateScore(second, grant) -
        getCandidateScore(first, grant);

      if (scoreDifference) {
        return scoreDifference;
      }

      const timeDifference =
        getRecordCreatedTime(second) -
        getRecordCreatedTime(first);

      if (timeDifference) {
        return timeDifference;
      }

      return cleanValue(first.id).localeCompare(
        cleanValue(second.id)
      );
    });

export const selectCanonicalGrantCandidate = (
  records = [],
  grant = {},
  options = {}
) => findGrantCandidates(records, grant, options)[0] || null;

export const assertGrantCandidateIdentitySafe = (
  records = [],
  incomingGrant = {}
) => {
  const incomingUid = cleanValue(
    incomingGrant.uid
  );
  const candidateUids = Array.from(
    new Set(
      (Array.isArray(records) ? records : [])
        .map((record) =>
          cleanValue(record.uid)
        )
        .filter(Boolean)
    )
  );

  if (
    incomingUid &&
    candidateUids.some(
      (candidateUid) => candidateUid !== incomingUid
    )
  ) {
    throw new Error(
      "Access identity conflicts with another learner UID."
    );
  }

  if (!incomingUid && candidateUids.length > 1) {
    throw new Error(
      "Multiple learner UIDs match this email. Select a UID before writing access."
    );
  }

  return true;
};

export const buildIdempotentGrantResolution = ({
  existingRecord = null,
  incomingGrant = {},
  allowReactivation = false,
  reactivationReason = "",
} = {}) => {
  const existingStatus = getRecordStatus(existingRecord || {});
  const isBlockedExisting = Boolean(
    existingRecord &&
      BLOCKED_GRANT_STATES.has(existingStatus)
  );
  const cleanReactivationReason = cleanValue(
    reactivationReason
  );

  if (isBlockedExisting && !allowReactivation) {
    throw new Error(
      "Existing grant is blocked or revoked. Use explicit reactivation."
    );
  }

  if (
    isBlockedExisting &&
    allowReactivation &&
    !cleanReactivationReason
  ) {
    throw new Error(
      "Reactivation reason is required for a blocked or revoked grant."
    );
  }

  const identity = resolveAuthoritativeIdentity(
    existingRecord,
    incomingGrant
  );
  const planResolution = resolveFinalPlanType({
    existingRecord,
    incomingGrant,
  });
  const scopeType = normalizeGrantScopeType(
    incomingGrant.scopeType
  );
  const course = normalizeGrantCourse(
    incomingGrant.course
  );
  const accessUntilResolution = mergeAccessUntil(
    existingRecord,
    incomingGrant.accessUntil
  );
  const grantKey = buildGrantKey({
    principalRef: identity.principalRef,
    course,
    scopeType,
    planType: planResolution.planType,
    module: incomingGrant.module,
    itemType: incomingGrant.itemType,
    itemId: incomingGrant.itemId,
    bundleId: incomingGrant.bundleId,
  });
  const grantFamilyKey = buildGrantFamilyKey({
    ...incomingGrant,
    ...identity,
    course,
    scopeType,
    planType: planResolution.planType,
    grantKey,
  });

  return {
    writeMode: existingRecord ? "updated" : "created",
    uid: identity.uid,
    email: identity.email,
    normalizedEmail: identity.normalizedEmail,
    principalRef: identity.principalRef,
    course,
    scopeType,
    planType: planResolution.planType,
    grantKey,
    grantFamilyKey,
    grantRevision:
      Math.max(
        Number(existingRecord?.grantRevision || 0),
        0
      ) + 1,
    accessFrom: mergeAccessFrom(
      existingRecord?.accessFrom,
      incomingGrant.accessFrom
    ),
    accessUntil: accessUntilResolution.value,
    preservedHigherPlan:
      planResolution.preservedHigherPlan,
    preservedLongerValidity:
      accessUntilResolution.preservedLongerValidity,
    reactivated: isBlockedExisting,
    reactivationReason: cleanReactivationReason,
  };
};

export const resolvePlanChange = ({
  record = {},
  requestedPlanType,
  allowDowngrade = false,
  reason = "",
} = {}) => {
  const scopeType = normalizeGrantScopeType(
    record.scopeType
  );

  if (scopeType !== ACCESS_SCOPE_TYPES.PLAN) {
    throw new Error(
      "Plan change is allowed only for PLAN access records."
    );
  }

  const currentPlanType = normalizeGrantPlanType(
    record.planType
  );
  const nextPlanType = normalizeGrantPlanType(
    requestedPlanType
  );
  const currentLevel =
    ACCESS_PLAN_LEVELS[currentPlanType] || 0;
  const nextLevel =
    ACCESS_PLAN_LEVELS[nextPlanType] || 0;
  const isDowngrade = nextLevel < currentLevel;
  const cleanReason = cleanValue(reason);

  if (isDowngrade && !allowDowngrade) {
    throw new Error(
      "Plan downgrade requires explicit approval."
    );
  }

  if (isDowngrade && !cleanReason) {
    throw new Error(
      "Plan downgrade reason is required."
    );
  }

  const identity = resolveAuthoritativeIdentity(
    record,
    record
  );
  const course = normalizeGrantCourse(record.course);
  const grantKey = buildGrantKey({
    principalRef: identity.principalRef,
    course,
    scopeType: ACCESS_SCOPE_TYPES.PLAN,
    planType: nextPlanType,
  });
  const grantFamilyKey = buildGrantFamilyKey({
    ...record,
    ...identity,
    course,
    scopeType: ACCESS_SCOPE_TYPES.PLAN,
    planType: nextPlanType,
    grantKey,
  });

  return {
    currentPlanType,
    planType: nextPlanType,
    isDowngrade,
    reason: cleanReason,
    grantKey,
    grantFamilyKey,
    grantRevision:
      Math.max(Number(record.grantRevision || 0), 0) + 1,
  };
};
