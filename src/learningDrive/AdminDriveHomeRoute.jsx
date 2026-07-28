import React from "react";

import "./adminDriveHomeRoute.css";

const count = (items) => (Array.isArray(items) ? items.length : 0);
const safe = (value = "") => String(value ?? "").trim();

const AdminKpi = ({ label, value, meta, tone = "" }) => (
  <article className={`adminDriveKpi ${tone}`}>
    <span>{label}</span>
    <strong>{Number(value) || 0}</strong>
    <small>{meta}</small>
  </article>
);

const AdminFolder = ({ icon, title, meta, route, navigate }) => (
  <button type="button" className="adminDriveFolder" onClick={() => navigate(route)}>
    <span>{icon}</span>
    <div><strong>{title}</strong><small>{meta}</small></div>
    <i aria-hidden="true">→</i>
  </button>
);

export default function AdminDriveHomeRoute({
  students = [],
  contentItems = [],
  payments = [],
  announcements = [],
  mockResults = [],
  roadmaps = [],
  navigate,
}) {
  const published = contentItems.filter((item) =>
    ["published", "active", "live"].includes(safe(item?.status).toLowerCase())
  ).length;
  const pendingPayments = payments.filter((item) =>
    ["pending", "submitted", "under_review"].includes(safe(item?.status).toLowerCase())
  ).length;
  const activeLearners = students.filter((item) =>
    !["blocked", "expired", "inactive"].includes(safe(item?.status).toLowerCase())
  ).length || count(students);
  const recentOperations = [
    { icon: "✓", title: "Access Manager", meta: "PLAN, MODULE, BUNDLE and ITEM controls", route: "/admin/content/access/manage" },
    { icon: "▤", title: "Content Studio", meta: `${published} published resources visible`, route: "/admin/content" },
    { icon: "◇", title: "Mock Test Engine", meta: `${count(mockResults)} recorded learner outcomes`, route: "/admin/content/mock-tests" },
    { icon: "₹", title: "Payment Verification", meta: `${pendingPayments} request${pendingPayments === 1 ? "" : "s"} need review`, route: "/admin/content/payments" },
  ];

  return (
    <main className="adminDriveHomePage">
      <section className="adminDriveHeading">
        <div>
          <span>ASPIRENEST ADMIN DRIVE</span>
          <h1>Admin Command Centre</h1>
          <p>Operate content, access, people, payments and launch safety through the same premium Drive experience used across AspireNest.</p>
        </div>
        <div className="adminDriveHeadingActions">
          <button type="button" className="secondary" onClick={() => navigate("/admin/preview/student")}>Preview Student</button>
          <button type="button" className="primary" onClick={() => navigate("/admin/content/notes/intellitext")}>Create resource</button>
        </div>
      </section>

      <section className="adminDriveHero">
        <div>
          <span>ONE CONNECTED OPERATIONAL VIEW</span>
          <h2>No scattered admin work. No separate design system.</h2>
          <p>Every real resource, grant, learner and audit action remains connected to the existing React/Firebase engines. The Learning Drive changes navigation and presentation—not authorization truth.</p>
          <div className="adminDriveHeroActions">
            <button type="button" onClick={() => navigate("/admin/content/access/manage")}>Grant access</button>
            <button type="button" className="ghost" onClick={() => navigate("/admin/content/payments")}>Review payments</button>
            <button type="button" className="ghost" onClick={() => navigate("/admin/content/access/audit")}>Open audit</button>
          </div>
        </div>
        <aside>
          <h3>Release safety</h3>
          <p>V8 cumulative integration branch</p>
          <div><span>✓ Existing engines preserved</span><span>✓ Student Admin denial</span><span>✓ No iframe or parallel app</span><span>✓ Deploy remains controlled</span></div>
        </aside>
      </section>

      <section className="adminDriveKpiGrid" aria-label="Admin overview metrics">
        <AdminKpi label="Active learners" value={activeLearners} meta="Identity-linked profiles" />
        <AdminKpi label="Published resources" value={published} meta="Across learning modules" />
        <AdminKpi label="Roadmaps" value={count(roadmaps)} meta="AspirePath sequences" />
        <AdminKpi label="Pending payments" value={pendingPayments} meta="Require verification" tone="warning" />
      </section>

      <section className="adminDriveSection">
        <div className="adminDriveSectionHeader"><div><h2>Admin workspaces</h2><p>Open one focused workspace; the contextual rail and main screen adjust together.</p></div></div>
        <div className="adminDriveFolderGrid">
          <AdminFolder icon="▤" title="Content Studio" meta={`${count(contentItems)} canonical resources`} route="/admin/content" navigate={navigate} />
          <AdminFolder icon="◇" title="Access Manager" meta="Controlled grant lifecycle" route="/admin/content/access/manage" navigate={navigate} />
          <AdminFolder icon="♙" title="Learners" meta={`${count(students)} learner profiles`} route="/admin/students" navigate={navigate} />
          <AdminFolder icon="◎" title="Mentors" meta="Assignments and guidance" route="/admin/content/mentor" navigate={navigate} />
          <AdminFolder icon="₹" title="Payments" meta={`${pendingPayments} pending verification`} route="/admin/content/payments" navigate={navigate} />
          <AdminFolder icon="✓" title="Audit & Safety" meta="Evidence and authorization logs" route="/admin/content/access/audit" navigate={navigate} />
        </div>
      </section>

      <div className="adminDriveTwoColumn">
        <section className="adminDrivePanel">
          <div className="adminDrivePanelHeader"><div><h2>Connected operations</h2><p>Existing production engines remain the source of truth.</p></div><button type="button" onClick={() => navigate("/admin/content")}>View all</button></div>
          <div className="adminDriveList">
            {recentOperations.map((item) => (
              <button type="button" key={item.title} onClick={() => navigate(item.route)}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.meta}</small></div><i>→</i></button>
            ))}
          </div>
        </section>
        <section className="adminDrivePanel">
          <div className="adminDrivePanelHeader"><div><h2>Needs attention</h2><p>Items that may block a learner.</p></div></div>
          <div className="adminDriveList">
            <button type="button" onClick={() => navigate("/admin/content/payments")}><span>₹</span><div><strong>{pendingPayments ? `${pendingPayments} payment request${pendingPayments === 1 ? "" : "s"} pending` : "Payments clear"}</strong><small>Verification and provisioning remain separate.</small></div><i>→</i></button>
            <button type="button" onClick={() => navigate("/admin/content/access/invites")}><span>@</span><div><strong>Pending identity claims</strong><small>Claim exact email access safely to UID.</small></div><i>→</i></button>
            <button type="button" onClick={() => navigate("/admin/announcements")}><span>◎</span><div><strong>{count(announcements)} announcements</strong><small>Review current academy communication.</small></div><i>→</i></button>
          </div>
        </section>
      </div>
    </main>
  );
}
