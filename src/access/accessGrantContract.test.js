import {
  ACCESS_GRANT_STATUS_VALUES,
  ACCESS_KEY_GRANT_STATUS_VALUES,
  buildGrantKey,
  buildGrantPrincipalRef,
  buildGrantTargetKey,
  normalizeAndValidateGrantInput,
  normalizeAndValidateGrantTarget,
  normalizeGrantCourse,
  normalizeGrantItemIds,
  normalizeGrantPlanType,
  normalizeGrantScopeType,
} from "./accessGrantContract";

describe("AspireNest grant contract", () => {
  test("PLAN keeps only plan target fields", () => {
    const grant = normalizeAndValidateGrantInput({
      email: " Student@Example.com ",
      course: "CTET/TET",
      scopeType: "PLAN",
      planType: "premium",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
      itemIds: ["note-1"],
      bundleId: "bundle-1",
      status: "active",
      source: "admin_manual",
    });

    expect(grant.email).toBe("student@example.com");
    expect(grant.course).toBe("CTET_TET");
    expect(grant.scopeType).toBe("plan");
    expect(grant.planType).toBe("PREMIUM");
    expect(grant.module).toBeNull();
    expect(grant.itemType).toBeNull();
    expect(grant.itemId).toBeNull();
    expect(grant.itemIds).toEqual([]);
    expect(grant.bundleId).toBeNull();
    expect(grant.targetKey).toBe("plan:PREMIUM");
  });

  test("MODULE requires a known module and clears item fields", () => {
    const target = normalizeAndValidateGrantTarget({
      scopeType: "module",
      planType: "BASIC",
      module: "mock-test",
      itemType: "mockTest",
      itemId: "test-1",
      itemIds: ["test-1"],
      bundleId: "bundle-1",
      status: "active",
    });

    expect(target.module).toBe("mockTest");
    expect(target.itemType).toBeNull();
    expect(target.itemId).toBeNull();
    expect(target.itemIds).toEqual([]);
    expect(target.bundleId).toBeNull();

    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "module",
        module: "",
      })
    ).toThrow("Access module is invalid.");
  });

  test("ITEM requires module, item type and exact item id", () => {
    const target = normalizeAndValidateGrantTarget({
      scopeType: "item",
      planType: "PREMIUM",
      module: "current-affairs",
      itemType: "current-affairs-pdf",
      itemId: "ca-july-2026",
      itemIds: ["ignored"],
      bundleId: "ignored",
      status: "active",
    });

    expect(target).toMatchObject({
      scopeType: "item",
      module: "currentAffairs",
      itemType: "currentAffairsPdf",
      itemId: "ca-july-2026",
      itemIds: [],
      bundleId: null,
      targetKey:
        "item:currentAffairs:currentAffairsPdf:ca-july-2026",
    });

    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "item",
        module: "notes",
        itemType: "notesPdf",
      })
    ).toThrow("Item ID is required.");
  });

  test("BUNDLE requires stable bundle id and deduplicated item ids", () => {
    const target = normalizeAndValidateGrantTarget({
      scopeType: "bundle",
      planType: "PREMIUM",
      module: "notes",
      itemType: "notesPdf",
      itemId: "ignored",
      bundleId: "revision-pack",
      itemIds: [" note-2 ", "note-1", "note-2", ""],
      status: "active",
    });

    expect(target.module).toBe("notes");
    expect(target.itemType).toBeNull();
    expect(target.itemId).toBeNull();
    expect(target.itemIds).toEqual(["note-1", "note-2"]);
    expect(target.bundleId).toBe("revision-pack");
    expect(target.targetKey).toBe("bundle:revision-pack");

    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "bundle",
        bundleId: "empty-pack",
        itemIds: [],
      })
    ).toThrow("Bundle requires at least one item ID.");
  });

  test("fine-grained planType is commercial context, not target identity", () => {
    const basicItemKey = buildGrantKey({
      principalRef: "uid:user-1",
      course: "CTET_TET",
      scopeType: "item",
      planType: "BASIC",
      module: "video",
      itemType: "video",
      itemId: "video-1",
    });

    const premiumItemKey = buildGrantKey({
      principalRef: "uid:user-1",
      course: "CTET_TET",
      scopeType: "item",
      planType: "PREMIUM",
      module: "video",
      itemType: "video",
      itemId: "video-1",
    });

    expect(basicItemKey).toBe(premiumItemKey);
    expect(basicItemKey).toBe(
      "uid:user-1|CTET_TET|item|item:video:video:video-1"
    );
  });

  test("UID principal is preferred over email", () => {
    expect(
      buildGrantPrincipalRef({
        uid: " uid-123 ",
        email: "student@example.com",
      })
    ).toBe("uid:uid-123");
  });

  test("email principal is allowed only as a pending identity fallback", () => {
    expect(
      buildGrantPrincipalRef({
        uid: "   ",
        email: " Student@Example.com ",
      })
    ).toBe("email:student@example.com");

    expect(() =>
      buildGrantPrincipalRef({
        uid: "",
        email: "student@example.com",
        allowEmailPrincipal: false,
      })
    ).toThrow("Access record requires uid or email.");
  });

  test("blank UID never creates an empty uid principal", () => {
    const grant = normalizeAndValidateGrantInput({
      uid: " ",
      email: "student@example.com",
      scopeType: "plan",
      planType: "BASIC",
      status: "active",
      source: "admin_manual",
    });

    expect(grant.uid).toBeNull();
    expect(grant.principalRef).toBe("email:student@example.com");
    expect(grant.grantKey.startsWith("uid:|")).toBe(false);
  });

  test("same normalized input always creates the same grant key", () => {
    const first = normalizeAndValidateGrantInput({
      email: "STUDENT@example.com",
      course: "CTET/TET",
      scopeType: "ITEM",
      planType: "premium",
      module: "mock-test",
      itemType: "mock-test",
      itemId: " mock-1 ",
      status: "ACTIVE",
      source: "ADMIN_MANUAL",
    });

    const second = normalizeAndValidateGrantInput({
      email: "student@example.com",
      course: "ctet_tet",
      scopeType: "item",
      planType: "PREMIUM",
      module: "mockTest",
      itemType: "mockTest",
      itemId: "mock-1",
      status: "active",
      source: "admin_manual",
    });

    expect(first.grantKey).toBe(second.grantKey);
  });

  test("different target or scope creates a different grant key", () => {
    const itemOne = buildGrantKey({
      principalRef: "uid:user-1",
      course: "CTET_TET",
      scopeType: "item",
      planType: "PREMIUM",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
    });

    const itemTwo = buildGrantKey({
      principalRef: "uid:user-1",
      course: "CTET_TET",
      scopeType: "item",
      planType: "PREMIUM",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-2",
    });

    const moduleGrant = buildGrantKey({
      principalRef: "uid:user-1",
      course: "CTET_TET",
      scopeType: "module",
      planType: "PREMIUM",
      module: "notes",
    });

    expect(itemOne).not.toBe(itemTwo);
    expect(itemOne).not.toBe(moduleGrant);
  });

  test("invalid enums and dates fail closed", () => {
    expect(() => normalizeGrantPlanType("diamond")).toThrow(
      "Plan type is invalid."
    );
    expect(() => normalizeGrantScopeType("everything")).toThrow(
      "Access scope is invalid."
    );
    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "module",
        module: "unknown-module",
      })
    ).toThrow("Access module is invalid.");
    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "item",
        module: "notes",
        itemType: "unknown-item",
        itemId: "x",
      })
    ).toThrow("Access item type is invalid.");
    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "plan",
        planType: "PREMIUM",
        status: "approved",
      })
    ).toThrow("Access status is invalid.");
    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "plan",
        planType: "PREMIUM",
        accessFrom: "not-a-date",
      })
    ).toThrow("Access date is invalid.");
    expect(() =>
      normalizeAndValidateGrantTarget({
        scopeType: "plan",
        planType: "PREMIUM",
        accessFrom: "2027-01-01",
        accessUntil: "2026-01-01",
      })
    ).toThrow(
      "Access until date must be on or after access from date."
    );
  });

  test("grant and access-key status sets stay separate", () => {
    expect(
      normalizeAndValidateGrantTarget(
        {
          scopeType: "plan",
          planType: "PREMIUM",
          status: "pending",
        },
        { allowedStatuses: ACCESS_GRANT_STATUS_VALUES }
      ).status
    ).toBe("pending");

    expect(
      normalizeAndValidateGrantTarget(
        {
          scopeType: "plan",
          planType: "PREMIUM",
          status: "used",
        },
        { allowedStatuses: ACCESS_KEY_GRANT_STATUS_VALUES }
      ).status
    ).toBe("used");

    expect(() =>
      normalizeAndValidateGrantTarget(
        {
          scopeType: "plan",
          planType: "PREMIUM",
          status: "used",
        },
        { allowedStatuses: ACCESS_GRANT_STATUS_VALUES }
      )
    ).toThrow("Access status is invalid.");
  });

  test("normalizers remain stable for aliases and item list order", () => {
    expect(normalizeGrantPlanType("mentor")).toBe("MENTORSHIP");
    expect(normalizeGrantCourse("CTET / TET")).toBe("CTET_TET");
    expect(normalizeGrantItemIds(["b", "a", "b"])).toEqual(["a", "b"]);
    expect(
      buildGrantTargetKey({
        scopeType: "module",
        module: "current affairs",
      })
    ).toBe("module:currentAffairs");
  });
});
