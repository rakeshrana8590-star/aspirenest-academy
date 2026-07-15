import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_KEY_STATUS,
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "./accessConstants";

const PLAN_ALIASES = Object.freeze({
  FREE: ACCESS_PLAN_TYPES.FREE,
  BASIC: ACCESS_PLAN_TYPES.BASIC,
  PREMIUM: ACCESS_PLAN_TYPES.PREMIUM,
  PRO: ACCESS_PLAN_TYPES.PREMIUM,
  PAID: ACCESS_PLAN_TYPES.PREMIUM,
  MENTOR: ACCESS_PLAN_TYPES.MENTORSHIP,
  MENTORSHIP: ACCESS_PLAN_TYPES.MENTORSHIP,
});

const SCOPE_VALUES = new Set(Object.values(ACCESS_SCOPE_TYPES));
const MODULE_VALUES = new Set(Object.values(ACCESS_MODULE));
const ITEM_TYPE_VALUES = new Set(Object.values(ACCESS_ITEM_TYPES));
const GRANT_STATUS_VALUES = new Set(Object.values(ACCESS_STATUS));
const KEY_STATUS_VALUES = new Set(Object.values(ACCESS_KEY_STATUS));
const SOURCE_VALUES = new Set(Object.values(ACCESS_SOURCE));

const MODULE_ALIASES = Object.freeze({
  notes: ACCESS_MODULE.NOTES,
  mocktest: ACCESS_MODULE.MOCK_TEST,
  video: ACCESS_MODULE.VIDEO,
  currentaffairs: ACCESS_MODULE.CURRENT_AFFAIRS,
  roadmap: ACCESS_MODULE.ROADMAP,
});

const ITEM_TYPE_ALIASES = Object.freeze({
  mocktest: ACCESS_ITEM_TYPES.MOCK_TEST,
  notespdf: ACCESS_ITEM_TYPES.NOTES_PDF,
  video: ACCESS_ITEM_TYPES.VIDEO,
  currentaffairspdf: ACCESS_ITEM_TYPES.CURRENT_AFFAIRS_PDF,
  roadmap: ACCESS_ITEM_TYPES.ROADMAP,
});

const compactToken = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[\s_-]+/g, "")
    .toLowerCase();

const cleanValue = (value = "") => String(value || "").trim();

const requireValue = (value, label) => {
  const normalized = cleanValue(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
};

const normalizeKnownValue = ({
  value,
  label,
  values,
  aliases = {},
  normalizer = (input) => cleanValue(input),
}) => {
  const normalized = normalizer(value);

  if (values.has(normalized)) {
    return normalized;
  }

  const alias = aliases[compactToken(value)];

  if (alias && values.has(alias)) {
    return alias;
  }

  throw new Error(`${label} is invalid.`);
};

const toComparableTime = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();

    if (Number.isNaN(time)) {
      throw new Error("Access date is invalid.");
    }

    return time;
  }

  if (typeof value?.toDate === "function") {
    return toComparableTime(value.toDate());
  }

  if (typeof value?.seconds === "number") {
    const time = Number(value.seconds) * 1000;

    if (!Number.isFinite(time)) {
      throw new Error("Access date is invalid.");
    }

    return time;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Access date is invalid.");
    }

    return value;
  }

  if (typeof value === "string") {
    const time = new Date(value).getTime();

    if (Number.isNaN(time)) {
      throw new Error("Access date is invalid.");
    }

    return time;
  }

  throw new Error("Access date is invalid.");
};

export const normalizeGrantEmail = (email = "") =>
  cleanValue(email).toLowerCase();

export const normalizeGrantCourse = (
  course = ACCESS_COURSE.CTET_TET
) => {
  const normalized = cleanValue(
    course || ACCESS_COURSE.CTET_TET
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    throw new Error("Course is required.");
  }

  return normalized;
};

export const normalizeGrantPlanType = (
  planType = ACCESS_PLAN_TYPES.FREE
) => {
  const normalized = cleanValue(
    planType || ACCESS_PLAN_TYPES.FREE
  ).toUpperCase();

  const plan = PLAN_ALIASES[normalized];

  if (!plan) {
    throw new Error("Plan type is invalid.");
  }

  return plan;
};

export const normalizeGrantScopeType = (
  scopeType = ACCESS_SCOPE_TYPES.PLAN
) =>
  normalizeKnownValue({
    value: scopeType || ACCESS_SCOPE_TYPES.PLAN,
    label: "Access scope",
    values: SCOPE_VALUES,
    normalizer: (input) => cleanValue(input).toLowerCase(),
  });

export const normalizeGrantModule = (module = "") =>
  normalizeKnownValue({
    value: module,
    label: "Access module",
    values: MODULE_VALUES,
    aliases: MODULE_ALIASES,
  });

export const normalizeGrantItemType = (itemType = "") =>
  normalizeKnownValue({
    value: itemType,
    label: "Access item type",
    values: ITEM_TYPE_VALUES,
    aliases: ITEM_TYPE_ALIASES,
  });

export const normalizeGrantStatus = (
  status = ACCESS_STATUS.ACTIVE,
  allowedStatuses = GRANT_STATUS_VALUES
) => {
  const normalized = cleanValue(
    status || ACCESS_STATUS.ACTIVE
  ).toLowerCase();

  if (!allowedStatuses.has(normalized)) {
    throw new Error("Access status is invalid.");
  }

  return normalized;
};

export const normalizeGrantSource = (
  source = ACCESS_SOURCE.ADMIN_MANUAL
) => {
  const normalized = cleanValue(
    source || ACCESS_SOURCE.ADMIN_MANUAL
  ).toLowerCase();

  if (!SOURCE_VALUES.has(normalized)) {
    throw new Error("Access source is invalid.");
  }

  return normalized;
};

