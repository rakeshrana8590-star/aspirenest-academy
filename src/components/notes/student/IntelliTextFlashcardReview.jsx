import React, {
  useEffect,
  useState,
} from "react";

import {
  INTELLITEXT_RECALL_RATINGS,
} from "../../../access/intelliTextRevisionContract";

const RATING_COPY = Object.freeze({
  AGAIN: {
    label: "Again",
    detail: "Review in 10 minutes",
  },
  HARD: {
    label: "Hard",
    detail: "Short interval",
  },
  GOOD: {
    label: "Good",
    detail: "Normal interval",
  },
  EASY: {
    label: "Easy",
    detail: "Long interval",
  },
});

export default function IntelliTextFlashcardReview({
  item = null,
  busy = false,
  onRate,
  onOpenSource,
}) {
  const [answerVisible, setAnswerVisible] = useState(false);

  useEffect(() => {
    setAnswerVisible(false);
  }, [item?.revisionId]);

  if (!item) {
    return (
      <section className="intelliTextRecallEmpty">
        <span>ACTIVE RECALL</span>
        <h2>Your due queue is clear.</h2>
        <p>
          New flashcards and revision markers will appear here when they are
          ready for recall.
        </p>
      </section>
    );
  }

  return (
    <section
      className="intelliTextFlashcardReview"
      aria-label="Active recall review"
    >
      <header>
        <div>
          <span>QUESTION FIRST</span>
          <h2>Recall before revealing</h2>
        </div>
        <strong>{item.reviewCount || 0} reviews</strong>
      </header>

      <article className="intelliTextRecallCard">
        <div className="intelliTextRecallPrompt">
          <span>Prompt</span>
          <h3>{item.prompt}</h3>
        </div>

        {answerVisible ? (
          <div className="intelliTextRecallAnswer" aria-live="polite">
            <span>Answer</span>
            <p>{item.answer}</p>
          </div>
        ) : (
          <button
            type="button"
            className="intelliTextRevealAnswer"
            disabled={busy}
            onClick={() => setAnswerVisible(true)}
          >
            Reveal answer
          </button>
        )}

        {answerVisible ? (
          <div
            className="intelliTextRecallRatings"
            aria-label="Rate your recall"
          >
            {Object.values(INTELLITEXT_RECALL_RATINGS).map((rating) => (
              <button
                type="button"
                key={rating}
                disabled={busy}
                onClick={() => onRate?.(item, rating)}
              >
                <strong>{RATING_COPY[rating].label}</strong>
                <span>{RATING_COPY[rating].detail}</span>
              </button>
            ))}
          </div>
        ) : null}
      </article>

      <footer>
        <div>
          <span>{item.noteTitle || "Private learning snapshot"}</span>
          <strong>{item.sectionTitle || item.sectionId}</strong>
        </div>
        {item.textbookId && item.textbookId !== "manual_workspace" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenSource?.(item)}
          >
            Open source
          </button>
        ) : null}
      </footer>
    </section>
  );
}
