import React from "react";

export default function ExpiredAccessCard({
  title = "Access needs renewal",
  message = "Your current access period has expired. Renew your plan to continue learning without interruption.",
  pricingPath = "/ctet-tet/pricing",
  onRenew,
} = {}) {
  const handleRenew = () => {
    if (typeof onRenew === "function") {
      onRenew();
      return;
    }

    window.location.href = pricingPath;
  };

  return (
    <section className="accessGateShell" aria-live="polite">
      <div className="accessGateCard accessGateCardExpired">
        <div className="accessGateGlow" />

        <div className="accessGateBadgeRow">
          <span className="accessGateBadge accessGateBadgeWarn">EXPIRED</span>
          <span className="accessGateMiniBadge">Renewal Required</span>
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="accessGateActions">
          <button type="button" className="accessGatePrimaryBtn" onClick={handleRenew}>
            Renew Access
          </button>
        </div>
      </div>
    </section>
  );
}
