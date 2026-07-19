import React from "react";

const stateLabel = (value = "") =>
  String(value)
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

export default function IntelliTextChapterMastery({
  items = [],
  onOpenChapter,
}) {
  if (!items.length) {
    return (
      <section className="intelliTextMasteryEmpty">
        <span>CHAPTER MASTERY</span>
        <h3>No mapped chapter evidence yet.</h3>
        <p>
          Reading, mapped mock practice, and Phase 8B-6 revision completion
          will combine into one private mastery score.
        </p>
      </section>
    );
  }

  return (
    <section className="intelliTextChapterMasteryGrid" aria-label="Chapter mastery">
      {items.map((item) => (
        <article key={item.masteryId || item.id}>
          <header>
            <div>
              <span>CHAPTER MASTERY</span>
              <h3>{item.chapterLabel || item.chapterId}</h3>
            </div>
            <strong>{item.masteryScore}%</strong>
          </header>

          <div className="intelliTextMasteryMeter" aria-label={`${item.masteryScore}% mastery`}>
            <span style={{ width: `${Math.max(0, Math.min(100, item.masteryScore || 0))}%` }} />
          </div>

          <p className={`intelliTextMasteryState is${item.state}`}>
            {stateLabel(item.state)}
          </p>

          <dl>
            <div>
              <dt>Reading</dt>
              <dd>{item.readingScore}%</dd>
            </div>
            <div>
              <dt>Practice</dt>
              <dd>{item.practiceScore}%</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{item.revisionScore}%</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{item.practiceAccuracy}%</dd>
            </div>
          </dl>

          {item.overdueRetryCount > 0 ? (
            <p className="intelliTextMasteryRetryNotice">
              {item.overdueRetryCount} overdue retry item(s) prevent Exam Ready.
            </p>
          ) : null}

          <button type="button" onClick={() => onOpenChapter?.(item)}>
            Continue reading
          </button>
        </article>
      ))}
    </section>
  );
}
