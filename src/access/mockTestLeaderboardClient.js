import {
  httpsCallable,
} from "firebase/functions";
import {
  auth,
  functions,
} from "../firebase";

export const MOCK_TEST_LEADERBOARD_FUNCTION_NAME =
  "upsertMockTestLeaderboardEntry";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const cleanText = (
  value = "",
  maxLength = 300
) =>
  cleanString(value)
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const toFiniteNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
};

const toEpochMs = (value) => {
  if (!value) return null;

  if (
    typeof value?.toMillis === "function"
  ) {
    return toFiniteNumber(
      value.toMillis(),
      null
    );
  }

  if (
    typeof value?.seconds === "number"
  ) {
    return toFiniteNumber(
      value.seconds * 1000,
      null
    );
  }

  if (value instanceof Date) {
    return toFiniteNumber(
      value.getTime(),
      null
    );
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

export const buildMockTestLeaderboardPayload = (
  input = {}
) =>
  Object.freeze({
    testId: cleanText(
      input.testId,
      200
    ),
    testTitle: cleanText(
      input.testTitle,
      200
    ),
    leaderboardMode: cleanText(
      input.leaderboardMode,
      80
    ),
    studentName: cleanText(
      input.studentName,
      80
    ),
    subject: cleanText(
      input.subject,
      120
    ),
    chapter: cleanText(
      input.chapter,
      160
    ),
    planType: cleanText(
      input.planType || "FREE",
      80
    ),
    examType: cleanText(
      input.examType,
      120
    ),
    testType: cleanText(
      input.testType,
      120
    ),
    score: toFiniteNumber(
      input.score,
      0
    ),
    totalMarks: toFiniteNumber(
      input.totalMarks,
      0
    ),
    percentage: toFiniteNumber(
      input.percentage,
      0
    ),
    accuracy: toFiniteNumber(
      input.accuracy,
      0
    ),
    correctCount: toFiniteNumber(
      input.correctCount,
      0
    ),
    wrongCount: toFiniteNumber(
      input.wrongCount,
      0
    ),
    skippedCount: toFiniteNumber(
      input.skippedCount,
      0
    ),
    totalQuestions: toFiniteNumber(
      input.totalQuestions,
      0
    ),
    durationSeconds: toFiniteNumber(
      input.durationSeconds,
      0
    ),
    attemptId: cleanText(
      input.attemptId,
      300
    ),
    attemptStartedAt: toEpochMs(
      input.attemptStartedAt
    ),
    attemptSubmittedAt: toEpochMs(
      input.attemptSubmittedAt
    ),
    attemptNumber: toFiniteNumber(
      input.attemptNumber,
      1
    ),
    startedAt: toEpochMs(
      input.startedAt
    ),
    endedAt: toEpochMs(
      input.endedAt
    ),
  });

export const createFirebaseMockTestLeaderboardCall = ({
  authInstance = auth,
  functionsInstance = functions,
  callableFactory = httpsCallable,
  functionName =
    MOCK_TEST_LEADERBOARD_FUNCTION_NAME,
} = {}) => {
  let callable = null;

  return async (input = {}) => {
    const uid = cleanString(
      authInstance?.currentUser?.uid
    );

    if (!uid) {
      const error = new Error(
        "Verified login is required before saving a leaderboard entry."
      );
      error.code =
        "auth/unauthenticated";
      throw error;
    }

    const payload =
      buildMockTestLeaderboardPayload(
        input
      );

    if (
      !payload.testId ||
      !payload.attemptId
    ) {
      const error = new Error(
        "A submitted mock-test attempt is required."
      );
      error.code =
        "leaderboard/invalid-attempt";
      throw error;
    }

    if (!callable) {
      callable = callableFactory(
        functionsInstance,
        functionName,
        { timeout: 15000 }
      );
    }

    const response =
      await callable(payload);

    return response?.data || null;
  };
};

export const saveMockTestLeaderboardEntry =
  createFirebaseMockTestLeaderboardCall();
