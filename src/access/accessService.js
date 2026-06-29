import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_KEY_STATUS,
  ACCESS_PLAN_TYPES,
  ACCESS_PLAN_LEVELS,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "./accessConstants";
import { normalizeAccessPlan } from "./accessUtils";

export const ACCESS_COLLECTIONS = Object.freeze({
  STUDENT_ACCESS: "studentAccess",
  ACCESS_PRODUCTS: "accessProducts",
  ACCESS_KEYS: "accessKeys",
  ACCESS_INVITES: "accessInvites",
  ACCESS_AUDIT_LOGS: "accessAuditLogs",
  USERS: "users",
  STUDENT_ENTITLEMENTS: "studentEntitlements",
});

const ADMIN_ROLES = new Set(["admin", "super_admin", "owner"]);

export const normalizeAccessEmail = (email = "") =>
  String(email || "").trim().toLowerCase();

const toAccessRecord = (docSnap) => {
  if (!docSnap || !docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
};

const requireAccessId = (id) => {
  const value = String(id || "").trim();
  if (!value) {
    throw new Error("Access record id is required.");
  }

  return value;
};

const requireAdminActor = (actor = {}) => {
  const role = String(actor.role || "").trim().toLowerCase();

  if (actor.isAdmin === true || ADMIN_ROLES.has(role)) {
    return {
      uid: actor.uid || null,
      email: normalizeAccessEmail(actor.email),
      role: role || "admin",
    };
  }

  throw new Error("Admin access is required for this access write action.");
};

const getInviteExpiryDate = (days = 7) => {
  const expiryDays = Number(days) > 0 ? Number(days) : 7;
  return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
};

const toInviteRecord = (docSnap) => {
  if (!docSnap || !docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
};

const createInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let randomPart = "";

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(16);
    crypto.getRandomValues(values);
    randomPart = Array.from(values).map((value) => chars[value % chars.length]).join("");
  } else {
    randomPart = Array.from({ length: 16 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  return "AN-INV-" + Date.now().toString(36).toUpperCase() + "-" + randomPart;
};

const getInviteBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "https://aspirenestacademy.in";
};

const buildAccessInviteLink = (inviteCode = "") =>
  getInviteBaseUrl() + "/access/invite/" + encodeURIComponent(inviteCode);

const readAccessById = async (id) => {
  const accessId = requireAccessId(id);
  const accessRef = doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, accessId);
  const accessSnap = await getDoc(accessRef);

  return toAccessRecord(accessSnap);
};

const readAccessQuery = async (fieldName, value) => {
  const accessQuery = query(
    collection(db, ACCESS_COLLECTIONS.STUDENT_ACCESS),
    where(fieldName, "==", value)
  );
  const accessSnap = await getDocs(accessQuery);

  return accessSnap.docs.map(toAccessRecord).filter(Boolean);
};

const buildAccessPayload = (data = {}) => {
  const normalizedEmail = normalizeAccessEmail(data.email);
  const uid = String(data.uid || "").trim();

  if (!normalizedEmail && !uid) {
    throw new Error("Access record requires email or uid.");
  }

  return {
    email: normalizedEmail || null,
    normalizedEmail,
    uid: uid || null,
    planType: normalizeAccessPlan(data.planType || ACCESS_PLAN_TYPES.FREE),
    scopeType: data.scopeType || ACCESS_SCOPE_TYPES.PLAN,
    status: String(data.status || ACCESS_STATUS.ACTIVE).trim().toLowerCase(),
    source: data.source || ACCESS_SOURCE.ADMIN_MANUAL,
    course: data.course || ACCESS_COURSE.CTET_TET,
    module: data.module || null,
    itemType: data.itemType || null,
    itemId: data.itemId || null,
    itemTitle: data.itemTitle || "",
    itemIds: Array.isArray(data.itemIds) ? data.itemIds : [],
    bundleId: data.bundleId || null,
    productId: data.productId || null,
    accessKeyId: data.accessKeyId || null,
    campaignId: data.campaignId || null,
    campaignName: data.campaignName || "",
    campaignSource: data.campaignSource || "",
    learnerName: String(data.learnerName || data.name || "").trim(),
    name: String(data.name || data.learnerName || "").trim(),
    phone: String(data.phone || "").trim(),
    accessFrom: data.accessFrom || null,
    accessUntil: data.accessUntil || null,
    notes: data.notes || data.adminNote || "",
    adminNote: data.adminNote || data.notes || "",
    updatedAt: serverTimestamp(),
  };
};


const cleanEntitlementSegment = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "all";

export const buildStudentEntitlementId = (accessRecord = {}) => {
  const scopeType = String(accessRecord.scopeType || ACCESS_SCOPE_TYPES.PLAN)
    .trim()
    .toLowerCase();

  if (scopeType === ACCESS_SCOPE_TYPES.MODULE) {
    return "module_" + cleanEntitlementSegment(accessRecord.module);
  }

  if (scopeType === ACCESS_SCOPE_TYPES.ITEM) {
    return [
      "item",
      cleanEntitlementSegment(accessRecord.module),
      cleanEntitlementSegment(accessRecord.itemType),
      cleanEntitlementSegment(accessRecord.itemId),
    ].join("_");
  }

  if (scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
    return "bundle_" + cleanEntitlementSegment(accessRecord.bundleId || accessRecord.itemId);
  }

  return "plan_" + cleanEntitlementSegment(normalizeAccessPlan(accessRecord.planType || ACCESS_PLAN_TYPES.FREE));
};

export const buildStudentEntitlementPayload = (accessRecord = {}, metadata = {}) => {
  const uid = String(accessRecord.uid || metadata.uid || "").trim();
  const normalizedEmail = normalizeAccessEmail(
    accessRecord.normalizedEmail || accessRecord.email || metadata.email
  );

  if (!uid) {
    throw new Error("Student entitlement requires uid.");
  }

  const entitlementId = buildStudentEntitlementId(accessRecord);

  return {
    id: entitlementId,
    uid,
    email: normalizedEmail || null,
    normalizedEmail,
    accessId: accessRecord.id || metadata.accessId || null,
    planType: normalizeAccessPlan(accessRecord.planType || ACCESS_PLAN_TYPES.FREE),
    scopeType: accessRecord.scopeType || ACCESS_SCOPE_TYPES.PLAN,
    module: accessRecord.module || null,
    itemType: accessRecord.itemType || null,
    itemId: accessRecord.itemId || null,
    itemIds: Array.isArray(accessRecord.itemIds) ? accessRecord.itemIds : [],
    bundleId: accessRecord.bundleId || null,
    course: accessRecord.course || ACCESS_COURSE.CTET_TET,
    status: String(accessRecord.status || ACCESS_STATUS.ACTIVE).trim().toLowerCase(),
    source: accessRecord.source || ACCESS_SOURCE.ADMIN_MANUAL,
    accessFrom: accessRecord.accessFrom || null,
    accessUntil: accessRecord.accessUntil || null,
    updatedAt: serverTimestamp(),
  };
};

export const syncStudentEntitlement = async (accessRecord = {}, metadata = {}) => {
  const payload = buildStudentEntitlementPayload(accessRecord, metadata);
  const entitlementRef = doc(
    db,
    ACCESS_COLLECTIONS.STUDENT_ENTITLEMENTS,
    payload.uid,
    "items",
    payload.id
  );

  await setDoc(entitlementRef, payload, { merge: true });

  return payload;
};

const syncStudentEntitlementIfUid = async (accessRecord = {}, metadata = {}) => {
  const uid = String(accessRecord.uid || metadata.uid || "").trim();

  if (!uid) {
    return null;
  }

  return syncStudentEntitlement(accessRecord, metadata);
};

export const getAccessByEmail = async (email) => {
  const normalizedEmail = normalizeAccessEmail(email);

  if (!normalizedEmail) return [];

  const normalizedMatches = await readAccessQuery("normalizedEmail", normalizedEmail);

  if (normalizedMatches.length) {
    return normalizedMatches;
  }

  return readAccessQuery("email", normalizedEmail);
};

export const getAccessByUid = async (uid) => {
  const normalizedUid = String(uid || "").trim();

  if (!normalizedUid) return [];

  return readAccessQuery("uid", normalizedUid);
};

const getRedeemedAccessByKeyForLearner = async ({
  accessKeyId = "",
  normalizedEmail = "",
  uid = "",
} = {}) => {
  const normalizedAccessKeyId = String(accessKeyId || "").trim();
  const learnerEmail = normalizeAccessEmail(normalizedEmail);
  const learnerUid = String(uid || "").trim();

  if (!normalizedAccessKeyId || (!learnerEmail && !learnerUid)) {
    return null;
  }

  const emailMatches = learnerEmail ? await getAccessByEmail(learnerEmail) : [];
  const uidMatches = learnerUid ? await getAccessByUid(learnerUid) : [];
  const learnerMatches = [...emailMatches, ...uidMatches];

  return (
    learnerMatches.find((record) =>
      String(record.accessKeyId || "").trim() === normalizedAccessKeyId
    ) || null
  );
};

export const createAccessAuditLog = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const auditPayload = {
    action: data.action || "access_action",
    accessId: data.accessId || null,
    email: normalizeAccessEmail(data.email),
    uid: data.uid || null,
    before: data.before || null,
    after: data.after || null,
    metadata: data.metadata || {},
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
  };

  return addDoc(collection(db, ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS), auditPayload);
};

