"use strict";

const RAW_CONTRACT = require(
  "./entitlementDecisionContract.json",
);

const CODES = Object.freeze({
  INVALID_REQUEST: "ENTITLEMENT_INVALID_REQUEST",
  EVIDENCE_READ_FAILED: "ENTITLEMENT_EVIDENCE_READ_FAILED",
  EVIDENCE_INVALID: "ENTITLEMENT_EVIDENCE_INVALID",
  NOT_FOUND: "ENTITLEMENT_NOT_FOUND",
  LOCKED: "ENTITLEMENT_LOCKED",
  EXPIRED: "ENTITLEMENT_EXPIRED",
  ALLOWED: "ENTITLEMENT_ALLOWED",
});

function deepFreeze(value) {
  if (
    !value
    || typeof value !== "object"
    || Object.isFrozen(value)
  ) {
    return value;
  }

  Object.freeze(value);

  for (const item of Object.values(value)) {
    deepFreeze(item);
  }

  return value;
}

const CONTRACT = deepFreeze(
  JSON.parse(JSON.stringify(RAW_CONTRACT)),
);

const ACTION_SET = new Set(CONTRACT.actions);
const TYPE_SET = new Set(
  Object.keys(CONTRACT.typeActionMap),
);
const PLAN_SET = new Set(CONTRACT.canonicalPlans);
const SCOPE_SET = new Set(CONTRACT.scopeValues);
const STATUS_SET = new Set(CONTRACT.statusValues);
const LOCKED_STATUS_SET = new Set(
  CONTRACT.lockedStatusValues,
);

const FIRESTORE_MIN_SECONDS = -62135596800;
const FIRESTORE_MAX_SECONDS = 253402300799;
const FIRESTORE_MIN_MILLISECONDS =
  FIRESTORE_MIN_SECONDS * 1000;
const FIRESTORE_MAX_MILLISECONDS =
  (FIRESTORE_MAX_SECONDS * 1000) + 999;

const DATE_ONLY_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/;
const RFC3339_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;

function readOwnValue(object, key) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(
      object,
      key,
    );

    if (!descriptor) {
      return {
        ok: true,
        present: false,
        value: undefined,
      };
    }

    if (!Object.prototype.hasOwnProperty.call(
      descriptor,
      "value",
    )) {
      return {
        ok: false,
        present: true,
        value: undefined,
      };
    }

    return {
      ok: true,
      present: true,
      value: descriptor.value,
    };
  } catch (_) {
    return {
      ok: false,
      present: false,
      value: undefined,
    };
  }
}

function strictString(
  value,
  maxLength,
  options = {},
) {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.trim();

  if (
    !cleaned
    || cleaned.length > maxLength
    || /[\u0000-\u001f\u007f]/.test(cleaned)
  ) {
    return "";
  }

  if (options.lowercase === true) {
    return cleaned.toLowerCase();
  }

  if (options.uppercase === true) {
    return cleaned.toUpperCase();
  }

  return cleaned;
}

function strictOptionalString(
  value,
  maxLength,
  options = {},
) {
  if (
    value === null
    || value === undefined
    || value === ""
  ) {
    return "";
  }

  return strictString(value, maxLength, options);
}

function strictBooleanField(object, key) {
  const field = readOwnValue(object, key);

  if (!field.ok) {
    return {
      ok: false,
      value: false,
    };
  }

  if (!field.present) {
    return {
      ok: true,
      value: false,
    };
  }

  if (typeof field.value !== "boolean") {
    return {
      ok: false,
      value: false,
    };
  }

  return {
    ok: true,
    value: field.value,
  };
}

function strictIntegerField(
  object,
  key,
  maximum,
) {
  const field = readOwnValue(object, key);

  if (!field.ok) {
    return {
      ok: false,
      present: false,
      value: null,
    };
  }

  if (
    !field.present
    || field.value === null
    || field.value === undefined
    || field.value === ""
  ) {
    return {
      ok: true,
      present: false,
      value: null,
    };
  }

  if (
    !Number.isInteger(field.value)
    || field.value < 0
    || field.value > maximum
  ) {
    return {
      ok: false,
      present: true,
      value: null,
    };
  }

  return {
    ok: true,
    present: true,
    value: field.value,
  };
}

