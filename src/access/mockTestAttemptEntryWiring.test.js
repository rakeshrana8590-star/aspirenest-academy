import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe(
  "AspireNest Phase 7F-E attempt-entry wiring",
  () => {
    test(
      "App keeps timer and security inactive until the exact test gate is ready",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "isCurrentAttemptRuntimeAuthorized"
        );
        expect(source).toContain(
          "mockAttemptRuntimeActivation.canActivateTimer"
        );
        expect(source).toContain(
          "mockAttemptRuntimeActivation.canActivateSecurity"
        );
        expect(source).toContain(
          "onRuntimeGateChange={setMockAttemptRuntimeActivation}"
        );
        expect(source).toContain(
          "timerRuntime={mockTestTimerRuntime}"
        );
      }
    );

    test(
      "App passes central access evidence into the protected attempt route",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "isAdminUser={adaptiveShellRuntimeContext.isAdminUser}"
        );
        expect(source).toContain(
          "accessProfile={accessProfile}"
        );
        expect(source).toContain(
          "planCatalog={accessProfile?.planCatalog || []}"
        );
      }
    );

    test(
      "ExamAttemptRoute mounts the legacy premium runtime only after central gate readiness",
      () => {
        const source = readSource(
          "src/components/exam/ExamAttemptRoute.jsx"
        );

        expect(source).toContain(
          "useMockTestAttemptEntryRuntime"
        );
        expect(source).toContain(
          "entryRuntime.canActivateAttemptRuntime"
        );
        expect(source).toContain(
          "<ExamAttemptRuntime"
        );
        expect(source).toContain(
          "runtimeGate?.canActivateAttemptRuntime === true"
        );
        expect(source).toContain(
          "data-attempt-entry-state"
        );
        expect(source).toContain(
          "data-attempt-timer-state"
        );
        expect(source).toContain(
          "timerRuntime?.canRenderAttempt === true"
        );
      }
    );

    test(
      "attempt-entry barriers remain active while submit authorization is handled separately",
      () => {
        const routeSource = readSource(
          "src/components/exam/ExamAttemptRoute.jsx"
        );
        const timerSource = readSource(
          "src/components/exam/useExamTimer.js"
        );

        expect(routeSource).toContain(
          "useMockTestAttemptEntryRuntime"
        );
        expect(routeSource).toContain(
          "createMockTestSubmitAuthorizer"
        );
        expect(timerSource).toContain(
          "setInterval(tick, 250)"
        );
        expect(timerSource).toContain(
          "mock_test_submit"
        );
      }
    );
  }
);
