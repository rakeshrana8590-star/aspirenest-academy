import React from "react";

import {
  listExistingStudentDirectory,
  listLearnerProfiles,
  normalizeProfileEmail,
  upsertAdminLearnerProfile,
} from "../profile/learnerProfileService";
import { isAspireNestStudent } from "../auth/aspireNestIdentity";
import {
  buildRealStudentAcceptanceDownload,
  buildRealStudentAcceptanceReport,
} from "../profile/realStudentAcceptance";

import "./adminDriveLearnersRoute.css";

const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();

const asDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = asDate(value);
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getIdentityKey = (learner = {}, index = 0) =>
  clean(learner.uid) ||
  clean(learner.id) ||
  normalizeProfileEmail(learner.email || learner.normalizedEmail) ||
  `learner-${index}`;

const getPlan = (learner = {}) => {
  const direct = clean(
    learner.planType ||
      learner.plan ||
      learner.subscriptionType ||
      learner.premiumStatus
  ).toUpperCase();
  if (direct && direct !== "TRUE" && direct !== "FALSE") return direct;
  return learner.isPremium === true ? "PREMIUM" : "FREE";
};

const getStatus = (learner = {}) => {
  const value = clean(
    learner.status || learner.accountStatus || learner.profileStatus || "active"
  ).toLowerCase();
  if (["blocked", "suspended"].includes(value)) return "Blocked";
  if (["expired", "inactive"].includes(value)) return "Expired";
  if (["incomplete", "pending"].includes(value)) return "Pending";
  return "Active";
};

const statusClass = (status) => lower(status).replace(/[^a-z]+/g, "-");

const normalizeLearner = (learner = {}, index = 0) => ({
  ...learner,
  _key: getIdentityKey(learner, index),
  name: clean(learner.name || learner.fullName || learner.displayName) || "Learner",
  email: normalizeProfileEmail(learner.email || learner.normalizedEmail),
  username: clean(learner.username || learner.normalizedUsername),
  plan: getPlan(learner),
  status: getStatus(learner),
  progress: Number(
    learner.progress ?? learner.profileCompletion ?? learner.completionPercentage ?? 0
  ) || 0,
  accessCount: Number(
    learner.accessCount ?? learner.entitlementCount ?? learner.activeAccessCount ?? 0
  ) || 0,
  mentor: clean(learner.mentor || learner.mentorName || learner.assignedMentor) || "Unassigned",
  lastActive: learner.lastActive || learner.lastLoginAt || learner.updatedAt || learner.createdAt,
});

const mergeLearners = (students = [], profiles = []) => {
  const byKey = new Map();
  [...students, ...profiles].forEach((item, index) => {
    const normalized = normalizeLearner(item, index);
    const emailKey = normalized.email ? `email:${normalized.email}` : "";
    const uidKey = clean(normalized.uid || normalized.id)
      ? `uid:${clean(normalized.uid || normalized.id)}`
      : "";
    const existingKey = uidKey && byKey.has(uidKey)
      ? uidKey
      : emailKey && byKey.has(emailKey)
        ? emailKey
        : uidKey || emailKey || normalized._key;
    const existing = byKey.get(existingKey) || {};
    const merged = normalizeLearner({ ...existing, ...normalized }, index);
    byKey.set(existingKey, merged);
    if (uidKey) byKey.set(uidKey, merged);
    if (emailKey) byKey.set(emailKey, merged);
  });
  return Array.from(new Set(byKey.values())).filter((learner) =>
    isAspireNestStudent(learner)
  );
};

const EMPTY_FORM = Object.freeze({
  name: "",
  email: "",
  phone: "",
  targetExam: "CTET/TET",
  language: "English",
  adminNote: "",
});

