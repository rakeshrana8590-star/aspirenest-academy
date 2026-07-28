import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("G4 real student acceptance wiring", () => {
  test("Admin Learners renders a read-only acceptance report from existing sources", () => {
    const route = read("src/learningDrive/AdminDriveLearnersRoute.jsx");
    expect(route).toContain("buildRealStudentAcceptanceReport");
    expect(route).toContain("REAL STUDENT READ ACCEPTANCE");
    expect(route).toContain("Download read proof");
    expect(route).toContain("users • students • learnerProfiles");
  });

  test("the acceptance model does not contain Firestore write APIs", () => {
    const model = read("src/profile/realStudentAcceptance.js");
    expect(model).not.toMatch(/setDoc|addDoc|updateDoc|deleteDoc|writeBatch/);
    expect(model).toContain("readOnly: true");
  });
});
