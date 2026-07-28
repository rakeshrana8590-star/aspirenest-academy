import {
  normalizeFirestoreSnapshotValueForAuthoring,
} from "./intelliTextAuthoringClient";

test("nested Firestore Timestamp-like values become JSON-safe at snapshot boundary", () => {
  const normalized = normalizeFirestoreSnapshotValueForAuthoring({
    root: {
      updatedAt: {
        toDate: () => new Date("2026-07-27T14:00:00.000Z"),
      },
    },
    sections: [
      {
        updatedAt: {
          toMillis: () => Date.parse("2026-07-27T14:01:00.000Z"),
        },
        blocks: [
          {
            updatedAt: new Date("2026-07-27T14:02:00.000Z"),
          },
        ],
      },
    ],
  });

  expect(normalized.root.updatedAt).toBe("2026-07-27T14:00:00.000Z");
  expect(normalized.sections[0].updatedAt).toBe(
    "2026-07-27T14:01:00.000Z"
  );
  expect(normalized.sections[0].blocks[0].updatedAt).toBe(
    "2026-07-27T14:02:00.000Z"
  );
  expect(() => JSON.stringify(normalized)).not.toThrow();
});

test("snapshot normalization preserves primitives and plain authoring content", () => {
  const input = {
    title: "Science",
    count: 60,
    active: true,
    optional: null,
    nested: {
      text: "Original content",
    },
  };

  expect(normalizeFirestoreSnapshotValueForAuthoring(input)).toEqual(input);
});
