import {
  MOCK_TEST_DISCOVERY_MODES,
} from "./mockTestActionPolicy";
import {
  buildMockTestCatalogItem,
} from "./mockTestRuntimeAdapter";

export const MOCK_TEST_DISCOVERY_MODES_BY_VIEW =
  Object.freeze({
    CATALOG:
      MOCK_TEST_DISCOVERY_MODES.CATALOG,
    MY_ACCESS:
      MOCK_TEST_DISCOVERY_MODES.MY_ACCESS,
  });

export const MOCK_TEST_DISCOVERY_STATES =
  Object.freeze({
    READY: "ready",
    EMPTY: "empty",
    LOADING: "loading",
    ERROR: "error",
    BLOCKED: "blocked",
  });

export const MOCK_TEST_DISCOVERY_ROUTES =
  Object.freeze({
    ROOT: "/ctet-tet/mock-tests",
    START_PREFIX:
      "/ctet-tet/mock-tests/start",
    PRICING: "/ctet-tet/pricing",
    MY_ACCESS: "/my-access",
  });

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

const normalizePlanCode = (value = "") =>
  cleanString(value).toUpperCase() ||
  "FREE";

const slugKey = (value = "") =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") ||
  "unassigned";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const toComparableTime = (value) => {
  if (!value) return 0;

  const rawValue =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value;
  const parsed =
    rawValue instanceof Date
      ? rawValue
      : new Date(rawValue);
  const time = parsed.getTime();

  return Number.isFinite(time)
    ? time
    : 0;
};

const getPublishedMockTests = (
  universalContent = []
) =>
  (Array.isArray(universalContent)
    ? universalContent
    : []
  ).filter(
    (item) =>
      normalizeText(item?.section) ===
        "mocktest" &&
      normalizeText(item?.status) ===
        "published" &&
      cleanString(item?.id)
  );

const getPlanCode = (test = {}) =>
  normalizePlanCode(
    test.planCode ||
      test.planType ||
      test.requiredPlan ||
      test.plan
  );

const getPlanRank = (
  test = {},
  planCatalog = []
) => {
  const directRank = toNumber(
    test.accessRank ??
      test.planRank ??
      test.requiredAccessRank,
    Number.NaN
  );

  if (Number.isFinite(directRank)) {
    return directRank;
  }

  const planCode = getPlanCode(test);
  const productId = cleanString(
    test.productId ||
      test.accessProductId
  );
  const catalogEntry = (
    Array.isArray(planCatalog)
      ? planCatalog
      : []
  ).find((entry) => {
    const entryCode = normalizePlanCode(
      entry?.planCode ||
        entry?.planType
    );
    const entryProductId = cleanString(
      entry?.productId ||
        entry?.accessProductId
    );

    return (
      entryCode === planCode ||
      (productId &&
        entryProductId === productId)
    );
  });

  return toNumber(
    catalogEntry?.accessRank,
    planCode === "FREE" ? 0 : -1
  );
};

const getPlanTitle = (
  test = {},
  planCatalog = []
) => {
  const planCode = getPlanCode(test);
  const productId = cleanString(
    test.productId ||
      test.accessProductId
  );
  const catalogEntry = (
    Array.isArray(planCatalog)
      ? planCatalog
      : []
  ).find((entry) => {
    const entryCode = normalizePlanCode(
      entry?.planCode ||
        entry?.planType
    );
    const entryProductId = cleanString(
      entry?.productId ||
        entry?.accessProductId
    );

    return (
      entryCode === planCode ||
      (productId &&
        entryProductId === productId)
    );
  });

  return (
    cleanString(
      catalogEntry?.title ||
        catalogEntry?.name ||
        test.planTitle
    ) || planCode
  );
};

const getDiscoveryState = (
  accessProfile = {}
) => {
  const mode = normalizeText(
    accessProfile?.shellState?.mode
  );

  if (
    accessProfile?.loading === true ||
    mode === "loading"
  ) {
    return MOCK_TEST_DISCOVERY_STATES
      .LOADING;
  }

  if (
    accessProfile?.isBlocked === true ||
    mode === "blocked"
  ) {
    return MOCK_TEST_DISCOVERY_STATES
      .BLOCKED;
  }

  if (
    accessProfile?.error ||
    accessProfile
      ?.isAccessCheckUnavailable === true ||
    accessProfile?.shellState
      ?.isFailClosed === true ||
    mode === "error"
  ) {
    return MOCK_TEST_DISCOVERY_STATES
      .ERROR;
  }

  return "";
};

