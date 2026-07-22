export const CURRENT_AFFAIRS_ACTIONS = Object.freeze({
  DISCOVER: "DISCOVER",
  OPEN: "OPEN",
  READ: "READ",
  RESOLVE_ASSET: "RESOLVE_ASSET",
});

export const CURRENT_AFFAIRS_DECISIONS = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  HIDE: "hide",
  LOCKED_PREVIEW: "locked_preview",
});

export const CURRENT_AFFAIRS_REASON_CODES = Object.freeze({
  ALLOWED: "allowed",
  INVALID_ACTION: "invalid_action",
  NOT_FOUND: "not_found",
  NOT_CURRENT_AFFAIRS: "not_current_affairs",
  UNPUBLISHED: "unpublished",
  LOGIN_REQUIRED: "login_required",
  ACCESS_LOADING: "access_loading",
  ACCESS_ERROR: "access_error",
  ACCESS_DENIED: "access_denied",
  ACCESS_SCOPE_MISMATCH: "access_scope_mismatch",
  PROTECTED_ASSET_REQUIRED: "protected_asset_required",
});

export const CURRENT_AFFAIRS_DISCOVERY_MODES = Object.freeze({
  CATALOG: "catalog",
  MY_ACCESS: "my_access",
});

export const CURRENT_AFFAIRS_ACCESS_STATES = Object.freeze({
  ALLOWED: "allowed",
  DENIED: "denied",
  LOADING: "loading",
  ERROR: "error",
});

const KNOWN_ACTIONS = new Set(
  Object.values(CURRENT_AFFAIRS_ACTIONS)
);

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

export const getCurrentAffairsResourceId = (
  resource = {}
) =>
  cleanString(
    resource.id ||
      resource.resourceId ||
      resource.itemId ||
      resource.contentId ||
      resource.slug
  );

export const getCurrentAffairsRequiredPlan = (
  resource = {}
) =>
  cleanString(
    resource.planCode ||
      resource.planType ||
      resource.requiredPlan ||
      resource.accessPlan ||
      resource.plan ||
      resource.type ||
      "FREE"
  ).toUpperCase() || "FREE";

export const isCurrentAffairsResource = (
  resource = {}
) => {
  const section = normalizeText(resource.section);
  const source = normalizeText(resource.source);
  const contentType = cleanString(
    resource.contentType
  ).toUpperCase();
  const itemType = normalizeText(resource.itemType);

  return Boolean(
    section === "currentaffairs" ||
      section === "current-affairs" ||
      section === "current-affair" ||
      source === "currentaffairs" ||
      source === "current-affairs" ||
      contentType === "CURRENT_AFFAIRS" ||
      contentType === "CURRENT_AFFAIRS_PDF" ||
      itemType === "currentaffairspdf"
  );
};

export const isPublishedCurrentAffairsResource = (
  resource = {}
) =>
  normalizeText(resource.status || "published") ===
  "published";

export const hasCurrentAffairsProtectedAsset = (
  resource = {}
) =>
  resource.hasProtectedAsset === true ||
  Boolean(
    cleanString(
      resource.protectedAssetId || resource.assetId
    )
  );

