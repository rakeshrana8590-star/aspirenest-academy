export const LEARNING_DRIVE_ROLES = Object.freeze({
  PUBLIC: "public",
  STUDENT: "student",
  MENTOR: "mentor",
  ADMIN: "admin",
});

const clean = (value = "") => String(value ?? "").trim();
const normalize = (value = "") => clean(value).toLowerCase();

const safeRoute = (route = "", fallback = "/") => {
  const value = clean(route);
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
};

export const LEARNING_DRIVE_NAVIGATION = Object.freeze({
  [LEARNING_DRIVE_ROLES.PUBLIC]: Object.freeze([
    { id: "home", label: "Home", icon: "⌂", children: [
      { id: "overview", label: "Overview", route: "/" },
      { id: "learning", label: "Explore Learning", route: "/ctet-tet" },
      { id: "free", label: "Free Learning", route: "/ctet-tet/notes" },
    ]},
    { id: "pricing", label: "Pricing", icon: "₹", children: [
      { id: "plans", label: "Plans", route: "/ctet-tet/pricing" },
      { id: "redeem", label: "Redeem Access", route: "/ctet-tet/redeem" },
    ]},
    { id: "about", label: "About", icon: "◎", children: [
      { id: "academy", label: "Academy Overview", route: "/academy-overview" },
      { id: "contact", label: "Contact", route: "/contact" },
    ]},
    { id: "support", label: "Support", icon: "?", children: [
      { id: "help", label: "Help", route: "/contact" },
      { id: "privacy", label: "Privacy", route: "/privacy-policy" },
      { id: "terms", label: "Terms", route: "/terms" },
    ]},
  ]),
  [LEARNING_DRIVE_ROLES.STUDENT]: Object.freeze([
    { id: "home", label: "Home", icon: "⌂", children: [
      { id: "overview", label: "Overview", route: "/student" },
      { id: "continue-learning", label: "Continue Learning", route: "/ctet-tet" },
      { id: "todays-learning", label: "Today’s Learning", route: "/assignments" },
      { id: "my-access", label: "My Access", route: "/ctet-tet/my-access" },
      { id: "recent", label: "Recent", route: "/student-dashboard" },
      { id: "recommended", label: "Recommended", route: "/search" },
    ]},
    { id: "learning", label: "Learning", icon: "▦", children: [
      { id: "all-learning", label: "All Learning", route: "/ctet-tet" },
      { id: "my-access", label: "My Access", route: "/ctet-tet/my-access" },
      { id: "subjects", label: "Subjects", route: "/ctet-tet/courses" },
      { id: "notes", label: "Notes", route: "/ctet-tet/notes" },
      { id: "videos", label: "Videos", route: "/ctet-tet/videos" },
      { id: "practice", label: "Practice", route: "/ctet-tet/mock-tests" },
      { id: "current-affairs", label: "Current Affairs", route: "/ctet-tet/current-affairs" },
      { id: "roadmaps", label: "Roadmaps", route: "/ctet-tet/roadmaps" },
      { id: "assigned", label: "Assigned", route: "/assignments" },
      { id: "recent", label: "Recent", route: "/student-dashboard" },
      { id: "saved", label: "Saved", route: "/ctet-tet/notes/my-study-workspace" },
    ]},
    { id: "mentor", label: "Mentor", icon: "◇", children: [
      { id: "my-mentor", label: "My Mentor", route: "/mentor" },
      { id: "assignments", label: "Assignments", route: "/assignments" },
      { id: "ask-question", label: "Ask a Question", route: "/mentor" },
      { id: "guidance-history", label: "Guidance History", route: "/mentor" },
      { id: "access-discussion", label: "Access Discussion", route: "/mentor" },
    ]},
    { id: "live", label: "Live", icon: "●", children: [
      { id: "upcoming", label: "Upcoming", route: "/ctet-tet/videos" },
      { id: "join-live", label: "Join Live", route: "/ctet-tet/videos" },
      { id: "calendar", label: "Calendar", route: "/ctet-tet" },
      { id: "replays", label: "Replays", route: "/ctet-tet/videos" },
      { id: "attendance", label: "Attendance", route: "/student-dashboard" },
    ]},
    { id: "success", label: "Success", icon: "↗", children: [
      { id: "progress", label: "Progress", route: "/student-dashboard" },
      { id: "results", label: "Results", route: "/ctet-tet/mock-tests/history" },
      { id: "history", label: "History", route: "/ctet-tet/mock-tests/history" },
      { id: "leaderboard", label: "Leaderboard", route: "/leaderboard" },
      { id: "achievements", label: "Achievements", route: "/student-dashboard" },
      { id: "success-wall", label: "Success Wall", route: "/ctet-tet" },
    ]},
    { id: "help", label: "Help", icon: "?", children: [
      { id: "support", label: "Support", route: "/contact" },
      { id: "faqs", label: "FAQs", route: "/contact" },
      { id: "access-plan-help", label: "Access & Plan Help", route: "/ctet-tet/my-access" },
      { id: "contact", label: "Contact", route: "/contact" },
      { id: "privacy", label: "Privacy", route: "/privacy-policy" },
      { id: "account-help", label: "Account Help", route: "/my-profile" },
    ]},
  ]),
  [LEARNING_DRIVE_ROLES.MENTOR]: Object.freeze([
    { id: "home", label: "Home", icon: "⌂", children: [
      { id: "overview", label: "Mentor Home", route: "/admin/preview/mentor" },
      { id: "attention", label: "Needs Attention", route: "/mentor" },
      { id: "activity", label: "Recent Activity", route: "/mentor" },
    ]},
    { id: "learners", label: "Learners", icon: "♙", children: [
      { id: "assigned", label: "Assigned Learners", route: "/mentor" },
      { id: "progress", label: "Learning Status", route: "/mentor" },
      { id: "access", label: "Access Status", route: "/mentor" },
    ]},
    { id: "assignments", label: "Assignments", icon: "☑", children: [
      { id: "active", label: "Active", route: "/mentor" },
      { id: "review", label: "Review Queue", route: "/mentor" },
      { id: "create", label: "Create Assignment", route: "/mentor" },
    ]},
    { id: "questions", label: "Questions", icon: "?", children: [
      { id: "pending", label: "Pending Questions", route: "/mentor" },
      { id: "history", label: "Guidance History", route: "/mentor" },
    ]},
    { id: "live", label: "Live", icon: "●", children: [
      { id: "sessions", label: "Sessions", route: "/mentor" },
      { id: "calendar", label: "Calendar", route: "/mentor" },
    ]},
    { id: "access", label: "Access", icon: "◇", children: [
      { id: "requests", label: "Access Requests", route: "/mentor" },
      { id: "preview", label: "Student Workspace", route: "/student" },
    ]},
  ]),
  [LEARNING_DRIVE_ROLES.ADMIN]: Object.freeze([
    { id: "home", label: "Home", icon: "⌂", children: [
      { id: "overview", label: "Overview", route: "/admin" },
      { id: "needs-attention", label: "Needs Attention", route: "/admin" },
      { id: "recent-activity", label: "Recent Activity", route: "/admin" },
    ]},
    { id: "content", label: "Content", icon: "▦", children: [
      { id: "all-content", label: "All Content", route: "/admin/content" },
      { id: "notes-intellitext", label: "Notes / IntelliText", route: "/admin/content/notes" },
      { id: "videos", label: "Videos", route: "/admin/content/videos" },
      { id: "mock-tests", label: "Mock Tests", route: "/admin/content/mock-tests" },
      { id: "current-affairs", label: "Current Affairs", route: "/admin/content/current-affairs" },
      { id: "roadmaps", label: "Roadmaps", route: "/admin/content/roadmaps" },
      { id: "live-replays", label: "Live & Replays", route: "/admin/content/videos" },
      { id: "drafts-staged", label: "Drafts & Staged", route: "/admin/content/notes/manage" },
    ]},
    { id: "access", label: "Access", icon: "◇", children: [
      { id: "access-manager", label: "Access Manager", route: "/admin/content/access/manage" },
      { id: "active-grants", label: "Active Grants", route: "/admin/content/access/manage" },
      { id: "expiring-soon", label: "Expiring Soon", route: "/admin/content/access/manage" },
      { id: "bulk-access", label: "Bulk Access", route: "/admin/content/access/bulk" },
      { id: "pending-claims", label: "Pending Claims", route: "/admin/content/access/invites" },
    ]},
    { id: "people", label: "People", icon: "♙", children: [
      { id: "learners", label: "Learners", route: "/admin/students" },
      { id: "mentors", label: "Mentors", route: "/admin/content/mentor" },
      { id: "accounts-migration", label: "Accounts & Migration", route: "/admin/content/access/keys" },
    ]},
    { id: "commerce", label: "Commerce", icon: "₹", children: [
      { id: "payments", label: "Payments", route: "/admin/content/payments" },
      { id: "plans-products", label: "Plans & Products", route: "/admin/content/access/products" },
    ]},
    { id: "system", label: "System", icon: "⚙", children: [
      { id: "audit-safety", label: "Audit & Safety", route: "/admin/content/access/audit" },
      { id: "settings", label: "Settings", route: "/admin" },
    ]},
  ]),
});

