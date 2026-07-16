import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DECISIONS,
  MOCK_TEST_DISCOVERY_MODES,
  MOCK_TEST_REASON_CODES,
  MOCK_TEST_TIME_SOURCES,
  buildMockAttemptOwnershipKey,
  buildMockTestActionDecision,
  buildMockTestCatalogProjection,
  buildPublicMockLeaderboardProjection,
  isMockRecordOwnedByPrincipal,
} from "./mockTestActionPolicy";

const PRINCIPAL = Object.freeze({
  uid: "student-1",
  email:
    "student@aspirenestacademy.in",
  isAuthenticated: true,
});

const PUBLISHED_TEST = Object.freeze({
  id: "mock-premium-1",
  section: "mockTest",
  status: "published",
  title: "Premium CDP Mega Mock",
  description: "Complete CDP practice",
  planType: "PREMIUM",
  subject: "CDP",
  chapter: "Learning",
  durationMinutes: 60,
  totalQuestions: 2,
  totalMarks: 2,
  questions: [
    {
      question: "Protected question",
      option1: "A",
      option2: "B",
      answer: "option1",
      explanation:
        "Protected explanation",
    },
  ],
  fileUrl:
    "https://assets.invalid/file.pdf",
  videoUrl:
    "https://assets.invalid/video",
});

const ITEM_ACCESS = Object.freeze({
  status: "allowed",
  sourceScope: "item",
  module: "mockTest",
  itemType: "mockTest",
  itemId: "mock-premium-1",
});

const PLAN_ACCESS = Object.freeze({
  status: "allowed",
  sourceScope: "plan",
});

const OWNED_ATTEMPT = Object.freeze({
  testId: "mock-premium-1",
  ownerUid: "student-1",
  ownerEmail:
    "student@aspirenestacademy.in",
  status: "in_progress",
  startedAt:
    "2026-07-16T09:00:00Z",
});

const OWNED_RESULT = Object.freeze({
  testId: "mock-premium-1",
  ownerUid: "student-1",
  ownerEmail:
    "student@aspirenestacademy.in",
  status: "submitted",
  submittedAt:
    "2026-07-16T10:00:00Z",
});

const decide = (overrides = {}) =>
  buildMockTestActionDecision({
    action: MOCK_TEST_ACTIONS.OPEN,
    test: PUBLISHED_TEST,
    principal: PRINCIPAL,
    access: ITEM_ACCESS,
    now:
      "2026-07-16T09:30:00Z",
    ...overrides,
  });

