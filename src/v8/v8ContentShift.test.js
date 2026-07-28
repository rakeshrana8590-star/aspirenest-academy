import { buildV8AdminLiveData } from "./v8AdminLiveData";
import { __private__ } from "./v8PlatformLiveData";

describe("V8 content-only shift into the final Learning Drive", () => {
  test("moves legacy Notes into Notes without changing the new app taxonomy", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      legacyNotes: [
        {
          id: "legacy-note-1",
          title: "Child Development Notes",
          category: "CDP",
          type: "PREMIUM",
          pages: 42,
          pdf: "https://storage.example/legacy-note.pdf",
        },
      ],
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "legacy-note-1",
      resourceType: "PDF Note",
      section: "notes",
      module: "notes",
      subject: "CDP",
      planType: "PREMIUM",
      status: "published",
      __v8Source: "notes",
    });

    const admin = buildV8AdminLiveData({ legacyNotes: records });
    expect(admin.resources).toHaveLength(1);
    expect(admin.resources[0]).toMatchObject({ type: "PDF Note", subject: "CDP", access: "PREMIUM" });
    expect(admin.resources.map((item) => item.type)).not.toContain("Learning Resource");
  });

  test("keeps each real content family in its own module across one canonical projection", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      contentItems: [
        { id: "native-1", title: "Native", section: "notes", deliveryType: "NATIVE_TEXT", status: "published" },
        { id: "video-1", title: "Video", section: "videos", videoUrl: "https://video.example/1", status: "published" },
        { id: "mock-1", title: "Mock", section: "mockTest", contentType: "MOCK", questions: [{ id: 1 }], status: "published" },
      ],
      currentAffairs: [
        { id: "ca-1", title: "July CA", month: "July 2026", pdf: "https://storage.example/ca.pdf", type: "PREMIUM" },
      ],
      studyRoadmaps: [
        { id: "road-1", title: "60 Day Roadmap", totalDays: 60, planType: "PREMIUM", status: "published" },
      ],
      experienceEvents: [
        { id: "live-1", title: "Live Revision", type: "LIVE_CLASS", status: "scheduled", planType: "PREMIUM" },
      ],
      mentorLiveSessions: [
        { id: "replay-1", sessionId: "replay-1", title: "Mentor Replay", status: "replay", replayUrl: "https://video.example/replay" },
      ],
    });

    const resources = records.map((record) => __private__.normalizeResource({ record, userPlan: "MENTORSHIP" }));
    expect(resources.map((item) => item.type)).toEqual(
      expect.arrayContaining(["note", "video", "test", "current-affairs", "roadmap", "live", "replay"])
    );
    expect(resources.every((item) => item.id && item.title && item.route)).toBe(true);
  });

  test("deduplicates a canonical contentItems note and its legacy Notes copy", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      legacyNotes: [
        { id: "same-note", title: "Same Note", category: "CDP", type: "PREMIUM", pdf: "https://storage.example/note.pdf" },
      ],
      contentItems: [
        { id: "same-note", resourceId: "same-note", title: "Same Note", section: "notes", status: "published", planType: "PREMIUM" },
      ],
    });

    expect(records).toHaveLength(1);
    expect(records[0].sourceCollections).toEqual(expect.arrayContaining(["notes", "contentItems"]));
    expect(records[0].section).toBe("notes");
  });

  test("ignores non-learning experience events instead of contaminating modules", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      experienceEvents: [
        { id: "announcement-1", title: "Announcement", type: "ANNOUNCEMENT", status: "published" },
        { id: "mock-event-1", title: "Mock reminder", type: "MOCK_TEST", status: "published" },
        { id: "webinar-1", title: "Webinar", type: "WEBINAR", status: "scheduled" },
      ],
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id: "webinar-1", resourceType: "live", section: "live" });
  });
});

