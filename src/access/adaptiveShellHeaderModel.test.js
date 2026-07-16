import {
  buildAdaptiveShellHeaderModel,
} from "./adaptiveShellHeaderModel";

describe(
  "AspireNest adaptive shell header model",
  () => {
    test(
      "guest presentation remains login-safe",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: null,
            currentPath: "/",
          });

        expect(model.mode).toBe(
          "guest"
        );
        expect(model.roleLabel).toBe(
          "Login"
        );
        expect(model.accessLabel).toBe(
          "Start Learning"
        );
        expect(model.accountBadge).toBe(
          "IN"
        );
        expect(model.accountItems).toEqual(
          []
        );
        expect(
          model.primaryItems.some(
            (item) =>
              item.id === "search"
          )
        ).toBe(false);
        expect(
          model.primaryItems.some(
            (item) =>
              item.id === "home"
          )
        ).toBe(false);
        expect(model.brandRoute).toBe(
          "/ctet-tet"
        );
      }
    );

    test(
      "dynamic custom plan label is preserved",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
            shellNavigation: {
              mode: "active",
              roleLabel: "Student",
              accessLabel:
                "Aspire Elite 2026",
              isFailClosed: false,
              accountItems: [
                {
                  id: "profile",
                  label: "Profile",
                  route: "/my-profile",
                },
                {
                  id: "my-access",
                  label: "My Access",
                  route: "/my-access",
                },
                {
                  id: "dashboard",
                  label:
                    "Student Dashboard",
                  route:
                    "/student-dashboard",
                },
              ],
            },
          });

        expect(model.accessLabel).toBe(
          "Aspire Elite 2026"
        );
        expect(
          model.accountItems.map(
            (item) => item.id
          )
        ).toEqual([
          "profile",
          "my-access",
          "dashboard",
        ]);
      }
    );

    test(
      "authenticated Home is the canonical root destination",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
            currentPath: "/",
          });

        expect(model.brandRoute).toBe("/");
        expect(
          model.primaryItems.find(
            (item) =>
              item.id === "home"
          )
        ).toEqual(
          expect.objectContaining({
            route: "/",
            isActive: true,
          })
        );
      }
    );

    test(
      "authenticated Search is exposed as a primary destination while My Access remains in the account menu",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
            currentPath:
              "/search",
            shellNavigation: {
              accountItems: [
                {
                  id: "profile",
                  label: "Profile",
                  route: "/my-profile",
                },
                {
                  id: "my-access",
                  label: "My Access",
                  route: "/my-access",
                },
                {
                  id: "search",
                  label: "Search",
                  route: "/search",
                },
                {
                  id: "dashboard",
                  label:
                    "Student Dashboard",
                  route:
                    "/student-dashboard",
                },
              ],
            },
          });

        expect(
          model.primaryItems.find(
            (item) =>
              item.id === "search"
          )
        ).toEqual(
          expect.objectContaining({
            route: "/search",
            isActive: true,
          })
        );
        expect(
          model.accountItems.map(
            (item) => item.route
          )
        ).toEqual([
          "/my-profile",
          "/my-access",
          "/student-dashboard",
        ]);
      }
    );

    test(
      "admin presentation uses admin destination",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              email:
                "aspirenestplatform@gmail.com",
            },
            isAdminUser: true,
            shellNavigation: {
              mode: "admin",
              roleLabel: "Admin",
              accessLabel: "Admin Access",
              accountItems: [
                {
                  id: "profile",
                  label: "Profile",
                  route: "/my-profile",
                },
                {
                  id: "admin",
                  label: "Admin",
                  route: "/admin",
                },
              ],
            },
          });

        expect(model.accountBadge).toBe(
          "AN"
        );
        expect(
          model.accountItems.map(
            (item) => item.id
          )
        ).toEqual([
          "profile",
          "admin",
        ]);
      }
    );

    test(
      "fail-closed status is preserved in the header presentation",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
            shellNavigation: {
              mode: "error",
              roleLabel: "Student",
              accessLabel:
                "Access unavailable",
              isFailClosed: true,
            },
          });

        expect(model.mode).toBe(
          "error"
        );
        expect(
          model.isFailClosed
        ).toBe(true);
        expect(model.accessLabel).toBe(
          "Access unavailable"
        );
      }
    );

    test(
      "nested learning route marks the correct primary destination active",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
            currentPath:
              "/ctet-tet/notes/plan/basic",
          });

        expect(
          model.primaryItems.find(
            (item) =>
              item.id === "notes"
          )?.isActive
        ).toBe(true);
      }
    );

    test(
      "unsafe account destinations fall back to existing safe routes",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
            shellNavigation: {
              accountItems: [
                {
                  id: "profile",
                  label: "Profile",
                  route:
                    "https://example.com",
                },
              ],
            },
          });

        expect(
          model.accountItems.map(
            (item) => item.route
          )
        ).toEqual([
          "/my-profile",
          "/student-dashboard",
        ]);
      }
    );

    test(
      "header presentation is immutable",
      () => {
        const model =
          buildAdaptiveShellHeaderModel({
            user: {
              uid: "student-1",
            },
          });

        expect(
          Object.isFrozen(model)
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.primaryItems
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.accountItems
          )
        ).toBe(true);
      }
    );
  }
);
