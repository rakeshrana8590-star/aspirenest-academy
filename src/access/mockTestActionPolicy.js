export const MOCK_TEST_ACTIONS =
  Object.freeze({
    DISCOVER: "DISCOVER",
    OPEN: "OPEN",
    ATTEMPT: "ATTEMPT",
    SUBMIT: "SUBMIT",
    VIEW_RESULT: "VIEW_RESULT",
    REVIEW: "REVIEW",
    LEADERBOARD: "LEADERBOARD",
  });

export const MOCK_TEST_DECISIONS =
  Object.freeze({
    ALLOW: "allow",
    DENY: "deny",
    HIDE: "hide",
    LOCKED_PREVIEW: "locked_preview",
  });

export const MOCK_TEST_REASON_CODES =
  Object.freeze({
    ALLOWED: "allowed",
    INVALID_ACTION: "invalid_action",
    NOT_FOUND: "not_found",
    NOT_MOCK_TEST: "not_mock_test",
    UNPUBLISHED: "unpublished",
    LOGIN_REQUIRED: "login_required",
    ACCESS_LOADING: "access_loading",
    ACCESS_ERROR: "access_error",
    ACCESS_DENIED: "access_denied",
    ACCESS_SCOPE_MISMATCH:
      "access_scope_mismatch",
    INVALID_SCHEDULE: "invalid_schedule",
    SERVER_TIME_REQUIRED:
      "server_time_required",
    UPCOMING: "upcoming",
    WINDOW_CLOSED: "window_closed",
    ATTEMPT_REQUIRED: "attempt_required",
    ATTEMPT_TEST_MISMATCH:
      "attempt_test_mismatch",
    ATTEMPT_OWNERSHIP_MISMATCH:
      "attempt_ownership_mismatch",
    INVALID_ATTEMPT_STATE:
      "invalid_attempt_state",
    RESULT_REQUIRED: "result_required",
    RESULT_TEST_MISMATCH:
      "result_test_mismatch",
    RESULT_OWNERSHIP_MISMATCH:
      "result_ownership_mismatch",
    INVALID_RESULT_STATE:
      "invalid_result_state",
    REVIEW_NOT_RELEASED:
      "review_not_released",
    PUBLIC_PROJECTION_REQUIRED:
      "public_projection_required",
  });

export const MOCK_TEST_DISCOVERY_MODES =
  Object.freeze({
    CATALOG: "catalog",
    MY_ACCESS: "my_access",
  });

export const MOCK_TEST_TIME_SOURCES =
  Object.freeze({
    CLIENT: "client",
    SERVER: "server",
  });

export const MOCK_TEST_SCHEDULE_STATES =
  Object.freeze({
    AVAILABLE: "available",
    UPCOMING: "upcoming",
    CLOSED: "closed",
    INVALID: "invalid",
  });

export const MOCK_TEST_ACCESS_STATES =
  Object.freeze({
    ALLOWED: "allowed",
    DENIED: "denied",
    LOADING: "loading",
    ERROR: "error",
  });

