import React from "react";
import ExperienceBadge from "./ExperienceBadge.jsx";

export default function ExperienceSectionHeader({
  badge,
  title,
  description,
  align = "center",
  actions = null,
  className = "",
}) {
  return (
    <div
      className={`experienceSectionHeader experienceSectionHeader--${align} ${className}`.trim()}
    >
      <div>
        {badge ? <ExperienceBadge tone="soft">{badge}</ExperienceBadge> : null}

        {title ? <h2>{title}</h2> : null}

        {description ? <p>{description}</p> : null}
      </div>

      {actions ? <div className="experienceSectionActions">{actions}</div> : null}
    </div>
  );
}
