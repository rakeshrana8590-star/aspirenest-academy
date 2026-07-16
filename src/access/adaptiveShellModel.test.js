import {
  ADAPTIVE_SHELL_MODES,
  buildAdaptiveShellState,
  resolveAdaptiveShellPlan,
} from "./adaptiveShellModel";

const activeUntil =
  "2099-01-01T00:00:00.000Z";

const student = {
  uid: "student-1",
  email: "student@example.com",
};

describe(
  "AspireNest adaptive app shell model",
  () => {
    test(
      "guest state exposes no private access",
      () => {
        const state =
          buildAdaptiveShellState();

        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.GUEST
        );
        expect(
          state.canUseProtectedNavigation
        ).toBe(false);
        expect(state.activePlan).toBeNull();
      }
    );

    test(
      "loading and errors fail closed",
      () => {
        const loading =
          buildAdaptiveShellState({
            user: student,
            loading: true,
          });
        const failed =
          buildAdaptiveShellState({
            user: student,
            error: new Error(
              "access unavailable"
            ),
          });

        expect(loading.mode).toBe(
          ADAPTIVE_SHELL_MODES.LOADING
        );
        expect(loading.isFailClosed).toBe(
          true
        );
        expect(
          loading.canUseProtectedNavigation
        ).toBe(false);

        expect(failed.mode).toBe(
          ADAPTIVE_SHELL_MODES.ERROR
        );
        expect(failed.isFailClosed).toBe(
          true
        );
        expect(
          failed.canUseProtectedNavigation
        ).toBe(false);
      }
    );

    test(
      "custom dynamic plan code and rank are preserved",
      () => {
        const state =
          buildAdaptiveShellState({
            user: student,
            accessRecords: [
              {
                id: "plan-elite",
                status: "active",
                scopeType: "plan",
                planCode:
                  "ELITE_PLUS",
                accessRank: 450,
                productId:
                  "plan_elite_plus",
                accessUntil:
                  activeUntil,
              },
            ],
          });

        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.ACTIVE
        );
        expect(
          state.activePlan.planCode
        ).toBe("ELITE_PLUS");
        expect(
          state.activePlan.accessRank
        ).toBe(450);
        expect(
          state.activePlan.productId
        ).toBe("plan_elite_plus");
        expect(
          state.activePlan.label
        ).toBe("Elite Plus");
        expect(
          state.activePlan.isCustomPlan
        ).toBe(true);
      }
    );

    test(
      "higher dynamic access rank wins over later expiry",
      () => {
        const plan =
          resolveAdaptiveShellPlan([
            {
              id: "lower-later",
              status: "active",
              scopeType: "plan",
              planCode: "PLUS",
              accessRank: 150,
              accessUntil:
                "2099-12-31T00:00:00.000Z",
            },
            {
              id: "higher-sooner",
              status: "active",
              scopeType: "plan",
              planCode:
                "PREMIUM_PLUS",
              accessRank: 350,
              accessUntil:
                "2099-01-01T00:00:00.000Z",
            },
          ]);

        expect(plan.id).toBe(
          "higher-sooner"
        );
        expect(plan.accessRank).toBe(
          350
        );
      }
    );

    test(
      "seed aliases resolve to the seed descriptor",
      () => {
        const plan =
          resolveAdaptiveShellPlan([
            {
              id: "pro-plan",
              status: "active",
              scopeType: "plan",
              planType: "PRO",
              accessUntil:
                activeUntil,
            },
          ]);

        expect(plan.planCode).toBe(
          "PREMIUM"
        );
        expect(plan.accessRank).toBe(
          200
        );
        expect(plan.label).toBe(
          "Premium Batch"
        );
        expect(plan.isCustomPlan).toBe(
          false
        );
      }
    );

    test(
      "a custom paid plan without rank fails closed",
      () => {
        const plan =
          resolveAdaptiveShellPlan([
            {
              id: "unsafe-custom",
              status: "active",
              scopeType: "plan",
              planCode:
                "UNRANKED_CUSTOM",
              accessUntil:
                activeUntil,
            },
          ]);
        const state =
          buildAdaptiveShellState({
            user: student,
            accessRecords: [
              {
                id:
                  "unsafe-custom",
                status: "active",
                scopeType: "plan",
                planCode:
                  "UNRANKED_CUSTOM",
                accessUntil:
                  activeUntil,
              },
            ],
          });

        expect(plan).toBeNull();
        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.ERROR
        );
        expect(state.isFailClosed).toBe(
          true
        );
        expect(
          state.canUseProtectedNavigation
        ).toBe(false);
      }
    );

    test(
      "module and item grants create partial access but never a plan",
      () => {
        const state =
          buildAdaptiveShellState({
            user: student,
            accessRecords: [
              {
                id: "notes-module",
                status: "active",
                scopeType: "module",
                module: "notes",
                planType: "PREMIUM",
                accessUntil:
                  activeUntil,
              },
              {
                id: "mock-item",
                status: "active",
                scopeType: "item",
                module: "mockTest",
                itemType: "mockTest",
                itemId: "mock-1",
                planType: "PREMIUM",
                accessUntil:
                  activeUntil,
              },
            ],
          });

        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.PARTIAL
        );
        expect(state.activePlan).toBeNull();
        expect(
          state.scopeSummary.module
        ).toBe(1);
        expect(
          state.scopeSummary.item
        ).toBe(1);
        expect(
          state.canUseProtectedNavigation
        ).toBe(true);
      }
    );

    test(
      "expired plan is exposed as expired and remains fail closed",
      () => {
        const state =
          buildAdaptiveShellState({
            user: student,
            accessRecords: [
              {
                id: "expired-plan",
                status: "active",
                scopeType: "plan",
                planType: "PREMIUM",
                accessUntil:
                  "2000-01-01T00:00:00.000Z",
              },
            ],
          });

        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.EXPIRED
        );
        expect(state.isFailClosed).toBe(
          true
        );
        expect(
          state.canUseProtectedNavigation
        ).toBe(false);
      }
    );

    test(
      "blocked plan takes precedence when no active plan exists",
      () => {
        const state =
          buildAdaptiveShellState({
            user: student,
            accessRecords: [
              {
                id: "blocked-plan",
                status: "blocked",
                scopeType: "plan",
                planType: "PREMIUM",
                accessUntil:
                  activeUntil,
              },
            ],
          });

        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.BLOCKED
        );
        expect(state.isFailClosed).toBe(
          true
        );
      }
    );

    test(
      "admin mode remains explicit and bypass-ready",
      () => {
        const state =
          buildAdaptiveShellState({
            user: student,
            isAdminUser: true,
          });

        expect(state.mode).toBe(
          ADAPTIVE_SHELL_MODES.ADMIN
        );
        expect(state.isAdminUser).toBe(
          true
        );
        expect(
          state.canUseProtectedNavigation
        ).toBe(true);
        expect(state.accessLabel).toBe(
          "Admin Access"
        );
      }
    );

    test(
      "no-expiry plan wins a same-rank tie",
      () => {
        const plan =
          resolveAdaptiveShellPlan([
            {
              id: "dated",
              status: "active",
              scopeType: "plan",
              planCode: "PLUS",
              accessRank: 150,
              accessUntil:
                "2099-12-31T00:00:00.000Z",
            },
            {
              id: "no-expiry",
              status: "active",
              scopeType: "plan",
              planCode: "PLUS",
              accessRank: 150,
              noExpiry: true,
            },
          ]);

        expect(plan.id).toBe(
          "no-expiry"
        );
        expect(plan.noExpiry).toBe(
          true
        );
      }
    );
  }
);
