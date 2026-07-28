import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V8 Admin interaction and no-fallback consistency", () => {
  const admin = read("public/admin.js");

  test("removes staff again at the final browser projection", () => {
    expect(admin).toContain("isStaffLearnerRecord");
    expect(admin).toContain("aspirenestplatform@gmail.com");
    expect(admin).toContain("dr.varshamaru@gmail.com");
    expect(admin).toContain(".filter(learner=>!isStaffLearnerRecord(learner))");
  });

  test("uses one reusable contextual toolbar across collection-heavy Admin areas", () => {
    expect(admin).toContain("function collectionToolbar");
    expect(admin).toContain("data-admin-collection-filter");
    expect(admin).toContain("data-admin-sort");
    expect(admin).toContain("accessToolbar(grants)");
    expect((admin.match(/collectionToolbar\(/g) || []).length).toBeGreaterThanOrEqual(7);
  });

  test("does not hydrate authenticated Admin from historical browser records", () => {
    expect(admin).toContain("function load(){return clone(seed);}");
    expect(admin).not.toContain("Dr. Meera Shah");
    expect(admin).not.toContain("Mr. Arjun Rao");
    expect(admin).not.toContain("@example.com");
    expect(admin).not.toMatch(/\bdemo\b/i);
    expect(admin).not.toMatch(/\bsmoke\b/i);
  });

  test("shows exact source health rather than a generic warning", () => {
    expect(admin).toContain("realAdminSourceStatus");
    expect(admin).toContain("realAdminSourceCounts");
    expect(admin).toContain("mentorStudentLinks");
    expect(admin).toContain("Connected · no records");
  });
});
