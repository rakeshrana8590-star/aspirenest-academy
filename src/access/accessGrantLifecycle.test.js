import {
  buildDeterministicGrantDocumentId,
  buildGrantFamilyKey,
  buildIdempotentGrantResolution,
  assertGrantCandidateIdentitySafe,
  findGrantCandidates,
  isGrantCandidate,
  resolvePlanChange,
  selectCanonicalGrantCandidate,
  requireGrantLifecycleReason,
  isBlockedOrRevokedGrant,
  assertGrantMayMutateWithoutRestore,
  resolveGrantRestore,
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


  test("custom plan upgrade uses accessRank and keeps the plan family stable", () => {
    const existingRecord = {
      id: "grant-1",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "BASIC",
      planCode: "BASIC",
      accessRank: 100,
      status: "active",
      accessFrom: "2026-01-01",
      accessUntil: "2027-01-01",
      purchaseTermsSnapshot: {
        productId: "plan_basic",
        planCode: "BASIC",
        accessRank: 100,
        priceINR: 499,
        priceVersion: 1,
      },
    };
    const incomingGrant = buildGrant({
      planType: "CTET_CRASH_45",
      planCode: "CTET_CRASH_45",
      accessRank: 150,
      productId: "plan_ctet_crash_45",
      purchaseTermsSnapshot: {
        productId: "plan_ctet_crash_45",
        planCode: "CTET_CRASH_45",
        accessRank: 150,
        priceINR: 799,
        priceVersion: 2,
      },
    });
    const resolution =
      buildIdempotentGrantResolution({
        existingRecord,
        incomingGrant,
      });

    expect(resolution).toMatchObject({
      planType: "CTET_CRASH_45",
      planCode: "CTET_CRASH_45",
      accessRank: 150,
      productId: "plan_ctet_crash_45",
      preservedHigherPlan: false,
      grantFamilyKey:
        "uid:uid-1|CTET_TET|plan|plan-family",
    });
    expect(
      resolution.purchaseTermsSnapshot
    ).toMatchObject({
      priceINR: 799,
      priceVersion: 2,
    });
  });

  test("higher existing dynamic plan and its terms are preserved", () => {
    const existingRecord = {
      id: "grant-1",
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "CTET_MEGA",
      planCode: "CTET_MEGA",
      accessRank: 250,
      productId: "plan_ctet_mega",
      status: "active",
      accessUntil: null,
      purchaseTermsSnapshot: {
        productId: "plan_ctet_mega",
        planCode: "CTET_MEGA",
        accessRank: 250,
        priceINR: 1999,
        priceVersion: 1,
      },
    };
    const incomingGrant = buildGrant({
      planType: "PREMIUM",
      accessRank: 200,
      productId: "plan_premium",
      purchaseTermsSnapshot: {
        productId: "plan_premium",
        planCode: "PREMIUM",
        accessRank: 200,
        priceINR: 1499,
        priceVersion: 4,
      },
    });
    const resolution =
      buildIdempotentGrantResolution({
        existingRecord,
        incomingGrant,
      });

    expect(resolution).toMatchObject({
      planType: "CTET_MEGA",
      planCode: "CTET_MEGA",
      accessRank: 250,
      productId: "plan_ctet_mega",
      preservedHigherPlan: true,
    });
    expect(
      resolution.purchaseTermsSnapshot
    ).toMatchObject({
      productId: "plan_ctet_mega",
      priceINR: 1999,
      priceVersion: 1,
    });
  });

  test("custom plan change requires explicit rank and detects downgrade", () => {
    const record = {
      uid: "uid-1",
      email: "student@example.com",
      normalizedEmail: "student@example.com",
      course: "CTET_TET",
      scopeType: "plan",
      planType: "PREMIUM",
      planCode: "PREMIUM",
      accessRank: 200,
      productId: "plan_premium",
      grantRevision: 3,
    };

    expect(() =>
      resolvePlanChange({
        record,
        requestedPlanCode: "CTET_CRASH_45",
      })
    ).toThrow(
      "Custom plan change requires an explicit access rank."
    );

    const resolution = resolvePlanChange({
      record,
      requestedPlanCode: "CTET_CRASH_45",
      requestedAccessRank: 150,
      requestedProductId: "plan_ctet_crash_45",
      allowDowngrade: true,
      reason: "Founder-approved catalog move",
    });

    expect(resolution).toMatchObject({
      currentPlanCode: "PREMIUM",
      planCode: "CTET_CRASH_45",
      planType: "CTET_CRASH_45",
      accessRank: 150,
      productId: "plan_ctet_crash_45",
      isDowngrade: true,
      grantRevision: 4,
    });
  });


  test("restore requires blocked/revoked state and a reason", () => {
    expect(() =>
      resolveGrantRestore({
        record: { id: "grant-1", status: "active" },
        reason: "Approved correction",
      })
    ).toThrow(
      "Only a blocked or revoked access record can be restored."
    );

    expect(() =>
      resolveGrantRestore({
        record: { id: "grant-1", status: "blocked" },
      })
    ).toThrow("Restore access reason is required.");

    expect(
      resolveGrantRestore({
        record: {
          id: "grant-1",
          status: "revoked",
          grantRevision: 4,
        },
        reason: "Admin reviewed exact scope",
      })
    ).toEqual({
      status: "active",
      restorationReason: "Admin reviewed exact scope",
      grantRevision: 5,
    });
  });

  test("normal lifecycle writes cannot silently reactivate blocked grants", () => {
    expect(isBlockedOrRevokedGrant({ status: "blocked" })).toBe(true);
    expect(isBlockedOrRevokedGrant({ status: "revoked" })).toBe(true);
    expect(isBlockedOrRevokedGrant({ status: "expired" })).toBe(false);
    expect(() =>
      assertGrantMayMutateWithoutRestore(
        { status: "blocked" },
        "Extend access"
      )
    ).toThrow(
      "Extend access cannot reactivate a blocked or revoked grant. Use restoreAccess with a reason."
    );
  });

  test("grant lifecycle reason helper fails closed", () => {
    expect(requireGrantLifecycleReason(" verified ", "Revoke access")).toBe(
      "verified"
    );
    expect(() => requireGrantLifecycleReason("", "Revoke access")).toThrow(
      "Revoke access reason is required."
    );
  });

});
