import {
  NOTES_ACTIONS,
  NOTES_REASON_CODES,
} from "./notesActionPolicy";
import {
  buildNotesAssetRequest,
  buildNotesRuntimeDecision,
} from "./notesRuntimeAdapter";
import {
  requestNotesProtectedAsset,
} from "./notesAssetResolverClient";

export const NOTES_STUDENT_ASSET_ERROR_CODES =
  Object.freeze({
    LOGIN_REQUIRED: "notes/login-required",
    ACCESS_LOADING: "notes/access-loading",
    ACCESS_ERROR: "notes/access-error",
    ACCESS_DENIED: "notes/access-denied",
    ASSET_UNAVAILABLE: "notes/asset-unavailable",
    INVALID_SERVER_RESPONSE:
      "notes/invalid-server-response",
    SERVICE_UNAVAILABLE:
      "notes/service-unavailable",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeCode = (value = "") =>
  cleanString(value).toLowerCase();

const isHttpsUrl = (value = "") => {
  const url = cleanString(value);

  if (!url) return false;

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

const createRuntimeError = ({
  code,
  message,
  decision = null,
  cause = null,
} = {}) => {
  const error = new Error(message);
  error.code =
    code ||
    NOTES_STUDENT_ASSET_ERROR_CODES
      .SERVICE_UNAVAILABLE;
  error.decision = decision || null;

  if (cause) {
    error.cause = cause;
  }

  return error;
};

const errorFromDecision = (
  decision = null
) => {
  const reason = cleanString(
    decision?.reason
  ).toLowerCase();

  if (
    reason ===
    NOTES_REASON_CODES.LOGIN_REQUIRED
  ) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .LOGIN_REQUIRED,
      message:
        "Verified login is required before opening protected Notes.",
      decision,
    });
  }

  if (
    reason ===
    NOTES_REASON_CODES.ACCESS_LOADING
  ) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .ACCESS_LOADING,
      message:
        "Notes access verification is still in progress.",
      decision,
    });
  }

  if (
    reason ===
    NOTES_REASON_CODES.ACCESS_ERROR
  ) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .ACCESS_ERROR,
      message:
        "Notes access verification is currently unavailable.",
      decision,
    });
  }

  if (
    reason ===
      NOTES_REASON_CODES.NOT_FOUND ||
    reason ===
      NOTES_REASON_CODES.NOT_NOTES ||
    reason ===
      NOTES_REASON_CODES.UNPUBLISHED ||
    reason ===
      NOTES_REASON_CODES
        .PROTECTED_ASSET_REQUIRED
  ) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .ASSET_UNAVAILABLE,
      message:
        "Protected Notes asset is currently unavailable.",
      decision,
    });
  }

  return createRuntimeError({
    code:
      NOTES_STUDENT_ASSET_ERROR_CODES
        .ACCESS_DENIED,
    message:
      "Notes access is not available for this account.",
    decision,
  });
};

const normalizeResolverFailure = (
  error = null
) => {
  const code = normalizeCode(error?.code);

  if (code.includes("unauthenticated")) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .LOGIN_REQUIRED,
      message:
        "Verified login is required before opening protected Notes.",
      cause: error,
    });
  }

  if (
    code.includes("permission-denied") ||
    code.includes("access-denied")
  ) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .ACCESS_DENIED,
      message:
        "Notes access is not available for this account.",
      cause: error,
    });
  }

  if (
    code.includes("not-found") ||
    code.includes("failed-precondition") ||
    code.includes("invalid-server-response")
  ) {
    return createRuntimeError({
      code:
        NOTES_STUDENT_ASSET_ERROR_CODES
          .ASSET_UNAVAILABLE,
      message:
        "Protected Notes asset is currently unavailable.",
      cause: error,
    });
  }

  return createRuntimeError({
    code:
      NOTES_STUDENT_ASSET_ERROR_CODES
        .SERVICE_UNAVAILABLE,
    message:
      "Protected Notes service is currently unavailable. Please try again.",
    cause: error,
  });
};

export const buildStudentNotesRuntimeDecision = ({
  action = NOTES_ACTIONS.OPEN,
  note = null,
  user = null,
  accessProfile = {},
  planCatalog = [],
} = {}) =>
  buildNotesRuntimeDecision({
    action,
    note,
    user,
    role: "student",
    isAdminUser: false,
    accessProfile,
    planCatalog,
  });

