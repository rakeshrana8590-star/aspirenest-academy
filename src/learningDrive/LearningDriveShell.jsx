import React from "react";

import AspireNestLogo from "../components/AspireNestLogo.jsx";
import {
  ASPIRENEST_EXPERIENCES,
  getAspireNestAllowedExperiences,
} from "../auth/aspireNestIdentity";
import {
  LEARNING_DRIVE_NAVIGATION,
  LEARNING_DRIVE_ROLES,
  getLearningDriveDestination,
} from "./learningDriveRouteMap";

import "./learningDriveShell.css";

const ROLE_LABELS = Object.freeze({
  [LEARNING_DRIVE_ROLES.PUBLIC]: "Public Website",
  [LEARNING_DRIVE_ROLES.STUDENT]: "Student Learning Drive",
  [LEARNING_DRIVE_ROLES.MENTOR]: "Mentor Workspace",
  [LEARNING_DRIVE_ROLES.ADMIN]: "Admin Learning Drive",
});

const ROLE_ROUTES = Object.freeze({
  [LEARNING_DRIVE_ROLES.PUBLIC]: "/",
  [LEARNING_DRIVE_ROLES.STUDENT]: "/student",
  [LEARNING_DRIVE_ROLES.MENTOR]: "/mentor",
  [LEARNING_DRIVE_ROLES.ADMIN]: "/admin",
});

const clean = (value = "") => String(value ?? "").trim();

const useMediaMode = () => {
  const [mobile, setMobile] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 840px)").matches : false
  );

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 840px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return mobile;
};

