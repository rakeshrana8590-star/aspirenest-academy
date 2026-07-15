import {
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "./accessConstants";
import {
  buildStudentEntitlementId,
  isEntitlementProjectionCandidateActive,
} from "./accessEntitlementProjection";

const cleanValue = (value = "") =>
  String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanValue(value).toLowerCase();

const stableHash = (value = "") => {
  let hash = 2166136261;

  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

const uniqueRecords = (records = []) => {
  const recordsById = new Map();

  (Array.isArray(records) ? records : [])
    .filter(Boolean)
    .forEach((record) => {
      const id = cleanValue(
        record.id || record.accessId
      );

      if (id && !recordsById.has(id)) {
        recordsById.set(id, {
          ...record,
          id,
        });
      }
    });

  return Array.from(recordsById.values());
};

export const buildIdentityClaimAuditId = ({
  accessId = "",
  uid = "",
  email = "",
} = {}) => {
  const normalizedAccessId = cleanValue(accessId);
  const normalizedUid = cleanValue(uid);
  const normalizedEmail = normalizeEmail(email);

  if (
    !normalizedAccessId ||
    !normalizedUid ||
    !normalizedEmail
  ) {
    throw new Error(
      "Identity claim audit requires access id, uid and email."
    );
  }

  return (
    "identity_claim_" +
    stableHash(
      [
        normalizedAccessId,
        normalizedUid,
        normalizedEmail,
      ].join("|")
    )
  );
};

export const buildPendingAccessIdentityClaimPlan = (
  records = [],
  {
    uid = "",
    email = "",
    now = Date.now(),
    maxClaimRecords = 100,
  } = {}
) => {
  const learnerUid = cleanValue(uid);
  const learnerEmail = normalizeEmail(email);

  if (!learnerUid || !learnerEmail) {
    throw new Error(
      "Verified identity claim requires uid and email."
    );
  }

  const unique = uniqueRecords(records);
  const sameEmailRecords = unique.filter(
    (record) =>
      normalizeEmail(
        record.normalizedEmail || record.email
      ) === learnerEmail
  );
  const conflicts = sameEmailRecords.filter(
    (record) => {
      const recordUid = cleanValue(record.uid);
      return recordUid && recordUid !== learnerUid;
    }
  );

  if (conflicts.length) {
    throw new Error(
      "Identity claim blocked because this email is already linked to another uid."
    );
  }

  const claimableRecords = sameEmailRecords.filter(
    (record) => !cleanValue(record.uid)
  );
  const alreadyClaimedRecords = sameEmailRecords.filter(
    (record) => cleanValue(record.uid) === learnerUid
  );

  if (claimableRecords.length > maxClaimRecords) {
    throw new Error(
      "Identity claim exceeds the safe record limit."
    );
  }

  const claimOperations = claimableRecords.map(
    (record) => {
      const accessId = cleanValue(record.id);
      const projectedRecord = {
        ...record,
        id: accessId,
        uid: learnerUid,
        email: learnerEmail,
        normalizedEmail: learnerEmail,
      };
      const entitlementId =
        isEntitlementProjectionCandidateActive(
          projectedRecord,
          { now }
        )
          ? buildStudentEntitlementId(
              projectedRecord
            )
          : null;

      return {
        accessId,
        entitlementId,
        auditId: buildIdentityClaimAuditId({
          accessId,
          uid: learnerUid,
          email: learnerEmail,
        }),
        before: record,
        after: projectedRecord,
      };
    }
  );

  return {
    uid: learnerUid,
    email: learnerEmail,
    claimableRecords,
    alreadyClaimedRecords,
    claimOperations,
    projectedRecords: [
      ...claimOperations.map(
        (operation) => operation.after
      ),
      ...alreadyClaimedRecords,
    ],
    claimableCount: claimOperations.length,
    alreadyClaimedCount:
      alreadyClaimedRecords.length,
    conflictCount: 0,
    noOp: claimOperations.length === 0,
  };
};

export const ACCESS_IDENTITY_CLAIM_BATCH_SIZE = 4;

export const buildIdentityClaimBatches = (
  claimOperations = [],
  {
    preferredAccessIds = [],
    batchSize = ACCESS_IDENTITY_CLAIM_BATCH_SIZE,
  } = {}
) => {
  const safeBatchSize = Number(batchSize);

  if (
    !Number.isInteger(safeBatchSize) ||
    safeBatchSize < 1 ||
    safeBatchSize > ACCESS_IDENTITY_CLAIM_BATCH_SIZE
  ) {
    throw new Error(
      "Identity claim batch size exceeds the Firestore Rules safety limit."
    );
  }

  const preferredIds = new Set(
    (Array.isArray(preferredAccessIds)
      ? preferredAccessIds
      : []
    )
      .map((accessId) => cleanValue(accessId))
      .filter(Boolean)
  );
  const orderedOperations = [
    ...(Array.isArray(claimOperations)
      ? claimOperations
      : []),
  ]
    .filter(Boolean)
    .sort((first, second) => {
      const firstPreferred = preferredIds.has(
        cleanValue(first.accessId)
      );
      const secondPreferred = preferredIds.has(
        cleanValue(second.accessId)
      );

      if (firstPreferred !== secondPreferred) {
        return firstPreferred ? -1 : 1;
      }

      return cleanValue(first.accessId).localeCompare(
        cleanValue(second.accessId)
      );
    });
  const batches = [];

  for (
    let index = 0;
    index < orderedOperations.length;
    index += safeBatchSize
  ) {
    batches.push(
      orderedOperations.slice(
        index,
        index + safeBatchSize
      )
    );
  }

  return batches;
};

export const filterAccessRecordsForVerifiedPrincipal = (
  records = [],
  {
    uid = "",
    email = "",
  } = {}
) => {
  const learnerUid = cleanValue(uid);
  const learnerEmail = normalizeEmail(email);

  if (!learnerUid) {
    return [];
  }

  return uniqueRecords(records).filter((record) => {
    const recordUid = cleanValue(record.uid);
    const recordEmail = normalizeEmail(
      record.normalizedEmail || record.email
    );

    if (recordUid) {
      return recordUid === learnerUid;
    }

    return Boolean(
      learnerEmail && recordEmail === learnerEmail
    );
  });
};

export const isUidKeyedUserDocument = ({
  documentId = "",
  uid = "",
} = {}) => {
  const normalizedDocumentId = cleanValue(documentId);
  const normalizedUid = cleanValue(uid);

  return Boolean(
    normalizedDocumentId &&
      normalizedUid &&
      normalizedDocumentId === normalizedUid &&
      !normalizedDocumentId.includes("@")
  );
};

export const ACCESS_IDENTITY_CLAIM_SOURCE =
  "verified_uid_claim";

export const ACCESS_IDENTITY_CLAIM_STATUS =
  ACCESS_STATUS.ACTIVE;

export const ACCESS_IDENTITY_CLAIM_SCOPE =
  ACCESS_SCOPE_TYPES.PLAN;