export const resolveStudentNotesProtectedAsset =
  async ({
    action = NOTES_ACTIONS.OPEN,
    note = null,
    user = null,
    accessProfile = {},
    planCatalog = [],
    decision = null,
    resolver = requestNotesProtectedAsset,
  } = {}) => {
    const runtimeDecision =
      decision ||
      buildStudentNotesRuntimeDecision({
        action,
        note,
        user,
        accessProfile,
        planCatalog,
      });

    if (
      runtimeDecision?.allowed !== true ||
      runtimeDecision?.canResolveAsset !==
        true
    ) {
      throw errorFromDecision(
        runtimeDecision
      );
    }

    const resolverRequest =
      buildNotesAssetRequest({
        action,
        note,
        decision: runtimeDecision,
      });

    if (!resolverRequest) {
      throw createRuntimeError({
        code:
          NOTES_STUDENT_ASSET_ERROR_CODES
            .ASSET_UNAVAILABLE,
        message:
          "Protected Notes asset request is unavailable.",
        decision: runtimeDecision,
      });
    }

    let asset = null;

    try {
      asset = await resolver(
        resolverRequest
      );
    } catch (error) {
      throw normalizeResolverFailure(error);
    }

    if (
      asset?.authorized !== true ||
      asset?.source !==
        "server_authorized" ||
      cleanString(asset?.noteId) !==
        resolverRequest.noteId ||
      cleanString(asset?.action)
        .toUpperCase() !==
        resolverRequest.action ||
      !isHttpsUrl(asset?.assetUrl)
    ) {
      throw createRuntimeError({
        code:
          NOTES_STUDENT_ASSET_ERROR_CODES
            .INVALID_SERVER_RESPONSE,
        message:
          "Protected Notes authorization response is invalid.",
        decision: runtimeDecision,
      });
    }

    return Object.freeze({
      decision: runtimeDecision,
      resolverRequest,
      asset: Object.freeze({
        authorized: true,
        source: "server_authorized",
        noteId: cleanString(
          asset.noteId
        ),
        action: cleanString(
          asset.action
        ).toUpperCase(),
        assetUrl: cleanString(
          asset.assetUrl
        ),
        accessScope: cleanString(
          asset.accessScope
        ).toLowerCase(),
        serverNowMs: Number(
          asset.serverNowMs
        ),
        requestId: cleanString(
          asset.requestId
        ),
      }),
    });
  };

export const classifyStudentNotesRuntimeError = (
  error = null
) => {
  const code = normalizeCode(error?.code);

  if (
    code ===
    NOTES_STUDENT_ASSET_ERROR_CODES
      .LOGIN_REQUIRED
  ) {
    return Object.freeze({
      code,
      message:
        "Please login to open this protected Notes PDF.",
      requiresLogin: true,
      requiresUpgrade: false,
    });
  }

  if (
    code ===
      NOTES_STUDENT_ASSET_ERROR_CODES
        .ACCESS_DENIED
  ) {
    return Object.freeze({
      code,
      message:
        "This Notes PDF is not included in your current access.",
      requiresLogin: false,
      requiresUpgrade: true,
    });
  }

  if (
    code ===
      NOTES_STUDENT_ASSET_ERROR_CODES
        .ACCESS_LOADING
  ) {
    return Object.freeze({
      code,
      message:
        "Your Notes access is still being verified. Please try again.",
      requiresLogin: false,
      requiresUpgrade: false,
    });
  }

  if (
    code ===
      NOTES_STUDENT_ASSET_ERROR_CODES
        .ACCESS_ERROR ||
    code ===
      NOTES_STUDENT_ASSET_ERROR_CODES
        .SERVICE_UNAVAILABLE
  ) {
    return Object.freeze({
      code,
      message:
        "Protected Notes access is temporarily unavailable. Please try again.",
      requiresLogin: false,
      requiresUpgrade: false,
    });
  }

  return Object.freeze({
    code:
      code ||
      NOTES_STUDENT_ASSET_ERROR_CODES
        .ASSET_UNAVAILABLE,
    message:
      "Protected Notes PDF is currently unavailable.",
    requiresLogin: false,
    requiresUpgrade: false,
  });
};

export const getStudentNotesAccessPresentation = (
  decision = null
) => {
  if (
    decision?.allowed === true &&
    (
      decision?.canResolveAsset === true ||
      decision?.canReadAsset === true
    )
  ) {
    const nativeRead =
      decision?.canReadAsset === true &&
      decision?.canResolveAsset !== true;

    return Object.freeze({
      canOpen: true,
      disabled: false,
      busy: false,
      statusLabel: "Access ready",
      buttonLabel: nativeRead
        ? "Open IntelliText"
        : "Open PDF",
    });
  }

  const reason = cleanString(
    decision?.reason
  ).toLowerCase();

  if (
    reason ===
    NOTES_REASON_CODES.ACCESS_LOADING
  ) {
    return Object.freeze({
      canOpen: false,
      disabled: true,
      busy: true,
      statusLabel: "Checking access",
      buttonLabel: "Please wait",
    });
  }

  if (
    reason ===
      NOTES_REASON_CODES
        .PROTECTED_ASSET_REQUIRED ||
    reason ===
      NOTES_REASON_CODES
        .NATIVE_CONTENT_REQUIRED
  ) {
    return Object.freeze({
      canOpen: false,
      disabled: true,
      busy: false,
      statusLabel:
        reason === NOTES_REASON_CODES.NATIVE_CONTENT_REQUIRED
          ? "IntelliText conversion pending"
          : "PDF pending",
      buttonLabel: "Unavailable",
    });
  }

  if (
    reason ===
    NOTES_REASON_CODES.LOGIN_REQUIRED
  ) {
    return Object.freeze({
      canOpen: false,
      disabled: false,
      busy: false,
      statusLabel: "Login required",
      buttonLabel: "Login",
    });
  }

  if (
    reason ===
    NOTES_REASON_CODES.ACCESS_ERROR
  ) {
    return Object.freeze({
      canOpen: false,
      disabled: false,
      busy: false,
      statusLabel: "Access unavailable",
      buttonLabel: "Retry",
    });
  }

  return Object.freeze({
    canOpen: false,
    disabled: false,
    busy: false,
    statusLabel: "Plan locked",
    buttonLabel: "Unlock",
  });
};
