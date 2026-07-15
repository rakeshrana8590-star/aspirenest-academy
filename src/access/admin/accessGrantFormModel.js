import {
  ACCESS_COURSE,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  ACCESS_PLAN_VALIDITY_MODES,
  buildPlanPurchaseTermsSnapshot,
  normalizePlanCatalogEntry,
} from "../accessPlanCatalog";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const toDate = (
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

  const parsed =
    value instanceof Date
      ? new Date(
          value.getTime()
        )
      : new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(
            cleanString(value)
          )
            ? `${cleanString(
                value
              )}T00:00:00.000Z`
            : value
        );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `${label} is invalid.`
    );
  }

  return parsed;
};

const addDays = (
  value,
  days
) => {
  const next = new Date(
    value.getTime()
  );

  next.setUTCDate(
    next.getUTCDate() + days
  );

  return next;
};

export const ADMIN_PLAN_VALIDITY_CHOICES =
  Object.freeze({
    CUSTOM_WINDOW:
      ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW,
    VALIDITY_DAYS:
      "VALIDITY_DAYS",
    NO_EXPIRY:
      ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY,
    UNTIL_MANUAL_CHANGE:
      ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE,
  });

export const createInitialDynamicPlanGrantForm =
  () => ({
    email: "",
    name: "",
    phone: "",
    course:
      ACCESS_COURSE.CTET_TET,
    scopeType:
      ACCESS_SCOPE_TYPES.PLAN,
    productId: "",
    planCode: "",
    accessRank: "",
    validityChoice:
      ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW,
    accessFrom: "",
    accessUntil: "",
    validityDays: "",
    noExpiry: false,
    untilManualChange: false,
    status:
      ACCESS_STATUS.ACTIVE,
    source:
      ACCESS_SOURCE.ADMIN_MANUAL,
    sendInvite: "yes",
    adminNote: "",
  });

export const listGrantablePlanProducts = (
  products = []
) =>
  (Array.isArray(products)
    ? products
    : []
  )
    .filter(
      (product) =>
        cleanString(
          product.scopeType ||
            "plan"
        ).toLowerCase() ===
          ACCESS_SCOPE_TYPES.PLAN &&
        product.isActive !== false &&
        cleanString(
          product.status ||
            "active"
        ).toLowerCase() ===
          "active"
    )
    .map(
      normalizePlanCatalogEntry
    )
    .sort(
      (first, second) =>
        first.accessRank -
          second.accessRank ||
        first.title.localeCompare(
          second.title
        )
    );

export const applyPlanProductToGrantForm = (
  form = {},
  product = {}
) => {
  const normalized =
    normalizePlanCatalogEntry(
      product
    );

  return {
    ...form,
    productId:
      normalized.productId,
    planCode:
      normalized.planCode,
    planType:
      normalized.planCode,
    accessRank: String(
      normalized.accessRank
    ),
  };
};

export const validateDynamicPlanGrantForm = ({
  form = {},
  products = [],
} = {}) => {
  const errors = [];
  const productId = cleanString(
    form.productId
  );
  const product =
    listGrantablePlanProducts(
      products
    ).find(
      (item) =>
        item.productId ===
        productId
    ) || null;

  if (
    !normalizeEmail(
      form.email
    )
  ) {
    errors.push(
      "Learner email is required."
    );
  }

  if (!productId) {
    errors.push(
      "Select an active plan product."
    );
  } else if (!product) {
    errors.push(
      "Selected plan product is not active or no longer exists."
    );
  }

  if (
    !cleanString(
      form.adminNote
    )
  ) {
    errors.push(
      "Admin note is required."
    );
  }

  const validityChoice =
    cleanString(
      form.validityChoice
    );

  if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW
  ) {
    if (
      !cleanString(
        form.accessUntil
      )
    ) {
      errors.push(
        "Access-until date is required for a custom window."
      );
    }
  } else if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS
  ) {
    const days = Number(
      form.validityDays
    );

    if (
      !Number.isInteger(days) ||
      days <= 0
    ) {
      errors.push(
        "Validity days must be a positive whole number."
      );
    }
  } else if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY
  ) {
    if (
      product &&
      !product.allowNoExpiry
    ) {
      errors.push(
        "Selected plan does not allow no-expiry access."
      );
    }
  } else if (
    validityChoice !==
    ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE
  ) {
    errors.push(
      "Select a valid access duration."
    );
  }

  if (
    form.accessFrom &&
    form.accessUntil
  ) {
    const start = toDate(
      form.accessFrom,
      "Access from date"
    );
    const end = toDate(
      form.accessUntil,
      "Access until date"
    );

    if (
      end.getTime() <
      start.getTime()
    ) {
      errors.push(
        "Access-until date cannot be before access-from date."
      );
    }
  }

  return errors;
};

export const buildDynamicPlanGrantPayload = ({
  form = {},
  products = [],
  now = new Date(),
} = {}) => {
  const errors =
    validateDynamicPlanGrantForm({
      form,
      products,
    });

  if (errors.length) {
    throw new Error(
      errors.join(" ")
    );
  }

  const product =
    listGrantablePlanProducts(
      products
    ).find(
      (item) =>
        item.productId ===
        cleanString(
          form.productId
        )
    );
  const accessFrom =
    toDate(
      form.accessFrom ||
        now,
      "Access from date"
    );
  const validityChoice =
    cleanString(
      form.validityChoice
    );
  let accessUntil = null;
  let noExpiry = false;
  let untilManualChange =
    false;

  if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW
  ) {
    accessUntil = toDate(
      form.accessUntil,
      "Access until date"
    );
  }

  if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS
  ) {
    accessUntil = addDays(
      accessFrom,
      Number(
        form.validityDays
      )
    );
  }

  if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY
  ) {
    noExpiry = true;
  }

  if (
    validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE
  ) {
    untilManualChange = true;
  }

  const purchaseTermsSnapshot =
    buildPlanPurchaseTermsSnapshot({
      product,
      grant: {
        accessFrom,
        accessUntil,
        noExpiry,
        untilManualChange,
      },
      capturedAt: now,
    });

  return {
    email:
      normalizeEmail(
        form.email
      ),
    learnerName:
      cleanString(
        form.name
      ),
    name:
      cleanString(
        form.name
      ),
    phone:
      cleanString(
        form.phone
      ),
    course:
      form.course ||
      ACCESS_COURSE.CTET_TET,
    scopeType:
      ACCESS_SCOPE_TYPES.PLAN,
    planType:
      product.planCode,
    planCode:
      product.planCode,
    accessRank:
      product.accessRank,
    productId:
      product.productId,
    purchaseTermsSnapshot,
    termsSnapshot:
      purchaseTermsSnapshot,
    priceVersion:
      product.priceVersion,
    validityMode:
      purchaseTermsSnapshot.validityMode,
    noExpiry,
    untilManualChange,
    accessFrom,
    accessUntil,
    status:
      form.status ||
      ACCESS_STATUS.ACTIVE,
    source:
      form.source ||
      ACCESS_SOURCE.ADMIN_MANUAL,
    adminNote:
      cleanString(
        form.adminNote
      ),
    notes:
      cleanString(
        form.adminNote
      ),
    fixed365DayValidity: false,
  };
};
