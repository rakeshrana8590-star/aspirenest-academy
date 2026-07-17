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
  NOTES_ACTIONS,
  NOTES_DISCOVERY_MODES,
  buildNotesActionDecision,
  buildNotesCatalogProjection,
  getNotesRequiredPlan,
  getNotesResourceId,
} from "./notesActionPolicy";

export const NOTES_RUNTIME_ACCESS_STATES =
  Object.freeze({
    ALLOWED: "allowed",
    DENIED: "denied",
    LOADING: "loading",
    ERROR: "error",
  });

export const NOTES_RUNTIME_EVIDENCE =
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

const getNotePlanDescriptor = (
  note = {},
  planCatalog = []
) =>
  resolvePlanDescriptor(
    {
      planCode: getNotesRequiredPlan(note),
      accessRank:
        note.accessRank ??
        note.planRank ??
        note.requiredAccessRank ??
        null,
      productId:
        note.productId ||
        note.accessProductId ||
        null,
    },
    { catalog: planCatalog }
  );

const getRecordPlanDescriptor = (
  record = {},
  planCatalog = []
) =>
  resolvePlanDescriptor(
    {
      planCode:
        record.planCode ||
        record.planType ||
        record.productSnapshot?.planCode ||
        "FREE",
      accessRank:
        record.accessRank ??
        record.planRank ??
        record.productSnapshot?.accessRank ??
        null,
      productId:
        record.productId ||
        record.accessProductId ||
        record.productSnapshot?.productId ||
        null,
    },
    { catalog: planCatalog }
  );

const isFreePlanDescriptor = (
  descriptor = {}
) =>
  descriptor.planCode === "FREE" ||
  descriptor.accessRank === 0;

const recordCanUseRequiredPlan = ({
  record = {},
  requiredPlan = {},
  planCatalog = [],
} = {}) =>
  canUsePlanDescriptor(
    getRecordPlanDescriptor(record, planCatalog),
    requiredPlan,
    { catalog: planCatalog }
  );

const getRecordItemIds = (record = {}) => {
  const values =
    record.itemIds ||
    record.resourceIds ||
    record.items ||
    [];

  return Array.isArray(values)
    ? values.map(cleanString).filter(Boolean)
    : [];
};

const getRecordItemId = (record = {}) =>
  cleanString(
    record.itemId ||
      record.resourceId ||
      record.noteId
  );

const sortEvidenceRecords = (records = []) =>
  [...records].sort((first, second) => {
    const firstRank = Number(
      first.accessRank ??
        first.planRank ??
        first.productSnapshot?.accessRank ??
        -1
    );
    const secondRank = Number(
      second.accessRank ??
        second.planRank ??
        second.productSnapshot?.accessRank ??
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
    return NOTES_RUNTIME_ACCESS_STATES.LOADING;
  }

  if (
    accessProfile.error ||
    accessProfile.isAccessCheckUnavailable === true ||
    accessProfile.shellState?.isFailClosed === true ||
    shellMode === "error"
  ) {
    return NOTES_RUNTIME_ACCESS_STATES.ERROR;
  }

  return "";
};

const freezeEvidence = ({
  status = NOTES_RUNTIME_ACCESS_STATES.DENIED,
  sourceScope = NOTES_RUNTIME_EVIDENCE.NONE,
  noteId = "",
  requiredPlan = {},
  accessRecord = null,
  planCatalog = [],
  reason = "",
} = {}) => {
  const recordPlan = accessRecord
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
      cleanString(accessRecord?.id) || null,
    noteId: cleanString(noteId),
    module:
      sourceScope === NOTES_RUNTIME_EVIDENCE.FREE
        ? ACCESS_MODULE.NOTES
        : cleanString(accessRecord?.module) ||
          ACCESS_MODULE.NOTES,
    itemType:
      sourceScope === NOTES_RUNTIME_EVIDENCE.FREE
        ? ACCESS_ITEM_TYPES.NOTES_PDF
        : cleanString(accessRecord?.itemType) ||
          ACCESS_ITEM_TYPES.NOTES_PDF,
    itemId:
      sourceScope === NOTES_RUNTIME_EVIDENCE.ITEM
        ? itemId
        : "",
    resourceId:
      sourceScope === NOTES_RUNTIME_EVIDENCE.ITEM
        ? itemId
        : "",
    itemIds:
      sourceScope === NOTES_RUNTIME_EVIDENCE.BUNDLE
        ? Object.freeze([...itemIds])
        : Object.freeze([]),
    resourceIds:
      sourceScope === NOTES_RUNTIME_EVIDENCE.BUNDLE
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
      recordPlan?.accessRank ?? null,
    productId:
      recordPlan?.productId ?? null,
    requiredPlanCode:
      requiredPlan.planCode || "FREE",
    requiredAccessRank:
      requiredPlan.accessRank ?? null,
    exactItem:
      sourceScope === NOTES_RUNTIME_EVIDENCE.ITEM,
    reason: cleanString(reason),
  });
};

const isNotesItemRecord = (
  record = {},
  noteId = ""
) =>
  normalizeScopeType(record.scopeType) ===
    ACCESS_SCOPE_TYPES.ITEM &&
  accessRecordMatchesItem(record, {
    module: ACCESS_MODULE.NOTES,
    itemType: ACCESS_ITEM_TYPES.NOTES_PDF,
    itemId: noteId,
  });

