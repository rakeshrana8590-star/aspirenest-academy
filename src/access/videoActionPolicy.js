export const VIDEO_ACTIONS = Object.freeze({
  DISCOVER: "DISCOVER",
  OPEN: "OPEN",
  WATCH: "WATCH",
  JOIN_LIVE: "JOIN_LIVE",
  WATCH_REPLAY: "WATCH_REPLAY",
  RESOLVE_ASSET: "RESOLVE_ASSET",
});

export const VIDEO_DECISIONS = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  HIDE: "hide",
  LOCKED_PREVIEW: "locked_preview",
});

export const VIDEO_REASON_CODES = Object.freeze({
  ALLOWED: "allowed",
  INVALID_ACTION: "invalid_action",
  NOT_FOUND: "not_found",
  NOT_VIDEO: "not_video",
  UNPUBLISHED: "unpublished",
  LOGIN_REQUIRED: "login_required",
  ACCESS_LOADING: "access_loading",
  ACCESS_ERROR: "access_error",
  ACCESS_DENIED: "access_denied",
  ACCESS_SCOPE_MISMATCH: "access_scope_mismatch",
  LIVE_NOT_OPEN: "live_not_open",
  REPLAY_UNAVAILABLE: "replay_unavailable",
  PROTECTED_ASSET_REQUIRED: "protected_asset_required",
});

export const VIDEO_DISCOVERY_MODES = Object.freeze({
  CATALOG: "catalog",
  MY_ACCESS: "my_access",
});

export const VIDEO_ACCESS_STATES = Object.freeze({
  ALLOWED: "allowed",
  DENIED: "denied",
  LOADING: "loading",
  ERROR: "error",
});

export const VIDEO_LIVE_STATES = Object.freeze({
  JOIN_NOW: "JOIN_NOW",
  REPLAY_AVAILABLE: "REPLAY_AVAILABLE",
});

const KNOWN_ACTIONS = new Set(Object.values(VIDEO_ACTIONS));

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

const cleanString = (value = "") => String(value ?? "").trim();
const normalizeText = (value = "") => cleanString(value).toLowerCase();
const normalizeAction = (value = "") => cleanString(value).toUpperCase();
const normalizeStatus = (value = "") =>
  normalizeText(value).replace(/\s+/g, "_").replace(/-/g, "_");
const normalizeScope = (value = "") => normalizeText(value);
const normalizeLiveState = (value = "") =>
  cleanString(value).toUpperCase();

const cleanArray = (values = []) =>
  Object.freeze(
    Array.isArray(values)
      ? values.map(cleanString).filter(Boolean)
      : []
  );

export const getVideoResourceId = (video = {}) =>
  cleanString(
    video.id ||
      video.itemId ||
      video.contentId ||
      video.videoId ||
      video.classId ||
      video.slug
  );

export const getVideoRequiredPlan = (video = {}) =>
  cleanString(
    video.planCode ||
      video.planType ||
      video.requiredPlan ||
      video.accessPlan ||
      video.plan ||
      "FREE"
  ).toUpperCase() || "FREE";

export const isVideoResource = (video = {}) => {
  const section = normalizeText(video.section);
  const contentType = cleanString(video.contentType).toUpperCase();
  const classMode = cleanString(video.classMode || video.mode).toUpperCase();

  return Boolean(
    section === "recordedvideo" ||
      section === "video" ||
      section.includes("video") ||
      contentType === "VIDEO" ||
      classMode === "LIVE" ||
      classMode === "RECORDED" ||
      Boolean(
        video.videoUrl ||
          video.replayUrl ||
          video.recordingUrl ||
          video.joinUrl ||
          video.liveUrl ||
          video.fileUrl ||
          video.sourceUrl
      ) ||
      video.hasProtectedAsset === true ||
      cleanString(video.protectedAssetId || video.assetId)
  );
};

export const isPublishedVideoResource = (video = {}) =>
  normalizeText(video.status || "published") === "published";

export const hasVideoProtectedAsset = (video = {}) =>
  video.hasProtectedAsset === true ||
  Boolean(cleanString(video.protectedAssetId || video.assetId));

export const normalizeVideoPrincipal = (principal = {}) => {
  const uid = cleanString(
    principal.uid || principal.userId || principal.studentId
  );
  const email = normalizeText(
    principal.email || principal.studentEmail || principal.userEmail
  );
  const role = normalizeText(principal.role);

  return Object.freeze({
    uid,
    email,
    role,
    isAuthenticated:
      principal.isAuthenticated === true || Boolean(uid || email),
    isAdmin:
      principal.isAdmin === true ||
      ["admin", "super_admin", "owner"].includes(role),
  });
};

export const normalizeVideoAccessState = (access = {}) => {
  const status = normalizeStatus(
    access.status || access.state || access.decision
  );

  if (ALLOWED_ACCESS_STATUSES.has(status)) {
    return VIDEO_ACCESS_STATES.ALLOWED;
  }

  if (LOADING_ACCESS_STATUSES.has(status)) {
    return VIDEO_ACCESS_STATES.LOADING;
  }

  if (ERROR_ACCESS_STATUSES.has(status)) {
    return VIDEO_ACCESS_STATES.ERROR;
  }

  return VIDEO_ACCESS_STATES.DENIED;
};

