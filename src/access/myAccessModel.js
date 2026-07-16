import {
  ACCESS_ACTIVE_STATUS_VALUES,
  ACCESS_BLOCKED_STATUS_VALUES,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  getInitialSeedPlan,
  normalizeAccessRank,
  normalizePlanCode,
} from "./accessPlanCatalog";
import {
  normalizeScopeType,
} from "./accessUtils";

export const MY_ACCESS_MODES = Object.freeze({
  GUEST: "guest",
  LOADING: "loading",
  ERROR: "error",
  ADMIN: "admin",
  ACTIVE: "active",
  PARTIAL: "partial",
  FREE: "free",
  EXPIRED: "expired",
  BLOCKED: "blocked",
});

export const MY_ACCESS_ACTIONS = Object.freeze([
  Object.freeze({
    id: "learning-hub",
    label: "Open Learning Hub",
    route: "/ctet-tet",
  }),
  Object.freeze({
    id: "redeem-access",
    label: "Redeem Access Key",
    route: "/ctet-tet/redeem",
  }),
  Object.freeze({
    id: "pricing",
    label: "View Plans",
    route: "/ctet-tet/pricing",
  }),
]);

const SCOPE_ORDER = Object.freeze({
  [ACCESS_SCOPE_TYPES.PLAN]: 0,
  [ACCESS_SCOPE_TYPES.MODULE]: 1,
  [ACCESS_SCOPE_TYPES.BUNDLE]: 2,
  [ACCESS_SCOPE_TYPES.ITEM]: 3,
});

const STATUS_ORDER = Object.freeze({
  active: 0,
  pending: 1,
  expired: 2,
  blocked: 3,
});

const MODULE_LABELS = Object.freeze({
  notes: "Notes",
  mockTest: "Mock Tests",
  video: "Videos",
  currentAffairs: "Current Affairs",
  roadmap: "Roadmaps",
});

const cleanString = (value = "") =>
  String(value ?? "").trim();

const toTime = (value) => {
  if (!value) return null;

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const parsed =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);
  const time = parsed.getTime();

  return Number.isFinite(time)
    ? time
    : null;
};

const safeNormalizeAccessRank = (
  value,
  planCode = ""
) => {
  try {
    return normalizeAccessRank(
      value,
      {
        planCode,
        required: false,
      }
    );
  } catch {
    return null;
  }
};

const humanizeToken = (value = "") =>
  cleanString(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (token) =>
        token.charAt(0).toUpperCase() +
        token.slice(1).toLowerCase()
    )
    .join(" ");

const getPlanCode = (record = {}) =>
  normalizePlanCode(
    record.planCode ||
      record.planType ||
      record.purchaseTermsSnapshot
        ?.planCode ||
      "FREE"
  );

const getPlanLabel = (
  record = {},
  planCode = "FREE"
) => {
  const snapshot =
    record.purchaseTermsSnapshot ||
    record.termsSnapshot ||
    {};
  const directLabel = cleanString(
    record.planTitle ||
      record.productTitle ||
      record.planName ||
      record.productName ||
      record.displayName ||
      snapshot.planTitle ||
      snapshot.productTitle ||
      snapshot.planName ||
      snapshot.productName ||
      snapshot.title
  );

  return (
    directLabel ||
    getInitialSeedPlan(planCode)
      ?.title ||
    humanizeToken(planCode)
  );
};

const getModuleLabel = (module = "") =>
  MODULE_LABELS[
    cleanString(module)
  ] ||
  humanizeToken(module) ||
  "Learning Module";

const getScopeLabel = (
  scopeType = ACCESS_SCOPE_TYPES.PLAN
) => {
  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.MODULE
  ) {
    return "Module Access";
  }

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.ITEM
  ) {
    return "Item Access";
  }

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.BUNDLE
  ) {
    return "Bundle Access";
  }

  return "Plan Access";
};

