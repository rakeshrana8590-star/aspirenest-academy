/**
 * AspireNest dynamic plan catalog contract.
 *
 * Phase 4E-6C-1 is deliberately pure and side-effect free:
 * - no Firebase imports
 * - no production reads or writes
 * - no UI coupling
 * - no mutation of existing grants
 *
 * The current FREE/BASIC/PREMIUM/MENTORSHIP plans are initial seed entries,
 * not a permanent enum. Future source slices can safely integrate this
 * contract into access products, grants, entitlement projection, rules,
 * payments, keys, invites, and admin screens.
 */

export const ACCESS_PLAN_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,47}$/;

export const ACCESS_PLAN_VALIDITY_MODES = Object.freeze({
  ADMIN_DEFINED: "ADMIN_DEFINED",
  CUSTOM_WINDOW: "CUSTOM_WINDOW",
  NO_EXPIRY: "NO_EXPIRY",
  UNTIL_MANUAL_CHANGE: "UNTIL_MANUAL_CHANGE",
});

const freezeRecord = (record = {}) =>
  Object.freeze({ ...record });

export const ACCESS_INITIAL_PLAN_SEED = Object.freeze([
  freezeRecord({
    productId: "plan_free",
    planCode: "FREE",
    title: "Starter",
    accessRank: 0,
    priceINR: 0,
    currency: "INR",
    validityMode: ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: null,
    allowNoExpiry: true,
    isActive: true,
  }),
  freezeRecord({
    productId: "plan_basic",
    planCode: "BASIC",
    title: "Topic-wise Courses",
    accessRank: 100,
    priceINR: 499,
    currency: "INR",
    validityMode: ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: null,
    allowNoExpiry: true,
    isActive: true,
  }),
  freezeRecord({
    productId: "plan_premium",
    planCode: "PREMIUM",
    title: "Premium Batch",
    accessRank: 200,
    priceINR: 1499,
    currency: "INR",
    validityMode: ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: null,
    allowNoExpiry: true,
    isActive: true,
  }),
  freezeRecord({
    productId: "plan_mentorship",
    planCode: "MENTORSHIP",
    title: "Personal Mentorship",
    accessRank: 300,
    priceINR: 2999,
    currency: "INR",
    validityMode: ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: null,
    allowNoExpiry: true,
    isActive: true,
  }),
]);

export const ACCESS_INITIAL_PLAN_BY_CODE = Object.freeze(
  ACCESS_INITIAL_PLAN_SEED.reduce((result, plan) => {
    result[plan.planCode] = plan;
    return result;
  }, {})
);

const PLAN_ALIASES = Object.freeze({
  FREE: "FREE",
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PRO: "PREMIUM",
  PAID: "PREMIUM",
  MENTOR: "MENTORSHIP",
  MENTORSHIP: "MENTORSHIP",
});

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeCodeToken = (value = "") =>
  cleanString(value)
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const toFiniteNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeNonNegativeInteger = (
  value,
  label,
  { allowNull = false } = {}
) => {
  const parsed = toFiniteNumber(value);

  if (parsed === null) {
    if (allowNull) return null;
    throw new Error(`${label} is required.`);
  }

  if (
    parsed < 0 ||
    !Number.isInteger(parsed)
  ) {
    throw new Error(
      `${label} must be a non-negative integer.`
    );
  }

  return parsed;
};

