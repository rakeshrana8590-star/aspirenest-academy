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

const pushUniqueError = (
  errors,
  message
) => {
  if (!errors.includes(message)) {
    errors.push(message);
  }
};

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
    planType: "",
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
    .map((product) => {
      try {
        return normalizePlanCatalogEntry(
          product
        );
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort(
      (first, second) =>
        first.accessRank -
          second.accessRank ||
        first.title.localeCompare(
          second.title
        )
    );

export const getSelectedGrantablePlanProduct = ({
  form = {},
  products = [],
} = {}) =>
  listGrantablePlanProducts(
    products
  ).find(
    (item) =>
      item.productId ===
      cleanString(
        form.productId
      )
  ) || null;

export const hasSameCatalogPlanGrantTarget = (
  record = {},
  target = {}
) => {
  const recordProductId =
    cleanString(
      record.productId
    ).toLowerCase();
  const targetProductId =
    cleanString(
      target.productId
    ).toLowerCase();

  if (
    recordProductId &&
    targetProductId
  ) {
    return (
      recordProductId ===
      targetProductId
    );
  }

  const recordPlanCode =
    cleanString(
      record.planCode ||
        record.planType
    ).toUpperCase();
  const targetPlanCode =
    cleanString(
      target.planCode ||
        target.planType
    ).toUpperCase();

  return Boolean(
    recordPlanCode &&
      targetPlanCode &&
      recordPlanCode ===
        targetPlanCode
  );
};

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

export const validateDynamicPlanGrantSelection = ({
  form = {},
  products = [],
  requireAdminNote = true,
} = {}) => {
  const errors = [];
  const productId = cleanString(
    form.productId
  );
  const product =
    getSelectedGrantablePlanProduct({
      form,
      products,
    });

  if (!productId) {
    pushUniqueError(
      errors,
      "Select an active plan product."
    );
  } else if (!product) {
    pushUniqueError(
      errors,
      "Selected plan product is not active or no longer exists."
    );
  }

  if (
    requireAdminNote &&
    !cleanString(
      form.adminNote
    )
  ) {
    pushUniqueError(
      errors,
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
      pushUniqueError(
        errors,
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
      pushUniqueError(
        errors,
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
      pushUniqueError(
        errors,
        "Selected plan does not allow no-expiry access."
      );
    }
  } else if (
    validityChoice !==
    ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE
  ) {
    pushUniqueError(
      errors,
      "Select a valid access duration."
    );
  }

  if (
    form.accessFrom &&
    form.accessUntil
  ) {
    try {
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
        pushUniqueError(
          errors,
          "Access-until date cannot be before access-from date."
        );
      }
    } catch (error) {
      pushUniqueError(
        errors,
        error.message
      );
    }
  }

  return errors;
};

export const validateDynamicPlanGrantForm = ({
  form = {},
  products = [],
} = {}) => {
  const errors = [];
  const normalizedEmail =
    normalizeEmail(
      form.email
    );

  if (!normalizedEmail) {
    errors.push(
      "Learner email is required."
    );
  } else if (
    !normalizedEmail.includes("@")
  ) {
    errors.push(
      "Enter a valid learner email."
    );
  }

  validateDynamicPlanGrantSelection({
    form,
    products,
    requireAdminNote: true,
  }).forEach((message) =>
    pushUniqueError(
      errors,
      message
    )
  );

  return errors;
};

export const buildDynamicPlanGrantTerms = ({
  form = {},
  products = [],
  now = new Date(),
  requireAdminNote = true,
} = {}) => {
  const errors =
    validateDynamicPlanGrantSelection({
      form,
      products,
      requireAdminNote,
    });

  if (errors.length) {
    throw new Error(
      errors.join(" ")
    );
  }

  const product =
    getSelectedGrantablePlanProduct({
      form,
      products,
    });
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
  let validityDays = 0;
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
    validityDays = Number(
      form.validityDays
    );
    accessUntil = addDays(
      accessFrom,
      validityDays
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
    validityDays,
    noExpiry,
    untilManualChange,
    accessFrom,
    accessUntil,
    fixed365DayValidity: false,
  };
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

  const terms =
    buildDynamicPlanGrantTerms({
      form,
      products,
      now,
      requireAdminNote: true,
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
    ...terms,
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
  };
};
