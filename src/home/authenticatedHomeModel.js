import {
  ADAPTIVE_SHELL_MODES,
} from "../access/adaptiveShellModel";
import {
  SEARCH_CATEGORIES,
  buildUnifiedSearchCatalog,
} from "../search/searchCatalogModel";

export const AUTHENTICATED_HOME_MODES =
  Object.freeze({
    GUEST: "guest",
    LOADING: "loading",
    ERROR: "error",
    ADMIN: "admin",
    ACTIVE: "active",
    PARTIAL: "partial",
    FREE: "free",
    EXPIRED: "expired",
    BLOCKED: "blocked",
  });

export const AUTHENTICATED_HOME_DESTINATIONS =
  Object.freeze({
    LOGIN: Object.freeze({
      id: "login",
      label: "Login",
      route: "/login",
    }),
    LEARNING_HUB: Object.freeze({
      id: "learning-hub",
      label: "Learning Hub",
      route: "/ctet-tet",
    }),
    NOTES: Object.freeze({
      id: "notes",
      label: "Notes",
      route: "/ctet-tet/notes",
      category: SEARCH_CATEGORIES.NOTES,
    }),
    VIDEOS: Object.freeze({
      id: "videos",
      label: "Videos",
      route: "/ctet-tet/videos",
      category: SEARCH_CATEGORIES.VIDEOS,
    }),
    MOCK_TESTS: Object.freeze({
      id: "mock-tests",
      label: "Mock Tests",
      route: "/ctet-tet/mock-tests",
      category:
        SEARCH_CATEGORIES.MOCK_TESTS,
    }),
    CURRENT_AFFAIRS: Object.freeze({
      id: "current-affairs",
      label: "Current Affairs",
      route:
        "/ctet-tet/current-affairs",
      category:
        SEARCH_CATEGORIES.CURRENT_AFFAIRS,
    }),
    ROADMAPS: Object.freeze({
      id: "roadmaps",
      label: "Roadmaps",
      route: "/ctet-tet/roadmaps",
      category:
        SEARCH_CATEGORIES.ROADMAPS,
    }),
    COURSES: Object.freeze({
      id: "courses",
      label: "Courses",
      route: "/ctet-tet/courses",
      category: SEARCH_CATEGORIES.COURSES,
    }),
    SEARCH: Object.freeze({
      id: "search",
      label: "Search",
      route: "/search",
    }),
    MY_ACCESS: Object.freeze({
      id: "my-access",
      label: "My Access",
      route: "/my-access",
    }),
    DASHBOARD: Object.freeze({
      id: "dashboard",
      label: "Student Dashboard",
      route: "/student-dashboard",
    }),
    MOCK_HISTORY: Object.freeze({
      id: "mock-history",
      label: "Mock History",
      route:
        "/ctet-tet/mock-tests/history",
    }),
    ADMIN: Object.freeze({
      id: "admin",
      label: "Admin",
      route: "/admin",
    }),
  });

const FAIL_CLOSED_MODES = new Set([
  ADAPTIVE_SHELL_MODES.LOADING,
  ADAPTIVE_SHELL_MODES.ERROR,
]);

const RECOVERY_MODES = new Set([
  ADAPTIVE_SHELL_MODES.BLOCKED,
  ADAPTIVE_SHELL_MODES.EXPIRED,
]);

const VALID_ACTIVITY_STATUSES = new Set([
  "",
  "active",
  "available",
  "completed",
  "in-progress",
  "in_progress",
  "published",
  "started",
]);

const CATEGORY_TO_DESTINATION =
  Object.freeze({
    [SEARCH_CATEGORIES.NOTES]:
      AUTHENTICATED_HOME_DESTINATIONS.NOTES,
    [SEARCH_CATEGORIES.VIDEOS]:
      AUTHENTICATED_HOME_DESTINATIONS.VIDEOS,
    [SEARCH_CATEGORIES.MOCK_TESTS]:
      AUTHENTICATED_HOME_DESTINATIONS.MOCK_TESTS,
    [SEARCH_CATEGORIES.CURRENT_AFFAIRS]:
      AUTHENTICATED_HOME_DESTINATIONS.CURRENT_AFFAIRS,
    [SEARCH_CATEGORIES.ROADMAPS]:
      AUTHENTICATED_HOME_DESTINATIONS.ROADMAPS,
    [SEARCH_CATEGORIES.COURSES]:
      AUTHENTICATED_HOME_DESTINATIONS.COURSES,
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeMode = (
  shellState = {},
  isAuthenticated = false
) => {
  const mode = cleanString(
    shellState.mode
  ).toLowerCase();

  if (
    Object.values(
      AUTHENTICATED_HOME_MODES
    ).includes(mode)
  ) {
    return mode;
  }

  return isAuthenticated
    ? AUTHENTICATED_HOME_MODES.ERROR
    : AUTHENTICATED_HOME_MODES.GUEST;
};

const isSafeInternalRoute = (route = "") => {
  const value = cleanString(route);

  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(value)
  );
};

const toComparableTime = (value) => {
  if (!value) return 0;

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const date =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);
  const time = date.getTime();

  return Number.isFinite(time) ? time : 0;
};

