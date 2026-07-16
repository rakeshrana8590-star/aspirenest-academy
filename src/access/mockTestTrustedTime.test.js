import {
  DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS,
  MOCK_TEST_TRUSTED_TIME_STATES,
  buildMockTestTrustedTimeEvidence,
  resolveMockTestTrustedTime,
} from "./mockTestTrustedTime";

describe(
  "AspireNest trusted Mock Test time evidence",
  () => {
    test(
      "accepts a fresh server anchor and advances only by elapsed client duration",
      () => {
        const evidence =
          buildMockTestTrustedTimeEvidence({
            status: "ready",
            source: "server",
            serverNowMs: 100000,
            receivedAtClientMs: 5000,
            checkedAtClientMs: 8000,
            maxAgeMs: 10000,
            requestId: "clock-1",
          });

        expect(evidence.state).toBe(
          MOCK_TEST_TRUSTED_TIME_STATES.READY
        );
        expect(evidence.isTrusted).toBe(
          true
        );
        expect(evidence.timeSource).toBe(
          "server"
        );
        expect(evidence.ageMs).toBe(
          3000
        );
        expect(evidence.nowMs).toBe(
          103000
        );
        expect(evidence.requestId).toBe(
          "clock-1"
        );
      }
    );

    test(
      "never upgrades client time into trusted server time",
      () => {
        const evidence =
          buildMockTestTrustedTimeEvidence({
            status: "ready",
            source: "client",
            serverNowMs: 100000,
            receivedAtClientMs: 5000,
            checkedAtClientMs: 6000,
          });

        expect(evidence.state).toBe(
          MOCK_TEST_TRUSTED_TIME_STATES.INVALID
        );
        expect(evidence.isTrusted).toBe(
          false
        );
        expect(evidence.timeSource).toBe(
          "client"
        );
      }
    );

    test(
      "marks an expired server anchor stale",
      () => {
        const evidence =
          buildMockTestTrustedTimeEvidence({
            status: "ready",
            source: "server",
            serverNowMs: 100000,
            receivedAtClientMs: 1000,
            checkedAtClientMs: 5001,
            maxAgeMs: 4000,
          });

        expect(evidence.state).toBe(
          MOCK_TEST_TRUSTED_TIME_STATES.STALE
        );
        expect(evidence.isTrusted).toBe(
          false
        );
        expect(evidence.nowMs).toBeNull();
      }
    );

    test(
      "rejects a client clock earlier than the server receipt anchor",
      () => {
        const evidence =
          buildMockTestTrustedTimeEvidence({
            status: "ready",
            source: "server",
            serverNowMs: 100000,
            receivedAtClientMs: 5000,
            checkedAtClientMs: 4999,
          });

        expect(evidence.state).toBe(
          MOCK_TEST_TRUSTED_TIME_STATES.INVALID
        );
        expect(evidence.errorCode).toBe(
          "client_clock_before_receipt"
        );
      }
    );

    test(
      "supports Firestore Timestamp-like server values",
      () => {
        const evidence =
          buildMockTestTrustedTimeEvidence({
            status: "ready",
            source: "server",
            serverNow: {
              seconds: 200,
              nanoseconds: 500000000,
            },
            receivedAtClientMs: 1000,
            checkedAtClientMs: 1000,
          });

        expect(evidence.nowMs).toBe(
          200500
        );
      }
    );

    test(
      "refreshes a previously issued anchor and enforces staleness",
      () => {
        const anchor =
          buildMockTestTrustedTimeEvidence({
            status: "ready",
            source: "server",
            serverNowMs: 500000,
            receivedAtClientMs: 1000,
            checkedAtClientMs: 1000,
            maxAgeMs: 5000,
          });

        const refreshed =
          resolveMockTestTrustedTime({
            evidence: anchor,
            checkedAtClientMs: 7000,
          });

        expect(refreshed.state).toBe(
          "stale"
        );
      }
    );

    test(
      "loading and error evidence remain fail closed",
      () => {
        const loading =
          buildMockTestTrustedTimeEvidence({
            status: "loading",
            checkedAtClientMs: 1000,
          });
        const error =
          buildMockTestTrustedTimeEvidence({
            status: "error",
            checkedAtClientMs: 1000,
            errorCode: "clock_failed",
          });

        expect(loading.isTrusted).toBe(
          false
        );
        expect(error.isTrusted).toBe(
          false
        );
        expect(error.errorCode).toBe(
          "clock_failed"
        );
      }
    );

    test(
      "uses a finite default freshness window and freezes output",
      () => {
        const evidence =
          buildMockTestTrustedTimeEvidence({
            checkedAtClientMs: 1000,
          });

        expect(evidence.maxAgeMs).toBe(
          DEFAULT_MOCK_TEST_TIME_MAX_AGE_MS
        );
        expect(
          Object.isFrozen(evidence)
        ).toBe(true);
      }
    );
  }
);
