import {
  LEARNING_DRIVE_NAVIGATION,
  LEARNING_DRIVE_ROLES,
  getLearningDriveDestination,
  resolveLearningDrivePresentation,
} from "./learningDriveRouteMap";

describe("AspireNest V8 cumulative Learning Drive route mapping", () => {
  test("preserves all four Admin-preview experiences", () => {
    expect(Object.keys(LEARNING_DRIVE_NAVIGATION)).toEqual([
      "public",
      "student",
      "mentor",
      "admin",
    ]);
  });

  test("student keeps the six approved parent areas", () => {
    expect(
      LEARNING_DRIVE_NAVIGATION[LEARNING_DRIVE_ROLES.STUDENT].map((item) => item.id)
    ).toEqual(["home", "learning", "mentor", "live", "success", "help"]);
  });

  test("admin keeps V8 six-area hierarchy", () => {
    expect(
      LEARNING_DRIVE_NAVIGATION[LEARNING_DRIVE_ROLES.ADMIN].map((item) => item.id)
    ).toEqual(["home", "content", "access", "people", "commerce", "system"]);
  });

  test("student cannot become admin through a query-string preview", () => {
    const result = resolveLearningDrivePresentation({
      pathname: "/student",
      search: "?adminPreview=admin",
      isAuthenticated: true,
      isAdminUser: false,
    });

    expect(result.role).toBe("student");
    expect(result.previewMode).toBe(false);
  });

  test("admin can preview student, mentor and public without role mutation", () => {
    expect(resolveLearningDrivePresentation({
      pathname: "/admin/preview/student",
      isAuthenticated: true,
      isAdminUser: true,
    })).toMatchObject({ role: "student", previewMode: true });

    expect(resolveLearningDrivePresentation({
      pathname: "/admin/preview/mentor",
      isAuthenticated: true,
      isAdminUser: true,
    })).toMatchObject({ role: "mentor", previewMode: true });

    expect(resolveLearningDrivePresentation({
      pathname: "/admin/preview/public",
      isAuthenticated: true,
      isAdminUser: true,
    })).toMatchObject({ role: "public", previewMode: true });
  });

  test("keeps public root outside the authenticated workspace shell", () => {
    expect(resolveLearningDrivePresentation({
      pathname: "/",
      isAuthenticated: true,
      isAdminUser: true,
    }).enabled).toBe(false);
  });

  test("opens the real Student workspace for Student Mentor and Admin accounts", () => {
    expect(resolveLearningDrivePresentation({
      pathname: "/student",
      isAuthenticated: true,
    })).toMatchObject({ role: "student", previewMode: false });

    expect(resolveLearningDrivePresentation({
      pathname: "/student",
      isAuthenticated: true,
      isMentorUser: true,
    })).toMatchObject({ role: "student", previewMode: false });

    expect(resolveLearningDrivePresentation({
      pathname: "/student",
      isAuthenticated: true,
      isAdminUser: true,
    })).toMatchObject({ role: "student", previewMode: true });
  });

  test("maps real module routes into the student Learning rail", () => {
    expect(resolveLearningDrivePresentation({
      pathname: "/ctet-tet/mock-tests/history",
      isAuthenticated: true,
    })).toMatchObject({ role: "student", activeParentId: "success", activeChildId: "history" });

    expect(resolveLearningDrivePresentation({
      pathname: "/ctet-tet/notes/read/note-1",
      isAuthenticated: true,
    })).toMatchObject({ role: "student", activeParentId: "learning", activeChildId: "notes" });
  });

  test("maps real Admin modules into V8 parent areas", () => {
    expect(resolveLearningDrivePresentation({
      pathname: "/admin/content/mock-tests/manage",
      isAuthenticated: true,
      isAdminUser: true,
    })).toMatchObject({ role: "admin", activeParentId: "content", activeChildId: "mock-tests" });

    expect(resolveLearningDrivePresentation({
      pathname: "/admin/content/access/bulk",
      isAuthenticated: true,
      isAdminUser: true,
    })).toMatchObject({ role: "admin", activeParentId: "access", activeChildId: "bulk-access" });
  });

  test("continue destination keeps the real resume route", () => {
    expect(getLearningDriveDestination({
      role: "student",
      parentId: "home",
      childId: "continue-learning",
      resumeRoute: "/ctet-tet/notes/read/note-1",
    })).toBe("/ctet-tet/notes/read/note-1");
  });

  test("exam attempt remains distraction-free outside the shell", () => {
    expect(resolveLearningDrivePresentation({
      pathname: "/ctet-tet/mock-tests/attempt/mock-1",
      isAuthenticated: true,
      isExamAttemptPage: true,
    }).enabled).toBe(false);
  });
  test("resolves the designated mentor into the real Mentor Drive", () => {
    const presentation = resolveLearningDrivePresentation({
      pathname: "/mentor",
      isAuthenticated: true,
      isAdminUser: false,
      isMentorUser: true,
    });

    expect(presentation.enabled).toBe(true);
    expect(presentation.role).toBe(LEARNING_DRIVE_ROLES.MENTOR);
    expect(presentation.previewMode).toBe(false);
  });

});
