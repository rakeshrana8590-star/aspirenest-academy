import React from "react";
import { useNavigate } from "react-router-dom";

import {
  isVideoContentItem,
  normalizePlanType,
  normalizeVideoStatus,
} from "./videoUtils.js";

const resolvePlanAccess = ({
  requiredPlan,
  hasPlanAccess,
  accessOptions = {},
}) => {
  const normalizedRequiredPlan = normalizePlanType(requiredPlan);

  if (normalizedRequiredPlan === "FREE") return true;

  if (typeof hasPlanAccess !== "function") return false;

  return Boolean(
    hasPlanAccess(normalizedRequiredPlan, accessOptions)
  );
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
    <section className="coursePages studentClassroomPage studentClassroomCinemaPage">
      <div className="studentClassroomShell">
        <section className="studentClassroomStateCard">
          <span>{badge}</span>

          <h1>{title}</h1>

          {message && <p>{message}</p>}

          <div className="studentClassroomStateActions">
            <button
              type="button"
              className="studentVideoPrimaryButton"
              onClick={onPrimary}
            >
              {primaryLabel}
            </button>

            {secondaryLabel && (
              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={onSecondary}
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export default function VideoAccessGuard({
  item,
  user,
  isAdmin = false,
  hasPlanAccess,
  isLoading = false,
  children,
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <GuardScreen
        badge="PREPARING CLASSROOM"
        title="Loading classroom"
        message="AspireNest is preparing this classroom. If it does not open, reload or go back to Classes & Recordings."
        primaryLabel="Reload Classroom"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Classes"
        onSecondary={() => navigate("/ctet-tet/videos")}
      />
    );
  }

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

  if (!user && !isAdmin) {
    return (
      <GuardScreen
        badge="LOGIN REQUIRED"
        title="Login required to open this classroom"
        message={`Please login with your student account to open this ${requiredPlan} classroom.`}
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
        hasPlanAccess,
        accessOptions: {
          module: "video",
          itemType: "video",
          itemId: item.id,
        },
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