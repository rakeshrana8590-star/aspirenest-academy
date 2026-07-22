import {
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
} from "../access/accessConstants";

export const MENTOR_ROLE = "mentor";

export const MENTOR_PROFILE_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
});

export const MENTOR_STUDENT_LINK_STATUS = Object.freeze({
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
});

export const MENTOR_RESOURCE_ACCESS_STATES = Object.freeze({
  HAS_ACCESS: "HAS_ACCESS",
  ACCESS_EXPIRES_SOON: "ACCESS_EXPIRES_SOON",
  GRANT_REQUIRED: "GRANT_REQUIRED",
  NOT_ASSIGNABLE: "NOT_ASSIGNABLE",
  ACCESS_UNAVAILABLE: "ACCESS_UNAVAILABLE",
});

export const MENTOR_ASSIGNMENT_STATUS = Object.freeze({
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REVIEWED: "reviewed",
  CANCELLED: "cancelled",
});

export const MENTOR_ACCESS_REQUEST_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

export const MENTOR_RESOURCE_TYPES = Object.freeze({
  NOTES: "notes",
  VIDEO: "video",
  LIVE: "live",
  MOCK_TEST: "mockTest",
  CURRENT_AFFAIRS: "currentAffairs",
  ROADMAP: "roadmap",
});

export const MENTOR_RESOURCE_ACCESS_MAP = Object.freeze({
  [MENTOR_RESOURCE_TYPES.NOTES]: Object.freeze({
    module: ACCESS_MODULE.NOTES,
    itemType: ACCESS_ITEM_TYPES.NOTES_PDF,
  }),
  [MENTOR_RESOURCE_TYPES.VIDEO]: Object.freeze({
    module: ACCESS_MODULE.VIDEO,
    itemType: ACCESS_ITEM_TYPES.VIDEO,
  }),
  [MENTOR_RESOURCE_TYPES.LIVE]: Object.freeze({
    module: ACCESS_MODULE.VIDEO,
    itemType: ACCESS_ITEM_TYPES.VIDEO,
  }),
  [MENTOR_RESOURCE_TYPES.MOCK_TEST]: Object.freeze({
    module: ACCESS_MODULE.MOCK_TEST,
    itemType: ACCESS_ITEM_TYPES.MOCK_TEST,
  }),
  [MENTOR_RESOURCE_TYPES.CURRENT_AFFAIRS]: Object.freeze({
    module: ACCESS_MODULE.CURRENT_AFFAIRS,
    itemType: ACCESS_ITEM_TYPES.CURRENT_AFFAIRS_PDF,
  }),
  [MENTOR_RESOURCE_TYPES.ROADMAP]: Object.freeze({
    module: ACCESS_MODULE.ROADMAP,
    itemType: ACCESS_ITEM_TYPES.ROADMAP,
  }),
});
