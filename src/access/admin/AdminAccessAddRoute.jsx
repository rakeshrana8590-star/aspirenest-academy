import React, { useMemo, useState } from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

import {
  ACCESS_COURSE,
  ACCESS_PLAN_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  createAccessInvite,
  createManualAccess,
  createUserAccessShell,
  getAccessByEmail,
  normalizeAccessEmail,
} from "../accessService";

const initialForm = {
  email: "",
  name: "",
  phone: "",
  course: ACCESS_COURSE.CTET_TET,
  planType: ACCESS_PLAN_TYPES.PREMIUM,
  source: ACCESS_SOURCE.ADMIN_MANUAL,
  accessFrom: "",
  accessUntil: "",
  status: ACCESS_STATUS.ACTIVE,
  sendInvite: "yes",
  createUserShell: "yes",
  adminNote: "",
};

export default function AdminAccessAddRoute() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [duplicateRecords, setDuplicateRecords] = useState([]);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const normalizedEmail = useMemo(
    () => normalizeAccessEmail(form.email),
    [form.email]
  );

  const duplicateCourseMatches = useMemo(() => {
    const selectedCourse = String(form.course || "").trim().toLowerCase();

    return duplicateRecords.filter((record) => {
      const recordCourse = String(record.course || "").trim().toLowerCase();
      return !recordCourse || recordCourse === selectedCourse;
    });
  }, [duplicateRecords, form.course]);

  const duplicateStatusText = duplicateError
    ? "Duplicate check failed: " + duplicateError
    : duplicateCourseMatches.length
      ? String(duplicateCourseMatches.length) +
        " possible existing access record found for this email/course"
      : duplicateRecords.length
        ? String(duplicateRecords.length) +
          " access record found for this email in another course/source"
        : "No existing access found for this email";

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setShowConfirm(false);
    setDuplicateRecords([]);
    setDuplicateError("");
    setSuccessMessage("");
    setSaveError("");
  };

  const validateForm = () => {
    const nextErrors = [];

    if (!normalizedEmail) {
      nextErrors.push("Email is required.");
    }

    if (normalizedEmail && !normalizedEmail.includes("@")) {
      nextErrors.push("Enter a valid Gmail/email address.");
    }

    if (!form.course) {
      nextErrors.push("Course is required.");
    }

    if (!form.planType) {
      nextErrors.push("Plan is required.");
    }

    if (!form.status) {
      nextErrors.push("Status is required.");
    }

    if (!form.adminNote.trim()) {
      nextErrors.push("Admin note is required for audit clarity.");
    }

    if (form.accessFrom && form.accessUntil) {
      const fromTime = new Date(form.accessFrom).getTime();
      const untilTime = new Date(form.accessUntil).getTime();

      if (
        Number.isFinite(fromTime) &&
        Number.isFinite(untilTime) &&
        untilTime < fromTime
      ) {
        nextErrors.push("Access Until cannot be before Access From.");
      }
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const buildPayload = () => ({
    email: normalizedEmail,
    learnerName: form.name.trim(),
    name: form.name.trim(),
    phone: form.phone.trim(),
    course: form.course,
    planType: form.planType,
    source: form.source,
    accessFrom: form.accessFrom || null,
    accessUntil: form.accessUntil || null,
    status: form.status,
    adminNote: form.adminNote.trim(),
    notes: form.adminNote.trim(),
  });

  const buildActor = () => {
    const currentUser = auth.currentUser;

    return {
      uid: currentUser?.uid || null,
      email: currentUser?.email || "",
      role: "admin",
      isAdmin: true,
    };
  };

  const checkDuplicateAccess = async () => {
    if (!normalizedEmail) {
      setDuplicateRecords([]);
      return [];
    }

    setDuplicateLoading(true);
    setDuplicateError("");

    try {
      const records = await getAccessByEmail(normalizedEmail);
      const safeRecords = Array.isArray(records) ? records : [];

      const selectedCourse = String(form.course || "").trim().toLowerCase();

      const courseRecords = safeRecords.filter((record) => {
        const recordCourse = String(record.course || "").trim().toLowerCase();
        return !recordCourse || recordCourse === selectedCourse;
      });

      setDuplicateRecords(safeRecords);
      return courseRecords;
    } catch (error) {
      const message = error?.message || "Duplicate check failed.";
      setDuplicateError(message);
      return [];
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handlePreview = async () => {
    setSuccessMessage("");
    setSaveError("");

    if (!validateForm()) {
      setShowConfirm(false);
      return;
    }

    await checkDuplicateAccess();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setSaveError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    const actor = buildActor();

    if (!actor.email) {
      setSaveError("Admin login session not found. Please login again.");
      return;
    }

    if (duplicateError) {
      const proceedWithoutDuplicateCheck = window.confirm(
        "Duplicate check failed. Continue only if you have manually verified this learner."
      );

      if (!proceedWithoutDuplicateCheck) return;
    }

    if (duplicateCourseMatches.length) {
      const proceedDuplicate = window.confirm(
        "Existing access found for this email/course. Continue only if this is intentional."
      );

      if (!proceedDuplicate) return;
    }

    const proceed = window.confirm(
      "Confirm save access for " +
        normalizedEmail +
        "? This will write studentAccess and audit logs."
    );

    if (!proceed) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      const accessRecord = await createManualAccess({
        ...payload,
        actor,
      });

      if (form.createUserShell === "yes") {
        await createUserAccessShell({
          ...payload,
          actor,
        });
      }

      if (form.sendInvite === "yes") {
        await createAccessInvite({
          ...payload,
          actor,
          accessId: accessRecord.id,
          status: ACCESS_STATUS.PENDING,
          inviteStatus: "pending",
          sendInvite: true,
        });
      }

      setSuccessMessage(
        "Access saved successfully for " +
          normalizedEmail +
          ". Audit log created."
      );

      setShowConfirm(false);
      setDuplicateRecords([]);
    } catch (error) {
      setSaveError(error?.message || "Access save failed.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors([]);
    setShowConfirm(false);
    setDuplicateRecords([]);
    setDuplicateError("");
    setSuccessMessage("");
    setSaveError("");
  };

  const previewRows = [
    ["Email", normalizedEmail || "Not set"],
    ["Name", form.name.trim() || "Optional"],
    ["Phone", form.phone.trim() || "Optional"],
    ["Course", form.course],
    ["Plan", form.planType],
    ["Source", form.source],
    ["Access From", form.accessFrom || "Immediate"],
    ["Access Until", form.accessUntil || "No expiry set"],
    ["Status", form.status],
    [
      "Send Invite",
      form.sendInvite === "yes" ? "Yes - create invite record" : "No",
    ],
    [
      "User Shell",
      form.createUserShell === "yes" ? "Yes - sync users shell" : "No",
    ],
    ["Duplicate Warning", duplicateStatusText],
    ["Admin Note", form.adminNote.trim()],
  ];

  return (
    <AdminAccessRouteShell
      badge="ADD ACCESS"
      title="Add Learner Access"
      description="Create learner access records with plan, course, expiry, optional invite, user shell, admin note, and final confirmation safety."
      icon="+"
      primaryAction={{
        label: "Manage Access",
        route: "/admin/content/access/manage",
      }}
      secondaryAction={{
        label: "Bulk Import",
        route: "/admin/content/access/bulk",
      }}
      sectionTitle="Single Gmail access"
      sectionDescription="Fill learner details, validate normalized email, then preview confirmation before any Firestore write is allowed."
      stats={[
        { value: "Email", label: "Required" },
        { value: "Plan", label: "Required" },
        { value: "Note", label: "Audit" },
        { value: "Confirm", label: "Before Save" },
      ]}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessFormGrid">
          <div className="adminAccessField">
            <label>Email</label>
            <input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="learner@gmail.com"
            />
            <small>Normalized: {normalizedEmail || "-"}</small>
          </div>

          <div className="adminAccessField">
            <label>Name optional</label>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Learner name"
            />
          </div>

          <div className="adminAccessField">
            <label>Phone optional</label>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="Mobile number"
            />
          </div>

          <div className="adminAccessField">
            <label>Course</label>
            <select
              value={form.course}
              onChange={(event) => updateField("course", event.target.value)}
            >
              <option value={ACCESS_COURSE.CTET_TET}>CTET / TET</option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>Plan</label>
            <select
              value={form.planType}
              onChange={(event) => updateField("planType", event.target.value)}
            >
              <option value={ACCESS_PLAN_TYPES.FREE}>FREE</option>
              <option value={ACCESS_PLAN_TYPES.BASIC}>BASIC</option>
              <option value={ACCESS_PLAN_TYPES.PREMIUM}>PREMIUM</option>
              <option value={ACCESS_PLAN_TYPES.MENTORSHIP}>MENTORSHIP</option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>Source</label>
            <select
              value={form.source}
              onChange={(event) => updateField("source", event.target.value)}
            >
              <option value={ACCESS_SOURCE.ADMIN_MANUAL}>Admin Manual</option>
              <option value={ACCESS_SOURCE.PAYMENT}>Payment</option>
              <option value={ACCESS_SOURCE.BULK_IMPORT}>Bulk Import</option>
              <option value={ACCESS_SOURCE.TRIAL}>Trial</option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>Access From</label>
            <input
              type="date"
              value={form.accessFrom}
              onChange={(event) => updateField("accessFrom", event.target.value)}
            />
          </div>

          <div className="adminAccessField">
            <label>Access Until</label>
            <input
              type="date"
              value={form.accessUntil}
              onChange={(event) =>
                updateField("accessUntil", event.target.value)
              }
            />
          </div>

          <div className="adminAccessField">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              <option value={ACCESS_STATUS.ACTIVE}>Active</option>
              <option value={ACCESS_STATUS.PENDING}>Pending</option>
              <option value={ACCESS_STATUS.EXPIRED}>Expired</option>
              <option value={ACCESS_STATUS.BLOCKED}>Blocked</option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>Send Invite</label>
            <select
              value={form.sendInvite}
              onChange={(event) =>
                updateField("sendInvite", event.target.value)
              }
            >
              <option value="yes">Yes - create invite record</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>User Shell</label>
            <select
              value={form.createUserShell}
              onChange={(event) =>
                updateField("createUserShell", event.target.value)
              }
            >
              <option value="yes">Yes - update users shell</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="adminAccessField adminAccessFull">
            <label>Admin Note</label>
            <textarea
              value={form.adminNote}
              onChange={(event) =>
                updateField("adminNote", event.target.value)
              }
              placeholder="Reason, payment note, receipt reference, learner context..."
            />
          </div>
        </div>

        {errors.length ? (
          <div className="adminAccessNotice">
            <strong>Fix before preview:</strong> {errors.join(" ")}
          </div>
        ) : null}

        {saveError ? (
          <div className="adminAccessNotice">
            <strong>Save failed:</strong> {saveError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="adminAccessNotice">
            <strong>Success:</strong> {successMessage}
          </div>
        ) : null}

        <div className="adminNotesLaunchHeroActions">
          <button
            type="button"
            className="adminNotesLaunchPrimaryBtn"
            onClick={handlePreview}
            disabled={duplicateLoading || saving}
          >
            {duplicateLoading ? "Checking..." : "Preview Confirmation"}
          </button>

          <button
            type="button"
            className="adminNotesLaunchGhostBtn"
            onClick={resetForm}
            disabled={saving}
          >
            Reset
          </button>
        </div>

        {showConfirm ? (
          <div className="adminAccessNotice">
            <strong>Confirmation required:</strong> Review details before
            creating access. Save will write studentAccess and audit logs.

            <div className="adminAccessTable">
              {previewRows.map(([label, value]) => (
                <div className="adminAccessRow" key={label}>
                  <strong>{label}</strong>
                  <span>{value}</span>
                  <span className="adminAccessPill">Review</span>
                  <span>Ready</span>
                </div>
              ))}
            </div>

            <div className="adminNotesLaunchHeroActions">
              <button
                type="button"
                className="adminNotesLaunchPrimaryBtn"
                onClick={handleConfirmSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Confirm & Save Access"}
              </button>

              <button
                type="button"
                className="adminNotesLaunchGhostBtn"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AdminAccessRouteShell>
  );
}