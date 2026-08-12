"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const servicePath = path.resolve(
  __dirname,
  "authorizeProductionService.js",
);
const contractPath = path.resolve(
  __dirname,
  "authorizeDecisionContract.json",
);
const registryPath = path.resolve(
  __dirname,
  "productionBridgeMethodRegistry.json",
);
const runtimeIndexPath = path.resolve(
  __dirname,
  "../../../runtime/v26-shell/index.html",
);

const authorizeModule = require(servicePath);
const contract = require(contractPath);
const registry = require(registryPath);
const bridgeFoundation = require(
  path.resolve(
    __dirname,
    "productionBridgeFoundation.js",
  ),
);

function publicSession() {
  return Object.freeze({
    ready: true,
    authenticated: false,
    accessAllowed: false,
    user: null,
    uid: "",
    role: "public",
    allowed: Object.freeze(["public"]),
    email: "",
    displayName: "",
    username: "",
    planType: "",
    emailVerified: false,
    profile: Object.freeze({}),
  });
}

function verifiedSession(overrides = {}) {
  return Object.freeze({
    ready: true,
    authenticated: true,
    accessAllowed: true,
    user: Object.freeze({
      uid: "student-1",
      email: "student@example.test",
      displayName: "Student",
      emailVerified: true,
    }),
    uid: "student-1",
    role: "student",
    allowed: Object.freeze([
      "public",
      "student",
    ]),
    email: "student@example.test",
    displayName: "Student",
    username: "student",
    planType: "PREMIUM",
    emailVerified: true,
    profile: Object.freeze({}),
    ...overrides,
  });
}

function canonicalResource(overrides = {}) {
  return Object.freeze({
    id: "note-1",
    resourceId: "note-1",
    type: "note",
    section: "notes",
    requiredPlan: "FREE",
    publishState: "published",
    canonicalRoute:
      "/ctet-tet/notes/read/note-1",
    sourceCollection: "contentItems",
    ...overrides,
  });
}

function canonicalResolved(overrides = {}) {
  return Object.freeze({
    ok: true,
    state: "canonical_record",
    code: "CANONICAL_RESOURCE_RESOLVED",
    message: "Canonical resource resolved.",
    resource: canonicalResource(overrides),
  });
}

function canonicalLocked(overrides = {}) {
  return Object.freeze({
    ok: true,
    state: "locked",
    code: "CANONICAL_RESOURCE_LOCKED",
    message: "This resource is not currently available.",
    resource: canonicalResource({
      publishState: "unpublished",
      ...overrides,
    }),
  });
}

function entitlementDecision(
  state,
  overrides = {},
) {
  const allowed = state === "allowed";

  return Object.freeze({
    state,
    allowed,
    code: `ENTITLEMENT_${state.toUpperCase()}`,
    principalUid: "student-1",
    resourceId: "note-1",
    requiredPlan: "PREMIUM",
    matchedGrantId:
      ["allowed", "expired"].includes(state)
        ? "grant-1"
        : null,
    matchedScope:
      ["allowed", "expired"].includes(state)
        ? "PLAN"
        : null,
    expiresAt:
      state === "expired"
        ? "2026-08-01T00:00:00.000Z"
        : null,
    ...overrides,
  });
}

function createHarness(overrides = {}) {
  const calls = {
    session: [],
    canonical: [],
    entitlement: [],
  };

  const dependencies = {
    async getAuthoritativeSession(request) {
      calls.session.push(request);

      if (overrides.sessionThrows) {
        throw new Error("raw-private-session-error");
      }

      return overrides.sessionResult === undefined
        ? verifiedSession()
        : overrides.sessionResult;
    },

    async getCanonicalResource(request) {
      calls.canonical.push(request);

      if (overrides.canonicalThrows) {
        throw new Error("raw-private-resource-error");
      }

      return overrides.canonicalResult === undefined
        ? canonicalResolved()
        : overrides.canonicalResult;
    },

    async resolveEntitlementDecision(request) {
      calls.entitlement.push(request);

      if (overrides.entitlementThrows) {
        throw new Error("raw-private-entitlement-error");
      }

      return overrides.entitlementResult === undefined
        ? entitlementDecision("allowed")
        : overrides.entitlementResult;
    },
  };

  return {
    calls,
    service:
      authorizeModule.createAuthorizeProductionService(
        dependencies,
      ),
  };
}

