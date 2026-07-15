import {
  ACCESS_COURSE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "./accessConstants";

import {
  ACCESS_GRANT_STATUS_VALUES,
  normalizeAndValidateGrantInput,
  normalizeAndValidateGrantTarget,
} from "./accessGrantContract";

import {
  ACCESS_PLAN_VALIDITY_MODES,
  buildPlanPurchaseTermsSnapshot,
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

const toDateOnlyString = (
  value,
  label = "Date"
) => {
  const date = toDate(
    value,
    label
  );

  return date
    ? date
        .toISOString()
        .slice(0, 10)
    : null;
};

const readPositiveInteger = (
  ...values
) => {
  for (const value of values) {
    const parsed = Number(value);

    if (
      Number.isInteger(parsed) &&
      parsed > 0
    ) {
      return parsed;
    }
  }

  return 0;
};

const firstDefined = (
  ...values
) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      !(
        typeof value ===
          "string" &&
        value.trim() === ""
      )
    ) {
      return value;
    }
  }

  return null;
};

const firstArray = (
  ...values
) => {
  for (const value of values) {
    if (
      Array.isArray(value) &&
      value.length
    ) {
      return value;
    }
  }

  return [];
};

export const addGrantValidityDays = ({
  accessFrom = null,
  validityDays = 0,
} = {}) => {
  const days =
    readPositiveInteger(
      validityDays
    );

  if (!days) {
    return null;
  }

  const start =
    toDate(
      accessFrom ||
        new Date(),
      "Access from date"
    );
  const next = new Date(
    start.getTime()
  );

  next.setUTCDate(
    next.getUTCDate() +
      days
  );

  return next
    .toISOString()
    .slice(0, 10);
};

export const buildRuntimeGrantRecord = (
  data = {},
  {
    allowedStatuses =
      ACCESS_GRANT_STATUS_VALUES,
    allowEmailPrincipal = true,
  } = {}
) => {
  const grant =
    normalizeAndValidateGrantInput(
      {
        ...data,
        email:
          normalizeEmail(
            data.email
          ),
      },
      {
        allowedStatuses,
        allowEmailPrincipal,
      }
    );

  return {
    email: grant.email,
    normalizedEmail:
      grant.normalizedEmail,
    uid: grant.uid,
    planType:
      grant.planType,
    planCode:
      grant.planCode,
    accessRank:
      grant.accessRank,
    productId:
      grant.productId,
    purchaseTermsSnapshot:
      grant.purchaseTermsSnapshot,
    termsSnapshot:
      grant.purchaseTermsSnapshot,
    validityMode:
      grant.validityMode,
    noExpiry:
      grant.noExpiry,
    untilManualChange:
      grant.untilManualChange,
    scopeType:
      grant.scopeType,
    status:
      grant.status,
    source:
      grant.source,
    course:
      grant.course,
    module:
      grant.module,
    itemType:
      grant.itemType,
    itemId:
      grant.itemId,
    itemTitle:
      grant.itemTitle,
    itemIds:
      grant.itemIds,
    bundleId:
      grant.bundleId,
    accessFrom:
      grant.accessFrom,
    accessUntil:
      grant.accessUntil,
    targetKey:
      grant.targetKey,
    grantKey:
      grant.grantKey,
    principalRef:
      grant.principalRef,
  };
};

export const buildRuntimeEntitlementRecord = (
  accessRecord = {},
  metadata = {}
) => {
  const uid = cleanString(
    accessRecord.uid ||
      metadata.uid
  );
  const normalizedEmail =
    normalizeEmail(
      accessRecord.normalizedEmail ||
        accessRecord.email ||
        metadata.email
    );

  if (!uid) {
    throw new Error(
      "Student entitlement requires uid."
    );
  }

  const target =
    normalizeAndValidateGrantTarget(
      {
        ...accessRecord,
        status:
          accessRecord.status ||
          ACCESS_STATUS.ACTIVE,
        source:
          accessRecord.source ||
          ACCESS_SOURCE.ADMIN_MANUAL,
      },
      {
        allowedStatuses:
          ACCESS_GRANT_STATUS_VALUES,
      }
    );

  return {
    uid,
    email:
      normalizedEmail ||
      null,
    normalizedEmail,
    accessId:
      accessRecord.id ||
      metadata.accessId ||
      null,
    planType:
      target.planType,
    planCode:
      target.planCode,
    accessRank:
      target.accessRank,
    productId:
      target.productId,
    purchaseTermsSnapshot:
      target.purchaseTermsSnapshot,
    termsSnapshot:
      target.purchaseTermsSnapshot,
    priceVersion:
      target.purchaseTermsSnapshot
        ?.priceVersion ??
      accessRecord.priceVersion ??
      null,
    validityMode:
      target.validityMode,
    noExpiry:
      target.noExpiry,
    untilManualChange:
      target.untilManualChange,
    scopeType:
      target.scopeType,
    module:
      target.module,
    itemType:
      target.itemType,
    itemId:
      target.itemId,
    itemIds:
      target.itemIds,
    bundleId:
      target.bundleId,
    course:
      target.course,
    status:
      target.status,
    source:
      accessRecord.source ||
      ACCESS_SOURCE.ADMIN_MANUAL,
    accessFrom:
      target.accessFrom,
    accessUntil:
      target.accessUntil,
    grantKey:
      accessRecord.grantKey ||
      null,
    grantFamilyKey:
      accessRecord.grantFamilyKey ||
      null,
    grantRevision:
      Number(
        accessRecord.grantRevision ||
          0
      ),
  };
};

