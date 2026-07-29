"use strict";

const {
  createHash,
  randomUUID,
} = require("node:crypto");
const {
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const {
  Timestamp,
  getFirestore,
} = require("firebase-admin/firestore");
const {
  HttpsError,
  onCall,
} = require("firebase-functions/v2/https");

if (!getApps().length) {
  initializeApp();
}

const LEADERBOARD_PRIVATE_COLLECTION =
  "mockLeaderboard";
const LEADERBOARD_PUBLIC_COLLECTION =
  "mockLeaderboardPublic";

const ALLOWED_PURPOSES = new Set([
  "mock_test_attempt",
  "mock_test_submit",
]);


const NOTES_RESOLVER_FUNCTION_NAME =
  "resolveNotesProtectedAsset";
const NOTES_CONTENT_COLLECTION =
  "contentItems";
const NOTES_ASSET_COLLECTION =
  "protectedContentAssets";
const NOTES_ENTITLEMENTS_COLLECTION =
  "studentEntitlements";
const NOTES_ENTITLEMENT_ITEMS_COLLECTION =
  "items";
const NOTES_ADMIN_EMAILS = new Set([
  "aspirenestplatform@gmail.com",
]);

const NOTES_ASSET_ACTIONS = new Set([
  "OPEN",
  "READ",
  "DOWNLOAD",
]);

const NOTES_ACTIVE_ACCESS_STATUSES = new Set([
  "active",
  "approved",
  "paid",
  "success",
  "verified",
  "live",
]);

const NOTES_PLAN_RANKS = Object.freeze({
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
});

const NOTES_OPEN_URL_FIELDS = Object.freeze([
  "pdfUrl",
  "fileUrl",
  "sourceUrl",
  "assetUrl",
  "downloadUrl",
]);

const NOTES_DOWNLOAD_URL_FIELDS = Object.freeze([
  "downloadUrl",
  "pdfUrl",
  "fileUrl",
  "sourceUrl",
  "assetUrl",
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const cleanText = (
  value = "",
  maxLength = 200
) =>
  cleanString(value)
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const normalizeMode = (value = "") =>
  cleanString(value)
    .replace(/\s+/g, "")
    .toLowerCase();

const toFiniteNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
};

const clampNumber = (
  value,
  minimum,
  maximum,
  fallback = minimum
) =>
  Math.min(
    maximum,
    Math.max(
      minimum,
      toFiniteNumber(value, fallback)
    )
  );

const toEpochMs = (value) => {
  if (!value) return null;

  if (
    typeof value?.toMillis === "function"
  ) {
    const millis = Number(value.toMillis());
    return Number.isFinite(millis) &&
      millis > 0
      ? millis
      : null;
  }

  if (
    typeof value?.seconds === "number"
  ) {
    const millis =
      Number(value.seconds) * 1000;
    return Number.isFinite(millis) &&
      millis > 0
      ? millis
      : null;
  }

  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) &&
      millis > 0
      ? millis
      : null;
  }

  const numeric = Number(value);

  if (
    Number.isFinite(numeric) &&
    numeric > 0
  ) {
    return numeric <
      10_000_000_000
      ? numeric * 1000
      : numeric;
  }

  const parsed = new Date(value);
  const millis = parsed.getTime();

  return Number.isFinite(millis) &&
    millis > 0
    ? millis
    : null;
};

const toTimestamp = (
  value,
  fallbackMs = null
) => {
  const millis =
    toEpochMs(value) ??
    toEpochMs(fallbackMs);

  return millis
    ? Timestamp.fromMillis(millis)
    : null;
};

const hashValue = (value = "") =>
  createHash("sha256")
    .update(cleanString(value))
    .digest("hex");

const buildPrivateLeaderboardId = ({
  uid,
  testId,
  leaderboardMode,
} = {}) =>
  hashValue(
    `private|${uid}|${testId}|${leaderboardMode}`
  );

const buildPublicLeaderboardId = ({
  uid,
  testId,
  leaderboardMode,
} = {}) =>
  hashValue(
    `public|${uid}|${testId}|${leaderboardMode}`
  );