const getRecordStatus = (
  record = {},
  now = Date.now()
) => {
  const status =
    cleanString(
      record.status ||
        ACCESS_STATUS.ACTIVE
    ).toLowerCase();
  const noExpiry =
    record.noExpiry === true ||
    record.untilManualChange === true;
  const expiryTime = toTime(
    record.accessUntil ||
      record.expiryDate ||
      record.validUntil
  );

  if (
    status ===
    ACCESS_STATUS.EXPIRED
  ) {
    return "expired";
  }

  if (
    ACCESS_BLOCKED_STATUS_VALUES.has(
      status
    )
  ) {
    return "blocked";
  }

  if (
    !noExpiry &&
    expiryTime !== null &&
    expiryTime < now
  ) {
    return "expired";
  }

  if (
    ACCESS_ACTIVE_STATUS_VALUES.has(
      status
    )
  ) {
    return "active";
  }

  return "pending";
};

const getRecordTitle = ({
  record = {},
  scopeType,
  planLabel,
  moduleLabel,
} = {}) => {
  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    return planLabel;
  }

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.MODULE
  ) {
    return moduleLabel;
  }

  const directTitle = cleanString(
    record.itemTitle ||
      record.bundleTitle ||
      record.title
  );

  if (directTitle) return directTitle;

  if (
    scopeType ===
    ACCESS_SCOPE_TYPES.BUNDLE
  ) {
    return (
      humanizeToken(
        record.bundleId
      ) ||
      `${moduleLabel} Bundle`
    );
  }

  return (
    humanizeToken(
      record.itemId ||
        record.itemType
    ) ||
    `${moduleLabel} Item`
  );
};

const getRecordIdentity = (
  record = {},
  index = 0
) => {
  const directId = cleanString(
    record.id ||
      record.accessId ||
      record.entitlementId
  );

  if (directId) return directId;

  return [
    normalizeScopeType(
      record.scopeType
    ),
    getPlanCode(record),
    cleanString(record.module),
    cleanString(record.itemType),
    cleanString(record.itemId),
    cleanString(record.bundleId),
    String(index),
  ].join("|");
};

const freezeRecordView = (
  record = {},
  index = 0,
  now = Date.now()
) => {
  const scopeType =
    normalizeScopeType(
      record.scopeType
    );
  const planCode =
    getPlanCode(record);
  const planLabel =
    getPlanLabel(
      record,
      planCode
    );
  const accessRank =
    safeNormalizeAccessRank(
      record.accessRank ??
        record.planRank ??
        record.rank,
      planCode
    );
  const module =
    cleanString(record.module);
  const moduleLabel =
    getModuleLabel(module);
  const status =
    getRecordStatus(
      record,
      now
    );
  const noExpiry =
    record.noExpiry === true;
  const untilManualChange =
    record.untilManualChange === true;
  const accessFrom =
    record.accessFrom ||
    record.grantedAt ||
    record.createdAt ||
    null;
  const accessUntil =
    record.accessUntil ||
    record.expiryDate ||
    record.validUntil ||
    null;
  const productId =
    cleanString(
      record.productId ||
        record.purchaseTermsSnapshot
          ?.productId
    ) || null;

  return Object.freeze({
    id: getRecordIdentity(
      record,
      index
    ),
    scopeType,
    scopeLabel:
      getScopeLabel(scopeType),
    title: getRecordTitle({
      record,
      scopeType,
      planLabel,
      moduleLabel,
    }),
    status,
    isActive:
      status === "active",
    isExpired:
      status === "expired",
    isBlocked:
      status === "blocked",
    planCode,
    planLabel,
    accessRank,
    isCustomPlan:
      !getInitialSeedPlan(
        planCode
      ),
    productId,
    module,
    moduleLabel,
    itemType:
      cleanString(
        record.itemType
      ) || null,
    itemId:
      cleanString(
        record.itemId
      ) || null,
    itemIds:
      Object.freeze(
        Array.isArray(record.itemIds)
          ? record.itemIds
              .map(cleanString)
              .filter(Boolean)
          : []
      ),
    bundleId:
      cleanString(
        record.bundleId
      ) || null,
    source:
      cleanString(
        record.source
      ) || null,
    accessFrom,
    accessUntil,
    noExpiry,
    untilManualChange,
    validityLabel:
      noExpiry
        ? "No expiry"
        : untilManualChange
          ? "Until manually changed"
          : accessUntil
            ? "Time limited"
            : "No end date set",
  });
};

