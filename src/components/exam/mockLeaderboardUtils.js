/* === Phase 24 shared test-wise mock leaderboard engine v2 === */

const normalizeValue = (value = "") =>
  String(value ?? "").trim().toLowerCase();

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getTimestamp = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date?.getTime?.()) ? Number.MAX_SAFE_INTEGER : date.getTime();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? Number.MAX_SAFE_INTEGER : value.getTime();
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? Number.MAX_SAFE_INTEGER
    : parsed.getTime();
};

export const getMockLeaderboardScore = (entry = {}) => {
  const candidates = [
    entry.rankScore,
    entry.percentage,
    entry.accuracy,
  ];

  for (const candidate of candidates) {
    const number = Number(candidate);
    if (Number.isFinite(number)) {
      return Math.max(0, Math.min(100, number));
    }
  }

  return 0;
};

export const getMockLeaderboardStudentKey = (entry = {}) =>
  normalizeValue(
    entry.publicEntryId ||
      entry.studentEmail ||
      entry.email ||
      entry.uid ||
      entry.studentId ||
      entry.studentName ||
      entry.displayName ||
      entry.id ||
      entry.leaderboardKey
  );

export const isOwnMockLeaderboardEntry = (entry = {}, user = null) => {
  if (entry?.isOwn === true) {
    return true;
  }

  const userEmail = normalizeValue(user?.email);
  const userUid = normalizeValue(user?.uid);
  const entryEmail = normalizeValue(entry.studentEmail || entry.email);
  const entryUid = normalizeValue(entry.uid || entry.studentId);

  return Boolean(
    (userEmail && entryEmail && userEmail === entryEmail) ||
      (userUid && entryUid && userUid === entryUid)
  );
};

export const maskMockLeaderboardName = (entry = {}, user = null) => {
  const raw = String(
    entry.displayName ||
      entry.studentName ||
      entry.studentEmail ||
      entry.email ||
      "AspireNest Learner"
  ).trim();

  if (isOwnMockLeaderboardEntry(entry, user)) {
    if (raw.includes("@")) {
      return raw.split("@")[0] || "You";
    }
    return raw || "You";
  }

  if (raw.includes("@")) {
    const [name = "student"] = raw.split("@");
    return `${name.slice(0, 2)}***`;
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (!parts.length) return "AspireNest Learner";
  if (parts.length === 1) {
    return parts[0].length > 8
      ? `${parts[0].slice(0, 6)}…`
      : parts[0];
  }

  return `${parts[0]} ${parts[1][0] || ""}.`.trim();
};


export const getPublicMockTestTitle = (
  value = "",
  fallback = "Mock Test"
) => {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  if (!raw) return fallback;

  const cleaned = raw
    .replace(/\s*-\s*imported\s*$/i, "")
    .trim();

  return cleaned || fallback;
};

export const getMockLeaderboardModeLabel = (mode = "") => {
  const normalized = normalizeValue(mode);

  if (normalized === "liveleaderboard") return "LIVE LEADERBOARD";
  if (normalized === "finalleaderboard") return "FINAL LEADERBOARD";
  if (
    [
      "globalleaderboard",
      "courseleaderboard",
      "subjectleaderboard",
      "stateleaderboard",
      "batchleaderboard",
    ].includes(normalized)
  ) {
    return "TEST-WISE LEADERBOARD";
  }

  return "TEST LEADERBOARD";
};

export const extractMockTestIdFromRoute = (route = "") => {
  const text = String(route || "").trim();
  if (!text) return "";

  try {
    const parsed = new URL(text, "https://aspirenest.local");
    const queryTestId = parsed.searchParams.get("testId");
    if (queryTestId) return decodeURIComponent(queryTestId);

    const match = parsed.pathname.match(
      /\/ctet-tet\/mock-tests\/(?:start|attempt|result|review)\/([^/?#]+)/
    );

    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    const queryMatch = text.match(/[?&]testId=([^&#]+)/);
    if (queryMatch?.[1]) return decodeURIComponent(queryMatch[1]);

    const pathMatch = text.match(
      /\/ctet-tet\/mock-tests\/(?:start|attempt|result|review)\/([^/?#]+)/
    );

    return pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : "";
  }
};

const compareLeaderboardEntries = (first = {}, second = {}) => {
  const scoreDifference =
    getMockLeaderboardScore(second) - getMockLeaderboardScore(first);
  if (scoreDifference) return scoreDifference;

  const marksDifference =
    toFiniteNumber(second.score) - toFiniteNumber(first.score);
  if (marksDifference) return marksDifference;

  const correctDifference =
    toFiniteNumber(second.correctCount || second.correct) -
    toFiniteNumber(first.correctCount || first.correct);
  if (correctDifference) return correctDifference;

  const firstDuration =
    toFiniteNumber(first.durationSeconds) > 0
      ? toFiniteNumber(first.durationSeconds)
      : Number.MAX_SAFE_INTEGER;
  const secondDuration =
    toFiniteNumber(second.durationSeconds) > 0
      ? toFiniteNumber(second.durationSeconds)
      : Number.MAX_SAFE_INTEGER;
  const durationDifference = firstDuration - secondDuration;
  if (durationDifference) return durationDifference;

  const firstTime = getTimestamp(
    first.attemptSubmittedAt ||
      first.endedAt ||
      first.updatedAt ||
      first.createdAt
  );
  const secondTime = getTimestamp(
    second.attemptSubmittedAt ||
      second.endedAt ||
      second.updatedAt ||
      second.createdAt
  );

  return firstTime - secondTime;
};

const chooseStudentEntry = (
  currentEntry,
  candidateEntry,
  preferredMode = ""
) => {
  if (!currentEntry) return candidateEntry;

  const normalizedPreferredMode = normalizeValue(preferredMode);
  if (normalizedPreferredMode) {
    const currentMatches =
      normalizeValue(currentEntry.leaderboardMode) ===
      normalizedPreferredMode;
    const candidateMatches =
      normalizeValue(candidateEntry.leaderboardMode) ===
      normalizedPreferredMode;

    if (candidateMatches && !currentMatches) return candidateEntry;
    if (currentMatches && !candidateMatches) return currentEntry;
  }

  return compareLeaderboardEntries(candidateEntry, currentEntry) < 0
    ? candidateEntry
    : currentEntry;
};

export const rankMockLeaderboardEntries = (
  entries = [],
  {
    testId = "",
    preferredMode = "",
    user = null,
  } = {}
) => {
  const normalizedTestId = normalizeValue(testId);

  if (!normalizedTestId) {
    return {
      ranked: [],
      top: [],
      own: null,
      total: 0,
    };
  }

  const byStudent = new Map();

  (Array.isArray(entries) ? entries : [])
    .filter(
      (entry) =>
        normalizeValue(entry.testId || entry.mockTestId || entry.contentId) ===
        normalizedTestId
    )
    .forEach((entry, index) => {
      const studentKey =
        getMockLeaderboardStudentKey(entry) ||
        `unknown-${entry.id || entry.leaderboardKey || index}`;

      byStudent.set(
        studentKey,
        chooseStudentEntry(
          byStudent.get(studentKey),
          entry,
          preferredMode
        )
      );
    });

  const ranked = [...byStudent.values()]
    .sort(compareLeaderboardEntries)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankScore: getMockLeaderboardScore(entry),
      isOwn: isOwnMockLeaderboardEntry(entry, user),
    }));

  return {
    ranked,
    top: ranked.slice(0, 3),
    own: ranked.find((entry) => entry.isOwn) || null,
    total: ranked.length,
  };
};
