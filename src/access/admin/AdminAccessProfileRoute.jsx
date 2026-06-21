import React from "react";
import "../../styles/access/adminAccessManager.css";

export default function AdminAccessProfileRoute() {
  return (
    <main className="adminAccessPage">
      <section className="adminAccessHero">
        <div className="adminAccessHeroCopy"><span className="adminAccessBadge">LEARNER PROFILE</span><h1>Learner Profile / Biodata</h1><p>Review learner access profile, plan history, contact email, expiry, and activity context.</p></div>
        <aside className="adminAccessCommandPanel"><div className="adminAccessPanelTop"><div className="adminAccessPanelTitle"><strong>Learner Profile / Biodata</strong><span>Access engine workspace</span></div><span className="adminAccessLivePill">Ready</span></div><div className="adminAccessStatsGrid"><div className="adminAccessStatCard"><strong>Safe</strong><span>Admin only</span></div><div className="adminAccessStatCard"><strong>Audit</strong><span>Traceable</span></div></div></aside>
      </section>
      <section className="adminAccessTablePanel">
        <div className="adminAccessSectionHead"><div><span className="adminAccessBadge">WORKSPACE</span><h2>Learner Profile / Biodata</h2><p>Premium shell ready for Phase 7 wiring. Existing student routes and module pages are untouched.</p></div></div>
        <div className="adminAccessTable">
          <div className="adminAccessRow"><strong>Admin confirmation</strong><span>Required before write</span><span className="adminAccessPill">Protected</span><span>Ready</span></div>
          <div className="adminAccessRow"><strong>Audit logging</strong><span>Every action tracked</span><span className="adminAccessPill">Enabled</span><span>Ready</span></div>
          <div className="adminAccessRow"><strong>Access engine</strong><span>Central service based</span><span className="adminAccessPill">Phase 3</span><span>Ready</span></div>
        </div>
      </section>
    </main>
  );
}
