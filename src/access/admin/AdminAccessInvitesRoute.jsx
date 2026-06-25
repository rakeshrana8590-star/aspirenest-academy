import React, { useEffect, useMemo, useState } from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

import {
  listAccessInvites,
  normalizeAccessEmail,
  queueAccessInviteResend,
  updateAccessInviteStatus,
} from "../accessService";

import {
  AdminButton,
  AdminEmptyState,
  AdminErrorBox,
  AdminFilterBar,
  AdminFilterField,
  AdminStatusPill,
} from "../../components/shared/admin";

const actions = [
  { icon: "P", label: "Pending", title: "Pending Invites", description: "Review learners waiting for invite delivery.", route: "/admin/content/access/invites", tone: "orange" },
  { icon: "Q", label: "Queued", title: "Backend Queue", description: "Track invites waiting for Phase 14B email backend.", route: "/admin/content/access/invites", tone: "blue" },
  { icon: "U", label: "Used", title: "Used Invites", description: "Confirm learners who completed invite onboarding.", route: "/admin/content/access/invites", tone: "green" },
  { icon: "L", label: "Logs", title: "Invite Audit", description: "Track invite status changes and admin notes.", route: "/admin/content/access/audit", tone: "purple" },
];

const inviteStatusOptions = ["all", "pending", "queued", "sent", "used", "expired", "revoked"];

const formatDateValue = (value) => {
  if (!value) return "Not set";
  if (typeof value === "string") return value;
  if (value.toDate) return value.toDate().toLocaleDateString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not set" : parsed.toLocaleDateString();
};

const buildAdminActor = () => ({
  uid: auth.currentUser?.uid || null,
  email: auth.currentUser?.email || "",
  role: "admin",
  isAdmin: true,
});


