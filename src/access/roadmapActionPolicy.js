export const ROADMAP_ACTIONS = Object.freeze({
  DISCOVER: "DISCOVER",
  OPEN: "OPEN",
  VIEW_DAY: "VIEW_DAY",
  UPDATE_PROGRESS: "UPDATE_PROGRESS",
});

export const ROADMAP_DECISIONS = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  HIDE: "hide",
  LOCKED_PREVIEW: "locked_preview",
});

export const ROADMAP_REASON_CODES = Object.freeze({
  ALLOWED: "allowed",
  INVALID_ACTION: "invalid_action",
  NOT_FOUND: "not_found",
  NOT_ROADMAP: "not_roadmap",
  UNPUBLISHED: "unpublished",
  LOGIN_REQUIRED: "login_required",
  ACCESS_LOADING: "access_loading",
  ACCESS_ERROR: "access_error",
  ACCESS_DENIED: "access_denied",
  ACCESS_SCOPE_MISMATCH: "access_scope_mismatch",
});

export const ROADMAP_DISCOVERY_MODES = Object.freeze({
  CATALOG: "catalog",
  MY_ACCESS: "my_access",
});

export const ROADMAP_ACCESS_STATES = Object.freeze({
  ALLOWED: "allowed",
  DENIED: "denied",
  LOADING: "loading",
  ERROR: "error",
});

const KNOWN_ACTIONS = new Set(Object.values(ROADMAP_ACTIONS));

const ALLOWED_ACCESS_STATUSES = new Set([
  "allowed",
  "active",
  "granted",
  "available",
]);

const LOADING_ACCESS_STATUSES = new Set([
  "loading",
  "pending",
  "checking",
]);

