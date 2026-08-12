import {
  MENTOR_ASSIGNMENT_STATUS,
  MENTOR_RESOURCE_ACCESS_STATES,
} from "./mentorConstants";
import { isSafeMentorRoute } from "./mentorAccessModel";

const cleanString = (value = "") => String(value ?? "").trim();

const VALID_ASSIGNMENT_ACCESS_STATES = new Set([
  MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
  MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON,
]);

export const buildMentorStudentLinkId = (mentorUid = "", studentUid = "") => {
  const mentor = cleanString(mentorUid);
  const student = cleanString(studentUid);
  if (!mentor || !student) return "";
  return `${mentor}_${student}`;
};

export const validateMentorAssignmentInput = ({
  mentorUid = "",
  studentUid = "",
  resource = {},
  accessState = "",
  matchedGrantId = "",
  dueAt = null,
  objective = "",
} = {}) => {
  if (!cleanString(mentorUid)) return "Mentor UID is required.";
  if (!cleanString(studentUid)) return "Student UID is required.";
  if (!cleanString(resource.resourceId)) return "Resource ID is required.";
  if (!cleanString(resource.resourceType)) return "Resource type is required.";
  if (!cleanString(resource.module)) return "Resource module is required.";
  if (!cleanString(resource.itemType)) return "Resource item type is required.";
  if (!cleanString(resource.title)) return "Resource title is required.";
  if (!isSafeMentorRoute(resource.canonicalRoute)) {
    return "A safe canonical route is required.";
  }
  if (!VALID_ASSIGNMENT_ACCESS_STATES.has(accessState)) {
    return "Verified student access is required before assignment.";
  }
  const requiredPlan = cleanString(resource.requiredPlan).toUpperCase() || "FREE";
  if (requiredPlan !== "FREE" && !cleanString(matchedGrantId)) {
    return "A matched entitlement proof is required for protected content.";
  }
  if (cleanString(objective).length > 1000) {
    return "Assignment objective is too long.";
  }
  if (dueAt && Number.isNaN(new Date(dueAt).getTime())) {
    return "Due date is invalid.";
  }
  return "";
};

export const buildMentorAssignmentRecord = ({
  assignmentId = "",
  mentorUid = "",
  studentUid = "",
  studentName = "",
  resource = {},
  accessState = "",
  matchedGrantId = "",
  dueAt = null,
  objective = "",
} = {}) => {
  const error = validateMentorAssignmentInput({
    mentorUid,
    studentUid,
    resource,
    accessState,
    matchedGrantId,
    dueAt,
    objective,
  });

  if (error) throw new Error(error);

  return {
    assignmentId: cleanString(assignmentId),
    mentorUid: cleanString(mentorUid),
    studentUid: cleanString(studentUid),
    studentName: cleanString(studentName),
    resourceId: cleanString(resource.resourceId),
    resourceType: cleanString(resource.resourceType),
    moduleKey: cleanString(resource.module),
    itemType: cleanString(resource.itemType),
    title: cleanString(resource.title),
    canonicalRoute: cleanString(resource.canonicalRoute),
    requiredPlan: cleanString(resource.requiredPlan).toUpperCase() || "FREE",
    accessState,
    matchedGrantId: cleanString(matchedGrantId),
    status: MENTOR_ASSIGNMENT_STATUS.ASSIGNED,
    dueAt: dueAt || null,
    objective: cleanString(objective),
    completedAt: null,
    reviewedAt: null,
    feedbackCount: 0,
  };
};

export const buildMentorAccessRequestRecord = ({
  requestId = "",
  mentorUid = "",
  studentUid = "",
  resource = {},
  reason = "",
  requestedScope = "ITEM",
  requestTarget = "",
} = {}) => {
  if (!cleanString(mentorUid) || !cleanString(studentUid)) {
    throw new Error("Mentor and student UID are required.");
  }
  if (!cleanString(resource.resourceId) || !cleanString(resource.resourceType)) {
    throw new Error("Exact resource identity is required.");
  }
  if (!isSafeMentorRoute(resource.canonicalRoute)) {
    throw new Error("A safe canonical route is required.");
  }

  return {
    requestId: cleanString(requestId),
    mentorUid: cleanString(mentorUid),
    studentUid: cleanString(studentUid),
    resourceId: cleanString(resource.resourceId),
    resourceType: cleanString(resource.resourceType),
    moduleKey: cleanString(resource.module),
    itemType: cleanString(resource.itemType),
    title: cleanString(resource.title),
    canonicalRoute: cleanString(resource.canonicalRoute),
    status: "pending",
    reason: cleanString(reason).slice(0, 1000),
    requestedScope: cleanString(requestedScope).toUpperCase() || "ITEM",
    requestTarget: cleanString(requestTarget || resource.resourceId),
    accessId: null,
    resolvedAt: null,
    resolvedBy: null,
  };
};
