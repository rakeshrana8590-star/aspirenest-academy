export const NOTES_ACTIONS = Object.freeze({
  DISCOVER: "DISCOVER",
  OPEN: "OPEN",
  READ: "READ",
  DOWNLOAD: "DOWNLOAD",
});

export const NOTES_DECISIONS = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  HIDE: "hide",
  LOCKED_PREVIEW: "locked_preview",
});

export const NOTES_REASON_CODES = Object.freeze({
  ALLOWED: "allowed",
  INVALID_ACTION: "invalid_action",
  NOT_FOUND: "not_found",
  NOT_NOTES: "not_notes",
  UNPUBLISHED: "unpublished",
  LOGIN_REQUIRED: "login_required",
  ACCESS_LOADING: "access_loading",
  ACCESS_ERROR: "access_error",
  ACCESS_DENIED: "access_denied",
  ACCESS_SCOPE_MISMATCH: "access_scope_mismatch",
  PROTECTED_ASSET_REQUIRED: "protected_asset_required",
});

export const NOTES_DISCOVERY_MODES = Object.freeze({
  CATALOG: "catalog",
  MY_ACCESS: "my_access",
});

export const NOTES_ACCESS_STATES = Object.freeze({
  ALLOWED: "allowed",
  DENIED: "denied",
  LOADING: "loading",
  ERROR: "error",
});

