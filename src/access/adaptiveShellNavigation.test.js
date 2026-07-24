import {
  ADAPTIVE_SHELL_DESTINATIONS,
  buildAdaptiveShellNavigation,
  normalizeAdaptiveShellRoute,
} from "./adaptiveShellNavigation";
import {
  ADAPTIVE_SHELL_MODES,
} from "./adaptiveShellModel";

const buildShellState = (
  overrides = {}
) => ({
  mode: ADAPTIVE_SHELL_MODES.ACTIVE,
  isAuthenticated: true,
  isAdminUser: false,
  isFailClosed: false,
  canUseProtectedNavigation: true,
  accountRoleLabel: "Student",
  accessLabel: "Premium Batch",
  activePlan: {
    planCode: "PREMIUM",
    label: "Premium Batch",
    accessRank: 30,
    productId: "premium-2026",
  },
  scopeSummary: {
    total: 1,
    plan: 1,
    module: 0,
    item: 0,
    bundle: 0,
  },
  ...overrides,
});

describe(
  "AspireNest adaptive shell navigation contract",
  () => {
    test(
      "guest receives only public destinations",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: {
              mode:
                ADAPTIVE_SHELL_MODES.GUEST,
              isAuthenticated: false,
              accountRoleLabel: "Login",
              accessLabel: "Start Learning",
            },
          });

        expect(
          navigation.primaryItems.map(
            (item) => item.id
          )
        ).toEqual([
          "home",
          "learning-hub",
          "pricing",
        ]);
        expect(
          navigation.accountItems.map(
            (item) => item.id
          )
        ).toEqual(["login"]);
        expect(
          navigation.primaryItems.some(
            (item) =>
              item.id === "my-access" ||
              item.id === "search"
          )
        ).toBe(false);
      }
    );

    test(
      "active learner receives canonical root navigation",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState(),
            resumeRoute:
              "/ctet-tet/notes/foundation",
          });

        expect(
          navigation.primaryItems.map(
            (item) => item.id
          )
        ).toEqual([
          "home",
          "continue",
          "my-access",
          "search",
        ]);
        expect(
          navigation.primaryItems[1].route
        ).toBe(
          "/ctet-tet/notes/foundation"
        );
        expect(
          navigation.canUseProtectedNavigation
        ).toBe(true);
      }
    );

    test(
      "custom plan identity remains available to the shell",
      () => {
        const customPlan = {
          planCode: "MENTOR_PLUS_2026",
          label: "Mentor Plus 2026",
          accessRank: 48,
          productId: "mentor-plus-2026",
        };
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState({
              accessLabel:
                "Mentor Plus 2026",
              activePlan: customPlan,
            }),
          });

        expect(navigation.activePlan).toBe(
          customPlan
        );
        expect(
          navigation.activePlan.planCode
        ).toBe("MENTOR_PLUS_2026");
        expect(navigation.accessLabel).toBe(
          "Mentor Plus 2026"
        );
      }
    );

    test(
      "partial access keeps navigation available",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState({
              mode:
                ADAPTIVE_SHELL_MODES.PARTIAL,
              accessLabel:
                "Partial Access",
              activePlan: null,
              scopeSummary: {
                total: 3,
                plan: 0,
                module: 2,
                item: 1,
                bundle: 0,
              },
            }),
          });

        expect(
          navigation.canUseProtectedNavigation
        ).toBe(true);
        expect(
          navigation.primaryItems.find(
            (item) =>
              item.id === "continue"
          ).disabled
        ).toBe(false);
      }
    );

    test.each([
      [
        ADAPTIVE_SHELL_MODES.LOADING,
        "Checking Access",
      ],
      [
        ADAPTIVE_SHELL_MODES.ERROR,
        "Access Unavailable",
      ],
    ])(
      "%s disables Continue and fails closed",
      (mode, label) => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState({
              mode,
              isFailClosed: true,
              canUseProtectedNavigation:
                false,
              accessLabel: label,
            }),
            resumeRoute:
              "/ctet-tet/videos",
          });
        const continueItem =
          navigation.primaryItems.find(
            (item) =>
              item.id === "continue"
          );

        expect(navigation.isFailClosed).toBe(
          true
        );
        expect(
          navigation.canUseProtectedNavigation
        ).toBe(false);
        expect(continueItem.disabled).toBe(
          true
        );
        expect(continueItem.route).toBeNull();
        expect(continueItem.intent).toBe(
          "status"
        );
      }
    );

    test.each([
      ADAPTIVE_SHELL_MODES.BLOCKED,
      ADAPTIVE_SHELL_MODES.EXPIRED,
    ])(
      "%s routes Continue to access recovery",
      (mode) => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState({
              mode,
              isFailClosed: true,
              canUseProtectedNavigation:
                false,
            }),
            resumeRoute:
              "/ctet-tet/mock-tests",
          });
        const continueItem =
          navigation.primaryItems.find(
            (item) =>
              item.id === "continue"
          );

        expect(continueItem.label).toBe(
          "Review Access"
        );
        expect(continueItem.route).toBe(
          "/my-access"
        );
        expect(continueItem.intent).toBe(
          "recovery"
        );
      }
    );

    test(
      "free learner can continue to the learning hub",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState({
              mode:
                ADAPTIVE_SHELL_MODES.FREE,
              canUseProtectedNavigation:
                false,
              accessLabel: "Free Access",
              activePlan: null,
            }),
          });
        const continueItem =
          navigation.primaryItems.find(
            (item) =>
              item.id === "continue"
          );

        expect(continueItem.disabled).toBe(
          false
        );
        expect(continueItem.route).toBe(
          "/ctet-tet"
        );
      }
    );

    test(
      "admin receives an explicit admin destination",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState({
              mode:
                ADAPTIVE_SHELL_MODES.ADMIN,
              isAdminUser: true,
              accountRoleLabel: "Admin",
              accessLabel: "Admin Access",
            }),
          });

        expect(
          navigation.primaryItems.some(
            (item) =>
              item.id === "admin" &&
              item.route === "/admin"
          )
        ).toBe(true);
        expect(
          navigation.accountItems.some(
            (item) =>
              item.id === "admin"
          )
        ).toBe(true);
      }
    );

    test.each([
      "https://evil.example/path",
      "//evil.example/path",
      "javascript:alert(1)",
      "\u0000/ctet-tet",
      "",
      null,
    ])(
      "unsafe resume target %p falls back internally",
      (resumeRoute) => {
        expect(
          normalizeAdaptiveShellRoute(
            resumeRoute
          )
        ).toBe("/ctet-tet");
      }
    );

    test(
      "safe internal resume route keeps query and hash",
      () => {
        expect(
          normalizeAdaptiveShellRoute(
            "/ctet-tet/notes?plan=basic#chapter-1"
          )
        ).toBe(
          "/ctet-tet/notes?plan=basic#chapter-1"
        );
      }
    );

    test(
      "active item uses exact root and nested route matching",
      () => {
        const rootNavigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState(),
            currentPath: "/",
          });
        const nestedNavigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState(),
            currentPath:
              "/my-access/history",
          });

        expect(
          rootNavigation.primaryItems.find(
            (item) => item.id === "home"
          ).isActive
        ).toBe(true);
        expect(
          nestedNavigation.primaryItems.find(
            (item) =>
              item.id === "my-access"
          ).isActive
        ).toBe(true);
      }
    );

    test(
      "authenticated unknown mode defaults to fail closed",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: {
              isAuthenticated: true,
              mode: "unexpected-mode",
            },
          });
        const continueItem =
          navigation.primaryItems.find(
            (item) =>
              item.id === "continue"
          );

        expect(navigation.mode).toBe(
          ADAPTIVE_SHELL_MODES.ERROR
        );
        expect(navigation.isFailClosed).toBe(
          true
        );
        expect(continueItem.disabled).toBe(
          true
        );
      }
    );

    test(
      "navigation outputs are immutable",
      () => {
        const navigation =
          buildAdaptiveShellNavigation({
            shellState: buildShellState(),
          });

        expect(
          Object.isFrozen(navigation)
        ).toBe(true);
        expect(
          Object.isFrozen(
            navigation.primaryItems
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            navigation.primaryItems[0]
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            ADAPTIVE_SHELL_DESTINATIONS
          )
        ).toBe(true);
      }
    );
  }
);

