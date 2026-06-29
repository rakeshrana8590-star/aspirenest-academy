import React from "react";
import ExperienceBadge from "./ExperienceBadge.jsx";

export default function ExperienceRibbon({
  badge = "Live Update",
  title,
  description,
  meta,
  actionLabel,
  onAction,
  tone = "default",
  className = "",
}) {
  return (
    <section className={`experienceRibbon experienceRibbon--${tone} ${className}`.trim()}>
      <div className="experienceRibbonPulse" />

      <div className="experienceRibbonContent">
        <ExperienceBadge tone={tone === "live" ? "live" : "soft"}>{badge}</ExperienceBadge>

        <div>
          {title ? <h3>{title}</h3> : null}
          {description ? <p>{description}</p> : null}
          {meta ? <span className="experienceRibbonMeta">{meta}</span> : null}
        </div>
      </div>

      {actionLabel ? (
        <button type="button" className="experienceRibbonAction" onClick={onAction}>
          {actionLabel}
          <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </section>
  );
}
