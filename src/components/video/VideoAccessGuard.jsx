import React from "react";
import { useNavigate } from "react-router-dom";

import {
  isVideoContentItem,
  normalizePlanType,
  normalizeVideoStatus,
} from "./videoUtils.js";

const PLAN_LEVEL = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
};

const canAccessByPlanLevel = (requiredPlan = "FREE", userPlanType = "FREE") => {
  const requiredLevel = PLAN_LEVEL[normalizePlanType(requiredPlan)] ?? 0;
  const userLevel = PLAN_LEVEL[normalizePlanType(userPlanType)] ?? 0;

  return userLevel >= requiredLevel;
};

const resolvePlanAccess = ({
  requiredPlan,
  userPlanType,
  hasPlanAccess,
}) => {
  if (normalizePlanType(requiredPlan) === "FREE") return true;

  if (typeof hasPlanAccess === "function") {
    try {
      const oneArgResult = hasPlanAccess(requiredPlan);

      if (typeof oneArgResult === "boolean") {
        return oneArgResult;
      }
    } catch {
      // fallback below
    }

    try {
      const twoArgResult = hasPlanAccess(userPlanType, requiredPlan);

      if (typeof twoArgResult === "boolean") {
        return twoArgResult;
      }
    } catch {
      // fallback below
    }
  }

  return canAccessByPlanLevel(requiredPlan, userPlanType);
};

function GuardScreen({
  badge = "CLASSROOM",
  title = "Classroom unavailable",
  message = "",
  primaryLabel = "Back to Classes",
  onPrimary,
  secondaryLabel = "",
  onSecondary,
}) {
  return (
    <section className="coursePages videoLibraryPage">
      <div className="sectionHeader">
        <span className="badge">{badge}</span>

        <h1>{title}</h1>

        {message && <p>{message}</p>}
      </div>

      <div className="contentStudioForm">
        <div className="contentStudioActions">
          <button className="publishButton" onClick={onPrimary}>
            {primaryLabel}
          </button>

          {secondaryLabel && (
            <button className="backButton" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default function VideoAccessGuard({
  item,
  user,
  userPlanType = "FREE",
  isAdmin = false,
  hasPlanAccess,
  children,
}) {
  const navigate = useNavigate();

  if (!item || !isVideoContentItem(item)) {
    return (
      <GuardScreen
        badge="CLASS NOT FOUND"
        title="This classroom item was not found"
        message="The class may be unpublished, deleted, or the link may be incorrect."
        primaryLabel="Back to Classes"
        onPrimary={() => navigate("/ctet-tet/videos")}
        secondaryLabel="CTET/TET Hub"
        onSecondary={() => navigate("/ctet-tet")}
      />
    );
  }

  const status = normalizeVideoStatus(item.status);

  if (!isAdmin && status !== "published") {
    return (
      <GuardScreen
        badge="CLASS UNAVAILABLE"
        title="This class is not available right now"
        message="This classroom item is currently draft, unpublished, or archived."
        primaryLabel="Back to Classes"
        onPrimary={() => navigate("/ctet-tet/videos")}
        secondaryLabel="View Plans"
        onSecondary={() => navigate("/ctet-tet/pricing")}
      />
    );
  }

  const requiredPlan = normalizePlanType(item.planType || "FREE");

  if (requiredPlan !== "FREE" && !user && !isAdmin) {
    return (
      <GuardScreen
        badge="LOGIN REQUIRED"
        title="Login required to open this classroom"
        message={`This class requires ${requiredPlan} access. Please login with your student account.`}
        primaryLabel="Login"
        onPrimary={() => navigate("/login")}
        secondaryLabel="View Plans"
        onSecondary={() => navigate("/ctet-tet/pricing")}
      />
    );
  }

  const hasAccess = isAdmin
    ? true
    : resolvePlanAccess({
        requiredPlan,
        userPlanType,
        hasPlanAccess,
      });

  if (!hasAccess) {
    return (
      <GuardScreen
        badge="PLAN LOCKED"
        title={`${requiredPlan} classroom access required`}
        message="Upgrade your plan to open this class, live session, or replay."
        primaryLabel="View Plans"
        onPrimary={() => navigate("/ctet-tet/pricing")}
        secondaryLabel="Back to Classes"
        onSecondary={() => navigate("/ctet-tet/videos")}
      />
    );
  }

  return children;
}