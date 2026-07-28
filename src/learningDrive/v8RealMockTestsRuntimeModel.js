import {
  MOCK_TEST_DISCOVERY_STATES,
  buildMockTestDiscoveryModel,
} from "../access/mockTestDiscoveryModel";

const cleanString = (value = "") => String(value ?? "").trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toComparableTime = (value) => {
  if (!value) return 0;
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const parsed = raw instanceof Date ? raw : new Date(raw);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : 0;
};

const slugKey = (value = "") =>
  cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";

const durationLabel = (minutes = 0) => {
  const value = Math.max(0, toNumber(minutes, 0));
  return value > 0 ? `${value} min` : "Timed test";
};

const buildResultProjection = (result = {}, testsById = new Map(), index = 0) => {
  const testId = cleanString(
    result.testId || result.mockTestId || result.resourceId
  );
  if (!testId) return null;

  const test = testsById.get(testId) || {};
  const id = cleanString(result.id) || `${testId}-result-${index + 1}`;
  const title = cleanString(
    result.testTitle || result.title || test.title || "Mock Test Result"
  );
  const percentage = Math.max(0, Math.min(100, Math.round(toNumber(result.percentage, 0))));
  const createdAtMs = Math.max(
    toComparableTime(result.createdAt),
    toComparableTime(result.submittedAt),
    toComparableTime(result.endedAt),
    toComparableTime(result.attemptSubmittedAt)
  );

  return Object.freeze({
    id,
    testId,
    title,
    percentage,
    score: toNumber(result.score, 0),
    totalMarks: toNumber(result.totalMarks, 0),
    correctCount: Math.max(0, toNumber(result.correctCount, 0)),
    wrongCount: Math.max(0, toNumber(result.wrongCount, 0)),
    skippedCount: Math.max(0, toNumber(result.skippedCount, 0)),
    totalQuestions: Math.max(0, toNumber(result.totalQuestions, 0)),
    attemptNumber: Math.max(1, toNumber(result.attemptNumber, 1)),
    createdAtMs,
    route: `/ctet-tet/mock-tests/result/${encodeURIComponent(testId)}`,
    reviewRoute: `/ctet-tet/mock-tests/review/${encodeURIComponent(testId)}`,
  });
};

const buildLeaderboardProjection = (entry = {}, index = 0) => {
  const testId = cleanString(entry.testId || entry.mockTestId || entry.resourceId);
  const displayName = cleanString(
    entry.displayName || entry.publicDisplayName || entry.studentName || "AspireNest Learner"
  );

  return Object.freeze({
    id: cleanString(entry.id) || `${testId || "leaderboard"}-${index + 1}`,
    testId,
    testTitle: cleanString(entry.testTitle || entry.title || "Mock Test"),
    displayName,
    rank: Math.max(1, toNumber(entry.rank, index + 1)),
    percentage: Math.max(0, Math.min(100, Math.round(toNumber(entry.percentage, 0)))),
    score: toNumber(entry.score, 0),
    totalMarks: toNumber(entry.totalMarks, 0),
  });
};

export const buildV8RealMockTestsRuntime = ({
  universalContent = [],
  user = null,
  isAdminUser = false,
  accessProfile = {},
  mockResults = [],
  mockLeaderboardEntries = [],
  now = Date.now(),
} = {}) => {
  const planCatalog = Array.isArray(accessProfile?.planCatalog)
    ? accessProfile.planCatalog
    : [];
  const tests = (Array.isArray(universalContent) ? universalContent : []).filter(
    (item) => String(item?.section || "").trim().toLowerCase() === "mocktest"
  );
  const testsById = new Map(
    tests
      .filter((test) => cleanString(test?.id))
      .map((test) => [cleanString(test.id), test])
  );

  const discovery = buildMockTestDiscoveryModel({
    universalContent,
    user,
    role: isAdminUser ? "ADMIN" : "STUDENT",
    isAdminUser,
    accessProfile,
    planCatalog,
    now,
  });

  const results = Object.freeze(
    (Array.isArray(mockResults) ? mockResults : [])
      .map((result, index) => buildResultProjection(result, testsById, index))
      .filter(Boolean)
      .sort((first, second) => second.createdAtMs - first.createdAtMs)
  );
  const resultTestIds = new Set(results.map((result) => result.testId));

  const resources = Object.freeze(
    (Array.isArray(discovery.items) ? discovery.items : []).map((item) => {
      const subjectName = cleanString(item.subject) || "General";
      const exactItem = item.isExactItem === true;
      const state = item.isLocked ? "locked" : exactItem ? "partial" : "open";
      const questionCount = Math.max(0, toNumber(item.totalQuestions, 0));
      const duration = durationLabel(item.durationMinutes);

      return Object.freeze({
        id: item.id,
        resourceId: item.id,
        type: "test",
        title: item.title,
        subtitle: [
          questionCount ? `${questionCount} Questions` : "Mock Test",
          duration,
        ].join(" • "),
        subject: slugKey(subjectName),
        subjectName,
        chapter: cleanString(item.chapter) || "Complete Test",
        plan: exactItem
          ? "Special Access"
          : cleanString(item.planTitle || item.planCode) || "Free",
        state,
        progress: resultTestIds.has(item.id) ? 100 : 0,
        duration,
        assigned: false,
        recent: resultTestIds.has(item.id),
        saved: false,
        description:
          cleanString(item.description) ||
          "Open the protected instructions route, then continue into the existing AspireNest Mock Test attempt engine.",
        route: item.action?.route || item.directRoute,
        canonicalRoute: item.directRoute,
        exactItem,
        scheduleStatus: cleanString(item.scheduleStatus),
        totalQuestions: questionCount,
        totalMarks: Math.max(0, toNumber(item.totalMarks, 0)),
        accessReason: cleanString(item.accessReason),
      });
    })
  );

  const leaderboard = Object.freeze(
    (Array.isArray(mockLeaderboardEntries) ? mockLeaderboardEntries : [])
      .map(buildLeaderboardProjection)
      .filter(Boolean)
      .sort((first, second) => first.rank - second.rank)
  );

  return Object.freeze({
    state: discovery.state || MOCK_TEST_DISCOVERY_STATES.EMPTY,
    resources,
    results,
    leaderboard,
    total: resources.length,
    unlocked: resources.filter((resource) => resource.state !== "locked").length,
    locked: resources.filter((resource) => resource.state === "locked").length,
    exactItem: resources.filter((resource) => resource.exactItem).length,
  });
};
