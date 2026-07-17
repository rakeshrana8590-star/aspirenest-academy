import {
  MOCK_TEST_TIMER_RUNTIME_STATES,
  advanceMockTestAttemptTimer,
  reconcileMockTestAttemptTimer,
} from "./mockTestTimerRuntime";

const TEST = Object.freeze({
  id: "mock-timer-1",
  section: "mockTest",
  timerMode: "globalTimer",
});

const trustedEvidence = ({
  serverNowMs = 100000,
  receivedAtClientMs = 2000,
  requestId = "timer-request-1",
} = {}) => ({
  state: "ready",
  status: "ready",
  source: "server",
  serverNowMs,
  receivedAtClientMs,
  checkedAtClientMs: receivedAtClientMs,
  maxAgeMs: 120000,
  requestId,
  isTrusted: true,
});

describe(
  "AspireNest trusted mock-test timer runtime",
  () => {
    test(
      "anchors a legacy global timer to trusted server time without increasing saved time",
      () => {
        const result = reconcileMockTestAttemptTimer({
          test: TEST,
          attemptState: {
            testId: TEST.id,
            currentIndex: 0,
            timeLeft: 45,
            startedAt: 1000,
            isSubmitted: false,
          },
          defaultTimeLeft: 60,
          trustedTimeEvidence: trustedEvidence(),
          checkedAtClientMs: 2000,
        });

        expect(result.state).toBe(
          MOCK_TEST_TIMER_RUNTIME_STATES.READY
        );
        expect(result.timeLeft).toBe(45);
        expect(
          result.attemptState.timerRuntime.deadlineAtServerMs
        ).toBe(145000);
        expect(
          result.attemptState.timerRuntime.source
        ).toBe("server");
        expect(result.wasMigrated).toBe(true);
      }
    );

    test(
      "deducts elapsed trusted time on resume and never increases the saved countdown",
      () => {
        const result = reconcileMockTestAttemptTimer({
          test: TEST,
          attemptState: {
            testId: TEST.id,
            currentIndex: 0,
            timeLeft: 20,
            timerRuntime: {
              version: 1,
              mode: "globalTimer",
              source: "server",
              requestId: "old-request",
              anchoredAtServerMs: 100000,
              deadlineAtServerMs: 130000,
              lastReconciledAtServerMs: 105000,
              questionIndex: 0,
            },
          },
          defaultTimeLeft: 60,
          trustedTimeEvidence: trustedEvidence({
            serverNowMs: 118500,
          }),
          checkedAtClientMs: 2000,
        });

        expect(result.timeLeft).toBe(12);
        expect(result.wasMigrated).toBe(false);
      }
    );

    test(
      "keeps a lower saved countdown instead of extending it from the deadline",
      () => {
        const result = reconcileMockTestAttemptTimer({
          test: TEST,
          attemptState: {
            testId: TEST.id,
            currentIndex: 0,
            timeLeft: 7,
            timerRuntime: {
              version: 1,
              mode: "globalTimer",
              source: "server",
              requestId: "old-request",
              anchoredAtServerMs: 100000,
              deadlineAtServerMs: 130000,
              lastReconciledAtServerMs: 105000,
              questionIndex: 0,
            },
          },
          defaultTimeLeft: 60,
          trustedTimeEvidence: trustedEvidence({
            serverNowMs: 110000,
          }),
          checkedAtClientMs: 2000,
        });

        expect(result.timeLeft).toBe(7);
      }
    );

    test(
      "marks an elapsed global timer as expired",
      () => {
        const result = reconcileMockTestAttemptTimer({
          test: TEST,
          attemptState: {
            testId: TEST.id,
            currentIndex: 0,
            timeLeft: 10,
            timerRuntime: {
              version: 1,
              mode: "globalTimer",
              source: "server",
              requestId: "old-request",
              anchoredAtServerMs: 100000,
              deadlineAtServerMs: 110000,
              lastReconciledAtServerMs: 105000,
              questionIndex: 0,
            },
          },
          defaultTimeLeft: 60,
          trustedTimeEvidence: trustedEvidence({
            serverNowMs: 111000,
          }),
          checkedAtClientMs: 2000,
        });

        expect(result.state).toBe(
          MOCK_TEST_TIMER_RUNTIME_STATES.EXPIRED
        );
        expect(result.timeLeft).toBe(0);
      }
    );

    test(
      "resets a per-question deadline only when the active question changes",
      () => {
        const perQuestionTest = {
          ...TEST,
          timerMode: "perQuestionTimer",
        };
        const attemptState = {
          testId: TEST.id,
          currentIndex: 2,
          timeLeft: 3,
          timerRuntime: {
            version: 1,
            mode: "perQuestionTimer",
            source: "server",
            requestId: "timer-request-1",
            anchoredAtServerMs: 100000,
            deadlineAtServerMs: 105000,
            lastReconciledAtServerMs: 102000,
            questionIndex: 1,
          },
        };
        const result = advanceMockTestAttemptTimer({
          test: perQuestionTest,
          attemptState,
          defaultTimeLeft: 10,
          trustedNowMs: 104000,
        });

        expect(result.wasReset).toBe(true);
        expect(result.timeLeft).toBe(10);
        expect(
          result.attemptState.timerRuntime.questionIndex
        ).toBe(2);
        expect(
          result.attemptState.timerRuntime.deadlineAtServerMs
        ).toBe(114000);
      }
    );

    test(
      "fails closed for malformed stored timer evidence",
      () => {
        const result = reconcileMockTestAttemptTimer({
          test: TEST,
          attemptState: {
            testId: TEST.id,
            timeLeft: 60,
            timerRuntime: {
              version: 1,
              mode: "globalTimer",
              source: "client",
            },
          },
          defaultTimeLeft: 60,
          trustedTimeEvidence: trustedEvidence(),
          checkedAtClientMs: 2000,
        });

        expect(result.state).toBe(
          MOCK_TEST_TIMER_RUNTIME_STATES.ERROR
        );
        expect(result.errorCode).toBe(
          "timer_runtime_invalid"
        );
      }
    );

    test(
      "allows no-timer attempts without a server-time dependency",
      () => {
        const result = reconcileMockTestAttemptTimer({
          test: {
            ...TEST,
            timerMode: "noTimer",
          },
          attemptState: {
            testId: TEST.id,
            timeLeft: 99,
          },
          defaultTimeLeft: 0,
          trustedTimeEvidence: null,
        });

        expect(result.state).toBe(
          MOCK_TEST_TIMER_RUNTIME_STATES.NO_TIMER
        );
        expect(result.isReady).toBe(true);
        expect(result.timeLeft).toBe(0);
      }
    );
  }
);
