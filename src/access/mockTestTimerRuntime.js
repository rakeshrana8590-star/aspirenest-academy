import {
  MOCK_TEST_TRUSTED_TIME_STATES,
  resolveMockTestTrustedTime,
} from "./mockTestTrustedTime";

export const MOCK_TEST_TIMER_RUNTIME_VERSION = 1;

export const MOCK_TEST_TIMER_RUNTIME_STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  NO_TIMER: "no_timer",
  EXPIRED: "expired",
  ERROR: "error",
});

const cleanString = (value = "") =>
  String(value ?? "").trim();

const toFiniteNumber = (value) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const toFiniteEpochMs = (value) => {
  const normalized = toFiniteNumber(value);
  return normalized !== null && normalized >= 0
    ? normalized
    : null;
};

const toNonNegativeSeconds = (value, fallback = 0) => {
  const normalized = toFiniteNumber(value);

  if (normalized === null) {
    return Math.max(0, Math.floor(Number(fallback) || 0));
  }

  return Math.max(0, Math.floor(normalized));
};

const getTimerMode = (test = {}) =>
  cleanString(test?.timerMode) || "globalTimer";

const freezeResult = ({
  state = MOCK_TEST_TIMER_RUNTIME_STATES.IDLE,
  testId = "",
  timerMode = "",
  attemptState = null,
  timeLeft = 0,
  trustedNowMs = null,
  deadlineAtServerMs = null,
  requestId = "",
  errorCode = "",
  message = "",
  wasMigrated = false,
  wasReset = false,
} = {}) =>
  Object.freeze({
    state,
    testId: cleanString(testId),
    timerMode: cleanString(timerMode),
    attemptState,
    timeLeft: toNonNegativeSeconds(timeLeft),
    trustedNowMs: toFiniteEpochMs(trustedNowMs),
    deadlineAtServerMs: toFiniteEpochMs(deadlineAtServerMs),
    requestId: cleanString(requestId) || null,
    errorCode: cleanString(errorCode) || null,
    message: cleanString(message),
    wasMigrated: wasMigrated === true,
    wasReset: wasReset === true,
    isReady: [
      MOCK_TEST_TIMER_RUNTIME_STATES.READY,
      MOCK_TEST_TIMER_RUNTIME_STATES.NO_TIMER,
      MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED,
    ].includes(state),
    canRenderAttempt: [
      MOCK_TEST_TIMER_RUNTIME_STATES.READY,
      MOCK_TEST_TIMER_RUNTIME_STATES.NO_TIMER,
      MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED,
    ].includes(state),
    canRunCountdown:
      state === MOCK_TEST_TIMER_RUNTIME_STATES.READY &&
      toNonNegativeSeconds(timeLeft) > 0,
    isExpired:
      state === MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED,
  });

const buildNoTimerState = ({
  test = null,
  attemptState = null,
} = {}) => {
  const nextAttemptState = {
    ...(attemptState || {}),
    testId:
      cleanString(attemptState?.testId) || cleanString(test?.id),
    timeLeft: 0,
    timerRuntime: {
      version: MOCK_TEST_TIMER_RUNTIME_VERSION,
      mode: "noTimer",
      source: "none",
    },
  };

  return freezeResult({
    state: MOCK_TEST_TIMER_RUNTIME_STATES.NO_TIMER,
    testId: test?.id,
    timerMode: "noTimer",
    attemptState: nextAttemptState,
    timeLeft: 0,
  });
};

const validateStoredTimerRuntime = ({
  timerRuntime = null,
  timerMode = "",
} = {}) => {
  if (!timerRuntime) {
    return Object.freeze({
      valid: true,
      isMissing: true,
    });
  }

  if (
    typeof timerRuntime !== "object" ||
    Array.isArray(timerRuntime)
  ) {
    return Object.freeze({
      valid: false,
      errorCode: "timer_runtime_invalid",
    });
  }

  if (
    Number(timerRuntime.version) !==
      MOCK_TEST_TIMER_RUNTIME_VERSION ||
    cleanString(timerRuntime.source).toLowerCase() !== "server" ||
    cleanString(timerRuntime.mode) !== timerMode ||
    toFiniteEpochMs(timerRuntime.anchoredAtServerMs) === null ||
    toFiniteEpochMs(timerRuntime.deadlineAtServerMs) === null ||
    toFiniteEpochMs(timerRuntime.lastReconciledAtServerMs) === null ||
    !cleanString(timerRuntime.requestId)
  ) {
    return Object.freeze({
      valid: false,
      errorCode: "timer_runtime_invalid",
    });
  }

  if (
    Number(timerRuntime.deadlineAtServerMs) <
    Number(timerRuntime.anchoredAtServerMs)
  ) {
    return Object.freeze({
      valid: false,
      errorCode: "timer_deadline_invalid",
    });
  }

  return Object.freeze({
    valid: true,
    isMissing: false,
  });
};

