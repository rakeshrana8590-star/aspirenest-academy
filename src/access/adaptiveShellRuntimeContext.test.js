import {
  buildAdaptiveShellRuntimeContext,
} from "./adaptiveShellRuntimeContext";

describe(
  "AspireNest adaptive shell runtime context",
  () => {
    test(
      "guest mode stays disabled and cannot inherit admin state",
      () => {
        const context =
          buildAdaptiveShellRuntimeContext({
            user: null,
            isAdminUser: true,
            currentPath: "/",
          });

        expect(context).toEqual({
          enabled: false,
          isAdminUser: false,
          currentPath: "/",
          resumeRoute: "/ctet-tet",
        });
      }
    );

    test(
      "authenticated student receives route-aware runtime context",
      () => {
        const context =
          buildAdaptiveShellRuntimeContext({
            user: {
              uid: "student-1",
              email: "student@example.com",
            },
            currentPath:
              "/ctet-tet/mock-tests/history",
            resumeRoute:
              "/ctet-tet/mock-tests/history",
          });

        expect(context.enabled).toBe(true);
        expect(context.isAdminUser).toBe(false);
        expect(context.currentPath).toBe(
          "/ctet-tet/mock-tests/history"
        );
        expect(context.resumeRoute).toBe(
          "/ctet-tet/mock-tests/history"
        );
      }
    );

    test(
      "authenticated admin state is explicit",
      () => {
        const context =
          buildAdaptiveShellRuntimeContext({
            user: {
              email:
                "aspirenestplatform@gmail.com",
            },
            isAdminUser: true,
            currentPath: "/admin",
          });

        expect(context.enabled).toBe(true);
        expect(context.isAdminUser).toBe(true);
      }
    );

    test.each([
      ["https://example.com", "/"],
      ["//example.com", "/"],
      ["", "/"],
    ])(
      "unsafe current path %s fails closed",
      (currentPath, expectedPath) => {
        const context =
          buildAdaptiveShellRuntimeContext({
            user: {
              uid: "student-1",
            },
            currentPath,
          });

        expect(context.currentPath).toBe(
          expectedPath
        );
      }
    );

    test.each([
      ["https://example.com", "/ctet-tet"],
      ["//example.com", "/ctet-tet"],
      ["", "/ctet-tet"],
    ])(
      "unsafe resume route %s fails closed",
      (resumeRoute, expectedRoute) => {
        const context =
          buildAdaptiveShellRuntimeContext({
            user: {
              uid: "student-1",
            },
            resumeRoute,
          });

        expect(context.resumeRoute).toBe(
          expectedRoute
        );
      }
    );

    test(
      "runtime context is immutable",
      () => {
        const context =
          buildAdaptiveShellRuntimeContext({
            user: {
              uid: "student-1",
            },
          });

        expect(Object.isFrozen(context)).toBe(
          true
        );
      }
    );
  }
);
