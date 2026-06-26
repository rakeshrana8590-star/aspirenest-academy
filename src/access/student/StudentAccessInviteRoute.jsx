import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { markAccessInviteOpened, redeemAccessInvite } from "../accessService";

const getInviteStatus = (invite) => {
  if (!invite) return "loading";
  if (invite.inviteStatus === "used") return "used";
  if (invite.inviteStatus === "revoked") return "revoked";
  if (invite.inviteStatus === "expired") return "expired";
  const expiryDate = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : invite.expiresAt ? new Date(invite.expiresAt) : null;
  if (expiryDate && expiryDate.getTime() < Date.now()) return "expired";
  return "ready";
};

const StudentAccessInviteRoute = ({ user, handleGoogleLogin }) => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedUserEmail = useMemo(() => String(user?.email || "").trim().toLowerCase(), [user?.email]);
  const normalizedInviteEmail = useMemo(() => String(invite?.normalizedEmail || invite?.email || "").trim().toLowerCase(), [invite]);
  const status = getInviteStatus(invite);
  const emailMatches = Boolean(normalizedUserEmail && normalizedInviteEmail && normalizedUserEmail === normalizedInviteEmail);
  const invitePath = `/access/invite/${inviteCode || ""}`;

  useEffect(() => {
    let mounted = true;

    const loadInvite = async () => {
      if (!inviteCode || !user?.email) return;
      setLoading(true);
      setError("");
      try {
        const record = await markAccessInviteOpened(inviteCode, user);
        if (mounted) setInvite(record);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || "Invite could not be loaded. Please login with invited email.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInvite();

    return () => {
      mounted = false;
    };
  }, [inviteCode, user?.email]);

  const handleRedeem = async () => {
    setRedeeming(true);
    setMessage("");
    setError("");

    try {
      await redeemAccessInvite(inviteCode, user);
      setMessage("Access invite redeemed successfully. Complete your learner profile to continue.");
      setTimeout(() => navigate("/my-profile"), 900);
    } catch (redeemError) {
      setError(redeemError?.message || "Invite redeem failed.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <main className="adminAccessShell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <section className="adminAccessPanel" style={{ width: "100%", maxWidth: "760px" }}>
        <p className="adminEyebrow">AspireNest Academy Invite</p>
        <h1>Secure Access Invite</h1>
        <p className="adminMuted">Use your registered email to redeem this invite. Admin never shares or creates your password.</p>

        {!user && (
          <div className="adminEmptyState">
            <h3>Login required</h3>
            <p>Please continue with the Gmail address where this invite was issued.</p>
            <div className="adminAccessActions">
              {handleGoogleLogin && (
                  <button className="adminPrimaryBtn" onClick={() => handleGoogleLogin(invitePath)}>
                    Continue with Google
                  </button>
                )}
                <button className="adminSecondaryBtn" onClick={() => navigate(`/login?returnTo=${encodeURIComponent(invitePath)}`)}>
                  Go to Login
                </button>
            </div>
          </div>
        )}

        {user && loading && <div className="adminEmptyState"><p>Checking invite...</p></div>}
        {user && error && <div className="adminErrorBox">{error}</div>}
        {user && message && <div className="adminSuccessBox">{message}</div>}

        {user && invite && (
          <div className="adminAccessCardGrid">
            <article className="adminAccessCard">
              <span>Invite Email</span>
              <strong>{invite.email || invite.normalizedEmail}</strong>
            </article>
            <article className="adminAccessCard">
              <span>Status</span>
              <strong>{status}</strong>
            </article>
            <article className="adminAccessCard">
              <span>Plan</span>
              <strong>{invite.planType || "Access"}</strong>
            </article>
          </div>
        )}

        {user && invite && !emailMatches && (
          <div className="adminErrorBox">This invite belongs to {invite.email || invite.normalizedEmail}. Please login with that email.</div>
        )}

        {user && invite && emailMatches && status === "ready" && (
          <div className="adminAccessActions" style={{ marginTop: "18px" }}>
            <button className="adminPrimaryBtn" disabled={redeeming} onClick={handleRedeem}>
              {redeeming ? "Redeeming..." : "Redeem Invite"}
            </button>
            <button className="adminSecondaryBtn" onClick={() => navigate("/my-profile")}>Open Profile</button>
          </div>
        )}

        {user && invite && emailMatches && status !== "ready" && (
          <div className="adminErrorBox">This invite is {status}. Please contact AspireNest Academy admin.</div>
        )}
      </section>
    </main>
  );
};

export default StudentAccessInviteRoute;