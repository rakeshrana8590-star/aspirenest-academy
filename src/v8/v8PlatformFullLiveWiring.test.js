import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V8 full platform live wiring", () => {
  const student = read("public/app.js");
  const experiences = read("public/v8-experiences.js");
  const admin = read("public/admin.js");
  const bridge = read("src/v8/v8FirebaseBridge.js");
  const liveData = read("src/v8/v8PlatformLiveData.js");
  const liveActions = read("src/v8/v8PlatformLiveActions.js");
  const rules = read("firestore.rules");

  test("removes hard-coded learner and Mentor business records from V8 runtimes", () => {
    const runtime = `${student}\n${experiences}\n${admin}`;
    ["Dr. Meera Shah", "Mr. Arjun Rao", "learner-rakesh", "learner-aanya", "learner-kavya", "@example.com"].forEach((value) => {
      expect(runtime).not.toContain(value);
    });
    expect(runtime).not.toMatch(/\bsmoke\b/i);
    expect(runtime).not.toMatch(/\bdemo\b/i);
  });

  test("connects Public, Student and Mentor to independent live Firestore projections", () => {
    expect(bridge).toContain("subscribeV8PublicLiveData");
    expect(bridge).toContain("subscribeV8StudentLiveData");
    expect(bridge).toContain("subscribeV8MentorLiveData");
    expect(bridge).toContain("aspirenest:public-live-data");
    expect(bridge).toContain("aspirenest:student-live-data");
    expect(bridge).toContain("aspirenest:mentor-live-data");
    expect(liveData).toContain('collection(db, "contentItems")');
    expect(liveData).toContain('collection(db, "accessProducts")');
    expect(liveData).toContain('collection(db, "mentorQuestions")');
    expect(liveData).toContain('collection(db, "mentorLiveSessions")');
  });

  test("uses authenticated live action events instead of browser business mutations", () => {
    expect(student).toContain("student-ask-question");
    expect(student).toContain("student-complete-assignment");
    expect(experiences).toContain("mentor-create-assignment");
    expect(experiences).toContain("mentor-create-access-request");
    expect(experiences).toContain("mentor-answer-question");
    expect(experiences).toContain("mentor-schedule-session");
    expect(liveActions).toContain("installV8PlatformLiveActions");
    expect(experiences).not.toContain("experience.assignments.unshift");
    expect(experiences).not.toContain("Approved locally");
  });

  test("protects live Mentor questions and sessions through Firestore rules", () => {
    expect(rules).toContain("match /mentorQuestions/{questionId}");
    expect(rules).toContain("match /mentorLiveSessions/{sessionId}");
    expect(rules).toContain('request.resource.data.mentorEmail == "dr.varshamaru@gmail.com"');
    expect(rules).toContain('request.resource.data.studentUid == request.auth.uid');
    expect(rules).toContain("isActiveMentor()");
  });

  test("keeps exact V8 UI files free of environment and release-review copy", () => {
    expect(admin).not.toContain("No deployment");
    expect(admin).not.toContain("Connected branch environment");
    expect(admin).toContain("Live platform controls");
    expect(admin).toContain("Role-protected writes");
  });
});
