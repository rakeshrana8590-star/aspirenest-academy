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
