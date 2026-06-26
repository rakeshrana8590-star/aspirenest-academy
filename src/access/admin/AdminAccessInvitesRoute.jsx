import React, { useEffect, useMemo, useState } from "react";

import {
  auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

import {
  listAccessInvites,
  normalizeAccessEmail,
  queueAccessInviteResend,
  updateAccessInviteStatus,
  regenerateAccessInviteLink,
  } from "../accessService";

import {
  AdminButton,
  AdminEmptyState,
  AdminErrorBox,
  AdminFilterBar,
  AdminFilterField,
  AdminStatusPill,
  AdminPortalActionMenu,
} from "../../components/shared/admin";

const actions = [
  { icon: "P", label: "Pending", title: "Pending Invites", description: "Review learners waiting for invite delivery.", route: "/admin/content/access/invites", tone: "orange" },
  { icon: "Q", label: "Queued", title: "Backend Queue", description: "Track invites waiting for Phase 14B email backend.", route: "/admin/content/access/invites", tone: "blue" },
  { icon: "U", label: "Used", title: "Used Invites", description: "Confirm learners who completed invite onboarding.", route: "/admin/content/access/invites", tone: "green" },
  { icon: "L", label: "Logs", title: "Invite Audit", description: "Track invite status changes and admin notes.", route: "/admin/content/access/audit", tone: "purple" },
];

const inviteStatusOptions = ["all", "pending", "copied", "queued", "sent", "used", "expired", "revoked"];

const formatDateValue = (value) => {
  if (!value) return "Not set";
  if (typeof value === "string") return value;
  if (value.toDate) return value.toDate().toLocaleDateString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not set" : parsed.toLocaleDateString();
};

const buildInviteLinkForAdmin = (invite = {}) => {
  if (invite.inviteLink) return invite.inviteLink;
  if (!invite.inviteCode) return "";
  const origin = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "https://aspirenestacademy.in";
  return origin + "/access/invite/" + encodeURIComponent(invite.inviteCode);
};

const buildInviteWhatsAppMessage = (invite = {}) => {
  const inviteLink = buildInviteLinkForAdmin(invite);
  const learnerName = invite.learnerName || invite.name || "Student";
  const planName = invite.planType || "AspireNest Access";

  return [
    "Hello " + learnerName + ",",
    "",
    "Your AspireNest Academy learning access is ready.",
    "Plan: " + planName,
    "",
    "Open this secure invite link and continue with your registered Gmail:",
    inviteLink,
    "",
    "Note: Do not share this link. It works only with your registered email.",
    "",
    "AspireNest Academy"
  ].join(String.fromCharCode(10));
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
  const [activeInviteMenu, setActiveInviteMenu] = useState({ id: "", anchorRect: null });
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

  const handleCopyLink = async (invite) => {
    const inviteLink = buildInviteLinkForAdmin(invite);

    if (!inviteLink) {
      setError("Invite link is not available for this record.");
      return;
    }

    setActionLoadingId(invite.id);
    setMessage("");
    setError("");

    try {
      await navigator.clipboard.writeText(inviteLink);
      await updateAccessInviteStatus(invite.id, "copied", adminActor, {
        source: "admin_access_invites_route",
        action: "copy_access_invite_link",
      });
      setMessage("Invite link copied for " + (invite.email || invite.normalizedEmail) + ".");
      await loadInvites();
    } catch (copyError) {
      setError(copyError?.message || "Invite link copy failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleCopyWhatsAppMessage = async (invite) => {
    const inviteLink = buildInviteLinkForAdmin(invite);
    const messageText = buildInviteWhatsAppMessage(invite);

    if (!inviteLink) {
      setError("Invite link is not available for this record.");
      return;
    }

    setActionLoadingId(invite.id);
    setMessage("");
    setError("");

    try {
      await navigator.clipboard.writeText(messageText);
      await updateAccessInviteStatus(invite.id, "copied", adminActor, {
        source: "admin_access_invites_route",
        action: "copy_access_invite_link",
        delivery: "whatsapp_manual",
      });
      setMessage("WhatsApp invite message copied for " + (invite.email || invite.normalizedEmail) + ".");
      await loadInvites();
    } catch (copyError) {
      setError(copyError?.message || "WhatsApp message copy failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleMarkSent = async (invite) => {
    setActionLoadingId(invite.id);
    setMessage("");
    setError("");

    try {
      await updateAccessInviteStatus(invite.id, "sent", adminActor, {
        source: "admin_access_invites_route",
        action: "mark_access_invite_sent",
        delivery: "manual",
      });
      setMessage("Invite marked sent for " + (invite.email || invite.normalizedEmail) + ".");
      await loadInvites();
    } catch (sentError) {
      setError(sentError?.message || "Mark sent failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRegenerateLink = async (invite) => {
    setActionLoadingId(invite.id);
    setMessage("");
    setError("");

    try {
      const result = await regenerateAccessInviteLink(invite.id, adminActor, {
        source: "admin_access_invites_route",
      });

      if (result?.inviteLink) {
        await navigator.clipboard.writeText(result.inviteLink);
      }

      setMessage("New invite link generated and copied for " + (invite.email || invite.normalizedEmail) + ".");
      await loadInvites();
    } catch (regenError) {
      setError(regenError?.message || "Invite link regeneration failed.");
    } finally {
      setActionLoadingId("");
    }
  };

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
        action:
          nextStatus === "revoked"
            ? "revoke_access_invite"
            : nextStatus === "expired"
              ? "expire_access_invite"
              : "update_access_invite_status",
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
        compactMode={true}
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
        <div className="adminInviteListPanel">
          <div className="adminInviteListHead">
            <div>
              <span>Invite Queue</span>
              <strong>{filteredInvites.length} learner invites</strong>
            </div>
            <p>Secure invite links, delivery state, expiry, resend count, and admin actions in one clean manager view.</p>
          </div>

          <div className="adminInviteCardList">
            {filteredInvites.map((invite) => {
              const inviteLink = buildInviteLinkForAdmin(invite);
              const inviteStatus = invite.inviteStatus || "pending";
              const deliveryStatus = invite.deliveryStatus || (invite.emailSent ? "sent" : "backend pending");
              const isUsed = inviteStatus === "used";
              const isExpired = inviteStatus === "expired";
              const isRevoked = inviteStatus === "revoked";
              const linkDisabled = isUsed || !inviteLink;

              return (
                <article className="adminInviteCard" key={invite.id}>
                  <div className="adminInviteIdentity">
                    <div>
                      <span>Learner</span>
                      <strong>{invite.email || invite.normalizedEmail || "Email missing"}</strong>
                      <p>{invite.learnerName || invite.name || "Name not set"}</p>
                    </div>

                    <div className="adminInviteStatusStack">
                      <AdminStatusPill status={inviteStatus} />
                      <AdminStatusPill
                        status={deliveryStatus}
                        label={deliveryStatus}
                        tone={invite.emailSent ? "success" : "warning"}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="adminInviteMetaGrid">
                    <div><span>Plan</span><strong>{invite.planType || "FREE"}</strong></div>
                    <div><span>Expiry</span><strong>{formatDateValue(invite.expiresAt || invite.accessUntil)}</strong></div>
                    <div><span>Resend</span><strong>{Number(invite.resendCount || 0)}</strong></div>
                    <div><span>Code</span><strong>{invite.inviteCode || "Not set"}</strong></div>
                  </div>

                  <div className="adminInviteActionDock">
                    <AdminButton size="sm" variant="primary" loading={actionLoadingId === invite.id} disabled={linkDisabled} onClick={() => handleCopyLink(invite)}>Copy Link</AdminButton>
                    <AdminButton size="sm" variant="secondary" loading={actionLoadingId === invite.id} disabled={linkDisabled} onClick={() => handleCopyWhatsAppMessage(invite)}>WhatsApp</AdminButton>

                    <AdminButton
                      size="sm"
                      variant="secondary"
                      onClick={(event) =>
                        setActiveInviteMenu({
                          id: invite.id,
                          anchorRect: event.currentTarget.getBoundingClientRect(),
                        })
                      }
                    >
                      More Actions
                    </AdminButton>

                    <AdminPortalActionMenu
                      open={activeInviteMenu.id === invite.id}
                      anchorRect={activeInviteMenu.anchorRect}
                      title="Invite actions"
                      width={280}
                      onClose={() => setActiveInviteMenu({ id: "", anchorRect: null })}
                      actions={[
                        {
                          key: "mark-sent",
                          label: "Mark Sent",
                          description: "Mark this invite as sent manually.",
                          icon: "✓",
                          disabled: isUsed,
                          onClick: () => handleMarkSent(invite),
                        },
                        {
                          key: "regenerate",
                          label: "Regenerate Link",
                          description: "Create a fresh secure invite link.",
                          icon: "R",
                          disabled: isUsed,
                          onClick: () => handleRegenerateLink(invite),
                        },
                        {
                          key: "queue",
                          label: "Queue Resend",
                          description: "Add this invite to resend queue.",
                          icon: "Q",
                          disabled: isUsed,
                          onClick: () => handleQueueResend(invite),
                        },
                        {
                          key: "expire",
                          label: "Expire Invite",
                          description: "Mark this invite as expired.",
                          icon: "E",
                          tone: "warning",
                          disabled: isExpired || isUsed,
                          onClick: () => handleMarkStatus(invite, "expired"),
                        },
                        {
                          key: "revoke",
                          label: "Revoke Invite",
                          description: "Block this invite link permanently.",
                          icon: "!",
                          tone: "danger",
                          disabled: isRevoked || isUsed,
                          onClick: () => handleMarkStatus(invite, "revoked"),
                        },
                      ]}
                    />
                  </div>
                </article>
              );
            })}
          </div>
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
