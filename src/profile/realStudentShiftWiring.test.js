import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("real student shift wiring", () => {
  const app = read("src/App.js");
  const authService = read("src/utils/authAccountService.js");
  const learnerService = read("src/profile/learnerProfileService.js");
  const learnerRoute = read("src/learningDrive/AdminDriveLearnersRoute.jsx");
  const mentorSession = read("src/mentor/useMentorSession.js");
  const rules = read("firestore.rules");

  test("keeps the exact Admin and Mentor accounts out of student writes", () => {
    expect(app).toContain("isAspireNestStudent(verifiedUser)");
    expect(authService).toContain("!isAspireNestStudent(verifiedUser)");
    expect(learnerService).toContain("!isAspireNestStudent(user)");
  });

  test("loads current users and students read-only into the V8 learner directory", () => {
    expect(learnerService).toContain("listExistingStudentDirectory");
    expect(learnerService).toContain('collection(db, "students")');
    expect(learnerService).toContain('collection(db, "users")');
    expect(learnerRoute).toContain("listExistingStudentDirectory");
    expect(learnerRoute).toContain("directoryStudents");
  });

  test("routes the designated Mentor to the real Mentor workspace", () => {
    expect(app).toContain("isMentorUser: isMentor(user)");
    expect(app).toContain("resolveAspireNestPostLoginRoute");
    expect(app).toMatch(
      /resolveAspireNestPostLoginRoute\(userCredential\.user, returnTo\)/
    );
    expect(mentorSession).toContain("isAspireNestMentor(user)");
    expect(rules).toContain('request.auth.token.email == "dr.varshamaru@gmail.com"');
  });

  test("preserves all other existing accounts as students without recreation", () => {
    const identity = read("src/auth/aspireNestIdentity.js");
    expect(identity).toContain("return ASPIRENEST_ROLES.STUDENT");
    expect(identity).toContain("mergeAspireNestStudentDirectory");
    expect(app).not.toContain("delete existing student");
  });
});
