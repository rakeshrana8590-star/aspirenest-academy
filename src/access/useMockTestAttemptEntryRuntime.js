import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

export const MOCK_TEST_ATTEMPT_ENTRY_STATES =
  Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    READY: "ready",
    DENIED: "denied",
    ERROR: "error",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const stableRecordSignature = (records = []) =>
  (Array.isArray(records) ? records : [])
    .map((record = {}) => ({
      id: cleanString(record.id),
      status: cleanString(record.status),
      scopeType: cleanString(record.scopeType),
      planType: cleanString(
        record.planType || record.planCode
      ),
      module: cleanString(record.module),
      itemType: cleanString(record.itemType),
      itemId: cleanString(record.itemId),
      startsAt: cleanString(
        record.startsAt || record.validFrom
      ),
      expiresAt: cleanString(
        record.expiresAt ||
          record.expiryDate ||
          record.validUntil
      ),
    }))
    .sort((left, right) =>
      JSON.stringify(left).localeCompare(
        JSON.stringify(right)
      )
    );

export const buildMockTestAttemptEntryKey = ({
  test = null,
  user = null,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
} = {}) =>
  JSON.stringify({
    test: {
      id: cleanString(test?.id),
      section: cleanString(test?.section),
      status: cleanString(test?.status),
      planType: cleanString(
        test?.planType ||
          test?.planCode ||
          test?.requiredPlan
      ),
      examStartDate: cleanString(
        test?.examStartDate
      ),
      examStartTime: cleanString(
        test?.examStartTime
      ),
      examEndDate: cleanString(
        test?.examEndDate
      ),
      examEndTime: cleanString(
        test?.examEndTime
      ),
    },
    user: {
      uid: cleanString(user?.uid),
      email: cleanString(user?.email),
    },
    role: cleanString(role),
    isAdminUser: isAdminUser === true,
    accessProfile: {
      loading: accessProfile?.loading === true,
      hasError: Boolean(
        accessProfile?.error ||
          accessProfile?.isAccessCheckUnavailable
      ),
      isBlocked:
        accessProfile?.isBlocked === true,
      shellMode: cleanString(
        accessProfile?.shellState?.mode
      ),
      accessRecords: stableRecordSignature(
        accessProfile?.accessRecords
      ),
    },
    planCatalog: stableRecordSignature(
      planCatalog
    ),
  });

const freezeSnapshot = ({
  state,
  requestKey,
  testId = "",
  gate = null,
  providerResult = null,
  errorCode = "",
  message = "",
} = {}) =>
  Object.freeze({
    state,
    requestKey:
      cleanString(requestKey),
    testId: cleanString(testId),
    gate,
    providerResult,
    errorCode:
      cleanString(errorCode) || null,
    message: cleanString(message),
    isReady:
      state ===
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
      gate?.canActivateAttemptRuntime === true,
    canActivateAttemptRuntime:
      state ===
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
      gate?.canActivateAttemptRuntime === true,
    canActivateTimer:
      state ===
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
      gate?.canActivateTimer === true,
    canActivateSecurity:
      state ===
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
      gate?.canActivateSecurity === true,
    canReadAttemptStorage:
      state ===
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
      gate?.canReadAttemptStorage === true,
    canWriteAttemptStorage:
      state ===
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY &&
      gate?.canWriteAttemptStorage === true,
  });

const snapshotFromGate = ({
  gate,
  requestKey,
  testId,
} = {}) => {
  if (
    gate?.canActivateAttemptRuntime === true
  ) {
    return freezeSnapshot({
      state:
        MOCK_TEST_ATTEMPT_ENTRY_STATES.READY,
      requestKey,
      testId,
      gate,
    });
  }

  if (
    gate?.state ===
    MOCK_TEST_ATTEMPT_GATE_STATES
      .SERVER_TIME_REQUIRED
  ) {
    return freezeSnapshot({
      state:
        MOCK_TEST_ATTEMPT_ENTRY_STATES.LOADING,
      requestKey,
      testId,
      gate,
      message:
        "Verifying the active mock-test window with trusted server time.",
    });
  }

  if (
    gate?.state ===
    MOCK_TEST_ATTEMPT_GATE_STATES.LOADING
  ) {
    return freezeSnapshot({
      state:
        MOCK_TEST_ATTEMPT_ENTRY_STATES.LOADING,
      requestKey,
      testId,
      gate,
      message:
        "Verifying your mock-test access.",
    });
  }

  if (
    gate?.state ===
    MOCK_TEST_ATTEMPT_GATE_STATES.ERROR
  ) {
    return freezeSnapshot({
      state:
        MOCK_TEST_ATTEMPT_ENTRY_STATES.ERROR,
      requestKey,
      testId,
      gate,
      errorCode:
        gate?.reason ||
        "attempt_entry_gate_error",
      message:
        "Mock-test access could not be verified.",
    });
  }

  return freezeSnapshot({
    state:
      MOCK_TEST_ATTEMPT_ENTRY_STATES.DENIED,
    requestKey,
    testId,
    gate,
  });
};

