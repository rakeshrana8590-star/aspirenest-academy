const DEFAULT_RESULT_LIMIT = 24;
const MAX_RESULT_LIMIT = 60;

export const SEARCH_CATEGORIES = Object.freeze({
  ALL: "all",
  MODULES: "modules",
  NOTES: "notes",
  VIDEOS: "videos",
  MOCK_TESTS: "mock-tests",
  CURRENT_AFFAIRS: "current-affairs",
  ROADMAPS: "roadmaps",
  COURSES: "courses",
  ACCOUNT: "account",
});

const PUBLISHED_STATUSES = new Set([
  "published",
  "active",
  "available",
  "live",
]);

const STATIC_DESTINATIONS = Object.freeze([
  Object.freeze({
    id: "module-learning-hub",
    kind: "module",
    category: SEARCH_CATEGORIES.MODULES,
    title: "Learning Hub",
    description:
      "Open the complete AspireNest CTET/TET learning ecosystem.",
    route: "/ctet-tet",
    keywords: [
      "home",
      "learning",
      "hub",
      "ctet",
      "tet",
    ],
    module: "learning-hub",
    isFree: true,
  }),
  Object.freeze({
    id: "module-notes",
    kind: "module",
    category: SEARCH_CATEGORIES.NOTES,
    title: "Notes",
    description:
      "Browse plan-wise subjects, chapters, and revision PDFs.",
    route: "/ctet-tet/notes",
    keywords: [
      "pdf",
      "revision",
      "study material",
      "notes",
    ],
    module: "notes",
    isFree: true,
  }),
  Object.freeze({
    id: "module-mock-tests",
    kind: "module",
    category: SEARCH_CATEGORIES.MOCK_TESTS,
    title: "Mock Tests",
    description:
      "Practice plan-wise tests and review your performance.",
    route: "/ctet-tet/mock-tests",
    keywords: [
      "practice",
      "test",
      "quiz",
      "exam",
      "mock",
    ],
    module: "mock-tests",
    isFree: true,
  }),
  Object.freeze({
    id: "module-videos",
    kind: "module",
    category: SEARCH_CATEGORIES.VIDEOS,
    title: "Videos",
    description:
      "Watch live and recorded AspireNest classes.",
    route: "/ctet-tet/videos",
    keywords: [
      "class",
      "lecture",
      "recorded",
      "live",
      "video",
    ],
    module: "videos",
    isFree: true,
  }),
  Object.freeze({
    id: "module-current-affairs",
    kind: "module",
    category: SEARCH_CATEGORIES.CURRENT_AFFAIRS,
    title: "Current Affairs",
    description:
      "Read exam-oriented monthly current affairs updates.",
    route: "/ctet-tet/current-affairs",
    keywords: [
      "news",
      "monthly",
      "updates",
      "current affairs",
    ],
    module: "current-affairs",
    isFree: true,
  }),
  Object.freeze({
    id: "module-roadmaps",
    kind: "module",
    category: SEARCH_CATEGORIES.ROADMAPS,
    title: "Roadmaps",
    description:
      "Follow guided day-wise AspirePath preparation.",
    route: "/ctet-tet/roadmaps",
    keywords: [
      "aspirepath",
      "study plan",
      "daily plan",
      "roadmap",
    ],
    module: "roadmaps",
    isFree: true,
  }),
  Object.freeze({
    id: "module-courses",
    kind: "module",
    category: SEARCH_CATEGORIES.COURSES,
    title: "Courses",
    description:
      "Explore structured CTET and TET preparation programs.",
    route: "/ctet-tet/courses",
    keywords: [
      "program",
      "batch",
      "course",
      "foundation",
    ],
    module: "courses",
    isFree: true,
  }),
  Object.freeze({
    id: "account-my-access",
    kind: "account",
    category: SEARCH_CATEGORIES.ACCOUNT,
    title: "My Access",
    description:
      "Review active plans, modules, bundles, and learning items.",
    route: "/my-access",
    keywords: [
      "plan",
      "subscription",
      "entitlement",
      "membership",
      "access",
    ],
    module: "account",
    isFree: true,
  }),
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeStatus = (value = "") =>
  normalizeText(value).replace(/\s+/g, "-");

const normalizePlanCode = (value = "") =>
  cleanString(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeModule = (value = "") =>
  normalizeText(value).replace(/\s+/g, "-");

const isSafeInternalRoute = (route = "") => {
  const value = cleanString(route);

  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\u0000-\u001F\u007F]/.test(value)
  );
};

const encodeSegment = (value = "") =>
  encodeURIComponent(cleanString(value));

const firstValue = (...values) =>
  values
    .map(cleanString)
    .find(Boolean) || "";

const toKeywordList = (...values) => {
  const keywords = values
    .flatMap((value) =>
      Array.isArray(value)
        ? value
        : cleanString(value)
        ? [value]
        : []
    )
    .map(cleanString)
    .filter(Boolean);

  return [...new Set(keywords)];
};

const classifyContentItem = (item = {}) => {
  const fingerprint = normalizeText(
    [
      item.section,
      item.contentSection,
      item.itemType,
      item.contentType,
      item.type,
      item.category,
    ]
      .map(cleanString)
      .filter(Boolean)
      .join(" ")
  );

  if (fingerprint.includes("note")) {
    return SEARCH_CATEGORIES.NOTES;
  }

  if (
    fingerprint.includes("video") ||
    fingerprint.includes("class") ||
    fingerprint.includes("lecture")
  ) {
    return SEARCH_CATEGORIES.VIDEOS;
  }

  if (
    fingerprint.includes("current affair") ||
    fingerprint.includes("currentaffair")
  ) {
    return SEARCH_CATEGORIES.CURRENT_AFFAIRS;
  }

  if (
    fingerprint.includes("mock") ||
    fingerprint.includes("test")
  ) {
    return SEARCH_CATEGORIES.MOCK_TESTS;
  }

  if (
    fingerprint.includes("roadmap") ||
    fingerprint.includes("aspirepath")
  ) {
    return SEARCH_CATEGORIES.ROADMAPS;
  }

  if (fingerprint.includes("course")) {
    return SEARCH_CATEGORIES.COURSES;
  }

  return "";
};

const getHubRoute = (category = "") => {
  const routes = {
    [SEARCH_CATEGORIES.NOTES]:
      "/ctet-tet/notes",
    [SEARCH_CATEGORIES.VIDEOS]:
      "/ctet-tet/videos",
    [SEARCH_CATEGORIES.MOCK_TESTS]:
      "/ctet-tet/mock-tests",
    [SEARCH_CATEGORIES.CURRENT_AFFAIRS]:
      "/ctet-tet/current-affairs",
    [SEARCH_CATEGORIES.ROADMAPS]:
      "/ctet-tet/roadmaps",
    [SEARCH_CATEGORIES.COURSES]:
      "/ctet-tet/courses",
  };

  return routes[category] || "";
};

const getContentRoute = (
  item = {},
  category = ""
) => {
  const id = firstValue(
    item.id,
    item.contentId,
    item.testId,
    item.roadmapId
  );
  const plan = firstValue(
    item.planCode,
    item.planType,
    item.accessPlan,
    "FREE"
  );
  const subject = firstValue(
    item.subjectId,
    item.subjectSlug,
    item.subject
  );
  const chapter = firstValue(
    item.chapterId,
    item.chapterSlug,
    item.chapter
  );

  if (category === SEARCH_CATEGORIES.NOTES) {
    if (subject && chapter) {
      return (
        `/ctet-tet/notes/plan/${encodeSegment(plan)}` +
        `/${encodeSegment(subject)}` +
        `/${encodeSegment(chapter)}`
      );
    }

    if (subject) {
      return (
        `/ctet-tet/notes/plan/${encodeSegment(plan)}` +
        `/${encodeSegment(subject)}`
      );
    }

    return "/ctet-tet/notes";
  }

  if (category === SEARCH_CATEGORIES.VIDEOS) {
    if (id) {
      return `/ctet-tet/videos/watch/${encodeSegment(id)}`;
    }

    if (subject && chapter) {
      return (
        `/ctet-tet/videos/plan/${encodeSegment(plan)}` +
        `/${encodeSegment(subject)}` +
        `/${encodeSegment(chapter)}`
      );
    }

    if (subject) {
      return (
        `/ctet-tet/videos/plan/${encodeSegment(plan)}` +
        `/${encodeSegment(subject)}`
      );
    }

    return "/ctet-tet/videos";
  }

  if (
    category === SEARCH_CATEGORIES.MOCK_TESTS
  ) {
    return id
      ? `/ctet-tet/mock-tests/start/${encodeSegment(id)}`
      : "/ctet-tet/mock-tests";
  }

  if (
    category === SEARCH_CATEGORIES.CURRENT_AFFAIRS
  ) {
    const month = firstValue(
      item.monthId,
      item.monthSlug,
      item.month
    );

    return month
      ? `/ctet-tet/current-affairs/${encodeSegment(
          normalizeModule(month)
        )}`
      : "/ctet-tet/current-affairs";
  }

  if (category === SEARCH_CATEGORIES.ROADMAPS) {
    return id
      ? `/ctet-tet/roadmaps/${encodeSegment(id)}`
      : "/ctet-tet/roadmaps";
  }

  return getHubRoute(category);
};

const getAccessRequirement = (
  item = {},
  category = ""
) => {
  const rawPlanCode = firstValue(
    item.planCode,
    item.planType,
    item.accessPlan,
    "FREE"
  );
  const planCode =
    normalizePlanCode(rawPlanCode) || "FREE";
  const module =
    normalizeModule(
      firstValue(
        item.module,
        item.section,
        category
      )
    ) || category;
  const itemId = firstValue(
    item.id,
    item.contentId,
    item.testId,
    item.roadmapId
  );

  return Object.freeze({
    planCode,
    rawPlanCode,
    module,
    itemId,
  });
};

const freezeCatalogEntry = (entry = {}) => {
  const keywords = Object.freeze(
    toKeywordList(entry.keywords)
  );
  const accessRequirement =
    entry.accessRequirement ||
    Object.freeze({
      planCode: "FREE",
      rawPlanCode: "FREE",
      module: cleanString(entry.module),
      itemId: "",
    });

  return Object.freeze({
    id: cleanString(entry.id),
    kind: cleanString(entry.kind),
    category: cleanString(entry.category),
    title: cleanString(entry.title),
    description: cleanString(entry.description),
    route: cleanString(entry.route),
    keywords,
    subject: cleanString(entry.subject),
    chapter: cleanString(entry.chapter),
    month: cleanString(entry.month),
    mentorName: cleanString(entry.mentorName),
    planLabel: cleanString(entry.planLabel),
    module: cleanString(entry.module),
    isFree: entry.isFree === true,
    accessRequirement,
    searchText: normalizeText(
      [
        entry.title,
        entry.description,
        entry.subject,
        entry.chapter,
        entry.month,
        entry.mentorName,
        entry.planLabel,
        entry.module,
        ...keywords,
      ].join(" ")
    ),
  });
};

const buildStaticEntries = () =>
  STATIC_DESTINATIONS.map((entry) =>
    freezeCatalogEntry({
      ...entry,
      accessRequirement: Object.freeze({
        planCode: "FREE",
        rawPlanCode: "FREE",
        module: entry.module,
        itemId: "",
      }),
    })
  );

const buildContentEntry = (item = {}) => {
  const status = normalizeStatus(item.status);

  if (!PUBLISHED_STATUSES.has(status)) {
    return null;
  }

  const category = classifyContentItem(item);

  if (!category) return null;

  const route = getContentRoute(item, category);

  if (!isSafeInternalRoute(route)) {
    return null;
  }

  const id = firstValue(
    item.id,
    item.contentId,
    item.testId,
    item.roadmapId
  );
  const title = firstValue(
    item.title,
    item.name,
    item.testTitle,
    item.subject,
    item.chapter
  );

  if (!id || !title) return null;

  const accessRequirement =
    getAccessRequirement(item, category);
  const isFree =
    accessRequirement.planCode === "FREE";

  return freezeCatalogEntry({
    id: `content-${category}-${id}`,
    kind: "content",
    category,
    title,
    description: firstValue(
      item.description,
      item.subtitle,
      item.summary
    ),
    route,
    keywords: toKeywordList(
      item.tags,
      item.keywords,
      item.course,
      item.exam,
      item.sourceType,
      item.contentType,
      item.itemType
    ),
    subject: firstValue(
      item.subjectName,
      item.subject
    ),
    chapter: firstValue(
      item.chapterName,
      item.chapter
    ),
    month: firstValue(
      item.monthLabel,
      item.month
    ),
    mentorName: firstValue(
      item.mentorName,
      item.teacherName
    ),
    planLabel: firstValue(
      item.planLabel,
      item.planName,
      item.planType,
      item.planCode
    ),
    module: accessRequirement.module,
    isFree,
    accessRequirement,
  });
};

const buildRoadmapEntry = (roadmap = {}) => {
  const status = normalizeStatus(roadmap.status);

  if (!PUBLISHED_STATUSES.has(status)) {
    return null;
  }

  const id = firstValue(
    roadmap.id,
    roadmap.roadmapId
  );
  const title = firstValue(
    roadmap.title,
    roadmap.name
  );

  if (!id || !title) return null;

  const route =
    `/ctet-tet/roadmaps/${encodeSegment(id)}`;

  if (!isSafeInternalRoute(route)) {
    return null;
  }

  const accessRequirement =
    getAccessRequirement(
      {
        ...roadmap,
        module:
          roadmap.module || "roadmaps",
      },
      SEARCH_CATEGORIES.ROADMAPS
    );

  return freezeCatalogEntry({
    id: `roadmap-${id}`,
    kind: "roadmap",
    category: SEARCH_CATEGORIES.ROADMAPS,
    title,
    description: firstValue(
      roadmap.description,
      roadmap.subtitle,
      roadmap.summary
    ),
    route,
    keywords: toKeywordList(
      roadmap.tags,
      roadmap.keywords,
      roadmap.exam,
      roadmap.durationLabel
    ),
    subject: firstValue(
      roadmap.subjectName,
      roadmap.subject
    ),
    chapter: "",
    month: "",
    mentorName: firstValue(
      roadmap.mentorName,
      roadmap.teacherName
    ),
    planLabel: firstValue(
      roadmap.planLabel,
      roadmap.planName,
      roadmap.planType,
      roadmap.planCode
    ),
    module: "roadmaps",
    isFree:
      accessRequirement.planCode === "FREE",
    accessRequirement,
  });
};

const dedupeEntries = (entries = []) => {
  const seen = new Map();

  entries.forEach((entry) => {
    if (!entry) return;

    const key = [
      normalizeText(entry.title),
      entry.category,
      entry.route,
    ].join("|");

    const current = seen.get(key);

    if (
      !current ||
      (current.kind === "module" &&
        entry.kind !== "module")
    ) {
      seen.set(key, entry);
    }
  });

  return [...seen.values()];
};

const compareCatalogEntries = (
  first = {},
  second = {}
) => {
  if (first.kind !== second.kind) {
    if (first.kind === "module") return -1;
    if (second.kind === "module") return 1;
  }

  return first.title.localeCompare(
    second.title,
    "en",
    {
      sensitivity: "base",
    }
  );
};

export const buildUnifiedSearchCatalog = ({
  contentItems = [],
  roadmaps = [],
} = {}) => {
  const contentEntries = (
    Array.isArray(contentItems)
      ? contentItems
      : []
  )
    .map(buildContentEntry)
    .filter(Boolean);
  const roadmapEntries = (
    Array.isArray(roadmaps)
      ? roadmaps
      : []
  )
    .map(buildRoadmapEntry)
    .filter(Boolean);
  const entries = dedupeEntries([
    ...buildStaticEntries(),
    ...contentEntries,
    ...roadmapEntries,
  ]).sort(compareCatalogEntries);

  return Object.freeze({
    entries: Object.freeze(entries),
    total: entries.length,
    categoryCounts: Object.freeze(
      entries.reduce(
        (counts, entry) => ({
          ...counts,
          [entry.category]:
            (counts[entry.category] || 0) + 1,
        }),
        {}
      )
    ),
  });
};

const getSearchScore = (
  entry = {},
  normalizedQuery = "",
  tokens = []
) => {
  if (!normalizedQuery) {
    return entry.kind === "module" ? 10 : 1;
  }

  const title = normalizeText(entry.title);
  const description = normalizeText(
    entry.description
  );
  const searchable = entry.searchText || "";
  const phraseMatched =
    title.includes(normalizedQuery) ||
    description.includes(normalizedQuery) ||
    searchable.includes(normalizedQuery);
  const matchedTokens = tokens.filter(
    (token) =>
      title.includes(token) ||
      description.includes(token) ||
      searchable.includes(token)
  );
  const minimumTokenMatches = Math.max(
    1,
    Math.ceil(tokens.length * 0.6)
  );

  if (
    !phraseMatched &&
    matchedTokens.length < minimumTokenMatches
  ) {
    return 0;
  }

  let score = 0;

  if (title === normalizedQuery) {
    score += 140;
  }

  if (title.startsWith(normalizedQuery)) {
    score += 90;
  }

  if (title.includes(normalizedQuery)) {
    score += 65;
  }

  if (searchable.includes(normalizedQuery)) {
    score += 35;
  }

  tokens.forEach((token) => {
    if (title === token) score += 45;
    if (title.startsWith(token)) score += 28;
    if (title.includes(token)) score += 20;
    if (description.includes(token)) score += 8;
    if (searchable.includes(token)) score += 6;
  });

  score += matchedTokens.length * 5;

  if (entry.kind === "module") {
    score += 4;
  }

  return score;
};

const clampLimit = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_RESULT_LIMIT;
  }

  return Math.min(
    MAX_RESULT_LIMIT,
    Math.max(1, Math.trunc(parsed))
  );
};

