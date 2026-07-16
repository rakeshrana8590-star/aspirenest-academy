import {
  MOCK_TEST_TIME_SOURCES,
} from "./mockTestActionPolicy";

export const MOCK_TEST_TRUSTED_TIME_STATES =
  Object.freeze({
    UNAVAILABLE: "unavailable",
    LOADING: "loading",
    READY: "ready",
    STALE: "stale",
    ERROR: "error",
    INVALID: "invalid",
  });

export const DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS =
  120000;

const cleanString = (value = "") =>
  String(value ?? "").trim();

const toEpochMs = (value) => {
  if (
    value &&
    typeof value.toMillis === "function"
  ) {
    const millis = Number(value.toMillis());
    return Number.isFinite(millis)
      ? millis
      : null;
  }

  if (
    value &&
    typeof value === "object" &&
    Number.isFinite(Number(value.seconds))
  ) {
    const seconds = Number(value.seconds);
    const nanoseconds = Number(
      value.nanoseconds || 0
    );

    return (
      seconds * 1000 +
      Math.floor(nanoseconds / 1000000)
    );
  }

  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis)
      ? millis
      : null;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return numeric;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const normalizeStatus = (value = "") =>
  cleanString(value).toLowerCase();

const normalizeSource = (value = "") =>
  cleanString(value).toLowerCase();

const freezeEvidence = ({
  state,
  source = "",
  serverNowMs = null,
  receivedAtClientMs = null,
  checkedAtClientMs = null,
  maxAgeMs =
    DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
  ageMs = null,
  nowMs = null,
  requestId = "",
  errorCode = "",
} = {}) =>
  Object.freeze({
    state,
    status: state,
    source,
    serverNowMs,
    receivedAtClientMs,
    checkedAtClientMs,
    maxAgeMs,
    ageMs,
    nowMs,
    requestId:
      cleanString(requestId) || null,
    errorCode:
      cleanString(errorCode) || null,
    isTrusted:
      state ===
        MOCK_TEST_TRUSTED_TIME_STATES.READY &&
      source ===
        MOCK_TEST_TIME_SOURCES.SERVER,
    timeSource:
      state ===
        MOCK_TEST_TRUSTED_TIME_STATES.READY &&
      source ===
        MOCK_TEST_TIME_SOURCES.SERVER
        ? MOCK_TEST_TIME_SOURCES.SERVER
        : MOCK_TEST_TIME_SOURCES.CLIENT,
  });

