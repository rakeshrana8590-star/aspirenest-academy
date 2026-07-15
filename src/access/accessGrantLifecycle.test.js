import {
  buildDeterministicGrantDocumentId,
  buildGrantFamilyKey,
  buildIdempotentGrantResolution,
  assertGrantCandidateIdentitySafe,
  findGrantCandidates,
  isGrantCandidate,
  resolvePlanChange,
  selectCanonicalGrantCandidate,
} from "./accessGrantLifecycle";
import {
  normalizeAndValidateGrantInput,
} from "./accessGrantContract";

const buildGrant = (overrides = {}) =>
  normalizeAndValidateGrantInput({
    email: "student@example.com",
    uid: "uid-1",
    course: "CTET_TET",
    scopeType: "plan",
    planType: "PREMIUM",
    status: "active",
    source: "admin_manual",
    accessFrom: "2026-01-01",
    accessUntil: "2027-01-01",
    ...overrides,
  });

describe("AspireNest idempotent grant lifecycle", () => {
  test("PLAN family key stays stable across plan tiers", () => {
    const premium = buildGrant({
      planType: "PREMIUM",
    });
    const mentorship = buildGrant({
      planType: "MENTORSHIP",
    });

    expect(buildGrantFamilyKey(premium)).toBe(
      buildGrantFamilyKey(mentorship)
    );
    expect(buildGrantFamilyKey(premium)).toBe(
      "uid:uid-1|CTET_TET|plan|plan-family"
    );
  });

  test("fine-grained family key remains the exact grant key", () => {
    const itemGrant = buildGrant({
      scopeType: "item",
      planType: "PREMIUM",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
    });

    expect(buildGrantFamilyKey(itemGrant)).toBe(
      itemGrant.grantKey
    );
  });

  test("deterministic document id is stable and Firestore-safe", () => {
    const key =
      "uid:uid-1|CTET_TET|plan|plan-family";
    const first =
      buildDeterministicGrantDocumentId(key);
    const second =
      buildDeterministicGrantDocumentId(key);

    expect(first).toBe(second);
    expect(first.startsWith("grant_")).toBe(true);
    expect(first.includes("/")).toBe(false);
    expect(first.length).toBeLessThan(120);
  });

  test("same UID is the strongest principal match", () => {
    const grant = buildGrant();
    const records = [
      {
        id: "email-only",
        email: "student@example.com",
        normalizedEmail: "student@example.com",
        uid: "",
        course: "CTET_TET",
        scopeType: "plan",
        planType: "PREMIUM",
        status: "active",
      },
      {
        id: "uid-match",
        email: "student@example.com",
        normalizedEmail: "student@example.com",
        uid: "uid-1",
        course: "CTET_TET",
        scopeType: "plan",
        planType: "BASIC",
        status: "pending",
      },
    ];

    expect(
      selectCanonicalGrantCandidate(
        records,
        grant,
        { planFamily: true }
      ).id
    ).toBe("uid-match");
  });

  test("email-only write stops when multiple learner UIDs are candidates", () => {
    const grant = buildGrant({
      uid: "",
    });
    const candidates = [
      {
        id: "first",
        uid: "uid-a",
        email: "student@example.com",
        normalizedEmail: "student@example.com",
        course: "CTET_TET",
        scopeType: "plan",
        planType: "PREMIUM",
        status: "active",
      },
      {
        id: "second",
        uid: "uid-b",
        email: "student@example.com",
        normalizedEmail: "student@example.com",
        course: "CTET_TET",
        scopeType: "plan",
        planType: "BASIC",
        status: "active",
      },
    ];

    expect(() =>
      assertGrantCandidateIdentitySafe(
        candidates,
        grant
      )
    ).toThrow(
      "Multiple learner UIDs match this email. Select a UID before writing access."
    );
  });

  test("explicit UID write rejects another UID linked to the same identity set", () => {
    const grant = buildGrant({ uid: "uid-1" });

    expect(() =>
      assertGrantCandidateIdentitySafe(
        [
          {
            id: "conflict",
            uid: "uid-2",
            email: "student@example.com",
            normalizedEmail: "student@example.com",
          },
        ],
        grant
      )
    ).toThrow(
      "Access identity conflicts with another learner UID."
    );
  });

  test("different nonblank UID never matches by email", () => {
    const grant = buildGrant();
    const wrongUid = {
      id: "wrong",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      uid: "uid-old",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "PREMIUM",
      status: "active",
    };

    expect(
      isGrantCandidate(
        wrongUid,
        grant,
        { planFamily: true }
      )
    ).toBe(false);
  });

  test("blank-UID legacy record can be claimed by matching email", () => {
    const grant = buildGrant();
    const pending = {
      id: "pending",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      uid: "",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "BASIC",
      status: "pending",
    };

    expect(
      isGrantCandidate(
        pending,
        grant,
        { planFamily: true }
      )
    ).toBe(true);

    const resolution =
      buildIdempotentGrantResolution({
        existingRecord: pending,
        incomingGrant: grant,
      });

    expect(resolution.uid).toBe("uid-1");
    expect(resolution.principalRef).toBe(
      "uid:uid-1"
    );
  });

  test("PLAN family candidate can match another plan tier", () => {
    const grant = buildGrant({
      planType: "MENTORSHIP",
    });
    const existing = {
      id: "premium",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "PREMIUM",
      status: "active",
    };

    expect(
      isGrantCandidate(
        existing,
        grant,
        { planFamily: true }
      )
    ).toBe(true);
  });

  test("ITEM candidate requires the exact target", () => {
    const grant = buildGrant({
      scopeType: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
    });
    const same = {
      id: "same",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "item",
      planType: "BASIC",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
      status: "active",
    };
    const different = {
      ...same,
      id: "different",
      itemId: "note-2",
    };

    expect(isGrantCandidate(same, grant)).toBe(true);
    expect(
      isGrantCandidate(different, grant)
    ).toBe(false);
  });

  test("candidate ordering prefers active record after identity", () => {
    const grant = buildGrant({
      uid: "",
    });
    const records = [
      {
        id: "blocked",
        uid: "",
        email: "student@example.com",
        normalizedEmail: "student@example.com",
        course: "CTET_TET",
        scopeType: "plan",
        planType: "PREMIUM",
        status: "blocked",
      },
      {
        id: "active",
        uid: "",
        email: "student@example.com",
        normalizedEmail: "student@example.com",
        course: "CTET_TET",
        scopeType: "plan",
        planType: "BASIC",
        status: "active",
      },
    ];

    expect(
      findGrantCandidates(
        records,
        grant,
        { planFamily: true }
      ).map((record) => record.id)
    ).toEqual(["active", "blocked"]);
  });

  test("PLAN resolution preserves a higher existing plan", () => {
    const grant = buildGrant({
      planType: "PREMIUM",
    });
    const existing = {
      id: "mentor",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "MENTORSHIP",
      status: "active",
      grantRevision: 3,
      accessUntil: "2027-06-01",
    };

    const resolution =
      buildIdempotentGrantResolution({
        existingRecord: existing,
        incomingGrant: grant,
      });

    expect(resolution.planType).toBe(
      "MENTORSHIP"
    );
    expect(resolution.preservedHigherPlan).toBe(
      true
    );
    expect(resolution.grantRevision).toBe(4);
  });

  test("fine-grained grant uses incoming commercial plan context", () => {
    const grant = buildGrant({
      scopeType: "item",
      planType: "BASIC",
      module: "video",
      itemType: "video",
      itemId: "video-1",
    });
    const existing = {
      id: "item",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "item",
      planType: "MENTORSHIP",
      module: "video",
      itemType: "video",
      itemId: "video-1",
      status: "active",
    };

    const resolution =
      buildIdempotentGrantResolution({
        existingRecord: existing,
        incomingGrant: grant,
      });

    expect(resolution.planType).toBe("BASIC");
    expect(resolution.preservedHigherPlan).toBe(
      false
    );
  });

  test("resolution preserves the longer validity", () => {
    const grant = buildGrant({
      accessUntil: "2027-01-01",
    });
    const existing = {
      id: "longer",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "PREMIUM",
      status: "active",
      accessUntil: "2028-01-01",
    };

    const resolution =
      buildIdempotentGrantResolution({
        existingRecord: existing,
        incomingGrant: grant,
      });

    expect(resolution.accessUntil).toBe(
      "2028-01-01"
    );
    expect(
      resolution.preservedLongerValidity
    ).toBe(true);
  });

  test("blocked grant cannot reactivate silently", () => {
    const grant = buildGrant();
    const existing = {
      id: "blocked",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "PREMIUM",
      status: "blocked",
    };

    expect(() =>
      buildIdempotentGrantResolution({
        existingRecord: existing,
        incomingGrant: grant,
      })
    ).toThrow(
      "Existing grant is blocked or revoked. Use explicit reactivation."
    );
  });

  test("blocked reactivation requires and records a reason", () => {
    const grant = buildGrant();
    const existing = {
      id: "blocked",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "PREMIUM",
      status: "blocked",
    };

    expect(() =>
      buildIdempotentGrantResolution({
        existingRecord: existing,
        incomingGrant: grant,
        allowReactivation: true,
      })
    ).toThrow(
      "Reactivation reason is required for a blocked or revoked grant."
    );

    const resolution =
      buildIdempotentGrantResolution({
        existingRecord: existing,
        incomingGrant: grant,
        allowReactivation: true,
        reactivationReason: "New verified payment",
      });

    expect(resolution.reactivated).toBe(true);
    expect(resolution.reactivationReason).toBe(
      "New verified payment"
    );
  });

  test("plan change rejects non-PLAN records", () => {
    expect(() =>
      resolvePlanChange({
        record: {
          uid: "uid-1",
          email: "student@example.com",
          course: "CTET_TET",
          scopeType: "item",
          planType: "PREMIUM",
          module: "notes",
          itemType: "notesPdf",
          itemId: "note-1",
        },
        requestedPlanType: "MENTORSHIP",
      })
    ).toThrow(
      "Plan change is allowed only for PLAN access records."
    );
  });

  test("plan downgrade needs explicit approval and reason", () => {
    const record = {
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "MENTORSHIP",
      grantRevision: 2,
    };

    expect(() =>
      resolvePlanChange({
        record,
        requestedPlanType: "PREMIUM",
      })
    ).toThrow(
      "Plan downgrade requires explicit approval."
    );

    expect(() =>
      resolvePlanChange({
        record,
        requestedPlanType: "PREMIUM",
        allowDowngrade: true,
      })
    ).toThrow(
      "Plan downgrade reason is required."
    );

    const resolution = resolvePlanChange({
      record,
      requestedPlanType: "PREMIUM",
      allowDowngrade: true,
      reason: "Founder-approved correction",
    });

    expect(resolution.isDowngrade).toBe(true);
    expect(resolution.planType).toBe("PREMIUM");
    expect(resolution.grantRevision).toBe(3);
  });

  test("plan upgrade produces new grant key but stable family key", () => {
    const record = {
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "BASIC",
      grantRevision: 1,
    };

    const resolution = resolvePlanChange({
      record,
      requestedPlanType: "PREMIUM",
    });

    expect(resolution.isDowngrade).toBe(false);
    expect(resolution.grantKey).toContain(
      "plan:PREMIUM"
    );
    expect(resolution.grantFamilyKey).toBe(
      "uid:uid-1|CTET_TET|plan|plan-family"
    );
  });
});
