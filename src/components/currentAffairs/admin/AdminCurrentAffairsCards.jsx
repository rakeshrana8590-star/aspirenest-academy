import React from "react";

export function AdminCaActionCard({
  icon,
  title,
  text,
  count,
  label,
  actionLabel,
  onClick,
}) {
  return (
    <button type="button" className="adminCaActionCard" onClick={onClick}>
      <div className="adminCaActionTop">
        <span className="adminCaActionIcon">{icon}</span>
        <span className="adminCaActionCount">{count}</span>
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

      <div className="adminCaActionFooter">
        <span>{label}</span>
        <strong>{actionLabel}</strong>
      </div>
    </button>
  );
}

export function AdminCaKpiCard({ label, value, text }) {
  return (
    <div className="adminCaKpiCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}