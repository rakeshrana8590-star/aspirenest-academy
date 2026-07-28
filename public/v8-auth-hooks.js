(() => {
  "use strict";
  const ROUTES = Object.freeze({ public: "/", student: "/student", mentor: "/mentor", admin: "/admin" });
  window.__aspirenestAuthSession = window.__aspirenestAuthSession || {
    ready: false,
    user: null,
    role: "public",
    allowed: ["public"],
  };

  const session = () => window.__aspirenestAuthSession || {};
  const navigate = (url) => window.location.assign(url);
  const loginFor = (role) => navigate(`/login?returnTo=${encodeURIComponent(ROUTES[role] || "/student")}`);
  const deny = (role) => {
    window.dispatchEvent(new CustomEvent("aspirenest:access-denied", { detail: { role } }));
  };

  document.addEventListener("click", (event) => {
    const roleTarget = event.target.closest("[data-v8-role]");
    if (roleTarget) {
      const role = String(roleTarget.dataset.v8Role || "").toLowerCase();
      if (!ROUTES[role]) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (role === "public") return navigate("/");
      const current = session();
      if (!current.ready || !current.user) return loginFor(role);
      if (!Array.isArray(current.allowed) || !current.allowed.includes(role)) return deny(role);
      return navigate(ROUTES[role]);
    }

    const currentExperience = window.__aspirenestRequestedExperience || "public";
    const quick = event.target.closest("#quickContinue");
    if (quick && currentExperience === "public") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const current = session();
      return current.user ? navigate("/student") : loginFor("student");
    }

    const button = event.target.closest("button");
    const label = String(button?.textContent || "").trim().toLowerCase();
    if (button && label.includes("sign out")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.dispatchEvent(new CustomEvent("aspirenest:signout"));
    }
  }, true);
})();
