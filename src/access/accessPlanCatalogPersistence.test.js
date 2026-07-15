import {
  assertStablePlanCatalogIdentity,
  buildPlanCatalogCreatePayload,
  buildPlanCatalogDocumentId,
  buildPlanCatalogPricePreview,
  buildPlanCatalogUpdatePayload,
  isAdminDefinedValidity,
} from "./accessPlanCatalogPersistence";

describe("AspireNest plan catalog persistence contract", () => {
  const createCustomPlan = () => ({
    productId: "plan_ctet_crash",
    planCode: "CTET_CRASH",
    title: "CTET Crash Batch",
    description: "Focused exam batch",
    accessRank: 150,
    priceINR: 799,
    compareAtPriceINR: 1199,
    priceVersion: 1,
    currency: "INR",
    validityMode: "ADMIN_DEFINED",
    defaultValidityDays: null,
    allowNoExpiry: true,
    status: "active",
    isActive: true,
    adminNote: "Founder-approved catalog test",
  });

  test("builds a deterministic plan product document id", () => {
    expect(
      buildPlanCatalogDocumentId(
        createCustomPlan()
      )
    ).toBe("plan_ctet_crash");
  });

  test("persists a custom plan without a permanent four-plan enum", () => {
    expect(
      buildPlanCatalogCreatePayload(
        createCustomPlan()
      )
    ).toMatchObject({
      productId: "plan_ctet_crash",
      planCode: "CTET_CRASH",
      planType: "CTET_CRASH",
      scopeType: "plan",
      accessRank: 150,
      priceINR: 799,
      price: 799,
      priceVersion: 1,
      validityMode: "ADMIN_DEFINED",
      defaultValidityDays: null,
      validityDays: null,
      allowNoExpiry: true,
      adminControlsValidity: true,
      fixed365DayValidity: false,
      supportsCustomWindow: true,
      supportsUntilManualChange: true,
      accessFrom: null,
      accessUntil: null,
    });
  });

  test("never injects a fixed 365-day validity", () => {
    const payload =
      buildPlanCatalogCreatePayload(
        createCustomPlan()
      );

    expect(
      isAdminDefinedValidity(payload)
    ).toBe(true);
    expect(
      payload.defaultValidityDays
    ).toBeNull();
    expect(
      payload.validityDays
    ).toBeNull();
  });

  test("preserves stable identity while updating price", () => {
    const existing =
      buildPlanCatalogCreatePayload(
        createCustomPlan(),
        {
          effectiveAt:
            "2026-08-01T00:00:00Z",
        }
      );
    const updated =
      buildPlanCatalogUpdatePayload(
        existing,
        {
          priceINR: 899,
          compareAtPriceINR: 1299,
          priceVersion: 1,
        },
        {
          effectiveAt:
            "2026-09-01T00:00:00Z",
        }
      );

    expect(updated.productId).toBe(
      existing.productId
    );
    expect(updated.planCode).toBe(
      existing.planCode
    );
    expect(updated.priceINR).toBe(899);
    expect(updated.priceVersion).toBe(2);
    expect(
      updated.priceEffectiveFrom.toISOString()
    ).toBe(
      "2026-09-01T00:00:00.000Z"
    );
  });

  test("supports legacy price aliases during an audited update", () => {
    const existing = {
      ...buildPlanCatalogCreatePayload(
        createCustomPlan()
      ),
      priceVersion: 2,
    };
    const updated =
      buildPlanCatalogUpdatePayload(
        existing,
        {
          price: 949,
          compareAtPrice: 1399,
        },
        {
          effectiveAt:
            "2026-10-01T00:00:00Z",
        }
      );

    expect(updated.priceINR).toBe(949);
    expect(updated.compareAtPriceINR).toBe(1399);
    expect(updated.priceVersion).toBe(3);
  });

  test("does not increment price version when price is unchanged", () => {
    const existing = {
      ...buildPlanCatalogCreatePayload(
        createCustomPlan()
      ),
      priceVersion: 4,
      priceEffectiveFrom:
        "2026-08-01T00:00:00Z",
    };
    const updated =
      buildPlanCatalogUpdatePayload(
        existing,
        {
          title:
            "CTET Crash Batch Updated",
        },
        {
          effectiveAt:
            "2026-09-01T00:00:00Z",
        }
      );

    expect(updated.priceVersion).toBe(4);
    expect(updated.title).toBe(
      "CTET Crash Batch Updated"
    );
  });

  test("rejects a referenced product id change", () => {
    expect(() =>
      assertStablePlanCatalogIdentity(
        {
          productId: "plan_ctet_crash",
          planCode: "CTET_CRASH",
        },
        {
          productId: "plan_changed",
          planCode: "CTET_CRASH",
        }
      )
    ).toThrow(
      "Referenced product ID cannot be changed."
    );
  });

  test("rejects an existing plan code change", () => {
    expect(() =>
      assertStablePlanCatalogIdentity(
        {
          productId: "plan_ctet_crash",
          planCode: "CTET_CRASH",
        },
        {
          productId: "plan_ctet_crash",
          planCode: "CTET_MEGA",
        }
      )
    ).toThrow(
      "Existing plan code cannot be changed."
    );
  });

  test("returns a stable price preview", () => {
    expect(
      buildPlanCatalogPricePreview({
        price: 499,
        compareAtPrice: 999,
        currency: "inr",
        priceVersion: 3,
      })
    ).toEqual({
      priceINR: 499,
      compareAtPriceINR: 999,
      currency: "INR",
      priceVersion: 3,
      priceEffectiveFrom: null,
    });
  });
});