export const listStudentAccess = async ({ maxCount = 50, email = "" } = {}) => {
  const normalizedEmail = normalizeAccessEmail(email);
  const records = normalizedEmail
    ? await getAccessByEmail(normalizedEmail)
    : (await getDocs(collection(db, ACCESS_COLLECTIONS.STUDENT_ACCESS))).docs
        .map(toAccessRecord)
        .filter(Boolean);

  return records
    .filter(Boolean)
    .sort((first, second) => {
      const firstTime = first.createdAt && first.createdAt.seconds ? first.createdAt.seconds : 0;
      const secondTime = second.createdAt && second.createdAt.seconds ? second.createdAt.seconds : 0;

      return secondTime - firstTime;
    })
    .slice(0, maxCount);
};
export const createManualAccess = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const payload = {
    ...buildAccessPayload({
      ...data,
      source: data.source || ACCESS_SOURCE.ADMIN_MANUAL,
      status: data.status || ACCESS_STATUS.ACTIVE,
    }),
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    actorEmail: actor.email,
  };

  const docRef = await addDoc(collection(db, ACCESS_COLLECTIONS.STUDENT_ACCESS), payload);
  const savedAccess = { id: docRef.id, ...payload };

  await syncStudentEntitlementIfUid(savedAccess, {
    accessId: docRef.id,
    actorUid: actor.uid,
    actorEmail: actor.email,
    source: "create_manual_access",
  });

  await createAccessAuditLog({
    actor,
    action: "create_manual_access",
    accessId: docRef.id,
    email: payload.email,
    uid: payload.uid,
    after: payload,
  });

  return {
    id: docRef.id,
    ...payload,
  };
};

export const createUserAccessShell = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const normalizedEmail = normalizeAccessEmail(data.email);
  const uid = String(data.uid || "").trim();
  const name = String(data.name || data.learnerName || "").trim();
  const phone = String(data.phone || "").trim();
  const inviteCode = data.inviteCode || createInviteCode();
  const inviteLink = data.inviteLink || buildAccessInviteLink(inviteCode);

  if (!normalizedEmail) {
    throw new Error("User shell email is required.");
  }

  const userId = uid || normalizedEmail;
  const payload = {
    uid: uid || null,
    email: normalizedEmail,
    normalizedEmail,
    role: data.role || "student",
    accessCourse: data.course || ACCESS_COURSE.CTET_TET,
    accessPlanType: normalizeAccessPlan(data.planType || ACCESS_PLAN_TYPES.FREE),
    accessStatus: data.status || ACCESS_STATUS.ACTIVE,
    membershipExpiry: data.accessUntil || null,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
    actorEmail: actor.email,
  };

  if (name) {
    payload.displayName = name;
    payload.name = name;
  }

  if (phone) {
    payload.phone = phone;
  }

  await setDoc(doc(db, ACCESS_COLLECTIONS.USERS, userId), payload, { merge: true });

  await createAccessAuditLog({
    actor,
    action: "create_user_access_shell",
    email: normalizedEmail,
    uid: uid || null,
    after: payload,
  });

  return {
    id: userId,
    ...payload,
  };
};

export const createAccessInvite = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const normalizedEmail = normalizeAccessEmail(data.email);
  const name = String(data.name || data.learnerName || "").trim();
  const phone = String(data.phone || "").trim();
  const inviteCode = String(data.inviteCode || createInviteCode()).trim();
  const inviteLink = data.inviteLink || buildAccessInviteLink(inviteCode);

  if (!normalizedEmail) {
    throw new Error("Invite email is required.");
  }

  const payload = {
    email: normalizedEmail,
    normalizedEmail,
    inviteCode,
    inviteLink,
    learnerName: name,
    name,
    phone,
    course: data.course || ACCESS_COURSE.CTET_TET,
    planType: normalizeAccessPlan(data.planType || ACCESS_PLAN_TYPES.FREE),
    status: data.status || ACCESS_STATUS.PENDING,
    inviteStatus: data.inviteStatus || "pending",
    sendInvite: data.sendInvite === true,
    inviteType: data.inviteType || "manual",
    deliveryStatus: data.deliveryStatus || "queued",
    provider: data.provider || "phase14_backend_pending",
    actionMode: data.actionMode || "password_setup_or_google_login",
    expiresAt: data.expiresAt || getInviteExpiryDate(data.expiryDays || 7),
    sentAt: data.sentAt || null,
    usedAt: data.usedAt || null,
    resendCount: Number(data.resendCount || 0),
    profileCompletionRequired: data.profileCompletionRequired !== false,
    profileCompletedAt: data.profileCompletedAt || null,
    linkCopiedAt: data.linkCopiedAt || null,
    manualSentAt: data.manualSentAt || null,
    openedAt: data.openedAt || null,
    emailSent: false,
    accessFrom: data.accessFrom || null,
    accessUntil: data.accessUntil || null,
    notes: data.notes || data.adminNote || "",
    adminNote: data.adminNote || data.notes || "",
    accessId: data.accessId || null,
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    actorEmail: actor.email,
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, inviteCode);
  await setDoc(docRef, payload);

  await createAccessAuditLog({
    actor,
    action: "create_access_invite",
    accessId: data.accessId || null,
    email: normalizedEmail,
    uid: data.uid || null,
    after: {
      id: docRef.id,
      ...payload,
    },
  });

  return {
    id: docRef.id,
    ...payload,
  };
};

