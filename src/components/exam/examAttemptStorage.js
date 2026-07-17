const ATTEMPT_STORAGE_PREFIX = "aspireExamAttempt_v2";
const LEGACY_ATTEMPT_STORAGE_PREFIX = "aspireExamAttempt";
const ATTEMPT_ANSWER_STORAGE_PREFIX =
  "mockAttemptAnswers_v2";

export const EXAM_ATTEMPT_STORAGE_VERSION = 2;

let activeAttemptStorageIdentity = null;

const cleanString = (value = "") =>
  String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const safeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const stableScopeHash = (value = "") => {
  const normalized = cleanString(value);
  let hashOne = 2166136261;
  let hashTwo = 2246822519;

  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);

    hashOne ^= code;
    hashOne = Math.imul(hashOne, 16777619);

    hashTwo ^= code + index;
    hashTwo = Math.imul(hashTwo, 3266489917);
  }

  return `${normalized.length.toString(36)}_${(
    hashOne >>> 0
  ).toString(36)}_${(hashTwo >>> 0).toString(36)}`;
};

const normalizeAttemptIdentity = (identity = null) => {
  const uid = cleanString(
    identity?.uid || identity?.ownerUid
  );
  const email = normalizeEmail(
    identity?.email || identity?.ownerEmail
  );
  const source = uid || email;
  const ownerScope = source
    ? `${uid ? "uid" : "email"}_${stableScopeHash(source)}`
    : "";

  return Object.freeze({
    uid,
    email,
    ownerScope,
    isValid: Boolean(ownerScope),
  });
};

const resolveAttemptIdentity = (identity = undefined) => {
  if (identity !== undefined) {
    return normalizeAttemptIdentity(identity);
  }

  return normalizeAttemptIdentity(activeAttemptStorageIdentity);
};

export const setAttemptStorageIdentity = (identity = null) => {
  const normalizedIdentity = normalizeAttemptIdentity(identity);

  activeAttemptStorageIdentity = normalizedIdentity.isValid
    ? {
        uid: normalizedIdentity.uid,
        email: normalizedIdentity.email,
      }
    : null;

  return normalizedIdentity;
};

export const getAttemptOwnerScope = (identity = undefined) =>
  resolveAttemptIdentity(identity).ownerScope;

const encodeStorageSegment = (value = "") =>
  encodeURIComponent(cleanString(value));

export const getLegacyAttemptStorageKey = (testId) =>
  `${LEGACY_ATTEMPT_STORAGE_PREFIX}_${testId}`;

export const getAttemptStorageKey = (
  testId,
  identity = undefined
) => {
  const normalizedTestId = cleanString(testId);
  const owner = resolveAttemptIdentity(identity);

  if (!normalizedTestId || !owner.isValid) {
    return "";
  }

  return `${ATTEMPT_STORAGE_PREFIX}_${owner.ownerScope}_${encodeStorageSegment(
    normalizedTestId
  )}`;
};

export const getAttemptAnswerStorageKey = (
  testId,
  identity = undefined
) => {
  const normalizedTestId = cleanString(testId);
  const owner = resolveAttemptIdentity(identity);

  if (!normalizedTestId || !owner.isValid) {
    return "";
  }

  return `${ATTEMPT_ANSWER_STORAGE_PREFIX}_${owner.ownerScope}_${encodeStorageSegment(
    normalizedTestId
  )}`;
};

const shuffleExamArray = (items = []) => {
  const clonedItems = [...items];

  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [clonedItems[index], clonedItems[randomIndex]] = [
      clonedItems[randomIndex],
      clonedItems[index],
    ];
  }

  return clonedItems;
};

const buildQuestionOrder = (test = {}) => {
  const defaultOrder = (test?.questions || []).map(
    (_, index) => index
  );

  if (test?.shuffleQuestions === "yes") {
    return shuffleExamArray(defaultOrder);
  }

  return defaultOrder;
};

