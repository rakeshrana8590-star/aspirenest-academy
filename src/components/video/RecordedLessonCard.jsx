import React from "react";

export default function RecordedLessonCard({ item, onOpen }) {
  if (!item) return null;

  return (
    <article className="recordedLessonCard">
      <div className="videoCardTopIcon">▶️</div>

      <div>
        <h3>{item.title || "Recorded Lesson"}</h3>

        <p>
          {item.subject || "Subject"} • {item.chapter || "Chapter"}
        </p>
      </div>

      <div className="videoCardMetaRow">
        <span>{item.planType || "FREE"}</span>
        <span>{item.duration || "Flexible duration"}</span>
        <span>{item.mentorName || "AspireNest Mentor"}</span>
      </div>

      <div className="videoCardActions">
        <button className="publishButton" onClick={() => onOpen?.(item)}>
          Watch Lesson →
        </button>
      </div>
    </article>
  );
}