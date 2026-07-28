import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
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
import {
  ACCESS_GRANT_STATUS_VALUES,
  ACCESS_KEY_GRANT_STATUS_VALUES,
  normalizeAndValidateGrantInput,
  normalizeAndValidateGrantTarget,
} from "./accessGrantContract";
import {
  buildDeterministicGrantDocumentId,
  buildGrantFamilyKey,
  buildIdempotentGrantResolution,
  assertGrantCandidateIdentitySafe,
  findGrantCandidates,
  isGrantCandidate,
  resolvePlanChange,
} from "./accessGrantLifecycle";
import {
  buildEffectiveEntitlementProjection,
  buildStudentEntitlementId,
} from "./accessEntitlementProjection";
import {
  buildAccessKeyRedemptionAccessId,
  buildAccessKeyRedemptionAuditId,
  buildInviteOpenAuditId,
  buildInviteRedemptionAuditId,
  buildNextAccessKeyUsage,
  requireAtomicAccessUntil,
  validateAccessKeyRedemptionTransaction,
  validateInviteOpenTransaction,
  validateInviteRedemptionTransaction,
} from "./accessRedemptionTransaction";
import {
  ACCESS_IDENTITY_CLAIM_SOURCE,
  buildIdentityClaimBatches,
  buildPendingAccessIdentityClaimPlan,
} from "./accessIdentityClaim";
import {
  ACCESS_BULK_IMPORT_STATUS,
  ACCESS_BULK_ROW_STATUS,
  resolveBulkImportStatus,
  selectResumableBulkAccessRows,
  summarizeBulkAccessRows,
} from "./accessBulkLifecycle";
import {
  buildPlanCatalogCreatePayload,
  buildPlanCatalogDocumentId,
  buildPlanCatalogUpdatePayload,
} from "./accessPlanCatalogPersistence";
import {
  buildRuntimeEntitlementRecord,
  buildRuntimeGrantRecord,
  resolveAccessKeyGrantTerms,
} from "./accessGrantRuntime";

