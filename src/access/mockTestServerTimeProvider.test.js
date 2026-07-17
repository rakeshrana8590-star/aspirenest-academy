import {
  MOCK_TEST_SERVER_TIME_PROVIDER_STATES,
  createMockTestServerTimeProvider,
  validateMockTestServerTimePayload,
} from "./mockTestServerTimeProvider";

const USER = Object.freeze({
  uid: "student-1",
  email:
    "student@aspirenestacademy.in",
});

const response = (
  overrides = {}
) => ({
  data: {
    source: "server",
    serverNowMs: 100000,
    requestId: "clock-1",
    authenticated: true,
    uid: USER.uid,
    ...overrides,
  },
});

const clock = (
  values = [1000, 1100]
) => {
  let index = 0;

  return () => {
    const value =
      values[
        Math.min(
          index,
          values.length - 1
        )
      ];
    index += 1;
    return value;
  };
};

const create = (
  overrides = {}
) =>
  createMockTestServerTimeProvider({
    callServerTime: jest.fn(
      async () => response()
    ),
    getCurrentUser: () => USER,
    clientNow: clock(),
    ...overrides,
  });

describe(
  "AspireNest Mock Test server-time provider interface",
  () => {
    test(
      "accepts the minimal authenticated callable response shape",
      () => {
        const validation =
          validateMockTestServerTimePayload({
            payload: response(),
            expectedUid: USER.uid,
          });

        expect(validation.valid).toBe(
          true
        );
        expect(validation.source).toBe(
          "server"
        );
        expect(
          validation.serverNowMs
        ).toBe(100000);
        expect(
          validation.requestId
        ).toBe("clock-1");
      }
    );

    test(
      "rejects client-labelled time and malformed responses",
      () => {
        const clientTime =
          validateMockTestServerTimePayload({
            payload: response({
              source: "client",
            }),
            expectedUid: USER.uid,
          });
        const missingRequestId =
          validateMockTestServerTimePayload({
            payload: response({
              requestId: "",
            }),
            expectedUid: USER.uid,
          });
        const missingAuth =
          validateMockTestServerTimePayload({
            payload: response({
              authenticated: false,
            }),
            expectedUid: USER.uid,
          });

        expect(clientTime.valid).toBe(
          false
        );
        expect(
          clientTime.errorCode
        ).toBe(
          "server_time_source_invalid"
        );
        expect(
          missingRequestId.valid
        ).toBe(false);
        expect(missingAuth.valid).toBe(
          false
        );
      }
    );

    test(
      "requires a verified current user before invoking the provider",
      async () => {
        const callServerTime =
          jest.fn(
            async () => response()
          );
        const provider =
          createMockTestServerTimeProvider({
            callServerTime,
            getCurrentUser: () =>
              null,
            clientNow: clock(),
          });

        const result =
          await provider.load({
            testId: "mock-1",
          });

        expect(result.state).toBe(
          MOCK_TEST_SERVER_TIME_PROVIDER_STATES
            .AUTH_REQUIRED
        );
        expect(callServerTime).not.toHaveBeenCalled();
      }
    );

    test(
      "fails closed when no runtime provider is configured",
      async () => {
        const provider =
          createMockTestServerTimeProvider({
            getCurrentUser: () =>
              USER,
          });

        const result =
          await provider.load();

        expect(result.state).toBe(
          "unavailable"
        );
        expect(result.isReady).toBe(
          false
        );
      }
    );

    test(
      "creates trusted evidence only after a successful authenticated call",
      async () => {
        const callServerTime =
          jest.fn(
            async () => response()
          );
        const provider = create({
          callServerTime,
        });

        const result =
          await provider.load({
            purpose:
              "mock_test_attempt",
            testId: "mock-1",
          });

        expect(callServerTime).toHaveBeenCalledWith({
          purpose:
            "mock_test_attempt",
          testId: "mock-1",
        });
        expect(result.state).toBe(
          "ready"
        );
        expect(result.isReady).toBe(
          true
        );
        expect(
          result.evidence.isTrusted
        ).toBe(true);
        expect(
          result.evidence.timeSource
        ).toBe("server");
        expect(result.roundTripMs).toBe(
          100
        );
        expect(
          result.uncertaintyMs
        ).toBe(100);
      }
    );

    test(
      "rejects responses that exceed the round-trip safety limit",
      async () => {
        const provider = create({
          clientNow: clock([
            1000,
            7001,
          ]),
          maxRoundTripMs: 5000,
        });

        const result =
          await provider.load();

        expect(result.state).toBe(
          "slow_response"
        );
        expect(result.isReady).toBe(
          false
        );
        expect(result.evidence).toBeNull();
      }
    );

    test(
      "rejects a response issued for another learner",
      async () => {
        const provider = create({
          callServerTime: jest.fn(
            async () =>
              response({
                uid: "student-2",
              })
          ),
        });

        const result =
          await provider.load();

        expect(result.state).toBe(
          "invalid_response"
        );
        expect(result.errorCode).toBe(
          "server_time_uid_mismatch"
        );
      }
    );

    test(
      "rejects replayed request identifiers",
      async () => {
        const provider = create({
          clientNow: clock([
            1000,
            1100,
            1200,
            1300,
          ]),
        });

        const first =
          await provider.load();
        const second =
          await provider.load();

        expect(first.state).toBe(
          "ready"
        );
        expect(second.state).toBe(
          "replayed_response"
        );
        expect(
          provider.hasSeenRequestId(
            "clock-1"
          )
        ).toBe(true);
      }
    );

    test(
      "converts callable failures into a fail-closed error state",
      async () => {
        const provider = create({
          callServerTime: jest.fn(
            async () => {
              const error =
                new Error(
                  "Callable unavailable"
                );
              error.code =
                "functions/unavailable";
              throw error;
            }
          ),
        });

        const result =
          await provider.load();

        expect(result.state).toBe(
          "error"
        );
        expect(result.errorCode).toBe(
          "functions/unavailable"
        );
        expect(result.isReady).toBe(
          false
        );
      }
    );

    test(
      "provider result and provider interface are immutable",
      async () => {
        const provider = create();
        const result =
          await provider.load();

        expect(
          Object.isFrozen(provider)
        ).toBe(true);
        expect(
          Object.isFrozen(result)
        ).toBe(true);
      }
    );
  }
);
