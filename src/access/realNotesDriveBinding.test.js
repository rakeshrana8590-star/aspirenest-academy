import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("G5 real Notes binding wiring", () => {
  test("student and admin Notes routes use the same real contentItems report", () => {
    const student = read("src/components/notes/student/StudentNotesLibraryRoute.jsx");
    const admin = read("src/components/notes/admin/AdminNotesHomeRoute.jsx");

    expect(student).toContain("buildRealNotesBindingReport");
    expect(student).toContain("REAL NOTES CONNECTED");
    expect(admin).toContain("buildRealNotesBindingReport");
    expect(admin).toContain("REAL NOTES SOURCE");
  });

  test("notes navigation stays inside the existing app routes", () => {
    const routes = read("src/learningDrive/learningDriveRouteMap.js");
    expect(routes).toContain('route: "/ctet-tet/notes"');
    expect(routes).toContain('route: "/admin/content/notes"');
  });

  test("real Notes binding has no Firestore write API", () => {
    const model = read("src/components/notes/shared/realNotesBinding.js");
    expect(model).not.toMatch(/setDoc|addDoc|updateDoc|deleteDoc|writeBatch/);
    expect(model).toContain('sourceCollection: "contentItems"');
    expect(model).toContain("duplicateNotesDatabase: false");
  });
});