export default function LearningDriveShell({
  presentation = {},
  user = null,
  isAdminUser = false,
  activePlan = "FREE",
  membershipExpiry = null,
  resumeRoute = "/ctet-tet",
  navigate = null,
  locationKey = "",
  onLogout = null,
  notificationCount = 0,
  accessCount = 0,
}) {
  const role = presentation.role || LEARNING_DRIVE_ROLES.STUDENT;
  const allowedRoles = getAspireNestAllowedExperiences(user).filter((itemRole) =>
    Object.values(ASPIRENEST_EXPERIENCES).includes(itemRole)
  );
  const parents = LEARNING_DRIVE_NAVIGATION[role] || [];
  const activeParent = parents.find((item) => item.id === presentation.activeParentId) || parents[0] || null;
  const activeChild = activeParent?.children?.find((item) => item.id === presentation.activeChildId) || activeParent?.children?.[0] || null;
  const isMobile = useMediaMode();
  const [contextCollapsed, setContextCollapsed] = React.useState(() => {
    try { return window.localStorage.getItem("aspirenest_drive_context_collapsed") === "1"; }
    catch { return false; }
  });
  const [openPopover, setOpenPopover] = React.useState("");
  const [query, setQuery] = React.useState("");
  const popoverRef = React.useRef(null);
  const searchRef = React.useRef(null);

  const displayName = clean(user?.displayName) || clean(user?.name) || clean(user?.email).split("@")[0] || "AspireNest User";
  const username = clean(user?.username || user?.profile?.username);
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AN";

  React.useEffect(() => {
    setOpenPopover("");
  }, [locationKey, presentation.activeParentId, presentation.activeChildId, role]);

  React.useEffect(() => {
    if (!openPopover) return undefined;
    const outside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) setOpenPopover("");
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpenPopover("");
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("touchstart", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchstart", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [openPopover]);

  React.useEffect(() => {
    const shortcut = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = String(document.activeElement?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  const go = React.useCallback((route) => {
    setOpenPopover("");
    if (typeof navigate === "function") navigate(route);
  }, [navigate]);

  const navigateTo = (parentId, childId) => {
    const route = getLearningDriveDestination({ role, parentId, childId, resumeRoute });
    go(route);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const value = clean(query);
    go(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const toggleCollapse = () => {
    setContextCollapsed((current) => {
      const next = !current;
      try { window.localStorage.setItem("aspirenest_drive_context_collapsed", next ? "1" : "0"); }
      catch {}
      return next;
    });
  };

  const planLabel = isAdminUser && role === LEARNING_DRIVE_ROLES.ADMIN
    ? "Admin management access"
    : `${clean(activePlan || "FREE").toUpperCase()} access`;
  const expiryDate = membershipExpiry?.toDate
    ? membershipExpiry.toDate()
    : membershipExpiry
      ? new Date(membershipExpiry)
      : null;
  const expiryLabel = expiryDate && Number.isFinite(expiryDate.getTime())
    ? `Valid until ${new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(expiryDate)}`
    : isAdminUser ? "Audited operations" : "Open My Access for details";

  return (
    <>
      <header className="learningDriveTopbar">
        <button type="button" className="learningDriveBrand" onClick={() => go(role === LEARNING_DRIVE_ROLES.ADMIN ? "/admin" : "/")} aria-label="Open AspireNest home">
          <AspireNestLogo />
        </button>

        <form className="learningDriveSearch" role="search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={role === LEARNING_DRIVE_ROLES.ADMIN ? "Search learners, resources, grants or payments" : "Search notes, videos, tests, chapters or topics"}
            aria-label="Search AspireNest"
          />
          <kbd>/</kbd>
          <button type="submit" aria-label="Search">☷</button>
        </form>

        <div className="learningDriveTopActions" ref={popoverRef}>
          <button type="button" className="learningDriveContinue" onClick={() => go(resumeRoute)}>
            <span aria-hidden="true" /> Continue
          </button>

          <button
            type="button"
            className="learningDriveIconButton"
            aria-label="Notifications"
            aria-expanded={openPopover === "notifications"}
            onClick={() => setOpenPopover((current) => current === "notifications" ? "" : "notifications")}
          >
            ♧{Number(notificationCount) > 0 ? <b>{notificationCount}</b> : null}
          </button>

          {allowedRoles.length > 1 ? (
            <button
              type="button"
              className="learningDriveRoleButton"
              aria-expanded={openPopover === "role"}
              onClick={() => setOpenPopover((current) => current === "role" ? "" : "role")}
            >
              <span /> {ROLE_LABELS[role]} <i>⌄</i>
            </button>
          ) : null}

          <button
            type="button"
            className="learningDriveAvatar"
            aria-label="Open account menu"
            aria-expanded={openPopover === "account"}
            onClick={() => setOpenPopover((current) => current === "account" ? "" : "account")}
          >
            {initials}
          </button>

          {openPopover === "notifications" ? (
            <div className="learningDrivePopover learningDriveNotifications" role="dialog" aria-label="Notifications">
              <strong>Notifications</strong>
              <button type="button" onClick={() => go("/assignments")}><span>☑</span><div><b>Assignments</b><small>Review current learning work</small></div></button>
              <button type="button" onClick={() => go("/ctet-tet/my-access")}><span>✓</span><div><b>Access</b><small>{accessCount || 0} resources visible in My Access</small></div></button>
              <button type="button" onClick={() => go("/announcements")}><span>◎</span><div><b>Announcements</b><small>Open academy updates</small></div></button>
            </div>
          ) : null}

          {openPopover === "role" && allowedRoles.length > 1 ? (
            <div className="learningDrivePopover learningDriveRoleMenu" role="menu" aria-label="Preview AspireNest experiences">
              <div className="learningDrivePopoverHeader"><strong>Open AspireNest experience</strong><small>Use every workspace allowed for this account</small></div>
              {allowedRoles.map((itemRole) => (
                <button type="button" role="menuitem" key={itemRole} className={itemRole === role ? "active" : ""} onClick={() => go(ROLE_ROUTES[itemRole])}>
                  <span>{itemRole === LEARNING_DRIVE_ROLES.PUBLIC ? "◎" : itemRole === LEARNING_DRIVE_ROLES.STUDENT ? "▦" : itemRole === LEARNING_DRIVE_ROLES.MENTOR ? "◇" : "⚙"}</span>
                  <div><b>{ROLE_LABELS[itemRole]}</b><small>{itemRole === LEARNING_DRIVE_ROLES.PUBLIC ? "Open public website" : itemRole === LEARNING_DRIVE_ROLES.ADMIN ? "Management workspace" : "Open working workspace"}</small></div>
                  <i>→</i>
                </button>
              ))}
            </div>
          ) : null}

          {openPopover === "account" ? (
            <div className="learningDrivePopover learningDriveAccountMenu" role="menu" aria-label="Account menu">
              <div className="learningDriveAccountIdentity"><span>{initials}</span><div><strong>{displayName}</strong><small>{username ? `@${username}` : clean(user?.email)}</small></div></div>
              <button type="button" onClick={() => go("/my-profile")}>⚙ Account settings</button>
              {!username ? <button type="button" onClick={() => go("/profile/username")}>@ Choose username</button> : null}
              <button type="button" onClick={() => go("/")}>◎ Public Website</button>
              <button type="button" onClick={() => go("/student")}>▦ Student Learning Drive</button>
              {allowedRoles.includes(LEARNING_DRIVE_ROLES.MENTOR) ? <button type="button" onClick={() => go("/mentor")}>◇ Mentor Workspace</button> : null}
              {allowedRoles.includes(LEARNING_DRIVE_ROLES.ADMIN) ? <button type="button" onClick={() => go("/admin")}>⚙ Admin Learning Drive</button> : null}
              <button type="button" onClick={() => go("/ctet-tet/my-access")}>✓ My Access</button>
              <button type="button" onClick={() => { setOpenPopover(""); onLogout?.(); }}>↗ Sign out</button>
            </div>
          ) : null}
        </div>
      </header>

      {presentation.previewMode && isAdminUser ? (
        <div className="learningDrivePreviewBanner" role="status">
          <strong>Admin Preview</strong>
          <span>{ROLE_LABELS[role]} is being previewed. Your Admin role has not changed.</span>
          <button type="button" onClick={() => go("/admin")}>Return to Admin</button>
        </div>
      ) : null}

      <aside className="learningDriveParentRail" aria-label={`${ROLE_LABELS[role]} primary navigation`}>
        <nav>
          {parents.map((parent) => (
            <button type="button" key={parent.id} className={parent.id === activeParent?.id ? "active" : ""} onClick={() => navigateTo(parent.id, parent.children?.[0]?.id)}>
              <span aria-hidden="true">{parent.icon}</span><small>{parent.label}</small>
            </button>
          ))}
        </nav>
        <button type="button" className="learningDriveInstall" onClick={() => window.dispatchEvent(new CustomEvent("aspirenest:install-request"))}>↧<small>Install</small></button>
      </aside>

      {!isMobile ? (
        <aside className={`learningDriveContextRail ${contextCollapsed ? "collapsed" : ""}`} aria-label={`${activeParent?.label || "Context"} navigation`}>
          <div className="learningDriveContextHeader">
            <div><span>{role === LEARNING_DRIVE_ROLES.ADMIN ? "ADMIN DRIVE" : role === LEARNING_DRIVE_ROLES.MENTOR ? "MENTOR DRIVE" : role === LEARNING_DRIVE_ROLES.PUBLIC ? "PUBLIC EXPERIENCE" : "LEARNING OS"}</span><h2>{activeParent?.label || "Home"}</h2></div>
            <button type="button" onClick={toggleCollapse} aria-label={contextCollapsed ? "Expand contextual navigation" : "Collapse contextual navigation"} aria-expanded={!contextCollapsed}>{contextCollapsed ? "›" : "‹"}</button>
          </div>
          {!contextCollapsed ? (
            <nav>
              {(activeParent?.children || []).map((child) => (
                <button type="button" key={child.id} className={child.id === activeChild?.id ? "active" : ""} onClick={() => navigateTo(activeParent.id, child.id)}>
                  <span>{child.label}</span>{child.id === "my-access" && accessCount > 0 ? <b>{accessCount}</b> : null}
                </button>
              ))}
            </nav>
          ) : null}
          {!contextCollapsed ? <div className="learningDrivePlanSummary"><i /><div><strong>{planLabel}</strong><small>{expiryLabel}</small></div></div> : null}
        </aside>
      ) : null}

      {isMobile ? (
        <div className="learningDriveMobileContext" aria-label="Section shortcuts">
          {(activeParent?.children || []).map((child) => (
            <button type="button" key={child.id} className={child.id === activeChild?.id ? "active" : ""} onClick={() => navigateTo(activeParent.id, child.id)}>{child.label}</button>
          ))}
        </div>
      ) : null}

      <nav className="learningDriveMobileDock" aria-label="Mobile primary navigation">
        {parents.map((parent) => (
          <button type="button" key={parent.id} className={parent.id === activeParent?.id ? "active" : ""} onClick={() => navigateTo(parent.id, parent.children?.[0]?.id)}><span>{parent.icon}</span><small>{parent.label}</small></button>
        ))}
      </nav>
    </>
  );
}
