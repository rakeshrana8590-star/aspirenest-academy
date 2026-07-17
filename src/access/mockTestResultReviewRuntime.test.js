import {
  MOCK_TEST_ACTIONS,
  MOCK_TEST_REASON_CODES,
} from "./mockTestActionPolicy";
import {
  MOCK_TEST_RESULT_REVIEW_STATES,
  buildMockTestResultEvidence,
  buildMockTestResultReviewRuntime,
  resolveMockTestReviewReleased,
} from "./mockTestResultReviewRuntime";

const USER = {
  uid: "student-1",
  email: "student@aspirenestacademy.in",
};

const TEST = {
  id: "mock-premium-1",
  section: "mockTest",
  status: "published",
  planType: "PREMIUM",
};

const RESULT = {
  testId: TEST.id,
  ownerUid: USER.uid,
  ownerEmail: USER.email,
  status: "submitted",
  submittedAt: "2026-07-17T08:00:00Z",
  answers: { 0: "option1" },
};

const accessRecord = (overrides = {}) => ({
  id: "access-1",
  status: "active",
  scopeType: "item",
  module: "mockTest",
  itemType: "mockTest",
  itemId: TEST.id,
  planType: "FREE",
  ...overrides,
});

const profile = (records = [accessRecord()]) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  isLoaded: true,
  accessRecords: records,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
});

const authorize = (overrides = {}) =>
  buildMockTestResultReviewRuntime({
    action: MOCK_TEST_ACTIONS.VIEW_RESULT,
    test: TEST,
    user: USER,
    accessProfile: profile(),
    result: RESULT,
    ...overrides,
  });

describe("AspireNest mock-test result and review runtime", () => {
  test("allows VIEW_RESULT for the exact owned item result", () => {
    const runtime = authorize();

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.READY
    );
    expect(runtime.canExposeResult).toBe(true);
    expect(runtime.canExposeAnswers).toBe(false);
    expect(runtime.exactItem).toBe(true);
  });

  test("allows REVIEW independently and exposes answers only after release", () => {
    const runtime = authorize({
      action: MOCK_TEST_ACTIONS.REVIEW,
      reviewReleased: true,
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.READY
    );
    expect(runtime.canExposeResult).toBe(true);
    expect(runtime.canExposeAnswers).toBe(true);
  });

  test("locks REVIEW when answer release is explicitly disabled", () => {
    const runtime = authorize({
      action: MOCK_TEST_ACTIONS.REVIEW,
      reviewReleased: false,
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.REVIEW_LOCKED
    );
    expect(runtime.reason).toBe(
      MOCK_TEST_REASON_CODES.REVIEW_NOT_RELEASED
    );
    expect(runtime.canExposeAnswers).toBe(false);
  });

  test("denies a cross-user result", () => {
    const runtime = authorize({
      result: {
        ...RESULT,
        ownerUid: "student-2",
      },
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES
        .RESULT_OWNERSHIP_DENIED
    );
    expect(runtime.canExposeResult).toBe(false);
  });

  test("fails closed when no submitted result exists", () => {
    const runtime = authorize({ result: null });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.RESULT_REQUIRED
    );
    expect(runtime.canExposeResult).toBe(false);
  });

  test("shows secure loading while owned results are still loading", () => {
    const runtime = authorize({
      result: null,
      dataLoading: true,
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.LOADING
    );
    expect(runtime.canExposeResult).toBe(false);
  });

  test("shows a fail-closed error when result recovery fails", () => {
    const runtime = authorize({
      result: null,
      dataError: "Result recovery unavailable",
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.ERROR
    );
    expect(runtime.canExposeResult).toBe(false);
  });

  test("does not let loading result data override access denial", () => {
    const runtime = authorize({
      result: null,
      dataLoading: true,
      accessProfile: profile([]),
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.LOCKED
    );
  });

  test("accepts legacy owned results that carry normalized email ownership", () => {
    const runtime = authorize({
      result: {
        testId: TEST.id,
        email: USER.email.toUpperCase(),
        endedAt: "2026-07-17T08:00:00Z",
      },
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.READY
    );
  });

  test("rejects a result from another test", () => {
    const runtime = authorize({
      result: {
        ...RESULT,
        testId: "mock-other",
      },
    });

    expect(runtime.state).toBe(
      MOCK_TEST_RESULT_REVIEW_STATES.INVALID_RESULT
    );
  });

  test("normalizes submitted result evidence without changing ownership", () => {
    const evidence = buildMockTestResultEvidence({
      test: TEST,
      result: {
        ownerUid: USER.uid,
        ownerEmail: USER.email,
        isSubmitted: true,
      },
    });

    expect(evidence.testId).toBe(TEST.id);
    expect(evidence.status).toBe("submitted");
    expect(evidence.ownerUid).toBe(USER.uid);
  });

  test("preserves immediate review unless the test explicitly locks it", () => {
    expect(
      resolveMockTestReviewReleased({ test: TEST, result: RESULT })
    ).toBe(true);
    expect(
      resolveMockTestReviewReleased({
        test: { ...TEST, allowReview: false },
        result: RESULT,
      })
    ).toBe(false);
    expect(
      resolveMockTestReviewReleased({
        test: { ...TEST, reviewMode: "locked" },
        result: RESULT,
      })
    ).toBe(false);
  });
});
