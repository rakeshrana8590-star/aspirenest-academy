import {
  MOCK_TEST_ATTEMPT_ENTRY_STATES,
  buildInitialMockTestAttemptEntry,
  buildMockTestAttemptEntryKey,
  loadMockTestAttemptEntry,
} from "./useMockTestAttemptEntryRuntime";

const USER = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
});

const BASE_TEST = Object.freeze({
  id: "mock-premium-1",
  section: "mockTest",
  status: "published",
  title: "Premium CDP Mock",
  planType: "PREMIUM",
});

const scheduledTest = (overrides = {}) => ({
  ...BASE_TEST,
  examStartDate: "2026-07-17",
  examStartTime: "09:00",
  examEndDate: "2026-07-17",
  examEndTime: "18:00",
  ...overrides,
});

const accessProfile = (
  accessRecords = [],
  overrides = {}
) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isBlocked: false,
  accessRecords,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
  ...overrides,
});

const planRecord = (overrides = {}) => ({
  id: "plan-premium",
  status: "active",
  scopeType: "plan",
  planType: "PREMIUM",
  ...overrides,
});

const localTime = (hour, minute = 0) =>
  new Date(
    2026,
    6,
    17,
    hour,
    minute,
    0,
    0
  ).getTime();

const trustedProviderResult = ({
  serverNowMs = localTime(10),
} = {}) =>
  Object.freeze({
    state: "ready",
    isReady: true,
    evidence: Object.freeze({
      state: "ready",
      status: "ready",
      source: "server",
      serverNowMs,
      receivedAtClientMs: 1000,
      checkedAtClientMs: 1000,
      maxAgeMs: 60000,
      requestId: "server-clock-1",
      isTrusted: true,
    }),
  });

describe(
  "AspireNest mock-test attempt entry runtime",
  () => {
    test(
      "opens an unscheduled entitled attempt without calling server time",
      async () => {
        const provider = {
          load: jest.fn(),
        };

        const runtime =
          await loadMockTestAttemptEntry({
            test: BASE_TEST,
            user: USER,
            accessProfile: accessProfile([
              planRecord(),
            ]),
            provider,
            clientNow: () => 1000,
          });

        expect(runtime.state).toBe(
          MOCK_TEST_ATTEMPT_ENTRY_STATES.READY
        );
        expect(
          runtime.canActivateAttemptRuntime
        ).toBe(true);
        expect(runtime.canActivateTimer).toBe(
          true
        );
        expect(provider.load).not.toHaveBeenCalled();
      }
    );

    test(
      "keeps a scheduled attempt loading until trusted server time is resolved",
      () => {
        const runtime =
          buildInitialMockTestAttemptEntry({
            test: scheduledTest(),
            user: USER,
            accessProfile: accessProfile([
              planRecord(),
            ]),
            clientNow: localTime(10),
          });

        expect(runtime.state).toBe(
          MOCK_TEST_ATTEMPT_ENTRY_STATES.LOADING
        );
        expect(
          runtime.canActivateAttemptRuntime
        ).toBe(false);
        expect(runtime.canActivateTimer).toBe(
          false
        );
        expect(runtime.gate.state).toBe(
          "server_time_required"
        );
      }
    );

    test(
      "opens a scheduled attempt only after a trusted callable result",
      async () => {
        const provider = {
          load: jest.fn(
            async () =>
              trustedProviderResult()
          ),
        };

        const runtime =
          await loadMockTestAttemptEntry({
            test: scheduledTest(),
            user: USER,
            accessProfile: accessProfile([
              planRecord(),
            ]),
            provider,
            clientNow: () => 1000,
          });

        expect(provider.load).toHaveBeenCalledWith({
          purpose: "mock_test_attempt",
          testId: BASE_TEST.id,
        });
        expect(runtime.state).toBe(
          MOCK_TEST_ATTEMPT_ENTRY_STATES.READY
        );
        expect(runtime.gate.state).toBe(
          "ready"
        );
        expect(runtime.gate.trustedNowMs).toBe(
          localTime(10)
        );
        expect(runtime.canActivateTimer).toBe(
          true
        );
        expect(
          runtime.canActivateSecurity
        ).toBe(true);
      }
    );

    test(
      "fails closed when trusted server time cannot be loaded",
      async () => {
        const provider = {
          load: jest.fn(async () => ({
            state: "error",
            isReady: false,
            evidence: null,
            errorCode:
              "server_time_request_failed",
            message:
              "Callable unavailable",
          })),
        };

        const runtime =
          await loadMockTestAttemptEntry({
            test: scheduledTest(),
            user: USER,
            accessProfile: accessProfile([
              planRecord(),
            ]),
            provider,
            clientNow: () => 1000,
          });

        expect(runtime.state).toBe(
          MOCK_TEST_ATTEMPT_ENTRY_STATES.ERROR
        );
        expect(runtime.errorCode).toBe(
          "server_time_request_failed"
        );
        expect(
          runtime.canActivateAttemptRuntime
        ).toBe(false);
        expect(runtime.canActivateTimer).toBe(
          false
        );
        expect(
          runtime.canReadAttemptStorage
        ).toBe(false);
      }
    );

    test(
      "denies a locked attempt before making any callable request",
      async () => {
        const provider = {
          load: jest.fn(),
        };

        const runtime =
          await loadMockTestAttemptEntry({
            test: scheduledTest(),
            user: USER,
            accessProfile: accessProfile([]),
            provider,
            clientNow: () => localTime(10),
          });

        expect(runtime.state).toBe(
          MOCK_TEST_ATTEMPT_ENTRY_STATES.DENIED
        );
        expect(runtime.gate.state).toBe(
          "locked"
        );
        expect(provider.load).not.toHaveBeenCalled();
      }
    );

    test(
      "request key changes when entitlement evidence changes",
      () => {
        const lockedKey =
          buildMockTestAttemptEntryKey({
            test: BASE_TEST,
            user: USER,
            accessProfile: accessProfile([]),
          });
        const readyKey =
          buildMockTestAttemptEntryKey({
            test: BASE_TEST,
            user: USER,
            accessProfile: accessProfile([
              planRecord(),
            ]),
          });

        expect(lockedKey).not.toBe(readyKey);
      }
    );
  }
);
