import React from "react";
import ExperienceBadge from "./ExperienceBadge.jsx";

export default function ExperienceTimeline({
  items = [],
  emptyText = "Schedule will appear here soon.",
  className = "",
}) {
  if (!items.length) {
    return <div className={`experienceTimelineEmpty ${className}`.trim()}>{emptyText}</div>;
  }

  return (
    <div className={`experienceTimeline ${className}`.trim()}>
      {items.map((item, index) => (
        <article className="experienceTimelineItem" key={item.id || item.title || index}>
          <div className="experienceTimelineDot" />

          <div className="experienceTimelineBody">
            <div className="experienceTimelineTop">
              {item.time ? <strong>{item.time}</strong> : null}
              {item.badge ? <ExperienceBadge tone={item.tone || "soft"}>{item.badge}</ExperienceBadge> : null}
            </div>

            {item.title ? <h3>{item.title}</h3> : null}
            {item.description ? <p>{item.description}</p> : null}
            {item.meta ? <span>{item.meta}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
