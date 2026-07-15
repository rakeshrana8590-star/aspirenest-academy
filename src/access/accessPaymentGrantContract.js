import {
  ACCESS_COURSE,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "./accessConstants";

import {
  ACCESS_PLAN_VALIDITY_MODES,
  buildPlanPurchaseTermsSnapshot,
  normalizePlanCatalogEntry,
} from "./accessPlanCatalog";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const toDate = (
  value,
  label = "Date"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    const copy = new Date(
      value.getTime()
    );

    if (
      Number.isNaN(
        copy.getTime()
      )
    ) {
      throw new Error(
        `${label} is invalid.`
      );
    }

    return copy;
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return toDate(
      value.toDate(),
      label
    );
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return toDate(
      new Date(
        Number(
          value.seconds
        ) * 1000
      ),
      label
    );
  }

  const normalized =
    cleanString(value);
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized
    )
      ? `${normalized}T00:00:00.000Z`
      : normalized
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

const readPositiveInteger = (
  value,
  label
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
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

const addDays = (
  value,
  days
) => {
  const date = toDate(
    value,
    "Access from date"
  );
  const next = new Date(
    date.getTime()
  );

  next.setUTCDate(
    next.getUTCDate() + days
  );

  return next;
};

const sameAmount = (
  first,
  second
) => {
  const left = Number(first);
  const right = Number(second);

  return (
    Number.isFinite(left) &&
    Number.isFinite(right) &&
    Math.abs(left - right) <
      0.01
  );
};

export const normalizePaymentPlanProduct = (
  product = {}
) => {
  const scopeType = cleanString(
    product.scopeType || "plan"
  ).toLowerCase();

  if (
    scopeType !==
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    throw new Error(
      "Payment product must be plan scoped."
    );
  }

  const normalized =
    normalizePlanCatalogEntry(
      product
    );

  if (
    normalized.isActive ===
      false ||
    normalized.status !==
      "active"
  ) {
    throw new Error(
      "Payment product must be active."
    );
  }

  return normalized;
};

export const buildPaymentProductSnapshot = (
  product = {},
  capturedAt = new Date()
) => {
  const normalized =
    normalizePaymentPlanProduct(
      product
    );

  return Object.freeze({
    productId:
      normalized.productId,
    planCode:
      normalized.planCode,
    planType:
      normalized.planCode,
    title: normalized.title,
    description:
      normalized.description,
    accessRank:
      normalized.accessRank,
    scopeType:
      ACCESS_SCOPE_TYPES.PLAN,
    priceINR:
      normalized.priceINR,
    compareAtPriceINR:
      normalized.compareAtPriceINR,
    currency:
      normalized.currency,
    priceVersion:
      normalized.priceVersion,
    priceEffectiveFrom:
      normalized.priceEffectiveFrom,
    validityMode:
      normalized.validityMode,
    defaultValidityDays:
      normalized.defaultValidityDays,
    allowNoExpiry:
      normalized.allowNoExpiry,
    fixed365DayValidity: false,
    capturedAt: toDate(
      capturedAt,
      "Product snapshot date"
    ),
  });
};

export const buildDynamicPaymentRequest = ({
  product = {},
  learner = {},
  orderId = "",
  upiLink = "",
  requestedAt = new Date(),
} = {}) => {
  const snapshot =
    buildPaymentProductSnapshot(
      product,
      requestedAt
    );
  const normalizedOrderId =
    cleanString(orderId);
  const userId = cleanString(
    learner.userId ||
      learner.uid
  );
  const studentEmail =
    normalizeEmail(
      learner.studentEmail ||
        learner.email
    );

  if (!normalizedOrderId) {
    throw new Error(
      "Payment order ID is required."
    );
  }

  if (!userId) {
    throw new Error(
      "Payment learner UID is required."
    );
  }

  if (!studentEmail) {
    throw new Error(
      "Payment learner email is required."
    );
  }

  return {
    orderId:
      normalizedOrderId,
    userId,
    upiLink:
      cleanString(upiLink),
    studentEmail,
    studentMobile:
      cleanString(
        learner.studentMobile ||
          learner.mobile ||
          learner.phone
      ),
    studentName:
      cleanString(
        learner.studentName ||
          learner.name
      ),
    planName:
      snapshot.title,
    planType:
      snapshot.planCode,
    planCode:
      snapshot.planCode,
    productId:
      snapshot.productId,
    accessRank:
      snapshot.accessRank,
    amount:
      snapshot.priceINR,
    currency:
      snapshot.currency,
    priceVersion:
      snapshot.priceVersion,
    priceEffectiveFrom:
      snapshot.priceEffectiveFrom,
    productSnapshot:
      snapshot,
    fixed365DayValidity: false,
    status:
      "pending_payment",
    studentProof: "",
    adminProof: "",
    matchStatus: "waiting",
    createdAt: toDate(
      requestedAt,
      "Payment request date"
    ),
  };
};

export const resolvePaymentAdminValidity = ({
  product = {},
  payment = {},
  selection = {},
  now = new Date(),
} = {}) => {
  const normalizedProduct =
    normalizePaymentPlanProduct(
      product
    );
  const accessFrom =
    toDate(
      selection.accessFrom ||
        payment.accessFrom ||
        now,
      "Access from date"
    );
  const explicitAccessUntil =
    toDate(
      selection.accessUntil ||
        payment.accessUntil ||
        payment.expiryDate,
      "Access until date"
    );
  const noExpiry =
    selection.noExpiry ===
      true ||
    payment.noExpiry === true;
  const untilManualChange =
    selection.untilManualChange ===
      true ||
    payment.untilManualChange ===
      true;
  const validityDays =
    readPositiveInteger(
      selection.validityDays ??
        payment.validityDays ??
        normalizedProduct.defaultValidityDays,
      "Validity days"
    );

  if (
    noExpiry &&
    !normalizedProduct.allowNoExpiry
  ) {
    throw new Error(
      "Selected product does not allow no-expiry access."
    );
  }

  if (
    noExpiry &&
    untilManualChange
  ) {
    throw new Error(
      "Choose either no-expiry or until-manual-change access."
    );
  }

  if (
    explicitAccessUntil &&
    (
      noExpiry ||
      untilManualChange
    )
  ) {
    throw new Error(
      "Open-ended access cannot include an access-until date."
    );
  }

  if (
    explicitAccessUntil &&
    validityDays
  ) {
    throw new Error(
      "Choose either access-until or validity days."
    );
  }

  let accessUntil =
    explicitAccessUntil;

  if (
    !accessUntil &&
    validityDays
  ) {
    accessUntil = addDays(
      accessFrom,
      validityDays
    );
  }

  if (
    !accessUntil &&
    !noExpiry &&
    !untilManualChange
  ) {
    throw new Error(
      "Payment approval requires admin-selected validity."
    );
  }

  if (
    accessUntil &&
    accessUntil.getTime() <
      accessFrom.getTime()
  ) {
    throw new Error(
      "Access until date cannot be before access from date."
    );
  }

  const validityMode =
    noExpiry
      ? ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
      : untilManualChange
        ? ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
        : ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW;

  return {
    accessFrom,
    accessUntil,
    validityDays,
    validityMode,
    noExpiry,
    untilManualChange,
    adminSelected: true,
    fixed365DayValidity: false,
  };
};

export const buildDynamicPaymentApproval = ({
  payment = {},
  product = null,
  adminSelection = {},
  now = new Date(),
} = {}) => {
  const verified =
    payment.isVerified ===
      true ||
    payment.verificationStatus ===
      "verified";

  if (!verified) {
    throw new Error(
      "Payment must be verified before access approval."
    );
  }

  if (
    payment.status ===
      "approved" ||
    payment.accessEngineSynced ===
      true
  ) {
    throw new Error(
      "Payment is already approved and synced."
    );
  }

  const paymentSnapshot =
    payment.productSnapshot ||
    null;
  const sourceProduct =
    paymentSnapshot ||
    product;

  if (!sourceProduct) {
    throw new Error(
      "Payment product snapshot is required."
    );
  }

  const normalizedProduct =
    normalizePaymentPlanProduct(
      sourceProduct
    );

  if (
    product &&
    cleanString(
      product.productId ||
        product.id
    ) &&
    cleanString(
      product.productId ||
        product.id
    ) !==
      normalizedProduct.productId
  ) {
    throw new Error(
      "Payment product identity does not match catalog product."
    );
  }

  if (
    cleanString(
      payment.productId
    ) &&
    cleanString(
      payment.productId
    ) !==
      normalizedProduct.productId
  ) {
    throw new Error(
      "Payment product ID does not match its purchase snapshot."
    );
  }

  if (
    cleanString(
      payment.planCode ||
        payment.planType
    ) &&
    cleanString(
      payment.planCode ||
        payment.planType
    ).toUpperCase() !==
      normalizedProduct.planCode
  ) {
    throw new Error(
      "Payment plan code does not match its purchase snapshot."
    );
  }

  if (
    !sameAmount(
      payment.amount,
      normalizedProduct.priceINR
    )
  ) {
    throw new Error(
      "Payment amount does not match its purchase snapshot."
    );
  }

  const validity =
    resolvePaymentAdminValidity({
      product:
        normalizedProduct,
      payment,
      selection:
        adminSelection,
      now,
    });
  const purchaseTermsSnapshot =
    buildPlanPurchaseTermsSnapshot({
      product:
        normalizedProduct,
      grant: validity,
      capturedAt: now,
    });

  const grant = {
    email:
      normalizeEmail(
        payment.studentEmail ||
          payment.email
      ),
    uid:
      cleanString(
        payment.userId ||
          payment.uid
      ),
    learnerName:
      cleanString(
        payment.studentName ||
          payment.name
      ),
    name:
      cleanString(
        payment.studentName ||
          payment.name
      ),
    phone:
      cleanString(
        payment.studentMobile ||
          payment.phone
      ),
    course:
      payment.course ||
      ACCESS_COURSE.CTET_TET,
    scopeType:
      ACCESS_SCOPE_TYPES.PLAN,
    planType:
      normalizedProduct.planCode,
    planCode:
      normalizedProduct.planCode,
    accessRank:
      normalizedProduct.accessRank,
    productId:
      normalizedProduct.productId,
    purchaseTermsSnapshot,
    termsSnapshot:
      purchaseTermsSnapshot,
    priceVersion:
      normalizedProduct.priceVersion,
    validityMode:
      validity.validityMode,
    noExpiry:
      validity.noExpiry,
    untilManualChange:
      validity.untilManualChange,
    accessFrom:
      validity.accessFrom,
    accessUntil:
      validity.accessUntil,
    status:
      ACCESS_STATUS.ACTIVE,
    source:
      ACCESS_SOURCE.PAYMENT,
    notes:
      "Payment approved" +
      (
        payment.orderId
          ? `: ${payment.orderId}`
          : ""
      ),
    paymentId:
      payment.id ||
      payment.paymentId ||
      null,
    paymentRequestId:
      payment.id ||
      payment.paymentRequestId ||
      null,
    orderId:
      cleanString(
        payment.orderId
      ),
    amount:
      normalizedProduct.priceINR,
  };

  if (
    !grant.email &&
    !grant.uid
  ) {
    throw new Error(
      "Payment approval requires learner email or UID."
    );
  }

  const paymentUpdate = {
    status: "approved",
    matchStatus:
      "admin_approved",
    approvedPlanType:
      normalizedProduct.planCode,
    approvedPlanCode:
      normalizedProduct.planCode,
    approvedProductId:
      normalizedProduct.productId,
    approvedAccessRank:
      normalizedProduct.accessRank,
    accessEngineSynced: true,
    accessFrom:
      validity.accessFrom,
    accessUntil:
      validity.accessUntil,
    validityMode:
      validity.validityMode,
    noExpiry:
      validity.noExpiry,
    untilManualChange:
      validity.untilManualChange,
    purchaseTermsSnapshot,
    priceVersion:
      normalizedProduct.priceVersion,
    fixed365DayValidity: false,
  };

  const userProjection = {
    isPremium:
      normalizedProduct.planCode !==
      "FREE",
    subscriptionType:
      normalizedProduct.planCode,
    premiumStatus:
      "ACTIVE",
    accessRank:
      normalizedProduct.accessRank,
    activeProductId:
      normalizedProduct.productId,
    purchaseDate:
      validity.accessFrom,
    expiryDate:
      validity.accessUntil,
    validityMode:
      validity.validityMode,
    noExpiry:
      validity.noExpiry,
    untilManualChange:
      validity.untilManualChange,
  };

  return {
    product:
      normalizedProduct,
    validity,
    purchaseTermsSnapshot,
    grant,
    paymentUpdate,
    userProjection,
  };
};
