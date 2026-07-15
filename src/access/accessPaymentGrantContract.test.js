import {
  buildDynamicPaymentApproval,
  buildDynamicPaymentRequest,
  buildPaymentProductSnapshot,
  normalizePaymentPlanProduct,
  resolvePaymentAdminValidity,
} from "./accessPaymentGrantContract";

import {
  ACCESS_PLAN_VALIDITY_MODES,
} from "./accessPlanCatalog";

const customPlan = {
  id: "plan_ctet_crash_45",
  productId:
    "plan_ctet_crash_45",
  scopeType: "plan",
  planCode:
    "CTET_CRASH_45",
  title: "CTET Crash 45",
  accessRank: 150,
  priceINR: 799,
  compareAtPriceINR: 999,
  currency: "INR",
  priceVersion: 3,
  validityMode:
    ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
  defaultValidityDays: null,
  allowNoExpiry: true,
  status: "active",
  isActive: true,
};

describe("AspireNest dynamic payment grant contract", () => {
  test("normalizes an active custom plan product", () => {
    expect(
      normalizePaymentPlanProduct(
        customPlan
      )
    ).toMatchObject({
      productId:
        "plan_ctet_crash_45",
      planCode:
        "CTET_CRASH_45",
      accessRank: 150,
      priceINR: 799,
      priceVersion: 3,
    });
  });

  test("rejects non-plan payment products", () => {
    expect(() =>
      normalizePaymentPlanProduct({
        ...customPlan,
        scopeType: "item",
      })
    ).toThrow(
      "Payment product must be plan scoped."
    );
  });

  test("request snapshots product identity and current price version", () => {
    const request =
      buildDynamicPaymentRequest({
        product: customPlan,
        learner: {
          uid: "uid-1",
          email:
            "Learner@Example.com",
          name: "Learner",
          phone: "9999999999",
        },
        orderId:
          "ASP-1001",
        upiLink:
          "upi://payment",
        requestedAt:
          new Date(
            "2026-07-15T10:00:00.000Z"
          ),
      });

    expect(request).toMatchObject({
      orderId: "ASP-1001",
      userId: "uid-1",
      studentEmail:
        "learner@example.com",
      planName:
        "CTET Crash 45",
      planType:
        "CTET_CRASH_45",
      planCode:
        "CTET_CRASH_45",
      productId:
        "plan_ctet_crash_45",
      accessRank: 150,
      amount: 799,
      priceVersion: 3,
      fixed365DayValidity: false,
      status:
        "pending_payment",
    });
    expect(
      request.productSnapshot
        .priceINR
    ).toBe(799);
  });

  test("payment request preserves old purchase price after catalog price changes", () => {
    const snapshot =
      buildPaymentProductSnapshot(
        customPlan,
        new Date(
          "2026-07-15T10:00:00.000Z"
        )
      );

    expect(snapshot.priceINR).toBe(
      799
    );
    expect(snapshot.priceVersion).toBe(
      3
    );

    const updatedCatalog = {
      ...customPlan,
      priceINR: 899,
      priceVersion: 4,
    };

    expect(
      buildPaymentProductSnapshot(
        updatedCatalog
      ).priceINR
    ).toBe(899);
    expect(snapshot.priceINR).toBe(
      799
    );
  });

  test("approval fails closed without admin-selected validity", () => {
    expect(() =>
      resolvePaymentAdminValidity({
        product: customPlan,
        payment: {},
        selection: {},
        now: new Date(
          "2026-07-15T00:00:00.000Z"
        ),
      })
    ).toThrow(
      "Payment approval requires admin-selected validity."
    );
  });

  test("admin validity days create a custom access window", () => {
    const validity =
      resolvePaymentAdminValidity({
        product: customPlan,
        selection: {
          validityDays: 45,
        },
        now: new Date(
          "2026-07-15T00:00:00.000Z"
        ),
      });

    expect(
      validity.validityMode
    ).toBe(
      ACCESS_PLAN_VALIDITY_MODES.CUSTOM_WINDOW
    );
    expect(
      validity.accessUntil
        .toISOString()
        .slice(0, 10)
    ).toBe("2026-08-29");
  });

  test("admin may explicitly choose no-expiry access", () => {
    const validity =
      resolvePaymentAdminValidity({
        product: customPlan,
        selection: {
          noExpiry: true,
        },
        now: new Date(
          "2026-07-15T00:00:00.000Z"
        ),
      });

    expect(
      validity.validityMode
    ).toBe(
      ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
    );
    expect(
      validity.accessUntil
    ).toBeNull();
  });

  test("admin may explicitly choose until-manual-change access", () => {
    const validity =
      resolvePaymentAdminValidity({
        product: customPlan,
        selection: {
          untilManualChange: true,
        },
        now: new Date(
          "2026-07-15T00:00:00.000Z"
        ),
      });

    expect(
      validity.validityMode
    ).toBe(
      ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
    );
    expect(
      validity.accessUntil
    ).toBeNull();
  });

  test("approval uses purchase snapshot rather than a later catalog price", () => {
    const request =
      buildDynamicPaymentRequest({
        product: customPlan,
        learner: {
          uid: "uid-1",
          email:
            "learner@example.com",
        },
        orderId:
          "ASP-1001",
      });

    const result =
      buildDynamicPaymentApproval({
        payment: {
          ...request,
          id: "payment-1",
          verificationStatus:
            "verified",
        },
        product: {
          ...customPlan,
          priceINR: 899,
          priceVersion: 4,
        },
        adminSelection: {
          validityDays: 45,
        },
        now: new Date(
          "2026-07-15T12:00:00.000Z"
        ),
      });

    expect(
      result.grant.amount
    ).toBe(799);
    expect(
      result.purchaseTermsSnapshot
        .priceVersion
    ).toBe(3);
    expect(
      result.grant.planCode
    ).toBe(
      "CTET_CRASH_45"
    );
    expect(
      result.grant.accessRank
    ).toBe(150);
  });

  test("approval rejects a payment amount changed after request snapshot", () => {
    const request =
      buildDynamicPaymentRequest({
        product: customPlan,
        learner: {
          uid: "uid-1",
          email:
            "learner@example.com",
        },
        orderId:
          "ASP-1001",
      });

    expect(() =>
      buildDynamicPaymentApproval({
        payment: {
          ...request,
          amount: 999,
          verificationStatus:
            "verified",
        },
        adminSelection: {
          noExpiry: true,
        },
      })
    ).toThrow(
      "Payment amount does not match its purchase snapshot."
    );
  });

  test("approval requires verified payment", () => {
    const request =
      buildDynamicPaymentRequest({
        product: customPlan,
        learner: {
          uid: "uid-1",
          email:
            "learner@example.com",
        },
        orderId:
          "ASP-1001",
      });

    expect(() =>
      buildDynamicPaymentApproval({
        payment: request,
        adminSelection: {
          noExpiry: true,
        },
      })
    ).toThrow(
      "Payment must be verified before access approval."
    );
  });

  test("approval returns grant, payment update, and user summary without fixed duration", () => {
    const request =
      buildDynamicPaymentRequest({
        product: customPlan,
        learner: {
          uid: "uid-1",
          email:
            "learner@example.com",
        },
        orderId:
          "ASP-1001",
      });
    const result =
      buildDynamicPaymentApproval({
        payment: {
          ...request,
          id: "payment-1",
          isVerified: true,
        },
        adminSelection: {
          untilManualChange: true,
        },
        now: new Date(
          "2026-07-15T12:00:00.000Z"
        ),
      });

    expect(result.grant).toMatchObject({
      planCode:
        "CTET_CRASH_45",
      productId:
        "plan_ctet_crash_45",
      accessRank: 150,
      noExpiry: false,
      untilManualChange: true,
    });
    expect(
      result.paymentUpdate
        .fixed365DayValidity
    ).toBe(false);
    expect(
      result.userProjection
        .subscriptionType
    ).toBe(
      "CTET_CRASH_45"
    );
    expect(
      result.userProjection
        .expiryDate
    ).toBeNull();
  });
});
