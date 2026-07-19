import React from "react";

import {
  formatIntelliTextRevisionDueLabel,
} from "../../../access/intelliTextRevisionScheduler";

const timestampDate = (value) => {
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  return value instanceof Date ? value : null;
};

const displayDate = (value) => {
  const date = timestampDate(value);

  return date
    ? date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Private";
};

export default function IntelliTextRevisionQueue({
  items = [],
  now,
  busy = false,
  emptyTitle = "No revision items here.",
  emptyText = "Create a flashcard or add selected text to revision.",
  onDelete,
  onOpenSource,
  onStateChange,
}) {
  if (items.length === 0) {
    return (
      <section className="intelliTextRevisionEmpty">
        <span>REVISION QUEUE</span>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </section>
    );
  }

  return (
    <section className="intelliTextRevisionList">
      {items.map((item) => (
        <article key={item.revisionId} className="intelliTextRevisionItem">
          <div className="intelliTextRevisionItemMain">
            <span>
              {item.state === "ACTIVE"
                ? formatIntelliTextRevisionDueLabel(item.dueAt, now)
                : item.state}
            </span>
            <h3>{item.prompt}</h3>
            <p>{item.answer}</p>
            <small>
              {item.noteTitle || "Private snapshot"}
              {" • "}
              {displayDate(item.updatedAt || item.createdAt)}
            </small>
          </div>

          <div className="intelliTextRevisionItemActions">
            {item.textbookId && item.textbookId !== "manual_workspace" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpenSource?.(item)}
              >
                Source
              </button>
            ) : null}

            {item.state === "ACTIVE" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStateChange?.(item, "PAUSED")}
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStateChange?.(item, "ACTIVE")}
              >
                Resume
              </button>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete?.(item)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
