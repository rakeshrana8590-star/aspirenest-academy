import React, { useEffect, useMemo, useState } from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_KEY_STATUS,
  ACCESS_MODULE,
  ACCESS_PLAN_TYPES,
  ACCESS_SCOPE_TYPES,
} from "../accessConstants";

import {
  createAccessKey,
  listAccessKeys,
  normalizeAccessKeyCode,
} from "../accessService";

const initialForm = {
  code: "",
  assignedEmail: "",
  productId: "",
  course: ACCESS_COURSE.CTET_TET,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  planType: ACCESS_PLAN_TYPES.PREMIUM,
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  maxUses: "1",
  validityDays: "30",
  accessFrom: "",
  accessUntil: "",
  status: ACCESS_KEY_STATUS.ACTIVE,
  adminNote: "",
};

const keyActions = [
  {
    icon: "K",
    label: "Key",
    title: "Create Access Key",
    description:
      "Generate redeem keys linked to plan, module, item, bundle, or product entitlement.",
    route: "/admin/content/access/keys",
    tone: "green",
  },
  {
    icon: "P",
    label: "Product",
    title: "Open Products",
    description:
      "Create catalog products first, then connect access keys with product and scope metadata.",
    route: "/admin/content/access/products",
    tone: "orange",
  },
];

const buildRandomKeyCode = () => {
  const chunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return "AN-" + chunk() + "-" + chunk() + "-" + chunk();
};