export default function AdminDriveLearnersRoute({
  students = [],
  user = null,
  isAdminUser = false,
  navigate,
}) {
  const [profiles, setProfiles] = React.useState([]);
  const [directoryStudents, setDirectoryStudents] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ ...EMPTY_FORM });

  const loadProfiles = React.useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [profileItems, directoryItems] = await Promise.all([
        listLearnerProfiles({ maxCount: 500 }),
        listExistingStudentDirectory({ maxCount: 500 }),
      ]);
      setProfiles(Array.isArray(profileItems) ? profileItems : []);
      setDirectoryStudents(Array.isArray(directoryItems) ? directoryItems : []);
    } catch (error) {
      setMessage(error?.message || "Learner profiles could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  React.useEffect(() => {
    if (!modalOpen) return undefined;
    const close = (event) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [modalOpen]);

  const learners = React.useMemo(
    () => mergeLearners([...students, ...directoryStudents], profiles),
    [directoryStudents, profiles, students]
  );

  const filtered = React.useMemo(() => {
    const value = lower(query);
    if (!value) return learners;
    return learners.filter((learner) =>
      [learner.name, learner.email, learner.username, learner.plan, learner.status, learner.mentor]
        .some((field) => lower(field).includes(value))
    );
  }, [learners, query]);

  const acceptanceReport = React.useMemo(
    () =>
      buildRealStudentAcceptanceReport({
        students,
        directory: directoryStudents,
        profiles,
      }),
    [directoryStudents, profiles, students]
  );

  const downloadAcceptanceProof = () => {
    const proof = buildRealStudentAcceptanceDownload(acceptanceReport);
    const blob = new Blob([JSON.stringify(proof, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aspirenest-real-student-read-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const saveLearner = async (event) => {
    event.preventDefault();
    if (!isAdminUser || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const result = await upsertAdminLearnerProfile({
        actor: {
          uid: user?.uid || null,
          email: user?.email || "",
          role: "admin",
          isAdmin: true,
        },
        data: {
          ...form,
          email: normalizeProfileEmail(form.email),
          role: "student",
          source: "admin_created",
        },
      });
      setProfiles((current) => [result, ...current.filter((item) => item.id !== result.id)]);
      setForm({ ...EMPTY_FORM });
      setModalOpen(false);
      setMessage("Learner profile created. Account ownership and access remain UID-controlled.");
    } catch (error) {
      setMessage(error?.message || "Learner profile could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const openLearner = (learner) => {
    const email = normalizeProfileEmail(learner.email);
    if (email) {
      navigate(`/admin/content/access/profile/${encodeURIComponent(email)}`);
      return;
    }
    navigate("/admin/content/access/manage");
  };

  return (
    <main className="adminDriveLearnersPage">
      <section className="adminDriveLearnersHeading">
        <div>
          <span>PEOPLE • LEARNERS</span>
          <h1>Learners</h1>
          <p>Identity-linked profiles, exact access, progress, outcomes and mentor assignment in one premium Drive workspace.</p>
        </div>
        <div className="adminDriveLearnersActions">
          <button type="button" className="secondary" onClick={downloadAcceptanceProof} disabled={loading}>Download read proof</button>
          <button type="button" className="secondary" onClick={() => navigate("/admin/content/access/keys")}>Account migration</button>
          <button type="button" className="primary" onClick={() => setModalOpen(true)}>Add learner</button>
        </div>
      </section>

      <section className="adminDriveLearnersToolbar" aria-label="Learner filters">
        <label>
          <span>Search learners</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, username, plan or mentor" />
        </label>
        <div><strong>{filtered.length}</strong><small>of {learners.length} profiles</small></div>
        <button type="button" onClick={loadProfiles} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </section>

      <section className={`adminDriveAcceptancePanel status-${acceptanceReport.status}`} aria-label="Real student read acceptance">
        <div className="adminDriveAcceptanceCopy">
          <span>REAL STUDENT READ ACCEPTANCE</span>
          <h2>
            {loading
              ? "Reading existing AspireNest learners…"
              : `${acceptanceReport.uniqueStudents} existing students connected`}
          </h2>
          <p>
            users • students • learnerProfiles are merged read-only. Admin and Mentor identities are excluded; existing UID, plan, access, results and payments stay untouched.
          </p>
        </div>
        <div className="adminDriveAcceptanceStats">
          <div><strong>{acceptanceReport.withUid}</strong><span>UID linked</span></div>
          <div><strong>{acceptanceReport.withEmail}</strong><span>Email linked</span></div>
          <div><strong>{acceptanceReport.withProfile}</strong><span>Profiles</span></div>
          <div><strong>{acceptanceReport.staffInStudentList}</strong><span>Staff in list</span></div>
          <div><strong>{acceptanceReport.uidConflicts + acceptanceReport.emailConflicts}</strong><span>Identity conflicts</span></div>
        </div>
        <div className="adminDriveAcceptanceSafety">
          <strong>{acceptanceReport.status === "green" ? "Read acceptance ready" : acceptanceReport.status === "amber" ? "Review missing identity fields" : "Review required"}</strong>
          <span>No Firebase writes • No account recreation</span>
        </div>
      </section>

      {message ? <div className="adminDriveLearnersNotice" role="status">{message}</div> : null}

      <section className="adminDriveLearnersTableWrap">
        <table className="adminDriveLearnersTable">
          <thead>
            <tr>
              <th>Learner</th><th>Plan</th><th>Status</th><th>Progress</th><th>Access</th><th>Mentor</th><th>Last active</th><th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map((learner) => (
              <tr key={learner._key}>
                <td><strong>{learner.name}</strong><small>{learner.email || "No email"}{learner.username ? ` · @${learner.username}` : " · username not set"}</small></td>
                <td><span className="adminDrivePlanPill">{learner.plan}</span></td>
                <td><span className={`adminDriveLearnerStatus ${statusClass(learner.status)}`}>{learner.status}</span></td>
                <td><div className="adminDriveLearnerProgress"><span style={{ width: `${Math.max(0, Math.min(100, learner.progress))}%` }} /><strong>{Math.round(learner.progress)}%</strong></div></td>
                <td>{learner.accessCount}</td>
                <td>{learner.mentor}</td>
                <td>{formatDate(learner.lastActive)}</td>
                <td><button type="button" onClick={() => openLearner(learner)}>Open</button></td>
              </tr>
            )) : (
              <tr><td colSpan="8"><div className="adminDriveLearnersEmpty"><strong>No matching learners</strong><p>Change the search or add a controlled learner profile.</p></div></td></tr>
            )}
          </tbody>
        </table>
      </section>

      {modalOpen ? (
        <div className="adminDriveLearnerModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="adminDriveLearnerModal" role="dialog" aria-modal="true" aria-labelledby="addLearnerTitle">
            <header><div><span>CONTROLLED PROFILE CREATE</span><h2 id="addLearnerTitle">Add learner</h2><p>Create the identity-linked learner profile. Authentication, username claim and access remain separate controlled operations.</p></div><button type="button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button></header>
            <form onSubmit={saveLearner}>
              <label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Mobile / WhatsApp<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label>Target exam<input value={form.targetExam} onChange={(event) => setForm({ ...form, targetExam: event.target.value })} /></label>
              <label>Preferred medium<select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option>English</option><option>Hindi</option><option>Gujarati</option><option>Bilingual</option></select></label>
              <label className="full">Admin note<textarea required minLength="8" value={form.adminNote} onChange={(event) => setForm({ ...form, adminNote: event.target.value })} placeholder="Why this learner profile is being created" /></label>
              <div className="adminDriveLearnerModalSafety full"><strong>Safety boundary</strong><p>This action does not assign a commercial plan, create a Firebase Auth account or silently grant protected content.</p></div>
              <footer className="full"><button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary" disabled={saving}>{saving ? "Creating…" : "Create learner profile"}</button></footer>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