const ERROR_ACCESS_STATUSES = new Set([
  "error",
  "unavailable",
  "failed",
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const normalizeAction = (value = "") =>
  cleanString(value).toUpperCase();

const normalizeStatus = (value = "") =>
  normalizeText(value)
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const normalizeScope = (value = "") =>
  normalizeText(value);

const cleanArray = (values = []) =>
  Object.freeze(
    Array.isArray(values)
      ? values.map(cleanString).filter(Boolean)
      : []
  );

export const getRoadmapResourceId = (
  roadmap = {}
) =>
  cleanString(
    roadmap.id ||
      roadmap.roadmapId ||
      roadmap.resourceId ||
      roadmap.itemId ||
      roadmap.slug
  );

export const getRoadmapRequiredPlan = (
  roadmap = {}
) =>
  cleanString(
    roadmap.planCode ||
      roadmap.planType ||
      roadmap.requiredPlan ||
      roadmap.accessPlan ||
      roadmap.plan ||
      "FREE"
  ).toUpperCase() || "FREE";

export const isRoadmapResource = (
  roadmap = {}
) => {
  const module = normalizeText(roadmap.module);
  const section = normalizeText(roadmap.section);
  const contentType = cleanString(
    roadmap.contentType
  ).toUpperCase();
  const itemType = normalizeText(roadmap.itemType);
  const collection = normalizeText(
    roadmap.collection ||
      roadmap.collectionName
  );

  return Boolean(
    module === "roadmap" ||
      section === "roadmap" ||
      section === "roadmaps" ||
      contentType === "ROADMAP" ||
      itemType === "roadmap" ||
      collection === "studyroadmaps" ||
      Array.isArray(roadmap.days) ||
      roadmap.totalDays !== undefined ||
      roadmap.examType ||
      roadmap.startDate ||
      roadmap.endDate
  );
};

export const isPublishedRoadmapResource = (
  roadmap = {}
) =>
  normalizeText(roadmap.status || "published") ===
  "published";

export const normalizeRoadmapPrincipal = (
  principal = {}
) => {
  const uid = cleanString(
    principal.uid ||
      principal.userId ||
      principal.studentId
  );
  const email = normalizeText(
    principal.email ||
      principal.studentEmail ||
      principal.userEmail
  );
  const role = normalizeText(principal.role);

  return Object.freeze({
    uid,
    email,
    role,
    isAuthenticated:
      principal.isAuthenticated === true ||
      Boolean(uid || email),
    isAdmin:
      principal.isAdmin === true ||
      ["admin", "super_admin", "owner"].includes(
        role
      ),
  });
};

export const normalizeRoadmapAccessState = (
  access = {}
) => {
  const status = normalizeStatus(
    access.status ||
      access.state ||
      access.decision
  );

  if (ALLOWED_ACCESS_STATUSES.has(status)) {
    return ROADMAP_ACCESS_STATES.ALLOWED;
  }

  if (LOADING_ACCESS_STATUSES.has(status)) {
    return ROADMAP_ACCESS_STATES.LOADING;
  }

  if (ERROR_ACCESS_STATUSES.has(status)) {
    return ROADMAP_ACCESS_STATES.ERROR;
  }

  return ROADMAP_ACCESS_STATES.DENIED;
};

export const isRoadmapAccessBoundToResource = (
  access = {},
  roadmapId = ""
) => {
  const normalizedRoadmapId = cleanString(roadmapId);
  const resolvedResourceId = cleanString(
    access.resourceId ||
      access.itemId ||
      access.roadmapId
  );

  if (access.resolvedForResource === true) {
    return Boolean(
      normalizedRoadmapId &&
        resolvedResourceId === normalizedRoadmapId
    );
  }

  const scope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );
  const module = normalizeText(access.module);
  const itemType = normalizeText(access.itemType);
  const itemIds = cleanArray(
    access.resourceIds ||
      access.itemIds ||
      access.items
  );

  if (scope === "free" || scope === "plan") {
    return true;
  }

  if (scope === "module") {
    return !module || module === "roadmap";
  }

  if (scope === "item") {
    return Boolean(
      normalizedRoadmapId &&
        resolvedResourceId === normalizedRoadmapId &&
        (!module || module === "roadmap") &&
        (!itemType || itemType === "roadmap")
    );
  }

  if (scope === "bundle") {
    return Boolean(
      normalizedRoadmapId &&
        itemIds.includes(normalizedRoadmapId) &&
        (!module || module === "roadmap") &&
        (!itemType || itemType === "roadmap")
    );
  }

  return false;
};

export const buildRoadmapAccessEvidence = ({
  roadmap = null,
  user = null,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
  isLoading = false,
} = {}) => {
  const roadmapId = getRoadmapResourceId(
    roadmap || {}
  );
  const requiredPlan = getRoadmapRequiredPlan(
    roadmap || {}
  );

  if (isLoading || accessState?.loading === true) {
    return Object.freeze({
      status: "loading",
      sourceScope: "resolved",
      resourceId: roadmapId,
      resolvedForResource: false,
    });
  }

  if (
    accessState?.error ||
    accessState?.isAccessCheckUnavailable
  ) {
    return Object.freeze({
      status: "error",
      sourceScope: "resolved",
      resourceId: roadmapId,
      resolvedForResource: false,
    });
  }

  if (isAdmin) {
    return Object.freeze({
      status: "allowed",
      sourceScope: "admin",
      resourceId: roadmapId,
      resolvedForResource: true,
    });
  }

  if (!user) {
    return Object.freeze({
      status: "denied",
      sourceScope: "resolved",
      resourceId: roadmapId,
      resolvedForResource: false,
    });
  }

  const allowed =
    typeof hasPlanAccess === "function"
      ? Boolean(
          hasPlanAccess(requiredPlan, {
            module: "roadmap",
            itemType: "roadmap",
            itemId: roadmapId,
          })
        )
      : requiredPlan === "FREE";

  return Object.freeze({
    status: allowed ? "allowed" : "denied",
    sourceScope: "resolved",
    module: "roadmap",
    itemType: "roadmap",
    resourceId: roadmapId,
    resolvedForResource: allowed,
  });
};

const freezeDecision = ({
  action = "",
  decision = ROADMAP_DECISIONS.DENY,
  reason = ROADMAP_REASON_CODES.ACCESS_DENIED,
  roadmapId = "",
  requiredPlan = "FREE",
  sourceScope = "",
  exactItem = false,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
  canExposeCatalogMetadata = false,
  canOpen = false,
  canViewDay = false,
  canUpdateProgress = false,
} = {}) =>
  Object.freeze({
    action: normalizeAction(action),
    decision,
    allowed: decision === ROADMAP_DECISIONS.ALLOW,
    visible:
      decision === ROADMAP_DECISIONS.ALLOW ||
      decision === ROADMAP_DECISIONS.LOCKED_PREVIEW,
    locked:
      decision === ROADMAP_DECISIONS.LOCKED_PREVIEW,
    reason,
    roadmapId: cleanString(roadmapId),
    requiredPlan:
      cleanString(requiredPlan).toUpperCase() ||
      "FREE",
    sourceScope: normalizeScope(sourceScope),
    exactItem: Boolean(exactItem),
    requiresAuthentication: Boolean(
      requiresAuthentication
    ),
    requiresServerAuthorization: Boolean(
      requiresServerAuthorization
    ),
    canExposeCatalogMetadata: Boolean(
      canExposeCatalogMetadata
    ),
    canOpen: Boolean(canOpen),
    canViewDay: Boolean(canViewDay),
    canUpdateProgress: Boolean(
      canUpdateProgress
    ),
  });

const denied = ({
  action,
  reason,
  roadmapId,
  requiredPlan,
  sourceScope,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
} = {}) =>
  freezeDecision({
    action,
    reason,
    roadmapId,
    requiredPlan,
    sourceScope,
    requiresAuthentication,
    requiresServerAuthorization,
  });

export const buildRoadmapActionDecision = ({
  action = ROADMAP_ACTIONS.DISCOVER,
  roadmap = null,
  principal = {},
  access = {},
  discoveryMode =
    ROADMAP_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const normalizedAction = normalizeAction(action);
  const normalizedPrincipal =
    normalizeRoadmapPrincipal(principal);
  const roadmapId = getRoadmapResourceId(
    roadmap || {}
  );
  const requiredPlan = getRoadmapRequiredPlan(
    roadmap || {}
  );
  const sourceScope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );

  if (!KNOWN_ACTIONS.has(normalizedAction)) {
    return denied({
      action: normalizedAction,
      reason: ROADMAP_REASON_CODES.INVALID_ACTION,
      roadmapId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!roadmap || !roadmapId) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction ===
        ROADMAP_ACTIONS.DISCOVER
          ? ROADMAP_DECISIONS.HIDE
          : ROADMAP_DECISIONS.DENY,
      reason: ROADMAP_REASON_CODES.NOT_FOUND,
      roadmapId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!isRoadmapResource(roadmap)) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction ===
        ROADMAP_ACTIONS.DISCOVER
          ? ROADMAP_DECISIONS.HIDE
          : ROADMAP_DECISIONS.DENY,
      reason: ROADMAP_REASON_CODES.NOT_ROADMAP,
      roadmapId,
      requiredPlan,
      sourceScope,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    !isPublishedRoadmapResource(roadmap)
  ) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction ===
        ROADMAP_ACTIONS.DISCOVER
          ? ROADMAP_DECISIONS.HIDE
          : ROADMAP_DECISIONS.DENY,
      reason: ROADMAP_REASON_CODES.UNPUBLISHED,
      roadmapId,
      requiredPlan,
      sourceScope,
    });
  }

  const accessState =
    normalizeRoadmapAccessState(access);
  const accessIsBound =
    isRoadmapAccessBoundToResource(
      access,
      roadmapId
    );
  const hasAllowedAccess =
    normalizedPrincipal.isAdmin ||
    (accessState ===
      ROADMAP_ACCESS_STATES.ALLOWED &&
      accessIsBound);

  if (normalizedAction === ROADMAP_ACTIONS.DISCOVER) {
    if (
      discoveryMode ===
        ROADMAP_DISCOVERY_MODES.MY_ACCESS &&
      !hasAllowedAccess
    ) {
      return freezeDecision({
        action: normalizedAction,
        decision: ROADMAP_DECISIONS.HIDE,
        reason:
          accessState ===
          ROADMAP_ACCESS_STATES.LOADING
            ? ROADMAP_REASON_CODES.ACCESS_LOADING
            : accessState ===
                ROADMAP_ACCESS_STATES.ERROR
              ? ROADMAP_REASON_CODES.ACCESS_ERROR
              : ROADMAP_REASON_CODES.ACCESS_DENIED,
        roadmapId,
        requiredPlan,
        sourceScope,
      });
    }

    return freezeDecision({
      action: normalizedAction,
      decision: hasAllowedAccess
        ? ROADMAP_DECISIONS.ALLOW
        : ROADMAP_DECISIONS.LOCKED_PREVIEW,
      reason: hasAllowedAccess
        ? ROADMAP_REASON_CODES.ALLOWED
        : accessState ===
            ROADMAP_ACCESS_STATES.LOADING
          ? ROADMAP_REASON_CODES.ACCESS_LOADING
          : accessState ===
              ROADMAP_ACCESS_STATES.ERROR
            ? ROADMAP_REASON_CODES.ACCESS_ERROR
            : ROADMAP_REASON_CODES.ACCESS_DENIED,
      roadmapId,
      requiredPlan,
      sourceScope,
      exactItem:
        sourceScope === "item" && accessIsBound,
      canExposeCatalogMetadata: true,
    });
  }

  if (!normalizedPrincipal.isAuthenticated) {
    return denied({
      action: normalizedAction,
      reason: ROADMAP_REASON_CODES.LOGIN_REQUIRED,
      roadmapId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (accessState === ROADMAP_ACCESS_STATES.LOADING) {
    return denied({
      action: normalizedAction,
      reason: ROADMAP_REASON_CODES.ACCESS_LOADING,
      roadmapId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (accessState === ROADMAP_ACCESS_STATES.ERROR) {
    return denied({
      action: normalizedAction,
      reason: ROADMAP_REASON_CODES.ACCESS_ERROR,
      roadmapId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    accessState !== ROADMAP_ACCESS_STATES.ALLOWED
  ) {
    return denied({
      action: normalizedAction,
      reason: ROADMAP_REASON_CODES.ACCESS_DENIED,
      roadmapId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    !accessIsBound
  ) {
    return denied({
      action: normalizedAction,
      reason:
        ROADMAP_REASON_CODES.ACCESS_SCOPE_MISMATCH,
      roadmapId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  return freezeDecision({
    action: normalizedAction,
    decision: ROADMAP_DECISIONS.ALLOW,
    reason: ROADMAP_REASON_CODES.ALLOWED,
    roadmapId,
    requiredPlan,
    sourceScope:
      normalizedPrincipal.isAdmin
        ? "admin"
        : sourceScope,
    exactItem:
      sourceScope === "item" && accessIsBound,
    requiresAuthentication: true,
    requiresServerAuthorization: true,
    canOpen: normalizedAction === ROADMAP_ACTIONS.OPEN,
    canViewDay:
      normalizedAction === ROADMAP_ACTIONS.VIEW_DAY,
    canUpdateProgress:
      normalizedAction ===
      ROADMAP_ACTIONS.UPDATE_PROGRESS,
  });
};