export const isVideoAccessBoundToResource = (
  access = {},
  videoId = ""
) => {
  const normalizedVideoId = cleanString(videoId);
  const resolvedResourceId = cleanString(
    access.resourceId || access.itemId || access.videoId
  );

  if (access.resolvedForResource === true) {
    return Boolean(
      normalizedVideoId && resolvedResourceId === normalizedVideoId
    );
  }

  const scope = normalizeScope(
    access.sourceScope || access.scopeType || access.scope
  );
  const module = normalizeText(access.module);
  const itemType = normalizeText(access.itemType);
  const itemIds = cleanArray(
    access.resourceIds || access.itemIds || access.items
  );

  if (scope === "free" || scope === "plan") {
    return true;
  }

  if (scope === "module") {
    return !module || module === "video";
  }

  if (scope === "item") {
    return Boolean(
      normalizedVideoId &&
        resolvedResourceId === normalizedVideoId &&
        (!module || module === "video") &&
        (!itemType || itemType === "video")
    );
  }

  if (scope === "bundle") {
    return Boolean(
      normalizedVideoId &&
        itemIds.includes(normalizedVideoId) &&
        (!module || module === "video") &&
        (!itemType || itemType === "video")
    );
  }

  return false;
};

const freezeDecision = ({
  action = "",
  decision = VIDEO_DECISIONS.DENY,
  reason = VIDEO_REASON_CODES.ACCESS_DENIED,
  videoId = "",
  requiredPlan = "FREE",
  sourceScope = "",
  exactItem = false,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
  canExposeCatalogMetadata = false,
  canOpen = false,
  canWatch = false,
  canJoinLive = false,
  canWatchReplay = false,
  canResolveAsset = false,
  legacySourceAllowed = false,
} = {}) =>
  Object.freeze({
    action: normalizeAction(action),
    decision,
    allowed: decision === VIDEO_DECISIONS.ALLOW,
    visible:
      decision === VIDEO_DECISIONS.ALLOW ||
      decision === VIDEO_DECISIONS.LOCKED_PREVIEW,
    locked: decision === VIDEO_DECISIONS.LOCKED_PREVIEW,
    reason,
    videoId: cleanString(videoId),
    requiredPlan: cleanString(requiredPlan).toUpperCase() || "FREE",
    sourceScope: normalizeScope(sourceScope),
    exactItem: Boolean(exactItem),
    requiresAuthentication: Boolean(requiresAuthentication),
    requiresServerAuthorization: Boolean(requiresServerAuthorization),
    canExposeCatalogMetadata: Boolean(canExposeCatalogMetadata),
    canOpen: Boolean(canOpen),
    canWatch: Boolean(canWatch),
    canJoinLive: Boolean(canJoinLive),
    canWatchReplay: Boolean(canWatchReplay),
    canResolveAsset: Boolean(canResolveAsset),
    legacySourceAllowed: Boolean(legacySourceAllowed),
    canExposeAssetUrl: false,
  });

const denied = ({
  action,
  reason,
  videoId,
  requiredPlan,
  sourceScope,
  requiresAuthentication = false,
  requiresServerAuthorization = false,
} = {}) =>
  freezeDecision({
    action,
    reason,
    videoId,
    requiredPlan,
    sourceScope,
    requiresAuthentication,
    requiresServerAuthorization,
  });

