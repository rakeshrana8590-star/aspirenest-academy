import React from "react";

export default function StudentNotesHero({
  badge,
  title,
  text,
  stats = [],
  backLabel,
  onBack,
}) {
  const systemStats = [
    ...stats,
    {
      label: "Material",
      value: "PDF",
    },
  ].slice(0, 4);

  const scrollToShelf = () => {
    const shelf = document.querySelector(".studentNotesShelf");

    if (shelf) {
      shelf.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="studentNotesHero studentNotesCommandHero">
      <div className="studentNotesHeroCopy">
        <div className="studentNotesHeroTopActions">
          {onBack && (
            <button
              type="button"
              className="studentNotesBackBtn"
              onClick={onBack}
            >
              ← {backLabel || "Back"}
            </button>
          )}

          <span className="studentNotesBadge">{badge}</span>
        </div>

        <h1>{title}</h1>

        <p>{text}</p>

        <div className="studentNotesHeroActions">
          <button
            type="button"
            className="studentNotesPrimaryBtn"
            onClick={scrollToShelf}
          >
            Start Revision →
          </button>

          <button
            type="button"
            className="studentNotesGhostBtn"
            onClick={scrollToShelf}
          >
            PDF Library
          </button>
        </div>

        <div className="studentNotesTrustRow">
          <span>✓ Plan protected</span>
          <span>✓ Subject-wise</span>
          <span>✓ Chapter PDFs</span>
          <span>✓ Smart revision</span>
        </div>
      </div>

      <div className="studentNotesSystemCard">
        <div className="studentNotesSystemTop">
          <span>Now Revising</span>
          <strong>AspireNest Notes</strong>
        </div>

        <div className="studentNotesSystemTitleCard">
          <span className="studentNotesSystemIcon">📘</span>

          <div>
            <h3>{title}</h3>
            <p>{badge}</p>
          </div>
        </div>

        <div className="studentNotesSystemGrid">
          {systemStats.map((stat) => (
            <div className="studentNotesFeatureCard" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="studentNotesSystemFlow">
          <span>Plan</span>
          <i />
          <span>Subject</span>
          <i />
          <span>Chapter</span>
          <i />
          <span>PDF</span>
        </div>
      </div>
    </div>
  );
}