import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V8 complete Admin live platform wiring", () => {
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const model = read("src/v8/v8AdminLiveData.js");
  const actions = read("src/v8/v8AdminLiveActions.js");
  const admin = read("public/admin.js");

  test("subscribes Admin only and publishes one complete live event", () => {
    expect(bridge).toContain("subscribeV8AdminLiveData");
    expect(bridge).toContain('if (!user || resolveAspireNestRole(user) !== "admin")');
    expect(bridge).toContain('new CustomEvent("aspirenest:real-admin-data"');
    expect(admin).toContain("aspirenest:real-admin-data");
    expect(admin).toContain("applyRealAdminData");
    expect(actions).not.toContain('window.addEventListener("aspirenest:real-admin-data"');
    expect(actions).toContain('"sync-default-mentor-relationships"');
  });

  test("covers all approved Admin sources including canonical mentor links", () => {
    [
      "users", "students", "learnerProfiles", "studentAccess", "contentItems", "payments",
      "mentorProfiles", "mentorAssignments", "mentorStudentLinks", "accessAuditLogs",
      "accessActionLogs", "experienceEvents", "accessInvites", "accessProducts",
    ].forEach((name) => expect(model).toContain(`${name}: "${name}"`));
    expect(model).not.toContain("collectionGroup");
  });

  test("uses real write bridge and never applies browser-only mutations", () => {
    expect(bridge).toContain("installV8AdminLiveActions({ auth, db })");
    expect(admin).toContain("LIVE_WRITE_ACTIONS");
    expect(admin).toContain("requestLiveAction");
    expect(admin).toContain("aspirenest:admin-live-action-result");
    expect(actions).toContain('"submit-resource": createResource');
    expect(actions).toContain('"submit-grant"');
    expect(actions).toContain('"confirm-payment": verifyPayment');
    expect(actions).toContain('"submit-learner"');
    expect(admin).not.toContain("Protected live action: no local demo mutation was applied.");
  });

  test("retains read/write separation", () => {
    ["addDoc", "setDoc", "updateDoc", "deleteDoc", "writeBatch", "runTransaction"].forEach((marker) =>
      expect(model).not.toContain(marker)
    );
    expect(actions).toContain("writeBatch");
    expect(actions).toContain("actorFromAuth");
  });
});
