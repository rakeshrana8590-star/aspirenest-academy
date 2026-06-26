import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell";

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
  return (
    <AdminAccessRouteShell
      badge="ACCESS COMMAND"
      title="Access Manager"
      description="A premium command center for CTET/TET learner access - create manual approvals, manage plan upgrades, control expiry, block safely, and audit every admin action."
      icon="A"
      moduleMeta="CTET / TET PREMIUM CONTROL"
      stats={systemStats}
      trustItems={["Plan protected", "Email-wise", "Expiry control", "Audit ready"]}
      primaryAction={{ label: "Add Learner Access", route: "/admin/content/access/add" }}
      secondaryAction={{ label: "Manage Access", route: "/admin/content/access/manage" }}
      sectionTitle="Core access workflow"
      sectionDescription="Most-used access actions stay above the fold. Plans, learner emails, expiry, invites, and audit logs stay available from the right rail."
      actions={primaryActions}
      quickActions={compactActions}
      compactMode={false}
      backLabel="Back to Content Studio"
      backRoute="/admin/content"
    />
  );
}
