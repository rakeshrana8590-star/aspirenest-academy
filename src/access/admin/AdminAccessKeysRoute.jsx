import React from "react";

import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

const keyActions = [
  {
    icon: "K",
    label: "Key",
    title: "Generate Keys Later",
    description:
      "Foundation route for redeem codes linked to plan, module, item, bundle, or product entitlement.",
    route: "/admin/content/access/keys",
    tone: "green",
  },
  {
    icon: "P",
    label: "Product",
    title: "Open Products",
    description:
      "Create catalog products first, then connect access keys with product and scope metadata.",
    route: "/admin/content/access/products",
    tone: "orange",
  },
];

export default function AdminAccessKeysRoute() {
  return (
    <AdminAccessRouteShell
      badge="ACCESS KEYS"
      title="Access Key Workspace"
      description="Prepare redeem-key architecture for learner unlocks. Keys can later activate plan, module, item, or bundle access with audit traceability."
      icon="K"
      moduleMeta="REDEEM KEY FOUNDATION"
      stats={[
        { value: "Active", label: "Keys" },
        { value: "Used", label: "Redeem" },
        { value: "Expiry", label: "Watch" },
        { value: "Audit", label: "Logs" },
      ]}
      trustItems={["Code unique", "Product linked", "Redeem safe", "Audit ready"]}
      primaryAction={{
        label: "Open Products",
        route: "/admin/content/access/products",
      }}
      secondaryAction={{
        label: "Back to Access",
        route: "/admin/content/access",
      }}
      sectionTitle="Redeem key foundation"
      sectionDescription="Access keys will be generated with normalized codes, status control, usage count, assigned learner email, product reference, and entitlement scope."
      actions={keyActions}
    >
      <div className="adminAccessPreviewGrid">
        <article className="adminAccessPreviewCard">
          <span>Status</span>
          <strong>Active / Used / Expired / Blocked</strong>
          <p>Keys follow the access-key status constants already added to the access engine.</p>
        </article>

        <article className="adminAccessPreviewCard">
          <span>Redeem</span>
          <strong>One learner unlock</strong>
          <p>Future redeem flow will create a normal studentAccess record after validation.</p>
        </article>

        <article className="adminAccessPreviewCard">
          <span>Trace</span>
          <strong>Audit-first workflow</strong>
          <p>Every key action will connect with access audit logs before public release.</p>
        </article>
      </div>
    </AdminAccessRouteShell>
  );
}