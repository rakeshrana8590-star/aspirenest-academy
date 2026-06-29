import React from "react";

export default function ExperienceFeatureShowcase({
  id,
  badge,
  title,
  description,
  features = [],
  actionLabel,
  onAction,
  cardTitle,
  progressLabel,
  progressValue,
  miniCards = [],
  className = "",
}) {
  return (
    <section id={id} className={`experienceFeatureShowcase ${className}`.trim()}>
      <div className="experienceFeatureContent">
        {badge ? <span className="experienceFeatureBadge">{badge}</span> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}

        {features.length ? (
          <div className="experienceFeatureList">
            {features.map((feature) => (
              <div className="experienceFeatureItem" key={feature}>{feature}</div>
            ))}
          </div>
        ) : null}

        {actionLabel ? (
          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="experienceFeatureCard">
        <div className="experienceFeatureGlow"></div>
        {cardTitle ? <h3>{cardTitle}</h3> : null}

        {progressLabel || progressValue ? (
          <div className="experienceFeatureProgress">
            {progressLabel ? <span>{progressLabel}</span> : null}
            {progressValue ? <strong>{progressValue}</strong> : null}
          </div>
        ) : null}

        {progressValue ? (
          <div className="experienceFeatureBar">
            <div style={{ width: progressValue }}></div>
          </div>
        ) : null}

        <div className="experienceFeatureMiniGrid">
          {miniCards.map((item) => (
            <div className="experienceFeatureMiniCard" key={item}>{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
