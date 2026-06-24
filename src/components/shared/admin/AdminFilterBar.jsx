import React from "react";

export function AdminFilterField({
  label,
  hint,
  children,
  className = "",
}) {
  const classes = ["adminFilterField", className].filter(Boolean).join(" ");

  return (
    <label className={classes}>
      {label ? <span className="adminFilterLabel">{label}</span> : null}
      {children}
      {hint ? <small className="adminFilterHint">{hint}</small> : null}
    </label>
  );
}

export default function AdminFilterBar({
  eyebrow = "Filters",
  title = "Manage Controls",
  description = "",
  rightSlot,
  footerSlot,
  children,
  className = "",
}) {
  const classes = ["adminFilterBar", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="adminFilterBarHeader">
        <div>
          {eyebrow ? <span className="adminFilterEyebrow">{eyebrow}</span> : null}
          {title ? <h3>{title}</h3> : null}
          {description ? <p>{description}</p> : null}
        </div>

        {rightSlot ? <div className="adminFilterBarRight">{rightSlot}</div> : null}
      </div>

      <div className="adminFilterBarGrid">{children}</div>

      {footerSlot ? <div className="adminFilterBarFooter">{footerSlot}</div> : null}
    </section>
  );
}
