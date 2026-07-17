import {
  DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
  MOCK_TEST_TRUSTED_TIME_STATES,
  buildMockTestTrustedTimeEvidence,
} from "./mockTestTrustedTime";
import {
  MOCK_TEST_TIME_SOURCES,
} from "./mockTestActionPolicy";

export const MOCK_TEST_SERVER_TIME_PROVIDER_STATES =
  Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    READY: "ready",
    AUTH_REQUIRED: "auth_required",
    UNAVAILABLE: "unavailable",
    INVALID_RESPONSE: "invalid_response",
    SLOW_RESPONSE: "slow_response",
    REPLAYED_RESPONSE: "replayed_response",
    ERROR: "error",
  });

export const DEFAULT_MOCK_TEST_SERVER_TIME_MAX_ROUND_TRIP_MS =
  5000;

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const toFiniteEpochMs = (value) => {
  const numeric = Number(value);

  if (
    Number.isFinite(numeric) &&
    numeric > 0
  ) {
    return numeric;
  }

  return null;
};

const freezeResult = ({
  state,
  evidence = null,
  requestId = "",
  roundTripMs = null,
  uncertaintyMs = null,
  requestedAtClientMs = null,
  receivedAtClientMs = null,
  errorCode = "",
  message = "",
} = {}) =>
  Object.freeze({
    state,
    evidence,
    requestId:
      cleanString(requestId) || null,
    roundTripMs,
    uncertaintyMs,
    requestedAtClientMs,
    receivedAtClientMs,
    errorCode:
      cleanString(errorCode) || null,
    message: cleanString(message),
    isReady:
      state ===
        MOCK_TEST_SERVER_TIME_PROVIDER_STATES
          .READY &&
      evidence?.isTrusted === true,
  });

const unwrapCallablePayload = (value) =>
  value &&
  typeof value === "object" &&
  Object.prototype.hasOwnProperty.call(
    value,
    "data"
  )
    ? value.data
    : value;

export const validateMockTestServerTimePayload =
  ({
    payload = null,
    expectedUid = "",
  } = {}) => {
    const normalized =
      unwrapCallablePayload(payload);

    if (
      !normalized ||
      typeof normalized !== "object" ||
      Array.isArray(normalized)
    ) {
      return Object.freeze({
        valid: false,
        errorCode:
          "server_time_payload_missing",
      });
    }

    const source = normalizeText(
      normalized.source
    );
    const serverNowMs =
      toFiniteEpochMs(
        normalized.serverNowMs
      );
    const requestId = cleanString(
      normalized.requestId
    );
    const authenticated =
      normalized.authenticated === true;
    const responseUid = cleanString(
      normalized.uid
    );
    const normalizedExpectedUid =
      cleanString(expectedUid);

    if (
      source !==
      MOCK_TEST_TIME_SOURCES.SERVER
    ) {
      return Object.freeze({
        valid: false,
        errorCode:
          "server_time_source_invalid",
      });
    }

    if (serverNowMs === null) {
      return Object.freeze({
        valid: false,
        errorCode:
          "server_time_value_invalid",
      });
    }

    if (!requestId) {
      return Object.freeze({
        valid: false,
        errorCode:
          "server_time_request_id_missing",
      });
    }

    if (!authenticated) {
      return Object.freeze({
        valid: false,
        errorCode:
          "server_time_auth_context_missing",
      });
    }

    if (
      responseUid &&
      normalizedExpectedUid &&
      responseUid !==
        normalizedExpectedUid
    ) {
      return Object.freeze({
        valid: false,
        errorCode:
          "server_time_uid_mismatch",
      });
    }

    return Object.freeze({
      valid: true,
      source:
        MOCK_TEST_TIME_SOURCES.SERVER,
      serverNowMs,
      requestId,
      authenticated: true,
      uid: responseUid || null,
    });
  };