export default function AdminAccessKeysRoute() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [accessKeys, setAccessKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  const normalizedCode = useMemo(
    () => normalizeAccessKeyCode(form.code),
    [form.code]
  );

  const bundleItemIds = useMemo(
    () =>
      form.itemIdsText
        .split(/[\n,]+/)
        .map((item) => item.replace(/^\d+[\).\-\s]+/, "").trim())
        .filter(Boolean),
    [form.itemIdsText]
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors([]);
    setSaveError("");
    setSuccessMessage("");
  };

  const buildActor = () => {
    const currentUser = auth.currentUser;

    return {
      uid: currentUser?.uid || null,
      email: currentUser?.email || "",
      role: "admin",
      isAdmin: true,
    };
  };

  const loadAccessKeys = async () => {
    setLoadingKeys(true);

    try {
      const keys = await listAccessKeys({ maxCount: 25 });
      setAccessKeys(keys);
    } catch (error) {
      setSaveError(error && error.message ? error.message : "Access keys load failed.");
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadAccessKeys();
  }, []);
  const validateForm = () => {
    const nextErrors = [];

    if (!normalizedCode) {
      nextErrors.push("Access key code is required.");
    }

    if (!form.course) {
      nextErrors.push("Course is required.");
    }

    if (!form.scopeType) {
      nextErrors.push("Scope type is required.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN && !form.planType) {
      nextErrors.push("Plan is required for plan key.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.MODULE && !form.module) {
      nextErrors.push("Module is required for module key.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.ITEM) {
      if (!form.module) nextErrors.push("Module is required for item key.");
      if (!form.itemType) nextErrors.push("Item type is required for item key.");
      if (!form.itemId.trim()) nextErrors.push("Item ID is required for item key.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
      if (!form.bundleId.trim() && bundleItemIds.length === 0) {
        nextErrors.push("Bundle ID or bundle item IDs are required for bundle key.");
      }
    }

    if (Number(form.maxUses || 0) < 1) {
      nextErrors.push("Max uses must be at least 1.");
    }

    if (Number(form.validityDays || 0) < 0) {
      nextErrors.push("Validity days cannot be negative.");
    }

    if (form.accessFrom && form.accessUntil) {
      const fromTime = new Date(form.accessFrom).getTime();
      const untilTime = new Date(form.accessUntil).getTime();

      if (Number.isFinite(fromTime) && Number.isFinite(untilTime) && untilTime < fromTime) {
        nextErrors.push("Access until cannot be before access from.");
      }
    }

    if (!form.status) {
      nextErrors.push("Status is required.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const buildPayload = () => ({
    code: normalizedCode,
    assignedEmail: form.assignedEmail.trim(),
    productId: form.productId.trim() || null,
    course: form.course,
    scopeType: form.scopeType,
    planType: form.planType,
    module: form.module || null,
    itemType: form.itemType || null,
    itemId: form.itemId.trim() || null,
    itemTitle: form.itemTitle.trim(),
    itemIds: bundleItemIds,
    bundleId: form.bundleId.trim() || null,
    maxUses: Number(form.maxUses || 1),
    validityDays: Number(form.validityDays || 0),
    accessFrom: form.accessFrom || null,
    accessUntil: form.accessUntil || null,
    status: form.status,
    adminNote: form.adminNote.trim(),
    notes: form.adminNote.trim(),
  });

  const handleGenerateCode = () => {
    updateField("code", buildRandomKeyCode());
  };

  const handleSaveKey = async () => {
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

    const proceed = window.confirm(
      "Confirm create access key: " +
        normalizedCode +
        "? This will write accessKeys and audit logs."
    );

    if (!proceed) return;

    setSaving(true);

    try {
      const keyRecord = await createAccessKey({
        ...buildPayload(),
        actor,
      });

      setSuccessMessage(
        "Access key created successfully. Key ID: " + keyRecord.id
      );
      setForm(initialForm);
      setErrors([]);
      await loadAccessKeys();
    } catch (error) {
      setSaveError(error?.message || "Access key save failed.");
    } finally {
      setSaving(false);
    }
  };

  const previewRows = [
    ["Code", normalizedCode || "Required"],
    ["Assigned Email", form.assignedEmail.trim() || "Open key"],
    ["Product ID", form.productId.trim() || "Optional"],
    ["Scope", form.scopeType],
    ["Plan", form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? form.planType : "Not plan scoped"],
    ["Module", form.module || "Not module scoped"],
    ["Item Type", form.itemType || "Not item scoped"],
    ["Item ID", form.itemId.trim() || "Not item scoped"],
    ["Item Title", form.itemTitle.trim() || "Optional"],
    ["Bundle ID", form.bundleId.trim() || "Not bundle scoped"],
    ["Bundle Items", bundleItemIds.length ? bundleItemIds.join(", ") : "Not bundle scoped"],
    ["Max Uses", form.maxUses || "1"],
    ["Validity Days", form.validityDays || "0"],
    ["Access From", form.accessFrom || "Immediate"],
    ["Access Until", form.accessUntil || "No expiry set"],
    ["Status", form.status],
  ];

  return (
    <AdminAccessRouteShell
      badge="ACCESS KEYS"
      title="Access Key Workspace"
      description="Create redeem-key records for learner unlocks. Keys can activate plan, module, item, or bundle access after the redeem flow is connected."
      icon="K"
      moduleMeta="REDEEM KEY FOUNDATION"
      stats={[
        { value: "Active", label: "Keys" },
        { value: "Used", label: "Redeem" },
        { value: "Expiry", label: "Watch" },
        { value: "Audit", label: "Logs" },
      ]}
      trustItems={["Code unique", "Product linked", "Redeem safe", "Audit ready"]}
      primaryAction={{
        label: "Open Products",
        route: "/admin/content/access/products",
      }}
      secondaryAction={{
        label: "Back to Access",
        route: "/admin/content/access",
      }}
      sectionTitle="Create access key"
      sectionDescription="Build one redeem key at a time. Key save writes accessKeys and accessAuditLogs only; learner access will be created later by the redeem flow."
      actions={keyActions}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessFormGrid">
          <div className="adminAccessField">
            <label>Access Key Code</label>
            <input
              value={form.code}
              onChange={(event) => updateField("code", event.target.value)}
              placeholder="AN-ABCD-EFGH-IJKL"
            />
          </div>

          <div className="adminAccessField">
            <label>Generate</label>
            <button
              type="button"
              className="adminAccessPrimaryButton"
              onClick={handleGenerateCode}
            >
              Generate Code
            </button>
          </div>

          <div className="adminAccessField">
            <label>Assigned Email optional</label>
            <input
              value={form.assignedEmail}
              onChange={(event) => updateField("assignedEmail", event.target.value)}
              placeholder="learner@gmail.com"
            />
          </div>

          <div className="adminAccessField">
            <label>Product ID optional</label>
            <input
              value={form.productId}
              onChange={(event) => updateField("productId", event.target.value)}
              placeholder="accessProducts document id"
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
            <label>Scope Type</label>
            <select
              value={form.scopeType}
              onChange={(event) => updateField("scopeType", event.target.value)}
            >
              <option value={ACCESS_SCOPE_TYPES.PLAN}>Plan Key</option>
              <option value={ACCESS_SCOPE_TYPES.MODULE}>Module Key</option>
              <option value={ACCESS_SCOPE_TYPES.ITEM}>Item Key</option>
              <option value={ACCESS_SCOPE_TYPES.BUNDLE}>Bundle Key</option>
            </select>
          </div>

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
            <div className="adminAccessField">
              <label>Plan</label>
              <select
                value={form.planType}
                onChange={(event) => updateField("planType", event.target.value)}
              >
                {Object.values(ACCESS_PLAN_TYPES).map((plan) => (
                  <option value={plan} key={plan}>
                    {plan}
                  </option>
                ))}
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
                {Object.values(ACCESS_MODULE).map((module) => (
                  <option value={module} key={module}>
                    {module}
                  </option>
                ))}
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
                  {Object.values(ACCESS_ITEM_TYPES).map((itemType) => (
                    <option value={itemType} key={itemType}>
                      {itemType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="adminAccessField">
                <label>Item ID</label>
                <input
                  value={form.itemId}
                  onChange={(event) => updateField("itemId", event.target.value)}
                  placeholder="content item / mock test / video id"
                />
              </div>

              <div className="adminAccessField">
                <label>Item Title optional</label>
                <input
                  value={form.itemTitle}
                  onChange={(event) => updateField("itemTitle", event.target.value)}
                  placeholder="Visible reference title"
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
                  placeholder="premium-mock-video-bundle"
                />
              </div>

              <div className="adminAccessField">
                <label>Bundle Item IDs</label>
                <textarea
                  value={form.itemIdsText}
                  onChange={(event) => updateField("itemIdsText", event.target.value)}
                  placeholder="one item id per line or comma separated"
                />
              </div>
            </>
          ) : null}

          <div className="adminAccessField">
            <label>Max Uses</label>
            <input
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(event) => updateField("maxUses", event.target.value)}
              placeholder="1"
            />
          </div>

          <div className="adminAccessField">
            <label>Validity Days</label>
            <input
              type="number"
              min="0"
              value={form.validityDays}
              onChange={(event) => updateField("validityDays", event.target.value)}
              placeholder="30"
            />
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
              onChange={(event) => updateField("accessUntil", event.target.value)}
            />
          </div>

          <div className="adminAccessField">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              <option value={ACCESS_KEY_STATUS.ACTIVE}>Active</option>
              <option value={ACCESS_KEY_STATUS.BLOCKED}>Blocked</option>
              <option value={ACCESS_KEY_STATUS.EXPIRED}>Expired</option>
            </select>
          </div>

          <div className="adminAccessField adminAccessFieldWide">
            <label>Admin Note</label>
            <textarea
              value={form.adminNote}
              onChange={(event) => updateField("adminNote", event.target.value)}
              placeholder="Internal key batch, payment reference, learner source..."
            />
          </div>
        </div>

        {errors.length ? (
          <div className="adminAccessErrorBox">
            <strong>Fix before save:</strong>
            {errors.map((error) => (
              <span key={error}>{error}</span>
            ))}
          </div>
        ) : null}

        {saveError ? (
          <div className="adminAccessErrorBox">
            <strong>Save failed:</strong>
            <span>{saveError}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="adminAccessSuccessBox">
            <strong>Key saved:</strong>
            <span>{successMessage}</span>
          </div>
        ) : null}

        <div className="adminAccessPreviewPanel">
          <div className="adminAccessPreviewHeader">
            <span>Recent Access Keys</span>
            <strong>{loadingKeys ? "Loading..." : accessKeys.length + " keys"}</strong>
          </div>

          <div className="adminAccessRows">
            {accessKeys.length ? (
              accessKeys.map((key) => (
                <div className="adminAccessRow" key={key.id}>
                  <strong>{key.code || key.id}</strong>
                  <span>
                    {key.status || "unknown"} • {Number(key.usedCount || 0)}/
                    {Number(key.maxUses || 1)} used • {" "}
                    {key.lastRedeemedByEmail ||
                      key.redeemedByEmail ||
                      key.assignedEmail ||
                      "open key"}{" "}
                    • {key.scopeType || "plan"} • {key.planType || "FREE"}
                  </span>
                </div>
              ))
            ) : (
              <div className="adminAccessRow">
                <strong>No keys loaded</strong>
                <span>Create a key or refresh this page after Firestore rules are live.</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="adminAccessSecondaryButton"
            onClick={loadAccessKeys}
            disabled={loadingKeys}
          >
            {loadingKeys ? "Refreshing..." : "Refresh Keys"}
          </button>
        </div>
        <div className="adminAccessPreviewGrid">
          <article className="adminAccessPreviewCard">
            <span>Preview</span>
            <strong>{normalizedCode || "Key code pending"}</strong>
            <p>
              {form.scopeType} key • {form.planType} • max uses{" "}
              {form.maxUses || 1}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>Redeem</span>
            <strong>{form.assignedEmail.trim() || "Open key"}</strong>
            <p>
              {form.productId.trim()
                ? "Linked product: " + form.productId.trim()
                : "No product linked yet"}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>Safety</span>
            <strong>No learner grant</strong>
            <p>Key save writes redeem key + audit only. Student access is not created here.</p>
          </article>
        </div>

        <div className="adminAccessPreviewPanel">
          <div className="adminAccessPreviewHeader">
            <span>Confirmation Preview</span>
            <strong>Review key payload</strong>
          </div>

          <div className="adminAccessRows">
            {previewRows.map(([label, value]) => (
              <div className="adminAccessRow" key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="adminAccessPrimaryButton"
            onClick={handleSaveKey}
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Access Key"}
          </button>
        </div>
      </div>
    </AdminAccessRouteShell>
  );
}