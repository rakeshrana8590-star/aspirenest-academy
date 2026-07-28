import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  ASPIRENEST_ADMIN_EMAIL,
  ASPIRENEST_MENTOR_EMAIL,
  normalizeAspireNestEmail,
  resolveAspireNestRole,
} from "../auth/aspireNestIdentity";
import {
  createMentorAccessRequest,
  createMentorAssignment,
  createMentorFeedback,
  markStudentAssignmentComplete,
} from "../mentor/mentorService";
import { MENTOR_RESOURCE_ACCESS_STATES } from "../mentor/mentorConstants";
import {
  assertAspireNestProductionWriteEnabled,
  getAspireNestReleaseWriteGate,
} from "./v8ReleaseWriteGate";
import {
  canV8AccessResource,
  isV8EntitlementActive,
  resolveV8EffectivePlan,
  resolveV8ResourcePlan,
  v8EntitlementMatchesResource,
} from "./v8EntitlementPolicy";

const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();
const upper = (value = "") => clean(value).toUpperCase();

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const activeEntitlement = (record = {}) => isV8EntitlementActive(record);
const entitlementMatches = (record = {}, resource = {}) =>
  v8EntitlementMatchesResource(record, resource);

const safeResource = (payload = {}) => {
  const resource = {
    resourceId: clean(payload.resourceId || payload.id),
    resourceType: clean(payload.resourceType || payload.type || "notes"),
    module: clean(payload.module || payload.moduleKey || payload.section || "ctet-tet"),
    itemType: clean(payload.itemType || payload.type || "CONTENT").toUpperCase().replace(/[^A-Z0-9_]+/g, "_"),
    title: clean(payload.title) || "AspireNest learning resource",
    canonicalRoute: clean(payload.canonicalRoute || payload.route || "/student"),
    requiredPlan: upper(payload.requiredPlan || payload.plan || "FREE"),
  };
  return { ...resource, requiredPlan: resolveV8ResourcePlan(resource, resource.resourceType) };
};

const resultEvent = ({ requestId = "", action = "", ok = false, result = null, error = "", message = "" }) => {
  window.dispatchEvent(
    new CustomEvent("aspirenest:platform-live-action-result", {
      detail: { requestId, action, ok, result, error, message },
    })
  );
};

const requireStudent = (auth) => {
  const user = auth?.currentUser;
  if (!user || resolveAspireNestRole(user) !== "student") {
    throw new Error("Learner-specific actions require the learner's own Student account.");
  }
  return user;
};

const mentorActor = async ({ auth, db }) => {
  const user = auth?.currentUser;
  const role = user ? resolveAspireNestRole(user) : "public";
  if (!user || !["mentor", "admin"].includes(role)) throw new Error("Mentor or Admin access is required.");
  if (role === "mentor" && normalizeAspireNestEmail(user.email) !== ASPIRENEST_MENTOR_EMAIL) {
    throw new Error("The designated AspireNest Mentor account is required.");
  }
  if (role === "admin" && normalizeAspireNestEmail(user.email) !== ASPIRENEST_ADMIN_EMAIL) {
    throw new Error("The designated AspireNest Admin account is required.");
  }
  if (role === "mentor") return { actorUid: user.uid, mentorUid: user.uid, role, email: normalizeAspireNestEmail(user.email) };
  const setting = await getDoc(doc(db, "platformSettings", "defaultMentor"));
  const mentorUid = clean(setting.exists() ? setting.data()?.mentorUid : "");
  if (!mentorUid) throw new Error("Activate Dr. Varsha Maru as the default Mentor before using Mentor write actions.");
  return { actorUid: user.uid, mentorUid, role, email: normalizeAspireNestEmail(user.email) };
};

