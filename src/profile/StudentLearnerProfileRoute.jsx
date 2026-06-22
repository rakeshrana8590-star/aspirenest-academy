import React, { useEffect, useMemo, useState } from "react";

import "../styles/profile/learnerProfile.css";

import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "../firebase";
import {
  LEARNER_LANGUAGE_OPTIONS,
  LEARNER_TARGET_EXAMS,
} from "./learnerProfileConstants";
import {
    getLearnerProfileForUser,
    upsertLearnerLoginSnapshot,
    upsertStudentLearnerProfile,
  } from "./learnerProfileService";

const initialForm = {
  name: "",
  phone: "",
  targetExam: LEARNER_TARGET_EXAMS.CTET_TET,
  state: "",
  city: "",
  language: LEARNER_LANGUAGE_OPTIONS.HINGLISH,
};

const formatDateValue = (value) => {
  if (!value) return "No expiry set";

  if (typeof value === "string") return value;

  if (value?.toDate) {
    return value.toDate().toLocaleDateString();
  }

  return "No expiry set";
};

const buildCompletion = (form = {}) => {
  const required = ["name", "phone", "targetExam", "state", "city", "language"];
  const completed = required.filter((field) => String(form[field] || "").trim());
  const percentage = Math.round((completed.length / required.length) * 100);

  return {
    percentage,
    missing: required.filter((field) => !completed.includes(field)),
  };
};

export default function StudentLearnerProfileRoute({
  user,
  activePlan = "FREE",
  accessStatus = "active",
  membershipExpiry = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const completion = useMemo(() => buildCompletion(form), [form]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.uid || !user?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        await upsertLearnerLoginSnapshot({ user }).catch(() => null);

        const profile = await getLearnerProfileForUser(user);

        if (!mounted) return;

        if (profile) {
          setForm({
            name: profile.name || "",
            phone: profile.phone || "",
            targetExam: profile.targetExam || LEARNER_TARGET_EXAMS.CTET_TET,
            state: profile.state || "",
            city: profile.city || "",
            language: profile.language || LEARNER_LANGUAGE_OPTIONS.HINGLISH,
          });
        }
      } catch (profileError) {
        if (mounted) {
          setError(profileError?.message || "Profile load failed.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage("");
    setError("");
  };

  const handleSaveProfile = async () => {
    if (!user?.uid || !user?.email) {
      setError("Please login again to save profile.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await upsertStudentLearnerProfile({
        user,
        data: form,
      });

      setMessage("Profile saved successfully.");
    } catch (saveError) {
      setError(saveError?.message || "Profile save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setError("Email not found for password reset.");
      return;
    }

    setResettingPassword(true);
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage("Password reset link sent to your registered email.");
    } catch (resetError) {
      setError(resetError?.message || "Password reset failed.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <section className="coursePages learnerProfilePage">
      <div className="learnerProfileShell">
        <section className="learnerProfileHero">
          <div>
            <span className="badge">My Profile</span>
            <h2>Learner Biodata</h2>
            <p>
              Keep your learner biodata updated. Your email, plan, validity,
              and access status are locked and controlled by AspireNest Academy.
            </p>
          </div>

          <div className="learnerProfileStatusCard">
            <span>Profile Completion</span>
            <strong>{completion.percentage}%</strong>
            <p>
              {completion.percentage >= 100
                ? "Profile complete"
                : "Complete your biodata for better learner support."}
            </p>
          </div>
        </section>

        {loading ? (
          <div className="learnerProfileNotice">Loading learner profile...</div>
        ) : null}

        {message ? (
          <div className="learnerProfileNotice learnerProfileSuccess">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="learnerProfileNotice learnerProfileError">
            {error}
          </div>
        ) : null}

        <div className="learnerProfileGrid">
          <div className="learnerProfilePanel">
            <div className="learnerProfilePanelHeader">
              <span>Editable Biodata</span>
              <strong>Student controlled</strong>
            </div>

            <div className="learnerProfileFormGrid">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Enter your full name"
                />
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="Enter mobile number"
                />
              </label>

              <label>
                Target Exam
                <select
                  value={form.targetExam}
                  onChange={(event) =>
                    updateField("targetExam", event.target.value)
                  }
                >
                  <option value={LEARNER_TARGET_EXAMS.CTET}>CTET</option>
                  <option value={LEARNER_TARGET_EXAMS.TET}>TET</option>
                  <option value={LEARNER_TARGET_EXAMS.CTET_TET}>
                    CTET / TET
                  </option>
                  <option value={LEARNER_TARGET_EXAMS.OTHER}>Other</option>
                </select>
              </label>

              <label>
                Language
                <select
                  value={form.language}
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                >
                  <option value={LEARNER_LANGUAGE_OPTIONS.HINDI}>Hindi</option>
                  <option value={LEARNER_LANGUAGE_OPTIONS.ENGLISH}>
                    English
                  </option>
                  <option value={LEARNER_LANGUAGE_OPTIONS.GUJARATI}>
                    Gujarati
                  </option>
                  <option value={LEARNER_LANGUAGE_OPTIONS.HINGLISH}>
                    Hinglish
                  </option>
                </select>
              </label>

              <label>
                State
                <input
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                  placeholder="State"
                />
              </label>

              <label>
                City
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="City"
                />
              </label>
            </div>

            {completion.missing.length ? (
              <div className="learnerProfileMiniNotice">
                Missing: {completion.missing.join(", ")}
              </div>
            ) : null}

            <button
              type="button"
              className="btnPrimary"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Biodata"}
            </button>
          </div>

          <aside className="learnerProfilePanel learnerProfileLockPanel">
            <div className="learnerProfilePanelHeader">
              <span>Locked Access Details</span>
              <strong>Admin controlled</strong>
            </div>

            <div className="learnerProfileLockList">
              <div>
                <span>Email</span>
                <strong>{user?.email || "Not available"}</strong>
                <small>Locked</small>
              </div>

              <div>
                <span>Plan Status</span>
                <strong>{activePlan || "FREE"}</strong>
                <small>Visible only</small>
              </div>

              <div>
                <span>Access Status</span>
                <strong>{accessStatus || "active"}</strong>
                <small>Admin controlled</small>
              </div>

              <div>
                <span>Validity</span>
                <strong>{formatDateValue(membershipExpiry)}</strong>
                <small>Cannot edit</small>
              </div>
            </div>

            <button
              type="button"
              className="btnSecondary"
              onClick={handlePasswordReset}
              disabled={resettingPassword}
            >
              {resettingPassword
                ? "Sending Reset Link..."
                : "Send Password Reset Link"}
            </button>

            <div className="learnerProfileMiniNotice">
              Google login friendly: use the same registered Gmail ID for
              access matching.
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}