export const ACCESS_COLLECTIONS = Object.freeze({
  STUDENT_ACCESS: "studentAccess",
  ACCESS_PRODUCTS: "accessProducts",
  ACCESS_KEYS: "accessKeys",
  ACCESS_INVITES: "accessInvites",
  ACCESS_AUDIT_LOGS: "accessAuditLogs",
  USERS: "users",
  STUDENT_ENTITLEMENTS: "studentEntitlements",
  ACCESS_BULK_IMPORTS: "accessBulkImports",
  ACCESS_BULK_IMPORT_ROWS: "accessBulkImportRows",
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
  const grant =
    buildRuntimeGrantRecord(
      {
        ...data,
        email:
          normalizeAccessEmail(
            data.email
          ),
      },
      {
        allowEmailPrincipal: true,
        allowedStatuses:
          ACCESS_GRANT_STATUS_VALUES,
      }
    );

  return {
    email: grant.email,
    normalizedEmail:
      grant.normalizedEmail,
    uid: grant.uid,
    planType:
      grant.planType,
    planCode:
      grant.planCode,
    accessRank:
      grant.accessRank,
    productId:
      grant.productId,
    purchaseTermsSnapshot:
      grant.purchaseTermsSnapshot,
    termsSnapshot:
      grant.termsSnapshot,
    priceVersion:
      grant.purchaseTermsSnapshot
        ?.priceVersion ??
      data.priceVersion ??
      null,
    validityMode:
      grant.validityMode,
    noExpiry:
      grant.noExpiry,
    untilManualChange:
      grant.untilManualChange,
    scopeType:
      grant.scopeType,
    status:
      grant.status,
    source:
      grant.source,
    course:
      grant.course,
    module:
      grant.module,
    itemType:
      grant.itemType,
    itemId:
      grant.itemId,
    itemTitle:
      grant.itemTitle,
    itemIds:
      grant.itemIds,
    bundleId:
      grant.bundleId,
    accessKeyId:
      data.accessKeyId ||
      null,
    campaignId:
      data.campaignId ||
      null,
    campaignName:
      data.campaignName ||
      "",
    campaignSource:
      data.campaignSource ||
      "",
    learnerName:
      String(
        data.learnerName ||
          data.name ||
          ""
      ).trim(),
    name:
      String(
        data.name ||
          data.learnerName ||
          ""
      ).trim(),
    phone:
      String(
        data.phone || ""
      ).trim(),
    accessFrom:
      grant.accessFrom,
    accessUntil:
      grant.accessUntil,
    notes:
      data.notes ||
      data.adminNote ||
      "",
    adminNote:
      data.adminNote ||
      data.notes ||
      "",
    updatedAt:
      serverTimestamp(),
  };
};


export { buildStudentEntitlementId };

export const buildStudentEntitlementPayload = (
  accessRecord = {},
  metadata = {}
) => {
  const runtime =
    buildRuntimeEntitlementRecord(
      accessRecord,
      metadata
    );
  const entitlementId =
    buildStudentEntitlementId(
      accessRecord
    );

  return {
    id: entitlementId,
    ...runtime,
    updatedAt:
      serverTimestamp(),
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


const uniqueProjectionAccessRecords = (records = []) => {
  const recordMap = new Map();

  (Array.isArray(records) ? records : [])
    .filter(Boolean)
    .forEach((record) => {
      const recordId = String(record.id || "").trim();

      if (recordId && !recordMap.has(recordId)) {
        recordMap.set(recordId, record);
      }
    });

  return Array.from(recordMap.values());
};

export const syncStudentEntitlementProjection = async ({
  uid = "",
  email = "",
  accessRecords = null,
  metadata = {},
} = {}) => {
  const learnerUid = String(uid || "").trim();
  const learnerEmail = normalizeAccessEmail(email);

  if (!learnerUid) {
    throw new Error(
      "Effective entitlement projection requires uid."
    );
  }

  const records = Array.isArray(accessRecords)
    ? uniqueProjectionAccessRecords(accessRecords)
    : uniqueProjectionAccessRecords([
        ...(await getAccessByUid(learnerUid)),
        ...(learnerEmail
          ? await getAccessByEmail(learnerEmail)
          : []),
      ]);

  const projection =
    buildEffectiveEntitlementProjection(records, {
      uid: learnerUid,
      email: learnerEmail,
      now:
        metadata.now instanceof Date
          ? metadata.now.getTime()
          : metadata.now || Date.now(),
    });
  const batch = writeBatch(db);
  const projectedPayloads = [];

  projection.desiredEntitlements.forEach(
    ({ id: entitlementId, effectiveRecord }) => {
      const payload = buildStudentEntitlementPayload(
        {
          ...effectiveRecord,
          status: ACCESS_STATUS.ACTIVE,
        },
        {
          uid: learnerUid,
          email: learnerEmail,
          accessId:
            effectiveRecord.id ||
            effectiveRecord.accessId ||
            null,
        }
      );
      const entitlementRef = doc(
        db,
        ACCESS_COLLECTIONS.STUDENT_ENTITLEMENTS,
        learnerUid,
        "items",
        entitlementId
      );

      batch.set(entitlementRef, payload);
      projectedPayloads.push(payload);
    }
  );

  projection.staleEntitlementIds.forEach(
    (entitlementId) => {
      const entitlementRef = doc(
        db,
        ACCESS_COLLECTIONS.STUDENT_ENTITLEMENTS,
        learnerUid,
        "items",
        entitlementId
      );

      batch.delete(entitlementRef);
    }
  );

  if (
    projectedPayloads.length ||
    projection.staleEntitlementIds.length
  ) {
    await batch.commit();
  }

  return {
    ...projection,
    projectedPayloads,
    projectionSource:
      metadata.source ||
      "effective_entitlement_projection",
  };
};

const syncStudentEntitlementProjectionIfUid = async (
  accessRecord = {},
  metadata = {}
) => {
  const uid = String(
    accessRecord.uid || metadata.uid || ""
  ).trim();

  if (!uid) {
    return null;
  }

  return syncStudentEntitlementProjection({
    uid,
    email:
      accessRecord.normalizedEmail ||
      accessRecord.email ||
      metadata.email ||
      "",
    metadata,
  });
};

export const getAccessByEmail = async (email) => {
  const normalizedEmail = normalizeAccessEmail(email);

  if (!normalizedEmail) return [];

  const [normalizedMatches, legacyEmailMatches] =
    await Promise.all([
      readAccessQuery(
        "normalizedEmail",
        normalizedEmail
      ),
      readAccessQuery("email", normalizedEmail),
    ]);
  const recordsById = new Map();

  [...normalizedMatches, ...legacyEmailMatches]
    .filter(Boolean)
    .forEach((record) => {
      const recordId = String(
        record.id || ""
      ).trim();

      if (recordId && !recordsById.has(recordId)) {
        recordsById.set(recordId, record);
      }
    });

  return Array.from(recordsById.values());
};

export const getAccessByUid = async (uid) => {
  const normalizedUid = String(uid || "").trim();

  if (!normalizedUid) return [];

  return readAccessQuery("uid", normalizedUid);
};

export const claimPendingAccessIdentity = async ({
  user = {},
  maxClaimRecords = 75,
} = {}) => {
  const uid = String(user?.uid || "").trim();
  const email = normalizeAccessEmail(user?.email);

  if (!uid || !email) {
    throw new Error(
      "Verified identity claim requires an authenticated uid and email."
    );
  }

  const [emailRecords, uidRecords] =
    await Promise.all([
      getAccessByEmail(email),
      getAccessByUid(uid),
    ]);
  const recordsById = new Map();

  [...emailRecords, ...uidRecords]
    .filter(Boolean)
    .forEach((record) => {
      const recordId = String(record.id || "").trim();

      if (recordId && !recordsById.has(recordId)) {
        recordsById.set(recordId, record);
      }
    });

  const allRecords = Array.from(
    recordsById.values()
  );
  const plan =
    buildPendingAccessIdentityClaimPlan(
      allRecords,
      {
        uid,
        email,
        maxClaimRecords,
      }
    );

  if (plan.noOp) {
    return {
      success: true,
      noOp: true,
      uid,
      email,
      claimedCount: 0,
      alreadyClaimedCount:
        plan.alreadyClaimedCount,
      entitlementCount: 0,
    };
  }

  const projectedRecordsById = new Map();

  allRecords.forEach((record) => {
    const recordId = String(record.id || "").trim();

    if (recordId) {
      projectedRecordsById.set(recordId, record);
    }
  });

  plan.claimOperations.forEach((operation) => {
    projectedRecordsById.set(
      operation.accessId,
      operation.after
    );
  });

  const projection =
    buildEffectiveEntitlementProjection(
      Array.from(projectedRecordsById.values()),
      { uid, email }
    );
  const entitlementIds = new Set();
  const desiredEntitlementByAccessId = new Map();

  projection.desiredEntitlements.forEach(
    ({ id: entitlementId, effectiveRecord }) => {
      const accessId = String(
        effectiveRecord?.id ||
          effectiveRecord?.accessId ||
          ""
      ).trim();

      if (accessId) {
        desiredEntitlementByAccessId.set(
          accessId,
          { entitlementId, effectiveRecord }
        );
      }
    }
  );

  const claimBatches = buildIdentityClaimBatches(
    plan.claimOperations,
    {
      preferredAccessIds: Array.from(
        desiredEntitlementByAccessId.keys()
      ),
    }
  );

  for (const claimBatch of claimBatches) {
    const batch = writeBatch(db);

    claimBatch.forEach((operation) => {
      const accessRef = doc(
        db,
        ACCESS_COLLECTIONS.STUDENT_ACCESS,
        operation.accessId
      );
      const auditRef = doc(
        db,
        ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS,
        operation.auditId
      );
      const desiredEntitlement =
        desiredEntitlementByAccessId.get(
          operation.accessId
        ) || null;
      const entitlementId =
        desiredEntitlement?.entitlementId || "";

      if (desiredEntitlement) {
        const payload =
          buildStudentEntitlementPayload(
            {
              ...desiredEntitlement.effectiveRecord,
              status: ACCESS_STATUS.ACTIVE,
            },
            {
              uid,
              email,
              accessId: operation.accessId,
            }
          );
        const entitlementRef = doc(
          db,
          ACCESS_COLLECTIONS.STUDENT_ENTITLEMENTS,
          uid,
          "items",
          entitlementId
        );

        batch.set(entitlementRef, payload, {
          merge: true,
        });
        entitlementIds.add(entitlementId);
      }

      const accessUpdate = {
        uid,
        identityClaimedAt: serverTimestamp(),
        identityClaimedByUid: uid,
        identityClaimedByEmail: email,
        identityClaimSource:
          ACCESS_IDENTITY_CLAIM_SOURCE,
        identityClaimAuditId: operation.auditId,
        identityClaimEntitlementId:
          entitlementId,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };

      batch.update(accessRef, accessUpdate);
      batch.set(auditRef, {
        action: "claim_pending_access_identity",
        accessId: operation.accessId,
        email,
        uid,
        before: {
          uid: operation.before.uid || null,
        },
        after: {
          uid,
          entitlementId: entitlementId || null,
          auditId: operation.auditId,
        },
        metadata: {
          source: ACCESS_IDENTITY_CLAIM_SOURCE,
          atomic: true,
          entitlementId: entitlementId || null,
        },
        createdAt: serverTimestamp(),
        createdBy: uid,
        actorEmail: email,
        actorRole: "student",
      });
    });

    await batch.commit();
  }

  return {
    success: true,
    noOp: false,
    uid,
    email,
    claimedCount: plan.claimableCount,
    alreadyClaimedCount:
      plan.alreadyClaimedCount,
    entitlementCount: entitlementIds.size,
    entitlementIds: Array.from(entitlementIds),
    claimBatchCount: claimBatches.length,
    accessIds: plan.claimOperations.map(
      (operation) => operation.accessId
    ),
  };
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

const buildAccessAuditPayload = (data = {}, actor = {}) => ({
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
});

export const createAccessAuditLog = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const auditPayload = buildAccessAuditPayload(data, actor);

  return addDoc(
    collection(db, ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS),
    auditPayload
  );
};

const uniqueAccessRecords = (records = []) => {
  const recordMap = new Map();

  (Array.isArray(records) ? records : [])
    .filter(Boolean)
    .forEach((record) => {
      const key = String(record.id || "").trim();

      if (key && !recordMap.has(key)) {
        recordMap.set(key, record);
      }
    });

  return Array.from(recordMap.values());
};

const writeIdempotentAccessGrant = async ({
  data = {},
  actor = {},
  auditAction = "create_manual_access",
  auditMetadata = {},
  extraPayload = {},
  allowReactivation = false,
  reactivationReason = "",
} = {}) => {
  const adminActor = requireAdminActor(actor);
  const requestedGrant = normalizeAndValidateGrantInput(
    {
      ...data,
      email: normalizeAccessEmail(data.email),
    },
    {
      allowEmailPrincipal: true,
      allowedStatuses: ACCESS_GRANT_STATUS_VALUES,
    }
  );
  const planFamily =
    requestedGrant.scopeType === ACCESS_SCOPE_TYPES.PLAN;
  const uidMatches = requestedGrant.uid
    ? await getAccessByUid(requestedGrant.uid)
    : [];
  const emailMatches = requestedGrant.normalizedEmail
    ? await getAccessByEmail(requestedGrant.normalizedEmail)
    : [];
  const identityMatches = uniqueAccessRecords([
    ...uidMatches,
    ...emailMatches,
  ]);
  assertGrantCandidateIdentitySafe(
    identityMatches,
    requestedGrant
  );
  const candidateMatches = findGrantCandidates(
    identityMatches,
    requestedGrant,
    { planFamily }
  );
  const candidate = candidateMatches[0] || null;
  const requestedFamilyKey =
    buildGrantFamilyKey(requestedGrant);
  const accessId =
    candidate?.id ||
    buildDeterministicGrantDocumentId(
      requestedFamilyKey
    );
  const accessRef = doc(
    db,
    ACCESS_COLLECTIONS.STUDENT_ACCESS,
    accessId
  );
  const auditRef = doc(
    collection(
      db,
      ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS
    )
  );

  const result = await runTransaction(
    db,
    async (transaction) => {
      const currentSnapshot =
        await transaction.get(accessRef);
      const current = toAccessRecord(
        currentSnapshot
      );

      if (
        current &&
        !isGrantCandidate(
          current,
          requestedGrant,
          { planFamily }
        )
      ) {
        throw new Error(
          "Deterministic grant identity collision detected."
        );
      }

      const resolution =
        buildIdempotentGrantResolution({
          existingRecord: current,
          incomingGrant: requestedGrant,
          allowReactivation,
          reactivationReason,
        });
      const normalizedPayload = buildAccessPayload({
        ...data,
        email: resolution.email,
        uid: resolution.uid,
        course: resolution.course,
        scopeType:
          resolution.scopeType,
        planType:
          resolution.planType,
        planCode:
          resolution.planCode,
        accessRank:
          resolution.accessRank,
        productId:
          resolution.productId,
        purchaseTermsSnapshot:
          resolution.purchaseTermsSnapshot,
        validityMode:
          resolution.validityMode,
        noExpiry:
          resolution.noExpiry,
        untilManualChange:
          resolution.untilManualChange,
        accessFrom:
          resolution.accessFrom,
        accessUntil:
          resolution.accessUntil,
        status:
          data.status ||
          ACCESS_STATUS.ACTIVE,
      });
      const updatedAt = serverTimestamp();
      const writePayload = {
        ...normalizedPayload,
        ...extraPayload,
        grantKey: resolution.grantKey,
        grantFamilyKey:
          resolution.grantFamilyKey,
        grantRevision:
          resolution.grantRevision,
        idempotencyVersion: 1,
        lastGrantedAt: updatedAt,
        updatedAt,
        updatedBy: adminActor.uid,
      };

      if (resolution.reactivated) {
        writePayload.reactivatedAt = updatedAt;
        writePayload.reactivationReason =
          resolution.reactivationReason;
      }

      if (!current) {
        writePayload.createdAt = updatedAt;
        writePayload.createdBy =
          adminActor.uid;
        writePayload.actorEmail =
          adminActor.email;
      }

      if (current) {
        transaction.set(
          accessRef,
          writePayload,
          { merge: true }
        );
      } else {
        transaction.set(
          accessRef,
          writePayload
        );
      }

      const after = {
        ...(current || {}),
        ...writePayload,
        id: accessId,
      };
      const metadata = {
        ...auditMetadata,
        grantKey: resolution.grantKey,
        grantFamilyKey:
          resolution.grantFamilyKey,
        writeMode: resolution.writeMode,
        duplicateMatchesDetected:
          Math.max(
            candidateMatches.length - 1,
            0
          ),
        preservedHigherPlan:
          resolution.preservedHigherPlan,
        preservedLongerValidity:
          resolution.preservedLongerValidity,
        reactivated:
          resolution.reactivated,
      };

      transaction.set(
        auditRef,
        buildAccessAuditPayload(
          {
            action: auditAction,
            accessId,
            email: resolution.email,
            uid: resolution.uid,
            before: current,
            after: writePayload,
            metadata,
          },
          adminActor
        )
      );

      return {
        after,
        accessWriteMode:
          resolution.writeMode,
        duplicateMatchesDetected:
          Math.max(
            candidateMatches.length - 1,
            0
          ),
        preservedHigherPlan:
          resolution.preservedHigherPlan,
        preservedLongerValidity:
          resolution.preservedLongerValidity,
        reactivated:
          resolution.reactivated,
      };
    }
  );

  await syncStudentEntitlementProjectionIfUid(
    result.after,
    {
      accessId,
      actorUid: adminActor.uid,
      actorEmail: adminActor.email,
      source:
        result.accessWriteMode === "created"
          ? "idempotent_access_created"
          : "idempotent_access_updated",
    }
  );

  return {
    ...result.after,
    id: accessId,
    accessWriteMode:
      result.accessWriteMode,
    duplicateMatchesDetected:
      result.duplicateMatchesDetected,
    preservedHigherPlan:
      result.preservedHigherPlan,
    preservedLongerValidity:
      result.preservedLongerValidity,
    reactivated: result.reactivated,
  };
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
export const createManualAccess = async (data = {}) =>
  writeIdempotentAccessGrant({
    data: {
      ...data,
      source:
        data.source ||
        ACCESS_SOURCE.ADMIN_MANUAL,
      status:
        data.status ||
        ACCESS_STATUS.ACTIVE,
    },
    actor: data.actor,
    auditAction: "create_manual_access",
    auditMetadata: {
      source:
        data.source ||
        ACCESS_SOURCE.ADMIN_MANUAL,
      requestedBy:
        "admin_access_manager",
    },
    allowReactivation:
      data.allowReactivation === true,
    reactivationReason:
      data.reactivationReason ||
      data.adminNote ||
      data.notes ||
      "",
  });

export const createUserAccessShell = async (data = {}) => {
  const actor = requireAdminActor(data.actor);
  const normalizedEmail = normalizeAccessEmail(data.email);
  const uid = String(data.uid || "").trim();
  const name = String(
    data.name || data.learnerName || ""
  ).trim();
  const phone = String(data.phone || "").trim();

  if (!uid) {
    throw new Error(
      "Verified uid is required. Email-keyed user shells are disabled."
    );
  }

  if (!normalizedEmail) {
    throw new Error(
      "Verified user identity email is required."
    );
  }

  const payload = {
    uid,
    email: normalizedEmail,
    normalizedEmail,
    role: data.role || "student",
    accessIdentityStatus: "verified_uid",
    accessIdentitySource:
      data.identitySource ||
      "admin_verified_uid_sync",
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

  await setDoc(
    doc(db, ACCESS_COLLECTIONS.USERS, uid),
    payload,
    { merge: true }
  );

  await createAccessAuditLog({
    actor,
    action: "sync_verified_user_access_identity",
    email: normalizedEmail,
    uid,
    after: payload,
    metadata: {
      emailKeyedShellDisabled: true,
    },
  });

  return {
    id: uid,
    ...payload,
  };
};

export const createAccessInvite = async (
  data = {}
) => {
  const actor =
    requireAdminActor(
      data.actor
    );
  const normalizedEmail =
    normalizeAccessEmail(
      data.email
    );
  const name =
    String(
      data.name ||
        data.learnerName ||
        ""
    ).trim();
  const phone =
    String(
      data.phone || ""
    ).trim();
  const inviteCode =
    String(
      data.inviteCode ||
        createInviteCode()
    ).trim();
  const inviteLink =
    data.inviteLink ||
    buildAccessInviteLink(
      inviteCode
    );

  if (!normalizedEmail) {
    throw new Error(
      "Invite email is required."
    );
  }

  const target =
    normalizeAndValidateGrantTarget(
      {
        ...data,
        email:
          normalizedEmail,
        status:
          data.status ||
          ACCESS_STATUS.PENDING,
      },
      {
        allowedStatuses:
          ACCESS_GRANT_STATUS_VALUES,
      }
    );

  const payload = {
    email:
      normalizedEmail,
    normalizedEmail,
    inviteCode,
    inviteLink,
    learnerName: name,
    name,
    phone,
    course:
      target.course,
    planType:
      target.planType,
    planCode:
      target.planCode,
    accessRank:
      target.accessRank,
    productId:
      target.productId,
    purchaseTermsSnapshot:
      target.purchaseTermsSnapshot,
    termsSnapshot:
      target.purchaseTermsSnapshot,
    priceVersion:
      target.purchaseTermsSnapshot
        ?.priceVersion ??
      data.priceVersion ??
      null,
    validityMode:
      target.validityMode,
    noExpiry:
      target.noExpiry,
    untilManualChange:
      target.untilManualChange,
    scopeType:
      target.scopeType,
    module:
      target.module,
    itemType:
      target.itemType,
    itemId:
      target.itemId,
    itemTitle:
      target.itemTitle,
    itemIds:
      target.itemIds,
    bundleId:
      target.bundleId,
    status:
      target.status,
    inviteStatus:
      data.inviteStatus ||
      "pending",
    sendInvite:
      data.sendInvite === true,
    inviteType:
      data.inviteType ||
      "manual",
    deliveryStatus:
      data.deliveryStatus ||
      "queued",
    provider:
      data.provider ||
      "phase14_backend_pending",
    actionMode:
      data.actionMode ||
      "password_setup_or_google_login",
    expiresAt:
      data.expiresAt ||
      getInviteExpiryDate(
        data.expiryDays || 7
      ),
    sentAt:
      data.sentAt || null,
    usedAt:
      data.usedAt || null,
    resendCount:
      Number(
        data.resendCount || 0
      ),
    profileCompletionRequired:
      data.profileCompletionRequired !==
      false,
    profileCompletedAt:
      data.profileCompletedAt ||
      null,
    linkCopiedAt:
      data.linkCopiedAt ||
      null,
    manualSentAt:
      data.manualSentAt ||
      null,
    openedAt:
      data.openedAt ||
      null,
    emailSent: false,
    accessFrom:
      target.accessFrom,
    accessUntil:
      target.accessUntil,
    notes:
      data.notes ||
      data.adminNote ||
      "",
    adminNote:
      data.adminNote ||
      data.notes ||
      "",
    accessId:
      data.accessId ||
      null,
    createdAt:
      serverTimestamp(),
    createdBy:
      actor.uid,
    actorEmail:
      actor.email,
    updatedAt:
      serverTimestamp(),
  };

  const docRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_INVITES,
    inviteCode
  );
  await setDoc(
    docRef,
    payload
  );

  await createAccessAuditLog({
    actor,
    action:
      "create_access_invite",
    accessId:
      data.accessId ||
      null,
    email:
      normalizedEmail,
    uid:
      data.uid ||
      null,
    after: {
      id: docRef.id,
      ...payload,
    },
    metadata: {
      scopeType:
        target.scopeType,
      planType:
        target.planType,
      planCode:
        target.planCode,
      accessRank:
        target.accessRank,
      productId:
        target.productId,
    },
  });

  return {
    id: docRef.id,
    ...payload,
  };
};

const toBulkAccessRowRecord = (docSnap) => {
  if (!docSnap || !docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
};

export const createBulkAccessImportPlan = async ({
  importId = "",
  rows = [],
  grantData = {},
  actor = {},
  sendInvite = true,
  metadata = {},
} = {}) => {
  const adminActor = requireAdminActor(actor);
  const normalizedImportId = String(
    importId || "bulk_access_" + Date.now()
  ).trim();
  const safeRows = Array.isArray(rows)
    ? rows.filter(Boolean)
    : [];

  if (!normalizedImportId) {
    throw new Error("Bulk import id is required.");
  }

  if (!safeRows.length) {
    throw new Error(
      "Bulk import requires at least one planned row."
    );
  }

  if (safeRows.length > 100) {
    throw new Error(
      "Bulk import exceeds the safe row limit."
    );
  }

  const importRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_BULK_IMPORTS,
    normalizedImportId
  );
  const batch = writeBatch(db);
  const summary = summarizeBulkAccessRows(safeRows);
  const importPayload = {
    importId: normalizedImportId,
    status: ACCESS_BULK_IMPORT_STATUS.PLANNED,
    source:
      grantData.source ||
      ACCESS_SOURCE.BULK_IMPORT,
    course:
      grantData.course ||
      ACCESS_COURSE.CTET_TET,
    scopeType:
      grantData.scopeType ||
      ACCESS_SCOPE_TYPES.PLAN,
    planType:
      grantData.planCode ||
      grantData.planType ||
      ACCESS_PLAN_TYPES.FREE,
    planCode:
      grantData.planCode ||
      grantData.planType ||
      ACCESS_PLAN_TYPES.FREE,
    accessRank:
      grantData.accessRank ??
      null,
    productId:
      grantData.productId ||
      null,
    priceVersion:
      grantData.priceVersion ??
      grantData.purchaseTermsSnapshot?.priceVersion ??
      grantData.termsSnapshot?.priceVersion ??
      null,
    purchaseTermsSnapshot:
      grantData.purchaseTermsSnapshot ||
      grantData.termsSnapshot ||
      null,
    termsSnapshot:
      grantData.purchaseTermsSnapshot ||
      grantData.termsSnapshot ||
      null,
    validityMode:
      grantData.validityMode ||
      null,
    validityDays:
      Number(grantData.validityDays || 0),
    noExpiry:
      grantData.noExpiry === true,
    untilManualChange:
      grantData.untilManualChange === true,
    accessFrom:
      grantData.accessFrom ||
      null,
    accessUntil:
      grantData.accessUntil ||
      null,
    sendInvite: sendInvite === true,
    summary,
    metadata,
    createdAt: serverTimestamp(),
    createdBy: adminActor.uid,
    actorEmail: adminActor.email,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  };

  batch.set(importRef, importPayload);

  safeRows.forEach((row) => {
    const rowId = String(row.rowId || "").trim();

    if (!rowId) {
      throw new Error(
        "Every bulk import row requires a deterministic row id."
      );
    }

    const rowRef = doc(
      db,
      ACCESS_COLLECTIONS.ACCESS_BULK_IMPORT_ROWS,
      rowId
    );
    const email = normalizeAccessEmail(row.email);
    const rowGrantData = email
      ? {
          ...grantData,
          email,
          source:
            grantData.source ||
            ACCESS_SOURCE.BULK_IMPORT,
        }
      : null;

    batch.set(rowRef, {
      importId: normalizedImportId,
      rowId,
      rowNumber: Number(row.rowNumber || 0),
      original: row.original || "",
      email: email || null,
      normalizedEmail: email,
      status:
        row.status ||
        ACCESS_BULK_ROW_STATUS.INVALID,
      reason: row.reason || "",
      processable: row.processable === true,
      existingAccessId:
        row.existingAccessId || null,
      grantData: rowGrantData,
      sendInvite: sendInvite === true,
      attemptCount: 0,
      lastError: null,
      accessId: null,
      inviteId: null,
      createdAt: serverTimestamp(),
      createdBy: adminActor.uid,
      updatedAt: serverTimestamp(),
      updatedBy: adminActor.uid,
    });
  });

  await batch.commit();

  await createAccessAuditLog({
    actor: adminActor,
    action: "bulk_access_import_planned",
    after: importPayload,
    metadata: {
      importId: normalizedImportId,
      summary,
      resumable: true,
    },
  });

  return {
    id: normalizedImportId,
    ...importPayload,
  };
};

export const listBulkAccessImportRows = async (
  importId = "",
  actor = {}
) => {
  requireAdminActor(actor);
  const normalizedImportId = String(
    importId || ""
  ).trim();

  if (!normalizedImportId) {
    throw new Error("Bulk import id is required.");
  }

  const rowsQuery = query(
    collection(
      db,
      ACCESS_COLLECTIONS.ACCESS_BULK_IMPORT_ROWS
    ),
    where("importId", "==", normalizedImportId)
  );
  const snapshot = await getDocs(rowsQuery);

  return snapshot.docs
    .map(toBulkAccessRowRecord)
    .filter(Boolean)
    .sort(
      (first, second) =>
        Number(first.rowNumber || 0) -
        Number(second.rowNumber || 0)
    );
};

export const executeBulkAccessImport = async ({
  importId = "",
  actor = {},
} = {}) => {
  const adminActor = requireAdminActor(actor);
  const normalizedImportId = String(
    importId || ""
  ).trim();

  if (!normalizedImportId) {
    throw new Error("Bulk import id is required.");
  }

  const importRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_BULK_IMPORTS,
    normalizedImportId
  );
  const importSnapshot = await getDoc(importRef);

  if (!importSnapshot.exists()) {
    throw new Error("Bulk import ledger not found.");
  }

  const initialRows = await listBulkAccessImportRows(
    normalizedImportId,
    adminActor
  );
  const resumableRows =
    selectResumableBulkAccessRows(initialRows);

  await updateDoc(importRef, {
    status: ACCESS_BULK_IMPORT_STATUS.RUNNING,
    lastRunStartedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  });

  for (const row of resumableRows) {
    const rowRef = doc(
      db,
      ACCESS_COLLECTIONS.ACCESS_BULK_IMPORT_ROWS,
      row.id
    );

    await updateDoc(rowRef, {
      status: ACCESS_BULK_ROW_STATUS.RUNNING,
      attemptCount:
        Number(row.attemptCount || 0) + 1,
      lastAttemptAt: serverTimestamp(),
      lastError: null,
      updatedAt: serverTimestamp(),
      updatedBy: adminActor.uid,
    });

    try {
      if (!row.grantData || !row.email) {
        throw new Error(
          "Bulk row grant payload is missing."
        );
      }

      const accessRecord = await createManualAccess({
        ...row.grantData,
        email: row.email,
        actor: adminActor,
      });
      let inviteRecord = null;

      if (
        row.sendInvite === true &&
        accessRecord.accessWriteMode === "created"
      ) {
        inviteRecord = await createAccessInvite({
          ...row.grantData,
          email: row.email,
          actor: adminActor,
          accessId: accessRecord.id,
          status: ACCESS_STATUS.PENDING,
          inviteStatus: "pending",
          sendInvite: true,
        });
      }

      await updateDoc(rowRef, {
        status: ACCESS_BULK_ROW_STATUS.SUCCEEDED,
        processable: false,
        accessId: accessRecord.id,
        accessWriteMode:
          accessRecord.accessWriteMode ||
          "created",
        inviteId: inviteRecord?.id || null,
        completedAt: serverTimestamp(),
        lastError: null,
        updatedAt: serverTimestamp(),
        updatedBy: adminActor.uid,
      });
    } catch (error) {
      await updateDoc(rowRef, {
        status: ACCESS_BULK_ROW_STATUS.FAILED,
        processable: true,
        lastError:
          error?.message ||
          "Bulk row processing failed.",
        failedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: adminActor.uid,
      });
    }
  }

  const finalRows = await listBulkAccessImportRows(
    normalizedImportId,
    adminActor
  );
  const finalSummary =
    summarizeBulkAccessRows(finalRows);
  const finalStatus =
    resolveBulkImportStatus(finalRows);

  await updateDoc(importRef, {
    status: finalStatus,
    summary: finalSummary,
    lastRunCompletedAt: serverTimestamp(),
    completedAt:
      finalStatus ===
      ACCESS_BULK_IMPORT_STATUS.COMPLETED
        ? serverTimestamp()
        : null,
    updatedAt: serverTimestamp(),
    updatedBy: adminActor.uid,
  });

  await createAccessAuditLog({
    actor: adminActor,
    action: "bulk_access_import_run_completed",
    after: {
      importId: normalizedImportId,
      status: finalStatus,
      summary: finalSummary,
    },
    metadata: {
      importId: normalizedImportId,
      resumable: true,
      processedThisRun: resumableRows.length,
    },
  });

  return {
    importId: normalizedImportId,
    status: finalStatus,
    summary: finalSummary,
    rows: finalRows,
    processedThisRun: resumableRows.length,
    canResume:
      finalSummary.counts.failed > 0 ||
      finalSummary.counts.ready > 0,
  };
};

export const resumeBulkAccessImport = async (data = {}) =>
  executeBulkAccessImport(data);

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

export const markAccessInviteOpened = async (
  inviteCode = "",
  user = {}
) => {
  const code = String(inviteCode || "").trim();
  const uid = String(user?.uid || "").trim();
  const email = normalizeAccessEmail(user?.email);

  if (!code || !uid || !email) {
    return null;
  }

  const inviteRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_INVITES,
    code
  );
  const auditId = buildInviteOpenAuditId({
    inviteId: code,
    uid,
    email,
  });
  const auditRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS,
    auditId
  );

  return runTransaction(
    db,
    async (transaction) => {
      const inviteSnapshot =
        await transaction.get(inviteRef);
      const invite = toInviteRecord(
        inviteSnapshot
      );

      if (!invite) {
        return null;
      }

      const validation =
        validateInviteOpenTransaction({
          invite,
          uid,
          email,
          now: Date.now(),
        });

      if (!validation.isValid) {
        if (
          validation.errors.includes(
            "This invite belongs to another email."
          )
        ) {
          return invite;
        }

        return invite;
      }

      if (!validation.shouldWrite) {
        return invite;
      }

      const inviteUpdate = {
        inviteStatus: "opened",
        openedAt: serverTimestamp(),
        openedByUid: uid,
        openedByEmail: email,
        openAuditId: auditId,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };

      transaction.update(
        inviteRef,
        inviteUpdate
      );

      transaction.set(auditRef, {
        action: "open_access_invite",
        accessId: invite.accessId || null,
        email,
        uid,
        before: {
          inviteStatus:
            invite.inviteStatus || null,
        },
        after: {
          inviteStatus: "opened",
          openAuditId: auditId,
        },
        metadata: {
          source: "manual_invite_link",
          inviteCode: code,
          inviteId: invite.id || code,
          atomic: true,
        },
        createdAt: serverTimestamp(),
        createdBy: uid,
        actorEmail: email,
        actorRole: "student",
      });

      return {
        ...invite,
        ...inviteUpdate,
        id: invite.id || code,
      };
    }
  );
};

export const redeemAccessInvite = async (
  inviteCode = "",
  user = {}
) => {
  const code = String(inviteCode || "").trim();
  const uid = String(user?.uid || "").trim();
  const email = normalizeAccessEmail(user?.email);

  if (!code) {
    throw new Error("Invite code is required.");
  }

  if (!uid || !email) {
    throw new Error(
      "Please login with invited email to redeem access."
    );
  }

  const inviteRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_INVITES,
    code
  );
  const auditId =
    buildInviteRedemptionAuditId({
      inviteId: code,
      uid,
      email,
    });
  const auditRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS,
    auditId
  );

  return runTransaction(
    db,
    async (transaction) => {
      const inviteSnapshot =
        await transaction.get(inviteRef);
      const invite = toInviteRecord(
        inviteSnapshot
      );

      if (!invite) {
        throw new Error("Invite not found.");
      }

      const accessId = String(
        invite.accessId || ""
      ).trim();

      if (!accessId) {
        throw new Error(
          "Access record missing for this invite."
        );
      }

      const accessRef = doc(
        db,
        ACCESS_COLLECTIONS.STUDENT_ACCESS,
        accessId
      );
      const accessSnapshot =
        await transaction.get(accessRef);
      const access = toAccessRecord(
        accessSnapshot
      );
      const validation =
        validateInviteRedemptionTransaction({
          invite,
          access,
          uid,
          email,
          now: Date.now(),
        });

      if (!validation.isValid) {
        throw new Error(
          validation.errors.join(" ")
        );
      }

      const entitlementRecord = {
        ...access,
        id: accessId,
        uid,
      };
      const entitlementPayload =
        buildStudentEntitlementPayload(
          entitlementRecord,
          {
            accessId,
            uid,
            email,
          }
        );
      const entitlementRef = doc(
        db,
        ACCESS_COLLECTIONS.STUDENT_ENTITLEMENTS,
        uid,
        "items",
        entitlementPayload.id
      );
      const inviteUpdate = {
        inviteStatus: "used",
        usedAt: serverTimestamp(),
        redeemedByUid: uid,
        redeemedByEmail: email,
        redeemSource: "manual_invite_link",
        redeemEntitlementId:
          entitlementPayload.id,
        redeemAuditId: auditId,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };
      const accessUpdate = {
        uid,
        inviteId: invite.id || code,
        inviteRedeemedAt: serverTimestamp(),
        inviteRedeemedByUid: uid,
        inviteRedeemedByEmail: email,
        lastInviteRedeemedAt:
          serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };

      transaction.update(
        inviteRef,
        inviteUpdate
      );
      transaction.update(
        accessRef,
        accessUpdate
      );
      transaction.set(
        entitlementRef,
        entitlementPayload,
        { merge: true }
      );
      transaction.set(auditRef, {
        action: "redeem_access_invite",
        accessId,
        email,
        uid,
        before: {
          inviteStatus:
            invite.inviteStatus || null,
          accessUid: access.uid || null,
        },
        after: {
          inviteStatus: "used",
          accessUid: uid,
          entitlementId:
            entitlementPayload.id,
          auditId,
        },
        metadata: {
          source: "manual_invite_link",
          inviteCode: code,
          inviteId: invite.id || code,
          entitlementId:
            entitlementPayload.id,
          atomic: true,
        },
        createdAt: serverTimestamp(),
        createdBy: uid,
        actorEmail: email,
        actorRole: "student",
      });

      return {
        success: true,
        inviteId: invite.id || code,
        accessId,
        entitlementId:
          entitlementPayload.id,
        auditId,
        email,
      };
    }
  );
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

  await syncStudentEntitlementProjectionIfUid(after, {
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

  await syncStudentEntitlementProjectionIfUid(after, {
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

export const upgradeAccess = async (
  id,
  planType,
  actor = {},
  metadata = {}
) => {
  const accessId = requireAccessId(id);
  const adminActor = requireAdminActor(actor);
  const accessRef = doc(
    db,
    ACCESS_COLLECTIONS.STUDENT_ACCESS,
    accessId
  );
  const auditRef = doc(
    collection(
      db,
      ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS
    )
  );

  const result = await runTransaction(
    db,
    async (transaction) => {
      const accessSnapshot =
        await transaction.get(accessRef);
      const before = toAccessRecord(
        accessSnapshot
      );

      if (!before) {
        throw new Error(
          "Access record was not found."
        );
      }

      const planChange = resolvePlanChange({
        record: before,
        requestedPlanType: planType,
        allowDowngrade:
          metadata.allowDowngrade === true,
        reason:
          metadata.note ||
          metadata.reason ||
          "",
      });
      const updatedAt = serverTimestamp();
      const payload = {
        planType: planChange.planType,
        scopeType: ACCESS_SCOPE_TYPES.PLAN,
        status: ACCESS_STATUS.ACTIVE,
        grantKey: planChange.grantKey,
        grantFamilyKey:
          planChange.grantFamilyKey,
        grantRevision:
          planChange.grantRevision,
        idempotencyVersion: 1,
        planChangedAt: updatedAt,
        updatedAt,
        updatedBy: adminActor.uid,
      };

      transaction.update(
        accessRef,
        payload
      );

      transaction.set(
        auditRef,
        buildAccessAuditPayload(
          {
            action: "upgrade_access",
            accessId,
            email: before.email,
            uid: before.uid,
            before,
            after: payload,
            metadata: {
              ...metadata,
              previousPlanType:
                planChange.currentPlanType,
              nextPlanType:
                planChange.planType,
              isDowngrade:
                planChange.isDowngrade,
              grantKey:
                planChange.grantKey,
              grantFamilyKey:
                planChange.grantFamilyKey,
            },
          },
          adminActor
        )
      );

      return {
        before,
        after: {
          ...before,
          ...payload,
          id: accessId,
        },
        payload,
      };
    }
  );

  await syncStudentEntitlementProjectionIfUid(
    result.after,
    {
      accessId,
      actorUid: adminActor.uid,
      actorEmail: adminActor.email,
      source: "upgrade_access",
    }
  );

  return {
    id: accessId,
    ...result.payload,
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

  await syncStudentEntitlementProjectionIfUid(after, {
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

export const buildAccessProductPayload = (
  data = {},
  {
    existing = null,
    effectiveAt = new Date(),
  } = {}
) => {
  const requestedScopeType = String(
    data.scopeType ||
      ACCESS_SCOPE_TYPES.PLAN
  )
    .trim()
    .toLowerCase();

  if (
    requestedScopeType ===
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    const planPayload = existing
      ? buildPlanCatalogUpdatePayload(
          existing,
          data,
          { effectiveAt }
        )
      : buildPlanCatalogCreatePayload(
          data,
          { effectiveAt }
        );

    return {
      ...planPayload,
      campaignId:
        data.campaignId ||
        existing?.campaignId ||
        null,
      campaignName:
        data.campaignName ||
        existing?.campaignName ||
        "",
      campaignSource:
        data.campaignSource ||
        existing?.campaignSource ||
        "",
      updatedAt: serverTimestamp(),
    };
  }

  const target =
    normalizeAndValidateGrantTarget(
      data,
      {
        allowedStatuses:
          ACCESS_GRANT_STATUS_VALUES,
      }
    );

  return {
    title: String(
      data.title ||
        data.name ||
        ""
    ).trim(),
    name: String(
      data.name ||
        data.title ||
        ""
    ).trim(),
    description: String(
      data.description || ""
    ).trim(),
    course: target.course,
    planType: target.planType,
    scopeType: target.scopeType,
    module: target.module,
    itemType: target.itemType,
    itemId: target.itemId,
    itemTitle: target.itemTitle,
    itemIds: target.itemIds,
    bundleId: target.bundleId,
    campaignId:
      data.campaignId || null,
    campaignName:
      data.campaignName || "",
    campaignSource:
      data.campaignSource || "",
    validityDays: Number(
      data.validityDays || 0
    ),
    accessFrom: target.accessFrom,
    accessUntil: target.accessUntil,
    price: Number(data.price || 0),
    compareAtPrice: Number(
      data.compareAtPrice || 0
    ),
    currency: data.currency || "INR",
    status: target.status,
    isActive:
      data.isActive !== false,
    notes:
      data.notes ||
      data.adminNote ||
      "",
    adminNote:
      data.adminNote ||
      data.notes ||
      "",
    updatedAt: serverTimestamp(),
  };
};

export const createAccessProduct = async (
  data = {}
) => {
  const actor = requireAdminActor(
    data.actor
  );
  const payload = {
    ...buildAccessProductPayload(
      data,
      {
        effectiveAt: new Date(),
      }
    ),
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    actorEmail: actor.email,
  };

  if (!payload.title) {
    throw new Error(
      "Access product title is required."
    );
  }

  let productId = "";

  if (
    payload.scopeType ===
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    productId =
      buildPlanCatalogDocumentId(
        payload
      );
    const productRef = doc(
      db,
      ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
      productId
    );

    await runTransaction(
      db,
      async (transaction) => {
        const existingSnapshot =
          await transaction.get(
            productRef
          );

        if (existingSnapshot.exists()) {
          throw new Error(
            "Access product already exists. Open it for an audited update."
          );
        }

        transaction.set(
          productRef,
          payload
        );
      }
    );
  } else {
    const docRef = await addDoc(
      collection(
        db,
        ACCESS_COLLECTIONS.ACCESS_PRODUCTS
      ),
      payload
    );
    productId = docRef.id;
  }

  await createAccessAuditLog({
    actor,
    action:
      "create_access_product",
    accessId: productId,
    after: {
      id: productId,
      ...payload,
    },
    metadata: {
      collection:
        ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
      productId,
      scopeType:
        payload.scopeType,
      planType:
        payload.planType,
      planCode:
        payload.planCode ||
        payload.planType,
      priceVersion:
        payload.priceVersion ||
        null,
    },
  });

  return {
    id: productId,
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

export const listAccessProducts = async ({
  maxCount = 100,
  publicOnly = false,
} = {}) => {
  const productCollection =
    collection(
      db,
      ACCESS_COLLECTIONS.ACCESS_PRODUCTS
    );
  const productSource = publicOnly
    ? query(
        productCollection,
        where("scopeType", "==", "plan"),
        where("status", "==", "active"),
        where("isActive", "==", true)
      )
    : productCollection;
  const productSnapshot =
    await getDocs(productSource);

  return productSnapshot.docs
    .map(toAccessRecord)
    .filter(Boolean)
    .sort((first, second) => {
      const firstRank = Number(
        first.accessRank ?? -1
      );
      const secondRank = Number(
        second.accessRank ?? -1
      );

      if (firstRank !== secondRank) {
        return firstRank - secondRank;
      }

      return String(
        first.title ||
          first.name ||
          first.id
      ).localeCompare(
        String(
          second.title ||
            second.name ||
            second.id
        )
      );
    })
    .slice(
      0,
      Math.max(
        1,
        Number(maxCount) || 100
      )
    );
};

export const updateAccessProduct = async (
  id,
  data = {}
) => {
  const productId =
    requireAccessEntityId(
      id,
      "Access product id"
    );
  const actor = requireAdminActor(
    data.actor
  );
  const productRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
    productId
  );
  const beforeSnapshot =
    await getDoc(productRef);
  const before =
    toAccessRecord(
      beforeSnapshot
    );

  if (!before) {
    throw new Error(
      "Access product was not found."
    );
  }

  const payload =
    buildAccessProductPayload(
      {
        ...before,
        ...data,
        productId:
          before.productId ||
          before.id,
        planCode:
          before.planCode ||
          before.planType,
      },
      {
        existing: before,
        effectiveAt: new Date(),
      }
    );

  await updateDoc(
    productRef,
    {
      ...payload,
      updatedBy: actor.uid,
      actorEmail: actor.email,
    }
  );

  await createAccessAuditLog({
    actor,
    action:
      "update_access_product",
    accessId: productId,
    before,
    after: {
      id: productId,
      ...payload,
    },
    metadata: {
      collection:
        ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
      productId,
      scopeType:
        payload.scopeType,
      planType:
        payload.planType,
      planCode:
        payload.planCode ||
        payload.planType,
      priceVersion:
        payload.priceVersion ||
        null,
    },
  });

  return {
    id: productId,
    ...payload,
  };
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
export const buildAccessKeyPayload = (
  data = {}
) => {
  const code =
    normalizeAccessKeyCode(
      data.code
    );

  if (!code) {
    throw new Error(
      "Access key code is required."
    );
  }

  const target =
    normalizeAndValidateGrantTarget(
      data,
      {
        allowedStatuses:
          ACCESS_KEY_GRANT_STATUS_VALUES,
      }
    );

  return {
    code,
    normalizedCode: code,
    productId:
      target.productId,
    campaignId:
      data.campaignId ||
      null,
    campaignName:
      data.campaignName ||
      "",
    campaignSource:
      data.campaignSource ||
      "",
    course:
      target.course,
    planType:
      target.planType,
    planCode:
      target.planCode,
    accessRank:
      target.accessRank,
    purchaseTermsSnapshot:
      target.purchaseTermsSnapshot,
    termsSnapshot:
      target.purchaseTermsSnapshot,
    priceVersion:
      target.purchaseTermsSnapshot
        ?.priceVersion ??
      data.priceVersion ??
      null,
    validityMode:
      target.validityMode,
    noExpiry:
      target.noExpiry,
    untilManualChange:
      target.untilManualChange,
    scopeType:
      target.scopeType,
    module:
      target.module,
    itemType:
      target.itemType,
    itemId:
      target.itemId,
    itemTitle:
      target.itemTitle,
    itemIds:
      target.itemIds,
    bundleId:
      target.bundleId,
    status:
      target.status,
    maxUses:
      Number(
        data.maxUses || 1
      ),
    usedCount:
      Number(
        data.usedCount || 0
      ),
    assignedEmail:
      normalizeAccessEmail(
        data.assignedEmail ||
          data.email ||
          ""
      ),
    redeemedByEmail: null,
    redeemedByUid: null,
    redeemedAt: null,
    accessFrom:
      target.accessFrom,
    accessUntil:
      target.accessUntil,
    validityDays:
      Number(
        data.validityDays ||
          data.defaultValidityDays ||
          0
      ),
    notes:
      data.notes ||
      data.adminNote ||
      "",
    adminNote:
      data.adminNote ||
      data.notes ||
      "",
    updatedAt:
      serverTimestamp(),
  };
};

export const createAccessKey = async (
  data = {}
) => {
  const actor =
    requireAdminActor(
      data.actor
    );
  const requestedProductId =
    String(
      data.productId || ""
    ).trim();
  let productRecord = null;

  if (requestedProductId) {
    productRecord =
      assertResolvableAccessProduct(
        await readAccessProductById(
          requestedProductId
        ),
        requestedProductId
      );
  }

  const productTarget =
    productRecord
      ? {
          course:
            productRecord.course,
          planType:
            productRecord.planCode ||
            productRecord.planType,
          planCode:
            productRecord.planCode ||
            productRecord.planType,
          accessRank:
            productRecord.accessRank,
          productId:
            productRecord.productId ||
            productRecord.id,
          scopeType:
            productRecord.scopeType,
          module:
            productRecord.module,
          itemType:
            productRecord.itemType,
          itemId:
            productRecord.itemId,
          itemTitle:
            productRecord.itemTitle,
          itemIds:
            productRecord.itemIds,
          bundleId:
            productRecord.bundleId,
          defaultValidityDays:
            productRecord.defaultValidityDays,
          validityDays:
            data.validityDays ||
            productRecord.defaultValidityDays ||
            productRecord.validityDays ||
            0,
          priceVersion:
            productRecord.priceVersion ||
            null,
        }
      : {};

  const payload = {
    ...buildAccessKeyPayload({
      ...data,
      ...productTarget,
      code:
        data.code,
      status:
        data.status ||
        ACCESS_KEY_STATUS.ACTIVE,
      accessFrom:
        data.accessFrom ||
        null,
      accessUntil:
        data.accessUntil ||
        null,
      noExpiry:
        data.noExpiry ===
        true,
      untilManualChange:
        data.untilManualChange ===
        true,
      validityMode:
        data.validityMode ||
        null,
      productId:
        requestedProductId ||
        productTarget.productId ||
        null,
    }),
    createdAt:
      serverTimestamp(),
    createdBy:
      actor.uid,
    actorEmail:
      actor.email,
  };

  const existingKey =
    await readAccessKeyByCode(
      payload.code
    );

  if (existingKey) {
    throw new Error(
      "Access key code already exists."
    );
  }

  const docRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_KEYS,
    payload.code
  );
  await setDoc(
    docRef,
    payload
  );

  await createAccessAuditLog({
    actor,
    action:
      "create_access_key",
    accessId:
      docRef.id,
    email:
      payload.assignedEmail,
    after: {
      id: docRef.id,
      ...payload,
    },
    metadata: {
      collection:
        ACCESS_COLLECTIONS.ACCESS_KEYS,
      accessKeyId:
        docRef.id,
      productId:
        payload.productId,
      campaignId:
        payload.campaignId ||
        null,
      campaignName:
        payload.campaignName ||
        "",
      campaignSource:
        payload.campaignSource ||
        "",
      scopeType:
        payload.scopeType,
      planType:
        payload.planType,
      planCode:
        payload.planCode,
      accessRank:
        payload.accessRank,
      validityMode:
        payload.validityMode,
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

const assertResolvableAccessProduct = (
  productRecord = null,
  productId = ""
) => {
  if (
    !String(
      productId || ""
    ).trim()
  ) {
    return null;
  }

  if (!productRecord?.id) {
    throw new Error(
      "Linked access product was not found."
    );
  }

  const productStatus =
    String(
      productRecord.status ||
        ACCESS_STATUS.ACTIVE
    )
      .trim()
      .toLowerCase();

  if (
    productRecord.isActive ===
      false ||
    productStatus !==
      ACCESS_STATUS.ACTIVE
  ) {
    throw new Error(
      "Linked access product is not active."
    );
  }

  return productRecord;
};

export const redeemAccessKeyFoundation = async ({
  code = "",
  email = "",
  uid = "",
  learnerName = "",
  name = "",
  phone = "",
} = {}) => {
  const normalizedCode =
    normalizeAccessKeyCode(code);
  const normalizedEmail =
    normalizeAccessEmail(email);
  const normalizedUid = String(
    uid || ""
  ).trim();

  if (!normalizedCode) {
    throw new Error(
      "Access key code is required."
    );
  }

  if (!normalizedUid || !normalizedEmail) {
    throw new Error(
      "Verified learner uid and email are required."
    );
  }

  const keyRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_KEYS,
    normalizedCode
  );
  const accessId =
    buildAccessKeyRedemptionAccessId({
      accessKeyId: normalizedCode,
      uid: normalizedUid,
      email: normalizedEmail,
    });
  const auditId =
    buildAccessKeyRedemptionAuditId({
      accessKeyId: normalizedCode,
      uid: normalizedUid,
      email: normalizedEmail,
    });
  const accessRef = doc(
    db,
    ACCESS_COLLECTIONS.STUDENT_ACCESS,
    accessId
  );
  const auditRef = doc(
    db,
    ACCESS_COLLECTIONS.ACCESS_AUDIT_LOGS,
    auditId
  );

  return runTransaction(
    db,
    async (transaction) => {
      const keySnapshot =
        await transaction.get(keyRef);
      const keyRecord = toAccessRecord(
        keySnapshot
      );

      if (!keyRecord) {
        throw new Error(
          "Access key was not found."
        );
      }

      let productRecord = null;

      if (
        String(
          keyRecord.productId || ""
        ).trim()
      ) {
        const productRef = doc(
          db,
          ACCESS_COLLECTIONS.ACCESS_PRODUCTS,
          String(keyRecord.productId).trim()
        );
        const productSnapshot =
          await transaction.get(productRef);

        productRecord =
          assertResolvableAccessProduct(
            toAccessRecord(productSnapshot),
            keyRecord.productId
          );
      }

      const accessSnapshot =
        await transaction.get(accessRef);
      const existingAccess = toAccessRecord(
        accessSnapshot
      );
      const validation =
        validateAccessKeyRedemptionTransaction({
          keyRecord,
          existingAccess,
          uid: normalizedUid,
          email: normalizedEmail,
          today: new Date(),
        });

      if (!validation.isValid) {
        throw new Error(
          validation.errors.join(" ")
        );
      }

      const entitlement =
        resolveAccessKeyGrantTerms({
          keyRecord,
          productRecord,
          now: new Date(),
        });
      const accessUntil =
        requireAtomicAccessUntil({
          accessUntil:
            entitlement.accessUntil,
          productId:
            entitlement.productId,
          validityMode:
            entitlement.validityMode,
          noExpiry:
            entitlement.noExpiry,
          untilManualChange:
            entitlement.untilManualChange,
        });
      const keyUsage =
        buildNextAccessKeyUsage(
          keyRecord
        );
      const accessPayload = {
        ...buildAccessPayload({
          email: normalizedEmail,
          uid: normalizedUid,
          learnerName:
            learnerName || name || "",
          name:
            name || learnerName || "",
          phone,
          course:
            entitlement.course,
          planType:
            entitlement.planType,
          planCode:
            entitlement.planCode,
          accessRank:
            entitlement.accessRank,
          productId:
            entitlement.productId,
          purchaseTermsSnapshot:
            entitlement.purchaseTermsSnapshot,
          validityMode:
            entitlement.validityMode,
          noExpiry:
            entitlement.noExpiry,
          untilManualChange:
            entitlement.untilManualChange,
          scopeType:
            entitlement.scopeType,
          module: entitlement.module,
          itemType: entitlement.itemType,
          itemId: entitlement.itemId,
          itemTitle:
            entitlement.itemTitle,
          itemIds: Array.isArray(
            entitlement.itemIds
          )
            ? entitlement.itemIds
            : [],
          bundleId:
            entitlement.bundleId,
          accessKeyId:
            keyRecord.id,
          campaignId:
            entitlement.campaignId,
          campaignName:
            entitlement.campaignName,
          campaignSource:
            entitlement.campaignSource,
          source:
            ACCESS_SOURCE.REDEEM_KEY,
          status: ACCESS_STATUS.ACTIVE,
          accessFrom:
            entitlement.accessFrom ||
            getTodayDateString(),
          accessUntil,
          adminNote:
            "Redeemed access key " +
            normalizedCode,
          notes:
            "Redeemed access key " +
            normalizedCode,
        }),
        createdAt: serverTimestamp(),
        createdBy: normalizedUid,
        actorEmail: normalizedEmail,
      };
      const savedAccess = {
        id: accessId,
        ...accessPayload,
      };
      const entitlementPayload =
        buildStudentEntitlementPayload(
          savedAccess,
          {
            accessId,
            uid: normalizedUid,
            email: normalizedEmail,
          }
        );
      const entitlementRef = doc(
        db,
        ACCESS_COLLECTIONS.STUDENT_ENTITLEMENTS,
        normalizedUid,
        "items",
        entitlementPayload.id
      );
      const keyUpdate = {
        usedCount:
          keyUsage.nextUsedCount,
        status: keyUsage.nextStatus,
        lastRedeemedByEmail:
          normalizedEmail,
        lastRedeemedByUid:
          normalizedUid,
        lastRedeemedAt:
          serverTimestamp(),
        redeemedByEmail:
          keyRecord.redeemedByEmail ||
          normalizedEmail,
        redeemedByUid:
          keyRecord.redeemedByUid ||
          normalizedUid,
        redeemedAt:
          keyRecord.redeemedAt ||
          serverTimestamp(),
        lastRedemptionAccessId:
          accessId,
        lastRedemptionEntitlementId:
          entitlementPayload.id,
        lastRedemptionAuditId:
          auditId,
        updatedAt: serverTimestamp(),
        updatedBy: normalizedUid,
      };

      transaction.set(
        accessRef,
        accessPayload
      );
      transaction.set(
        entitlementRef,
        entitlementPayload,
        { merge: true }
      );
      transaction.update(
        keyRef,
        keyUpdate
      );
      transaction.set(auditRef, {
        action: "redeem_access_key",
        accessId,
        email: normalizedEmail,
        uid: normalizedUid,
        before: {
          accessKey: keyRecord,
          product: productRecord,
        },
        after: {
          access: savedAccess,
          accessKey: {
            id: keyRecord.id,
            ...keyUpdate,
          },
          entitlementId:
            entitlementPayload.id,
          auditId,
        },
        metadata: {
          collection:
            ACCESS_COLLECTIONS.ACCESS_KEYS,
          accessKeyId: keyRecord.id,
          productId:
            entitlement.productId || null,
          campaignId:
            entitlement.campaignId || null,
          campaignName:
            entitlement.campaignName || "",
          campaignSource:
            entitlement.campaignSource || "",
          scopeType:
            entitlement.scopeType ||
            ACCESS_SCOPE_TYPES.PLAN,
          planType:
            entitlement.planType ||
            ACCESS_PLAN_TYPES.FREE,
          planCode:
            entitlement.planCode ||
            entitlement.planType ||
            ACCESS_PLAN_TYPES.FREE,
          accessRank:
            entitlement.accessRank ??
            null,
          validityMode:
            entitlement.validityMode ||
            null,
          noExpiry:
            entitlement.noExpiry ===
            true,
          untilManualChange:
            entitlement.untilManualChange ===
            true,
          purchaseTermsSnapshot:
            entitlement.purchaseTermsSnapshot ||
            null,
          entitlementId:
            entitlementPayload.id,
          source:
            ACCESS_SOURCE.REDEEM_KEY,
          atomic: true,
        },
        createdAt: serverTimestamp(),
        createdBy: normalizedUid,
        actorEmail: normalizedEmail,
        actorRole: "student",
      });

      return {
        access: savedAccess,
        entitlement: entitlementPayload,
        accessKey: {
          id: keyRecord.id,
          ...keyUpdate,
        },
        auditId,
      };
    }
  );
};

export async function grantPaymentAccess(
  payment = {},
  actor = {}
) {
  const normalizedEmail =
    normalizeAccessEmail(
      payment.studentEmail ||
        payment.email ||
        payment.userEmail
    );
  const uid = String(
    payment.userId ||
      payment.uid ||
      ""
  ).trim();

  if (!normalizedEmail && !uid) {
    throw new Error(
      "Payment access requires learner email or user id."
    );
  }

  const scopeType = String(
    payment.scopeType ||
      ACCESS_SCOPE_TYPES.PLAN
  )
    .trim()
    .toLowerCase();
  const planCode = String(
    payment.planCode ||
      payment.planType ||
      ""
  )
    .trim()
    .toUpperCase();
  const productId = String(
    payment.productId || ""
  ).trim();
  const accessRank = Number(
    payment.accessRank
  );
  const purchaseTermsSnapshot =
    payment.purchaseTermsSnapshot ||
    payment.termsSnapshot ||
    null;
  const accessFrom =
    payment.accessFrom ||
    purchaseTermsSnapshot?.accessFrom ||
    new Date();
  const noExpiry =
    payment.noExpiry === true ||
    purchaseTermsSnapshot?.noExpiry ===
      true;
  const untilManualChange =
    payment.untilManualChange ===
      true ||
    purchaseTermsSnapshot
      ?.untilManualChange === true;
  const accessUntil =
    payment.accessUntil ??
    purchaseTermsSnapshot
      ?.accessUntil ??
    null;

  if (
    scopeType !==
    ACCESS_SCOPE_TYPES.PLAN
  ) {
    throw new Error(
      "Payment access must be plan scoped."
    );
  }

  if (!planCode) {
    throw new Error(
      "Payment access requires plan code."
    );
  }

  if (!productId) {
    throw new Error(
      "Payment access requires catalog product ID."
    );
  }

  if (
    !Number.isFinite(accessRank) ||
    accessRank < 0
  ) {
    throw new Error(
      "Payment access requires a valid access rank."
    );
  }

  if (!purchaseTermsSnapshot) {
    throw new Error(
      "Payment access requires purchase terms snapshot."
    );
  }

  if (
    !accessUntil &&
    !noExpiry &&
    !untilManualChange
  ) {
    throw new Error(
      "Payment access requires approved validity."
    );
  }

  return writeIdempotentAccessGrant({
    data: {
      ...payment,
      email: normalizedEmail,
      uid,
      name:
        payment.studentName ||
        payment.name ||
        "",
      learnerName:
        payment.studentName ||
        payment.learnerName ||
        payment.name ||
        "",
      phone:
        payment.studentMobile ||
        payment.phone ||
        "",
      planType: planCode,
      planCode,
      accessRank,
      productId,
      purchaseTermsSnapshot,
      termsSnapshot:
        purchaseTermsSnapshot,
      priceVersion:
        purchaseTermsSnapshot
          ?.priceVersion ??
        payment.priceVersion ??
        null,
      validityMode:
        payment.validityMode ||
        purchaseTermsSnapshot
          ?.validityMode ||
        null,
      noExpiry,
      untilManualChange,
      status:
        ACCESS_STATUS.ACTIVE,
      source:
        ACCESS_SOURCE.PAYMENT,
      course:
        payment.course ||
        ACCESS_COURSE.CTET_TET,
      scopeType:
        ACCESS_SCOPE_TYPES.PLAN,
      accessFrom,
      accessUntil,
      notes:
        payment.notes ||
        payment.adminNote ||
        (
          "Payment approved" +
          (
            payment.orderId
              ? ": " +
                payment.orderId
              : ""
          )
        ),
    },
    actor,
    auditAction:
      "PAYMENT_ACCESS_GRANTED",
    auditMetadata: {
      source:
        ACCESS_SOURCE.PAYMENT,
      paymentId:
        payment.paymentId ||
        payment.id ||
        null,
      paymentRequestId:
        payment.paymentRequestId ||
        payment.id ||
        null,
      orderId:
        payment.orderId || "",
      amount:
        payment.amount ?? null,
      requestedPlanCode:
        planCode,
      productId,
      accessRank,
      priceVersion:
        purchaseTermsSnapshot
          ?.priceVersion ??
        payment.priceVersion ??
        null,
      validityMode:
        payment.validityMode ||
        purchaseTermsSnapshot
          ?.validityMode ||
        null,
      noExpiry,
      untilManualChange,
      conflictSafe: true,
      planOnlySelection: true,
      fixedDurationFallback: false,
    },
    extraPayload: {
      paymentId:
        payment.paymentId ||
        payment.id ||
        null,
      paymentRequestId:
        payment.paymentRequestId ||
        payment.id ||
        null,
      orderId:
        payment.orderId || "",
      amount:
        payment.amount ?? null,
      paymentPlanName:
        payment.planName || "",
      productId,
      accessRank,
      priceVersion:
        purchaseTermsSnapshot
          ?.priceVersion ??
        payment.priceVersion ??
        null,
      purchaseTermsSnapshot,
      termsSnapshot:
        purchaseTermsSnapshot,
      validityMode:
        payment.validityMode ||
        purchaseTermsSnapshot
          ?.validityMode ||
        null,
      noExpiry,
      untilManualChange,
    },
    allowReactivation:
      payment.allowReactivation ===
      true,
    reactivationReason:
      payment.reactivationReason ||
      payment.adminNote ||
      payment.notes ||
      "",
  });
}
