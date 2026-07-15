import {
  ACCESS_INITIAL_PLAN_SEED,
  ACCESS_PLAN_VALIDITY_MODES,
  assertUniquePlanCatalog,
  buildPlanPurchaseTermsSnapshot,
  canUsePlanDescriptor,
  comparePlanDescriptors,
  normalizeAdminGrantWindow,
  normalizeAdminValidityPolicy,
  normalizePlanCatalogEntry,
  normalizePlanCode,
  resolvePlanDescriptor,
} from "./accessPlanCatalog";

describe("AspireNest dynamic plan catalog contract", () => {
  test("current four plans are initial seed entries with stable ranks", () => {
    expect(
      ACCESS_INITIAL_PLAN_SEED.map(
        ({ planCode, accessRank }) => ({
          planCode,
          accessRank,
        })
      )
    ).toEqual([
      { planCode: "FREE", accessRank: 0 },
      { planCode: "BASIC", accessRank: 100 },
      { planCode: "PREMIUM", accessRank: 200 },
      { planCode: "MENTORSHIP", accessRank: 300 },
    ]);
  });

  test("legacy aliases normalize while a valid new plan remains custom", () => {
    expect(normalizePlanCode("pro")).toBe("PREMIUM");
    expect(normalizePlanCode("mentor")).toBe("MENTORSHIP");
    expect(normalizePlanCode("ctet crash 45")).toBe("CTET_CRASH_45");
  });

  test("invalid strict plan code is rejected", () => {
    expect(() =>
      normalizePlanCode("45 day plan", {
        strict: true,
        fallback: "",
      })
    ).toThrow(
      "Plan code must start with a letter"
    );
  });

  test("custom plan requires an explicit access rank", () => {
    expect(() =>
      normalizePlanCatalogEntry({
        productId: "plan_ctet_crash",
        planCode: "CTET_CRASH",
        title: "CTET Crash Batch",
        priceINR: 799,
        priceVersion: 1,
      })
    ).toThrow(
      "Custom plan requires an explicit access rank."
    );

    expect(
      normalizePlanCatalogEntry({
        productId: "plan_ctet_crash",
        planCode: "CTET_CRASH",
        title: "CTET Crash Batch",
        accessRank: 150,
        priceINR: 799,
        priceVersion: 1,
      })
    ).toMatchObject({
      productId: "plan_ctet_crash",
      planCode: "CTET_CRASH",
      planType: "CTET_CRASH",
      accessRank: 150,
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
      defaultValidityDays: null,
      allowNoExpiry: true,
    });
  });

  test("catalog hierarchy uses accessRank instead of a permanent enum", () => {
    const catalog = [
      {
        productId: "plan_basic",
        planCode: "BASIC",
        accessRank: 100,
      },
      {
        productId: "plan_crash",
        planCode: "CTET_CRASH",
        accessRank: 150,
      },
      {
        productId: "plan_premium",
        planCode: "PREMIUM",
        accessRank: 200,
      },
    ];

    expect(
      canUsePlanDescriptor(
        {
          planCode: "CTET_CRASH",
          accessRank: 150,
        },
        {
          planCode: "BASIC",
          accessRank: 100,
        },
        { catalog }
      )
    ).toBe(true);

    expect(
      canUsePlanDescriptor(
        {
          planCode: "CTET_CRASH",
          accessRank: 150,
        },
        {
          planCode: "PREMIUM",
          accessRank: 200,
        },
        { catalog }
      )
    ).toBe(false);

    expect(
      comparePlanDescriptors(
        {
          planCode: "PREMIUM",
          accessRank: 200,
        },
        {
          planCode: "CTET_CRASH",
          accessRank: 150,
        }
      )
    ).toBe(50);
  });

  test("same custom plan opens exactly even before catalog lookup", () => {
    expect(
      canUsePlanDescriptor(
        "CTET_CRASH",
        "CTET_CRASH"
      )
    ).toBe(true);

    expect(
      canUsePlanDescriptor(
        "CTET_CRASH",
        "PREMIUM"
      )
    ).toBe(false);
  });

  test("unknown custom plan descriptor fails closed without rank", () => {
    expect(
      resolvePlanDescriptor("CTET_CRASH")
    ).toEqual({
      planCode: "CTET_CRASH",
      planType: "CTET_CRASH",
      accessRank: null,
      productId: null,
    });

    expect(
      canUsePlanDescriptor(
        "CTET_CRASH",
        "BASIC"
      )
    ).toBe(false);
  });

  test("validity is admin-defined and never silently fixed to 365 days", () => {
    expect(
      normalizeAdminValidityPolicy({})
    ).toEqual({
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
      defaultValidityDays: null,
      allowNoExpiry: true,
      adminControlsValidity: true,
      fixed365DayValidity: false,
    });
  });

  test("admin may choose a custom window, no expiry, or manual change", () => {
    const customWindow =
      normalizeAdminGrantWindow({
        accessFrom: "2026-08-01",
        accessUntil: "2026-10-31",
      });
    const noExpiry =
      normalizeAdminGrantWindow({
        accessFrom: "2026-08-01",
        noExpiry: true,
      });
    const manual =
      normalizeAdminGrantWindow({
        untilManualChange: true,
      });

    expect(customWindow.validityMode).toBe(
      ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW
    );
    expect(noExpiry.validityMode).toBe(
      ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
    );
    expect(noExpiry.accessUntil).toBeNull();
    expect(manual.validityMode).toBe(
      ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
    );
  });

  test("conflicting validity choices are rejected", () => {
    expect(() =>
      normalizeAdminGrantWindow({
        noExpiry: true,
        accessUntil: "2026-12-31",
      })
    ).toThrow(
      "No-expiry access cannot include an access-until date."
    );

    expect(() =>
      normalizeAdminGrantWindow({
        accessFrom: "2026-12-31",
        accessUntil: "2026-01-01",
      })
    ).toThrow(
      "Access until date must be on or after access from date."
    );
  });

  test("price update affects a future snapshot, not an existing snapshot", () => {
    const initialProduct = {
      productId: "plan_crash",
      planCode: "CTET_CRASH",
      title: "CTET Crash Batch",
      accessRank: 150,
      priceINR: 799,
      priceVersion: 1,
      priceEffectiveFrom: "2026-08-01",
    };
    const updatedProduct = {
      ...initialProduct,
      priceINR: 899,
      priceVersion: 2,
      priceEffectiveFrom: "2026-09-01",
    };

    const firstSnapshot =
      buildPlanPurchaseTermsSnapshot({
        product: initialProduct,
        grant: {
          accessFrom: "2026-08-05",
          accessUntil: "2026-10-05",
        },
        capturedAt: "2026-08-05T10:00:00Z",
      });
    const secondSnapshot =
      buildPlanPurchaseTermsSnapshot({
        product: updatedProduct,
        grant: {
          accessFrom: "2026-09-05",
          accessUntil: "2026-11-05",
        },
        capturedAt: "2026-09-05T10:00:00Z",
      });

    expect(firstSnapshot.priceINR).toBe(799);
    expect(firstSnapshot.priceVersion).toBe(1);
    expect(secondSnapshot.priceINR).toBe(899);
    expect(secondSnapshot.priceVersion).toBe(2);
    expect(firstSnapshot.priceINR).toBe(799);
  });

  test("plan codes and product ids must be unique", () => {
    expect(
      assertUniquePlanCatalog([
        {
          productId: "plan_crash",
          planCode: "CTET_CRASH",
          title: "CTET Crash Batch",
          accessRank: 150,
          priceINR: 799,
          priceVersion: 1,
        },
        {
          productId: "plan_mega",
          planCode: "CTET_MEGA",
          title: "CTET Mega Batch",
          accessRank: 250,
          priceINR: 1999,
          priceVersion: 1,
        },
      ])
    ).toBe(true);

    expect(() =>
      assertUniquePlanCatalog([
        {
          productId: "plan_crash",
          planCode: "CTET_CRASH",
          title: "CTET Crash Batch",
          accessRank: 150,
          priceINR: 799,
          priceVersion: 1,
        },
        {
          productId: "plan_crash_2",
          planCode: "CTET_CRASH",
          title: "Duplicate",
          accessRank: 160,
          priceINR: 899,
          priceVersion: 1,
        },
      ])
    ).toThrow("Duplicate plan code");
  });
});
