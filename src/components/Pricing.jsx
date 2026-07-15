import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listAccessProducts,
} from "../access/accessService";

import {
  buildPricingCatalogView,
} from "../payments/paymentCatalogViewModel";

export default function Pricing({
  createPaymentRequest,
  setActiveSection,
}) {
  const [selectedPlan, setSelectedPlan] =
    useState(null);
  const [catalogProducts, setCatalogProducts] =
    useState([]);
  const [catalogLoading, setCatalogLoading] =
    useState(true);
  const [catalogError, setCatalogError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const products =
          await listAccessProducts({
            maxCount: 100,
          });

        if (active) {
          setCatalogProducts(
            products
          );
        }
      } catch (error) {
        if (active) {
          setCatalogError(
            error?.message ||
              "Learning plan catalog could not be loaded."
          );
          setCatalogProducts([]);
        }
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const plans = useMemo(
    () =>
      buildPricingCatalogView(
        catalogProducts
      ),
    [catalogProducts]
  );

  const paidPlanCount = plans.filter(
    (plan) => Boolean(plan.product)
  ).length;

  const handleFreeStart = () => {
    setActiveSection?.(null);

    setTimeout(() => {
      document
        .querySelector(
          ".freeResources"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleBuyPlan = (
    plan
  ) => {
    if (plan.product) {
      createPaymentRequest?.(
        plan.product
      );
      return;
    }

    handleFreeStart();
  };

  return (
    <section
      id="pricing"
      className="pricingPro applePricing"
    >
      <div className="pricingHeader">
        <h2>
          Choose Your Learning Plan
        </h2>
        <p>
          Live AspireNest catalog pricing,
          protected purchase snapshots, and
          admin-verified access activation.
        </p>
      </div>

      {catalogLoading ? (
        <div className="pricingCard">
          <span className="priceBadge">
            CATALOG
          </span>
          <h3>Loading Plans</h3>
          <p>
            Current active learning plans are
            being loaded securely.
          </p>
        </div>
      ) : null}

      {catalogError ? (
        <div className="pricingCard">
          <span className="priceBadge">
            REVIEW
          </span>
          <h3>
            Plan Catalog Unavailable
          </h3>
          <p>{catalogError}</p>
          <p>
            Paid purchase actions remain locked
            until the live catalog loads.
          </p>
        </div>
      ) : null}

      {!catalogLoading &&
      !catalogError &&
      paidPlanCount === 0 ? (
        <div className="pricingCard">
          <span className="priceBadge">
            COMING SOON
          </span>
          <h3>
            Paid Plans Are Being Prepared
          </h3>
          <p>
            Free resources remain available.
            Paid checkout stays disabled until an
            active catalog plan is published.
          </p>
        </div>
      ) : null}

      <div className="pricingGrid">
        {plans.map((plan) => (
          <div
            className={`pricingCard ${
              plan.featured
                ? "featuredPrice"
                : ""
            }`}
            key={plan.id}
          >
            <span className="priceBadge">
              {plan.badge}
            </span>

            <h3>{plan.title}</h3>
            <h1>{plan.price}</h1>

            <ul>
              {plan.features.map(
                ([icon, text]) => (
                  <li key={text}>
                    <span className="featureIcon">
                      {icon}
                    </span>
                    <span>{text}</span>
                  </li>
                )
              )}
            </ul>

            <button
              type="button"
              className="btnLink outlinePlanBtn"
              onClick={() =>
                setSelectedPlan(plan)
              }
            >
              View Details
            </button>

            <button
              type="button"
              className="btnLink"
              onClick={() =>
                handleBuyPlan(plan)
              }
            >
              {plan.button}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan ? (
        <div className="planModalOverlay">
          <div className="planModal">
            <button
              type="button"
              className="planModalClose"
              onClick={() =>
                setSelectedPlan(null)
              }
            >
              ×
            </button>

            <span className="priceBadge">
              {selectedPlan.badge}
            </span>
            <h2>
              {selectedPlan.title}
            </h2>
            <h1>
              {selectedPlan.price}
            </h1>

            <h3>What you get</h3>
            <ul>
              {selectedPlan.features.map(
                ([icon, text]) => (
                  <li key={text}>
                    {icon} {text}
                  </li>
                )
              )}
            </ul>

            <h3>Unlocks</h3>
            <ul>
              {selectedPlan.unlocks.map(
                (item) => (
                  <li key={item}>
                    ✅ {item}
                  </li>
                )
              )}
            </ul>

            <button
              type="button"
              className="btnLink"
              onClick={() => {
                handleBuyPlan(
                  selectedPlan
                );
                setSelectedPlan(null);
              }}
            >
              {selectedPlan.button}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