export const createMockTestServerTimeProvider =
  ({
    callServerTime = null,
    getCurrentUser = () => null,
    clientNow = () => Date.now(),
    maxRoundTripMs =
      DEFAULT_MOCK_TEST_SERVER_TIME_MAX_ROUND_TRIP_MS,
    maxEvidenceAgeMs =
      DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
  } = {}) => {
    const seenRequestIds = new Set();

    const load = async ({
      purpose = "mock_test_attempt",
      testId = "",
    } = {}) => {
      if (
        typeof callServerTime !==
        "function"
      ) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .UNAVAILABLE,
          errorCode:
            "server_time_provider_unavailable",
          message:
            "Trusted server time is not configured.",
        });
      }

      const currentUser =
        typeof getCurrentUser ===
        "function"
          ? getCurrentUser()
          : null;
      const uid = cleanString(
        currentUser?.uid
      );

      if (!uid) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .AUTH_REQUIRED,
          errorCode:
            "server_time_auth_required",
          message:
            "Login is required before requesting trusted server time.",
        });
      }

      const requestedAtClientMs =
        toFiniteEpochMs(clientNow());

      if (
        requestedAtClientMs === null
      ) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .ERROR,
          errorCode:
            "client_clock_invalid",
        });
      }

      let response;

      try {
        response =
          await callServerTime({
            purpose: cleanString(
              purpose
            ),
            testId: cleanString(
              testId
            ),
          });
      } catch (error) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .ERROR,
          requestedAtClientMs,
          errorCode:
            cleanString(error?.code) ||
            "server_time_request_failed",
          message:
            cleanString(
              error?.message
            ),
        });
      }

      const receivedAtClientMs =
        toFiniteEpochMs(clientNow());

      if (
        receivedAtClientMs === null ||
        receivedAtClientMs <
          requestedAtClientMs
      ) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .ERROR,
          requestedAtClientMs,
          receivedAtClientMs,
          errorCode:
            "client_clock_invalid",
        });
      }

      const roundTripMs =
        receivedAtClientMs -
        requestedAtClientMs;
      const normalizedMaxRoundTripMs =
        Number(maxRoundTripMs);

      if (
        !Number.isFinite(
          normalizedMaxRoundTripMs
        ) ||
        normalizedMaxRoundTripMs <= 0
      ) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .ERROR,
          requestedAtClientMs,
          receivedAtClientMs,
          roundTripMs,
          errorCode:
            "server_time_round_trip_limit_invalid",
        });
      }

      if (
        roundTripMs >
        normalizedMaxRoundTripMs
      ) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .SLOW_RESPONSE,
          requestedAtClientMs,
          receivedAtClientMs,
          roundTripMs,
          uncertaintyMs:
            roundTripMs,
          errorCode:
            "server_time_round_trip_too_slow",
          message:
            "Trusted server time response was too slow and was rejected.",
        });
      }

      const validation =
        validateMockTestServerTimePayload({
          payload: response,
          expectedUid: uid,
        });

      if (!validation.valid) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .INVALID_RESPONSE,
          requestedAtClientMs,
          receivedAtClientMs,
          roundTripMs,
          uncertaintyMs:
            roundTripMs,
          errorCode:
            validation.errorCode,
        });
      }

      if (
        seenRequestIds.has(
          validation.requestId
        )
      ) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .REPLAYED_RESPONSE,
          requestId:
            validation.requestId,
          requestedAtClientMs,
          receivedAtClientMs,
          roundTripMs,
          uncertaintyMs:
            roundTripMs,
          errorCode:
            "server_time_response_replayed",
        });
      }

      const evidence =
        buildMockTestTrustedTimeEvidence({
          status:
            MOCK_TEST_TRUSTED_TIME_STATES
              .READY,
          source:
            MOCK_TEST_TIME_SOURCES.SERVER,
          serverNowMs:
            validation.serverNowMs,
          receivedAtClientMs,
          checkedAtClientMs:
            receivedAtClientMs,
          maxAgeMs:
            maxEvidenceAgeMs,
          requestId:
            validation.requestId,
        });

      if (!evidence.isTrusted) {
        return freezeResult({
          state:
            MOCK_TEST_SERVER_TIME_PROVIDER_STATES
              .INVALID_RESPONSE,
          evidence,
          requestId:
            validation.requestId,
          requestedAtClientMs,
          receivedAtClientMs,
          roundTripMs,
          uncertaintyMs:
            roundTripMs,
          errorCode:
            evidence.errorCode ||
            "server_time_evidence_invalid",
        });
      }

      seenRequestIds.add(
        validation.requestId
      );

      return freezeResult({
        state:
          MOCK_TEST_SERVER_TIME_PROVIDER_STATES
            .READY,
        evidence,
        requestId:
          validation.requestId,
        requestedAtClientMs,
        receivedAtClientMs,
        roundTripMs,
        uncertaintyMs:
          roundTripMs,
      });
    };

    return Object.freeze({
      load,
      hasSeenRequestId: (
        requestId
      ) =>
        seenRequestIds.has(
          cleanString(requestId)
        ),
    });
  };
