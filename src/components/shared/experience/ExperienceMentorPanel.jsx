import React from "react";

export default function ExperienceMentorPanel({
  id,
  badge,
  title,
  description,
  stats = [],
  quote,
  actions = [],
  profileTitle,
  profileSubtitle,
  avatar = "VM",
  highlights = [],
  className = "",
}) {
  return (
    <section id={id} className={`experienceMentorPanel ${className}`.trim()}>
      <div className="experienceMentorContent">
        {badge ? <span className="experienceMentorBadge">{badge}</span> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p className="experienceMentorText">{description}</p> : null}

        {stats.length ? (
          <div className="experienceMentorStats">
            {stats.map((stat) => (
              <div className="experienceMentorStat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {quote ? <div className="experienceMentorQuote">{quote}</div> : null}

        {actions.length ? (
          <div className="experienceMentorActions">
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
      </div>

      <div className="experienceMentorCard">
        <div className="experienceMentorCardTop">
          <div className="experienceMentorAvatar">{avatar}</div>
          <div>
            {profileTitle ? <h3>{profileTitle}</h3> : null}
            {profileSubtitle ? <p>{profileSubtitle}</p> : null}
          </div>
        </div>

        <div className="experienceMentorHighlights">
          {highlights.map((item) => (
            <div className="experienceMentorHighlight" key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
