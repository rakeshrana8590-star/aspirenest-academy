import { createIntelliTextAuthoringVersion } from "./intelliTextAuthoringContract";

const base = (overrides = {}) => ({
  access: {
    publicRead: false,
    readEntitlementIds: ["plan_PREMIUM"],
    requiredPlanCode: "PREMIUM",
  },
  baseContentVersion: 0,
  blockCount: 1,
  chapterId: "science",
  contentVersion: 1,
  createdAt: null,
  createdBy: "admin_uid",
  draftFingerprint: "fingerprint_1",
  previewAudit: { desktop: true, mobile: true, studentExperience: true },
  publicationState: "DRAFT",
  publishedAt: null,
  publishedBy: null,
  sectionCount: 1,
  subjectId: "science",
  textbookId: "note_1",
  title: "Science Note",
  updatedAt: null,
  updatedBy: "admin_uid",
  versionId: "version_1",
  versionState: "DRAFT",
  ...overrides,
});

test("Firestore Timestamp-like authoring metadata becomes JSON-safe ISO text", () => {
  const version = createIntelliTextAuthoringVersion(base({
    createdAt: { toDate: () => new Date("2026-07-27T10:00:00.000Z") },
    updatedAt: { toMillis: () => Date.parse("2026-07-27T11:00:00.000Z") },
    publishedAt: new Date("2026-07-27T12:00:00.000Z"),
  }));

  expect(version.createdAt).toBe("2026-07-27T10:00:00.000Z");
  expect(version.updatedAt).toBe("2026-07-27T11:00:00.000Z");
  expect(version.publishedAt).toBe("2026-07-27T12:00:00.000Z");
  expect(() => JSON.stringify(version)).not.toThrow();
});

test("serverTimestamp write sentinel remains available to the client layer", () => {
  const sentinel = { __serverTimestamp: true };
  const version = createIntelliTextAuthoringVersion(
    base({ createdAt: sentinel, updatedAt: sentinel })
  );

  expect(version.createdAt).toEqual(sentinel);
  expect(version.updatedAt).toEqual(sentinel);
});
