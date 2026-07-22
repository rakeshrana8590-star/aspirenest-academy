import {
  ROADMAP_LINKED_RESOURCE_ACTIONS,
  ROADMAP_LINKED_RESOURCE_REASON_CODES,
  ROADMAP_LINKED_RESOURCE_TYPES,
  buildRoadmapLinkedResourceAccessEvidence,
  buildRoadmapLinkedResourceDecision,
  normalizeRoadmapLinkedResource,
} from "./roadmapLinkedResourcePolicy";

const PRINCIPAL = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
  isAuthenticated: true,
});

const decide = ({
  resource,
  resourceType = "",
  access,
  parentPlanType = "PREMIUM",
  principal = PRINCIPAL,
} = {}) =>
  buildRoadmapLinkedResourceDecision({
    action: ROADMAP_LINKED_RESOURCE_ACTIONS.OPEN,
    resource,
    resourceType,
    parentPlanType,
    principal,
    access,
  });

describe("AspireNest Roadmap linked-resource policy", () => {
  test("normalizes Notes, Video, Live and Mock targets to their real modules", () => {
    expect(
      normalizeRoadmapLinkedResource({
        resource: {
          noteId: "note-1",
          noteUrl: "https://notes.invalid/1",
        },
      })
    ).toMatchObject({
      type: ROADMAP_LINKED_RESOURCE_TYPES.NOTES,
      module: "notes",
      itemType: "notesPdf",
      resourceId: "note-1",
    });

    expect(
      normalizeRoadmapLinkedResource({
        resource: {
          videoId: "video-1",
          href: "/ctet-tet/videos/watch/video-1",
        },
      })
    ).toMatchObject({
      type: ROADMAP_LINKED_RESOURCE_TYPES.VIDEO,
      module: "video",
      itemType: "video",
      resourceId: "video-1",
    });

    expect(
      normalizeRoadmapLinkedResource({
        resource: {
          liveClassId: "live-1",
          liveUrl: "https://live.invalid/1",
        },
      })
    ).toMatchObject({
      type: ROADMAP_LINKED_RESOURCE_TYPES.LIVE,
      module: "video",
      itemType: "video",
      resourceId: "live-1",
    });

    expect(
      normalizeRoadmapLinkedResource({
        resource: {
          mockId: "mock-1",
        },
      })
    ).toMatchObject({
      type: ROADMAP_LINKED_RESOURCE_TYPES.MOCK_TEST,
      module: "mockTest",
      itemType: "mockTest",
      resourceId: "mock-1",
      href: "/ctet-tet/mock-tests/start/mock-1",
    });
  });

  test("a roadmap grant is never used to authorize a linked Notes resource", () => {
    const hasPlanAccess = jest.fn(() => false);

    buildRoadmapLinkedResourceAccessEvidence({
      resource: {
        noteId: "note-1",
        noteUrl: "https://notes.invalid/1",
        planType: "PREMIUM",
      },
      user: PRINCIPAL,
      hasPlanAccess,
    });

    expect(hasPlanAccess).toHaveBeenCalledWith(
      "PREMIUM",
      {
        module: "notes",
        itemType: "notesPdf",
        itemId: "note-1",
      }
    );

    expect(hasPlanAccess).not.toHaveBeenCalledWith(
      "PREMIUM",
      expect.objectContaining({
        module: "roadmap",
      })
    );
  });

  test("a roadmap grant is never used to authorize linked Video, Live or Mock resources", () => {
    const hasPlanAccess = jest.fn(() => false);

    [
      {
        resource: {
          videoId: "video-1",
          href: "/ctet-tet/videos/watch/video-1",
        },
        expectedModule: "video",
        expectedItemType: "video",
        expectedId: "video-1",
      },
      {
        resource: {
          liveClassId: "live-1",
          liveUrl: "https://live.invalid/1",
        },
        expectedModule: "video",
        expectedItemType: "video",
        expectedId: "live-1",
      },
      {
        resource: {
          mockId: "mock-1",
        },
        expectedModule: "mockTest",
        expectedItemType: "mockTest",
        expectedId: "mock-1",
      },
    ].forEach(
      ({
        resource,
        expectedModule,
        expectedItemType,
        expectedId,
      }) => {
        buildRoadmapLinkedResourceAccessEvidence({
          resource,
          parentPlanType: "BASIC",
          user: PRINCIPAL,
          hasPlanAccess,
        });

        expect(hasPlanAccess).toHaveBeenLastCalledWith(
          "BASIC",
          {
            module: expectedModule,
            itemType: expectedItemType,
            itemId: expectedId,
          }
        );
      }
    );
  });

  test("missing, unsupported and incomplete targets fail closed", () => {
    expect(
      decide({
        resource: null,
        access: { status: "allowed" },
      }).reason
    ).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES.NOT_FOUND
    );

    expect(
      decide({
        resource: { title: "Unknown" },
        access: { status: "allowed" },
      }).reason
    ).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES
        .UNSUPPORTED_RESOURCE
    );

    expect(
      decide({
        resource: {
          type: "video",
          title: "Missing target",
        },
        access: { status: "allowed" },
      }).reason
    ).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES
        .TARGET_MISSING
    );
  });

  test("linked-resource opening requires authentication", () => {
    const decision = decide({
      resource: {
        mockId: "mock-1",
      },
      principal: {},
      access: {
        status: "allowed",
        module: "mockTest",
        itemType: "mockTest",
        resourceId: "mock-1",
        resolvedForResource: true,
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES
        .LOGIN_REQUIRED
    );
  });

  test("loading and access errors fail closed", () => {
    const resource = {
      mockId: "mock-1",
    };

    expect(
      decide({
        resource,
        access: { status: "loading" },
      }).reason
    ).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES
        .ACCESS_LOADING
    );

    expect(
      decide({
        resource,
        access: { status: "error" },
      }).reason
    ).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES
        .ACCESS_ERROR
    );
  });

  test("a resolved access decision must match module, item type and item id", () => {
    const resource = {
      mockId: "mock-1",
    };

    const mismatch = decide({
      resource,
      access: {
        status: "allowed",
        module: "roadmap",
        itemType: "roadmap",
        resourceId: "roadmap-1",
        resolvedForResource: true,
      },
    });

    expect(mismatch.allowed).toBe(false);
    expect(mismatch.reason).toBe(
      ROADMAP_LINKED_RESOURCE_REASON_CODES
        .ACCESS_SCOPE_MISMATCH
    );
  });

  test("matching target access returns an authorized href only after allow", () => {
    const resource = {
      mockId: "mock-1",
    };

    const denied = decide({
      resource,
      access: { status: "denied" },
    });

    const allowed = decide({
      resource,
      access: {
        status: "allowed",
        module: "mockTest",
        itemType: "mockTest",
        resourceId: "mock-1",
        resolvedForResource: true,
      },
    });

    expect(denied.authorizedHref).toBe("");
    expect(allowed.allowed).toBe(true);
    expect(allowed.canOpen).toBe(true);
    expect(allowed.authorizedHref).toBe(
      "/ctet-tet/mock-tests/start/mock-1"
    );
  });

  test("legacy external links remain usable only after target authorization", () => {
    const resource = {
      noteId: "note-1",
      noteUrl: "https://notes.invalid/1",
    };

    const allowed = decide({
      resource,
      access: {
        status: "allowed",
        module: "notes",
        itemType: "notesPdf",
        resourceId: "note-1",
        resolvedForResource: true,
      },
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.isExternal).toBe(true);
    expect(allowed.authorizedHref).toBe(
      "https://notes.invalid/1"
    );
  });
});
