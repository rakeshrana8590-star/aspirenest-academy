const clean = (value = "") => String(value ?? "").trim();

export const INTELLITEXT_STUDENT_READER_PREFIX =
  "/ctet-tet/notes/read/";

export const getIntelliTextStudentReaderId = (pathname = "") => {
  const path = clean(pathname).replace(/\/+$/, "");

  if (!path.startsWith(INTELLITEXT_STUDENT_READER_PREFIX)) {
    return "";
  }

  const encodedId = path.slice(INTELLITEXT_STUDENT_READER_PREFIX.length);

  if (!encodedId || encodedId.includes("/")) {
    return "";
  }

  try {
    return decodeURIComponent(encodedId);
  } catch {
    return "";
  }
};

export const isIntelliTextStudentReaderPath = (pathname = "") =>
  Boolean(getIntelliTextStudentReaderId(pathname));

const canonicalNote = (resource = {}, textbookId = "") => {
  const source =
    resource?.source && typeof resource.source === "object"
      ? resource.source
      : {};
  const id = clean(
    textbookId ||
      source.textbookId ||
      source.resourceId ||
      source.id ||
      resource.resourceId ||
      resource.id
  );
  const contentVersion = Math.max(
    1,
    Number(source.contentVersion || resource.contentVersion || 1) || 1
  );

  return Object.freeze({
    ...source,
    id: clean(source.id || source.resourceId || id) || id,
    itemId: clean(source.itemId || id) || id,
    resourceId: clean(source.resourceId || id) || id,
    textbookId: id,
    title: clean(resource.title || source.title) || "AspireNest IntelliText",
    description: clean(
      resource.description ||
        resource.subtitle ||
        source.description ||
        source.summary
    ),
    subject: clean(
      resource.subjectName ||
        resource.subject ||
        source.subjectName ||
        source.subject
    ),
    subjectId: clean(source.subjectId || resource.subject),
    chapter: clean(resource.chapter || source.chapter || source.chapterName),
    chapterId: clean(source.chapterId || resource.chapter),
    section: "notes",
    module: "notes",
    status: "Published",
    publicationState: "PUBLISHED",
    deliveryMode: "NATIVE_TEXT",
    nativeReady: true,
    contentVersion,
    planType: clean(
      resource.requiredPlan ||
        resource.plan ||
        source.planType ||
        source.requiredPlan ||
        "FREE"
    ).toUpperCase(),
    hasProtectedAsset: true,
  });
};

export const buildV8ReaderAccessDecision = ({
  session = null,
  resource = null,
  studentData = null,
} = {}) => {
  const authenticated = Boolean(session?.user);
  const admin = clean(session?.role).toLowerCase() === "admin";
  const open = clean(resource?.state).toLowerCase() === "open";
  const loading =
    studentData?.loading === true ||
    studentData?.ready !== true;
  const allowed = authenticated && (admin || open);

  return Object.freeze({
    allowed,
    canResolveAsset: allowed,
    canOpenAsset: allowed,
    canReadAsset: allowed,
    canDownloadAsset: false,
    decision: allowed ? "allow" : "deny",
    reason: !authenticated
      ? "login_required"
      : loading
        ? "access_loading"
        : "access_denied",
    requiresAuthentication: true,
    requiresServerAuthorization: true,
  });
};

export const resolveIntelliTextStudentReaderState = ({
  pathname = "",
  session = null,
  studentData = null,
} = {}) => {
  const textbookId = getIntelliTextStudentReaderId(pathname);

  if (!textbookId) {
    return Object.freeze({ state: "NOT_READER_ROUTE", textbookId: "" });
  }

  if (!session?.ready) {
    return Object.freeze({ state: "AUTH_LOADING", textbookId });
  }

  if (!session?.user) {
    return Object.freeze({ state: "LOGIN_REQUIRED", textbookId });
  }

  if (!studentData?.ready) {
    return Object.freeze({ state: "DATA_LOADING", textbookId });
  }

  const resources = Array.isArray(studentData.resources)
    ? studentData.resources
    : [];
  const resource =
    resources.find((item) =>
      [
        item?.id,
        item?.resourceId,
        item?.textbookId,
        item?.source?.id,
        item?.source?.resourceId,
        item?.source?.textbookId,
      ]
        .map(clean)
        .includes(textbookId)
    ) || null;

  if (!resource) {
    return Object.freeze({ state: "NOT_FOUND", textbookId });
  }

  const type = clean(resource.type || resource.resourceType).toLowerCase();

  if (type && type !== "note" && !type.includes("note")) {
    return Object.freeze({ state: "NOT_FOUND", textbookId });
  }

  const decision = buildV8ReaderAccessDecision({
    session,
    resource,
    studentData,
  });

  if (!decision.allowed) {
    return Object.freeze({
      state: "ACCESS_REQUIRED",
      textbookId,
      resource,
      decision,
    });
  }

  return Object.freeze({
    state: "READY",
    textbookId,
    resource,
    decision,
    canonicalNote: canonicalNote(resource, textbookId),
  });
};
