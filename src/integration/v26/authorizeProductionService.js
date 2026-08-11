"use strict";

const RAW_CONTRACT = require(
  "./authorizeDecisionContract.json",
);

const CODES = Object.freeze({
  INVALID_REQUEST: "AUTHORIZE_INVALID_REQUEST",
  SESSION_READ_FAILED: "AUTHORIZE_SESSION_READ_FAILED",
  SESSION_INVALID: "AUTHORIZE_SESSION_INVALID",
  SESSION_MISMATCH: "AUTHORIZE_SESSION_MISMATCH",
  LOGIN_REQUIRED: "AUTHORIZE_LOGIN_REQUIRED",
  EMAIL_UNVERIFIED: "AUTHORIZE_EMAIL_UNVERIFIED",
  ACCESS_BLOCKED: "AUTHORIZE_ACCESS_BLOCKED",
  ROLE_INVALID: "AUTHORIZE_ROLE_INVALID",
  EXPERIENCE_BLOCKED: "AUTHORIZE_EXPERIENCE_BLOCKED",
  RESOURCE_READ_FAILED: "AUTHORIZE_RESOURCE_READ_FAILED",
  RESOURCE_INVALID: "AUTHORIZE_RESOURCE_INVALID",
  RESOURCE_LOCKED: "AUTHORIZE_RESOURCE_LOCKED",
  ACTION_UNKNOWN: "AUTHORIZE_ACTION_UNKNOWN",
  ACTION_MISMATCH: "AUTHORIZE_ACTION_MISMATCH",
  ENTITLEMENT_READ_FAILED: "AUTHORIZE_ENTITLEMENT_READ_FAILED",
  ENTITLEMENT_INVALID: "AUTHORIZE_ENTITLEMENT_INVALID",
  ENTITLEMENT_MISSING: "AUTHORIZE_ENTITLEMENT_MISSING",
  ENTITLEMENT_EXPIRED: "AUTHORIZE_ENTITLEMENT_EXPIRED",
  ENTITLEMENT_BLOCKED: "AUTHORIZE_ENTITLEMENT_BLOCKED",
  ALLOWED_FREE: "AUTHORIZE_ALLOWED_FREE",
  ALLOWED_ENTITLEMENT: "AUTHORIZE_ALLOWED_ENTITLEMENT",
  DEFAULT_LOCKED: "AUTHORIZE_DEFAULT_LOCKED",
});

