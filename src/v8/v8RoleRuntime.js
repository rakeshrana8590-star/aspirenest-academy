export const V8_EXPERIENCE_ROUTES = Object.freeze({
  public: "/",
  student: "/student",
  mentor: "/mentor",
  admin: "/admin",
});

export const V8_STUDENT_READER_PREFIX =
  "/ctet-tet/notes/read/";


export const resolveV8StudentWorkspaceHash = (value = "/") => {
  const path = String(value || "/").replace(/\/+$/, "") || "/";
  if (path === "/student" || path.startsWith("/student/")) return "#home/overview";
  if (path === "/ctet-tet" || path === "/ctet-tet/courses" || path.startsWith("/ctet-tet/courses/")) return "#learning/library";
  if (path === "/ctet-tet/notes" || path.startsWith("/ctet-tet/notes/")) return "#learning/notes";
  if (path === "/ctet-tet/videos" || path.startsWith("/ctet-tet/videos/")) return "#learning/videos";
  if (path === "/ctet-tet/mock-tests/history") return "#success/history";
  if (path === "/ctet-tet/mock-tests" || path.startsWith("/ctet-tet/mock-tests/")) return "#learning/practice";
  if (path === "/ctet-tet/current-affairs" || path.startsWith("/ctet-tet/current-affairs/")) return "#learning/current-affairs";
  if (path === "/ctet-tet/roadmaps" || path.startsWith("/ctet-tet/roadmaps/") || path === "/my-aspirepath") return "#learning/roadmaps";
  if (path === "/ctet-tet/my-access" || path === "/my-access") return "#learning/my-access";
  if (path === "/assignments") return "#mentor/assignments";
  if (path === "/student-dashboard") return "#success/progress";
  if (path === "/leaderboard") return "#success/leaderboard";
  if (path === "/search") return "#learning/library";
  return "";
};

export const isV8StudentWorkspacePath = (value = "/") =>
  Boolean(resolveV8StudentWorkspaceHash(value));

export const isV8StudentReaderPath = (value = "/") => {
  const path = String(value || "/").replace(/\/+$/, "") || "/";

  return (
    path.startsWith(V8_STUDENT_READER_PREFIX) &&
    path.slice(V8_STUDENT_READER_PREFIX.length).length > 0 &&
    !path.slice(V8_STUDENT_READER_PREFIX.length).includes("/")
  );
};

export const resolveV8ExperienceFromPath = (value = "/") => {
  const path = String(value || "/").replace(/\/+$/, "") || "/";
  if (isV8StudentReaderPath(path)) return "student";
  if (isV8StudentWorkspacePath(path)) return "student";
  if (path === "/mentor" || path.startsWith("/mentor/")) return "mentor";
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  return "public";
};

export const getV8StudentReaderIdentity = (value = "/") => {
  const path = String(value || "/").replace(/\/+$/, "") || "/";

  if (!isV8StudentReaderPath(path)) {
    return null;
  }

  const encodedId = path.slice(V8_STUDENT_READER_PREFIX.length);
  let textbookId = "";

  try {
    textbookId = decodeURIComponent(encodedId);
  } catch (_) {
    textbookId = encodedId;
  }

  return textbookId
    ? Object.freeze({
        textbookId,
        encodedId: encodeURIComponent(textbookId),
      })
    : null;
};

export const preserveV8StudentReaderRoute = (runtime = globalThis) => {
  const activePath =
    runtime?.location?.pathname ||
    globalThis?.location?.pathname ||
    "/";
  const requestedPath =
    runtime?.__aspirenestRequestedPath ||
    globalThis?.__aspirenestRequestedPath ||
    "/";
  const identity =
    getV8StudentReaderIdentity(activePath) ||
    getV8StudentReaderIdentity(requestedPath);

  if (!identity) {
    return null;
  }

  const currentParts = String(runtime?.location?.hash || "")
    .replace(/^#/, "")
    .split("/")
    .filter(Boolean);
  const mode =
    currentParts[0] === "learning" &&
    currentParts[1] === "reader" &&
    currentParts[2] === identity.textbookId &&
    currentParts[3] === "full"
      ? "full"
      : "side";
  const hash =
    `#learning/reader/${identity.encodedId}/${mode}`;
  const path =
    isV8StudentReaderPath(activePath)
      ? activePath
      : requestedPath;

  if (runtime?.location?.hash !== hash) {
    runtime?.history?.replaceState?.(
      {
        ...(runtime?.history?.state || {}),
        aspirenestReader: true,
        resourceId: identity.textbookId,
        readerMode: mode,
      },
      "",
      `${path}${runtime?.location?.search || ""}${hash}`
    );
  }

  return Object.freeze({
    ...identity,
    mode,
    hash,
    path,
  });
};

export const getVisibleV8Experiences = (session = {}) => {
  if (!session?.user) return Object.freeze(["public"]);
  const allowed = Array.isArray(session.allowed) ? session.allowed : ["public"];
  return Object.freeze(["public", "student", "mentor", "admin"].filter((item) => allowed.includes(item)));
};

export const hasV8Runtime = (runtime = globalThis) => Boolean(
  runtime?.__aspirenestStudentAPI &&
  runtime?.__aspirenestAdminAPI &&
  runtime?.__aspirenestExperienceAPI
);

export const waitForV8Runtime = async ({
  runtime = globalThis,
  timeoutMs = 5000,
  intervalMs = 20,
} = {}) => {
  const started = Date.now();
  while (!hasV8Runtime(runtime)) {
    if (Date.now() - started >= timeoutMs) {
      const error = new Error("AspireNest Drive runtime did not become ready.");
      error.code = "ASPIRENEST_V8_RUNTIME_TIMEOUT";
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return runtime;
};

export const activateV8Experience = async (experience, runtime = globalThis) => {
  const target = String(experience || "public").toLowerCase();
  await waitForV8Runtime({ runtime });

  const student = runtime.__aspirenestStudentAPI;
  const admin = runtime.__aspirenestAdminAPI;
  const connected = runtime.__aspirenestExperienceAPI;

  runtime.__aspirenestActiveExperience = target;
  runtime.dispatchEvent?.(new CustomEvent("aspirenest:experience-activating", { detail: { experience: target } }));

  if (target === "admin") {
    connected.cleanupExperience();
    admin.enterAdmin();
  } else if (target === "mentor" || target === "public") {
    connected.enterExperience(target);
  } else {
    connected.cleanupExperience();
    admin.exitAdmin();
    const readerRoute = preserveV8StudentReaderRoute(runtime);

    if (readerRoute) {
      student.routeFromHash?.();
    } else {
      student.navigate?.("home", "overview");
    }
  }

  runtime.dispatchEvent?.(new CustomEvent("aspirenest:experience-active", { detail: { experience: target } }));
  return target;
};
