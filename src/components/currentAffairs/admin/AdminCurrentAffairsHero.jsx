import React from "react";

export default function AdminCurrentAffairsHero({
  stats = [],
  onAdd,
  onManage,
}) {
  const heroStats = [
    ...stats,
    {
      label: "Material",
      value: "PDF",
    },
  ].slice(0, 4);

  return (
    <div className="adminCaHero">
      <div className="adminCaHeroCopy">
        <span className="adminCaBadge">CURRENT AFFAIRS COMMAND</span>

        <h1>Current Affairs Manager</h1>

        <p>
          Manage CTET/TET current affairs by month, week, PDF source, plan
          access, publish status, and student visibility from one premium admin
          workspace.
        </p>

        <div className="adminCaHeroActions">
          <button type="button" className="adminCaPrimaryBtn" onClick={onAdd}>
            + Add Current Affair
          </button>

          <button type="button" className="adminCaGhostBtn" onClick={onManage}>
            Manage PDFs
          </button>
        </div>

        <div className="adminCaHeroTrust">
          <span>✓ Month-wise</span>
          <span>✓ Weekly PDFs</span>
          <span>✓ Plan protected</span>
          <span>✓ Publish audit</span>
        </div>
      </div>

      <div className="adminCaSystemCard">
        <div className="adminCaSystemTop">
          <span>Publishing Control</span>
          <strong>AspireNest CA</strong>
        </div>

        <div className="adminCaSystemFeature">
          <div className="adminCaSystemIcon">📰</div>

          <div>
            <strong>Current Affairs Library</strong>
            <span>Month • Week • Plan • PDF</span>
          </div>
        </div>

        <div className="adminCaSystemGrid">
          {heroStats.map((item) => (
            <div key={`${item.label}-${item.value}`}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="adminCaFlow">
          <span>Month</span>
          <i />
          <span>Week</span>
          <i />
          <span>PDF</span>
        </div>
      </div>
    </div>
  );
}