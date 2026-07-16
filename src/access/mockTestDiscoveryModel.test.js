import {
  MOCK_TEST_DISCOVERY_MODES,
} from "./mockTestActionPolicy";
import {
  MOCK_TEST_DISCOVERY_STATES,
  buildMockTestDiscoveryModel,
  filterMockTestDiscoveryItems,
} from "./mockTestDiscoveryModel";

const USER = Object.freeze({
  uid: "student-1",
  email:
    "student@aspirenestacademy.in",
});

const TESTS = Object.freeze([
  {
    id: "mock-free",
    section: "mockTest",
    status: "published",
    title: "Free CDP Sample",
    description: "Free practice",
    planType: "FREE",
    subject: "CDP",
    chapter: "Learning",
    updatedAt:
      "2026-07-10T00:00:00Z",
    questions: [
      {
        question:
          "Protected free question",
        answer: "A",
      },
    ],
  },
  {
    id: "mock-premium",
    section: "mockTest",
    status: "published",
    title: "Premium CDP Mega Mock",
    description: "Premium practice",
    planType: "PREMIUM",
    subject: "CDP",
    chapter: "Assessment",
    updatedAt:
      "2026-07-12T00:00:00Z",
    questions: [
      {
        question:
          "Protected premium question",
        answer: "B",
        explanation:
          "Protected explanation",
      },
    ],
    fileUrl:
      "https://assets.invalid/mock.pdf",
  },
  {
    id: "mock-custom",
    section: "mockTest",
    status: "published",
    title: "Crash 45 Final Mock",
    description: "Custom plan test",
    planCode: "CTET_CRASH_45",
    planTitle: "CTET Crash 45",
    accessRank: 150,
    subject: "Language",
    chapter: "Final Revision",
    updatedAt:
      "2026-07-14T00:00:00Z",
  },
  {
    id: "mock-draft",
    section: "mockTest",
    status: "draft",
    title: "Draft Mock",
    planType: "FREE",
  },
  {
    id: "note-1",
    section: "notes",
    status: "published",
    title: "Not a Mock Test",
  },
]);

const activeRecord = (
  overrides = {}
) => ({
  id: "access-1",
  status: "active",
  planType: "PREMIUM",
  scopeType: "plan",
  ...overrides,
});

const accessProfile = (
  records = [],
  overrides = {}
) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isBlocked: false,
  accessRecords: records,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
  ...overrides,
});

const build = (overrides = {}) =>
  buildMockTestDiscoveryModel({
    universalContent: TESTS,
    user: USER,
    accessProfile: accessProfile([]),
    now:
      "2026-07-16T09:30:00Z",
    ...overrides,
  });

