import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  createAccessAuditLog,
  createAccessInvite,
  createManualAccess,
  extendAccess,
  grantPaymentAccess,
  revokeAccess,
} from "../access/accessService";
import { buildDynamicPaymentApproval } from "../access/accessPaymentGrantContract";
import { saveAdminPaymentVerification } from "../payments/paymentService";
import {
  adminLookupUserByEmail,
  adminSaveMentorProfile,
} from "../mentor/mentorService";
import {
  ASPIRENEST_ADMIN_EMAIL,
  ASPIRENEST_MENTOR_EMAIL,
  normalizeAspireNestEmail,
} from "../auth/aspireNestIdentity";
import {
  ASPIRENEST_DEFAULT_MENTOR_NAME,
  ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
} from "./v8DefaultMentorPolicy";
import {
  assertAspireNestProductionWriteEnabled,
  getAspireNestReleaseWriteGate,
} from "./v8ReleaseWriteGate";

const clean = (value = "") => String(value ?? "").trim();
const upper = (value = "") => clean(value).toUpperCase();
const lower = (value = "") => clean(value).toLowerCase();
const asDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const typeSection = Object.freeze({
  "Native Note": "notes",
  "PDF Note": "notes",
  Video: "recordedVideo",
  "Mock Test": "mockPdf",
  "Current Affairs": "currentAffairs",
  Roadmap: "courseMaterial",
  Replay: "recordedVideo",
});

const typeContent = Object.freeze({
  "Native Note": "TEXT",
  "PDF Note": "PDF",
  Video: "VIDEO",
  "Mock Test": "MOCK",
  "Current Affairs": "PDF",
  Roadmap: "TEXT",
  Replay: "VIDEO",
});

const actorFromAuth = (auth) => {
  const user = auth?.currentUser;
  const email = normalizeAspireNestEmail(user?.email);
  if (!user || email !== ASPIRENEST_ADMIN_EMAIL) {
    throw new Error("Authenticated AspireNest Admin access is required.");
  }
  return { uid: user.uid, email, role: "admin", isAdmin: true };
};

const currentAdminData = () => window.__aspirenestRealAdminData || {};
const findLearner = (id = "") =>
  (currentAdminData().learners || []).find((learner) =>
    [learner.id, learner.uid, ...(learner.uidAliases || [])].map(clean).includes(clean(id))
  );
const findResource = (id = "") =>
  (currentAdminData().resources || []).find((resource) => clean(resource.id) === clean(id));

const eventResult = ({ requestId = "", action = "", ok = false, message = "", result = null, error = "" }) => {
  window.dispatchEvent(
    new CustomEvent("aspirenest:admin-live-action-result", {
      detail: { requestId, action, ok, message, result, error },
    })
  );
};

const audit = async ({ actor, action, target = "", before = null, after = null, metadata = {} }) =>
  createAccessAuditLog({
    actor,
    action,
    email: metadata.email || null,
    uid: metadata.uid || null,
    accessId: metadata.accessId || null,
    before,
    after,
    metadata: { ...metadata, target, source: "v8_admin_live" },
  });

