import React, { useCallback, useEffect, useMemo, useState } from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  createBulkAccessImportPlan,
  executeBulkAccessImport,
  getAccessByEmail,
  listAccessProducts,
  normalizeAccessEmail,
} from "../accessService";
import {
  buildBulkAccessDryRun,
} from "../accessBulkLifecycle";

import {
  ADMIN_PLAN_VALIDITY_CHOICES,
  applyPlanProductToGrantForm,
  buildDynamicPlanGrantTerms,
  createInitialDynamicPlanGrantForm,
  hasSameCatalogPlanGrantTarget,
  listGrantablePlanProducts,
  validateDynamicPlanGrantSelection,
} from "./accessGrantFormModel";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createInitialForm = () => ({
  ...createInitialDynamicPlanGrantForm(),
  rawEmails: "",
  email: "",
  name: "",
  phone: "",
  course: ACCESS_COURSE.CTET_TET,
  scopeType: ACCESS_SCOPE_TYPES.PLAN,
  productId: "",
  planCode: "",
  planType: "",
  accessRank: "",
  validityChoice:
    ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW,
  validityDays: "",
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  accessKeyId: "",
  source: ACCESS_SOURCE.BULK_IMPORT,
  accessFrom: "",
  accessUntil: "",
  status: ACCESS_STATUS.ACTIVE,
  sendInvite: "yes",
  adminNote: "",
});
const sampleRegisteredEmails = [
  "jamilanri786@gmail.com",
  "ansarineha340@gmail.com",
  "1990amala@gmail.com",
  "qureshihoor1986@gmail.com",
  "gratitude.pb@gmail.com",
  "yasmeen.shaikh@hkce.edu.in",
  "ruhiipatel.18@gmail.com",
  "dianapithawala@gmail.com",
];

const extractEmailFromLine = (line = "") => {
  const match = String(line).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
};

