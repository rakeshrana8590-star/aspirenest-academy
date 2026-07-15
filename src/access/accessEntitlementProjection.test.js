import {
  ACCESS_PLAN_ENTITLEMENT_IDS,
  buildEffectiveEntitlementProjection,
  buildStudentEntitlementId,
  isEntitlementProjectionCandidateActive,
  recordMatchesEntitlementPrincipal,
  selectEffectiveEntitlementRecord,
} from "./accessEntitlementProjection";

const NOW = new Date("2026-07-15T10:00:00.000Z").getTime();

const planGrant = ({
  id,
  uid = "uid-1",
  email = "student@example.com",
  planType = "PREMIUM",
  status = "active",
  accessFrom = "2026-01-01T00:00:00.000Z",
  accessUntil = "2027-01-01T00:00:00.000Z",
  updatedAt = "2026-07-01T00:00:00.000Z",
} = {}) => ({
  id,
  uid,
  email,
  normalizedEmail: email,
  course: "CTET_TET",
  scopeType: "plan",
  planType,
  status,
  accessFrom,
  accessUntil,
  updatedAt,
  source: "admin_manual",
});

const itemGrant = ({
  id,
  uid = "uid-1",
  email = "student@example.com",
  planType = "PREMIUM",
  status = "active",
  module = "notes",
  itemType = "notesPdf",
  itemId = "note-1",
  accessFrom = "2026-01-01T00:00:00.000Z",
  accessUntil = "2027-01-01T00:00:00.000Z",
  updatedAt = "2026-07-01T00:00:00.000Z",
} = {}) => ({
  id,
  uid,
  email,
  normalizedEmail: email,
  course: "CTET_TET",
  scopeType: "item",
  planType,
  module,
  itemType,
  itemId,
  status,
  accessFrom,
  accessUntil,
  updatedAt,
  source: "admin_manual",
});

