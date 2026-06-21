import React from "react";

export default function PlanLockedCard({
  requiredPlan = "PREMIUM",
  title = "Premium access required",
  message = "This learning resource is part of the AspireNest Academy premium learning system.",
  pricingPath = "/ctet-tet/pricing",
  loginPath = "/login",
  showLoginAction = false,
  onUpgrade,
  onLogin,
} = {}) {
  const handleUpgrade = () => {
    if (typeof onUpgrade === "function") {
      onUpgrade();
      return;
    }

    window.location.href = pricingPath;
  };

  const handleLogin = () => {
    if (typeof onLogin === "function") {
      onLogin();
      return;
    }

    window.location.href = loginPath;
  };

  return (
    <section className="accessGateShell" aria-live="polite">
      <div className="accessGateCard accessGateCardPremium">
        <div className="accessGateGlow" />

        <div className="accessGateBadgeRow">
          <span className="accessGateBadge">{requiredPlan} PLAN</span>
          <span className="accessGateMiniBadge">AspireNest Access</span>
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="accessGateFeatureGrid">
          <span>Structured preparation</span>
          <span>Premium practice</span>
          <span>Exam-focused learning</span>
        </div>

        <div className="accessGateActions">
          <button type="button" className="accessGatePrimaryBtn" onClick={handleUpgrade}>
            View Premium Plans
          </button>

          {showLoginAction ? (
            <button type="button" className="accessGateSecondaryBtn" onClick={handleLogin}>
              Login to Continue
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
