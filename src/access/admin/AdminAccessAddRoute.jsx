import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";
import { AdminReviewPanel } from "../../components/shared/admin";

import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_SCOPE_TYPES,
  ACCESS_SOURCE,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  createAccessInvite,
  createManualAccess,
  getAccessByEmail,
  listAccessProducts,
  normalizeAccessEmail,
} from "../accessService";

import {
  ADMIN_PLAN_VALIDITY_CHOICES,
  applyPlanProductToGrantForm,
  buildDynamicPlanGrantPayload,
  createInitialDynamicPlanGrantForm,
  listGrantablePlanProducts,
  validateDynamicPlanGrantForm,
} from "./accessGrantFormModel";

const createInitialForm = () => ({
  ...createInitialDynamicPlanGrantForm(),
  module: "",
  itemType: "",
  itemId: "",
  itemTitle: "",
  itemIdsText: "",
  bundleId: "",
  accessKeyId: "",
});

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

export default function AdminAccessAddRoute() {
  const [form, setForm] =
    useState(createInitialForm);
  const [errors, setErrors] =
    useState([]);
  const [showConfirm, setShowConfirm] =
    useState(false);

  const [
    duplicateRecords,
    setDuplicateRecords,
  ] = useState([]);
  const [
    duplicateLoading,
    setDuplicateLoading,
  ] = useState(false);
  const [
    duplicateError,
    setDuplicateError,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);
  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");
  const [saveError, setSaveError] =
    useState("");

  const [products, setProducts] =
    useState([]);
  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(false);
  const [
    catalogError,
    setCatalogError,
  ] = useState("");

  const loadPlanCatalog =
    useCallback(async () => {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const nextProducts =
          await listAccessProducts({
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
    () =>
      listGrantablePlanProducts(
        products
      ),
    [products]
  );

  const selectedPlanProduct =
    useMemo(
      () =>
        planProducts.find(
          (product) =>
            product.productId ===
            form.productId
        ) || null,
      [
        planProducts,
        form.productId,
      ]
    );

  const normalizedEmail = useMemo(
    () =>
      normalizeAccessEmail(
        form.email
      ),
    [form.email]
  );

  const bundleItemIds = useMemo(
    () =>
      form.itemIdsText
        .split(/[\n,]+/)
        .map((item) =>
          item
            .replace(
              /^\d+[\).\-\s]+/,
              ""
            )
            .trim()
        )
        .filter(Boolean),
    [form.itemIdsText]
  );

  const duplicateCourseMatches =
    useMemo(() => {
      const selectedCourse =
        String(
          form.course || ""
        )
          .trim()
          .toLowerCase();

      return duplicateRecords.filter(
        (record) => {
          const recordCourse =
            String(
              record.course || ""
            )
              .trim()
              .toLowerCase();

          return (
            !recordCourse ||
            recordCourse ===
              selectedCourse
          );
        }
      );
    }, [
      duplicateRecords,
      form.course,
    ]);

  const duplicateStatusText =
    duplicateError
      ? "Duplicate check failed: " +
        duplicateError
      : duplicateCourseMatches.length
        ? String(
            duplicateCourseMatches.length
          ) +
          " possible existing access record found for this email/course"
        : duplicateRecords.length
          ? String(
              duplicateRecords.length
            ) +
            " access record found for this email in another course/source"
          : "No existing access found for this email";

  const clearTransientState = () => {
    setShowConfirm(false);
    setDuplicateRecords([]);
    setDuplicateError("");
    setSuccessMessage("");
    setSaveError("");
    setErrors([]);
  };

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearTransientState();
  };

  const handleScopeChange = (
    value
  ) => {
    setForm((current) => ({
      ...current,
      scopeType: value,
      productId:
        value ===
        ACCESS_SCOPE_TYPES.PLAN
          ? current.productId
          : "",
      planCode:
        value ===
        ACCESS_SCOPE_TYPES.PLAN
          ? current.planCode
          : "",
      planType:
        value ===
        ACCESS_SCOPE_TYPES.PLAN
          ? current.planType
          : "",
      accessRank:
        value ===
        ACCESS_SCOPE_TYPES.PLAN
          ? current.accessRank
          : "",
      validityChoice:
        value ===
        ACCESS_SCOPE_TYPES.PLAN
          ? current.validityChoice
          : ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW,
      validityDays:
        value ===
        ACCESS_SCOPE_TYPES.PLAN
          ? current.validityDays
          : "",
      noExpiry: false,
      untilManualChange: false,
    }));
    clearTransientState();
  };

  const handlePlanProductChange = (
    productId
  ) => {
    const product =
      planProducts.find(
        (item) =>
          item.productId ===
          productId
      ) || null;

    setForm((current) =>
      product
        ? applyPlanProductToGrantForm(
            current,
            product
          )
        : {
            ...current,
            productId: "",
            planCode: "",
            planType: "",
            accessRank: "",
          }
    );
    clearTransientState();
  };

  const pushUniqueError = (
    list,
    message
  ) => {
    if (
      message &&
      !list.includes(message)
    ) {
      list.push(message);
    }
  };

  const validateForm = () => {
    const nextErrors = [];

    if (!normalizedEmail) {
      pushUniqueError(
        nextErrors,
        "Email is required."
      );
    }

    if (
      normalizedEmail &&
      !normalizedEmail.includes("@")
    ) {
      pushUniqueError(
        nextErrors,
        "Enter a valid Gmail/email address."
      );
    }

    if (!form.course) {
      pushUniqueError(
        nextErrors,
        "Course is required."
      );
    }

    if (!form.scopeType) {
      pushUniqueError(
        nextErrors,
        "Access scope is required."
      );
    }

    if (!form.status) {
      pushUniqueError(
        nextErrors,
        "Status is required."
      );
    }

    if (
      !form.adminNote.trim()
    ) {
      pushUniqueError(
        nextErrors,
        "Admin note is required for audit clarity."
      );
    }

    if (
      form.scopeType ===
      ACCESS_SCOPE_TYPES.PLAN
    ) {
      if (catalogLoading) {
        pushUniqueError(
          nextErrors,
          "Wait for the active plan catalog to finish loading."
        );
      }

      if (catalogError) {
        pushUniqueError(
          nextErrors,
          "Plan catalog must load successfully before a plan grant can be saved."
        );
      }

      if (
        !catalogLoading &&
        !catalogError &&
        !planProducts.length
      ) {
        pushUniqueError(
          nextErrors,
          "No active plan product is available. Create or activate a plan in Access Products first."
        );
      }

      validateDynamicPlanGrantForm({
        form,
        products,
      }).forEach((message) =>
        pushUniqueError(
          nextErrors,
          message
        )
      );
    }

    if (
      form.scopeType ===
        ACCESS_SCOPE_TYPES.MODULE &&
      !form.module
    ) {
      pushUniqueError(
        nextErrors,
        "Module is required for module access."
      );
    }

    if (
      form.scopeType ===
      ACCESS_SCOPE_TYPES.ITEM
    ) {
      if (!form.module) {
        pushUniqueError(
          nextErrors,
          "Module is required for item access."
        );
      }

      if (!form.itemType) {
        pushUniqueError(
          nextErrors,
          "Item type is required for item access."
        );
      }

      if (!form.itemId.trim()) {
        pushUniqueError(
          nextErrors,
          "Item ID is required for item access."
        );
      }
    }

    if (
      form.scopeType ===
        ACCESS_SCOPE_TYPES.BUNDLE &&
      !form.bundleId.trim() &&
      bundleItemIds.length === 0
    ) {
      pushUniqueError(
        nextErrors,
        "Bundle ID or bundle item IDs are required for bundle access."
      );
    }

    if (
      form.scopeType !==
        ACCESS_SCOPE_TYPES.PLAN &&
      form.accessFrom &&
      form.accessUntil
    ) {
      const fromTime = new Date(
        form.accessFrom
      ).getTime();
      const untilTime = new Date(
        form.accessUntil
      ).getTime();

      if (
        Number.isFinite(
          fromTime
        ) &&
        Number.isFinite(
          untilTime
        ) &&
        untilTime < fromTime
      ) {
        pushUniqueError(
          nextErrors,
          "Access Until cannot be before Access From."
        );
      }
    }

    setErrors(nextErrors);

    return (
      nextErrors.length === 0
    );
  };

  const buildNonPlanPayload =
    () => ({
      email: normalizedEmail,
      learnerName:
        form.name.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      course: form.course,
      scopeType:
        form.scopeType,
      planType: null,
      planCode: null,
      accessRank: null,
      module:
        form.module || null,
      itemType:
        form.itemType || null,
      itemId:
        form.itemId.trim() ||
        null,
      itemTitle:
        form.itemTitle.trim(),
      itemIds: bundleItemIds,
      bundleId:
        form.bundleId.trim() ||
        null,
      productId:
        form.productId.trim() ||
        null,
      accessKeyId:
        form.accessKeyId.trim() ||
        null,
      source: form.source,
      accessFrom:
        form.accessFrom || null,
      accessUntil:
        form.accessUntil || null,
      status: form.status,
      adminNote:
        form.adminNote.trim(),
      notes:
        form.adminNote.trim(),
    });

  const buildPayload = () => {
    if (
      form.scopeType ===
      ACCESS_SCOPE_TYPES.PLAN
    ) {
      return {
        ...buildDynamicPlanGrantPayload({
          form,
          products,
          now: new Date(),
        }),
        accessKeyId:
          form.accessKeyId.trim() ||
          null,
      };
    }

    return buildNonPlanPayload();
  };

  const buildActor = () => {
    const currentUser =
      auth.currentUser;

    return {
      uid:
        currentUser?.uid ||
        null,
      email:
        currentUser?.email ||
        "",
      role: "admin",
      isAdmin: true,
    };
  };

  const checkDuplicateAccess =
    async () => {
      if (!normalizedEmail) {
        setDuplicateRecords([]);
        return [];
      }

      setDuplicateLoading(true);
      setDuplicateError("");

      try {
        const records =
          await getAccessByEmail(
            normalizedEmail
          );
        const safeRecords =
          Array.isArray(records)
            ? records
            : [];

        const selectedCourse =
          String(
            form.course || ""
          )
            .trim()
            .toLowerCase();

        const courseRecords =
          safeRecords.filter(
            (record) => {
              const recordCourse =
                String(
                  record.course ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              return (
                !recordCourse ||
                recordCourse ===
                  selectedCourse
              );
            }
          );

        setDuplicateRecords(
          safeRecords
        );

        return courseRecords;
      } catch (error) {
        const message =
          error?.message ||
          "Duplicate check failed.";

        setDuplicateError(
          message
        );

        return [];
      } finally {
        setDuplicateLoading(
          false
        );
      }
    };

  const handlePreview =
    async () => {
      setSuccessMessage("");
      setSaveError("");

      if (!validateForm()) {
        setShowConfirm(false);
        return;
      }

      await checkDuplicateAccess();
      setShowConfirm(true);
    };

  const handleConfirmSave =
    async () => {
      setSaveError("");
      setSuccessMessage("");

      if (!validateForm()) {
        return;
      }

      const actor = buildActor();

      if (!actor.email) {
        setSaveError(
          "Admin login session not found. Please login again."
        );
        return;
      }

      if (duplicateError) {
        const proceedWithoutDuplicateCheck =
          window.confirm(
            "Duplicate check failed. Continue only if you have manually verified this learner."
          );

        if (
          !proceedWithoutDuplicateCheck
        ) {
          return;
        }
      }

      if (
        duplicateCourseMatches.length
      ) {
        const proceedDuplicate =
          window.confirm(
            "Existing access found for this learner. Matching logical grant will be updated safely instead of creating another active duplicate. Continue?"
          );

        if (!proceedDuplicate) {
          return;
        }
      }

      const proceed =
        window.confirm(
          "Confirm save access for " +
            normalizedEmail +
            "? This writes studentAccess and audit logs using the reviewed product and validity snapshot."
        );

      if (!proceed) {
        return;
      }

      setSaving(true);

      try {
        const payload =
          buildPayload();

        const accessRecord =
          await createManualAccess({
            ...payload,
            actor,
          });

        const accessWriteMode =
          accessRecord.accessWriteMode ||
          "created";
        const createdNewGrant =
          accessWriteMode ===
          "created";

        if (
          createdNewGrant &&
          form.sendInvite ===
            "yes"
        ) {
          await createAccessInvite({
            ...payload,
            actor,
            accessId:
              accessRecord.id,
            status:
              ACCESS_STATUS.PENDING,
            inviteStatus:
              "pending",
            sendInvite: true,
          });
        }

        const skippedFollowUp =
          !createdNewGrant &&
          form.sendInvite ===
            "yes";

        setSuccessMessage(
          (
            createdNewGrant
              ? "New logical grant created"
              : "Existing logical grant updated safely"
          ) +
            " for " +
            normalizedEmail +
            ". Product identity, validity terms, and audit metadata were preserved." +
            (
              skippedFollowUp
                ? " Duplicate invite creation was skipped; use Invite Manager for an intentional resend."
                : ""
            )
        );

        setShowConfirm(false);
        setDuplicateRecords([]);
      } catch (error) {
        setSaveError(
          error?.message ||
            "Access save failed."
        );
      } finally {
        setSaving(false);
      }
    };

  const resetForm = () => {
    setForm(
      createInitialForm()
    );
    setErrors([]);
    setShowConfirm(false);
    setDuplicateRecords([]);
    setDuplicateError("");
    setSuccessMessage("");
    setSaveError("");
  };

  const compactAccessLabel =
    form.scopeType ===
    ACCESS_SCOPE_TYPES.PLAN
      ? selectedPlanProduct
        ? selectedPlanProduct.title +
          " (" +
          selectedPlanProduct.planCode +
          ")"
        : "Select active plan"
      : form.scopeType ===
          ACCESS_SCOPE_TYPES.MODULE
        ? "Module: " +
          (form.module || "-")
        : form.scopeType ===
            ACCESS_SCOPE_TYPES.ITEM
          ? "Item: " +
            (
              form.itemTitle.trim() ||
              form.itemId.trim() ||
              "-"
            )
          : form.scopeType ===
              ACCESS_SCOPE_TYPES.BUNDLE
            ? "Bundle: " +
              (
                form.bundleId.trim() ||
                (
                  bundleItemIds.length
                    ? String(
                        bundleItemIds.length
                      ) +
                      " items"
                    : "-"
                )
              )
            : "Access";

  const compactAccessHint =
    form.scopeType ===
    ACCESS_SCOPE_TYPES.MODULE
      ? "Only selected module unlocks. Full plan is not unlocked."
      : form.scopeType ===
          ACCESS_SCOPE_TYPES.ITEM
        ? "Only selected item unlocks. Full module or full plan is not unlocked."
        : form.scopeType ===
            ACCESS_SCOPE_TYPES.BUNDLE
          ? "Only bundle items unlock. Full plan is not unlocked."
          : "Plan-level entitlement uses the selected catalog product, access rank, and snapshotted validity terms.";

  const planValidityText =
    form.validityChoice ===
    ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS
      ? (
          form.validityDays ||
          "0"
        ) +
        " days from " +
        (
          form.accessFrom ||
          "approval date"
        )
      : form.validityChoice ===
          ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY
        ? "No expiry"
        : form.validityChoice ===
            ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE
          ? "Until manually changed"
          : (
              form.accessFrom ||
              "Approval date"
            ) +
            " → " +
            (
              form.accessUntil ||
              "End date required"
            );

  const validityText =
    form.scopeType ===
    ACCESS_SCOPE_TYPES.PLAN
      ? planValidityText
      : (
          form.accessFrom ||
          "Immediate"
        ) +
        " → " +
        (
          form.accessUntil ||
          "No expiry"
        );

  return (
    <AdminAccessRouteShell
      badge="ADD ACCESS"
      title="Add Learner Access"
      description="Create learner access with a live catalog plan, exact entitlement scope, admin-selected validity, optional invite, and audit-ready confirmation."
      icon="+"
      primaryAction={{
        label:
          "Manage Access",
        route:
          "/admin/content/access/manage",
      }}
      secondaryAction={{
        label:
          "Access Products",
        route:
          "/admin/content/access/products",
      }}
      sectionTitle="Single learner grant"
      sectionDescription="Plan grants are selected from active accessProducts. Product identity, access rank, price version, and validity terms are snapshotted before any Firestore write."
      stats={[
        {
          value:
            catalogLoading
              ? "..."
              : String(
                  planProducts.length
                ),
          label:
            "Active Plans",
        },
        {
          value: "Scope",
          label:
            "Entitlement",
        },
        {
          value: "Admin",
          label:
            "Validity",
        },
        {
          value: "Audit",
          label:
            "Before Save",
        },
      ]}
    >
      <div className="adminAccessFormPanel">
        {catalogError ? (
          <div className="adminAccessNotice">
            <strong>
              Plan catalog unavailable:
            </strong>{" "}
            {catalogError}{" "}
            <button
              type="button"
              className="adminNotesLaunchGhostBtn"
              onClick={
                loadPlanCatalog
              }
              disabled={
                catalogLoading
              }
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="adminAccessFormGrid">
          <div className="adminAccessField">
            <label>Email</label>
            <input
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              placeholder="learner@gmail.com"
            />
            <small>
              Normalized:{" "}
              {normalizedEmail ||
                "-"}
            </small>
          </div>

          <div className="adminAccessField">
            <label>
              Name optional
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              placeholder="Learner name"
            />
          </div>

          <div className="adminAccessField">
            <label>
              Phone optional
            </label>
            <input
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              placeholder="Mobile number"
            />
          </div>

          <div className="adminAccessField">
            <label>Course</label>
            <select
              value={form.course}
              onChange={(event) =>
                updateField(
                  "course",
                  event.target.value
                )
              }
            >
              <option
                value={
                  ACCESS_COURSE.CTET_TET
                }
              >
                CTET / TET
              </option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>
              Access Scope
            </label>
            <select
              value={
                form.scopeType
              }
              onChange={(event) =>
                handleScopeChange(
                  event.target.value
                )
              }
            >
              <option
                value={
                  ACCESS_SCOPE_TYPES.PLAN
                }
              >
                Plan Access
              </option>
              <option
                value={
                  ACCESS_SCOPE_TYPES.MODULE
                }
              >
                Module Access
              </option>
              <option
                value={
                  ACCESS_SCOPE_TYPES.ITEM
                }
              >
                Single Item Access
              </option>
              <option
                value={
                  ACCESS_SCOPE_TYPES.BUNDLE
                }
              >
                Bundle Access
              </option>
            </select>
            <small>
              Login proves identity.
              Scope decides the
              entitlement.
            </small>
          </div>

          {form.scopeType ===
          ACCESS_SCOPE_TYPES.PLAN ? (
            <>
              <div className="adminAccessField">
                <label>
                  Active Plan Product
                </label>
                <select
                  value={
                    form.productId
                  }
                  onChange={(
                    event
                  ) =>
                    handlePlanProductChange(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    catalogLoading ||
                    Boolean(
                      catalogError
                    )
                  }
                >
                  <option value="">
                    {catalogLoading
                      ? "Loading active plans..."
                      : "Select active plan"}
                  </option>
                  {planProducts.map(
                    (product) => (
                      <option
                        key={
                          product.productId
                        }
                        value={
                          product.productId
                        }
                      >
                        {formatPlanOption(
                          product
                        )}
                      </option>
                    )
                  )}
                </select>
                <small>
                  Only active
                  accessProducts can
                  create plan grants.
                </small>
              </div>

              <div className="adminAccessField">
                <label>
                  Access Duration
                </label>
                <select
                  value={
                    form.validityChoice
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "validityChoice",
                      event.target
                        .value
                    )
                  }
                >
                  <option
                    value={
                      ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW
                    }
                  >
                    Custom date window
                  </option>
                  <option
                    value={
                      ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS
                    }
                  >
                    Validity days
                  </option>
                  <option
                    value={
                      ADMIN_PLAN_VALIDITY_CHOICES.NO_EXPIRY
                    }
                    disabled={
                      selectedPlanProduct
                        ? !selectedPlanProduct.allowNoExpiry
                        : true
                    }
                  >
                    No expiry
                  </option>
                  <option
                    value={
                      ADMIN_PLAN_VALIDITY_CHOICES.UNTIL_MANUAL_CHANGE
                    }
                  >
                    Until manual change
                  </option>
                </select>
                <small>
                  No fixed 365-day or
                  silent fallback is
                  applied.
                </small>
              </div>

              {selectedPlanProduct ? (
                <div className="adminAccessNotice adminAccessFull">
                  <strong>
                    Catalog snapshot:
                  </strong>{" "}
                  {
                    selectedPlanProduct.title
                  }{" "}
                  •{" "}
                  {
                    selectedPlanProduct.planCode
                  }{" "}
                  • Rank{" "}
                  {
                    selectedPlanProduct.accessRank
                  }{" "}
                  •{" "}
                  {formatPrice(
                    selectedPlanProduct
                  )}{" "}
                  • Price version{" "}
                  {
                    selectedPlanProduct.priceVersion
                  }
                </div>
              ) : null}
            </>
          ) : null}

          {form.scopeType ===
            ACCESS_SCOPE_TYPES.MODULE ||
          form.scopeType ===
            ACCESS_SCOPE_TYPES.ITEM ? (
            <div className="adminAccessField">
              <label>Module</label>
              <select
                value={form.module}
                onChange={(event) =>
                  updateField(
                    "module",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select module
                </option>
                <option
                  value={
                    ACCESS_MODULE.MOCK_TEST
                  }
                >
                  Mock Tests
                </option>
                <option
                  value={
                    ACCESS_MODULE.NOTES
                  }
                >
                  Notes / PDFs
                </option>
                <option
                  value={
                    ACCESS_MODULE.VIDEO
                  }
                >
                  Videos
                </option>
                <option
                  value={
                    ACCESS_MODULE.CURRENT_AFFAIRS
                  }
                >
                  Current Affairs
                </option>
                <option
                  value={
                    ACCESS_MODULE.ROADMAP
                  }
                >
                  Roadmap
                </option>
              </select>
            </div>
          ) : null}

          {form.scopeType ===
          ACCESS_SCOPE_TYPES.ITEM ? (
            <>
              <div className="adminAccessField">
                <label>
                  Item Type
                </label>
                <select
                  value={
                    form.itemType
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "itemType",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Select item type
                  </option>
                  <option
                    value={
                      ACCESS_ITEM_TYPES.MOCK_TEST
                    }
                  >
                    Mock Test
                  </option>
                  <option
                    value={
                      ACCESS_ITEM_TYPES.NOTES_PDF
                    }
                  >
                    Notes PDF
                  </option>
                  <option
                    value={
                      ACCESS_ITEM_TYPES.VIDEO
                    }
                  >
                    Video
                  </option>
                  <option
                    value={
                      ACCESS_ITEM_TYPES.CURRENT_AFFAIRS_PDF
                    }
                  >
                    Current Affairs PDF
                  </option>
                  <option
                    value={
                      ACCESS_ITEM_TYPES.ROADMAP
                    }
                  >
                    Roadmap
                  </option>
                </select>
              </div>

              <div className="adminAccessField">
                <label>Item ID</label>
                <input
                  value={
                    form.itemId
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "itemId",
                      event.target
                        .value
                    )
                  }
                  placeholder="Exact content/test/video/PDF id"
                />
              </div>

              <div className="adminAccessField">
                <label>
                  Item Title optional
                </label>
                <input
                  value={
                    form.itemTitle
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "itemTitle",
                      event.target
                        .value
                    )
                  }
                  placeholder="Human readable item name"
                />
              </div>
            </>
          ) : null}

          {form.scopeType ===
          ACCESS_SCOPE_TYPES.BUNDLE ? (
            <>
              <div className="adminAccessField">
                <label>
                  Bundle ID
                </label>
                <input
                  value={
                    form.bundleId
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "bundleId",
                      event.target
                        .value
                    )
                  }
                  placeholder="bundle-cdp-practice-pack"
                />
              </div>

              <div className="adminAccessField adminAccessFull">
                <label>
                  Bundle Item IDs
                </label>
                <textarea
                  value={
                    form.itemIdsText
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "itemIdsText",
                      event.target
                        .value
                    )
                  }
                  placeholder="One item id per line, or comma-separated IDs"
                />
                <small>
                  {
                    bundleItemIds.length
                  }{" "}
                  item IDs parsed for
                  bundle access.
                </small>
              </div>
            </>
          ) : null}

          {form.scopeType !==
          ACCESS_SCOPE_TYPES.PLAN ? (
            <div className="adminAccessField">
              <label>
                Product ID optional
              </label>
              <input
                value={
                  form.productId
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "productId",
                    event.target.value
                  )
                }
                placeholder="Optional non-plan catalog reference"
              />
            </div>
          ) : null}

          <div className="adminAccessField">
            <label>
              Access Key ID optional
            </label>
            <input
              value={
                form.accessKeyId
              }
              onChange={(event) =>
                updateField(
                  "accessKeyId",
                  event.target.value
                )
              }
              placeholder="Optional redeem key reference"
            />
          </div>

          <div className="adminAccessField">
            <label>Source</label>
            <select
              value={form.source}
              onChange={(event) =>
                updateField(
                  "source",
                  event.target.value
                )
              }
            >
              <option
                value={
                  ACCESS_SOURCE.ADMIN_MANUAL
                }
              >
                Admin Manual
              </option>
              <option
                value={
                  ACCESS_SOURCE.TRIAL
                }
              >
                Trial
              </option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>
              Access From
            </label>
            <input
              type="date"
              value={
                form.accessFrom
              }
              onChange={(event) =>
                updateField(
                  "accessFrom",
                  event.target.value
                )
              }
            />
            <small>
              Blank means approval
              time.
            </small>
          </div>

          {form.scopeType ===
            ACCESS_SCOPE_TYPES.PLAN &&
          form.validityChoice ===
            ADMIN_PLAN_VALIDITY_CHOICES.CUSTOM_WINDOW ? (
            <div className="adminAccessField">
              <label>
                Access Until
              </label>
              <input
                type="date"
                value={
                  form.accessUntil
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "accessUntil",
                    event.target
                      .value
                  )
                }
              />
            </div>
          ) : null}

          {form.scopeType ===
            ACCESS_SCOPE_TYPES.PLAN &&
          form.validityChoice ===
            ADMIN_PLAN_VALIDITY_CHOICES.VALIDITY_DAYS ? (
            <div className="adminAccessField">
              <label>
                Validity Days
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={
                  form.validityDays
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "validityDays",
                    event.target
                      .value
                  )
                }
                placeholder="30"
              />
            </div>
          ) : null}

          {form.scopeType !==
          ACCESS_SCOPE_TYPES.PLAN ? (
            <div className="adminAccessField">
              <label>
                Access Until
              </label>
              <input
                type="date"
                value={
                  form.accessUntil
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "accessUntil",
                    event.target
                      .value
                  )
                }
              />
            </div>
          ) : null}

          <div className="adminAccessField">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value
                )
              }
            >
              <option
                value={
                  ACCESS_STATUS.ACTIVE
                }
              >
                Active
              </option>
              <option
                value={
                  ACCESS_STATUS.PENDING
                }
              >
                Pending
              </option>
              <option
                value={
                  ACCESS_STATUS.EXPIRED
                }
              >
                Expired
              </option>
              <option
                value={
                  ACCESS_STATUS.BLOCKED
                }
              >
                Blocked
              </option>
            </select>
          </div>

          <div className="adminAccessField">
            <label>
              Send Invite
            </label>
            <select
              value={
                form.sendInvite
              }
              onChange={(event) =>
                updateField(
                  "sendInvite",
                  event.target.value
                )
              }
            >
              <option value="yes">
                Yes - create invite
                record
              </option>
              <option value="no">
                No
              </option>
            </select>
          </div>

          <div className="adminAccessField adminAccessFull">
            <label>
              Admin Note
            </label>
            <textarea
              value={
                form.adminNote
              }
              onChange={(event) =>
                updateField(
                  "adminNote",
                  event.target.value
                )
              }
              placeholder="Reason, payment reference, learner context, or approval note..."
            />
          </div>
        </div>

        {errors.length ? (
          <div className="adminAccessNotice">
            <strong>
              Fix before preview:
            </strong>{" "}
            {errors.join(" ")}
          </div>
        ) : null}

        {saveError ? (
          <div className="adminAccessNotice">
            <strong>
              Save failed:
            </strong>{" "}
            {saveError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="adminAccessNotice">
            <strong>
              Success:
            </strong>{" "}
            {successMessage}
          </div>
        ) : null}

        <div className="adminNotesLaunchHeroActions">
          <button
            type="button"
            className="adminNotesLaunchPrimaryBtn"
            onClick={
              handlePreview
            }
            disabled={
              duplicateLoading ||
              saving ||
              (
                form.scopeType ===
                  ACCESS_SCOPE_TYPES.PLAN &&
                catalogLoading
              )
            }
          >
            {duplicateLoading
              ? "Checking..."
              : "Preview Confirmation"}
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
            description="Save writes studentAccess, optional invite, and audit logs. Plan grants use the reviewed catalog identity and immutable purchase-term snapshot."
            highlights={[
              [
                "Learner",
                normalizedEmail ||
                  "Email missing",
                normalizedEmail
                  ? "success"
                  : "warning",
              ],
              [
                "Entitlement",
                compactAccessLabel,
              ],
              [
                "Validity",
                validityText,
              ],
            ]}
            rows={[
              [
                "Name",
                form.name.trim() ||
                  "Name optional",
              ],
              [
                "Phone",
                form.phone.trim() ||
                  "Phone optional",
              ],
              [
                "Course",
                form.course,
              ],
              [
                "Source",
                form.source,
              ],
              [
                "Product ID",
                form.scopeType ===
                  ACCESS_SCOPE_TYPES.PLAN
                  ? selectedPlanProduct?.productId ||
                    "Not selected"
                  : form.productId ||
                    "Not linked",
              ],
              [
                "Plan Code / Rank",
                form.scopeType ===
                  ACCESS_SCOPE_TYPES.PLAN
                  ? (
                      selectedPlanProduct?.planCode ||
                      "Not selected"
                    ) +
                    " / " +
                    (
                      selectedPlanProduct?.accessRank ??
                      "-"
                    )
                  : "Not plan scoped",
              ],
              [
                "Price Snapshot",
                form.scopeType ===
                    ACCESS_SCOPE_TYPES.PLAN &&
                  selectedPlanProduct
                  ? formatPrice(
                      selectedPlanProduct
                    ) +
                    " • version " +
                    selectedPlanProduct.priceVersion
                  : "Not plan scoped",
              ],
              [
                "Invite",
                form.sendInvite ===
                  "yes"
                  ? "Create invite link"
                  : "No invite",
              ],
              [
                "Status",
                form.status,
              ],
              [
                "Safety",
                duplicateStatusText,
                duplicateStatusText.includes(
                  "Duplicate"
                )
                  ? "warning"
                  : "success",
              ],
              [
                "Admin Note",
                form.adminNote.trim() ||
                  "No admin note",
                "default",
                "wide",
              ],
              [
                "Scope Detail",
                compactAccessHint,
                "default",
                "wide",
              ],
            ]}
            actionLabel="Confirm & Save"
            loadingLabel="Saving..."
            actionLoading={saving}
            actionDisabled={saving}
            onAction={
              handleConfirmSave
            }
            secondaryActionLabel="Edit"
            onSecondaryAction={() =>
              setShowConfirm(false)
            }
            secondaryActionDisabled={
              saving
            }
            footerNote="Plan grants fail closed when the active catalog product or explicit validity is missing. Verified UID claim still happens after learner login."
          />
        ) : null}
      </div>
    </AdminAccessRouteShell>
  );
}
