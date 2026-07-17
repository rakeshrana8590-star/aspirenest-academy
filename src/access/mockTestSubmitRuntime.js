import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DECISIONS,
  MOCK_TEST_REASON_CODES,
} from "./mockTestActionPolicy";
import {
  MOCK_TEST_ATTEMPT_GATE_STATES,
  buildMockTestAttemptRuntimeGate,
} from "./mockTestAttemptRuntimeGate";
import {
  MOCK_TEST_SERVER_TIME_PROVIDER_STATES,
  createMockTestServerTimeProvider,
} from "./mockTestServerTimeProvider";
import {
  requestMockTestServerTime,
} from "./mockTestFirebaseServerTimeClient";

export const MOCK_TEST_SUBMIT_RUNTIME_STATES =
  Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    READY: "ready",
    DENIED: "denied",
    ERROR: "error",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const toFiniteEpochMs = (value) => {
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0
    ? numeric
    : null;
};

const freezeResult = ({
  state,
  gate = null,
  attempt = null,
  providerResult = null,
  submittedAtMs = null,
  requestId = "",
  errorCode = "",
  message = "",
} = {}) =>
  Object.freeze({
    state,
    gate,
    attempt,
    providerResult,
    submittedAtMs:
      toFiniteEpochMs(submittedAtMs),
    requestId:
      cleanString(requestId) || null,
    errorCode:
      cleanString(errorCode) || null,
    message: cleanString(message),
    isReady:
      state ===
        MOCK_TEST_SUBMIT_RUNTIME_STATES.READY &&
      gate?.canSubmit === true &&
      toFiniteEpochMs(submittedAtMs) !== null,
    canSubmit:
      state ===
        MOCK_TEST_SUBMIT_RUNTIME_STATES.READY &&
      gate?.canSubmit === true &&
      toFiniteEpochMs(submittedAtMs) !== null,
  });

export const buildMockTestSubmitAttemptEvidence = ({
  test = null,
  user = null,
  attemptState = null,
} = {}) => {
  const normalizedAttempt =
    attemptState &&
    typeof attemptState === "object"
      ? attemptState
      : {};

  const ownerUid =
    cleanString(normalizedAttempt.ownerUid) ||
    cleanString(user?.uid);
  const ownerEmail =
    cleanString(normalizedAttempt.ownerEmail) ||
    cleanString(user?.email);

  return Object.freeze({
    ...normalizedAttempt,
    testId:
      cleanString(normalizedAttempt.testId) ||
      cleanString(test?.id),
    ownerUid,
    ownerEmail,
    status: normalizedAttempt.isSubmitted
      ? "submitted"
      : cleanString(normalizedAttempt.status) ||
        "in_progress",
    startedAt:
      toFiniteEpochMs(normalizedAttempt.startedAt),
  });
};

const normalizeIdentity = (value = "") =>
  cleanString(value).toLowerCase();

const buildMockTestSubmitPreflightGate = ({
  test = null,
  reason =
    MOCK_TEST_REASON_CODES.INVALID_ATTEMPT_STATE,
} = {}) =>
  Object.freeze({
    state:
      MOCK_TEST_ATTEMPT_GATE_STATES
        .INVALID_ATTEMPT,
    action: MOCK_TEST_ACTIONS.SUBMIT,
    decision: MOCK_TEST_DECISIONS.DENY,
    reason,
    testId: cleanString(test?.id),
    recoveryRoute:
      "/ctet-tet/mock-tests",
    requiredPlan: cleanString(
      test?.planCode ||
        test?.planType ||
        test?.requiredPlan
    ),
    sourceScope: "",
    exactItem: false,
    scheduleStatus: "",
    requiresServerTime: true,
    requiresOwnedAttempt: true,
    trustedTimeState: "unavailable",
    trustedNowMs: null,
    isAllowed: false,
    canExposeQuestions: false,
    canActivateAttemptRuntime: false,
    canActivateTimer: false,
    canActivateSecurity: false,
    canReadAttemptStorage: false,
    canWriteAttemptStorage: false,
    canSubmit: false,
  });

const getMockTestSubmitPreflightReason = ({
  test = null,
  user = null,
  attemptState = null,
  attempt = null,
} = {}) => {
  if (
    !attemptState ||
    typeof attemptState !== "object"
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_REQUIRED;
  }

  if (
    !toFiniteEpochMs(attempt?.startedAt)
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_REQUIRED;
  }

  const testId = cleanString(test?.id);
  const attemptTestId =
    cleanString(attempt?.testId);

  if (
    testId &&
    attemptTestId &&
    attemptTestId !== testId
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_TEST_MISMATCH;
  }

  const userUid = cleanString(user?.uid);
  const attemptOwnerUid =
    cleanString(attempt?.ownerUid);
  const userEmail =
    normalizeIdentity(user?.email);
  const attemptOwnerEmail =
    normalizeIdentity(attempt?.ownerEmail);

  if (
    (userUid &&
      attemptOwnerUid &&
      userUid !== attemptOwnerUid) ||
    (userEmail &&
      attemptOwnerEmail &&
      userEmail !== attemptOwnerEmail)
  ) {
    return MOCK_TEST_REASON_CODES
      .ATTEMPT_OWNERSHIP_MISMATCH;
  }

  const status =
    normalizeIdentity(attempt?.status);

  if (
    attemptState?.isSubmitted === true ||
    [
      "submitted",
      "completed",
      "closed",
    ].includes(status)
  ) {
    return MOCK_TEST_REASON_CODES
      .INVALID_ATTEMPT_STATE;
  }

  if (
    status &&
    ![
      "in_progress",
      "in-progress",
      "active",
      "started",
    ].includes(status)
  ) {
    return MOCK_TEST_REASON_CODES
      .INVALID_ATTEMPT_STATE;
  }

  return "";
};