function validIdentifier(value, maximum) {
  return Boolean(
    value
    && value.length <= maximum
    && !/[\/\\\u0000-\u001f\u007f]/.test(value)
    && ![".", ".."].includes(value),
  );
}

function cleanEntitlementSegment(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "all";
}


function isLeapYear(year) {
  return (
    year % 4 === 0
    && (
      year % 100 !== 0
      || year % 400 === 0
    )
  );
}

function daysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }

  return 31;
}

function validCalendarParts(
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
) {
  return Boolean(
    Number.isInteger(year)
    && year >= 1
    && year <= 9999
    && Number.isInteger(month)
    && month >= 1
    && month <= 12
    && Number.isInteger(day)
    && day >= 1
    && day <= daysInMonth(year, month)
    && Number.isInteger(hour)
    && hour >= 0
    && hour <= 23
    && Number.isInteger(minute)
    && minute >= 0
    && minute <= 59
    && Number.isInteger(second)
    && second >= 0
    && second <= 59
  );
}

function parseCanonicalTimestampString(raw) {
  const dateOnly = DATE_ONLY_PATTERN.exec(raw);

  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);

    if (!validCalendarParts(year, month, day)) {
      return null;
    }

    return Date.parse(`${raw}T00:00:00.000Z`);
  }

  const dateTime = RFC3339_PATTERN.exec(raw);

  if (!dateTime) {
    return null;
  }

  const year = Number(dateTime[1]);
  const month = Number(dateTime[2]);
  const day = Number(dateTime[3]);
  const hour = Number(dateTime[4]);
  const minute = Number(dateTime[5]);
  const second = Number(dateTime[6]);
  const zone = dateTime[8];

  if (!validCalendarParts(
    year,
    month,
    day,
    hour,
    minute,
    second,
  )) {
    return null;
  }

  if (zone !== "Z") {
    const zoneHour = Number(zone.slice(1, 3));
    const zoneMinute = Number(zone.slice(4, 6));

    if (
      !Number.isInteger(zoneHour)
      || !Number.isInteger(zoneMinute)
      || zoneHour > 23
      || zoneMinute > 59
    ) {
      return null;
    }
  }

  return Date.parse(raw);
}

function buildExpectedProjectionId(record) {
  if (record.scopeType === "module") {
    return (
      "module_"
      + cleanEntitlementSegment(record.module)
    );
  }

  if (record.scopeType === "item") {
    return [
      "item",
      cleanEntitlementSegment(record.module),
      cleanEntitlementSegment(record.itemType),
      cleanEntitlementSegment(record.itemId),
    ].join("_");
  }

  if (record.scopeType === "bundle") {
    return (
      "bundle_"
      + cleanEntitlementSegment(record.bundleId)
    );
  }

  return (
    "plan_"
    + cleanEntitlementSegment(record.planCode)
  );
}

function timestampResult(milliseconds) {
  if (
    !Number.isFinite(milliseconds)
    || !Number.isSafeInteger(milliseconds)
    || milliseconds < FIRESTORE_MIN_MILLISECONDS
    || milliseconds > FIRESTORE_MAX_MILLISECONDS
  ) {
    return {
      ok: false,
      present: true,
      iso: "",
      milliseconds: null,
    };
  }

  try {
    const iso = new Date(milliseconds).toISOString();

    return {
      ok: true,
      present: true,
      iso,
      milliseconds,
    };
  } catch (_) {
    return {
      ok: false,
      present: true,
      iso: "",
      milliseconds: null,
    };
  }
}

