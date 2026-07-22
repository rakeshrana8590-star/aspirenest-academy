import {
  CURRENT_AFFAIRS_ACTIONS,
  CURRENT_AFFAIRS_DECISIONS,
  CURRENT_AFFAIRS_DISCOVERY_MODES,
  CURRENT_AFFAIRS_REASON_CODES,
  buildCurrentAffairsAccessEvidence,
  buildCurrentAffairsActionDecision,
  isCurrentAffairsAccessBoundToResource,
  normalizeCurrentAffairsAccessState,
} from "./currentAffairsActionPolicy";

const PRINCIPAL = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
  isAuthenticated: true,
});

const RESOURCE = Object.freeze({
  id: "ca-july-2026-week-1",
  section: "currentAffairs",
  source: "contentItems",
  contentType: "CURRENT_AFFAIRS_PDF",
  itemType: "currentAffairsPdf",
  status: "published",
  planType: "PREMIUM",
  title: "July 2026 Week 1",
  month: "July 2026",
  hasProtectedAsset: true,
  protectedAssetId: "ca-july-2026-week-1",
});

const ITEM_ACCESS = Object.freeze({
  status: "allowed",
  sourceScope: "item",
  module: "currentAffairs",
  itemType: "currentAffairsPdf",
  itemId: "ca-july-2026-week-1",
});

const decide = (overrides = {}) =>
  buildCurrentAffairsActionDecision({
    action: CURRENT_AFFAIRS_ACTIONS.READ,
    resource: RESOURCE,
    principal: PRINCIPAL,
    access: ITEM_ACCESS,
    ...overrides,
  });

