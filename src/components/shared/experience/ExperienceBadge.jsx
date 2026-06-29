import React from "react";

export default function ExperienceBadge({
  children,
  tone = "default",
  className = "",
}) {
  return (
    <span className={`experienceBadge experienceBadge--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}
