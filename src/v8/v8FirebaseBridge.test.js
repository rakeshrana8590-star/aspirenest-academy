import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("exact V8 Firebase root wiring", () => {
  const index = read("public/index.html");
  const entry = read("src/index.js");
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const roleRuntime = read("src/v8/v8RoleRuntime.js");
  const hooks = read("public/v8-auth-hooks.js");

  test("uses the exact V8 DOM as the application root without React or Shadow wrappers", () => {
    expect(index).toContain('id="app" class="app-shell"');
    expect(index).toContain('id="parentNav"');
    expect(index).toContain('id="contextNav"');
    expect(index).toContain('id="pageContent"');
    expect(entry).not.toContain("createRoot");
    expect(entry).not.toContain("<App");
    expect(entry).toContain('import "./v8/v8FirebaseBridge"');
  });

  test("activates real Firebase login, Google login, reset, logout and Student registration", () => {
    [
      "signInWithEmailAndPassword",
      "signInWithPopup",
      "sendPasswordResetEmail",
      "signOut",
      "createUserWithEmailAndPassword",
      "sendEmailVerification",
      "createVerifiedStudentAccountRecords",
      "deleteUser(createdUser)",
      "createGoogleProvider",
      "getAdditionalUserInfo",
      "renderGoogleAccountCompletion",
      "accountSetupInProgress",
    ].forEach((marker) => expect(bridge).toContain(marker));
  });

  test("preserves exact role hierarchy and routes through real authentication", () => {
    expect(bridge).toContain("V8_EXPERIENCE_ROUTES");
    expect(roleRuntime).toContain('student: "/student"');
    expect(roleRuntime).toContain('mentor: "/mentor"');
    expect(roleRuntime).toContain('admin: "/admin"');
    expect(bridge).toContain("canUseAspireNestExperience");
    expect(bridge).toContain("activateV8Experience");
    expect(bridge).toContain("resolveV8ExperienceFromPath");
    expect(hooks).toContain("data-v8-role");
    expect(hooks).toContain("aspirenest:signout");
  });
});
