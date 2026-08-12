"use strict";

const { randomUUID, createHash } = require("node:crypto");

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
const ADMIN_ROLES = new Set(["admin","super_admin","owner"]);
const LOCKED_STATES = new Set(["draft","staged","unpublished","hidden","inactive","archived","locked","cancelled","canceled","expired","deleted","blocked"]);
const ACTIVE_ACCESS = new Set(["active","approved","paid","success","verified","live"]);
const PLAN_RANK = Object.freeze({FREE:0,BASIC:100,PREMIUM:200,MENTORSHIP:300});
const TYPE_BINDING = Object.freeze({
 note:{module:"notes",itemType:"notesPdf"}, video:{module:"video",itemType:"video"}, replay:{module:"video",itemType:"video"},
 test:{module:"mockTest",itemType:"mockTest"}, "current-affairs":{module:"currentAffairs",itemType:"currentAffairsPdf"},
 roadmap:{module:"roadmap",itemType:"roadmap"}, live:{module:"video",itemType:"video"}
});
const clean=(v="")=>String(v??"").trim();
const lower=(v="")=>clean(v).toLowerCase();
const upper=(v="")=>clean(v).toUpperCase();
const obj=(v)=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const safeClone=(v)=>JSON.parse(JSON.stringify(v??null));
const hash=(v)=>createHash("sha256").update(String(v)).digest("hex");

function publicResourceMetadata(record={},type="",resourceId="",status="",version=1) {
  const r=obj(record);
  const keep=["title","subtitle","description","subject","subjectId","requiredPlan","planType","planCode","moduleKey","module","access","canonicalRoute","duration","durationMinutes","tags","monthId","category","thumbnail","cover","visibility","downloadEnabled","startAt","endAt","timezone","mentorName","joinWindowMinutes","lateJoinMinutes","replayResourceId","hasProtectedAsset"];
  const out={id:resourceId,resourceId,resourceType:type,status,publishState:status,version,section:type==="note"?"notes":type==="current-affairs"?"currentAffairs":type};
  for(const key of keep) if(r[key]!==undefined) out[key]=safeClone(r[key]);
  return out;
}

function resourceIdFrom(payload={}) { const p=obj(payload),r=obj(p.record),t=obj(p.test),c=obj(t.config); return clean(p.resourceId||p.testId||p.sessionId||p.noteId||p.videoId||p.roadmapId||p.id||r.resourceId||r.id||t.resourceId||t.id||c.testId); }
function inferType(record={}, method="") {
 const r=obj(record), token=lower(r.resourceType||r.type||r.section||r.moduleKey||r.module);
 if (["note","notes"].includes(token)) return "note"; if (["video","videos"].includes(token)) return "video"; if (["test","mocktest","mock-test","mocktests"].includes(token)) return "test";
 if (["current-affairs","currentaffairs","current_affairs"].includes(token)) return "current-affairs"; if (["roadmap","roadmaps"].includes(token)) return "roadmap"; if (["live","liveclass","liveclasses"].includes(token)) return "live"; if (token==="replay") return "replay";
 if (/Note/.test(method)) return "note"; if (/Mock|Attempt|Result/.test(method)) return "test"; if (/CurrentAffairs/.test(method)) return "current-affairs"; if (/Roadmap/.test(method)) return "roadmap"; if (/Live/.test(method)) return "live"; if (/Video/.test(method)) return "video"; return "";
}
function canonicalCollection(type) { return type==="roadmap"?"studyRoadmaps":type==="live"||type==="replay"?"mentorLiveSessions":"contentItems"; }
function statusOf(record={}) { return lower(record.publishState||record.publicationStatus||record.status||record.state); }
function requiredPlanOf(record={}) { return upper(record.requiredPlan||record.planType||record.access||record.plan||"FREE") || "FREE"; }
function isPublished(record={}) { const s=statusOf(record); return !s || !LOCKED_STATES.has(s); }
function activeAt(row, nowMs) {
 const status=lower(row.status||"active"); if (!ACTIVE_ACCESS.has(status)) return false;
 const toMs=(x)=>{ if(!x)return 0;if(typeof x==="number")return x;if(typeof x==="string")return Date.parse(x)||0;if(typeof x.toMillis==="function")return x.toMillis();if(typeof x.seconds==="number")return x.seconds*1000;return 0; };
 const from=toMs(row.accessFrom), until=toMs(row.accessUntil); if(from&&nowMs<from)return false; if(!row.noExpiry&&!row.untilManualChange&&until&&nowMs>=until)return false; return true;
}
function entitlementMatches(row, resource, nowMs) {
 if(!activeAt(row,nowMs))return false; const type=inferType(resource), bind=TYPE_BINDING[type]||{}, id=clean(resource.resourceId||resource.id), scope=lower(row.scopeType||"item"), req=requiredPlanOf(resource);
 if(scope==="item") return clean(row.itemId)===id;
 if(scope==="bundle") return Array.isArray(row.itemIds)&&row.itemIds.map(clean).includes(id);
 if(scope==="module") return clean(row.module)===clean(resource.moduleKey||resource.module||bind.module) && (PLAN_RANK[upper(row.planType||row.planCode||"FREE")]??-1)>=(PLAN_RANK[req]??999999);
 if(scope==="plan") return (PLAN_RANK[upper(row.planType||row.planCode||"FREE")]??-1)>=(PLAN_RANK[req]??999999);
 return false;
}
function validateRecord(method,payload={}) {
 const p=obj(payload), record=obj(p.record||p.test); const errors=[]; const id=resourceIdFrom(p); if(!id) errors.push("resourceId");
 if(["publishNote","publishMockTest","publishCurrentAffairs","publishVideo","publishRoadmap","publishLive"].includes(method)) { if(!clean(record.title))errors.push("title"); }
 if(method==="publishCurrentAffairs") { const sources=Array.isArray(record.sources)?record.sources:[]; if(!sources.length||sources.some(s=>s.verified!==true))errors.push("verifiedSources"); }
 return Object.freeze({ok:errors.length===0,errors});
}