function request(overrides = {}) {
  return {
    resource: {
      id: "note-1",
      resourceId: "note-1",
      type: "note",
      requiredPlan: "FREE",
      publishState: "published",
      accessState: "open",
      canonicalRoute:
        "/attacker-controlled-route",
      section: "attacker",
      sourceCollection: "attacker",
      ...(overrides.resource || {}),
    },
    action: "READ",
    session: {
      uid: "student-1",
      role: "admin",
      allowed: ["admin"],
      accessAllowed: false,
      emailVerified: false,
      planType: "FREE",
      profile: {
        unsafe: true,
      },
      ...(overrides.session || {}),
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(
        ([key]) =>
          !["resource", "session"].includes(key),
      ),
    ),
  };
}

async function main() {
  assert.deepStrictEqual(
    Object.keys(authorizeModule).sort(),
    [
      "AUTHORIZE_DECISION_CONTRACT",
      "CODES",
      "createAuthorizeProductionService",
    ],
  );
  assert.strictEqual(
    contract.version,
    "1.1.0",
  );
  assert.deepStrictEqual(
    contract.dependencies,
    [
      "getAuthoritativeSession",
      "getCanonicalResource",
      "resolveEntitlementDecision",
    ],
  );
  assert.deepStrictEqual(
    contract.typeActionMap,
    {
      note: "READ",
      video: "WATCH",
      test: "ATTEMPT",
      "current-affairs": "READ",
      roadmap: "OPEN",
      live: "JOIN",
      replay: "WATCH",
    },
  );
  assert.strictEqual(
    contract.policy.unknownPlanDefaultsFree,
    false,
  );
  assert.strictEqual(
    contract.policy.canonicalStatePublishBindingRequired,
    true,
  );
  assert.strictEqual(
    contract.policy.allowedExpiryMustBeFuture,
    true,
  );
  assert.strictEqual(
    contract.policy.expiredExpiryMustNotBeFuture,
    true,
  );
  assert.strictEqual(
    contract.policy.runtimeOwnerAssignment,
    false,
  );
  assert(Object.isFrozen(
    authorizeModule.AUTHORIZE_DECISION_CONTRACT,
  ));

  assert.throws(
    () =>
      authorizeModule.createAuthorizeProductionService(),
    /three authoritative dependencies/,
  );
  assert.throws(
    () =>
      authorizeModule.createAuthorizeProductionService({
        getAuthoritativeSession() {},
        getCanonicalResource() {},
      }),
    /three authoritative dependencies/,
  );

  const invalidPrimitive = await createHarness()
    .service.authorize("note-1");
  assert.strictEqual(
    invalidPrimitive.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  const missingResource = await createHarness()
    .service.authorize({
      action: "READ",
      session: {},
    });
  assert.strictEqual(
    missingResource.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  const conflictingId = await createHarness()
    .service.authorize(
      request({
        resource: {
          id: "note-1",
          resourceId: "note-2",
        },
      }),
    );
  assert.strictEqual(
    conflictingId.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  for (const id of [
    ".",
    "..",
    "%2e%2e",
    "%252e%252e",
    "a/b",
    "a%2fb",
    "a\\b",
  ]) {
    const invalidId = await createHarness()
      .service.authorize(
        request({
          resource: {
            id,
            resourceId: id,
          },
        }),
      );
    assert.strictEqual(
      invalidId.code,
      authorizeModule.CODES.INVALID_REQUEST,
      id,
    );
  }

  const requestGetter = {};
  Object.defineProperty(
    requestGetter,
    "resource",
    {
      get() {
        throw new Error("raw-request-getter");
      },
    },
  );
  Object.defineProperty(
    requestGetter,
    "action",
    {
      value: "READ",
    },
  );
  const getterFailure = await createHarness()
    .service.authorize(requestGetter);
  assert.strictEqual(
    getterFailure.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  const resourceGetter = {};
  Object.defineProperty(
    resourceGetter,
    "id",
    {
      get() {
        throw new Error("raw-resource-getter");
      },
    },
  );
  const resourceGetterFailure =
    await createHarness().service.authorize({
      resource: resourceGetter,
      action: "READ",
      session: {},
    });
  assert.strictEqual(
    resourceGetterFailure.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  const sessionGetter = {};
  Object.defineProperty(
    sessionGetter,
    "uid",
    {
      get() {
        throw new Error("raw-session-getter");
      },
    },
  );
  const sessionGetterFailure =
    await createHarness().service.authorize({
      resource: {
        id: "note-1",
        type: "note",
      },
      action: "READ",
      session: sessionGetter,
    });
  assert.strictEqual(
    sessionGetterFailure.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  const unknownAction = await createHarness()
    .service.authorize(
      request({
        action: "DELETE",
      }),
    );
  assert.strictEqual(
    unknownAction.code,
    authorizeModule.CODES.ACTION_UNKNOWN,
  );

  const unknownType = await createHarness()
    .service.authorize(
      request({
        resource: {
          type: "unknown",
        },
      }),
    );
  assert.strictEqual(
    unknownType.code,
    authorizeModule.CODES.INVALID_REQUEST,
  );

  const sessionErrorHarness = createHarness({
    sessionThrows: true,
  });
  const sessionError =
    await sessionErrorHarness.service.authorize(
      request(),
    );
  assert.strictEqual(
    sessionError.code,
    authorizeModule.CODES.SESSION_READ_FAILED,
  );
  assert.strictEqual(
    JSON.stringify(sessionError).includes(
      "raw-private-session-error",
    ),
    false,
  );
  assert.strictEqual(
    sessionErrorHarness.calls.canonical.length,
    0,
  );

  const emailUnverified = await createHarness({
    sessionResult: {
      ok: false,
      code: "AUTH_EMAIL_UNVERIFIED",
      message: "raw-private-auth-message",
    },
  }).service.authorize(request());
  assert.strictEqual(
    emailUnverified.state,
    "locked",
  );
  assert.strictEqual(
    emailUnverified.code,
    authorizeModule.CODES.EMAIL_UNVERIFIED,
  );
  assert.strictEqual(
    JSON.stringify(emailUnverified).includes(
      "raw-private-auth-message",
    ),
    false,
  );

  const roleInvalid = await createHarness({
    sessionResult: {
      ok: false,
      code: "AUTH_ROLE_INVALID",
    },
  }).service.authorize(request());
  assert.strictEqual(
    roleInvalid.state,
    "locked",
  );
  assert.strictEqual(
    roleInvalid.code,
    authorizeModule.CODES.ROLE_INVALID,
  );

  const authFailure = await createHarness({
    sessionResult: {
      ok: false,
      code: "AUTH_PROFILE_FAILED",
      message: "raw-profile-message",
    },
  }).service.authorize(request());
  assert.strictEqual(
    authFailure.state,
    "error",
  );
  assert.strictEqual(
    authFailure.code,
    authorizeModule.CODES.SESSION_READ_FAILED,
  );

  const sessionProxy = new Proxy(
    {},
    {
      get() {
        throw new Error("raw-session-proxy");
      },
    },
  );
  const sessionProxyFailure =
    await createHarness({
      sessionResult: sessionProxy,
    }).service.authorize(request());
  assert.strictEqual(
    sessionProxyFailure.code,
    authorizeModule.CODES.SESSION_READ_FAILED,
  );

  const callerUidMismatchHarness = createHarness();
  const callerUidMismatch =
    await callerUidMismatchHarness.service.authorize(
      request({
        session: {
          uid: "student-2",
        },
      }),
    );
  assert.strictEqual(
    callerUidMismatch.code,
    authorizeModule.CODES.SESSION_MISMATCH,
  );
  assert.strictEqual(
    callerUidMismatchHarness.calls.canonical.length,
    0,
  );

  const canonicalErrorHarness = createHarness({
    canonicalThrows: true,
  });
  const canonicalError =
    await canonicalErrorHarness.service.authorize(
      request(),
    );
  assert.strictEqual(
    canonicalError.code,
    authorizeModule.CODES.RESOURCE_READ_FAILED,
  );
  assert.strictEqual(
    JSON.stringify(canonicalError).includes(
      "raw-private-resource-error",
    ),
    false,
  );
  assert.strictEqual(
    canonicalErrorHarness.calls.entitlement.length,
    0,
  );

  const canonicalFailure = await createHarness({
    canonicalResult: {
      ok: false,
      state: "error",
      code: "CANONICAL_RESOURCE_NOT_FOUND",
      message: "raw-canonical-message",
    },
  }).service.authorize(request());
  assert.strictEqual(
    canonicalFailure.code,
    authorizeModule.CODES.RESOURCE_READ_FAILED,
  );
  assert.strictEqual(
    JSON.stringify(canonicalFailure).includes(
      "raw-canonical-message",
    ),
    false,
  );

  const malformedCanonical = await createHarness({
    canonicalResult: {
      ok: true,
      state: "canonical_record",
      resource: {
        id: "note-1",
      },
    },
  }).service.authorize(request());
  assert.strictEqual(
    malformedCanonical.code,
    authorizeModule.CODES.RESOURCE_INVALID,
  );

  const canonicalGetter = {
    ok: true,
    state: "canonical_record",
  };
  Object.defineProperty(
    canonicalGetter,
    "resource",
    {
      get() {
        throw new Error("raw-canonical-getter");
      },
    },
  );
  const canonicalGetterFailure =
    await createHarness({
      canonicalResult: canonicalGetter,
    }).service.authorize(request());
  assert.strictEqual(
    canonicalGetterFailure.code,
    authorizeModule.CODES.RESOURCE_INVALID,
  );

  const lockedHarness = createHarness({
    sessionResult: publicSession(),
    canonicalResult: canonicalLocked({
      requiredPlan: "PREMIUM",
    }),
  });
  const lockedResult =
    await lockedHarness.service.authorize(
      request({
        session: {
          uid: "",
        },
      }),
    );
  assert.strictEqual(
    lockedResult.state,
    "locked",
  );
  assert.strictEqual(
    lockedResult.code,
    authorizeModule.CODES.RESOURCE_LOCKED,
  );

  const resolvedWithLockedPublishState =
    await createHarness({
      canonicalResult: canonicalResolved({
        publishState: "unpublished",
        requiredPlan: "FREE",
      }),
    }).service.authorize(request());
  assert.strictEqual(
    resolvedWithLockedPublishState.code,
    authorizeModule.CODES.RESOURCE_INVALID,
  );

  const lockedWithOpenPublishState =
    await createHarness({
      canonicalResult: canonicalLocked({
        publishState: "published",
        requiredPlan: "FREE",
      }),
    }).service.authorize(request());
  assert.strictEqual(
    lockedWithOpenPublishState.code,
    authorizeModule.CODES.RESOURCE_INVALID,
  );

  const loginHarness = createHarness({
    sessionResult: publicSession(),
  });
  const loginRequired =
    await loginHarness.service.authorize(
      request({
        session: {
          uid: "",
        },
      }),
    );
  assert.strictEqual(
    loginRequired.state,
    "login_required",
  );
  assert.strictEqual(
    loginRequired.code,
    authorizeModule.CODES.LOGIN_REQUIRED,
  );
  assert.strictEqual(
    loginHarness.calls.canonical.length,
    1,
  );
  assert.strictEqual(
    loginHarness.calls.entitlement.length,
    0,
  );

  const actionMismatchRequest = request({
    action: "READ",
  });
  delete actionMismatchRequest.resource.type;

  const actionMismatch = await createHarness({
    canonicalResult: canonicalResolved({
      type: "video",
      section: "videos",
      canonicalRoute:
        "/ctet-tet/videos/watch/note-1",
    }),
  }).service.authorize(
    actionMismatchRequest,
  );
  assert.strictEqual(
    actionMismatch.code,
    authorizeModule.CODES.ACTION_MISMATCH,
  );

  const experienceBlocked = await createHarness({
    sessionResult: verifiedSession({
      role: "mentor",
      allowed: Object.freeze([
        "public",
        "mentor",
      ]),
    }),
  }).service.authorize(request());
  assert.strictEqual(
    experienceBlocked.state,
    "locked",
  );
  assert.strictEqual(
    experienceBlocked.code,
    authorizeModule.CODES.EXPERIENCE_BLOCKED,
  );

  const roleEscalation = await createHarness({
    sessionResult: verifiedSession({
      role: "student",
      allowed: Object.freeze([
        "public",
        "student",
        "admin",
      ]),
    }),
  }).service.authorize(request());
  assert.strictEqual(
    roleEscalation.state,
    "error",
  );
  assert.strictEqual(
    roleEscalation.code,
    authorizeModule.CODES.SESSION_INVALID,
  );

  const unknownSessionPlan = await createHarness({
    sessionResult: verifiedSession({
      planType: "UNKNOWN",
    }),
  }).service.authorize(request());
  assert.strictEqual(
    unknownSessionPlan.state,
    "error",
  );
  assert.strictEqual(
    unknownSessionPlan.code,
    authorizeModule.CODES.SESSION_INVALID,
  );

  const freeHarness = createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "FREE",
    }),
  });
  const freeAllowed =
    await freeHarness.service.authorize(
      request({
        resource: {
          requiredPlan: "MENTORSHIP",
          publishState: "locked",
          accessState: "denied",
          canonicalRoute: "/admin/users",
        },
        session: {
          uid: "student-1",
          role: "admin",
          allowed: ["admin"],
          accessAllowed: false,
          emailVerified: false,
          planType: "FREE",
        },
      }),
    );
  assert.strictEqual(
    freeAllowed.state,
    "allowed",
  );
  assert.strictEqual(
    freeAllowed.code,
    authorizeModule.CODES.ALLOWED_FREE,
  );
  assert.strictEqual(
    freeAllowed.requiredPlan,
    "FREE",
  );
  assert.strictEqual(
    freeHarness.calls.entitlement.length,
    0,
  );

  const paidHarness = createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "PREMIUM",
    }),
    entitlementResult:
      entitlementDecision("allowed"),
  });
  const paidAllowed =
    await paidHarness.service.authorize(
      request(),
      {
        signal: {
          name: "transport-signal",
        },
      },
    );
  assert.strictEqual(
    paidAllowed.state,
    "allowed",
  );
  assert.strictEqual(
    paidAllowed.code,
    authorizeModule.CODES.ALLOWED_ENTITLEMENT,
  );
  assert.strictEqual(
    paidAllowed.matchedGrantId,
    "grant-1",
  );
  assert.strictEqual(
    paidAllowed.matchedScope,
    "PLAN",
  );
  assert.strictEqual(
    paidHarness.calls.session[0].signal.name,
    "transport-signal",
  );
  assert.strictEqual(
    paidHarness.calls.canonical[0].signal.name,
    "transport-signal",
  );
  assert.strictEqual(
    paidHarness.calls.entitlement[0].signal.name,
    "transport-signal",
  );
  assert.deepStrictEqual(
    Object.keys(
      paidHarness.calls.entitlement[0].principal,
    ).sort(),
    ["allowed", "planType", "role", "uid"],
  );
  assert.strictEqual(
    paidHarness.calls.entitlement[0].session.profile,
    undefined,
  );
  assert.strictEqual(
    Object.isFrozen(
      paidHarness.calls.entitlement[0].principal,
    ),
    true,
  );
  assert.strictEqual(
    Object.isFrozen(
      paidHarness.calls.entitlement[0].resource,
    ),
    true,
  );
  assert.strictEqual(
    Object.isFrozen(
      paidHarness.calls.entitlement[0].session,
    ),
    true,
  );

  const expired = await createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "PREMIUM",
    }),
    entitlementResult:
      entitlementDecision("expired"),
  }).service.authorize(request());
  assert.strictEqual(expired.state, "expired");
  assert.strictEqual(
    expired.code,
    authorizeModule.CODES.ENTITLEMENT_EXPIRED,
  );
  assert.strictEqual(
    expired.expiresAt,
    "2026-08-01T00:00:00.000Z",
  );

  const allowedWithPastExpiry =
    await createHarness({
      canonicalResult: canonicalResolved({
        requiredPlan: "PREMIUM",
      }),
      entitlementResult:
        entitlementDecision("allowed", {
          expiresAt:
            "2020-01-01T00:00:00.000Z",
        }),
    }).service.authorize(request());
  assert.strictEqual(
    allowedWithPastExpiry.code,
    authorizeModule.CODES.ENTITLEMENT_INVALID,
  );

  const expiredWithFutureExpiry =
    await createHarness({
      canonicalResult: canonicalResolved({
        requiredPlan: "PREMIUM",
      }),
      entitlementResult:
        entitlementDecision("expired", {
          expiresAt:
            "2099-01-01T00:00:00.000Z",
        }),
    }).service.authorize(request());
  assert.strictEqual(
    expiredWithFutureExpiry.code,
    authorizeModule.CODES.ENTITLEMENT_INVALID,
  );

  const allowedWithFutureExpiry =
    await createHarness({
      canonicalResult: canonicalResolved({
        requiredPlan: "PREMIUM",
      }),
      entitlementResult:
        entitlementDecision("allowed", {
          expiresAt:
            "2099-01-01T00:00:00.000Z",
        }),
    }).service.authorize(request());
  assert.strictEqual(
    allowedWithFutureExpiry.state,
    "allowed",
  );
  assert.strictEqual(
    allowedWithFutureExpiry.expiresAt,
    "2099-01-01T00:00:00.000Z",
  );

  const entitlementLocked = await createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "PREMIUM",
    }),
    entitlementResult:
      entitlementDecision("locked"),
  }).service.authorize(request());
  assert.strictEqual(
    entitlementLocked.state,
    "locked",
  );
  assert.strictEqual(
    entitlementLocked.code,
    authorizeModule.CODES.ENTITLEMENT_BLOCKED,
  );

  const entitlementError = await createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "PREMIUM",
    }),
    entitlementResult:
      entitlementDecision("error"),
  }).service.authorize(request());
  assert.strictEqual(
    entitlementError.state,
    "error",
  );
  assert.strictEqual(
    entitlementError.code,
    authorizeModule.CODES.ENTITLEMENT_READ_FAILED,
  );

  const entitlementThrows = await createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "PREMIUM",
    }),
    entitlementThrows: true,
  }).service.authorize(request());
  assert.strictEqual(
    entitlementThrows.code,
    authorizeModule.CODES.ENTITLEMENT_READ_FAILED,
  );
  assert.strictEqual(
    JSON.stringify(entitlementThrows).includes(
      "raw-private-entitlement-error",
    ),
    false,
  );

  const invalidEntitlementCases = [
    entitlementDecision("allowed", {
      allowed: false,
    }),
    entitlementDecision("allowed", {
      principalUid: "other-user",
    }),
    entitlementDecision("allowed", {
      resourceId: "other-resource",
    }),
    entitlementDecision("allowed", {
      requiredPlan: "BASIC",
    }),
    entitlementDecision("allowed", {
      matchedGrantId: null,
    }),
    entitlementDecision("allowed", {
      matchedScope: "UNKNOWN",
    }),
    entitlementDecision("expired", {
      expiresAt: null,
    }),
    entitlementDecision("expired", {
      expiresAt: "not-a-date",
    }),
    entitlementDecision("locked", {
      allowed: true,
    }),
    {
      state: "allowed",
    },
  ];

  for (
    const entitlementResult
    of invalidEntitlementCases
  ) {
    const invalidEntitlement =
      await createHarness({
        canonicalResult: canonicalResolved({
          requiredPlan: "PREMIUM",
        }),
        entitlementResult,
      }).service.authorize(request());

    assert.strictEqual(
      invalidEntitlement.code,
      authorizeModule.CODES.ENTITLEMENT_INVALID,
    );
  }

  const entitlementGetter = {};
  Object.defineProperty(
    entitlementGetter,
    "state",
    {
      get() {
        throw new Error("raw-entitlement-getter");
      },
    },
  );
  const entitlementGetterFailure =
    await createHarness({
      canonicalResult: canonicalResolved({
        requiredPlan: "PREMIUM",
      }),
      entitlementResult: entitlementGetter,
    }).service.authorize(request());
  assert.strictEqual(
    entitlementGetterFailure.code,
    authorizeModule.CODES.ENTITLEMENT_INVALID,
  );

  const bridgeHarness = createHarness({
    canonicalResult: canonicalResolved({
      requiredPlan: "FREE",
    }),
  });
  const handlerRegistry =
    bridgeFoundation.createHandlerRegistry({
      idFactory: (() => {
        let next = 0;
        return () => `bridge-${next += 1}`;
      })(),
      now: () => 100,
      defaultTimeoutMs: 1000,
    });
  handlerRegistry.register(
    "authorize",
    (payload, context) =>
      bridgeHarness.service.authorize(
        payload,
        context,
      ),
    {
      owner:
        "src/integration/v26/"
        + "authorizeProductionService.js",
    },
  );
  const bridgeResult = await handlerRegistry.invoke(
    "authorize",
    request(),
    {
      requestId: "request-1",
      correlationId: "correlation-1",
    },
  );
  assert.strictEqual(bridgeResult.ok, true);
  assert.strictEqual(bridgeResult.state, "allowed");
  assert.strictEqual(
    bridgeResult.code,
    authorizeModule.CODES.ALLOWED_FREE,
  );
  assert.strictEqual(
    bridgeResult.requestId,
    "request-1",
  );
  assert.strictEqual(
    bridgeResult.correlationId,
    "correlation-1",
  );
  assert.strictEqual(
    bridgeResult.method,
    "authorize",
  );

  const allStates = [
    loginRequired,
    lockedResult,
    expired,
    freeAllowed,
    paidAllowed,
    sessionError,
  ];
  for (const item of allStates) {
    assert(Object.isFrozen(item));
    assert.strictEqual(
      typeof item.retryable,
      "boolean",
    );
    assert.strictEqual(
      typeof item.allowed,
      "boolean",
    );
    assert.strictEqual(
      typeof item.state,
      "string",
    );
    assert.strictEqual(
      typeof item.code,
      "string",
    );
  }

  const serviceSource = fs.readFileSync(
    servicePath,
    "utf8",
  );
  for (const forbidden of [
    "firebase/",
    "firebase-admin",
    "accessService",
    "window.",
    "document.",
    "localStorage",
    "sessionStorage",
    "history.",
    "location.",
    "navigate(",
    "updateDoc(",
    "setDoc(",
    "addDoc(",
    "deleteDoc(",
  ]) {
    assert.strictEqual(
      serviceSource.includes(forbidden),
      false,
      forbidden,
    );
  }

  const runtimeIndex = fs.readFileSync(
    runtimeIndexPath,
    "utf8",
  );
  for (const name of [
    "authorizeProductionService.js",
    "authorizeDecisionContract.json",
    "authorizeProductionService.test.cjs",
  ]) {
    assert.strictEqual(
      runtimeIndex.includes(name),
      false,
      name,
    );
  }

  assert.strictEqual(
    registry.methods.length,
    182,
  );
  assert.strictEqual(
    registry.methods.filter(
      (item) => item.name === "authorize",
    ).length,
    1,
  );
  assert.strictEqual(
    registry.methods.filter(
      (item) =>
        item.owner !== null
        || item.ownerState
          !== "SAFE_DISABLED_PENDING_OWNER",
    ).length,
    33,
  );

  console.log(
    "AUTHORIZE_SERVICE_METHODS=1/1",
  );
  console.log(
    "AUTHORIZE_DEPENDENCIES=3/3",
  );
  console.log(
    "AUTHORIZE_REQUEST_FIELDS=3/3",
  );
  console.log(
    "AUTHORIZE_ACTION_MAP=7/7_PASS",
  );
  console.log(
    "REQUEST_PROPERTY_ACCESS_SANITIZATION=PASS",
  );
  console.log(
    "RESOURCE_ID_ALIAS_CONFLICT_FAIL_CLOSED=PASS",
  );
  console.log(
    "ENCODED_RESOURCE_ID_TRAVERSAL_FAIL_CLOSED=PASS",
  );
  console.log(
    "UNKNOWN_ACTION_FAIL_CLOSED=PASS",
  );
  console.log(
    "UNKNOWN_TYPE_HINT_FAIL_CLOSED=PASS",
  );
  console.log(
    "AUTHORITATIVE_SESSION_RELOAD=PASS",
  );
  console.log(
    "CALLER_SESSION_UID_MISMATCH_FAIL_CLOSED=PASS",
  );
  console.log(
    "AUTH_FAILURE_SANITIZATION=PASS",
  );
  console.log(
    "CANONICAL_RESOURCE_RELOAD=PASS",
  );
  console.log(
    "CANONICAL_FAILURE_SANITIZATION=PASS",
  );
  console.log(
    "CALLER_PLAN_STATUS_ROUTE_ACCESS_OVERRIDES_IGNORED=PASS",
  );
  console.log(
    "LOCKED_CANONICAL_RESOURCE_DENIED=PASS",
  );
  console.log(
    "LOGIN_REQUIRED_STATE=PASS",
  );
  console.log(
    "ACTION_TYPE_AGREEMENT=PASS",
  );
  console.log(
    "STUDENT_EXPERIENCE_GATE=PASS",
  );
  console.log(
    "ROLE_EXPERIENCE_ESCALATION_FAIL_CLOSED=PASS",
  );
  console.log(
    "UNKNOWN_SESSION_PLAN_FAIL_CLOSED=PASS",
  );
  console.log(
    "FREE_RESOURCE_ALLOWED_WITHOUT_ENTITLEMENT=PASS",
  );
  console.log(
    "PAID_RESOURCE_REQUIRES_ENTITLEMENT=PASS",
  );
  console.log(
    "ENTITLEMENT_PRINCIPAL_RESOURCE_PLAN_BINDING=PASS",
  );
  console.log(
    "ENTITLEMENT_ALLOWED_STATE=PASS",
  );
  console.log(
    "ENTITLEMENT_EXPIRED_STATE=PASS",
  );
  console.log(
    "ENTITLEMENT_LOCKED_STATE=PASS",
  );
  console.log(
    "ENTITLEMENT_ERROR_STATE=PASS",
  );
  console.log(
    "ENTITLEMENT_FAILURE_SANITIZATION=PASS",
  );
  console.log(
    "ABORT_SIGNAL_FORWARDING=PASS",
  );
  console.log(
    "RESULT_ENVELOPES_FROZEN=PASS",
  );
  console.log(
    "BRIDGE_ENVELOPE_COMPATIBILITY=PASS",
  );
  console.log(
    "DIRECT_FIREBASE_IMPORT=NO",
  );
  console.log(
    "DIRECT_ACCESS_SERVICE_IMPORT=NO",
  );
  console.log(
    "NAVIGATION_SIDE_EFFECTS=0",
  );
  console.log(
    "RUNTIME_LOAD=NO",
  );
  console.log(
    "PROVIDER_ACTIVATION=NO",
  );
  console.log(
    "RUNTIME_OWNER_ASSIGNMENTS=33",
  );
  console.log(
    "SAFE_DISABLED_PENDING_OWNER=149",
  );
  console.log(
    "CANONICAL_STATE_PUBLISH_BINDING=PASS",
  );
  console.log(
    "ENTITLEMENT_ALLOWED_PAST_EXPIRY_FAIL_CLOSED=PASS",
  );
  console.log(
    "ENTITLEMENT_EXPIRED_FUTURE_EXPIRY_FAIL_CLOSED=PASS",
  );
  console.log(
    "ENTITLEMENT_ALLOWED_FUTURE_EXPIRY=PASS",
  );
  console.log(
    "AUTHORIZE_SERVICE_TEST_STATUS=GREEN",
  );
}

main().catch((error) => {
  console.error(
    error && error.stack
      ? error.stack
      : String(error),
  );
  process.exit(1);
});