const KNOWN_ACTIONS = new Set(
  Object.values(MOCK_TEST_ACTIONS)
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

const VALID_ATTEMPT_STATES = new Set([
  "in_progress",
  "started",
  "active",
]);

const VALID_RESULT_STATES = new Set([
  "submitted",
  "scored",
  "final",
  "completed",
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const normalizeEmail = (value = "") =>
  normalizeText(value);

const normalizeAction = (value = "") =>
  cleanString(value).toUpperCase();

const normalizeStatus = (value = "") =>
  normalizeText(value)
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const normalizeScope = (value = "") =>
  normalizeText(value);

const toComparableTime = (value) => {
  if (!value) return null;

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const parsed =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);
  const time = parsed.getTime();

  return Number.isFinite(time)
    ? time
    : null;
};

const buildScheduledTime = (
  dateValue = "",
  timeValue = "",
  fallbackTime = "00:00"
) => {
  const dateText = cleanString(dateValue);
  const timeText = cleanString(timeValue);

  if (!dateText) return null;

  const combined = dateText.includes("T")
    ? dateText
    : `${dateText}T${
        timeText || fallbackTime
      }`;
  const parsed = new Date(combined);
  const time = parsed.getTime();

  return Number.isFinite(time)
    ? time
    : Number.NaN;
};

const freezeDecision = ({
  action = "",
  decision = MOCK_TEST_DECISIONS.DENY,
  reason =
    MOCK_TEST_REASON_CODES.ACCESS_DENIED,
  testId = "",
  scheduleStatus =
    MOCK_TEST_SCHEDULE_STATES.AVAILABLE,
  requiredPlan = "FREE",
  sourceScope = "",
  exactItem = false,
  requiresAuthentication = false,
  requiresServerTime = false,
  requiresOwnedAttempt = false,
  requiresOwnedResult = false,
  canExposeCatalogMetadata = false,
  canExposeQuestions = false,
  canExposeAnswers = false,
} = {}) =>
  Object.freeze({
    action: normalizeAction(action),
    decision,
    allowed:
      decision === MOCK_TEST_DECISIONS.ALLOW,
    visible:
      decision === MOCK_TEST_DECISIONS.ALLOW ||
      decision ===
        MOCK_TEST_DECISIONS.LOCKED_PREVIEW,
    locked:
      decision ===
      MOCK_TEST_DECISIONS.LOCKED_PREVIEW,
    reason,
    testId: cleanString(testId),
    scheduleStatus,
    requiredPlan:
      cleanString(requiredPlan) || "FREE",
    sourceScope: normalizeScope(sourceScope),
    exactItem: Boolean(exactItem),
    requiresAuthentication:
      Boolean(requiresAuthentication),
    requiresServerTime:
      Boolean(requiresServerTime),
    requiresOwnedAttempt:
      Boolean(requiresOwnedAttempt),
    requiresOwnedResult:
      Boolean(requiresOwnedResult),
    canExposeCatalogMetadata:
      Boolean(canExposeCatalogMetadata),
    canExposeQuestions:
      Boolean(canExposeQuestions),
    canExposeAnswers:
      Boolean(canExposeAnswers),
  });

const normalizePrincipal = (
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

  return Object.freeze({
    uid,
    email,
    isAuthenticated:
      principal.isAuthenticated === true ||
      Boolean(uid || email),
    isAdmin:
      principal.isAdmin === true ||
      ["admin", "super_admin", "owner"].includes(
        normalizeText(principal.role)
      ),
  });
};

const getTestPlan = (test = {}) =>
  cleanString(
    test.planCode ||
      test.planType ||
      test.requiredPlan ||
      test.plan
  ).toUpperCase() || "FREE";

const isFreeTest = (test = {}) =>
  getTestPlan(test) === "FREE";

const isPublishedMockTest = (
  test = {}
) =>
  normalizeText(test.section) ===
    "mocktest" &&
  normalizeText(test.status) ===
    "published";

const getRecordOwnerUid = (record = {}) =>
  cleanString(
    record.ownerUid ||
      record.uid ||
      record.userId ||
      record.studentId
  );

const getRecordOwnerEmail = (
  record = {}
) =>
  normalizeEmail(
    record.ownerEmail ||
      record.email ||
      record.studentEmail ||
      record.userEmail
  );

const getRecordTestId = (record = {}) =>
  cleanString(
    record.testId ||
      record.mockTestId ||
      record.testID ||
      record.contentId ||
      record.resourceId
  );

export const isMockRecordOwnedByPrincipal =
  (
    record = {},
    principal = {}
  ) => {
    const owner =
      normalizePrincipal(principal);
    const ownerUid =
      getRecordOwnerUid(record);
    const ownerEmail =
      getRecordOwnerEmail(record);

    if (!owner.isAuthenticated) {
      return false;
    }

    if (!ownerUid && !ownerEmail) {
      return false;
    }

    if (
      ownerUid &&
      (!owner.uid || ownerUid !== owner.uid)
    ) {
      return false;
    }

    if (
      ownerEmail &&
      (!owner.email ||
        ownerEmail !== owner.email)
    ) {
      return false;
    }

    return true;
  };

const normalizeAccessState = (
  access = {}
) => {
  const status = normalizeStatus(
    access.status ||
      access.state ||
      access.decision
  );

  if (
    ALLOWED_ACCESS_STATUSES.has(status)
  ) {
    return MOCK_TEST_ACCESS_STATES.ALLOWED;
  }

  if (
    LOADING_ACCESS_STATUSES.has(status)
  ) {
    return MOCK_TEST_ACCESS_STATES.LOADING;
  }

  if (
    ERROR_ACCESS_STATUSES.has(status)
  ) {
    return MOCK_TEST_ACCESS_STATES.ERROR;
  }

  return MOCK_TEST_ACCESS_STATES.DENIED;
};

const isAccessBoundToTest = (
  access = {},
  testId = ""
) => {
  const scope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );
  const normalizedTestId =
    cleanString(testId);
  const module = normalizeText(
    access.module
  );
  const itemType = normalizeText(
    access.itemType
  );
  const itemId = cleanString(
    access.resourceId ||
      access.itemId ||
      access.testId
  );
  const itemIds = Array.isArray(
    access.resourceIds || access.itemIds
  )
    ? (access.resourceIds ||
        access.itemIds).map(cleanString)
    : [];

  if (scope === "item") {
    return Boolean(
      normalizedTestId &&
        itemId === normalizedTestId &&
        (!module ||
          module === "mocktest") &&
        (!itemType ||
          itemType === "mocktest")
    );
  }

  if (scope === "bundle") {
    return Boolean(
      normalizedTestId &&
        itemIds.includes(
          normalizedTestId
        ) &&
        (!module ||
          module === "mocktest")
    );
  }

  if (scope === "module") {
    return module === "mocktest";
  }

  if (scope === "plan") {
    return true;
  }

  return false;
};

const resolveAccessDecision = ({
  test = {},
  access = {},
} = {}) => {
  if (isFreeTest(test)) {
    return Object.freeze({
      state:
        MOCK_TEST_ACCESS_STATES.ALLOWED,
      sourceScope: "free",
      exactItem: false,
      reason:
        MOCK_TEST_REASON_CODES.ALLOWED,
    });
  }

  const state =
    normalizeAccessState(access);
  const sourceScope = normalizeScope(
    access.sourceScope ||
      access.scopeType ||
      access.scope
  );

  if (
    state ===
    MOCK_TEST_ACCESS_STATES.LOADING
  ) {
    return Object.freeze({
      state,
      sourceScope,
      exactItem: false,
      reason:
        MOCK_TEST_REASON_CODES.ACCESS_LOADING,
    });
  }

  if (
    state ===
    MOCK_TEST_ACCESS_STATES.ERROR
  ) {
    return Object.freeze({
      state,
      sourceScope,
      exactItem: false,
      reason:
        MOCK_TEST_REASON_CODES.ACCESS_ERROR,
    });
  }

  if (
    state !==
    MOCK_TEST_ACCESS_STATES.ALLOWED
  ) {
    return Object.freeze({
      state:
        MOCK_TEST_ACCESS_STATES.DENIED,
      sourceScope,
      exactItem: false,
      reason:
        MOCK_TEST_REASON_CODES.ACCESS_DENIED,
    });
  }

  const isBound = isAccessBoundToTest(
    access,
    test.id
  );

  if (!isBound) {
    return Object.freeze({
      state:
        MOCK_TEST_ACCESS_STATES.DENIED,
      sourceScope,
      exactItem: false,
      reason:
        MOCK_TEST_REASON_CODES
          .ACCESS_SCOPE_MISMATCH,
    });
  }

  return Object.freeze({
    state:
      MOCK_TEST_ACCESS_STATES.ALLOWED,
    sourceScope,
    exactItem:
      sourceScope === "item",
    reason:
      MOCK_TEST_REASON_CODES.ALLOWED,
  });
};

export const resolveMockTestSchedule = ({
  test = {},
  now = Date.now(),
} = {}) => {
  const hasSchedule = Boolean(
    cleanString(test.examStartDate) ||
      cleanString(test.examStartTime) ||
      cleanString(test.examEndDate) ||
      cleanString(test.examEndTime)
  );

  if (!hasSchedule) {
    return Object.freeze({
      status:
        MOCK_TEST_SCHEDULE_STATES.AVAILABLE,
      hasSchedule: false,
      startsAt: null,
      endsAt: null,
    });
  }

  const startsAt = buildScheduledTime(
    test.examStartDate,
    test.examStartTime,
    "00:00"
  );
  const endsAt = buildScheduledTime(
    test.examEndDate,
    test.examEndTime,
    "23:59"
  );
  const nowMs = toComparableTime(now);

  if (
    nowMs === null ||
    Number.isNaN(startsAt) ||
    Number.isNaN(endsAt) ||
    (startsAt !== null &&
      endsAt !== null &&
      endsAt < startsAt)
  ) {
    return Object.freeze({
      status:
        MOCK_TEST_SCHEDULE_STATES.INVALID,
      hasSchedule: true,
      startsAt:
        Number.isFinite(startsAt)
          ? startsAt
          : null,
      endsAt:
        Number.isFinite(endsAt)
          ? endsAt
          : null,
    });
  }

  if (
    startsAt !== null &&
    nowMs < startsAt
  ) {
    return Object.freeze({
      status:
        MOCK_TEST_SCHEDULE_STATES.UPCOMING,
      hasSchedule: true,
      startsAt,
      endsAt,
    });
  }

  if (
    endsAt !== null &&
    nowMs > endsAt
  ) {
    return Object.freeze({
      status:
        MOCK_TEST_SCHEDULE_STATES.CLOSED,
      hasSchedule: true,
      startsAt,
      endsAt,
    });
  }

  return Object.freeze({
    status:
      MOCK_TEST_SCHEDULE_STATES.AVAILABLE,
    hasSchedule: true,
    startsAt,
    endsAt,
  });
};

const getAttemptState = (
  attempt = {}
) => {
  const direct = normalizeStatus(
    attempt.workflowState ||
      attempt.status
  );

  if (direct) return direct;
  if (
    attempt.isSubmitted === true ||
    attempt.submittedAt
  ) {
    return "submitted";
  }
  if (attempt.startedAt) {
    return "in_progress";
  }

  return "not_started";
};

const getResultState = (
  result = {}
) => {
  const direct = normalizeStatus(
    result.workflowState ||
      result.status
  );

  if (direct) return direct;
  if (
    result.isSubmitted === true ||
    result.submittedAt ||
    result.completedAt ||
    result.endedAt
  ) {
    return "submitted";
  }

  return "";
};

const denyForAccess = ({
  action,
  test,
  schedule,
  accessResolution,
} = {}) =>
  freezeDecision({
    action,
    decision:
      action ===
      MOCK_TEST_ACTIONS.DISCOVER
        ? MOCK_TEST_DECISIONS.HIDE
        : MOCK_TEST_DECISIONS.DENY,
    reason: accessResolution.reason,
    testId: test.id,
    scheduleStatus: schedule.status,
    requiredPlan: getTestPlan(test),
    sourceScope:
      accessResolution.sourceScope,
    exactItem:
      accessResolution.exactItem,
    requiresAuthentication: true,
  });

const validateOwnedAttempt = ({
  test = {},
  principal = {},
  attempt = {},
} = {}) => {
  if (
    !attempt ||
    typeof attempt !== "object" ||
    !Object.keys(attempt).length
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_REQUIRED;
  }

  if (
    getRecordTestId(attempt) !==
    cleanString(test.id)
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_TEST_MISMATCH;
  }

  if (
    !isMockRecordOwnedByPrincipal(
      attempt,
      principal
    )
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_OWNERSHIP_MISMATCH;
  }

  if (
    !VALID_ATTEMPT_STATES.has(
      getAttemptState(attempt)
    )
  ) {
    return MOCK_TEST_REASON_CODES
      .INVALID_ATTEMPT_STATE;
  }

  return "";
};

const validateOwnedResult = ({
  test = {},
  principal = {},
  result = {},
} = {}) => {
  if (
    !result ||
    typeof result !== "object" ||
    !Object.keys(result).length
  ) {
    return MOCK_TEST_REASON_CODES
      .RESULT_REQUIRED;
  }

  if (
    getRecordTestId(result) !==
    cleanString(test.id)
  ) {
    return MOCK_TEST_REASON_CODES
      .RESULT_TEST_MISMATCH;
  }

  if (
    !isMockRecordOwnedByPrincipal(
      result,
      principal
    )
  ) {
    return MOCK_TEST_REASON_CODES
      .RESULT_OWNERSHIP_MISMATCH;
  }

  if (
    !VALID_RESULT_STATES.has(
      getResultState(result)
    )
  ) {
    return MOCK_TEST_REASON_CODES
      .INVALID_RESULT_STATE;
  }

  return "";
};

export const buildMockTestActionDecision =
  ({
    action = "",
    test = null,
    principal = {},
    access = {},
    attempt = null,
    result = null,
    discoveryMode =
      MOCK_TEST_DISCOVERY_MODES.CATALOG,
    now = Date.now(),
    timeSource =
      MOCK_TEST_TIME_SOURCES.CLIENT,
    reviewReleased = false,
    publicProjection = false,
  } = {}) => {
    const normalizedAction =
      normalizeAction(action);
    const actor =
      normalizePrincipal(principal);

    if (!KNOWN_ACTIONS.has(normalizedAction)) {
      return freezeDecision({
        action: normalizedAction,
        reason:
          MOCK_TEST_REASON_CODES
            .INVALID_ACTION,
      });
    }

    if (!test || !cleanString(test.id)) {
      return freezeDecision({
        action: normalizedAction,
        reason:
          MOCK_TEST_REASON_CODES.NOT_FOUND,
      });
    }

    if (
      normalizeText(test.section) !==
      "mocktest"
    ) {
      return freezeDecision({
        action: normalizedAction,
        reason:
          MOCK_TEST_REASON_CODES.NOT_MOCK_TEST,
        testId: test.id,
      });
    }

    const schedule =
      resolveMockTestSchedule({
        test,
        now,
      });
    const requiredPlan =
      getTestPlan(test);

    if (!isPublishedMockTest(test)) {
      return freezeDecision({
        action: normalizedAction,
        decision:
          normalizedAction ===
          MOCK_TEST_ACTIONS.DISCOVER
            ? MOCK_TEST_DECISIONS.HIDE
            : MOCK_TEST_DECISIONS.DENY,
        reason:
          MOCK_TEST_REASON_CODES.UNPUBLISHED,
        testId: test.id,
        scheduleStatus: schedule.status,
        requiredPlan,
      });
    }

    if (
      schedule.status ===
      MOCK_TEST_SCHEDULE_STATES.INVALID
    ) {
      return freezeDecision({
        action: normalizedAction,
        decision:
          normalizedAction ===
          MOCK_TEST_ACTIONS.DISCOVER
            ? MOCK_TEST_DECISIONS.HIDE
            : MOCK_TEST_DECISIONS.DENY,
        reason:
          MOCK_TEST_REASON_CODES
            .INVALID_SCHEDULE,
        testId: test.id,
        scheduleStatus: schedule.status,
        requiredPlan,
      });
    }

    const accessResolution =
      resolveAccessDecision({
        test,
        access,
      });

    if (
      normalizedAction ===
      MOCK_TEST_ACTIONS.DISCOVER
    ) {
      if (
        accessResolution.state ===
        MOCK_TEST_ACCESS_STATES.LOADING ||
        accessResolution.state ===
        MOCK_TEST_ACCESS_STATES.ERROR
      ) {
        return denyForAccess({
          action: normalizedAction,
          test,
          schedule,
          accessResolution,
        });
      }

      if (
        accessResolution.state ===
        MOCK_TEST_ACCESS_STATES.ALLOWED
      ) {
        return freezeDecision({
          action: normalizedAction,
          decision:
            MOCK_TEST_DECISIONS.ALLOW,
          reason:
            MOCK_TEST_REASON_CODES.ALLOWED,
          testId: test.id,
          scheduleStatus: schedule.status,
          requiredPlan,
          sourceScope:
            accessResolution.sourceScope,
          exactItem:
            accessResolution.exactItem,
          canExposeCatalogMetadata: true,
        });
      }

      if (
        discoveryMode ===
        MOCK_TEST_DISCOVERY_MODES
          .MY_ACCESS
      ) {
        return freezeDecision({
          action: normalizedAction,
          decision:
            MOCK_TEST_DECISIONS.HIDE,
          reason: accessResolution.reason,
          testId: test.id,
          scheduleStatus: schedule.status,
          requiredPlan,
        });
      }

      return freezeDecision({
        action: normalizedAction,
        decision:
          MOCK_TEST_DECISIONS
            .LOCKED_PREVIEW,
        reason: accessResolution.reason,
        testId: test.id,
        scheduleStatus: schedule.status,
        requiredPlan,
        canExposeCatalogMetadata: true,
      });
    }

    if (
      normalizedAction ===
      MOCK_TEST_ACTIONS.LEADERBOARD
    ) {
      if (!publicProjection) {
        return freezeDecision({
          action: normalizedAction,
          reason:
            MOCK_TEST_REASON_CODES
              .PUBLIC_PROJECTION_REQUIRED,
          testId: test.id,
          scheduleStatus: schedule.status,
          requiredPlan,
        });
      }

      return freezeDecision({
        action: normalizedAction,
        decision:
          MOCK_TEST_DECISIONS.ALLOW,
        reason:
          MOCK_TEST_REASON_CODES.ALLOWED,
        testId: test.id,
        scheduleStatus: schedule.status,
        requiredPlan,
        canExposeCatalogMetadata: true,
      });
    }

    if (!actor.isAuthenticated) {
      return freezeDecision({
        action: normalizedAction,
        reason:
          MOCK_TEST_REASON_CODES
            .LOGIN_REQUIRED,
        testId: test.id,
        scheduleStatus: schedule.status,
        requiredPlan,
        requiresAuthentication: true,
      });
    }

    if (
      accessResolution.state !==
      MOCK_TEST_ACCESS_STATES.ALLOWED
    ) {
      return denyForAccess({
        action: normalizedAction,
        test,
        schedule,
        accessResolution,
      });
    }

    const baseAllowed = {
      action: normalizedAction,
      decision:
        MOCK_TEST_DECISIONS.ALLOW,
      reason:
        MOCK_TEST_REASON_CODES.ALLOWED,
      testId: test.id,
      scheduleStatus: schedule.status,
      requiredPlan,
      sourceScope:
        accessResolution.sourceScope,
      exactItem:
        accessResolution.exactItem,
      requiresAuthentication: true,
      canExposeCatalogMetadata: true,
    };

    if (
      normalizedAction ===
      MOCK_TEST_ACTIONS.OPEN
    ) {
      return freezeDecision(baseAllowed);
    }

    if (
      normalizedAction ===
      MOCK_TEST_ACTIONS.ATTEMPT
    ) {
      if (
        schedule.hasSchedule &&
        timeSource !==
          MOCK_TEST_TIME_SOURCES.SERVER
      ) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason:
            MOCK_TEST_REASON_CODES
              .SERVER_TIME_REQUIRED,
          requiresServerTime: true,
        });
      }

      if (
        schedule.status ===
        MOCK_TEST_SCHEDULE_STATES.UPCOMING
      ) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason:
            MOCK_TEST_REASON_CODES.UPCOMING,
          requiresServerTime:
            schedule.hasSchedule,
        });
      }

      if (
        schedule.status ===
        MOCK_TEST_SCHEDULE_STATES.CLOSED
      ) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason:
            MOCK_TEST_REASON_CODES
              .WINDOW_CLOSED,
          requiresServerTime:
            schedule.hasSchedule,
        });
      }

      if (
        attempt &&
        Object.keys(attempt).length
      ) {
        const attemptReason =
          validateOwnedAttempt({
            test,
            principal: actor,
            attempt,
          });

        if (attemptReason) {
          return freezeDecision({
            ...baseAllowed,
            decision:
              MOCK_TEST_DECISIONS.DENY,
            reason: attemptReason,
            requiresOwnedAttempt: true,
            requiresServerTime:
              schedule.hasSchedule,
          });
        }
      }

      return freezeDecision({
        ...baseAllowed,
        requiresServerTime:
          schedule.hasSchedule,
        requiresOwnedAttempt:
          Boolean(attempt),
        canExposeQuestions: true,
      });
    }

    if (
      normalizedAction ===
      MOCK_TEST_ACTIONS.SUBMIT
    ) {
      if (
        timeSource !==
        MOCK_TEST_TIME_SOURCES.SERVER
      ) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason:
            MOCK_TEST_REASON_CODES
              .SERVER_TIME_REQUIRED,
          requiresServerTime: true,
          requiresOwnedAttempt: true,
        });
      }

      const attemptReason =
        validateOwnedAttempt({
          test,
          principal: actor,
          attempt,
        });

      if (attemptReason) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason: attemptReason,
          requiresServerTime: true,
          requiresOwnedAttempt: true,
        });
      }

      if (
        schedule.status ===
          MOCK_TEST_SCHEDULE_STATES.UPCOMING ||
        schedule.status ===
          MOCK_TEST_SCHEDULE_STATES.CLOSED
      ) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason:
            schedule.status ===
            MOCK_TEST_SCHEDULE_STATES.UPCOMING
              ? MOCK_TEST_REASON_CODES.UPCOMING
              : MOCK_TEST_REASON_CODES
                  .WINDOW_CLOSED,
          requiresServerTime: true,
          requiresOwnedAttempt: true,
        });
      }

      return freezeDecision({
        ...baseAllowed,
        requiresServerTime: true,
        requiresOwnedAttempt: true,
      });
    }

    if (
      normalizedAction ===
        MOCK_TEST_ACTIONS.VIEW_RESULT ||
      normalizedAction ===
        MOCK_TEST_ACTIONS.REVIEW
    ) {
      const resultReason =
        validateOwnedResult({
          test,
          principal: actor,
          result,
        });

      if (resultReason) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason: resultReason,
          requiresOwnedResult: true,
        });
      }

      if (
        normalizedAction ===
          MOCK_TEST_ACTIONS.REVIEW &&
        reviewReleased !== true
      ) {
        return freezeDecision({
          ...baseAllowed,
          decision:
            MOCK_TEST_DECISIONS.DENY,
          reason:
            MOCK_TEST_REASON_CODES
              .REVIEW_NOT_RELEASED,
          requiresOwnedResult: true,
        });
      }

      return freezeDecision({
        ...baseAllowed,
        requiresOwnedResult: true,
        canExposeAnswers:
          normalizedAction ===
          MOCK_TEST_ACTIONS.REVIEW,
      });
    }

    return freezeDecision({
      action: normalizedAction,
      reason:
        MOCK_TEST_REASON_CODES
          .INVALID_ACTION,
      testId: test.id,
      requiredPlan,
    });
  };

