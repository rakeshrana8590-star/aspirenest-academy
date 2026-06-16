import React from "react";
import { getLiveClassStatus, getLiveStatusLabel } from "./videoUtils.js";

export default function LiveClassCard({ item, onOpen }) {
  if (!item) return null;

  const liveStatus = getLiveClassStatus(item);
  const liveLabel = getLiveStatusLabel(liveStatus);

  return (
    <article className="liveClassCard">
      <div className="videoCardTopIcon">🔴</div>

      <div>
        <h3>{item.title || "Live Class"}</h3>

        <p>
          {item.subject || "Subject"} • {item.chapter || "Chapter"}
        </p>
      </div>

      <div className="videoCardMetaRow">
        <span>{item.planType || "FREE"}</span>
        <span>{liveLabel}</span>
        <span>
          {item.liveStartDate || "Date not set"}{" "}
          {item.liveStartTime || ""}
        </span>
      </div>

      <div className="videoCardActions">
        <button className="publishButton" onClick={() => onOpen?.(item)}>
          Open Live Classroom →
        </button>
      </div>
    </article>
  );
}