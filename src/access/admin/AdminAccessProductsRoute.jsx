import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "../../firebase";
import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

import {
  AdminButton,
  AdminEmptyState,
  AdminErrorBox,
  AdminReviewPanel,
  AdminStatusPill,
} from "../../components/shared/admin";

import {
  ACCESS_COURSE,
  ACCESS_ITEM_TYPES,
  ACCESS_MODULE,
  ACCESS_SCOPE_TYPES,
  ACCESS_STATUS,
} from "../accessConstants";

import {
  createAccessProduct,
  listAccessProducts,
  updateAccessProduct,
} from "../accessService";

import {
  ACCESS_PRODUCT_FORM_OPTIONS,
  buildAccessProductFormFromRecord,
  buildAccessProductFormPayload,
  createInitialAccessProductForm,
  describeCatalogValidity,
  getPlanProductIdPreview,
  isPlanProductScope,
  normalizePlanCodeDraft,
  parseBundleItemIds,
  validateAccessProductForm,
} from "./accessProductFormModel";

const productActions = [
  {
    icon: "P",
    label: "Catalog",
    title: "Dynamic Plans",
    description:
      "Create and update plan products with stable codes, access ranks, price versions, and admin-defined validity.",
    route:
      "/admin/content/access/products",
    tone: "orange",
  },
  {
    icon: "K",
    label: "Keys",
    title: "Open Access Keys",
    description:
      "Generate and manage redeem keys linked with products, learners, and entitlement scopes.",
    route:
      "/admin/content/access/keys",
    tone: "green",
  },
];

const getProductKey = (
  product = {}
) =>
  product.id ||
  product.productId ||
  [
    product.scopeType,
    product.planCode ||
      product.planType,
    product.title ||
      product.name,
  ].join(":");

const getPlanCode = (
  product = {}
) =>
  String(
    product.planCode ||
      product.planType ||
      "FREE"
  )
    .trim()
    .toUpperCase();

const formatPrice = (
  product = {}
) =>
  "₹" +
  Number(
    product.priceINR ??
      product.price ??
      0
  ).toLocaleString("en-IN");

