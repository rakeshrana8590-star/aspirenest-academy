import { sanitizeContentItemForClient } from "../access/notesPublicMetadata";
import {
  buildMentorResourceCatalog,
  buildStudentEquivalentPreview,
  inferMentorResourceType,
  isSafeMentorRoute,
  normalizeMentorResource,
  resolveMentorResourceAccessState,
} from "./mentorAccessModel";
import {
  MENTOR_RESOURCE_ACCESS_STATES,
  MENTOR_RESOURCE_TYPES,
} from "./mentorConstants";

describe("mentor access-aware resource model", () => {
  test("accepts only safe internal routes", () => {
    expect(isSafeMentorRoute("/ctet-tet/roadmaps/r-1")).toBe(true);
    expect(isSafeMentorRoute("https://example.com/file.pdf")).toBe(false);
    expect(isSafeMentorRoute("//example.com")).toBe(false);
  });

  test("infers notes resources", () => {
    expect(inferMentorResourceType({ section: "notes" })).toBe(
      MENTOR_RESOURCE_TYPES.NOTES
    );
  });

  test("infers live resources before recorded videos", () => {
    expect(inferMentorResourceType({ liveState: "scheduled", videoUrl: "x" })).toBe(
      MENTOR_RESOURCE_TYPES.LIVE
    );
  });

  test("infers mock tests and roadmaps", () => {
    expect(inferMentorResourceType({ mockTestId: "mock-1" })).toBe(
      MENTOR_RESOURCE_TYPES.MOCK_TEST
    );
    expect(inferMentorResourceType({ totalDays: 60 })).toBe(
      MENTOR_RESOURCE_TYPES.ROADMAP
    );
  });

  test("normalizes a roadmap with a canonical route", () => {
    const resource = normalizeMentorResource({
      id: "roadmap-1",
      title: "60 Day AspirePath",
      resourceType: "roadmap",
      planType: "PREMIUM",
      status: "published",
    });

    expect(resource.resourceId).toBe("roadmap-1");
    expect(resource.canonicalRoute).toBe("/ctet-tet/roadmaps/roadmap-1");
    expect(resource.assignable).toBe(true);
  });

  test("draft resources are not assignable", () => {
    const resource = normalizeMentorResource({
      id: "note-1",
      title: "Draft note",
      section: "notes",
      canonicalRoute: "/ctet-tet/notes/read/note-1",
      status: "draft",
    });

    expect(resource.assignable).toBe(false);
  });

  test("catalog deduplicates the same stable resource", () => {
    const catalog = buildMentorResourceCatalog({
      contentItems: [
        {
          id: "video-1",
          title: "Lesson",
          section: "recordedVideo",
          canonicalRoute: "/ctet-tet/videos/watch/video-1",
        },
        {
          id: "video-1",
          title: "Lesson duplicate",
          section: "recordedVideo",
          canonicalRoute: "/ctet-tet/videos/watch/video-1",
        },
      ],
    });

    expect(catalog).toHaveLength(1);
  });

  test("free published content resolves to has access", () => {
    const resource = normalizeMentorResource({
      id: "free-roadmap",
      title: "Free roadmap",
      resourceType: "roadmap",
      planType: "FREE",
    });
    const decision = resolveMentorResourceAccessState({ resource });

    expect(decision.state).toBe(MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS);
    expect(decision.assignable).toBe(true);
  });

  test("exact item entitlement allows a premium resource", () => {
    const resource = normalizeMentorResource({
      id: "roadmap-1",
      title: "Premium roadmap",
      resourceType: "roadmap",
      planType: "PREMIUM",
    });
    const decision = resolveMentorResourceAccessState({
      resource,
      accessRecords: [
        {
          id: "grant-1",
          status: "active",
          scopeType: "item",
          module: "roadmap",
          itemType: "roadmap",
          itemId: "roadmap-1",
          planType: "FREE",
        },
      ],
    });

    expect(decision.state).toBe(MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS);
  });

  test("roadmap access does not unlock another linked resource", () => {
    const video = normalizeMentorResource({
      id: "video-1",
      title: "Premium video",
      resourceType: "video",
      planType: "PREMIUM",
    });
    const decision = resolveMentorResourceAccessState({
      resource: video,
      accessRecords: [
        {
          id: "roadmap-grant",
          status: "active",
          scopeType: "item",
          module: "roadmap",
          itemType: "roadmap",
          itemId: "roadmap-1",
          planType: "PREMIUM",
        },
      ],
    });

    expect(decision.state).toBe(MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED);
  });

  test("active access near expiry receives expires-soon state", () => {
    const resource = normalizeMentorResource({
      id: "mock-1",
      title: "Mock",
      resourceType: "mockTest",
      planType: "PREMIUM",
    });
    const now = new Date();
    const accessUntil = new Date(now.getTime() + 8 * 86400000);
    const decision = resolveMentorResourceAccessState({
      resource,
      now,
      accessRecords: [
        {
          id: "plan-1",
          status: "active",
          scopeType: "plan",
          planType: "PREMIUM",
          accessUntil,
        },
      ],
    });

    expect(decision.state).toBe(
      MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON
    );
  });

  test("missing access is grant required and cannot be assigned", () => {
    const resource = normalizeMentorResource({
      id: "note-1",
      title: "Premium note",
      resourceType: "notes",
      textbookId: "note-1",
      planType: "PREMIUM",
    });
    const decision = resolveMentorResourceAccessState({ resource });

    expect(decision.state).toBe(MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED);
    expect(decision.assignable).toBe(false);
  });

  test("loading and lookup errors fail closed", () => {
    const resource = normalizeMentorResource({
      id: "roadmap-1",
      title: "Roadmap",
      resourceType: "roadmap",
    });

    expect(resolveMentorResourceAccessState({ resource, loading: true }).state).toBe(
      MENTOR_RESOURCE_ACCESS_STATES.ACCESS_UNAVAILABLE
    );
    expect(resolveMentorResourceAccessState({ resource, error: new Error("x") }).assignable).toBe(false);
  });

  test("student-equivalent preview never exposes a route when denied", () => {
    const preview = buildStudentEquivalentPreview({
      resource: {
        resourceId: "roadmap-1",
        title: "Roadmap",
        canonicalRoute: "/ctet-tet/roadmaps/roadmap-1",
      },
      accessDecision: {
        state: MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED,
      },
    });

    expect(preview.canOpen).toBe(false);
    expect(preview.canonicalRoute).toBe("");
  });

  test("sanitized premium note keeps safe mentor routing metadata", () => {
    const sanitized = sanitizeContentItemForClient({
      id: "premium-note-p12",
      textbookId: "premium-note-p12",
      title: "Premium Note",
      section: "notes",
      resourceType: "notes",
      status: "published",
      planType: "PREMIUM",
      canonicalRoute: "/ctet-tet/notes/read/premium-note-p12",
    });

    const resource = normalizeMentorResource(sanitized);
    const decision = resolveMentorResourceAccessState({ resource });

    expect(resource.assignable).toBe(true);
    expect(resource.canonicalRoute).toBe(
      "/ctet-tet/notes/read/premium-note-p12"
    );
    expect(decision.state).toBe(
      MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED
    );
  });

  test("sanitization still removes raw note asset URLs", () => {
    const sanitized = sanitizeContentItemForClient({
      id: "premium-note-p12",
      textbookId: "premium-note-p12",
      title: "Premium Note",
      section: "notes",
      status: "published",
      planType: "PREMIUM",
      canonicalRoute: "/ctet-tet/notes/read/premium-note-p12",
      pdfUrl: "https://example.com/private.pdf",
    });

    expect(sanitized.pdfUrl).toBeUndefined();
    expect(sanitized.textbookId).toBe("premium-note-p12");
    expect(sanitized.canonicalRoute).toBe(
      "/ctet-tet/notes/read/premium-note-p12"
    );
  });

});
