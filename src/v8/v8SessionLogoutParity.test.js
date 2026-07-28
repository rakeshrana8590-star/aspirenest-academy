import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V8 real account identity, Mentor parity and Firebase logout", () => {
  const student = read("public/app.js");
  const admin = read("public/admin.js");
  const experiences = read("public/v8-experiences.js");
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const accountService = read("src/utils/authAccountService.js");
  const roleRuntime = read("src/v8/v8RoleRuntime.js");

  test("replaces smoke account labels with the authenticated session in Student and Admin menus", () => {
    expect(student).toContain("window.__aspirenestAuthSession");
    expect(student).toContain("data-aspirenest-signout");
    expect(student).not.toContain("Founder preview");
    expect(student).not.toContain("Sign out preview");
    expect(admin).toContain("window.__aspirenestAuthSession");
    expect(admin).toContain("Administrator");
    expect(admin).toContain("data-aspirenest-signout");
    expect(admin).not.toContain("Admin preview");
  });

  test("gives Mentor a real identity menu, Student workspace access and real sign out", () => {
    expect(experiences).toContain("Mentor account");
    expect(experiences).toContain("Administrator viewing Mentor Workspace");
    expect(experiences).toContain("Open Student Learning OS");
    expect(experiences).toContain("End this Firebase session");
    expect(experiences).not.toContain("<strong>Dr. Meera Shah</strong><small>Active Mentor Workspace</small>");
  });

  test("keeps anonymous Public users public and sends Start Learning through login", () => {
    expect(experiences).toContain("const allowed=session.user&&Array.isArray(session.allowed)?session.allowed:['public']");
    expect(roleRuntime).toContain('if (!session?.user) return Object.freeze(["public"])');
    expect(experiences).toContain('data-aspirenest-login="/student"');
    expect(experiences).toContain("/login?returnTo=");
    expect(experiences).toContain("aspirenest:access-denied");
  });

  test("loads the real account profile before publishing the browser session", () => {
    expect(accountService).toContain("loadAspireNestAccountProfile");
    expect(accountService).toContain('["users", "mentorProfiles"]');
    expect(accountService).toContain('["users", "students"]');
    expect(bridge).toContain("await loadAspireNestAccountProfile(db, user)");
    expect(bridge).toContain("username:");
    expect(bridge).toContain("planType:");
  });

  test("clears the Firebase session once for every role and returns to Public", () => {
    expect(bridge).toContain("performAspireNestSignOut");
    expect(bridge).toContain("clearAspireNestAuthSession");
    expect(bridge).toContain("signOutInProgress");
    expect(bridge).toContain('navigate("/", true)');
    expect(bridge).toContain("aspirenest:session-cleared");
    expect(bridge).toContain("window.__aspirenestAuthAPI");
  });
});
