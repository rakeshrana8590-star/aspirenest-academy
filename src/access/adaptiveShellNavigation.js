import {
  ADAPTIVE_SHELL_MODES,
} from "./adaptiveShellModel";

export const ADAPTIVE_SHELL_DESTINATIONS = Object.freeze({
  HOME: Object.freeze({
    id: "home",
    label: "Home",
    route: "/",
  }),
  CONTINUE: Object.freeze({
    id: "continue",
    label: "Continue",
    route: "/ctet-tet",
  }),
  MY_ACCESS: Object.freeze({
    id: "my-access",
    label: "My Access",
    route: "/my-access",
  }),
  SEARCH: Object.freeze({
    id: "search",
    label: "Search",
    route: "/search",
  }),
  LEARNING_HUB: Object.freeze({
    id: "learning-hub",
    label: "Learning Hub",
    route: "/ctet-tet",
  }),
  PRICING: Object.freeze({
    id: "pricing",
    label: "Pricing",
    route: "/ctet-tet/pricing",
  }),
  PROFILE: Object.freeze({
    id: "profile",
    label: "Profile",
    route: "/my-profile",
  }),
  DASHBOARD: Object.freeze({
    id: "dashboard",
    label: "Student Dashboard",
    route: "/student-dashboard",
  }),
  ADMIN: Object.freeze({
    id: "admin",
    label: "Admin",
    route: "/admin",
  }),
  LOGIN: Object.freeze({
    id: "login",
    label: "Login",
    route: "/login",
  }),
});

const FAIL_CLOSED_MODES = new Set([
  ADAPTIVE_SHELL_MODES.LOADING,
  ADAPTIVE_SHELL_MODES.ERROR,
]);

const ACCESS_RECOVERY_MODES = new Set([
  ADAPTIVE_SHELL_MODES.BLOCKED,
  ADAPTIVE_SHELL_MODES.EXPIRED,
]);

const VALID_SHELL_MODES = new Set(
  Object.values(ADAPTIVE_SHELL_MODES)
);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const isInternalShellRoute = (route = "") => {
  const value = cleanString(route);

  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(value)
  );
};

export const normalizeAdaptiveShellRoute = (
  route = "",
  fallbackRoute =
    ADAPTIVE_SHELL_DESTINATIONS.LEARNING_HUB.route
) => {
  const normalizedFallback = isInternalShellRoute(
    fallbackRoute
  )
    ? cleanString(fallbackRoute)
    : ADAPTIVE_SHELL_DESTINATIONS.LEARNING_HUB.route;

  return isInternalShellRoute(route)
    ? cleanString(route)
    : normalizedFallback;
};

const isRouteActive = (
  itemRoute = "",
  currentPath = ""
) => {
  const route = cleanString(itemRoute);
  const path = cleanString(currentPath);

  if (!route || !path) return false;
  if (route === "/") return path === "/";

  return (
    path === route ||
    path.startsWith(`${route}/`)
  );
};

const freezeNavigationItem = ({
  id,
  label,
  route = null,
  disabled = false,
  reason = "",
  currentPath = "",
  intent = "navigate",
} = {}) => {
  const normalizedRoute =
    route === null
      ? null
      : normalizeAdaptiveShellRoute(route);

  return Object.freeze({
    id: cleanString(id),
    label: cleanString(label),
    route: normalizedRoute,
    disabled: Boolean(disabled),
    reason: cleanString(reason),
    intent: cleanString(intent) || "navigate",
    isActive:
      !disabled &&
      normalizedRoute !== null &&
      isRouteActive(
        normalizedRoute,
        currentPath
      ),
  });
};

const buildGuestNavigation = (
  currentPath = ""
) =>
  Object.freeze([
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.HOME,
      label: "Overview",
      currentPath,
    }),
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.LEARNING_HUB,
      label: "Explore",
      currentPath,
    }),
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.PRICING,
      currentPath,
    }),
  ]);

