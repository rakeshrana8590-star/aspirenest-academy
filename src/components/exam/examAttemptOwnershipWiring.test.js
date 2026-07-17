import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

describe(
  "AspireNest Phase 7F-H attempt ownership wiring",
  () => {
    test("App binds attempt state to the authenticated user and forwards user to review", () => {
      const source = readSource("src/App.js");

      expect(source).toContain(
        "useExamAttemptState(universalContent, user)"
      );
      expect(source).toMatch(
        /<ExamReviewRoute[\s\S]*?user=\{user\}[\s\S]*?mockAttemptState=\{mockAttemptState\}/
      );
    });

    test("the storage contract uses a versioned owner scope and strict ownership checks", () => {
      const source = readSource(
        "src/components/exam/examAttemptStorage.js"
      );

      expect(source).toContain(
        'const ATTEMPT_STORAGE_PREFIX = "aspireExamAttempt_v2"'
      );
      expect(source).toContain(
        "EXAM_ATTEMPT_STORAGE_VERSION = 2"
      );
      expect(source).toContain("attemptOwnerScope");
      expect(source).toContain("ownerUid");
      expect(source).toContain("ownerEmail");
      expect(source).toContain(
        "isAttemptStateOwnedByIdentity"
      );
      expect(source).toContain("migrateOwnedLegacyAttempt");
    });

    test("the shared attempt map discards states that do not belong to the active learner", () => {
      const source = readSource(
        "src/components/exam/useExamAttemptState.js"
      );

      expect(source).toContain("setAttemptStorageIdentity");
      expect(source).toContain("sanitizeOwnedAttemptMap");
      expect(source).toContain(
        "isAttemptStateOwnedByIdentity"
      );
      expect(source).toContain("ownerScope");
      expect(source).toContain(
        "restoreAttemptState(\n                activeTest,\n                0,\n                ownerIdentity"
      );
    });

    test("attempt and timer writes always carry explicit authenticated identity", () => {
      const routeSource = readSource(
        "src/components/exam/ExamAttemptRoute.jsx"
      );
      const timerSource = readSource(
        "src/components/exam/useExamTimer.js"
      );

      expect(routeSource).toContain(
        "createDefaultAttemptState(\n        test,\n        defaultTimerSeconds,\n        user"
      );
      expect(routeSource).toContain(
        "saveAttemptState(test.id, finalState, user)"
      );
      expect(timerSource).toContain("context.user");
      expect(timerSource).toMatch(
        /restoreAttemptState\([\s\S]*?context\.user/
      );
      expect(timerSource).toMatch(
        /saveAttemptState\([\s\S]*?context\.user/
      );
    });

    test("start result and review routes no longer read the unscoped legacy answer key", () => {
      const startSource = readSource(
        "src/components/exam/ExamStartRoute.jsx"
      );
      const resultSource = readSource(
        "src/components/exam/ExamResultRoute.jsx"
      );
      const reviewSource = readSource(
        "src/components/exam/ExamReviewRoute.jsx"
      );
      const combined = `${startSource}\n${resultSource}\n${reviewSource}`;

      expect(combined).not.toContain(
        "mockAttemptAnswers_${test.id}"
      );
      expect(startSource).toContain(
        "getAttemptStorageKey(test.id, user)"
      );
      expect(startSource).toContain(
        "removeAttemptState(test.id, user)"
      );
      expect(resultSource).toContain(
        "getAttemptAnswerStorageKey(test.id, user)"
      );
      expect(reviewSource).toContain(
        "getAttemptAnswerStorageKey(test.id, user)"
      );
    });
  }
);
