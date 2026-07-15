import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  ACCESS_PLAN_VALIDITY_MODES,
  getInitialSeedPlan,
  normalizeAccessRank,
  normalizePlanCode,
  normalizePlanProductId,
} from "../accessPlanCatalog";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const toOptionalNonNegativeInteger = (
  value,
  label
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `${label} must be a non-negative whole number.`
    );
  }

  return parsed;
};

const toNonNegativeNumber = (
  value,
  label
) => {
  const parsed = Number(value || 0);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `${label} cannot be negative.`
    );
  }

  return parsed;
};

export const createInitialAccessProductForm = () => ({
  title: "",
  description: "",
  course: ACCESS_COURSE.CTET_TET,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  productId: "",
  planCode: ACCESS_PLAN_TYPES.PREMIUM,
  accessRank: "200",
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  validityMode:
    ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
  defaultValidityDays: "",
  allowNoExpiry: true,
  validityDays: "30",
  price: "",
  compareAtPrice: "",
  currency: "INR",
  priceVersion: 1,
  priceEffectiveFrom: null,
  status: ACCESS_STATUS.ACTIVE,
  adminNote: "",
});

export const isPlanProductScope = (
  scopeType
) =>
  cleanString(scopeType).toLowerCase() ===
  ACCESS_SCOPE_TYPES.PLAN;

export const normalizePlanCodeDraft = (
  value
) =>
  cleanString(value)
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

export const parseBundleItemIds = (
  value = ""
) =>
  cleanString(value)
    .split(/[\n,]+/)
    .map((item) =>
      item
        .replace(
          /^\d+[\).\-\s]+/,
          ""
        )
        .trim()
    )
    .filter(Boolean);

export const getPlanProductIdPreview = (
  form = {}
) => {
  try {
    const planCode =
      normalizePlanCode(
        form.planCode ||
          form.planType,
        {
          fallback: "",
          strict: true,
        }
      );

    return normalizePlanProductId(
      form.productId,
      planCode
    );
  } catch (error) {
    return "Complete a valid plan code";
  }
};

export const validateAccessProductForm = (
  form = {}
) => {
  const errors = [];
  const scopeType =
    cleanString(form.scopeType).toLowerCase();
  const bundleItemIds =
    parseBundleItemIds(
      form.itemIdsText
    );

  if (!cleanString(form.title)) {
    errors.push(
      "Product title is required."
    );
  }

  if (!cleanString(form.course)) {
    errors.push("Course is required.");
  }

  if (
    !Object.values(
      ACCESS_SCOPE_TYPES
    ).includes(scopeType)
  ) {
    errors.push(
      "Scope type is required."
    );
  }

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    let planCode = "";

    try {
      planCode = normalizePlanCode(
        form.planCode ||
          form.planType,
        {
          fallback: "",
          strict: true,
        }
      );
    } catch (error) {
      errors.push(error.message);
    }

    try {
      normalizeAccessRank(
        form.accessRank,
        {
          planCode,
          required: true,
        }
      );
    } catch (error) {
      errors.push(error.message);
    }

    try {
      toOptionalNonNegativeInteger(
        form.defaultValidityDays,
        "Default validity days"
      );
    } catch (error) {
      errors.push(error.message);
    }

    if (
      form.validityMode !==
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED
    ) {
      errors.push(
        "Plan catalog validity must stay admin-defined."
      );
    }
  }

  if (
    scopeType ===
      ACCESS_SCOPE_TYPES.MODULE &&
    !cleanString(form.module)
  ) {
    errors.push(
      "Module is required for module product."
    );
  }

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.ITEM
  ) {
    if (!cleanString(form.module)) {
      errors.push(
        "Module is required for item product."
      );
    }

    if (!cleanString(form.itemType)) {
      errors.push(
        "Item type is required for item product."
      );
    }

    if (!cleanString(form.itemId)) {
      errors.push(
        "Item ID is required for item product."
      );
    }
  }

  if (
    scopeType ===
      ACCESS_SCOPE_TYPES.BUNDLE &&
    !cleanString(form.bundleId) &&
    bundleItemIds.length === 0
  ) {
    errors.push(
      "Bundle ID or bundle item IDs are required for bundle product."
    );
  }

  try {
    toNonNegativeNumber(
      form.price,
      "Price"
    );
  } catch (error) {
    errors.push(error.message);
  }

  try {
    toNonNegativeNumber(
      form.compareAtPrice,
      "Compare-at price"
    );
  } catch (error) {
    errors.push(error.message);
  }

  if (
    !isPlanProductScope(
      scopeType
    )
  ) {
    try {
      toOptionalNonNegativeInteger(
        form.validityDays,
        "Validity days"
      );
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (!cleanString(form.status)) {
    errors.push(
      "Status is required."
    );
  }

  return errors;
};

export const buildAccessProductFormPayload = (
  form = {}
) => {
  const errors =
    validateAccessProductForm(form);

  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  const scopeType =
    cleanString(form.scopeType).toLowerCase();
  const common = {
    title: cleanString(form.title),
    name: cleanString(form.title),
    description:
      cleanString(form.description),
    course:
      cleanString(form.course) ||
      ACCESS_COURSE.CTET_TET,
    scopeType,
    price:
      toNonNegativeNumber(
        form.price,
        "Price"
      ),
    compareAtPrice:
      toNonNegativeNumber(
        form.compareAtPrice,
        "Compare-at price"
      ),
    currency:
      cleanString(
        form.currency
      ).toUpperCase() || "INR",
    status:
      cleanString(form.status).toLowerCase(),
    isActive:
      cleanString(
        form.status
      ).toLowerCase() ===
      ACCESS_STATUS.ACTIVE,
    adminNote:
      cleanString(form.adminNote),
    notes:
      cleanString(form.adminNote),
  };

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    const planCode =
      normalizePlanCode(
        form.planCode ||
          form.planType,
        {
          fallback: "",
          strict: true,
        }
      );
    const accessRank =
      normalizeAccessRank(
        form.accessRank,
        {
          planCode,
          required: true,
        }
      );
    const defaultValidityDays =
      toOptionalNonNegativeInteger(
        form.defaultValidityDays,
        "Default validity days"
      );

    return {
      ...common,
      productId:
        normalizePlanProductId(
          form.productId,
          planCode
        ),
      planCode,
      planType: planCode,
      accessRank,
      priceINR: common.price,
      compareAtPriceINR:
        common.compareAtPrice,
      priceVersion:
        Number(
          form.priceVersion || 1
        ),
      priceEffectiveFrom:
        form.priceEffectiveFrom ||
        null,
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
      defaultValidityDays,
      validityDays:
        defaultValidityDays,
      allowNoExpiry:
        form.allowNoExpiry !== false,
      adminControlsValidity: true,
      fixed365DayValidity: false,
      supportsCustomWindow: true,
      supportsUntilManualChange: true,
    };
  }

  return {
    ...common,
    planType:
      cleanString(
        form.planCode ||
          form.planType
      ).toUpperCase() ||
      ACCESS_PLAN_TYPES.FREE,
    module:
      cleanString(form.module) ||
      null,
    itemType:
      cleanString(form.itemType) ||
      null,
    itemId:
      cleanString(form.itemId) ||
      null,
    itemTitle:
      cleanString(form.itemTitle),
    itemIds:
      parseBundleItemIds(
        form.itemIdsText
      ),
    bundleId:
      cleanString(form.bundleId) ||
      null,
    validityDays:
      toOptionalNonNegativeInteger(
        form.validityDays,
        "Validity days"
      ) || 0,
  };
};

