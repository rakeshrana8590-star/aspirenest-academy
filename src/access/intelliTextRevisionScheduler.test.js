import {
  INTELLITEXT_REVISION_SCHEDULE,
  IntelliTextRevisionSchedulerError,
  formatIntelliTextRevisionDueLabel,
  isIntelliTextRevisionDue,
  normalizeIntelliTextRevisionNow,
  partitionIntelliTextRevisionQueue,
  scheduleIntelliTextRevision,
  sortIntelliTextRevisionQueue,
} from "./intelliTextRevisionScheduler";

const now = new Date("2026-07-19T10:00:00.000Z");

const item = (overrides = {}) => ({
  dueAt: now,
  intervalDays: 0,
  recallStreak: 0,
  reviewCount: 0,
  revisionId: "r1",
  state: "ACTIVE",
  ...overrides,
});

const milliseconds = (value) => value.getTime();

test("scheduler exposes approved minimums and cap", () => {
  expect(INTELLITEXT_REVISION_SCHEDULE).toEqual({
    AGAIN_DELAY_MINUTES: 10,
    EASY_MINIMUM_INTERVAL_DAYS: 7,
    GOOD_MINIMUM_INTERVAL_DAYS: 3,
    HARD_MINIMUM_INTERVAL_DAYS: 1,
    MAX_INTERVAL_DAYS: 180,
  });
});

test("normalizes an explicit Date without mutating it", () => {
  const normalized = normalizeIntelliTextRevisionNow(now);
  expect(normalized).not.toBe(now);
  expect(normalized.toISOString()).toBe(now.toISOString());
});

test("rejects missing now input", () => {
  expect(() => normalizeIntelliTextRevisionNow()).toThrow(
    expect.objectContaining({ code: "DATE_INVALID" })
  );
});

test("rejects invalid Date input", () => {
  expect(() =>
    normalizeIntelliTextRevisionNow(new Date("invalid"))
  ).toThrow(expect.objectContaining({ code: "DATE_INVALID" }));
});

test("AGAIN schedules exactly ten minutes later", () => {
  const update = scheduleIntelliTextRevision({
    current: item(),
    now,
    rating: "AGAIN",
  });
  expect(milliseconds(update.dueAt) - milliseconds(now)).toBe(600000);
});

test("AGAIN resets interval and recall streak", () => {
  const update = scheduleIntelliTextRevision({
    current: item({ intervalDays: 30, recallStreak: 7 }),
    now,
    rating: "AGAIN",
  });
  expect(update.intervalDays).toBe(0);
  expect(update.recallStreak).toBe(0);
});

test("HARD starts with one day minimum", () => {
  const update = scheduleIntelliTextRevision({
    current: item(),
    now,
    rating: "HARD",
  });
  expect(update.intervalDays).toBe(1);
});

test("GOOD starts with three day minimum", () => {
  const update = scheduleIntelliTextRevision({
    current: item(),
    now,
    rating: "GOOD",
  });
  expect(update.intervalDays).toBe(3);
});

test("EASY starts with seven day minimum", () => {
  const update = scheduleIntelliTextRevision({
    current: item(),
    now,
    rating: "EASY",
  });
  expect(update.intervalDays).toBe(7);
});

test("HARD grows previous interval by 1.2 and rounds up", () => {
  const update = scheduleIntelliTextRevision({
    current: item({ intervalDays: 5 }),
    now,
    rating: "HARD",
  });
  expect(update.intervalDays).toBe(6);
});

test("GOOD doubles previous interval", () => {
  const update = scheduleIntelliTextRevision({
    current: item({ intervalDays: 5 }),
    now,
    rating: "GOOD",
  });
  expect(update.intervalDays).toBe(10);
});

test("EASY triples previous interval", () => {
  const update = scheduleIntelliTextRevision({
    current: item({ intervalDays: 5 }),
    now,
    rating: "EASY",
  });
  expect(update.intervalDays).toBe(15);
});

test.each(["HARD", "GOOD", "EASY"])(
  "%s interval is capped at 180 days",
  (rating) => {
    const update = scheduleIntelliTextRevision({
      current: item({ intervalDays: 179 }),
      now,
      rating,
    });
    expect(update.intervalDays).toBeLessThanOrEqual(180);
  }
);

test("successful rating increments recall streak", () => {
  const update = scheduleIntelliTextRevision({
    current: item({ recallStreak: 4 }),
    now,
    rating: "GOOD",
  });
  expect(update.recallStreak).toBe(5);
});

test.each(["AGAIN", "HARD", "GOOD", "EASY"])(
  "%s increments review count exactly once",
  (rating) => {
    const update = scheduleIntelliTextRevision({
      current: item({ reviewCount: 8 }),
      now,
      rating,
    });
    expect(update.reviewCount).toBe(9);
  }
);