const buildPublicLeaderboardName = (
  value = ""
) => {
  const raw = cleanText(
    value || "AspireNest Learner",
    80
  );

  if (!raw) {
    return "AspireNest Learner";
  }

  if (raw.includes("@")) {
    const [name = "student"] =
      raw.split("@");
    return `${
      cleanText(name, 20).slice(0, 2) ||
      "st"
    }***`;
  }

  const parts = raw
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "AspireNest Learner";
  }

  if (parts.length === 1) {
    return parts[0].length > 8
      ? `${parts[0].slice(0, 6)}…`
      : parts[0];
  }

  return `${parts[0]} ${
    parts[1][0] || ""
  }.`.trim();
};

const requireAuthenticatedUser = (
  auth = null
) => {
  const uid = cleanString(auth?.uid);
  const email = normalizeEmail(
    auth?.token?.email
  );

  if (!uid || !email) {
    throw new HttpsError(
      "unauthenticated",
      "Verified login is required."
    );
  }

  return Object.freeze({
    uid,
    email,
    tokenName: cleanText(
      auth?.token?.name,
      80
    ),
  });
};

const buildMockTestServerTimeResponse = ({
  auth = null,
  data = {},
  now = () => Date.now(),
  makeRequestId = () => randomUUID(),
} = {}) => {
  const uid = cleanString(auth?.uid);

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Verified login is required."
    );
  }

  const purpose = cleanString(
    data?.purpose
  );
  const testId = cleanString(
    data?.testId
  );

  if (!ALLOWED_PURPOSES.has(purpose)) {
    throw new HttpsError(
      "invalid-argument",
      "Unsupported server-time purpose."
    );
  }

  if (!testId || testId.length > 200) {
    throw new HttpsError(
      "invalid-argument",
      "A valid mock-test id is required."
    );
  }

  const serverNowMs = Number(now());
  const requestId = cleanString(
    makeRequestId()
  );

  if (
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  if (!requestId) {
    throw new HttpsError(
      "internal",
      "Server request identifier is unavailable."
    );
  }

  return Object.freeze({
    source: "server",
    serverNowMs,
    requestId,
    authenticated: true,
    uid,
  });
};

