import {
  ACCESS_SCOPE_TYPES,
} from "../access/accessConstants";

import {
  ACCESS_PLAN_VALIDITY_MODES,
  normalizePlanCatalogEntry,
} from "../access/accessPlanCatalog";

const cleanString = (value = "") =>
  String(value ?? "").trim();

const formatPrice = (value) =>
  "₹" +
  Number(value || 0).toLocaleString(
    "en-IN"
  );

const getValidityLabel = (
  product = {}
) => {
  if (
    product.validityMode ===
    ACCESS_PLAN_VALIDITY_MODES.NO_EXPIRY
  ) {
    return "No expiry";
  }

  if (
    product.validityMode ===
    ACCESS_PLAN_VALIDITY_MODES.UNTIL_MANUAL_CHANGE
  ) {
    return "Until manually changed";
  }

  if (
    Number(
      product.defaultValidityDays
    ) > 0
  ) {
    return (
      Number(
        product.defaultValidityDays
      ) + " days"
    );
  }

  return "Validity selected at approval";
};

const normalizeFeatureRows = (
  product = {}
) => {
  const rawFeatures = Array.isArray(
    product.features
  )
    ? product.features
    : [];
  const normalizedFeatures =
    rawFeatures
      .map((feature) => {
        if (Array.isArray(feature)) {
          return [
            cleanString(
              feature[0] || "✓"
            ),
            cleanString(feature[1]),
          ];
        }

        return [
          "✓",
          cleanString(feature),
        ];
      })
      .filter(
        (feature) =>
          Boolean(feature[1])
      );

  if (normalizedFeatures.length) {
    return normalizedFeatures;
  }

  return [
    [
      "🎓",
      cleanString(
        product.description
      ) ||
        product.planCode +
          " learning access",
    ],
    [
      "🔐",
      "Access rank " +
        product.accessRank,
    ],
    [
      "⏳",
      getValidityLabel(product),
    ],
  ];
};

const normalizeUnlockRows = (
  product = {}
) => {
  const rawUnlocks = Array.isArray(
    product.unlocks
  )
    ? product.unlocks
    : [];
  const normalizedUnlocks =
    rawUnlocks
      .map(cleanString)
      .filter(Boolean);

  if (normalizedUnlocks.length) {
    return normalizedUnlocks;
  }

  return [
    product.planCode +
      " plan entitlement",
    "Audited AspireNest access",
    getValidityLabel(product),
  ];
};

export const buildFreePricingCard = () => ({
  id: "free-starter",
  badge: "FREE",
  title: "Starter",
  price: "₹0",
  amount: 0,
  features: [
    ["📘", "Sample Notes"],
    ["📝", "1 Mock Test"],
    ["📅", "Study Plan"],
  ],
  unlocks: [
    "FREE NOTES",
    "Demo Mock Test",
    "Free Resources",
  ],
  button: "Start Free",
  featured: false,
  product: null,
});

export const buildDynamicPricingCards = (
  products = []
) =>
  (Array.isArray(products)
    ? products
    : []
  )
    .filter(
      (product) =>
        cleanString(
          product.scopeType || "plan"
        ).toLowerCase() ===
          ACCESS_SCOPE_TYPES.PLAN &&
        product.isActive !== false &&
        cleanString(
          product.status || "active"
        ).toLowerCase() ===
          "active"
    )
    .map((product) =>
      normalizePlanCatalogEntry(
        product
      )
    )
    .filter(
      (product) =>
        product.planCode !== "FREE" &&
        product.priceINR > 0
    )
    .sort(
      (first, second) =>
        first.accessRank -
          second.accessRank ||
        first.title.localeCompare(
          second.title
        )
    )
    .map((product) => ({
      id: product.productId,
      badge:
        cleanString(
          product.badge
        ) || product.planCode,
      title: product.title,
      price: formatPrice(
        product.priceINR
      ),
      amount: product.priceINR,
      features:
        normalizeFeatureRows(
          product
        ),
      unlocks:
        normalizeUnlockRows(
          product
        ),
      button:
        cleanString(
          product.buttonLabel
        ) || "Choose Plan",
      featured:
        product.featured === true ||
        product.planCode ===
          "PREMIUM",
      product,
    }));

export const buildPricingCatalogView = (
  products = []
) => [
  buildFreePricingCard(),
  ...buildDynamicPricingCards(
    products
  ),
];
