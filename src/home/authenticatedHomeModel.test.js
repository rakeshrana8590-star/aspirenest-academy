import {
  AUTHENTICATED_HOME_MODES,
  buildAuthenticatedHomeModel,
} from "./authenticatedHomeModel";

const ACTIVE_SHELL = Object.freeze({
  mode: "active",
  isAuthenticated: true,
  isAdminUser: false,
  isFailClosed: false,
  accountRoleLabel: "Student",
  accessLabel: "Premium Access",
});

describe(
  "AspireNest authenticated home model",
  () => {
    test(
      "guest state exposes login without protected personalization",
      () => {
        const model =
          buildAuthenticatedHomeModel();

        expect(model.mode).toBe(
          AUTHENTICATED_HOME_MODES.GUEST
        );
        expect(
          model.canShowPersonalization
        ).toBe(false);
        expect(
          model.continueCard.route
        ).toBe("/login");
        expect(model.primaryPlan).toBeNull();
      }
    );

    test.each([
      ["loading", "Checking access"],
      ["error", "Access unavailable"],
    ])(
      "%s mode fails closed and hides personalized activity",
      (mode, expectedLabel) => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
              email:
                "student@aspirenestacademy.in",
            },
            shellState: {
              ...ACTIVE_SHELL,
              mode,
              isFailClosed: true,
            },
            myAccess: {
              canShowAccessDetails: true,
              primaryPlan: {
                planCode:
                  "ASPIRE_ELITE_2026",
                label:
                  "Aspire Elite 2026",
              },
              summary: {
                active: 8,
                module: 4,
              },
            },
            mockResults: [
              {
                id: "mock-1",
                testTitle:
                  "Hidden paid mock",
                percentage: 88,
                completedAt:
                  "2026-07-16T10:00:00Z",
              },
            ],
          });

        expect(model.isFailClosed).toBe(
          true
        );
        expect(
          model.canShowPersonalization
        ).toBe(false);
        expect(
          model.continueCard.disabled
        ).toBe(true);
        expect(
          model.continueCard.label
        ).toBe(expectedLabel);
        expect(model.primaryPlan).toBeNull();
        expect(model.summary.mockAttempts).toBe(
          0
        );
      }
    );

    test.each([
      "blocked",
      "expired",
    ])(
      "%s mode routes Continue to My Access recovery",
      (mode) => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              ...ACTIVE_SHELL,
              mode,
              accessLabel:
                "Access review required",
            },
          });

        expect(
          model.continueCard.route
        ).toBe("/my-access");
        expect(
          model.continueCard.label
        ).toBe("Review My Access");
        expect(model.recoveryAction.route).toBe(
          "/my-access"
        );
      }
    );

    test(
      "selects the newest safe cross-module activity over an older mock",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
            mockResults: [
              {
                id: "mock-old",
                testTitle:
                  "Older Mock Test",
                percentage: 72,
                completedAt:
                  "2026-07-14T09:00:00Z",
              },
            ],
            recentActivity: [
              {
                id: "note-latest",
                title:
                  "Learning Theories Notes",
                description:
                  "Continue Chapter 2",
                route:
                  "/ctet-tet/notes/plan/BASIC/cdp/learning-theories",
                module: "notes",
                status: "in-progress",
                progressPercent: 45,
                updatedAt:
                  "2026-07-16T09:00:00Z",
              },
            ],
          });

        expect(
          model.continueCard.label
        ).toBe("Learning Theories Notes");
        expect(
          model.continueCard.route
        ).toBe(
          "/ctet-tet/notes/plan/BASIC/cdp/learning-theories"
        );
        expect(
          model.continueCard.progressPercent
        ).toBe(45);
      }
    );

    test(
      "uses latest mock history when no newer cross-module activity exists",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
            mockResults: [
              {
                id: "mock-old",
                testTitle: "Older Mock",
                percentage: 48,
                completedAt:
                  "2026-07-14T09:00:00Z",
              },
              {
                id: "mock-latest",
                testTitle:
                  "Latest CDP Mock",
                percentage: 82.4,
                completedAt:
                  "2026-07-16T09:00:00Z",
              },
            ],
          });

        expect(
          model.continueCard.label
        ).toBe("Latest CDP Mock");
        expect(
          model.continueCard.route
        ).toBe(
          "/ctet-tet/mock-tests/history"
        );
        expect(
          model.continueCard.progressPercent
        ).toBe(82);
        expect(model.summary.mockAttempts).toBe(
          2
        );
      }
    );

    test(
      "unsafe or invalid activity routes are ignored",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
            recentActivity: [
              {
                id: "unsafe",
                title: "Unsafe activity",
                route:
                  "https://example.com/secret",
                status: "in-progress",
                updatedAt:
                  "2026-07-16T09:00:00Z",
              },
              {
                id: "draft",
                title: "Draft activity",
                route: "/ctet-tet/notes",
                status: "draft",
                updatedAt:
                  "2026-07-16T10:00:00Z",
              },
            ],
          });

        expect(
          model.continueCard.route
        ).toBe("/ctet-tet");
        expect(
          model.continueCard.source
        ).toBe("fallback");
      }
    );

    test(
      "preserves a custom dynamic plan identity",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
            myAccess: {
              canShowAccessDetails: true,
              primaryPlan: {
                planCode:
                  "ASPIRE_ELITE_2026",
                label:
                  "Aspire Elite 2026",
                accessRank: 640,
                productId:
                  "product-elite",
                noExpiry: true,
                isCustomPlan: true,
              },
              summary: {
                active: 4,
                module: 2,
              },
            },
          });

        expect(
          model.primaryPlan.planCode
        ).toBe("ASPIRE_ELITE_2026");
        expect(
          model.primaryPlan.label
        ).toBe("Aspire Elite 2026");
        expect(
          model.primaryPlan.isCustomPlan
        ).toBe(true);
        expect(
          model.summary.activeAccessRecords
        ).toBe(4);
      }
    );

    test(
      "counts only published content and published roadmaps",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
            contentItems: [
              {
                id: "published-note",
                title: "Published Note",
                section: "notes",
                status: "published",
                planType: "FREE",
              },
              {
                id: "draft-note",
                title: "Draft Note",
                section: "notes",
                status: "draft",
                planType: "FREE",
              },
            ],
            roadmaps: [
              {
                id: "published-roadmap",
                title:
                  "Published Roadmap",
                status: "active",
                planCode: "FREE",
              },
              {
                id: "draft-roadmap",
                title: "Draft Roadmap",
                status: "draft",
              },
            ],
          });

        expect(
          model.summary.publishedLearningItems
        ).toBe(2);
        expect(
          model.categoryCounts.notes
        ).toBe(2);
        expect(
          model.categoryCounts.roadmaps
        ).toBe(2);
      }
    );

    test(
      "does not serialize raw file, PDF, or video URLs",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
            contentItems: [
              {
                id: "protected-note",
                title: "Protected Note",
                section: "notes",
                status: "published",
                planType: "PREMIUM",
                fileUrl:
                  "https://example.com/file.pdf",
                pdfUrl:
                  "https://example.com/secret.pdf",
                videoUrl:
                  "https://example.com/video",
              },
            ],
          });
        const serialized =
          JSON.stringify(model);

        expect(serialized).not.toContain(
          "example.com"
        );
        expect(serialized).not.toContain(
          "secret.pdf"
        );
      }
    );

    test(
      "admin receives an admin workspace destination while students do not",
      () => {
        const admin =
          buildAuthenticatedHomeModel({
            user: {
              uid: "admin-1",
            },
            shellState: {
              ...ACTIVE_SHELL,
              mode: "admin",
              isAdminUser: true,
              accountRoleLabel: "Admin",
            },
          });
        const student =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
          });

        const adminWorkspace =
          admin.sections.find(
            (section) =>
              section.id === "workspace"
          );
        const studentWorkspace =
          student.sections.find(
            (section) =>
              section.id === "workspace"
          );

        expect(
          adminWorkspace.items.some(
            (item) => item.route === "/admin"
          )
        ).toBe(true);
        expect(
          studentWorkspace.items.some(
            (item) => item.route === "/admin"
          )
        ).toBe(false);
      }
    );

    test(
      "student workspace surfaces mentor assignments without treating them as access",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
          });
        const workspace = model.sections.find(
          (section) => section.id === "workspace"
        );
        const assignments = workspace.items.find(
          (item) => item.route === "/assignments"
        );

        expect(assignments).toBeDefined();
        expect(assignments.label).toBe("Assignments");
        expect(assignments.description).toContain("without changing your access");
      }
    );

    test(
      "all exposed routes stay internal",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
          });

        const routes = [
          model.continueCard.route,
          ...model.sections.flatMap(
            (section) =>
              section.items.map(
                (item) => item.route
              )
          ),
        ].filter(Boolean);

        expect(
          routes.every(
            (route) =>
              route.startsWith("/") &&
              !route.startsWith("//")
          )
        ).toBe(true);
      }
    );

    test(
      "model output is immutable",
      () => {
        const model =
          buildAuthenticatedHomeModel({
            user: {
              uid: "student-1",
            },
            shellState: ACTIVE_SHELL,
          });

        expect(Object.isFrozen(model)).toBe(
          true
        );
        expect(
          Object.isFrozen(model.summary)
        ).toBe(true);
        expect(
          Object.isFrozen(model.sections)
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.sections[0].items
          )
        ).toBe(true);
      }
    );
  }
);
