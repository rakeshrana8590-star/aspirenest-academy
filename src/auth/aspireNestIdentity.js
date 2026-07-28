export const ASPIRENEST_ADMIN_EMAIL = "aspirenestplatform@gmail.com";
export const ASPIRENEST_MENTOR_EMAIL = "dr.varshamaru@gmail.com";

export const ASPIRENEST_ROLES = Object.freeze({
  ADMIN: "admin",
  MENTOR: "mentor",
  STUDENT: "student",
});

export const ASPIRENEST_EXPERIENCES = Object.freeze({
  PUBLIC: "public",
  STUDENT: "student",
  MENTOR: "mentor",
  ADMIN: "admin",
});

export const normalizeAspireNestEmail = (value = "") =>
  String(value || "").trim().toLowerCase();

const resolveEmail = (identity = null) =>
  normalizeAspireNestEmail(
    typeof identity === "string" ? identity : identity?.email
  );

export const resolveAspireNestRole = (identity = null) => {
  const email = resolveEmail(identity);

  if (email === ASPIRENEST_ADMIN_EMAIL) return ASPIRENEST_ROLES.ADMIN;
  if (email === ASPIRENEST_MENTOR_EMAIL) return ASPIRENEST_ROLES.MENTOR;
  return ASPIRENEST_ROLES.STUDENT;
};

export const isAspireNestAdmin = (identity = null) =>
  resolveAspireNestRole(identity) === ASPIRENEST_ROLES.ADMIN;

export const isAspireNestMentor = (identity = null) =>
  resolveAspireNestRole(identity) === ASPIRENEST_ROLES.MENTOR;

export const isAspireNestStudent = (identity = null) =>
  resolveAspireNestRole(identity) === ASPIRENEST_ROLES.STUDENT;

export const isAspireNestStaffEmail = (email = "") => {
  const normalizedEmail = normalizeAspireNestEmail(email);
  return (
    normalizedEmail === ASPIRENEST_ADMIN_EMAIL ||
    normalizedEmail === ASPIRENEST_MENTOR_EMAIL
  );
};

export const getAspireNestDisplayName = (identity = null) => {
  const role = resolveAspireNestRole(identity);

  if (role === ASPIRENEST_ROLES.ADMIN) return "Dr. Rakesh P. Rana";
  if (role === ASPIRENEST_ROLES.MENTOR) return "Dr. Varsha Maru";

  return (
    String(identity?.displayName || identity?.fullName || identity?.name || "").trim() ||
    resolveEmail(identity).split("@")[0] ||
    "AspireNest Learner"
  );
};

export const getAspireNestLandingRoute = (identity = null) => {
  const role = resolveAspireNestRole(identity);

  if (role === ASPIRENEST_ROLES.ADMIN) return "/admin";
  if (role === ASPIRENEST_ROLES.MENTOR) return "/mentor";
  return "/student";
};

export const getAspireNestAllowedExperiences = (identity = null) => {
  const role = resolveAspireNestRole(identity);

  if (role === ASPIRENEST_ROLES.ADMIN) {
    return Object.freeze([
      ASPIRENEST_EXPERIENCES.PUBLIC,
      ASPIRENEST_EXPERIENCES.STUDENT,
      ASPIRENEST_EXPERIENCES.MENTOR,
      ASPIRENEST_EXPERIENCES.ADMIN,
    ]);
  }

  if (role === ASPIRENEST_ROLES.MENTOR) {
    return Object.freeze([
      ASPIRENEST_EXPERIENCES.PUBLIC,
      ASPIRENEST_EXPERIENCES.STUDENT,
      ASPIRENEST_EXPERIENCES.MENTOR,
    ]);
  }

  return Object.freeze([
    ASPIRENEST_EXPERIENCES.PUBLIC,
    ASPIRENEST_EXPERIENCES.STUDENT,
  ]);
};

export const canUseAspireNestExperience = (identity = null, experience = "") =>
  getAspireNestAllowedExperiences(identity).includes(
    String(experience || "").trim().toLowerCase()
  );

export const resolveAspireNestPostLoginRoute = (
  identity = null,
  requestedRoute = ""
) => {
  const fallback = getAspireNestLandingRoute(identity);
  const route = String(requestedRoute || "").trim();

  if (!route.startsWith("/") || route.startsWith("//")) return fallback;
  if (route.startsWith("/admin")) {
    return canUseAspireNestExperience(identity, ASPIRENEST_EXPERIENCES.ADMIN)
      ? route
      : fallback;
  }
  if (route.startsWith("/mentor")) {
    return canUseAspireNestExperience(identity, ASPIRENEST_EXPERIENCES.MENTOR)
      ? route
      : fallback;
  }

  return route;
};

const cleanIdentityKey = (record = {}, fallback = "") => {
  const uid = String(record.uid || record.id || "").trim();
  if (uid) return `uid:${uid}`;

  const email = normalizeAspireNestEmail(
    record.email || record.normalizedEmail
  );
  if (email) return `email:${email}`;

  return fallback;
};

export const mergeAspireNestStudentDirectory = ({
  students = [],
  users = [],
} = {}) => {
  const records = new Map();

  [...users, ...students].forEach((record = {}, index) => {
    const email = normalizeAspireNestEmail(
      record.email || record.normalizedEmail
    );

    if (isAspireNestStaffEmail(email)) return;

    const key = cleanIdentityKey(record, `record:${index}`);
    const previous = records.get(key) || {};
    const merged = {
      ...previous,
      ...record,
      uid: record.uid || previous.uid || record.id || previous.id || "",
      id: record.id || previous.id || record.uid || previous.uid || key,
      email: email || previous.email || "",
      normalizedEmail: email || previous.normalizedEmail || "",
      role: ASPIRENEST_ROLES.STUDENT,
    };

    records.set(key, merged);
  });

  return Array.from(records.values());
};