describe("AspireNest Current Affairs action policy", () => {
  test("unknown actions fail closed", () => {
    const decision = decide({
      action: "DELETE_ALL",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      CURRENT_AFFAIRS_REASON_CODES.INVALID_ACTION
    );
  });

  test("missing and unrelated resources fail closed", () => {
    expect(
      decide({ resource: null }).reason
    ).toBe(
      CURRENT_AFFAIRS_REASON_CODES.NOT_FOUND
    );

    expect(
      decide({
        resource: {
          id: "note-1",
          section: "notes",
          status: "published",
        },
      }).reason
    ).toBe(
      CURRENT_AFFAIRS_REASON_CODES
        .NOT_CURRENT_AFFAIRS
    );
  });

  test("unpublished resources are hidden from learner discovery", () => {
    const decision = decide({
      action: CURRENT_AFFAIRS_ACTIONS.DISCOVER,
      resource: {
        ...RESOURCE,
        status: "draft",
      },
    });

    expect(decision.decision).toBe(
      CURRENT_AFFAIRS_DECISIONS.HIDE
    );
    expect(decision.visible).toBe(false);
  });

  test("admin preview can authorize an unpublished resource", () => {
    const decision = decide({
      resource: {
        ...RESOURCE,
        status: "draft",
      },
      principal: {
        uid: "admin-1",
        role: "admin",
        isAuthenticated: true,
      },
      access: {
        status: "denied",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.sourceScope).toBe("admin");
  });

  test("catalog discovery exposes metadata but never an asset URL", () => {
    const decision = decide({
      action: CURRENT_AFFAIRS_ACTIONS.DISCOVER,
      access: {
        status: "denied",
      },
    });

    expect(decision.decision).toBe(
      CURRENT_AFFAIRS_DECISIONS.LOCKED_PREVIEW
    );
    expect(
      decision.canExposeCatalogMetadata
    ).toBe(true);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("My Access hides a resource without a matching grant", () => {
    const decision = decide({
      action: CURRENT_AFFAIRS_ACTIONS.DISCOVER,
      discoveryMode:
        CURRENT_AFFAIRS_DISCOVERY_MODES.MY_ACCESS,
      access: {
        status: "denied",
      },
    });

    expect(decision.decision).toBe(
      CURRENT_AFFAIRS_DECISIONS.HIDE
    );
  });

  test("READ requires authentication", () => {
    const decision = decide({
      principal: {},
      access: ITEM_ACCESS,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      CURRENT_AFFAIRS_REASON_CODES.LOGIN_REQUIRED
    );
    expect(
      decision.requiresServerAuthorization
    ).toBe(true);
  });

  test("loading and access errors fail closed", () => {
    expect(
      decide({
        access: {
          ...ITEM_ACCESS,
          status: "loading",
        },
      }).reason
    ).toBe(
      CURRENT_AFFAIRS_REASON_CODES.ACCESS_LOADING
    );

    expect(
      decide({
        access: {
          ...ITEM_ACCESS,
          status: "error",
        },
      }).reason
    ).toBe(
      CURRENT_AFFAIRS_REASON_CODES.ACCESS_ERROR
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
      CURRENT_AFFAIRS_REASON_CODES.ACCESS_DENIED
    );
  });

  test("an exact item grant reads only its PDF", () => {
    const allowed = decide();
    const deniedDecision = decide({
      resource: {
        ...RESOURCE,
        id: "ca-july-2026-week-2",
      },
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.exactItem).toBe(true);
    expect(allowed.canRead).toBe(true);
    expect(deniedDecision.allowed).toBe(false);
    expect(deniedDecision.reason).toBe(
      CURRENT_AFFAIRS_REASON_CODES
        .ACCESS_SCOPE_MISMATCH
    );
  });

  test("matching module and bundle grants are accepted", () => {
    expect(
      decide({
        access: {
          status: "allowed",
          sourceScope: "module",
          module: "currentAffairs",
        },
      }).allowed
    ).toBe(true);

    expect(
      decide({
        access: {
          status: "allowed",
          sourceScope: "bundle",
          module: "currentAffairs",
          itemType: "currentAffairsPdf",
          itemIds: [
            "ca-july-2026-week-1",
            "ca-july-2026-week-9",
          ],
        },
      }).allowed
    ).toBe(true);
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
      CURRENT_AFFAIRS_REASON_CODES
        .ACCESS_SCOPE_MISMATCH
    );
  });

  test("a resolved callback must remain bound to the same PDF", () => {
    expect(
      isCurrentAffairsAccessBoundToResource(
        {
          resolvedForResource: true,
          resourceId: "ca-july-2026-week-1",
        },
        "ca-july-2026-week-1"
      )
    ).toBe(true);

    expect(
      isCurrentAffairsAccessBoundToResource(
        {
          resolvedForResource: true,
          resourceId: "ca-july-2026-week-2",
        },
        "ca-july-2026-week-1"
      )
    ).toBe(false);
  });

  test("protected READ permits resolver use but not early URL exposure", () => {
    const decision = decide();

    expect(decision.canRead).toBe(true);
    expect(decision.canResolveAsset).toBe(true);
    expect(decision.legacySourceAllowed).toBe(false);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("legacy PDF delivery remains available behind verified READ", () => {
    const decision = decide({
      resource: {
        ...RESOURCE,
        hasProtectedAsset: false,
        protectedAssetId: "",
        pdfUrl:
          "https://example.invalid/current-affairs.pdf",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.canResolveAsset).toBe(false);
    expect(decision.legacySourceAllowed).toBe(true);
  });

  test("RESOLVE_ASSET denies a legacy PDF without a protected asset", () => {
    const decision = decide({
      action:
        CURRENT_AFFAIRS_ACTIONS.RESOLVE_ASSET,
      resource: {
        ...RESOURCE,
        hasProtectedAsset: false,
        protectedAssetId: "",
        pdfUrl:
          "https://example.invalid/current-affairs.pdf",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      CURRENT_AFFAIRS_REASON_CODES
        .PROTECTED_ASSET_REQUIRED
    );
  });

  test("resolved access evidence binds callback access to the exact item", () => {
    const hasPlanAccess = jest.fn(() => true);
    const evidence =
      buildCurrentAffairsAccessEvidence({
        resource: RESOURCE,
        user: PRINCIPAL,
        hasPlanAccess,
      });

    expect(hasPlanAccess).toHaveBeenCalledWith(
      "PREMIUM",
      {
        module: "currentAffairs",
        itemType: "currentAffairsPdf",
        itemId: "ca-july-2026-week-1",
      }
    );
    expect(evidence.status).toBe("allowed");
    expect(evidence.resolvedForResource).toBe(
      true
    );
  });

  test("access state normalization is deterministic", () => {
    expect(
      normalizeCurrentAffairsAccessState({
        status: "granted",
      })
    ).toBe("allowed");
    expect(
      normalizeCurrentAffairsAccessState({
        status: "checking",
      })
    ).toBe("loading");
    expect(
      normalizeCurrentAffairsAccessState({
        status: "unavailable",
      })
    ).toBe("error");
    expect(
      normalizeCurrentAffairsAccessState({
        status: "revoked",
      })
    ).toBe("denied");
  });
});
