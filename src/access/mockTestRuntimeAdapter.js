import {
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_SCOPE_TYPES,
} from "./accessConstants";
import {
  accessRecordMatchesItem,
  accessRecordMatchesModule,
  getActiveAccessRecords,
  normalizeScopeType,
} from "./accessUtils";
import {
  canUsePlanDescriptor,
  resolvePlanDescriptor,
} from "./accessPlanCatalog";
import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DISCOVERY_MODES,
  MOCK_TEST_TIME_SOURCES,
  buildMockTestActionDecision,
  buildMockTestCatalogProjection,
} from "./mockTestActionPolicy";

export const MOCK_TEST_RUNTIME_ACCESS_STATES =
  Object.freeze({
    ALLOWED: "allowed",
    DENIED: "denied",
    LOADING: "loading",
    ERROR: "error",
  });

export const MOCK_TEST_RUNTIME_EVIDENCE =
  Object.freeze({
    FREE: "free",
    ITEM: "item",
    BUNDLE: "bundle",
    MODULE: "module",
    PLAN: "plan",
    NONE: "",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const normalizeEmail = (value = "") =>
  normalizeText(value);

const getTestPlanDescriptor = (
  test = {},
  planCatalog = []
) =>
  resolvePlanDescriptor(
    {
      planCode:
        test.planCode ||
        test.planType ||
        test.requiredPlan ||
        test.plan ||
        "FREE",
      accessRank:
        test.accessRank ??
        test.planRank ??
        test.requiredAccessRank ??
        null,
      productId:
        test.productId ||
        test.accessProductId ||
        null,
    },
    { catalog: planCatalog }
  );

const isFreePlanDescriptor = (
  descriptor = {}
) =>
  descriptor.planCode === "FREE" ||
  descriptor.accessRank === 0;

const getRecordPlanDescriptor = (
  record = {},
  planCatalog = []
) =>
  resolvePlanDescriptor(
    {
      planCode:
        record.planCode ||
        record.planType ||
        record.productSnapshot
          ?.planCode ||
        "FREE",
      accessRank:
        record.accessRank ??
        record.planRank ??
        record.productSnapshot
          ?.accessRank ??
        null,
      productId:
        record.productId ||
        record.accessProductId ||
        record.productSnapshot
          ?.productId ||
        null,
    },
    { catalog: planCatalog }
  );

const recordCanUseRequiredPlan = ({
  record = {},
  requiredPlan = {},
  planCatalog = [],
} = {}) =>
  canUsePlanDescriptor(
    getRecordPlanDescriptor(
      record,
      planCatalog
    ),
    requiredPlan,
    { catalog: planCatalog }
  );

const getRecordItemIds = (record = {}) => {
  const source = record || {};
  const values =
    source.itemIds ||
    source.resourceIds ||
    source.items ||
    [];

  return Array.isArray(values)
    ? values
        .map(cleanString)
        .filter(Boolean)
    : [];
};

const getRecordItemId = (record = {}) =>
  cleanString(
    record?.itemId ||
      record?.resourceId ||
      record?.testId
  );

const getRecordModule = (record = {}) =>
  cleanString(record?.module);

const getRecordItemType = (
  record = {}
) =>
  cleanString(record?.itemType);

const freezeEvidence = ({
  status =
    MOCK_TEST_RUNTIME_ACCESS_STATES
      .DENIED,
  sourceScope =
    MOCK_TEST_RUNTIME_EVIDENCE.NONE,
  testId = "",
  requiredPlan = {},
  accessRecord = null,
  planCatalog = [],
  reason = "",
} = {}) => {
  const scope = normalizeScopeType(
    sourceScope ||
      accessRecord?.scopeType ||
      ACCESS_SCOPE_TYPES.PLAN
  );
  const recordPlan =
    accessRecord
      ? getRecordPlanDescriptor(
          accessRecord,
          planCatalog
        )
      : null;
  const itemIds = accessRecord
    ? getRecordItemIds(accessRecord)
    : [];
  const itemId = accessRecord
    ? getRecordItemId(accessRecord)
    : "";

  return Object.freeze({
    status,
    state: status,
    decision: status,
    sourceScope,
    scopeType: sourceScope,
    accessId:
      cleanString(accessRecord?.id) ||
      null,
    testId: cleanString(testId),
    module:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.FREE
        ? ACCESS_MODULE.MOCK_TEST
        : getRecordModule(accessRecord) ||
          ACCESS_MODULE.MOCK_TEST,
    itemType:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.FREE
        ? ACCESS_ITEM_TYPES.MOCK_TEST
        : getRecordItemType(
            accessRecord
          ) ||
          ACCESS_ITEM_TYPES.MOCK_TEST,
    itemId:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.ITEM
        ? itemId
        : "",
    resourceId:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.ITEM
        ? itemId
        : "",
    itemIds:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.BUNDLE
        ? Object.freeze([...itemIds])
        : Object.freeze([]),
    resourceIds:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.BUNDLE
        ? Object.freeze([...itemIds])
        : Object.freeze([]),
    planCode:
      recordPlan?.planCode ||
      requiredPlan.planCode ||
      "FREE",
    planType:
      recordPlan?.planCode ||
      requiredPlan.planCode ||
      "FREE",
    accessRank:
      recordPlan?.accessRank ??
      null,
    productId:
      recordPlan?.productId ??
      null,
    requiredPlanCode:
      requiredPlan.planCode ||
      "FREE",
    requiredAccessRank:
      requiredPlan.accessRank ??
      null,
    exactItem:
      sourceScope ===
      MOCK_TEST_RUNTIME_EVIDENCE.ITEM,
    reason: cleanString(reason),
  });
};

const isMockItemRecord = (
  record = {},
  testId = ""
) =>
  normalizeScopeType(
    record.scopeType
  ) === ACCESS_SCOPE_TYPES.ITEM &&
  accessRecordMatchesItem(record, {
    module: ACCESS_MODULE.MOCK_TEST,
    itemType:
      ACCESS_ITEM_TYPES.MOCK_TEST,
    itemId: testId,
  });

const isMockBundleRecord = (
  record = {},
  testId = ""
) =>
  normalizeScopeType(
    record.scopeType
  ) === ACCESS_SCOPE_TYPES.BUNDLE &&
  accessRecordMatchesItem(record, {
    module: ACCESS_MODULE.MOCK_TEST,
    itemType:
      ACCESS_ITEM_TYPES.MOCK_TEST,
    itemId: testId,
  });

const isMockModuleRecord = (
  record = {}
) =>
  normalizeScopeType(
    record.scopeType
  ) === ACCESS_SCOPE_TYPES.MODULE &&
  accessRecordMatchesModule(
    record,
    ACCESS_MODULE.MOCK_TEST
  );

const isPlanRecord = (
  record = {}
) =>
  normalizeScopeType(
    record.scopeType
  ) === ACCESS_SCOPE_TYPES.PLAN;

const sortEvidenceRecords = (
  records = []
) =>
  [...records].sort((first, second) => {
    const firstRank = Number(
      first.accessRank ??
        first.planRank ??
        first.productSnapshot
          ?.accessRank ??
        -1
    );
    const secondRank = Number(
      second.accessRank ??
        second.planRank ??
        second.productSnapshot
          ?.accessRank ??
        -1
    );

    if (
      Number.isFinite(firstRank) &&
      Number.isFinite(secondRank) &&
      secondRank !== firstRank
    ) {
      return secondRank - firstRank;
    }

    return cleanString(first.id).localeCompare(
      cleanString(second.id)
    );
  });

const getUnavailableState = (
  accessProfile = {}
) => {
  const shellMode = normalizeText(
    accessProfile.shellState?.mode
  );

  if (
    accessProfile.loading === true ||
    shellMode === "loading"
  ) {
    return MOCK_TEST_RUNTIME_ACCESS_STATES
      .LOADING;
  }

  if (
    accessProfile.error ||
    accessProfile
      .isAccessCheckUnavailable === true ||
    accessProfile.shellState
      ?.isFailClosed === true ||
    shellMode === "error"
  ) {
    return MOCK_TEST_RUNTIME_ACCESS_STATES
      .ERROR;
  }

  return "";
};

export const buildMockTestPrincipal = ({
  user = null,
  role = "",
  isAdminUser = false,
} = {}) =>
  Object.freeze({
    uid: cleanString(user?.uid),
    email: normalizeEmail(user?.email),
    isAuthenticated: Boolean(
      cleanString(user?.uid) ||
      normalizeEmail(user?.email)
    ),
    isAdmin:
      isAdminUser === true,
    role: cleanString(role),
  });

export const resolveMockTestRuntimeAccess =
  ({
    test = null,
    accessProfile = {},
    planCatalog = [],
  } = {}) => {
    const testId = cleanString(test?.id);
    const requiredPlan =
      getTestPlanDescriptor(
        test || {},
        planCatalog
      );

    if (!testId) {
      return freezeEvidence({
        status:
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .DENIED,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.NONE,
        testId,
        requiredPlan,
        planCatalog,
        reason: "test_not_found",
      });
    }

    if (
      isFreePlanDescriptor(requiredPlan)
    ) {
      return freezeEvidence({
        status:
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .ALLOWED,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.FREE,
        testId,
        requiredPlan,
        planCatalog,
        reason: "free_resource",
      });
    }

    const unavailableState =
      getUnavailableState(accessProfile);

    if (unavailableState) {
      return freezeEvidence({
        status: unavailableState,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.NONE,
        testId,
        requiredPlan,
        planCatalog,
        reason:
          unavailableState ===
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .LOADING
            ? "access_loading"
            : "access_error",
      });
    }

    const activeRecords =
      getActiveAccessRecords(
        accessProfile.accessRecords
      );

    const exactItem =
      sortEvidenceRecords(
        activeRecords.filter((record) =>
          isMockItemRecord(
            record,
            testId
          )
        )
      )[0] || null;

    if (exactItem) {
      return freezeEvidence({
        status:
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .ALLOWED,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.ITEM,
        testId,
        requiredPlan,
        accessRecord: exactItem,
        planCatalog,
        reason: "exact_item_grant",
      });
    }

    const bundle =
      sortEvidenceRecords(
        activeRecords.filter((record) =>
          isMockBundleRecord(
            record,
            testId
          )
        )
      )[0] || null;

    if (bundle) {
      return freezeEvidence({
        status:
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .ALLOWED,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.BUNDLE,
        testId,
        requiredPlan,
        accessRecord: bundle,
        planCatalog,
        reason: "bundle_grant",
      });
    }

    const moduleRecord =
      sortEvidenceRecords(
        activeRecords.filter(
          (record) =>
            isMockModuleRecord(record) &&
            recordCanUseRequiredPlan({
              record,
              requiredPlan,
              planCatalog,
            })
        )
      )[0] || null;

    if (moduleRecord) {
      return freezeEvidence({
        status:
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .ALLOWED,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.MODULE,
        testId,
        requiredPlan,
        accessRecord: moduleRecord,
        planCatalog,
        reason: "module_grant",
      });
    }

    const planRecord =
      sortEvidenceRecords(
        activeRecords.filter(
          (record) =>
            isPlanRecord(record) &&
            recordCanUseRequiredPlan({
              record,
              requiredPlan,
              planCatalog,
            })
        )
      )[0] || null;

    if (planRecord) {
      return freezeEvidence({
        status:
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .ALLOWED,
        sourceScope:
          MOCK_TEST_RUNTIME_EVIDENCE.PLAN,
        testId,
        requiredPlan,
        accessRecord: planRecord,
        planCatalog,
        reason: "plan_grant",
      });
    }

    return freezeEvidence({
      status:
        MOCK_TEST_RUNTIME_ACCESS_STATES
          .DENIED,
      sourceScope:
        MOCK_TEST_RUNTIME_EVIDENCE.NONE,
      testId,
      requiredPlan,
      planCatalog,
      reason: "no_matching_grant",
    });
  };

export const buildMockTestRuntimeDecision =
  ({
    action =
      MOCK_TEST_ACTIONS.OPEN,
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    attempt = null,
    result = null,
    discoveryMode =
      MOCK_TEST_DISCOVERY_MODES.CATALOG,
    now = Date.now(),
    timeSource =
      MOCK_TEST_TIME_SOURCES.CLIENT,
    reviewReleased = false,
    publicProjection = false,
  } = {}) => {
    const access =
      resolveMockTestRuntimeAccess({
        test,
        accessProfile,
        planCatalog,
      });

    return buildMockTestActionDecision({
      action,
      test,
      principal:
        buildMockTestPrincipal({
          user,
          role,
          isAdminUser,
        }),
      access,
      attempt,
      result,
      discoveryMode,
      now,
      timeSource,
      reviewReleased,
      publicProjection,
    });
  };

export const buildMockTestCatalogItem =
  ({
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    discoveryMode =
      MOCK_TEST_DISCOVERY_MODES.CATALOG,
    now = Date.now(),
  } = {}) => {
    const decision =
      buildMockTestRuntimeDecision({
        action:
          MOCK_TEST_ACTIONS.DISCOVER,
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        discoveryMode,
        now,
      });

    return buildMockTestCatalogProjection({
      test,
      decision,
    });
  };
