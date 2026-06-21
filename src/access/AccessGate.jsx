import React from "react";

import { ACCESS_PLAN_TYPES, ACCESS_STATUS } from "./accessConstants";
import ExpiredAccessCard from "./ExpiredAccessCard";
import PlanLockedCard from "./PlanLockedCard";
import "../styles/access/accessGate.css";

function AccessLoadingCard({ message = "Checking your access..." }) {
  return (
    <section className="accessGateShell" aria-live="polite">
      <div className="accessGateCard accessGateCardLoading">
        <div className="accessGateSpinner" />
        <h2>Preparing your learning space</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

function AccessBlockedCard({
  title = "Access temporarily blocked",
  message = "This access is currently blocked. Please contact AspireNest Academy support for assistance.",
} = {}) {
  return (
    <section className="accessGateShell" aria-live="polite">
      <div className="accessGateCard accessGateCardBlocked">
        <div className="accessGateBadgeRow">
          <span className="accessGateBadge accessGateBadgeDanger">BLOCKED</span>
          <span className="accessGateMiniBadge">Support Required</span>
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

function AccessUpcomingCard({
  title = "This content opens soon",
  message = "This learning resource is scheduled and will become available at the planned time.",
} = {}) {
  return (
    <section className="accessGateShell" aria-live="polite">
      <div className="accessGateCard accessGateCardUpcoming">
        <div className="accessGateBadgeRow">
          <span className="accessGateBadge">UPCOMING</span>
          <span className="accessGateMiniBadge">Scheduled Access</span>
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

export default function AccessGate({
  children,
  user = null,
  loading = false,
  requiredPlan = ACCESS_PLAN_TYPES.FREE,
  module = null,
  accessStatus = ACCESS_STATUS.ACTIVE,
  isBlocked = false,
  isExpired = false,
  isUpcoming = false,
  hasAccess,
  canAccessModule,
  loginPath = "/login",
  pricingPath = "/ctet-tet/pricing",
  loadingMessage,
  lockedTitle,
  lockedMessage,
  expiredTitle,
  expiredMessage,
  blockedTitle,
  blockedMessage,
  upcomingTitle,
  upcomingMessage,
  onLogin,
  onUpgrade,
  onRenew,
}) {
  const normalizedRequiredPlan = String(requiredPlan || ACCESS_PLAN_TYPES.FREE).trim().toUpperCase();
  const normalizedAccessStatus = String(accessStatus || ACCESS_STATUS.ACTIVE).trim().toLowerCase();

  if (loading) {
    return <AccessLoadingCard message={loadingMessage} />;
  }

  if (!user && normalizedRequiredPlan !== ACCESS_PLAN_TYPES.FREE) {
    return (
      <PlanLockedCard
        requiredPlan={normalizedRequiredPlan}
        title="Login required"
        message="Please log in with your registered AspireNest Academy email ID to continue."
        pricingPath={pricingPath}
        loginPath={loginPath}
        showLoginAction
        onLogin={onLogin}
        onUpgrade={onUpgrade}
      />
    );
  }

  if (isBlocked || normalizedAccessStatus === ACCESS_STATUS.BLOCKED) {
    return <AccessBlockedCard title={blockedTitle} message={blockedMessage} />;
  }

  if (isExpired || normalizedAccessStatus === ACCESS_STATUS.EXPIRED) {
    return (
      <ExpiredAccessCard
        title={expiredTitle}
        message={expiredMessage}
        pricingPath={pricingPath}
        onRenew={onRenew}
      />
    );
  }

  if (isUpcoming) {
    return <AccessUpcomingCard title={upcomingTitle} message={upcomingMessage} />;
  }

  const allowed = module && typeof canAccessModule === "function"
    ? canAccessModule(module, normalizedRequiredPlan)
    : typeof hasAccess === "function"
      ? hasAccess(normalizedRequiredPlan)
      : normalizedRequiredPlan === ACCESS_PLAN_TYPES.FREE;

  if (!allowed) {
    return (
      <PlanLockedCard
        requiredPlan={normalizedRequiredPlan}
        title={lockedTitle}
        message={lockedMessage}
        pricingPath={pricingPath}
        loginPath={loginPath}
        onUpgrade={onUpgrade}
      />
    );
  }

  return <>{children}</>;
}
