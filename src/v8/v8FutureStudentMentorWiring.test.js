import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("future Student default Mentor lifecycle", () => {
  const registration = read("src/profile/usernameService.js");
  const actions = read("src/v8/v8AdminLiveActions.js");
  const mentorService = read("src/mentor/mentorService.js");
  const rules = read("firestore.rules");

  test("writes the same mentor policy for password and Google registration", () => {
    expect(registration).toContain('doc(db, "platformSettings", "defaultMentor")');
    expect(registration).toContain("ASPIRENEST_DEFAULT_MENTOR_POLICY_ID");
    expect(registration).toContain('doc(db, "learnerProfiles", uid)');
    expect(registration).toContain('doc(db, "mentorStudentLinks", uid)');
    expect(registration).toContain('doc(db, "mentorProfiles", defaultMentor.uid, "students", uid)');
  });

  test("backfills current learners idempotently with canonical and legacy-compatible links", () => {
    expect(actions).toContain("syncDefaultMentorRelationships");
    expect(actions).toContain('doc(db, "mentorStudentLinks", learner.uid)');
    expect(actions).toContain('doc(db, "mentorProfiles", mentorUid, "students", learner.uid)');
    expect(actions).toContain("missingRelationshipLearners");
    expect(actions).toContain("lastRelationshipSignature");
  });

  test("Mentor workspace reads the same canonical relationship", () => {
    expect(mentorService).toContain('collection(db, "mentorStudentLinks")');
    expect(mentorService).toContain('collection(db, "learnerProfiles")');
  });

  test("rules protect default Mentor writes", () => {
    expect(rules).toContain("match /mentorStudentLinks/{studentUid}");
    expect(rules).toContain('request.resource.data.mentorEmail == "dr.varshamaru@gmail.com"');
    expect(rules).toContain('request.resource.data.source == "default-mentor-v1"');
    expect(rules).toContain("match /platformSettings/{docId}");
  });
});