const AUTH_CODES = Object.freeze({
  NOT_AUTHENTICATED: "AUTH_NOT_AUTHENTICATED",
  EMAIL_UNVERIFIED: "AUTH_EMAIL_UNVERIFIED",
  ROLE_INVALID: "AUTH_ROLE_INVALID",
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
const TYPE_SET = new Set(CONTRACT.canonicalTypes);
const PLAN_SET = new Set(CONTRACT.canonicalPlans);
const COLLECTION_SET = new Set(
  CONTRACT.canonicalCollections,
);
const LOCKED_PUBLISH_STATE_SET = new Set(
  CONTRACT.canonicalLockedPublishStates,
);
const OPEN_PUBLISH_STATE_SETS = Object.freeze(
  Object.fromEntries(
    Object.entries(
      CONTRACT.canonicalOpenPublishStatesByCollection,
    ).map(
      ([collection, states]) => [
        collection,
        new Set(states),
      ],
    ),
  ),
);
const AUTHENTICATED_ROLE_SET = new Set(
  CONTRACT.authenticatedRoles,
);
const ENTITLEMENT_STATE_SET = new Set(
  CONTRACT.entitlementDecisionStates,
);
const ENTITLEMENT_SCOPE_SET = new Set(
  CONTRACT.entitlementScopes,
);

function decision(
  state,
  code,
  message,
  fields = {},
) {
  const allowed = state === "allowed";

  return Object.freeze({
    ok: state !== "error",
    state,
    allowed,
    code,
    // ASPIRENEST_LP3_AUTHORIZE_OUTPUT_V2
    reasonCode: code,
    accessMode:
      allowed
        ? "open"
        : state === "expired"
          ? "expired"
          : state === "login_required"
            ? "login_required"
            : state === "error"
              ? "error"
              : "locked",
    message: String(message || code).slice(
      0,
      CONTRACT.maxLengths.message,
    ),
    resourceId:
      typeof fields.resourceId === "string"
        ? fields.resourceId
        : "",
    action:
      typeof fields.action === "string"
        ? fields.action
        : "",
    requiredPlan:
      typeof fields.requiredPlan === "string"
        ? fields.requiredPlan
        : "",
    requiredAccess:
      typeof fields.requiredAccess === "object"
      && fields.requiredAccess
        ? Object.freeze({ ...fields.requiredAccess })
        : (
          typeof fields.requiredPlan === "string"
          && fields.requiredPlan
            ? Object.freeze({
              scopeType: "PLAN",
              planCode: fields.requiredPlan,
            })
            : null
        ),
    matchedGrantId:
      typeof fields.matchedGrantId === "string"
        ? fields.matchedGrantId
        : null,
    matchedScope:
      typeof fields.matchedScope === "string"
        ? fields.matchedScope
        : null,
    expiresAt:
      typeof fields.expiresAt === "string"
        ? fields.expiresAt
        : null,
    retryable: false,
  });
}

function errorDecision(
  code,
  message,
  fields,
) {
  return decision(
    "error",
    code,
    message,
    fields,
  );
}

function lockedDecision(
  code,
  message,
  fields,
) {
  return decision(
    "locked",
    code,
    message,
    fields,
  );
}

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

  if (
    options.lowercase === true
  ) {
    return cleaned.toLowerCase();
  }

  if (
    options.uppercase === true
  ) {
    return cleaned.toUpperCase();
  }

  return cleaned;
}

function decodeFully(value) {
  let decoded = value;

  for (let pass = 0; pass < 6; pass += 1) {
    let next;

    try {
      next = decodeURIComponent(decoded);
    } catch (_) {
      return "";
    }

    if (next === decoded) {
      return decoded;
    }

    decoded = next;
  }

  try {
    return decodeURIComponent(decoded) === decoded
      ? decoded
      : "";
  } catch (_) {
    return "";
  }
}

function validResourceId(value) {
  const id = strictString(
    value,
    CONTRACT.maxLengths.resourceId,
  );

  if (!id) {
    return false;
  }

  const decoded = decodeFully(id);

  return Boolean(
    decoded
    && decoded.length <= CONTRACT.maxLengths.resourceId
    && !/[\/\\\u0000-\u001f\u007f]/.test(id)
    && !/[\/\\\u0000-\u001f\u007f]/.test(decoded)
    && ![".", ".."].includes(decoded),
  );
}

function normalizeExpiresAt(value) {
  const raw = strictString(
    value,
    CONTRACT.maxLengths.expiresAt,
  );

  if (!raw) {
    return "";
  }

  const milliseconds = Date.parse(raw);

  if (!Number.isFinite(milliseconds)) {
    return "";
  }

  return new Date(milliseconds).toISOString() === raw
    ? raw
    : "";
}

function canonicalPublishStateMatches(
  resultState,
  publishState,
  sourceCollection,
) {
  if (resultState === "locked") {
    return LOCKED_PUBLISH_STATE_SET.has(
      publishState,
    );
  }

  if (resultState !== "canonical_record") {
    return false;
  }

  const openStates =
    OPEN_PUBLISH_STATE_SETS[sourceCollection]
    || OPEN_PUBLISH_STATE_SETS.default;

  return Boolean(
    openStates
    && openStates.has(publishState),
  );
}

function normalizeCallerRequest(
  request,
  transport,
) {
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

  const resourceField = readOwnValue(
    request,
    "resource",
  );
  const actionField = readOwnValue(
    request,
    "action",
  );
  const sessionField = readOwnValue(
    request,
    "session",
  );

  if (
    !resourceField.ok
    || !actionField.ok
    || !sessionField.ok
    || !resourceField.present
    || !actionField.present
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const resource = resourceField.value;

  if (
    !resource
    || typeof resource !== "object"
    || Array.isArray(resource)
  ) {
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

  if (
    !idField.ok
    || !resourceIdField.ok
    || !typeField.ok
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const id = idField.present
    ? strictString(
      idField.value,
      CONTRACT.maxLengths.resourceId,
    )
    : "";
  const resourceId = resourceIdField.present
    ? strictString(
      resourceIdField.value,
      CONTRACT.maxLengths.resourceId,
    )
    : "";

  if (
    (idField.present && !id)
    || (resourceIdField.present && !resourceId)
    || (!id && !resourceId)
    || (id && resourceId && id !== resourceId)
  ) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  const canonicalId = id || resourceId;

  if (!validResourceId(canonicalId)) {
    return {
      ok: false,
      code: CODES.INVALID_REQUEST,
    };
  }

  let resourceTypeHint = "";

  if (typeField.present) {
    resourceTypeHint = strictString(
      typeField.value,
      CONTRACT.maxLengths.typeHint,
      {
        lowercase: true,
      },
    );

    if (
      !resourceTypeHint
      || !TYPE_SET.has(resourceTypeHint)
    ) {
      return {
        ok: false,
        code: CODES.INVALID_REQUEST,
      };
    }
  }

  const action = strictString(
    actionField.value,
    CONTRACT.maxLengths.action,
    {
      uppercase: true,
    },
  );

  if (!ACTION_SET.has(action)) {
    return {
      ok: false,
      code: CODES.ACTION_UNKNOWN,
    };
  }

  let callerUid = "";

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

    const uidField = readOwnValue(session, "uid");

    if (!uidField.ok) {
      return {
        ok: false,
        code: CODES.INVALID_REQUEST,
      };
    }

    if (uidField.present) {
      callerUid = strictString(
        uidField.value,
        CONTRACT.maxLengths.uid,
      );

      if (
        uidField.value !== ""
        && !callerUid
      ) {
        return {
          ok: false,
          code: CODES.INVALID_REQUEST,
        };
      }
    }
  }

  let signal = null;

  if (
    transport
    && typeof transport === "object"
    && !Array.isArray(transport)
  ) {
    const signalField = readOwnValue(
      transport,
      "signal",
    );

    if (!signalField.ok) {
      return {
        ok: false,
        code: CODES.INVALID_REQUEST,
      };
    }

    signal = signalField.present
      ? signalField.value
      : null;
  }

  return {
    ok: true,
    resourceId: canonicalId,
    resourceTypeHint,
    action,
    callerUid,
    signal,
  };
}

function normalizeStringArray(
  value,
  maxLength = 64,
) {
  if (!Array.isArray(value)) {
    return null;
  }

  const output = [];
  const seen = new Set();

  for (const item of value) {
    const normalized = strictString(
      item,
      maxLength,
      {
        lowercase: true,
      },
    );

    if (
      !normalized
      || seen.has(normalized)
    ) {
      return null;
    }

    seen.add(normalized);
    output.push(normalized);
  }

  return Object.freeze(output);
}

function normalizeAuthoritativeSession(result) {
  if (
    !result
    || typeof result !== "object"
    || Array.isArray(result)
  ) {
    return {
      ok: false,
      kind: "error",
      code: CODES.SESSION_INVALID,
    };
  }

  try {
    if (result.ok === false) {
      const authCode = strictString(
        result.code,
        CONTRACT.maxLengths.code,
      );

      if (authCode === AUTH_CODES.NOT_AUTHENTICATED) {
        return {
          ok: true,
          kind: "public",
          value: Object.freeze({
            ready: true,
            authenticated: false,
            accessAllowed: false,
            emailVerified: false,
            uid: "",
            role: "public",
            allowed: Object.freeze(["public"]),
            planType: "",
          }),
        };
      }

      if (authCode === AUTH_CODES.EMAIL_UNVERIFIED) {
        return {
          ok: false,
          kind: "locked",
          code: CODES.EMAIL_UNVERIFIED,
        };
      }

      if (authCode === AUTH_CODES.ROLE_INVALID) {
        return {
          ok: false,
          kind: "locked",
          code: CODES.ROLE_INVALID,
        };
      }

      return {
        ok: false,
        kind: "error",
        code: CODES.SESSION_READ_FAILED,
      };
    }

    const ready = result.ready;
    const authenticated = result.authenticated;
    const accessAllowed = result.accessAllowed;
    const emailVerified = result.emailVerified;
    const uid = strictString(
      result.uid,
      CONTRACT.maxLengths.uid,
    );
    const role = strictString(
      result.role,
      32,
      {
        lowercase: true,
      },
    );
    const allowed = normalizeStringArray(
      result.allowed,
    );
    const rawPlanType = result.planType;
    const planType = (
      rawPlanType == null
      || rawPlanType === ""
    )
      ? ""
      : strictString(
        rawPlanType,
        64,
        {
          uppercase: true,
        },
      );

    if (
      ready !== true
      || typeof authenticated !== "boolean"
      || typeof accessAllowed !== "boolean"
      || typeof emailVerified !== "boolean"
      || !role
      || !allowed
      || (
        rawPlanType != null
        && rawPlanType !== ""
        && !planType
      )
      || (
        planType
        && !PLAN_SET.has(planType)
      )
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.SESSION_INVALID,
      };
    }

    if (authenticated === false) {
      if (
        uid
        || role !== "public"
        || accessAllowed !== false
        || emailVerified !== false
        || allowed.length !== 1
        || allowed[0] !== "public"
      ) {
        return {
          ok: false,
          kind: "error",
          code: CODES.SESSION_INVALID,
        };
      }

      return {
        ok: true,
        kind: "public",
        value: Object.freeze({
          ready,
          authenticated,
          accessAllowed,
          emailVerified,
          uid: "",
          role,
          allowed,
          planType,
        }),
      };
    }

    if (
      !uid
      || !AUTHENTICATED_ROLE_SET.has(role)
      || emailVerified !== true
      || accessAllowed !== true
      || !allowed.includes("public")
    ) {
      return {
        ok: false,
        kind: "locked",
        code:
          emailVerified !== true
            ? CODES.EMAIL_UNVERIFIED
            : (
              !AUTHENTICATED_ROLE_SET.has(role)
                ? CODES.ROLE_INVALID
                : CODES.ACCESS_BLOCKED
            ),
      };
    }

    const roleExperienceMax = {
      student: new Set(["public", "student"]),
      mentor: new Set([
        "public",
        "student",
        "mentor",
      ]),
      admin: new Set([
        "public",
        "student",
        "mentor",
        "admin",
      ]),
    }[role];

    if (
      allowed.some(
        (experience) =>
          !roleExperienceMax.has(experience),
      )
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.SESSION_INVALID,
      };
    }

    return {
      ok: true,
      kind: "authenticated",
      value: Object.freeze({
        ready,
        authenticated,
        accessAllowed,
        emailVerified,
        uid,
        role,
        allowed,
        planType,
      }),
    };
  } catch (_) {
    return {
      ok: false,
      kind: "error",
      code: CODES.SESSION_INVALID,
    };
  }
}

function normalizeCanonicalResult(
  result,
  request,
) {
  if (
    !result
    || typeof result !== "object"
    || Array.isArray(result)
  ) {
    return {
      ok: false,
      kind: "error",
      code: CODES.RESOURCE_INVALID,
    };
  }

  try {
    if (
      result.state === "error"
      || result.ok === false
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.RESOURCE_READ_FAILED,
      };
    }

    if (
      result.ok !== true
      || !["canonical_record", "locked"].includes(
        result.state,
      )
      || !result.resource
      || typeof result.resource !== "object"
      || Array.isArray(result.resource)
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.RESOURCE_INVALID,
      };
    }

    const resource = result.resource;
    const id = strictString(
      resource.id,
      CONTRACT.maxLengths.resourceId,
    );
    const resourceId = strictString(
      resource.resourceId,
      CONTRACT.maxLengths.resourceId,
    );
    const type = strictString(
      resource.type,
      CONTRACT.maxLengths.typeHint,
      {
        lowercase: true,
      },
    );
    const section = strictString(
      resource.section,
      128,
      {
        lowercase: true,
      },
    );
    const requiredPlan = strictString(
      resource.requiredPlan,
      64,
      {
        uppercase: true,
      },
    );
    const publishState = strictString(
      resource.publishState,
      128,
      {
        lowercase: true,
      },
    );
    const canonicalRoute = strictString(
      resource.canonicalRoute,
      2048,
    );
    const sourceCollection = strictString(
      resource.sourceCollection,
      128,
    );

    if (
      !id
      || !resourceId
      || id !== resourceId
      || id !== request.resourceId
      || !validResourceId(id)
      || !TYPE_SET.has(type)
      || (
        request.resourceTypeHint
        && request.resourceTypeHint !== type
      )
      || !section
      || !PLAN_SET.has(requiredPlan)
      || !publishState
      || !canonicalRoute
      || !COLLECTION_SET.has(sourceCollection)
      || !canonicalPublishStateMatches(
        result.state,
        publishState,
        sourceCollection,
      )
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.RESOURCE_INVALID,
      };
    }

    const normalizedResource = Object.freeze({
      id,
      resourceId,
      type,
      section,
      requiredPlan,
      publishState,
      canonicalRoute,
      sourceCollection,
    });

    return {
      ok: true,
      kind:
        result.state === "locked"
          ? "locked"
          : "resolved",
      value: normalizedResource,
    };
  } catch (_) {
    return {
      ok: false,
      kind: "error",
      code: CODES.RESOURCE_INVALID,
    };
  }
}

