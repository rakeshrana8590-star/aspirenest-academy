const AUTHENTICATED_HOME_ITEM =
  Object.freeze({
    id: "home",
    label: "Home",
    route: "/",
  });

const AUTHENTICATED_SEARCH_ITEM =
  Object.freeze({
    id: "search",
    label: "Search",
    route: "/search",
  });

const PRIMARY_HEADER_ITEMS = Object.freeze([
  Object.freeze({
    id: "learning-hub",
    label: "Learning Hub",
    route: "/ctet-tet",
  }),
  Object.freeze({
    id: "mock-tests",
    label: "Mock Tests",
    route: "/ctet-tet/mock-tests",
  }),
  Object.freeze({
    id: "notes",
    label: "Notes",
    route: "/ctet-tet/notes",
  }),
  Object.freeze({
    id: "videos",
    label: "Videos",
    route: "/ctet-tet/videos",
  }),
  Object.freeze({
    id: "current-affairs",
    label: "Current Affairs",
    route: "/ctet-tet/current-affairs",
  }),
  Object.freeze({
    id: "roadmaps",
    label: "Roadmaps",
    route: "/ctet-tet/roadmaps",
  }),
  Object.freeze({
    id: "pricing",
    label: "Pricing",
    route: "/ctet-tet/pricing",
    badge: "Premium",
  }),
]);

const SUPPORTED_ACCOUNT_ITEM_IDS =
  new Set([
    "profile",
    "my-access",
    "dashboard",
    "admin",
    "mentor",
    "assignments",
    "mentor-setup",
  ]);

