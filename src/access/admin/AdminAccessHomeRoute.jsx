import React from "react";
import { useNavigate } from "react-router-dom";

const systemStats = [
  { value: "Active", label: "Access" },
  { value: "Pending", label: "Invites" },
  { value: "Expiry", label: "Watch" },
  { value: "Audit", label: "Logs" },
];

const primaryActions = [
  { icon: "+", label: "Builder", title: "Add Learner Access", description: "Create premium, mentorship, trial, or manual access for a learner.", route: "/admin/content/access/add", tone: "orange" },
  { icon: "✓", label: "Control", title: "Manage Access", description: "Search, extend, upgrade, block, or revoke student access safely.", route: "/admin/content/access/manage", tone: "blue" },
  { icon: "B", label: "Bulk", title: "Bulk Gmail Import", description: "Prepare access for multiple registered learner emails from one workspace.", route: "/admin/content/access/bulk", tone: "green" },
  { icon: "P", label: "Products", title: "Access Products", description: "Prepare catalog products for plan, module, item, and bundle entitlement scopes.", route: "/admin/content/access/products", tone: "orange" },
  { icon: "K", label: "Keys", title: "Access Keys", description: "Prepare redeem-key architecture linked with products and learner entitlement scopes.", route: "/admin/content/access/keys", tone: "blue" },
  { icon: "A", label: "Audit", title: "Audit Logs", description: "Review every admin action with confirmation and traceability.", route: "/admin/content/access/audit", tone: "purple" },
];

const compactActions = [
  { title: "Add Access", meta: "Manual approval", route: "/admin/content/access/add" },
  { title: "Manage Access", meta: "Extend, block, revoke", route: "/admin/content/access/manage" },
  { title: "Bulk Import", meta: "Gmail learner list", route: "/admin/content/access/bulk" },
  { title: "Pending Invites", meta: "Onboarding queue", route: "/admin/content/access/invites" },
  { title: "Access Products", meta: "Catalog foundation", route: "/admin/content/access/products" },
  { title: "Access Keys", meta: "Redeem foundation", route: "/admin/content/access/keys" },
  { title: "Learner Profile", meta: "Biodata and plan", route: "/admin/content/access/profile/demo" },
  { title: "Audit Logs", meta: "Admin traceability", route: "/admin/content/access/audit" },
  { title: "Content Studio", meta: "Back to main studio", route: "/admin/content" },
];

export default function AdminAccessHomeRoute() {
  const navigate = useNavigate();

  return (
    <section className="coursePages adminMockHomePage adminNotesMockAlignedPage">
      <div className="adminMockHomeShell">
        <section className="adminNotesLaunchHero">
          <div className="adminNotesLaunchHeroCopy">
            <span className="adminNotesLaunchBadge">ACCESS COMMAND</span>
            <h1>Access Manager</h1>
            <p>
              A premium command center for CTET/TET learner access - create manual approvals, manage plan upgrades, control expiry, block safely, and audit every admin action.
            </p>

            <div className="adminNotesLaunchHeroActions">
              <button type="button" className="adminNotesLaunchPrimaryBtn" onClick={() => navigate("/admin/content/access/add")}>
                Add Learner Access
              </button>
              <button type="button" className="adminNotesLaunchGhostBtn" onClick={() => navigate("/admin/content/access/manage")}>
                Manage Access
              </button>
            </div>

            <div className="adminNotesLaunchTrustRow">
              <span>Plan protected</span>
              <span>Email-wise</span>
              <span>Expiry control</span>
              <span>Audit ready</span>
            </div>
          </div>

          <div className="adminNotesLaunchSystemCard">
            <div className="adminNotesLaunchSystemTop">
              <span>Access Command</span>
              <strong>Admin Workspace</strong>
            </div>

            <div className="adminNotesLaunchTitleCard">
              <span className="adminNotesLaunchIcon">A</span>
              <div>
                <h3>Access Manager</h3>
                <p>CTET / TET PREMIUM CONTROL</p>
              </div>
            </div>

            <div className="adminNotesLaunchSystemGrid">
              {systemStats.map((stat) => (
                <div className="adminNotesLaunchFeatureCard" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="adminNotesLaunchSystemFlow">
              <span>Plan</span>
              <i />
              <span>Learner</span>
              <i />
              <span>Expiry</span>
              <i />
              <span>Audit</span>
            </div>
          </div>
        </section>

        <section className="adminMockCommandCenter">
          <div className="adminMockSectionTitle">
            <span>Admin access system</span>
            <h2>Core access workflow</h2>
            <p>
              Most-used access actions stay above the fold. Plans, learner emails, expiry, invites, and audit logs stay available from the right rail.
            </p>
          </div>

          <div className="adminMockCommandLayout">
            <div className="adminMockPrimaryGrid">
              {primaryActions.map((action) => (
                <button type="button" key={action.route} className={"adminMockActionCard adminMockTone-" + action.tone} onClick={() => navigate(action.route)}>
                  <span className="adminMockActionTop">
                    <span className="adminMockActionIcon" aria-hidden="true">{action.icon}</span>
                    <span className="adminMockActionArrow" aria-hidden="true">&rarr;</span>
                  </span>
                  <span className="adminMockActionLabel">{action.label}</span>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </button>
              ))}
            </div>

            <aside className="adminMockQuickRail">
              <div className="adminMockQuickRailHeader">
                <span>Quick Access</span>
                <strong>Plans - Learners - Audit</strong>
              </div>
              <div className="adminMockQuickList">
                {compactActions.map((item) => (
                  <button type="button" key={item.title} onClick={() => navigate(item.route)}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </span>
                    <i aria-hidden="true">&rarr;</i>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <div className="adminMockHomeFooter">
          <button type="button" className="adminMockBackButton" onClick={() => navigate("/admin/content")}>
            Back to Content Studio
          </button>
        </div>
      </div>
    </section>
  );
}
