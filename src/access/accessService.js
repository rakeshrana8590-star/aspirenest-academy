import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import {
  ACCESS_COURSE,
  ACCESS_PLAN_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "./accessConstants";
import { normalizeAccessPlan } from "./accessUtils";

export const ACCESS_COLLECTIONS = Object.freeze({
  STUDENT_ACCESS: "studentAccess",
  ACCESS_INVITES: "accessInvites",
  ACCESS_AUDIT_LOGS: "accessAuditLogs",
  USERS: "users",
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
    status: String(data.status || ACCESS_STATUS.ACTIVE).trim().toLowerCase(),
    source: data.source || ACCESS_SOURCE.ADMIN_MANUAL,
    course: data.course || ACCESS_COURSE.CTET_TET,
    module: data.module || null,
    accessUntil: data.accessUntil || null,
    notes: data.notes || "",
    updatedAt: serverTimestamp(),
  };
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

export const updateAccessStatus = async (id, status, actor = {}) => {
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

  await createAccessAuditLog({
    actor: adminActor,
    action: "update_access_status",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const extendAccess = async (id, accessUntil, actor = {}) => {
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

  await createAccessAuditLog({
    actor: adminActor,
    action: "extend_access",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const upgradeAccess = async (id, planType, actor = {}) => {
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

  await createAccessAuditLog({
    actor: adminActor,
    action: "upgrade_access",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
  });

  return {
    id: accessId,
    ...payload,
  };
};

export const revokeAccess = async (id, actor = {}) => {
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

  await createAccessAuditLog({
    actor: adminActor,
    action: "revoke_access",
    accessId,
    email: before?.email,
    uid: before?.uid,
    before,
    after: payload,
  });

  return {
    id: accessId,
    ...payload,
  };
};
