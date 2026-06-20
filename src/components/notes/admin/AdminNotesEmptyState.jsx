import React from "react";

export default function AdminNotesEmptyState({
  icon = "📘",
  title,
  text,
  action,
}) {
  return (
    <div className="adminNotesEmptyState">
      <span>{icon}</span>

      <h3>{title}</h3>

      <p>{text}</p>

      {action && <div className="adminNotesEmptyAction">{action}</div>}
    </div>
  );
}