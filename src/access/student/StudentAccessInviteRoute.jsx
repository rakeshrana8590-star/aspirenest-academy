import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { markAccessInviteOpened, redeemAccessInvite } from "../accessService";

const getInviteStatus = (invite) => {
  if (!invite) return "loading";
  if (invite.inviteStatus === "used") return "used";
  if (invite.inviteStatus === "revoked") return "revoked";
  if (invite.inviteStatus === "expired") return "expired";

  const expiryDate = invite.expiresAt?.toDate
    ? invite.expiresAt.toDate()
    : invite.expiresAt
      ? new Date(invite.expiresAt)
      : null;

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

  const normalizedUserEmail = useMemo(
    () => String(user?.email || "").trim().toLowerCase(),
    [user?.email]
  );

  const normalizedInviteEmail = useMemo(
    () => String(invite?.normalizedEmail || invite?.email || "").trim().toLowerCase(),
    [invite]
  );

  const status = getInviteStatus(invite);
  const emailMatches = Boolean(normalizedUserEmail && normalizedInviteEmail && normalizedUserEmail === normalizedInviteEmail);
  const invitePath = `/access/invite/${inviteCode || ""}`;

  useEffect(() => {
    let mounted = true;

    const loadInvite = async () => {
      setLoading(true);
      setError("");

      try {
        const nextInvite = await markAccessInviteOpened(inviteCode, user || {});
        if (mounted) setInvite(nextInvite);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || "Invite could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (inviteCode) loadInvite();

    return () => {
      mounted = false;
    };
  }, [inviteCode, user]);

  const handleRedeem = async () => {
    setRedeeming(true);
    setMessage("");
    setError("");

    try {
      await redeemAccessInvite(inviteCode, user);
      setMessage("Access invite redeemed successfully. Complete your learner profile to continue.");
      setTimeout(() => navigate("/profile/setup"), 900);
    } catch (redeemError) {
      setError(redeemError?.message || "Invite redeem failed.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <main className="studentInvitePage">
      <section className="studentInviteHero">
        <div className="studentInviteShell studentInviteCommandShell">
          <div className="studentInviteCopy">
            <span className="studentInvitePill">ACCESS INVITE</span>
            <h1>Secure Access Invite</h1>
            <p>
              Your AspireNest Academy learning access is ready. Continue with your registered email, redeem once, and complete your learner profile.
            </p>

            <div className="studentInviteTrustRow">
              <span>✓ Login required</span>
              <span>✓ Email matched</span>
              <span>✓ Single-use secure link</span>
            </div>
          </div>

          <div className="studentInviteCommandCard">
            <div className="studentInviteCommandTop">
              <span>Invite Command</span>
              <strong>Student Workspace</strong>
            </div>

            <div className="studentInviteTitleCard">
              <div className="studentInviteIcon">A</div>
              <div>
                <h2>Access Ready</h2>
                <p>CTET / TET Learning System</p>
              </div>
            </div>

            {user && invite && (
              <div className="studentInvitePanel">
                <div className="studentInviteMetric studentInviteMetricWide">
                  <span>Invite Email</span>
                  <strong>{invite.email || invite.normalizedEmail}</strong>
                </div>
                <div className="studentInviteMetric">
                  <span>Status</span>
                  <strong>{status}</strong>
                </div>
                <div className="studentInviteMetric">
                  <span>Plan</span>
                  <strong>{invite.planType || "Access"}</strong>
                </div>
              </div>
            )}

            {loading && <div className="studentInviteNotice">Checking your secure invite...</div>}
            {error && <div className="studentInviteError">{error}</div>}
            {user && message && <div className="studentInviteSuccess">{message}</div>}

            {!user && invite && (
              <div className="studentInviteActionBox">
                <h2>Login required</h2>
                <p>Please login with your registered email to redeem this invite.</p>
                <div className="studentInviteActions">
                  {handleGoogleLogin && (
                    <button className="studentInvitePrimaryBtn" onClick={() => handleGoogleLogin(invitePath)}>
                      Continue with Google
                    </button>
                  )}
                  <button className="studentInviteSecondaryBtn" onClick={() => navigate(`/login?returnTo=${encodeURIComponent(invitePath)}`)}>
                    Go to Login
                  </button>
                </div>
              </div>
            )}

            {user && invite && !emailMatches && (
              <div className="studentInviteError">
                This invite belongs to {invite.email || invite.normalizedEmail}. Please login with that email.
              </div>
            )}

            {user && invite && emailMatches && status === "ready" && (
              <div className="studentInviteActionBox">
                <h2>Ready to unlock</h2>
                <p>Redeem this invite to link access with your learner account.</p>
                <div className="studentInviteActions">
                  <button className="studentInvitePrimaryBtn" disabled={redeeming} onClick={handleRedeem}>
                    {redeeming ? "Redeeming..." : "Redeem Invite"}
                  </button>
                  <button className="studentInviteSecondaryBtn" onClick={() => navigate("/profile/setup")}>
                    Open Profile
                  </button>
                </div>
              </div>
            )}

            {user && invite && emailMatches && status !== "ready" && (
              <div className="studentInviteError">
                This invite is {status}. Please contact AspireNest Academy admin.
              </div>
            )}

            <div className="studentInviteFlowBar">
              <span>Login</span>
              <span>Email</span>
              <span>Redeem</span>
              <span>Profile</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default StudentAccessInviteRoute;