const clampPercent = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(parsed))
  );
};

const freezeDestination = ({
  id = "",
  label = "",
  route = "",
  description = "",
  category = "",
  count = 0,
  tone = "default",
  disabled = false,
  reason = "",
} = {}) =>
  Object.freeze({
    id: cleanString(id),
    label: cleanString(label),
    route:
      disabled || !isSafeInternalRoute(route)
        ? null
        : cleanString(route),
    description: cleanString(description),
    category: cleanString(category),
    count: Math.max(
      0,
      Number(count) || 0
    ),
    tone: cleanString(tone) || "default",
    disabled: Boolean(disabled),
    reason: cleanString(reason),
  });

const getUserLabel = (user = {}) =>
  cleanString(
    user.displayName ||
      user.name ||
      user.studentName
  ) ||
  cleanString(user.email)
    .split("@")[0] ||
  "AspireNest Learner";

const getPublishedCategoryCount = (
  catalog = {},
  category = ""
) =>
  Math.max(
    0,
    Number(
      catalog.categoryCounts?.[category]
    ) || 0
  );

const getMockTimestamp = (result = {}) =>
  Math.max(
    toComparableTime(result.completedAt),
    toComparableTime(result.submittedAt),
    toComparableTime(result.updatedAt),
    toComparableTime(result.createdAt)
  );

const buildMockResumeCandidate = (
  mockResults = []
) => {
  const records = (
    Array.isArray(mockResults)
      ? mockResults
      : []
  ).filter(Boolean);

  if (!records.length) return null;

  const latest = [...records].sort(
    (first, second) =>
      getMockTimestamp(second) -
      getMockTimestamp(first)
  )[0];

  const title =
    cleanString(
      latest.testTitle ||
        latest.title ||
        latest.name
    ) || "Latest mock test";
  const score = clampPercent(
    latest.percentage ??
      latest.accuracy ??
      latest.scorePercent
  );

  return Object.freeze({
    id:
      cleanString(
        latest.id ||
          latest.attemptSaveKey ||
          latest.testId
      ) || "latest-mock",
    source: "mock-result",
    title,
    description:
      `${records.length} mock attempt${
        records.length === 1 ? "" : "s"
      } recorded`,
    route:
      AUTHENTICATED_HOME_DESTINATIONS
        .MOCK_HISTORY.route,
    module: "mock-tests",
    timestamp:
      getMockTimestamp(latest),
    progressPercent: score,
    actionLabel: "Review",
  });
};

const buildActivityCandidate = (
  activity = {},
  index = 0
) => {
  const route = cleanString(activity.route);
  const status = normalizeText(
    activity.status
  ).replace(/\s+/g, "-");

  if (
    !isSafeInternalRoute(route) ||
    !VALID_ACTIVITY_STATUSES.has(status)
  ) {
    return null;
  }

  const title = cleanString(
    activity.title ||
      activity.label ||
      activity.name
  );

  if (!title) return null;

  return Object.freeze({
    id:
      cleanString(activity.id) ||
      `activity-${index}`,
    source:
      cleanString(activity.source) ||
      "learning-activity",
    title,
    description: cleanString(
      activity.description ||
        activity.text ||
        activity.subtitle
    ),
    route,
    module: cleanString(
      activity.module ||
        activity.category
    ),
    timestamp: Math.max(
      toComparableTime(
        activity.updatedAt
      ),
      toComparableTime(
        activity.lastOpenedAt
      ),
      toComparableTime(
        activity.startedAt
      ),
      toComparableTime(
        activity.createdAt
      )
    ),
    progressPercent: clampPercent(
      activity.progressPercent ??
        activity.progress ??
        activity.percentage
    ),
    actionLabel:
      cleanString(activity.actionLabel) ||
      "Continue",
  });
};

const selectLatestResumeCandidate = ({
  mockResults = [],
  recentActivity = [],
} = {}) => {
  const candidates = [
    buildMockResumeCandidate(
      mockResults
    ),
    ...(
      Array.isArray(recentActivity)
        ? recentActivity
        : []
    ).map(buildActivityCandidate),
  ]
    .filter(Boolean)
    .sort(
      (first, second) =>
        second.timestamp -
        first.timestamp
    );

  return candidates[0] || null;
};

