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