const buildTimedAttemptState = ({
  test = null,
  attemptState = null,
  timerMode = "globalTimer",
  remainingSeconds = 0,
  trustedNowMs = null,
  deadlineAtServerMs = null,
  requestId = "",
  anchoredAtServerMs = null,
  questionIndex = 0,
  wasMigrated = false,
} = {}) => ({
  ...(attemptState || {}),
  testId:
    cleanString(attemptState?.testId) || cleanString(test?.id),
  timeLeft: toNonNegativeSeconds(remainingSeconds),
  timerRuntime: {
    version: MOCK_TEST_TIMER_RUNTIME_VERSION,
    mode: timerMode,
    source: "server",
    requestId: cleanString(requestId),
    anchoredAtServerMs:
      toFiniteEpochMs(anchoredAtServerMs) ?? trustedNowMs,
    deadlineAtServerMs,
    lastReconciledAtServerMs: trustedNowMs,
    questionIndex:
      Number.isInteger(questionIndex) && questionIndex >= 0
        ? questionIndex
        : 0,
    migratedFromLegacy: wasMigrated === true,
  },
});

const getRemainingFromDeadline = ({
  deadlineAtServerMs,
  trustedNowMs,
} = {}) => {
  const deadline = toFiniteEpochMs(deadlineAtServerMs);
  const now = toFiniteEpochMs(trustedNowMs);

  if (deadline === null || now === null) return null;

  return Math.max(0, Math.ceil((deadline - now) / 1000));
};

export const reconcileMockTestAttemptTimer = ({
  test = null,
  attemptState = null,
  defaultTimeLeft = 0,
  trustedTimeEvidence = null,
  checkedAtClientMs = Date.now(),
} = {}) => {
  const timerMode = getTimerMode(test);

  if (timerMode === "noTimer") {
    return buildNoTimerState({ test, attemptState });
  }

  const defaultSeconds = toNonNegativeSeconds(defaultTimeLeft);

  if (defaultSeconds <= 0) {
    return freezeResult({
      state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
      testId: test?.id,
      timerMode,
      errorCode: "timer_duration_invalid",
      message: "The mock-test timer duration is invalid.",
    });
  }

  const trustedTime = resolveMockTestTrustedTime({
    evidence: trustedTimeEvidence,
    checkedAtClientMs,
  });

  if (
    trustedTime?.state !== MOCK_TEST_TRUSTED_TIME_STATES.READY ||
    trustedTime?.isTrusted !== true ||
    toFiniteEpochMs(trustedTime?.nowMs) === null ||
    !cleanString(trustedTime?.requestId)
  ) {
    return freezeResult({
      state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
      testId: test?.id,
      timerMode,
      errorCode:
        trustedTime?.errorCode || "trusted_timer_time_unavailable",
      message:
        "Trusted server time is required before the exam timer can start or resume.",
    });
  }

  const trustedNowMs = Number(trustedTime.nowMs);
  const currentIndex = Number.isInteger(attemptState?.currentIndex)
    ? Math.max(0, attemptState.currentIndex)
    : 0;
  const storedRuntime = attemptState?.timerRuntime || null;
  const runtimeValidation = validateStoredTimerRuntime({
    timerRuntime: storedRuntime,
    timerMode,
  });

  if (!runtimeValidation.valid) {
    return freezeResult({
      state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
      testId: test?.id,
      timerMode,
      errorCode: runtimeValidation.errorCode,
      message:
        "Stored timer evidence is invalid, so the attempt remains closed.",
    });
  }

  const savedSeconds = Math.min(
    defaultSeconds,
    toNonNegativeSeconds(attemptState?.timeLeft, defaultSeconds)
  );
  const isPerQuestionTimer = timerMode === "perQuestionTimer";
  const shouldResetQuestionTimer =
    isPerQuestionTimer &&
    !runtimeValidation.isMissing &&
    Number(storedRuntime.questionIndex) !== currentIndex;

  const wasMigrated = runtimeValidation.isMissing;
  const remainingSeconds = shouldResetQuestionTimer
    ? defaultSeconds
    : runtimeValidation.isMissing
    ? savedSeconds
    : Math.min(
        savedSeconds,
        getRemainingFromDeadline({
          deadlineAtServerMs: storedRuntime.deadlineAtServerMs,
          trustedNowMs,
        }) ?? 0
      );

  const anchoredAtServerMs =
    runtimeValidation.isMissing || shouldResetQuestionTimer
      ? trustedNowMs
      : Number(storedRuntime.anchoredAtServerMs);
  const deadlineAtServerMs =
    runtimeValidation.isMissing || shouldResetQuestionTimer
      ? trustedNowMs + remainingSeconds * 1000
      : Number(storedRuntime.deadlineAtServerMs);

  const nextAttemptState = buildTimedAttemptState({
    test,
    attemptState,
    timerMode,
    remainingSeconds,
    trustedNowMs,
    deadlineAtServerMs,
    requestId: trustedTime.requestId,
    anchoredAtServerMs,
    questionIndex: currentIndex,
    wasMigrated,
  });

  return freezeResult({
    state:
      remainingSeconds <= 0
        ? MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED
        : MOCK_TEST_TIMER_RUNTIME_STATES.READY,
    testId: test?.id,
    timerMode,
    attemptState: nextAttemptState,
    timeLeft: remainingSeconds,
    trustedNowMs,
    deadlineAtServerMs,
    requestId: trustedTime.requestId,
    wasMigrated,
    wasReset: shouldResetQuestionTimer,
  });
};

