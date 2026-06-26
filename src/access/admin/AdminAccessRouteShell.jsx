import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/access/adminAccessManager.css";

const defaultQuickActions = [
  { title: "Access Home", meta: "Command center", route: "/admin/content/access" },
  { title: "Add Access", meta: "Manual approval", route: "/admin/content/access/add" },
  { title: "Manage Access", meta: "Extend, block, revoke", route: "/admin/content/access/manage" },
  { title: "Bulk Import", meta: "Gmail learner list", route: "/admin/content/access/bulk" },
  { title: "Pending Invites", meta: "Onboarding queue", route: "/admin/content/access/invites" },
  { title: "Access Products", meta: "Catalog foundation", route: "/admin/content/access/products" },
  { title: "Access Keys", meta: "Redeem foundation", route: "/admin/content/access/keys" },
  { title: "Audit Logs", meta: "Admin traceability", route: "/admin/content/access/audit" },
];

export default function AdminAccessRouteShell({ badge, title, description, icon = "A", moduleMeta = "CTET / TET PREMIUM CONTROL", stats, trustItems, primaryAction, secondaryAction, sectionTitle, sectionDescription, actions = [], quickActions = defaultQuickActions, compactMode = true, backLabel = "Back to Access Manager", backRoute = "/admin/content/access", children }) {
  const navigate = useNavigate();
  const safeStats = stats || [
    { value: "Active", label: "Access" },
    { value: "Pending", label: "Invites" },
    { value: "Expiry", label: "Watch" },
    { value: "Audit", label: "Logs" },
  ];
  const safeTrustItems = trustItems || ["Plan protected", "Email-wise", "Expiry control", "Audit ready"];

  return (
    <section className={compactMode ? "coursePages adminNotesManagePage" : "coursePages adminMockHomePage adminNotesMockAlignedPage"}>
      <div className="adminMockHomeShell">
        <section className="adminNotesLaunchHero">
          <div className="adminNotesLaunchHeroCopy">
            <span className="adminNotesLaunchBadge">{badge}</span>
            <h1>{title}</h1>
            <p>{description}</p>

            <div className="adminNotesLaunchHeroActions">
              {primaryAction ? <button type="button" className="adminNotesLaunchPrimaryBtn" onClick={() => navigate(primaryAction.route)}>{primaryAction.label}</button> : null}
              {secondaryAction ? <button type="button" className="adminNotesLaunchGhostBtn" onClick={() => navigate(secondaryAction.route)}>{secondaryAction.label}</button> : null}
            </div>

            <div className="adminNotesLaunchTrustRow">
              {safeTrustItems.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <div className="adminNotesLaunchSystemCard">
            <div className="adminNotesLaunchSystemTop">
              <span>{badge}</span>
              <strong>Admin Workspace</strong>
            </div>

            <div className="adminNotesLaunchTitleCard">
              <span className="adminNotesLaunchIcon">{icon}</span>
              <div>
                <h3>{title}</h3>
                <p>{moduleMeta}</p>
              </div>
            </div>

            <div className="adminNotesLaunchSystemGrid">
              {safeStats.map((stat) => <div className="adminNotesLaunchFeatureCard" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
            </div>

            <div className="adminNotesLaunchSystemFlow">
              <span>Plan</span><i /><span>Learner</span><i /><span>Expiry</span><i /><span>Audit</span>
            </div>
          </div>
        </section>

        <section className="adminMockCommandCenter">
          <div className="adminMockSectionTitle">
            <span>Admin access system</span>
            <h2>{sectionTitle || title}</h2>
            <p>{sectionDescription}</p>
          </div>

          {!compactMode && actions.length ? <div className="adminMockCommandLayout">
            <div className="adminMockPrimaryGrid">
              {actions.map((action) => <button type="button" key={action.route} className={"adminMockActionCard adminMockTone-" + action.tone} onClick={() => navigate(action.route)}><span className="adminMockActionTop"><span className="adminMockActionIcon" aria-hidden="true">{action.icon}</span><span className="adminMockActionArrow" aria-hidden="true">&rarr;</span></span><span className="adminMockActionLabel">{action.label}</span><strong>{action.title}</strong><p>{action.description}</p></button>)}
            </div>

            <aside className="adminMockQuickRail">
              <div className="adminMockQuickRailHeader"><span>Quick Access</span><strong>Plans - Learners - Audit</strong></div>
              <div className="adminMockQuickList">
                {quickActions.map((item) => <button type="button" key={item.title} onClick={() => navigate(item.route)}><span><strong>{item.title}</strong><small>{item.meta}</small></span><i aria-hidden="true">&rarr;</i></button>)}
              </div>
            </aside>
          </div> : null}

          {children}
        </section>

        <div className="adminMockHomeFooter">
          <button type="button" className="adminMockBackButton" onClick={() => navigate(backRoute)}>{backLabel}</button>
        </div>
      </div>
    </section>
  );
}
