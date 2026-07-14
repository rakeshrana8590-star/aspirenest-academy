import {
  canAccessContent,
  canUsePlan,
  isAccessActive,
} from "./accessUtils";
import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
} from "./accessConstants";

const past = new Date(Date.now() - 60_000).toISOString();
const future = new Date(Date.now() + 86_400_000).toISOString();

const planAccess = (overrides = {}) => ({
  id: "plan-access",
  uid: "student-1",
  normalizedEmail: "student@example.com",
  course: ACCESS_COURSE.CTET_TET,
  planType: ACCESS_PLAN_TYPES.PREMIUM,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  status: "active",
  accessFrom: past,
  accessUntil: future,
  ...overrides,
});

describe("Access Engine fail-closed policy", () => {
  test("login or legacy profile plan without studentAccess never grants paid access", () => {
    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        userPlan: ACCESS_PLAN_TYPES.PREMIUM,
        accessRecords: [],
      })
    ).toBe(false);
  });

  test("emergency flag cannot bypass the Access Engine", () => {
    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        emergencyAccess: true,
        accessRecords: [],
      })
    ).toBe(false);
  });

  test("valid plan access follows FREE < BASIC < PREMIUM < MENTORSHIP", () => {
    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.BASIC,
        course: ACCESS_COURSE.CTET_TET,
        accessRecords: [planAccess()],
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.MENTORSHIP,
        course: ACCESS_COURSE.CTET_TET,
        accessRecords: [planAccess()],
      })
    ).toBe(false);
  });

  test("module access grants only that module and not global plan access", () => {
    const moduleRecord = planAccess({
      id: "notes-only",
      scopeType: ACCESS_SCOPE_TYPES.MODULE,
      module: ACCESS_MODULE.NOTES,
    });

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        course: ACCESS_COURSE.CTET_TET,
        module: ACCESS_MODULE.NOTES,
        accessRecords: [moduleRecord],
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        course: ACCESS_COURSE.CTET_TET,
        module: ACCESS_MODULE.MOCK_TEST,
        accessRecords: [moduleRecord],
      })
    ).toBe(false);

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        course: ACCESS_COURSE.CTET_TET,
        accessRecords: [moduleRecord],
      })
    ).toBe(false);
  });

  test("single test access grants only the exact test", () => {
    const itemRecord = planAccess({
      id: "test-only",
      scopeType: ACCESS_SCOPE_TYPES.ITEM,
      module: ACCESS_MODULE.MOCK_TEST,
      itemType: ACCESS_ITEM_TYPES.MOCK_TEST,
      itemId: "test-123",
    });

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        course: ACCESS_COURSE.CTET_TET,
        module: ACCESS_MODULE.MOCK_TEST,
        itemType: ACCESS_ITEM_TYPES.MOCK_TEST,
        itemId: "test-123",
        accessRecords: [itemRecord],
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        course: ACCESS_COURSE.CTET_TET,
        module: ACCESS_MODULE.MOCK_TEST,
        itemType: ACCESS_ITEM_TYPES.MOCK_TEST,
        itemId: "test-999",
        accessRecords: [itemRecord],
      })
    ).toBe(false);
  });

  test("expired, future, missing-status, unknown-plan and unknown-scope records are denied", () => {
    const expired = planAccess({ accessUntil: past });
    const futureDated = planAccess({ accessFrom: future });
    const missingStatus = planAccess({ status: "" });
    const unknownPlan = planAccess({ planType: "GOLD" });
    const missingScope = planAccess({ scopeType: "" });
    const unknownScope = planAccess({ scopeType: "GLOBAL" });

    expect(isAccessActive(expired)).toBe(false);
    expect(isAccessActive(futureDated)).toBe(false);
    expect(isAccessActive(missingStatus)).toBe(false);
    expect(isAccessActive(unknownPlan)).toBe(false);
    expect(isAccessActive(missingScope)).toBe(false);
    expect(isAccessActive(unknownScope)).toBe(false);
  });

  test("unknown required content plan is denied instead of becoming FREE", () => {
    expect(
      canAccessContent({
        requiredPlan: "GOLD",
        course: ACCESS_COURSE.CTET_TET,
        accessRecords: [
          planAccess({ planType: ACCESS_PLAN_TYPES.MENTORSHIP }),
        ],
      })
    ).toBe(false);
  });

  test("plan comparison rejects unknown paid values but preserves public FREE content", () => {
    expect(
      canUsePlan(ACCESS_PLAN_TYPES.MENTORSHIP, "GOLD")
    ).toBe(false);

    expect(
      canUsePlan("GOLD", ACCESS_PLAN_TYPES.PREMIUM)
    ).toBe(false);

    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.FREE,
        accessRecords: [],
      })
    ).toBe(true);
  });

  test("course mismatch is denied", () => {
    expect(
      canAccessContent({
        requiredPlan: ACCESS_PLAN_TYPES.PREMIUM,
        course: "NEET",
        accessRecords: [planAccess()],
      })
    ).toBe(false);
  });
});
