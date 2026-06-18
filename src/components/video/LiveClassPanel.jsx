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
  const startDate = item.liveStartDate || item.startDate || "Date not set";
  const startTime = item.liveStartTime || item.startTime || "Time not set";
  const endDate = item.liveEndDate || item.endDate || item.liveStartDate || "";
  const endTime = item.liveEndTime || item.endTime || "";

  if (endDate && endTime && endDate !== startDate) {
    return `${startDate} • ${startTime} — ${endDate} • ${endTime}`;
  }

  if (endTime) {
    return `${startDate} • ${startTime} — ${endTime}`;
  }

  return `${startDate} • ${startTime}`;
};

const getReplaySource = (item = {}) =>
  item.replayUrl || item.recordingUrl || item.videoUrl || item.fileUrl || "";

const getJoinSource = (item = {}) =>
  item.joinUrl || item.liveUrl || item.meetingUrl || "";

const getPanelMessage = ({ status, hasJoin, hasReplay }) => {
  if (status === LIVE_CLASS_STATUS.JOIN_NOW && !hasJoin) {
    return {
      title: "Join link is not connected",
      text: "This class is inside the live window, but admin has not added a join URL yet.",
    };
  }

  if (status === LIVE_CLASS_STATUS.UPCOMING) {
    return {
      title: "Classroom will open at the scheduled time",
      text: "Students can see the schedule and instructions. Join access opens only during the live class window.",
    };
  }

  if (status === LIVE_CLASS_STATUS.ENDED && !hasReplay) {
    return {
      title: "Live class has ended",
      text: "Replay is not available yet. Add replay URL from admin when the recording is ready.",
    };
  }

  if (status === LIVE_CLASS_STATUS.CANCELLED) {
    return {
      title: "This live class is cancelled",
      text: "Students can still see the update and instructions. Join access stays disabled for cancelled classes.",
    };
  }

  if (status === LIVE_CLASS_STATUS.NOT_SCHEDULED) {
    return {
      title: "Schedule is pending",
      text: "Start date and time are not connected yet. Add schedule details from admin to open this classroom properly.",
    };
  }

  if (!hasReplay && status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
    return {
      title: "Replay source is missing",
      text: "This class is marked replay-ready, but replay URL is not connected yet.",
    };
  }

  return {
    title: "Classroom source not available",
    text: "Add a join URL or replay URL from admin to enable classroom access.",
  };
};

const getActionLabel = (status = "") => {
  if (status === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Live Class →";
  if (status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Open Replay →";
  if (status === LIVE_CLASS_STATUS.ENDED) return "Replay Pending";
  if (status === LIVE_CLASS_STATUS.CANCELLED) return "Cancelled";
  if (status === LIVE_CLASS_STATUS.NOT_SCHEDULED) return "Schedule Pending";

  return "Upcoming";
};

export default function LiveClassPanel({ item, viewerLabel = "" }) {
  if (!item) return null;

  const liveStatus = getLiveClassStatus(item);
  const liveLabel = getLiveStatusLabel(liveStatus);
  const liveStatusClassName = getLiveStatusClassName(liveStatus);

  const classroomSource = getClassroomSourceUrl(item);
  const joinSource = getJoinSource(item);
  const replaySource = getReplaySource(item);

  const canJoin =
    liveStatus === LIVE_CLASS_STATUS.JOIN_NOW &&
    Boolean(joinSource || classroomSource);

  const canReplay =
    liveStatus === LIVE_CLASS_STATUS.REPLAY_AVAILABLE &&
    Boolean(replaySource || classroomSource);

  const actionSource =
    liveStatus === LIVE_CLASS_STATUS.JOIN_NOW
      ? joinSource || classroomSource
      : replaySource || classroomSource;

  const shouldShowPlayer = Boolean(classroomSource) && (canJoin || canReplay);

  const emptyState = getPanelMessage({
    status: liveStatus,
    hasJoin: Boolean(joinSource || classroomSource),
    hasReplay: Boolean(replaySource || classroomSource),
  });

  return (
    <div className={`liveClassPanel ${liveStatusClassName}`}>
      <div className="liveClassPanelTop">
        <span className={`liveStatusPill ${liveStatusClassName}`}>
          {liveLabel}
        </span>

        <span className="livePlatformPill">
          {item.livePlatform || item.sourceType || "AspireNest Classroom"}
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

      {item.liveInstructions ? (
        <div className="liveInstructionBox">
          <strong>Class Instructions</strong>

          <p>{item.liveInstructions}</p>
        </div>
      ) : null}

      {shouldShowPlayer ? (
        <div className="liveClassPlayerWrap">
          <SecureVideoPlayer
            item={item}
            video={item}
            sourceUrl={classroomSource}
            url={classroomSource}
            videoUrl={classroomSource}
            title={
              canReplay
                ? `${item.title || "AspireNest Class"} Replay`
                : item.title || "AspireNest Live Class"
            }
            viewerLabel={viewerLabel}
          />
        </div>
      ) : (
        <div className="classroomInfoCard liveClassStateCard">
          <h3>{emptyState.title}</h3>

          <p>{emptyState.text}</p>
        </div>
      )}

      <div className="contentStudioActions liveClassPanelActions">
        <button
          type="button"
          className={canJoin || canReplay ? "publishButton" : "backButton"}
          onClick={() =>
            actionSource
              ? window.open(actionSource, "_blank", "noopener,noreferrer")
              : null
          }
          disabled={!canJoin && !canReplay}
        >
          {getActionLabel(liveStatus)}
        </button>

        {replaySource && liveStatus !== LIVE_CLASS_STATUS.REPLAY_AVAILABLE ? (
          <button
            type="button"
            className="backButton"
            onClick={() =>
              window.open(replaySource, "_blank", "noopener,noreferrer")
            }
          >
            Open Replay Link →
          </button>
        ) : null}
      </div>
    </div>
  );
}