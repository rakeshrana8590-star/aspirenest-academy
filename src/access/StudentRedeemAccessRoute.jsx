import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  normalizeAccessKeyCode,
  redeemAccessKeyFoundation,
  validateAccessKeyForRedeem,
} from "./accessService";

export default function StudentRedeemAccessRoute({ user }) {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedCode = useMemo(() => normalizeAccessKeyCode(code), [code]);

  const userEmail = user?.email || "";
  const userUid = user?.uid || "";

  const resetMessages = () => {
    setValidationMessage("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleCodeChange = (value) => {
    setCode(value);
    resetMessages();
  };

  const handleValidateKey = async () => {
    resetMessages();

    if (!userEmail && !userUid) {
      setErrorMessage("Please login before redeeming an access key.");
      return;
    }

    if (!normalizedCode) {
      setErrorMessage("Please enter an access key code.");
      return;
    }

    setChecking(true);

    try {
      const result = await validateAccessKeyForRedeem({
        code: normalizedCode,
        email: userEmail,
        uid: userUid,
      });

      if (!result.isValid) {
        setErrorMessage(result.errors.join(" "));
        return;
      }

      const key = result.keyRecord || {};
      setValidationMessage(
        "Key is valid for " +
          (key.scopeType || "plan") +
          " access. You can redeem it now."
      );
    } catch (error) {
      setErrorMessage(error?.message || "Access key validation failed.");
    } finally {
      setChecking(false);
    }
  };

  const handleRedeemKey = async () => {
    resetMessages();

    if (!userEmail && !userUid) {
      setErrorMessage("Please login before redeeming an access key.");
      return;
    }

    if (!normalizedCode) {
      setErrorMessage("Please enter an access key code.");
      return;
    }

    const proceed = window.confirm(
      "Redeem access key " +
        normalizedCode +
        "? This will activate access for your logged-in account."
    );

    if (!proceed) return;

    setRedeeming(true);

    try {
      const result = await redeemAccessKeyFoundation({
        code: normalizedCode,
        email: userEmail,
        uid: userUid,
        learnerName: user?.displayName || "",
      });

      setSuccessMessage(
        "Access key redeemed successfully. Access ID: " +
          result.access.id +
          ". Refresh once if the new access does not appear immediately."
      );
      setCode("");
    } catch (error) {
      setErrorMessage(error?.message || "Access key redeem failed.");
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) {
    return (
      <section className="coursePages adminMockHomePage adminNotesMockAlignedPage">
        <div className="adminMockHomeShell">
          <section className="adminNotesLaunchHero">
            <div className="adminNotesLaunchHeroCopy">
              <span className="adminNotesLaunchBadge">REDEEM ACCESS</span>
              <h1>Login required</h1>
              <p>
                Please login with your learner account before redeeming an
                AspireNest access key.
              </p>

              <div className="adminNotesLaunchHeroActions">
                <button
                  type="button"
                  className="adminNotesLaunchPrimaryBtn"
                  onClick={() => navigate("/login")}
                >
                  Login to Redeem
                </button>

                <button
                  type="button"
                  className="adminNotesLaunchGhostBtn"
                  onClick={() => navigate("/ctet-tet")}
                >
                  Back to CTET/TET
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="coursePages adminMockHomePage adminNotesMockAlignedPage">
      <div className="adminMockHomeShell">
        <section className="adminNotesLaunchHero">
          <div className="adminNotesLaunchHeroCopy">
            <span className="adminNotesLaunchBadge">REDEEM ACCESS</span>
            <h1>Redeem AspireNest Access Key</h1>
            <p>
              Enter your access key to unlock plan, module, item, or bundle
              access for your logged-in learner account.
            </p>

            <div className="adminNotesLaunchTrustRow">
              <span>Code verified</span>
              <span>Email matched</span>
              <span>Access activated</span>
              <span>Audit safe</span>
            </div>
          </div>

          <div className="adminNotesLaunchSystemCard">
            <div className="adminNotesLaunchSystemTop">
              <span>Logged in as</span>
              <strong>{userEmail}</strong>
            </div>

            <div className="adminNotesLaunchTitleCard">
              <span className="adminNotesLaunchIcon">K</span>
              <div>
                <h3>Access Key</h3>
                <p>PLAN • MODULE • ITEM • BUNDLE</p>
              </div>
            </div>

            <div className="adminNotesLaunchSystemFlow">
              <span>Key</span>
              <i />
              <span>Validate</span>
              <i />
              <span>Redeem</span>
              <i />
              <span>Access</span>
            </div>
          </div>
        </section>

        <section className="adminMockCommandCenter">
          <div className="adminMockSectionTitle">
            <span>Student redeem workspace</span>
            <h2>Activate your access</h2>
            <p>
              Redeem will create a normal student access record and update the
              key usage count. Use only keys received from AspireNest Academy.
            </p>
          </div>

          <div className="adminAccessFormPanel">
            <div className="adminAccessFormGrid">
              <div className="adminAccessField adminAccessFieldWide">
                <label>Access Key Code</label>
                <input
                  value={code}
                  onChange={(event) => handleCodeChange(event.target.value)}
                  placeholder="AN-ABCD-EFGH-IJKL"
                />
              </div>

              <div className="adminAccessField">
                <label>Normalized Code</label>
                <input value={normalizedCode || "Pending"} readOnly />
              </div>

              <div className="adminAccessField">
                <label>Learner Email</label>
                <input value={userEmail || "No email found"} readOnly />
              </div>
            </div>

            {validationMessage ? (
              <div className="adminAccessSuccessBox">
                <strong>Key valid:</strong>
                <span>{validationMessage}</span>
              </div>
            ) : null}

            {successMessage ? (
              <div className="adminAccessSuccessBox">
                <strong>Redeemed:</strong>
                <span>{successMessage}</span>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="adminAccessErrorBox">
                <strong>Redeem failed:</strong>
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="adminAccessPreviewGrid">
              <article className="adminAccessPreviewCard">
                <span>Code</span>
                <strong>{normalizedCode || "Key code pending"}</strong>
                <p>Code is normalized before validation and redeem.</p>
              </article>

              <article className="adminAccessPreviewCard">
                <span>Account</span>
                <strong>{userEmail}</strong>
                <p>Access will be activated only for this logged-in account.</p>
              </article>

              <article className="adminAccessPreviewCard">
                <span>Safety</span>
                <strong>Audit logged</strong>
                <p>Redeem creates access and writes access audit history.</p>
              </article>
            </div>

            <div className="adminAccessPreviewPanel">
              <div className="adminAccessPreviewHeader">
                <span>Redeem Actions</span>
                <strong>Validate before activation</strong>
              </div>

              <div className="adminNotesLaunchHeroActions">
                <button
                  type="button"
                  className="adminNotesLaunchGhostBtn"
                  onClick={handleValidateKey}
                  disabled={checking || redeeming}
                >
                  {checking ? "Checking..." : "Validate Key"}
                </button>

                <button
                  type="button"
                  className="adminNotesLaunchPrimaryBtn"
                  onClick={handleRedeemKey}
                  disabled={checking || redeeming}
                >
                  {redeeming ? "Redeeming..." : "Redeem Access Key"}
                </button>

                <button
                  type="button"
                  className="adminNotesLaunchGhostBtn"
                  onClick={() => navigate("/ctet-tet")}
                >
                  Back to CTET/TET
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