const buildMockTestLeaderboardProjection = ({
  auth = null,
  data = {},
  now = () => Date.now(),
} = {}) => {
  const {
    uid,
    email,
    tokenName,
  } = requireAuthenticatedUser(auth);

  const testId = cleanText(
    data?.testId,
    200
  );
  const leaderboardMode = normalizeMode(
    data?.leaderboardMode
  );
  const attemptId = cleanText(
    data?.attemptId,
    300
  );

  if (!testId) {
    throw new HttpsError(
      "invalid-argument",
      "A valid mock-test id is required."
    );
  }

  if (
    !leaderboardMode ||
    leaderboardMode === "disabled"
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Leaderboard is not enabled for this mock test."
    );
  }

  if (!attemptId) {
    throw new HttpsError(
      "invalid-argument",
      "A submitted attempt id is required."
    );
  }

  const serverNowMs = Number(now());

  if (
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  const score = clampNumber(
    data?.score,
    -100000,
    100000,
    0
  );
  const totalMarks = clampNumber(
    data?.totalMarks,
    0,
    100000,
    0
  );
  const percentage = clampNumber(
    data?.percentage,
    0,
    100,
    0
  );
  const accuracy = clampNumber(
    data?.accuracy,
    0,
    100,
    0
  );
  const correctCount = clampNumber(
    data?.correctCount,
    0,
    100000,
    0
  );
  const wrongCount = clampNumber(
    data?.wrongCount,
    0,
    100000,
    0
  );
  const skippedCount = clampNumber(
    data?.skippedCount,
    0,
    100000,
    0
  );
  const totalQuestions = clampNumber(
    data?.totalQuestions,
    0,
    100000,
    0
  );
  const durationSeconds = clampNumber(
    data?.durationSeconds,
    0,
    31_536_000,
    0
  );
  const attemptNumber = clampNumber(
    data?.attemptNumber,
    1,
    100000,
    1
  );

  const privateEntryId =
    buildPrivateLeaderboardId({
      uid,
      testId,
      leaderboardMode,
    });
  const publicEntryId =
    buildPublicLeaderboardId({
      uid,
      testId,
      leaderboardMode,
    });
  const timestamp =
    Timestamp.fromMillis(serverNowMs);
  const studentName = cleanText(
    tokenName ||
      data?.studentName ||
      email,
    80
  );
  const displayName =
    buildPublicLeaderboardName(
      studentName || email
    );

  const sharedFields = {
    schemaVersion: 1,
    testId,
    testTitle: cleanText(
      data?.testTitle,
      200
    ),
    leaderboardMode,
    subject: cleanText(
      data?.subject,
      120
    ),
    chapter: cleanText(
      data?.chapter,
      160
    ),
    planType: cleanText(
      data?.planType || "FREE",
      80
    ),
    examType: cleanText(
      data?.examType,
      120
    ),
    testType: cleanText(
      data?.testType,
      120
    ),
    score,
    totalMarks,
    percentage,
    accuracy,
    correctCount,
    wrongCount,
    skippedCount,
    totalQuestions,
    durationSeconds,
    rankScore: percentage,
    rankTieBreakerScore: score,
    source: "authenticated_callable",
    updatedAt: timestamp,
  };

  const privateRecord = Object.freeze({
    ...sharedFields,
    privateEntryId,
    publicEntryId,
    leaderboardKey: privateEntryId,
    ownerUid: uid,
    ownerEmail: email,
    studentEmail: email,
    studentName:
      studentName || email,
    attemptId,
    attemptStartedAt: toTimestamp(
      data?.attemptStartedAt
    ),
    attemptSubmittedAt:
      toTimestamp(
        data?.attemptSubmittedAt,
        serverNowMs
      ),
    attemptNumber,
    startedAt: toTimestamp(
      data?.startedAt
    ),
    endedAt: toTimestamp(
      data?.endedAt,
      serverNowMs
    ),
    createdAt: timestamp,
  });

  const publicRecord = Object.freeze({
    ...sharedFields,
    publicEntryId,
    displayName,
    projectionVersion: 1,
    createdAt: timestamp,
  });

  return Object.freeze({
    privateEntryId,
    publicEntryId,
    privateRecord,
    publicRecord,
  });
};

const shouldReplaceMockTestLeaderboardEntry = (
  existing = null,
  candidate = {}
) => {
  if (!existing) return true;

  if (
    cleanString(existing.attemptId) &&
    cleanString(existing.attemptId) ===
      cleanString(candidate.attemptId)
  ) {
    return true;
  }

  const existingRank = toFiniteNumber(
    existing.rankScore ??
      existing.percentage,
    0
  );
  const candidateRank = toFiniteNumber(
    candidate.rankScore ??
      candidate.percentage,
    0
  );

  if (candidateRank > existingRank) {
    return true;
  }

  if (candidateRank < existingRank) {
    return false;
  }

  const existingTie = toFiniteNumber(
    existing.rankTieBreakerScore ??
      existing.score,
    0
  );
  const candidateTie = toFiniteNumber(
    candidate.rankTieBreakerScore ??
      candidate.score,
    0
  );

  return candidateTie > existingTie;
};

const loadOwnedSubmittedMockResult = async ({
  auth = null,
  data = {},
  firestore = getFirestore(),
} = {}) => {
  const {
    uid,
    email,
  } = requireAuthenticatedUser(auth);
  const testId = cleanText(
    data?.testId,
    200
  );
  const attemptId = cleanText(
    data?.attemptId,
    300
  );

  if (!testId || !attemptId) {
    throw new HttpsError(
      "invalid-argument",
      "A submitted mock-test attempt is required."
    );
  }

  const snapshot = await firestore
    .collection("mockResults")
    .where(
      "attemptKey",
      "==",
      attemptId
    )
    .where(
      "email",
      "==",
      email
    )
    .limit(10)
    .get();

  const ownedResult = snapshot.docs
    .map((document) => ({
      id: document.id,
      ...(document.data() || {}),
    }))
    .find(
      (result) =>
        cleanString(
          result.testId ||
            result.mockTestId ||
            result.contentId
        ) === testId &&
        normalizeEmail(
          result.email ||
            result.studentEmail
        ) === email &&
        cleanString(
          result.attemptKey ||
            result.attemptId
        ) === attemptId
    );

  if (!ownedResult) {
    throw new HttpsError(
      "failed-precondition",
      "An owned submitted result is required before leaderboard projection."
    );
  }

  return Object.freeze({
    uid,
    email,
    result: ownedResult,
  });
};