function normalizeTimestamp(value) {
  if (
    value === null
    || value === undefined
    || value === ""
  ) {
    return {
      ok: true,
      present: false,
      iso: "",
      milliseconds: null,
    };
  }

  if (typeof value === "string") {
    const raw = value.trim();

    if (
      !raw
      || raw.length > CONTRACT.maxLengths.timestamp
      || /[\u0000-\u001f\u007f]/.test(raw)
    ) {
      return {
        ok: false,
        present: true,
        iso: "",
        milliseconds: null,
      };
    }

    const milliseconds =
      parseCanonicalTimestampString(raw);

    if (milliseconds === null) {
      return {
        ok: false,
        present: true,
        iso: "",
        milliseconds: null,
      };
    }

    return timestampResult(milliseconds);
  }

  if (typeof value === "number") {
    return timestampResult(value);
  }

  if (value instanceof Date) {
    try {
      return timestampResult(
        Date.prototype.getTime.call(value),
      );
    } catch (_) {
      return {
        ok: false,
        present: true,
        iso: "",
        milliseconds: null,
      };
    }
  }

  if (
    typeof value === "object"
    && !Array.isArray(value)
  ) {
    const secondsField = readOwnValue(
      value,
      "seconds",
    );
    const nanosecondsField = readOwnValue(
      value,
      "nanoseconds",
    );

    if (
      !secondsField.ok
      || !nanosecondsField.ok
      || !secondsField.present
      || !nanosecondsField.present
      || !Number.isSafeInteger(secondsField.value)
      || secondsField.value < FIRESTORE_MIN_SECONDS
      || secondsField.value > FIRESTORE_MAX_SECONDS
      || !Number.isSafeInteger(nanosecondsField.value)
      || nanosecondsField.value < 0
      || nanosecondsField.value > 999999999
    ) {
      return {
        ok: false,
        present: true,
        iso: "",
        milliseconds: null,
      };
    }

    const milliseconds =
      (secondsField.value * 1000)
      + Math.floor(
        nanosecondsField.value / 1000000,
      );

    return timestampResult(milliseconds);
  }

  return {
    ok: false,
    present: true,
    iso: "",
    milliseconds: null,
  };
}

function normalizeStringArray(
  value,
  maximumItems,
  maximumLength,
) {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      value: null,
    };
  }

  if (value.length > maximumItems) {
    return {
      ok: false,
      value: null,
    };
  }

  const output = [];
  const seen = new Set();

  for (let index = 0; index < value.length; index += 1) {
    const item = readOwnValue(value, String(index));

    if (!item.ok || !item.present) {
      return {
        ok: false,
        value: null,
      };
    }

    const normalized = strictString(
      item.value,
      maximumLength,
    );

    if (!normalized || seen.has(normalized)) {
      return {
        ok: false,
        value: null,
      };
    }

    seen.add(normalized);
    output.push(normalized);
  }

  return {
    ok: true,
    value: Object.freeze(output),
  };
}

function decision(
  state,
  code,
  fields = {},
) {
  return Object.freeze({
    state,
    allowed: state === "allowed",
    code,
    principalUid:
      typeof fields.principalUid === "string"
        ? fields.principalUid
        : "",
    resourceId:
      typeof fields.resourceId === "string"
        ? fields.resourceId
        : "",
    requiredPlan:
      typeof fields.requiredPlan === "string"
        ? fields.requiredPlan
        : "",
    matchedGrantId:
      typeof fields.matchedGrantId === "string"
      && fields.matchedGrantId
        ? fields.matchedGrantId
        : null,
    matchedScope:
      typeof fields.matchedScope === "string"
      && fields.matchedScope
        ? fields.matchedScope
        : null,
    expiresAt:
      typeof fields.expiresAt === "string"
      && fields.expiresAt
        ? fields.expiresAt
        : null,
  });
}

