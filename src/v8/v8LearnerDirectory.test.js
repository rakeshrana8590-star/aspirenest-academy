import { buildV8RealLearnerDirectory } from "./v8LearnerDirectory";

describe("V8 real learner directory", () => {
  test("merges users, students and profiles by UID while excluding exact staff accounts", () => {
    const learners = buildV8RealLearnerDirectory({
      users: [
        { id: "uid-student", email: "student@example.com", name: "Student User", planType: "FREE" },
        { id: "uid-admin", email: "aspirenestplatform@gmail.com", name: "Admin" },
        { id: "uid-mentor", email: "dr.varshamaru@gmail.com", name: "Mentor" },
      ],
      students: [
        { id: "uid-student", email: "student@example.com", fullName: "Real Student", progress: 42 },
      ],
      profiles: [
        { id: "uid-student", email: "student@example.com", username: "realstudent", mentorName: "Dr. Varsha Maru" },
      ],
    });

    expect(learners).toHaveLength(1);
    expect(learners[0]).toMatchObject({
      id: "uid-student",
      name: "Real Student",
      email: "student@example.com",
      username: "realstudent",
      progress: 42,
      mentor: "Dr. Varsha Maru",
    });
  });

  test("derives the highest active plan and exact active access count", () => {
    const learners = buildV8RealLearnerDirectory({
      users: [{ id: "uid-1", email: "one@example.com", fullName: "One Learner", planType: "BASIC" }],
      accessRecords: [
        { id: "a1", uid: "uid-1", status: "active", scopeType: "item" },
        { id: "a2", uid: "uid-1", status: "active", scopeType: "plan", planCode: "PREMIUM" },
        { id: "a3", uid: "uid-1", status: "revoked", scopeType: "item" },
      ],
    });

    expect(learners[0].plan).toBe("PREMIUM");
    expect(learners[0].accessCount).toBe(2);
    expect(learners[0].status).toBe("Active");
  });


  test("keeps the highest valid progress across merged sources and ignores blank placeholders", () => {
    const learners = buildV8RealLearnerDirectory({
      users: [
        { id: "uid-progress", email: "progress@example.com", progress: "", overallProgress: 18 },
      ],
      students: [
        { id: "uid-progress", email: "progress@example.com", progress: 72 },
      ],
      profiles: [
        { id: "uid-progress", email: "progress@example.com", profileCompletion: 60 },
      ],
    });

    expect(learners).toHaveLength(1);
    expect(learners[0].progress).toBe(72);
  });

  test("clamps projected progress to the supported 0 to 100 range", () => {
    const high = buildV8RealLearnerDirectory({
      users: [{ id: "uid-high", email: "high@example.com", progress: 145 }],
    });
    const low = buildV8RealLearnerDirectory({
      users: [{ id: "uid-low", email: "low@example.com", progress: -20 }],
    });

    expect(high[0].progress).toBe(100);
    expect(low[0].progress).toBe(0);
  });
  test("uses email fallback identity without creating duplicate learner rows", () => {
    const learners = buildV8RealLearnerDirectory({
      users: [{ email: "same@example.com", name: "First" }],
      students: [{ normalizedEmail: "SAME@example.com", fullName: "Final Name" }],
      profiles: [{ email: "same@example.com", planType: "PREMIUM" }],
    });

    expect(learners).toHaveLength(1);
    expect(learners[0]).toMatchObject({
      name: "Final Name",
      email: "same@example.com",
      plan: "PREMIUM",
    });
  });
});

describe("V8 canonical identity consolidation", () => {
  test("consolidates same normalized email across different historical UIDs", () => {
    const learners = buildV8RealLearnerDirectory({
      users: [
        { id: "auth-uid", uid: "auth-uid", email: "1990amala@gmail.com", name: "Amala" },
      ],
      students: [
        { id: "legacy-student-uid", uid: "legacy-student-uid", email: "1990AMALA@gmail.com", fullName: "1990amala" },
      ],
      profiles: [
        { id: "profile-uid", uid: "profile-uid", normalizedEmail: "1990amala@gmail.com", username: "1990amala" },
      ],
      accessRecords: [
        { id: "grant-legacy", studentUid: "legacy-student-uid", status: "active", planType: "PREMIUM" },
      ],
    });

    expect(learners).toHaveLength(1);
    expect(learners[0].uid).toBe("auth-uid");
    expect(learners[0].uidAliases).toEqual(
      expect.arrayContaining(["auth-uid", "legacy-student-uid", "profile-uid"])
    );
    expect(learners[0]).toMatchObject({
      email: "1990amala@gmail.com",
      username: "1990amala",
      plan: "PREMIUM",
      accessCount: 1,
    });
  });

  test("excludes exact Admin and Mentor identities even when duplicate records use different UIDs", () => {
    const learners = buildV8RealLearnerDirectory({
      users: [
        { id: "admin-auth", email: "aspirenestplatform@gmail.com" },
        { id: "mentor-auth", email: "dr.varshamaru@gmail.com" },
      ],
      students: [
        { id: "admin-legacy", email: "ASPIRENESTPLATFORM@gmail.com" },
        { id: "mentor-legacy", email: "DR.VARSHAMARU@gmail.com" },
        { id: "real-student", email: "student@gmail.com" },
      ],
    });

    expect(learners).toHaveLength(1);
    expect(learners[0].email).toBe("student@gmail.com");
  });
});