const upsertMockTestLeaderboardProjection = async ({
  auth = null,
  data = {},
  firestore = getFirestore(),
  now = () => Date.now(),
} = {}) => {
  const ownedResult =
    await loadOwnedSubmittedMockResult({
      auth,
      data,
      firestore,
    });
  const result = ownedResult.result;
  const projection =
    buildMockTestLeaderboardProjection({
      auth,
      data: {
        ...data,
        testId:
          result.testId ||
          result.mockTestId ||
          data.testId,
        testTitle:
          result.testTitle ||
          data.testTitle,
        studentName:
          result.studentName ||
          data.studentName,
        subject:
          result.subject ||
          data.subject,
        chapter:
          result.chapter ||
          data.chapter,
        planType:
          result.planType ||
          data.planType,
        examType:
          result.examType ||
          data.examType,
        testType:
          result.testType ||
          data.testType,
        score: result.score,
        totalMarks:
          result.totalMarks,
        percentage:
          result.percentage,
        accuracy: result.accuracy,
        correctCount:
          result.correctCount,
        wrongCount:
          result.wrongCount,
        skippedCount:
          result.skippedCount,
        totalQuestions:
          result.totalQuestions,
        durationSeconds:
          result.durationSeconds,
        attemptId:
          result.attemptKey ||
          result.attemptId,
        attemptStartedAt:
          result.attemptStartedAt,
        attemptSubmittedAt:
          result.attemptSubmittedAt,
        attemptNumber:
          result.attemptNumber,
        startedAt:
          result.startedAt,
        endedAt:
          result.endedAt,
      },
      now,
    });

  const privateRef = firestore
    .collection(
      LEADERBOARD_PRIVATE_COLLECTION
    )
    .doc(projection.privateEntryId);
  const publicRef = firestore
    .collection(
      LEADERBOARD_PUBLIC_COLLECTION
    )
    .doc(projection.publicEntryId);

  return firestore.runTransaction(
    async (transaction) => {
      const existingSnapshot =
        await transaction.get(privateRef);
      const existing =
        existingSnapshot.exists
          ? existingSnapshot.data()
          : null;

      if (
        !shouldReplaceMockTestLeaderboardEntry(
          existing,
          projection.privateRecord
        )
      ) {
        return Object.freeze({
          saved: false,
          reason: "not_better",
          publicEntryId:
            projection.publicEntryId,
        });
      }

      const createdAt =
        existing?.createdAt ||
        projection.privateRecord.createdAt;

      transaction.set(
        privateRef,
        {
          ...projection.privateRecord,
          createdAt,
        },
        { merge: false }
      );
      transaction.set(
        publicRef,
        {
          ...projection.publicRecord,
          createdAt,
        },
        { merge: false }
      );

      return Object.freeze({
        saved: true,
        reason: "saved",
        publicEntryId:
          projection.publicEntryId,
      });
    }
  );
};



const normalizeNotesAssetAction = (
  value = ""
) => cleanString(value).toUpperCase();

const normalizeNotesPlanCode = (
  value = ""
) => {
  const planCode = cleanString(value)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  if (
    planCode === "MENTOR" ||
    planCode === "MENTORING"
  ) {
    return "MENTORSHIP";
  }

  return planCode || "FREE";
};

const normalizeNotesScope = (
  value = ""
) => cleanString(value).toLowerCase();

const normalizeNotesModule = (
  value = ""
) => cleanString(value)
  .replace(/[^a-zA-Z0-9]+/g, "")
  .toLowerCase();

const normalizeNotesItemType = (
  value = ""
) => cleanString(value)
  .replace(/[^a-zA-Z0-9]+/g, "")
  .toLowerCase();