const buildContinueCard = ({
  isAuthenticated = false,
  mode =
    AUTHENTICATED_HOME_MODES.GUEST,
  mockResults = [],
  recentActivity = [],
} = {}) => {
  if (!isAuthenticated) {
    return freezeDestination({
      ...AUTHENTICATED_HOME_DESTINATIONS.LOGIN,
      description:
        "Login to open your personalized learning home.",
      tone: "guest",
    });
  }

  if (FAIL_CLOSED_MODES.has(mode)) {
    return freezeDestination({
      id: "continue",
      label:
        mode ===
        AUTHENTICATED_HOME_MODES.LOADING
          ? "Checking access"
          : "Access unavailable",
      description:
        mode ===
        AUTHENTICATED_HOME_MODES.LOADING
          ? "Your access is still being verified."
          : "Protected learning remains locked until access verification is restored.",
      tone: "warning",
      disabled: true,
      reason:
        "Access verification unavailable.",
    });
  }

  if (RECOVERY_MODES.has(mode)) {
    return freezeDestination({
      ...AUTHENTICATED_HOME_DESTINATIONS
        .MY_ACCESS,
      id: "continue",
      label: "Review My Access",
      description:
        "Review expired or blocked access before continuing protected learning.",
      tone: "recovery",
    });
  }

  const candidate =
    selectLatestResumeCandidate({
      mockResults,
      recentActivity,
    });

  if (candidate) {
    return Object.freeze({
      id: candidate.id,
      label: candidate.title,
      route: candidate.route,
      description:
        candidate.description ||
        "Resume your latest learning activity.",
      category: candidate.module,
      count: 0,
      tone: "continue",
      disabled: false,
      reason: "",
      source: candidate.source,
      progressPercent:
        candidate.progressPercent,
      actionLabel:
        candidate.actionLabel,
      timestamp: candidate.timestamp,
    });
  }

  return Object.freeze({
    ...freezeDestination({
      ...AUTHENTICATED_HOME_DESTINATIONS
        .LEARNING_HUB,
      id: "continue",
      label: "Open Learning Hub",
      description:
        "Start learning so AspireNest can build your next resume point.",
      tone: "start",
    }),
    source: "fallback",
    progressPercent: 0,
    actionLabel: "Start",
    timestamp: 0,
  });
};

const buildLearningSections = (
  catalog = {},
  isAdminUser = false
) => {
  const startLearning = [
    {
      ...AUTHENTICATED_HOME_DESTINATIONS.NOTES,
      description:
        "Open concise revision notes and PDFs.",
      tone: "gold",
    },
    {
      ...AUTHENTICATED_HOME_DESTINATIONS.VIDEOS,
      description:
        "Watch live and recorded classes.",
      tone: "violet",
    },
    {
      ...AUTHENTICATED_HOME_DESTINATIONS.COURSES,
      description:
        "Explore structured preparation programs.",
      tone: "amber",
    },
  ].map((item) =>
    freezeDestination({
      ...item,
      count: getPublishedCategoryCount(
        catalog,
        item.category
      ),
    })
  );

  const practiceAndGrowth = [
    {
      ...AUTHENTICATED_HOME_DESTINATIONS.MOCK_TESTS,
      description:
        "Practice tests and review performance.",
      tone: "blue",
    },
    {
      ...AUTHENTICATED_HOME_DESTINATIONS.CURRENT_AFFAIRS,
      description:
        "Read exam-oriented monthly updates.",
      tone: "cyan",
    },
    {
      ...AUTHENTICATED_HOME_DESTINATIONS.ROADMAPS,
      description:
        "Follow guided preparation roadmaps.",
      tone: "purple",
    },
  ].map((item) =>
    freezeDestination({
      ...item,
      count: getPublishedCategoryCount(
        catalog,
        item.category
      ),
    })
  );

  const workspaceItems = [
    freezeDestination({
      ...AUTHENTICATED_HOME_DESTINATIONS.SEARCH,
      description:
        "Search the complete published learning catalog.",
      tone: "search",
    }),
    freezeDestination({
      ...AUTHENTICATED_HOME_DESTINATIONS.MY_ACCESS,
      description:
        "Review plans, modules, bundles, and items.",
      tone: "access",
    }),
    freezeDestination({
      ...AUTHENTICATED_HOME_DESTINATIONS.DASHBOARD,
      description:
        "Review mock performance and personal progress.",
      tone: "progress",
    }),
  ];

  if (isAdminUser) {
    workspaceItems.push(
      freezeDestination({
        ...AUTHENTICATED_HOME_DESTINATIONS.ADMIN,
        description:
          "Open the AspireNest administration workspace.",
        tone: "admin",
      })
    );
  }

  return Object.freeze([
    Object.freeze({
      id: "start-learning",
      title: "Start Learning",
      items: Object.freeze(
        startLearning
      ),
    }),
    Object.freeze({
      id: "practice-growth",
      title: "Practice & Growth",
      items: Object.freeze(
        practiceAndGrowth
      ),
    }),
    Object.freeze({
      id: "workspace",
      title: "Your Workspace",
      items: Object.freeze(
        workspaceItems
      ),
    }),
  ]);
};