test.each(["again", "hard", "good", "easy"])(
  "rating %s is case-normalized",
  (rating) => {
    expect(
      scheduleIntelliTextRevision({ current: item(), now, rating }).lastRating
    ).toBe(rating.toUpperCase());
  }
);

test("rejects unsupported rating", () => {
  expect(() =>
    scheduleIntelliTextRevision({
      current: item(),
      now,
      rating: "PERFECT",
    })
  ).toThrow(expect.objectContaining({ code: "RATING_INVALID" }));
});

test("scheduled review remains active", () => {
  expect(
    scheduleIntelliTextRevision({
      current: item({ state: "PAUSED" }),
      now,
      rating: "GOOD",
    }).state
  ).toBe("ACTIVE");
});

test("last reviewed timestamp equals explicit now", () => {
  expect(
    scheduleIntelliTextRevision({ current: item(), now, rating: "GOOD" })
      .lastReviewedAt
  ).toEqual(now);
});

test("active item due at now is due", () => {
  expect(isIntelliTextRevisionDue(item(), now)).toBe(true);
});

test("future active item is not due", () => {
  expect(
    isIntelliTextRevisionDue(
      item({ dueAt: new Date(now.getTime() + 1000) }),
      now
    )
  ).toBe(false);
});

test.each(["PAUSED", "MASTERED", "ARCHIVED"])(
  "%s item is never in due queue",
  (state) => {
    expect(isIntelliTextRevisionDue(item({ state }), now)).toBe(false);
  }
);

test("due checker accepts Firestore-like timestamp", () => {
  const timestampLike = { toDate: () => new Date(now) };
  expect(isIntelliTextRevisionDue(item({ dueAt: timestampLike }), now)).toBe(
    true
  );
});

test("queue sorts earliest due first", () => {
  const result = sortIntelliTextRevisionQueue([
    item({ revisionId: "later", dueAt: new Date(now.getTime() + 2000) }),
    item({ revisionId: "earlier", dueAt: new Date(now.getTime() + 1000) }),
  ]);
  expect(result.map((entry) => entry.revisionId)).toEqual([
    "earlier",
    "later",
  ]);
});

test("queue uses revision id as stable tie-breaker", () => {
  const result = sortIntelliTextRevisionQueue([
    item({ revisionId: "b" }),
    item({ revisionId: "a" }),
  ]);
  expect(result.map((entry) => entry.revisionId)).toEqual(["a", "b"]);
});

test("queue sorting does not mutate input", () => {
  const input = [item({ revisionId: "b" }), item({ revisionId: "a" })];
  sortIntelliTextRevisionQueue(input);
  expect(input[0].revisionId).toBe("b");
});

test("partition separates due upcoming and inactive", () => {
  const result = partitionIntelliTextRevisionQueue(
    [
      item({ revisionId: "due" }),
      item({
        revisionId: "future",
        dueAt: new Date(now.getTime() + 3600000),
      }),
      item({ revisionId: "paused", state: "PAUSED" }),
    ],
    now
  );
  expect(result.due.map((entry) => entry.revisionId)).toEqual(["due"]);
  expect(result.upcoming.map((entry) => entry.revisionId)).toEqual([
    "future",
  ]);
  expect(result.inactive.map((entry) => entry.revisionId)).toEqual([
    "paused",
  ]);
});

test("partition output collections are frozen", () => {
  const result = partitionIntelliTextRevisionQueue([item()], now);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.due)).toBe(true);
});

test("due label reports due now", () => {
  expect(formatIntelliTextRevisionDueLabel(now, now)).toBe("Due now");
});

test("due label reports minutes", () => {
  expect(
    formatIntelliTextRevisionDueLabel(
      new Date(now.getTime() + 20 * 60000),
      now
    )
  ).toBe("Due in 20 min");
});

test("due label reports hours", () => {
  expect(
    formatIntelliTextRevisionDueLabel(
      new Date(now.getTime() + 2 * 3600000),
      now
    )
  ).toBe("Due in 2 hr");
});

test("due label reports days", () => {
  expect(
    formatIntelliTextRevisionDueLabel(
      new Date(now.getTime() + 3 * 86400000),
      now
    )
  ).toBe("Due in 3 days");
});

test("scheduler errors expose stable name", () => {
  try {
    normalizeIntelliTextRevisionNow(null);
    throw new Error("Expected failure");
  } catch (error) {
    expect(error).toBeInstanceOf(IntelliTextRevisionSchedulerError);
    expect(error.name).toBe("IntelliTextRevisionSchedulerError");
  }
});
