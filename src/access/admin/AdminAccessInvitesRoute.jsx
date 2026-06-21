import React from "react";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

const actions = [
  { icon: "P", label: "Pending", title: "Pending Invites", description: "Review learners waiting for activation or login readiness.", route: "/admin/content/access/invites", tone: "orange" },
  { icon: "R", label: "Reminder", title: "Reminder Queue", description: "Prepare safe follow-up messages for registered learners.", route: "/admin/content/access/invites", tone: "blue" },
  { icon: "A", label: "Activate", title: "Activation Ready", description: "Move invite-ready learners into access approval flow.", route: "/admin/content/access/add", tone: "green" },
  { icon: "L", label: "Logs", title: "Invite Audit", description: "Track invite status changes and admin notes.", route: "/admin/content/access/audit", tone: "purple" },
];

export default function AdminAccessInvitesRoute() {
  return (
    <AdminAccessRouteShell
      badge="ACCESS INVITES"
      title="Pending Invites"
      description="Track pending invites, onboarding readiness, and learner activation flow."
      icon="I"
      primaryAction={{ label: "Bulk Import", route: "/admin/content/access/bulk" }}
      secondaryAction={{ label: "Add Access", route: "/admin/content/access/add" }}
      sectionTitle="Invite readiness"
      sectionDescription="Keep pending learners, reminders, and activation readiness organized from one workspace."
      actions={actions}
      stats={[
        { value: "Pending", label: "Queue" },
        { value: "Ready", label: "Activate" },
        { value: "Mail", label: "Reminder" },
        { value: "Audit", label: "Logs" },
      ]}
    />
  );
}