export const buildInitialMockTestAttemptEntry =
  ({
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    clientNow = Date.now(),
  } = {}) => {
    const requestKey =
      buildMockTestAttemptEntryKey({
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
      });

    const gate =
      buildMockTestAttemptRuntimeGate({
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        trustedTimeEvidence: null,
        clientNow,
      });

    return snapshotFromGate({
      gate,
      requestKey,
      testId: test?.id,
    });
  };

export const loadMockTestAttemptEntry =
  async ({
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    provider = null,
    clientNow = () => Date.now(),
  } = {}) => {
    const initial =
      buildInitialMockTestAttemptEntry({
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        clientNow: clientNow(),
      });

    if (
      initial.gate?.state !==
      MOCK_TEST_ATTEMPT_GATE_STATES
        .SERVER_TIME_REQUIRED
    ) {
      return initial;
    }

    if (
      !provider ||
      typeof provider.load !== "function"
    ) {
      return freezeSnapshot({
        state:
          MOCK_TEST_ATTEMPT_ENTRY_STATES.ERROR,
        requestKey: initial.requestKey,
        testId: initial.testId,
        gate: initial.gate,
        errorCode:
          "server_time_provider_unavailable",
        message:
          "Trusted server time is unavailable, so this scheduled attempt remains closed.",
      });
    }

    let providerResult;

    try {
      providerResult =
        await provider.load({
          purpose: "mock_test_attempt",
          testId: test?.id,
        });
    } catch (error) {
      return freezeSnapshot({
        state:
          MOCK_TEST_ATTEMPT_ENTRY_STATES.ERROR,
        requestKey: initial.requestKey,
        testId: initial.testId,
        gate: initial.gate,
        errorCode:
          cleanString(error?.code) ||
          "trusted_server_time_request_failed",
        message:
          cleanString(error?.message) ||
          "Trusted server time could not be verified, so this scheduled attempt remains closed.",
      });
    }

    if (
      providerResult?.state !==
        MOCK_TEST_SERVER_TIME_PROVIDER_STATES
          .READY ||
      providerResult?.isReady !== true ||
      providerResult?.evidence?.isTrusted !==
        true
    ) {
      return freezeSnapshot({
        state:
          MOCK_TEST_ATTEMPT_ENTRY_STATES.ERROR,
        requestKey: initial.requestKey,
        testId: initial.testId,
        gate: initial.gate,
        providerResult,
        errorCode:
          providerResult?.errorCode ||
          "trusted_server_time_unavailable",
        message:
          providerResult?.message ||
          "Trusted server time could not be verified, so this scheduled attempt remains closed.",
      });
    }

    const gate =
      buildMockTestAttemptRuntimeGate({
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        trustedTimeEvidence:
          providerResult.evidence,
        clientNow: clientNow(),
      });

    return Object.freeze({
      ...snapshotFromGate({
        gate,
        requestKey: initial.requestKey,
        testId: initial.testId,
      }),
      providerResult,
    });
  };

export const useMockTestAttemptEntryRuntime =
  ({
    test = null,
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
  } = {}) => {
    const [retryVersion, setRetryVersion] =
      useState(0);

    const requestKey = useMemo(
      () =>
        buildMockTestAttemptEntryKey({
          test,
          user,
          role,
          isAdminUser,
          accessProfile,
          planCatalog,
        }),
      [
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
      ]
    );

    const initial = useMemo(
      () =>
        buildInitialMockTestAttemptEntry({
          test,
          user,
          role,
          isAdminUser,
          accessProfile,
          planCatalog,
        }),
      [
        requestKey,
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
      ]
    );

    const provider = useMemo(
      () =>
        createMockTestServerTimeProvider({
          callServerTime:
            requestMockTestServerTime,
          getCurrentUser: () => ({
            uid: user?.uid,
            email: user?.email,
          }),
        }),
      [user?.uid, user?.email]
    );

    const [runtime, setRuntime] =
      useState(initial);

    useEffect(() => {
      let active = true;

      setRuntime(initial);

      if (
        initial.gate?.state !==
        MOCK_TEST_ATTEMPT_GATE_STATES
          .SERVER_TIME_REQUIRED
      ) {
        return () => {
          active = false;
        };
      }

      loadMockTestAttemptEntry({
        test,
        user,
        role,
        isAdminUser,
        accessProfile,
        planCatalog,
        provider,
      }).then((nextRuntime) => {
        if (active) {
          setRuntime(nextRuntime);
        }
      });

      return () => {
        active = false;
      };
    }, [
      requestKey,
      retryVersion,
      initial,
      test,
      user,
      role,
      isAdminUser,
      accessProfile,
      planCatalog,
      provider,
    ]);

    const retry = useCallback(() => {
      setRetryVersion(
        (current) => current + 1
      );
    }, []);

    const visibleRuntime =
      runtime?.requestKey === requestKey
        ? runtime
        : initial;

    return Object.freeze({
      ...visibleRuntime,
      retry,
    });
  };
