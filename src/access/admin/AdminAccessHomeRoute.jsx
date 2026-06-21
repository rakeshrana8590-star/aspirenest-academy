import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/access/adminAccessManager.css";

const cards = [
  { label: "Builder", title: "Add Learner Access", text: "Create premium, mentorship, trial, or manual access for a learner.", icon: "+", path: "/admin/access/add" },
  { label: "Control", title: "Manage Access", text: "Search, extend, upgrade, block, or revoke student access safely.", icon: "✓", path: "/admin/access/manage" },
  { label: "Bulk", title: "Bulk Gmail Import", text: "Prepare access for multiple registered learner emails from one workspace.", icon: "⇪", path: "/admin/access/bulk" },
  { label: "Invites", title: "Pending Invites", text: "Track access invitations, pending learners, and onboarding readiness.", icon: "✉", path: "/admin/access/invites" },
  { label: "Profile", title: "Learner Biodata", text: "Open learner-wise access profile, course plan, and audit history.", icon: "◎", path: "/admin/access/profile/demo" },
  { label: "Audit", title: "Audit Logs", text: "Review every admin action with confirmation and traceability.", icon: "⌁", path: "/admin/access/audit" },
];

export default function AdminAccessHomeRoute() {
  const navigate = useNavigate();

  return (
    <main className="adminAccessPage">
      <section className="adminAccessHero">
        <div className="adminAccessHeroCopy">
          <span className="adminAccessBadge">ACCESS COMMAND</span>
          <h1>Access Command Center</h1>
          <p>Manage learner premium plans, manual approvals, bulk imports, invites, expiry, blocks, and audit logs from one launch-ready admin workspace.</p>
          <div className="adminAccessHeroActions">
            <button className="adminAccessPrimaryBtn" type="button" onClick={() => navigate("/admin/access/add")}>+ Add Learner Access</button>
            <button className="adminAccessGhostBtn" type="button" onClick={() => navigate("/admin/access/manage")}>Manage Access</button>
          </div>
        </div>
        <aside className="adminAccessCommandPanel">
          <div className="adminAccessPanelTop">
            <div className="adminAccessPanelTitle"><strong>Access Manager</strong><span>CTET / TET premium control</span></div>
            <span className="adminAccessLivePill">Live</span>
          </div>
          <div className="adminAccessStatsGrid">
            <div className="adminAccessStatCard"><strong>4</strong><span>Plan levels</span></div>
            <div className="adminAccessStatCard"><strong>7</strong><span>Admin routes</span></div>
            <div className="adminAccessStatCard"><strong>100%</strong><span>Audit ready</span></div>
            <div className="adminAccessStatCard"><strong>Safe</strong><span>Admin-only</span></div>
          </div>
        </aside>
      </section>
      <section className="adminAccessWorkflow">
        <div className="adminAccessSectionHead">
          <div><span className="adminAccessBadge">ADMIN ACCESS SYSTEM</span><h2>Core access workflow</h2><p>Everything stays organized by action: add, manage, import, invite, profile, and audit.</p></div>
        </div>
        <div className="adminAccessCardGrid">
          {cards.map((card) => (
            <button className="adminAccessCard" key={card.title} type="button" onClick={() => navigate(card.path)}>
              <div className="adminAccessIcon">{card.icon}</div><small>{card.label}</small><h3>{card.title}</h3><p>{card.text}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