const isValidQuestionOrder = (order, totalQuestions) => {
  if (!Array.isArray(order)) return false;
  if (order.length !== totalQuestions) return false;

  const sortedOrder = [...order].sort((a, b) => a - b);

  return sortedOrder.every(
    (item, index) => item === index
  );
};

const isAttemptOwnedByIdentity = ({
  state = null,
  testId = "",
  identity = undefined,
  allowUnowned = false,
} = {}) => {
  const owner = resolveAttemptIdentity(identity);
  const normalizedTestId = cleanString(testId);
  const stateTestId = cleanString(state?.testId);
  const stateOwnerUid = cleanString(state?.ownerUid);
  const stateOwnerEmail = normalizeEmail(state?.ownerEmail);

  if (!owner.isValid || !state || typeof state !== "object") {
    return false;
  }

  if (
    normalizedTestId &&
    stateTestId &&
    normalizedTestId !== stateTestId
  ) {
    return false;
  }

  if (owner.uid) {
    if (stateOwnerUid) {
      return stateOwnerUid === owner.uid;
    }

    if (stateOwnerEmail && owner.email) {
      return stateOwnerEmail === owner.email;
    }

    return allowUnowned;
  }

  if (owner.email) {
    if (stateOwnerUid) return false;

    if (stateOwnerEmail) {
      return stateOwnerEmail === owner.email;
    }

    return allowUnowned;
  }

  return false;
};

export const isAttemptStateOwnedByIdentity = (
  state,
  testId,
  identity = undefined
) =>
  isAttemptOwnedByIdentity({
    state,
    testId,
    identity,
  });

const stampAttemptOwnership = ({
  state = {},
  testId = "",
  identity = undefined,
} = {}) => {
  const owner = resolveAttemptIdentity(identity);

  return {
    ...state,
    testId: cleanString(testId),
    ownerUid: owner.uid,
    ownerEmail: owner.email,
    attemptOwnerScope: owner.ownerScope,
    storageVersion: EXAM_ATTEMPT_STORAGE_VERSION,
    status: state?.isSubmitted
      ? "submitted"
      : cleanString(state?.status) || "in_progress",
  };
};

export const createDefaultAttemptState = (
  test,
  defaultTimeLeft = 0,
  identity = undefined
) => {
  const questionOrder = buildQuestionOrder(test);
  const firstActualQuestionIndex = questionOrder[0] ?? 0;

  return stampAttemptOwnership({
    testId: test?.id || "",
    identity,
    state: {
      currentIndex: 0,
      questionOrder,
      answers: {},
      marked: {},
      visited: {
        [firstActualQuestionIndex]: true,
      },
      paletteRangeStart: 0,
      timeLeft: defaultTimeLeft,
      startedAt: Date.now(),
      submittedAt: null,
      isSubmitted: false,
      status: "in_progress",
    },
  });
};

const getStoredAttemptPayload = (storageKey = "") => {
  if (!storageKey) return null;

  const saved = localStorage.getItem(storageKey);

  if (!saved) return null;

  const parsedState = JSON.parse(saved);

  return parsedState && typeof parsedState === "object"
    ? parsedState
    : null;
};

const migrateOwnedLegacyAttempt = ({
  testId = "",
  identity = undefined,
  targetKey = "",
} = {}) => {
  if (!targetKey) return null;

  const legacyKey = getLegacyAttemptStorageKey(testId);
  let legacyState = null;

  try {
    legacyState = getStoredAttemptPayload(legacyKey);
  } catch {
    localStorage.removeItem(legacyKey);
    return null;
  }

  if (
    !legacyState ||
    !isAttemptOwnedByIdentity({
      state: legacyState,
      testId,
      identity,
    })
  ) {
    return null;
  }

  const migratedState = stampAttemptOwnership({
    state: legacyState,
    testId,
    identity,
  });

  localStorage.setItem(
    targetKey,
    JSON.stringify(migratedState)
  );
  localStorage.removeItem(legacyKey);

  return migratedState;
};