const getNotesPlanRank = (
  record = {}
) => {
  const explicitRank = Number(
    record.accessRank ??
      record.planRank ??
      record.requiredAccessRank
  );

  if (
    Number.isFinite(explicitRank) &&
    explicitRank >= 0
  ) {
    return explicitRank;
  }

  const planCode = normalizeNotesPlanCode(
    record.planCode ||
      record.planType ||
      record.requiredPlan ||
      "FREE"
  );

  return NOTES_PLAN_RANKS[planCode] ?? -1;
};

const getNotesItemIds = (
  record = {}
) => {
  const values =
    record.itemIds ||
    record.resourceIds ||
    record.items ||
    [];

  return Array.isArray(values)
    ? values
        .map(cleanString)
        .filter(Boolean)
    : [];
};

const isNotesPublishedRecord = (
  record = {}
) =>
  cleanString(record.status).toLowerCase() ===
  "published";

const isNotesCatalogRecord = (
  record = {}
) =>
  cleanString(record.section).toLowerCase() ===
  "notes";

const isNotesEntitlementActive = (
  record = {},
  {
    uid = "",
    email = "",
    nowMs = Date.now(),
  } = {}
) => {
  const status = cleanString(
    record.status || "active"
  ).toLowerCase();

  if (
    !NOTES_ACTIVE_ACCESS_STATUSES.has(
      status
    )
  ) {
    return false;
  }

  const recordUid = cleanString(record.uid);
  const recordEmail = normalizeEmail(
    record.normalizedEmail ||
      record.email
  );
  const principalUid = cleanString(uid);
  const principalEmail = normalizeEmail(email);

  if (
    recordUid &&
    recordUid !== principalUid
  ) {
    return false;
  }

  if (
    recordEmail &&
    principalEmail &&
    recordEmail !== principalEmail
  ) {
    return false;
  }

  const currentTime = Number(nowMs);

  if (
    !Number.isFinite(currentTime) ||
    currentTime <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  const rawAccessFrom =
    record.accessFrom ??
    record.startDate ??
    null;
  const rawAccessUntil =
    record.accessUntil ??
    record.expiryDate ??
    record.validUntil ??
    null;
  const accessFrom = toEpochMs(rawAccessFrom);
  const accessUntil = toEpochMs(rawAccessUntil);
  const hasAccessFrom =
    rawAccessFrom !== null &&
    rawAccessFrom !== undefined &&
    rawAccessFrom !== "";
  const hasAccessUntil =
    rawAccessUntil !== null &&
    rawAccessUntil !== undefined &&
    rawAccessUntil !== "";

  if (hasAccessFrom && accessFrom === null) {
    return false;
  }

  if (hasAccessUntil && accessUntil === null) {
    return false;
  }

  if (
    accessFrom !== null &&
    accessFrom > currentTime
  ) {
    return false;
  }

  if (
    accessUntil !== null &&
    accessUntil < currentTime
  ) {
    return false;
  }

  return true;
};

const notesEntitlementMatchesResource = ({
  record = {},
  note = {},
  noteId = "",
} = {}) => {
  const scope = normalizeNotesScope(
    record.scopeType || record.scope
  );
  const moduleName = normalizeNotesModule(
    record.module
  );
  const itemType = normalizeNotesItemType(
    record.itemType
  );
  const normalizedNoteId = cleanString(noteId);
  const requiredRank = getNotesPlanRank(note);
  const recordRank = getNotesPlanRank(record);
  const moduleMatches =
    moduleName === "notes";
  const itemTypeMatches =
    !itemType || itemType === "notespdf";

  if (scope === "item") {
    return (
      moduleMatches &&
      itemTypeMatches &&
      cleanString(
        record.itemId ||
          record.resourceId ||
          record.noteId
      ) === normalizedNoteId
    );
  }

  if (scope === "bundle") {
    return (
      moduleMatches &&
      itemTypeMatches &&
      getNotesItemIds(record).includes(
        normalizedNoteId
      )
    );
  }

  if (scope === "module") {
    return (
      requiredRank >= 0 &&
      moduleMatches &&
      recordRank >= requiredRank
    );
  }

  if (scope === "plan") {
    return (
      requiredRank >= 0 &&
      recordRank >= requiredRank
    );
  }

  return false;
};

const resolveNotesEntitlementEvidence = ({
  note = {},
  noteId = "",
  entitlements = [],
  uid = "",
  email = "",
  nowMs = Date.now(),
} = {}) => {
  const requiredRank = getNotesPlanRank(note);

  if (requiredRank === 0) {
    return Object.freeze({
      allowed: true,
      scopeType: "free",
      entitlementId: null,
    });
  }

  const scopePriority = Object.freeze({
    item: 0,
    bundle: 1,
    module: 2,
    plan: 3,
  });

  const candidates = (
    Array.isArray(entitlements)
      ? entitlements
      : []
  )
    .filter((record) =>
      isNotesEntitlementActive(record, {
        uid,
        email,
        nowMs,
      })
    )
    .filter((record) =>
      notesEntitlementMatchesResource({
        record,
        note,
        noteId,
      })
    )
    .sort((first, second) => {
      const firstScope = normalizeNotesScope(
        first.scopeType || first.scope
      );
      const secondScope = normalizeNotesScope(
        second.scopeType || second.scope
      );
      const scopeDifference =
        (scopePriority[firstScope] ?? 99) -
        (scopePriority[secondScope] ?? 99);

      if (scopeDifference !== 0) {
        return scopeDifference;
      }

      const rankDifference =
        getNotesPlanRank(second) -
        getNotesPlanRank(first);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      return cleanString(first.id).localeCompare(
        cleanString(second.id)
      );
    });

  const selected = candidates[0] || null;

  if (!selected) {
    return Object.freeze({
      allowed: false,
      scopeType: "",
      entitlementId: null,
    });
  }

  return Object.freeze({
    allowed: true,
    scopeType: normalizeNotesScope(
      selected.scopeType || selected.scope
    ),
    entitlementId:
      cleanString(selected.id) || null,
  });
};

const pickNotesProtectedAssetUrl = ({
  asset = {},
  action = "OPEN",
} = {}) => {
  const normalizedAction =
    normalizeNotesAssetAction(action);
  const fields =
    normalizedAction === "DOWNLOAD"
      ? NOTES_DOWNLOAD_URL_FIELDS
      : NOTES_OPEN_URL_FIELDS;
  const urls =
    asset.urls &&
    typeof asset.urls === "object"
      ? asset.urls
      : {};

  for (const fieldName of fields) {
    const value = cleanString(
      urls[fieldName]
    );

    if (!value) continue;

    try {
      const parsed = new URL(value);

      if (parsed.protocol === "https:") {
        return value;
      }
    } catch {
      // Continue to the next server-stored URL.
    }
  }

  return "";
};

const normalizeNotesAssetResolverRequest = ({
  auth = null,
  data = {},
} = {}) => {
  const principal =
    requireAuthenticatedUser(auth);
  const noteId = cleanText(
    data?.noteId,
    200
  );
  const action =
    normalizeNotesAssetAction(
      data?.action
    );

  if (!noteId) {
    throw new HttpsError(
      "invalid-argument",
      "A valid Notes resource id is required."
    );
  }

  if (!NOTES_ASSET_ACTIONS.has(action)) {
    throw new HttpsError(
      "invalid-argument",
      "Unsupported Notes asset action."
    );
  }

  return Object.freeze({
    ...principal,
    noteId,
    action,
  });
};

const loadNotesEntitlements = async ({
  firestore,
  uid,
} = {}) => {
  const snapshot = await firestore
    .collection(
      NOTES_ENTITLEMENTS_COLLECTION
    )
    .doc(uid)
    .collection(
      NOTES_ENTITLEMENT_ITEMS_COLLECTION
    )
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() || {}),
  }));
};