const uniqueRecordViews = (
  records = [],
  now = Date.now()
) => {
  const seen = new Set();

  return (
    Array.isArray(records)
      ? records
      : []
  )
    .filter(Boolean)
    .map(
      (record, index) =>
        freezeRecordView(
          record,
          index,
          now
        )
    )
    .filter((record) => {
      if (seen.has(record.id)) {
        return false;
      }

      seen.add(record.id);
      return true;
    });
};

const getExpirySortTime = (
  record = {}
) => {
  if (
    record.noExpiry ||
    record.untilManualChange
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return (
    toTime(record.accessUntil) ||
    0
  );
};

const sortRecordViews = (
  records = []
) =>
  [...records].sort(
    (first, second) => {
      const statusDifference =
        (STATUS_ORDER[first.status] ??
          9) -
        (STATUS_ORDER[second.status] ??
          9);

      if (statusDifference !== 0) {
        return statusDifference;
      }

      const scopeDifference =
        (SCOPE_ORDER[
          first.scopeType
        ] ?? 9) -
        (SCOPE_ORDER[
          second.scopeType
        ] ?? 9);

      if (scopeDifference !== 0) {
        return scopeDifference;
      }

      const rankDifference =
        (second.accessRank ?? -1) -
        (first.accessRank ?? -1);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      return (
        getExpirySortTime(second) -
        getExpirySortTime(first)
      );
    }
  );

const freezeSection = (
  scopeType,
  title,
  records = []
) =>
  Object.freeze({
    id: scopeType,
    title,
    count: records.length,
    items: Object.freeze(records),
  });

const buildSummary = (
  records = []
) => {
  const summary = {
    total: records.length,
    active: 0,
    pending: 0,
    expired: 0,
    blocked: 0,
    plan: 0,
    module: 0,
    item: 0,
    bundle: 0,
  };

  records.forEach((record) => {
    if (
      Object.prototype.hasOwnProperty.call(
        summary,
        record.status
      )
    ) {
      summary[record.status] += 1;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        summary,
        record.scopeType
      )
    ) {
      summary[record.scopeType] += 1;
    }
  });

  return Object.freeze(summary);
};

const normalizeShellMode = (
  shellState = {},
  {
    isAuthenticated = false,
    loading = false,
    error = null,
  } = {}
) => {
  const requestedMode =
    cleanString(
      shellState.mode
    ).toLowerCase();

  if (!isAuthenticated) {
    return MY_ACCESS_MODES.GUEST;
  }

  if (loading) {
    return MY_ACCESS_MODES.LOADING;
  }

  if (error) {
    return MY_ACCESS_MODES.ERROR;
  }

  if (
    Object.values(
      MY_ACCESS_MODES
    ).includes(requestedMode)
  ) {
    return requestedMode;
  }

  return MY_ACCESS_MODES.ERROR;
};

const buildPrimaryPlan = (
  shellState = {}
) => {
  const activePlan =
    shellState.activePlan;

  if (!activePlan) return null;

  const planCode =
    normalizePlanCode(
      activePlan.planCode ||
        activePlan.planType ||
        "FREE"
    );
  const accessRank =
    safeNormalizeAccessRank(
      activePlan.accessRank,
      planCode
    );

  if (
    planCode !== "FREE" &&
    accessRank === null
  ) {
    return null;
  }

  return Object.freeze({
    id:
      cleanString(
        activePlan.id
      ) || null,
    planCode,
    planType: planCode,
    label:
      cleanString(
        activePlan.label
      ) ||
      getInitialSeedPlan(
        planCode
      )?.title ||
      humanizeToken(planCode),
    accessRank,
    productId:
      cleanString(
        activePlan.productId
      ) || null,
    accessUntil:
      activePlan.accessUntil ||
      null,
    noExpiry:
      activePlan.noExpiry === true,
    untilManualChange:
      activePlan.untilManualChange ===
      true,
    isCustomPlan:
      activePlan.isCustomPlan ===
        true ||
      !getInitialSeedPlan(
        planCode
      ),
  });
};

