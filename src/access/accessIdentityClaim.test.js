import {
  ACCESS_IDENTITY_CLAIM_BATCH_SIZE,
  ACCESS_IDENTITY_CLAIM_SOURCE,
  buildIdentityClaimAuditId,
  buildIdentityClaimBatches,
  buildPendingAccessIdentityClaimPlan,
  filterAccessRecordsForVerifiedPrincipal,
  isUidKeyedUserDocument,
} from "./accessIdentityClaim";

const future = "2030-01-01T00:00:00.000Z";

const planRecord = (overrides = {}) => ({
  id: "access-1",
  uid: null,
  email: "student@example.com",
  normalizedEmail: "student@example.com",
  status: "active",
  scopeType: "plan",
  planType: "PREMIUM",
  course: "CTET_TET",
  accessUntil: future,
  ...overrides,
});

describe("AspireNest verified identity claim", () => {
  test("builds a claim plan for unclaimed records", () => {
    const plan = buildPendingAccessIdentityClaimPlan(
      [planRecord()],
      {
        uid: "uid-1",
        email: "Student@Example.com",
        now: Date.parse("2026-07-15"),
      }
    );

    expect(plan.claimableCount).toBe(1);
    expect(plan.noOp).toBe(false);
    expect(plan.claimOperations[0]).toMatchObject({
      accessId: "access-1",
      entitlementId: "plan_PREMIUM",
    });
    expect(plan.claimOperations[0].after.uid).toBe(
      "uid-1"
    );
  });

  test("already claimed records produce a no-op", () => {
    const plan = buildPendingAccessIdentityClaimPlan(
      [planRecord({ uid: "uid-1" })],
      {
        uid: "uid-1",
        email: "student@example.com",
      }
    );

    expect(plan.claimableCount).toBe(0);
    expect(plan.alreadyClaimedCount).toBe(1);
    expect(plan.noOp).toBe(true);
  });

  test("conflicting uid fails closed", () => {
    expect(() =>
      buildPendingAccessIdentityClaimPlan(
        [planRecord({ uid: "uid-other" })],
        {
          uid: "uid-1",
          email: "student@example.com",
        }
      )
    ).toThrow(
      "Identity claim blocked because this email is already linked to another uid."
    );
  });

  test("another email is ignored", () => {
    const plan = buildPendingAccessIdentityClaimPlan(
      [
        planRecord({
          id: "other",
          email: "other@example.com",
          normalizedEmail: "other@example.com",
        }),
      ],
      {
        uid: "uid-1",
        email: "student@example.com",
      }
    );

    expect(plan.noOp).toBe(true);
    expect(plan.projectedRecords).toEqual([]);
  });

  test("expired claim has no entitlement write", () => {
    const plan = buildPendingAccessIdentityClaimPlan(
      [
        planRecord({
          accessUntil: "2020-01-01T00:00:00.000Z",
        }),
      ],
      {
        uid: "uid-1",
        email: "student@example.com",
        now: Date.parse("2026-07-15"),
      }
    );

    expect(
      plan.claimOperations[0].entitlementId
    ).toBeNull();
  });

  test("blocked claim has no entitlement write", () => {
    const plan = buildPendingAccessIdentityClaimPlan(
      [planRecord({ status: "blocked" })],
      {
        uid: "uid-1",
        email: "student@example.com",
      }
    );

    expect(
      plan.claimOperations[0].entitlementId
    ).toBeNull();
  });

  test("audit id is deterministic", () => {
    const first = buildIdentityClaimAuditId({
      accessId: "access-1",
      uid: "uid-1",
      email: "Student@Example.com",
    });
    const second = buildIdentityClaimAuditId({
      accessId: "access-1",
      uid: "uid-1",
      email: "student@example.com",
    });

    expect(first).toBe(second);
    expect(first.startsWith("identity_claim_")).toBe(
      true
    );
  });

  test("audit id requires complete identity", () => {
    expect(() =>
      buildIdentityClaimAuditId({
        accessId: "access-1",
        uid: "",
        email: "student@example.com",
      })
    ).toThrow(
      "Identity claim audit requires access id, uid and email."
    );
  });

  test("claim batches prioritize effective entitlement winners", () => {
    const batches = buildIdentityClaimBatches(
      [
        { accessId: "access-low" },
        { accessId: "access-winner" },
      ],
      {
        preferredAccessIds: ["access-winner"],
        batchSize: 1,
      }
    );

    expect(batches).toEqual([
      [{ accessId: "access-winner" }],
      [{ accessId: "access-low" }],
    ]);
  });

  test("claim operations are split into Rules-safe batches", () => {
    const operations = Array.from(
      { length: 9 },
      (_, index) => ({
        accessId: `access-${index + 1}`,
      })
    );
    const batches = buildIdentityClaimBatches(
      operations
    );

    expect(ACCESS_IDENTITY_CLAIM_BATCH_SIZE).toBe(4);
    expect(batches.map((batch) => batch.length)).toEqual([
      4,
      4,
      1,
    ]);
  });

  test("claim batch size above the Rules budget fails closed", () => {
    expect(() =>
      buildIdentityClaimBatches(
        [{ accessId: "access-1" }],
        { batchSize: 5 }
      )
    ).toThrow(
      "Identity claim batch size exceeds the Firestore Rules safety limit."
    );
  });

  test("filter keeps own uid records", () => {
    const result =
      filterAccessRecordsForVerifiedPrincipal(
        [
          planRecord({ uid: "uid-1" }),
          planRecord({ id: "other", uid: "uid-2" }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
        }
      );

    expect(result.map((record) => record.id)).toEqual([
      "access-1",
    ]);
  });

  test("filter keeps matching unclaimed records", () => {
    const result =
      filterAccessRecordsForVerifiedPrincipal(
        [planRecord()],
        {
          uid: "uid-1",
          email: "student@example.com",
        }
      );

    expect(result).toHaveLength(1);
  });

  test("filter rejects unclaimed records for another email", () => {
    const result =
      filterAccessRecordsForVerifiedPrincipal(
        [
          planRecord({
            email: "other@example.com",
            normalizedEmail: "other@example.com",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
        }
      );

    expect(result).toEqual([]);
  });

  test("UID-keyed user document rejects email keys", () => {
    expect(
      isUidKeyedUserDocument({
        documentId: "student@example.com",
        uid: "uid-1",
      })
    ).toBe(false);
  });

  test("UID-keyed user document requires exact uid", () => {
    expect(
      isUidKeyedUserDocument({
        documentId: "uid-1",
        uid: "uid-1",
      })
    ).toBe(true);
    expect(
      isUidKeyedUserDocument({
        documentId: "uid-2",
        uid: "uid-1",
      })
    ).toBe(false);
  });

  test("claim source is stable", () => {
    expect(ACCESS_IDENTITY_CLAIM_SOURCE).toBe(
      "verified_uid_claim"
    );
  });

  test("safe claim limit fails closed", () => {
    const records = Array.from(
      { length: 3 },
      (_, index) =>
        planRecord({ id: `access-${index}` })
    );

    expect(() =>
      buildPendingAccessIdentityClaimPlan(records, {
        uid: "uid-1",
        email: "student@example.com",
        maxClaimRecords: 2,
      })
    ).toThrow(
      "Identity claim exceeds the safe record limit."
    );
  });
});