describe("cross-surface canonical module ownership", () => {
  test("contentItems section is authoritative: Notes with month metadata stay in Notes", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      contentItems: [
        {
          id: "science-master-guide",
          title: "Science Master Guide",
          resourceType: "PDF Note",
          contentType: "PDF",
          section: "notes",
          month: "June 2026",
          year: "2026",
          week: "Revision",
          status: "published",
          planType: "PREMIUM",
          hasProtectedAsset: true,
        },
      ],
    });

    expect(records).toHaveLength(1);
    expect(__private__.resolveV8CanonicalResourceType(records[0])).toBe("note");
    expect(records[0]).toMatchObject({ section: "notes", module: "notes" });

    const student = __private__.normalizeResource({ record: records[0], userPlan: "PREMIUM" });
    expect(student).toMatchObject({ type: "note", state: "open" });

    const admin = buildV8AdminLiveData({ contentItems: records });
    expect(admin.resources[0]).toMatchObject({ type: "PDF Note" });
  });

  test("contentItems currentAffairs section owns Current Affairs without a separate collection", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      contentItems: [
        {
          id: "ca-june-2026",
          title: "June 2026",
          resourceType: "PDF Note",
          contentType: "PDF",
          section: "currentAffairs",
          month: "June 2026",
          status: "published",
          planType: "PREMIUM",
          hasProtectedAsset: true,
        },
      ],
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      resourceType: "current-affairs",
      section: "currentAffairs",
      module: "currentAffairs",
      monthId: "june-2026",
      canonicalRoute: "/ctet-tet/current-affairs/june-2026/read/ca-june-2026",
    });
    expect(__private__.normalizeResource({ record: records[0], userPlan: "PREMIUM" })).toMatchObject({
      type: "current-affairs",
      state: "open",
    });
    expect(buildV8AdminLiveData({ contentItems: records }).resources[0]).toMatchObject({ type: "Current Affairs" });
  });

  test("dedicated module ownership survives a generic canonical mirror for every module", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      currentAffairs: [
        { id: "ca-owned", title: "CA Owned", month: "June 2026", pdfUrl: "https://storage.example/ca.pdf", type: "PREMIUM" },
      ],
      contentItems: [
        { id: "ca-owned", resourceId: "ca-owned", title: "CA Owned", resourceType: "PDF Note", section: "notes", status: "published" },
      ],
      studyRoadmaps: [
        { id: "road-owned", title: "Road Owned", totalDays: 60, status: "published", planType: "PREMIUM" },
      ],
    });

    const ca = records.find((item) => item.id === "ca-owned");
    const road = records.find((item) => item.id === "road-owned");
    expect(__private__.resolveV8CanonicalResourceType(ca)).toBe("current-affairs");
    expect(ca.section).toBe("currentAffairs");
    expect(__private__.resolveV8CanonicalResourceType(road)).toBe("roadmap");
    expect(road.section).toBe("roadmaps");
  });
});


describe("live production contentItems count contract", () => {
  test("projects 48 Notes, 6 Current Affairs, 2 Practice and 1 Roadmap into their own homes", () => {
    const contentItems = [
      ...Array.from({ length: 48 }, (_, index) => ({ id: `note-${index + 1}`, title: `Note ${index + 1}`, section: "notes", month: "June", status: "published", planType: "PREMIUM", hasProtectedAsset: true })),
      ...Array.from({ length: 6 }, (_, index) => ({ id: `ca-${index + 1}`, title: `CA ${index + 1}`, section: "currentAffairs", month: `Month ${index + 1}`, status: "published", planType: "PREMIUM", hasProtectedAsset: true })),
      ...Array.from({ length: 2 }, (_, index) => ({ id: `mock-${index + 1}`, title: `Mock ${index + 1}`, section: "mockTest", contentType: "MOCK", status: "published", planType: "PREMIUM", questionsCount: 10 })),
    ];
    const records = __private__.buildV8CanonicalResourceRecords({
      contentItems,
      studyRoadmaps: [{ id: "road-1", title: "Roadmap", totalDays: 60, status: "published", planType: "PREMIUM" }],
    });
    const projected = records.map((record) => __private__.normalizeResource({ record, userPlan: "PREMIUM" }));
    expect(projected.filter((item) => item.type === "note")).toHaveLength(48);
    expect(projected.filter((item) => item.type === "current-affairs")).toHaveLength(6);
    expect(projected.filter((item) => item.type === "test")).toHaveLength(2);
    expect(projected.filter((item) => item.type === "roadmap")).toHaveLength(1);
  });
});
