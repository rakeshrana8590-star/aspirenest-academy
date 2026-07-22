import React from "react";
import { useNavigate } from "react-router-dom";

import {
  VIDEO_ACTIONS,
  VIDEO_REASON_CODES,
  buildVideoActionDecision,
  getVideoRequiredPlan,
} from "../../access/videoActionPolicy.js";
import {
  LIVE_CLASS_STATUS,
  getLiveClassStatus,
  isLiveClass,
  normalizePlanType,
} from "./videoUtils.js";

const resolvePlanAccess = ({
  requiredPlan,
  hasPlanAccess,
  itemId = "",
}) => {
  const normalizedRequiredPlan =
    normalizePlanType(requiredPlan);

  if (normalizedRequiredPlan === "FREE") return true;
  if (typeof hasPlanAccess !== "function") {
    return false;
  }

  return Boolean(
    hasPlanAccess(normalizedRequiredPlan, {
      module: "video",
      itemType: "video",
      itemId,
    })
  );
};

export function VideoGuardScreen({
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

const buildAccessEvidence = ({
  item,
  user,
  isAdmin,
  hasPlanAccess,
  accessState,
  isLoading,
}) => {
  const itemId = String(
    item?.id ||
      item?.videoId ||
      item?.classId ||
      ""
  );
  const requiredPlan = getVideoRequiredPlan(
    item || {}
  );

  if (isLoading || accessState?.loading) {
    return {
      status: "loading",
      sourceScope: "resolved",
      resourceId: itemId,
      resolvedForResource: false,
    };
  }

  if (
    accessState?.error ||
    accessState?.isAccessCheckUnavailable
  ) {
    return {
      status: "error",
      sourceScope: "resolved",
      resourceId: itemId,
      resolvedForResource: false,
    };
  }

  if (isAdmin) {
    return {
      status: "allowed",
      sourceScope: "admin",
      resourceId: itemId,
      resolvedForResource: true,
    };
  }

  if (!user) {
    return {
      status: "denied",
      sourceScope: "resolved",
      resourceId: itemId,
      resolvedForResource: false,
    };
  }

  const allowed = resolvePlanAccess({
    requiredPlan,
    hasPlanAccess,
    itemId,
  });

  return {
    status: allowed ? "allowed" : "denied",
    sourceScope: "resolved",
    module: "video",
    itemType: "video",
    resourceId: itemId,
    resolvedForResource: allowed,
  };
};

const getLivePlaybackAction = (
  item = null,
  liveStatus = ""
) => {
  if (!item || !isLiveClass(item)) return "";

  if (liveStatus === LIVE_CLASS_STATUS.JOIN_NOW) {
    return VIDEO_ACTIONS.JOIN_LIVE;
  }

  if (
    liveStatus ===
    LIVE_CLASS_STATUS.REPLAY_AVAILABLE
  ) {
    return VIDEO_ACTIONS.WATCH_REPLAY;
  }

  return "";
};

export default function VideoAccessGuard({
  item,
  user,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
  isLoading = false,
  children,
}) {
  const navigate = useNavigate();

  const access = buildAccessEvidence({
    item,
    user,
    isAdmin,
    hasPlanAccess,
    accessState,
    isLoading,
  });

  const principal = {
    uid: user?.uid || "",
    email: user?.email || "",
    role: user?.role || "",
    isAuthenticated: Boolean(user),
    isAdmin,
  };

  const watchDecision = buildVideoActionDecision({
    action: VIDEO_ACTIONS.WATCH,
    video: item,
    principal,
    access,
  });

  const liveStatus =
    item && isLiveClass(item)
      ? getLiveClassStatus(item)
      : "";

  const livePlaybackAction =
    getLivePlaybackAction(item, liveStatus);

  const liveActionDecision = livePlaybackAction
    ? buildVideoActionDecision({
        action: livePlaybackAction,
        video: item,
        principal,
        access,
        liveStatus,
      })
    : null;

  if (
    watchDecision.reason ===
    VIDEO_REASON_CODES.ACCESS_LOADING
  ) {
    return (
      <VideoGuardScreen
        badge="PREPARING CLASSROOM"
        title="Loading classroom access"
        message="AspireNest is verifying this classroom and its protected source. The class will not open until the access decision is complete."
        primaryLabel="Reload Classroom"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Classes"
        onSecondary={() =>
          navigate("/ctet-tet/videos")
        }
      />
    );
  }

  if (
    watchDecision.reason ===
      VIDEO_REASON_CODES.NOT_FOUND ||
    watchDecision.reason ===
      VIDEO_REASON_CODES.NOT_VIDEO
  ) {
    return (
      <VideoGuardScreen
        badge="CLASS NOT FOUND"
        title="This classroom item was not found"
        message="The class may be unpublished, deleted, or the link may be incorrect."
        primaryLabel="Back to Classes"
        onPrimary={() =>
          navigate("/ctet-tet/videos")
        }
        secondaryLabel="CTET/TET Hub"
        onSecondary={() => navigate("/ctet-tet")}
      />
    );
  }

  if (
    watchDecision.reason ===
    VIDEO_REASON_CODES.UNPUBLISHED
  ) {
    return (
      <VideoGuardScreen
        badge="CLASS UNAVAILABLE"
        title="This class is not available right now"
        message="This classroom item is currently draft, unpublished, or archived."
        primaryLabel="Back to Classes"
        onPrimary={() =>
          navigate("/ctet-tet/videos")
        }
        secondaryLabel="View Plans"
        onSecondary={() =>
          navigate("/ctet-tet/pricing")
        }
      />
    );
  }

  if (
    watchDecision.reason ===
    VIDEO_REASON_CODES.LOGIN_REQUIRED
  ) {
    return (
      <VideoGuardScreen
        badge="LOGIN REQUIRED"
        title="Login required to open this classroom"
        message={`Please login with your student account to open this ${watchDecision.requiredPlan} classroom.`}
        primaryLabel="Login"
        onPrimary={() => navigate("/login")}
        secondaryLabel="View Plans"
        onSecondary={() =>
          navigate("/ctet-tet/pricing")
        }
      />
    );
  }

  if (
    watchDecision.reason ===
    VIDEO_REASON_CODES.ACCESS_ERROR
  ) {
    return (
      <VideoGuardScreen
        badge="ACCESS UNAVAILABLE"
        title="Classroom access could not be verified"
        message="AspireNest kept this protected class closed because the access check was unavailable. Reload or contact support if the issue continues."
        primaryLabel="Reload Classroom"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Classes"
        onSecondary={() =>
          navigate("/ctet-tet/videos")
        }
      />
    );
  }

  if (!watchDecision.allowed) {
    return (
      <VideoGuardScreen
        badge="ACCESS LOCKED"
        title={`${watchDecision.requiredPlan} classroom access required`}
        message="This exact class is not included in the currently verified plan, module, bundle, or item access."
        primaryLabel="View Plans"
        onPrimary={() =>
          navigate("/ctet-tet/pricing")
        }
        secondaryLabel="Back to Classes"
        onSecondary={() =>
          navigate("/ctet-tet/videos")
        }
      />
    );
  }

  return typeof children === "function"
    ? children({
        watchDecision,
        liveActionDecision,
        liveStatus,
      })
    : children;
}
