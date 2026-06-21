import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

export default function AdminAccessAddRoute() {
  return (
    <AdminAccessRouteShell
      badge="ADD ACCESS"
      title="Add Learner Access"
      description="Create learner access records with plan, source, expiry, course, notes, and admin confirmation. Write actions stay admin-guarded through the access service."
      icon="+"
      primaryAction={{ label: "Manage Access", route: "/admin/content/access/manage" }}
      secondaryAction={{ label: "Bulk Import", route: "/admin/content/access/bulk" }}
      sectionTitle="Access details"
      sectionDescription="Prepare learner email, plan, source, expiry, and admin note before the final confirmation flow is connected."
      stats={[
        { value: "Email", label: "Required" },
        { value: "Plan", label: "Required" },
        { value: "Expiry", label: "Optional" },
        { value: "Audit", label: "Required" },
      ]}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessFormGrid">
          <div className="adminAccessField"><label>Email</label><input placeholder="learner@gmail.com" /></div>
          <div className="adminAccessField"><label>Plan</label><select defaultValue="PREMIUM"><option>FREE</option><option>BASIC</option><option>PREMIUM</option><option>MENTORSHIP</option></select></div>
          <div className="adminAccessField"><label>Source</label><select defaultValue="admin_manual"><option value="admin_manual">Admin Manual</option><option value="payment">Payment</option><option value="bulk_import">Bulk Import</option><option value="trial">Trial</option></select></div>
          <div className="adminAccessField"><label>Access Until</label><input type="date" /></div>
          <div className="adminAccessField adminAccessFull"><label>Admin Note</label><textarea placeholder="Reason, receipt note, learner context..." /></div>
        </div>
        <div className="adminAccessNotice">Confirmation flow pending: no write action is connected in this shell yet, so admin action safety is preserved.</div>
      </div>
    </AdminAccessRouteShell>
  );
}