function normalizeEntitlementDecision(
  result,
  principal,
  resource,
) {
  if (
    !result
    || typeof result !== "object"
    || Array.isArray(result)
  ) {
    return {
      ok: false,
      kind: "error",
      code: CODES.ENTITLEMENT_INVALID,
    };
  }

  try {
    const state = strictString(
      result.state,
      32,
      {
        lowercase: true,
      },
    );
    const allowed = result.allowed;
    const code = strictString(
      result.code,
      CONTRACT.maxLengths.code,
    );
    const principalUid = strictString(
      result.principalUid,
      CONTRACT.maxLengths.uid,
    );
    const resourceId = strictString(
      result.resourceId,
      CONTRACT.maxLengths.resourceId,
    );
    const requiredPlan = strictString(
      result.requiredPlan,
      64,
      {
        uppercase: true,
      },
    );
    const matchedGrantId =
      result.matchedGrantId == null
        ? ""
        : strictString(
          result.matchedGrantId,
          CONTRACT.maxLengths.grantId,
        );
    const matchedScope =
      result.matchedScope == null
        ? ""
        : strictString(
          result.matchedScope,
          CONTRACT.maxLengths.scope,
          {
            uppercase: true,
          },
        );
    const expiresAt =
      result.expiresAt == null
        ? ""
        : normalizeExpiresAt(
          result.expiresAt,
        );
    const expiresAtMilliseconds = expiresAt
      ? Date.parse(expiresAt)
      : null;
    const nowMilliseconds = Date.now();

    if (
      !ENTITLEMENT_STATE_SET.has(state)
      || typeof allowed !== "boolean"
      || !code
      || principalUid !== principal.uid
      || resourceId !== resource.resourceId
      || requiredPlan !== resource.requiredPlan
      || (
        result.matchedGrantId != null
        && !matchedGrantId
      )
      || (
        result.matchedScope != null
        && !ENTITLEMENT_SCOPE_SET.has(
          matchedScope,
        )
      )
      || (
        result.expiresAt != null
        && !expiresAt
      )
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.ENTITLEMENT_INVALID,
      };
    }

    if (
      state === "allowed"
      && (
        allowed !== true
        || !matchedGrantId
        || !ENTITLEMENT_SCOPE_SET.has(
          matchedScope,
        )
        || (
          expiresAtMilliseconds !== null
          && expiresAtMilliseconds <= nowMilliseconds
        )
      )
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.ENTITLEMENT_INVALID,
      };
    }

    if (
      state === "expired"
      && (
        allowed !== false
        || !matchedGrantId
        || !ENTITLEMENT_SCOPE_SET.has(
          matchedScope,
        )
        || !expiresAt
        || expiresAtMilliseconds > nowMilliseconds
      )
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.ENTITLEMENT_INVALID,
      };
    }

    if (
      ["locked", "error"].includes(state)
      && allowed !== false
    ) {
      return {
        ok: false,
        kind: "error",
        code: CODES.ENTITLEMENT_INVALID,
      };
    }

    return {
      ok: true,
      kind: state,
      value: Object.freeze({
        state,
        allowed,
        matchedGrantId,
        matchedScope,
        expiresAt,
      }),
    };
  } catch (_) {
    return {
      ok: false,
      kind: "error",
      code: CODES.ENTITLEMENT_INVALID,
    };
  }
}