const resultFromGate = ({
  gate,
  attempt,
  providerResult = null,
} = {}) => {
  if (
    gate?.canSubmit === true &&
    toFiniteEpochMs(gate?.trustedNowMs) !== null
  ) {
    return freezeResult({
      state:
        MOCK_TEST_SUBMIT_RUNTIME_STATES.READY,
      gate,
      attempt,
      providerResult,
      submittedAtMs: gate.trustedNowMs,
      requestId:
        providerResult?.evidence?.requestId ||
        providerResult?.requestId,
      message:
        "Mock-test submission authorized with trusted server time.",
    });
  }

  if (
    [
      MOCK_TEST_ATTEMPT_GATE_STATES.ERROR,
      MOCK_TEST_ATTEMPT_GATE_STATES.LOADING,
      MOCK_TEST_ATTEMPT_GATE_STATES
        .SERVER_TIME_REQUIRED,
    ].includes(gate?.state)
  ) {
    return freezeResult({
      state:
        MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
      gate,
      attempt,
      providerResult,
      errorCode:
        gate?.reason ||
        "mock_test_submit_verification_error",
      message:
        "Secure submission could not be verified, so the attempt remains open.",
    });
  }

  return freezeResult({
    state:
      MOCK_TEST_SUBMIT_RUNTIME_STATES.DENIED,
    gate,
    attempt,
    providerResult,
    errorCode:
      gate?.reason ||
      "mock_test_submit_denied",
    message:
      "This attempt is not authorized for submission.",
  });
};

export const authorizeMockTestSubmission =
  async ({
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    attemptState = null,
    provider = null,
    clientNow = () => Date.now(),
  } = {}) => {
    const attempt =
      buildMockTestSubmitAttemptEvidence({
        test,
        user,
        attemptState,
      });

    const preflightReason =
      getMockTestSubmitPreflightReason({
        test,
        user,
        attemptState,
        attempt,
      });

    if (preflightReason) {
      return resultFromGate({
        gate:
          buildMockTestSubmitPreflightGate({
            test,
            reason: preflightReason,
          }),
        attempt,
      });
    }

    const initialGate =
      buildMockTestAttemptRuntimeGate({
        action: MOCK_TEST_ACTIONS.SUBMIT,
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        attempt,
        trustedTimeEvidence: null,
        clientNow: clientNow(),
      });

    if (
      initialGate.state !==
      MOCK_TEST_ATTEMPT_GATE_STATES
        .SERVER_TIME_REQUIRED
    ) {
      return resultFromGate({
        gate: initialGate,
        attempt,
      });
    }

    if (
      !provider ||
      typeof provider.load !== "function"
    ) {
      return freezeResult({
        state:
          MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
        gate: initialGate,
        attempt,
        errorCode:
          "server_time_provider_unavailable",
        message:
          "Trusted server time is unavailable, so the attempt was not submitted.",
      });
    }

    let providerResult;

    try {
      providerResult = await provider.load({
        purpose: "mock_test_submit",
        testId: test?.id,
      });
    } catch (error) {
      return freezeResult({
        state:
          MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
        gate: initialGate,
        attempt,
        errorCode:
          cleanString(error?.code) ||
          "mock_test_submit_time_request_failed",
        message:
          cleanString(error?.message) ||
          "Trusted server time could not be verified, so the attempt was not submitted.",
      });
    }

    if (
      providerResult?.state !==
        MOCK_TEST_SERVER_TIME_PROVIDER_STATES.READY ||
      providerResult?.isReady !== true ||
      providerResult?.evidence?.isTrusted !== true
    ) {
      return freezeResult({
        state:
          MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR,
        gate: initialGate,
        attempt,
        providerResult,
        errorCode:
          providerResult?.errorCode ||
          "trusted_server_time_unavailable",
        message:
          providerResult?.message ||
          "Trusted server time could not be verified, so the attempt was not submitted.",
      });
    }

    const gate =
      buildMockTestAttemptRuntimeGate({
        action: MOCK_TEST_ACTIONS.SUBMIT,
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        attempt,
        trustedTimeEvidence:
          providerResult.evidence,
        clientNow: clientNow(),
      });

    return resultFromGate({
      gate,
      attempt,
      providerResult,
    });
  };

export const createMockTestSubmitAuthorizer = ({
  callServerTime = requestMockTestServerTime,
  getCurrentUser = () => null,
  clientNow = () => Date.now(),
  maxRoundTripMs,
  maxEvidenceAgeMs,
} = {}) => {
  const provider =
    createMockTestServerTimeProvider({
      callServerTime,
      getCurrentUser,
      clientNow,
      maxRoundTripMs,
      maxEvidenceAgeMs,
    });

  return (request = {}) =>
    authorizeMockTestSubmission({
      ...request,
      provider,
      clientNow,
    });
};