export const listAccessInvites = async (filters = {}) => {
  requireAdminActor(filters.actor);
  const inviteSnap = await getDocs(collection(db, ACCESS_COLLECTIONS.ACCESS_INVITES));
  let records = inviteSnap.docs.map(toInviteRecord).filter(Boolean);

  if (filters.email) {
    const email = normalizeAccessEmail(filters.email);
    records = records.filter((record) => normalizeAccessEmail(record.email || record.normalizedEmail) === email);
  }

  if (filters.inviteStatus && filters.inviteStatus !== "all") {
    const status = String(filters.inviteStatus || "").trim().toLowerCase();
    records = records.filter((record) => String(record.inviteStatus || "").trim().toLowerCase() === status);
  }

  return records.sort((a, b) => {
    const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
    const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
    return bDate - aDate;
  });
};

export const regenerateAccessInviteLink = async (id = "", actor = {}, metadata = {}) => {
  const adminActor = requireAdminActor(actor);
  const oldCode = String(id || "").trim();

  if (!oldCode) throw new Error("Invite id is required.");

  const oldRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, oldCode);
  const oldSnap = await getDoc(oldRef);
  const oldInvite = toInviteRecord(oldSnap);

  if (!oldInvite) throw new Error("Invite not found.");
  if (oldInvite.inviteStatus === "used") throw new Error("Used invite cannot be regenerated.");

  const newInviteCode = createInviteCode();
  const newInviteLink = buildAccessInviteLink(newInviteCode);
  const newRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, newInviteCode);
  const batch = writeBatch(db);

  const newPayload = {
    ...oldInvite,
    id: null,
    inviteCode: newInviteCode,
    inviteLink: newInviteLink,
    inviteStatus: "pending",
    deliveryStatus: "manual_copy",
    emailSent: false,
    sentAt: null,
    usedAt: null,
    openedAt: null,
    openedByUid: null,
    openedByEmail: null,
    redeemedByUid: null,
    redeemedByEmail: null,
    redeemSource: null,
    replacedInviteCode: oldCode,
    regeneratedFrom: oldCode,
    regeneratedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    createdBy: adminActor.uid,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  batch.update(oldRef, {
    inviteStatus: "revoked",
    deliveryStatus: "regenerated",
    revokedAt: serverTimestamp(),
    replacedByInviteCode: newInviteCode,
    replacedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  });

  batch.set(newRef, newPayload);

  const auditRef = doc(collection(db, ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS));
  batch.set(auditRef, {
    action: "regenerate_access_invite_link",
    accessId: oldInvite.accessId || null,
    email: normalizeAccessEmail(oldInvite.normalizedEmail || oldInvite.email),
    uid: oldInvite.uid || null,
    before: { inviteCode: oldCode, inviteStatus: oldInvite.inviteStatus || null },
    after: { inviteCode: newInviteCode, inviteStatus: "pending" },
    metadata: { source: metadata.source || "admin_access_invites_route", oldInviteCode: oldCode, newInviteCode },
    createdAt: serverTimestamp(),
    createdBy: adminActor.uid,
    actorEmail: adminActor.email,
    actorRole: adminActor.role,
  });

  await batch.commit();

  return { success: true, oldInviteCode: oldCode, inviteCode: newInviteCode, inviteLink: newInviteLink };
};

export const updateAccessInviteStatus = async (id, inviteStatus, actor = {}, metadata = {}) => {
  const inviteId = requireAccessEntityId(id, "Invite id");
  const adminActor = requireAdminActor(actor);
  const inviteRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, inviteId);
  const beforeSnap = await getDoc(inviteRef);
  const before = toInviteRecord(beforeSnap);
  const nextStatus = String(inviteStatus || "").trim().toLowerCase();

  if (!nextStatus) {
    throw new Error("Invite status is required.");
  }

  const payload = {
    inviteStatus: nextStatus,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  if (nextStatus === "copied") {
    payload.linkCopiedAt = serverTimestamp();
    payload.deliveryStatus = "manual_copy";
  }
  if (nextStatus === "sent") {
    payload.sentAt = serverTimestamp();
    payload.manualSentAt = serverTimestamp();
    payload.deliveryStatus = "manual_sent";
  }
  if (nextStatus === "used") payload.usedAt = serverTimestamp();
  if (nextStatus === "revoked") payload.revokedAt = serverTimestamp();
  if (nextStatus === "expired") payload.expiredAt = serverTimestamp();

  await updateDoc(inviteRef, payload);

  await createAccessAuditLog({
    actor: adminActor,
    action: metadata.action || "update_access_invite_status",
    accessId: before?.accessId || null,
    email: before?.email || before?.normalizedEmail,
    uid: before?.uid || null,
    before,
    after: payload,
    metadata,
  });

  return {
    id: inviteId,
    ...payload,
  };
};

export const getAccessInviteByCode = async (inviteCode = "") => {
  const code = String(inviteCode || "").trim();

  if (!code) return null;

  const inviteSnap = await getDoc(doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, code));
  return toInviteRecord(inviteSnap);
};

export const markAccessInviteOpened = async (inviteCode = "", user = {}) => {
  const code = String(inviteCode || "").trim();
  const uid = user?.uid || "";
  const email = normalizeAccessEmail(user?.email);

  if (!code || !uid || !email) return null;

  const inviteRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, code);
  const inviteSnap = await getDoc(inviteRef);
  const invite = toInviteRecord(inviteSnap);

  if (!invite) return null;

  const inviteEmail = normalizeAccessEmail(invite.normalizedEmail || invite.email);
  const openableStatuses = ["pending", "copied", "sent"];

  if (inviteEmail !== email) return invite;
  if (!openableStatuses.includes(invite.inviteStatus)) return invite;

  const expiryDate = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : invite.expiresAt ? new Date(invite.expiresAt) : null;
  if (expiryDate && expiryDate.getTime() < Date.now()) return invite;

  await updateDoc(inviteRef, {
    inviteStatus: "opened",
    openedAt: serverTimestamp(),
    openedByUid: uid,
    openedByEmail: email,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });

  await setDoc(doc(collection(db, ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS)), {
    action: "open_access_invite",
    accessId: invite.accessId || null,
    email,
    uid,
    before: { inviteStatus: invite.inviteStatus || null },
    after: { inviteStatus: "opened" },
    metadata: {
      source: "manual_invite_link",
      inviteCode: code,
      inviteId: invite.id || code,
    },
    createdAt: serverTimestamp(),
    createdBy: uid,
    actorEmail: email,
    actorRole: "student",
  });

  return { ...invite, inviteStatus: "opened", openedByUid: uid, openedByEmail: email };
};