const CATALOG_FIELD_BUILDERS =
  Object.freeze({
    id: (test) => cleanString(test.id),
    title: (test) =>
      cleanString(test.title),
    description: (test) =>
      cleanString(
        test.description ||
          test.examInstructions
      ),
    section: () => "mockTest",
    status: () => "published",
    planCode: (test) =>
      getTestPlan(test),
    subject: (test) =>
      cleanString(test.subject),
    chapter: (test) =>
      cleanString(test.chapter),
    testType: (test) =>
      cleanString(test.testType),
    examType: (test) =>
      cleanString(test.examType),
    durationMinutes: (test) =>
      Number(
        test.durationMinutes ||
          test.duration ||
          0
      ) || 0,
    totalQuestions: (test) =>
      Number(
        test.totalQuestions ||
          test.questions?.length ||
          0
      ) || 0,
    totalMarks: (test) =>
      Number(test.totalMarks || 0) || 0,
    attemptLimit: (test) =>
      cleanString(test.attemptLimit),
    leaderboardMode: (test) =>
      cleanString(test.leaderboardMode),
    examStartDate: (test) =>
      cleanString(test.examStartDate),
    examStartTime: (test) =>
      cleanString(test.examStartTime),
    examEndDate: (test) =>
      cleanString(test.examEndDate),
    examEndTime: (test) =>
      cleanString(test.examEndTime),
  });