const normalizeDateValue = (
  value,
  label,
  { allowNull = true } = {}
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    if (allowNull) return null;
    throw new Error(`${label} is required.`);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`${label} is invalid.`);
    }

    return value;
  }

  if (typeof value?.toDate === "function") {
    return normalizeDateValue(
      value.toDate(),
      label,
      { allowNull }
    );
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} is invalid.`);
  }

  return parsed;
};

export const normalizePlanCode = (
  value,
  {
    fallback = "FREE",
    strict = false,
  } = {}
) => {
  const fallbackToken = normalizeCodeToken(fallback) || "FREE";
  const token = normalizeCodeToken(value) || fallbackToken;
  const aliased = PLAN_ALIASES[token] || token;

  if (!ACCESS_PLAN_CODE_PATTERN.test(aliased)) {
    if (strict) {
      throw new Error(
        "Plan code must start with a letter and use only A-Z, 0-9, or underscore."
      );
    }

    const normalizedFallback =
      PLAN_ALIASES[fallbackToken] || fallbackToken;

    return ACCESS_PLAN_CODE_PATTERN.test(normalizedFallback)
      ? normalizedFallback
      : "FREE";
  }

  return aliased;
};

export const requirePlanCode = (value) =>
  normalizePlanCode(value, {
    fallback: "",
    strict: true,
  });

export const isInitialSeedPlan = (planCode) =>
  Boolean(
    ACCESS_INITIAL_PLAN_BY_CODE[
      normalizePlanCode(planCode)
    ]
  );

export const getInitialSeedPlan = (planCode) =>
  ACCESS_INITIAL_PLAN_BY_CODE[
    normalizePlanCode(planCode)
  ] || null;

export const getInitialSeedAccessRank = (
  planCode
) =>
  getInitialSeedPlan(planCode)?.accessRank ?? null;

export const normalizeAccessRank = (
  value,
  {
    planCode = "",
    required = false,
  } = {}
) => {
  const parsed = toFiniteNumber(value);

  if (parsed !== null) {
    if (
      parsed < 0 ||
      !Number.isInteger(parsed)
    ) {
      throw new Error(
        "Access rank must be a non-negative integer."
      );
    }

    return parsed;
  }

  const seedRank =
    getInitialSeedAccessRank(planCode);

  if (seedRank !== null) {
    return seedRank;
  }

  if (required) {
    throw new Error(
      "Custom plan requires an explicit access rank."
    );
  }

  return null;
};

export const normalizePlanProductId = (
  value,
  planCode
) => {
  const normalizedPlanCode =
    requirePlanCode(planCode);
  const raw =
    cleanString(value) ||
    `plan_${normalizedPlanCode.toLowerCase()}`;
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96);

  if (!normalized) {
    throw new Error("Product ID is required.");
  }

  return normalized;
};

export const normalizeCatalogPrice = (
  input = {}
) => {
  const priceINR = toFiniteNumber(
    input.priceINR ?? input.price
  );

  if (priceINR === null || priceINR < 0) {
    throw new Error(
      "Plan price must be a non-negative number."
    );
  }

  const compareAtPriceINR = toFiniteNumber(
    input.compareAtPriceINR ??
      input.compareAtPrice
  );
  const priceVersion =
    normalizeNonNegativeInteger(
      input.priceVersion ?? 1,
      "Price version"
    );

  if (priceVersion < 1) {
    throw new Error(
      "Price version must be at least 1."
    );
  }

  return {
    priceINR,
    compareAtPriceINR:
      compareAtPriceINR === null
        ? null
        : Math.max(compareAtPriceINR, 0),
    currency:
      cleanString(input.currency).toUpperCase() ||
      "INR",
    priceVersion,
    priceEffectiveFrom:
      normalizeDateValue(
        input.priceEffectiveFrom ??
          input.effectiveFrom,
        "Price effective-from date"
      ),
  };
};

export const normalizeAdminValidityPolicy = (
  input = {}
) => {
  const rawMode = cleanString(
    input.validityMode ||
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED
  ).toUpperCase();
  const allowedModes = new Set(
    Object.values(ACCESS_PLAN_VALIDITY_MODES)
  );

  if (!allowedModes.has(rawMode)) {
    throw new Error(
      "Validity mode is invalid."
    );
  }

  const defaultValidityDays =
    normalizeNonNegativeInteger(
      input.defaultValidityDays ??
        input.validityDays,
      "Default validity days",
      { allowNull: true }
    );
  const allowNoExpiry =
    input.allowNoExpiry !== false;

  if (
    rawMode ===
      ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY &&
    !allowNoExpiry
  ) {
    throw new Error(
      "NO_EXPIRY mode requires allowNoExpiry."
    );
  }

  return {
    validityMode: rawMode,
    defaultValidityDays,
    allowNoExpiry,
    adminControlsValidity: true,
    fixed365DayValidity: false,
  };
};

export const normalizePlanCatalogEntry = (
  input = {}
) => {
  const planCode = requirePlanCode(
    input.planCode ||
      input.planType ||
      input.code
  );
  const accessRank = normalizeAccessRank(
    input.accessRank ??
      input.planRank ??
      input.rank,
    {
      planCode,
      required: !isInitialSeedPlan(planCode),
    }
  );
  const productId = normalizePlanProductId(
    input.productId || input.id,
    planCode
  );
  const title = cleanString(
    input.title || input.name
  );

  if (!title) {
    throw new Error("Plan title is required.");
  }

  const price = normalizeCatalogPrice(input);
  const validity =
    normalizeAdminValidityPolicy(input);

  return {
    productId,
    planCode,
    planType: planCode,
    title,
    description: cleanString(
      input.description
    ),
    accessRank,
    ...price,
    ...validity,
    scopeType: "plan",
    isActive: input.isActive !== false,
    status:
      cleanString(input.status).toLowerCase() ||
      "active",
  };
};

export const resolvePlanDescriptor = (
  value,
  {
    catalog = [],
    requiredRank = null,
  } = {}
) => {
  const source =
    value && typeof value === "object"
      ? value
      : { planCode: value };

  const planCode = normalizePlanCode(
    source.planCode ||
      source.planType ||
      source.code ||
      "FREE"
  );
  const productId = cleanString(
    source.productId || source.id
  );
  const catalogEntries = Array.isArray(catalog)
    ? catalog
    : [];
  const catalogMatch =
    catalogEntries.find((entry) => {
      const entryCode = normalizePlanCode(
        entry?.planCode ||
          entry?.planType ||
          entry?.code ||
          ""
      );

      return (
        (productId &&
          cleanString(
            entry?.productId || entry?.id
          ) === productId) ||
        entryCode === planCode
      );
    }) || null;
  const accessRank = normalizeAccessRank(
    source.accessRank ??
      source.planRank ??
      source.rank ??
      catalogMatch?.accessRank ??
      catalogMatch?.planRank ??
      requiredRank,
    {
      planCode,
      required: false,
    }
  );

  return {
    planCode,
    planType: planCode,
    accessRank,
    productId:
      productId ||
      cleanString(
        catalogMatch?.productId ||
          catalogMatch?.id
      ) ||
      null,
  };
};

export const comparePlanDescriptors = (
  first,
  second,
  options = {}
) => {
  const firstPlan = resolvePlanDescriptor(
    first,
    options
  );
  const secondPlan = resolvePlanDescriptor(
    second,
    options
  );

  if (
    firstPlan.accessRank === null ||
    secondPlan.accessRank === null
  ) {
    if (
      firstPlan.planCode ===
      secondPlan.planCode
    ) {
      return 0;
    }

    throw new Error(
      "Cannot compare different plans without access ranks."
    );
  }

  return (
    firstPlan.accessRank -
    secondPlan.accessRank
  );
};

export const canUsePlanDescriptor = (
  userPlan,
  requiredPlan,
  options = {}
) => {
  const user = resolvePlanDescriptor(
    userPlan,
    options
  );
  const required = resolvePlanDescriptor(
    requiredPlan,
    options
  );

  if (
    required.planCode === "FREE" ||
    required.accessRank === 0
  ) {
    return true;
  }

  if (
    user.planCode === required.planCode
  ) {
    return true;
  }

  if (
    user.accessRank === null ||
    required.accessRank === null
  ) {
    return false;
  }

  return (
    user.accessRank >= required.accessRank
  );
};

export const assertUniquePlanCatalog = (
  entries = []
) => {
  const seenCodes = new Set();
  const seenProductIds = new Set();

  (Array.isArray(entries) ? entries : [])
    .map(normalizePlanCatalogEntry)
    .forEach((entry) => {
      if (seenCodes.has(entry.planCode)) {
        throw new Error(
          `Duplicate plan code: ${entry.planCode}.`
        );
      }

      if (
        seenProductIds.has(entry.productId)
      ) {
        throw new Error(
          `Duplicate product ID: ${entry.productId}.`
        );
      }

      seenCodes.add(entry.planCode);
      seenProductIds.add(entry.productId);
    });

  return true;
};

export const normalizeAdminGrantWindow = (
  input = {}
) => {
  const accessFrom = normalizeDateValue(
    input.accessFrom,
    "Access from date"
  );
  const accessUntil = normalizeDateValue(
    input.accessUntil,
    "Access until date"
  );
  const noExpiry =
    input.noExpiry === true;
  const untilManualChange =
    input.untilManualChange === true;

  if (
    noExpiry &&
    accessUntil
  ) {
    throw new Error(
      "No-expiry access cannot include an access-until date."
    );
  }

  if (
    untilManualChange &&
    accessUntil
  ) {
    throw new Error(
      "Until-manual-change access cannot include an access-until date."
    );
  }

  if (
    accessFrom &&
    accessUntil &&
    accessFrom.getTime() >
      accessUntil.getTime()
  ) {
    throw new Error(
      "Access until date must be on or after access from date."
    );
  }

  const validityMode = noExpiry
    ? ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
    : untilManualChange
      ? ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
      : accessFrom || accessUntil
        ? ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW
        : ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED;

  return {
    validityMode,
    accessFrom,
    accessUntil,
    noExpiry,
    untilManualChange,
    adminSelected: true,
  };
};

export const buildPlanPurchaseTermsSnapshot = (
  {
    product = {},
    grant = {},
    capturedAt = new Date(),
  } = {}
) => {
  const catalogEntry =
    normalizePlanCatalogEntry(product);
  const window = normalizeAdminGrantWindow(
    grant
  );
  const snapshotDate = normalizeDateValue(
    capturedAt,
    "Terms snapshot date",
    { allowNull: false }
  );

  return Object.freeze({
    productId: catalogEntry.productId,
    planCode: catalogEntry.planCode,
    planType: catalogEntry.planCode,
    accessRank: catalogEntry.accessRank,
    priceINR: catalogEntry.priceINR,
    compareAtPriceINR:
      catalogEntry.compareAtPriceINR,
    currency: catalogEntry.currency,
    priceVersion:
      catalogEntry.priceVersion,
    priceEffectiveFrom:
      catalogEntry.priceEffectiveFrom,
    validityMode: window.validityMode,
    accessFrom: window.accessFrom,
    accessUntil: window.accessUntil,
    noExpiry: window.noExpiry,
    untilManualChange:
      window.untilManualChange,
    capturedAt: snapshotDate,
  });
};