export const normalizeCurrentAffairsPrincipal = (
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

export const normalizeCurrentAffairsAccessState = (
  access = {}
) => {
  const status = normalizeStatus(
    access.status ||
      access.state ||
      access.decision
  );

  if (ALLOWED_ACCESS_STATUSES.has(status)) {
    return CURRENT_AFFAIRS_ACCESS_STATES.ALLOWED;
  }

  if (LOADING_ACCESS_STATUSES.has(status)) {
    return CURRENT_AFFAIRS_ACCESS_STATES.LOADING;
  }

  if (ERROR_ACCESS_STATUSES.has(status)) {
    return CURRENT_AFFAIRS_ACCESS_STATES.ERROR;
  }

  return CURRENT_AFFAIRS_ACCESS_STATES.DENIED;
};

export const isCurrentAffairsAccessBoundToResource = (
  access = {},
  resourceId = ""
) => {
  const normalizedResourceId = cleanString(resourceId);
  const resolvedResourceId = cleanString(
    access.resourceId ||
      access.itemId ||
      access.currentAffairsId
  );

  if (access.resolvedForResource === true) {
    return Boolean(
      normalizedResourceId &&
        resolvedResourceId === normalizedResourceId
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
    return !module || module === "currentaffairs";
  }

  if (scope === "item") {
    return Boolean(
      normalizedResourceId &&
        resolvedResourceId === normalizedResourceId &&
        (!module || module === "currentaffairs") &&
        (!itemType ||
          itemType === "currentaffairspdf")
    );
  }

  if (scope === "bundle") {
    return Boolean(
      normalizedResourceId &&
        itemIds.includes(normalizedResourceId) &&
        (!module || module === "currentaffairs") &&
        (!itemType ||
          itemType === "currentaffairspdf")
    );
  }

  return false;
};

export const buildCurrentAffairsAccessEvidence = ({
  resource = null,
  user = null,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
  isLoading = false,
} = {}) => {
  const resourceId = getCurrentAffairsResourceId(
    resource || {}
  );
  const requiredPlan =
    getCurrentAffairsRequiredPlan(resource || {});

  if (isLoading || accessState?.loading === true) {
    return Object.freeze({
      status: "loading",
      sourceScope: "resolved",
      resourceId,
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
      resourceId,
      resolvedForResource: false,
    });
  }

  if (isAdmin) {
    return Object.freeze({
      status: "allowed",
      sourceScope: "admin",
      resourceId,
      resolvedForResource: true,
    });
  }

  if (!user) {
    return Object.freeze({
      status: "denied",
      sourceScope: "resolved",
      resourceId,
      resolvedForResource: false,
    });
  }

  const allowed =
    typeof hasPlanAccess === "function"
      ? Boolean(
          hasPlanAccess(requiredPlan, {
            module: "currentAffairs",
            itemType: "currentAffairsPdf",
            itemId: resourceId,
          })
        )
      : requiredPlan === "FREE";

  return Object.freeze({
    status: allowed ? "allowed" : "denied",
    sourceScope: "resolved",
    module: "currentAffairs",
    itemType: "currentAffairsPdf",
    resourceId,
    resolvedForResource: allowed,
  });
};

const freezeDecision = ({
  action = "",
  decision = CURRENT_AFFAIRS_DECISIONS.DENY,
  reason =
    CURRENT_AFFAIRS_REASON_CODES.ACCESS_DENIED,
  resourceId = "",
  requiredPlan = "FREE",
  sourceScope = "",
  exactItem = false,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
  canExposeCatalogMetadata = false,
  canOpen = false,
  canRead = false,
  canResolveAsset = false,
  legacySourceAllowed = false,
} = {}) =>
  Object.freeze({
    action: normalizeAction(action),
    decision,
    allowed:
      decision === CURRENT_AFFAIRS_DECISIONS.ALLOW,
    visible:
      decision ===
        CURRENT_AFFAIRS_DECISIONS.ALLOW ||
      decision ===
        CURRENT_AFFAIRS_DECISIONS.LOCKED_PREVIEW,
    locked:
      decision ===
      CURRENT_AFFAIRS_DECISIONS.LOCKED_PREVIEW,
    reason,
    resourceId: cleanString(resourceId),
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
    canRead: Boolean(canRead),
    canResolveAsset: Boolean(canResolveAsset),
    legacySourceAllowed: Boolean(
      legacySourceAllowed
    ),
    canExposeAssetUrl: false,
  });

const denied = ({
  action,
  reason,
  resourceId,
  requiredPlan,
  sourceScope,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
} = {}) =>
  freezeDecision({
    action,
    reason,
    resourceId,
    requiredPlan,
    sourceScope,
    requiresAuthentication,
    requiresServerAuthorization,
  });

export const buildCurrentAffairsActionDecision = ({
  action = CURRENT_AFFAIRS_ACTIONS.DISCOVER,
  resource = null,
  principal = {},
  access = {},
  discoveryMode =
    CURRENT_AFFAIRS_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const normalizedAction = normalizeAction(action);
  const normalizedPrincipal =
    normalizeCurrentAffairsPrincipal(principal);
  const resourceId = getCurrentAffairsResourceId(
    resource || {}
  );
  const requiredPlan =
    getCurrentAffairsRequiredPlan(resource || {});
  const sourceScope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );

  if (!KNOWN_ACTIONS.has(normalizedAction)) {
    return denied({
      action: normalizedAction,
      reason:
        CURRENT_AFFAIRS_REASON_CODES.INVALID_ACTION,
      resourceId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!resource || !resourceId) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction ===
        CURRENT_AFFAIRS_ACTIONS.DISCOVER
          ? CURRENT_AFFAIRS_DECISIONS.HIDE
          : CURRENT_AFFAIRS_DECISIONS.DENY,
      reason:
        CURRENT_AFFAIRS_REASON_CODES.NOT_FOUND,
      resourceId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!isCurrentAffairsResource(resource)) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction ===
        CURRENT_AFFAIRS_ACTIONS.DISCOVER
          ? CURRENT_AFFAIRS_DECISIONS.HIDE
          : CURRENT_AFFAIRS_DECISIONS.DENY,
      reason:
        CURRENT_AFFAIRS_REASON_CODES
          .NOT_CURRENT_AFFAIRS,
      resourceId,
      requiredPlan,
      sourceScope,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    !isPublishedCurrentAffairsResource(resource)
  ) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction ===
        CURRENT_AFFAIRS_ACTIONS.DISCOVER
          ? CURRENT_AFFAIRS_DECISIONS.HIDE
          : CURRENT_AFFAIRS_DECISIONS.DENY,
      reason:
        CURRENT_AFFAIRS_REASON_CODES.UNPUBLISHED,
      resourceId,
      requiredPlan,
      sourceScope,
    });
  }

  const accessState =
    normalizeCurrentAffairsAccessState(access);
  const accessIsBound =
    isCurrentAffairsAccessBoundToResource(
      access,
      resourceId
    );
  const hasAllowedAccess =
    normalizedPrincipal.isAdmin ||
    (accessState ===
      CURRENT_AFFAIRS_ACCESS_STATES.ALLOWED &&
      accessIsBound);

  if (
    normalizedAction ===
    CURRENT_AFFAIRS_ACTIONS.DISCOVER
  ) {
    if (
      discoveryMode ===
        CURRENT_AFFAIRS_DISCOVERY_MODES.MY_ACCESS &&
      !hasAllowedAccess
    ) {
      return freezeDecision({
        action: normalizedAction,
        decision: CURRENT_AFFAIRS_DECISIONS.HIDE,
        reason:
          accessState ===
          CURRENT_AFFAIRS_ACCESS_STATES.LOADING
            ? CURRENT_AFFAIRS_REASON_CODES
                .ACCESS_LOADING
            : accessState ===
                CURRENT_AFFAIRS_ACCESS_STATES.ERROR
              ? CURRENT_AFFAIRS_REASON_CODES
                  .ACCESS_ERROR
              : CURRENT_AFFAIRS_REASON_CODES
                  .ACCESS_DENIED,
        resourceId,
        requiredPlan,
        sourceScope,
      });
    }

    return freezeDecision({
      action: normalizedAction,
      decision: hasAllowedAccess
        ? CURRENT_AFFAIRS_DECISIONS.ALLOW
        : CURRENT_AFFAIRS_DECISIONS.LOCKED_PREVIEW,
      reason: hasAllowedAccess
        ? CURRENT_AFFAIRS_REASON_CODES.ALLOWED
        : accessState ===
            CURRENT_AFFAIRS_ACCESS_STATES.LOADING
          ? CURRENT_AFFAIRS_REASON_CODES
              .ACCESS_LOADING
          : accessState ===
              CURRENT_AFFAIRS_ACCESS_STATES.ERROR
            ? CURRENT_AFFAIRS_REASON_CODES
                .ACCESS_ERROR
            : CURRENT_AFFAIRS_REASON_CODES
                .ACCESS_DENIED,
      resourceId,
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
      reason:
        CURRENT_AFFAIRS_REASON_CODES.LOGIN_REQUIRED,
      resourceId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    accessState ===
    CURRENT_AFFAIRS_ACCESS_STATES.LOADING
  ) {
    return denied({
      action: normalizedAction,
      reason:
        CURRENT_AFFAIRS_REASON_CODES.ACCESS_LOADING,
      resourceId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    accessState ===
    CURRENT_AFFAIRS_ACCESS_STATES.ERROR
  ) {
    return denied({
      action: normalizedAction,
      reason:
        CURRENT_AFFAIRS_REASON_CODES.ACCESS_ERROR,
      resourceId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    accessState !==
      CURRENT_AFFAIRS_ACCESS_STATES.ALLOWED
  ) {
    return denied({
      action: normalizedAction,
      reason:
        CURRENT_AFFAIRS_REASON_CODES.ACCESS_DENIED,
      resourceId,
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
        CURRENT_AFFAIRS_REASON_CODES
          .ACCESS_SCOPE_MISMATCH,
      resourceId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    normalizedAction ===
      CURRENT_AFFAIRS_ACTIONS.RESOLVE_ASSET &&
    !hasCurrentAffairsProtectedAsset(resource)
  ) {
    return denied({
      action: normalizedAction,
      reason:
        CURRENT_AFFAIRS_REASON_CODES
          .PROTECTED_ASSET_REQUIRED,
      resourceId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  const protectedAsset =
    hasCurrentAffairsProtectedAsset(resource);

  return freezeDecision({
    action: normalizedAction,
    decision: CURRENT_AFFAIRS_DECISIONS.ALLOW,
    reason: CURRENT_AFFAIRS_REASON_CODES.ALLOWED,
    resourceId,
    requiredPlan,
    sourceScope: normalizedPrincipal.isAdmin
      ? "admin"
      : sourceScope,
    exactItem:
      sourceScope === "item" && accessIsBound,
    requiresAuthentication: true,
    requiresServerAuthorization: true,
    canOpen:
      normalizedAction ===
      CURRENT_AFFAIRS_ACTIONS.OPEN,
    canRead:
      normalizedAction ===
        CURRENT_AFFAIRS_ACTIONS.READ ||
      normalizedAction ===
        CURRENT_AFFAIRS_ACTIONS.RESOLVE_ASSET,
    canResolveAsset: protectedAsset,
    legacySourceAllowed: !protectedAsset,
  });
};