const getContinueNavigation = ({
  mode,
  resumeRoute,
  currentPath,
} = {}) => {
  if (FAIL_CLOSED_MODES.has(mode)) {
    return freezeNavigationItem({
      id: ADAPTIVE_SHELL_DESTINATIONS.CONTINUE.id,
      label:
        mode === ADAPTIVE_SHELL_MODES.LOADING
          ? "Checking Access"
          : "Access Unavailable",
      route: null,
      disabled: true,
      reason:
        mode === ADAPTIVE_SHELL_MODES.LOADING
          ? "Access is still loading."
          : "Access could not be verified.",
      currentPath,
      intent: "status",
    });
  }

  if (ACCESS_RECOVERY_MODES.has(mode)) {
    return freezeNavigationItem({
      id: ADAPTIVE_SHELL_DESTINATIONS.CONTINUE.id,
      label: "Review Access",
      route:
        ADAPTIVE_SHELL_DESTINATIONS.MY_ACCESS.route,
      currentPath,
      intent: "recovery",
    });
  }

  return freezeNavigationItem({
    ...ADAPTIVE_SHELL_DESTINATIONS.CONTINUE,
    route: normalizeAdaptiveShellRoute(
      resumeRoute,
      ADAPTIVE_SHELL_DESTINATIONS.LEARNING_HUB.route
    ),
    currentPath,
  });
};

const buildAuthenticatedNavigation = ({
  shellState = {},
  resumeRoute = "",
  currentPath = "",
} = {}) => {
  const mode = cleanString(
    shellState.mode
  ).toLowerCase();
  const items = [
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.HOME,
      currentPath,
    }),
    getContinueNavigation({
      mode,
      resumeRoute,
      currentPath,
    }),
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.MY_ACCESS,
      currentPath,
    }),
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.SEARCH,
      currentPath,
    }),
  ];

  if (shellState.isAdminUser === true) {
    items.push(
      freezeNavigationItem({
        ...ADAPTIVE_SHELL_DESTINATIONS.ADMIN,
        currentPath,
      })
    );
  }

  return Object.freeze(items);
};

const buildAccountNavigation = ({
  shellState = {},
  currentPath = "",
} = {}) => {
  if (shellState.isAuthenticated !== true) {
    return Object.freeze([
      freezeNavigationItem({
        ...ADAPTIVE_SHELL_DESTINATIONS.LOGIN,
        currentPath,
      }),
    ]);
  }

  const items = [
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.PROFILE,
      currentPath,
    }),
    freezeNavigationItem({
      ...ADAPTIVE_SHELL_DESTINATIONS.MY_ACCESS,
      currentPath,
    }),
    freezeNavigationItem({
      ...(shellState.isAdminUser === true
        ? ADAPTIVE_SHELL_DESTINATIONS.ADMIN
        : ADAPTIVE_SHELL_DESTINATIONS.DASHBOARD),
      currentPath,
    }),
  ];

  return Object.freeze(items);
};

export const buildAdaptiveShellNavigation = ({
  shellState = {},
  resumeRoute = "",
  currentPath = "",
} = {}) => {
  const isAuthenticated =
    shellState.isAuthenticated === true;
  const requestedMode = cleanString(
    shellState.mode
  ).toLowerCase();
  const mode = VALID_SHELL_MODES.has(
    requestedMode
  )
    ? requestedMode
    : isAuthenticated
      ? ADAPTIVE_SHELL_MODES.ERROR
      : ADAPTIVE_SHELL_MODES.GUEST;
  const isFailClosed =
    shellState.isFailClosed === true ||
    FAIL_CLOSED_MODES.has(mode);
  const primaryItems = isAuthenticated
    ? buildAuthenticatedNavigation({
        shellState: {
          ...shellState,
          mode,
        },
        resumeRoute,
        currentPath,
      })
    : buildGuestNavigation(currentPath);
  const accountItems =
    buildAccountNavigation({
      shellState,
      currentPath,
    });

  return Object.freeze({
    mode,
    isAuthenticated,
    isAdminUser:
      shellState.isAdminUser === true,
    isFailClosed,
    canUseProtectedNavigation:
      shellState.canUseProtectedNavigation === true &&
      !isFailClosed,
    roleLabel:
      cleanString(
        shellState.accountRoleLabel
      ) ||
      (isAuthenticated
        ? "Student"
        : "Login"),
    accessLabel:
      cleanString(shellState.accessLabel) ||
      (isAuthenticated
        ? "Access unavailable"
        : "Start Learning"),
    activePlan:
      shellState.activePlan || null,
    scopeSummary:
      shellState.scopeSummary || null,
    primaryItems,
    accountItems,
  });
};