export const buildMockTestCatalogProjection =
  ({
    test = {},
    decision = null,
  } = {}) => {
    if (
      !decision ||
      decision.canExposeCatalogMetadata !==
        true ||
      !isPublishedMockTest(test)
    ) {
      return null;
    }

    const projection =
      Object.entries(
        CATALOG_FIELD_BUILDERS
      ).reduce(
        (result, [key, builder]) => ({
          ...result,
          [key]: builder(test),
        }),
        {}
      );

    return Object.freeze({
      ...projection,
      accessState: decision.decision,
      accessReason: decision.reason,
      scheduleStatus:
        decision.scheduleStatus,
      exactItem:
        decision.exactItem === true,
    });
  };

const maskPublicName = (value = "") => {
  const text = cleanString(value);

  if (!text || text.includes("@")) {
    return "AspireNest Learner";
  }

  const parts = text
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0] || "Learner";
  const second = parts[1] || "";

  return second
    ? `${first} ${second
        .slice(0, 1)
        .toUpperCase()}***`
    : `${first.slice(0, 1)}***`;
};

const clampPercent = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(number))
  );
};

export const buildPublicMockLeaderboardProjection =
  (
    entry = {},
    { rank = null } = {}
  ) =>
    Object.freeze({
      publicParticipantId:
        cleanString(
          entry.publicParticipantId
        ) || null,
      testId: getRecordTestId(entry),
      testTitle: cleanString(
        entry.testTitle
      ),
      displayName: maskPublicName(
        entry.publicDisplayName ||
          entry.studentName ||
          entry.name
      ),
      leaderboardMode: cleanString(
        entry.leaderboardMode
      ),
      rank:
        Number.isFinite(Number(rank))
          ? Number(rank)
          : null,
      percentage: clampPercent(
        entry.percentage ??
          entry.rankScore
      ),
      score:
        Number(entry.score || 0) || 0,
      totalMarks:
        Number(entry.totalMarks || 0) ||
        0,
      accuracy: clampPercent(
        entry.accuracy ??
          entry.percentage
      ),
      correctCount:
        Math.max(
          0,
          Number(entry.correctCount || 0) ||
            0
        ),
      totalQuestions:
        Math.max(
          0,
          Number(
            entry.totalQuestions || 0
          ) || 0
        ),
      durationSeconds:
        Math.max(
          0,
          Number(
            entry.durationSeconds || 0
          ) || 0
        ),
    });

export const buildMockAttemptOwnershipKey =
  ({
    principal = {},
    testId = "",
  } = {}) => {
    const actor =
      normalizePrincipal(principal);
    const normalizedTestId =
      cleanString(testId);

    if (!actor.uid || !normalizedTestId) {
      return "";
    }

    return `mockAttempt:${actor.uid}:${normalizedTestId}`;
  };
