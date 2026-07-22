import {
  buildMentorAccessRequestRecord,
  buildMentorAssignmentRecord,
  buildMentorStudentLinkId,
  validateMentorAssignmentInput,
} from "./mentorAssignmentContract";
import { MENTOR_RESOURCE_ACCESS_STATES } from "./mentorConstants";

const RESOURCE = {
  resourceId: "roadmap-1",
  resourceType: "roadmap",
  module: "roadmap",
  itemType: "roadmap",
  title: "60 Day AspirePath",
  canonicalRoute: "/ctet-tet/roadmaps/roadmap-1",
  requiredPlan: "PREMIUM",
};

describe("mentor assignment contract", () => {
  test("builds deterministic mentor-student link IDs", () => {
    expect(buildMentorStudentLinkId("mentor-1", "student-1")).toBe(
      "mentor-1_student-1"
    );
  });

  test("does not build a link without both UIDs", () => {
    expect(buildMentorStudentLinkId("mentor-1", "")).toBe("");
  });

  test("requires a mentor UID", () => {
    expect(
      validateMentorAssignmentInput({
        studentUid: "student-1",
        resource: RESOURCE,
        accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
      })
    ).toBe("Mentor UID is required.");
  });

  test("requires a student UID", () => {
    expect(
      validateMentorAssignmentInput({
        mentorUid: "mentor-1",
        resource: RESOURCE,
        accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
      })
    ).toBe("Student UID is required.");
  });

  test("requires exact resource identity", () => {
    expect(
      validateMentorAssignmentInput({
        mentorUid: "mentor-1",
        studentUid: "student-1",
        resource: { ...RESOURCE, resourceId: "" },
        accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
      })
    ).toBe("Resource ID is required.");
  });

  test("rejects external resource routes", () => {
    expect(
      validateMentorAssignmentInput({
        mentorUid: "mentor-1",
        studentUid: "student-1",
        resource: { ...RESOURCE, canonicalRoute: "https://example.com" },
        accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
      })
    ).toBe("A safe canonical route is required.");
  });

  test("does not assign when access is missing", () => {
    expect(
      validateMentorAssignmentInput({
        mentorUid: "mentor-1",
        studentUid: "student-1",
        resource: RESOURCE,
        accessState: MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED,
      })
    ).toBe("Verified student access is required before assignment.");
  });

  test("requires a matched entitlement proof for protected content", () => {
    expect(
      validateMentorAssignmentInput({
        mentorUid: "mentor-1",
        studentUid: "student-1",
        resource: RESOURCE,
        accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
      })
    ).toBe("A matched entitlement proof is required for protected content.");
  });

  test("builds an assignment without changing commercial access", () => {
    const assignment = buildMentorAssignmentRecord({
      assignmentId: "assignment-1",
      mentorUid: "mentor-1",
      studentUid: "student-1",
      resource: RESOURCE,
      accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
      matchedGrantId: "grant-roadmap-1",
      objective: "Complete Day 1",
    });

    expect(assignment.status).toBe("assigned");
    expect(assignment).not.toHaveProperty("planType");
    expect(assignment).not.toHaveProperty("studentAccess");
    expect(assignment.matchedGrantId).toBe("grant-roadmap-1");
  });

  test("creates a pending exact access request", () => {
    const request = buildMentorAccessRequestRecord({
      requestId: "request-1",
      mentorUid: "mentor-1",
      studentUid: "student-1",
      resource: RESOURCE,
      reason: "Required for the current roadmap task",
    });

    expect(request.status).toBe("pending");
    expect(request.resourceId).toBe("roadmap-1");
    expect(request.accessId).toBeNull();
  });

  test("access requests never create broad plan grants", () => {
    const request = buildMentorAccessRequestRecord({
      requestId: "request-1",
      mentorUid: "mentor-1",
      studentUid: "student-1",
      resource: RESOURCE,
    });

    expect(request).not.toHaveProperty("planType");
    expect(request).not.toHaveProperty("scopeType");
    expect(request).not.toHaveProperty("itemIds");
  });
});
