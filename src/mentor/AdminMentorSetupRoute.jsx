import React, { useState } from "react";
import {
  adminLookupUserByEmail,
  adminSaveMentorProfile,
  adminSaveMentorStudentLink,
} from "./mentorService";

export default function AdminMentorSetupRoute() {
  const [mentorUid, setMentorUid] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [studentUid, setStudentUid] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState("");

  const updateMentorEmail = (value = "") => {
    setMentorEmail(value);
    setMentorUid("");
    setMentorName("");
    setMessage("");
  };

  const updateStudentEmail = (value = "") => {
    setStudentEmail(value);
    setStudentUid("");
    setStudentName("");
    setMessage("");
  };

  const findMentorAccount = async () => {
    setLookingUp("mentor");
    setMessage("");

    try {
      const account = await adminLookupUserByEmail(
        mentorEmail
      );

      setMentorUid(account.uid);
      setMentorEmail(account.email);
      setMentorName(account.displayName);
      setMessage(
        "Mentor account found. Firebase UID was filled automatically."
      );
    } catch (error) {
      setMentorUid("");
      setMentorName("");
      setMessage(
        error?.message ||
          "Mentor account could not be found."
      );
    } finally {
      setLookingUp("");
    }
  };

  const findStudentAccount = async () => {
    setLookingUp("student");
    setMessage("");

    try {
      const account = await adminLookupUserByEmail(
        studentEmail
      );

      setStudentUid(account.uid);
      setStudentEmail(account.email);
      setStudentName(account.displayName);
      setMessage(
        "Learner account found. Firebase UID was filled automatically."
      );
    } catch (error) {
      setStudentUid("");
      setStudentName("");
      setMessage(
        error?.message ||
          "Learner account could not be found."
      );
    } finally {
      setLookingUp("");
    }
  };

  const saveMentor = async () => {
    setSaving(true);
    setMessage("");

    try {
      await adminSaveMentorProfile({
        mentorUid: mentorUid.trim(),
        email: mentorEmail,
        displayName: mentorName,
      });
      setMessage(
        "Mentor role profile saved. Commercial plan access was not changed."
      );
    } catch (error) {
      setMessage(
        error?.message ||
          "Mentor profile could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveLink = async () => {
    setSaving(true);
    setMessage("");

    try {
      await adminSaveMentorStudentLink({
        mentorUid: mentorUid.trim(),
        mentorName,
        studentUid: studentUid.trim(),
        studentName,
        studentEmail,
      });
      setMessage(
        "Assigned-learner relationship saved with exact ownership scope."
      );
    } catch (error) {
      setMessage(
        error?.message ||
          "Mentor-learner link could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mentorWorkspacePage">
      <header className="mentorWorkspaceHero">
        <div>
          <span>Admin • Mentor Setup</span>
          <h1>Role and assigned-learner ownership</h1>
          <p>
            Find an existing AspireNest account by email. Its Firebase UID is
            filled automatically; this form never creates an account or changes
            a commercial plan.
          </p>
        </div>
      </header>

      <div className="mentorWorkspaceColumns">
        <section className="mentorPanel">
          <span>1. Mentor role</span>
          <h2>Find and activate mentor account</h2>

          <label>
            Mentor account email
            <input
              type="email"
              value={mentorEmail}
              onChange={(event) =>
                updateMentorEmail(
                  event.target.value
                )
              }
              placeholder="mentor@example.com"
            />
          </label>

          <button
            type="button"
            className="mentorPrimaryButton"
            onClick={findMentorAccount}
            disabled={
              saving ||
              Boolean(lookingUp)
            }
          >
            {lookingUp === "mentor"
              ? "Finding account..."
              : "Find mentor account"}
          </button>

          <label>
            Firebase UID
            <input
              value={mentorUid}
              readOnly
              aria-readonly="true"
              placeholder="Filled after email lookup"
            />
          </label>

          <label>
            Display name
            <input
              value={mentorName}
              onChange={(event) =>
                setMentorName(
                  event.target.value
                )
              }
              disabled={!mentorUid}
            />
          </label>

          <button
            type="button"
            className="mentorPrimaryButton"
            onClick={saveMentor}
            disabled={
              saving ||
              Boolean(lookingUp) ||
              !mentorUid
            }
          >
            Save mentor role
          </button>
        </section>

        <section className="mentorPanel">
          <span>2. Assigned learner</span>
          <h2>Find and link learner account</h2>

          <label>
            Learner account email
            <input
              type="email"
              value={studentEmail}
              onChange={(event) =>
                updateStudentEmail(
                  event.target.value
                )
              }
              placeholder="learner@example.com"
            />
          </label>

          <button
            type="button"
            className="mentorPrimaryButton"
            onClick={findStudentAccount}
            disabled={
              saving ||
              Boolean(lookingUp)
            }
          >
            {lookingUp === "student"
              ? "Finding account..."
              : "Find learner account"}
          </button>

          <label>
            Firebase UID
            <input
              value={studentUid}
              readOnly
              aria-readonly="true"
              placeholder="Filled after email lookup"
            />
          </label>

          <label>
            Learner name
            <input
              value={studentName}
              onChange={(event) =>
                setStudentName(
                  event.target.value
                )
              }
              disabled={!studentUid}
            />
          </label>

          <button
            type="button"
            className="mentorPrimaryButton"
            onClick={saveLink}
            disabled={
              saving ||
              Boolean(lookingUp) ||
              !mentorUid ||
              !studentUid
            }
          >
            Save assigned learner
          </button>
        </section>
      </div>

      {message ? (
        <p
          className="mentorActionMessage"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
