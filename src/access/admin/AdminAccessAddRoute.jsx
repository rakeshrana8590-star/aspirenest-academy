import React, { useMemo, useState } from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";
import { AdminReviewPanel } from "../../components/shared/admin";

import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  createAccessInvite,
  createManualAccess,
  getAccessByEmail,
  normalizeAccessEmail,
} from "../accessService";

const initialForm = {
  email: "",
  name: "",
  phone: "",
  course: ACCESS_COURSE.CTET_TET,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  planType: ACCESS_PLAN_TYPES.PREMIUM,
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  productId: "",
  accessKeyId: "",
  source: ACCESS_SOURCE.ADMIN_MANUAL,
  accessFrom: "",
  accessUntil: "",
  status: ACCESS_STATUS.ACTIVE,
  sendInvite: "yes",
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

  const bundleItemIds = useMemo(
    () =>
      form.itemIdsText
        .split(/[\n,]+/)
        .map((item) => item.replace(/^\d+[\).\-\s]+/, "").trim())
        .filter(Boolean),
    [form.itemIdsText]
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

    if (!form.scopeType) {
      nextErrors.push("Access scope is required.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN && !form.planType) {
      nextErrors.push("Plan is required for plan access.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.MODULE && !form.module) {
      nextErrors.push("Module is required for module access.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.ITEM) {
      if (!form.module) nextErrors.push("Module is required for item access.");
      if (!form.itemType) nextErrors.push("Item type is required for item access.");
      if (!form.itemId.trim()) nextErrors.push("Item ID is required for item access.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
      if (!form.bundleId.trim() && bundleItemIds.length === 0) {
        nextErrors.push("Bundle ID or bundle item IDs are required for bundle access.");
      }
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
    scopeType: form.scopeType,
    planType: form.planType,
    module: form.module || null,
    itemType: form.itemType || null,
    itemId: form.itemId.trim() || null,
    itemTitle: form.itemTitle.trim(),
    itemIds: bundleItemIds,
    bundleId: form.bundleId.trim() || null,
    productId: form.productId.trim() || null,
    accessKeyId: form.accessKeyId.trim() || null,
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
        "Existing access found for this learner. Matching logical grant will be updated safely instead of creating another active duplicate. Continue?"
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

      const accessWriteMode =
        accessRecord.accessWriteMode || "created";
      const createdNewGrant =
        accessWriteMode === "created";

      if (
        createdNewGrant &&
        form.sendInvite === "yes"
      ) {
        await createAccessInvite({
          ...payload,
          actor,
          accessId: accessRecord.id,
          status: ACCESS_STATUS.PENDING,
          inviteStatus: "pending",
          sendInvite: true,
        });
      }

      const skippedFollowUp =
        !createdNewGrant &&
        (
          form.sendInvite === "yes"
        );

      setSuccessMessage(
        (
          createdNewGrant
            ? "New logical grant created"
            : "Existing logical grant updated safely"
        ) +
          " for " +
          normalizedEmail +
          ". Audit log created." +
          (
            skippedFollowUp
              ? " Duplicate invite creation was skipped; use Invite Manager for an intentional resend."
              : ""
          )
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

  const compactAccessLabel =
    form.scopeType === ACCESS_SCOPE_TYPES.PLAN
      ? form.planType
      : form.scopeType === ACCESS_SCOPE_TYPES.MODULE
        ? "Module: " + (form.module || "-")
        : form.scopeType === ACCESS_SCOPE_TYPES.ITEM
          ? "Item: " + (form.itemTitle.trim() || form.itemId.trim() || "-")
          : form.scopeType === ACCESS_SCOPE_TYPES.BUNDLE
            ? "Bundle: " + (form.bundleId.trim() || (bundleItemIds.length ? String(bundleItemIds.length) + " items" : "-"))
            : "Access";

  const compactAccessHint =
    form.scopeType === ACCESS_SCOPE_TYPES.MODULE
      ? "Only selected module unlocks. Full plan is not unlocked."
      : form.scopeType === ACCESS_SCOPE_TYPES.ITEM
        ? "Only selected item unlocks. Full module or full plan is not unlocked."
        : form.scopeType === ACCESS_SCOPE_TYPES.BUNDLE
          ? "Only bundle items unlock. Full plan is not unlocked."
          : "Plan-level entitlement applies by selected plan.";

  return (
    <AdminAccessRouteShell
      badge="ADD ACCESS"
      title="Add Learner Access"
      description="Create learner access records with plan, course, expiry, optional invite, admin note, verified-UID claim, and final confirmation safety."
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
              compactMode={true}
      >
              <option value={ACCESS_COURSE.CTET_TET}>CTET / TET</option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>Access Scope</label>
            <select
              value={form.scopeType}
              onChange={(event) => updateField("scopeType", event.target.value)}
            >
              <option value={ACCESS_SCOPE_TYPES.PLAN}>Plan Access</option>
              <option value={ACCESS_SCOPE_TYPES.MODULE}>Module Access</option>
              <option value={ACCESS_SCOPE_TYPES.ITEM}>Single Item Access</option>
              <option value={ACCESS_SCOPE_TYPES.BUNDLE}>Bundle Access</option>
            </select>
            <small>Password/Google login is identity. Scope decides entitlement.</small>
          </div>

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
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
          ) : null}

          {form.scopeType === ACCESS_SCOPE_TYPES.MODULE ||
          form.scopeType === ACCESS_SCOPE_TYPES.ITEM ? (
            <div className="adminAccessField">
              <label>Module</label>
              <select
                value={form.module}
                onChange={(event) => updateField("module", event.target.value)}
              >
                <option value="">Select module</option>
                <option value={ACCESS_MODULE.MOCK_TEST}>Mock Tests</option>
                <option value={ACCESS_MODULE.NOTES}>Notes / PDFs</option>
                <option value={ACCESS_MODULE.VIDEO}>Videos</option>
                <option value={ACCESS_MODULE.CURRENT_AFFAIRS}>Current Affairs</option>
                <option value={ACCESS_MODULE.ROADMAP}>Roadmap</option>
              </select>
            </div>
          ) : null}

          {form.scopeType === ACCESS_SCOPE_TYPES.ITEM ? (
            <>
              <div className="adminAccessField">
                <label>Item Type</label>
                <select
                  value={form.itemType}
                  onChange={(event) => updateField("itemType", event.target.value)}
                >
                  <option value="">Select item type</option>
                  <option value={ACCESS_ITEM_TYPES.MOCK_TEST}>Mock Test</option>
                  <option value={ACCESS_ITEM_TYPES.NOTES_PDF}>Notes PDF</option>
                  <option value={ACCESS_ITEM_TYPES.VIDEO}>Video</option>
                  <option value={ACCESS_ITEM_TYPES.CURRENT_AFFAIRS_PDF}>
                    Current Affairs PDF
                  </option>
                  <option value={ACCESS_ITEM_TYPES.ROADMAP}>Roadmap</option>
                </select>
              </div>

              <div className="adminAccessField">
                <label>Item ID</label>
                <input
                  value={form.itemId}
                  onChange={(event) => updateField("itemId", event.target.value)}
                  placeholder="Exact content/test/video/PDF id"
                />
              </div>

              <div className="adminAccessField">
                <label>Item Title optional</label>
                <input
                  value={form.itemTitle}
                  onChange={(event) => updateField("itemTitle", event.target.value)}
                  placeholder="Human readable item name"
                />
              </div>
            </>
          ) : null}

          {form.scopeType === ACCESS_SCOPE_TYPES.BUNDLE ? (
            <>
              <div className="adminAccessField">
                <label>Bundle ID</label>
                <input
                  value={form.bundleId}
                  onChange={(event) => updateField("bundleId", event.target.value)}
                  placeholder="bundle-cdp-practice-pack"
                />
              </div>

              <div className="adminAccessField adminAccessFull">
                <label>Bundle Item IDs</label>
                <textarea
                  value={form.itemIdsText}
                  onChange={(event) =>
                    updateField("itemIdsText", event.target.value)
                  }
                  placeholder="One item id per line, or comma-separated IDs"
                />
                <small>{bundleItemIds.length} item IDs parsed for bundle access.</small>
              </div>
            </>
          ) : null}

          <div className="adminAccessField">
            <label>Product ID optional</label>
            <input
              value={form.productId}
              onChange={(event) => updateField("productId", event.target.value)}
              placeholder="Future catalog product id"
            />
          </div>

          <div className="adminAccessField">
            <label>Access Key ID optional</label>
            <input
              value={form.accessKeyId}
              onChange={(event) => updateField("accessKeyId", event.target.value)}
              placeholder="Future redeem key reference"
            />
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
          <AdminReviewPanel
            eyebrow="Confirmation required"
            title="Review final access summary"
            description="Save will write studentAccess, optional invite, and audit logs. Verified UID claim happens automatically after learner login."
            highlights={[
              ["Learner", normalizedEmail || "Email missing", normalizedEmail ? "success" : "warning"],
              ["Entitlement", compactAccessLabel],
              ["Validity", (form.accessFrom || "Immediate") + " → " + (form.accessUntil || "No expiry")],
            ]}
            rows={[
              ["Name", form.name.trim() || "Name optional"],
              ["Phone", form.phone.trim() || "Phone optional"],
              ["Course", form.course],
              ["Source", form.source],
              ["Invite", form.sendInvite === "yes" ? "Create invite link" : "No invite"],
              ["Status", form.status],
              ["Safety", duplicateStatusText, duplicateStatusText.includes("Duplicate") ? "warning" : "success"],
              ["Admin Note", form.adminNote.trim() || "No admin note", "default", "wide"],
              ["Scope Detail", compactAccessHint, "default", "wide"],
            ]}
            actionLabel="Confirm & Save"
            loadingLabel="Saving..."
            actionLoading={saving}
            actionDisabled={saving}
            onAction={handleConfirmSave}
            secondaryActionLabel="Edit"
            onSecondaryAction={() => setShowConfirm(false)}
            secondaryActionDisabled={saving}
            footerNote="Access save is audit-ready. Email-keyed user shells are disabled; verified UID claim happens after learner login."
          />
        ) : null}
      </div>
    </AdminAccessRouteShell>
  );
}
