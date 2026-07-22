export const ROADMAP_LINKED_RESOURCE_TYPES =
  Object.freeze({
    NOTES: "notes",
    VIDEO: "video",
    LIVE: "live",
    MOCK_TEST: "mockTest",
    CURRENT_AFFAIRS: "currentAffairs",
  });

export const ROADMAP_LINKED_RESOURCE_ACTIONS =
  Object.freeze({
    OPEN: "OPEN",
  });

export const ROADMAP_LINKED_RESOURCE_REASON_CODES =
  Object.freeze({
    ALLOWED: "allowed",
    INVALID_ACTION: "invalid_action",
    NOT_FOUND: "not_found",
    UNSUPPORTED_RESOURCE: "unsupported_resource",
    LOGIN_REQUIRED: "login_required",
    ACCESS_LOADING: "access_loading",
    ACCESS_ERROR: "access_error",
    ACCESS_DENIED: "access_denied",
    ACCESS_SCOPE_MISMATCH: "access_scope_mismatch",
    TARGET_MISSING: "target_missing",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const normalizePlan = (value = "FREE") =>
  cleanString(value).toUpperCase() || "FREE";

const firstValue = (...values) =>
  values.map(cleanString).find(Boolean) || "";

const isExternalHref = (href = "") =>
  /^https?:\/\//i.test(cleanString(href));

const inferResourceType = (
  resource = {},
  requestedType = ""
) => {
  const explicit = normalizeText(
    requestedType ||
      resource.resourceType ||
      resource.type ||
      resource.kind ||
      resource.section ||
      resource.contentType ||
      resource.itemType
  );

  if (
    ["note", "notes", "notespdf"].includes(explicit)
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.NOTES;
  }

  if (
    ["video", "recordedvideo"].includes(explicit)
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.VIDEO;
  }

  if (
    ["live", "liveclass", "replay"].includes(explicit)
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.LIVE;
  }

  if (
    ["mock", "mocktest", "mocktests"].includes(explicit)
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.MOCK_TEST;
  }

  if (
    [
      "currentaffair",
      "currentaffairs",
      "currentaffairspdf",
    ].includes(explicit)
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES
      .CURRENT_AFFAIRS;
  }

  if (
    resource.liveUrl ||
    resource.joinUrl ||
    resource.liveClassId
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.LIVE;
  }

  if (
    resource.videoUrl ||
    resource.videoId ||
    resource.classId
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.VIDEO;
  }

  if (
    resource.mockId ||
    resource.mockTestId
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.MOCK_TEST;
  }

  if (
    resource.currentAffairsId ||
    resource.currentAffairId
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES
      .CURRENT_AFFAIRS;
  }

  if (
    resource.noteUrl ||
    resource.pdfUrl ||
    resource.noteId ||
    resource.notesId
  ) {
    return ROADMAP_LINKED_RESOURCE_TYPES.NOTES;
  }

  return "";
};

const getResourceTarget = (
  resource = {},
  type = ""
) => {
  if (type === ROADMAP_LINKED_RESOURCE_TYPES.NOTES) {
    const resourceId = firstValue(
      resource.noteId,
      resource.notesId,
      resource.resourceId,
      resource.itemId,
      resource.id,
      resource.noteUrl,
      resource.pdfUrl,
      resource.fileUrl
    );
    const href = firstValue(
      resource.href,
      resource.noteUrl,
      resource.pdfUrl,
      resource.fileUrl,
      resource.url
    );

    return {
      module: "notes",
      itemType: "notesPdf",
      resourceId,
      href,
    };
  }

  if (
    type === ROADMAP_LINKED_RESOURCE_TYPES.VIDEO ||
    type === ROADMAP_LINKED_RESOURCE_TYPES.LIVE
  ) {
    const resourceId = firstValue(
      resource.videoId,
      resource.liveClassId,
      resource.classId,
      resource.resourceId,
      resource.itemId,
      resource.id,
      resource.videoUrl,
      resource.liveUrl,
      resource.joinUrl
    );
    const href = firstValue(
      resource.href,
      resource.videoUrl,
      resource.liveUrl,
      resource.joinUrl,
      resource.replayUrl,
      resource.url
    );

    return {
      module: "video",
      itemType: "video",
      resourceId,
      href,
    };
  }

  if (
    type ===
    ROADMAP_LINKED_RESOURCE_TYPES.MOCK_TEST
  ) {
    const resourceId = firstValue(
      resource.mockId,
      resource.mockTestId,
      resource.resourceId,
      resource.itemId,
      resource.id
    );
    const href = firstValue(
      resource.href,
      resourceId
        ? `/ctet-tet/mock-tests/start/${encodeURIComponent(
            resourceId
          )}`
        : ""
    );

    return {
      module: "mockTest",
      itemType: "mockTest",
      resourceId,
      href,
    };
  }

  if (
    type ===
    ROADMAP_LINKED_RESOURCE_TYPES.CURRENT_AFFAIRS
  ) {
    const resourceId = firstValue(
      resource.currentAffairsId,
      resource.currentAffairId,
      resource.resourceId,
      resource.itemId,
      resource.id
    );
    const monthId = firstValue(
      resource.monthId,
      resource.monthSlug,
      resource.month
    );
    const href = firstValue(
      resource.href,
      monthId && resourceId
        ? `/ctet-tet/current-affairs/${encodeURIComponent(
            monthId
          )}/read/${encodeURIComponent(resourceId)}`
        : "",
      resource.pdfUrl,
      resource.fileUrl,
      resource.url
    );

    return {
      module: "currentAffairs",
      itemType: "currentAffairsPdf",
      resourceId,
      href,
    };
  }

  return {
    module: "",
    itemType: "",
    resourceId: "",
    href: "",
  };
};

export const normalizeRoadmapLinkedResource = ({
  resource = null,
  resourceType = "",
  parentPlanType = "FREE",
} = {}) => {
  const source =
    resource && typeof resource === "object"
      ? resource
      : {};
  const type = inferResourceType(
    source,
    resourceType
  );
  const target = getResourceTarget(source, type);
  const requiredPlan = normalizePlan(
    source.planCode ||
      source.planType ||
      source.requiredPlan ||
      source.accessPlan ||
      parentPlanType ||
      "FREE"
  );
  const title = firstValue(
    source.title,
    source.noteTitle,
    source.videoTitle,
    source.mockTestTitle,
    source.liveTitle,
    "Linked Resource"
  );

  return Object.freeze({
    type,
    module: target.module,
    itemType: target.itemType,
    resourceId: target.resourceId,
    requiredPlan,
    title,
    href: target.href,
    isExternal: isExternalHref(target.href),
  });
};

export const buildRoadmapLinkedResourceAccessEvidence = ({
  resource = null,
  resourceType = "",
  parentPlanType = "FREE",
  user = null,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
} = {}) => {
  const target = normalizeRoadmapLinkedResource({
    resource,
    resourceType,
    parentPlanType,
  });

  if (
    accessState?.loading === true
  ) {
    return Object.freeze({
      status: "loading",
      sourceScope: "resolved",
      module: target.module,
      itemType: target.itemType,
      resourceId: target.resourceId,
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
      module: target.module,
      itemType: target.itemType,
      resourceId: target.resourceId,
      resolvedForResource: false,
    });
  }

  if (isAdmin) {
    return Object.freeze({
      status: "allowed",
      sourceScope: "admin",
      module: target.module,
      itemType: target.itemType,
      resourceId: target.resourceId,
      resolvedForResource: true,
    });
  }

  if (!user) {
    return Object.freeze({
      status: "denied",
      sourceScope: "resolved",
      module: target.module,
      itemType: target.itemType,
      resourceId: target.resourceId,
      resolvedForResource: false,
    });
  }

  const allowed =
    Boolean(
      target.module &&
        target.itemType &&
        target.resourceId &&
        typeof hasPlanAccess === "function" &&
        hasPlanAccess(target.requiredPlan, {
          module: target.module,
          itemType: target.itemType,
          itemId: target.resourceId,
        })
    );

  return Object.freeze({
    status: allowed ? "allowed" : "denied",
    sourceScope: "resolved",
    module: target.module,
    itemType: target.itemType,
    resourceId: target.resourceId,
    resolvedForResource: allowed,
  });
};

const isAccessBoundToTarget = (
  access = {},
  target = {}
) =>
  Boolean(
    access.resolvedForResource === true &&
      cleanString(access.resourceId) ===
        cleanString(target.resourceId) &&
      cleanString(access.module) ===
        cleanString(target.module) &&
      cleanString(access.itemType) ===
        cleanString(target.itemType)
  );

export const buildRoadmapLinkedResourceDecision = ({
  action = ROADMAP_LINKED_RESOURCE_ACTIONS.OPEN,
  resource = null,
  resourceType = "",
  parentPlanType = "FREE",
  principal = {},
  access = {},
} = {}) => {
  const normalizedAction =
    cleanString(action).toUpperCase();
  const target = normalizeRoadmapLinkedResource({
    resource,
    resourceType,
    parentPlanType,
  });
  const isAuthenticated =
    principal.isAuthenticated === true ||
    Boolean(principal.uid || principal.email);
  const isAdmin =
    principal.isAdmin === true ||
    ["admin", "super_admin", "owner"].includes(
      cleanString(principal.role).toLowerCase()
    );
  const accessStatus = cleanString(
    access.status
  ).toLowerCase();

  const base = {
    action: normalizedAction,
    type: target.type,
    module: target.module,
    itemType: target.itemType,
    resourceId: target.resourceId,
    requiredPlan: target.requiredPlan,
    title: target.title,
    authorizedHref: "",
    isExternal: target.isExternal,
    canOpen: false,
    allowed: false,
    requiresAuthentication: true,
    requiresServerAuthorization: true,
  };

  if (
    normalizedAction !==
    ROADMAP_LINKED_RESOURCE_ACTIONS.OPEN
  ) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .INVALID_ACTION,
    });
  }

  if (!resource) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES.NOT_FOUND,
    });
  }

  if (!target.type || !target.module) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .UNSUPPORTED_RESOURCE,
    });
  }

  if (!target.resourceId || !target.href) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .TARGET_MISSING,
    });
  }

  if (!isAuthenticated && !isAdmin) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .LOGIN_REQUIRED,
    });
  }

  if (accessStatus === "loading") {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .ACCESS_LOADING,
    });
  }

  if (accessStatus === "error") {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .ACCESS_ERROR,
    });
  }

  if (
    !isAdmin &&
    accessStatus !== "allowed"
  ) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .ACCESS_DENIED,
    });
  }

  if (
    !isAdmin &&
    !isAccessBoundToTarget(access, target)
  ) {
    return Object.freeze({
      ...base,
      reason:
        ROADMAP_LINKED_RESOURCE_REASON_CODES
          .ACCESS_SCOPE_MISMATCH,
    });
  }

  return Object.freeze({
    ...base,
    allowed: true,
    reason:
      ROADMAP_LINKED_RESOURCE_REASON_CODES.ALLOWED,
    canOpen: true,
    authorizedHref: target.href,
  });
};