export default function AdminAccessInvitesRoute() {
  const [invites, setInvites] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const adminActor = useMemo(() => buildAdminActor(), []);

  const loadInvites = async () => {
    setLoading(true);
    setError("");

    try {
      const records = await listAccessInvites({
        actor: adminActor,
        inviteStatus: statusFilter,
      });
      setInvites(records);
    } catch (loadError) {
      setError(loadError?.message || "Invite list load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [statusFilter]);

  const filteredInvites = useMemo(() => {
    const email = normalizeAccessEmail(emailFilter);
    if (!email) return invites;

    return invites.filter((invite) =>
      normalizeAccessEmail(invite.email || invite.normalizedEmail).includes(email)
    );
  }, [emailFilter, invites]);

  const stats = useMemo(() => {
    const countByStatus = (status) =>
      invites.filter((invite) => String(invite.inviteStatus || "").toLowerCase() === status).length;

    return [
      { value: String(invites.length), label: "Total" },
      { value: String(countByStatus("pending")), label: "Pending" },
      { value: String(countByStatus("queued")), label: "Queued" },
      { value: String(countByStatus("used")), label: "Used" },
    ];
  }, [invites]);

  const handleQueueResend = async (invite) => {
    setActionLoadingId(invite.id);
    setMessage("");
    setError("");

    try {
      await queueAccessInviteResend(invite.id, adminActor, {
        source: "admin_access_invites_route",
        expiryDays: 7,
      });
      setMessage("Invite resend queued for " + (invite.email || invite.normalizedEmail) + ". Phase 14B backend will send the real email.");
      await loadInvites();
    } catch (queueError) {
      setError(queueError?.message || "Invite resend queue failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleMarkStatus = async (invite, nextStatus) => {
    setActionLoadingId(invite.id);
    setMessage("");
    setError("");

    try {
      await updateAccessInviteStatus(invite.id, nextStatus, adminActor, {
        source: "admin_access_invites_route",
      });
      setMessage("Invite status updated to " + nextStatus + ".");
      await loadInvites();
    } catch (statusError) {
      setError(statusError?.message || "Invite status update failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setEmailFilter("");
    setMessage("");
    setError("");
  };


  return (
    <AdminAccessRouteShell
      badge="ACCESS INVITES"
      title="Invite Email Readiness"
      description="Track pending invite records, resend queue status, expiry readiness, and Phase 14B backend handoff."
      icon="I"
      primaryAction={{ label: "Bulk Import", route: "/admin/content/access/bulk" }}
      secondaryAction={{ label: "Add Access", route: "/admin/content/access/add" }}
      sectionTitle="Invite readiness"
      sectionDescription="This page is Phase 14A foundation. Real branded email delivery will be handled by Phase 14B Cloud Function backend."
      actions={actions}
      stats={stats}
      trustItems={["No password shared", "Admin only", "Expiry ready", "Audit logged"]}
    >
      <AdminFilterBar
        eyebrow="Invite controls"
        title="Search and status filters"
        description="Review invite records created from single Gmail access and bulk import."
        rightSlot={
          <AdminButton variant="primary" size="sm" loading={loading} onClick={loadInvites}>
            Refresh
          </AdminButton>
        }
        footerSlot={
          <AdminButton variant="secondary" size="sm" onClick={resetFilters}>
            Reset Filters
          </AdminButton>
        }
      >
        <AdminFilterField label="Learner email">
          <input
            type="search"
            value={emailFilter}
            onChange={(event) => setEmailFilter(event.target.value)}
            placeholder="Search by Gmail"
          />
        </AdminFilterField>

        <AdminFilterField label="Invite status">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {inviteStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </select>
        </AdminFilterField>
      </AdminFilterBar>

      {message ? (
        <div className="adminSuccessBox">
          <strong>Invite action completed</strong>
          <p>{message}</p>
        </div>
      ) : null}

      {error ? <AdminErrorBox title="Invite action failed" message={error} /> : null}

      {loading ? (
        <div className="adminEmptyState">
          <div className="adminEmptyStateIcon">I</div>
          <span>Loading</span>
          <h3>Loading invite records...</h3>
          <p>Please wait while the invite queue is loaded.</p>
        </div>
      ) : filteredInvites.length ? (
        <div className="adminAccessTableWrap">
          <table className="adminAccessTable">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Status</th>
                <th>Delivery</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Resend</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.map((invite) => (
                <tr key={invite.id}>
                  <td>
                    <strong>{invite.email || invite.normalizedEmail}</strong>
                    <small>{invite.learnerName || invite.name || "Name not set"}</small>
                  </td>
                  <td>
                    <AdminStatusPill status={invite.inviteStatus || "pending"} />
                  </td>
                  <td>
                    <AdminStatusPill
                      status={invite.deliveryStatus || (invite.emailSent ? "sent" : "pending")}
                      label={invite.deliveryStatus || (invite.emailSent ? "sent" : "backend pending")}
                      tone={invite.emailSent ? "success" : "warning"}
                      size="sm"
                    />
                  </td>
                  <td>{invite.planType || "FREE"}</td>
                  <td>{formatDateValue(invite.expiresAt || invite.accessUntil)}</td>
                  <td>{Number(invite.resendCount || 0)}</td>
                  <td>
                    <div className="adminInlineActions">
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        loading={actionLoadingId === invite.id}
                        disabled={invite.inviteStatus === "used"}
                        onClick={() => handleQueueResend(invite)}
                      >
                        Queue Resend
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        loading={actionLoadingId === invite.id}
                        disabled={invite.inviteStatus === "expired" || invite.inviteStatus === "used"}
                        onClick={() => handleMarkStatus(invite, "expired")}
                      >
                        Expire
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        loading={actionLoadingId === invite.id}
                        disabled={invite.inviteStatus === "revoked" || invite.inviteStatus === "used"}
                        onClick={() => handleMarkStatus(invite, "revoked")}
                      >
                        Revoke
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <AdminEmptyState
          eyebrow="No invites"
          title="No invite records found"
          description="Create single Gmail access or bulk import with Send Invite enabled to populate this queue."
          actionLabel="Add Access"
          onAction={() => window.location.assign("/admin/content/access/add")}
          icon="I"
        />
      )}
    </AdminAccessRouteShell>
  );
}
