import { __private__ } from "./v8PlatformLiveData";

describe("V8 platform live-data projections", () => {
  test("maps a published canonical resource without inventing access", () => {
    const resource = __private__.normalizeResource({
      record: {
        id: "note-1",
        title: "Real Note",
        resourceType: "Native Note",
        subject: "CDP",
        requiredPlan: "PREMIUM",
        status: "published",
        textbookId: "text-1",
      },
      grants: [],
      assignments: [],
    });

    expect(resource).toMatchObject({
      id: "note-1",
      title: "Real Note",
      type: "note",
      requiredPlan: "PREMIUM",
      state: "locked",
      route: "/ctet-tet/notes/read/text-1",
    });
  });

  test("opens the same resource only through a matching active entitlement", () => {
    const resource = __private__.normalizeResource({
      record: {
        id: "note-1",
        title: "Real Note",
        resourceType: "note",
        requiredPlan: "PREMIUM",
        status: "published",
      },
      grants: [{ id: "grant-1", status: "active", scopeType: "plan", planCode: "PREMIUM" }],
      assignments: [{ id: "assignment-1", resourceId: "note-1", status: "assigned" }],
    });

    expect(resource).toMatchObject({ state: "open", assigned: true, assignmentId: "assignment-1" });
  });

  test("normalizes live Access Engine plan products for public pricing", () => {
    expect(
      __private__.normalizeProduct({
        id: "premium",
        productId: "premium",
        planCode: "PREMIUM",
        displayName: "Premium Learning",
        price: 1499,
        currency: "INR",
        scopeType: "plan",
        status: "active",
        features: ["Notes", "Mock Tests"],
      })
    ).toEqual({
      id: "premium",
      productId: "premium",
      planCode: "PREMIUM",
      name: "Premium Learning",
      price: 1499,
      currency: "INR",
      billingLabel: "",
      features: ["Notes", "Mock Tests"],
      status: "active",
      scopeType: "plan",
    });
  });

  test("unifies contentItems, currentAffairs and studyRoadmaps without duplicate cards", () => {
    const records = __private__.buildV8CanonicalResourceRecords({
      contentItems: [
        {
          id: "content-ca-july",
          title: "July 2026 Current Affairs",
          section: "currentAffairs",
          status: "published",
          planType: "PREMIUM",
          month: "July 2026",
          week: "Week 1",
        },
      ],
      currentAffairs: [
        {
          id: "legacy-ca-july",
          title: "July 2026 Current Affairs",
          month: "July 2026",
          week: "Week 1",
          planType: "PREMIUM",
          pdfUrl: "https://storage.example/ca-july.pdf",
        },
        {
          id: "ca-june-2026",
          title: "June 2026 Current Affairs",
          month: "June 2026",
          week: "Monthly PDFs",
          type: "FREE",
          pdfUrl: "https://storage.example/ca-june.pdf",
        },
      ],
      studyRoadmaps: [
        {
          id: "roadmap-60-day",
          title: "60 Day CTET Paper II Roadmap",
          examType: "CTET Paper II",
          planType: "PREMIUM",
          status: "published",
          totalDays: 60,
        },
      ],
    });

    expect(records).toHaveLength(3);
    expect(records.find((record) => record.id === "content-ca-july").sourceCollections)
      .toEqual(expect.arrayContaining(["contentItems", "currentAffairs"]));

    const currentAffairs = __private__.normalizeResource({
      record: records.find((record) => record.id === "ca-june-2026"),
      grants: [],
      assignments: [],
    });
    expect(currentAffairs).toMatchObject({
      type: "current-affairs",
      route: "/ctet-tet/current-affairs/june-2026/read/ca-june-2026",
      requiredPlan: "FREE",
      state: "open",
    });

    const roadmap = __private__.normalizeResource({
      record: records.find((record) => record.id === "roadmap-60-day"),
      grants: [],
      assignments: [],
    });
    expect(roadmap).toMatchObject({
      type: "roadmap",
      route: "/ctet-tet/roadmaps/roadmap-60-day",
      requiredPlan: "PREMIUM",
      state: "locked",
    });
  });

});

describe("V8 unified plan hierarchy across the new Learning Drive", () => {
  test.each(["Native Note", "Video", "Mock Test", "Current Affairs", "Roadmap", "Live Class"])(
    "opens %s for Premium through a historical plan field",
    (resourceType) => {
      const resource = __private__.normalizeResource({
        record: { id: `resource-${resourceType}`, resourceType, planType: "PREMIUM", status: "published" },
        grants: [{ id: "plan-grant", status: "active", scopeType: "plan", plan: "PREMIUM" }],
      });
      expect(resource.state).toBe("open");
    }
  );

  test("opens a Premium roadmap from the learner effective plan", () => {
    const resource = __private__.normalizeResource({
      record: { id: "roadmap-premium", resourceType: "roadmap", planType: "PREMIUM", status: "published" },
      userPlan: "PREMIUM",
    });
    expect(resource).toMatchObject({ requiredPlan: "PREMIUM", state: "open" });
  });

  test("projects Mentorship Notes as Premium without changing other module tiers", () => {
    const note = __private__.normalizeResource({
      record: { id: "note-mentorship", resourceType: "Native Note", planType: "MENTORSHIP", status: "published" },
      userPlan: "PREMIUM",
    });
    const video = __private__.normalizeResource({
      record: { id: "video-mentorship", resourceType: "Video", planType: "MENTORSHIP", status: "published" },
      userPlan: "PREMIUM",
    });
    expect(note).toMatchObject({ requiredPlan: "PREMIUM", state: "open" });
    expect(video).toMatchObject({ requiredPlan: "MENTORSHIP", state: "locked" });
  });
});

test("publishes real legacy Current Affairs with a readable PDF and keeps explicit drafts hidden", () => {
  const publishedRecord = __private__.normalizeLegacyCurrentAffairsRecord({
    id: "ca-real",
    title: "Real Current Affairs",
    month: "July 2026",
    type: "PREMIUM",
    pdf: "https://storage.example/real-ca.pdf",
  });
  const draftRecord = __private__.normalizeLegacyCurrentAffairsRecord({
    id: "ca-draft",
    title: "Draft Current Affairs",
    month: "August 2026",
    type: "PREMIUM",
    status: "draft",
    pdf: "https://storage.example/draft-ca.pdf",
  });
  expect(__private__.published(publishedRecord)).toBe(true);
  expect(__private__.published(draftRecord)).toBe(false);
});
