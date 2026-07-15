import {
  canAccessContent,
  resolveBestPlanAccess,
} from "./accessUtils";

const active = {
  status: "active",
  accessUntil: "2099-01-01T00:00:00.000Z",
};

describe("AspireNest unified access policy", () => {
  test("FREE content is always discoverable/open", () => {
    expect(canAccessContent({ requiredPlan: "FREE" })).toBe(true);
  });

  test("exact PREMIUM item access opens only that item", () => {
    const itemGrant = {
      ...active,
      id: "mega-item",
      planType: "PREMIUM",
      scopeType: "item",
      module: "mockTest",
      itemType: "mockTest",
      itemId: "mega-1",
    };

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [itemGrant],
        module: "mockTest",
        itemType: "mockTest",
        itemId: "mega-1",
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [itemGrant],
        module: "mockTest",
        itemType: "mockTest",
        itemId: "other-test",
      })
    ).toBe(false);

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [itemGrant],
        module: "notes",
      })
    ).toBe(false);
  });

  test("item grant can never become the learner active plan", () => {
    const itemGrant = {
      ...active,
      id: "premium-item",
      planType: "PREMIUM",
      scopeType: "item",
      module: "video",
      itemType: "video",
      itemId: "video-1",
    };

    expect(resolveBestPlanAccess([itemGrant])).toBeNull();
  });

  test("PREMIUM plan access opens BASIC and PREMIUM but not MENTORSHIP", () => {
    const planGrant = {
      ...active,
      id: "premium-plan",
      planType: "PREMIUM",
      scopeType: "plan",
    };

    expect(
      canAccessContent({
        requiredPlan: "BASIC",
        accessRecords: [planGrant],
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [planGrant],
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: "MENTORSHIP",
        accessRecords: [planGrant],
      })
    ).toBe(false);
  });

  test("module access is limited by module and plan tier", () => {
    const moduleGrant = {
      ...active,
      id: "basic-mocks",
      planType: "BASIC",
      scopeType: "module",
      module: "mockTest",
    };

    expect(
      canAccessContent({
        requiredPlan: "BASIC",
        accessRecords: [moduleGrant],
        module: "mockTest",
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [moduleGrant],
        module: "mockTest",
      })
    ).toBe(false);

    expect(
      canAccessContent({
        requiredPlan: "BASIC",
        accessRecords: [moduleGrant],
        module: "notes",
      })
    ).toBe(false);
  });

  test("bundle access opens only listed items", () => {
    const bundleGrant = {
      ...active,
      id: "revision-bundle",
      planType: "PREMIUM",
      scopeType: "bundle",
      module: "notes",
      itemType: "notesPdf",
      itemIds: ["note-1", "note-2"],
    };

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [bundleGrant],
        module: "notes",
        itemType: "notesPdf",
        itemId: "note-2",
      })
    ).toBe(true);

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [bundleGrant],
        module: "notes",
        itemType: "notesPdf",
        itemId: "note-3",
      })
    ).toBe(false);
  });

  test("expired and blocked grants never allow access", () => {
    const expiredPlan = {
      id: "expired-plan",
      planType: "PREMIUM",
      scopeType: "plan",
      status: "active",
      accessUntil: "2000-01-01T00:00:00.000Z",
    };

    const blockedItem = {
      id: "blocked-item",
      planType: "PREMIUM",
      scopeType: "item",
      module: "mockTest",
      itemType: "mockTest",
      itemId: "mega-1",
      status: "blocked",
      accessUntil: "2099-01-01T00:00:00.000Z",
    };

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [expiredPlan],
      })
    ).toBe(false);

    expect(
      canAccessContent({
        requiredPlan: "PREMIUM",
        accessRecords: [blockedItem],
        module: "mockTest",
        itemType: "mockTest",
        itemId: "mega-1",
      })
    ).toBe(false);
  });

  test("admin bypass remains explicit", () => {
    expect(
      canAccessContent({
        requiredPlan: "MENTORSHIP",
        isAdmin: true,
      })
    ).toBe(true);
  });
});