export default function AdminAccessProductsRoute() {
  const [form, setForm] = useState(
    createInitialAccessProductForm
  );
  const [products, setProducts] =
    useState([]);
  const [
    editingProductId,
    setEditingProductId,
  ] = useState("");
  const [errors, setErrors] =
    useState([]);
  const [saving, setSaving] =
    useState(false);
  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(false);
  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");
  const [saveError, setSaveError] =
    useState("");
  const [
    catalogError,
    setCatalogError,
  ] = useState("");

  const bundleItemIds = useMemo(
    () =>
      parseBundleItemIds(
        form.itemIdsText
      ),
    [form.itemIdsText]
  );

  const planProducts = useMemo(
    () =>
      products.filter((product) =>
        isPlanProductScope(
          product.scopeType
        )
      ),
    [products]
  );

  const loadCatalog = useCallback(
    async () => {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const nextProducts =
          await listAccessProducts({
            maxCount: 200,
          });

        setProducts(nextProducts);
      } catch (error) {
        setCatalogError(
          error?.message ||
            "Access product catalog could not be loaded."
        );
      } finally {
        setCatalogLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors([]);
    setSaveError("");
    setSuccessMessage("");
  };

  const handleScopeChange = (
    value
  ) => {
    setForm((current) => ({
      ...current,
      scopeType: value,
      planCode:
        isPlanProductScope(value)
          ? current.planCode ||
            "PREMIUM"
          : current.planCode ||
            "FREE",
    }));
    setErrors([]);
    setSaveError("");
    setSuccessMessage("");
  };

  const buildActor = () => {
    const currentUser =
      auth.currentUser;

    return {
      uid:
        currentUser?.uid || null,
      email:
        currentUser?.email || "",
      role: "admin",
      isAdmin: true,
    };
  };

  const resetForm = () => {
    setForm(
      createInitialAccessProductForm()
    );
    setEditingProductId("");
    setErrors([]);
    setSaveError("");
    setSuccessMessage("");
  };

  const startEdit = (
    product
  ) => {
    if (
      !isPlanProductScope(
        product.scopeType
      )
    ) {
      setSaveError(
        "This controlled editor currently updates plan catalog products only."
      );
      return;
    }

    setForm(
      buildAccessProductFormFromRecord(
        product
      )
    );
    setEditingProductId(
      product.id ||
        product.productId
    );
    setErrors([]);
    setSaveError("");
    setSuccessMessage(
      "Editing " +
        getPlanCode(product) +
        ". Product ID and plan code remain locked."
    );
  };

  const handleSaveProduct =
    async () => {
      setSaveError("");
      setSuccessMessage("");

      const nextErrors =
        validateAccessProductForm(
          form
        );

      setErrors(nextErrors);

      if (nextErrors.length) {
        return;
      }

      const actor = buildActor();

      if (!actor.email) {
        setSaveError(
          "Admin login session not found. Please login again."
        );
        return;
      }

      let payload;

      try {
        payload =
          buildAccessProductFormPayload(
            form
          );
      } catch (error) {
        setSaveError(
          error?.message ||
            "Product payload is invalid."
        );
        return;
      }

      const actionLabel =
        editingProductId
          ? "update"
          : "create";
      const proceed =
        window.confirm(
          "Confirm " +
            actionLabel +
            " access product: " +
            form.title.trim() +
            "? This writes accessProducts and accessAuditLogs only. It does not grant learner access."
        );

      if (!proceed) return;

      setSaving(true);

      try {
        const product =
          editingProductId
            ? await updateAccessProduct(
                editingProductId,
                {
                  ...payload,
                  actor,
                }
              )
            : await createAccessProduct(
                {
                  ...payload,
                  actor,
                }
              );

        setSuccessMessage(
          editingProductId
            ? "Access product updated successfully. Existing learner grant terms were not changed."
            : "Access product created successfully. Product ID: " +
                product.id
        );
        setForm(
          createInitialAccessProductForm()
        );
        setEditingProductId("");
        setErrors([]);
        await loadCatalog();
      } catch (error) {
        setSaveError(
          error?.message ||
            "Access product save failed."
        );
      } finally {
        setSaving(false);
      }
    };

  const planScope =
    isPlanProductScope(
      form.scopeType
    );
  const productIdPreview =
    planScope
      ? getPlanProductIdPreview(
          form
        )
      : "Generated after save";

  const previewRows = [
    [
      "Mode",
      editingProductId
        ? "Audited plan update"
        : "Create access product",
    ],
    [
      "Title",
      form.title.trim() ||
        "Required",
    ],
    ["Scope", form.scopeType],
    [
      "Product ID",
      productIdPreview,
    ],
    [
      "Plan Code",
      planScope
        ? form.planCode ||
          "Required"
        : "Not plan scoped",
    ],
    [
      "Access Rank",
      planScope
        ? form.accessRank ||
          "Required"
        : "Not plan scoped",
    ],
    [
      "Module",
      form.module ||
        "Not module scoped",
    ],
    [
      "Item Type",
      form.itemType ||
        "Not item scoped",
    ],
    [
      "Item ID",
      form.itemId.trim() ||
        "Not item scoped",
    ],
    [
      "Bundle ID",
      form.bundleId.trim() ||
        "Not bundle scoped",
    ],
    [
      "Bundle Items",
      bundleItemIds.length
        ? bundleItemIds.join(", ")
        : "Not bundle scoped",
    ],
    [
      "Validity",
      planScope
        ? form.defaultValidityDays ===
          ""
          ? form.allowNoExpiry
            ? "Admin decides per grant • no-expiry allowed"
            : "Admin decides per grant"
          : form.defaultValidityDays +
            " day optional default"
        : (form.validityDays ||
            "0") + " days",
    ],
    [
      "Price",
      form.price
        ? "₹" + form.price
        : "₹0",
    ],
    [
      "Compare Price",
      form.compareAtPrice
        ? "₹" +
          form.compareAtPrice
        : "₹0",
    ],
    [
      "Price Version",
      planScope
        ? String(
            form.priceVersion || 1
          )
        : "Not versioned",
    ],
    ["Status", form.status],
  ];

  return (
    <AdminAccessRouteShell
      badge="ACCESS PRODUCTS"
      title="Dynamic Access Product Workspace"
      description="Create new plans, update future pricing, set access hierarchy, and keep validity under Admin control. Current four plans are initial seed products—not a permanent limit."
      icon="P"
      moduleMeta="DYNAMIC CATALOG • ADMIN VALIDITY"
      stats={[
        {
          value:
            catalogLoading
              ? "..."
              : String(
                  products.length
                ),
          label:
            "Catalog Products",
        },
        {
          value:
            catalogLoading
              ? "..."
              : String(
                  planProducts.length
                ),
          label:
            "Plan Products",
        },
        {
          value: "Admin",
          label: "Validity",
        },
        {
          value: "Rank",
          label: "Hierarchy",
        },
      ]}
      trustItems={[
        "Stable product IDs",
        "Unique plan codes",
        "Versioned prices",
        "No broad grant",
      ]}
      primaryAction={{
        label: "Open Access Keys",
        route:
          "/admin/content/access/keys",
      }}
      secondaryAction={{
        label: "Back to Access",
        route:
          "/admin/content/access",
      }}
      sectionTitle={
        editingProductId
          ? "Update plan product"
          : "Create access product"
      }
      sectionDescription="Plan products use stable planCode + accessRank. Price changes are versioned for future purchases. Validity is chosen by Admin and no fixed 365-day rule is applied."
      actions={productActions}
    >
      <div className="adminAccessFormPanel">
        <div className="adminAccessHeroActions adminAccessHeroActions--filterBar">
          <AdminButton
            variant="secondary"
            onClick={loadCatalog}
            loading={catalogLoading}
            disabled={
              catalogLoading ||
              saving
            }
          >
            Refresh Catalog
          </AdminButton>

          {editingProductId ? (
            <AdminButton
              variant="secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel Edit
            </AdminButton>
          ) : null}
        </div>

        <div className="adminAccessFormGrid">
          <div className="adminAccessField">
            <label>Product Title</label>
            <input
              value={form.title}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              placeholder="CTET Crash Batch"
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
              {ACCESS_PRODUCT_FORM_OPTIONS.courses.map(
                (course) => (
                  <option
                    value={course}
                    key={course}
                  >
                    {course ===
                    ACCESS_COURSE.CTET_TET
                      ? "CTET / TET"
                      : course}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="adminAccessField">
            <label>Scope Type</label>
            <select
              value={form.scopeType}
              onChange={(event) =>
                handleScopeChange(
                  event.target.value
                )
              }
              disabled={
                Boolean(
                  editingProductId
                )
              }
            >
              <option
                value={
                  ACCESS_SCOPE_TYPES.PLAN
                }
              >
                Plan Product
              </option>
              <option
                value={
                  ACCESS_SCOPE_TYPES.MODULE
                }
              >
                Module Product
              </option>
              <option
                value={
                  ACCESS_SCOPE_TYPES.ITEM
                }
              >
                Item Product
              </option>
              <option
                value={
                  ACCESS_SCOPE_TYPES.BUNDLE
                }
              >
                Bundle Product
              </option>
            </select>
          </div>

          {planScope ? (
            <>
              <div className="adminAccessField">
                <label>
                  Plan Code
                </label>
                <input
                  value={
                    form.planCode
                  }
                  onChange={(event) =>
                    updateField(
                      "planCode",
                      normalizePlanCodeDraft(
                        event.target.value
                      )
                    )
                  }
                  placeholder="CTET_CRASH_45"
                  disabled={
                    Boolean(
                      editingProductId
                    )
                  }
                />
              </div>

              <div className="adminAccessField">
                <label>
                  Product ID
                </label>
                <input
                  value={
                    productIdPreview
                  }
                  readOnly
                />
              </div>

              <div className="adminAccessField">
                <label>
                  Access Rank
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.accessRank
                  }
                  onChange={(event) =>
                    updateField(
                      "accessRank",
                      event.target.value
                    )
                  }
                  placeholder="150"
                />
              </div>

              <div className="adminAccessField">
                <label>
                  Validity Mode
                </label>
                <input
                  value="Admin-defined"
                  readOnly
                />
              </div>

              <div className="adminAccessField">
                <label>
                  Optional Default Days
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.defaultValidityDays
                  }
                  onChange={(event) =>
                    updateField(
                      "defaultValidityDays",
                      event.target.value
                    )
                  }
                  placeholder="Blank = decide per grant"
                />
              </div>

              <div className="adminAccessField">
                <label>
                  No-expiry option
                </label>
                <select
                  value={
                    form.allowNoExpiry
                      ? "yes"
                      : "no"
                  }
                  onChange={(event) =>
                    updateField(
                      "allowNoExpiry",
                      event.target.value ===
                        "yes"
                    )
                  }
                >
                  <option value="yes">
                    Allowed
                  </option>
                  <option value="no">
                    Not allowed
                  </option>
                </select>
              </div>
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
                {Object.values(
                  ACCESS_MODULE
                ).map((module) => (
                  <option
                    value={module}
                    key={module}
                  >
                    {module}
                  </option>
                ))}
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
                  onChange={(event) =>
                    updateField(
                      "itemType",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select item type
                  </option>
                  {Object.values(
                    ACCESS_ITEM_TYPES
                  ).map(
                    (itemType) => (
                      <option
                        value={
                          itemType
                        }
                        key={itemType}
                      >
                        {itemType}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="adminAccessField">
                <label>
                  Item ID
                </label>
                <input
                  value={form.itemId}
                  onChange={(event) =>
                    updateField(
                      "itemId",
                      event.target.value
                    )
                  }
                  placeholder="content item / mock test / video id"
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
                  onChange={(event) =>
                    updateField(
                      "itemTitle",
                      event.target.value
                    )
                  }
                  placeholder="Visible reference title"
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
                  onChange={(event) =>
                    updateField(
                      "bundleId",
                      event.target.value
                    )
                  }
                  placeholder="premium-mock-video-bundle"
                />
              </div>

              <div className="adminAccessField">
                <label>
                  Bundle Item IDs
                </label>
                <textarea
                  value={
                    form.itemIdsText
                  }
                  onChange={(event) =>
                    updateField(
                      "itemIdsText",
                      event.target.value
                    )
                  }
                  placeholder="one item id per line or comma separated"
                />
              </div>
            </>
          ) : null}

          {!planScope ? (
            <div className="adminAccessField">
              <label>
                Validity Days
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.validityDays
                }
                onChange={(event) =>
                  updateField(
                    "validityDays",
                    event.target.value
                  )
                }
                placeholder="30"
              />
            </div>
          ) : null}

          <div className="adminAccessField">
            <label>Price</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) =>
                updateField(
                  "price",
                  event.target.value
                )
              }
              placeholder="999"
            />
          </div>

          <div className="adminAccessField">
            <label>
              Compare At Price
            </label>
            <input
              type="number"
              min="0"
              value={
                form.compareAtPrice
              }
              onChange={(event) =>
                updateField(
                  "compareAtPrice",
                  event.target.value
                )
              }
              placeholder="1999"
            />
          </div>

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
              {ACCESS_PRODUCT_FORM_OPTIONS.statuses.map(
                (status) => (
                  <option
                    value={status}
                    key={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="adminAccessField adminAccessFieldWide">
            <label>Description</label>
            <textarea
              value={
                form.description
              }
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="What this product unlocks..."
            />
          </div>

          <div className="adminAccessField adminAccessFieldWide">
            <label>Admin Note</label>
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
              placeholder="Internal product reason, launch batch, pricing note..."
            />
          </div>
        </div>

        {errors.length ? (
          <div className="adminAccessErrorBox">
            <strong>
              Fix before save:
            </strong>
            {errors.map((error) => (
              <span key={error}>
                {error}
              </span>
            ))}
          </div>
        ) : null}

        {saveError ? (
          <AdminErrorBox
            title="Product action failed"
            message={saveError}
          />
        ) : null}

        {successMessage ? (
          <div className="adminAccessSuccessBox">
            <strong>
              Catalog update:
            </strong>
            <span>
              {successMessage}
            </span>
          </div>
        ) : null}

        <div className="adminAccessPreviewGrid">
          <article className="adminAccessPreviewCard">
            <span>
              Product Identity
            </span>
            <strong>
              {planScope
                ? form.planCode ||
                  "Plan code pending"
                : form.title.trim() ||
                  "Product title pending"}
            </strong>
            <p>
              {planScope
                ? productIdPreview
                : form.scopeType}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>
              Validity Policy
            </span>
            <strong>
              {planScope
                ? "Admin-defined"
                : (form.validityDays ||
                    "0") +
                  " days"}
            </strong>
            <p>
              {planScope
                ? form.defaultValidityDays ===
                  ""
                  ? "Choose dates, no-expiry, or manual change when granting access."
                  : form.defaultValidityDays +
                    " day optional catalog default."
                : "Non-plan product validity remains scope-specific."}
            </p>
          </article>

          <article className="adminAccessPreviewCard">
            <span>
              Safety
            </span>
            <strong>
              No learner grant
            </strong>
            <p>
              Catalog save writes product + audit only. Existing grant terms do not change retroactively.
            </p>
          </article>
        </div>

        <AdminReviewPanel
          eyebrow="Confirmation Preview"
          title={
            editingProductId
              ? "Review audited plan update"
              : "Review product payload"
          }
          description="Plan code and product ID are stable after creation. Price edits create a new price version for future purchases; learner grants are not rewritten."
          highlights={[
            [
              "Title",
              form.title.trim() ||
                "Required",
              form.title.trim()
                ? "success"
                : "warning",
            ],
            [
              "Scope",
              form.scopeType,
            ],
            [
              "Price",
              form.price
                ? "₹" +
                  form.price
                : "₹0",
            ],
          ]}
          rows={previewRows}
          actionLabel={
            editingProductId
              ? "Update Plan Product"
              : "Create Access Product"
          }
          loadingLabel={
            editingProductId
              ? "Updating..."
              : "Saving..."
          }
          actionLoading={saving}
          actionDisabled={saving}
          onAction={
            handleSaveProduct
          }
          footerNote="Catalog writes are audited. Existing learner grant price and validity snapshots remain unchanged."
        />
      </div>

      <div className="adminAccessPreviewPanel">
        <div className="adminAccessPreviewHeader">
          <span>
            Access Product Catalog
          </span>
          <strong>
            {catalogLoading
              ? "Loading..."
              : products.length +
                " products"}
          </strong>
        </div>

        {catalogError ? (
          <AdminErrorBox
            title="Catalog load failed"
            message={catalogError}
          />
        ) : null}

        <div className="adminAccessRows">
          {!catalogLoading &&
          products.length === 0 ? (
            <AdminEmptyState
              eyebrow="Catalog empty"
              title="No access products found"
              description="Create the first plan, module, bundle, or item product. Saving a product does not grant learner access."
              icon="P"
            />
          ) : null}

          {products.map(
            (product) => {
              const planProduct =
                isPlanProductScope(
                  product.scopeType
                );
              const productId =
                product.id ||
                product.productId;
              const selected =
                editingProductId &&
                editingProductId ===
                  productId;

              return (
                <div
                  className="adminAccessRow"
                  key={getProductKey(
                    product
                  )}
                >
                  <strong>
                    {product.title ||
                      product.name ||
                      productId}
                  </strong>
                  <span className="adminAccessRecordMeta">
                    <span>
                      {planProduct
                        ? getPlanCode(
                            product
                          ) +
                          " • rank " +
                          String(
                            product.accessRank ??
                              "required"
                          )
                        : String(
                            product.scopeType ||
                              "product"
                          ).toUpperCase()}
                    </span>
                    <AdminStatusPill
                      status={
                        product.status ||
                        (product.isActive ===
                        false
                          ? "blocked"
                          : "active")
                      }
                      label={
                        product.status ||
                        (product.isActive ===
                        false
                          ? "blocked"
                          : "active")
                      }
                      size="sm"
                    />
                  </span>

                  <strong>
                    Product ID
                  </strong>
                  <span>
                    {productId ||
                      "Generated ID"}
                  </span>

                  <strong>
                    Price
                  </strong>
                  <span>
                    {formatPrice(
                      product
                    )}
                    {planProduct
                      ? " • version " +
                        String(
                          product.priceVersion ||
                            1
                        )
                      : ""}
                  </span>

                  <strong>
                    Validity
                  </strong>
                  <span>
                    {describeCatalogValidity(
                      product
                    )}
                  </span>

                  <strong>
                    Catalog Safety
                  </strong>
                  <span>
                    {planProduct
                      ? "Plan code and product ID stay stable. Existing grant terms remain unchanged."
                      : "Scope product remains separate from learner grants."}
                  </span>

                  <div className="adminAccessRowActions">
                    {planProduct ? (
                      <AdminButton
                        variant={
                          selected
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          startEdit(
                            product
                          )
                        }
                        disabled={saving}
                      >
                        {selected
                          ? "Editing"
                          : "Edit Plan"}
                      </AdminButton>
                    ) : (
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        disabled
                      >
                        Plan editor only
                      </AdminButton>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </AdminAccessRouteShell>
  );
}