const isNotesBundleRecord = (
  record = {},
  noteId = ""
) =>
  normalizeScopeType(record.scopeType) ===
    ACCESS_SCOPE_TYPES.BUNDLE &&
  accessRecordMatchesItem(record, {
    module: ACCESS_MODULE.NOTES,
    itemType: ACCESS_ITEM_TYPES.NOTES_PDF,
    itemId: noteId,
  });

const isNotesModuleRecord = (record = {}) =>
  normalizeScopeType(record.scopeType) ===
    ACCESS_SCOPE_TYPES.MODULE &&
  accessRecordMatchesModule(
    record,
    ACCESS_MODULE.NOTES
  );

const isPlanRecord = (record = {}) =>
  normalizeScopeType(record.scopeType) ===
  ACCESS_SCOPE_TYPES.PLAN;

export const buildNotesPrincipal = ({
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
    isAdmin: isAdminUser === true,
    role: cleanString(role),
  });

export const resolveNotesRuntimeAccess = ({
  note = null,
  accessProfile = {},
  planCatalog = [],
} = {}) => {
  const noteId = getNotesResourceId(note || {});
  const requiredPlan = getNotePlanDescriptor(
    note || {},
    planCatalog
  );

  if (!noteId) {
    return freezeEvidence({
      status: NOTES_RUNTIME_ACCESS_STATES.DENIED,
      sourceScope: NOTES_RUNTIME_EVIDENCE.NONE,
      noteId,
      requiredPlan,
      planCatalog,
      reason: "note_not_found",
    });
  }

  if (isFreePlanDescriptor(requiredPlan)) {
    return freezeEvidence({
      status: NOTES_RUNTIME_ACCESS_STATES.ALLOWED,
      sourceScope: NOTES_RUNTIME_EVIDENCE.FREE,
      noteId,
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
      sourceScope: NOTES_RUNTIME_EVIDENCE.NONE,
      noteId,
      requiredPlan,
      planCatalog,
      reason:
        unavailableState ===
        NOTES_RUNTIME_ACCESS_STATES.LOADING
          ? "access_loading"
          : "access_error",
    });
  }

  const activeRecords = getActiveAccessRecords(
    accessProfile.accessRecords
  );

  const exactItem =
    sortEvidenceRecords(
      activeRecords.filter((record) =>
        isNotesItemRecord(record, noteId)
      )
    )[0] || null;

  if (exactItem) {
    return freezeEvidence({
      status: NOTES_RUNTIME_ACCESS_STATES.ALLOWED,
      sourceScope: NOTES_RUNTIME_EVIDENCE.ITEM,
      noteId,
      requiredPlan,
      accessRecord: exactItem,
      planCatalog,
      reason: "exact_item_grant",
    });
  }

  const bundle =
    sortEvidenceRecords(
      activeRecords.filter((record) =>
        isNotesBundleRecord(record, noteId)
      )
    )[0] || null;

  if (bundle) {
    return freezeEvidence({
      status: NOTES_RUNTIME_ACCESS_STATES.ALLOWED,
      sourceScope: NOTES_RUNTIME_EVIDENCE.BUNDLE,
      noteId,
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
          isNotesModuleRecord(record) &&
          recordCanUseRequiredPlan({
            record,
            requiredPlan,
            planCatalog,
          })
      )
    )[0] || null;

  if (moduleRecord) {
    return freezeEvidence({
      status: NOTES_RUNTIME_ACCESS_STATES.ALLOWED,
      sourceScope: NOTES_RUNTIME_EVIDENCE.MODULE,
      noteId,
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
      status: NOTES_RUNTIME_ACCESS_STATES.ALLOWED,
      sourceScope: NOTES_RUNTIME_EVIDENCE.PLAN,
      noteId,
      requiredPlan,
      accessRecord: planRecord,
      planCatalog,
      reason: "plan_grant",
    });
  }

  return freezeEvidence({
    status: NOTES_RUNTIME_ACCESS_STATES.DENIED,
    sourceScope: NOTES_RUNTIME_EVIDENCE.NONE,
    noteId,
    requiredPlan,
    planCatalog,
    reason: "no_matching_grant",
  });
};

export const buildNotesRuntimeDecision = ({
  action = NOTES_ACTIONS.OPEN,
  note = null,
  user = null,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
  discoveryMode = NOTES_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const access = resolveNotesRuntimeAccess({
    note,
    accessProfile,
    planCatalog,
  });

  return buildNotesActionDecision({
    action,
    note,
    principal: buildNotesPrincipal({
      user,
      role,
      isAdminUser,
    }),
    access,
    discoveryMode,
  });
};

export const buildNotesCatalogItem = ({
  note = null,
  user = null,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
  discoveryMode = NOTES_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const decision = buildNotesRuntimeDecision({
    action: NOTES_ACTIONS.DISCOVER,
    note,
    user,
    role,
    isAdminUser,
    accessProfile,
    planCatalog,
    discoveryMode,
  });

  return buildNotesCatalogProjection({
    note,
    decision,
  });
};

export const buildNotesAssetRequest = ({
  action = NOTES_ACTIONS.OPEN,
  note = null,
  decision = null,
} = {}) => {
  const normalizedAction = cleanString(action).toUpperCase();
  const noteId = getNotesResourceId(note || {});
  const supported = new Set([
    NOTES_ACTIONS.OPEN,
    NOTES_ACTIONS.READ,
    NOTES_ACTIONS.DOWNLOAD,
  ]);

  if (
    !supported.has(normalizedAction) ||
    !noteId ||
    decision?.allowed !== true ||
    decision?.canResolveAsset !== true
  ) {
    return null;
  }

  return Object.freeze({
    noteId,
    action: normalizedAction,
  });
};
