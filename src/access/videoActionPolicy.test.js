import {
  VIDEO_ACTIONS,
  VIDEO_DECISIONS,
  VIDEO_DISCOVERY_MODES,
  VIDEO_REASON_CODES,
  buildVideoActionDecision,
  isVideoAccessBoundToResource,
  normalizeVideoAccessState,
} from "./videoActionPolicy";

const PRINCIPAL = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
  isAuthenticated: true,
});

const VIDEO = Object.freeze({
  id: "video-1",
  section: "video",
  contentType: "VIDEO",
  classMode: "RECORDED",
  status: "published",
  planType: "PREMIUM",
  title: "Learning and Development",
  hasProtectedAsset: true,
  protectedAssetId: "video-1",
});

const ITEM_ACCESS = Object.freeze({
  status: "allowed",
  sourceScope: "item",
  module: "video",
  itemType: "video",
  itemId: "video-1",
});

const decide = (overrides = {}) =>
  buildVideoActionDecision({
    action: VIDEO_ACTIONS.WATCH,
    video: VIDEO,
    principal: PRINCIPAL,
    access: ITEM_ACCESS,
    ...overrides,
  });

describe("AspireNest Video action policy", () => {
  test("unknown actions fail closed", () => {
    const decision = decide({ action: "DELETE_ALL" });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.INVALID_ACTION
    );
  });

  test("missing and non-video resources fail closed", () => {
    expect(decide({ video: null }).reason).toBe(
      VIDEO_REASON_CODES.NOT_FOUND
    );

    expect(
      decide({
        video: {
          id: "note-1",
          section: "notes",
          status: "published",
        },
      }).reason
    ).toBe(VIDEO_REASON_CODES.NOT_VIDEO);
  });

  test("unpublished videos are hidden from learner discovery", () => {
    const decision = decide({
      action: VIDEO_ACTIONS.DISCOVER,
      video: { ...VIDEO, status: "draft" },
    });

    expect(decision.decision).toBe(VIDEO_DECISIONS.HIDE);
    expect(decision.visible).toBe(false);
  });

  test("admin preview can authorize an unpublished video", () => {
    const decision = decide({
      video: { ...VIDEO, status: "draft" },
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

  test("catalog discovery exposes metadata but never an asset URL", () => {
    const decision = decide({
      action: VIDEO_ACTIONS.DISCOVER,
      access: { status: "denied" },
    });

    expect(decision.decision).toBe(
      VIDEO_DECISIONS.LOCKED_PREVIEW
    );
    expect(decision.canExposeCatalogMetadata).toBe(true);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("My Access hides a video without a matching grant", () => {
    const decision = decide({
      action: VIDEO_ACTIONS.DISCOVER,
      discoveryMode: VIDEO_DISCOVERY_MODES.MY_ACCESS,
      access: { status: "denied" },
    });

    expect(decision.decision).toBe(VIDEO_DECISIONS.HIDE);
  });

  test("classroom actions require authentication", () => {
    const decision = decide({
      principal: {},
      access: ITEM_ACCESS,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.LOGIN_REQUIRED
    );
    expect(decision.requiresServerAuthorization).toBe(true);
  });

  test("loading access never opens the classroom", () => {
    const decision = decide({
      access: {
        ...ITEM_ACCESS,
        status: "loading",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.ACCESS_LOADING
    );
  });

  test("access errors fail closed", () => {
    const decision = decide({
      access: {
        ...ITEM_ACCESS,
        status: "error",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.ACCESS_ERROR
    );
  });

  test("denied access never becomes a plan fallback", () => {
    const decision = decide({
      access: {
        status: "denied",
        sourceScope: "plan",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.ACCESS_DENIED
    );
  });

  test("an exact item grant opens only its video", () => {
    const allowed = decide();
    const deniedDecision = decide({
      video: { ...VIDEO, id: "video-2" },
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.exactItem).toBe(true);
    expect(allowed.canWatch).toBe(true);
    expect(deniedDecision.allowed).toBe(false);
    expect(deniedDecision.reason).toBe(
      VIDEO_REASON_CODES.ACCESS_SCOPE_MISMATCH
    );
  });

  test("a matching video module grant is accepted", () => {
    const decision = decide({
      access: {
        status: "allowed",
        sourceScope: "module",
        module: "video",
      },
    });

    expect(decision.allowed).toBe(true);
  });

  test("a different module grant is rejected", () => {
    const decision = decide({
      access: {
        status: "allowed",
        sourceScope: "module",
        module: "notes",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.ACCESS_SCOPE_MISMATCH
    );
  });

  test("a matching bundle grant is accepted", () => {
    const decision = decide({
      access: {
        status: "allowed",
        sourceScope: "bundle",
        module: "video",
        itemType: "video",
        itemIds: ["video-1", "video-9"],
      },
    });

    expect(decision.allowed).toBe(true);
  });

  test("a resolved callback must be bound to the same resource", () => {
    expect(
      isVideoAccessBoundToResource(
        {
          resolvedForResource: true,
          resourceId: "video-1",
        },
        "video-1"
      )
    ).toBe(true);

    expect(
      isVideoAccessBoundToResource(
        {
          resolvedForResource: true,
          resourceId: "video-2",
        },
        "video-1"
      )
    ).toBe(false);
  });

  test("protected WATCH decisions permit resolver use but not URL exposure", () => {
    const decision = decide();

    expect(decision.canWatch).toBe(true);
    expect(decision.canResolveAsset).toBe(true);
    expect(decision.legacySourceAllowed).toBe(false);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("legacy video delivery remains available behind verified WATCH", () => {
    const decision = decide({
      video: {
        ...VIDEO,
        hasProtectedAsset: false,
        protectedAssetId: "",
        videoUrl: "https://video.invalid/legacy",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.canResolveAsset).toBe(false);
    expect(decision.legacySourceAllowed).toBe(true);
  });

  test("RESOLVE_ASSET denies a legacy item without a protected asset", () => {
    const decision = decide({
      action: VIDEO_ACTIONS.RESOLVE_ASSET,
      video: {
        ...VIDEO,
        hasProtectedAsset: false,
        protectedAssetId: "",
        videoUrl: "https://video.invalid/legacy",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      VIDEO_REASON_CODES.PROTECTED_ASSET_REQUIRED
    );
  });

  test("access status normalization is deterministic", () => {
    expect(normalizeVideoAccessState({ status: "granted" })).toBe(
      "allowed"
    );
    expect(normalizeVideoAccessState({ status: "checking" })).toBe(
      "loading"
    );
    expect(normalizeVideoAccessState({ status: "unavailable" })).toBe(
      "error"
    );
    expect(normalizeVideoAccessState({ status: "revoked" })).toBe(
      "denied"
    );
  });
});
