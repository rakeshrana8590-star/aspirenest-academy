import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DECISIONS,
  MOCK_TEST_DISCOVERY_MODES,
  MOCK_TEST_REASON_CODES,
  MOCK_TEST_TIME_SOURCES,
} from "./mockTestActionPolicy";
import {
  MOCK_TEST_RUNTIME_ACCESS_STATES,
  buildMockTestCatalogItem,
  buildMockTestPrincipal,
  buildMockTestRuntimeDecision,
  resolveMockTestRuntimeAccess,
} from "./mockTestRuntimeAdapter";

const USER = Object.freeze({
  uid: "student-1",
  email:
    "student@aspirenestacademy.in",
});

const PREMIUM_TEST = Object.freeze({
  id: "mock-premium-1",
  section: "mockTest",
  status: "published",
  title: "Premium CDP Mock",
  planType: "PREMIUM",
  subject: "CDP",
  questions: [
    {
      question: "Protected question",
      answer: "option1",
      explanation:
        "Protected explanation",
    },
  ],
  fileUrl:
    "https://assets.invalid/file.pdf",
});

const profile = (
  accessRecords = [],
  overrides = {}
) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  accessRecords,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
  ...overrides,
});

const activeRecord = (
  overrides = {}
) => ({
  id: "access-1",
  status: "active",
  planType: "PREMIUM",
  ...overrides,
});

const decide = (overrides = {}) =>
  buildMockTestRuntimeDecision({
    action: MOCK_TEST_ACTIONS.OPEN,
    test: PREMIUM_TEST,
    user: USER,
    accessProfile: profile([
      activeRecord({
        scopeType: "plan",
      }),
    ]),
    ...overrides,
  });

