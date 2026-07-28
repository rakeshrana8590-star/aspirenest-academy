import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("AspireNest login and Create Account activation without UI regression", () => {
  test("keeps the exact shared logo component and existing Auth UI stylesheet", () => {
    const logo = read("src/components/AspireNestLogo.jsx");
    const authCss = read("src/styles/public/authSection.css");

    expect(logo).toContain('src="/logo-header.png"');
    expect(logo).toContain('alt="AspireNest Academy"');
    expect(authCss).toContain(".aspireLoginRoute");
    expect(authCss).toContain(".aspireRegisterOverlay");
  });

  test("activates Firebase email Google reset logout and Student registration", () => {
    const app = read("src/App.js");

    expect(app).toContain("signInWithEmailAndPassword");
    expect(app).toContain("signInWithPopup");
    expect(app).toContain("sendPasswordResetEmail(auth, resetEmail)");
    expect(app).toContain("createUserWithEmailAndPassword");
    expect(app).toContain("sendEmailVerification(createdUser)");
    expect(app).toContain("await signOut(auth)");
    expect(app).toContain("resolveAspireNestPostLoginRoute");
  });

  test("keeps Public open and protects Student Mentor and Admin by role", () => {
    const app = read("src/App.js");

    expect(app).toContain('<Route path="/" element={<AcademyOverviewRoute />} />');
    expect(app).toContain('path="/student"');
    expect(app).toContain('path="/mentor"');
    expect(app).toContain('path="/admin"');
    expect(app).toContain('isAdmin(user) || isMentor(user)');
    expect(app).toContain('navigate("/student", { replace: true })');
  });

  test("does not alter the four approved experience labels", () => {
    const shell = read("src/learningDrive/LearningDriveShell.jsx");

    expect(shell).toContain('"Public Website"');
    expect(shell).toContain('"Student Learning Drive"');
    expect(shell).toContain('"Mentor Workspace"');
    expect(shell).toContain('"Admin Learning Drive"');
  });
});
