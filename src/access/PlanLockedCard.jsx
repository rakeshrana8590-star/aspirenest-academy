import React from "react";

const OFFICIAL_WHATSAPP_NUMBER = "917304256002";

const buildAccessRequestUrl = (requiredPlan, requestType) => {
  const message = [
    "Hello Dr. Varsha Ma’am / AspireNest Academy,",
    "",
    `${requestType}: I need help unlocking AspireNest learning access.`,
    `Required plan/access: ${requiredPlan || "Please guide me"}`,
    "",
    "Please check my registered login email and guide me with the correct plan, module, or individual item access.",
  ].join("\n");

  return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export default function PlanLockedCard({
  requiredPlan = "PREMIUM",
  title = "Access required",
  message = "This resource is locked because no matching active AspireNest Access Engine entitlement was found.",
  pricingPath = "/ctet-tet/pricing",
  loginPath = "/login",
  showLoginAction = false,
  onUpgrade,
  onLogin,
  onContactMentor,
  onRequestAccess,
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

  const handleContactMentor = () => {
    if (typeof onContactMentor === "function") {
      onContactMentor();
      return;
    }

    window.open(
      buildAccessRequestUrl(requiredPlan, "Mentor guidance request"),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleRequestAccess = () => {
    if (typeof onRequestAccess === "function") {
      onRequestAccess();
      return;
    }

    window.open(
      buildAccessRequestUrl(requiredPlan, "Access request"),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section className="accessGateShell" aria-live="polite">
      <div className="accessGateCard accessGateCardPremium">
        <div className="accessGateGlow" />

        <div className="accessGateBadgeRow">
          <span className="accessGateBadge">{requiredPlan} ACCESS</span>
          <span className="accessGateMiniBadge">AspireNest Access Engine</span>
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="accessGateFeatureGrid">
          <span>Plan or module access</span>
          <span>Individual item access</span>
          <span>Mentor-guided support</span>
        </div>

        <div className="accessGateActions">
          <button type="button" className="accessGatePrimaryBtn" onClick={handleContactMentor}>
            Contact Mentor
          </button>

          <button type="button" className="accessGateSecondaryBtn" onClick={handleRequestAccess}>
            Request Access
          </button>

          <button type="button" className="accessGateSecondaryBtn" onClick={handleUpgrade}>
            View Plans
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
