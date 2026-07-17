import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DECISIONS,
  MOCK_TEST_REASON_CODES,
} from "./mockTestActionPolicy";
import { buildMockTestRuntimeDecision } from "./mockTestRuntimeAdapter";

export const MOCK_TEST_RESULT_REVIEW_STATES =
  Object.freeze({
    READY: "ready",
    LOADING: "loading",
    NOT_FOUND: "not_found",
    UNPUBLISHED: "unpublished",
    LOGIN_REQUIRED: "login_required",
    LOCKED: "locked",
    RESULT_REQUIRED: "result_required",
    RESULT_OWNERSHIP_DENIED:
      "result_ownership_denied",
    INVALID_RESULT: "invalid_result",
    REVIEW_LOCKED: "review_locked",
    ERROR: "error",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const isObjectRecord = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value);

const getResultState = (result = {}) => {
  const direct = normalizeText(
    result.workflowState || result.status
  )
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (direct) return direct;

  if (
    result.isSubmitted === true ||
    result.submittedAt ||
    result.completedAt ||
    result.endedAt ||
    result.attemptSubmittedAt
  ) {
    return "submitted";
  }

  return "";
};

export const buildMockTestResultEvidence = ({
  test = null,
  result = null,
} = {}) => {
  if (!isObjectRecord(result)) return null;

  const testId = cleanString(
    result.testId ||
      result.mockTestId ||
      result.testID ||
      result.contentId ||
      result.resourceId ||
      test?.id
  );

  if (!testId) return null;

  return Object.freeze({
    ...result,
    testId,
    status: getResultState(result),
  });
};

const REVIEW_LOCKED_MODES = new Set([
  "disabled",
  "hidden",
  "locked",
  "manual",
  "none",
  "off",
  "unavailable",
]);

export const resolveMockTestReviewReleased = ({
  test = null,
  result = null,
} = {}) => {
  const explicitFlags = [
    test?.reviewReleased,
    test?.answersReleased,
    test?.answerReviewReleased,
    test?.allowReview,
    test?.allowAnswerReview,
    test?.showAnswers,
    test?.showCorrectAnswers,
    result?.reviewReleased,
    result?.answersReleased,
  ];

  if (explicitFlags.some((value) => value === false)) {
    return false;
  }

  const releaseMode = normalizeText(
    test?.reviewMode ||
      test?.answerReviewMode ||
      test?.solutionMode ||
      test?.answerVisibility
  );

  if (REVIEW_LOCKED_MODES.has(releaseMode)) {
    return false;
  }

  return true;
};

const freezeRuntime = ({
  state,
  action,
  decision = null,
  result = null,
  dataError = "",
} = {}) => {
  const isReady =
    state === MOCK_TEST_RESULT_REVIEW_STATES.READY &&
    decision?.decision === MOCK_TEST_DECISIONS.ALLOW &&
    decision?.reason === MOCK_TEST_REASON_CODES.ALLOWED;
  const isReview = action === MOCK_TEST_ACTIONS.REVIEW;

  return Object.freeze({
    state,
    action,
    reason:
      cleanString(decision?.reason) ||
      cleanString(dataError) ||
      "authorization_unavailable",
    decision,
    result,
    dataError: cleanString(dataError),
    isReady,
    canExposeResult: isReady,
    canExposeAnswers:
      isReady &&
      isReview &&
      decision?.canExposeAnswers === true,
    sourceScope: cleanString(decision?.sourceScope),
    exactItem: decision?.exactItem === true,
    requiresOwnedResult:
      decision?.requiresOwnedResult === true,
  });
};

const mapDecisionState = (decision = {}) => {
  if (
    decision.decision === MOCK_TEST_DECISIONS.ALLOW &&
    decision.reason === MOCK_TEST_REASON_CODES.ALLOWED
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.READY;
  }

  if (
    [
      MOCK_TEST_REASON_CODES.NOT_FOUND,
      MOCK_TEST_REASON_CODES.NOT_MOCK_TEST,
    ].includes(decision.reason)
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.NOT_FOUND;
  }

  if (decision.reason === MOCK_TEST_REASON_CODES.UNPUBLISHED) {
    return MOCK_TEST_RESULT_REVIEW_STATES.UNPUBLISHED;
  }

  if (
    decision.reason === MOCK_TEST_REASON_CODES.LOGIN_REQUIRED
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.LOGIN_REQUIRED;
  }

  if (
    decision.reason === MOCK_TEST_REASON_CODES.ACCESS_LOADING
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.LOADING;
  }

  if (
    [
      MOCK_TEST_REASON_CODES.ACCESS_DENIED,
      MOCK_TEST_REASON_CODES.ACCESS_SCOPE_MISMATCH,
    ].includes(decision.reason)
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.LOCKED;
  }

  if (
    decision.reason === MOCK_TEST_REASON_CODES.RESULT_REQUIRED
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.RESULT_REQUIRED;
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.RESULT_OWNERSHIP_MISMATCH
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES
      .RESULT_OWNERSHIP_DENIED;
  }

  if (
    [
      MOCK_TEST_REASON_CODES.RESULT_TEST_MISMATCH,
      MOCK_TEST_REASON_CODES.INVALID_RESULT_STATE,
    ].includes(decision.reason)
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.INVALID_RESULT;
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.REVIEW_NOT_RELEASED
  ) {
    return MOCK_TEST_RESULT_REVIEW_STATES.REVIEW_LOCKED;
  }

  return MOCK_TEST_RESULT_REVIEW_STATES.ERROR;
};

export const buildMockTestResultReviewRuntime = ({
  action = MOCK_TEST_ACTIONS.VIEW_RESULT,
  test = null,
  user = null,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
  result = null,
  dataLoading = false,
  dataError = "",
  reviewReleased = undefined,
  now = Date.now(),
} = {}) => {
  const resultEvidence = buildMockTestResultEvidence({
    test,
    result,
  });
  const resolvedReviewReleased =
    reviewReleased === undefined
      ? resolveMockTestReviewReleased({
          test,
          result: resultEvidence,
        })
      : reviewReleased === true;

  const decision = buildMockTestRuntimeDecision({
    action,
    test,
    user,
    role,
    isAdminUser,
    accessProfile,
    planCatalog,
    result: resultEvidence,
    reviewReleased: resolvedReviewReleased,
    now,
  });

  if (
    decision.reason === MOCK_TEST_REASON_CODES.RESULT_REQUIRED &&
    dataLoading === true
  ) {
    return freezeRuntime({
      state: MOCK_TEST_RESULT_REVIEW_STATES.LOADING,
      action,
      decision,
      result: resultEvidence,
    });
  }

  if (
    decision.reason === MOCK_TEST_REASON_CODES.RESULT_REQUIRED &&
    cleanString(dataError)
  ) {
    return freezeRuntime({
      state: MOCK_TEST_RESULT_REVIEW_STATES.ERROR,
      action,
      decision,
      result: resultEvidence,
      dataError,
    });
  }

  return freezeRuntime({
    state: mapDecisionState(decision),
    action,
    decision,
    result: resultEvidence,
    dataError,
  });
};
