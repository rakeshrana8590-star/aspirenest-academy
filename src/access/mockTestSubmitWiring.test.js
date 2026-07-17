import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe(
  "AspireNest Phase 7F-F submit runtime wiring",
  () => {
    test(
      "manual and violation submissions require the secure submit authorizer",
      () => {
        const source = readSource(
          "src/components/exam/ExamAttemptRoute.jsx"
        );

        expect(source).toContain(
          "createMockTestSubmitAuthorizer"
        );
        expect(source).toContain(
          "authorizeAndPersistSubmission"
        );
        expect(source).toContain(
          'purpose: "mock_test_submit"'
        );
        expect(source).toContain(
          'forceSubmittedReason:\n        "Violation limit exceeded"'
        );
        expect(source).not.toContain(
          "submittedAt: Date.now()"
        );
      }
    );

    test(
      "time-up auto-submit uses the same trusted authorization contract",
      () => {
        const source = readSource(
          "src/components/exam/useExamTimer.js"
        );

        expect(source).toContain(
          "createMockTestSubmitAuthorizer"
        );
        expect(source).toContain(
          "submitRuntimeContextRef"
        );
        expect(source).toContain(
          'forceSubmittedReason: "Time is over"'
        );
        expect(source).toContain(
          'purpose: "mock_test_submit"'
        );
        expect(source).not.toContain(
          "submittedAt: shouldAutoSubmit"
        );
        expect(source).not.toContain(
          "submittedAt: Date.now()"
        );
      }
    );

    test(
      "App supplies central access context to timer and attempt submit paths",
      () => {
        const source = readSource("src/App.js");

        expect(source).toContain(
          "mockTestSubmitRuntimeContextRef"
        );
        expect(source).toContain(
          "submitRuntimeContextRef:"
        );
        expect(source).toContain(
          "accessProfile,"
        );
        expect(source).toContain(
          "planCatalog:"
        );
        expect(source).toContain(
          'role={user?.role || ""}'
        );
      }
    );

    test(
      "submit authorization always requests trusted server time and validates owned attempt evidence",
      () => {
        const source = readSource(
          "src/access/mockTestSubmitRuntime.js"
        );

        expect(source).toContain(
          "MOCK_TEST_ACTIONS.SUBMIT"
        );
        expect(source).toContain(
          'purpose: "mock_test_submit"'
        );
        expect(source).toContain(
          "buildMockTestSubmitAttemptEvidence"
        );
        expect(source).toContain(
          "ownerUid"
        );
        expect(source).toContain(
          "trustedNowMs"
        );
      }
    );
  }
);
