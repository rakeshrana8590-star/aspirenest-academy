import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe(
  "AspireNest Phase 7F-G timer resume reconciliation wiring",
  () => {
    test(
      "App exposes the timer runtime only after the exact attempt-entry gate is active",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "const mockTestTimerRuntime = useExamTimer"
        );
        expect(source).toContain(
          "timerRuntime={mockTestTimerRuntime}"
        );
        expect(source).toContain(
          "trustedTimeEvidence:"
        );
        expect(source).toContain(
          "mockAttemptRuntimeActivation.trustedTimeEvidence"
        );
      }
    );

    test(
      "ExamAttemptRoute blocks questions until timer reconciliation is ready",
      () => {
        const source = readSource(
          "src/components/exam/ExamAttemptRoute.jsx"
        );

        expect(source).toContain(
          "timerRuntime?.canRenderAttempt === true"
        );
        expect(source).toContain(
          "data-attempt-timer-state"
        );
        expect(source).toContain(
          "Reconciling exam timer"
        );
        expect(source).toContain(
          "trustedTimeEvidence:"
        );
      }
    );

    test(
      "timer hook requests trusted time, reconciles storage, and advances from a monotonic clock",
      () => {
        const source = readSource(
          "src/components/exam/useExamTimer.js"
        );

        expect(source).toContain(
          'purpose: "mock_test_timer_resume"'
        );
        expect(source).toContain(
          "reconcileMockTestAttemptTimer"
        );
        expect(source).toContain(
          "advanceMockTestAttemptTimer"
        );
        expect(source).toContain(
          "getMonotonicNow"
        );
        expect(source).toContain(
          "setInterval(tick, 250)"
        );
        expect(source).not.toContain(
          "currentTime - 1"
        );
      }
    );

    test(
      "secure time-up submission remains connected to the trusted submit authorizer",
      () => {
        const source = readSource(
          "src/components/exam/useExamTimer.js"
        );

        expect(source).toContain(
          "createMockTestSubmitAuthorizer"
        );
        expect(source).toContain(
          'forceSubmittedReason: "Time is over"'
        );
        expect(source).toContain(
          'purpose: "mock_test_submit"'
        );
        expect(source).not.toContain(
          "submittedAt: Date.now()"
        );
      }
    );
  }
);