const buildAction = ({
  projection = {},
  discoveryMode =
    MOCK_TEST_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const testId = cleanString(
    projection.id
  );
  const isLocked =
    projection.accessState ===
    "locked_preview";

  return Object.freeze({
    kind: isLocked ? "unlock" : "open",
    label: isLocked
      ? "Unlock Access"
      : "Open Test",
    route: isLocked
      ? MOCK_TEST_DISCOVERY_ROUTES.PRICING
      : `${MOCK_TEST_DISCOVERY_ROUTES.START_PREFIX}/${encodeURIComponent(
          testId
        )}`,
    testId,
    isLocked,
    sourceView: discoveryMode,
  });
};

const buildDiscoveryItem = ({
  test = {},
  projection = {},
  planCatalog = [],
  discoveryMode =
    MOCK_TEST_DISCOVERY_MODES.CATALOG,
} = {}) => {
  const planCode = getPlanCode(test);
  const subject =
    cleanString(projection.subject) ||
    "General";
  const chapter =
    cleanString(projection.chapter) ||
    "Complete Test";
  const title =
    cleanString(projection.title) ||
    "Untitled Mock Test";
  const planRank = getPlanRank(
    test,
    planCatalog
  );

  return Object.freeze({
    ...projection,
    title,
    planCode,
    planTitle: getPlanTitle(
      test,
      planCatalog
    ),
    planRank,
    subject,
    subjectKey: slugKey(subject),
    chapter,
    chapterKey: slugKey(chapter),
    directRoute:
      `${MOCK_TEST_DISCOVERY_ROUTES.START_PREFIX}/${encodeURIComponent(
        projection.id
      )}`,
    action: buildAction({
      projection,
      discoveryMode,
    }),
    isLocked:
      projection.accessState ===
      "locked_preview",
    isExactItem:
      projection.exactItem === true,
    updatedAtMs: Math.max(
      toComparableTime(test.updatedAt),
      toComparableTime(test.createdAt),
      toComparableTime(test.publishedAt)
    ),
  });
};

const compareDiscoveryItems = (
  first,
  second
) => {
  if (
    second.isExactItem !==
    first.isExactItem
  ) {
    return Number(second.isExactItem) -
      Number(first.isExactItem);
  }

  if (
    first.isLocked !==
    second.isLocked
  ) {
    return Number(first.isLocked) -
      Number(second.isLocked);
  }

  if (
    second.planRank !==
    first.planRank
  ) {
    return second.planRank -
      first.planRank;
  }

  if (
    second.updatedAtMs !==
    first.updatedAtMs
  ) {
    return second.updatedAtMs -
      first.updatedAtMs;
  }

  return first.title.localeCompare(
    second.title
  );
};

const buildFacet = ({
  key = "",
  title = "",
  items = [],
} = {}) =>
  Object.freeze({
    key,
    title,
    count: items.length,
    unlockedCount: items.filter(
      (item) => !item.isLocked
    ).length,
    lockedCount: items.filter(
      (item) => item.isLocked
    ).length,
  });

const groupBy = (
  items = [],
  keyGetter
) =>
  items.reduce((map, item) => {
    const key = keyGetter(item);

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(item);
    return map;
  }, new Map());

const buildPlanFacets = (
  items = []
) => {
  const groups = groupBy(
    items,
    (item) => item.planCode
  );

  return Object.freeze(
    [...groups.entries()]
      .map(([planCode, planItems]) =>
        Object.freeze({
          ...buildFacet({
            key: planCode,
            title:
              planItems[0]?.planTitle ||
              planCode,
            items: planItems,
          }),
          planCode,
          planRank: Math.max(
            ...planItems.map(
              (item) => item.planRank
            )
          ),
        })
      )
      .sort((first, second) => {
        if (
          second.planRank !==
          first.planRank
        ) {
          return (
            second.planRank -
            first.planRank
          );
        }

        return first.title.localeCompare(
          second.title
        );
      })
  );
};

const buildSubjectFacets = (
  items = []
) => {
  const groups = groupBy(
    items,
    (item) => item.subjectKey
  );

  return Object.freeze(
    [...groups.entries()]
      .map(([key, subjectItems]) =>
        buildFacet({
          key,
          title:
            subjectItems[0]?.subject ||
            "General",
          items: subjectItems,
        })
      )
      .sort((first, second) =>
        first.title.localeCompare(
          second.title
        )
      )
  );
};

const buildChapterFacets = (
  items = []
) => {
  const groups = groupBy(
    items,
    (item) => item.chapterKey
  );

  return Object.freeze(
    [...groups.entries()]
      .map(([key, chapterItems]) =>
        buildFacet({
          key,
          title:
            chapterItems[0]?.chapter ||
            "Complete Test",
          items: chapterItems,
        })
      )
      .sort((first, second) =>
        first.title.localeCompare(
          second.title
        )
      )
  );
};

const buildEmptyModel = ({
  state,
  discoveryMode,
  message,
} = {}) =>
  Object.freeze({
    state,
    discoveryMode,
    items: Object.freeze([]),
    plans: Object.freeze([]),
    subjects: Object.freeze([]),
    chapters: Object.freeze([]),
    totalCount: 0,
    unlockedCount: 0,
    lockedCount: 0,
    exactItemCount: 0,
    message,
    recoveryRoute:
      state ===
      MOCK_TEST_DISCOVERY_STATES.BLOCKED
        ? MOCK_TEST_DISCOVERY_ROUTES
            .MY_ACCESS
        : "",
  });

export const buildMockTestDiscoveryModel =
  ({
    universalContent = [],
    user = null,
    role = "",
    isAdminUser = false,
    accessProfile = {},
    planCatalog = [],
    discoveryMode =
      MOCK_TEST_DISCOVERY_MODES.CATALOG,
    now = Date.now(),
  } = {}) => {
    const unavailableState =
      getDiscoveryState(accessProfile);

    if (unavailableState) {
      return buildEmptyModel({
        state: unavailableState,
        discoveryMode,
        message:
          unavailableState ===
          MOCK_TEST_DISCOVERY_STATES
            .LOADING
            ? "Mock-test access is loading."
            : unavailableState ===
              MOCK_TEST_DISCOVERY_STATES
                .BLOCKED
              ? "Review My Access before opening mock tests."
              : "Mock-test access could not be verified.",
      });
    }

    const projectedItems =
      getPublishedMockTests(
        universalContent
      )
        .map((test) => {
          const projection =
            buildMockTestCatalogItem({
              test,
              user,
              role,
              isAdminUser,
              accessProfile,
              planCatalog,
              discoveryMode,
              now,
            });

          return projection
            ? buildDiscoveryItem({
                test,
                projection,
                planCatalog,
                discoveryMode,
              })
            : null;
        })
        .filter(Boolean)
        .sort(compareDiscoveryItems);

    if (!projectedItems.length) {
      return buildEmptyModel({
        state:
          MOCK_TEST_DISCOVERY_STATES
            .EMPTY,
        discoveryMode,
        message:
          discoveryMode ===
          MOCK_TEST_DISCOVERY_MODES
            .MY_ACCESS
            ? "No entitled mock tests are available yet."
            : "No published mock tests are available yet.",
      });
    }

    const items = Object.freeze(
      [...projectedItems]
    );

    return Object.freeze({
      state:
        MOCK_TEST_DISCOVERY_STATES
          .READY,
      discoveryMode,
      items,
      plans: buildPlanFacets(items),
      subjects:
        buildSubjectFacets(items),
      chapters:
        buildChapterFacets(items),
      totalCount: items.length,
      unlockedCount: items.filter(
        (item) => !item.isLocked
      ).length,
      lockedCount: items.filter(
        (item) => item.isLocked
      ).length,
      exactItemCount: items.filter(
        (item) => item.isExactItem
      ).length,
      message: "",
      recoveryRoute: "",
    });
  };

export const filterMockTestDiscoveryItems =
  ({
    model = {},
    planCode = "",
    subject = "",
    chapter = "",
    query = "",
  } = {}) => {
    const normalizedPlan =
      normalizePlanCode(planCode);
    const hasPlanFilter =
      Boolean(cleanString(planCode));
    const subjectKey = slugKey(subject);
    const hasSubjectFilter =
      Boolean(cleanString(subject));
    const chapterKey = slugKey(chapter);
    const hasChapterFilter =
      Boolean(cleanString(chapter));
    const queryText =
      normalizeText(query);

    return Object.freeze(
      (Array.isArray(model.items)
        ? model.items
        : []
      ).filter((item) => {
        if (
          hasPlanFilter &&
          item.planCode !== normalizedPlan
        ) {
          return false;
        }

        if (
          hasSubjectFilter &&
          item.subjectKey !== subjectKey
        ) {
          return false;
        }

        if (
          hasChapterFilter &&
          item.chapterKey !== chapterKey
        ) {
          return false;
        }

        if (!queryText) {
          return true;
        }

        return [
          item.title,
          item.description,
          item.planCode,
          item.planTitle,
          item.subject,
          item.chapter,
          item.testType,
          item.examType,
        ]
          .map(normalizeText)
          .some((value) =>
            value.includes(queryText)
          );
      })
    );
  };
