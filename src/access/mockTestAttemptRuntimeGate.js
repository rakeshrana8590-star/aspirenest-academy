import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DECISIONS,
  MOCK_TEST_REASON_CODES,
  MOCK_TEST_TIME_SOURCES,
} from "./mockTestActionPolicy";
import {
  buildMockTestRuntimeDecision,
} from "./mockTestRuntimeAdapter";
import {
  MOCK_TEST_TRUSTED_TIME_STATES,
  resolveMockTestTrustedTime,
} from "./mockTestTrustedTime";

export const MOCK_TEST_ATTEMPT_GATE_STATES =
  Object.freeze({
    READY: "ready",
    NOT_FOUND: "not_found",
    UNPUBLISHED: "unpublished",
    LOGIN_REQUIRED: "login_required",
    LOCKED: "locked",
    LOADING: "loading",
    ERROR: "error",
    BLOCKED: "blocked",
    SERVER_TIME_REQUIRED:
      "server_time_required",
    UPCOMING: "upcoming",
    CLOSED: "closed",
    INVALID_SCHEDULE:
      "invalid_schedule",
    INVALID_ATTEMPT:
      "invalid_attempt",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const isBlockedProfile = (
  accessProfile = {}
) =>
  accessProfile?.isBlocked === true ||
  normalizeText(
    accessProfile?.shellState?.mode
  ) === "blocked";

const freezeGate = ({
  state,
  action,
  decision,
  reason,
  testId = "",
  recoveryRoute = "",
  requiredPlan = "",
  sourceScope = "",
  exactItem = false,
  scheduleStatus = "",
  requiresServerTime = false,
  requiresOwnedAttempt = false,
  trustedTime = null,
} = {}) => {
  const isAllowed =
    decision ===
      MOCK_TEST_DECISIONS.ALLOW &&
    reason ===
      MOCK_TEST_REASON_CODES.ALLOWED;
  const isAttemptAction =
    action ===
      MOCK_TEST_ACTIONS.ATTEMPT;
  const isSubmitAction =
    action ===
      MOCK_TEST_ACTIONS.SUBMIT;
  const canActivateAttemptRuntime =
    isAllowed && isAttemptAction;

  return Object.freeze({
    state,
    action,
    decision,
    reason,
    testId: cleanString(testId),
    recoveryRoute:
      cleanString(recoveryRoute),
    requiredPlan:
      cleanString(requiredPlan),
    sourceScope:
      cleanString(sourceScope),
    exactItem: exactItem === true,
    scheduleStatus:
      cleanString(scheduleStatus),
    requiresServerTime:
      requiresServerTime === true,
    requiresOwnedAttempt:
      requiresOwnedAttempt === true,
    trustedTimeState:
      trustedTime?.state ||
      MOCK_TEST_TRUSTED_TIME_STATES
        .UNAVAILABLE,
    trustedNowMs:
      trustedTime?.isTrusted
        ? trustedTime.nowMs
        : null,
    isAllowed,
    canExposeQuestions:
      canActivateAttemptRuntime,
    canActivateAttemptRuntime,
    canActivateTimer:
      canActivateAttemptRuntime,
    canActivateSecurity:
      canActivateAttemptRuntime,
    canReadAttemptStorage:
      canActivateAttemptRuntime,
    canWriteAttemptStorage:
      canActivateAttemptRuntime,
    canSubmit:
      isAllowed && isSubmitAction,
  });
};

const mapDecision = ({
  action,
  decision,
  trustedTime,
} = {}) => {
  const shared = {
    action,
    decision: decision.decision,
    reason: decision.reason,
    testId: decision.testId,
    requiredPlan:
      decision.requiredPlan,
    sourceScope:
      decision.sourceScope,
    exactItem:
      decision.exactItem,
    scheduleStatus:
      decision.scheduleStatus,
    requiresServerTime:
      decision.requiresServerTime,
    requiresOwnedAttempt:
      decision.requiresOwnedAttempt,
    trustedTime,
  };

  if (
    decision.decision ===
      MOCK_TEST_DECISIONS.ALLOW &&
    decision.reason ===
      MOCK_TEST_REASON_CODES.ALLOWED
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .READY,
    });
  }

  if (
    [
      MOCK_TEST_REASON_CODES.NOT_FOUND,
      MOCK_TEST_REASON_CODES.NOT_MOCK_TEST,
    ].includes(decision.reason)
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .NOT_FOUND,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.UNPUBLISHED
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .UNPUBLISHED,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.LOGIN_REQUIRED
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .LOGIN_REQUIRED,
      recoveryRoute: "/login",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.ACCESS_LOADING
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .LOADING,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.ACCESS_ERROR
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .ERROR,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    [
      MOCK_TEST_REASON_CODES.ACCESS_DENIED,
      MOCK_TEST_REASON_CODES
        .ACCESS_SCOPE_MISMATCH,
    ].includes(decision.reason)
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .LOCKED,
      recoveryRoute:
        "/ctet-tet/pricing",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES
      .SERVER_TIME_REQUIRED
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .SERVER_TIME_REQUIRED,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.UPCOMING
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .UPCOMING,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.WINDOW_CLOSED
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .CLOSED,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.INVALID_SCHEDULE
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .INVALID_SCHEDULE,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    [
      MOCK_TEST_REASON_CODES.ATTEMPT_REQUIRED,
      MOCK_TEST_REASON_CODES
        .ATTEMPT_TEST_MISMATCH,
      MOCK_TEST_REASON_CODES
        .ATTEMPT_OWNERSHIP_MISMATCH,
      MOCK_TEST_REASON_CODES
        .INVALID_ATTEMPT_STATE,
    ].includes(decision.reason)
  ) {
    return freezeGate({
      ...shared,
      state:
        MOCK_TEST_ATTEMPT_GATE_STATES
          .INVALID_ATTEMPT,
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  return freezeGate({
    ...shared,
    state:
      MOCK_TEST_ATTEMPT_GATE_STATES
        .ERROR,
    recoveryRoute:
      "/ctet-tet/mock-tests",
  });
};

export const buildMockTestAttemptRuntimeGate =
  ({
    action =
      MOCK_TEST_ACTIONS.ATTEMPT,
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    attempt = null,
    trustedTimeEvidence = null,
    clientNow = Date.now(),
  } = {}) => {
    const trustedTime =
      resolveMockTestTrustedTime({
        evidence:
          trustedTimeEvidence,
        checkedAtClientMs:
          clientNow,
      });

    if (isBlockedProfile(accessProfile)) {
      return freezeGate({
        state:
          MOCK_TEST_ATTEMPT_GATE_STATES
            .BLOCKED,
        action,
        decision:
          MOCK_TEST_DECISIONS.DENY,
        reason: "blocked",
        testId: test?.id,
        requiredPlan:
          test?.planCode ||
          test?.planType ||
          test?.requiredPlan,
        recoveryRoute: "/my-access",
        trustedTime,
      });
    }

    const decision =
      buildMockTestRuntimeDecision({
        action,
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        attempt,
        now:
          trustedTime.isTrusted
            ? trustedTime.nowMs
            : clientNow,
        timeSource:
          trustedTime.isTrusted
            ? MOCK_TEST_TIME_SOURCES.SERVER
            : MOCK_TEST_TIME_SOURCES.CLIENT,
      });

    return mapDecision({
      action,
      decision,
      trustedTime,
    });
  };
