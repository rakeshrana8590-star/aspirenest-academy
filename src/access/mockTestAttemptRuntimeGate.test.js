import {
  MOCK_TEST_ACTIONS,
} from "./mockTestActionPolicy";
import {
  MOCK_TEST_ATTEMPT_GATE_STATES,
  buildMockTestAttemptRuntimeGate,
} from "./mockTestAttemptRuntimeGate";

const USER = Object.freeze({
  uid: "student-1",
  email:
    "student@aspirenestacademy.in",
});

const UNSCHEDULED_TEST =
  Object.freeze({
    id: "mock-premium-1",
    section: "mockTest",
    status: "published",
    title: "Premium CDP Mock",
    planType: "PREMIUM",
  });

const schedule = (overrides = {}) => ({
  ...UNSCHEDULED_TEST,
  examStartDate: "2026-07-16",
  examStartTime: "09:00",
  examEndDate: "2026-07-16",
  examEndTime: "18:00",
  ...overrides,
});

const profile = (
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

const planRecord = (
  overrides = {}
) => ({
  id: "plan-access",
  status: "active",
  scopeType: "plan",
  planType: "PREMIUM",
  ...overrides,
});

const itemRecord = (
  itemId =
    UNSCHEDULED_TEST.id
) => ({
  id: "item-access",
  status: "active",
  scopeType: "item",
  module: "mockTest",
  itemType: "mockTest",
  itemId,
  planType: "FREE",
});

const localTime = (
  hour,
  minute = 0
) =>
  new Date(
    2026,
    6,
    16,
    hour,
    minute,
    0,
    0
  ).getTime();

const serverEvidence = ({
  serverNowMs = localTime(10),
  receivedAtClientMs = 1000,
  maxAgeMs = 60000,
} = {}) => ({
  status: "ready",
  source: "server",
  serverNowMs,
  receivedAtClientMs,
  maxAgeMs,
});

const build = (overrides = {}) =>
  buildMockTestAttemptRuntimeGate({
    test: UNSCHEDULED_TEST,
    user: USER,
    accessProfile: profile([
      planRecord(),
    ]),
    clientNow: 1000,
    ...overrides,
  });

describe(
  "AspireNest Mock Test attempt runtime gate",
  () => {
    test(
      "allows an unscheduled ATTEMPT without pretending client time is server time",
      () => {
        const gate = build();

        expect(gate.state).toBe(
          MOCK_TEST_ATTEMPT_GATE_STATES.READY
        );
        expect(
          gate.canActivateAttemptRuntime
        ).toBe(true);
        expect(gate.canActivateTimer).toBe(
          true
        );
        expect(
          gate.canActivateSecurity
        ).toBe(true);
        expect(
          gate.canExposeQuestions
        ).toBe(true);
        expect(gate.trustedNowMs).toBeNull();
      }
    );

    test(
      "scheduled ATTEMPT fails closed without trusted server time",
      () => {
        const gate = build({
          test: schedule(),
          clientNow: localTime(10),
        });

        expect(gate.state).toBe(
          "server_time_required"
        );
        expect(
          gate.requiresServerTime
        ).toBe(true);
        expect(
          gate.canActivateAttemptRuntime
        ).toBe(false);
        expect(gate.canReadAttemptStorage).toBe(
          false
        );
        expect(gate.canActivateTimer).toBe(
          false
        );
      }
    );

    test(
      "fresh server evidence opens a scheduled ATTEMPT inside the window",
      () => {
        const gate = build({
          test: schedule(),
          trustedTimeEvidence:
            serverEvidence(),
          clientNow: 1000,
        });

        expect(gate.state).toBe(
          "ready"
        );
        expect(gate.trustedTimeState).toBe(
          "ready"
        );
        expect(gate.trustedNowMs).toBe(
          localTime(10)
        );
        expect(
          gate.canActivateAttemptRuntime
        ).toBe(true);
      }
    );

    test(
      "stale server evidence never opens a scheduled attempt",
      () => {
        const gate = build({
          test: schedule(),
          trustedTimeEvidence:
            serverEvidence({
              receivedAtClientMs: 1000,
              maxAgeMs: 500,
            }),
          clientNow: 2000,
        });

        expect(gate.trustedTimeState).toBe(
          "stale"
        );
        expect(gate.state).toBe(
          "server_time_required"
        );
        expect(gate.canExposeQuestions).toBe(
          false
        );
      }
    );

    test(
      "trusted server time preserves upcoming and closed decisions",
      () => {
        const upcoming = build({
          test: schedule(),
          trustedTimeEvidence:
            serverEvidence({
              serverNowMs:
                localTime(8),
            }),
          clientNow: 1000,
        });
        const closed = build({
          test: schedule(),
          trustedTimeEvidence:
            serverEvidence({
              serverNowMs:
                localTime(19),
            }),
          clientNow: 1000,
        });

        expect(upcoming.state).toBe(
          "upcoming"
        );
        expect(closed.state).toBe(
          "closed"
        );
      }
    );

    test(
      "exact ITEM evidence opens only its exact test",
      () => {
        const exact = build({
          accessProfile: profile([
            itemRecord(),
          ]),
        });
        const sibling = build({
          test: {
            ...UNSCHEDULED_TEST,
            id: "mock-premium-2",
          },
          accessProfile: profile([
            itemRecord(),
          ]),
        });

        expect(exact.state).toBe(
          "ready"
        );
        expect(exact.exactItem).toBe(
          true
        );
        expect(sibling.state).toBe(
          "locked"
        );
        expect(
          sibling.canActivateAttemptRuntime
        ).toBe(false);
      }
    );

    test(
      "blocked account takes My Access precedence",
      () => {
        const gate = build({
          accessProfile: profile([], {
            isBlocked: true,
            shellState: {
              mode: "blocked",
              isFailClosed: true,
            },
          }),
        });

        expect(gate.state).toBe(
          "blocked"
        );
        expect(gate.recoveryRoute).toBe(
          "/my-access"
        );
        expect(gate.canActivateTimer).toBe(
          false
        );
      }
    );

    test(
      "loading and access error states fail closed",
      () => {
        const loading = build({
          accessProfile: profile([], {
            loading: true,
            shellState: {
              mode: "loading",
              isFailClosed: true,
            },
          }),
        });
        const error = build({
          accessProfile: profile([], {
            error: new Error(
              "Unavailable"
            ),
            isAccessCheckUnavailable:
              true,
            shellState: {
              mode: "error",
              isFailClosed: true,
            },
          }),
        });

        expect(loading.state).toBe(
          "loading"
        );
        expect(error.state).toBe(
          "error"
        );
        expect(
          loading.canWriteAttemptStorage
        ).toBe(false);
        expect(
          error.canWriteAttemptStorage
        ).toBe(false);
      }
    );

    test(
      "SUBMIT is a separate action and always needs trusted server time",
      () => {
        const attempt = {
          testId:
            UNSCHEDULED_TEST.id,
          ownerUid: USER.uid,
          ownerEmail: USER.email,
          status: "in_progress",
          startedAt: localTime(9),
        };

        const missingTime = build({
          action:
            MOCK_TEST_ACTIONS.SUBMIT,
          attempt,
        });
        const trusted = build({
          action:
            MOCK_TEST_ACTIONS.SUBMIT,
          attempt,
          trustedTimeEvidence:
            serverEvidence(),
          clientNow: 1000,
        });

        expect(missingTime.state).toBe(
          "server_time_required"
        );
        expect(missingTime.canSubmit).toBe(
          false
        );
        expect(trusted.state).toBe(
          "ready"
        );
        expect(trusted.canSubmit).toBe(
          true
        );
        expect(
          trusted.canActivateAttemptRuntime
        ).toBe(false);
      }
    );

    test(
      "SUBMIT rejects an attempt owned by another learner",
      () => {
        const gate = build({
          action:
            MOCK_TEST_ACTIONS.SUBMIT,
          attempt: {
            testId:
              UNSCHEDULED_TEST.id,
            ownerUid: "student-2",
            status: "in_progress",
            startedAt: localTime(9),
          },
          trustedTimeEvidence:
            serverEvidence(),
          clientNow: 1000,
        });

        expect(gate.state).toBe(
          "invalid_attempt"
        );
        expect(gate.canSubmit).toBe(
          false
        );
      }
    );

    test(
      "gate output is immutable",
      () => {
        expect(
          Object.isFrozen(build())
        ).toBe(true);
      }
    );
  }
);
