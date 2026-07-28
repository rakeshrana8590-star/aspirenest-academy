const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Learning Drive username and account creation wiring", () => {
  const rules = read("firestore.rules");
  const service = read("src/profile/usernameService.js");
  const app = read("src/App.js");
  const auth = read("src/components/AuthSection.jsx");

  test("username reservations are exact, owner-created and never listable", () => {
    expect(rules).toContain("match /usernames/{usernameId}");
    expect(rules).toContain("allow get: if isSignedIn();");
    expect(rules).toContain("allow list: if false;");
    expect(rules).toContain('usernameId.matches("^[a-z][a-z0-9_]*$")');
    expect(rules).toContain("data.uid == request.auth.uid");
    expect(rules).toContain("isSafeUserUsernameUpdate");
  });

  test("account records and username reservation use one Firestore transaction", () => {
    expect(service).toContain("runTransaction");
    expect(service).toContain("transaction.get(usernameRef)");
    expect(service).toContain("transaction.set(usernameRef");
    expect(service).toContain("transaction.set(studentRef");
    expect(service).toContain("transaction.set(userRef");
    expect(service).toContain("USERNAME_ALREADY_EXISTS");
    expect(service).toContain("claimUsernameForExistingUser");
  });

  test("registration validates username and rolls back incomplete Auth accounts", () => {
    expect(auth).toContain("Unique Username");
    expect(auth).toContain("validateUsername");
    expect(app).toContain("createVerifiedStudentAccountRecords");
    expect(app).toContain("deleteUser(createdUser)");
    expect(app).toMatch(/sendEmailVerification\((createdUser|userCredential\.user)\)/);
  });
});
