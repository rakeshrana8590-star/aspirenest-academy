export const INTELLITEXT_MIGRATION_PATH = "/admin/content/notes/migration";

export const normalizeMigrationPath = (value = "") => {
  const clean = String(value || "/").replace(/\/+$/, "");
  return clean || "/";
};

export const isIntelliTextMigrationPath = (value = "") =>
  normalizeMigrationPath(value) === INTELLITEXT_MIGRATION_PATH;

export const resolveMigrationAdminState = ({ session = null, adminData = null } = {}) => {
  const role = String(session?.role || "").trim().toLowerCase();
  const sessionReady = session?.ready === true;
  const adminReady = adminData?.ready === true;
  const resources = Array.isArray(adminData?.resources) ? adminData.resources : [];
  const sourceErrors = adminData?.sourceErrors && typeof adminData.sourceErrors === "object"
    ? adminData.sourceErrors
    : {};

  if (!sessionReady) {
    return Object.freeze({ state: "AUTH_LOADING", resources: [], sourceErrors });
  }
  if (role !== "admin") {
    return Object.freeze({ state: "ADMIN_REQUIRED", resources: [], sourceErrors });
  }
  if (!adminReady && resources.length === 0) {
    return Object.freeze({ state: "DATA_LOADING", resources: [], sourceErrors });
  }
  return Object.freeze({ state: "READY", resources, sourceErrors });
};
