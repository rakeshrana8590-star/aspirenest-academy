jest.mock(
  "./mockTestFirebaseServerTimeClient",
  () => ({
    requestMockTestServerTime: jest.fn(),
  })
);

import {
  MOCK_TEST_SUBMIT_RUNTIME_STATES,
  authorizeMockTestSubmission,
  buildMockTestSubmitAttemptEvidence,
} from "./mockTestSubmitRuntime";

const USER = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
});

const TEST = Object.freeze({
  id: "mock-premium-1",
  section: "mockTest",
  status: "published",
  planType: "PREMIUM",
});

const ACCESS_PROFILE = Object.freeze({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isBlocked: false,
  accessRecords: [
    {
      id: "premium-plan",
      status: "active",
      scopeType: "plan",
      planType: "PREMIUM",
    },
  ],
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
});

const ATTEMPT = Object.freeze({
  testId: TEST.id,
  ownerUid: USER.uid,
  ownerEmail: USER.email,
  status: "in_progress",
  startedAt: 1000,
  isSubmitted: false,
});

const trustedProvider = ({
  serverNowMs = 5000,
  requestId = "submit-request-1",
} = {}) => ({
  load: jest.fn().mockResolvedValue({
    state: "ready",
    isReady: true,
    requestId,
    evidence: {
      state: "ready",
      status: "ready",
      source: "server",
      serverNowMs,
      receivedAtClientMs: 2000,
      checkedAtClientMs: 2000,
      maxAgeMs: 120000,
      requestId,
      isTrusted: true,
    },
  }),
});

const authorize = (overrides = {}) =>
  authorizeMockTestSubmission({
    test: TEST,
    user: USER,
    accessProfile: ACCESS_PROFILE,
    attemptState: ATTEMPT,
    provider: trustedProvider(),
    clientNow: () => 2000,
    ...overrides,
  });

describe(
  "AspireNest secure mock-test submission runtime",
  () => {
    test(
      "binds a legacy attempt without owner fields to the authenticated learner",
      () => {
        const evidence =
          buildMockTestSubmitAttemptEvidence({
            test: TEST,
            user: USER,
            attemptState: {
              startedAt: 1000,
              isSubmitted: false,
            },
          });

        expect(evidence.testId).toBe(TEST.id);
        expect(evidence.ownerUid).toBe(USER.uid);
        expect(evidence.ownerEmail).toBe(
          USER.email
        );
        expect(evidence.status).toBe(
          "in_progress"
        );
      }
    );

    test(
      "always requires a fresh trusted server-time request before submit",
      async () => {
        const provider = trustedProvider();
        const result = await authorize({ provider });

        expect(provider.load).toHaveBeenCalledWith({
          purpose: "mock_test_submit",
          testId: TEST.id,
        });
        expect(result.state).toBe(
          MOCK_TEST_SUBMIT_RUNTIME_STATES.READY
        );
        expect(result.canSubmit).toBe(true);
        expect(result.submittedAtMs).toBe(5000);
        expect(result.requestId).toBe(
          "submit-request-1"
        );
      }
    );

    test(
      "rejects an attempt owned by another learner before any callable request",
      async () => {
        const provider = trustedProvider();
        const result = await authorize({
          provider,
          attemptState: {
            ...ATTEMPT,
            ownerUid: "student-2",
          },
        });

        expect(result.state).toBe(
          MOCK_TEST_SUBMIT_RUNTIME_STATES.DENIED
        );
        expect(result.canSubmit).toBe(false);
        expect(result.gate?.state).toBe(
          "invalid_attempt"
        );
        expect(provider.load).not.toHaveBeenCalled();
      }
    );

    test(
      "rejects a missing local attempt before any callable request",
      async () => {
        const provider = trustedProvider();
        const result = await authorize({
          provider,
          attemptState: null,
        });

        expect(result.state).toBe(
          MOCK_TEST_SUBMIT_RUNTIME_STATES.DENIED
        );
        expect(result.gate?.state).toBe(
          "invalid_attempt"
        );
        expect(provider.load).not.toHaveBeenCalled();
      }
    );

    test(
      "fails closed when trusted server time is unavailable",
      async () => {
        const result = await authorize({
          provider: {
            load: jest.fn().mockResolvedValue({
              state: "error",
              isReady: false,
              errorCode: "network-error",
            }),
          },
        });

        expect(result.state).toBe(
          MOCK_TEST_SUBMIT_RUNTIME_STATES.ERROR
        );
        expect(result.canSubmit).toBe(false);
        expect(result.submittedAtMs).toBeNull();
      }
    );

    test(
      "rejects an already submitted attempt",
      async () => {
        const provider = trustedProvider();
        const result = await authorize({
          provider,
          attemptState: {
            ...ATTEMPT,
            isSubmitted: true,
            status: "submitted",
          },
        });

        expect(result.canSubmit).toBe(false);
        expect(provider.load).not.toHaveBeenCalled();
      }
    );

    test(
      "returns immutable authorization evidence",
      async () => {
        const result = await authorize();

        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.attempt)).toBe(
          true
        );
      }
    );
  }
);
