import React from "react";

export default function AdminNotesHero({
  badge = "Admin Notes",
  title,
  text,
  stats = [],
  actions,
}) {
  return (
    <section className="adminNotesHero">
      <div className="adminNotesHeroCopy">
        <span className="adminNotesBadge">{badge}</span>

        <h1>{title}</h1>

        <p>{text}</p>

        {actions && <div className="adminNotesHeroActions">{actions}</div>}
      </div>

      <div className="adminNotesCommandCard">
        <div className="adminNotesCommandTop">
          <span>Notes Command</span>
          <strong>Admin Workspace</strong>
        </div>

        <div className="adminNotesCommandGrid">
          {stats.map((stat) => (
            <div className="adminNotesCommandStat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="adminNotesCommandFlow">
          <span>Plan</span>
          <i />
          <span>Subject</span>
          <i />
          <span>Chapter</span>
          <i />
          <span>PDF</span>
        </div>
      </div>
    </section>
  );
}