import {
  ACCESS_KEY_STATUS,
} from "./accessConstants";

const cleanValue = (value = "") =>
  String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanValue(value).toLowerCase();

const toComparableTime = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();

    return Number.isNaN(time) ? null : time;
  }

  if (typeof value?.toDate === "function") {
    return toComparableTime(value.toDate());
  }

  if (typeof value?.seconds === "number") {
    const time = Number(value.seconds) * 1000;

    return Number.isFinite(time) ? time : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const time = new Date(value).getTime();

    return Number.isNaN(time) ? null : time;
  }

  return null;
};

const normalizeDateOnlyTime = (value) => {
  const normalized = cleanValue(value);

  if (!normalized) {
    return null;
  }

  const dateOnly = normalized.includes("T")
    ? normalized.slice(0, 10)
    : normalized;
  const time = new Date(`${dateOnly}T00:00:00`).getTime();

  return Number.isNaN(time) ? null : time;
};

const hashText = (
  value = "",
  seed = 2166136261
) => {
  let hash = seed >>> 0;
  const input = String(value || "");

  for (
    let index = 0;
    index < input.length;
    index += 1
  ) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash.toString(36).padStart(7, "0");
};

const buildStableId = ({
  prefix,
  action,
  entityId,
  uid,
  email,
}) => {
  const normalizedPrefix = cleanValue(prefix)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
  const normalizedAction = cleanValue(action)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
  const normalizedEntityId = cleanValue(entityId);
  const normalizedUid = cleanValue(uid);
  const normalizedEmail = normalizeEmail(email);
  const principalRef = normalizedUid
    ? `uid:${normalizedUid}`
    : normalizedEmail
      ? `email:${normalizedEmail}`
      : "";

  if (
    !normalizedPrefix ||
    !normalizedAction ||
    !normalizedEntityId ||
    !principalRef
  ) {
    throw new Error(
      "Redemption document identity is incomplete."
    );
  }

  const identity = [
    normalizedAction,
    normalizedEntityId,
    principalRef,
  ].join("|");
  const firstHash = hashText(identity);
  const secondHash = hashText(
    identity.split("").reverse().join(""),
    2246822519
  );
  const safeTail = normalizedEntityId
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(-36);

  return [
    normalizedPrefix,
    firstHash + secondHash,
    safeTail || "redemption",
  ].join("_");
};

export const buildInviteOpenAuditId = ({
  inviteId = "",
  uid = "",
  email = "",
} = {}) =>
  buildStableId({
    prefix: "audit_invite_open",
    action: "invite_open",
    entityId: inviteId,
    uid,
    email,
  });

export const buildInviteRedemptionAuditId = ({
  inviteId = "",
  uid = "",
  email = "",
} = {}) =>
  buildStableId({
    prefix: "audit_invite_redeem",
    action: "invite_redeem",
    entityId: inviteId,
    uid,
    email,
  });

export const buildAccessKeyRedemptionAccessId = ({
  accessKeyId = "",
  uid = "",
  email = "",
} = {}) =>
  buildStableId({
    prefix: "key_grant",
    action: "access_key_redeem",
    entityId: accessKeyId,
    uid,
    email,
  });

export const buildAccessKeyRedemptionAuditId = ({
  accessKeyId = "",
  uid = "",
  email = "",
} = {}) =>
  buildStableId({
    prefix: "audit_key_redeem",
    action: "access_key_redeem",
    entityId: accessKeyId,
    uid,
    email,
  });

export const validateInviteOpenTransaction = ({
  invite = null,
  uid = "",
  email = "",
  now = Date.now(),
} = {}) => {
  const errors = [];
  const normalizedUid = cleanValue(uid);
  const normalizedEmail = normalizeEmail(email);
  const inviteEmail = normalizeEmail(
    invite?.normalizedEmail || invite?.email
  );
  const status = cleanValue(
    invite?.inviteStatus || ""
  ).toLowerCase();
  const expiresAt = toComparableTime(
    invite?.expiresAt
  );
  const openableStatuses = new Set([
    "pending",
    "copied",
    "sent",
  ]);

  if (!invite?.id) {
    errors.push("Invite not found.");
  }

  if (!normalizedUid || !normalizedEmail) {
    errors.push(
      "Please login with invited email to open access."
    );
  }

  if (
    inviteEmail &&
    normalizedEmail &&
    inviteEmail !== normalizedEmail
  ) {
    errors.push(
      "This invite belongs to another email."
    );
  }

  if (
    expiresAt !== null &&
    expiresAt < Number(now)
  ) {
    errors.push("Invite has expired.");
  }

  if (status === "opened") {
    const openedByUid = cleanValue(
      invite?.openedByUid
    );
    const openedByEmail = normalizeEmail(
      invite?.openedByEmail
    );

    if (
      (!openedByUid || openedByUid === normalizedUid) &&
      (!openedByEmail ||
        openedByEmail === normalizedEmail)
    ) {
      return {
        isValid: errors.length === 0,
        shouldWrite: false,
        errors,
      };
    }

    errors.push(
      "Invite is already opened by another account."
    );
  } else if (!openableStatuses.has(status)) {
    errors.push("Invite cannot be opened.");
  }

  return {
    isValid: errors.length === 0,
    shouldWrite: errors.length === 0,
    errors,
  };
};

