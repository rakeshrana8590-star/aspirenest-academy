import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";
import { getAccessByEmail, normalizeAccessEmail } from "../accessService";
import { getLearnerProfilesByEmail } from "../../profile/learnerProfileService";

const formatDateValue = (value) => {
  if (!value) return "Not set";

  if (typeof value === "string") return value;

  if (value?.toDate) {
    return value.toDate().toLocaleDateString();
  }

  return "Not set";
};

const pickFirstValue = (...values) => {
  const found = values.find((value) => String(value || "").trim());
  return found || "Not available";
};

export default function AdminAccessProfileRoute() {
  const navigate = useNavigate();
  const { emailKey = "" } = useParams();

  const decodedEmail = useMemo(() => {
    try {
      return normalizeAccessEmail(decodeURIComponent(emailKey || ""));
    } catch (error) {
      return normalizeAccessEmail(emailKey || "");
    }
  }, [emailKey]);

  const [searchEmail, setSearchEmail] = useState(decodedEmail);
  const [profileRecords, setProfileRecords] = useState([]);
  const [accessRecords, setAccessRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const primaryProfile = profileRecords[0] || null;
  const primaryAccess = accessRecords[0] || null;

  const resolvedEmail = pickFirstValue(
    primaryProfile?.normalizedEmail,
    primaryProfile?.email,
    primaryAccess?.normalizedEmail,
    primaryAccess?.email,
    searchEmail
  );

  const resolvedName = pickFirstValue(
    primaryProfile?.name,
    primaryProfile?.displayName,
    primaryAccess?.learnerName,
    primaryAccess?.name
  );

  const resolvedPhone = pickFirstValue(primaryProfile?.phone, primaryAccess?.phone);
  const resolvedPlan = pickFirstValue(
    primaryAccess?.planType,
    primaryProfile?.accessPlanType,
    primaryProfile?.planType
  );
  const resolvedStatus = pickFirstValue(
    primaryAccess?.status,
    primaryProfile?.accessStatus,
    primaryProfile?.profileStatus
  );
  const resolvedValidity = primaryAccess?.accessUntil || primaryProfile?.membershipExpiry || primaryProfile?.accessUntil;

  const profileCompletion =
    primaryProfile?.profileCompletion || primaryProfile?.profileCompletion === 0
      ? primaryProfile.profileCompletion
      : "Not available";

  const loadLearnerProfile = async (emailValue = searchEmail) => {
    const normalizedEmail = normalizeAccessEmail(emailValue);

    if (!normalizedEmail) {
      setMessage("Enter learner email to search profile.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const [profiles, access] = await Promise.all([
        getLearnerProfilesByEmail(normalizedEmail),
        getAccessByEmail(normalizedEmail),
      ]);

      setProfileRecords(Array.isArray(profiles) ? profiles : []);
      setAccessRecords(Array.isArray(access) ? access : []);

      if (!profiles?.length && !access?.length) {
        setMessage("No learner profile or access record found for this email.");
      }
    } catch (error) {
      setMessage(error?.message || "Learner profile load failed.");
      setProfileRecords([]);
      setAccessRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (decodedEmail) {
      loadLearnerProfile(decodedEmail);
    }
  }, [decodedEmail]);

  return (
    <AdminAccessRouteShell
      badge="LEARNER PROFILE"
      title="Learner Profile"
      description="Review learner biodata, locked access details, plan validity, source, and linked access records from one admin-safe profile view."
      icon="P"
      primaryAction={{ label: "Manage Access", route: "/admin/content/access/manage" }}
      secondaryAction={{ label: "Audit Logs", route: "/admin/content/access/audit" }}
      sectionTitle="Learner biodata"
      sectionDescription="Admin can view full learner profile and linked access records. Student biodata and admin-controlled access remain separate."
      stats={[
        { value: profileRecords.length ? "Found" : "Search", label: "Profile" },
        { value: accessRecords.length ? String(accessRecords.length) : "0", label: "Access Records" },
        { value: String(profileCompletion), label: "Completion" },
        { value: resolvedPlan, label: "Plan" },
      ]}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessFormGrid">
          <div className="adminAccessField adminAccessFull">
            <label>Search Learner Email</label>
            <input
              value={searchEmail}
              onChange={(event) => setSearchEmail(event.target.value)}
              placeholder="learner@gmail.com"
            />
          </div>
        </div>

        <div className="adminNotesLaunchHeroActions">
          <button
            type="button"
            className="adminNotesLaunchPrimaryBtn"
            onClick={() => loadLearnerProfile(searchEmail)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Search Profile"}
          </button>

          <button
            type="button"
            className="adminNotesLaunchGhostBtn"
            onClick={() => navigate("/admin/content/access/manage")}
          >
            Manage Access
          </button>
        </div>

        {message ? (
          <div className="adminAccessNotice">{message}</div>
        ) : null}
      </div>

      <div className="adminAccessTablePanel">
        <div className="adminAccessTable">
          <div className="adminAccessRow">
            <strong>Registered Email</strong>
            <span>{resolvedEmail}</span>
            <span className="adminAccessPill">Locked</span>
            <span>Student cannot edit</span>
          </div>

          <div className="adminAccessRow">
            <strong>Name</strong>
            <span>{resolvedName}</span>
            <span className="adminAccessPill">Biodata</span>
            <span>Student editable</span>
          </div>

          <div className="adminAccessRow">
            <strong>Phone</strong>
            <span>{resolvedPhone}</span>
            <span className="adminAccessPill">Biodata</span>
            <span>Student editable</span>
          </div>

          <div className="adminAccessRow">
            <strong>Target Exam</strong>
            <span>{pickFirstValue(primaryProfile?.targetExam)}</span>
            <span className="adminAccessPill">Profile</span>
            <span>Structured</span>
          </div>

          <div className="adminAccessRow">
            <strong>State / City</strong>
            <span>
              {pickFirstValue(primaryProfile?.state)} / {pickFirstValue(primaryProfile?.city)}
            </span>
            <span className="adminAccessPill">Location</span>
            <span>Biodata</span>
          </div>

          <div className="adminAccessRow">
            <strong>Language</strong>
            <span>{pickFirstValue(primaryProfile?.language)}</span>
            <span className="adminAccessPill">Preference</span>
            <span>Support</span>
          </div>

          <div className="adminAccessRow">
            <strong>Profile Status</strong>
            <span>{pickFirstValue(primaryProfile?.profileStatus)}</span>
            <span className="adminAccessPill">Completion</span>
            <span>{profileCompletion}%</span>
          </div>

          <div className="adminAccessRow">
            <strong>Plan Status</strong>
            <span>{resolvedPlan}</span>
            <span className="adminAccessPill">Access</span>
            <span>{resolvedStatus}</span>
          </div>

          <div className="adminAccessRow">
            <strong>Validity</strong>
            <span>{formatDateValue(resolvedValidity)}</span>
            <span className="adminAccessPill">Locked</span>
            <span>Admin controlled</span>
          </div>

          <div className="adminAccessRow">
            <strong>Source</strong>
            <span>{pickFirstValue(primaryAccess?.source, primaryProfile?.source)}</span>
            <span className="adminAccessPill">Trace</span>
            <span>Access/Profile</span>
          </div>

          <div className="adminAccessRow">
            <strong>Last Login</strong>
            <span>{formatDateValue(primaryProfile?.lastLoginAt)}</span>
            <span className="adminAccessPill">Activity</span>
            <span>Snapshot</span>
          </div>

          <div className="adminAccessRow">
            <strong>Admin Note</strong>
            <span>{pickFirstValue(primaryAccess?.adminNote, primaryProfile?.adminNote)}</span>
            <span className="adminAccessPill">Admin</span>
            <span>Locked from student</span>
          </div>
        </div>
      </div>

      <div className="adminAccessTablePanel">
        <div className="adminMockSectionTitle">
          <span>Linked access records</span>
          <h2>Access and profile are separate</h2>
          <p>
            Learner biodata is stored separately from student access records.
            Access changes remain admin controlled.
          </p>
        </div>

        <div className="adminAccessTable">
          {accessRecords.length ? (
            accessRecords.map((record) => (
              <div className="adminAccessRow" key={record.id}>
                <strong>{record.planType || "FREE"}</strong>
                <span>{record.email || record.normalizedEmail}</span>
                <span className="adminAccessPill">{record.status || "active"}</span>
                <span>{formatDateValue(record.accessUntil)}</span>
              </div>
            ))
          ) : (
            <div className="adminAccessRow">
              <strong>No access records</strong>
              <span>{resolvedEmail}</span>
              <span className="adminAccessPill">Empty</span>
              <span>Search or create access</span>
            </div>
          )}
        </div>
      </div>
    </AdminAccessRouteShell>
  );
}