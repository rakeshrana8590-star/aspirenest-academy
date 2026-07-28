(() => {
  "use strict";
  const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  const authRoute = path === "/login" || path === "/create-account";
  const studentReaderPrefix = "/ctet-tet/notes/read/";
  const studentReaderRoute =
    path.startsWith(studentReaderPrefix) &&
    path.slice(studentReaderPrefix.length).length > 0 &&
    !path.slice(studentReaderPrefix.length).includes("/");
  const studentReaderId = studentReaderRoute
    ? path.slice(studentReaderPrefix.length)
    : "";

  const studentRouteHash = (() => {
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
  })();

  const adminRouteHash = (() => {
    if (!(path === "/admin" || path.startsWith("/admin/"))) return "";
    if (path.startsWith("/admin/content/notes")) return "#admin/content/notes-intellitext";
    if (path.startsWith("/admin/content/videos")) return "#admin/content/videos";
    if (path.startsWith("/admin/content/mock-tests")) return "#admin/content/mock-tests";
    if (path.startsWith("/admin/content/current-affairs")) return "#admin/content/current-affairs";
    if (path.startsWith("/admin/content/roadmaps")) return "#admin/content/roadmaps";
    if (path.startsWith("/admin/content/access/bulk")) return "#admin/access/bulk-access";
    if (path.startsWith("/admin/content/access/invites")) return "#admin/access/pending-claims";
    if (path.startsWith("/admin/content/access")) return "#admin/access/access-manager";
    if (path.startsWith("/admin/content/payments") || path.startsWith("/admin/content/pricing")) return "#admin/commerce/payments";
    if (path.startsWith("/admin/students")) return "#admin/people/learners";
    if (path.startsWith("/admin/content/mentor")) return "#admin/people/mentors";
    if (path.startsWith("/admin/content")) return "#admin/content/all-content";
    return "#admin/home/overview";
  })();

  const publicRouteHash = (() => {
    if (path === "/ctet-tet/pricing") return "#public/pricing/plans";
    if (path === "/academy-overview") return "#public/about/mission";
    if (path === "/contact") return "#public/support/contact";
    if (path === "/privacy-policy" || path === "/terms") return "#public/support/faq";
    return "#public/home/overview";
  })();

  let experience = "public";
  let hash = publicRouteHash;

  if (studentReaderRoute) {
    experience = "student";
    hash = `#learning/reader/${studentReaderId}`;
  } else if (studentRouteHash) {
    experience = "student";
    hash = studentRouteHash;
  } else if (path === "/mentor" || path.startsWith("/mentor/")) {
    experience = "mentor";
    hash = "#mentor/home/overview";
  } else if (adminRouteHash) {
    experience = "admin";
    hash = adminRouteHash;
  }

  if (authRoute) {
    experience = "public";
    hash = "#public/home/overview";
    document.documentElement.classList.add("aspirenest-auth-route");
  } else if (experience !== "public") {
    document.documentElement.classList.add("aspirenest-auth-pending");
  }

  window.__aspirenestRequestedExperience = experience;
  window.__aspirenestActiveExperience = experience;
  window.__aspirenestRequestedPath = path;
  window.__aspirenestLaunchRouteBridge = "P14_G18_M5_A2";
  if (window.location.hash !== hash) history.replaceState(null, "", `${path}${window.location.search}${hash}`);
})();
