import React from "react";

export default function ExperienceCard({
  eyebrow,
  title,
  text,
  icon,
  meta,
  actionLabel,
  onClick,
  href,
  children,
  tone = "default",
  className = "",
}) {
  const Tag = href ? "a" : onClick ? "button" : "article";
  const actionProps = href
    ? { href }
    : onClick
      ? { type: "button", onClick }
      : {};

  return (
    <Tag
      className={`experienceCard experienceCard--${tone} ${className}`.trim()}
      {...actionProps}
    >
      <div className="experienceCardTop">
        {icon ? <div className="experienceCardIcon">{icon}</div> : null}
        {eyebrow ? <span>{eyebrow}</span> : null}
      </div>

      {title ? <h3>{title}</h3> : null}
      {text ? <p>{text}</p> : null}

      {meta ? <div className="experienceCardMeta">{meta}</div> : null}
      {children}

      {actionLabel ? (
        <div className="experienceCardAction">
          {actionLabel}
          <span aria-hidden="true">→</span>
        </div>
      ) : null}
    </Tag>
  );
}
