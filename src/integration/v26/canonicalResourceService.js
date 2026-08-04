"use strict";

const RAW_CONTRACT = require("./canonicalResourceContract.json");

const CODES = Object.freeze({
  INVALID_REQUEST: "CANONICAL_RESOURCE_INVALID_REQUEST",
  READ_FAILED: "CANONICAL_RESOURCE_READ_FAILED",
  NOT_FOUND: "CANONICAL_RESOURCE_NOT_FOUND",
  AMBIGUOUS: "CANONICAL_RESOURCE_ID_AMBIGUOUS",
  ID_MISMATCH: "CANONICAL_RESOURCE_ID_MISMATCH",
  TYPE_UNKNOWN: "CANONICAL_RESOURCE_TYPE_UNKNOWN",
  TYPE_MISMATCH: "CANONICAL_RESOURCE_TYPE_MISMATCH",
  SECTION_UNKNOWN: "CANONICAL_RESOURCE_SECTION_UNKNOWN",
  SECTION_MISMATCH: "CANONICAL_RESOURCE_SECTION_MISMATCH",
  STATUS_UNKNOWN: "CANONICAL_RESOURCE_STATUS_UNKNOWN",
  PLAN_UNKNOWN: "CANONICAL_RESOURCE_PLAN_UNKNOWN",
  PLAN_MISSING: "CANONICAL_RESOURCE_PLAN_MISSING",
  PLAN_CONFLICT: "CANONICAL_RESOURCE_PLAN_CONFLICT",
  PREMIUM_FLAG_CONFLICT: "CANONICAL_RESOURCE_PREMIUM_FLAG_CONFLICT",
  ROUTE_INVALID: "CANONICAL_RESOURCE_ROUTE_INVALID",
  TARGET_INVALID: "CANONICAL_RESOURCE_TARGET_INVALID",
  TARGET_CONFLICT: "CANONICAL_RESOURCE_TARGET_CONFLICT",
  LOCKED: "CANONICAL_RESOURCE_LOCKED",
  RESOLVED: "CANONICAL_RESOURCE_RESOLVED",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
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

const TYPE_SET = new Set(CONTRACT.types);
const PLAN_SET = new Set(CONTRACT.plans);
const LOCKED_STATE_SET = new Set(CONTRACT.lockedStates);
const REPLAY_STATE_SET = new Set(CONTRACT.replayStates);

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function normalizeToken(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function validResourceId(
  value,
  maxLength = CONTRACT.identityPolicy.maxLength,
) {
  if (typeof value !== "string") {
    return false;
  }

  const id = clean(value);
  const decoded = decodeRoutePath(id);

  return Boolean(
    id
    && id.length <= maxLength
    && decoded
    && decoded.length <= maxLength
    && !/[\/\\\u0000-\u001f\u007f]/.test(id)
    && !/[\/\\\u0000-\u001f\u007f]/.test(decoded)
    && ![".", ".."].includes(decoded),
  );
}

function definedValues(record, fields) {
  const values = [];

  for (const field of fields) {
    const value = record[field];

    if (
      value !== undefined
      && value !== null
      && clean(value)
    ) {
      values.push({
        field,
        value,
      });
    }
  }

  return values;
}

function firstDefined(record, fields) {
  const values = definedValues(record, fields);
  return values.length ? values[0].value : undefined;
}

function normalizeTypeAlias(value) {
  const token = normalizeToken(value);

  if (!token) {
    return "";
  }

  const type = CONTRACT.typeAliases[token] || "";

  return TYPE_SET.has(type) ? type : "";
}

function statusTokens(record) {
  return definedValues(
    record,
    CONTRACT.fieldPriority.publishState,
  ).map((item) => normalizeToken(item.value));
}

function hasReplaySignal(record) {
  return Boolean(clean(record.replayUrl))
    || statusTokens(record).some(
      (state) => REPLAY_STATE_SET.has(state),
    );
}

function resolveTypeCandidates(record, fields) {
  const known = [];
  const unknown = [];

  for (const item of definedValues(record, fields)) {
    const type = normalizeTypeAlias(item.value);

    if (type) {
      known.push({ field: item.field, type });
    } else {
      unknown.push({
        field: item.field,
        value: clean(item.value).slice(0, 128),
      });
    }
  }

  return {
    known,
    unknown,
  };
}

function inferredTypeFromRecord(record) {
  const route = clean(
    firstDefined(record, CONTRACT.fieldPriority.route),
  ).toLowerCase();

  if (route.includes("/mock-tests/")) return "test";
  if (route.includes("/current-affairs/")) return "current-affairs";
  if (route.includes("/videos/")) return "video";
  if (route.includes("/roadmaps/")) return "roadmap";
  if (route.includes("/notes/")) return "note";
  if (clean(record.mockTestId || record.testId)) return "test";
  if (clean(record.videoId || record.videoUrl || record.youtubeUrl)) return "video";
  if (clean(record.roadmapId) || Array.isArray(record.days)) return "roadmap";
  if (clean(record.replayUrl)) return "replay";
  if (clean(record.joinUrl || record.meetingUrl)) return "live";
  if (clean(record.textbookId || record.intelliTextId || record.learningTextId)) return "note";

  return "";
}

function resolveCanonicalType(record, collection) {
  const ownerResult = resolveTypeCandidates(
    record,
    [
      "section",
      "contentSection",
      "module",
      "moduleKey",
    ],
  );
  const explicitResult = resolveTypeCandidates(
    record,
    [
      "resourceType",
      "contentType",
      "itemType",
      "type",
      "eventType",
      "sourceType",
    ],
  );

  if (ownerResult.unknown.length || explicitResult.unknown.length) {
    return {
      ok: false,
      code: CODES.TYPE_UNKNOWN,
    };
  }

  const combined = [
    ...new Set([
      ...ownerResult.known.map((item) => item.type),
      ...explicitResult.known.map((item) => item.type),
    ]),
  ];

  const collectionPolicy = (
    CONTRACT.collectionTypePolicy[collection]
    || {}
  );
  const allowedTypes = Array.isArray(
    collectionPolicy.allowedTypes,
  )
    ? collectionPolicy.allowedTypes
    : CONTRACT.types;
  const defaultType = clean(
    collectionPolicy.defaultType,
  );

  if (
    combined.some(
      (type) => !allowedTypes.includes(type),
    )
  ) {
    return {
      ok: false,
      code: CODES.TYPE_MISMATCH,
    };
  }

  const liveFamilyOnly = (
    combined.length > 1
    && combined.every(
      (type) => type === "live" || type === "replay",
    )
  );

  if (combined.length > 1 && !liveFamilyOnly) {
    return {
      ok: false,
      code: CODES.TYPE_MISMATCH,
    };
  }

  let type = combined[0] || "";

  if (collection === "studyRoadmaps") {
    type = type || defaultType || "roadmap";
  } else if (collection === "mentorLiveSessions") {
    type = type || defaultType || "live";

    if (
      (type === "live" || type === "replay")
      && hasReplaySignal(record)
    ) {
      type = "replay";
    }
  } else {
    type = type || inferredTypeFromRecord(record);
  }

  if (collection === "experienceEvents") {
    if (!type) {
      const rawEventType = normalizeToken(
        firstDefined(
          record,
          ["type", "eventType", "sourceType"],
        ),
      );
      const liveLike = CONTRACT.liveLikeTokens.some(
        (token) => rawEventType.includes(token),
      );

      if (liveLike) {
        type = "live";
      }
    }

    if (!allowedTypes.includes(type)) {
      return {
        ok: false,
        code: CODES.TYPE_UNKNOWN,
      };
    }
  }

  if (
    (type === "live" || type === "replay")
    && hasReplaySignal(record)
  ) {
    type = "replay";
  }

  return TYPE_SET.has(type)
    ? {
      ok: true,
      type,
    }
    : {
      ok: false,
      code: CODES.TYPE_UNKNOWN,
    };
}

function normalizeSection(record, type, collection) {
  const canonicalSection = CONTRACT.sectionByType[type] || "";

  if (!canonicalSection) {
    return {
      ok: false,
      code: CODES.SECTION_UNKNOWN,
    };
  }

  const sectionValues = definedValues(
    record,
    CONTRACT.fieldPriority.section,
  );

  if (!sectionValues.length) {
    return {
      ok: true,
      value: canonicalSection,
    };
  }

  for (const item of sectionValues) {
    const sectionToken = normalizeToken(item.value);
    const sectionType = CONTRACT.sectionAliases[sectionToken]
      || normalizeTypeAlias(item.value);

    if (!sectionType) {
      return {
        ok: false,
        code: CODES.SECTION_UNKNOWN,
      };
    }

    const sameLiveFamily = (
      (type === "live" || type === "replay")
      && (sectionType === "live" || sectionType === "replay")
    );

    if (sectionType !== type && !sameLiveFamily) {
      return {
        ok: false,
        code: CODES.SECTION_MISMATCH,
      };
    }
  }

  return {
    ok: true,
    value: canonicalSection,
  };
}

function normalizePublishState(record, collection) {
  const states = statusTokens(record).filter(Boolean);
  const openStates = new Set(
    CONTRACT.openStatesByCollection[collection]
    || CONTRACT.openStatesByCollection.default,
  );

  if (
    record.published === false
    || record.isPublished === false
    || record.active === false
  ) {
    return {
      kind: "locked",
      value: "unpublished",
    };
  }

  if (states.some((state) => LOCKED_STATE_SET.has(state))) {
    return {
      kind: "locked",
      value: states.find(
        (state) => LOCKED_STATE_SET.has(state),
      ),
    };
  }

  const unknownStates = states.filter(
    (state) => !openStates.has(state),
  );

  if (unknownStates.length) {
    return {
      kind: "unknown",
      value: unknownStates[0],
    };
  }

  if (states.length) {
    return {
      kind: "open",
      value: states[0],
    };
  }

  if (
    record.published === true
    || record.isPublished === true
    || record.active === true
  ) {
    return {
      kind: "open",
      value: "published",
    };
  }

  return {
    kind: "unknown",
    value: "",
  };
}

function normalizePlan(record, type, collection) {
  const rawCandidates = definedValues(
    record,
    CONTRACT.fieldPriority.plan,
  )
    .map((item) => ({
      field: item.field,
      token: normalizeToken(item.value),
    }))
    .filter(
      (item) => (
        item.token
        && ![
          "true",
          "false",
          "active",
          "expired",
          "verified",
        ].includes(item.token)
      ),
    );

  const normalized = [];

  for (const item of rawCandidates) {
    const plan = CONTRACT.planAliases[item.token] || "";

    if (!PLAN_SET.has(plan)) {
      return {
        ok: false,
        code: CODES.PLAN_UNKNOWN,
      };
    }

    normalized.push(plan);
  }

  const distinct = [...new Set(normalized)];

  if (distinct.length > 1) {
    return {
      ok: false,
      code: CODES.PLAN_CONFLICT,
    };
  }

  const explicitPlan = distinct[0] || "";
  const hasPremiumBoolean = (
    record.isPremium === true
    || record.isPremium === false
  );
  const booleanPlan = (
    record.isPremium === true
      ? "PREMIUM"
      : (
        record.isPremium === false
          ? "FREE"
          : ""
      )
  );
  const defaultPlan = clean(
    (
      CONTRACT.collectionDefaults[collection]
      || {}
    ).plan,
  ).toUpperCase();
  const authorityPlan = explicitPlan || defaultPlan;

  if (
    authorityPlan
    && hasPremiumBoolean
    && (
      (
        record.isPremium === true
        && !["PREMIUM", "MENTORSHIP"].includes(
          authorityPlan,
        )
      )
      || (
        record.isPremium === false
        && authorityPlan !== "FREE"
      )
    )
  ) {
    return {
      ok: false,
      code: CODES.PREMIUM_FLAG_CONFLICT,
    };
  }

  let plan = authorityPlan || booleanPlan;

  if (!plan) {
    return {
      ok: false,
      code: CODES.PLAN_MISSING,
    };
  }

  if (!PLAN_SET.has(plan)) {
    return {
      ok: false,
      code: CODES.PLAN_UNKNOWN,
    };
  }

  if (type === "note" && plan === "MENTORSHIP") {
    plan = "PREMIUM";
  }

  return {
    ok: true,
    value: plan,
  };
}

function decodeRoutePath(value) {
  let decoded = value;

  for (
    let pass = 0;
    pass < CONTRACT.routePolicy.decodePasses;
    pass += 1
  ) {
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

function routePathIsSafe(value) {
  const raw = clean(value);

  if (!raw) {
    return false;
  }

  if (
    raw.startsWith("//")
    || raw.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(raw)
    || /^[a-z][a-z0-9+.-]*:/i.test(raw)
  ) {
    return false;
  }

  const queryIndex = raw.indexOf("?");
  const rawPath = queryIndex >= 0
    ? raw.slice(0, queryIndex)
    : raw;
  const decodedPath = decodeRoutePath(rawPath);

  if (
    !decodedPath
    || decodedPath.startsWith("//")
    || decodedPath.includes("\\")
    || decodedPath.includes("#")
    || decodedPath.includes("?")
    || /[\u0000-\u001f\u007f]/.test(decodedPath)
    || /^[a-z][a-z0-9+.-]*:/i.test(decodedPath)
  ) {
    return false;
  }

  if (CONTRACT.routePolicy.rejectDotSegments) {
    const segments = decodedPath.split("/");

    if (
      segments.includes(".")
      || segments.includes("..")
    ) {
      return false;
    }
  }

  return true;
}

function normalizeCanonicalRoute(value) {
  let route = clean(value);

  if (!route || route.length > CONTRACT.routePolicy.maxLength) {
    return "";
  }

  if (route.startsWith("#")) {
    if (!CONTRACT.routePolicy.allowHashPrefix) {
      return "";
    }

    route = route.slice(1);
  }

  const hashIndex = route.indexOf("#");
  const pathPart = hashIndex >= 0
    ? route.slice(0, hashIndex)
    : route;
  const hashPart = hashIndex >= 0
    ? route.slice(hashIndex + 1)
    : "";

  if (
    CONTRACT.routePolicy.requireLeadingSlash
    && !pathPart.startsWith("/")
  ) {
    return "";
  }

  if (!routePathIsSafe(pathPart)) {
    return "";
  }

  if (
    hashIndex >= 0
    && CONTRACT.routePolicy.validateHashRoute
  ) {
    if (
      !hashPart
      || hashPart.includes("#")
    ) {
      return "";
    }

    const hashRoute = hashPart.startsWith("/")
      ? hashPart
      : `/${hashPart}`;

    if (!routePathIsSafe(hashRoute)) {
      return "";
    }
  }

  return route;
}

function resolveEventTargetResourceId(record) {
  const values = definedValues(
    record,
    CONTRACT.eventTargetFields,
  );

  if (!values.length) {
    return {
      ok: false,
      code: CODES.ROUTE_INVALID,
    };
  }

  const normalized = [];

  for (const item of values) {
    if (
      !validResourceId(
        item.value,
        CONTRACT.eventTargetPolicy.maxLength,
      )
    ) {
      return {
        ok: false,
        code: CODES.TARGET_INVALID,
      };
    }

    normalized.push(clean(item.value));
  }

  const distinct = [...new Set(normalized)];

  if (
    CONTRACT.eventTargetPolicy
      .requireAllDefinedTargetsToAgree
    && distinct.length > 1
  ) {
    return {
      ok: false,
      code: CODES.TARGET_CONFLICT,
    };
  }

  return {
    ok: true,
    value: distinct[0],
  };
}

function canonicalRouteResult(route, code = CODES.ROUTE_INVALID) {
  const normalized = normalizeCanonicalRoute(route);

  return normalized
    ? {
      ok: true,
      value: normalized,
    }
    : {
      ok: false,
      code,
    };
}

function deriveCanonicalRoute(record, type, collection, resourceId) {
  const explicit = firstDefined(
    record,
    CONTRACT.fieldPriority.route,
  );

  if (
    collection === "experienceEvents"
    && type === "test"
  ) {
    const targetResult = resolveEventTargetResourceId(
      record,
    );

    if (!targetResult.ok) {
      return targetResult;
    }

    const expectedRoute = canonicalRouteResult(
      `/ctet-tet/mock-tests/start/${
        encodeURIComponent(targetResult.value)
      }`,
    );

    if (!expectedRoute.ok) {
      return expectedRoute;
    }

    if (clean(explicit)) {
      const explicitRoute = canonicalRouteResult(explicit);

      if (!explicitRoute.ok) {
        return explicitRoute;
      }

      if (
        CONTRACT.eventTargetPolicy
          .requireCanonicalRouteAgreement
        && explicitRoute.value !== expectedRoute.value
      ) {
        return {
          ok: false,
          code: CODES.TARGET_CONFLICT,
        };
      }

      return explicitRoute;
    }

    return expectedRoute;
  }

  if (clean(explicit)) {
    return canonicalRouteResult(explicit);
  }

  const encodedId = encodeURIComponent(resourceId);

  if (collection === "experienceEvents") {
    return canonicalRouteResult(
      type === "replay"
        ? `/student#live/replays/${encodedId}`
        : `/student#live/upcoming/${encodedId}`,
    );
  }

  if (collection === "mentorLiveSessions") {
    return canonicalRouteResult(
      type === "replay"
        ? `/student#live/replays/${encodedId}`
        : `/student#live/upcoming/${encodedId}`,
    );
  }

  if (type === "note") {
    const textbookId = clean(
      record.textbookId
      || record.intelliTextId
      || record.learningTextId,
    );

    if (textbookId && !validResourceId(textbookId)) {
      return {
        ok: false,
        code: CODES.ROUTE_INVALID,
      };
    }

    return canonicalRouteResult(
      textbookId
        ? `/ctet-tet/notes/read/${
          encodeURIComponent(textbookId)
        }`
        : "/ctet-tet/notes",
    );
  }

  if (type === "video") {
    return canonicalRouteResult(
      `/ctet-tet/videos/watch/${encodedId}`,
    );
  }

  if (type === "test") {
    return canonicalRouteResult(
      `/ctet-tet/mock-tests/start/${encodedId}`,
    );
  }

  if (type === "current-affairs") {
    const monthId = clean(record.monthId || record.monthKey);

    if (monthId && !validResourceId(monthId)) {
      return {
        ok: false,
        code: CODES.ROUTE_INVALID,
      };
    }

    return canonicalRouteResult(
      monthId
        ? `/ctet-tet/current-affairs/${
          encodeURIComponent(monthId)
        }/read/${encodedId}`
        : "/ctet-tet/current-affairs",
    );
  }

  if (type === "roadmap") {
    return canonicalRouteResult(
      `/ctet-tet/roadmaps/${encodedId}`,
    );
  }

  if (type === "live" || type === "replay") {
    return canonicalRouteResult(
      type === "replay"
        ? "/student#live/replays"
        : "/student#live/upcoming",
    );
  }

  return {
    ok: false,
    code: CODES.ROUTE_INVALID,
  };
}

function failure(code, message, details = {}) {
  return Object.freeze({
    ok: false,
    state: "error",
    code,
    message,
    details: Object.freeze({ ...details }),
  });
}

function locked(resource) {
  return Object.freeze({
    ok: true,
    state: "locked",
    code: CODES.LOCKED,
    message: "This resource is not currently available.",
    resource,
  });
}

function resolved(resource) {
  return Object.freeze({
    ok: true,
    state: "canonical_record",
    code: CODES.RESOLVED,
    message: "Canonical resource resolved.",
    resource,
  });
}

function normalizeReaderResult(collection, resourceId, result) {
  if (result == null) {
    return {
      exists: false,
      collection,
      resourceId,
    };
  }

  if (
    typeof result !== "object"
    || typeof result.exists !== "boolean"
  ) {
    throw new TypeError(
      `Reader for ${collection} returned an invalid result.`,
    );
  }

  if (result.exists === false) {
    return {
      exists: false,
      collection,
      resourceId,
    };
  }

  if (
    !result.record
    || typeof result.record !== "object"
    || Array.isArray(result.record)
  ) {
    throw new TypeError(
      `Reader for ${collection} returned an invalid record.`,
    );
  }

  return {
    exists: true,
    collection,
    resourceId,
    id: clean(result.id),
    record: result.record,
  };
}

function normalizeCanonicalRecord(match, typeHint) {
  const {
    collection,
    resourceId,
    id: readerId,
    record,
  } = match;

  const recordId = clean(record.id);
  const recordResourceId = clean(record.resourceId);
  const identityValues = [
    readerId,
    recordId,
    recordResourceId,
  ].filter(Boolean);
  const canonicalId = resourceId;

  if (
    !identityValues.length
    || identityValues.some(
      (identity) => identity !== resourceId,
    )
  ) {
    return failure(
      CODES.ID_MISMATCH,
      "The canonical resource identity is invalid.",
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const typeResult = resolveCanonicalType(
    record,
    collection,
  );

  if (!typeResult.ok) {
    return failure(
      typeResult.code,
      typeResult.code === CODES.TYPE_MISMATCH
        ? "The canonical resource type fields conflict."
        : "The canonical resource type is invalid.",
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const type = typeResult.type;

  const normalizedTypeHint = typeHint
    ? normalizeTypeAlias(typeHint)
    : "";

  if (typeHint && !normalizedTypeHint) {
    return failure(
      CODES.TYPE_UNKNOWN,
      "The requested resource type is invalid.",
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  if (normalizedTypeHint && normalizedTypeHint !== type) {
    return failure(
      CODES.TYPE_MISMATCH,
      "The requested resource type does not match the canonical record.",
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const sectionResult = normalizeSection(
    record,
    type,
    collection,
  );

  if (!sectionResult.ok) {
    return failure(
      sectionResult.code,
      sectionResult.code === CODES.SECTION_MISMATCH
        ? "The canonical resource section conflicts with its type."
        : "The canonical resource section is invalid.",
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const publish = normalizePublishState(record, collection);

  if (publish.kind === "unknown") {
    return failure(
      CODES.STATUS_UNKNOWN,
      "The canonical publication state is invalid.",
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const planResult = normalizePlan(
    record,
    type,
    collection,
  );

  if (!planResult.ok) {
    return failure(
      planResult.code,
      [
        CODES.PLAN_CONFLICT,
        CODES.PREMIUM_FLAG_CONFLICT,
      ].includes(planResult.code)
        ? "The canonical resource plan fields conflict."
        : (
          planResult.code === CODES.PLAN_MISSING
            ? "The canonical resource plan is missing."
            : "The canonical resource plan is invalid."
        ),
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const routeResult = deriveCanonicalRoute(
    record,
    type,
    collection,
    resourceId,
  );

  if (!routeResult.ok) {
    return failure(
      routeResult.code || CODES.ROUTE_INVALID,
      routeResult.code === CODES.TARGET_CONFLICT
        ? "The canonical resource target fields conflict."
        : (
          routeResult.code === CODES.TARGET_INVALID
            ? "The canonical resource target is invalid."
            : "The canonical resource route is invalid."
        ),
      {
        resourceId,
        sourceCollection: collection,
      },
    );
  }

  const resource = Object.freeze({
    id: canonicalId,
    resourceId: canonicalId,
    type,
    section: sectionResult.value,
    requiredPlan: planResult.value,
    publishState: publish.value,
    canonicalRoute: routeResult.value,
    sourceCollection: collection,
  });

  return publish.kind === "locked"
    ? locked(resource)
    : resolved(resource);
}

function normalizeRequestInput(request) {
  try {
    return {
      ok: true,
      resourceId: clean(request.resourceId),
      resourceTypeHint: clean(
        request.resourceTypeHint,
      ),
      signal: request.signal,
    };
  } catch (_) {
    return {
      ok: false,
    };
  }
}

function createCanonicalResourceService(dependencies = {}) {
  const { readResourceById } = dependencies;

  if (typeof readResourceById !== "function") {
    throw new TypeError(
      "readResourceById dependency is required.",
    );
  }

  async function getCanonicalResource(request = {}) {
    if (
      !request
      || typeof request !== "object"
      || Array.isArray(request)
    ) {
      return failure(
        CODES.INVALID_REQUEST,
        "A canonical resource request is required.",
      );
    }

    const normalizedRequest = normalizeRequestInput(
      request,
    );

    if (!normalizedRequest.ok) {
      return failure(
        CODES.INVALID_REQUEST,
        "The canonical resource request is invalid.",
      );
    }

    const {
      resourceId,
      resourceTypeHint,
      signal,
    } = normalizedRequest;

    if (!validResourceId(resourceId)) {
      return failure(
        CODES.INVALID_REQUEST,
        "A valid canonical resource ID is required.",
      );
    }

    if (resourceTypeHint.length > 128) {
      return failure(
        CODES.INVALID_REQUEST,
        "The resource type hint is invalid.",
      );
    }

    let matches;

    try {
      const results = await Promise.all(
        CONTRACT.collections.map(async (collection) => {
          const result = await readResourceById({
            collection,
            resourceId,
            signal,
          });

          return normalizeReaderResult(
            collection,
            resourceId,
            result,
          );
        }),
      );

      matches = results.filter((item) => item.exists);
    } catch (_) {
      return failure(
        CODES.READ_FAILED,
        "The canonical resource could not be read.",
        {
          resourceId,
        },
      );
    }

    if (matches.length === 0) {
      return failure(
        CODES.NOT_FOUND,
        "The canonical resource was not found.",
        {
          resourceId,
        },
      );
    }

    if (matches.length > 1) {
      return failure(
        CODES.AMBIGUOUS,
        "The canonical resource identity is ambiguous.",
        {
          resourceId,
          sourceCollections: Object.freeze(
            matches.map((item) => item.collection),
          ),
        },
      );
    }

    try {
      return normalizeCanonicalRecord(
        matches[0],
        resourceTypeHint,
      );
    } catch (_) {
      return failure(
        CODES.READ_FAILED,
        "The canonical resource could not be normalized.",
        {
          resourceId,
        },
      );
    }
  }

  return Object.freeze({
    getCanonicalResource,
  });
}

module.exports = Object.freeze({
  CODES,
  CANONICAL_RESOURCE_CONTRACT: CONTRACT,
  createCanonicalResourceService,
});
