import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("exact V8 authentication interaction wiring", () => {
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const experiences = read("public/v8-experiences.js");

  test("allows every login and create-account control to receive its own click", () => {
    const bypass = experiences.indexOf("if(event.target.closest('#aspirenestAuthOverlay'))return;");
    const blocker = experiences.indexOf("event.stopImmediatePropagation();", bypass);
    expect(bypass).toBeGreaterThan(-1);
    expect(blocker).toBeGreaterThan(bypass);
  });

  test("activates create account, Google login, close, reset and password visibility", () => {
    [
      '[data-auth-create]',
      '[data-auth-google]',
      '[data-auth-close]',
      '[data-auth-forgot]',
      '[data-auth-show]',
      "signInWithPopup(auth, createGoogleProvider())",
      'navigate(`/create-account${window.location.search}`)',
      'navigate("/")',
    ].forEach((marker) => expect(bridge).toContain(marker));
  });

  test("keeps Student account creation atomic while Firebase Auth changes state", () => {
    expect(bridge).toContain("let accountSetupInProgress = false");
    expect(bridge).toContain("accountSetupInProgress = true");
    expect(bridge).toContain("if (accountSetupInProgress) return");
    expect(bridge).toContain("createUserWithEmailAndPassword");
    expect(bridge).toContain("createVerifiedStudentAccountRecords");
    expect(bridge).toContain("sendEmailVerification(createdUser)");
    expect(bridge).toContain("deleteUser(createdUser)");
  });

  test("supports the top close button and Escape without changing the V8 shell", () => {
    expect(bridge).toContain('data-auth-close aria-label="Back to Public Website"');
    expect(bridge).toContain('event.key === "Escape"');
    expect(bridge).toContain('navigate("/", true)');
  });
});
