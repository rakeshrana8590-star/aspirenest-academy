import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

const actions = [
  { icon: "C", label: "Create", title: "Created Access", description: "Review manual access creation events and admin actor details.", route: "/admin/content/access/audit", tone: "orange" },
  { icon: "E", label: "Extend", title: "Expiry Changes", description: "Trace expiry extensions with date and reason.", route: "/admin/content/access/audit", tone: "blue" },
  { icon: "U", label: "Upgrade", title: "Plan Changes", description: "Track plan upgrades and downgrade history safely.", route: "/admin/content/access/audit", tone: "green" },
  { icon: "R", label: "Revoke", title: "Blocks / Revokes", description: "Review blocked or revoked learner access with confirmation notes.", route: "/admin/content/access/audit", tone: "purple" },
];

export default function AdminAccessAuditRoute() {
  return (
    <AdminAccessRouteShell
      badge="AUDIT LOGS"
      title="Audit Logs"
      description="Review admin access actions with traceability across create, extend, upgrade, revoke, and block events."
      icon="A"
      primaryAction={{ label: "Manage Access", route: "/admin/content/access/manage" }}
      secondaryAction={{ label: "Add Access", route: "/admin/content/access/add" }}
      sectionTitle="Access audit trail"
      sectionDescription="Every access-changing action should be traceable by actor, learner, timestamp, status, and reason."
      actions={actions}
      stats={[
        { value: "Create", label: "Logs" },
        { value: "Extend", label: "Expiry" },
        { value: "Upgrade", label: "Plan" },
        { value: "Revoke", label: "Block" },
      ]}
    />
  );
}