export const saveAttemptState = (
  testId,
  state,
  identity = undefined
) => {
  const normalizedTestId = cleanString(testId);
  const owner = resolveAttemptIdentity(identity);
  const storageKey = getAttemptStorageKey(
    normalizedTestId,
    owner
  );

  if (
    !normalizedTestId ||
    !state ||
    !owner.isValid ||
    !storageKey
  ) {
    return false;
  }

  if (
    !isAttemptOwnedByIdentity({
      state,
      testId: normalizedTestId,
      identity: owner,
      allowUnowned: true,
    })
  ) {
    return false;
  }

  try {
    const ownedState = stampAttemptOwnership({
      state,
      testId: normalizedTestId,
      identity: owner,
    });

    localStorage.setItem(
      storageKey,
      JSON.stringify(ownedState)
    );

    return true;
  } catch {
    return false;
  }
};

export const restoreAttemptState = (
  test,
  defaultTimeLeft = 0,
  identity = undefined
) => {
  const owner = resolveAttemptIdentity(identity);
  const baseState = createDefaultAttemptState(
    test,
    defaultTimeLeft,
    owner
  );

  if (!test?.id || !owner.isValid) {
    return baseState;
  }

  const storageKey = getAttemptStorageKey(test.id, owner);

  try {
    const parsedState =
      getStoredAttemptPayload(storageKey) ||
      migrateOwnedLegacyAttempt({
        testId: test.id,
        identity: owner,
        targetKey: storageKey,
      });

    if (!parsedState) {
      return baseState;
    }

    if (
      !isAttemptOwnedByIdentity({
        state: parsedState,
        testId: test.id,
        identity: owner,
      })
    ) {
      localStorage.removeItem(storageKey);
      return baseState;
    }

    const totalQuestions = test?.questions?.length || 0;
    const questionOrder = isValidQuestionOrder(
      parsedState.questionOrder,
      totalQuestions
    )
      ? parsedState.questionOrder
      : baseState.questionOrder;
    const safeCurrentIndex = Number.isInteger(
      parsedState.currentIndex
    )
      ? Math.min(
          Math.max(parsedState.currentIndex, 0),
          Math.max(totalQuestions - 1, 0)
        )
      : baseState.currentIndex;
    const currentActualQuestionIndex =
      questionOrder[safeCurrentIndex] ?? safeCurrentIndex;
    const visited = {
      ...safeObject(parsedState.visited),
    };

    if (!Object.keys(visited).length) {
      visited[currentActualQuestionIndex] = true;
    }

    return stampAttemptOwnership({
      testId: test.id,
      identity: owner,
      state: {
        ...baseState,
        ...parsedState,
        currentIndex: safeCurrentIndex,
        questionOrder,
        answers: safeObject(parsedState.answers),
        marked: safeObject(parsedState.marked),
        visited,
        paletteRangeStart: Number.isInteger(
          parsedState.paletteRangeStart
        )
          ? parsedState.paletteRangeStart
          : baseState.paletteRangeStart,
        timeLeft: Number.isFinite(Number(parsedState.timeLeft))
          ? Number(parsedState.timeLeft)
          : baseState.timeLeft,
        isSubmitted: parsedState.isSubmitted === true,
        submittedAt: parsedState.submittedAt || null,
        startedAt:
          parsedState.startedAt || baseState.startedAt,
      },
    });
  } catch {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }

    return baseState;
  }
};

export const removeAttemptState = (
  testId,
  identity = undefined
) => {
  const storageKey = getAttemptStorageKey(testId, identity);

  if (!storageKey) return false;

  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
};

export const removeAttemptAnswerState = (
  testId,
  identity = undefined
) => {
  const storageKey = getAttemptAnswerStorageKey(
    testId,
    identity
  );

  if (!storageKey) return false;

  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
};