describe(
  "AspireNest Mock Test action policy",
  () => {
    test(
      "unknown actions fail closed",
      () => {
        const decision = decide({
          action: "DELETE_ALL",
        });

        expect(decision.allowed).toBe(
          false
        );
        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .INVALID_ACTION
        );
      }
    );

    test(
      "missing and non-mock resources fail closed",
      () => {
        expect(
          decide({ test: null }).reason
        ).toBe(
          MOCK_TEST_REASON_CODES.NOT_FOUND
        );

        expect(
          decide({
            test: {
              ...PUBLISHED_TEST,
              section: "notes",
            },
          }).reason
        ).toBe(
          MOCK_TEST_REASON_CODES
            .NOT_MOCK_TEST
        );
      }
    );

    test(
      "unpublished tests are hidden from discovery",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.DISCOVER,
          test: {
            ...PUBLISHED_TEST,
            status: "draft",
          },
        });

        expect(decision.decision).toBe(
          MOCK_TEST_DECISIONS.HIDE
        );
        expect(decision.visible).toBe(
          false
        );
      }
    );

    test(
      "catalog discovery can show a paid locked preview",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.DISCOVER,
          access: { status: "denied" },
        });

        expect(decision.decision).toBe(
          MOCK_TEST_DECISIONS
            .LOCKED_PREVIEW
        );
        expect(
          decision.canExposeCatalogMetadata
        ).toBe(true);
        expect(
          decision.canExposeQuestions
        ).toBe(false);
        expect(
          decision.canExposeAnswers
        ).toBe(false);
      }
    );

    test(
      "My Access discovery hides non-entitled tests",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.DISCOVER,
          discoveryMode:
            MOCK_TEST_DISCOVERY_MODES
              .MY_ACCESS,
          access: { status: "denied" },
        });

        expect(decision.decision).toBe(
          MOCK_TEST_DECISIONS.HIDE
        );
        expect(decision.visible).toBe(
          false
        );
      }
    );

    test(
      "exact ITEM access opens only its matching test",
      () => {
        const allowed = decide();
        const denied = decide({
          test: {
            ...PUBLISHED_TEST,
            id: "mock-premium-2",
          },
        });

        expect(allowed.allowed).toBe(
          true
        );
        expect(allowed.exactItem).toBe(
          true
        );
        expect(denied.allowed).toBe(
          false
        );
        expect(denied.reason).toBe(
          MOCK_TEST_REASON_CODES
            .ACCESS_SCOPE_MISMATCH
        );
      }
    );

    test(
      "bundle access requires the exact test ID",
      () => {
        const allowed = decide({
          access: {
            status: "allowed",
            sourceScope: "bundle",
            module: "mockTest",
            itemIds: [
              "mock-premium-1",
              "mock-premium-3",
            ],
          },
        });
        const denied = decide({
          access: {
            status: "allowed",
            sourceScope: "bundle",
            module: "mockTest",
            itemIds: [
              "mock-premium-3",
            ],
          },
        });

        expect(allowed.allowed).toBe(
          true
        );
        expect(denied.allowed).toBe(
          false
        );
      }
    );

    test(
      "unknown allowed scopes still fail closed",
      () => {
        const decision = decide({
          access: {
            status: "allowed",
            sourceScope: "mystery",
          },
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .ACCESS_SCOPE_MISMATCH
        );
      }
    );

    test.each([
      [
        "loading",
        MOCK_TEST_REASON_CODES
          .ACCESS_LOADING,
      ],
      [
        "error",
        MOCK_TEST_REASON_CODES
          .ACCESS_ERROR,
      ],
    ])(
      "%s access state fails closed",
      (status, reason) => {
        const decision = decide({
          access: {
            status,
            sourceScope: "plan",
          },
        });

        expect(decision.allowed).toBe(
          false
        );
        expect(decision.reason).toBe(
          reason
        );
      }
    );

    test(
      "custom dynamic plan identity remains commercial metadata",
      () => {
        const decision = decide({
          test: {
            ...PUBLISHED_TEST,
            planType:
              "CTET_CRASH_45",
          },
          access: PLAN_ACCESS,
        });

        expect(decision.allowed).toBe(
          true
        );
        expect(
          decision.requiredPlan
        ).toBe("CTET_CRASH_45");
      }
    );

    test(
      "OPEN requires an authenticated learner",
      () => {
        const decision = decide({
          principal: {},
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .LOGIN_REQUIRED
        );
      }
    );

    test(
      "OPEN may show instructions for an upcoming test",
      () => {
        const decision = decide({
          test: {
            ...PUBLISHED_TEST,
            examStartDate:
              "2026-07-17",
            examStartTime: "10:00",
          },
        });

        expect(decision.allowed).toBe(
          true
        );
        expect(
          decision.scheduleStatus
        ).toBe("upcoming");
        expect(
          decision.canExposeQuestions
        ).toBe(false);
      }
    );

    test(
      "scheduled ATTEMPT requires trusted server time",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.ATTEMPT,
          test: {
            ...PUBLISHED_TEST,
            examStartDate:
              "2026-07-16",
            examStartTime: "09:00",
            examEndDate:
              "2026-07-16",
            examEndTime: "10:00",
          },
          timeSource:
            MOCK_TEST_TIME_SOURCES.CLIENT,
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .SERVER_TIME_REQUIRED
        );
        expect(
          decision.requiresServerTime
        ).toBe(true);
      }
    );

    test(
      "scheduled ATTEMPT opens questions only inside the server-verified window",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.ATTEMPT,
          test: {
            ...PUBLISHED_TEST,
            examStartDate:
              "2026-07-16",
            examStartTime: "09:00",
            examEndDate:
              "2026-07-16",
            examEndTime: "10:00",
          },
          timeSource:
            MOCK_TEST_TIME_SOURCES.SERVER,
        });

        expect(decision.allowed).toBe(
          true
        );
        expect(
          decision.canExposeQuestions
        ).toBe(true);
        expect(
          decision.canExposeAnswers
        ).toBe(false);
      }
    );

    test(
      "owned in-progress attempts can resume",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.ATTEMPT,
          attempt: OWNED_ATTEMPT,
        });

        expect(decision.allowed).toBe(
          true
        );
        expect(
          decision.requiresOwnedAttempt
        ).toBe(true);
      }
    );

    test(
      "cross-user attempt ownership is rejected",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.ATTEMPT,
          attempt: {
            ...OWNED_ATTEMPT,
            ownerUid: "student-2",
          },
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .ATTEMPT_OWNERSHIP_MISMATCH
        );
      }
    );

    test(
      "submitted attempts cannot reopen ATTEMPT",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.ATTEMPT,
          attempt: {
            ...OWNED_ATTEMPT,
            status: "submitted",
            submittedAt:
              "2026-07-16T10:00:00Z",
          },
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .INVALID_ATTEMPT_STATE
        );
      }
    );

    test(
      "SUBMIT requires trusted server time",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.SUBMIT,
          attempt: OWNED_ATTEMPT,
          timeSource:
            MOCK_TEST_TIME_SOURCES.CLIENT,
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .SERVER_TIME_REQUIRED
        );
      }
    );

    test(
      "SUBMIT requires an owned in-progress attempt",
      () => {
        const allowed = decide({
          action:
            MOCK_TEST_ACTIONS.SUBMIT,
          attempt: OWNED_ATTEMPT,
          timeSource:
            MOCK_TEST_TIME_SOURCES.SERVER,
        });
        const denied = decide({
          action:
            MOCK_TEST_ACTIONS.SUBMIT,
          attempt: {
            ...OWNED_ATTEMPT,
            ownerEmail:
              "other@aspirenestacademy.in",
          },
          timeSource:
            MOCK_TEST_TIME_SOURCES.SERVER,
        });

        expect(allowed.allowed).toBe(
          true
        );
        expect(denied.reason).toBe(
          MOCK_TEST_REASON_CODES
            .ATTEMPT_OWNERSHIP_MISMATCH
        );
      }
    );

    test(
      "VIEW_RESULT independently requires an owned submitted result",
      () => {
        const allowed = decide({
          action:
            MOCK_TEST_ACTIONS.VIEW_RESULT,
          result: OWNED_RESULT,
        });
        const missing = decide({
          action:
            MOCK_TEST_ACTIONS.VIEW_RESULT,
          result: null,
        });

        expect(allowed.allowed).toBe(
          true
        );
        expect(
          allowed.requiresOwnedResult
        ).toBe(true);
        expect(missing.reason).toBe(
          MOCK_TEST_REASON_CODES
            .RESULT_REQUIRED
        );
      }
    );

    test(
      "cross-user result ownership is rejected",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.VIEW_RESULT,
          result: {
            ...OWNED_RESULT,
            ownerUid: "student-2",
          },
        });

        expect(decision.reason).toBe(
          MOCK_TEST_REASON_CODES
            .RESULT_OWNERSHIP_MISMATCH
        );
      }
    );

    test(
      "REVIEW is separate from result and requires answer release",
      () => {
        const locked = decide({
          action:
            MOCK_TEST_ACTIONS.REVIEW,
          result: OWNED_RESULT,
          reviewReleased: false,
        });
        const allowed = decide({
          action:
            MOCK_TEST_ACTIONS.REVIEW,
          result: OWNED_RESULT,
          reviewReleased: true,
        });

        expect(locked.reason).toBe(
          MOCK_TEST_REASON_CODES
            .REVIEW_NOT_RELEASED
        );
        expect(
          locked.canExposeAnswers
        ).toBe(false);
        expect(allowed.allowed).toBe(
          true
        );
        expect(
          allowed.canExposeAnswers
        ).toBe(true);
      }
    );

    test(
      "leaderboard action requires a public-safe projection",
      () => {
        const denied = decide({
          action:
            MOCK_TEST_ACTIONS.LEADERBOARD,
          publicProjection: false,
        });
        const allowed = decide({
          action:
            MOCK_TEST_ACTIONS.LEADERBOARD,
          principal: {},
          access: {},
          publicProjection: true,
        });

        expect(denied.reason).toBe(
          MOCK_TEST_REASON_CODES
            .PUBLIC_PROJECTION_REQUIRED
        );
        expect(allowed.allowed).toBe(
          true
        );
      }
    );

    test(
      "catalog projection excludes questions, answers, explanations and asset URLs",
      () => {
        const decision = decide({
          action:
            MOCK_TEST_ACTIONS.DISCOVER,
        });
        const projection =
          buildMockTestCatalogProjection({
            test: PUBLISHED_TEST,
            decision,
          });
        const serialized =
          JSON.stringify(projection);

        expect(projection.title).toBe(
          "Premium CDP Mega Mock"
        );
        expect(serialized).not.toContain(
          "Protected question"
        );
        expect(serialized).not.toContain(
          "Protected explanation"
        );
        expect(serialized).not.toContain(
          "assets.invalid"
        );
        expect(serialized).not.toContain(
          '"answer"'
        );
      }
    );

    test(
      "public leaderboard projection strips PII, answers and attempt identifiers",
      () => {
        const projection =
          buildPublicMockLeaderboardProjection(
            {
              testId:
                "mock-premium-1",
              testTitle:
                "Premium CDP Mega Mock",
              studentName:
                "Rakesh Rana",
              studentEmail:
                "student@aspirenestacademy.in",
              uid: "student-1",
              attemptId:
                "private-attempt-id",
              answers: {
                0: "option1",
              },
              questionOrder: [0],
              percentage: 88.4,
              score: 88,
              totalMarks: 100,
              correctCount: 88,
              totalQuestions: 100,
              durationSeconds: 2700,
            },
            { rank: 3 }
          );
        const serialized =
          JSON.stringify(projection);

        expect(projection.rank).toBe(3);
        expect(projection.displayName).toBe(
          "Rakesh R***"
        );
        expect(serialized).not.toContain(
          "student@aspirenestacademy.in"
        );
        expect(serialized).not.toContain(
          "private-attempt-id"
        );
        expect(serialized).not.toContain(
          "option1"
        );
        expect(serialized).not.toContain(
          "student-1"
        );
      }
    );

    test(
      "attempt storage ownership key is UID scoped",
      () => {
        expect(
          buildMockAttemptOwnershipKey({
            principal: PRINCIPAL,
            testId:
              "mock-premium-1",
          })
        ).toBe(
          "mockAttempt:student-1:mock-premium-1"
        );

        expect(
          buildMockAttemptOwnershipKey({
            principal: {
              email:
                "student@aspirenestacademy.in",
            },
            testId:
              "mock-premium-1",
          })
        ).toBe("");
      }
    );

    test(
      "record ownership requires matching UID and email when both exist",
      () => {
        expect(
          isMockRecordOwnedByPrincipal(
            OWNED_RESULT,
            PRINCIPAL
          )
        ).toBe(true);

        expect(
          isMockRecordOwnedByPrincipal(
            {
              ...OWNED_RESULT,
              ownerEmail:
                "other@aspirenestacademy.in",
            },
            PRINCIPAL
          )
        ).toBe(false);
      }
    );

    test(
      "decisions and public projections are immutable",
      () => {
        const decision = decide();
        const projection =
          buildPublicMockLeaderboardProjection(
            {
              testId:
                "mock-premium-1",
              studentName:
                "Rakesh Rana",
            }
          );

        expect(
          Object.isFrozen(decision)
        ).toBe(true);
        expect(
          Object.isFrozen(projection)
        ).toBe(true);
      }
    );
  }
);