const KNOWN_ACTIONS = new Set(
  Object.values(NOTES_ACTIONS)
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

const RAW_ASSET_FIELDS = Object.freeze([
  "pdf",
  "pdfUrl",
  "fileUrl",
  "videoUrl",
  "liveUrl",
  "joinUrl",
  "replayUrl",
  "sourceUrl",
  "downloadUrl",
  "assetUrl",
  "url",
  "urls",
  "asset",
  "protectedAsset",
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

const normalizeEmail = (value = "") =>
  normalizeText(value);

const cleanArray = (values = []) =>
  Object.freeze(
    Array.isArray(values)
      ? values
          .map(cleanString)
          .filter(Boolean)
      : []
  );

export const getNotesResourceId = (note = {}) =>
  cleanString(
    note.id ||
      note.itemId ||
      note.contentId ||
      note.noteId ||
      note.slug
  );

export const getNotesRequiredPlan = (note = {}) =>
  cleanString(
    note.planCode ||
      note.planType ||
      note.requiredPlan ||
      note.accessPlan ||
      note.plan ||
      "FREE"
  ).toUpperCase() || "FREE";

export const isPublishedNotesResource = (note = {}) =>
  normalizeText(note.section) === "notes" &&
  normalizeText(note.status) === "published";

export const hasNotesProtectedAsset = (note = {}) =>
  note.hasProtectedAsset === true ||
  Boolean(
    cleanString(
      note.protectedAssetId ||
        note.assetId
    )
  );

export const normalizeNotesPrincipal = (
  principal = {}
) => {
  const uid = cleanString(
    principal.uid ||
      principal.userId ||
      principal.studentId
  );
  const email = normalizeEmail(
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

export const normalizeNotesAccessState = (
  access = {}
) => {
  const status = normalizeStatus(
    access.status ||
      access.state ||
      access.decision
  );

  if (ALLOWED_ACCESS_STATUSES.has(status)) {
    return NOTES_ACCESS_STATES.ALLOWED;
  }

  if (LOADING_ACCESS_STATUSES.has(status)) {
    return NOTES_ACCESS_STATES.LOADING;
  }

  if (ERROR_ACCESS_STATUSES.has(status)) {
    return NOTES_ACCESS_STATES.ERROR;
  }

  return NOTES_ACCESS_STATES.DENIED;
};

export const isNotesAccessBoundToResource = (
  access = {},
  noteId = ""
) => {
  const normalizedNoteId = cleanString(noteId);
  const scope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );
  const module = normalizeText(access.module);
  const itemType = normalizeText(access.itemType);
  const itemId = cleanString(
    access.resourceId ||
      access.itemId ||
      access.noteId
  );
  const itemIds = cleanArray(
    access.resourceIds ||
      access.itemIds ||
      access.items
  );

  if (scope === "free" || scope === "plan") {
    return true;
  }

  if (scope === "module") {
    return !module || module === "notes";
  }

  if (scope === "item") {
    return Boolean(
      normalizedNoteId &&
        itemId === normalizedNoteId &&
        (!module || module === "notes") &&
        (!itemType || itemType === "notespdf")
    );
  }

  if (scope === "bundle") {
    return Boolean(
      normalizedNoteId &&
        itemIds.includes(normalizedNoteId) &&
        (!module || module === "notes") &&
        (!itemType || itemType === "notespdf")
    );
  }

  return false;
};

const freezeDecision = ({
  action = "",
  decision = NOTES_DECISIONS.DENY,
  reason = NOTES_REASON_CODES.ACCESS_DENIED,
  noteId = "",
  requiredPlan = "FREE",
  sourceScope = "",
  exactItem = false,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
  canExposeCatalogMetadata = false,
  canResolveAsset = false,
  canOpenAsset = false,
  canReadAsset = false,
  canDownloadAsset = false,
} = {}) =>
  Object.freeze({
    action: normalizeAction(action),
    decision,
    allowed: decision === NOTES_DECISIONS.ALLOW,
    visible:
      decision === NOTES_DECISIONS.ALLOW ||
      decision === NOTES_DECISIONS.LOCKED_PREVIEW,
    locked:
      decision === NOTES_DECISIONS.LOCKED_PREVIEW,
    reason,
    noteId: cleanString(noteId),
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
    canResolveAsset: Boolean(canResolveAsset),
    canOpenAsset: Boolean(canOpenAsset),
    canReadAsset: Boolean(canReadAsset),
    canDownloadAsset: Boolean(canDownloadAsset),
    canExposeAssetUrl: false,
  });

const buildDeniedDecision = ({
  action,
  reason,
  noteId,
  requiredPlan,
  sourceScope,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
} = {}) =>
  freezeDecision({
    action,
    reason,
    noteId,
    requiredPlan,
    sourceScope,
    requiresAuthentication,
    requiresServerAuthorization,
  });

export const buildNotesActionDecision = ({
  action = NOTES_ACTIONS.DISCOVER,
  note = null,
  principal = {},
  access = {},
  discoveryMode = NOTES_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const normalizedAction = normalizeAction(action);
  const normalizedPrincipal =
    normalizeNotesPrincipal(principal);
  const noteId = getNotesResourceId(note || {});
  const requiredPlan = getNotesRequiredPlan(
    note || {}
  );
  const sourceScope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );

  if (!KNOWN_ACTIONS.has(normalizedAction)) {
    return buildDeniedDecision({
      action: normalizedAction,
      reason: NOTES_REASON_CODES.INVALID_ACTION,
      noteId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!note || !noteId) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction === NOTES_ACTIONS.DISCOVER
          ? NOTES_DECISIONS.HIDE
          : NOTES_DECISIONS.DENY,
      reason: NOTES_REASON_CODES.NOT_FOUND,
      noteId,
      requiredPlan,
      sourceScope,
    });
  }

  if (normalizeText(note.section) !== "notes") {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction === NOTES_ACTIONS.DISCOVER
          ? NOTES_DECISIONS.HIDE
          : NOTES_DECISIONS.DENY,
      reason: NOTES_REASON_CODES.NOT_NOTES,
      noteId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!isPublishedNotesResource(note)) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction === NOTES_ACTIONS.DISCOVER
          ? NOTES_DECISIONS.HIDE
          : NOTES_DECISIONS.DENY,
      reason: NOTES_REASON_CODES.UNPUBLISHED,
      noteId,
      requiredPlan,
      sourceScope,
    });
  }

  const accessState = normalizeNotesAccessState(
    access
  );
  const accessIsBound =
    isNotesAccessBoundToResource(
      access,
      noteId
    );
  const hasAllowedAccess =
    normalizedPrincipal.isAdmin ||
    (accessState === NOTES_ACCESS_STATES.ALLOWED &&
      accessIsBound);

  if (normalizedAction === NOTES_ACTIONS.DISCOVER) {
    if (
      discoveryMode === NOTES_DISCOVERY_MODES.MY_ACCESS &&
      !hasAllowedAccess
    ) {
      return freezeDecision({
        action: normalizedAction,
        decision: NOTES_DECISIONS.HIDE,
        reason:
          accessState === NOTES_ACCESS_STATES.LOADING
            ? NOTES_REASON_CODES.ACCESS_LOADING
            : accessState === NOTES_ACCESS_STATES.ERROR
              ? NOTES_REASON_CODES.ACCESS_ERROR
              : NOTES_REASON_CODES.ACCESS_DENIED,
        noteId,
        requiredPlan,
        sourceScope,
      });
    }

    return freezeDecision({
      action: normalizedAction,
      decision: hasAllowedAccess
        ? NOTES_DECISIONS.ALLOW
        : NOTES_DECISIONS.LOCKED_PREVIEW,
      reason: hasAllowedAccess
        ? NOTES_REASON_CODES.ALLOWED
        : accessState === NOTES_ACCESS_STATES.LOADING
          ? NOTES_REASON_CODES.ACCESS_LOADING
          : accessState === NOTES_ACCESS_STATES.ERROR
            ? NOTES_REASON_CODES.ACCESS_ERROR
            : NOTES_REASON_CODES.ACCESS_DENIED,
      noteId,
      requiredPlan,
      sourceScope,
      exactItem:
        sourceScope === "item" &&
        accessIsBound,
      canExposeCatalogMetadata: true,
    });
  }

  if (!normalizedPrincipal.isAuthenticated) {
    return buildDeniedDecision({
      action: normalizedAction,
      reason: NOTES_REASON_CODES.LOGIN_REQUIRED,
      noteId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (accessState === NOTES_ACCESS_STATES.LOADING) {
    return buildDeniedDecision({
      action: normalizedAction,
      reason: NOTES_REASON_CODES.ACCESS_LOADING,
      noteId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (accessState === NOTES_ACCESS_STATES.ERROR) {
    return buildDeniedDecision({
      action: normalizedAction,
      reason: NOTES_REASON_CODES.ACCESS_ERROR,
      noteId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    accessState !== NOTES_ACCESS_STATES.ALLOWED
  ) {
    return buildDeniedDecision({
      action: normalizedAction,
      reason: NOTES_REASON_CODES.ACCESS_DENIED,
      noteId,
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
    return buildDeniedDecision({
      action: normalizedAction,
      reason:
        NOTES_REASON_CODES.ACCESS_SCOPE_MISMATCH,
      noteId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (!hasNotesProtectedAsset(note)) {
    return buildDeniedDecision({
      action: normalizedAction,
      reason:
        NOTES_REASON_CODES.PROTECTED_ASSET_REQUIRED,
      noteId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  return freezeDecision({
    action: normalizedAction,
    decision: NOTES_DECISIONS.ALLOW,
    reason: NOTES_REASON_CODES.ALLOWED,
    noteId,
    requiredPlan,
    sourceScope:
      normalizedPrincipal.isAdmin
        ? "admin"
        : sourceScope,
    exactItem:
      sourceScope === "item" &&
      accessIsBound,
    requiresAuthentication: true,
    requiresServerAuthorization: true,
    canResolveAsset: true,
    canOpenAsset:
      normalizedAction === NOTES_ACTIONS.OPEN,
    canReadAsset:
      normalizedAction === NOTES_ACTIONS.READ,
    canDownloadAsset:
      normalizedAction === NOTES_ACTIONS.DOWNLOAD,
  });
};

const PUBLIC_NOTE_FIELDS = Object.freeze([
  "id",
  "itemId",
  "contentId",
  "slug",
  "title",
  "description",
  "section",
  "status",
  "contentType",
  "itemType",
  "planCode",
  "planType",
  "requiredPlan",
  "accessPlan",
  "accessRank",
  "productId",
  "subject",
  "subjectName",
  "subjectTitle",
  "subjectSlug",
  "chapter",
  "chapterName",
  "chapterSlug",
  "topic",
  "topicName",
  "topicSlug",
  "category",
  "pages",
  "cover",
  "route",
  "hasProtectedAsset",
]);

export const stripNotesRawAssetFields = (
  note = {}
) => {
  const publicNote = {};

  PUBLIC_NOTE_FIELDS.forEach((fieldName) => {
    if (
      Object.prototype.hasOwnProperty.call(
        note,
        fieldName
      )
    ) {
      publicNote[fieldName] = note[fieldName];
    }
  });

  RAW_ASSET_FIELDS.forEach((fieldName) => {
    delete publicNote[fieldName];
  });

  return Object.freeze({
    ...publicNote,
    id: getNotesResourceId(note),
    planType: getNotesRequiredPlan(note),
    hasProtectedAsset:
      hasNotesProtectedAsset(note),
  });
};

export const buildNotesCatalogProjection = ({
  note = null,
  decision = null,
} = {}) => {
  if (!note || decision?.visible !== true) {
    return null;
  }

  return Object.freeze({
    ...stripNotesRawAssetFields(note),
    accessDecision: decision.decision,
    accessReason: decision.reason,
    locked: decision.locked === true,
    canOpen: decision.allowed === true,
  });
};