const resolveNotesProtectedAsset = async ({
  auth = null,
  data = {},
  firestore = getFirestore(),
  now = () => Date.now(),
  makeRequestId = () => randomUUID(),
} = {}) => {
  const request =
    normalizeNotesAssetResolverRequest({
      auth,
      data,
    });
  const serverNowMs = Number(now());

  if (
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0
  ) {
    throw new HttpsError(
      "internal",
      "Server clock is unavailable."
    );
  }

  const requestId = cleanString(
    makeRequestId()
  );

  if (!requestId) {
    throw new HttpsError(
      "internal",
      "Server request identifier is unavailable."
    );
  }

  const noteRef = firestore
    .collection(NOTES_CONTENT_COLLECTION)
    .doc(request.noteId);
  const assetRef = firestore
    .collection(NOTES_ASSET_COLLECTION)
    .doc(request.noteId);
  const [noteSnapshot, assetSnapshot] =
    await Promise.all([
      noteRef.get(),
      assetRef.get(),
    ]);

  if (!noteSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Notes resource is unavailable."
    );
  }

  const note = {
    id: noteSnapshot.id,
    ...(noteSnapshot.data() || {}),
  };

  if (
    !isNotesCatalogRecord(note) ||
    !isNotesPublishedRecord(note)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Notes resource is unavailable."
    );
  }

  if (
    note.hasProtectedAsset !== true
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset is unavailable."
    );
  }

  if (!assetSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Protected Notes asset is unavailable."
    );
  }

  const asset = {
    id: assetSnapshot.id,
    ...(assetSnapshot.data() || {}),
  };

  if (
    cleanString(asset.contentId) &&
    cleanString(asset.contentId) !==
      request.noteId
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset identity is invalid."
    );
  }

  if (
    !isNotesPublishedRecord(asset)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset is unavailable."
    );
  }

  const isAdminRequest = NOTES_ADMIN_EMAILS.has(
    normalizeEmail(request.email)
  );
  const entitlements =
    isAdminRequest || getNotesPlanRank(note) === 0
      ? []
      : await loadNotesEntitlements({
          firestore,
          uid: request.uid,
        });
  const access = isAdminRequest
    ? Object.freeze({
        allowed: true,
        scopeType: "admin",
      })
    : resolveNotesEntitlementEvidence({
        note,
        noteId: request.noteId,
        entitlements,
        uid: request.uid,
        email: request.email,
        nowMs: serverNowMs,
      });

  if (!access.allowed) {
    throw new HttpsError(
      "permission-denied",
      "Notes access is not available for this account."
    );
  }

  const assetUrl =
    pickNotesProtectedAssetUrl({
      asset,
      action: request.action,
    });

  if (!assetUrl) {
    throw new HttpsError(
      "failed-precondition",
      "Protected Notes asset URL is unavailable."
    );
  }

  return Object.freeze({
    authorized: true,
    source: "server_authorized",
    noteId: request.noteId,
    action: request.action,
    assetUrl,
    accessScope: access.scopeType,
    serverNowMs,
    requestId,
  });
};