describe(
  "AspireNest Mock Test runtime adapter",
  () => {
    test(
      "builds a normalized authenticated principal",
      () => {
        expect(
          buildMockTestPrincipal({
            user: {
              uid: " student-1 ",
              email:
                "STUDENT@AspireNestAcademy.in",
            },
            isAdminUser: false,
          })
        ).toEqual({
          uid: "student-1",
          email:
            "student@aspirenestacademy.in",
          isAuthenticated: true,
          isAdmin: false,
          role: "",
        });
      }
    );

    test(
      "FREE mock resources resolve without a paid grant",
      () => {
        const evidence =
          resolveMockTestRuntimeAccess({
            test: {
              ...PREMIUM_TEST,
              id: "mock-free-1",
              planType: "FREE",
            },
            accessProfile: profile([]),
          });

        expect(evidence.status).toBe(
          MOCK_TEST_RUNTIME_ACCESS_STATES
            .ALLOWED
        );
        expect(evidence.sourceScope).toBe(
          "free"
        );
      }
    );

    test(
      "loading and error access states fail closed",
      () => {
        const loading =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([], {
              loading: true,
              shellState: {
                mode: "loading",
                isFailClosed: true,
              },
            }),
          });
        const error =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([], {
              error: new Error(
                "Access unavailable"
              ),
              isAccessCheckUnavailable:
                true,
              shellState: {
                mode: "error",
                isFailClosed: true,
              },
            }),
          });

        expect(loading.status).toBe(
          "loading"
        );
        expect(error.status).toBe(
          "error"
        );
      }
    );

    test(
      "denied evidence is null-safe and retains Mock Test defaults",
      () => {
        const evidence =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([]),
          });

        expect(evidence.status).toBe(
          "denied"
        );
        expect(evidence.module).toBe(
          "mockTest"
        );
        expect(evidence.itemType).toBe(
          "mockTest"
        );
        expect(evidence.accessId).toBeNull();
      }
    );

    test(
      "exact ITEM evidence has highest precedence and only opens its test",
      () => {
        const accessProfile = profile([
          activeRecord({
            id: "plan-access",
            scopeType: "plan",
          }),
          activeRecord({
            id: "item-access",
            scopeType: "item",
            module: "mockTest",
            itemType: "mockTest",
            itemId:
              "mock-premium-1",
            planType: "FREE",
          }),
        ]);

        const allowed =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile,
          });
        const denied =
          resolveMockTestRuntimeAccess({
            test: {
              ...PREMIUM_TEST,
              id: "mock-premium-2",
            },
            accessProfile: profile([
              activeRecord({
                id: "item-access",
                scopeType: "item",
                module: "mockTest",
                itemType: "mockTest",
                itemId:
                  "mock-premium-1",
                planType: "FREE",
              }),
            ]),
          });

        expect(allowed.sourceScope).toBe(
          "item"
        );
        expect(allowed.accessId).toBe(
          "item-access"
        );
        expect(allowed.exactItem).toBe(
          true
        );
        expect(denied.status).toBe(
          "denied"
        );
      }
    );

    test(
      "BUNDLE evidence requires the exact test ID",
      () => {
        const accessProfile = profile([
          activeRecord({
            scopeType: "bundle",
            module: "mockTest",
            itemType: "mockTest",
            itemIds: [
              "mock-premium-1",
              "mock-premium-3",
            ],
            planType: "FREE",
          }),
        ]);

        const allowed =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile,
          });
        const denied =
          resolveMockTestRuntimeAccess({
            test: {
              ...PREMIUM_TEST,
              id: "mock-premium-2",
            },
            accessProfile,
          });

        expect(allowed.sourceScope).toBe(
          "bundle"
        );
        expect(allowed.itemIds).toEqual([
          "mock-premium-1",
          "mock-premium-3",
        ]);
        expect(denied.status).toBe(
          "denied"
        );
      }
    );

    test(
      "MODULE evidence cannot unlock another module",
      () => {
        const allowed =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([
              activeRecord({
                scopeType: "module",
                module: "mockTest",
              }),
            ]),
          });
        const denied =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([
              activeRecord({
                scopeType: "module",
                module: "notes",
              }),
            ]),
          });

        expect(allowed.sourceScope).toBe(
          "module"
        );
        expect(denied.status).toBe(
          "denied"
        );
      }
    );

    test(
      "lower PLAN hierarchy does not unlock a higher test",
      () => {
        const evidence =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
                planType: "BASIC",
                accessRank: 100,
              }),
            ]),
          });

        expect(evidence.status).toBe(
          "denied"
        );
      }
    );

    test(
      "dynamic PLAN hierarchy uses accessRank without collapsing custom codes",
      () => {
        const customTest = {
          ...PREMIUM_TEST,
          id: "mock-crash-45",
          planCode: "CTET_CRASH_45",
          planType: undefined,
          accessRank: 150,
        };
        const evidence =
          resolveMockTestRuntimeAccess({
            test: customTest,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
                planCode:
                  "ASPIRE_ELITE_2026",
                planType:
                  "ASPIRE_ELITE_2026",
                accessRank: 640,
                productId:
                  "product-elite",
              }),
            ]),
          });

        expect(evidence.status).toBe(
          "allowed"
        );
        expect(evidence.sourceScope).toBe(
          "plan"
        );
        expect(evidence.planCode).toBe(
          "ASPIRE_ELITE_2026"
        );
        expect(
          evidence.requiredPlanCode
        ).toBe("CTET_CRASH_45");
        expect(evidence.accessRank).toBe(
          640
        );
      }
    );

    test(
      "dynamic catalog ranks can resolve when records omit embedded ranks",
      () => {
        const planCatalog = [
          {
            planCode:
              "CTET_CRASH_45",
            accessRank: 150,
            productId:
              "product-crash",
          },
          {
            planCode:
              "ASPIRE_ELITE_2026",
            accessRank: 640,
            productId:
              "product-elite",
          },
        ];
        const evidence =
          resolveMockTestRuntimeAccess({
            test: {
              ...PREMIUM_TEST,
              id: "mock-crash-45",
              planCode:
                "CTET_CRASH_45",
              planType: undefined,
              productId:
                "product-crash",
            },
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
                planCode:
                  "ASPIRE_ELITE_2026",
                planType:
                  "ASPIRE_ELITE_2026",
                productId:
                  "product-elite",
                accessRank: undefined,
              }),
            ]),
            planCatalog,
          });

        expect(evidence.status).toBe(
          "allowed"
        );
        expect(evidence.accessRank).toBe(
          640
        );
      }
    );

    test(
      "different custom plans without ranks fail closed",
      () => {
        const evidence =
          resolveMockTestRuntimeAccess({
            test: {
              ...PREMIUM_TEST,
              id: "mock-custom",
              planCode:
                "CUSTOM_REQUIRED",
              planType: undefined,
            },
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
                planCode:
                  "CUSTOM_USER",
                planType:
                  "CUSTOM_USER",
                accessRank: undefined,
              }),
            ]),
          });

        expect(evidence.status).toBe(
          "denied"
        );
      }
    );

    test(
      "expired and blocked records are not treated as evidence",
      () => {
        const evidence =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([
              activeRecord({
                id: "blocked",
                scopeType: "plan",
                status: "blocked",
              }),
              activeRecord({
                id: "expired",
                scopeType: "item",
                module: "mockTest",
                itemType: "mockTest",
                itemId:
                  "mock-premium-1",
                accessUntil:
                  "2020-01-01T00:00:00Z",
              }),
            ]),
          });

        expect(evidence.status).toBe(
          "denied"
        );
      }
    );

    test(
      "runtime decision feeds exact ITEM evidence into the action policy",
      () => {
        const decision = decide({
          accessProfile: profile([
            activeRecord({
              scopeType: "item",
              module: "mockTest",
              itemType: "mockTest",
              itemId:
                "mock-premium-1",
              planType: "FREE",
            }),
          ]),
        });

        expect(decision.allowed).toBe(
          true
        );
        expect(decision.exactItem).toBe(
          true
        );
        expect(decision.sourceScope).toBe(
          "item"
        );
      }
    );

    test(
      "direct OPEN and normal OPEN produce the same central decision",
      () => {
        const input = {
          test: PREMIUM_TEST,
          user: USER,
          accessProfile: profile([
            activeRecord({
              scopeType: "plan",
            }),
          ]),
        };

        const normal =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS.OPEN,
            ...input,
          });
        const direct =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS.OPEN,
            ...input,
          });

        expect(direct).toEqual(normal);
      }
    );

    test(
      "scheduled ATTEMPT still requires trusted server time",
      () => {
        const test = {
          ...PREMIUM_TEST,
          examStartDate:
            "2026-07-16",
          examStartTime: "09:00",
          examEndDate:
            "2026-07-16",
          examEndTime: "10:00",
        };
        const client =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS.ATTEMPT,
            test,
            user: USER,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
              }),
            ]),
            now:
              "2026-07-16T09:30:00Z",
            timeSource:
              MOCK_TEST_TIME_SOURCES.CLIENT,
          });
        const server =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS.ATTEMPT,
            test,
            user: USER,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
              }),
            ]),
            now:
              "2026-07-16T09:30:00Z",
            timeSource:
              MOCK_TEST_TIME_SOURCES.SERVER,
          });

        expect(client.reason).toBe(
          MOCK_TEST_REASON_CODES
            .SERVER_TIME_REQUIRED
        );
        expect(server.allowed).toBe(true);
        expect(
          server.canExposeQuestions
        ).toBe(true);
      }
    );

    test(
      "VIEW_RESULT and REVIEW keep ownership and release checks independent",
      () => {
        const result = {
          testId: "mock-premium-1",
          ownerUid: "student-1",
          ownerEmail:
            "student@aspirenestacademy.in",
          status: "submitted",
          submittedAt:
            "2026-07-16T10:00:00Z",
        };
        const view =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS
                .VIEW_RESULT,
            test: PREMIUM_TEST,
            user: USER,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
              }),
            ]),
            result,
          });
        const reviewLocked =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS.REVIEW,
            test: PREMIUM_TEST,
            user: USER,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
              }),
            ]),
            result,
            reviewReleased: false,
          });
        const reviewAllowed =
          buildMockTestRuntimeDecision({
            action:
              MOCK_TEST_ACTIONS.REVIEW,
            test: PREMIUM_TEST,
            user: USER,
            accessProfile: profile([
              activeRecord({
                scopeType: "plan",
              }),
            ]),
            result,
            reviewReleased: true,
          });

        expect(view.allowed).toBe(true);
        expect(
          reviewLocked.reason
        ).toBe(
          MOCK_TEST_REASON_CODES
            .REVIEW_NOT_RELEASED
        );
        expect(
          reviewAllowed.canExposeAnswers
        ).toBe(true);
      }
    );

    test(
      "catalog item is public-safe and retains locked-preview state",
      () => {
        const item =
          buildMockTestCatalogItem({
            test: PREMIUM_TEST,
            user: USER,
            accessProfile: profile([]),
            discoveryMode:
              MOCK_TEST_DISCOVERY_MODES
                .CATALOG,
          });
        const serialized =
          JSON.stringify(item);

        expect(item.accessState).toBe(
          MOCK_TEST_DECISIONS
            .LOCKED_PREVIEW
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
      }
    );

    test(
      "My Access catalog projection hides a non-entitled test",
      () => {
        const item =
          buildMockTestCatalogItem({
            test: PREMIUM_TEST,
            user: USER,
            accessProfile: profile([]),
            discoveryMode:
              MOCK_TEST_DISCOVERY_MODES
                .MY_ACCESS,
          });

        expect(item).toBeNull();
      }
    );

    test(
      "adapter outputs are immutable",
      () => {
        const evidence =
          resolveMockTestRuntimeAccess({
            test: PREMIUM_TEST,
            accessProfile: profile([
              activeRecord({
                scopeType: "bundle",
                module: "mockTest",
                itemType: "mockTest",
                itemIds: [
                  "mock-premium-1",
                ],
              }),
            ]),
          });

        expect(
          Object.isFrozen(evidence)
        ).toBe(true);
        expect(
          Object.isFrozen(
            evidence.itemIds
          )
        ).toBe(true);
      }
    );
  }
);
