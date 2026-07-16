import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_DECISIONS,
  MOCK_TEST_REASON_CODES,
} from "../../access/mockTestActionPolicy.js";
import {
  buildMockTestRuntimeDecision,
} from "../../access/mockTestRuntimeAdapter.js";

export const EXAM_START_ACCESS_STATES =
  Object.freeze({
    READY: "ready",
    NOT_FOUND: "not_found",
    UNPUBLISHED: "unpublished",
    LOGIN_REQUIRED: "login_required",
    LOCKED: "locked",
    LOADING: "loading",
    ERROR: "error",
    BLOCKED: "blocked",
    INVALID_SCHEDULE: "invalid_schedule",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const freezeModel = ({
  state,
  decision = MOCK_TEST_DECISIONS.DENY,
  reason = "",
  label = "",
  title = "",
  message = "",
  actionLabel = "",
  recoveryRoute = "",
  testId = "",
  requiredPlan = "",
  scheduleStatus = "",
  sourceScope = "",
  exactItem = false,
} = {}) =>
  Object.freeze({
    state,
    decision,
    reason,
    label,
    title,
    message,
    actionLabel,
    recoveryRoute,
    testId,
    requiredPlan,
    scheduleStatus,
    sourceScope,
    exactItem: exactItem === true,
    isAllowed:
      state === EXAM_START_ACCESS_STATES.READY,
  });

const isBlockedProfile = (accessProfile = {}) =>
  accessProfile?.isBlocked === true ||
  normalizeText(
    accessProfile?.shellState?.mode
  ) === "blocked";

const fromDecision = (decision = {}) => {
  const shared = {
    decision: decision.decision,
    reason: decision.reason,
    testId: cleanString(decision.testId),
    requiredPlan: cleanString(
      decision.requiredPlan
    ),
    scheduleStatus: cleanString(
      decision.scheduleStatus
    ),
    sourceScope: cleanString(
      decision.sourceScope
    ),
    exactItem: decision.exactItem === true,
  };

  if (
    decision.decision ===
      MOCK_TEST_DECISIONS.ALLOW &&
    decision.reason ===
      MOCK_TEST_REASON_CODES.ALLOWED
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES.READY,
    });
  }

  if (
    [
      MOCK_TEST_REASON_CODES.NOT_FOUND,
      MOCK_TEST_REASON_CODES.NOT_MOCK_TEST,
    ].includes(decision.reason)
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES.NOT_FOUND,
      label: "Unavailable",
      title: "Test not found",
      message:
        "This mock test is not available anymore.",
      actionLabel: "Back to Mock Tests",
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.UNPUBLISHED
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES.UNPUBLISHED,
      label: "Unpublished",
      title: "Test unavailable",
      message:
        "This mock test is not published yet.",
      actionLabel: "Back to Mock Tests",
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.LOGIN_REQUIRED
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES.LOGIN_REQUIRED,
      label: "Login Required",
      title: "Login before starting",
      message:
        "Please login before starting this mock test.",
      actionLabel: "Login to Continue",
      recoveryRoute: "/login",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.ACCESS_LOADING
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES.LOADING,
      label: "Checking Access",
      title: "Verifying mock-test access",
      message:
        "Your access is still loading. Protected test content remains closed.",
      actionLabel: "Back to Mock Tests",
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  if (
    [
      MOCK_TEST_REASON_CODES.ACCESS_DENIED,
      MOCK_TEST_REASON_CODES
        .ACCESS_SCOPE_MISMATCH,
    ].includes(decision.reason)
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES.LOCKED,
      label: "Access Required",
      title: "Mock test locked",
      message: `This mock test needs ${
        cleanString(decision.requiredPlan) ||
        "eligible"
      } access.`,
      actionLabel: "View Pricing",
      recoveryRoute:
        "/ctet-tet/pricing",
    });
  }

  if (
    decision.reason ===
    MOCK_TEST_REASON_CODES.INVALID_SCHEDULE
  ) {
    return freezeModel({
      ...shared,
      state:
        EXAM_START_ACCESS_STATES
          .INVALID_SCHEDULE,
      label: "Schedule Unavailable",
      title: "Test schedule needs review",
      message:
        "This mock test cannot open because its schedule is invalid.",
      actionLabel: "Back to Mock Tests",
      recoveryRoute:
        "/ctet-tet/mock-tests",
    });
  }

  return freezeModel({
    ...shared,
    state:
      EXAM_START_ACCESS_STATES.ERROR,
    label: "Access Unavailable",
    title: "Mock-test access could not be verified",
    message:
      "Protected test content remains closed until access verification succeeds.",
    actionLabel: "Back to Mock Tests",
    recoveryRoute:
      "/ctet-tet/mock-tests",
  });
};

export const buildExamStartAccessModel = ({
  test = null,
  user = null,
  role = "",
  isAdminUser = false,
  accessProfile = {},
  planCatalog = [],
  now = Date.now(),
} = {}) => {
  if (isBlockedProfile(accessProfile)) {
    return freezeModel({
      state:
        EXAM_START_ACCESS_STATES.BLOCKED,
      reason: "blocked",
      label: "Access Needs Attention",
      title: "Review My Access",
      message:
        "Your account access needs attention before this mock test can open.",
      actionLabel: "Review My Access",
      recoveryRoute: "/my-access",
      testId: cleanString(test?.id),
      requiredPlan: cleanString(
        test?.planCode ||
          test?.planType ||
          test?.requiredPlan
      ),
    });
  }

  return fromDecision(
    buildMockTestRuntimeDecision({
      action: MOCK_TEST_ACTIONS.OPEN,
      test,
      user,
      role,
      isAdminUser,
      accessProfile,
      planCatalog,
      now,
    })
  );
};
