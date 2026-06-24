import React from "react";
import AdminButton from "./AdminButton";

export default function AdminEmptyState({
  eyebrow = "No records",
  title = "Nothing found",
  description = "There is no data to show right now.",
  actionLabel,
  onAction,
  icon = "∅",
}) {
  return (
    <div className="adminEmptyState">
      <div className="adminEmptyStateIcon">{icon}</div>
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>

      {actionLabel && onAction ? (
        <AdminButton variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      ) : null}
    </div>
  );
}