// LD-R2-G2: LEARNING DRIVE TWO-LEVEL NAVIGATION CONTRACT
// This presentation-only contract owns parent/context navigation structure.
// It does not grant access, change plans, or replace route/service authorization.
const freezeAdaptiveDriveValue = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.keys(value).forEach((key) => {
    freezeAdaptiveDriveValue(value[key]);
  });

  return Object.freeze(value);
};

export const ADAPTIVE_DRIVE_ROLES = freezeAdaptiveDriveValue({
  STUDENT: "student",
  ADMIN: "admin",
});

export const ADAPTIVE_DRIVE_VIEWPORTS = freezeAdaptiveDriveValue({
  DESKTOP: "desktop",
  MOBILE: "mobile",
});

export const ADAPTIVE_DRIVE_PARENT_AREAS = freezeAdaptiveDriveValue({
  [ADAPTIVE_DRIVE_ROLES.STUDENT]: [
    {
      id: "home",
      label: "Home",
      iconKey: "home",
      children: [
        { id: "overview", label: "Overview" },
        { id: "continue-learning", label: "Continue Learning" },
        { id: "todays-learning", label: "Today’s Learning" },
        { id: "my-access", label: "My Access" },
        { id: "recent", label: "Recent" },
        { id: "recommended", label: "Recommended" },
      ],
    },
    {
      id: "learning",
      label: "Learning",
      iconKey: "learning",
      children: [
        { id: "all-learning", label: "All Learning" },
        { id: "my-access", label: "My Access" },
        { id: "subjects", label: "Subjects" },
        { id: "notes", label: "Notes" },
        { id: "videos", label: "Videos" },
        { id: "practice", label: "Practice" },
        { id: "current-affairs", label: "Current Affairs" },
        { id: "roadmaps", label: "Roadmaps" },
        { id: "assigned", label: "Assigned" },
        { id: "recent", label: "Recent" },
        { id: "saved", label: "Saved" },
      ],
    },
    {
      id: "mentor",
      label: "Mentor",
      iconKey: "mentor",
      children: [
        { id: "my-mentor", label: "My Mentor" },
        { id: "assignments", label: "Assignments" },
        { id: "ask-question", label: "Ask a Question" },
        { id: "guidance-history", label: "Guidance History" },
        { id: "access-discussion", label: "Access Discussion" },
      ],
    },
    {
      id: "live",
      label: "Live",
      iconKey: "live",
      children: [
        { id: "upcoming", label: "Upcoming" },
        { id: "join-live", label: "Join Live" },
        { id: "calendar", label: "Calendar" },
        { id: "replays", label: "Replays" },
        { id: "attendance", label: "Attendance" },
      ],
    },
    {
      id: "success",
      label: "Success",
      iconKey: "success",
      children: [
        { id: "progress", label: "Progress" },
        { id: "results", label: "Results" },
        { id: "history", label: "History" },
        { id: "leaderboard", label: "Leaderboard" },
        { id: "achievements", label: "Achievements" },
        { id: "success-wall", label: "Success Wall" },
      ],
    },
    {
      id: "help",
      label: "Help",
      iconKey: "help",
      children: [
        { id: "support", label: "Support" },
        { id: "faqs", label: "FAQs" },
        { id: "access-plan-help", label: "Access & Plan Help" },
        { id: "contact", label: "Contact" },
        { id: "privacy", label: "Privacy" },
        { id: "account-help", label: "Account Help" },
      ],
    },
  ],
  [ADAPTIVE_DRIVE_ROLES.ADMIN]: [
    {
      id: "home",
      label: "Home",
      iconKey: "home",
      children: [
        { id: "overview", label: "Overview" },
        { id: "needs-attention", label: "Needs Attention" },
        { id: "recent-activity", label: "Recent Activity" },
      ],
    },
    {
      id: "content",
      label: "Content",
      iconKey: "content",
      children: [
        { id: "all-content", label: "All Content" },
        { id: "notes-intellitext", label: "Notes / IntelliText" },
        { id: "videos", label: "Videos" },
        { id: "mock-tests", label: "Mock Tests" },
        { id: "current-affairs", label: "Current Affairs" },
        { id: "roadmaps", label: "Roadmaps" },
        { id: "live-replays", label: "Live & Replays" },
        { id: "drafts-staged", label: "Drafts & Staged" },
      ],
    },
    {
      id: "access",
      label: "Access",
      iconKey: "access",
      children: [
        { id: "access-manager", label: "Access Manager" },
        { id: "active-grants", label: "Active Grants" },
        { id: "expiring-soon", label: "Expiring Soon" },
        { id: "bulk-access", label: "Bulk Access" },
        { id: "pending-claims", label: "Pending Claims" },
      ],
    },
    {
      id: "people",
      label: "People",
      iconKey: "people",
      children: [
        { id: "learners", label: "Learners" },
        { id: "mentors", label: "Mentors" },
        { id: "accounts-migration", label: "Accounts & Migration" },
      ],
    },
    {
      id: "commerce",
      label: "Commerce",
      iconKey: "commerce",
      children: [
        { id: "payments", label: "Payments" },
        { id: "plans-products", label: "Plans & Products" },
      ],
    },
    {
      id: "system",
      label: "System",
      iconKey: "system",
      children: [
        { id: "audit-safety", label: "Audit & Safety" },
        { id: "settings", label: "Settings" },
      ],
    },
  ],
});

