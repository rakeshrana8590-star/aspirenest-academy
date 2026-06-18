import React from "react";

import SecureVideoPlayer from "./SecureVideoPlayer.jsx";

import {
  getClassroomSourceUrl,
  getLiveClassStatus,
  getLiveStatusClassName,
  getLiveStatusLabel,
  LIVE_CLASS_STATUS,
} from "./videoUtils.js";

const getScheduleLine = (item = {}) => {
  const startDate = item.liveStartDate || "Date not set";
  const startTime = item.liveStartTime || "Time not set";
  const endDate = item.liveEndDate || item.liveStartDate || "";
  const endTime = item.liveEndTime || "";

  if (endDate || endTime) {
    return `${startDate} ${startTime} — ${endDate} ${endTime}`.trim();
  }

  return `${startDate} • ${startTime}`;
};

const getLivePanelMessage = ({ status, hasReplay }) => {
  if (status === LIVE_CLASS_STATUS.UPCOMING) {
    return {
      title: "Classroom will open at the scheduled time",
      text: "Join access stays locked before the live window. Students can see the schedule and instructions here.",
    };
  }

  if (status === LIVE_CLASS_STATUS.ENDED && !hasReplay) {
    return {
      title: "Live class has ended",
      text: "Replay is not available yet. Add a replay URL from admin when the recording is ready.",
    };
  }

  if (status === LIVE_CLASS_STATUS.CANCELLED) {
    return {
      title: "This live class is cancelled",
      text: "Students can still see the class update and instructions. Join access is disabled for cancelled classes.",
    };
  }

  if (status === LIVE_CLASS_STATUS.NOT_SCHEDULED) {
    return {
      title: "Schedule is pending",
      text: "Start date and time are not connected yet. Add schedule details from admin to open this classroom properly.",
    };
  }

  return {
    title: "Classroom source not available",
    text: "Add a join URL or replay URL from admin to enable classroom access.",
  };
};

export default function LiveClassPanel({ item }) {
  if (!item) return null;

  const liveStatus = getLiveClassStatus(item);
  const liveLabel = getLiveStatusLabel(liveStatus);
  const liveStatusClassName = getLiveStatusClassName(liveStatus);

  const classroomSource = getClassroomSourceUrl(item);
  const replaySource = item.replayUrl || "";
  const joinSource = item.joinUrl || item.videoUrl || "";

  const canJoin =
    liveStatus === LIVE_CLASS_STATUS.JOIN_NOW && Boolean(joinSource);

  const canReplay =
    liveStatus === LIVE_CLASS_STATUS.REPLAY_AVAILABLE &&
    Boolean(replaySource);

  const shouldShowPlayer = Boolean(classroomSource) && (canJoin || canReplay);

  const emptyState = getLivePanelMessage({
    status: liveStatus,
    hasReplay: Boolean(replaySource),
  });

  return (
    <div className={`liveClassPanel ${liveStatusClassName}`}>
      <div className="liveClassPanelTop">
        <span className={`liveStatusPill ${liveStatusClassName}`}>
          {liveLabel}
        </span>

        <span className="livePlatformPill">
          {item.livePlatform || item.sourceType || "Classroom"}
        </span>
      </div>

      <h3>{item.title || "Live Class"}</h3>

      <div className="liveClassTimingCard">
        <strong>{getScheduleLine(item)}</strong>

        <span>
          Mentor: {item.mentorName || "AspireNest Mentor"} • Plan:{" "}
          {item.planType || "FREE"}
        </span>
      </div>

      {item.liveInstructions && (
        <div className="liveInstructionBox">
          <strong>Class Instructions</strong>

          <p>{item.liveInstructions}</p>
        </div>
      )}

      {shouldShowPlayer ? (
        <div className="liveClassPlayerWrap">
          <SecureVideoPlayer
            sourceUrl={classroomSource}
            title={
              canReplay
                ? `${item.title || "AspireNest Class"} Replay`
                : item.title || "AspireNest Live Class"
            }
          />
        </div>
      ) : (
        <div className="classroomInfoCard liveClassStateCard">
          <h3>{emptyState.title}</h3>

          <p>{emptyState.text}</p>
        </div>
      )}

      <div className="contentStudioActions liveClassPanelActions">
        {canJoin && (
          <button
            className="publishButton"
            onClick={() =>
              window.open(joinSource, "_blank", "noopener,noreferrer")
            }
          >
            Join Live Class →
          </button>
        )}

        {canReplay && (
          <button
            className="publishButton"
            onClick={() =>
              window.open(replaySource, "_blank", "noopener,noreferrer")
            }
          >
            Open Replay →
          </button>
        )}

        {!canJoin && !canReplay && replaySource && (
          <button
            className="backButton"
            onClick={() =>
              window.open(replaySource, "_blank", "noopener,noreferrer")
            }
          >
            Open Replay Link →
          </button>
        )}
      </div>
    </div>
  );
}