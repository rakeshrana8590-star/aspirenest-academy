import React from "react";

export default function StudentCurrentAffairsEmptyState({
  title = "No current affairs found",
  text = "Published current affairs PDFs will appear here.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="studentCaEmptyState">
      <div className="studentCaEmptyIcon">📰</div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

      {actionLabel && typeof onAction === "function" && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}