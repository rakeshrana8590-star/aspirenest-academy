import {
  buildDynamicPricingCards,
  buildFreePricingCard,
  buildPricingCatalogView,
} from "./paymentCatalogViewModel";

import {
  ACCESS_PLAN_VALIDITY_MODES,
} from "../access/accessPlanCatalog";

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
    description:
      "Focused revision batch",
    accessRank: 150,
    priceINR: 799,
    currency: "INR",
    priceVersion: 3,
    validityMode:
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    defaultValidityDays: 45,
    allowNoExpiry: false,
    status: "active",
    isActive: true,
  },
  {
    id: "plan_free",
    productId: "plan_free",
    scopeType: "plan",
    planCode: "FREE",
    title: "Free",
    accessRank: 0,
    priceINR: 0,
    currency: "INR",
    priceVersion: 1,
    validityMode:
      ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY,
    allowNoExpiry: true,
    status: "active",
    isActive: true,
  },
  {
    id: "plan_old",
    productId: "plan_old",
    scopeType: "plan",
    planCode: "OLD_PLAN",
    title: "Old Plan",
    accessRank: 10,
    priceINR: 99,
    currency: "INR",
    priceVersion: 1,
    validityMode:
      ACCESS_PLAN_VALIDITY_MODES.ADMIN_DEFINED,
    status: "blocked",
    isActive: false,
  },
];

describe("AspireNest payment catalog view model", () => {
  test("free card remains a navigation-only card", () => {
    expect(
      buildFreePricingCard()
    ).toMatchObject({
      badge: "FREE",
      amount: 0,
      product: null,
    });
  });

  test("paid cards come only from active catalog plan products", () => {
    const cards =
      buildDynamicPricingCards(
        products
      );

    expect(
      cards.map(
        (card) =>
          card.product.planCode
      )
    ).toEqual([
      "CTET_CRASH_45",
      "PREMIUM",
    ]);
  });

  test("card preserves stable catalog identity, rank, price, and version", () => {
    const card =
      buildDynamicPricingCards(
        products
      )[0];

    expect(card).toMatchObject({
      id:
        "plan_ctet_crash_45",
      title: "CTET Crash 45",
      price: "₹799",
      amount: 799,
    });
    expect(card.product).toMatchObject({
      productId:
        "plan_ctet_crash_45",
      planCode:
        "CTET_CRASH_45",
      accessRank: 150,
      priceVersion: 3,
    });
  });

  test("view contains one static free card and dynamic paid cards", () => {
    const cards =
      buildPricingCatalogView(
        products
      );

    expect(cards[0].badge).toBe(
      "FREE"
    );
    expect(cards).toHaveLength(3);
  });
});
