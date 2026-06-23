import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

const actions = [
  { icon: "S", label: "Search", title: "Find Learner", description: "Search by registered email and review current access state.", route: "/admin/content/access/manage", tone: "orange" },
  { icon: "E", label: "Extend", title: "Extend Expiry", description: "Prepare expiry extension with confirmation and audit logging.", route: "/admin/content/access/manage", tone: "blue" },
  { icon: "U", label: "Upgrade", title: "Upgrade Plan", description: "Move learner to BASIC, PREMIUM, or MENTORSHIP safely.", route: "/admin/content/access/manage", tone: "green" },
  { icon: "B", label: "Block", title: "Block / Revoke", description: "Stop access only after confirmation and admin audit note.", route: "/admin/content/access/manage", tone: "purple" },
];

export default function AdminAccessManageRoute() {
  return (
    <AdminAccessRouteShell
      badge="MANAGE ACCESS"
      title="Manage Access"
      description="Search, review, extend, upgrade, block, or revoke learner access from one premium command room."
      icon="M"
      primaryAction={{ label: "Add Learner Access", route: "/admin/content/access/add" }}
      secondaryAction={{ label: "Audit Logs", route: "/admin/content/access/audit" }}
      sectionTitle="Manage learner access"
      sectionDescription="Every future write action will stay admin-confirmed, service-guarded, and audit-traceable."
      actions={actions}
      stats={[
        { value: "Search", label: "Email" },
        { value: "Extend", label: "Expiry" },
        { value: "Upgrade", label: "Plan" },
        { value: "Block", label: "Safe" },
      ]}
    />
  );
}


