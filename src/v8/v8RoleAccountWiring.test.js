import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V8 real role, route and account authorization wiring", () => {
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const admin = read("public/admin.js");
  const experiences = read("public/v8-experiences.js");
  const rules = read("firestore.rules");

  test("activates the exact existing V8 engines instead of rendering a replacement shell", () => {
    expect(admin).toContain("window.__aspirenestAdminAPI");
    expect(experiences).toContain("window.__aspirenestExperienceAPI");
    expect(bridge).toContain("activateV8Experience(experience, window)");
    expect(bridge).not.toContain("createRoot");
    expect(bridge).not.toContain("attachShadow");
  });

  test("keeps Google chooser and requires new Google students to complete one saved profile", () => {
    expect(bridge).toContain('prompt: "select_account"');
    expect(bridge).toContain("getAdditionalUserInfo");
    expect(bridge).toContain("info?.isNewUser");
    expect(bridge).toContain("renderGoogleAccountCompletion");
    expect(bridge).toContain("createVerifiedStudentAccountRecords");
    expect(bridge).toContain("sessionStorage.setItem(GOOGLE_SETUP_KEY");
  });

  test("preserves exact staff authorization and hardens Student self writes", () => {
    expect(rules).toContain('request.auth.token.email == "aspirenestplatform@gmail.com"');
    expect(rules).toContain('request.auth.token.email == "dr.varshamaru@gmail.com"');
    expect(rules).toContain("function isSafeStudentSelfCreate(studentUid)");
    expect(rules).toContain("studentUid == request.auth.uid");
    expect(rules).toContain("allow read: if isAdmin() || isOwner(docId)");
    expect(rules).toContain("match /usernames/{usernameId}");
  });

  test("authenticated chooser only renders experiences allowed for the signed-in account", () => {
    expect(experiences).toContain("const allowed=session.user&&Array.isArray(session.allowed)?session.allowed:['public']");
    expect(experiences).toContain("return allowed.includes(id)");
  });
});
