import {
  buildAdaptiveShellHeaderModel,
} from "./adaptiveShellHeaderModel";

describe("adaptive shell mentor presentation", () => {
  test("shows mentor persona while preserving the commercial access label", () => {
    const model = buildAdaptiveShellHeaderModel({
      user: {
        uid: "mentor-1",
        email: "mentor@example.com",
      },
      isMentorUser: true,
      shellNavigation: {
        mode: "free",
        roleLabel: "Student",
        accessLabel: "Free Access",
      },
      currentPath: "/mentor",
    });

    expect(model.mode).toBe("mentor");
    expect(model.roleLabel).toBe("Mentor");
    expect(model.accessLabel).toBe("Free Access");
    expect(model.accountBadge).toBe("MN");
    expect(model.isMentorUser).toBe(true);
  });

  test("adds Mentor Workspace instead of Student Dashboard", () => {
    const model = buildAdaptiveShellHeaderModel({
      user: { uid: "mentor-1" },
      isMentorUser: true,
      currentPath: "/mentor",
    });

    expect(model.accountItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mentor",
          label: "Mentor Workspace",
          route: "/mentor",
          isActive: true,
        }),
      ])
    );
    expect(
      model.accountItems.some((item) => item.id === "dashboard")
    ).toBe(false);
  });

  test("admin presentation takes precedence over mentor presentation", () => {
    const model = buildAdaptiveShellHeaderModel({
      user: { uid: "admin-1" },
      isAdminUser: true,
      isMentorUser: true,
      shellNavigation: {
        roleLabel: "Student",
        accessLabel: "Free Access",
      },
    });

    expect(model.mode).toBe("admin");
    expect(model.roleLabel).toBe("Admin");
    expect(model.accountBadge).toBe("AN");
    expect(model.isMentorUser).toBe(false);
  });

  test("ordinary learner presentation remains unchanged", () => {
    const model = buildAdaptiveShellHeaderModel({
      user: { uid: "student-1" },
      shellNavigation: {
        mode: "free",
        roleLabel: "Student",
        accessLabel: "Free Access",
      },
    });

    expect(model.mode).toBe("free");
    expect(model.roleLabel).toBe("Student");
    expect(model.accessLabel).toBe("Free Access");
    expect(model.accountBadge).toBe("ST");
  });


  test("ordinary learner account menu exposes My Assignments", () => {
    const model = buildAdaptiveShellHeaderModel({
      user: { uid: "student-1" },
      currentPath: "/assignments",
    });

    expect(model.accountItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "dashboard",
          route: "/student-dashboard",
        }),
        expect.objectContaining({
          id: "assignments",
          label: "My Assignments",
          route: "/assignments",
          isActive: true,
        }),
      ])
    );
  });

  test("admin account menu exposes Mentor Setup", () => {
    const model = buildAdaptiveShellHeaderModel({
      user: { uid: "admin-1" },
      isAdminUser: true,
      currentPath: "/admin/content/mentor",
    });

    expect(model.accountItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "admin",
          route: "/admin",
        }),
        expect.objectContaining({
          id: "mentor-setup",
          label: "Mentor Setup",
          route: "/admin/content/mentor",
          isActive: true,
        }),
      ])
    );
  });

  test("role destinations keep canonical routes even when shell input is spoofed", () => {
    const studentModel = buildAdaptiveShellHeaderModel({
      user: { uid: "student-1" },
      shellNavigation: {
        accountItems: [
          {
            id: "assignments",
            label: "Wrong",
            route: "/admin",
          },
        ],
      },
    });
    const mentorModel = buildAdaptiveShellHeaderModel({
      user: { uid: "mentor-1" },
      isMentorUser: true,
      shellNavigation: {
        accountItems: [
          {
            id: "mentor",
            label: "Wrong",
            route: "/student-dashboard",
          },
          {
            id: "assignments",
            label: "Wrong",
            route: "/assignments",
          },
        ],
      },
    });

    expect(
      studentModel.accountItems.find(
        (item) => item.id === "assignments"
      )
    ).toMatchObject({
      label: "My Assignments",
      route: "/assignments",
    });
    expect(
      mentorModel.accountItems.find(
        (item) => item.id === "mentor"
      )
    ).toMatchObject({
      label: "Mentor Workspace",
      route: "/mentor",
    });
    expect(
      mentorModel.accountItems.some(
        (item) => item.id === "assignments"
      )
    ).toBe(false);
  });
});