export const buildMyAccessModel = ({
  user = null,
  accessRecords = [],
  shellState = {},
  loading = false,
  error = null,
  now = Date.now(),
} = {}) => {
  const isAuthenticated =
    Boolean(
      cleanString(user?.uid) ||
      cleanString(user?.email)
    );
  const mode =
    normalizeShellMode(
      shellState,
      {
        isAuthenticated,
        loading,
        error,
      }
    );
  const isVerificationUnavailable =
    mode ===
      MY_ACCESS_MODES.LOADING ||
    mode ===
      MY_ACCESS_MODES.ERROR;
  const isFailClosed =
    shellState.isFailClosed === true ||
    isVerificationUnavailable;
  const canShowAccessDetails =
    isAuthenticated &&
    !isVerificationUnavailable;
  const recordViews =
    canShowAccessDetails
      ? sortRecordViews(
          uniqueRecordViews(
            accessRecords,
            Number(now) ||
              Date.now()
          )
        )
      : [];
  const planItems =
    recordViews.filter(
      (record) =>
        record.scopeType ===
        ACCESS_SCOPE_TYPES.PLAN
    );
  const moduleItems =
    recordViews.filter(
      (record) =>
        record.scopeType ===
        ACCESS_SCOPE_TYPES.MODULE
    );
  const bundleItems =
    recordViews.filter(
      (record) =>
        record.scopeType ===
        ACCESS_SCOPE_TYPES.BUNDLE
    );
  const itemItems =
    recordViews.filter(
      (record) =>
        record.scopeType ===
        ACCESS_SCOPE_TYPES.ITEM
    );
  const primaryPlan =
    canShowAccessDetails
      ? buildPrimaryPlan(
          shellState
        )
      : null;
  const accessLabel =
    cleanString(
      shellState.accessLabel
    ) ||
    (mode ===
    MY_ACCESS_MODES.GUEST
      ? "Login required"
      : mode ===
          MY_ACCESS_MODES.LOADING
        ? "Checking access"
        : mode ===
            MY_ACCESS_MODES.ERROR
          ? "Access unavailable"
          : "Free Access");

  return Object.freeze({
    mode,
    isAuthenticated,
    isAdminUser:
      isAuthenticated &&
      shellState.isAdminUser === true,
    isFailClosed,
    isVerificationUnavailable,
    canShowAccessDetails,
    roleLabel:
      cleanString(
        shellState.accountRoleLabel
      ) ||
      (isAuthenticated
        ? "Student"
        : "Login"),
    accessLabel,
    primaryPlan,
    summary:
      buildSummary(
        recordViews
      ),
    sections: Object.freeze([
      freezeSection(
        ACCESS_SCOPE_TYPES.PLAN,
        "Plans",
        planItems
      ),
      freezeSection(
        ACCESS_SCOPE_TYPES.MODULE,
        "Modules",
        moduleItems
      ),
      freezeSection(
        ACCESS_SCOPE_TYPES.BUNDLE,
        "Bundles",
        bundleItems
      ),
      freezeSection(
        ACCESS_SCOPE_TYPES.ITEM,
        "Individual Items",
        itemItems
      ),
    ]),
    actions:
      MY_ACCESS_ACTIONS,
    emptyState:
      !isAuthenticated
        ? "Login to view your access."
        : isVerificationUnavailable
          ? "Access details are temporarily unavailable."
          : recordViews.length === 0
            ? "No paid or partial access is active yet."
            : "",
  });
};