const findChild = (role, parentId, childId) => {
  const parents = LEARNING_DRIVE_NAVIGATION[role] || [];
  const parent = parents.find((item) => item.id === parentId) || parents[0] || null;
  const child = parent?.children?.find((item) => item.id === childId) || parent?.children?.[0] || null;
  return { parents, parent, child };
};

export const getLearningDriveDestination = ({
  role = LEARNING_DRIVE_ROLES.STUDENT,
  parentId = "",
  childId = "",
  resumeRoute = "/ctet-tet",
} = {}) => {
  if (role === LEARNING_DRIVE_ROLES.STUDENT && childId === "continue-learning") {
    return safeRoute(resumeRoute, "/ctet-tet");
  }
  const { child } = findChild(role, parentId, childId);
  return safeRoute(child?.route || "/", "/");
};

const matches = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const resolveLearningDrivePresentation = ({
  pathname = "/",
  search = "",
  isAuthenticated = false,
  isAdminUser = false,
  isMentorUser = false,
  isExamAttemptPage = false,
} = {}) => {
  const path = safeRoute(pathname, "/");
  const params = new URLSearchParams(search || "");
  const requestedPreview = normalize(params.get("adminPreview"));

  if (!isAuthenticated || isExamAttemptPage || path === "/" || path === "/login" || matches(path, "/access/invite")) {
    return Object.freeze({ enabled: false, role: "", previewMode: false, activeParentId: "", activeChildId: "" });
  }

  let role = isAdminUser
    ? LEARNING_DRIVE_ROLES.ADMIN
    : isMentorUser
      ? LEARNING_DRIVE_ROLES.MENTOR
      : LEARNING_DRIVE_ROLES.STUDENT;
  let previewMode = false;

  if (isAdminUser && path.startsWith("/admin/preview/public")) {
    role = LEARNING_DRIVE_ROLES.PUBLIC;
    previewMode = true;
  } else if (isAdminUser && path.startsWith("/admin/preview/student")) {
    role = LEARNING_DRIVE_ROLES.STUDENT;
    previewMode = true;
  } else if (isAdminUser && path.startsWith("/admin/preview/mentor")) {
    role = LEARNING_DRIVE_ROLES.MENTOR;
    previewMode = true;
  } else if (isAdminUser && ["public", "student", "mentor"].includes(requestedPreview)) {
    role = requestedPreview;
    previewMode = true;
  } else if (isAdminUser && matches(path, "/admin")) {
    role = LEARNING_DRIVE_ROLES.ADMIN;
  } else if (matches(path, "/mentor")) {
    role = isAdminUser || isMentorUser
      ? LEARNING_DRIVE_ROLES.MENTOR
      : LEARNING_DRIVE_ROLES.STUDENT;
    previewMode = isAdminUser;
  } else {
    role = LEARNING_DRIVE_ROLES.STUDENT;
    previewMode = isAdminUser;
  }

  let activeParentId = "home";
  let activeChildId = "overview";

  if (role === LEARNING_DRIVE_ROLES.ADMIN) {
    if (matches(path, "/admin/content/access")) {
      activeParentId = "access";
      activeChildId = path.includes("/bulk") ? "bulk-access" : path.includes("/invites") ? "pending-claims" : path.includes("/audit") ? "access-manager" : "access-manager";
    } else if (matches(path, "/admin/students") || matches(path, "/admin/content/mentor")) {
      activeParentId = "people";
      activeChildId = matches(path, "/admin/students") ? "learners" : "mentors";
    } else if (matches(path, "/admin/content/payments") || matches(path, "/admin/content/pricing")) {
      activeParentId = "commerce";
      activeChildId = "payments";
    } else if (matches(path, "/admin/content")) {
      activeParentId = "content";
      activeChildId = path.includes("/notes") ? "notes-intellitext" : path.includes("/videos") ? "videos" : path.includes("/mock-tests") ? "mock-tests" : path.includes("/current-affairs") ? "current-affairs" : path.includes("/roadmaps") ? "roadmaps" : "all-content";
    } else if (path.includes("/audit")) {
      activeParentId = "system";
      activeChildId = "audit-safety";
    }
  } else if (role === LEARNING_DRIVE_ROLES.MENTOR) {
    activeParentId = "home";
    activeChildId = "overview";
  } else if (role === LEARNING_DRIVE_ROLES.PUBLIC) {
    activeParentId = "home";
    activeChildId = "overview";
  } else if (matches(path, "/ctet-tet/notes")) {
    activeParentId = "learning"; activeChildId = path.includes("my-study-workspace") ? "saved" : "notes";
  } else if (matches(path, "/ctet-tet/videos")) {
    activeParentId = "learning"; activeChildId = "videos";
  } else if (matches(path, "/ctet-tet/mock-tests")) {
    activeParentId = path.includes("history") ? "success" : "learning";
    activeChildId = path.includes("history") ? "history" : "practice";
  } else if (matches(path, "/ctet-tet/current-affairs")) {
    activeParentId = "learning"; activeChildId = "current-affairs";
  } else if (matches(path, "/ctet-tet/roadmaps") || path === "/my-aspirepath") {
    activeParentId = "learning"; activeChildId = "roadmaps";
  } else if (path === "/ctet-tet/my-access" || path === "/my-access") {
    activeParentId = "learning"; activeChildId = "my-access";
  } else if (path === "/search") {
    activeParentId = "learning"; activeChildId = "all-learning";
  } else if (path === "/assignments") {
    activeParentId = "mentor"; activeChildId = "assignments";
  } else if (matches(path, "/mentor")) {
    activeParentId = "mentor"; activeChildId = "my-mentor";
  } else if (path === "/student-dashboard" || path === "/leaderboard") {
    activeParentId = "success"; activeChildId = path === "/leaderboard" ? "leaderboard" : "progress";
  } else if (["/contact", "/privacy-policy", "/terms"].includes(path)) {
    activeParentId = "help"; activeChildId = path === "/privacy-policy" ? "privacy" : "support";
  } else if (matches(path, "/ctet-tet")) {
    activeParentId = "learning"; activeChildId = "all-learning";
  }

  const resolved = findChild(role, activeParentId, activeChildId);
  return Object.freeze({
    enabled: true,
    role,
    previewMode,
    activeParentId: resolved.parent?.id || "",
    activeChildId: resolved.child?.id || "",
    parents: resolved.parents,
  });
};
