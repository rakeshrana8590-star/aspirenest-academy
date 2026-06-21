import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

export default function AdminAccessProfileRoute() {
  return (
    <AdminAccessRouteShell
      badge="LEARNER PROFILE"
      title="Learner Profile"
      description="Review learner access profile, plan history, contact email, expiry, and activity context."
      icon="P"
      primaryAction={{ label: "Manage Access", route: "/admin/content/access/manage" }}
      secondaryAction={{ label: "Audit Logs", route: "/admin/content/access/audit" }}
      sectionTitle="Learner biodata"
      sectionDescription="Learner-wise profile shell for registered email, active plan, expiry, source, and audit history."
      stats={[
        { value: "Email", label: "Profile" },
        { value: "Plan", label: "Access" },
        { value: "Expiry", label: "Status" },
        { value: "Audit", label: "History" },
      ]}
    >
      <div className="adminAccessTablePanel">
        <div className="adminAccessTable">
          <div className="adminAccessRow"><strong>Registered Email</strong><span>profile emailKey route</span><span className="adminAccessPill">Ready</span><span>Shell</span></div>
          <div className="adminAccessRow"><strong>Current Plan</strong><span>Active access record</span><span className="adminAccessPill">Access</span><span>Pending data</span></div>
          <div className="adminAccessRow"><strong>Audit History</strong><span>Create, extend, revoke logs</span><span className="adminAccessPill">Trace</span><span>Ready</span></div>
        </div>
      </div>
    </AdminAccessRouteShell>
  );
}