function normalizeRequest(request) {
  if (
    !request
    || typeof request !== "object"
    || Array.isArray(request)
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const principalField = readOwnValue(
    request,
    "principal",
  );
  const actionField = readOwnValue(request, "action");
  const resourceField = readOwnValue(
    request,
    "resource",
  );
  const sessionField = readOwnValue(
    request,
    "session",
  );
  const signalField = readOwnValue(request, "signal");

  if (
    !principalField.ok
    || !actionField.ok
    || !resourceField.ok
    || !sessionField.ok
    || !signalField.ok
    || !principalField.present
    || !actionField.present
    || !resourceField.present
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const principal = principalField.value;
  const resource = resourceField.value;

  if (
    !principal
    || typeof principal !== "object"
    || Array.isArray(principal)
    || !resource
    || typeof resource !== "object"
    || Array.isArray(resource)
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const principalUidField = readOwnValue(
    principal,
    "uid",
  );

  if (!principalUidField.ok || !principalUidField.present) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const principalUid = strictString(
    principalUidField.value,
    CONTRACT.maxLengths.uid,
  );

  if (!principalUid) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const idField = readOwnValue(resource, "id");
  const resourceIdField = readOwnValue(
    resource,
    "resourceId",
  );
  const typeField = readOwnValue(resource, "type");
  const sectionField = readOwnValue(
    resource,
    "section",
  );
  const requiredPlanField = readOwnValue(
    resource,
    "requiredPlan",
  );

  if (
    !idField.ok
    || !resourceIdField.ok
    || !typeField.ok
    || !sectionField.ok
    || !requiredPlanField.ok
    || !idField.present
    || !resourceIdField.present
    || !typeField.present
    || !sectionField.present
    || !requiredPlanField.present
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const id = strictString(
    idField.value,
    CONTRACT.maxLengths.resourceId,
  );
  const resourceId = strictString(
    resourceIdField.value,
    CONTRACT.maxLengths.resourceId,
  );
  const type = strictString(
    typeField.value,
    64,
    {
      lowercase: true,
    },
  );
  const section = strictString(
    sectionField.value,
    128,
    {
      lowercase: true,
    },
  );
  const requiredPlan = strictString(
    requiredPlanField.value,
    CONTRACT.maxLengths.planCode,
    {
      uppercase: true,
    },
  );
  const action = strictString(
    actionField.value,
    32,
    {
      uppercase: true,
    },
  );

  if (
    !id
    || !resourceId
    || id !== resourceId
    || !validIdentifier(
      resourceId,
      CONTRACT.maxLengths.resourceId,
    )
    || !TYPE_SET.has(type)
    || !section
    || !PLAN_SET.has(requiredPlan)
    || !ACTION_SET.has(action)
    || CONTRACT.typeActionMap[type] !== action
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  if (
    sessionField.present
    && sessionField.value !== null
    && sessionField.value !== undefined
  ) {
    const session = sessionField.value;

    if (
      !session
      || typeof session !== "object"
      || Array.isArray(session)
    ) {
      return {
        ok: false,
        code: CODES.INVALID_REQUEST,
      };
    }

    const sessionUidField = readOwnValue(session, "uid");

    if (!sessionUidField.ok || !sessionUidField.present) {
      return {
        ok: false,
        code: CODES.INVALID_REQUEST,
      };
    }

    const sessionUid = strictString(
      sessionUidField.value,
      CONTRACT.maxLengths.uid,
    );

    if (!sessionUid || sessionUid !== principalUid) {
      return {
        ok: false,
        code: CODES.INVALID_REQUEST,
      };
    }
  }

  return {
    ok: true,
    principalUid,
    action,
    resource: Object.freeze({
      id,
      resourceId,
      type,
      section,
      requiredPlan,
      module: CONTRACT.resourceBindings[type].module,
      itemType: CONTRACT.resourceBindings[type].itemType,
    }),
    signal: signalField.present
      ? signalField.value
      : null,
  };
}

function normalizePlan(record) {
  const planTypeField = readOwnValue(record, "planType");
  const planCodeField = readOwnValue(record, "planCode");
  const rankField = strictIntegerField(
    record,
    "accessRank",
    CONTRACT.limits.maxAccessRank,
  );

  if (
    !planTypeField.ok
    || !planCodeField.ok
    || !rankField.ok
  ) {
    return {
      ok: false,
    };
  }

  const planType = planTypeField.present
    ? strictOptionalString(
      planTypeField.value,
      CONTRACT.maxLengths.planCode,
      {
        uppercase: true,
      },
    )
    : "";
  const planCode = planCodeField.present
    ? strictOptionalString(
      planCodeField.value,
      CONTRACT.maxLengths.planCode,
      {
        uppercase: true,
      },
    )
    : "";

  if (
    (planTypeField.present && !planType)
    || (planCodeField.present && !planCode)
    || (!planType && !planCode)
    || (planType && planCode && planType !== planCode)
  ) {
    return {
      ok: false,
    };
  }

  const normalizedCode = planCode || planType;

  if (!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(normalizedCode)) {
    return {
      ok: false,
    };
  }

  if (PLAN_SET.has(normalizedCode)) {
    const expectedRank = CONTRACT.seedPlanRanks[normalizedCode];

    if (
      rankField.present
      && rankField.value !== expectedRank
    ) {
      return {
        ok: false,
      };
    }

    return {
      ok: true,
      planCode: normalizedCode,
      accessRank: expectedRank,
      custom: false,
    };
  }

  if (!rankField.present) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    planCode: normalizedCode,
    accessRank: rankField.value,
    custom: true,
  };
}

function normalizeEvidenceRecord(
  record,
  principalUid,
) {
  if (
    !record
    || typeof record !== "object"
    || Array.isArray(record)
  ) {
    return {
      ok: false,
    };
  }

  try {
    const projectionIdField = readOwnValue(record, "id");
    const uidField = readOwnValue(record, "uid");
    const accessIdField = readOwnValue(record, "accessId");
    const scopeField = readOwnValue(record, "scopeType");
    const courseField = readOwnValue(record, "course");
    const statusField = readOwnValue(record, "status");
    const moduleField = readOwnValue(record, "module");
    const itemTypeField = readOwnValue(record, "itemType");
    const itemIdField = readOwnValue(record, "itemId");
    const itemIdsField = readOwnValue(record, "itemIds");
    const bundleIdField = readOwnValue(record, "bundleId");
    const productIdField = readOwnValue(record, "productId");
    const accessFromField = readOwnValue(record, "accessFrom");
    const accessUntilField = readOwnValue(record, "accessUntil");

    if (
      !projectionIdField.ok
      || !uidField.ok
      || !accessIdField.ok
      || !scopeField.ok
      || !courseField.ok
      || !statusField.ok
      || !moduleField.ok
      || !itemTypeField.ok
      || !itemIdField.ok
      || !itemIdsField.ok
      || !bundleIdField.ok
      || !productIdField.ok
      || !accessFromField.ok
      || !accessUntilField.ok
      || !projectionIdField.present
      || !uidField.present
      || !accessIdField.present
      || !scopeField.present
      || !courseField.present
      || !statusField.present
    ) {
      return {
        ok: false,
      };
    }

    const projectionId = strictString(
      projectionIdField.value,
      CONTRACT.maxLengths.projectionId,
    );
    const uid = strictString(
      uidField.value,
      CONTRACT.maxLengths.uid,
    );
    const accessId = strictString(
      accessIdField.value,
      CONTRACT.maxLengths.grantId,
    );
    const scopeType = strictString(
      scopeField.value,
      32,
      {
        lowercase: true,
      },
    );
    const course = strictString(
      courseField.value,
      CONTRACT.maxLengths.course,
      {
        uppercase: true,
      },
    );
    const status = strictString(
      statusField.value,
      CONTRACT.maxLengths.status,
      {
        lowercase: true,
      },
    );

    if (
      !validIdentifier(
        projectionId,
        CONTRACT.maxLengths.projectionId,
      )
      || !validIdentifier(
        accessId,
        CONTRACT.maxLengths.grantId,
      )
      || uid !== principalUid
      || !SCOPE_SET.has(scopeType)
      || course !== CONTRACT.course
      || !STATUS_SET.has(status)
    ) {
      return {
        ok: false,
      };
    }

    const plan = normalizePlan(record);

    if (!plan.ok) {
      return {
        ok: false,
      };
    }

    const noExpiryResult = strictBooleanField(
      record,
      "noExpiry",
    );
    const manualResult = strictBooleanField(
      record,
      "untilManualChange",
    );

    if (
      !noExpiryResult.ok
      || !manualResult.ok
      || (
        noExpiryResult.value
        && manualResult.value
      )
    ) {
      return {
        ok: false,
      };
    }

    const accessFrom = normalizeTimestamp(
      accessFromField.present
        ? accessFromField.value
        : null,
    );
    const accessUntil = normalizeTimestamp(
      accessUntilField.present
        ? accessUntilField.value
        : null,
    );

    if (
      !accessFrom.ok
      || !accessUntil.ok
      || (
        (noExpiryResult.value || manualResult.value)
        && accessUntil.present
      )
      || (
        accessFrom.present
        && accessUntil.present
        && accessFrom.milliseconds > accessUntil.milliseconds
      )
    ) {
      return {
        ok: false,
      };
    }

    const revision = strictIntegerField(
      record,
      "grantRevision",
      CONTRACT.limits.maxGrantRevision,
    );

    if (!revision.ok) {
      return {
        ok: false,
      };
    }

    const module = moduleField.present
      ? strictOptionalString(
        moduleField.value,
        CONTRACT.maxLengths.module,
      )
      : "";
    const itemType = itemTypeField.present
      ? strictOptionalString(
        itemTypeField.value,
        CONTRACT.maxLengths.itemType,
      )
      : "";
    const itemId = itemIdField.present
      ? strictOptionalString(
        itemIdField.value,
        CONTRACT.maxLengths.resourceId,
      )
      : "";
    const bundleId = bundleIdField.present
      ? strictOptionalString(
        bundleIdField.value,
        CONTRACT.maxLengths.bundleId,
      )
      : "";
    const productId = productIdField.present
      ? strictOptionalString(
        productIdField.value,
        CONTRACT.maxLengths.productId,
      )
      : "";

    if (
      (moduleField.present && moduleField.value != null && moduleField.value !== "" && !module)
      || (itemTypeField.present && itemTypeField.value != null && itemTypeField.value !== "" && !itemType)
      || (itemIdField.present && itemIdField.value != null && itemIdField.value !== "" && !itemId)
      || (bundleIdField.present && bundleIdField.value != null && bundleIdField.value !== "" && !bundleId)
      || (productIdField.present && productIdField.value != null && productIdField.value !== "" && !productId)
    ) {
      return {
        ok: false,
      };
    }

    let itemIds = Object.freeze([]);
    let nonBundleItemIdsAreEmpty = true;

    if (itemIdsField.present) {
      const normalizedItems = normalizeStringArray(
        itemIdsField.value,
        CONTRACT.limits.maxBundleItemIds,
        CONTRACT.maxLengths.resourceId,
      );

      if (!normalizedItems.ok) {
        return {
          ok: false,
        };
      }

      itemIds = normalizedItems.value;
      nonBundleItemIdsAreEmpty = itemIds.length === 0;
    }

    if (scopeType === "plan") {
      if (
        module
        || itemType
        || itemId
        || bundleId
        || !nonBundleItemIdsAreEmpty
      ) {
        return {
          ok: false,
        };
      }
    } else if (scopeType === "module") {
      if (
        !module
        || itemType
        || itemId
        || bundleId
        || !nonBundleItemIdsAreEmpty
      ) {
        return {
          ok: false,
        };
      }
    } else if (scopeType === "item") {
      if (
        !module
        || !itemType
        || !itemId
        || bundleId
        || !nonBundleItemIdsAreEmpty
      ) {
        return {
          ok: false,
        };
      }
    } else {
      if (!bundleId || itemId || itemType) {
        return {
          ok: false,
        };
      }

      if (!itemIdsField.present) {
        return {
          ok: false,
        };
      }

      if (!itemIds.length) {
        return {
          ok: false,
        };
      }
    }

    const expectedProjectionId =
      buildExpectedProjectionId({
        planCode: plan.planCode,
        scopeType,
        module,
        itemType,
        itemId,
        bundleId,
      });

    if (
      projectionId !== expectedProjectionId
      || !validIdentifier(
        expectedProjectionId,
        CONTRACT.maxLengths.projectionId,
      )
    ) {
      return {
        ok: false,
      };
    }

    return {
      ok: true,
      value: Object.freeze({
        projectionId,
        uid,
        accessId,
        planCode: plan.planCode,
        accessRank: plan.accessRank,
        customPlan: plan.custom,
        productId,
        scopeType,
        module,
        itemType,
        itemId,
        itemIds,
        bundleId,
        course,
        status,
        accessFrom: accessFrom.iso,
        accessFromMilliseconds:
          accessFrom.milliseconds,
        accessUntil: accessUntil.iso,
        accessUntilMilliseconds:
          accessUntil.milliseconds,
        noExpiry: noExpiryResult.value,
        untilManualChange: manualResult.value,
        grantRevision: revision.present
          ? revision.value
          : 0,
      }),
    };
  } catch (_) {
    return {
      ok: false,
    };
  }
}

function normalizeEvidenceList(
  rawEvidence,
  principalUid,
) {
  try {
    if (
      !Array.isArray(rawEvidence)
      || rawEvidence.length > CONTRACT.limits.maxEvidenceRows
    ) {
      return {
        ok: false,
      };
    }

    const normalized = [];
    const projectionIds = new Set();
    const accessIds = new Set();
    let planProjectionCount = 0;

    for (
      let index = 0;
      index < rawEvidence.length;
      index += 1
    ) {
      const field = readOwnValue(
        rawEvidence,
        String(index),
      );

      if (!field.ok || !field.present) {
        return {
          ok: false,
        };
      }

      const record = normalizeEvidenceRecord(
        field.value,
        principalUid,
      );

      if (!record.ok) {
        return {
          ok: false,
        };
      }

      if (
        projectionIds.has(record.value.projectionId)
        || accessIds.has(record.value.accessId)
      ) {
        return {
          ok: false,
        };
      }

      if (record.value.scopeType === "plan") {
        planProjectionCount += 1;

        if (planProjectionCount > 1) {
          return {
            ok: false,
          };
        }
      }

      projectionIds.add(record.value.projectionId);
      accessIds.add(record.value.accessId);
      normalized.push(record.value);
    }

    return {
      ok: true,
      value: Object.freeze(normalized),
    };
  } catch (_) {
    return {
      ok: false,
    };
  }
}

function classifyTemporalState(record, now) {
  if (record.status === "expired") {
    if (
      record.noExpiry
      || record.untilManualChange
      || record.accessUntilMilliseconds === null
      || record.accessUntilMilliseconds > now
    ) {
      return "invalid";
    }

    return "expired";
  }

  if (LOCKED_STATUS_SET.has(record.status)) {
    return "locked";
  }

  if (record.status !== "active") {
    return "invalid";
  }

  if (
    record.accessFromMilliseconds !== null
    && record.accessFromMilliseconds > now
  ) {
    return "locked";
  }

  if (
    record.accessUntilMilliseconds !== null
    && record.accessUntilMilliseconds < now
  ) {
    return "expired";
  }

  return "active";
}

function evidenceMatchesResource(record, resource) {
  if (record.course !== CONTRACT.course) {
    return false;
  }

  if (record.scopeType === "item") {
    return Boolean(
      record.module === resource.module
      && record.itemType === resource.itemType
      && record.itemId === resource.resourceId,
    );
  }

  if (record.scopeType === "bundle") {
    return Boolean(
      (!record.module || record.module === resource.module)
      && record.itemIds.includes(resource.resourceId),
    );
  }

  const requiredRank =
    CONTRACT.seedPlanRanks[resource.requiredPlan];

  if (record.accessRank < requiredRank) {
    return false;
  }

  if (record.scopeType === "module") {
    return record.module === resource.module;
  }

  return record.scopeType === "plan";
}

function compareCandidates(first, second) {
  const scopeDifference =
    CONTRACT.scopePriority[second.scopeType]
    - CONTRACT.scopePriority[first.scopeType];

  if (scopeDifference !== 0) {
    return scopeDifference;
  }

  const rankDifference =
    second.accessRank - first.accessRank;

  if (rankDifference !== 0) {
    return rankDifference;
  }

  const firstIndefinite =
    first.accessUntilMilliseconds === null;
  const secondIndefinite =
    second.accessUntilMilliseconds === null;

  if (firstIndefinite !== secondIndefinite) {
    return firstIndefinite ? -1 : 1;
  }

  if (
    first.accessUntilMilliseconds
    !== second.accessUntilMilliseconds
  ) {
    return (
      (second.accessUntilMilliseconds || 0)
      - (first.accessUntilMilliseconds || 0)
    );
  }

  if (first.grantRevision !== second.grantRevision) {
    return second.grantRevision - first.grantRevision;
  }

  const accessIdDifference =
    first.accessId.localeCompare(second.accessId);

  if (accessIdDifference !== 0) {
    return accessIdDifference;
  }

  return first.projectionId.localeCompare(
    second.projectionId,
  );
}

function fieldsFromCandidate(
  request,
  candidate = null,
) {
  return {
    principalUid: request.principalUid,
    resourceId: request.resource.resourceId,
    requiredPlan: request.resource.requiredPlan,
    matchedGrantId: candidate
      ? candidate.accessId
      : null,
    matchedScope: candidate
      ? candidate.scopeType.toUpperCase()
      : null,
    expiresAt: candidate
      ? candidate.accessUntil
      : null,
  };
}

function createEntitlementDecisionService(
  dependencies = {},
) {
  const {
    listEntitlementEvidence,
  } = dependencies;

  if (typeof listEntitlementEvidence !== "function") {
    throw new TypeError(
      "Entitlement decision service requires "
      + "listEntitlementEvidence.",
    );
  }

  async function resolveEntitlementDecision(
    request = {},
  ) {
    const normalizedRequest = normalizeRequest(request);

    if (!normalizedRequest.ok) {
      return decision(
        "error",
        normalizedRequest.code,
      );
    }

    let rawEvidence;

    try {
      rawEvidence = await listEntitlementEvidence({
        principalUid: normalizedRequest.principalUid,
        signal: normalizedRequest.signal,
      });
    } catch (_) {
      return decision(
        "error",
        CODES.EVIDENCE_READ_FAILED,
        fieldsFromCandidate(normalizedRequest),
      );
    }

    const evidence = normalizeEvidenceList(
      rawEvidence,
      normalizedRequest.principalUid,
    );

    if (!evidence.ok) {
      return decision(
        "error",
        CODES.EVIDENCE_INVALID,
        fieldsFromCandidate(normalizedRequest),
      );
    }

    let now;

    try {
      now = Date.now();
    } catch (_) {
      return decision(
        "error",
        CODES.EVIDENCE_INVALID,
        fieldsFromCandidate(normalizedRequest),
      );
    }

    if (
      !Number.isFinite(now)
      || !Number.isSafeInteger(now)
      || now < FIRESTORE_MIN_MILLISECONDS
      || now > FIRESTORE_MAX_MILLISECONDS
    ) {
      return decision(
        "error",
        CODES.EVIDENCE_INVALID,
        fieldsFromCandidate(normalizedRequest),
      );
    }

    const active = [];
    const expired = [];
    const locked = [];

    for (const record of evidence.value) {
      const temporalState = classifyTemporalState(
        record,
        now,
      );

      if (temporalState === "invalid") {
        return decision(
          "error",
          CODES.EVIDENCE_INVALID,
          fieldsFromCandidate(normalizedRequest),
        );
      }

      if (!evidenceMatchesResource(
        record,
        normalizedRequest.resource,
      )) {
        continue;
      }

      if (temporalState === "active") {
        active.push(record);
      } else if (temporalState === "expired") {
        expired.push(record);
      } else {
        locked.push(record);
      }
    }

    if (active.length) {
      const selected = [...active].sort(
        compareCandidates,
      )[0];

      return decision(
        "allowed",
        CODES.ALLOWED,
        fieldsFromCandidate(
          normalizedRequest,
          selected,
        ),
      );
    }

    if (expired.length) {
      const selected = [...expired].sort(
        compareCandidates,
      )[0];

      return decision(
        "expired",
        CODES.EXPIRED,
        fieldsFromCandidate(
          normalizedRequest,
          selected,
        ),
      );
    }

    if (locked.length) {
      const selected = [...locked].sort(
        compareCandidates,
      )[0];

      return decision(
        "locked",
        CODES.LOCKED,
        fieldsFromCandidate(
          normalizedRequest,
          selected,
        ),
      );
    }

    return decision(
      "locked",
      CODES.NOT_FOUND,
      fieldsFromCandidate(normalizedRequest),
    );
  }

  return Object.freeze({
    resolveEntitlementDecision,
  });
}

module.exports = Object.freeze({
  ENTITLEMENT_DECISION_CONTRACT: CONTRACT,
  CODES,
  createEntitlementDecisionService,
});
