import React from "react";

export default function StudentNotesEmptyState({ title, text }) {
  return (
    <div className="studentNotesEmptyState">
      <span>📘</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}