function createLp4LearningAuthority(deps={}) {
 const firestore=deps.firestore; if(!firestore||typeof firestore.collection!=="function") throw new TypeError("LP4 authority requires Firestore");
 const storage=deps.storage||null; const now=typeof deps.now==="function"?deps.now:()=>Date.now(); const idFactory=typeof deps.idFactory==="function"?deps.idFactory:()=>randomUUID();
 const serverStamp=()=>deps.serverTimestamp?deps.serverTimestamp():new Date(now());

 async function actor(auth) {
   if(!auth||!clean(auth.uid)) throw Object.assign(new Error("Sign in is required."),{lp4Code:"UNAUTHENTICATED"});
   const uid=clean(auth.uid), email=lower(auth.token&&auth.token.email); let role=lower(auth.token&&auth.token.role); let accountStatus=lower(auth.token&&auth.token.accountStatus);
   try { const snap=await firestore.collection("roleAuthorities").doc(uid).get(); if(snap.exists){ const d=obj(snap.data()); role=lower(d.role||d.activeRole||role); accountStatus=lower(d.accountStatus||d.status||accountStatus); } } catch(_){}
   if(["suspended","blocked","disabled","revoked"].includes(accountStatus)) throw Object.assign(new Error("Account is restricted."),{lp4Code:"FORBIDDEN"});
   return {uid,email,role:role||"student",isAdmin:ADMIN_ROLES.has(role)||email==="aspirenestplatform@gmail.com"};
 }
 async function canonical(resourceId,method,payload={}) {
   const hint=inferType(obj(payload).record||obj(payload).test||payload,method);
   const protectedSnap=await firestore.collection("lp4ResourceRecords").doc(resourceId).get();
   if(protectedSnap.exists){const d={id:protectedSnap.id,resourceId:protectedSnap.id,sourceCollection:"lp4ResourceRecords",...obj(protectedSnap.data())};d.resourceType=inferType(d,method)||hint;return d;}
   const candidates=hint?[canonicalCollection(hint)]:["contentItems","studyRoadmaps","mentorLiveSessions","experienceEvents","currentAffairs"];
   for(const collection of [...new Set(candidates)]){ const snap=await firestore.collection(collection).doc(resourceId).get(); if(snap.exists){ const d={id:snap.id,resourceId:snap.id,sourceCollection:collection,...obj(snap.data())}; d.resourceType=inferType(d,method)||hint; return d; } }
   return null;
 }
 async function evidence(uid) { const snap=await firestore.collection("studentEntitlements").doc(uid).collection("items").limit(512).get(); return snap.docs.map(d=>({id:d.id,...obj(d.data())})); }
 async function requireEntitlement(a,resource) {
   if(a.isAdmin)return; if(!resource||!isPublished(resource)) throw Object.assign(new Error("Resource is unavailable."),{lp4Code:"FORBIDDEN"});
   if(requiredPlanOf(resource)==="FREE")return; const rows=await evidence(a.uid); if(!rows.some(r=>entitlementMatches(r,resource,now()))) throw Object.assign(new Error("Access is required."),{lp4Code:"FORBIDDEN"});
 }
 async function audit(a,method,resourceId,meta,outcome,detail={}) {
   const auditId=idFactory(); await firestore.collection("lp4AuditLogs").doc(auditId).set({auditId,actorUid:a.uid,actorRole:a.role,method,resourceId:resourceId||"",correlationId:clean(meta.correlationId),operationId:clean(meta.operationId),outcome,detail:safeClone(detail),serverUpdatedAt:serverStamp()}); return auditId;
 }
 async function idempotent(a,method,resourceId,meta,fn) {
   const key=clean(meta.idempotencyKey); if(!key) throw Object.assign(new Error("Idempotency key is required."),{lp4Code:"INVALID_REQUEST"});
   const id=hash(`${a.uid}|${method}|${key}`), ref=firestore.collection("lp4Idempotency").doc(id), t=now(), leaseMs=120000;
   const claim=await firestore.runTransaction(async tx=>{
     const prev=await tx.get(ref), data=prev.exists?obj(prev.data()):{};
     if(data.status==="done"&&data.result)return {kind:"replay",result:{...obj(data.result),replayed:true}};
     if(data.status==="running"&&Number(data.claimedAtMs||0)>t-leaseMs)throw Object.assign(new Error("Operation is already running."),{lp4Code:"CONFLICT"});
     tx.set(ref,{ownerUid:a.uid,method,resourceId,keyHash:hash(key),operationId:clean(meta.operationId),status:"running",claimedAtMs:t,updatedAt:serverStamp()},{merge:false});
     return {kind:"run"};
   });
   if(claim.kind==="replay")return claim.result;
   try{
     const result=await fn({idempotencyDocumentId:id});
     await ref.set({status:"done",result:safeClone(result),completedAtMs:now(),updatedAt:serverStamp()},{merge:true});
     return result;
   }catch(error){
     try{await ref.set({status:"failed",failureCode:clean(error&&error.lp4Code)||"ERROR",updatedAt:serverStamp()},{merge:true});}catch(_){}
     throw error;
   }
 }
 function stableOperationId(a,method,meta,suffix="item"){return hash(`${a.uid}|${method}|${clean(meta.idempotencyKey)}|${suffix}`).slice(0,48);}
 function envelope(method,resourceId,meta,auditId,state={}) { return Object.freeze({ok:true,resourceId:resourceId||"",resourceType:clean(state.resourceType),ownerUid:clean(state.ownerUid),operationId:clean(meta.operationId),idempotencyKey:clean(meta.idempotencyKey),correlationId:clean(meta.correlationId),auditId,serverUpdatedAt:new Date(now()).toISOString(),version:Number(state.version||1),safeReasonCode:"OK",state:safeClone(state)}); }
 async function listCollection(name,limit=500) { const snap=await firestore.collection(name).limit(limit).get(); return snap.docs.map(d=>({id:d.id,...obj(d.data())})); }
 async function writeCanonical(method,payload,a,meta,opts={}) {
   const p=obj(payload), record=safeClone(p.record||p.test||p), resourceId=resourceIdFrom(p); if(!resourceId) throw Object.assign(new Error("Resource id is required."),{lp4Code:"INVALID_REQUEST"}); const type=inferType(record,method);
   const fullRef=firestore.collection("lp4ResourceRecords").doc(resourceId); const current=await fullRef.get(); const before=current.exists?obj(current.data()):{};
   const validation=validateRecord(method,p); if(method.startsWith("publish")&&!validation.ok) throw Object.assign(new Error("Validation failed."),{lp4Code:"FAILED_PRECONDITION",details:validation});
   let nextStatus=clean(record.status||before.status||"Draft"); if(method.startsWith("publish"))nextStatus="Published"; if(method.startsWith("archive")||method==="cancelLiveSession")nextStatus=method==="cancelLiveSession"?"Cancelled":"Archived"; if(method==="unpublishNote")nextStatus="Unpublished"; if(method==="restoreNote")nextStatus="Draft";
   const version=Math.max(Number(before.version||0),Number(record.version||0))+(method.startsWith("publish")?1:0);
   const full={...before,...record,id:resourceId,resourceId,resourceType:type||before.resourceType,status:nextStatus,publishState:nextStatus,version,updatedBy:a.uid,serverUpdatedAt:serverStamp()};
   await fullRef.set(full,{merge:true});
   const metadata=publicResourceMetadata(full,type,resourceId,nextStatus,version);
   await firestore.collection(canonicalCollection(type)).doc(resourceId).set({...metadata,serverUpdatedAt:serverStamp()},{merge:false});
   if(["note","current-affairs"].includes(type) && Array.isArray(record.pages)) await firestore.collection("learningTexts").doc(resourceId).set({resourceId,pages:record.pages,version,status:nextStatus,serverUpdatedAt:serverStamp()},{merge:true});
   if(type==="current-affairs") {
     await firestore.collection("currentAffairs").doc(resourceId).set({...metadata,serverUpdatedAt:serverStamp()},{merge:false});
     const sources=Array.isArray(record.sources)?record.sources:[];
     for(const [index,source] of sources.entries()){const sourceId=clean(source.id)||hash(`${resourceId}|source|${index}|${clean(source.url||source.title)}`).slice(0,40);await firestore.collection("currentAffairsSources").doc(sourceId).set({sourceId,resourceId,url:clean(source.url),title:clean(source.title),verified:source.verified===true,verifiedBy:a.uid,serverUpdatedAt:serverStamp()},{merge:true});}
   }
   return {resourceId,resourceType:type,version,status:nextStatus};
 }

 async function operation(auth,request={}) {
   const r=obj(request), method=clean(r.method), payload=obj(r.payload), meta=obj(r.meta), policy=METHOD_POLICIES[method]; if(!policy) throw Object.assign(new Error("Method is not allowed."),{lp4Code:"INVALID_REQUEST"}); const a=await actor(auth); const resourceId=resourceIdFrom(payload);
   if(policy.action.startsWith("ADMIN_")&&!a.isAdmin) throw Object.assign(new Error("Admin access is required."),{lp4Code:"FORBIDDEN"}); if(method==="assignRoadmap"&&!a.isAdmin&&a.role!=="mentor") throw Object.assign(new Error("Mentor or Admin required."),{lp4Code:"FORBIDDEN"});
   let resource=null; if(resourceId && !policy.action.startsWith("ADMIN_")) { resource=await canonical(resourceId,method,payload); const exactDiscovery=["loadStudentCourses","loadSubjectWorkspace","loadStudentRevisionHub"].includes(method); if(exactDiscovery || ["READ","OPEN","ATTEMPT","SUBMIT","VIEW_RESULT","WATCH","DOWNLOAD","JOIN","JOIN_ATTENDANCE","PROGRESS","READ_PROGRESS","WATCH_PROGRESS","STUDY_ACTION","REMINDER"].includes(policy.action)) await requireEntitlement(a,resource); }

   const run=async()=>{
     if(method==="loadNotesAdminWorkspace") return {records:(await listCollection("lp4ResourceRecords")).filter(x=>inferType(x)==="note")};
     if(method==="loadMockAdminWorkspace") return {tests:(await listCollection("lp4ResourceRecords")).filter(x=>inferType(x)==="test"),questionBank:await listCollection("questionBank")};
     if(method==="loadVideoAdminWorkspace") return {records:(await listCollection("lp4ResourceRecords")).filter(x=>["video","replay"].includes(inferType(x)))};
     if(method==="loadCurrentAffairsSourceRegister") return {sources:await listCollection("currentAffairsSources"),records:(await listCollection("lp4ResourceRecords")).filter(x=>inferType(x)==="current-affairs")};
     if(method==="loadVideoAnalytics") return {rows:await listCollection("studentLearning",1000)};
     if(method==="loadMockTest") { if(!resource)throw Object.assign(new Error("Mock test not found."),{lp4Code:"NOT_FOUND"}); const test=resource.lp4Record||resource; let questions=Array.isArray(test.inlineQuestions)?test.inlineQuestions:[]; if(!questions.length&&Array.isArray(test.questionIds)){const all=await listCollection("questionBank",1000);const map=new Map(all.map(q=>[q.id,q]));questions=test.questionIds.map(id=>map.get(id)).filter(Boolean);} return {resourceId,questions:questions.map(q=>{const c={...q};delete c.answer;delete c.explanation;return c;}),config:obj(test.config)}; }
     if(method==="loadMockAttemptDraft") { let q=firestore.collection("mockAttempts").where("ownerUid","==",a.uid); const snap=await q.limit(100).get(); const rows=snap.docs.map(d=>({id:d.id,...obj(d.data())})).filter(x=>!resourceId||x.testId===resourceId).filter(x=>x.status!=="submitted"); rows.sort((x,y)=>Number(y.serverUpdatedAtMs||0)-Number(x.serverUpdatedAtMs||0)); return {attempt:rows[0]||null}; }
     if(method==="loadMockResults") { const snap=await firestore.collection("mockResults").where("ownerUid","==",a.uid).limit(100).get(); return {results:snap.docs.map(d=>({id:d.id,...obj(d.data())}))}; }
     if(method==="loadRoadmapProgress") { const snap=await firestore.collection("studyRoadmapProgress").where("ownerUid","==",a.uid).limit(200).get(); return {items:snap.docs.map(d=>({id:d.id,...obj(d.data())}))}; }
     if(method==="loadCurrentAffairsReader") { const full=resource||await canonical(resourceId,method,payload); if(!full)throw Object.assign(new Error("Current Affairs resource not found."),{lp4Code:"NOT_FOUND"}); const text=await firestore.collection("learningTexts").doc(resourceId).get(); const correctionSnap=await firestore.collection("currentAffairsCorrections").where("resourceId","==",resourceId).limit(200).get(); const corrections=correctionSnap.docs.map(d=>({id:d.id,...obj(d.data())})); return {resourceId,record:safeClone(full),pages:text.exists?safeClone(obj(text.data()).pages||[]):[],corrections:safeClone(corrections)}; }
     if(method==="loadProtectedVideo") { const assetId=clean(payload.assetId||payload.attachmentId); let asset=null; if(assetId){const s=await firestore.collection("protectedContentAssets").doc(assetId).get();asset=s.exists?obj(s.data()):null;} if(!asset){const snap=await firestore.collection("protectedContentAssets").where("resourceId","==",resourceId).limit(20).get();asset=snap.docs.map(d=>({id:d.id,...obj(d.data())}))[0]||null;} return {resourceId,asset:asset?{assetId:clean(asset.assetId||asset.id),kind:clean(asset.kind),status:clean(asset.status),captions:safeClone(asset.captions)}:null}; }
     if(["loadStudentCourses","loadSubjectWorkspace","loadStudentRevisionHub"].includes(method)) {
       if(resourceId){const full=resource||await canonical(resourceId,method,payload);if(!full)throw Object.assign(new Error("Resource not found."),{lp4Code:"NOT_FOUND"});const type=inferType(full,method);if(["note","current-affairs","roadmap"].includes(type)){const text=await firestore.collection("learningTexts").doc(resourceId).get();return {resourceId,record:safeClone(full),pages:text.exists?safeClone(obj(text.data()).pages||[]):[]};}}
       const p=obj(payload), query=lower(p.query), subject=clean(p.subject||p.subjectId), filter=upper(p.filter);
       const entitlementRows=await evidence(a.uid);
       let assignments=[];try{const snap=await firestore.collection("mentorAssignments").where("learnerUid","==",a.uid).limit(500).get();assignments=snap.docs.map(d=>obj(d.data()));}catch(_){}
       const assignedIds=new Set(assignments.map(x=>clean(x.resourceId)).filter(Boolean));
       const catalogSources=[];for(const collection of ["contentItems","studyRoadmaps","mentorLiveSessions","experienceEvents"]){for(const row of await listCollection(collection,1000))catalogSources.push({...row,sourceCollection:collection});}
       let catalog=catalogSources.filter(x=>isPublished(x)).map(x=>{const meta=publicResourceMetadata(x,inferType(x),clean(x.resourceId||x.id),clean(x.status||x.publishState||"Published"),Number(x.version||1));const free=requiredPlanOf(meta)==="FREE",allowed=free||a.isAdmin||entitlementRows.some(row=>entitlementMatches(row,meta,now()));return {...meta,sourceCollection:x.sourceCollection,accessState:allowed?"open":"locked",assigned:assignedIds.has(meta.resourceId)};});
       if(subject)catalog=catalog.filter(x=>clean(x.subject||x.subjectId)===subject);
       if(query)catalog=catalog.filter(x=>lower([x.title,x.subtitle,x.description,Array.isArray(x.tags)?x.tags.join(" "):""].join(" ")).includes(query));
       if(filter==="MY_ACCESS")catalog=catalog.filter(x=>x.accessState==="open");if(filter==="ASSIGNED")catalog=catalog.filter(x=>x.assigned);if(filter==="FREE")catalog=catalog.filter(x=>requiredPlanOf(x)==="FREE");
       const seen=new Set();catalog=catalog.filter(x=>x.resourceId&&!seen.has(x.resourceId)&&seen.add(x.resourceId));
       const learningSnap=await firestore.collection("studentLearning").where("ownerUid","==",a.uid).limit(1000).get(); const learning=learningSnap.docs.map(d=>({id:d.id,...obj(d.data())}));
       return {catalog,learning};
     }
     if(method.startsWith("validate")) return {validation:validateRecord(method,payload)};
     if(["saveNote","publishNote","unpublishNote","archiveNote","restoreNote","saveMockTest","publishMockTest","archiveMockTest","saveCurrentAffairs","publishCurrentAffairs","saveVideo","publishVideo","saveLive","publishLive","cancelLiveSession","saveRoadmap","publishRoadmap"].includes(method)) return writeCanonical(method,payload,a,meta);
     if(method==="duplicateMockTest") { if(!resourceId)throw Object.assign(new Error("Test id required."),{lp4Code:"INVALID_REQUEST"}); const src=await canonical(resourceId,method,payload); if(!src)throw Object.assign(new Error("Test not found."),{lp4Code:"NOT_FOUND"}); const nextId=clean(payload.newResourceId)||`${resourceId}-copy-${stableOperationId(a,method,meta,'copy').slice(0,10)}`; const record={...src,id:nextId,resourceId:nextId,status:"Draft",publishState:"Draft",version:1,resourceType:"test"};delete record.sourceCollection;await firestore.collection("lp4ResourceRecords").doc(nextId).set({...record,serverUpdatedAt:serverStamp()},{merge:false});await firestore.collection("contentItems").doc(nextId).set({...publicResourceMetadata(record,"test",nextId,"Draft",1),serverUpdatedAt:serverStamp()},{merge:false}); return {resourceId:nextId,resourceType:"test",version:1,status:"Draft"}; }
     if(method==="exportMockTest") { const src=await canonical(resourceId,method,payload); if(!src)throw Object.assign(new Error("Test not found."),{lp4Code:"NOT_FOUND"}); return {export:safeClone(src.lp4Record||src)}; }
     if(method==="importMockQuestions") { const qs=Array.isArray(payload.questions)?payload.questions:[]; if(qs.length>1000)throw Object.assign(new Error("Import too large."),{lp4Code:"INVALID_REQUEST"}); const batch=firestore.batch(); for(const [index,q] of qs.entries()){const id=clean(q.id)||stableOperationId(a,method,meta,`question-${index}`);batch.set(firestore.collection("questionBank").doc(id),{...safeClone(q),id,serverUpdatedAt:serverStamp()});} await batch.commit(); return {imported:qs.length}; }
     if(method==="updateMockResultPolicy") { const ref=firestore.collection("lp4ResourceRecords").doc(resourceId); await ref.set({resultsPolicy:safeClone(payload.resultsPolicy||payload.policy||payload),serverUpdatedAt:serverStamp()},{merge:true}); return {resourceId}; }
     if(["saveMockAttemptDraft","pauseMockAttempt","resumeMockAttempt","recordAttempt"].includes(method)) {
       const attemptId=clean(payload.attemptId)||clean(payload.id)||`${a.uid}-${resourceId}`; const ref=firestore.collection("mockAttempts").doc(attemptId); const prev=await ref.get(); const old=prev.exists?obj(prev.data()):{}; if(old.ownerUid&&old.ownerUid!==a.uid)throw Object.assign(new Error("Attempt owner mismatch."),{lp4Code:"FORBIDDEN"}); if(old.status==="submitted"&&method!=="recordAttempt")throw Object.assign(new Error("Attempt already submitted."),{lp4Code:"CONFLICT"});
       const test=resource||await canonical(resourceId,"loadMockTest",payload); const durationSeconds=Number(obj(test&&test.lp4Record||test).config?.durationMinutes||payload.durationSeconds/60||30)*60; const startedAtMs=Number(old.startedAtMs||now()); const serverRemaining=Math.max(0,durationSeconds-Math.floor((now()-startedAtMs)/1000)); let status=method==="pauseMockAttempt"?"paused":method==="resumeMockAttempt"?"active":"active";
       const base={...safeClone(payload),attemptId,testId:resourceId,ownerUid:a.uid,status,startedAtMs,durationSeconds,remainingSeconds:serverRemaining,serverUpdatedAtMs:now(),serverUpdatedAt:serverStamp()};
       if(method==="recordAttempt"&&clean(payload.action).toUpperCase()==="SUBMIT"){
         const tr=obj(test&&test.lp4Record||test), allQuestions=Array.isArray(tr.inlineQuestions)?tr.inlineQuestions:[]; let questions=allQuestions; if(!questions.length&&Array.isArray(tr.questionIds)){const all=await listCollection("questionBank",1000);const map=new Map(all.map(q=>[q.id,q]));questions=tr.questionIds.map(id=>map.get(id)).filter(Boolean);} const answers=obj(payload.answers); let score=0,correct=0,incorrect=0,unanswered=0,total=0; for(const q of questions){const marks=Number(q.positiveMarks||q.marks||1),neg=Number(q.negativeMarks||0);total+=marks;const selected=answers[q.id];if(selected===undefined){unanswered++;continue;}if(Number(selected)===Number(q.answer)){correct++;score+=marks;}else{incorrect++;score-=neg;}} score=Math.max(0,Number(score.toFixed(2))); const result={score,total,accuracy:total?Math.round(score/total*100):0,correct,incorrect,unanswered,answered:correct+incorrect,passed:score>=Number(obj(tr.config).passingMarks||0)}; base.status="submitted";base.submittedAtMs=now();base.result=result; await ref.set(base,{merge:true}); await firestore.collection("mockResults").doc(attemptId).set({attemptId,testId:resourceId,ownerUid:a.uid,result,released:obj(tr.config).resultPublishMode==="instant"||Boolean(obj(tr.resultsPolicy).released),reviewEnabled:Boolean(obj(tr.resultsPolicy).reviewEnabled),serverUpdatedAt:serverStamp()},{merge:true});await firestore.collection("studentLearning").doc(`${a.uid}_${resourceId}`).set({ownerUid:a.uid,resourceId,resourceType:"test",progress:100,cursor:{attemptId,stage:"review"},continueState:{attemptId,stage:"review"},recentAtMs:now(),serverUpdatedAtMs:now(),serverUpdatedAt:serverStamp()},{merge:true}); return {attemptId,testId:resourceId,status:"submitted",remainingSeconds:serverRemaining,result}; }
       await ref.set(base,{merge:true}); return {attemptId,testId:resourceId,status,remainingSeconds:serverRemaining};
     }
     if(["recordProgress","saveNoteProgress","saveVideoProgress"].includes(method)) { if(payload.mode==="load"){const snap=await firestore.collection("studentLearning").where("ownerUid","==",a.uid).limit(500).get();return {items:snap.docs.map(d=>({id:d.id,...obj(d.data())}))};} const id=`${a.uid}_${resourceId}`; const progress=Math.max(0,Math.min(100,Number(payload.progress)||0)); const patch={ownerUid:a.uid,resourceId,resourceType:inferType(resource||payload,method),progress,cursor:safeClone(payload.cursor||{readerMode:payload.readerMode||"",seconds:payload.seconds||0}),recentAtMs:now(),serverUpdatedAtMs:now(),serverUpdatedAt:serverStamp()}; if(typeof payload.saved==="boolean")patch.saved=payload.saved;if(payload.continueState!==undefined)patch.continueState=safeClone(payload.continueState);await firestore.collection("studentLearning").doc(id).set(patch,{merge:true}); return {resourceId,ownerUid:a.uid,progress,saved:patch.saved}; }
     if(["recordStudyAction","saveVideoStudyAction"].includes(method)) { const id=stableOperationId(a,method,meta,'study-action'); await firestore.collection("studentLearningActions").doc(id).set({id,ownerUid:a.uid,resourceId,resourceType:inferType(resource||payload,method),action:clean(payload.action),record:safeClone(payload.record),serverUpdatedAt:serverStamp()}); return {resourceId,ownerUid:a.uid,studyActionId:id}; }
     if(method==="saveLiveReminder") { const id=`${a.uid}_${resourceId}`,kind=lower(payload.kind||payload.mode||"reminder"),allowedKinds=new Set(["reminder","calendar","preparation","follow-up"]);if(!allowedKinds.has(kind))throw Object.assign(new Error("Unsupported live state kind."),{lp4Code:"INVALID_REQUEST"});const patch={ownerUid:a.uid,sessionId:resourceId,active:true,serverUpdatedAt:serverStamp()};patch[kind.replace("-","")]=true;await firestore.collection("liveReminders").doc(id).set(patch,{merge:true}); return {resourceId,ownerUid:a.uid,active:true,kind}; }
     if(method==="recordRoadmapProgress"||method==="rescheduleRoadmap") { const id=`${a.uid}_${resourceId}`,day=Math.max(1,Number(payload.day||payload.currentDay||1)),progress=Math.max(0,Math.min(100,Number(payload.progress)||0)); await firestore.collection("studyRoadmapProgress").doc(id).set({ownerUid:a.uid,resourceId,day,progress,rescheduleRequested:method==="rescheduleRoadmap",serverUpdatedAt:serverStamp()},{merge:true});await firestore.collection("studentLearning").doc(id).set({ownerUid:a.uid,resourceId,resourceType:"roadmap",progress,cursor:{day},continueState:{day},recentAtMs:now(),serverUpdatedAtMs:now(),serverUpdatedAt:serverStamp()},{merge:true}); return {resourceId,ownerUid:a.uid,day,progress}; }
     if(method==="assignRoadmap") { const learnerUid=clean(payload.learnerUid||payload.studentUid); if(!learnerUid)throw Object.assign(new Error("Learner uid required."),{lp4Code:"INVALID_REQUEST"}); const id=clean(payload.assignmentId)||stableOperationId(a,method,meta,'assignment'); await firestore.collection("mentorAssignments").doc(id).set({assignmentId:id,mentorUid:a.role==="mentor"?a.uid:clean(payload.mentorUid),learnerUid,resourceId,status:"assigned",entitlementGranted:false,serverUpdatedAt:serverStamp()}); return {assignmentId:id,resourceId,learnerUid,entitlementGranted:false}; }
     if(method==="saveCurrentAffairsPages") { await firestore.collection("lp4ResourceRecords").doc(resourceId).set({pages:safeClone(payload.pages),serverUpdatedAt:serverStamp()},{merge:true}); await firestore.collection("learningTexts").doc(resourceId).set({resourceId,pages:safeClone(payload.pages),serverUpdatedAt:serverStamp()},{merge:true}); return {resourceId,pages:Array.isArray(payload.pages)?payload.pages.length:0}; }
     if(method==="publishCurrentAffairsCorrection") { const id=stableOperationId(a,method,meta,'correction'); await firestore.collection("currentAffairsCorrections").doc(id).set({correctionId:id,resourceId,correction:safeClone(payload.correction),actorUid:a.uid,appendOnly:true,serverUpdatedAt:serverStamp()}); return {resourceId,correctionId:id,appendOnly:true}; }
     if(["uploadNoteAsset","uploadVideoAsset","processVideoAsset","saveVideoCaptions"].includes(method)) { const assetId=clean(payload.assetId||payload.attachmentId)||`${resourceId}-${stableOperationId(a,method,meta,'asset').slice(0,16)}`;const isNote=method==="uploadNoteAsset",status=isNote?"Published":method==="processVideoAsset"?"processed":"ready",documentId=isNote?resourceId:assetId;await firestore.collection("protectedContentAssets").doc(documentId).set({assetId,resourceId,contentId:resourceId,kind:method,storagePath:clean(payload.storagePath||payload.path),captions:safeClone(payload.captions),status,serverUpdatedAt:serverStamp()},{merge:true}); return {resourceId,assetId,assetDocumentId:documentId,status}; }
     if(method==="resolveProtectedVideo"||method==="downloadVideoAttachment") { const assetId=clean(payload.assetId||payload.attachmentId); let asset=null; if(assetId){const s=await firestore.collection("protectedContentAssets").doc(assetId).get();asset=s.exists?obj(s.data()):null;} if(!asset){const snap=await firestore.collection("protectedContentAssets").where("resourceId","==",resourceId).limit(20).get();asset=snap.docs.map(d=>({id:d.id,...obj(d.data())})).find(x=>!assetId||x.assetId===assetId)||null;} const path=clean(asset&&asset.storagePath); if(!path||!storage) throw Object.assign(new Error("Protected asset is unavailable."),{lp4Code:"PROVIDER_UNAVAILABLE"}); const [url]=await storage.bucket().file(path).getSignedUrl({action:"read",expires:now()+10*60*1000}); return {resourceId,assetId:clean(asset.assetId||asset.id),deliveryUrl:url,expiresAt:new Date(now()+10*60*1000).toISOString()}; }
     if(["createLiveProviderSession","updateLiveProviderSession"].includes(method)) { const full={...safeClone(payload.record||payload),resourceId,resourceType:"live",serverUpdatedAt:serverStamp()};await firestore.collection("lp4ResourceRecords").doc(resourceId).set(full,{merge:true});await firestore.collection("mentorLiveSessions").doc(resourceId).set({...publicResourceMetadata(full,"live",resourceId,clean(full.status||full.publicationStatus||"Draft"),Number(full.version||1)),serverUpdatedAt:serverStamp()},{merge:false}); return {resourceId}; }
     if(method==="resolveLiveJoin") { const live=resource||await canonical(resourceId,method,payload); if(!live)throw Object.assign(new Error("Live session not found."),{lp4Code:"NOT_FOUND"}); const start=Date.parse(live.startAt||"")||0,end=Date.parse(live.endAt||"")||0,open=start-Number(live.joinWindowMinutes||10)*60000,late=start+Number(live.lateJoinMinutes||20)*60000; const t=now(); if(!start||!end||t<open||t>Math.max(end,late))throw Object.assign(new Error("Join window is closed."),{lp4Code:"WINDOW_CLOSED"}); const url=clean(live.joinUrl||live.meetingUrl||live.providerJoinUrl); if(!url)throw Object.assign(new Error("Live provider is unavailable."),{lp4Code:"PROVIDER_UNAVAILABLE"}); return {resourceId,joinUrl:url,serverNowMs:t,windowOpen:true}; }
     if(method==="recordLiveAttendance") { const id=`${a.uid}_${resourceId}`; await firestore.collection("liveAttendance").doc(id).set({ownerUid:a.uid,sessionId:resourceId,event:clean(payload.event||"JOIN"),firstSeenAt:serverStamp(),lastSeenAt:serverStamp(),serverUpdatedAt:serverStamp()},{merge:true}); return {resourceId,ownerUid:a.uid,attendanceId:id}; }
     if(method==="createLiveReplayDraft") { const nextId=clean(payload.replayResourceId)||`${resourceId}-replay`;const full={...safeClone(payload.record),resourceId:nextId,resourceType:"replay",status:"Draft",publishState:"Draft",sourceSessionId:resourceId,serverUpdatedAt:serverStamp()};await firestore.collection("lp4ResourceRecords").doc(nextId).set(full,{merge:true});const meta=publicResourceMetadata(full,"replay",nextId,"Draft",Number(full.version||1));await firestore.collection("mentorLiveSessions").doc(nextId).set({...meta,serverUpdatedAt:serverStamp()},{merge:false});return {resourceId:nextId,resourceType:"replay",status:"Draft"}; }
     if(method==="importNoteContent") { const versionId=stableOperationId(a,method,meta,'authoring-version'); await firestore.collection("authoringVersions").doc(versionId).set({versionId,resourceId,content:safeClone(payload.content||payload.record||payload),actorUid:a.uid,serverUpdatedAt:serverStamp()}); return {resourceId,versionId}; }
     throw Object.assign(new Error(`LP4 method ${method} is not implemented.`),{lp4Code:"PROVIDER_UNAVAILABLE"});
   };

   try {
     const result=policy.idempotency?await idempotent(a,method,resourceId,meta,()=>run()):await run(); const auditId=await audit(a,method,resourceId,meta,"success",{phase:policy.phase}); return envelope(method,resourceId,meta,auditId,{...obj(result),ownerUid:a.uid,resourceType:inferType(resource||payload,method),version:Number(obj(result).version||1)});
   } catch(error) { try{await audit(a,method,resourceId,meta,"error",{code:clean(error.lp4Code),message:clean(error.message).slice(0,200)});}catch(_){} throw error; }
 }
 return Object.freeze({operation});
}

module.exports=Object.freeze({METHOD_POLICIES,TYPE_BINDING,resourceIdFrom,inferType,canonicalCollection,requiredPlanOf,entitlementMatches,validateRecord,createLp4LearningAuthority});