export const buildMockTestTrustedTimeEvidence =
  ({
    status =
      MOCK_TEST_TRUSTED_TIME_STATES
        .UNAVAILABLE,
    source = "",
    serverNow = null,
    serverNowMs = null,
    receivedAtClientMs = null,
    checkedAtClientMs = Date.now(),
    maxAgeMs =
      DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
    requestId = "",
    errorCode = "",
  } = {}) => {
    const normalizedStatus =
      normalizeStatus(status);
    const normalizedSource =
      normalizeSource(source);
    const normalizedServerNow =
      toEpochMs(
        serverNowMs ?? serverNow
      );
    const normalizedReceivedAt =
      toEpochMs(receivedAtClientMs);
    const normalizedCheckedAt =
      toEpochMs(checkedAtClientMs);
    const normalizedMaxAge = Number(
      maxAgeMs
    );

    if (
      normalizedStatus ===
      MOCK_TEST_TRUSTED_TIME_STATES.LOADING
    ) {
      return freezeEvidence({
        state:
          MOCK_TEST_TRUSTED_TIME_STATES
            .LOADING,
        source: normalizedSource,
        checkedAtClientMs:
          normalizedCheckedAt,
        maxAgeMs:
          Number.isFinite(
            normalizedMaxAge
          )
            ? normalizedMaxAge
            : DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
        requestId,
      });
    }

    if (
      normalizedStatus ===
      MOCK_TEST_TRUSTED_TIME_STATES.ERROR
    ) {
      return freezeEvidence({
        state:
          MOCK_TEST_TRUSTED_TIME_STATES
            .ERROR,
        source: normalizedSource,
        checkedAtClientMs:
          normalizedCheckedAt,
        maxAgeMs:
          Number.isFinite(
            normalizedMaxAge
          )
            ? normalizedMaxAge
            : DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
        requestId,
        errorCode,
      });
    }

    if (
      normalizedStatus !==
      MOCK_TEST_TRUSTED_TIME_STATES.READY
    ) {
      return freezeEvidence({
        state:
          MOCK_TEST_TRUSTED_TIME_STATES
            .UNAVAILABLE,
        source: normalizedSource,
        checkedAtClientMs:
          normalizedCheckedAt,
        maxAgeMs:
          Number.isFinite(
            normalizedMaxAge
          )
            ? normalizedMaxAge
            : DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
        requestId,
      });
    }

    if (
      normalizedSource !==
        MOCK_TEST_TIME_SOURCES.SERVER ||
      normalizedServerNow === null ||
      normalizedReceivedAt === null ||
      normalizedCheckedAt === null ||
      !Number.isFinite(
        normalizedMaxAge
      ) ||
      normalizedMaxAge <= 0
    ) {
      return freezeEvidence({
        state:
          MOCK_TEST_TRUSTED_TIME_STATES
            .INVALID,
        source: normalizedSource,
        serverNowMs:
          normalizedServerNow,
        receivedAtClientMs:
          normalizedReceivedAt,
        checkedAtClientMs:
          normalizedCheckedAt,
        maxAgeMs:
          Number.isFinite(
            normalizedMaxAge
          )
            ? normalizedMaxAge
            : DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
        requestId,
        errorCode:
          errorCode ||
          "invalid_server_time_evidence",
      });
    }

    const ageMs =
      normalizedCheckedAt -
      normalizedReceivedAt;

    if (ageMs < 0) {
      return freezeEvidence({
        state:
          MOCK_TEST_TRUSTED_TIME_STATES
            .INVALID,
        source: normalizedSource,
        serverNowMs:
          normalizedServerNow,
        receivedAtClientMs:
          normalizedReceivedAt,
        checkedAtClientMs:
          normalizedCheckedAt,
        maxAgeMs:
          normalizedMaxAge,
        ageMs,
        requestId,
        errorCode:
          "client_clock_before_receipt",
      });
    }

    if (ageMs > normalizedMaxAge) {
      return freezeEvidence({
        state:
          MOCK_TEST_TRUSTED_TIME_STATES
            .STALE,
        source: normalizedSource,
        serverNowMs:
          normalizedServerNow,
        receivedAtClientMs:
          normalizedReceivedAt,
        checkedAtClientMs:
          normalizedCheckedAt,
        maxAgeMs:
          normalizedMaxAge,
        ageMs,
        requestId,
        errorCode:
          "server_time_evidence_stale",
      });
    }

    return freezeEvidence({
      state:
        MOCK_TEST_TRUSTED_TIME_STATES
          .READY,
      source:
        MOCK_TEST_TIME_SOURCES.SERVER,
      serverNowMs:
        normalizedServerNow,
      receivedAtClientMs:
        normalizedReceivedAt,
      checkedAtClientMs:
        normalizedCheckedAt,
      maxAgeMs:
        normalizedMaxAge,
      ageMs,
      nowMs:
        normalizedServerNow + ageMs,
      requestId,
    });
  };

export const resolveMockTestTrustedTime =
  ({
    evidence = null,
    checkedAtClientMs = Date.now(),
  } = {}) =>
    buildMockTestTrustedTimeEvidence({
      status:
        evidence?.status ||
        evidence?.state ||
        MOCK_TEST_TRUSTED_TIME_STATES
          .UNAVAILABLE,
      source: evidence?.source,
      serverNowMs:
        evidence?.serverNowMs ??
        evidence?.serverNow,
      receivedAtClientMs:
        evidence?.receivedAtClientMs,
      checkedAtClientMs,
      maxAgeMs:
        evidence?.maxAgeMs ??
        DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
      requestId: evidence?.requestId,
      errorCode: evidence?.errorCode,
    });