export const advanceMockTestAttemptTimer = ({
  test = null,
  attemptState = null,
  defaultTimeLeft = 0,
  trustedNowMs = null,
} = {}) => {
  const timerMode = getTimerMode(test);

  if (timerMode === "noTimer") {
    return buildNoTimerState({ test, attemptState });
  }

  const normalizedTrustedNowMs = toFiniteEpochMs(trustedNowMs);
  const defaultSeconds = toNonNegativeSeconds(defaultTimeLeft);
  const storedRuntime = attemptState?.timerRuntime || null;
  const runtimeValidation = validateStoredTimerRuntime({
    timerRuntime: storedRuntime,
    timerMode,
  });

  if (
    normalizedTrustedNowMs === null ||
    defaultSeconds <= 0 ||
    !runtimeValidation.valid ||
    runtimeValidation.isMissing
  ) {
    return freezeResult({
      state: MOCK_TEST_TIMER_RUNTIME_STATES.ERROR,
      testId: test?.id,
      timerMode,
      errorCode:
        normalizedTrustedNowMs === null
          ? "trusted_timer_clock_invalid"
          : runtimeValidation.errorCode || "timer_runtime_missing",
      message:
        "The trusted timer runtime could not be advanced safely.",
    });
  }

  const currentIndex = Number.isInteger(attemptState?.currentIndex)
    ? Math.max(0, attemptState.currentIndex)
    : 0;
  const isPerQuestionTimer = timerMode === "perQuestionTimer";
  const shouldResetQuestionTimer =
    isPerQuestionTimer &&
    Number(storedRuntime.questionIndex) !== currentIndex;

  const deadlineAtServerMs = shouldResetQuestionTimer
    ? normalizedTrustedNowMs + defaultSeconds * 1000
    : Number(storedRuntime.deadlineAtServerMs);
  const savedSeconds = Math.min(
    defaultSeconds,
    toNonNegativeSeconds(attemptState?.timeLeft, defaultSeconds)
  );
  const remainingSeconds = shouldResetQuestionTimer
    ? defaultSeconds
    : Math.min(
        savedSeconds,
        getRemainingFromDeadline({
          deadlineAtServerMs,
          trustedNowMs: normalizedTrustedNowMs,
        }) ?? 0
      );

  const nextAttemptState = buildTimedAttemptState({
    test,
    attemptState,
    timerMode,
    remainingSeconds,
    trustedNowMs: normalizedTrustedNowMs,
    deadlineAtServerMs,
    requestId: storedRuntime.requestId,
    anchoredAtServerMs: shouldResetQuestionTimer
      ? normalizedTrustedNowMs
      : Number(storedRuntime.anchoredAtServerMs),
    questionIndex: currentIndex,
    wasMigrated: storedRuntime.migratedFromLegacy === true,
  });

  return freezeResult({
    state:
      remainingSeconds <= 0
        ? MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED
        : MOCK_TEST_TIMER_RUNTIME_STATES.READY,
    testId: test?.id,
    timerMode,
    attemptState: nextAttemptState,
    timeLeft: remainingSeconds,
    trustedNowMs: normalizedTrustedNowMs,
    deadlineAtServerMs,
    requestId: storedRuntime.requestId,
    wasMigrated: storedRuntime.migratedFromLegacy === true,
    wasReset: shouldResetQuestionTimer,
  });
};
