import React from "react";

import {
  getClassroomSourceUrl,
  getLiveClassStatus,
  getLiveStatusClassName,
  getLiveStatusLabel,
  LIVE_CLASS_STATUS,
} from "./videoUtils.js";

const getLiveActionLabel = (status = "") => {
  if (status === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Live Classroom →";
  if (status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Watch Replay →";
  if (status === LIVE_CLASS_STATUS.UPCOMING) return "View Schedule →";
  if (status === LIVE_CLASS_STATUS.ENDED) return "Replay Pending →";
  if (status === LIVE_CLASS_STATUS.CANCELLED) return "View Update →";
  if (status === LIVE_CLASS_STATUS.NOT_SCHEDULED) return "Schedule Pending →";

  return "Open Classroom →";
};

const getScheduleLine = (item = {}) => {
  const startDate = item.liveStartDate || item.startDate || item.classDate || "";
  const startTime = item.liveStartTime || item.startTime || "";
  const endDate =
    item.liveEndDate || item.endDate || item.liveStartDate || item.startDate || "";
  const endTime = item.liveEndTime || item.endTime || "";

  if (!startDate && !startTime) return "Schedule pending";

  if (startDate && startTime && endDate && endTime && endDate !== startDate) {
    return `${startDate} • ${startTime} — ${endDate} • ${endTime}`;
  }

  if (startDate && startTime && endTime) {
    return `${startDate} • ${startTime} — ${endTime}`;
  }

  if (startDate && startTime) {
    return `${startDate} • ${startTime}`;
  }

  return startDate || startTime || "Schedule pending";
};

const getStatusHint = ({ status, item, classroomSource }) => {
  if (status === LIVE_CLASS_STATUS.JOIN_NOW) {
    return classroomSource
      ? "Live access is open now."
      : "Live window is active, but join link is not connected.";
  }

  if (status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) {
    return "Replay is connected for revision.";
  }

  if (status === LIVE_CLASS_STATUS.UPCOMING) {
    return "Classroom will open at scheduled time.";
  }

  if (status === LIVE_CLASS_STATUS.ENDED) {
    return item.replayUrl || item.recordingUrl
      ? "Replay source is connected."
      : "Class ended. Replay will appear after admin adds recording.";
  }

  if (status === LIVE_CLASS_STATUS.CANCELLED) {
    return item.liveInstructions || "Class cancelled. Check admin update.";
  }

  if (status === LIVE_CLASS_STATUS.NOT_SCHEDULED) {
    return "Admin has not connected schedule yet.";
  }

  return "Open classroom details.";
};

export default function LiveClassCard({ item, onOpen }) {
  if (!item) return null;

  const liveStatus = getLiveClassStatus(item);
  const liveLabel = getLiveStatusLabel(liveStatus);
  const liveStatusClassName = getLiveStatusClassName(liveStatus);
  const classroomSource = getClassroomSourceUrl(item);

  return (
    <article className={`liveClassCard ${liveStatusClassName}`}>
      <div className="liveClassCardHeader">
        <div className="videoCardTopIcon">🔴</div>

        <span className={`liveCardStatusPill ${liveStatusClassName}`}>
          {liveLabel}
        </span>
      </div>

      <div>
        <h3>{item.title || "Live Class"}</h3>

        <p>
          {item.subject || "Subject"} • {item.chapter || "Chapter"}
        </p>
      </div>

      <div className="liveClassScheduleBox">
        <strong>{getScheduleLine(item)}</strong>

        <span>
          {item.livePlatform || item.sourceType || "AspireNest Live Classroom"}
        </span>
      </div>

      <div className="videoCardMetaRow">
        <span>{item.planType || "FREE"}</span>
        <span>{item.mentorName || "AspireNest Mentor"}</span>
        {classroomSource ? <span>Source Linked</span> : <span>Source Pending</span>}
      </div>

      <p className="videoCardDescription">
        {getStatusHint({ status: liveStatus, item, classroomSource })}
      </p>

      <div className="videoCardActions">
        <button
          type="button"
          className={
            liveStatus === LIVE_CLASS_STATUS.JOIN_NOW ||
            liveStatus === LIVE_CLASS_STATUS.REPLAY_AVAILABLE
              ? "publishButton"
              : "backButton"
          }
          onClick={() => onOpen?.(item)}
        >
          {getLiveActionLabel(liveStatus)}
        </button>
      </div>
    </article>
  );
}