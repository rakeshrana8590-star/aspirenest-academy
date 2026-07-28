import {
  ASPIRENEST_ADMIN_EMAIL,
  ASPIRENEST_MENTOR_EMAIL,
  ASPIRENEST_EXPERIENCES,
  ASPIRENEST_ROLES,
  canUseAspireNestExperience,
  getAspireNestAllowedExperiences,
  getAspireNestDisplayName,
  getAspireNestLandingRoute,
  resolveAspireNestPostLoginRoute,
  isAspireNestAdmin,
  isAspireNestMentor,
  isAspireNestStudent,
  mergeAspireNestStudentDirectory,
  resolveAspireNestRole,
} from "./aspireNestIdentity";

describe("AspireNest real identity mapping", () => {
  test("maps the two designated staff accounts exactly", () => {
    expect(resolveAspireNestRole({ email: ASPIRENEST_ADMIN_EMAIL })).toBe(
      ASPIRENEST_ROLES.ADMIN
    );
    expect(resolveAspireNestRole({ email: ASPIRENEST_MENTOR_EMAIL })).toBe(
      ASPIRENEST_ROLES.MENTOR
    );
    expect(isAspireNestAdmin({ email: ASPIRENEST_ADMIN_EMAIL })).toBe(true);
    expect(isAspireNestMentor({ email: ASPIRENEST_MENTOR_EMAIL })).toBe(true);
  });

  test("keeps every other existing account in the student flow", () => {
    expect(resolveAspireNestRole({ email: "learner@example.com" })).toBe(
      ASPIRENEST_ROLES.STUDENT
    );
    expect(isAspireNestStudent({ email: "learner@example.com" })).toBe(true);
    expect(isAspireNestStudent({ email: ASPIRENEST_ADMIN_EMAIL })).toBe(false);
    expect(isAspireNestStudent({ email: ASPIRENEST_MENTOR_EMAIL })).toBe(false);
  });

  test("uses founder-approved staff names and role landing routes", () => {
    expect(getAspireNestDisplayName({ email: ASPIRENEST_ADMIN_EMAIL })).toBe(
      "Dr. Rakesh P. Rana"
    );
    expect(getAspireNestDisplayName({ email: ASPIRENEST_MENTOR_EMAIL })).toBe(
      "Dr. Varsha Maru"
    );
    expect(getAspireNestLandingRoute({ email: ASPIRENEST_ADMIN_EMAIL })).toBe(
      "/admin"
    );
    expect(getAspireNestLandingRoute({ email: ASPIRENEST_MENTOR_EMAIL })).toBe(
      "/mentor"
    );
    expect(getAspireNestLandingRoute({ email: "learner@example.com" })).toBe(
      "/student"
    );
  });

  test("enforces the exact Public Student Mentor Admin usage matrix", () => {
    const student = { email: "learner@example.com" };
    const mentor = { email: ASPIRENEST_MENTOR_EMAIL };
    const admin = { email: ASPIRENEST_ADMIN_EMAIL };

    expect(getAspireNestAllowedExperiences(student)).toEqual([
      ASPIRENEST_EXPERIENCES.PUBLIC,
      ASPIRENEST_EXPERIENCES.STUDENT,
    ]);
    expect(getAspireNestAllowedExperiences(mentor)).toEqual([
      ASPIRENEST_EXPERIENCES.PUBLIC,
      ASPIRENEST_EXPERIENCES.STUDENT,
      ASPIRENEST_EXPERIENCES.MENTOR,
    ]);
    expect(getAspireNestAllowedExperiences(admin)).toEqual([
      ASPIRENEST_EXPERIENCES.PUBLIC,
      ASPIRENEST_EXPERIENCES.STUDENT,
      ASPIRENEST_EXPERIENCES.MENTOR,
      ASPIRENEST_EXPERIENCES.ADMIN,
    ]);

    expect(canUseAspireNestExperience(student, "mentor")).toBe(false);
    expect(canUseAspireNestExperience(mentor, "student")).toBe(true);
    expect(canUseAspireNestExperience(mentor, "admin")).toBe(false);
    expect(canUseAspireNestExperience(admin, "admin")).toBe(true);
  });

  test("keeps post-login returnTo inside the account access boundary", () => {
    const student = { email: "learner@example.com" };
    const mentor = { email: ASPIRENEST_MENTOR_EMAIL };
    const admin = { email: ASPIRENEST_ADMIN_EMAIL };

    expect(resolveAspireNestPostLoginRoute(student, "/admin")).toBe("/student");
    expect(resolveAspireNestPostLoginRoute(student, "/mentor")).toBe("/student");
    expect(resolveAspireNestPostLoginRoute(student, "/ctet-tet/notes")).toBe(
      "/ctet-tet/notes"
    );
    expect(resolveAspireNestPostLoginRoute(mentor, "/student")).toBe("/student");
    expect(resolveAspireNestPostLoginRoute(mentor, "/admin")).toBe("/mentor");
    expect(resolveAspireNestPostLoginRoute(admin, "/admin/students")).toBe(
      "/admin/students"
    );
    expect(resolveAspireNestPostLoginRoute(student, "https://evil.example")).toBe(
      "/student"
    );
  });

  test("merges current users and students without migrating or recreating accounts", () => {
    const merged = mergeAspireNestStudentDirectory({
      users: [
        { id: "admin-1", email: ASPIRENEST_ADMIN_EMAIL },
        { id: "mentor-1", email: ASPIRENEST_MENTOR_EMAIL },
        { id: "student-1", email: "one@example.com", subscriptionType: "PREMIUM" },
      ],
      students: [
        { id: "student-1", email: "one@example.com", fullName: "One Learner" },
        { id: "student-2", email: "two@example.com", fullName: "Two Learner" },
      ],
    });

    expect(merged).toHaveLength(2);
    expect(merged.map((item) => item.email).sort()).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
    expect(merged.find((item) => item.email === "one@example.com")).toMatchObject({
      fullName: "One Learner",
      subscriptionType: "PREMIUM",
      role: "student",
    });
  });
});