const createResource = async ({ db, actor, payload }) => {
  const type = clean(payload.type) || "Native Note";
  const status = lower(payload.status) === "staged" ? "staged" : "draft";
  const record = {
    title: clean(payload.title),
    resourceType: type,
    contentType: typeContent[type] || "TEXT",
    section: typeSection[type] || "courseMaterial",
    subject: clean(payload.subject) || "General",
    chapter: clean(payload.chapter),
    summary: clean(payload.summary),
    description: clean(payload.summary),
    planType: upper(payload.access) || "FREE",
    accessPlan: upper(payload.access) || "FREE",
    status,
    publishStatus: status,
    sourceType: type === "Native Note" ? "INTELLITEXT" : "PENDING_ASSET",
    createdBy: actor.uid,
    createdByEmail: actor.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (!record.title || record.title.length < 4) throw new Error("Resource title is required.");
  const ref = await addDoc(collection(db, "contentItems"), record);
  await audit({ actor, action: "CREATE_RESOURCE", target: record.title, after: { id: ref.id, ...record } });
  return { id: ref.id, title: record.title, status };
};

const hasPublishablePayload = (record = {}) => {
  const type = lower(record.resourceType || record.contentType || record.type || record.section);
  if (type.includes("note") || type.includes("text")) {
    return Boolean(clean(record.learningTextId || record.intelliTextId || record.body || record.content || record.fileUrl));
  }
  if (type.includes("video") || type.includes("replay")) {
    return Boolean(clean(record.videoUrl || record.youtubeUrl || record.youtubeId || record.assetId));
  }
  if (type.includes("mock")) {
    return Boolean(Number(record.questionCount || record.questionsCount) > 0 || (Array.isArray(record.questions) && record.questions.length));
  }
  if (type.includes("roadmap")) {
    return Boolean(Number(record.totalDays) > 0 || (Array.isArray(record.days) && record.days.length) || clean(record.roadmapId));
  }
  return Boolean(clean(record.fileUrl || record.videoUrl || record.assetId || record.content || record.body));
};

const publishResource = async ({ db, actor, payload }) => {
  const resourceId = clean(payload.id || payload.resourceId);
  const ref = doc(db, "contentItems", resourceId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Resource was not found.");
  const before = { id: snapshot.id, ...snapshot.data() };
  if (lower(before.status || before.publishStatus) === "published") {
    throw new Error("Resource is already published.");
  }
  if (!hasPublishablePayload(before)) {
    throw new Error("Resource is not publish-ready. Complete its real note, file, video, mock-test or roadmap payload first.");
  }
  const update = {
    status: "published",
    publishStatus: "published",
    publishedAt: serverTimestamp(),
    publishedBy: actor.uid,
    publishedByEmail: actor.email,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, update);
  await audit({
    actor,
    action: "PUBLISH_RESOURCE",
    target: before.title || resourceId,
    before,
    after: update,
    metadata: { reason: clean(payload.reason) },
  });
  return { id: resourceId, title: before.title, status: "published" };
};

const grantAccess = async ({ actor, payload }) => {
  const learner = findLearner(payload.learnerId || payload.learner);
  if (!learner?.uid || !learner?.email) throw new Error("Verified learner UID and email are required.");
  const scopeType = lower(payload.scope || "plan");
  const target = clean(payload.target);
  const resource = findResource(target);
  const accessFrom = asDate(payload.starts) || new Date();
  const accessUntil = asDate(payload.expires);
  if (!accessUntil || accessUntil <= accessFrom) throw new Error("Expiry must be later than access start.");

  const data = {
    uid: learner.uid,
    email: learner.email,
    learnerName: learner.name,
    name: learner.name,
    scopeType,
    accessFrom,
    accessUntil,
    source: "admin_manual",
    notes: clean(payload.reason),
    actor,
  };
  if (scopeType === "plan") {
    data.planType = upper(target);
    data.planCode = upper(target);
  } else if (scopeType === "module") {
    data.module = upper(target);
  } else if (scopeType === "bundle") {
    data.bundleId = target;
  } else {
    data.itemId = target;
    data.itemType = upper(resource?.type || "CONTENT").replace(/\s+/g, "_");
    data.itemTitle = resource?.title || target;
  }
  return createManualAccess(data);
};

const verifyPayment = async ({ db, actor, payload }) => {
  const paymentId = clean(payload.id || payload.paymentId);
  const ref = doc(db, "payments", paymentId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Payment record was not found.");
  const before = { id: snapshot.id, ...snapshot.data() };
  if (!payload.confirm || !clean(payload.adminUtr || payload.adminProof)) {
    throw new Error("Admin UTR/proof and verification confirmation are required.");
  }
  await saveAdminPaymentVerification(paymentId, {
    adminProof: clean(payload.adminProof || payload.adminUtr),
    studentUtr: clean(before.studentUtr || before.utr || before.reference),
    adminUtr: clean(payload.adminUtr || payload.adminProof),
    utrMatch: payload.utrMatch === true || payload.utrMatch === "on",
    amountMatch: payload.amountMatch === true || payload.amountMatch === "on",
    duplicateUtr: false,
    verificationStatus: "verified",
    reviewReason: "",
  });
  const after = {
    status: "verified",
    verificationStatus: "verified",
    isVerified: true,
    accessProvisioned: false,
    verifiedAt: serverTimestamp(),
    verifiedBy: actor.uid,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, after);
  await audit({ actor, action: "VERIFY_PAYMENT", target: before.studentEmail || before.email || paymentId, before, after });
  return { id: paymentId, status: "verified" };
};

const provisionPayment = async ({ db, actor, payload }) => {
  const paymentId = clean(payload.id || payload.paymentId);
  const ref = doc(db, "payments", paymentId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Payment record was not found.");
  const payment = { id: snapshot.id, ...snapshot.data() };
  const selection = {
    accessFrom: asDate(payload.starts) || new Date(),
    accessUntil: asDate(payload.expires),
    noExpiry: payload.noExpiry === true || payload.noExpiry === "on",
    untilManualChange: payload.untilManualChange === true || payload.untilManualChange === "on",
  };
  const approval = buildDynamicPaymentApproval({ payment, adminSelection: selection, now: new Date() });
  const accessRecord = await grantPaymentAccess(approval.grant, actor);
  if (payment.userId) {
    await setDoc(
      doc(db, "users", payment.userId),
      { ...approval.userProjection, updatedAt: serverTimestamp(), updatedBy: actor.uid },
      { merge: true }
    );
  }
  await updateDoc(ref, {
    ...approval.paymentUpdate,
    approvedAt: serverTimestamp(),
    approvedBy: actor.uid,
    accessId: accessRecord.id,
    accessWriteMode: accessRecord.accessWriteMode || "created",
    accessProvisioned: true,
    updatedAt: serverTimestamp(),
  });
  return { id: paymentId, accessId: accessRecord.id, plan: approval.product.planCode };
};

const createLearnerInvite = async ({ actor, payload }) => {
  const planCode = upper(payload.plan || "FREE");
  const liveProduct = (currentAdminData().products || []).find((product) => upper(product.planCode) === planCode);
  const starts = new Date();
  const expires = new Date(starts.getTime());
  expires.setFullYear(expires.getFullYear() + 1);
  return createAccessInvite({
    actor,
    email: normalizeAspireNestEmail(payload.email),
    name: clean(payload.name),
    learnerName: clean(payload.name),
    scopeType: "plan",
    planType: planCode,
    planCode,
    productId: clean(liveProduct?.id),
    accessRank: Number(liveProduct?.accessRank || 0),
    accessFrom: starts,
    accessUntil: expires,
    status: "pending",
    notes: "Admin-created verified learner invitation",
    sendInvite: false,
    inviteType: "learner_onboarding",
  });
};

const saveMentor = async ({ db, actor, payload }) => {
  const email = normalizeAspireNestEmail(payload.email);
  if (email !== ASPIRENEST_MENTOR_EMAIL) {
    throw new Error("Only the designated AspireNest mentor account can be activated in this release.");
  }
  const account = await adminLookupUserByEmail(email);
  if (!account?.uid && !account?.id) {
    throw new Error("The mentor must sign in once with the designated Google account before activation.");
  }
  const mentorUid = clean(account.uid || account.id);
  await adminSaveMentorProfile({
    mentorUid,
    email,
    displayName: clean(payload.name) || ASPIRENEST_DEFAULT_MENTOR_NAME,
  });
  await setDoc(
    doc(db, "platformSettings", "defaultMentor"),
    {
      policyId: ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
      mentorUid,
      mentorEmail: email,
      mentorName: clean(payload.name) || ASPIRENEST_DEFAULT_MENTOR_NAME,
      status: "active",
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );
  await audit({ actor, action: "ACTIVATE_MENTOR", target: email, after: { mentorUid, email } });
  return { mentorUid, email };
};

const createPendingClaim = async ({ actor, payload }) =>
  createAccessInvite({
    actor,
    email: normalizeAspireNestEmail(payload.email),
    scopeType: lower(payload.scope || "item"),
    planType: lower(payload.scope) === "plan" ? upper(payload.target) : "FREE",
    planCode: lower(payload.scope) === "plan" ? upper(payload.target) : "FREE",
    itemId: lower(payload.scope) === "item" ? clean(payload.target) : "",
    module: lower(payload.scope) === "module" ? upper(payload.target) : "",
    bundleId: lower(payload.scope) === "bundle" ? clean(payload.target) : "",
    accessFrom: new Date(),
    accessUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
    notes: clean(payload.reason),
    inviteType: "pending_uid_claim",
  });

const recordDryRun = async ({ actor, action, payload }) => {
  await audit({
    actor,
    action: action === "run-migration-dry" ? "MIGRATION_DRY_RUN" : "BULK_ACCESS_DRY_RUN",
    target: clean(payload.target || payload.summary || "Admin dry run"),
    metadata: { ...payload, mutationApplied: false },
  });
  return { mutationApplied: false };
};

const actionHandlers = {
  "submit-resource": createResource,
  "confirm-publish": publishResource,
  "submit-grant": ({ actor, payload }) => grantAccess({ actor, payload }),
  "confirm-extend": ({ actor, payload }) => extendAccess(clean(payload.id), asDate(payload.next), actor, { reason: clean(payload.reason) }),
  "confirm-revoke": ({ actor, payload }) => revokeAccess(clean(payload.id), actor, { reason: clean(payload.reason), category: clean(payload.category) }),
  "confirm-payment": verifyPayment,
  "confirm-provision": provisionPayment,
  "submit-learner": ({ actor, payload }) => createLearnerInvite({ actor, payload }),
  "submit-mentor": ({ db, actor, payload }) => saveMentor({ db, actor, payload }),
  "submit-claim": ({ actor, payload }) => createPendingClaim({ actor, payload }),
  "run-bulk-preview": ({ actor, payload }) => recordDryRun({ actor, action: "run-bulk-preview", payload }),
  "run-migration-dry": ({ actor, payload }) => recordDryRun({ actor, action: "run-migration-dry", payload }),
  "sync-default-mentor-relationships": ({ db, auth, payload }) => {
    if (clean(payload.confirm) !== "SYNC_DEFAULT_MENTOR_RELATIONSHIPS") {
      throw new Error("Explicit confirmation is required before persisting default Mentor relationships.");
    }
    return syncDefaultMentorRelationships({ db, auth, liveData: currentAdminData() });
  },
};

let relationshipSyncInFlight = false;
let lastRelationshipSignature = "";

const syncDefaultMentorRelationships = async ({ db, auth, liveData }) => {
  if (relationshipSyncInFlight) return { status: "in_flight", learnerCount: 0 };
  const actor = actorFromAuth(auth);
  const mentor = liveData.defaultMentor || (liveData.mentors || []).find(
    (item) => normalizeAspireNestEmail(item.email) === ASPIRENEST_MENTOR_EMAIL
  );
  let mentorUid = clean(mentor?.uid || mentor?.id);
  if (!mentorUid) {
    const account = await adminLookupUserByEmail(ASPIRENEST_MENTOR_EMAIL);
    mentorUid = clean(account?.uid || account?.id);
  }
  if (!mentorUid) return { status: "mentor_not_ready", learnerCount: 0 };
  const missing = (liveData.missingRelationshipLearners || []).filter((learner) => clean(learner.uid));
  const signature = `${mentorUid}:${missing.map((item) => item.uid).sort().join(",")}`;
  if (!missing.length) return { status: "already_synced", learnerCount: 0 };
  if (signature === lastRelationshipSignature) return { status: "already_requested", learnerCount: 0 };

  relationshipSyncInFlight = true;
  try {
    await setDoc(
      doc(db, "platformSettings", "defaultMentor"),
      {
        policyId: ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
        mentorUid,
        mentorEmail: ASPIRENEST_MENTOR_EMAIL,
        mentorName: ASPIRENEST_DEFAULT_MENTOR_NAME,
        status: "active",
        updatedAt: serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true }
    );
    await adminSaveMentorProfile({
      mentorUid,
      email: ASPIRENEST_MENTOR_EMAIL,
      displayName: ASPIRENEST_DEFAULT_MENTOR_NAME,
    });

    for (let offset = 0; offset < missing.length; offset += 180) {
      const chunk = missing.slice(offset, offset + 180);
      const batch = writeBatch(db);
      chunk.forEach((learner) => {
        const profileRef = doc(db, "learnerProfiles", learner.uid);
        const linkRef = doc(db, "mentorProfiles", mentorUid, "students", learner.uid);
        const canonicalLinkRef = doc(db, "mentorStudentLinks", learner.uid);
        const relation = {
          mentorUid,
          mentorName: ASPIRENEST_DEFAULT_MENTOR_NAME,
          mentorEmail: ASPIRENEST_MENTOR_EMAIL,
          mentorAssignmentStatus: "active",
          mentorAssignedAt: serverTimestamp(),
          mentorAssignedBy: actor.uid,
          mentorAssignmentSource: ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
          updatedAt: serverTimestamp(),
        };
        batch.set(profileRef, { uid: learner.uid, email: learner.email, normalizedEmail: learner.email, role: "student", ...relation }, { merge: true });
        const linkRecord = {
          linkId: `${mentorUid}_${learner.uid}`,
          mentorUid,
          mentorName: ASPIRENEST_DEFAULT_MENTOR_NAME,
          mentorEmail: ASPIRENEST_MENTOR_EMAIL,
          studentUid: learner.uid,
          studentName: learner.name,
          studentEmail: learner.email,
          status: "active",
          source: ASPIRENEST_DEFAULT_MENTOR_POLICY_ID,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(linkRef, linkRecord, { merge: true });
        batch.set(canonicalLinkRef, linkRecord, { merge: true });
      });
      await batch.commit();
    }
    await audit({
      actor,
      action: "SYNC_DEFAULT_MENTOR_RELATIONSHIPS",
      target: ASPIRENEST_DEFAULT_MENTOR_NAME,
      after: { mentorUid, learnerCount: missing.length },
      metadata: { learnerUids: missing.map((item) => item.uid), idempotent: true },
    });
    lastRelationshipSignature = signature;
    return { status: "synced", learnerCount: missing.length, mentorUid };
  } finally {
    relationshipSyncInFlight = false;
  }
};

let installed = false;
export const installV8AdminLiveActions = ({ auth, db } = {}) => {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.__aspirenestFirebaseDb = db;
  window.__aspirenestReleaseWriteGate = getAspireNestReleaseWriteGate();
  window.dispatchEvent(new CustomEvent("aspirenest:release-write-gate", { detail: window.__aspirenestReleaseWriteGate }));

  window.addEventListener("aspirenest:admin-live-action", async (event) => {
    const detail = event.detail || {};
    const action = clean(detail.action);
    const handler = actionHandlers[action];
    if (!handler) {
      eventResult({ requestId: detail.requestId, action, ok: false, error: "This live Admin action is not available." });
      return;
    }
    try {
      assertAspireNestProductionWriteEnabled(action);
      const actor = actorFromAuth(auth);
      const result = await handler({ db, auth, actor, payload: detail.payload || {} });
      eventResult({
        requestId: detail.requestId,
        action,
        ok: true,
        result,
        message: detail.successMessage || "Live Admin operation completed.",
      });
    } catch (error) {
      eventResult({ requestId: detail.requestId, action, ok: false, error: error?.message || String(error) });
    }
  });

};
