import {
  activateV8Experience,
  getVisibleV8Experiences,
  resolveV8ExperienceFromPath,
} from "./v8RoleRuntime";

const runtime = () => ({
  __aspirenestStudentAPI: { navigate: jest.fn() },
  __aspirenestAdminAPI: { enterAdmin: jest.fn(), exitAdmin: jest.fn() },
  __aspirenestExperienceAPI: { enterExperience: jest.fn(), cleanupExperience: jest.fn() },
  dispatchEvent: jest.fn(),
});

describe("V8 authenticated experience runtime", () => {
  test("maps clean path roots to exact experiences", () => {
    expect(resolveV8ExperienceFromPath("/")).toBe("public");
    expect(resolveV8ExperienceFromPath("/student")).toBe("student");
    expect(resolveV8ExperienceFromPath("/mentor/assignments")).toBe("mentor");
    expect(resolveV8ExperienceFromPath("/admin/students")).toBe("admin");
  });

  test("activates the actual V8 engine for every protected root", async () => {
    const adminRuntime = runtime();
    await activateV8Experience("admin", adminRuntime);
    expect(adminRuntime.__aspirenestExperienceAPI.cleanupExperience).toHaveBeenCalled();
    expect(adminRuntime.__aspirenestAdminAPI.enterAdmin).toHaveBeenCalled();

    const mentorRuntime = runtime();
    await activateV8Experience("mentor", mentorRuntime);
    expect(mentorRuntime.__aspirenestExperienceAPI.enterExperience).toHaveBeenCalledWith("mentor");

    const studentRuntime = runtime();
    await activateV8Experience("student", studentRuntime);
    expect(studentRuntime.__aspirenestAdminAPI.exitAdmin).toHaveBeenCalled();
    expect(studentRuntime.__aspirenestStudentAPI.navigate).toHaveBeenCalledWith("home", "overview");
  });

  test("shows only Public before login and only authorized choices after login", () => {
    expect(getVisibleV8Experiences({ user: null, allowed: ["public"] })).toEqual([
      "public",
    ]);
    expect(getVisibleV8Experiences({ user: { uid: "s" }, allowed: ["public", "student"] })).toEqual([
      "public", "student",
    ]);
    expect(getVisibleV8Experiences({ user: { uid: "m" }, allowed: ["public", "student", "mentor"] })).toEqual([
      "public", "student", "mentor",
    ]);
  });
});
