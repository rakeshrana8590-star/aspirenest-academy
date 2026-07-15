import {
  ACCESS_PLAN_VALIDITY_MODES,
  normalizePlanCatalogEntry,
  normalizePlanCode,
} from "./accessPlanCatalog";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const toFiniteNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const normalizeExistingPriceVersion = (
  value
) => {
  const parsed = toFiniteNumber(value);

  if (
    parsed === null ||
    parsed < 1 ||
    !Number.isInteger(parsed)
  ) {
    return 1;
  }

  return parsed;
};

const normalizeDateInput = (
  value,
  fallback = null
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(
        "Catalog effective date is invalid."
      );
    }

    return value;
  }

  if (typeof value?.toDate === "function") {
    return normalizeDateInput(
      value.toDate(),
      fallback
    );
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      "Catalog effective date is invalid."
    );
  }

  return parsed;
};

const sameNumber = (first, second) =>
  Number(first ?? 0) === Number(second ?? 0);

const isPriceChanged = (
  existing = {},
  next = {}
) =>
  !sameNumber(
    existing.priceINR ?? existing.price,
    next.priceINR
  ) ||
  !sameNumber(
    existing.compareAtPriceINR ??
      existing.compareAtPrice,
    next.compareAtPriceINR
  ) ||
  cleanString(
    existing.currency || "INR"
  ).toUpperCase() !==
    cleanString(
      next.currency || "INR"
    ).toUpperCase();

export const buildPlanCatalogDocumentId = (
  input = {}
) =>
  normalizePlanCatalogEntry(input).productId;

export const assertStablePlanCatalogIdentity = (
  existing = {},
  next = {}
) => {
  const existingProductId = cleanString(
    existing.productId || existing.id
  );
  const nextProductId = cleanString(
    next.productId || next.id
  );

  if (
    existingProductId &&
    nextProductId &&
    existingProductId !== nextProductId
  ) {
    throw new Error(
      "Referenced product ID cannot be changed."
    );
  }

  const existingPlanCode =
    normalizePlanCode(
      existing.planCode ||
        existing.planType ||
        "",
      {
        fallback: "",
        strict: true,
      }
    );
  const nextPlanCode =
    normalizePlanCode(
      next.planCode ||
        next.planType ||
        "",
      {
        fallback: "",
        strict: true,
      }
    );

  if (
    existingPlanCode &&
    nextPlanCode &&
    existingPlanCode !== nextPlanCode
  ) {
    throw new Error(
      "Existing plan code cannot be changed."
    );
  }

  return true;
};

export const buildPlanCatalogPersistencePayload = (
  input = {},
  {
    existing = null,
    effectiveAt = new Date(),
  } = {}
) => {
  const normalized =
    normalizePlanCatalogEntry(input);
  const current =
    existing &&
    typeof existing === "object"
      ? existing
      : null;

  if (current) {
    assertStablePlanCatalogIdentity(
      current,
      normalized
    );
  }

  const currentVersion =
    normalizeExistingPriceVersion(
      current?.priceVersion
    );
  const priceChanged = current
    ? isPriceChanged(
        current,
        normalized
      )
    : false;
  const requestedVersion =
    normalizeExistingPriceVersion(
      normalized.priceVersion
    );
  const priceVersion = current
    ? priceChanged
      ? Math.max(
          requestedVersion,
          currentVersion + 1
        )
      : currentVersion
    : requestedVersion;
  const priceEffectiveFrom = priceChanged
    ? normalizeDateInput(
        normalized.priceEffectiveFrom,
        normalizeDateInput(
          effectiveAt,
          new Date()
        )
      )
    : normalizeDateInput(
        normalized.priceEffectiveFrom,
        normalizeDateInput(
          current?.priceEffectiveFrom,
          null
        )
      );

  return {
    productId: normalized.productId,
    planCode: normalized.planCode,
    planType: normalized.planCode,
    title: normalized.title,
    name: normalized.title,
    description:
      normalized.description,
    course:
      cleanString(input.course) ||
      "CTET_TET",
    scopeType: "plan",
    accessRank: normalized.accessRank,
    priceINR: normalized.priceINR,
    price: normalized.priceINR,
    compareAtPriceINR:
      normalized.compareAtPriceINR,
    compareAtPrice:
      normalized.compareAtPriceINR ?? 0,
    currency: normalized.currency,
    priceVersion,
    priceEffectiveFrom,
    validityMode:
      normalized.validityMode,
    defaultValidityDays:
      normalized.defaultValidityDays,
    validityDays:
      normalized.defaultValidityDays,
    allowNoExpiry:
      normalized.allowNoExpiry,
    adminControlsValidity: true,
    fixed365DayValidity: false,
    supportsCustomWindow: true,
    supportsUntilManualChange: true,
    accessFrom: null,
    accessUntil: null,
    status: normalized.status,
    isActive: normalized.isActive,
    notes:
      cleanString(
        input.notes ||
          input.adminNote
      ),
    adminNote:
      cleanString(
        input.adminNote ||
          input.notes
      ),
  };
};

export const buildPlanCatalogCreatePayload = (
  input = {},
  options = {}
) =>
  buildPlanCatalogPersistencePayload(
    input,
    {
      ...options,
      existing: null,
    }
  );

export const buildPlanCatalogUpdatePayload = (
  existing = {},
  input = {},
  options = {}
) =>
  buildPlanCatalogPersistencePayload(
    {
      ...existing,
      ...input,
      productId:
        existing.productId ||
        existing.id,
      planCode:
        existing.planCode ||
        existing.planType,
      priceINR:
        input.priceINR ??
        input.price ??
        existing.priceINR ??
        existing.price,
      compareAtPriceINR:
        input.compareAtPriceINR ??
        input.compareAtPrice ??
        existing.compareAtPriceINR ??
        existing.compareAtPrice,
      defaultValidityDays:
        input.defaultValidityDays ??
        input.validityDays ??
        existing.defaultValidityDays ??
        existing.validityDays ??
        null,
    },
    {
      ...options,
      existing,
    }
  );

export const isAdminDefinedValidity = (
  product = {}
) =>
  cleanString(
    product.validityMode
  ).toUpperCase() ===
    ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED &&
  product.adminControlsValidity === true &&
  product.fixed365DayValidity !== true;

export const buildPlanCatalogPricePreview = (
  product = {}
) => ({
  priceINR: Number(
    product.priceINR ??
      product.price ??
      0
  ),
  compareAtPriceINR: Number(
    product.compareAtPriceINR ??
      product.compareAtPrice ??
      0
  ),
  currency:
    cleanString(
      product.currency
    ).toUpperCase() || "INR",
  priceVersion:
    normalizeExistingPriceVersion(
      product.priceVersion
    ),
  priceEffectiveFrom:
    product.priceEffectiveFrom || null,
});