export const searchUnifiedCatalog = (
  catalog = {},
  query = "",
  {
    category = SEARCH_CATEGORIES.ALL,
    limit = DEFAULT_RESULT_LIMIT,
  } = {}
) => {
  const entries = Array.isArray(catalog?.entries)
    ? catalog.entries
    : [];
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery
    .split(" ")
    .filter(Boolean);
  const requestedCategory =
    cleanString(category).toLowerCase() ||
    SEARCH_CATEGORIES.ALL;
  const maxResults = clampLimit(limit);
  const filtered = entries
    .filter((entry) =>
      requestedCategory === SEARCH_CATEGORIES.ALL
        ? true
        : entry.category === requestedCategory
    )
    .map((entry) => ({
      entry,
      score: getSearchScore(
        entry,
        normalizedQuery,
        tokens
      ),
    }))
    .filter(({ score }) =>
      normalizedQuery ? score > 0 : true
    )
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return compareCatalogEntries(
        first.entry,
        second.entry
      );
    })
    .slice(0, maxResults)
    .map(({ entry, score }) =>
      Object.freeze({
        ...entry,
        score,
      })
    );

  return Object.freeze({
    query: cleanString(query),
    normalizedQuery,
    category: requestedCategory,
    results: Object.freeze(filtered),
    totalMatches: filtered.length,
    hasQuery: Boolean(normalizedQuery),
  });
};