const createQuestion = async ({ auth, db, payload }) => {
  const user = requireStudent(auth);
  const question = clean(payload.question);
  if (question.length < 8) throw new Error("Enter a clear learner question.");
  const setting = await getDoc(doc(db, "platformSettings", "defaultMentor"));
  const mentorUid = clean(setting.exists() ? setting.data()?.mentorUid : "");
  if (!mentorUid) throw new Error("Mentor connection is not ready. Contact AspireNest support.");
  const ref = doc(collection(db, "mentorQuestions"));
  await updateDocOrCreate(ref, {
    questionId: ref.id,
    studentUid: user.uid,
    studentEmail: normalizeAspireNestEmail(user.email),
    studentName: clean(window.__aspirenestAuthSession?.displayName || user.displayName || user.email),
    mentorUid,
    mentorEmail: ASPIRENEST_MENTOR_EMAIL,
    resourceId: clean(payload.resourceId),
    resourceTitle: clean(payload.resourceTitle),
    question,
    answer: "",
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    answeredAt: null,
  });
  return { id: ref.id, status: "open" };
};

const updateDocOrCreate = async (reference, payload) => setDoc(reference, payload, { merge: true });

const completeAssignment = async ({ auth, payload }) => {
  requireStudent(auth);
  await markStudentAssignmentComplete({ assignmentId: clean(payload.assignmentId || payload.id) });
  return { id: clean(payload.assignmentId || payload.id), status: "completed" };
};

const findEntitlementProof = async ({ db, studentUid, resource }) => {
  if (resolveV8ResourcePlan(resource) === "FREE") {
    return { accessState: MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS, matchedGrantId: "" };
  }
  const [canonicalSnapshot, uidSnapshot, studentUidSnapshot, userIdSnapshot, profileSnapshot] = await Promise.all([
    getDocs(collection(db, "studentEntitlements", studentUid, "items")),
    getDocs(query(collection(db, "studentAccess"), where("uid", "==", studentUid), limit(500))),
    getDocs(query(collection(db, "studentAccess"), where("studentUid", "==", studentUid), limit(500))),
    getDocs(query(collection(db, "studentAccess"), where("userId", "==", studentUid), limit(500))),
    getDoc(doc(db, "learnerProfiles", studentUid)),
  ]);
  const recordMap = new Map();
  [canonicalSnapshot, uidSnapshot, studentUidSnapshot, userIdSnapshot].forEach((snapshot) => {
    snapshot.docs.forEach((item) => {
      const record = { ...item.data(), id: item.id };
      recordMap.set(clean(record.id || record.accessId || `${record.scopeType}:${record.planCode || record.planType || record.plan}:${record.itemId || record.module || ""}`), record);
    });
  });
  const records = [...recordMap.values()];
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
  const effectivePlan = resolveV8EffectivePlan({ profile, accessRecords: records });
  if (!canV8AccessResource({ resource, accessRecords: records, userPlan: effectivePlan })) return null;
  const match = records.find((record) => entitlementMatches(record, resource));
  const expires = match ? toMillis(match.accessUntil || match.validUntil || match.expiryDate) : 0;
  const soon = expires && expires - Date.now() <= 7 * 24 * 60 * 60 * 1000;
  return {
    accessState: soon ? MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON : MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS,
    matchedGrantId: clean(match?.id),
  };
};

const createAssignment = async ({ auth, db, payload }) => {
  const actor = await mentorActor({ auth, db });
  const resource = safeResource(payload);
  const studentUid = clean(payload.studentUid || payload.learnerId);
  if (!studentUid) throw new Error("Select an assigned learner.");
  const proof = await findEntitlementProof({ db, studentUid, resource });
  if (!proof) {
    throw new Error("This learner does not have verified access. Create an exact access request instead of assigning protected content.");
  }
  const id = await createMentorAssignment({
    mentorUid: actor.mentorUid,
    studentUid,
    studentName: clean(payload.studentName),
    resource,
    accessState: proof.accessState,
    matchedGrantId: proof.matchedGrantId,
    dueAt: clean(payload.dueAt) || null,
    objective: clean(payload.objective),
  });
  return { id, status: "assigned" };
};