exports.getMockTestServerTime = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 10,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    buildMockTestServerTimeResponse({
      auth: request.auth,
      data: request.data,
    })
);



exports.resolveNotesProtectedAsset = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 15,
    memory: "256MiB",
    maxInstances: 10,
  },
  (request) =>
    resolveNotesProtectedAsset({
      auth: request.auth,
      data: request.data,
    })
);

exports.upsertMockTestLeaderboardEntry =
  onCall(
    {
      region: "asia-south1",
      timeoutSeconds: 15,
      memory: "256MiB",
      maxInstances: 10,
    },
    (request) =>
      upsertMockTestLeaderboardProjection({
        auth: request.auth,
        data: request.data,
      })
  );

exports.__test = Object.freeze({

  NOTES_RESOLVER_FUNCTION_NAME,
  NOTES_CONTENT_COLLECTION,
  NOTES_ASSET_COLLECTION,
  NOTES_ENTITLEMENTS_COLLECTION,
  NOTES_ENTITLEMENT_ITEMS_COLLECTION,
  normalizeNotesAssetResolverRequest,
  isNotesEntitlementActive,
  notesEntitlementMatchesResource,
  resolveNotesEntitlementEvidence,
  pickNotesProtectedAssetUrl,
  loadNotesEntitlements,
  resolveNotesProtectedAsset,
  LEADERBOARD_PRIVATE_COLLECTION,
  LEADERBOARD_PUBLIC_COLLECTION,
  buildMockTestServerTimeResponse,
  buildMockTestLeaderboardProjection,
  buildPrivateLeaderboardId,
  buildPublicLeaderboardId,
  buildPublicLeaderboardName,
  loadOwnedSubmittedMockResult,
  shouldReplaceMockTestLeaderboardEntry,
  upsertMockTestLeaderboardProjection,
});