describe(
  "AspireNest Mock Test discovery model",
  () => {
    test(
      "catalog includes free tests and safe paid locked previews",
      () => {
        const model = build();

        expect(model.state).toBe(
          MOCK_TEST_DISCOVERY_STATES
            .READY
        );
        expect(model.totalCount).toBe(3);
        expect(model.unlockedCount).toBe(
          1
        );
        expect(model.lockedCount).toBe(2);

        const premium =
          model.items.find(
            (item) =>
              item.id ===
              "mock-premium"
          );

        expect(premium.isLocked).toBe(
          true
        );
        expect(premium.action.kind).toBe(
          "unlock"
        );
        expect(premium.action.route).toBe(
          "/ctet-tet/pricing"
        );
      }
    );

    test(
      "public discovery output excludes questions, answers, explanations and asset URLs",
      () => {
        const serialized =
          JSON.stringify(build());

        expect(serialized).not.toContain(
          "Protected free question"
        );
        expect(serialized).not.toContain(
          "Protected premium question"
        );
        expect(serialized).not.toContain(
          "Protected explanation"
        );
        expect(serialized).not.toContain(
          "assets.invalid"
        );
        expect(serialized).not.toContain(
          '"questions"'
        );
        expect(serialized).not.toContain(
          '"answer"'
        );
      }
    );

    test(
      "exact ITEM access surfaces only its exact paid test in My Access",
      () => {
        const model = build({
          discoveryMode:
            MOCK_TEST_DISCOVERY_MODES
              .MY_ACCESS,
          accessProfile: accessProfile([
            activeRecord({
              scopeType: "item",
              module: "mockTest",
              itemType: "mockTest",
              itemId:
                "mock-premium",
              planType: "FREE",
            }),
          ]),
        });

        expect(
          model.items.map(
            (item) => item.id
          )
        ).toEqual([
          "mock-premium",
          "mock-free",
        ]);
        expect(
          model.exactItemCount
        ).toBe(1);
        expect(
          model.items[0].isExactItem
        ).toBe(true);
        expect(
          model.items[0].directRoute
        ).toBe(
          "/ctet-tet/mock-tests/start/mock-premium"
        );
      }
    );

    test(
      "ITEM access never unlocks a sibling test",
      () => {
        const model = build({
          discoveryMode:
            MOCK_TEST_DISCOVERY_MODES
              .MY_ACCESS,
          accessProfile: accessProfile([
            activeRecord({
              scopeType: "item",
              module: "mockTest",
              itemType: "mockTest",
              itemId:
                "mock-premium",
              planType: "FREE",
            }),
          ]),
        });

        expect(
          model.items.some(
            (item) =>
              item.id ===
              "mock-custom"
          )
        ).toBe(false);
      }
    );

    test(
      "dynamic plans are discovered from content instead of a fixed enum",
      () => {
        const model = build();

        expect(
          model.plans.map(
            (plan) => plan.planCode
          )
        ).toContain(
          "CTET_CRASH_45"
        );
        expect(
          model.plans.find(
            (plan) =>
              plan.planCode ===
              "CTET_CRASH_45"
          ).title
        ).toBe("CTET Crash 45");
      }
    );

    test(
      "plan shelves remain commercial facets rather than compulsory item routes",
      () => {
        const model = build();
        const custom =
          model.items.find(
            (item) =>
              item.id ===
              "mock-custom"
          );

        expect(custom.directRoute).toBe(
          "/ctet-tet/mock-tests/start/mock-custom"
        );
        expect(custom.directRoute).not.toContain(
          "/plan/"
        );
      }
    );

    test(
      "entitled tests sort ahead of locked previews",
      () => {
        const model = build({
          accessProfile: accessProfile([
            activeRecord({
              scopeType: "plan",
              planType: "PREMIUM",
              accessRank: 300,
            }),
          ]),
        });

        expect(
          model.items
            .slice(0, 2)
            .every(
              (item) =>
                item.isLocked === false
            )
        ).toBe(true);
      }
    );

    test(
      "custom plan accessRank is retained in discovery facets",
      () => {
        const model = build({
          planCatalog: [
            {
              planCode:
                "CTET_CRASH_45",
              title: "Crash Batch 45",
              accessRank: 150,
            },
          ],
        });
        const customPlan =
          model.plans.find(
            (plan) =>
              plan.planCode ===
              "CTET_CRASH_45"
          );

        expect(customPlan.title).toBe(
          "Crash Batch 45"
        );
        expect(customPlan.planRank).toBe(
          150
        );
      }
    );

    test(
      "loading, error and blocked access states fail closed",
      () => {
        const loading = build({
          accessProfile: accessProfile([], {
            loading: true,
            shellState: {
              mode: "loading",
              isFailClosed: true,
            },
          }),
        });
        const error = build({
          accessProfile: accessProfile([], {
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
        const blocked = build({
          accessProfile: accessProfile([], {
            isBlocked: true,
            shellState: {
              mode: "blocked",
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
        expect(blocked.state).toBe(
          "blocked"
        );
        expect(
          blocked.recoveryRoute
        ).toBe("/my-access");
        expect(loading.items).toEqual(
          []
        );
      }
    );

    test(
      "explicit blocked state takes precedence over the generic fail-closed marker",
      () => {
        const blocked = build({
          accessProfile: accessProfile([], {
            isBlocked: true,
            shellState: {
              mode: "blocked",
              isFailClosed: true,
            },
          }),
        });

        expect(blocked.state).toBe(
          MOCK_TEST_DISCOVERY_STATES
            .BLOCKED
        );
        expect(
          blocked.recoveryRoute
        ).toBe("/my-access");
        expect(blocked.items).toEqual(
          []
        );
      }
    );

    test(
      "drafts and non-mock content never enter discovery",
      () => {
        const serialized =
          JSON.stringify(build());

        expect(serialized).not.toContain(
          "Draft Mock"
        );
        expect(serialized).not.toContain(
          "Not a Mock Test"
        );
      }
    );

    test(
      "subject and chapter facets are derived from visible items",
      () => {
        const model = build();

        expect(
          model.subjects.map(
            (subject) => subject.title
          )
        ).toEqual([
          "CDP",
          "Language",
        ]);
        expect(
          model.chapters.map(
            (chapter) => chapter.title
          )
        ).toEqual([
          "Assessment",
          "Final Revision",
          "Learning",
        ]);
      }
    );

    test(
      "filters work without requiring a plan hierarchy",
      () => {
        const model = build();
        const items =
          filterMockTestDiscoveryItems({
            model,
            subject: "CDP",
            query: "premium",
          });

        expect(
          items.map((item) => item.id)
        ).toEqual(["mock-premium"]);
      }
    );

    test(
      "plan, subject and chapter filters can be combined",
      () => {
        const model = build();
        const items =
          filterMockTestDiscoveryItems({
            model,
            planCode: "FREE",
            subject: "CDP",
            chapter: "Learning",
          });

        expect(
          items.map((item) => item.id)
        ).toEqual(["mock-free"]);
      }
    );

    test(
      "empty My Access state is explicit",
      () => {
        const model = build({
          universalContent: [
            {
              ...TESTS[1],
              id: "paid-only",
            },
          ],
          discoveryMode:
            MOCK_TEST_DISCOVERY_MODES
              .MY_ACCESS,
        });

        expect(model.state).toBe(
          MOCK_TEST_DISCOVERY_STATES
            .EMPTY
        );
        expect(model.totalCount).toBe(0);
        expect(model.message).toContain(
          "No entitled mock tests"
        );
      }
    );

    test(
      "model and nested outputs are immutable",
      () => {
        const model = build();

        expect(
          Object.isFrozen(model)
        ).toBe(true);
        expect(
          Object.isFrozen(model.items)
        ).toBe(true);
        expect(
          Object.isFrozen(model.plans)
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.items[0]
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.items[0].action
          )
        ).toBe(true);
      }
    );
  }
);
