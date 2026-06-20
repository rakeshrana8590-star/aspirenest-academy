import React from "react";

export default function StudentNotesHero({
  badge,
  title,
  text,
  stats = [],
  backLabel,
  onBack,
}) {
  return (
    <div className="studentNotesHero studentNotesCommandHero">
      <div className="studentNotesHeroCopy">
        <span className="studentNotesBadge">{badge}</span>

        <h1>{title}</h1>

        <p>{text}</p>

        <div className="studentNotesHeroActions">
          {onBack && (
            <button
              type="button"
              className="studentNotesBackBtn"
              onClick={onBack}
            >
              ← {backLabel || "Back"}
            </button>
          )}

          <button type="button" className="studentNotesPrimaryBtn">
            Smart revision mode
          </button>

          <button type="button" className="studentNotesGhostBtn">
            PDF library
          </button>
        </div>

        <div className="studentNotesTrustRow">
          <span>Plan-wise</span>
          <span>Subject-wise</span>
          <span>Chapter PDFs</span>
          <span>1 App • 1 System</span>
        </div>
      </div>

      <div className="studentNotesSystemCard">
        <div className="studentNotesSystemTop">
          <span>Notes Command</span>
          <strong>Launch Ready</strong>
        </div>

        <div className="studentNotesSystemGrid">
          {stats.map((stat) => (
            <div className="studentNotesFeatureCard" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <div className="studentNotesSystemFlow">
          Plan → Subject → Chapter → PDF
        </div>
      </div>
    </div>
  );
}