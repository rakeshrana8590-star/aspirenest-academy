import React from "react";

export default function ExperienceResourceGrid({
  badge,
  title,
  description,
  resources = [],
  className = "",
}) {
  return (
    <section className={`experienceResourceGridSection ${className}`.trim()}>
      <div className="experienceResourceHeader">
        {badge ? <span>{badge}</span> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>

      <div className="experienceResourceGrid">
        {resources.map((resource) => (
          <button
            type="button"
            className="experienceResourceCard"
            key={resource.title}
            onClick={resource.onClick}
          >
            <span>{resource.icon}</span>
            <h3>{resource.title}</h3>
            <p>{resource.text}</p>
            <strong>Open →</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