describe("AspireNest effective entitlement projection", () => {
  test("entitlement ids stay compatible with existing rules", () => {
    expect(
      buildStudentEntitlementId(
        planGrant({
          id: "plan",
          planType: "MENTORSHIP",
        })
      )
    ).toBe("plan_MENTORSHIP");

    expect(
      buildStudentEntitlementId({
        scopeType: "module",
        module: "mockTest",
      })
    ).toBe("module_mockTest");

    expect(
      buildStudentEntitlementId(
        itemGrant({ id: "item" })
      )
    ).toBe("item_notes_notesPdf_note-1");

    expect(
      buildStudentEntitlementId({
        scopeType: "bundle",
        bundleId: "revision pack",
      })
    ).toBe("bundle_revision_pack");
  });

  test("all plan entitlement ids are known stale-cleanup targets", () => {
    expect(ACCESS_PLAN_ENTITLEMENT_IDS).toEqual([
      "plan_FREE",
      "plan_BASIC",
      "plan_PREMIUM",
      "plan_MENTORSHIP",
    ]);
  });

  test("UID-linked records match the exact learner only", () => {
    expect(
      recordMatchesEntitlementPrincipal(
        { uid: "uid-1", email: "same@example.com" },
        { uid: "uid-1", email: "same@example.com" }
      )
    ).toBe(true);

    expect(
      recordMatchesEntitlementPrincipal(
        { uid: "uid-2", email: "same@example.com" },
        { uid: "uid-1", email: "same@example.com" }
      )
    ).toBe(false);
  });

  test("unclaimed email record can contribute after UID claim", () => {
    expect(
      recordMatchesEntitlementPrincipal(
        { uid: "", email: "STUDENT@example.com" },
        { uid: "uid-1", email: "student@example.com" }
      )
    ).toBe(true);
  });

  test("projection cannot be created without authoritative UID", () => {
    expect(() =>
      buildEffectiveEntitlementProjection([], {
        email: "student@example.com",
        now: NOW,
      })
    ).toThrow(
      "Effective entitlement projection requires uid."
    );
  });

  test("active record inside date window is eligible", () => {
    expect(
      isEntitlementProjectionCandidateActive(
        planGrant({ id: "active" }),
        { now: NOW }
      )
    ).toBe(true);
  });

  test("future record is not effective yet", () => {
    expect(
      isEntitlementProjectionCandidateActive(
        planGrant({
          id: "future",
          accessFrom: "2026-08-01T00:00:00.000Z",
        }),
        { now: NOW }
      )
    ).toBe(false);
  });

  test("expired record is not effective", () => {
    expect(
      isEntitlementProjectionCandidateActive(
        planGrant({
          id: "expired",
          accessUntil: "2026-07-01T00:00:00.000Z",
        }),
        { now: NOW }
      )
    ).toBe(false);
  });

  test("blocked and pending records are not effective", () => {
    expect(
      isEntitlementProjectionCandidateActive(
        planGrant({
          id: "blocked",
          status: "blocked",
        }),
        { now: NOW }
      )
    ).toBe(false);

    expect(
      isEntitlementProjectionCandidateActive(
        planGrant({
          id: "pending",
          status: "pending",
        }),
        { now: NOW }
      )
    ).toBe(false);
  });

  test("invalid dates fail closed", () => {
    expect(
      isEntitlementProjectionCandidateActive(
        planGrant({
          id: "invalid",
          accessUntil: "not-a-date",
        }),
        { now: NOW }
      )
    ).toBe(false);
  });

  test("highest active plan wins overlapping plan grants", () => {
    const projection =
      buildEffectiveEntitlementProjection(
        [
          planGrant({
            id: "premium",
            planType: "PREMIUM",
          }),
          planGrant({
            id: "mentorship",
            planType: "MENTORSHIP",
            accessUntil: "2026-09-01T00:00:00.000Z",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
          now: NOW,
        }
      );

    expect(projection.effectivePlanType).toBe(
      "MENTORSHIP"
    );
    expect(projection.effectivePlanAccessId).toBe(
      "mentorship"
    );
    expect(
      projection.desiredEntitlements.map(
        (item) => item.id
      )
    ).toContain("plan_MENTORSHIP");
    expect(
      projection.staleEntitlementIds
    ).toEqual(
      expect.arrayContaining([
        "plan_FREE",
        "plan_BASIC",
        "plan_PREMIUM",
      ])
    );
  });

  test("expired higher plan does not suppress active lower plan", () => {
    const projection =
      buildEffectiveEntitlementProjection(
        [
          planGrant({
            id: "premium",
            planType: "PREMIUM",
          }),
          planGrant({
            id: "mentorship-expired",
            planType: "MENTORSHIP",
            accessUntil: "2026-07-01T00:00:00.000Z",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
          now: NOW,
        }
      );

    expect(projection.effectivePlanType).toBe(
      "PREMIUM"
    );
    expect(projection.effectivePlanAccessId).toBe(
      "premium"
    );
  });

  test("revoking higher plan preserves another valid plan", () => {
    const projection =
      buildEffectiveEntitlementProjection(
        [
          planGrant({
            id: "premium",
            planType: "PREMIUM",
          }),
          planGrant({
            id: "mentorship-revoked",
            planType: "MENTORSHIP",
            status: "blocked",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
          now: NOW,
        }
      );

    expect(
      projection.desiredEntitlements
    ).toHaveLength(1);
    expect(
      projection.desiredEntitlements[0].id
    ).toBe("plan_PREMIUM");
    expect(
      projection.desiredEntitlements[0]
        .effectiveRecord.id
    ).toBe("premium");
  });

  test("same item keeps effective access when one duplicate is revoked", () => {
    const projection =
      buildEffectiveEntitlementProjection(
        [
          itemGrant({
            id: "item-revoked",
            status: "blocked",
            accessUntil: "2028-01-01T00:00:00.000Z",
          }),
          itemGrant({
            id: "item-active",
            accessUntil: "2027-01-01T00:00:00.000Z",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
          now: NOW,
        }
      );

    const itemProjection =
      projection.desiredEntitlements.find(
        (item) =>
          item.id ===
          "item_notes_notesPdf_note-1"
      );

    expect(itemProjection).toBeTruthy();
    expect(
      itemProjection.effectiveRecord.id
    ).toBe("item-active");
    expect(
      itemProjection.contributorAccessIds
    ).toEqual(["item-active"]);
  });

  test("same target chooses highest plan and then longest validity", () => {
    const winner =
      selectEffectiveEntitlementRecord(
        [
          itemGrant({
            id: "basic-long",
            planType: "BASIC",
            accessUntil: "2028-01-01T00:00:00.000Z",
          }),
          itemGrant({
            id: "premium-short",
            planType: "PREMIUM",
            accessUntil: "2026-12-01T00:00:00.000Z",
          }),
          itemGrant({
            id: "premium-long",
            planType: "PREMIUM",
            accessUntil: "2027-12-01T00:00:00.000Z",
          }),
        ],
        { now: NOW }
      );

    expect(winner.id).toBe("premium-long");
  });

  test("indefinite grant outranks dated grant at same plan", () => {
    const winner =
      selectEffectiveEntitlementRecord(
        [
          itemGrant({
            id: "dated",
            accessUntil: "2030-01-01T00:00:00.000Z",
          }),
          itemGrant({
            id: "indefinite",
            accessUntil: null,
          }),
        ],
        { now: NOW }
      );

    expect(winner.id).toBe("indefinite");
  });

  test("inactive-only target becomes stale and is not projected", () => {
    const projection =
      buildEffectiveEntitlementProjection(
        [
          itemGrant({
            id: "blocked-item",
            status: "blocked",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
          now: NOW,
        }
      );

    expect(
      projection.desiredEntitlements.find(
        (item) =>
          item.id ===
          "item_notes_notesPdf_note-1"
      )
    ).toBeUndefined();
    expect(
      projection.staleEntitlementIds
    ).toContain(
      "item_notes_notesPdf_note-1"
    );
  });

  test("another UID sharing the email cannot affect projection", () => {
    const projection =
      buildEffectiveEntitlementProjection(
        [
          planGrant({
            id: "uid-1-premium",
            uid: "uid-1",
            planType: "PREMIUM",
          }),
          planGrant({
            id: "uid-2-mentorship",
            uid: "uid-2",
            planType: "MENTORSHIP",
          }),
        ],
        {
          uid: "uid-1",
          email: "student@example.com",
          now: NOW,
        }
      );

    expect(projection.effectivePlanType).toBe(
      "PREMIUM"
    );
    expect(
      projection.evaluatedAccessIds
    ).toEqual(["uid-1-premium"]);
  });

  test("tie resolution is deterministic by record id", () => {
    const first =
      selectEffectiveEntitlementRecord(
        [
          itemGrant({ id: "z-record" }),
          itemGrant({ id: "a-record" }),
        ],
        { now: NOW }
      );

    const second =
      selectEffectiveEntitlementRecord(
        [
          itemGrant({ id: "a-record" }),
          itemGrant({ id: "z-record" }),
        ],
        { now: NOW }
      );

    expect(first.id).toBe("a-record");
    expect(second.id).toBe("a-record");
  });
});
