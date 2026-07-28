import { buildV8AdminLiveData } from "./v8AdminLiveData";

describe("V8 complete Admin live data model", () => {
  test("builds one connected real Admin projection with canonical mentor relationships", () => {
    const state = buildV8AdminLiveData({
      users: [
        { id: "uid-1", uid: "uid-1", email: "1990amala@gmail.com", fullName: "Amala", role: "student" },
        { id: "mentor-uid", uid: "mentor-uid", email: "dr.varshamaru@gmail.com", displayName: "Dr. Varsha Maru", role: "mentor" },
        { id: "admin-uid", uid: "admin-uid", email: "aspirenestplatform@gmail.com", role: "admin" },
      ],
      students: [
        { id: "legacy-uid", uid: "legacy-uid", email: "1990AMALA@gmail.com", username: "1990amala" },
      ],
      learnerProfiles: [
        { id: "profile-uid", uid: "profile-uid", email: "1990amala@gmail.com", progress: 25 },
      ],
      studentAccess: [
        { id: "access-1", studentUid: "legacy-uid", status: "active", scopeType: "plan", planCode: "PREMIUM", accessUntil: "2027-09-07" },
      ],
      contentItems: [
        { id: "note-1", title: "Real Note", section: "notes", status: "published", planType: "PREMIUM", subject: "CDP", updatedAt: "2026-07-25" },
        { id: "ca-1", title: "July 2026 Current Affairs", section: "currentAffairs", status: "published", planType: "PREMIUM", month: "July 2026", week: "Week 1" },
      ],
      currentAffairs: [
        { id: "ca-1", title: "July 2026 Current Affairs", month: "July 2026", week: "Week 1", planType: "PREMIUM", pdfUrl: "https://storage.example/ca.pdf" },
      ],
      studyRoadmaps: [
        { id: "road-1", title: "60 Day CTET Roadmap", examType: "CTET Paper II", planType: "PREMIUM", status: "published", totalDays: 60 },
      ],
      payments: [
        { id: "pay-1", userId: "uid-1", amount: 1499, status: "pending", planType: "PREMIUM", utr: "UTR-1" },
      ],
      mentorProfiles: [
        { id: "mentor-uid", uid: "mentor-uid", email: "dr.varshamaru@gmail.com", fullName: "Dr. Varsha Maru" },
      ],
      mentorAssignments: [
        { id: "assignment-1", mentorUid: "mentor-uid", studentUid: "uid-1" },
      ],
      mentorStudentLinks: [
        { id: "uid-1", mentorUid: "mentor-uid", mentorEmail: "dr.varshamaru@gmail.com", studentUid: "uid-1", status: "active" },
      ],
      accessAuditLogs: [
        { id: "audit-1", action: "GRANT_PLAN", target: "Amala", result: "SUCCESS", createdAt: "2026-07-25" },
      ],
      accessInvites: [
        { id: "invite-1", email: "future@gmail.com", scopeType: "ITEM", itemId: "note-1", status: "pending" },
      ],
      accessProducts: [
        { id: "premium", planCode: "PREMIUM", price: 1499 },
      ],
    });

    expect(state.learners).toHaveLength(1);
    expect(state.learners[0]).toMatchObject({
      email: "1990amala@gmail.com",
      mentor: "Dr. Varsha Maru",
      mentorEmail: "dr.varshamaru@gmail.com",
      mentorPersisted: true,
    });
    expect(state.learners[0].uidAliases).toEqual(expect.arrayContaining(["uid-1", "legacy-uid", "profile-uid"]));
    expect(state.resources).toHaveLength(3);
    expect(state.resources.map((resource) => resource.type)).toEqual(
      expect.arrayContaining(["Native Note", "Current Affairs", "Roadmap"])
    );
    expect(state.grants).toHaveLength(1);
    expect(state.payments).toHaveLength(1);
    expect(state.mentors).toHaveLength(1);
    expect(state.mentors[0]).toMatchObject({ email: "dr.varshamaru@gmail.com", learners: 1, assignments: 1 });
    expect(state.audit).toHaveLength(1);
    expect(state.pendingClaims).toHaveLength(1);
    expect(state.products).toHaveLength(1);
    expect(state.missingRelationshipLearners).toHaveLength(0);
    const learnerIdentityEmails = state.learners.map((learner) => learner.email);
    expect(learnerIdentityEmails).not.toContain("aspirenestplatform@gmail.com");
    expect(learnerIdentityEmails).not.toContain("dr.varshamaru@gmail.com");
    expect(state.learners[0].mentorEmail).toBe("dr.varshamaru@gmail.com");
  });

  test("projects every current learner to Dr. Varsha and reports only unpersisted relationships", () => {
    const state = buildV8AdminLiveData({
      users: [
        { id: "student-1", email: "one@gmail.com", role: "student" },
        { id: "student-2", email: "two@gmail.com", role: "student" },
        { id: "mentor-uid", email: "dr.varshamaru@gmail.com", role: "mentor" },
      ],
      mentorProfiles: [{ id: "mentor-uid", uid: "mentor-uid", email: "dr.varshamaru@gmail.com" }],
      mentorStudentLinks: [
        { id: "student-1", mentorUid: "mentor-uid", mentorEmail: "dr.varshamaru@gmail.com", studentUid: "student-1", status: "active" },
      ],
    });

    expect(state.learners).toHaveLength(2);
    expect(state.learners.every((learner) => learner.mentor === "Dr. Varsha Maru")).toBe(true);
    expect(state.mentors[0].learners).toBe(2);
    expect(state.missingRelationshipLearners.map((learner) => learner.uid)).toEqual(["student-2"]);
  });


  test("applies final staff exclusion after relationship projection and canonicalizes legacy modules", () => {
    const state = buildV8AdminLiveData({
      users: [
        { id: "student-1", uid: "student-1", email: "learner@example.org", role: "student" },
        { id: "admin-1", uid: "admin-1", email: "aspirenestplatform@gmail.com", role: "student" },
        { id: "mentor-1", uid: "mentor-1", email: "dr.varshamaru@gmail.com", role: "student" },
      ],
      currentAffairs: [
        { id: "ca-legacy", title: "June 2026", month: "June 2026", pdfUrl: "https://storage.example/june.pdf", type: "FREE" },
      ],
      studyRoadmaps: [
        { id: "road-legacy", title: "Roadmap", status: "published", planType: "FREE" },
      ],
    });

    expect(state.learners.map((learner) => learner.email)).toEqual(["learner@example.org"]);
    expect(state.resources).toHaveLength(2);
    expect(state.resources.map((resource) => resource.type)).toEqual(
      expect.arrayContaining(["Current Affairs", "Roadmap"])
    );
  });

  test("preserves real module identities instead of collapsing Notes into Learning Resource", () => {
    const state = buildV8AdminLiveData({
      contentItems: [
        { id: "native-note", title: "Native Note", section: "notes", status: "published" },
        { id: "video-1", title: "Video", section: "videos", status: "published" },
        { id: "mock-1", title: "Mock", section: "mockTests", status: "published" },
      ],
    });

    expect(state.resources.map((resource) => resource.type)).toEqual(
      expect.arrayContaining(["Native Note", "Video", "Mock Test"])
    );
    expect(state.resources.map((resource) => resource.type)).not.toContain("Learning Resource");
  });

  test("returns honest empty projections instead of fallback records", () => {
    expect(buildV8AdminLiveData()).toEqual({
      learners: [],
      resources: [],
      grants: [],
      payments: [],
      mentors: [],
      audit: [],
      pendingClaims: [],
      defaultMentor: {
        uid: "",
        id: "dr.varshamaru@gmail.com",
        name: "Dr. Varsha Maru",
        email: "dr.varshamaru@gmail.com",
      },
      missingRelationshipLearners: [],
      products: [],
    });
  });
});

test("shows founder-approved Mentorship Notes under Premium while leaving other Mentorship modules unchanged", () => {
  const state = buildV8AdminLiveData({
    contentItems: [
      { id: "mentor-note", title: "Mentorship Note", section: "notes", planType: "MENTORSHIP", status: "published" },
      { id: "mentor-video", title: "Mentorship Video", section: "videos", planType: "MENTORSHIP", status: "published" },
    ],
  });
  const note = state.resources.find((resource) => resource.id === "mentor-note");
  const video = state.resources.find((resource) => resource.id === "mentor-video");
  expect(note.access).toBe("PREMIUM");
  expect(video.access).toBe("MENTORSHIP");
});
