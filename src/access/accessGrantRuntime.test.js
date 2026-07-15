import {
  addGrantValidityDays,
  buildRuntimeEntitlementRecord,
  buildRuntimeGrantRecord,
  resolveAccessKeyGrantTerms,
} from "./accessGrantRuntime";

import {
  ACCESS_PLAN_VALIDITY_MODES,
} from "./accessPlanCatalog";

describe("AspireNest dynamic plan grant runtime", () => {
  test("custom grant record preserves plan code, rank, product and terms", () => {
    const record =
      buildRuntimeGrantRecord({
        email:
          "Student@Example.com",
        planCode:
          "CTET_CRASH_45",
        accessRank: 150,
        productId:
          "plan_ctet_crash_45",
        purchaseTermsSnapshot: {
          productId:
            "plan_ctet_crash_45",
          planCode:
            "CTET_CRASH_45",
          accessRank: 150,
          priceINR: 799,
          priceVersion: 2,
        },
        scopeType: "plan",
        status: "active",
        source: "admin_manual",
        noExpiry: true,
      });

    expect(record).toMatchObject({
      normalizedEmail:
        "student@example.com",
      planType:
        "CTET_CRASH_45",
      planCode:
        "CTET_CRASH_45",
      accessRank: 150,
      productId:
        "plan_ctet_crash_45",
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY,
      noExpiry: true,
    });
    expect(
      record.purchaseTermsSnapshot
        .priceVersion
    ).toBe(2);
  });

  test("custom grant without access rank fails closed", () => {
    expect(() =>
      buildRuntimeGrantRecord({
        email:
          "student@example.com",
        planCode:
          "CTET_CRASH_45",
        scopeType: "plan",
        status: "active",
        noExpiry: true,
      })
    ).toThrow(
      "Custom plan requires an explicit access rank."
    );
  });

  test("entitlement runtime preserves dynamic plan descriptor", () => {
    const record =
      buildRuntimeEntitlementRecord(
        {
          id: "access-1",
          uid: "uid-1",
          email:
            "student@example.com",
          planCode:
            "CTET_CRASH_45",
          planType:
            "CTET_CRASH_45",
          accessRank: 150,
          productId:
            "plan_ctet_crash_45",
          scopeType: "plan",
          status: "active",
          source:
            "admin_manual",
          noExpiry: true,
          purchaseTermsSnapshot: {
            productId:
              "plan_ctet_crash_45",
            planCode:
              "CTET_CRASH_45",
            accessRank: 150,
            priceVersion: 3,
          },
        }
      );

    expect(record).toMatchObject({
      uid: "uid-1",
      accessId: "access-1",
      planType:
        "CTET_CRASH_45",
      planCode:
        "CTET_CRASH_45",
      accessRank: 150,
      productId:
        "plan_ctet_crash_45",
      priceVersion: 3,
      noExpiry: true,
    });
  });

  test("validity days calculate a deterministic access-until date", () => {
    expect(
      addGrantValidityDays({
        accessFrom:
          "2026-07-15",
        validityDays: 30,
      })
    ).toBe("2026-08-14");
  });

  test("linked custom product overrides legacy key plan and snapshots price", () => {
    const terms =
      resolveAccessKeyGrantTerms({
        keyRecord: {
          id: "KEY-ONE",
          productId:
            "plan_ctet_crash_45",
          planType: "PREMIUM",
          validityDays: 30,
        },
        productRecord: {
          id:
            "plan_ctet_crash_45",
          productId:
            "plan_ctet_crash_45",
          scopeType: "plan",
          title:
            "CTET Crash 45",
          planCode:
            "CTET_CRASH_45",
          planType:
            "CTET_CRASH_45",
          accessRank: 150,
          course: "CTET_TET",
          status: "active",
          isActive: true,
          priceINR: 799,
          compareAtPriceINR: 999,
          currency: "INR",
          priceVersion: 4,
          validityMode:
            "ADMIN_DEFINED",
        },
        now:
          new Date(
            "2026-07-15T00:00:00.000Z"
          ),
      });

    expect(terms).toMatchObject({
      planType:
        "CTET_CRASH_45",
      planCode:
        "CTET_CRASH_45",
      accessRank: 150,
      productId:
        "plan_ctet_crash_45",
      accessFrom:
        "2026-07-15",
      accessUntil:
        "2026-08-14",
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW,
    });
    expect(
      terms.purchaseTermsSnapshot
        .priceVersion
    ).toBe(4);
  });

  test("linked product may use an admin-configured default validity", () => {
    const terms =
      resolveAccessKeyGrantTerms({
        keyRecord: {
          id: "KEY-TWO",
          productId:
            "plan_premium",
        },
        productRecord: {
          id: "plan_premium",
          productId:
            "plan_premium",
          scopeType: "plan",
          title: "Premium",
          planCode: "PREMIUM",
          accessRank: 200,
          course: "CTET_TET",
          status: "active",
          isActive: true,
          priceINR: 1499,
          currency: "INR",
          priceVersion: 2,
          defaultValidityDays: 180,
          validityMode:
            "ADMIN_DEFINED",
        },
        now:
          new Date(
            "2026-07-15T00:00:00.000Z"
          ),
      });

    expect(
      terms.accessUntil
    ).toBe("2027-01-11");
    expect(
      terms.validityDays
    ).toBe(180);
  });

  test("explicit no-expiry key remains open-ended", () => {
    const terms =
      resolveAccessKeyGrantTerms({
        keyRecord: {
          id: "KEY-OPEN",
          planType: "PREMIUM",
          accessRank: 200,
          scopeType: "plan",
          noExpiry: true,
        },
        now:
          new Date(
            "2026-07-15T00:00:00.000Z"
          ),
      });

    expect(terms).toMatchObject({
      accessUntil: null,
      noExpiry: true,
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY,
    });
  });

  test("missing validity remains admin-defined for later fail-closed enforcement", () => {
    const terms =
      resolveAccessKeyGrantTerms({
        keyRecord: {
          id: "KEY-PENDING",
          planType: "PREMIUM",
          accessRank: 200,
          scopeType: "plan",
        },
        now:
          new Date(
            "2026-07-15T00:00:00.000Z"
          ),
      });

    expect(terms).toMatchObject({
      accessUntil: null,
      noExpiry: false,
      untilManualChange: false,
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    });
  });
});