function createAuthorizeProductionService(
  dependencies = {},
) {
  const {
    getAuthoritativeSession,
    getCanonicalResource,
    resolveEntitlementDecision,
  } = dependencies;

  if (
    typeof getAuthoritativeSession !== "function"
    || typeof getCanonicalResource !== "function"
    || typeof resolveEntitlementDecision !== "function"
  ) {
    throw new TypeError(
      "Authorize production service requires all "
        + "three authoritative dependencies.",
    );
  }

  async function authorize(
    request = {},
    transport = {},
  ) {
    const normalizedRequest = normalizeCallerRequest(
      request,
      transport,
    );

    if (!normalizedRequest.ok) {
      return errorDecision(
        normalizedRequest.code,
        "The authorization request is invalid.",
      );
    }

    const baseFields = {
      resourceId: normalizedRequest.resourceId,
      action: normalizedRequest.action,
    };

    let rawSession;

    try {
      rawSession = await getAuthoritativeSession({
        signal: normalizedRequest.signal,
      });
    } catch (_) {
      return errorDecision(
        CODES.SESSION_READ_FAILED,
        "The account session could not be verified.",
        baseFields,
      );
    }

    const sessionResult = normalizeAuthoritativeSession(
      rawSession,
    );

    if (!sessionResult.ok) {
      if (sessionResult.kind === "locked") {
        return lockedDecision(
          sessionResult.code,
          sessionResult.code === CODES.EMAIL_UNVERIFIED
            ? "Verify your email before continuing."
            : "This account cannot access the selected resource.",
          baseFields,
        );
      }

      return errorDecision(
        sessionResult.code,
        "The account session could not be verified.",
        baseFields,
      );
    }

    const authoritativeSession = sessionResult.value;

    if (
      normalizedRequest.callerUid
      && normalizedRequest.callerUid
        !== authoritativeSession.uid
    ) {
      return errorDecision(
        CODES.SESSION_MISMATCH,
        "The account session changed. Refresh and try again.",
        baseFields,
      );
    }

    let rawCanonical;

    try {
      rawCanonical = await getCanonicalResource({
        resourceId: normalizedRequest.resourceId,
        resourceTypeHint:
          normalizedRequest.resourceTypeHint,
        signal: normalizedRequest.signal,
      });
    } catch (_) {
      return errorDecision(
        CODES.RESOURCE_READ_FAILED,
        "The selected resource could not be verified.",
        baseFields,
      );
    }

    const canonicalResult = normalizeCanonicalResult(
      rawCanonical,
      normalizedRequest,
    );

    if (!canonicalResult.ok) {
      return errorDecision(
        canonicalResult.code,
        "The selected resource could not be verified.",
        baseFields,
      );
    }

    const resource = canonicalResult.value;
    const resourceFields = {
      ...baseFields,
      requiredPlan: resource.requiredPlan,
    };

    if (canonicalResult.kind === "locked") {
      return lockedDecision(
        CODES.RESOURCE_LOCKED,
        "This resource is not currently available.",
        resourceFields,
      );
    }

    const requiredAction =
      CONTRACT.typeActionMap[resource.type];

    if (
      !requiredAction
      || normalizedRequest.action !== requiredAction
    ) {
      return errorDecision(
        CODES.ACTION_MISMATCH,
        "The requested action does not match the resource.",
        resourceFields,
      );
    }

    if (sessionResult.kind === "public") {
      return decision(
        "login_required",
        CODES.LOGIN_REQUIRED,
        "Sign in to continue.",
        resourceFields,
      );
    }

    if (
      authoritativeSession.emailVerified !== true
      || authoritativeSession.accessAllowed !== true
    ) {
      return lockedDecision(
        authoritativeSession.emailVerified !== true
          ? CODES.EMAIL_UNVERIFIED
          : CODES.ACCESS_BLOCKED,
        "This account cannot access the selected resource.",
        resourceFields,
      );
    }

    if (
      !AUTHENTICATED_ROLE_SET.has(
        authoritativeSession.role,
      )
    ) {
      return lockedDecision(
        CODES.ROLE_INVALID,
        "This account role is not authorized.",
        resourceFields,
      );
    }

    if (
      !authoritativeSession.allowed.includes(
        CONTRACT.requiredExperience,
      )
    ) {
      return lockedDecision(
        CODES.EXPERIENCE_BLOCKED,
        "Student learning access is not enabled.",
        resourceFields,
      );
    }

    if (resource.requiredPlan === "FREE") {
      return decision(
        "allowed",
        CODES.ALLOWED_FREE,
        "Access granted.",
        resourceFields,
      );
    }

    const principal = Object.freeze({
      uid: authoritativeSession.uid,
      role: authoritativeSession.role,
      allowed: authoritativeSession.allowed,
      planType: authoritativeSession.planType,
    });
    const sessionProjection = Object.freeze({
      ready: authoritativeSession.ready,
      authenticated:
        authoritativeSession.authenticated,
      accessAllowed:
        authoritativeSession.accessAllowed,
      emailVerified:
        authoritativeSession.emailVerified,
      uid: authoritativeSession.uid,
      role: authoritativeSession.role,
      allowed: authoritativeSession.allowed,
      planType: authoritativeSession.planType,
    });

    let rawEntitlement;

    try {
      rawEntitlement =
        await resolveEntitlementDecision(
          Object.freeze({
            principal,
            action: normalizedRequest.action,
            resource,
            session: sessionProjection,
            signal: normalizedRequest.signal,
          }),
        );
    } catch (_) {
      return errorDecision(
        CODES.ENTITLEMENT_READ_FAILED,
        "Access could not be verified.",
        resourceFields,
      );
    }

    const entitlementResult =
      normalizeEntitlementDecision(
        rawEntitlement,
        principal,
        resource,
      );

    if (!entitlementResult.ok) {
      return errorDecision(
        entitlementResult.code,
        "Access could not be verified.",
        resourceFields,
      );
    }

    const entitlement = entitlementResult.value;
    const entitlementFields = {
      ...resourceFields,
      matchedGrantId:
        entitlement.matchedGrantId || null,
      matchedScope:
        entitlement.matchedScope || null,
      expiresAt:
        entitlement.expiresAt || null,
    };

    if (entitlementResult.kind === "allowed") {
      return decision(
        "allowed",
        CODES.ALLOWED_ENTITLEMENT,
        "Access granted.",
        entitlementFields,
      );
    }

    if (entitlementResult.kind === "expired") {
      return decision(
        "expired",
        CODES.ENTITLEMENT_EXPIRED,
        "Your access to this resource has expired.",
        entitlementFields,
      );
    }

    if (entitlementResult.kind === "locked") {
      return lockedDecision(
        CODES.ENTITLEMENT_BLOCKED,
        "Your current access does not include this resource.",
        entitlementFields,
      );
    }

    return errorDecision(
      CODES.ENTITLEMENT_READ_FAILED,
      "Access could not be verified.",
      entitlementFields,
    );
  }

  return Object.freeze({
    authorize,
  });
}

module.exports = Object.freeze({
  AUTHORIZE_DECISION_CONTRACT: CONTRACT,
  CODES,
  createAuthorizeProductionService,
});