export const normalizeGrantItemIds = (itemIds = []) => {
  if (!Array.isArray(itemIds)) {
    throw new Error("Bundle item IDs must be an array.");
  }

  return Array.from(
    new Set(
      itemIds
        .map((itemId) => cleanValue(itemId))
        .filter(Boolean)
    )
  ).sort((first, second) => first.localeCompare(second));
};

export const validateGrantDateWindow = ({
  accessFrom = null,
  accessUntil = null,
} = {}) => {
  const accessFromTime = toComparableTime(accessFrom);
  const accessUntilTime = toComparableTime(accessUntil);

  if (
    accessFromTime !== null &&
    accessUntilTime !== null &&
    accessFromTime > accessUntilTime
  ) {
    throw new Error(
      "Access until date must be on or after access from date."
    );
  }

  return {
    accessFrom: accessFrom || null,
    accessUntil: accessUntil || null,
  };
};

export const buildGrantPrincipalRef = ({
  uid = "",
  email = "",
  allowEmailPrincipal = true,
} = {}) => {
  const normalizedUid = cleanValue(uid);
  const normalizedEmail = normalizeGrantEmail(email);

  if (normalizedUid) {
    return `uid:${normalizedUid}`;
  }

  if (allowEmailPrincipal && normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  throw new Error("Access record requires uid or email.");
};

export const buildGrantTargetKey = (target = {}) => {
  const scopeType = normalizeGrantScopeType(target.scopeType);

  if (scopeType === ACCESS_SCOPE_TYPES.PLAN) {
    return `plan:${normalizeGrantPlanType(target.planType)}`;
  }

  if (scopeType === ACCESS_SCOPE_TYPES.MODULE) {
    return `module:${normalizeGrantModule(target.module)}`;
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    return [
      "item",
      normalizeGrantModule(target.module),
      normalizeGrantItemType(target.itemType),
      requireValue(target.itemId, "Item ID"),
    ].join(":");
  }

  return `bundle:${requireValue(target.bundleId, "Bundle ID")}`;
};

export const buildGrantKey = ({
  principalRef,
  course,
  scopeType,
  planType,
  module,
  itemType,
  itemId,
  bundleId,
} = {}) => {
  const normalizedPrincipalRef = requireValue(
    principalRef,
    "Grant principal"
  );
  const normalizedCourse = normalizeGrantCourse(course);
  const targetKey = buildGrantTargetKey({
    scopeType,
    planType,
    module,
    itemType,
    itemId,
    bundleId,
  });

  return [
    normalizedPrincipalRef,
    normalizedCourse,
    normalizeGrantScopeType(scopeType),
    targetKey,
  ].join("|");
};

export const normalizeAndValidateGrantTarget = (
  data = {},
  { allowedStatuses = GRANT_STATUS_VALUES } = {}
) => {
  const course = normalizeGrantCourse(
    data.course || ACCESS_COURSE.CTET_TET
  );
  const scopeType = normalizeGrantScopeType(
    data.scopeType || ACCESS_SCOPE_TYPES.PLAN
  );
  const planType = normalizeGrantPlanType(
    data.planType || ACCESS_PLAN_TYPES.FREE
  );
  const status = normalizeGrantStatus(
    data.status || ACCESS_STATUS.ACTIVE,
    allowedStatuses
  );

  let module = null;
  let itemType = null;
  let itemId = null;
  let itemTitle = "";
  let itemIds = [];
  let bundleId = null;

  if (scopeType === ACCESS_SCOPE_TYPES.MODULE) {
    module = normalizeGrantModule(data.module);
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    module = normalizeGrantModule(data.module);
    itemType = normalizeGrantItemType(data.itemType);
    itemId = requireValue(data.itemId, "Item ID");
    itemTitle = cleanValue(data.itemTitle);
  }

  if (scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
    module = data.module
      ? normalizeGrantModule(data.module)
      : null;
    bundleId = requireValue(data.bundleId, "Bundle ID");
    itemIds = normalizeGrantItemIds(data.itemIds);

    if (!itemIds.length) {
      throw new Error("Bundle requires at least one item ID.");
    }
  }

  const dates = validateGrantDateWindow({
    accessFrom: data.accessFrom,
    accessUntil: data.accessUntil,
  });

  const targetKey = buildGrantTargetKey({
    scopeType,
    planType,
    module,
    itemType,
    itemId,
    bundleId,
  });

  return {
    course,
    planType,
    scopeType,
    status,
    module,
    itemType,
    itemId,
    itemTitle,
    itemIds,
    bundleId,
    accessFrom: dates.accessFrom,
    accessUntil: dates.accessUntil,
    targetKey,
  };
};

export const normalizeAndValidateGrantInput = (
  data = {},
  {
    allowEmailPrincipal = true,
    allowedStatuses = GRANT_STATUS_VALUES,
  } = {}
) => {
  const email = normalizeGrantEmail(data.email);
  const uid = cleanValue(data.uid);
  const principalRef = buildGrantPrincipalRef({
    uid,
    email,
    allowEmailPrincipal,
  });
  const target = normalizeAndValidateGrantTarget(data, {
    allowedStatuses,
  });
  const source = normalizeGrantSource(
    data.source || ACCESS_SOURCE.ADMIN_MANUAL
  );
  const grantKey = buildGrantKey({
    principalRef,
    ...target,
  });

  return {
    email: email || null,
    normalizedEmail: email,
    uid: uid || null,
    source,
    principalRef,
    grantKey,
    ...target,
  };
};

export const ACCESS_GRANT_STATUS_VALUES = GRANT_STATUS_VALUES;
export const ACCESS_KEY_GRANT_STATUS_VALUES = KEY_STATUS_VALUES;
