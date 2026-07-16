import React, { useCallback, useEffect, useMemo, useState } from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";
import { AdminReviewPanel } from "../../components/shared/admin";

import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_KEY_STATUS,
  ACCESS_MODULE,
  ACCESS_SCOPE_TYPES,
} from "../accessConstants";

import {
  createAccessKey,
  listAccessKeys,
  listAccessProducts,
  normalizeAccessKeyCode,
} from "../accessService";

import {
  ADMIN_PLAN_VALIDITY_CHOICES,
  applyPlanProductToGrantForm,
  buildDynamicPlanGrantTerms,
  createInitialDynamicPlanGrantForm,
  listGrantablePlanProducts,
  validateDynamicPlanGrantSelection,
} from "./accessGrantFormModel";

const createInitialForm = () => ({
  ...createInitialDynamicPlanGrantForm(),
  code: "",
  assignedEmail: "",
  campaignId: "",
  campaignName: "",
  campaignSource: "",
  course: ACCESS_COURSE.CTET_TET,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  maxUses: "1",
  validityChoice:
    ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS,
  validityDays: "30",
  accessFrom: "",
  accessUntil: "",
  status: ACCESS_KEY_STATUS.ACTIVE,
  adminNote: "",
});
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

const formatPrice = (product = {}) =>
  "₹" +
  Number(
    product.priceINR ??
      product.price ??
      0
  ).toLocaleString("en-IN");

const formatPlanOption = (product = {}) =>
  [
    product.title ||
      product.name ||
      product.planCode,
    product.planCode,
    formatPrice(product),
  ]
    .filter(Boolean)
    .join(" • ");