export const buildVideoActionDecision = ({
  action = VIDEO_ACTIONS.DISCOVER,
  video = null,
  principal = {},
  access = {},
  discoveryMode = VIDEO_DISCOVERY_MODES.CATALOG,
  liveStatus = "",
} = {}) => {
  const normalizedAction = normalizeAction(action);
  const normalizedPrincipal = normalizeVideoPrincipal(principal);
  const videoId = getVideoResourceId(video || {});
  const requiredPlan = getVideoRequiredPlan(video || {});
  const sourceScope = normalizeScope(
    access.sourceScope || access.scopeType || access.scope
  );
  const normalizedLiveState = normalizeLiveState(liveStatus);

  if (!KNOWN_ACTIONS.has(normalizedAction)) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.INVALID_ACTION,
      videoId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!video || !videoId) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction === VIDEO_ACTIONS.DISCOVER
          ? VIDEO_DECISIONS.HIDE
          : VIDEO_DECISIONS.DENY,
      reason: VIDEO_REASON_CODES.NOT_FOUND,
      videoId,
      requiredPlan,
      sourceScope,
    });
  }

  if (!isVideoResource(video)) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction === VIDEO_ACTIONS.DISCOVER
          ? VIDEO_DECISIONS.HIDE
          : VIDEO_DECISIONS.DENY,
      reason: VIDEO_REASON_CODES.NOT_VIDEO,
      videoId,
      requiredPlan,
      sourceScope,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    !isPublishedVideoResource(video)
  ) {
    return freezeDecision({
      action: normalizedAction,
      decision:
        normalizedAction === VIDEO_ACTIONS.DISCOVER
          ? VIDEO_DECISIONS.HIDE
          : VIDEO_DECISIONS.DENY,
      reason: VIDEO_REASON_CODES.UNPUBLISHED,
      videoId,
      requiredPlan,
      sourceScope,
    });
  }

  const accessState = normalizeVideoAccessState(access);
  const accessIsBound = isVideoAccessBoundToResource(access, videoId);
  const hasAllowedAccess =
    normalizedPrincipal.isAdmin ||
    (accessState === VIDEO_ACCESS_STATES.ALLOWED && accessIsBound);

  if (normalizedAction === VIDEO_ACTIONS.DISCOVER) {
    if (
      discoveryMode === VIDEO_DISCOVERY_MODES.MY_ACCESS &&
      !hasAllowedAccess
    ) {
      return freezeDecision({
        action: normalizedAction,
        decision: VIDEO_DECISIONS.HIDE,
        reason:
          accessState === VIDEO_ACCESS_STATES.LOADING
            ? VIDEO_REASON_CODES.ACCESS_LOADING
            : accessState === VIDEO_ACCESS_STATES.ERROR
              ? VIDEO_REASON_CODES.ACCESS_ERROR
              : VIDEO_REASON_CODES.ACCESS_DENIED,
        videoId,
        requiredPlan,
        sourceScope,
      });
    }

    return freezeDecision({
      action: normalizedAction,
      decision: hasAllowedAccess
        ? VIDEO_DECISIONS.ALLOW
        : VIDEO_DECISIONS.LOCKED_PREVIEW,
      reason: hasAllowedAccess
        ? VIDEO_REASON_CODES.ALLOWED
        : accessState === VIDEO_ACCESS_STATES.LOADING
          ? VIDEO_REASON_CODES.ACCESS_LOADING
          : accessState === VIDEO_ACCESS_STATES.ERROR
            ? VIDEO_REASON_CODES.ACCESS_ERROR
            : VIDEO_REASON_CODES.ACCESS_DENIED,
      videoId,
      requiredPlan,
      sourceScope,
      exactItem: sourceScope === "item" && accessIsBound,
      canExposeCatalogMetadata: true,
    });
  }

  if (!normalizedPrincipal.isAuthenticated) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.LOGIN_REQUIRED,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (accessState === VIDEO_ACCESS_STATES.LOADING) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.ACCESS_LOADING,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (accessState === VIDEO_ACCESS_STATES.ERROR) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.ACCESS_ERROR,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    !normalizedPrincipal.isAdmin &&
    accessState !== VIDEO_ACCESS_STATES.ALLOWED
  ) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.ACCESS_DENIED,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (!normalizedPrincipal.isAdmin && !accessIsBound) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.ACCESS_SCOPE_MISMATCH,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    normalizedAction === VIDEO_ACTIONS.JOIN_LIVE &&
    normalizedLiveState !== VIDEO_LIVE_STATES.JOIN_NOW
  ) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.LIVE_NOT_OPEN,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    normalizedAction === VIDEO_ACTIONS.WATCH_REPLAY &&
    normalizedLiveState !==
      VIDEO_LIVE_STATES.REPLAY_AVAILABLE
  ) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.REPLAY_UNAVAILABLE,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  if (
    normalizedAction === VIDEO_ACTIONS.RESOLVE_ASSET &&
    !hasVideoProtectedAsset(video)
  ) {
    return denied({
      action: normalizedAction,
      reason: VIDEO_REASON_CODES.PROTECTED_ASSET_REQUIRED,
      videoId,
      requiredPlan,
      sourceScope,
      requiresAuthentication: true,
      requiresServerAuthorization: true,
    });
  }

  const protectedAsset = hasVideoProtectedAsset(video);

  return freezeDecision({
    action: normalizedAction,
    decision: VIDEO_DECISIONS.ALLOW,
    reason: VIDEO_REASON_CODES.ALLOWED,
    videoId,
    requiredPlan,
    sourceScope: normalizedPrincipal.isAdmin ? "admin" : sourceScope,
    exactItem: sourceScope === "item" && accessIsBound,
    requiresAuthentication: true,
    requiresServerAuthorization: true,
    canOpen: normalizedAction === VIDEO_ACTIONS.OPEN,
    canWatch:
      normalizedAction === VIDEO_ACTIONS.WATCH ||
      normalizedAction === VIDEO_ACTIONS.JOIN_LIVE ||
      normalizedAction === VIDEO_ACTIONS.WATCH_REPLAY ||
      normalizedAction === VIDEO_ACTIONS.RESOLVE_ASSET,
    canJoinLive:
      normalizedAction === VIDEO_ACTIONS.JOIN_LIVE,
    canWatchReplay:
      normalizedAction === VIDEO_ACTIONS.WATCH_REPLAY,
    canResolveAsset: protectedAsset,
    legacySourceAllowed: !protectedAsset,
  });
};