const parseBulkEmails = (rawEmails = "") => {
  const lines = String(rawEmails || "")
    .split(/\r?\n|,|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.map((line, index) => {
    const extractedEmail = extractEmailFromLine(line);
    const normalizedEmail = normalizeAccessEmail(extractedEmail || line);
    const valid = Boolean(normalizedEmail && emailPattern.test(normalizedEmail));

    return {
      rowNumber: index + 1,
      original: line,
      email: normalizedEmail,
      valid,
      reason: valid ? "Valid" : "Invalid email format",
    };
  });

  const emailCounts = rows.reduce((acc, row) => {
    if (row.valid) {
      acc[row.email] = (acc[row.email] || 0) + 1;
    }

    return acc;
  }, {});

  const enrichedRows = rows.map((row) => ({
    ...row,
    duplicateInPaste: row.valid && emailCounts[row.email] > 1,
  }));

  const validUniqueEmails = Array.from(
    new Set(enrichedRows.filter((row) => row.valid).map((row) => row.email))
  );

  return {
    rows: enrichedRows,
    totalInputRows: rows.length,
    validRows: enrichedRows.filter((row) => row.valid),
    invalidRows: enrichedRows.filter((row) => !row.valid),
    duplicateRows: enrichedRows.filter((row) => row.duplicateInPaste),
    validUniqueEmails,
  };
};

const normalizeAccessTargetValue = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeAccessItemIds = (itemIds = []) =>
  Array.isArray(itemIds)
    ? itemIds.map((itemId) => normalizeAccessTargetValue(itemId)).filter(Boolean).sort()
    : [];

const hasSameBulkAccessTarget = (records = [], target = {}) => {
  const selectedCourse = normalizeAccessTargetValue(target.course);
  const selectedScope = normalizeAccessTargetValue(
    target.scopeType || ACCESS_SCOPE_TYPES.PLAN
  );

  return records.some((record) => {
    const recordCourse = normalizeAccessTargetValue(record.course);
    const recordScope = normalizeAccessTargetValue(
      record.scopeType || ACCESS_SCOPE_TYPES.PLAN
    );

    if (recordCourse && selectedCourse && recordCourse !== selectedCourse) {
      return false;
    }

    if (recordScope !== selectedScope) {
      return false;
    }

    if (selectedScope === ACCESS_SCOPE_TYPES.MODULE) {
      return (
        normalizeAccessTargetValue(record.module) ===
        normalizeAccessTargetValue(target.module)
      );
    }

    if (selectedScope === ACCESS_SCOPE_TYPES.ITEM) {
      return (
        normalizeAccessTargetValue(record.module) ===
          normalizeAccessTargetValue(target.module) &&
        normalizeAccessTargetValue(record.itemType) ===
          normalizeAccessTargetValue(target.itemType) &&
        normalizeAccessTargetValue(record.itemId) ===
          normalizeAccessTargetValue(target.itemId)
      );
    }

    if (selectedScope === ACCESS_SCOPE_TYPES.BUNDLE) {
      const recordBundleId = normalizeAccessTargetValue(record.bundleId);
      const targetBundleId = normalizeAccessTargetValue(target.bundleId);

      if (recordBundleId && targetBundleId && recordBundleId === targetBundleId) {
        return true;
      }

      const recordItems = normalizeAccessItemIds(record.itemIds);
      const targetItems = normalizeAccessItemIds(target.itemIds);

      return (
        recordItems.length > 0 &&
        targetItems.length > 0 &&
        recordItems.join("|") === targetItems.join("|")
      );
    }

    if (selectedScope === ACCESS_SCOPE_TYPES.PLAN) {
      return hasSameCatalogPlanGrantTarget(
        record,
        target
      );
    }

    return false;
  });
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

export default function AdminAccessBulkRoute() {
  const [form, setForm] = useState(createInitialForm);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState([]);

  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [firestoreDuplicateMap, setFirestoreDuplicateMap] = useState({});
  const [duplicateCheckError, setDuplicateCheckError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSummary, setSaveSummary] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [dryRunPlan, setDryRunPlan] = useState(null);
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

  const parsed = useMemo(
    () => parseBulkEmails(form.rawEmails),
    [form.rawEmails]
  );

  const bundleItemIds = useMemo(
    () =>
      form.itemIdsText
        .split(/[\n,]+/)
        .map((item) => item.replace(/^\d+[\).\-\s]+/, "").trim())
        .filter(Boolean),
    [form.itemIdsText]
  );

  const bulkAccessTarget = useMemo(
    () => ({
      course: form.course,
      scopeType: form.scopeType,
      productId: form.productId,
      planCode: form.planCode,
      planType: form.planType,
      module: form.module,
      itemType: form.itemType,
      itemId: form.itemId.trim(),
      itemIds: bundleItemIds,
      bundleId: form.bundleId.trim(),
    }),
    [
      form.course,
      form.scopeType,
      form.productId,
      form.planCode,
      form.planType,
      form.module,
      form.itemType,
      form.itemId,
      form.bundleId,
      bundleItemIds,
    ]
  );

  const firestoreDuplicateEmails = useMemo(() => {
    return parsed.validUniqueEmails.filter((email) => {
      const records = firestoreDuplicateMap[email] || [];
      return hasSameBulkAccessTarget(records, bulkAccessTarget);
    });
  }, [firestoreDuplicateMap, parsed.validUniqueEmails, bulkAccessTarget]);

  const safeToCreateEmails = useMemo(
    () =>
      dryRunPlan?.processableRows?.map(
        (row) => row.email
      ) || [],
    [dryRunPlan]
  );

  const clearPreviewState = () => {
    setShowPreview(false);
    setErrors([]);
    setFirestoreDuplicateMap({});
    setDuplicateCheckError("");
    setSaveSummary(null);
    setSaveError("");
    setDryRunPlan(null);
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    clearPreviewState();
  };

  const handleScopeTypeChange = (scopeType) => {
    setForm((current) => ({
      ...current,
      scopeType,
      productId: "",
      planCode: "",
      planType: "",
      accessRank: "",
    }));

    clearPreviewState();
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

    clearPreviewState();
  };

  const loadSampleEmails = () => {
    setForm((current) => ({
      ...current,
      rawEmails: sampleRegisteredEmails.join("\n"),
      adminNote:
        current.adminNote ||
        "Testing bulk access using uploaded registered learner Gmail list.",
    }));

    setShowPreview(false);
    setErrors([]);
    setFirestoreDuplicateMap({});
    setDuplicateCheckError("");
    setSaveSummary(null);
    setSaveError("");
    setDryRunPlan(null);
  };

  const validatePreview = () => {
    const nextErrors = [];

    if (!form.rawEmails.trim()) {
      nextErrors.push("Paste at least one learner Gmail ID.");
    }

    if (!parsed.validUniqueEmails.length) {
      nextErrors.push("No valid email found for preview.");
    }

    if (!form.course) {
      nextErrors.push("Course is required.");
    }

    if (!form.scopeType) {
      nextErrors.push("Access scope is required.");
    }

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN) {
      if (catalogLoading) {
        nextErrors.push(
          "Wait for the active plan catalog to finish loading."
        );
      }

      if (catalogError) {
        nextErrors.push(
          "Plan catalog must load successfully before a bulk plan grant can be previewed."
        );
      }

      if (!catalogLoading && !catalogError && !planProducts.length) {
        nextErrors.push(
          "No active plan product is available for bulk access."
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

    if (form.scopeType !== ACCESS_SCOPE_TYPES.PLAN) {
      if (!form.adminNote.trim()) {
        nextErrors.push("Admin note is required for batch audit clarity.");
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
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
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

  const buildAccessPayload = (
    email,
    batchId,
    now = new Date()
  ) => {
    const commonPayload = {
      email,
      learnerName: "",
      name: "",
      phone: "",
      course: form.course,
      scopeType: form.scopeType,
      module: form.module || null,
      itemType: form.itemType || null,
      itemId: form.itemId.trim() || null,
      itemTitle: form.itemTitle.trim(),
      itemIds: bundleItemIds,
      bundleId: form.bundleId.trim() || null,
      accessKeyId: form.accessKeyId.trim() || null,
      source: form.source,
      status: form.status,
      adminNote: form.adminNote.trim(),
      notes: form.adminNote.trim(),
      metadata: {
        batchId,
        bulkImport: true,
        scopeType: form.scopeType,
      },
    };

    if (form.scopeType === ACCESS_SCOPE_TYPES.PLAN) {
      return {
        ...commonPayload,
        ...buildDynamicPlanGrantTerms({
          form,
          products,
          now,
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
      validityDays: 0,
      accessFrom: form.accessFrom || null,
      accessUntil: form.accessUntil || null,
    };
  };

  const checkFirestoreDuplicates = async () => {
    const nextMap = {};
    setCheckingDuplicates(true);
    setDuplicateCheckError("");

    try {
      for (const email of parsed.validUniqueEmails) {
        const records = await getAccessByEmail(email);
        nextMap[email] = Array.isArray(records) ? records : [];
      }

      setFirestoreDuplicateMap(nextMap);
      return nextMap;
    } catch (error) {
      const message = error?.message || "Firestore duplicate check failed.";
      setDuplicateCheckError(message);
      setFirestoreDuplicateMap({});
      return null;
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handlePreview = async () => {
    setSaveSummary(null);
    setSaveError("");
    setDryRunPlan(null);

    if (!validatePreview()) {
      setShowPreview(false);
      return;
    }

    const duplicateMap = await checkFirestoreDuplicates();

    if (!duplicateMap) {
      setShowPreview(false);
      return;
    }

    try {
      const previewId = "bulk_preview_" + Date.now();
      const previewNow = new Date();
      const grantData = buildAccessPayload(
        "",
        previewId,
        previewNow
      );
      const plan = buildBulkAccessDryRun({
        importId: previewId,
        rawEmails: form.rawEmails,
        grantData,
        existingRecordsByEmail: duplicateMap,
        maxRows: 100,
      });

      setDryRunPlan(plan);
      setShowPreview(true);
    } catch (error) {
      setSaveError(
        error?.message || "Bulk dry run failed."
      );
      setShowPreview(false);
    }
  };

  const handleConfirmBulkSave = async () => {
    setSaveSummary(null);
    setSaveError("");

    if (!validatePreview()) {
      return;
    }

    if (!showPreview || !dryRunPlan) {
      setSaveError("Dry-run preview is required before bulk save.");
      return;
    }

    if (duplicateCheckError) {
      setSaveError("Bulk save blocked because duplicate check failed.");
      return;
    }

    if (!safeToCreateEmails.length) {
      setSaveError("No safe learner email is available for bulk create.");
      return;
    }

    const actor = buildActor();

    if (!actor.email) {
      setSaveError("Admin login session not found. Please login again.");
      return;
    }

    const confirmMessage =
      "Confirm resumable bulk save for " +
      safeToCreateEmails.length +
      " learner(s)? Invalid, pasted duplicate, identity-conflict, and existing matching grants will be recorded as skipped ledger rows.";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSaving(true);

    const batchId = "bulk_access_" + Date.now();

    try {
      const executionNow = new Date();
      const grantData = buildAccessPayload(
        "",
        batchId,
        executionNow
      );
      const executionPlan = buildBulkAccessDryRun({
        importId: batchId,
        rawEmails: form.rawEmails,
        grantData,
        existingRecordsByEmail: firestoreDuplicateMap,
        maxRows: 100,
      });

      await createBulkAccessImportPlan({
        importId: batchId,
        rows: executionPlan.rows,
        grantData,
        actor,
        sendInvite: form.sendInvite === "yes",
        metadata: {
          adminNote: form.adminNote.trim(),
          dryRunSummary: executionPlan.summary,
          verifiedUidClaim: "automatic_after_login",
          emailKeyedUserShells: "disabled",
        },
      });

      const result = await executeBulkAccessImport({
        importId: batchId,
        actor,
      });
      const succeededRows = result.rows.filter(
        (row) => row.status === "succeeded"
      );
      const failedRows = result.rows.filter(
        (row) => row.status === "failed"
      );
      const existingRows = result.rows.filter(
        (row) => row.status === "existing_match"
      );

      setSaveSummary({
        batchId,
        status: result.status,
        canResume: result.canResume,
        createdEmails: succeededRows
          .filter((row) => row.accessWriteMode === "created")
          .map((row) => row.email),
        updatedEmails: succeededRows
          .filter((row) => row.accessWriteMode === "updated")
          .map((row) => row.email),
        failedEmails: failedRows.map((row) => ({
          email: row.email,
          error: row.lastError || "Save failed",
        })),
        skippedInvalid:
          result.summary.counts.invalid,
        skippedPasteDuplicates:
          result.summary.counts.duplicate_input,
        skippedIdentityConflicts:
          result.summary.counts.identity_conflict,
        skippedExistingEmails: existingRows.map(
          (row) => row.email
        ),
      });

      setShowPreview(false);
      setDryRunPlan(null);
      await checkFirestoreDuplicates();
    } catch (error) {
      setSaveError(error?.message || "Bulk save failed.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setShowPreview(false);
    setErrors([]);
    setFirestoreDuplicateMap({});
    setDuplicateCheckError("");
    setSaveSummary(null);
    setSaveError("");
    setDryRunPlan(null);
  };

  const previewStats = [
    { value: String(parsed.totalInputRows), label: "Input Rows" },
    { value: String(parsed.validUniqueEmails.length), label: "Valid Unique" },
    { value: String(parsed.invalidRows.length), label: "Invalid" },
    { value: String(parsed.duplicateRows.length), label: "Paste Duplicates" },
    {
      value: duplicateCheckError
        ? "Check Failed"
        : String(firestoreDuplicateEmails.length),
      label: "Existing Access",
    },
    {
      value: duplicateCheckError ? "Blocked" : String(safeToCreateEmails.length),
      label: "Safe To Create",
    },
  ];

  return (
    <AdminAccessRouteShell
      badge="BULK IMPORT"
      title="Bulk Gmail Import"
      description="Dry-run multiple learner emails, record every row in a resumable ledger, skip invalid/duplicate/conflicting identities, and execute only safe access grants after confirmation."
      icon="B"
      primaryAction={{
        label: "Add Single Access",
        route: "/admin/content/access/add",
      }}
      secondaryAction={{
        label: "Pending Invites",
        route: "/admin/content/access/invites",
      }}
      sectionTitle="Bulk import workspace"
      sectionDescription="Preview validation and identity-safe duplicate outcomes first, then create a resumable per-row ledger before any access grant executes."
      stats={[
        { value: "Paste", label: "Emails" },
        { value: "Clean", label: "Normalize" },
        { value: "Review", label: "Duplicates" },
        { value: "Audit", label: "Ready" },
      ]}
    >
      <div className="adminAccessFormPanel">
        {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
          <div className="adminAccessNotice">
            <strong>Active plan catalog:</strong>{" "}
            {catalogLoading
              ? "Loading..."
              : catalogError
                ? "Unavailable — bulk plan preview is blocked."
                : planProducts.length
                  ? `${planProducts.length} active plan product(s) ready.`
                  : "No active plan product is available."}
          </div>
        ) : null}

        <div className="adminAccessFormGrid">
          <div className="adminAccessField adminAccessFull">
            <label>Paste Gmail List</label>
            <textarea
              value={form.rawEmails}
              onChange={(event) => updateField("rawEmails", event.target.value)}
              placeholder="one learner email per line"
            />
            <small>
              Supports one email per line, comma-separated emails, or numbered
              lines copied from a document.
            </small>
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
            <label>Access Scope for all</label>
            <select
              value={form.scopeType}
              onChange={(event) =>
                handleScopeTypeChange(event.target.value)
              }
            >
              <option value={ACCESS_SCOPE_TYPES.PLAN}>Plan Access</option>
              <option value={ACCESS_SCOPE_TYPES.MODULE}>Module Access</option>
              <option value={ACCESS_SCOPE_TYPES.ITEM}>Single Item Access</option>
              <option value={ACCESS_SCOPE_TYPES.BUNDLE}>Bundle Access</option>
            </select>
            <small>Same entitlement scope will be assigned to all safe learners.</small>
          </div>

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
            <>
              <div className="adminAccessField adminAccessFull">
                <label>Active Plan Product for all</label>
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
                  Product identity, plan code, access rank, price version, and validity terms are locked into every bulk grant row.
                </small>
              </div>

              {selectedPlanProduct ? (
                <div className="adminAccessField adminAccessFull">
                  <label>Selected Plan Snapshot</label>
                  <small>
                    {selectedPlanProduct.title} • {selectedPlanProduct.planCode} • rank {selectedPlanProduct.accessRank} • {formatPrice(selectedPlanProduct)} • price version {selectedPlanProduct.priceVersion}
                  </small>
                </div>
              ) : null}
            </>
          ) : null}

          {form.scopeType === ACCESS_SCOPE_TYPES.MODULE ||
          form.scopeType === ACCESS_SCOPE_TYPES.ITEM ? (
            <div className="adminAccessField">
              <label>Module assign to all</label>
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
                <label>Item Type for all</label>
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
                <label>Item ID for all</label>
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
                <label>Bundle ID for all</label>
                <input
                  value={form.bundleId}
                  onChange={(event) => updateField("bundleId", event.target.value)}
                  placeholder="bundle-cdp-practice-pack"
                />
              </div>

              <div className="adminAccessField adminAccessFull">
                <label>Bundle Item IDs for all</label>
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

          {form.scopeType !== ACCESS_SCOPE_TYPES.PLAN ? (
            <div className="adminAccessField">
              <label>Product ID optional</label>
              <input
                value={form.productId}
                onChange={(event) => updateField("productId", event.target.value)}
                placeholder="Optional non-plan catalog reference"
              />
            </div>
          ) : null}

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
              <option value={ACCESS_SOURCE.BULK_IMPORT}>Bulk Import</option>
              <option value={ACCESS_SOURCE.ADMIN_MANUAL}>Admin Manual</option>
              <option value={ACCESS_SOURCE.TRIAL}>Trial</option>
              <option value={ACCESS_SOURCE.PAYMENT}>Payment</option>
            </select>
          </div>

          {form.scopeType === ACCESS_SCOPE_TYPES.PLAN ? (
            <>
              <div className="adminAccessField">
                <label>Plan Validity for all</label>
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
                <small>Blank starts from bulk execution time.</small>
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
                <small>Optional. Blank means no expiry set.</small>
              </div>
            </>
          )}

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
            <label>Bulk Invite Later</label>
            <select
              value={form.sendInvite}
              onChange={(event) =>
                updateField("sendInvite", event.target.value)
              }
            >
              <option value="yes">Yes - prepare invite records later</option>
              <option value="no">No invite records</option>
            </select>
          </div>

          <div className="adminAccessField adminAccessFull">
            <label>Admin Note</label>
            <textarea
              value={form.adminNote}
              onChange={(event) =>
                updateField("adminNote", event.target.value)
              }
              placeholder="Batch reason, learner list source, payment/approval note..."
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
            <strong>Bulk save blocked:</strong> {saveError}
          </div>
        ) : null}

        {saveSummary ? (
          <div className="adminAccessNotice">
            <strong>Bulk save complete:</strong>{" "}
            {saveSummary.createdEmails.length} created, {" "}
            {saveSummary.updatedEmails.length} updated, {" "}
            {saveSummary.failedEmails.length} failed. Batch:{" "}
            {saveSummary.batchId} • {saveSummary.status}
            <div className="adminAccessTable">
              <div className="adminAccessRow">
                <strong>Created</strong>
                <span>{saveSummary.createdEmails.length}</span>
                <span className="adminAccessPill">Saved</span>
                <span>studentAccess</span>
              </div>

              <div className="adminAccessRow">
                <strong>Updated</strong>
                <span>{saveSummary.updatedEmails.length}</span>
                <span className="adminAccessPill">Idempotent</span>
                <span>Existing logical grant</span>
              </div>

              <div className="adminAccessRow">
                <strong>Skipped Existing</strong>
                <span>{saveSummary.skippedExistingEmails.length}</span>
                <span className="adminAccessPill">Safe</span>
                <span>No duplicate write</span>
              </div>

              <div className="adminAccessRow">
                <strong>Skipped Invalid</strong>
                <span>{saveSummary.skippedInvalid}</span>
                <span className="adminAccessPill">Blocked</span>
                <span>Bad emails not saved</span>
              </div>

              <div className="adminAccessRow">
                <strong>Paste Duplicates</strong>
                <span>{saveSummary.skippedPasteDuplicates}</span>
                <span className="adminAccessPill">Blocked</span>
                <span>Single unique save only</span>
              </div>


              <div className="adminAccessRow">
                <strong>Identity Conflicts</strong>
                <span>{saveSummary.skippedIdentityConflicts}</span>
                <span className="adminAccessPill">Fail Closed</span>
                <span>Different UID linkage</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="adminNotesLaunchHeroActions">
          <button
            type="button"
            className="adminNotesLaunchPrimaryBtn"
            onClick={handlePreview}
            disabled={
              checkingDuplicates ||
              saving ||
              (form.scopeType === ACCESS_SCOPE_TYPES.PLAN &&
                (catalogLoading || Boolean(catalogError)))
            }
          >
            {checkingDuplicates ? "Checking Duplicates..." : "Preview Bulk Import"}
          </button>

          <button
            type="button"
            className="adminNotesLaunchGhostBtn"
            onClick={loadSampleEmails}
            disabled={checkingDuplicates || saving}
          >
            Use Registered Learner List
          </button>

          <button
            type="button"
            className="adminNotesLaunchGhostBtn"
            onClick={resetForm}
            disabled={checkingDuplicates || saving}
          >
            Reset
          </button>
        </div>

        {showPreview ? (
          <div className="adminAccessNotice">
            <strong>Dry-run preview:</strong> Only ledger rows marked Ready will execute. Invalid, paste duplicate, identity-conflict, and existing matching grants remain recorded as skipped outcomes.

            {duplicateCheckError ? (
              <div className="adminAccessNotice">
                <strong>Duplicate check failed:</strong> {duplicateCheckError}
              </div>
            ) : null}

            {form.scopeType === ACCESS_SCOPE_TYPES.PLAN &&
            selectedPlanProduct ? (
              <div className="adminAccessNotice">
                <strong>Catalog snapshot:</strong>{" "}
                {selectedPlanProduct.title} • {selectedPlanProduct.planCode} • rank {selectedPlanProduct.accessRank} • price version {selectedPlanProduct.priceVersion} • {form.validityChoice}
              </div>
            ) : null}

            <div className="adminAccessTable">
              {previewStats.map((stat) => (
                <div className="adminAccessRow" key={stat.label}>
                  <strong>{stat.label}</strong>
                  <span>{stat.value}</span>
                  <span className="adminAccessPill">Count</span>
                  <span>Preview</span>
                </div>
              ))}
            </div>

            <div className="adminNotesLaunchHeroActions">
              <button
                type="button"
                className="adminNotesLaunchPrimaryBtn"
                onClick={handleConfirmBulkSave}
                disabled={
                  saving ||
                  checkingDuplicates ||
                  Boolean(duplicateCheckError) ||
                  !safeToCreateEmails.length ||
                  (form.scopeType === ACCESS_SCOPE_TYPES.PLAN &&
                    !selectedPlanProduct)
                }
              >
                {saving
                  ? "Running Resumable Import..."
                  : "Confirm Ledger & Execute"}
              </button>

              <button
                type="button"
                className="adminNotesLaunchGhostBtn"
                onClick={() => setShowPreview(false)}
                disabled={saving}
              >
                Cancel Preview
              </button>
            </div>

            <div className="adminAccessTable">
              {parsed.rows.slice(0, 40).map((row) => {
                const existingRecords = firestoreDuplicateMap[row.email] || [];
                const existingSameTarget = hasSameBulkAccessTarget(
                  existingRecords,
                  bulkAccessTarget
                );

                return (
                  <div
                    className="adminAccessRow"
                    key={row.rowNumber + row.original}
                  >
                    <strong>Row {row.rowNumber}</strong>
                    <span>{row.email || row.original}</span>
                    <span className="adminAccessPill">
                      {!row.valid
                        ? "Invalid"
                        : row.duplicateInPaste
                          ? "Paste Duplicate"
                          : existingSameTarget
                            ? "Existing"
                            : "Safe"}
                    </span>
                    <span>
                      {!row.valid
                        ? row.reason
                        : row.duplicateInPaste
                          ? "Will be skipped"
                          : existingSameTarget
                            ? "Will be skipped"
                            : "Will be created"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </AdminAccessRouteShell>
  );
}