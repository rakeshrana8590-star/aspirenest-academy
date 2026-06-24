import React from "react";

export default function AdminSectionHeader({
  eyebrow,
  title,
  description,
  rightSlot,
  children,
}) {
  return (
    <div className="adminSectionHeader">
      <div>
        {eyebrow ? <span className="adminSectionEyebrow">{eyebrow}</span> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
        {children}
      </div>

      {rightSlot ? <div className="adminSectionHeaderRight">{rightSlot}</div> : null}
    </div>
  );
}