const ACCOUNT_ITEM_PRESENTATION =
  Object.freeze({
    profile: Object.freeze({
      icon: "👤",
      description:
        "View account details",
    }),
    "my-access": Object.freeze({
      icon: "🔐",
      description:
        "Review learning access",
    }),
    dashboard: Object.freeze({
      icon: "📊",
      description:
        "Track learning",
    }),
    admin: Object.freeze({
      icon: "⚙️",
      description:
        "Manage academy",
    }),
    mentor: Object.freeze({
      icon: "🧭",
      description:
        "Open assigned learner workspace",
    }),
    assignments: Object.freeze({
      icon: "📚",
      description:
        "Open mentor-assigned work",
    }),
    "mentor-setup": Object.freeze({
      icon: "🧑‍🏫",
      description:
        "Manage mentor and learner links",
    }),
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const isSafeInternalRoute = (
  route = ""
) => {
  const value = cleanString(route);

  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(
        value
      )
  );
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

const freezePrimaryItem = (
  item = {},
  currentPath = ""
) =>
  Object.freeze({
    id: cleanString(item.id),
    label: cleanString(item.label),
    route: cleanString(item.route),
    badge: cleanString(item.badge),
    isActive: isRouteActive(
      item.route,
      currentPath
    ),
  });

const freezeAccountItem = (
  item = {},
  currentPath = ""
) => {
  const id = cleanString(
    item.id
  ).toLowerCase();
  const presentation =
    ACCOUNT_ITEM_PRESENTATION[id] ||
    Object.freeze({
      icon: "•",
      description: "",
    });

  return Object.freeze({
    id,
    label: cleanString(item.label),
    route: cleanString(item.route),
    icon: presentation.icon,
    description:
      presentation.description,
    isActive: isRouteActive(
      item.route,
      currentPath
    ),
  });
};

const ROLE_ACCOUNT_ITEM_IDS =
  new Set([
    "dashboard",
    "admin",
    "mentor",
    "assignments",
    "mentor-setup",
  ]);

const PROFILE_ACCOUNT_ITEM =
  Object.freeze({
    id: "profile",
    label: "Profile",
    route: "/my-profile",
  });

const getCanonicalRoleAccountItems = ({
  isAdminUser = false,
  isMentorUser = false,
} = {}) => {
  if (isAdminUser) {
    return [
      {
        id: "admin",
        label: "Admin Dashboard",
        route: "/admin",
      },
      {
        id: "mentor-setup",
        label: "Mentor Setup",
        route: "/admin/content/mentor",
      },
    ];
  }

  if (isMentorUser) {
    return [
      {
        id: "mentor",
        label: "Mentor Workspace",
        route: "/mentor",
      },
    ];
  }

  return [
    {
      id: "dashboard",
      label: "Student Dashboard",
      route: "/student-dashboard",
    },
    {
      id: "assignments",
      label: "My Assignments",
      route: "/assignments",
    },
  ];
};

const buildSafeAccountItems = ({
  shellNavigation = {},
  isAdminUser = false,
  isMentorUser = false,
  currentPath = "",
} = {}) => {
  const requestedItems =
    Array.isArray(
      shellNavigation.accountItems
    )
      ? shellNavigation.accountItems
      : [];
  const supportedItems =
    requestedItems.filter((item) => {
      const id = cleanString(
        item?.id
      ).toLowerCase();

      return (
        SUPPORTED_ACCOUNT_ITEM_IDS.has(
          id
        ) &&
        isSafeInternalRoute(item?.route)
      );
    });
  const nonRoleItems =
    supportedItems.filter((item) => {
      const id = cleanString(
        item?.id
      ).toLowerCase();

      return !ROLE_ACCOUNT_ITEM_IDS.has(id);
    });
  const identityItems =
    nonRoleItems.length > 0
      ? nonRoleItems
      : [PROFILE_ACCOUNT_ITEM];
  const items = [
    ...identityItems,
    ...getCanonicalRoleAccountItems({
      isAdminUser,
      isMentorUser,
    }),
  ];

  return Object.freeze(
    items.map((item) =>
      freezeAccountItem(
        item,
        currentPath
      )
    )
  );
};

export const buildAdaptiveShellHeaderModel = ({
  shellNavigation = {},
  user = null,
  isAdminUser = false,
  isMentorUser = false,
  currentPath = "",
} = {}) => {
  const isAuthenticated =
    Boolean(user?.uid || user?.email);
  const hasMentorRole =
    isAuthenticated &&
    !isAdminUser &&
    isMentorUser === true;
  const mode =
    isAuthenticated && isAdminUser
      ? "admin"
      : hasMentorRole
        ? "mentor"
        : cleanString(
            shellNavigation.mode
          ).toLowerCase() ||
          (isAuthenticated
            ? "free"
            : "guest");
  const roleLabel =
    isAuthenticated && isAdminUser
      ? "Admin"
      : hasMentorRole
        ? "Mentor"
        : cleanString(
            shellNavigation.roleLabel
          ) ||
          (isAuthenticated
            ? "Student"
            : "Login");
  const accessLabel =
    cleanString(
      shellNavigation.accessLabel
    ) ||
    (isAuthenticated
      ? isAdminUser
        ? "Admin Access"
        : "Learning Access"
      : "Start Learning");
  const accountBadge =
    isAuthenticated
      ? isAdminUser
        ? "AN"
        : hasMentorRole
          ? "MN"
          : "ST"
      : "IN";
  const accountItems =
    isAuthenticated
      ? buildSafeAccountItems({
          shellNavigation,
          isAdminUser,
          isMentorUser: hasMentorRole,
          currentPath,
        })
      : Object.freeze([]);

  return Object.freeze({
    mode,
    isAuthenticated,
    isAdminUser:
      isAuthenticated &&
      isAdminUser === true,
    isMentorUser: hasMentorRole,
    isFailClosed:
      shellNavigation.isFailClosed ===
      true,
    roleLabel,
    accessLabel,
    accountBadge,
    brandRoute:
      isAuthenticated
        ? "/"
        : "/ctet-tet",
    primaryItems: Object.freeze(
      (
        isAuthenticated
          ? [
              AUTHENTICATED_HOME_ITEM,
              PRIMARY_HEADER_ITEMS[0],
              AUTHENTICATED_SEARCH_ITEM,
              ...PRIMARY_HEADER_ITEMS.slice(1),
            ]
          : PRIMARY_HEADER_ITEMS
      ).map((item) =>
        freezePrimaryItem(
          item,
          currentPath
        )
      )
    ),
    accountItems,
  });
};