export const validateInviteRedemptionTransaction = ({
  invite = null,
  access = null,
  uid = "",
  email = "",
  now = Date.now(),
} = {}) => {
  const errors = [];
  const normalizedUid = cleanValue(uid);
  const normalizedEmail = normalizeEmail(email);
  const inviteEmail = normalizeEmail(
    invite?.normalizedEmail || invite?.email
  );
  const accessEmail = normalizeEmail(
    access?.normalizedEmail || access?.email
  );
  const inviteStatus = cleanValue(
    invite?.inviteStatus || ""
  ).toLowerCase();
  const accessUid = cleanValue(access?.uid);
  const expiresAt = toComparableTime(
    invite?.expiresAt
  );
  const redeemableStatuses = new Set([
    "pending",
    "copied",
    "sent",
    "opened",
  ]);

  if (!invite?.id) {
    errors.push("Invite not found.");
  }

  if (!normalizedUid || !normalizedEmail) {
    errors.push(
      "Please login with invited email to redeem access."
    );
  }

  if (
    inviteEmail &&
    normalizedEmail &&
    inviteEmail !== normalizedEmail
  ) {
    errors.push(
      "This invite belongs to another email."
    );
  }

  if (!redeemableStatuses.has(inviteStatus)) {
    if (inviteStatus === "used") {
      errors.push("Invite already used.");
    } else if (inviteStatus === "revoked") {
      errors.push("Invite has been revoked.");
    } else {
      errors.push("Invite has expired.");
    }
  }

  if (
    expiresAt !== null &&
    expiresAt < Number(now)
  ) {
    errors.push("Invite has expired.");
  }

  if (!cleanValue(invite?.accessId)) {
    errors.push(
      "Access record missing for this invite."
    );
  }

  if (!access?.id) {
    errors.push("Student access record not found.");
  }

  if (
    accessEmail &&
    normalizedEmail &&
    accessEmail !== normalizedEmail
  ) {
    errors.push(
      "Access record email does not match invite email."
    );
  }

  if (
    accessUid &&
    normalizedUid &&
    accessUid !== normalizedUid
  ) {
    errors.push(
      "This access is already linked to another account."
    );
  }

  return {
    isValid: errors.length === 0,
    errors: Array.from(new Set(errors)),
  };
};

export const validateAccessKeyRedemptionTransaction = ({
  keyRecord = null,
  existingAccess = null,
  uid = "",
  email = "",
  today = new Date(),
} = {}) => {
  const errors = [];
  const normalizedUid = cleanValue(uid);
  const normalizedEmail = normalizeEmail(email);
  const status = cleanValue(
    keyRecord?.status || ""
  ).toLowerCase();
  const maxUses = Math.max(
    Number(keyRecord?.maxUses || 1),
    1
  );
  const usedCount = Math.max(
    Number(keyRecord?.usedCount || 0),
    0
  );
  const assignedEmail = normalizeEmail(
    keyRecord?.assignedEmail || ""
  );
  const todayTime = normalizeDateOnlyTime(
    today instanceof Date
      ? today.toISOString()
      : today
  );
  const accessFromTime = normalizeDateOnlyTime(
    keyRecord?.accessFrom || ""
  );
  const accessUntilTime = normalizeDateOnlyTime(
    keyRecord?.accessUntil || ""
  );

  if (!keyRecord?.id) {
    errors.push("Access key was not found.");
  }

  if (!normalizedUid || !normalizedEmail) {
    errors.push(
      "Verified learner uid and email are required."
    );
  }

  if (existingAccess?.id) {
    errors.push(
      "This access key is already redeemed for this learner account."
    );
  }

  if (status !== ACCESS_KEY_STATUS.ACTIVE) {
    errors.push("Access key is not active.");
  }

  if (usedCount >= maxUses) {
    errors.push(
      "Access key usage limit is already reached."
    );
  }

  if (
    assignedEmail &&
    normalizedEmail &&
    assignedEmail !== normalizedEmail
  ) {
    errors.push(
      "Access key is assigned to another learner email."
    );
  }

  if (
    accessFromTime &&
    todayTime &&
    accessFromTime > todayTime
  ) {
    errors.push("Access key is not active yet.");
  }

  if (
    accessUntilTime &&
    todayTime &&
    accessUntilTime < todayTime
  ) {
    errors.push("Access key has expired.");
  }

  return {
    isValid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    maxUses,
    usedCount,
  };
};

export const buildNextAccessKeyUsage = (
  keyRecord = {}
) => {
  const maxUses = Math.max(
    Number(keyRecord.maxUses || 1),
    1
  );
  const usedCount = Math.max(
    Number(keyRecord.usedCount || 0),
    0
  );

  if (
    cleanValue(keyRecord.status).toLowerCase() !==
      ACCESS_KEY_STATUS.ACTIVE ||
    usedCount >= maxUses
  ) {
    throw new Error(
      "Access key cannot consume another use."
    );
  }

  const nextUsedCount = usedCount + 1;

  return {
    maxUses,
    usedCount,
    nextUsedCount,
    nextStatus:
      nextUsedCount >= maxUses
        ? ACCESS_KEY_STATUS.USED
        : ACCESS_KEY_STATUS.ACTIVE,
  };
};

export const requireAtomicAccessUntil = ({
  accessUntil = null,
  productId = "",
} = {}) => {
  if (
    accessUntil === null ||
    accessUntil === undefined ||
    cleanValue(accessUntil) === ""
  ) {
    throw new Error(
      productId
        ? "Linked access product requires a fixed access-until date before student redemption."
        : "Access key requires a fixed access-until date before student redemption."
    );
  }

  return accessUntil;
};
