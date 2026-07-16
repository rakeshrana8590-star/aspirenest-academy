import {
  EXAM_START_ACCESS_STATES,
  buildExamStartAccessModel,
} from "./examStartAccessModel";

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
});

const profile = (
  accessRecords = [],
  overrides = {}
) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isBlocked: false,
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

const build = (overrides = {}) =>
  buildExamStartAccessModel({
    test: PREMIUM_TEST,
    user: USER,
    accessProfile: profile([
      activeRecord({
        scopeType: "plan",
      }),
    ]),
    now:
      "2026-07-16T10:00:00Z",
    ...overrides,
  });

describe(
  "AspireNest Exam Start central access model",
  () => {
    test(
      "allows an entitled learner through the OPEN action",
      () => {
        const model = build();

        expect(model.state).toBe(
          EXAM_START_ACCESS_STATES.READY
        );
        expect(model.isAllowed).toBe(
          true
        );
        expect(model.reason).toBe(
          "allowed"
        );
        expect(model.sourceScope).toBe(
          "plan"
        );
      }
    );

    test(
      "exact ITEM evidence allows only its exact test",
      () => {
        const exact = build({
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

        const sibling = build({
          test: {
            ...PREMIUM_TEST,
            id: "mock-premium-2",
          },
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

        expect(exact.state).toBe(
          "ready"
        );
        expect(exact.exactItem).toBe(
          true
        );
        expect(sibling.state).toBe(
          "locked"
        );
        expect(
          sibling.recoveryRoute
        ).toBe("/ctet-tet/pricing");
      }
    );

    test(
      "direct URL without login fails closed at login recovery",
      () => {
        const model = build({
          user: null,
        });

        expect(model.state).toBe(
          "login_required"
        );
        expect(model.recoveryRoute).toBe(
          "/login"
        );
      }
    );

    test(
      "loading and access errors fail closed",
      () => {
        const loading = build({
          accessProfile: profile([], {
            loading: true,
            shellState: {
              mode: "loading",
              isFailClosed: true,
            },
          }),
        });
        const error = build({
          accessProfile: profile([], {
            error: new Error(
              "Unavailable"
            ),
            isAccessCheckUnavailable:
              true,
            shellState: {
              mode: "error",
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
        expect(loading.isAllowed).toBe(
          false
        );
        expect(error.isAllowed).toBe(
          false
        );
      }
    );

    test(
      "explicit blocked profile takes My Access recovery precedence",
      () => {
        const model = build({
          accessProfile: profile([], {
            isBlocked: true,
            shellState: {
              mode: "blocked",
              isFailClosed: true,
            },
          }),
        });

        expect(model.state).toBe(
          "blocked"
        );
        expect(model.recoveryRoute).toBe(
          "/my-access"
        );
      }
    );

    test(
      "unpublished and invalid schedule tests remain closed",
      () => {
        const unpublished = build({
          test: {
            ...PREMIUM_TEST,
            status: "draft",
          },
        });
        const invalidSchedule = build({
          test: {
            ...PREMIUM_TEST,
            scheduleType: "dateTime",
            examStartDate:
              "not-a-date",
          },
        });

        expect(unpublished.state).toBe(
          "unpublished"
        );
        expect(
          invalidSchedule.state
        ).toBe("invalid_schedule");
      }
    );

    test(
      "dynamic plan ranks remain supported",
      () => {
        const model = build({
          test: {
            ...PREMIUM_TEST,
            planType: undefined,
            planCode:
              "CTET_CRASH_45",
            productId:
              "product-crash",
          },
          accessProfile: profile([
            activeRecord({
              scopeType: "plan",
              planType:
                "ASPIRE_ELITE_2026",
              planCode:
                "ASPIRE_ELITE_2026",
              productId:
                "product-elite",
              accessRank: undefined,
            }),
          ]),
          planCatalog: [
            {
              planCode:
                "CTET_CRASH_45",
              productId:
                "product-crash",
              accessRank: 150,
            },
            {
              planCode:
                "ASPIRE_ELITE_2026",
              productId:
                "product-elite",
              accessRank: 640,
            },
          ],
        });

        expect(model.state).toBe(
          "ready"
        );
        expect(model.sourceScope).toBe(
          "plan"
        );
      }
    );

    test(
      "unknown custom plan without rank fails closed",
      () => {
        const model = build({
          test: {
            ...PREMIUM_TEST,
            planType: undefined,
            planCode:
              "CTET_CRASH_45",
          },
          accessProfile: profile([
            activeRecord({
              scopeType: "plan",
              planType:
                "ASPIRE_ELITE_2026",
              planCode:
                "ASPIRE_ELITE_2026",
              accessRank: undefined,
            }),
          ]),
        });

        expect(model.state).toBe(
          "locked"
        );
      }
    );

    test(
      "model output is immutable",
      () => {
        expect(
          Object.isFrozen(build())
        ).toBe(true);
      }
    );
  }
);