export const redeemAccessInvite = async (inviteCode = "", user = {}) => {
  const code = String(inviteCode || "").trim();
  const uid = user?.uid || "";
  const email = normalizeAccessEmail(user?.email);

  if (!code) throw new Error("Invite code is required.");
  if (!uid || !email) throw new Error("Please login with invited email to redeem access.");

  const inviteRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, code);
  const inviteSnap = await getDoc(inviteRef);
  const invite = toInviteRecord(inviteSnap);

  if (!invite) throw new Error("Invite not found.");

  const inviteEmail = normalizeAccessEmail(invite.normalizedEmail || invite.email);
  if (inviteEmail !== email) throw new Error("This invite belongs to another email.");

  if (invite.inviteStatus === "used") throw new Error("Invite already used.");
  if (invite.inviteStatus === "revoked") throw new Error("Invite has been revoked.");
  if (invite.inviteStatus === "expired") throw new Error("Invite has expired.");

  const expiryDate = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : invite.expiresAt ? new Date(invite.expiresAt) : null;
  if (expiryDate && expiryDate.getTime() < Date.now()) throw new Error("Invite has expired.");

  if (!invite.accessId) throw new Error("Access record missing for this invite.");

  const accessRef = doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, invite.accessId);
  const accessSnap = await getDoc(accessRef);

  if (!accessSnap.exists()) throw new Error("Student access record not found.");

  const accessData = accessSnap.data() || {};
  const accessEmail = normalizeAccessEmail(accessData.normalizedEmail || accessData.email);

  if (accessEmail !== email) throw new Error("Access record email does not match invite email.");
  if (accessData.uid && accessData.uid !== uid) throw new Error("This access is already linked to another account.");

  const batch = writeBatch(db);

  batch.update(inviteRef, {
    inviteStatus: "used",
    usedAt: serverTimestamp(),
    redeemedByUid: uid,
    redeemedByEmail: email,
    redeemSource: "manual_invite_link",
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });

  batch.update(accessRef, {
    uid,
    inviteId: invite.id || code,
    inviteRedeemedAt: serverTimestamp(),
    inviteRedeemedByUid: uid,
    inviteRedeemedByEmail: email,
    lastInviteRedeemedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });

  const auditRef = doc(collection(db, ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS));
  batch.set(auditRef, {
    action: "redeem_access_invite",
    accessId: invite.accessId,
    email,
    uid,
    before: null,
    after: { inviteStatus: "used" },
    metadata: { source: "manual_invite_link", inviteCode: code, inviteId: invite.id || code },
    createdAt: serverTimestamp(),
    createdBy: uid,
    actorEmail: email,
    actorRole: "student",
  });

  await batch.commit();

  await syncStudentEntitlementIfUid(
    {
      id: invite.accessId,
      ...accessData,
      uid,
    },
    {
      accessId: invite.accessId,
      uid,
      email,
      source: "redeem_access_invite",
    }
  );

  return { success: true, inviteId: invite.id || code, accessId: invite.accessId, email };
};

