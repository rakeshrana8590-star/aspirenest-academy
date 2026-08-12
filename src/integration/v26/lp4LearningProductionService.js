"use strict";

const METHOD_POLICIES = Object.freeze({
  "archiveMockTest": {
    "action": "ADMIN_ARCHIVE",
    "collections": [
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "archiveNote": {
    "action": "ADMIN_ARCHIVE",
    "collections": [
      "contentItems",
      "learningTexts"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "assignRoadmap": {
    "action": "ASSIGNMENT_ONLY",
    "collections": [
      "mentorAssignments"
    ],
    "idempotency": true,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "cancelLiveSession": {
    "action": "ADMIN_CANCEL",
    "collections": [
      "mentorLiveSessions",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "createLiveProviderSession": {
    "action": "ADMIN_PROVIDER_CREATE",
    "collections": [
      "mentorLiveSessions"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "createLiveReplayDraft": {
    "action": "ADMIN_REPLAY_DRAFT",
    "collections": [
      "mentorLiveSessions",
      "contentItems",
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "downloadVideoAttachment": {
    "action": "DOWNLOAD",
    "collections": [
      "protectedContentAssets"
    ],
    "idempotency": false,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "duplicateMockTest": {
    "action": "ADMIN_DUPLICATE",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "exportMockTest": {
    "action": "ADMIN_EXPORT",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": false,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "importMockQuestions": {
    "action": "ADMIN_IMPORT",
    "collections": [
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "importNoteContent": {
    "action": "ADMIN_IMPORT",
    "collections": [
      "learningTexts",
      "authoringVersions"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "loadCurrentAffairsReader": {
    "action": "READ",
    "collections": ["lp4ResourceRecords", "learningTexts"],
    "idempotency": false,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "loadProtectedVideo": {
    "action": "WATCH",
    "collections": ["protectedContentAssets"],
    "idempotency": false,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "loadStudentCourses": {
    "action": "DISCOVER",
    "collections": ["contentItems", "studentLearning"],
    "idempotency": false,
    "owner": "lp4LearningStateService",
    "phase": "4.7"
  },
  "loadStudentRevisionHub": {
    "action": "DISCOVER",
    "collections": ["contentItems", "studentLearning", "studentLearningActions", "lp4ResourceRecords"],
    "idempotency": false,
    "owner": "lp4LearningStateService",
    "phase": "4.7"
  },
  "loadSubjectWorkspace": {
    "action": "DISCOVER",
    "collections": ["contentItems", "studentLearning"],
    "idempotency": false,
    "owner": "lp4LearningStateService",
    "phase": "4.7"
  },
  "loadCurrentAffairsSourceRegister": {
    "action": "ADMIN_READ",
    "collections": [
      "currentAffairs",
      "contentItems"
    ],
    "idempotency": false,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "loadMockAdminWorkspace": {
    "action": "ADMIN_READ",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": false,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "loadMockAttemptDraft": {
    "action": "ATTEMPT",
    "collections": [
      "mockAttempts"
    ],
    "idempotency": false,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "loadMockResults": {
    "action": "VIEW_RESULT",
    "collections": [
      "mockResults"
    ],
    "idempotency": false,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "loadMockTest": {
    "action": "ATTEMPT",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": false,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "loadNotesAdminWorkspace": {
    "action": "ADMIN_READ",
    "collections": [
      "contentItems",
      "learningTexts",
      "authoringVersions",
      "protectedContentAssets"
    ],
    "idempotency": false,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "loadRoadmapProgress": {
    "action": "READ_PROGRESS",
    "collections": [
      "studyRoadmapProgress"
    ],
    "idempotency": false,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "loadVideoAdminWorkspace": {
    "action": "ADMIN_READ",
    "collections": [
      "contentItems",
      "protectedContentAssets"
    ],
    "idempotency": false,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "loadVideoAnalytics": {
    "action": "ADMIN_ANALYTICS",
    "collections": [
      "studentLearning"
    ],
    "idempotency": false,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "pauseMockAttempt": {
    "action": "ATTEMPT",
    "collections": [
      "mockAttempts"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "processVideoAsset": {
    "action": "ADMIN_PROCESS",
    "collections": [
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "publishCurrentAffairs": {
    "action": "ADMIN_PUBLISH",
    "collections": [
      "currentAffairs",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "publishCurrentAffairsCorrection": {
    "action": "ADMIN_CORRECTION",
    "collections": [
      "currentAffairs",
      "accessAuditLogs"
    ],
    "idempotency": true,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "publishLive": {
    "action": "ADMIN_PUBLISH",
    "collections": [
      "mentorLiveSessions",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "publishMockTest": {
    "action": "ADMIN_PUBLISH",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "publishNote": {
    "action": "ADMIN_PUBLISH",
    "collections": [
      "learningTexts",
      "authoringVersions",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "publishRoadmap": {
    "action": "ADMIN_PUBLISH",
    "collections": [
      "studyRoadmaps",
      "studyRoadmapDays",
      "studyRoadmapResourceLinks",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "publishVideo": {
    "action": "ADMIN_PUBLISH",
    "collections": [
      "contentItems",
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "recordAttempt": {
    "action": "SUBMIT",
    "collections": [
      "mockAttempts",
      "mockResults",
      "mockLeaderboard"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "recordLiveAttendance": {
    "action": "JOIN_ATTENDANCE",
    "collections": [
      "studentActivity"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "recordProgress": {
    "action": "PROGRESS",
    "collections": [
      "studentLearning",
      "studentActivity"
    ],
    "idempotency": true,
    "owner": "lp4LearningStateService",
    "phase": "4.7"
  },
  "recordRoadmapProgress": {
    "action": "READ_PROGRESS",
    "collections": [
      "studyRoadmapProgress"
    ],
    "idempotency": true,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "recordStudyAction": {
    "action": "STUDY_ACTION",
    "collections": [
      "studentLearning",
      "annotations",
      "bookmarks",
      "flashcards",
      "revisionQueue",
      "masteryProgress"
    ],
    "idempotency": true,
    "owner": "lp4LearningStateService",
    "phase": "4.1+4.4"
  },
  "rescheduleRoadmap": {
    "action": "READ_PROGRESS",
    "collections": [
      "studyRoadmapProgress"
    ],
    "idempotency": true,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "resolveLiveJoin": {
    "action": "JOIN",
    "collections": [
      "mentorLiveSessions",
      "contentItems"
    ],
    "idempotency": false,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "resolveProtectedVideo": {
    "action": "WATCH",
    "collections": [
      "contentItems",
      "protectedContentAssets"
    ],
    "idempotency": false,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "restoreNote": {
    "action": "ADMIN_RESTORE",
    "collections": [
      "contentItems",
      "learningTexts"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "resumeMockAttempt": {
    "action": "ATTEMPT",
    "collections": [
      "mockAttempts"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "saveCurrentAffairs": {
    "action": "ADMIN_WRITE",
    "collections": [
      "currentAffairs",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "saveCurrentAffairsPages": {
    "action": "ADMIN_WRITE",
    "collections": [
      "currentAffairs",
      "learningTexts",
      "authoringVersions"
    ],
    "idempotency": true,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "saveLive": {
    "action": "ADMIN_WRITE",
    "collections": [
      "mentorLiveSessions",
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "saveLiveReminder": {
    "action": "REMINDER",
    "collections": [
      "studentLearning"
    ],
    "idempotency": true,
    "owner": "lp4LearningStateService",
    "phase": "4.5"
  },
  "saveMockAttemptDraft": {
    "action": "ATTEMPT",
    "collections": [
      "mockAttempts"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "saveMockTest": {
    "action": "ADMIN_WRITE",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "saveNote": {
    "action": "ADMIN_WRITE",
    "collections": [
      "learningTexts",
      "authoringVersions"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "saveNoteProgress": {
    "action": "READ_PROGRESS",
    "collections": [
      "studentLearning"
    ],
    "idempotency": true,
    "owner": "lp4LearningStateService",
    "phase": "4.1"
  },
  "saveRoadmap": {
    "action": "ADMIN_WRITE",
    "collections": [
      "studyRoadmaps",
      "studyRoadmapDays",
      "studyRoadmapResourceLinks"
    ],
    "idempotency": true,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "saveVideo": {
    "action": "ADMIN_WRITE",
    "collections": [
      "contentItems",
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "saveVideoCaptions": {
    "action": "ADMIN_CAPTIONS",
    "collections": [
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "saveVideoProgress": {
    "action": "WATCH_PROGRESS",
    "collections": [
      "studentLearning"
    ],
    "idempotency": true,
    "owner": "lp4LearningStateService",
    "phase": "4.4"
  },
  "saveVideoStudyAction": {
    "action": "STUDY_ACTION",
    "collections": [
      "studentLearning",
      "annotations",
      "bookmarks",
      "revisionQueue"
    ],
    "idempotency": true,
    "owner": "lp4LearningStateService",
    "phase": "4.4"
  },
  "unpublishNote": {
    "action": "ADMIN_UNPUBLISH",
    "collections": [
      "contentItems",
      "learningTexts"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "updateLiveProviderSession": {
    "action": "ADMIN_PROVIDER_UPDATE",
    "collections": [
      "mentorLiveSessions"
    ],
    "idempotency": true,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "updateMockResultPolicy": {
    "action": "ADMIN_RESULT_POLICY",
    "collections": [
      "contentItems"
    ],
    "idempotency": true,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "uploadNoteAsset": {
    "action": "ADMIN_UPLOAD",
    "collections": [
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "uploadVideoAsset": {
    "action": "ADMIN_UPLOAD",
    "collections": [
      "protectedContentAssets"
    ],
    "idempotency": true,
    "owner": "lp4VideoService",
    "phase": "4.4"
  },
  "validateCurrentAffairs": {
    "action": "ADMIN_VALIDATE",
    "collections": [
      "currentAffairs"
    ],
    "idempotency": false,
    "owner": "lp4CurrentAffairsService",
    "phase": "4.3"
  },
  "validateLive": {
    "action": "ADMIN_VALIDATE",
    "collections": [
      "mentorLiveSessions",
      "contentItems"
    ],
    "idempotency": false,
    "owner": "lp4LiveService",
    "phase": "4.5"
  },
  "validateMockTest": {
    "action": "ADMIN_VALIDATE",
    "collections": [
      "contentItems",
      "questionBank",
      "mockQuestions"
    ],
    "idempotency": false,
    "owner": "lp4MockService",
    "phase": "4.2"
  },
  "validateNote": {
    "action": "ADMIN_VALIDATE",
    "collections": [
      "learningTexts"
    ],
    "idempotency": false,
    "owner": "lp4NotesService",
    "phase": "4.1"
  },
  "validateRoadmap": {
    "action": "ADMIN_VALIDATE",
    "collections": [
      "studyRoadmaps",
      "studyRoadmapDays",
      "studyRoadmapResourceLinks"
    ],
    "idempotency": false,
    "owner": "lp4RoadmapService",
    "phase": "4.6"
  },
  "validateVideo": {
    "action": "ADMIN_VALIDATE",
    "collections": [
      "contentItems",
      "protectedContentAssets"
    ],
    "idempotency": false,
    "owner": "lp4VideoService",
    "phase": "4.4"
  }
});

const TYPE_ACTION = Object.freeze({
  note: "READ", video: "WATCH", replay: "WATCH", test: "ATTEMPT",
  "current-affairs": "READ", roadmap: "OPEN", live: "JOIN"
});

const clean = (value = "") => String(value ?? "").trim();
const asObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const randomId = () => {
  if (typeof crypto !== "undefined" && crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `lp4-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const resourceIdFrom = (payload = {}) => {
  const p = asObject(payload);
  const nested = asObject(p.record);
  const test = asObject(p.test);
  return clean(p.resourceId || p.testId || p.sessionId || p.noteId || p.videoId || p.roadmapId || p.id || nested.resourceId || nested.id || test.resourceId || test.id || asObject(test.config).testId);
};

const preAuthorizeAction = (method, payload = {}) => {
  if (["loadMockTest","loadMockAttemptDraft","saveMockAttemptDraft","pauseMockAttempt","resumeMockAttempt","recordAttempt"].includes(method)) return "ATTEMPT";
  if (["resolveProtectedVideo","loadProtectedVideo","downloadVideoAttachment","saveVideoProgress","saveVideoStudyAction"].includes(method)) return "WATCH";
  if (["resolveLiveJoin","recordLiveAttendance","saveLiveReminder"].includes(method)) return "JOIN";
  if (method === "saveNoteProgress" || method === "loadCurrentAffairsReader") return "READ";
  if (method === "loadStudentRevisionHub" && resourceIdFrom(payload)) return TYPE_ACTION[clean(asObject(payload).resourceType || asObject(payload).type).toLowerCase()] || "OPEN";
  if (["recordRoadmapProgress","loadRoadmapProgress","rescheduleRoadmap"].includes(method)) return "OPEN";
  if (["recordProgress","recordStudyAction"].includes(method)) return TYPE_ACTION[clean(asObject(payload).resourceType || asObject(payload).type).toLowerCase()] || "OPEN";
  return "";
};

function createLp4LearningProductionService(deps = {}) {
  if (typeof deps.invokeLearningOperation !== "function") throw new TypeError("LP4 learning dependency missing: invokeLearningOperation");
  if (typeof deps.authorize !== "function") throw new TypeError("LP4 learning dependency missing: authorize");

  async function invoke(method, payload = {}, context = {}) {
    const policy = METHOD_POLICIES[method];
    if (!policy) return Object.freeze({ ok:false, code:"LP4_METHOD_NOT_ALLOWED", method });
    const input = asObject(payload);
    const resourceId = resourceIdFrom(input);
    const action = preAuthorizeAction(method, input);
    if (action && resourceId) {
      const decision = await deps.authorize({ resource: { resourceId, type: clean(input.resourceType || input.type) }, action });
      if (!decision || decision.allowed !== true) {
        return Object.freeze({
          ok:false, allowed:false, code:clean(decision && decision.code) || "LP4_AUTHORIZE_DENIED",
          method, resourceId, action, reasonCode:clean(decision && decision.reasonCode)
        });
      }
    }
    const operationId = clean(asObject(context).requestId) || randomId();
    const correlationId = clean(asObject(context).correlationId) || operationId;
    const idempotencyKey = clean(input.idempotencyKey || asObject(input._lp4).idempotencyKey) || `${method}:${resourceId || "global"}:${operationId}`;
    return deps.invokeLearningOperation({
      method, payload: input,
      meta: { operationId, correlationId, idempotencyKey, clientPhase:policy.phase, owner:policy.owner }
    });
  }

  return Object.freeze({ invoke });
}

module.exports = Object.freeze({ METHOD_POLICIES, TYPE_ACTION, resourceIdFrom, preAuthorizeAction, createLp4LearningProductionService });
