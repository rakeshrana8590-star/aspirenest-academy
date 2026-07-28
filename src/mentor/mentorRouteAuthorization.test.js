import fs from "fs";
import path from "path";

const read = (relativePath) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("mentor workspace route and role wiring", () => {
  const appSource = read("src/App.js");
  const rulesSource = read("firestore.rules");
  const sessionSource = read("src/mentor/useMentorSession.js");

  test("registers the mentor workspace route", () => {
    expect(appSource).toContain('path="/mentor"');
    expect(appSource).toContain("<MentorWorkspaceRoute");
  });

  test("protects the assigned-student detail route through the mentor component", () => {
    expect(appSource).toContain('path="/mentor/students/:studentId"');
    expect(appSource).toContain("isAdminUser={isAdmin(user)}");
  });

  test("keeps student assignments as a separate authenticated route", () => {
    expect(appSource).toContain('path="/assignments"');
    expect(appSource).toContain("<StudentAssignmentsRoute user={user} />");
  });

  test("provides a narrow admin setup route", () => {
    expect(appSource).toContain('path="/admin/content/mentor"');
    expect(appSource).toContain("<AdminMentorSetupRoute />");
  });

  test("mentor role is resolved from mentorProfiles rather than a commercial plan", () => {
    expect(sessionSource).toContain('profile?.role === "mentor"');
    expect(sessionSource).toContain('profile?.status === "active"');
    expect(sessionSource).not.toContain("MENTORSHIP");
  });

  test("rules use exact assigned-student ownership", () => {
    expect(rulesSource).toContain("function isAssignedMentor(studentUid)");
    expect(rulesSource).toContain("mentorProfiles/$(request.auth.uid)/students/$(studentUid)");
    expect(rulesSource).toContain(').data.status == "active"');
  });

  test("rules define separate assignments, access requests and feedback", () => {
    expect(rulesSource).toContain("match /mentorAssignments/{assignmentId}");
    expect(rulesSource).toContain("match /mentorAccessRequests/{requestId}");
    expect(rulesSource).toContain("match /mentorFeedback/{feedbackId}");
  });
  test("recognizes the designated real Mentor account without classifying it as a student", () => {
    expect(sessionSource).toContain("isAspireNestMentor(user)");
    expect(rulesSource).toContain('request.auth.token.email == "dr.varshamaru@gmail.com"');
  });

});