export const queueAccessInviteResend = async (id, actor = {}, metadata = {}) => {
  const inviteId = requireAccessEntityId(id, "Invite id");
  const adminActor = requireAdminActor(actor);
  const inviteRef = doc(db, ACCESS_COLLECTIONS.ACCESS_INVITES, inviteId);
  const beforeSnap = await getDoc(inviteRef);
  const before = toInviteRecord(beforeSnap);

  if (!before) {
    throw new Error("Invite record not found.");
  }

  const payload = {
    inviteStatus: "queued",
    deliveryStatus: "queued_for_backend",
    emailSent: false,
    resendCount: Number(before.resendCount || 0) + 1,
    lastResentAt: serverTimestamp(),
    expiresAt: getInviteExpiryDate(metadata.expiryDays || 7),
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  await updateDoc(inviteRef, payload);

  await createAccessAuditLog({
    actor: adminActor,
    action: "queue_access_invite_resend",
    accessId: before.accessId || null,
    email: before.email || before.normalizedEmail,
    uid: before.uid || null,
    before,
    after: payload,
    metadata,
  });

  return {
    id: inviteId,
    ...payload,
  };
};

export const updateAccessStatus = async (id, status, actor = {}, metadata = {}) => {
  const accessId = requireAccessId(id);
  const adminActor = requireAdminActor(actor);
  const before = await readAccessById(accessId);
  const payload = {
    status: String(status || "").trim().toLowerCase(),
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  if (!payload.status) {
    throw new Error("Access status is required.");
  }

  await updateDoc(doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, accessId), payload);
  const after = { ...(before || {}), ...payload, id: accessId };

  await syncStudentEntitlementIfUid(after, {
    accessId,
    actorUid: adminActor.uid,
    actorEmail: adminActor.email,
    source: "update_access_status",
  });

  await createAccessAuditLog({
    actor: adminActor,
    action: metadata.action || "update_access_status",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
    metadata,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const extendAccess = async (id, accessUntil, actor = {}, metadata = {}) => {
  const accessId = requireAccessId(id);
  const adminActor = requireAdminActor(actor);
  const before = await readAccessById(accessId);

  if (!accessUntil) {
    throw new Error("Access until date is required.");
  }

  const payload = {
    accessUntil,
    status: ACCESS_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  await updateDoc(doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, accessId), payload);
  const after = { ...(before || {}), ...payload, id: accessId };

  await syncStudentEntitlementIfUid(after, {
    accessId,
    actorUid: adminActor.uid,
    actorEmail: adminActor.email,
    source: "extend_access",
  });

  await createAccessAuditLog({
    actor: adminActor,
    action: metadata.action || "extend_access",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
    metadata,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const addAccessNote = async (id, note = "", actor = {}, metadata = {}) => {
  const accessId = requireAccessId(id);
  const adminActor = requireAdminActor(actor);
  const before = await readAccessById(accessId);
  const cleanNote = String(note || "").trim();

  if (!cleanNote) {
    throw new Error("Admin note is required.");
  }

  const payload = {
    notes: cleanNote,
    adminNote: cleanNote,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  await updateDoc(doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, accessId), payload);

  await createAccessAuditLog({
    actor: adminActor,
    action: "add_access_note",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
    metadata,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const upgradeAccess = async (id, planType, actor = {}, metadata = {}) => {
  const accessId = requireAccessId(id);
  const adminActor = requireAdminActor(actor);
  const before = await readAccessById(accessId);
  const payload = {
    planType: normalizeAccessPlan(planType),
    status: ACCESS_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  await updateDoc(doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, accessId), payload);
  const after = { ...(before || {}), ...payload, id: accessId };

  await syncStudentEntitlementIfUid(after, {
    accessId,
    actorUid: adminActor.uid,
    actorEmail: adminActor.email,
    source: "upgrade_access",
  });

  await createAccessAuditLog({
    actor: adminActor,
    action: "upgrade_access",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
    metadata,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const revokeAccess = async (id, actor = {}, metadata = {}) => {
  const accessId = requireAccessId(id);
  const adminActor = requireAdminActor(actor);
  const before = await readAccessById(accessId);
  const payload = {
    status: ACCESS_STATUS.BLOCKED,
    revokedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  await updateDoc(doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, accessId), payload);
  const after = { ...(before || {}), ...payload, id: accessId };

  await syncStudentEntitlementIfUid(after, {
    accessId,
    actorUid: adminActor.uid,
    actorEmail: adminActor.email,
    source: "revoke_access",
  });

  await createAccessAuditLog({
    actor: adminActor,
    action: "revoke_access",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
    metadata,
  });

  return {
    id: accessId,
    ...payload,
  };
};

const requireAccessEntityId = (id, label = "Access entity id") => {
  const value = String(id || "").trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
};

export const normalizeAccessKeyCode = (code = "") =>
  String(code || "").trim().toUpperCase();

export const buildAccessProductPayload = (data = {}) => ({
  title: String(data.title || data.name || "").trim(),
  name: String(data.name || data.title || "").trim(),
  description: String(data.description || "").trim(),
  course: data.course || ACCESS_COURSE.CTET_TET,
  planType: normalizeAccessPlan(data.planType || ACCESS_PLAN_TYPES.FREE),
  scopeType: data.scopeType || ACCESS_SCOPE_TYPES.PLAN,
  module: data.module || null,
  itemType: data.itemType || null,
  itemId: data.itemId || null,
  itemTitle: data.itemTitle || "",
  itemIds: Array.isArray(data.itemIds) ? data.itemIds : [],
  bundleId: data.bundleId || null,
  campaignId: data.campaignId || null,
  campaignName: data.campaignName || "",
  campaignSource: data.campaignSource || "",
  validityDays: Number(data.validityDays || 0),
  accessFrom: data.accessFrom || null,
  accessUntil: data.accessUntil || null,
  price: Number(data.price || 0),
  compareAtPrice: Number(data.compareAtPrice || 0),
  currency: data.currency || "INR",
  status: String(data.status || ACCESS_STATUS.ACTIVE).trim().toLowerCase(),
  isActive: data.isActive !== false,
  notes: data.notes || data.adminNote || "",
  adminNote: data.adminNote || data.notes || "",
  updatedAt: serverTimestamp(),
});

export const createAccessProduct = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const payload = {
    ...buildAccessProductPayload(data),
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    actorEmail: actor.email,
  };

  if (!payload.title) {
    throw new Error("Access product title is required.");
  }

  const docRef = await addDoc(
    collection(db, ACCESS_COLLECTIONS.ACCESS_PRODUCTS),
    payload
  );

  await createAccessAuditLog({
    actor,
    action: "create_access_product",
    accessId: docRef.id,
    after: {
      id: docRef.id,
      ...payload,
    },
    metadata: {
      collection: ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
      productId: docRef.id,
      scopeType: payload.scopeType,
      planType: payload.planType,
    },
  });

  return {
    id: docRef.id,
    ...payload,
  };
};

export const updateAccessProductStatus = async (id, status, actor = {}) => {
  const productId = requireAccessEntityId(id, "Access product id");
  const adminActor = requireAdminActor(actor);
  const productRef = doc(db, ACCESS_COLLECTIONS.ACCESS_PRODUCTS, productId);
  const beforeSnap = await getDoc(productRef);
  const before = toAccessRecord(beforeSnap);
  const payload = {
    status: String(status || "").trim().toLowerCase(),
    isActive: String(status || "").trim().toLowerCase() === ACCESS_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  if (!payload.status) {
    throw new Error("Access product status is required.");
  }

  await updateDoc(productRef, payload);

  await createAccessAuditLog({
    actor: adminActor,
    action: "update_access_product_status",
    accessId: productId,
    before,
    after: payload,
    metadata: {
      collection: ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
      productId,
    },
  });

  return {
    id: productId,
    ...payload,
  };
};

export const readAccessKeyByCode = async (code = "") => {
  const normalizedCode = normalizeAccessKeyCode(code);

  if (!normalizedCode) return null;

  const keySnap = await getDoc(
    doc(db, ACCESS_COLLECTIONS.ACCESS_KEYS, normalizedCode)
  );

  return toAccessRecord(keySnap);
};

export const readAccessProductById = async (productId = "") => {
  const normalizedProductId = String(productId || "").trim();

  if (!normalizedProductId) return null;

  const productSnap = await getDoc(
    doc(db, ACCESS_COLLECTIONS.ACCESS_PRODUCTS, normalizedProductId)
  );

  return toAccessRecord(productSnap);
};

export const listAccessKeys = async ({ maxCount = 25 } = {}) => {
  const keySnap = await getDocs(collection(db, ACCESS_COLLECTIONS.ACCESS_KEYS));

  return keySnap.docs
    .map(toAccessRecord)
    .filter(Boolean)
    .sort((first, second) => {
      const firstTime = first.createdAt && first.createdAt.seconds ? first.createdAt.seconds : 0;
      const secondTime = second.createdAt && second.createdAt.seconds ? second.createdAt.seconds : 0;

      return secondTime - firstTime;
    })
    .slice(0, maxCount);
};
export const buildAccessKeyPayload = (data = {}) => {
  const code = normalizeAccessKeyCode(data.code);

  if (!code) {
    throw new Error("Access key code is required.");
  }

  return {
    code,
    normalizedCode: code,
    productId: data.productId || null,
    campaignId: data.campaignId || null,
    campaignName: data.campaignName || "",
    campaignSource: data.campaignSource || "",
    course: data.course || ACCESS_COURSE.CTET_TET,
    planType: normalizeAccessPlan(data.planType || ACCESS_PLAN_TYPES.FREE),
    scopeType: data.scopeType || ACCESS_SCOPE_TYPES.PLAN,
    module: data.module || null,
    itemType: data.itemType || null,
    itemId: data.itemId || null,
    itemTitle: data.itemTitle || "",
    itemIds: Array.isArray(data.itemIds) ? data.itemIds : [],
    bundleId: data.bundleId || null,
    status: String(data.status || ACCESS_KEY_STATUS.ACTIVE).trim().toLowerCase(),
    maxUses: Number(data.maxUses || 1),
    usedCount: Number(data.usedCount || 0),
    assignedEmail: normalizeAccessEmail(data.assignedEmail || data.email || ""),
    redeemedByEmail: null,
    redeemedByUid: null,
    redeemedAt: null,
    accessFrom: data.accessFrom || null,
    accessUntil: data.accessUntil || null,
    validityDays: Number(data.validityDays || 0),
    notes: data.notes || data.adminNote || "",
    adminNote: data.adminNote || data.notes || "",
    updatedAt: serverTimestamp(),
  };
};

export const createAccessKey = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const payload = {
    ...buildAccessKeyPayload(data),
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    actorEmail: actor.email,
  };

  const existingKey = await readAccessKeyByCode(payload.code);

  if (existingKey) {
    throw new Error("Access key code already exists.");
  }

  const docRef = doc(db, ACCESS_COLLECTIONS.ACCESS_KEYS, payload.code);
  await setDoc(docRef, payload);

  await createAccessAuditLog({
    actor,
    action: "create_access_key",
    accessId: docRef.id,
    email: payload.assignedEmail,
    after: {
      id: docRef.id,
      ...payload,
    },
    metadata: {
      collection: ACCESS_COLLECTIONS.ACCESS_KEYS,
      accessKeyId: docRef.id,
      productId: payload.productId,
      campaignId: payload.campaignId || null,
      campaignName: payload.campaignName || "",
      campaignSource: payload.campaignSource || "",
      scopeType: payload.scopeType,
      planType: payload.planType,
    },
  });

  return {
    id: docRef.id,
    ...payload,
  };
};

export const updateAccessKeyStatus = async (id, status, actor = {}) => {
  const accessKeyId = requireAccessEntityId(id, "Access key id");
  const adminActor = requireAdminActor(actor);
  const keyRef = doc(db, ACCESS_COLLECTIONS.ACCESS_KEYS, accessKeyId);
  const beforeSnap = await getDoc(keyRef);
  const before = toAccessRecord(beforeSnap);
  const payload = {
    status: String(status || "").trim().toLowerCase(),
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  if (!payload.status) {
    throw new Error("Access key status is required.");
  }

  await updateDoc(keyRef, payload);

  await createAccessAuditLog({
    actor: adminActor,
    action: "update_access_key_status",
    accessId: accessKeyId,
    email: before?.assignedEmail,
    before,
    after: payload,
    metadata: {
      collection: ACCESS_COLLECTIONS.ACCESS_KEYS,
      accessKeyId,
      productId: before?.productId || null,
    },
  });

  return {
    id: accessKeyId,
    ...payload,
  };
};

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const addDaysToDateString = (days = 0) => {
  const safeDays = Number(days || 0);

  if (!Number.isFinite(safeDays) || safeDays <= 0) {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + safeDays);

  return date.toISOString().slice(0, 10);
};

const normalizeDateOnlyTime = (value = "") => {
  if (!value) return null;

  const date = new Date(String(value).slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
};

const validateAccessKeyRecordForRedeem = ({
  keyRecord,
  normalizedEmail = "",
  uid = "",
} = {}) => {
  const errors = [];

  if (!keyRecord?.id) {
    return {
      isValid: false,
      errors: ["Access key was not found."],
    };
  }

  const status = String(keyRecord.status || "").trim().toLowerCase();
  const maxUses = Math.max(Number(keyRecord.maxUses || 1), 1);
  const usedCount = Math.max(Number(keyRecord.usedCount || 0), 0);
  const assignedEmail = normalizeAccessEmail(keyRecord.assignedEmail || "");
  const todayTime = normalizeDateOnlyTime(getTodayDateString());
  const accessFromTime = normalizeDateOnlyTime(keyRecord.accessFrom || "");
  const accessUntilTime = normalizeDateOnlyTime(keyRecord.accessUntil || "");

  if (!normalizedEmail && !uid) {
    errors.push("Learner email or uid is required to redeem access key.");
  }

  if (status !== ACCESS_KEY_STATUS.ACTIVE) {
    errors.push("Access key is not active.");
  }

  if (usedCount >= maxUses) {
    errors.push("Access key usage limit is already reached.");
  }

  if (assignedEmail && normalizedEmail && assignedEmail !== normalizedEmail) {
    errors.push("Access key is assigned to another learner email.");
  }

  if (accessFromTime && todayTime && accessFromTime > todayTime) {
    errors.push("Access key is not active yet.");
  }

  if (accessUntilTime && todayTime && accessUntilTime < todayTime) {
    errors.push("Access key has expired.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAccessKeyForRedeem = async ({
  code = "",
  email = "",
  uid = "",
} = {}) => {
  const normalizedCode = normalizeAccessKeyCode(code);
  const normalizedEmail = normalizeAccessEmail(email);
  const normalizedUid = String(uid || "").trim();

  if (!normalizedCode) {
    return {
      isValid: false,
      errors: ["Access key code is required."],
      keyRecord: null,
      normalizedCode,
      normalizedEmail,
      uid: normalizedUid,
    };
  }

  const keyRecord = await readAccessKeyByCode(normalizedCode);
  const validation = validateAccessKeyRecordForRedeem({
    keyRecord,
    normalizedEmail,
    uid: normalizedUid,
  });

  const duplicateAccessRecord = keyRecord?.id
    ? await getRedeemedAccessByKeyForLearner({
        accessKeyId: keyRecord.id,
        normalizedEmail,
        uid: normalizedUid,
      })
    : null;

  const duplicateErrors = duplicateAccessRecord
    ? ["This access key is already redeemed for this learner account."]
    : [];

  return {
    ...validation,
    isValid: validation.isValid && duplicateErrors.length === 0,
    errors: [...validation.errors, ...duplicateErrors],
    duplicateAccessRecord,
    keyRecord,
    normalizedCode,
    normalizedEmail,
    uid: normalizedUid,
  };
};

const resolveEntitlementValue = (primaryValue, fallbackValue, emptyValue = null) => {
  if (Array.isArray(primaryValue)) {
    return primaryValue.length ? primaryValue : Array.isArray(fallbackValue) ? fallbackValue : [];
  }

  if (primaryValue !== undefined && primaryValue !== null && String(primaryValue).trim() !== "") {
    return primaryValue;
  }

  if (fallbackValue !== undefined && fallbackValue !== null && String(fallbackValue).trim() !== "") {
    return fallbackValue;
  }

  return emptyValue;
};

const assertResolvableAccessProduct = (productRecord = null, productId = "") => {
  if (!String(productId || "").trim()) return null;

  if (!productRecord?.id) {
    throw new Error("Linked access product was not found.");
  }

  const productStatus = String(productRecord.status || ACCESS_STATUS.ACTIVE)
    .trim()
    .toLowerCase();

  if (productRecord.isActive === false || productStatus !== ACCESS_STATUS.ACTIVE) {
    throw new Error("Linked access product is not active.");
  }

  return productRecord;
};

const resolveAccessKeyEntitlement = ({ keyRecord = {}, productRecord = null } = {}) => {
  const hasProduct = Boolean(productRecord?.id);
  const entitlementSource = hasProduct ? productRecord : keyRecord;
  const fallbackSource = hasProduct ? keyRecord : {};

  return {
    course: resolveEntitlementValue(
      entitlementSource.course,
      fallbackSource.course,
      ACCESS_COURSE.CTET_TET
    ),
    planType: normalizeAccessPlan(
      resolveEntitlementValue(
        entitlementSource.planType,
        fallbackSource.planType,
        ACCESS_PLAN_TYPES.FREE
      )
    ),
    scopeType: resolveEntitlementValue(
      entitlementSource.scopeType,
      fallbackSource.scopeType,
      ACCESS_SCOPE_TYPES.PLAN
    ),
    module: resolveEntitlementValue(entitlementSource.module, fallbackSource.module, null),
    itemType: resolveEntitlementValue(
      entitlementSource.itemType,
      fallbackSource.itemType,
      null
    ),
    itemId: resolveEntitlementValue(entitlementSource.itemId, fallbackSource.itemId, null),
    itemTitle: resolveEntitlementValue(
      entitlementSource.itemTitle,
      fallbackSource.itemTitle,
      ""
    ),
    itemIds: resolveEntitlementValue(
      entitlementSource.itemIds,
      fallbackSource.itemIds,
      []
    ),
    bundleId: resolveEntitlementValue(
      entitlementSource.bundleId,
      fallbackSource.bundleId,
      null
    ),
    productId: keyRecord.productId || productRecord?.id || null,
    campaignId: resolveEntitlementValue(keyRecord.campaignId, productRecord?.campaignId, null),
    campaignName: resolveEntitlementValue(keyRecord.campaignName, productRecord?.campaignName, ""),
    campaignSource: resolveEntitlementValue(keyRecord.campaignSource, productRecord?.campaignSource, ""),
    accessFrom: resolveEntitlementValue(
      keyRecord.accessFrom,
      productRecord?.accessFrom,
      getTodayDateString()
    ),
    accessUntil: resolveEntitlementValue(
      keyRecord.accessUntil,
      productRecord?.accessUntil,
      null
    ),
    validityDays: Number(
      resolveEntitlementValue(
        keyRecord.validityDays,
        productRecord?.validityDays,
        0
      ) || 0
    ),
  };
};

export const redeemAccessKeyFoundation = async ({
  code = "",
  email = "",
  uid = "",
  learnerName = "",
  name = "",
  phone = "",
} = {}) => {
  const validation = await validateAccessKeyForRedeem({
    code,
    email,
    uid,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join(" "));
  }

  const keyRecord = validation.keyRecord;
  const productRecord = assertResolvableAccessProduct(
    keyRecord.productId ? await readAccessProductById(keyRecord.productId) : null,
    keyRecord.productId || ""
  );
  const entitlement = resolveAccessKeyEntitlement({ keyRecord, productRecord });
  const normalizedEmail = validation.normalizedEmail;
  const normalizedUid = validation.uid;
  const keyRef = doc(db, ACCESS_COLLECTIONS.ACCESS_KEYS, keyRecord.id);

  const maxUses = Math.max(Number(keyRecord.maxUses || 1), 1);
  const nextUsedCount = Math.max(Number(keyRecord.usedCount || 0), 0) + 1;
  const nextKeyStatus =
    nextUsedCount >= maxUses ? ACCESS_KEY_STATUS.USED : ACCESS_KEY_STATUS.ACTIVE;

  const accessUntil =
    entitlement.accessUntil || addDaysToDateString(entitlement.validityDays);

  const accessPayload = {
    ...buildAccessPayload({
      email: normalizedEmail,
      uid: normalizedUid,
      learnerName: learnerName || name || "",
      name: name || learnerName || "",
      phone,
      course: entitlement.course,
      planType: entitlement.planType,
      scopeType: entitlement.scopeType,
      module: entitlement.module,
      itemType: entitlement.itemType,
      itemId: entitlement.itemId,
      itemTitle: entitlement.itemTitle,
      itemIds: Array.isArray(entitlement.itemIds) ? entitlement.itemIds : [],
      bundleId: entitlement.bundleId,
      productId: entitlement.productId,
      accessKeyId: keyRecord.id,
      campaignId: entitlement.campaignId,
      campaignName: entitlement.campaignName,
      campaignSource: entitlement.campaignSource,
      source: ACCESS_SOURCE.REDEEM_KEY,
      status: ACCESS_STATUS.ACTIVE,
      accessFrom: entitlement.accessFrom || getTodayDateString(),
      accessUntil,
      adminNote: "Redeemed access key " + validation.normalizedCode,
      notes: "Redeemed access key " + validation.normalizedCode,
    }),
    createdAt: serverTimestamp(),
    createdBy: normalizedUid || null,
    actorEmail: normalizedEmail,
  };

  const accessRef = await addDoc(
    collection(db, ACCESS_COLLECTIONS.STUDENT_ACCESS),
    accessPayload
  );
  const savedAccess = { id: accessRef.id, ...accessPayload };

  await syncStudentEntitlementIfUid(savedAccess, {
    accessId: accessRef.id,
    uid: normalizedUid,
    email: normalizedEmail,
    source: "redeem_access_key",
  });

  const keyUpdate = {
    usedCount: nextUsedCount,
    status: nextKeyStatus,
    lastRedeemedByEmail: normalizedEmail || null,
    lastRedeemedByUid: normalizedUid || null,
    lastRedeemedAt: serverTimestamp(),
    redeemedByEmail: keyRecord.redeemedByEmail || normalizedEmail || null,
    redeemedByUid: keyRecord.redeemedByUid || normalizedUid || null,
    redeemedAt: keyRecord.redeemedAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: normalizedUid || normalizedEmail || "redeem_key",
  };

  await updateDoc(keyRef, keyUpdate);

  await addDoc(collection(db, ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS), {
    action: "redeem_access_key",
    accessId: accessRef.id,
    email: normalizedEmail,
    uid: normalizedUid || null,
    before: { accessKey: keyRecord, product: productRecord },
    after: {
      access: {
        id: accessRef.id,
        ...accessPayload,
      },
      accessKey: {
        id: keyRecord.id,
        ...keyUpdate,
      },
    },
    metadata: {
      collection: ACCESS_COLLECTIONS.ACCESS_KEYS,
      accessKeyId: keyRecord.id,
      productId: entitlement.productId || null,
      campaignId: entitlement.campaignId || null,
      campaignName: entitlement.campaignName || "",
      campaignSource: entitlement.campaignSource || "",
      scopeType: entitlement.scopeType || ACCESS_SCOPE_TYPES.PLAN,
      planType: entitlement.planType || ACCESS_PLAN_TYPES.FREE,
      source: ACCESS_SOURCE.REDEEM_KEY,
    },
    createdAt: serverTimestamp(),
    createdBy: normalizedUid || null,
    actorEmail: normalizedEmail,
    actorRole: "student",
  });

  return {
    access: {
      id: accessRef.id,
      ...accessPayload,
    },
    accessKey: {
      id: keyRecord.id,
      ...keyUpdate,
    },
  };
};

const PAYMENT_PLAN_NAME_MAP = Object.freeze({
  "Personal Mentorship": ACCESS_PLAN_TYPES.MENTORSHIP,
  "Premium Batch": ACCESS_PLAN_TYPES.PREMIUM,
  "Topic-wise Courses": ACCESS_PLAN_TYPES.BASIC,
});

function resolvePaymentPlanType(payment = {}) {
  const mappedPlan =
    PAYMENT_PLAN_NAME_MAP[payment.planName] ||
    payment.planType ||
    payment.activePlan ||
    payment.subscriptionType ||
    ACCESS_PLAN_TYPES.PREMIUM;

  return normalizeAccessPlan(mappedPlan);
}

function resolvePaymentValidityMonths(payment = {}) {
  const rawMonths =
    payment.validityMonths ||
    payment.durationMonths ||
    payment.durationInMonths ||
    payment.selectedDurationMonths ||
    payment.duration;

  const parsedMonths = Number(rawMonths);

  if (Number.isFinite(parsedMonths) && Math.max(parsedMonths, 0) === parsedMonths && parsedMonths !== 0) {
    return parsedMonths;
  }

  return 6;
}

function toPaymentAccessDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addPaymentAccessMonths(date, months) {
  const baseDate = toPaymentAccessDate(date) || new Date();
  const nextDate = new Date(baseDate.getTime());

  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
}

function getPaymentPlanLevel(planType) {
  return ACCESS_PLAN_LEVELS[normalizeAccessPlan(planType)] || 0;
}

function uniquePaymentAccessRecords(records = []) {
  const recordMap = new Map();

  records.filter(Boolean).forEach(function(record) {
    const key =
      record.id ||
      (String(record.uid || "") + ":" + String(record.normalizedEmail || record.email || ""));

    if (key && !recordMap.has(key)) {
      recordMap.set(key, record);
    }
  });

  return Array.from(recordMap.values());
}

function pickPaymentAccessRecord(records = []) {
  return records.find(function(record) {
    return (record.course || ACCESS_COURSE.CTET_TET) === ACCESS_COURSE.CTET_TET && (record.scopeType || ACCESS_SCOPE_TYPES.PLAN) === ACCESS_SCOPE_TYPES.PLAN;
  }) || records[0] || null;
}

export async function grantPaymentAccess(payment = {}, actor = {}) {
  const adminActor = requireAdminActor(actor);
  const normalizedEmail = normalizeAccessEmail(payment.studentEmail || payment.email || payment.userEmail);
  const uid = String(payment.userId || payment.uid || "").trim();

  if (!normalizedEmail && !uid) {
    throw new Error("Payment access requires learner email or user id.");
  }

  const paymentPlanType = resolvePaymentPlanType(payment);
  const validityMonths = resolvePaymentValidityMonths(payment);
  const accessFrom = payment.accessFrom || payment.purchaseDate || new Date();
  const paymentAccessUntil =
    payment.accessUntil ||
    payment.expiryDate ||
    addPaymentAccessMonths(accessFrom, validityMonths);

  const uidMatches = uid ? await getAccessByUid(uid) : [];
  const emailMatches = normalizedEmail ? await getAccessByEmail(normalizedEmail) : [];
  const existingAccess = pickPaymentAccessRecord(uniquePaymentAccessRecords(uidMatches.concat(emailMatches)));

  const before = existingAccess ? Object.assign({}, existingAccess) : null;
  const existingPlanLevel = before ? getPaymentPlanLevel(before.planType) : -1;
  const paymentPlanLevel = getPaymentPlanLevel(paymentPlanType);
  const shouldPreserveExistingPlan = Boolean(before && Math.max(existingPlanLevel, paymentPlanLevel) === existingPlanLevel && existingPlanLevel !== paymentPlanLevel);
  const finalPlanType = shouldPreserveExistingPlan ? normalizeAccessPlan(before.planType) : paymentPlanType;

  const existingUntilDate = before ? toPaymentAccessDate(before.accessUntil) : null;
  const paymentUntilDate = toPaymentAccessDate(paymentAccessUntil);
  const shouldPreserveExistingUntil = Boolean(existingUntilDate && paymentUntilDate && Math.max(existingUntilDate.getTime(), paymentUntilDate.getTime()) === existingUntilDate.getTime() && existingUntilDate.getTime() !== paymentUntilDate.getTime());
  const finalAccessUntil = shouldPreserveExistingUntil ? before.accessUntil : paymentAccessUntil;

  const payload = Object.assign({}, buildAccessPayload({
    email: normalizedEmail,
    uid,
    name: payment.studentName || payment.name || "",
    learnerName: payment.studentName || payment.learnerName || payment.name || "",
    phone: payment.studentMobile || payment.phone || "",
    planType: finalPlanType,
    status: ACCESS_STATUS.ACTIVE,
    source: ACCESS_SOURCE.PAYMENT,
    course: payment.course || ACCESS_COURSE.CTET_TET,
    scopeType: ACCESS_SCOPE_TYPES.PLAN,
    accessFrom,
    accessUntil: finalAccessUntil,
    notes: payment.notes || payment.adminNote || ("Payment approved" + (payment.orderId ? ": " + payment.orderId : "")),
  }), {
    paymentId: payment.paymentId || payment.id || null,
    paymentRequestId: payment.paymentRequestId || payment.id || null,
    orderId: payment.orderId || "",
    amount: payment.amount || null,
    paymentPlanName: payment.planName || "",
    validityMonths,
    updatedBy: adminActor.uid,
  });

  const auditMetadata = {
    source: ACCESS_SOURCE.PAYMENT,
    paymentId: payload.paymentId,
    paymentRequestId: payload.paymentRequestId,
    orderId: payload.orderId,
    amount: payload.amount,
    requestedPlanType: paymentPlanType,
    finalPlanType,
    validityMonths,
    conflictSafe: Boolean(before),
    preservedHigherPlan: shouldPreserveExistingPlan,
    preservedLongerValidity: shouldPreserveExistingUntil,
  };

  if (before && before.id) {
    await updateDoc(doc(db, ACCESS_COLLECTIONS.STUDENT_ACCESS, before.id), payload);
    const updatedAccess = Object.assign({}, before, payload, { id: before.id });

    await syncStudentEntitlementIfUid(updatedAccess, {
      accessId: before.id,
      actorUid: adminActor.uid,
      actorEmail: adminActor.email,
      source: "payment_access_updated",
    });

    await createAccessAuditLog({
      actor: adminActor,
      action: "PAYMENT_ACCESS_GRANTED",
      accessId: before.id,
      email: payload.email,
      uid: payload.uid,
      before,
      after: payload,
      metadata: auditMetadata,
    });

    return Object.assign({}, before, payload, {
      id: before.id,
      accessWriteMode: "updated",
    });
  }

  const createPayload = Object.assign({}, payload, {
    createdAt: serverTimestamp(),
    createdBy: adminActor.uid,
    actorEmail: adminActor.email,
  });

  const docRef = await addDoc(collection(db, ACCESS_COLLECTIONS.STUDENT_ACCESS), createPayload);
  const createdAccess = { id: docRef.id, ...createPayload };

  await syncStudentEntitlementIfUid(createdAccess, {
    accessId: docRef.id,
    actorUid: adminActor.uid,
    actorEmail: adminActor.email,
    source: "payment_access_created",
  });

  await createAccessAuditLog({
    actor: adminActor,
    action: "PAYMENT_ACCESS_GRANTED",
    accessId: docRef.id,
    email: createPayload.email,
    uid: createPayload.uid,
    before: null,
    after: createPayload,
    metadata: auditMetadata,
  });

  return Object.assign({}, createPayload, {
    id: docRef.id,
    accessWriteMode: "created",
  });
}
