import React from "react";

export default function IntelliTextWeakConcepts({
  items = [],
  onOpenConcept,
}) {
  if (!items.length) {
    return (
      <section className="intelliTextMasteryEmpty">
        <span>WEAK CONCEPTS</span>
        <h3>No active mapped weak concepts.</h3>
        <p>
          This view is derived from open and retry-due Mistake Book entries. It
          does not create a separate public profile or entitlement.
        </p>
      </section>
    );
  }

  return (
    <section className="intelliTextWeakConceptGrid" aria-label="Weak concepts">
      {items.map((item) => (
        <article key={item.conceptId}>
          <span>WEAK CONCEPT</span>
          <h3>{item.conceptLabel}</h3>
          <div>
            <strong>{item.mistakeCount}</strong>
            <small>active mistake(s)</small>
          </div>
          <div>
            <strong>{item.overdueCount}</strong>
            <small>retry due</small>
          </div>
          <button
            type="button"
            disabled={!item.textbookId}
            onClick={() => onOpenConcept?.(item)}
          >
            Open related note
          </button>
        </article>
      ))}
    </section>
  );
}
