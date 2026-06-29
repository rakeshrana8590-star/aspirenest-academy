import React from "react";

export default function ExperienceEmptyState({
  title = "Nothing to show yet",
  description = "New activity will appear here when it is published.",
  action = null,
  className = "",
}) {
  return (
    <div className={`experienceEmptyState ${className}`.trim()}>
      <div className="experienceEmptyGlow" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="experienceEmptyAction">{action}</div> : null}
    </div>
  );
}
