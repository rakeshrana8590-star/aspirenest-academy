import { applyAspireNestDefaultMentorPolicy } from "./v8DefaultMentorPolicy";

describe("V8 default mentor relationship policy", () => {
  test("assigns all current learners to Dr. Varsha and counts them once", () => {
    const result = applyAspireNestDefaultMentorPolicy({
      learners: [
        { id: "u1", uid: "u1", email: "one@gmail.com", mentor: "Unassigned" },
        { id: "u2", uid: "u2", email: "two@gmail.com", mentor: "Unassigned" },
      ],
      mentors: [
        { id: "m1", uid: "m1", name: "Dr. Varsha Maru", email: "dr.varshamaru@gmail.com", learners: 0 },
      ],
    });

    expect(result.learners.map((item) => item.mentor)).toEqual([
      "Dr. Varsha Maru",
      "Dr. Varsha Maru",
    ]);
    expect(result.mentors[0].learners).toBe(2);
    expect(result.missingRelationshipLearners).toHaveLength(2);
  });

  test("recognizes an existing mentor link as persisted", () => {
    const result = applyAspireNestDefaultMentorPolicy({
      learners: [{ id: "u1", uid: "u1", email: "one@gmail.com" }],
      mentors: [{ id: "m1", uid: "m1", email: "dr.varshamaru@gmail.com" }],
      mentorStudentLinks: [{ mentorUid: "m1", studentUid: "u1", status: "active" }],
    });

    expect(result.learners[0]).toMatchObject({
      mentorPersisted: true,
      mentorSource: "mentor_link",
      mentorUid: "m1",
    });
    expect(result.missingRelationshipLearners).toHaveLength(0);
  });
});
