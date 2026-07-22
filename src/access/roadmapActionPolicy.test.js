import {
  ROADMAP_ACTIONS,
  ROADMAP_DECISIONS,
  ROADMAP_DISCOVERY_MODES,
  ROADMAP_REASON_CODES,
  buildRoadmapAccessEvidence,
  buildRoadmapActionDecision,
  isRoadmapAccessBoundToResource,
  normalizeRoadmapAccessState,
} from "./roadmapActionPolicy";

const PRINCIPAL = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
  isAuthenticated: true,
});

const ROADMAP = Object.freeze({
  id: "roadmap-1",
  title: "CTET Paper II 60-Day AspirePath",
  examType: "CTET/TET",
  status: "published",
  planType: "PREMIUM",
  totalDays: 60,
});

const ITEM_ACCESS = Object.freeze({
  status: "allowed",
  sourceScope: "item",
  module: "roadmap",
  itemType: "roadmap",
  itemId: "roadmap-1",
});

const decide = (overrides = {}) =>
  buildRoadmapActionDecision({
    action: ROADMAP_ACTIONS.OPEN,
    roadmap: ROADMAP,
    principal: PRINCIPAL,
    access: ITEM_ACCESS,
    ...overrides,
  });

describe("AspireNest Roadmap action policy", () => {
  test("unknown actions fail closed", () => {
    const decision = decide({ action: "DELETE_ALL" });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      ROADMAP_REASON_CODES.INVALID_ACTION
    );
  });

  test("missing and non-roadmap resources fail closed", () => {
    expect(decide({ roadmap: null }).reason).toBe(
      ROADMAP_REASON_CODES.NOT_FOUND
    );

    expect(
      decide({
        roadmap: {
          id: "note-1",
          section: "notes",
          status: "published",
        },
      }).reason
    ).toBe(ROADMAP_REASON_CODES.NOT_ROADMAP);
  });

  test("unpublished roadmaps are hidden from learner discovery", () => {
    const decision = decide({
      action: ROADMAP_ACTIONS.DISCOVER,
      roadmap: { ...ROADMAP, status: "draft" },
    });

    expect(decision.decision).toBe(
      ROADMAP_DECISIONS.HIDE
    );
    expect(decision.visible).toBe(false);
  });

  test("admin can preview an unpublished roadmap", () => {
    const decision = decide({
      roadmap: { ...ROADMAP, status: "draft" },
      principal: {
        uid: "admin-1",
        role: "admin",
        isAuthenticated: true,
      },
      access: { status: "denied" },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.sourceScope).toBe("admin");
  });

  test("catalog discovery exposes metadata as a locked preview", () => {
    const decision = decide({
      action: ROADMAP_ACTIONS.DISCOVER,
      access: { status: "denied" },
    });

    expect(decision.decision).toBe(
      ROADMAP_DECISIONS.LOCKED_PREVIEW
    );
    expect(decision.canExposeCatalogMetadata).toBe(true);
  });

  test("My Access hides roadmaps without a matching grant", () => {
    const decision = decide({
      action: ROADMAP_ACTIONS.DISCOVER,
      discoveryMode: ROADMAP_DISCOVERY_MODES.MY_ACCESS,
      access: { status: "denied" },
    });

    expect(decision.decision).toBe(
      ROADMAP_DECISIONS.HIDE
    );
  });

  test("opening a roadmap requires authentication", () => {
    const decision = decide({
      principal: {},
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      ROADMAP_REASON_CODES.LOGIN_REQUIRED
    );
  });

  test("loading and error access states fail closed", () => {
    expect(
      decide({
        access: {
          ...ITEM_ACCESS,
          status: "loading",
        },
      }).reason
    ).toBe(ROADMAP_REASON_CODES.ACCESS_LOADING);

    expect(
      decide({
        access: {
          ...ITEM_ACCESS,
          status: "error",
        },
      }).reason
    ).toBe(ROADMAP_REASON_CODES.ACCESS_ERROR);
  });

  test("an exact item grant opens only its roadmap", () => {
    const allowed = decide();
    const denied = decide({
      roadmap: { ...ROADMAP, id: "roadmap-2" },
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.exactItem).toBe(true);
    expect(allowed.canOpen).toBe(true);
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe(
      ROADMAP_REASON_CODES.ACCESS_SCOPE_MISMATCH
    );
  });

  test("matching module and bundle access are accepted", () => {
    expect(
      decide({
        access: {
          status: "allowed",
          sourceScope: "module",
          module: "roadmap",
        },
      }).allowed
    ).toBe(true);

    expect(
      decide({
        access: {
          status: "allowed",
          sourceScope: "bundle",
          module: "roadmap",
          itemType: "roadmap",
          itemIds: ["roadmap-1", "roadmap-9"],
        },
      }).allowed
    ).toBe(true);
  });

  test("a different module grant is rejected", () => {
    const decision = decide({
      access: {
        status: "allowed",
        sourceScope: "module",
        module: "video",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      ROADMAP_REASON_CODES.ACCESS_SCOPE_MISMATCH
    );
  });

  test("day and progress actions expose only their own capability", () => {
    const day = decide({
      action: ROADMAP_ACTIONS.VIEW_DAY,
    });
    const progress = decide({
      action: ROADMAP_ACTIONS.UPDATE_PROGRESS,
    });

    expect(day.allowed).toBe(true);
    expect(day.canViewDay).toBe(true);
    expect(day.canUpdateProgress).toBe(false);

    expect(progress.allowed).toBe(true);
    expect(progress.canUpdateProgress).toBe(true);
    expect(progress.canViewDay).toBe(false);
  });

  test("resolved callback evidence must be bound to the same roadmap", () => {
    expect(
      isRoadmapAccessBoundToResource(
        {
          resolvedForResource: true,
          resourceId: "roadmap-1",
        },
        "roadmap-1"
      )
    ).toBe(true);

    expect(
      isRoadmapAccessBoundToResource(
        {
          resolvedForResource: true,
          resourceId: "roadmap-2",
        },
        "roadmap-1"
      )
    ).toBe(false);
  });

  test("access evidence asks for the roadmap module and exact item", () => {
    const hasPlanAccess = jest.fn(() => true);

    const evidence = buildRoadmapAccessEvidence({
      roadmap: ROADMAP,
      user: PRINCIPAL,
      hasPlanAccess,
    });

    expect(hasPlanAccess).toHaveBeenCalledWith(
      "PREMIUM",
      {
        module: "roadmap",
        itemType: "roadmap",
        itemId: "roadmap-1",
      }
    );
    expect(evidence.resolvedForResource).toBe(true);
  });

  test("access-state normalization is deterministic", () => {
    expect(
      normalizeRoadmapAccessState({
        status: "granted",
      })
    ).toBe("allowed");
    expect(
      normalizeRoadmapAccessState({
        status: "checking",
      })
    ).toBe("loading");
    expect(
      normalizeRoadmapAccessState({
        status: "unavailable",
      })
    ).toBe("error");
    expect(
      normalizeRoadmapAccessState({
        status: "revoked",
      })
    ).toBe("denied");
  });
});
