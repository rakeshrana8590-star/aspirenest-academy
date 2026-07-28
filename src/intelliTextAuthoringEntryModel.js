export const INTELLITEXT_AUTHORING_PATH_PREFIX =
  "/admin/content/notes/intellitext/";

export const normalizeAuthoringPath = (value = "") => {
  const clean = String(value || "/").replace(/\/+$/, "");
  return clean || "/";
};

export const isIntelliTextAuthoringPath = (value = "") =>
  normalizeAuthoringPath(value).startsWith(INTELLITEXT_AUTHORING_PATH_PREFIX) &&
  normalizeAuthoringPath(value).length > INTELLITEXT_AUTHORING_PATH_PREFIX.length;

export const getIntelliTextAuthoringTextbookId = (value = "") => {
  const path = normalizeAuthoringPath(value);
  if (!isIntelliTextAuthoringPath(path)) return "";
  const encoded = path.slice(INTELLITEXT_AUTHORING_PATH_PREFIX.length);
  try {
    return decodeURIComponent(encoded).trim();
  } catch (_) {
    return "";
  }
};

const clean = (value = "") => String(value ?? "").trim();
const lower = (value = "") => clean(value).toLowerCase();

export const getAuthoringResourceId = (resource = {}) =>
  clean(
    resource.resourceId ||
      resource.id ||
      resource.textbookId ||
      resource.intelliTextId ||
      resource.learningTextId ||
      ""
  );

export const isAuthoringNoteResource = (resource = {}) => {
  const section = lower(
    resource.section ||
      resource.contentSection ||
      resource.module ||
      resource.moduleKey ||
      ""
  );
  const type = lower(
    resource.type ||
      resource.resourceType ||
      resource.contentType ||
      resource.itemType ||
      resource.deliveryType ||
      ""
  );

  const explicitOtherModule =
    [
      "currentaffairs",
      "current-affairs",
      "roadmaps",
      "roadmap",
      "videos",
      "video",
      "mocktest",
      "mock-test",
      "tests",
      "test",
      "live",
      "replay",
    ].includes(section) ||
    /(current[ -]?affairs|roadmap|aspirepath|video|mock|test|live|replay)/.test(
      type
    );

  const noteOwned =
    ["notes", "note", "subjectpdf", "coursematerial"].includes(section) ||
    /(pdf[ -]?note|native[ -]?note|intellitext|learningtext|native_text|(^|[ -])note($|[ -]))/.test(
      type
    );

  return Boolean(getAuthoringResourceId(resource) && noteOwned && !explicitOtherModule);
};

export const resolveAuthoringAdminState = ({
  pathname = "",
  session = null,
  adminData = null,
} = {}) => {
  const textbookId = getIntelliTextAuthoringTextbookId(pathname);
  const role = lower(session?.role);
  const sessionReady = session?.ready === true;
  const adminReady = adminData?.ready === true;
  const resources = Array.isArray(adminData?.resources)
    ? adminData.resources
    : [];

  if (!textbookId) {
    return Object.freeze({ state: "ROUTE_INVALID", textbookId: "", resource: null });
  }
  if (!sessionReady) {
    return Object.freeze({ state: "AUTH_LOADING", textbookId, resource: null });
  }
  if (role !== "admin") {
    return Object.freeze({ state: "ADMIN_REQUIRED", textbookId, resource: null });
  }
  if (!adminReady && resources.length === 0) {
    return Object.freeze({ state: "DATA_LOADING", textbookId, resource: null });
  }

  const resource =
    resources.find(
      (item) =>
        getAuthoringResourceId(item) === textbookId &&
        isAuthoringNoteResource(item)
    ) || null;

  if (!resource) {
    return Object.freeze({ state: "NOTE_NOT_FOUND", textbookId, resource: null });
  }

  return Object.freeze({
    state: "READY",
    textbookId,
    resource: Object.freeze({ ...resource, id: textbookId, textbookId }),
  });
};
