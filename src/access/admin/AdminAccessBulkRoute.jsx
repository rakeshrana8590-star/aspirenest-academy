import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

export default function AdminAccessBulkRoute() {
  return (
    <AdminAccessRouteShell
      badge="BULK IMPORT"
      title="Bulk Gmail Import"
      description="Prepare and verify bulk Gmail access imports with normalized email safety and audit-ready admin controls."
      icon="B"
      primaryAction={{ label: "Add Single Access", route: "/admin/content/access/add" }}
      secondaryAction={{ label: "Pending Invites", route: "/admin/content/access/invites" }}
      sectionTitle="Bulk import workspace"
      sectionDescription="Paste learner Gmail IDs, normalize emails, review duplicates, and prepare access before final confirmation."
      stats={[
        { value: "Paste", label: "Emails" },
        { value: "Clean", label: "Normalize" },
        { value: "Review", label: "Duplicates" },
        { value: "Audit", label: "Ready" },
      ]}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessFormGrid">
          <div className="adminAccessField adminAccessFull"><label>Registered Gmail List</label><textarea placeholder="one learner email per line" /></div>
          <div className="adminAccessField"><label>Default Plan</label><select defaultValue="PREMIUM"><option>FREE</option><option>BASIC</option><option>PREMIUM</option><option>MENTORSHIP</option></select></div>
          <div className="adminAccessField"><label>Source</label><select defaultValue="bulk_import"><option value="bulk_import">Bulk Import</option><option value="admin_manual">Admin Manual</option><option value="trial">Trial</option></select></div>
        </div>
        <div className="adminAccessNotice">Bulk write is not connected yet. Next phase will add validation, duplicate check, confirmation, and audit logs.</div>
      </div>
    </AdminAccessRouteShell>
  );
}