const buildHomePlan = ({
  myAccess = {},
  isFailClosed = false,
} = {}) => {
  if (
    isFailClosed ||
    myAccess.canShowAccessDetails !==
      true ||
    !myAccess.primaryPlan
  ) {
    return null;
  }

  const plan = myAccess.primaryPlan;

  return Object.freeze({
    planCode: cleanString(
      plan.planCode
    ),
    label:
      cleanString(plan.label) ||
      cleanString(plan.planCode) ||
      "Learning Access",
    accessRank:
      plan.accessRank ?? null,
    productId:
      cleanString(plan.productId) ||
      null,
    accessUntil:
      plan.accessUntil || null,
    noExpiry:
      plan.noExpiry === true,
    untilManualChange:
      plan.untilManualChange === true,
    isCustomPlan:
      plan.isCustomPlan === true,
  });
};

export const buildAuthenticatedHomeModel = ({
  user = null,
  shellState = {},
  myAccess = {},
  contentItems = [],
  roadmaps = [],
  mockResults = [],
  recentActivity = [],
} = {}) => {
  const isAuthenticated =
    Boolean(
      cleanString(user?.uid) ||
      cleanString(user?.email)
    );
  const mode = normalizeMode(
    shellState,
    isAuthenticated
  );
  const isFailClosed =
    shellState.isFailClosed === true ||
    FAIL_CLOSED_MODES.has(mode);
  const isAdminUser =
    isAuthenticated &&
    shellState.isAdminUser === true;
  const canShowPersonalization =
    isAuthenticated &&
    !isFailClosed;
  const catalog =
    buildUnifiedSearchCatalog({
      contentItems,
      roadmaps,
    });
  const continueCard =
    buildContinueCard({
      isAuthenticated,
      mode,
      mockResults:
        canShowPersonalization
          ? mockResults
          : [],
      recentActivity:
        canShowPersonalization
          ? recentActivity
          : [],
    });
  const plan = buildHomePlan({
    myAccess,
    isFailClosed,
  });
  const accessSummary =
    canShowPersonalization
      ? myAccess.summary || {}
      : {};
  const mockAttempts =
    canShowPersonalization &&
    Array.isArray(mockResults)
      ? mockResults.length
      : 0;

  return Object.freeze({
    mode,
    isAuthenticated,
    isAdminUser,
    isFailClosed,
    canShowPersonalization,
    userLabel:
      isAuthenticated
        ? getUserLabel(user)
        : "Guest",
    roleLabel:
      cleanString(
        shellState.accountRoleLabel
      ) ||
      (isAuthenticated
        ? "Student"
        : "Login"),
    accessLabel:
      cleanString(
        shellState.accessLabel
      ) ||
      (isAuthenticated
        ? "Free Access"
        : "Start Learning"),
    primaryPlan: plan,
    continueCard,
    summary: Object.freeze({
      publishedLearningItems:
        Math.max(
          0,
          catalog.total - 8
        ),
      searchableDestinations:
        catalog.total,
      activeAccessRecords:
        Math.max(
          0,
          Number(
            accessSummary.active
          ) || 0
        ),
      activeModules:
        Math.max(
          0,
          Number(
            accessSummary.module
          ) || 0
        ),
      mockAttempts,
    }),
    categoryCounts:
      catalog.categoryCounts,
    sections:
      buildLearningSections(
        catalog,
        isAdminUser
      ),
    recoveryAction:
      RECOVERY_MODES.has(mode)
        ? freezeDestination({
            ...AUTHENTICATED_HOME_DESTINATIONS
              .MY_ACCESS,
            description:
              "Review access status and available recovery actions.",
            tone: "recovery",
          })
        : null,
    emptyState:
      !isAuthenticated
        ? "Login to open your authenticated learning home."
        : isFailClosed
          ? "Personalized learning details are hidden until access verification is available."
          : "",
  });
};
