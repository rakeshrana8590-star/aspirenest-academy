import React from "react";
import "../../styles/access/adminAccessManager.css";

export default function AdminAccessAddRoute() {
  return (
    <main className="adminAccessPage">
      <section className="adminAccessHero">
        <div className="adminAccessHeroCopy"><span className="adminAccessBadge">ADD ACCESS</span><h1>Add Learner Access</h1><p>Create learner access records with plan, source, expiry, course, notes, and admin confirmation. Write actions will stay admin-guarded through the access service.</p></div>
        <aside className="adminAccessCommandPanel"><div className="adminAccessPanelTop"><div className="adminAccessPanelTitle"><strong>Manual Access</strong><span>Admin approval flow</span></div><span className="adminAccessLivePill">Ready</span></div><div className="adminAccessStatsGrid"><div className="adminAccessStatCard"><strong>Premium</strong><span>Default plan</span></div><div className="adminAccessStatCard"><strong>Audit</strong><span>Log required</span></div></div></aside>
      </section>
      <section className="adminAccessFormPanel">
        <div className="adminAccessSectionHead"><div><span className="adminAccessBadge">LEARNER ACCESS FORM</span><h2>Access details</h2><p>UI shell is ready. Final write action will connect after confirmation flow.</p></div></div>
        <div className="adminAccessFormGrid">
          <div className="adminAccessField"><label>Email</label><input placeholder="learner@gmail.com" /></div>
          <div className="adminAccessField"><label>Plan</label><select defaultValue="PREMIUM"><option>FREE</option><option>BASIC</option><option>PREMIUM</option><option>MENTORSHIP</option></select></div>
          <div className="adminAccessField"><label>Source</label><select defaultValue="admin_manual"><option value="admin_manual">Admin Manual</option><option value="payment">Payment</option><option value="bulk_import">Bulk Import</option><option value="trial">Trial</option></select></div>
          <div className="adminAccessField"><label>Access Until</label><input type="date" /></div>
          <div className="adminAccessField adminAccessFull"><label>Admin Note</label><textarea placeholder="Reason, receipt note, learner context..." /></div>
        </div>
        <div className="adminAccessNotice">Confirmation flow pending: no write action is connected in this shell yet, so admin action safety is preserved.</div>
      </section>
    </main>
  );
}
