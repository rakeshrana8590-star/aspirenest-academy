import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("exact V8 real learner directory wiring", () => {
  const admin = read("public/admin.js");
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const directory = read("src/v8/v8LearnerDirectory.js");
  const rules = read("firestore.rules");

  test("replaces V8 smoke learner rows in memory without changing the V8 table UI", () => {
    expect(admin).toContain("aspirenest:real-learner-directory");
    expect(admin).toContain("applyRealLearnerDirectory");
    expect(admin).toContain("data.learners=[]");
    expect(admin).toContain("setRealLearners");
    expect(admin).not.toContain("store.setItem(STORAGE_KEY,JSON.stringify(state.learners))");
  });

  test("subscribes only the real Admin session to existing Firestore learner sources", () => {
    expect(bridge).toContain("syncRealLearnerDirectory(user)");
    expect(bridge).toContain('resolveAspireNestRole(user) !== "admin"');
    expect(bridge).toContain("subscribeV8RealLearnerDirectory");
    ["users", "students", "learnerProfiles", "studentAccess"].forEach((name) =>
      expect(directory).toContain(`watch("${name}"`)
    );
  });

  test("merges identity records, excludes staff and never writes Firestore", () => {
    expect(directory).toContain("buildV8RealLearnerDirectory");
    expect(directory).toContain("isAspireNestStaffEmail");
    expect(directory).toContain("accessMatchesLearner");
    expect(directory).toContain("onSnapshot");
    ["setDoc(", "addDoc(", "updateDoc(", "deleteDoc(", "writeBatch("].forEach((marker) =>
      expect(directory).not.toContain(marker)
    );
  });

  test("keeps the existing Admin read authorization for all four sources", () => {
    expect(rules).toContain("match /students/{docId}");
    expect(rules).toContain("match /users/{userId}");
    expect(rules).toContain("match /learnerProfiles/{profileId}");
    expect(rules).toContain("match /studentAccess/{docId}");
    expect(rules).toContain("allow read: if isAdmin()");
  });
});
