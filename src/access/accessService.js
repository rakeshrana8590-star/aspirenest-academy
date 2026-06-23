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
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_KEY_STATUS,
  ACCESS_PLAN_TYPES,
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

  if (!normalizedEmail) {
    throw new Error("Invite email is required.");
  }

  const payload = {
    email: normalizedEmail,
    normalizedEmail,
    learnerName: name,
    name,
    phone,
    course: data.course || ACCESS_COURSE.CTET_TET,
    planType: normalizeAccessPlan(data.planType || ACCESS_PLAN_TYPES.FREE),
    status: data.status || ACCESS_STATUS.PENDING,
    inviteStatus: data.inviteStatus || "pending",
    sendInvite: data.sendInvite === true,
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

  const docRef = await addDoc(collection(db, ACCESS_COLLECTIONS.ACCESS_INVITES), payload);

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

  return {
    ...validation,
    keyRecord,
    normalizedCode,
    normalizedEmail,
    uid: normalizedUid,
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
  const normalizedEmail = validation.normalizedEmail;
  const normalizedUid = validation.uid;
  const keyRef = doc(db, ACCESS_COLLECTIONS.ACCESS_KEYS, keyRecord.id);

  const maxUses = Math.max(Number(keyRecord.maxUses || 1), 1);
  const nextUsedCount = Math.max(Number(keyRecord.usedCount || 0), 0) + 1;
  const nextKeyStatus =
    nextUsedCount >= maxUses ? ACCESS_KEY_STATUS.USED : ACCESS_KEY_STATUS.ACTIVE;

  const accessUntil =
    keyRecord.accessUntil || addDaysToDateString(keyRecord.validityDays);

  const accessPayload = {
    ...buildAccessPayload({
      email: normalizedEmail,
      uid: normalizedUid,
      learnerName: learnerName || name || "",
      name: name || learnerName || "",
      phone,
      course: keyRecord.course || ACCESS_COURSE.CTET_TET,
      planType: keyRecord.planType || ACCESS_PLAN_TYPES.FREE,
      scopeType: keyRecord.scopeType || ACCESS_SCOPE_TYPES.PLAN,
      module: keyRecord.module || null,
      itemType: keyRecord.itemType || null,
      itemId: keyRecord.itemId || null,
      itemTitle: keyRecord.itemTitle || "",
      itemIds: Array.isArray(keyRecord.itemIds) ? keyRecord.itemIds : [],
      bundleId: keyRecord.bundleId || null,
      productId: keyRecord.productId || null,
      accessKeyId: keyRecord.id,
      source: ACCESS_SOURCE.REDEEM_KEY,
      status: ACCESS_STATUS.ACTIVE,
      accessFrom: keyRecord.accessFrom || getTodayDateString(),
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
    before: keyRecord,
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
      productId: keyRecord.productId || null,
      scopeType: keyRecord.scopeType || ACCESS_SCOPE_TYPES.PLAN,
      planType: keyRecord.planType || ACCESS_PLAN_TYPES.FREE,
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