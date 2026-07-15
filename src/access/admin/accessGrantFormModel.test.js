import {
  ADMIN_PLAN_VALIDITY_CHOICES,
  applyPlanProductToGrantForm,
  buildDynamicPlanGrantPayload,
  createInitialDynamicPlanGrantForm,
  listGrantablePlanProducts,
  validateDynamicPlanGrantForm,
} from "./accessGrantFormModel";

import {
  ACCESS_PLAN_VALIDITY_MODES,
} from "../accessPlanCatalog";

const products = [
  {
    id: "plan_premium",
    productId:
      "plan_premium",
    scopeType: "plan",
    planCode: "PREMIUM",
    title: "Premium Batch",
    accessRank: 200,
    priceINR: 1499,
    currency: "INR",
    priceVersion: 2,
    validityMode:
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: null,
    allowNoExpiry: true,
    status: "active",
    isActive: true,
  },
  {
    id:
      "plan_ctet_crash_45",
    productId:
      "plan_ctet_crash_45",
    scopeType: "plan",
    planCode:
      "CTET_CRASH_45",
    title: "CTET Crash 45",
    accessRank: 150,
    priceINR: 799,
    currency: "INR",
    priceVersion: 3,
    validityMode:
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: null,
    allowNoExpiry: false,
    status: "active",
    isActive: true,
  },
  {
    id: "plan_old",
    productId: "plan_old",
    scopeType: "plan",
    planCode: "OLD_PLAN",
    title: "Old Plan",
    accessRank: 50,
    priceINR: 100,
    currency: "INR",
    priceVersion: 1,
    validityMode:
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    status: "blocked",
    isActive: false,
  },
];

describe("Admin dynamic plan grant form contract", () => {
  test("initial form has no hardcoded selected plan or fixed duration", () => {
    const form =
      createInitialDynamicPlanGrantForm();

    expect(form.productId).toBe("");
    expect(form.planCode).toBe("");
    expect(form.accessUntil).toBe("");
    expect(form.validityDays).toBe("");
  });

  test("lists only active plan products in access-rank order", () => {
    expect(
      listGrantablePlanProducts(
        products
      ).map(
        (product) =>
          product.planCode
      )
    ).toEqual([
      "CTET_CRASH_45",
      "PREMIUM",
    ]);
  });

  test("selecting a product copies stable identity and rank", () => {
    const form =
      applyPlanProductToGrantForm(
        createInitialDynamicPlanGrantForm(),
        products[1]
      );

    expect(form).toMatchObject({
      productId:
        "plan_ctet_crash_45",
      planCode:
        "CTET_CRASH_45",
      planType:
        "CTET_CRASH_45",
      accessRank: "150",
    });
  });

  test("fails closed when selected product is no longer active", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "learner@example.com",
      productId: "plan_old",
      adminNote: "Approved",
      accessUntil:
        "2026-08-30",
    };

    expect(
      validateDynamicPlanGrantForm({
        form,
        products,
      })
    ).toContain(
      "Selected plan product is not active or no longer exists."
    );
  });

  test("custom window requires an end date", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "learner@example.com",
      productId:
        "plan_premium",
      adminNote: "Approved",
    };

    expect(
      validateDynamicPlanGrantForm({
        form,
        products,
      })
    ).toContain(
      "Access-until date is required for a custom window."
    );
  });

  test("validity-days option requires a positive whole number", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "learner@example.com",
      productId:
        "plan_premium",
      adminNote: "Approved",
      validityChoice:
        ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS,
      validityDays: "0",
    };

    expect(
      validateDynamicPlanGrantForm({
        form,
        products,
      })
    ).toContain(
      "Validity days must be a positive whole number."
    );
  });

  test("no-expiry is blocked when product policy disables it", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "learner@example.com",
      productId:
        "plan_ctet_crash_45",
      adminNote: "Approved",
      validityChoice:
        ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY,
    };

    expect(
      validateDynamicPlanGrantForm({
        form,
        products,
      })
    ).toContain(
      "Selected plan does not allow no-expiry access."
    );
  });

  test("custom plan grant preserves product, rank, price version, and window", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "Learner@Example.com",
      name: "Learner",
      productId:
        "plan_ctet_crash_45",
      adminNote:
        "Founder approved access",
      accessFrom:
        "2026-07-15",
      accessUntil:
        "2026-08-30",
    };
    const payload =
      buildDynamicPlanGrantPayload({
        form,
        products,
        now: new Date(
          "2026-07-15T12:00:00.000Z"
        ),
      });

    expect(payload).toMatchObject({
      email:
        "learner@example.com",
      planType:
        "CTET_CRASH_45",
      planCode:
        "CTET_CRASH_45",
      accessRank: 150,
      productId:
        "plan_ctet_crash_45",
      priceVersion: 3,
      validityMode:
        ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW,
      noExpiry: false,
      untilManualChange: false,
      fixed365DayValidity: false,
    });
    expect(
      payload.purchaseTermsSnapshot
        .priceINR
    ).toBe(799);
  });

  test("validity days calculate access-until without a fixed 365-day default", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "learner@example.com",
      productId:
        "plan_premium",
      adminNote: "Approved",
      validityChoice:
        ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS,
      validityDays: "30",
      accessFrom:
        "2026-07-15",
    };
    const payload =
      buildDynamicPlanGrantPayload({
        form,
        products,
        now: new Date(
          "2026-07-15T12:00:00.000Z"
        ),
      });

    expect(
      payload.accessUntil
        .toISOString()
        .slice(0, 10)
    ).toBe("2026-08-14");
    expect(
      payload.fixed365DayValidity
    ).toBe(false);
  });

  test("until-manual-change creates an open-ended audited snapshot", () => {
    const form = {
      ...createInitialDynamicPlanGrantForm(),
      email:
        "learner@example.com",
      productId:
        "plan_premium",
      adminNote: "Approved",
      validityChoice:
        ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE,
    };
    const payload =
      buildDynamicPlanGrantPayload({
        form,
        products,
        now: new Date(
          "2026-07-15T12:00:00.000Z"
        ),
      });

    expect(
      payload.validityMode
    ).toBe(
      ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
    );
    expect(
      payload.accessUntil
    ).toBeNull();
    expect(
      payload.untilManualChange
    ).toBe(true);
  });
});