export default function AdminAccessKeysRoute() {
  const [form, setForm] = useState(createInitialForm);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [accessKeys, setAccessKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const loadPlanCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");

    try {
      const nextProducts = await listAccessProducts({
        maxCount: 200,
      });

      setProducts(
        Array.isArray(nextProducts)
          ? nextProducts
          : []
      );
    } catch (error) {
      setProducts([]);
      setCatalogError(
        error?.message ||
          "Active plan catalog could not be loaded."
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlanCatalog();
  }, [loadPlanCatalog]);

  const planProducts = useMemo(
    () => listGrantablePlanProducts(products),
    [products]
  );

  const selectedPlanProduct = useMemo(
    () =>
      planProducts.find(
        (product) => product.productId === form.productId
      ) || null,
    [planProducts, form.productId]
  );

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

  const handleScopeTypeChange = (scopeType) => {
    setForm((current) => ({
      ...current,
      scopeType,
      ...(scopeType === ACCESS_SCOPE_TYPES.PLAN
        ? {}
        : {
            productId: "",
            planCode: "",
            planType: "",
            accessRank: "",
          }),
    }));
    setErrors([]);
    setSaveError("");
    setSuccessMessage("");
  };

  const handlePlanProductChange = (productId) => {
    const product = planProducts.find(
      (item) => item.productId === productId
    );

    setForm((current) =>
      product
        ? applyPlanProductToGrantForm(current, product)
        : {
            ...current,
            productId: "",
            planCode: "",
            planType: "",
            accessRank: "",
          }
    );
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

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN) {
      if (catalogLoading) {
        nextErrors.push(
          "Wait for the active plan catalog to finish loading."
        );
      }

      if (catalogError) {
        nextErrors.push(
          "Plan catalog must load successfully before a plan key can be saved."
        );
      }

      if (!catalogLoading && !catalogError && !planProducts.length) {
        nextErrors.push(
          "No active plan product is available for this key."
        );
      }

      validateDynamicPlanGrantSelection({
        form,
        products,
        requireAdminNote: true,
      }).forEach((message) => {
        if (!nextErrors.includes(message)) {
          nextErrors.push(message);
        }
      });
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

    if (form.scopeType !== ACCESS_SCOPE_TYPES.PLAN) {
      if (Number(form.validityDays || 0) < 0) {
        nextErrors.push("Validity days cannot be negative.");
      }

      if (form.accessFrom && form.accessUntil) {
        const fromTime = new Date(form.accessFrom).getTime();
        const untilTime = new Date(form.accessUntil).getTime();

        if (
          Number.isFinite(fromTime) &&
          Number.isFinite(untilTime) &&
          untilTime < fromTime
        ) {
          nextErrors.push("Access until cannot be before access from.");
        }
      }

      if (!form.adminNote.trim()) {
        nextErrors.push("Admin note is required.");
      }
    }

    if (!form.status) {
      nextErrors.push("Status is required.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const buildPayload = () => {
    const commonPayload = {
      code: normalizedCode,
      assignedEmail: form.assignedEmail.trim(),
      campaignId: form.campaignId.trim() || null,
      campaignName: form.campaignName.trim(),
      campaignSource: form.campaignSource.trim(),
      course: form.course,
      scopeType: form.scopeType,
      module: form.module || null,
      itemType: form.itemType || null,
      itemId: form.itemId.trim() || null,
      itemTitle: form.itemTitle.trim(),
      itemIds: bundleItemIds,
      bundleId: form.bundleId.trim() || null,
      maxUses: Number(form.maxUses || 1),
      status: form.status,
      adminNote: form.adminNote.trim(),
      notes: form.adminNote.trim(),
    };

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN) {
      return {
        ...commonPayload,
        ...buildDynamicPlanGrantTerms({
          form,
          products,
          now: new Date(),
          requireAdminNote: true,
        }),
      };
    }

    return {
      ...commonPayload,
      productId: form.productId.trim() || null,
      planType: null,
      planCode: null,
      accessRank: null,
      purchaseTermsSnapshot: null,
      termsSnapshot: null,
      validityMode: null,
      noExpiry: false,
      untilManualChange: false,
      validityDays: Number(form.validityDays || 0),
      accessFrom: form.accessFrom || null,
      accessUntil: form.accessUntil || null,
    };
  };

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
      setForm(createInitialForm());
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
    [
      "Product",
      form.scopeType === ACCESS_SCOPE_TYPES.PLAN
        ? selectedPlanProduct
          ? selectedPlanProduct.title + " • " + selectedPlanProduct.productId
          : "Select active plan product"
        : form.productId.trim() || "Optional",
    ],
    ["Campaign ID", form.campaignId.trim() || "Optional"],
    ["Campaign Name", form.campaignName.trim() || "Optional"],
    ["Campaign Source", form.campaignSource.trim() || "Manual"],
    ["Scope", form.scopeType],
    [
      "Plan Code",
      form.scopeType === ACCESS_SCOPE_TYPES.PLAN
        ? selectedPlanProduct?.planCode || "Required"
        : "Not plan scoped",
    ],
    [
      "Access Rank",
      form.scopeType === ACCESS_SCOPE_TYPES.PLAN
        ? selectedPlanProduct?.accessRank ?? "Required"
        : "Not plan scoped",
    ],
    [
      "Price Version",
      form.scopeType === ACCESS_SCOPE_TYPES.PLAN
        ? selectedPlanProduct?.priceVersion ?? "Required"
        : "Not plan scoped",
    ],
    ["Module", form.module || "Not module scoped"],
    ["Item Type", form.itemType || "Not item scoped"],
    ["Item ID", form.itemId.trim() || "Not item scoped"],
    ["Item Title", form.itemTitle.trim() || "Optional"],
    ["Bundle ID", form.bundleId.trim() || "Not bundle scoped"],
    ["Bundle Items", bundleItemIds.length ? bundleItemIds.join(", ") : "Not bundle scoped"],
    ["Max Uses", form.maxUses || "1"],
    [
      "Validity",
      form.scopeType === ACCESS_SCOPE_TYPES.PLAN
        ? form.validityChoice || "Required"
        : form.validityDays || "0",
    ],
    ["Access From", form.accessFrom || "Redemption time"],
    [
      "Access Until",
      form.validityChoice === ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY
        ? "No expiry"
        : form.validityChoice ===
            ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE
          ? "Until manual change"
          : form.accessUntil ||
            (form.validityChoice ===
            ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS
              ? `${form.validityDays || 0} day(s) after redemption`
              : "Required"),
    ],
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
        {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
          <div className="adminAccessNotice">
            <strong>Active plan catalog:</strong>{" "}
            {catalogLoading
              ? "Loading..."
              : catalogError
                ? "Unavailable — plan key creation is blocked."
                : planProducts.length
                  ? `${planProducts.length} active plan product(s) ready.`
                  : "No active plan product is available."}
          </div>
        ) : null}

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

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
            <div className="adminAccessField adminAccessFieldWide">
              <label>Active Plan Product</label>
              <select
                value={form.productId}
                onChange={(event) =>
                  handlePlanProductChange(event.target.value)
                }
                disabled={
                  catalogLoading ||
                  Boolean(catalogError) ||
                  !planProducts.length
                }
              >
                <option value="">
                  {catalogLoading
                    ? "Loading active plans..."
                    : "Select active plan product"}
                </option>
                {planProducts.map((product) => (
                  <option
                    value={product.productId}
                    key={product.productId}
                  >
                    {formatPlanOption(product)}
                  </option>
                ))}
              </select>
              <small>
                Product identity, access rank, price version, and validity terms are snapshotted when this key is created.
              </small>
            </div>
          ) : (
            <div className="adminAccessField">
              <label>Product ID optional</label>
              <input
                value={form.productId}
                onChange={(event) => updateField("productId", event.target.value)}
                placeholder="Optional non-plan catalog reference"
              />
            </div>
          )}

          <div className="adminAccessField">
            <label>Campaign ID optional</label>
            <input
              value={form.campaignId}
              onChange={(event) => updateField("campaignId", event.target.value)}
              placeholder="summer-2026 / whatsapp-june"
            />
          </div>

          <div className="adminAccessField">
            <label>Campaign Name optional</label>
            <input
              value={form.campaignName}
              onChange={(event) => updateField("campaignName", event.target.value)}
              placeholder="June WhatsApp Campaign"
            />
          </div>

          <div className="adminAccessField">
            <label>Campaign Source optional</label>
            <input
              value={form.campaignSource}
              onChange={(event) => updateField("campaignSource", event.target.value)}
              placeholder="whatsapp / seminar / manual / referral"
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
              onChange={(event) => handleScopeTypeChange(event.target.value)}
            >
              <option value={ACCESS_SCOPE_TYPES.PLAN}>Plan Key</option>
              <option value={ACCESS_SCOPE_TYPES.MODULE}>Module Key</option>
              <option value={ACCESS_SCOPE_TYPES.ITEM}>Item Key</option>
              <option value={ACCESS_SCOPE_TYPES.BUNDLE}>Bundle Key</option>
            </select>
          </div>

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN &&
          selectedPlanProduct ? (
            <div className="adminAccessField adminAccessFieldWide">
              <label>Selected Plan Snapshot</label>
              <small>
                {selectedPlanProduct.title} • {selectedPlanProduct.planCode} • rank {selectedPlanProduct.accessRank} • {formatPrice(selectedPlanProduct)} • price version {selectedPlanProduct.priceVersion}
              </small>
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

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
            <>
              <div className="adminAccessField">
                <label>Plan Validity</label>
                <select
                  value={form.validityChoice}
                  onChange={(event) =>
                    updateField("validityChoice", event.target.value)
                  }
                >
                  <option value={ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW}>
                    Custom date window
                  </option>
                  <option value={ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS}>
                    Validity days
                  </option>
                  <option
                    value={ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY}
                    disabled={
                      selectedPlanProduct
                        ? !selectedPlanProduct.allowNoExpiry
                        : true
                    }
                  >
                    No expiry
                  </option>
                  <option value={ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE}>
                    Until manual change
                  </option>
                </select>
              </div>

              <div className="adminAccessField">
                <label>Access From</label>
                <input
                  type="date"
                  value={form.accessFrom}
                  onChange={(event) =>
                    updateField("accessFrom", event.target.value)
                  }
                />
                <small>Blank starts from key redemption time.</small>
              </div>

              {form.validityChoice ===
              ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW ? (
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
              ) : null}

              {form.validityChoice ===
              ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS ? (
                <div className="adminAccessField">
                  <label>Validity Days</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.validityDays}
                    onChange={(event) =>
                      updateField("validityDays", event.target.value)
                    }
                    placeholder="30"
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="adminAccessField">
                <label>Validity Days</label>
                <input
                  type="number"
                  min="0"
                  value={form.validityDays}
                  onChange={(event) =>
                    updateField("validityDays", event.target.value)
                  }
                  placeholder="30"
                />
              </div>

              <div className="adminAccessField">
                <label>Access From</label>
                <input
                  type="date"
                  value={form.accessFrom}
                  onChange={(event) =>
                    updateField("accessFrom", event.target.value)
                  }
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
            </>
          )}

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
                    • {key.scopeType || "plan"} • {key.planCode || key.planType || "Unknown plan"}
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
              {form.scopeType} key • {
                form.scopeType === ACCESS_SCOPE_TYPES.PLAN
                  ? selectedPlanProduct?.planCode || "plan pending"
                  : form.module || form.itemType || "target pending"
              } • max uses {form.maxUses || 1}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>Redeem</span>
            <strong>{form.assignedEmail.trim() || "Open key"}</strong>
            <p>
              {form.scopeType === ACCESS_SCOPE_TYPES.PLAN
                ? selectedPlanProduct
                  ? "Catalog product: " + selectedPlanProduct.productId
                  : "Active plan product required"
                : form.productId.trim()
                  ? "Linked product: " + form.productId.trim()
                  : "No product linked"}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>Safety</span>
            <strong>No learner grant</strong>
            <p>Key save writes redeem key + audit only. Student access is not created here.</p>
          </article>
        </div>

        <AdminReviewPanel
          eyebrow="Confirmation Preview"
          title="Review key payload"
          description="Compact review of the key record before saving. Optional fields stay visible without stretching the page."
          highlights={[
            ["Code", normalizedCode || "Required", normalizedCode ? "success" : "warning"],
            ["Assigned Email", form.assignedEmail.trim() || "Open key"],
            ["Scope", form.scopeType],
          ]}
          rows={previewRows}
          actionLabel="Create Access Key"
          loadingLabel="Saving..."
          actionLoading={saving}
          actionDisabled={
            saving ||
            (form.scopeType === ACCESS_SCOPE_TYPES.PLAN &&
              (catalogLoading || Boolean(catalogError)))
          }
          onAction={handleSaveKey}
          footerNote="Plan keys fail closed without an active catalog product and explicit validity. Key save writes redeem key + audit only; student access is created only during redemption."
        />
      </div>
    </AdminAccessRouteShell>
  );
}