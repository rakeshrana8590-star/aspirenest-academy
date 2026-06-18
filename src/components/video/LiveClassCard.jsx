import React from "react";

import {
  getLiveClassStatus,
  getLiveStatusClassName,
  getLiveStatusLabel,
  LIVE_CLASS_STATUS,
} from "./videoUtils.js";

const getLiveActionLabel = (status) => {
  if (status === LIVE_CLASS_STATUS.JOIN_NOW) return "Join Live Classroom →";
  if (status === LIVE_CLASS_STATUS.REPLAY_AVAILABLE) return "Watch Replay →";
  if (status === LIVE_CLASS_STATUS.UPCOMING) return "View Schedule →";
  if (status === LIVE_CLASS_STATUS.ENDED) return "View Class Details →";
  if (status === LIVE_CLASS_STATUS.CANCELLED) return "View Update →";

  return "Open Live Classroom →";
};

const getScheduleLine = (item = {}) => {
  const startDate = item.liveStartDate || "Date not set";
  const startTime = item.liveStartTime || "Time not set";

  if (item.liveEndDate || item.liveEndTime) {
    return `${startDate} ${startTime} — ${
      item.liveEndDate || item.liveStartDate || ""
    } ${item.liveEndTime || ""}`.trim();
  }

  return `${startDate} • ${startTime}`;
};

export default function LiveClassCard({ item, onOpen }) {
  if (!item) return null;

  const liveStatus = getLiveClassStatus(item);
  const liveLabel = getLiveStatusLabel(liveStatus);
  const liveStatusClassName = getLiveStatusClassName(liveStatus);

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
        {item.replayUrl && <span>Replay Linked</span>}
      </div>

      <div className="videoCardActions">
        <button className="publishButton" onClick={() => onOpen?.(item)}>
          {getLiveActionLabel(liveStatus)}
        </button>
      </div>
    </article>
  );
}