export const resolveAccessKeyGrantTerms = ({
  keyRecord = {},
  productRecord = null,
  now = new Date(),
} = {}) => {
  const hasProduct =
    Boolean(
      productRecord?.id
    );
  const product =
    hasProduct
      ? productRecord
      : {};
  const productId =
    cleanString(
      keyRecord.productId ||
        product.productId ||
        product.id
    ) || null;

  const scopeType =
    firstDefined(
      product.scopeType,
      keyRecord.scopeType,
      ACCESS_SCOPE_TYPES.PLAN
    );
  const planCode =
    firstDefined(
      product.planCode,
      product.planType,
      keyRecord.planCode,
      keyRecord.planType,
      ACCESS_PLAN_TYPES.FREE
    );
  const accessRank =
    firstDefined(
      product.accessRank,
      keyRecord.accessRank
    );

  const rawMode =
    cleanString(
      firstDefined(
        keyRecord.validityMode,
        product.validityMode
      )
    ).toUpperCase();
  const noExpiry =
    keyRecord.noExpiry ===
      true ||
    rawMode ===
      ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY;
  const untilManualChange =
    keyRecord.untilManualChange ===
      true ||
    rawMode ===
      ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE;

  const accessFrom =
    toDateOnlyString(
      firstDefined(
        keyRecord.accessFrom,
        product.accessFrom,
        now
      ),
      "Access from date"
    );
  let accessUntil =
    toDateOnlyString(
      firstDefined(
        keyRecord.accessUntil,
        product.accessUntil
      ),
      "Access until date"
    );

  const validityDays =
    readPositiveInteger(
      keyRecord.validityDays,
      product.defaultValidityDays,
      product.validityDays
    );

  if (
    !accessUntil &&
    !noExpiry &&
    !untilManualChange &&
    validityDays
  ) {
    accessUntil =
      addGrantValidityDays({
        accessFrom,
        validityDays,
      });
  }

  const validityMode =
    noExpiry
      ? ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
      : untilManualChange
        ? ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
        : accessUntil
          ? ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW
          : ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED;

  let purchaseTermsSnapshot =
    keyRecord.purchaseTermsSnapshot ||
    keyRecord.termsSnapshot ||
    null;

  if (
    !purchaseTermsSnapshot &&
    hasProduct &&
    cleanString(
      scopeType
    ).toLowerCase() ===
      ACCESS_SCOPE_TYPES.PLAN
  ) {
    purchaseTermsSnapshot =
      buildPlanPurchaseTermsSnapshot({
        product: {
          ...product,
          productId:
            product.productId ||
            product.id,
        },
        grant: {
          accessFrom,
          accessUntil,
          noExpiry,
          untilManualChange,
        },
        capturedAt: now,
      });
  }

  const target =
    normalizeAndValidateGrantTarget(
      {
        course:
          firstDefined(
            product.course,
            keyRecord.course,
            ACCESS_COURSE.CTET_TET
          ),
        planCode,
        planType:
          planCode,
        accessRank,
        productId,
        purchaseTermsSnapshot,
        scopeType,
        module:
          firstDefined(
            product.module,
            keyRecord.module
          ),
        itemType:
          firstDefined(
            product.itemType,
            keyRecord.itemType
          ),
        itemId:
          firstDefined(
            product.itemId,
            keyRecord.itemId
          ),
        itemTitle:
          firstDefined(
            product.itemTitle,
            keyRecord.itemTitle,
            ""
          ),
        itemIds:
          firstArray(
            product.itemIds,
            keyRecord.itemIds
          ),
        bundleId:
          firstDefined(
            product.bundleId,
            keyRecord.bundleId
          ),
        status:
          ACCESS_STATUS.ACTIVE,
        source:
          ACCESS_SOURCE.REDEEM_KEY,
        accessFrom,
        accessUntil,
        validityMode,
        noExpiry,
        untilManualChange,
      },
      {
        allowedStatuses:
          ACCESS_GRANT_STATUS_VALUES,
      }
    );

  return {
    ...target,
    validityDays,
    campaignId:
      firstDefined(
        keyRecord.campaignId,
        product.campaignId
      ),
    campaignName:
      cleanString(
        firstDefined(
          keyRecord.campaignName,
          product.campaignName,
          ""
        )
      ),
    campaignSource:
      cleanString(
        firstDefined(
          keyRecord.campaignSource,
          product.campaignSource,
          ""
        )
      ),
  };
};
