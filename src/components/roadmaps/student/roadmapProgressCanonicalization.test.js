import fs from "fs";
import path from "path";

import {
  buildRoadmapProgressKey,
  selectCanonicalRoadmapProgressItems,
} from "../../../services/roadmapService";

const timestamp = (millis) => ({
  toMillis: () => millis,
});

test("builds the same lowercase canonical key used by progress writes", () => {
  expect(
    buildRoadmapProgressKey({
      userId: "i4JyfGGtLYhdSaFk0BIFSW6i9kKh",
      roadmapId: "roadmap-p12-demo",
      dayId: "day-p12-demo",
    })
  ).toBe(
    "i4jyfggtlyhdsafk0bifsw6i9kkh_roadmap-p12-demo_day-p12-demo"
  );
});

test("keeps the latest canonical record when a legacy mixed-case duplicate is stale", () => {
  const items = selectCanonicalRoadmapProgressItems({
    userId: "StudentUID",
    roadmapId: "roadmap-1",
    items: [
      {
        id: "StudentUID_roadmap-1_day-1",
        userId: "StudentUID",
        roadmapId: "roadmap-1",
        dayId: "day-1",
        completedTaskIds: [],
        progressPercent: 50,
        updatedAt: timestamp(100),
      },
      {
        id: "studentuid_roadmap-1_day-1",
        userId: "StudentUID",
        roadmapId: "roadmap-1",
        dayId: "day-1",
        completedTaskIds: ["task-1"],
        progressPercent: 100,
        updatedAt: timestamp(200),
      },
    ],
  });

  expect(items).toHaveLength(1);
  expect(items[0].completedTaskIds).toEqual(["task-1"]);
  expect(items[0].progressPercent).toBe(100);
});

test("prefers a genuinely newer legacy record over an older canonical record", () => {
  const items = selectCanonicalRoadmapProgressItems({
    userId: "StudentUID",
    roadmapId: "roadmap-1",
    items: [
      {
        id: "studentuid_roadmap-1_day-1",
        userId: "StudentUID",
        roadmapId: "roadmap-1",
        dayId: "day-1",
        progressPercent: 0,
        updatedAt: timestamp(100),
      },
      {
        id: "StudentUID_roadmap-1_day-1",
        userId: "StudentUID",
        roadmapId: "roadmap-1",
        dayId: "day-1",
        completedTaskIds: ["task-1"],
        progressPercent: 100,
        updatedAt: timestamp(300),
      },
    ],
  });

  expect(items[0].id).toBe(
    "StudentUID_roadmap-1_day-1"
  );
  expect(items[0].progressPercent).toBe(100);
});

test("uses the canonical document as a deterministic timestamp tie-breaker", () => {
  const items = selectCanonicalRoadmapProgressItems({
    userId: "StudentUID",
    roadmapId: "roadmap-1",
    items: [
      {
        id: "StudentUID_roadmap-1_day-1",
        userId: "StudentUID",
        roadmapId: "roadmap-1",
        dayId: "day-1",
        progressPercent: 50,
        updatedAt: timestamp(100),
      },
      {
        id: "studentuid_roadmap-1_day-1",
        userId: "StudentUID",
        roadmapId: "roadmap-1",
        dayId: "day-1",
        progressPercent: 100,
        updatedAt: timestamp(100),
      },
    ],
  });

  expect(items[0].id).toBe(
    "studentuid_roadmap-1_day-1"
  );
});

test("returns one current record per student roadmap day", () => {
  const items = selectCanonicalRoadmapProgressItems({
    items: [
      {
        id: "one",
        userId: "u1",
        roadmapId: "r1",
        dayId: "d1",
        updatedAt: timestamp(1),
      },
      {
        id: "two",
        userId: "u1",
        roadmapId: "r1",
        dayId: "d1",
        updatedAt: timestamp(2),
      },
      {
        id: "three",
        userId: "u1",
        roadmapId: "r1",
        dayId: "d2",
        updatedAt: timestamp(1),
      },
    ],
  });

  expect(items).toHaveLength(2);
  expect(items.map((item) => item.dayId)).toEqual([
    "d1",
    "d2",
  ]);
});

test("keeps different students and roadmaps in separate canonical groups", () => {
  const items = selectCanonicalRoadmapProgressItems({
    items: [
      {
        id: "u1_r1_d1",
        userId: "u1",
        roadmapId: "r1",
        dayId: "d1",
      },
      {
        id: "u2_r1_d1",
        userId: "u2",
        roadmapId: "r1",
        dayId: "d1",
      },
      {
        id: "u1_r2_d1",
        userId: "u1",
        roadmapId: "r2",
        dayId: "d1",
      },
    ],
  });

  expect(items).toHaveLength(3);
});

test("normalizes duplicate task identities and clamps progress", () => {
  const [item] = selectCanonicalRoadmapProgressItems({
    items: [
      {
        id: "u1_r1_d1",
        userId: "u1",
        roadmapId: "r1",
        dayId: "d1",
        completedTaskIds: [
          " task-1 ",
          "",
          null,
          "task-1",
          "task-2",
        ],
        progressPercent: 150,
      },
    ],
  });

  expect(item.completedTaskIds).toEqual([
    "task-1",
    "task-2",
  ]);
  expect(item.progressPercent).toBe(100);
});

test("mentor workspace uses the same canonical progress selector", () => {
  const source = fs.readFileSync(
    path.join(
      __dirname,
      "../../../mentor/mentorService.js"
    ),
    "utf8"
  );

  expect(source).toContain(
    "selectCanonicalRoadmapProgressItems"
  );
  expect(source).toContain(
    "roadmapProgress: sortLatest("
  );
});
