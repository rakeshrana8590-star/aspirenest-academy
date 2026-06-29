import React from "react";

export default function ExperienceHero({
  badge,
  tagline,
  taglineText,
  title,
  description,
  actions = [],
  stats = [],
  quickCard = null,
  className = "",
}) {
  return (
    <section className={`experienceHero ${className}`.trim()}>
      <div className="experienceHeroContent">
        {tagline ? (
          <div className="experienceHeroTagline">
            <div className="experienceHeroTaglineIcon">🏆</div>
            <div>
              <h3>{tagline}</h3>
              {taglineText ? <p>{taglineText}</p> : null}
            </div>
          </div>
        ) : null}

        {badge ? <span className="experienceHeroBadge">{badge}</span> : null}

        {title ? <h1>{title}</h1> : null}
        {description ? <p className="experienceHeroText">{description}</p> : null}

        {actions.length ? (
          <div className="experienceHeroActions">
            {actions.map((action, index) => (
              <button
                type="button"
                key={action.label || index}
                className={action.variant === "primary" ? "isPrimary" : ""}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}

        {stats.length ? (
          <div className="experienceHeroStats">
            {stats.map((stat) => (
              <div className="experienceHeroStat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {quickCard ? <div className="experienceHeroPanel">{quickCard}</div> : null}
    </section>
  );
}
