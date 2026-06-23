import React from "react";

import AdminAccessRouteShell from "./AdminAccessRouteShell.jsx";

const productActions = [
  {
    icon: "P",
    label: "Catalog",
    title: "Create Product Later",
    description:
      "Foundation route for plan, module, item, and bundle products before public checkout or key generation.",
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
  return (
    <AdminAccessRouteShell
      badge="ACCESS PRODUCTS"
      title="Access Product Workspace"
      description="Prepare catalog-ready access products for plan, module, item, and bundle entitlement scopes. This foundation screen keeps product architecture separate from learner grants."
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
      sectionTitle="Product foundation"
      sectionDescription="Product records will define what is sold or assigned: full plan, one module, one item, or a bundle of items. Live creation controls will be added after the service foundation is verified."
      actions={productActions}
    >
      <div className="adminAccessPreviewGrid">
        <article className="adminAccessPreviewCard">
          <span>Scope</span>
          <strong>Plan / Module / Item / Bundle</strong>
          <p>Products will reuse the entitlement scope fields already wired into learner access.</p>
        </article>

        <article className="adminAccessPreviewCard">
          <span>Catalog</span>
          <strong>Product ID Ready</strong>
          <p>Manual access, bulk import, and access keys can reference the same future product id.</p>
        </article>

        <article className="adminAccessPreviewCard">
          <span>Safety</span>
          <strong>No accidental grants</strong>
          <p>This route is a foundation workspace only. It does not create learner access directly.</p>
        </article>
      </div>
    </AdminAccessRouteShell>
  );
}