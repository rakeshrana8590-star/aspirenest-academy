import React from "react";

const formatDue = (value, now) => {
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
      ? value
      : new Date(value || 0);

  if (Number.isNaN(date.getTime())) return "Retry date unavailable";

  const difference = date.getTime() - now.getTime();

  if (difference <= 0) return "Retry due now";

  const days = Math.max(1, Math.ceil(difference / (24 * 60 * 60 * 1000)));
  return `Retry in ${days} day${days === 1 ? "" : "s"}`;
};

export default function IntelliTextMistakeBook({
  busy = false,
  items = [],
  now = new Date(),
  onOpenExactSection,
  onOpenReview,
  onStateChange,
}) {
  if (!items.length) {
    return (
      <section className="intelliTextMasteryEmpty">
        <span>MISTAKE BOOK</span>
        <h3>No wrong or skipped questions yet.</h3>
        <p>
          Owned submitted mock results will add identifiers and private learning
          metadata here without copying protected question or answer content.
        </p>
      </section>
    );
  }

  return (
    <section className="intelliTextMistakeBook" aria-label="Private mistake book">
      {items.map((item) => (
        <article key={item.mistakeId || item.id}>
          <header>
            <div>
              <span>{item.sourceKind === "UNANSWERED" ? "SKIPPED" : "WRONG"}</span>
              <h3>{item.conceptLabel || item.chapter || "Unmapped question"}</h3>
            </div>
            <strong>{item.state || "OPEN"}</strong>
          </header>

          <dl>
            <div>
              <dt>Test</dt>
              <dd>{item.testTitle || item.testId}</dd>
            </div>
            <div>
              <dt>Question</dt>
              <dd>#{Number(item.questionIndex || 0) + 1}</dd>
            </div>
            <div>
              <dt>Retry</dt>
              <dd>{formatDue(item.retryDueAt, now)}</dd>
            </div>
            <div>
              <dt>Seen</dt>
              <dd>{item.occurrenceCount || 1} time(s)</dd>
            </div>
          </dl>

          <p className="intelliTextMistakePrivacyNote">
            Protected question text, options, answers, and explanation are not
            stored in this private learning record.
          </p>

          <footer>
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpenReview?.(item)}
            >
              Open authorized review
            </button>

            <button
              type="button"
              className="isSecondary"
              disabled={busy || !item.textbookId || !item.blockId}
              onClick={() => onOpenExactSection?.(item)}
            >
              Study exact section
            </button>

            {item.state !== "RESOLVED" ? (
              <button
                type="button"
                className="isSecondary"
                disabled={busy}
                onClick={() => onStateChange?.(item, "RESOLVED")}
              >
                Mark resolved
              </button>
            ) : (
              <button
                type="button"
                className="isSecondary"
                disabled={busy}
                onClick={() => onStateChange?.(item, "OPEN")}
              >
                Reopen
              </button>
            )}
          </footer>
        </article>
      ))}
    </section>
  );
}