const createAccessRequest = async ({ auth, db, payload }) => {
  const actor = await mentorActor({ auth, db });
  const resource = safeResource(payload);
  const studentUid = clean(payload.studentUid || payload.learnerId);
  if (!studentUid) throw new Error("Select an assigned learner.");
  const id = await createMentorAccessRequest({
    mentorUid: actor.mentorUid,
    studentUid,
    resource,
    reason: clean(payload.reason),
  });
  return { id, status: "pending" };
};

const answerQuestion = async ({ auth, db, payload }) => {
  const actor = await mentorActor({ auth, db });
  const questionId = clean(payload.questionId || payload.id);
  const answer = clean(payload.answer);
  if (!questionId || answer.length < 8) throw new Error("A clear guidance answer is required.");
  const ref = doc(db, "mentorQuestions", questionId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Learner question was not found.");
  const record = snapshot.data();
  if (actor.role !== "admin" && clean(record.mentorUid) !== actor.mentorUid) throw new Error("This question is not assigned to this Mentor.");
  await updateDoc(ref, {
    answer: answer.slice(0, 4000),
    status: "answered",
    answeredAt: serverTimestamp(),
    answeredBy: actor.actorUid,
    updatedAt: serverTimestamp(),
  });
  return { id: questionId, status: "answered" };
};

const reviewAssignment = async ({ auth, db, payload }) => {
  const actor = await mentorActor({ auth, db });
  const assignmentId = clean(payload.assignmentId || payload.id);
  const studentUid = clean(payload.studentUid);
  const message = clean(payload.message);
  const id = await createMentorFeedback({
    assignmentId,
    mentorUid: actor.mentorUid,
    studentUid,
    message,
  });
  return { id, assignmentId, status: "reviewed" };
};

const scheduleSession = async ({ auth, db, payload }) => {
  const actor = await mentorActor({ auth, db });
  const title = clean(payload.title);
  const startsAt = new Date(clean(payload.startsAt || `${payload.date || ""}T${payload.time || ""}`));
  if (title.length < 4 || Number.isNaN(startsAt.getTime())) throw new Error("Session title and a valid start time are required.");
  const ref = await addDoc(collection(db, "mentorLiveSessions"), {
    sessionId: "",
    mentorUid: actor.mentorUid,
    mentorEmail: ASPIRENEST_MENTOR_EMAIL,
    title,
    startsAt,
    group: clean(payload.group || "Assigned learners"),
    joinUrl: clean(payload.joinUrl),
    replayUrl: "",
    status: "scheduled",
    createdBy: actor.actorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(ref, { sessionId: ref.id, updatedAt: serverTimestamp() });
  return { id: ref.id, status: "scheduled" };
};

const handlers = {
  "student-ask-question": createQuestion,
  "student-complete-assignment": completeAssignment,
  "mentor-create-assignment": createAssignment,
  "mentor-create-access-request": createAccessRequest,
  "mentor-answer-question": answerQuestion,
  "mentor-review-assignment": reviewAssignment,
  "mentor-schedule-session": scheduleSession,
};

let installed = false;
export const installV8PlatformLiveActions = ({ auth, db } = {}) => {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.__aspirenestReleaseWriteGate = getAspireNestReleaseWriteGate();
  window.dispatchEvent(new CustomEvent("aspirenest:release-write-gate", { detail: window.__aspirenestReleaseWriteGate }));
  window.addEventListener("aspirenest:platform-live-action", async (event) => {
    const detail = event.detail || {};
    const action = clean(detail.action);
    const handler = handlers[action];
    if (!handler) {
      resultEvent({ requestId: detail.requestId, action, ok: false, error: "This live platform action is not available." });
      return;
    }
    try {
      assertAspireNestProductionWriteEnabled(action);
      const result = await handler({ auth, db, payload: detail.payload || {} });
      resultEvent({ requestId: detail.requestId, action, ok: true, result, message: detail.successMessage || "Live operation completed." });
    } catch (error) {
      resultEvent({ requestId: detail.requestId, action, ok: false, error: error?.message || String(error) });
    }
  });
};

export const __private__ = { activeEntitlement, entitlementMatches, safeResource };
