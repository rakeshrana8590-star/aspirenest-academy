import {
  INTELLITEXT_RECALL_RATINGS,
  INTELLITEXT_REVISION_LIMITS,
  INTELLITEXT_REVISION_STATES,
  createIntelliTextRevisionReviewUpdate,
} from "./intelliTextRevisionContract";

export const INTELLITEXT_REVISION_SCHEDULE = Object.freeze({
  AGAIN_DELAY_MINUTES: 10,
  EASY_MINIMUM_INTERVAL_DAYS: 7,
  GOOD_MINIMUM_INTERVAL_DAYS: 3,
  HARD_MINIMUM_INTERVAL_DAYS: 1,
  MAX_INTERVAL_DAYS: INTELLITEXT_REVISION_LIMITS.MAX_INTERVAL_DAYS,
});

export class IntelliTextRevisionSchedulerError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextRevisionSchedulerError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextRevisionSchedulerError(code, message);
};

const asDate = (value, field = "timestamp") => {
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      fail("DATE_INVALID", `${field} must be a valid Date.`);
    }

    return new Date(value.getTime());
  }

  if (typeof value === "number" || typeof value === "string") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  fail("DATE_INVALID", `${field} must be an explicit valid timestamp.`);
};

const normalizeRating = (value) => {
  const rating = String(value ?? "").trim().toUpperCase();

  if (!Object.values(INTELLITEXT_RECALL_RATINGS).includes(rating)) {
    fail(
      "RATING_INVALID",
      `rating must be one of: ${Object.values(INTELLITEXT_RECALL_RATINGS).join(", ")}.`
    );
  }

  return rating;
};

const normalizeCounter = (value) => {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
};

const capInterval = (days) =>
  Math.min(
    INTELLITEXT_REVISION_SCHEDULE.MAX_INTERVAL_DAYS,
    Math.max(0, Math.ceil(days))
  );

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export function normalizeIntelliTextRevisionNow(now) {
  return asDate(now, "now");
}

export function scheduleIntelliTextRevision({
  current = {},
  now,
  rating,
} = {}) {
  const explicitNow = normalizeIntelliTextRevisionNow(now);
  const normalizedRating = normalizeRating(rating);
  const previousInterval = Math.min(
    INTELLITEXT_REVISION_SCHEDULE.MAX_INTERVAL_DAYS,
    normalizeCounter(current.intervalDays)
  );
  const previousReviewCount = normalizeCounter(current.reviewCount);
  const previousStreak = normalizeCounter(current.recallStreak);

  let intervalDays = 0;
  let dueAt;
  let recallStreak;

  if (normalizedRating === INTELLITEXT_RECALL_RATINGS.AGAIN) {
    intervalDays = 0;
    dueAt = addMinutes(
      explicitNow,
      INTELLITEXT_REVISION_SCHEDULE.AGAIN_DELAY_MINUTES
    );
    recallStreak = 0;
  } else if (normalizedRating === INTELLITEXT_RECALL_RATINGS.HARD) {
    intervalDays = capInterval(
      Math.max(
        INTELLITEXT_REVISION_SCHEDULE.HARD_MINIMUM_INTERVAL_DAYS,
        previousInterval * 1.2
      )
    );
    dueAt = addDays(explicitNow, intervalDays);
    recallStreak = previousStreak + 1;
  } else if (normalizedRating === INTELLITEXT_RECALL_RATINGS.GOOD) {
    intervalDays = capInterval(
      Math.max(
        INTELLITEXT_REVISION_SCHEDULE.GOOD_MINIMUM_INTERVAL_DAYS,
        previousInterval * 2
      )
    );
    dueAt = addDays(explicitNow, intervalDays);
    recallStreak = previousStreak + 1;
  } else {
    intervalDays = capInterval(
      Math.max(
        INTELLITEXT_REVISION_SCHEDULE.EASY_MINIMUM_INTERVAL_DAYS,
        previousInterval * 3
      )
    );
    dueAt = addDays(explicitNow, intervalDays);
    recallStreak = previousStreak + 1;
  }

  return createIntelliTextRevisionReviewUpdate({
    dueAt,
    intervalDays,
    lastRating: normalizedRating,
    lastReviewedAt: explicitNow,
    recallStreak,
    reviewCount: previousReviewCount + 1,
    state: INTELLITEXT_REVISION_STATES.ACTIVE,
    updatedAt: explicitNow,
  });
}

export function isIntelliTextRevisionDue(item = {}, now) {
  if (item.state !== INTELLITEXT_REVISION_STATES.ACTIVE) {
    return false;
  }

  const explicitNow = normalizeIntelliTextRevisionNow(now);
  const dueAt = asDate(item.dueAt, "dueAt");
  return dueAt.getTime() <= explicitNow.getTime();
}

export function sortIntelliTextRevisionQueue(items = []) {
  return Object.freeze(
    [...items].sort((left, right) => {
      const leftDue = asDate(left.dueAt, "left.dueAt").getTime();
      const rightDue = asDate(right.dueAt, "right.dueAt").getTime();

      if (leftDue !== rightDue) {
        return leftDue - rightDue;
      }

      return String(left.revisionId || "").localeCompare(
        String(right.revisionId || "")
      );
    })
  );
}

export function partitionIntelliTextRevisionQueue(items = [], now) {
  const explicitNow = normalizeIntelliTextRevisionNow(now);
  const sorted = sortIntelliTextRevisionQueue(items);
  const due = [];
  const upcoming = [];
  const inactive = [];

  sorted.forEach((item) => {
    if (item.state !== INTELLITEXT_REVISION_STATES.ACTIVE) {
      inactive.push(item);
    } else if (isIntelliTextRevisionDue(item, explicitNow)) {
      due.push(item);
    } else {
      upcoming.push(item);
    }
  });

  return Object.freeze({
    due: Object.freeze(due),
    inactive: Object.freeze(inactive),
    upcoming: Object.freeze(upcoming),
  });
}

export function formatIntelliTextRevisionDueLabel(value, now) {
  const dueAt = asDate(value, "dueAt");
  const explicitNow = normalizeIntelliTextRevisionNow(now);
  const difference = dueAt.getTime() - explicitNow.getTime();

  if (difference <= 0) {
    return "Due now";
  }

  const minutes = Math.ceil(difference / 60000);

  if (minutes < 60) {
    return `Due in ${minutes} min`;
  }

  const hours = Math.ceil(minutes / 60);

  if (hours < 24) {
    return `Due in ${hours} hr`;
  }

  const days = Math.ceil(hours / 24);
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}