const normalizeAdaptiveDriveId = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const resolveAdaptiveDriveRole = (role) => {
  const normalizedRole = normalizeAdaptiveDriveId(role);

  return Object.values(ADAPTIVE_DRIVE_ROLES).includes(normalizedRole)
    ? normalizedRole
    : "";
};

const resolveAdaptiveDriveViewport = (viewportMode) =>
  normalizeAdaptiveDriveId(viewportMode) === ADAPTIVE_DRIVE_VIEWPORTS.MOBILE
    ? ADAPTIVE_DRIVE_VIEWPORTS.MOBILE
    : ADAPTIVE_DRIVE_VIEWPORTS.DESKTOP;

export const buildAdaptiveDriveNavigation = ({
  role = "",
  activeParentId = "",
  activeChildId = "",
  viewportMode = ADAPTIVE_DRIVE_VIEWPORTS.DESKTOP,
  contextRailCollapsed = false,
} = {}) => {
  const normalizedRole = resolveAdaptiveDriveRole(role);
  const normalizedViewport = resolveAdaptiveDriveViewport(viewportMode);

  if (!normalizedRole) {
    return freezeAdaptiveDriveValue({
      enabled: false,
      isFailClosed: true,
      role: "",
      viewportMode: normalizedViewport,
      activeParentId: "",
      activeChildId: "",
      parentItems: [],
      contextItems: [],
      contextRail: {
        visible: false,
        collapsed: false,
        presentation: "none",
      },
      authorizationIndependent: true,
    });
  }

  const roleParents = ADAPTIVE_DRIVE_PARENT_AREAS[normalizedRole];
  const requestedParentId = normalizeAdaptiveDriveId(activeParentId);
  const requestedChildId = normalizeAdaptiveDriveId(activeChildId);
  const activeParent =
    roleParents.find((item) => item.id === requestedParentId) || roleParents[0];
  const activeChild =
    activeParent.children.find((item) => item.id === requestedChildId) ||
    activeParent.children[0];
  const isDesktop = normalizedViewport === ADAPTIVE_DRIVE_VIEWPORTS.DESKTOP;

  const parentItems = roleParents.map((item) => ({
    id: item.id,
    label: item.label,
    iconKey: item.iconKey,
    isActive: item.id === activeParent.id,
  }));

  const contextItems = activeParent.children.map((item) => ({
    id: item.id,
    label: item.label,
    parentId: activeParent.id,
    isActive: item.id === activeChild.id,
  }));

  return freezeAdaptiveDriveValue({
    enabled: true,
    isFailClosed: false,
    role: normalizedRole,
    viewportMode: normalizedViewport,
    activeParentId: activeParent.id,
    activeChildId: activeChild.id,
    parentItems,
    contextItems,
    contextRail: {
      visible: isDesktop,
      collapsed: isDesktop && Boolean(contextRailCollapsed),
      presentation: isDesktop ? "rail" : "tabs",
    },
    authorizationIndependent: true,
  });
};