export const buildAccessProductFormFromRecord = (
  product = {}
) => {
  const initial =
    createInitialAccessProductForm();
  const scopeType =
    cleanString(
      product.scopeType ||
        ACCESS_SCOPE_TYPES.PLAN
    ).toLowerCase();
  const planCode =
    normalizePlanCode(
      product.planCode ||
        product.planType ||
        ACCESS_PLAN_TYPES.FREE
    );
  const seed =
    getInitialSeedPlan(planCode);

  return {
    ...initial,
    title:
      cleanString(
        product.title ||
          product.name
      ),
    description:
      cleanString(product.description),
    course:
      cleanString(product.course) ||
      ACCESS_COURSE.CTET_TET,
    scopeType,
    productId:
      cleanString(
        product.productId ||
          product.id
      ),
    planCode,
    accessRank: String(
      product.accessRank ??
        seed?.accessRank ??
        ""
    ),
    module:
      cleanString(product.module),
    itemType:
      cleanString(product.itemType),
    itemId:
      cleanString(product.itemId),
    itemTitle:
      cleanString(product.itemTitle),
    itemIdsText:
      Array.isArray(product.itemIds)
        ? product.itemIds.join("\n")
        : "",
    bundleId:
      cleanString(product.bundleId),
    validityMode:
      product.validityMode ||
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays:
      product.defaultValidityDays ??
      product.validityDays ??
      "",
    allowNoExpiry:
      product.allowNoExpiry !== false,
    validityDays:
      product.validityDays ?? "",
    price:
      product.priceINR ??
      product.price ??
      "",
    compareAtPrice:
      product.compareAtPriceINR ??
      product.compareAtPrice ??
      "",
    currency:
      cleanString(
        product.currency
      ).toUpperCase() || "INR",
    priceVersion:
      Number(
        product.priceVersion || 1
      ),
    priceEffectiveFrom:
      product.priceEffectiveFrom ||
      null,
    status:
      cleanString(product.status) ||
      ACCESS_STATUS.ACTIVE,
    adminNote:
      cleanString(
        product.adminNote ||
          product.notes
      ),
  };
};

export const describeCatalogValidity = (
  product = {}
) => {
  if (
    !isPlanProductScope(
      product.scopeType
    )
  ) {
    return `${
      Number(
        product.validityDays || 0
      )
    } days`;
  }

  const defaultDays =
    product.defaultValidityDays ??
    product.validityDays;

  if (
    defaultDays === null ||
    defaultDays === undefined ||
    defaultDays === ""
  ) {
    return product.allowNoExpiry !== false
      ? "Admin decides per grant • no-expiry allowed"
      : "Admin decides per grant";
  }

  return `${Number(
    defaultDays
  )} day default${
    product.allowNoExpiry !== false
      ? " • no-expiry allowed"
      : ""
  }`;
};

export const ACCESS_PRODUCT_FORM_OPTIONS =
  Object.freeze({
    courses:
      Object.values(ACCESS_COURSE),
    modules:
      Object.values(ACCESS_MODULE),
    itemTypes:
      Object.values(
        ACCESS_ITEM_TYPES
      ),
    statuses: [
      ACCESS_STATUS.ACTIVE,
      ACCESS_STATUS.PENDING,
      ACCESS_STATUS.BLOCKED,
    ],
  });
