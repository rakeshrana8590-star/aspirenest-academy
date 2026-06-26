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
  ACCESS_STATUS,
} from "../accessConstants";

import { createAccessProduct } from "../accessService";

const initialForm = {
  title: "",
  description: "",
  course: ACCESS_COURSE.CTET_TET,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  planType: ACCESS_PLAN_TYPES.PREMIUM,
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  validityDays: "30",
  price: "",
  compareAtPrice: "",
  status: ACCESS_STATUS.ACTIVE,
  adminNote: "",
};

const productActions = [
  {
    icon: "P",
    label: "Catalog",
    title: "Create Product",
    description:
      "Create plan, module, item, and bundle product records with entitlement scope metadata.",
    route: "/admin/content/access/products",
    tone: "orange",
  },
  {
    icon: "K",
    label: "Keys",
    title: "Open Access Keys",
    description:
      "Generate and manage redeem keys linked with products, learners, and entitlement scopes.",
    route: "/admin/content/access/keys",
    tone: "green",
  },
];

export default function AdminAccessProductsRoute() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");

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

  const validateForm = () => {
    const nextErrors = [];

    if (!form.title.trim()) {
      nextErrors.push("Product title is required.");
    }

    if (!form.course) {
      nextErrors.push("Course is required.");
    }

    if (!form.scopeType) {
      nextErrors.push("Scope type is required.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN && !form.planType) {
      nextErrors.push("Plan is required for plan product.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.MODULE && !form.module) {
      nextErrors.push("Module is required for module product.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.ITEM) {
      if (!form.module) nextErrors.push("Module is required for item product.");
      if (!form.itemType) nextErrors.push("Item type is required for item product.");
      if (!form.itemId.trim()) nextErrors.push("Item ID is required for item product.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.BUNDLE) {
      if (!form.bundleId.trim() && bundleItemIds.length === 0) {
        nextErrors.push("Bundle ID or bundle item IDs are required for bundle product.");
      }
    }

    if (Number(form.validityDays || 0) < 0) {
      nextErrors.push("Validity days cannot be negative.");
    }

    if (Number(form.price || 0) < 0) {
      nextErrors.push("Price cannot be negative.");
    }

    if (!form.status) {
      nextErrors.push("Status is required.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    name: form.title.trim(),
    description: form.description.trim(),
    course: form.course,
    scopeType: form.scopeType,
    planType: form.planType,
    module: form.module || null,
    itemType: form.itemType || null,
    itemId: form.itemId.trim() || null,
    itemTitle: form.itemTitle.trim(),
    itemIds: bundleItemIds,
    bundleId: form.bundleId.trim() || null,
    validityDays: Number(form.validityDays || 0),
    price: Number(form.price || 0),
    compareAtPrice: Number(form.compareAtPrice || 0),
    status: form.status,
    adminNote: form.adminNote.trim(),
    notes: form.adminNote.trim(),
  });

  const handleSaveProduct = async () => {
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
      "Confirm create access product: " +
        form.title.trim() +
        "? This will write accessProducts and audit logs."
    );

    if (!proceed) return;

    setSaving(true);

    try {
      const product = await createAccessProduct({
        ...buildPayload(),
        actor,
      });

      setSuccessMessage(
        "Access product created successfully. Product ID: " + product.id
      );
      setForm(initialForm);
      setErrors([]);
    } catch (error) {
      setSaveError(error?.message || "Access product save failed.");
    } finally {
      setSaving(false);
    }
  };

  const previewRows = [
    ["Title", form.title.trim() || "Required"],
    ["Scope", form.scopeType],
    ["Plan", form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? form.planType : "Not plan scoped"],
    ["Module", form.module || "Not module scoped"],
    ["Item Type", form.itemType || "Not item scoped"],
    ["Item ID", form.itemId.trim() || "Not item scoped"],
    ["Item Title", form.itemTitle.trim() || "Optional"],
    ["Bundle ID", form.bundleId.trim() || "Not bundle scoped"],
    ["Bundle Items", bundleItemIds.length ? bundleItemIds.join(", ") : "Not bundle scoped"],
    ["Validity Days", form.validityDays || "0"],
    ["Price", form.price ? "₹" + form.price : "₹0"],
    ["Compare Price", form.compareAtPrice ? "₹" + form.compareAtPrice : "₹0"],
    ["Status", form.status],
  ];

  return (
    <AdminAccessRouteShell
      badge="ACCESS PRODUCTS"
      title="Access Product Workspace"
      description="Create catalog-ready access products for plan, module, item, and bundle entitlement scopes. Product records stay separate from learner grants and can later connect with redeem keys."
      icon="P"
      moduleMeta="PRODUCT CATALOG FOUNDATION"
      stats={[
        { value: "Plan", label: "Products" },
        { value: "Module", label: "Scope" },
        { value: "Item", label: "Unlock" },
        { value: "Bundle", label: "Ready" },
      ]}
      trustItems={["Catalog ready", "Scope mapped", "Key linked", "Audit safe"]}
      primaryAction={{
        label: "Open Access Keys",
        route: "/admin/content/access/keys",
      }}
      secondaryAction={{
        label: "Back to Access",
        route: "/admin/content/access",
      }}
      sectionTitle="Create access product"
      sectionDescription="Build one product record at a time. Product save writes accessProducts and accessAuditLogs only; it does not grant learner access directly."
      actions={productActions}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessFormGrid">
          <div className="adminAccessField">
            <label>Product Title</label>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="PREMIUM Mock Test Pack"
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
              <option value={ACCESS_SCOPE_TYPES.PLAN}>Plan Product</option>
              <option value={ACCESS_SCOPE_TYPES.MODULE}>Module Product</option>
              <option value={ACCESS_SCOPE_TYPES.ITEM}>Item Product</option>
              <option value={ACCESS_SCOPE_TYPES.BUNDLE}>Bundle Product</option>
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
            <label>Price</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="999"
            />
          </div>

          <div className="adminAccessField">
            <label>Compare At Price</label>
            <input
              type="number"
              min="0"
              value={form.compareAtPrice}
              onChange={(event) =>
                updateField("compareAtPrice", event.target.value)
              }
              placeholder="1999"
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
              <option value={ACCESS_STATUS.BLOCKED}>Blocked</option>
            </select>
          </div>

          <div className="adminAccessField adminAccessFieldWide">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="What this product unlocks..."
            />
          </div>

          <div className="adminAccessField adminAccessFieldWide">
            <label>Admin Note</label>
            <textarea
              value={form.adminNote}
              onChange={(event) => updateField("adminNote", event.target.value)}
              placeholder="Internal product reason, launch batch, pricing note..."
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
            <strong>Product saved:</strong>
            <span>{successMessage}</span>
          </div>
        ) : null}

        <div className="adminAccessPreviewGrid">
          <article className="adminAccessPreviewCard">
            <span>Preview</span>
            <strong>{form.title.trim() || "Product title pending"}</strong>
            <p>
              {form.scopeType} product • {form.planType} • validity{" "}
              {form.validityDays || 0} days
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>Scope</span>
            <strong>{form.scopeType}</strong>
            <p>
              {form.module || "Plan-level"}{" "}
              {form.itemId.trim() ? "• " + form.itemId.trim() : ""}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>Safety</span>
            <strong>No learner grant</strong>
            <p>Product save writes catalog + audit only. Student access is not created here.</p>
          </article>
        </div>

        <AdminReviewPanel
          eyebrow="Confirmation Preview"
          title="Review product payload"
          description="Compact review of the product record before saving. Learner access is not granted from this page."
          highlights={[
            ["Title", form.title.trim() || "Required", form.title.trim() ? "success" : "warning"],
            ["Scope", form.scopeType],
            ["Price", form.price ? "₹" + form.price : "₹0"],
          ]}
          rows={previewRows}
          actionLabel="Create Access Product"
          loadingLabel="Saving..."
          actionLoading={saving}
          actionDisabled={saving}
          onAction={handleSaveProduct}
          footerNote="Product save writes catalog + audit only. Student access is not created here."
        />
      </div>
    </AdminAccessRouteShell>
  );
}