// LD-R2-G2: LEARNING DRIVE TWO-LEVEL NAVIGATION TESTS
describe("AspireNest Learning Drive two-level navigation contract", () => {
  const {
    ADAPTIVE_DRIVE_PARENT_AREAS,
    ADAPTIVE_DRIVE_ROLES,
    ADAPTIVE_DRIVE_VIEWPORTS,
    buildAdaptiveDriveNavigation,
  } = require("./adaptiveShellNavigation");

  test("student navigation preserves the six approved parent areas", () => {
    expect(
      ADAPTIVE_DRIVE_PARENT_AREAS[ADAPTIVE_DRIVE_ROLES.STUDENT].map(
        (item) => item.id
      )
    ).toEqual(["home", "learning", "mentor", "live", "success", "help"]);
  });

  test("admin navigation uses the same six-area Drive hierarchy", () => {
    expect(
      ADAPTIVE_DRIVE_PARENT_AREAS[ADAPTIVE_DRIVE_ROLES.ADMIN].map(
        (item) => item.id
      )
    ).toEqual(["home", "content", "access", "people", "commerce", "system"]);
  });

  test("active child is scoped to the active parent and invalid child fails to its first safe child", () => {
    const navigation = buildAdaptiveDriveNavigation({
      role: ADAPTIVE_DRIVE_ROLES.STUDENT,
      activeParentId: "learning",
      activeChildId: "not-a-learning-child",
    });

    expect(navigation.activeParentId).toBe("learning");
    expect(navigation.activeChildId).toBe("all-learning");
    expect(navigation.contextItems.every((item) => item.parentId === "learning")).toBe(
      true
    );
  });

  test("desktop collapse keeps one contextual rail contract while the main workspace can expand", () => {
    const navigation = buildAdaptiveDriveNavigation({
      role: ADAPTIVE_DRIVE_ROLES.ADMIN,
      activeParentId: "content",
      activeChildId: "notes-intellitext",
      contextRailCollapsed: true,
    });

    expect(navigation.contextRail).toEqual({
      visible: true,
      collapsed: true,
      presentation: "rail",
    });
    expect(navigation.activeChildId).toBe("notes-intellitext");
  });

  test("mobile keeps the six-parent dock and presents contextual children as tabs", () => {
    const navigation = buildAdaptiveDriveNavigation({
      role: ADAPTIVE_DRIVE_ROLES.STUDENT,
      activeParentId: "mentor",
      activeChildId: "assignments",
      viewportMode: ADAPTIVE_DRIVE_VIEWPORTS.MOBILE,
      contextRailCollapsed: true,
    });

    expect(navigation.parentItems).toHaveLength(6);
    expect(navigation.contextRail).toEqual({
      visible: false,
      collapsed: false,
      presentation: "tabs",
    });
    expect(navigation.activeChildId).toBe("assignments");
  });

  test("unknown role fails closed and exposes no private navigation", () => {
    const navigation = buildAdaptiveDriveNavigation({
      role: "spoofed-admin",
      activeParentId: "system",
    });

    expect(navigation.enabled).toBe(false);
    expect(navigation.isFailClosed).toBe(true);
    expect(navigation.parentItems).toEqual([]);
    expect(navigation.contextItems).toEqual([]);
  });

  test("navigation output and nested collections are immutable", () => {
    const navigation = buildAdaptiveDriveNavigation({
      role: ADAPTIVE_DRIVE_ROLES.ADMIN,
      activeParentId: "access",
      activeChildId: "active-grants",
    });

    expect(Object.isFrozen(navigation)).toBe(true);
    expect(Object.isFrozen(navigation.parentItems)).toBe(true);
    expect(Object.isFrozen(navigation.parentItems[0])).toBe(true);
    expect(Object.isFrozen(navigation.contextItems)).toBe(true);
    expect(Object.isFrozen(navigation.contextRail)).toBe(true);
    expect(navigation.authorizationIndependent).toBe(true);
  });
});
