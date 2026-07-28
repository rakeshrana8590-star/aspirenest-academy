import {
  NOTES_ACCESS_STATES,
  NOTES_ACTIONS,
  NOTES_DECISIONS,
  NOTES_DISCOVERY_MODES,
  NOTES_REASON_CODES,
  buildNotesActionDecision,
  buildNotesCatalogProjection,
  getNotesRequiredPlan,
  getNotesResourceId,
  hasNotesProtectedAsset,
  hasNotesNativeContent,
  isNotesAccessBoundToResource,
  normalizeNotesAccessState,
  normalizeNotesPrincipal,
  stripNotesRawAssetFields,
} from "./notesActionPolicy";

const USER = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
});

const NOTE = Object.freeze({
  id: "note-1",
  section: "notes",
  status: "published",
  title: "Learning Theories Notes",
  description: "Premium revision PDF",
  planType: "PREMIUM",
  subject: "CDP",
  chapter: "Learning Theories",
  hasProtectedAsset: true,
  pdfUrl: "https://assets.invalid/private.pdf",
  fileUrl: "https://assets.invalid/private-file.pdf",
  sourceUrl: "https://assets.invalid/private-source.pdf",
  downloadUrl: "https://assets.invalid/private-download.pdf",
  urls: {
    pdfUrl: "https://assets.invalid/nested.pdf",
  },
});

const ALLOWED_PLAN = Object.freeze({
  status: "allowed",
  sourceScope: "plan",
  planType: "PREMIUM",
});

const decide = (overrides = {}) =>
  buildNotesActionDecision({
    action: NOTES_ACTIONS.OPEN,
    note: NOTE,
    principal: USER,
    access: ALLOWED_PLAN,
    ...overrides,
  });

describe("AspireNest Notes action policy", () => {
  test("exposes the canonical Notes action set", () => {
    expect(Object.values(NOTES_ACTIONS)).toEqual([
      "DISCOVER",
      "OPEN",
      "READ",
      "DOWNLOAD",
    ]);
  });

  test("normalizes resource identity and required plan", () => {
    expect(getNotesResourceId({ itemId: " note-2 " })).toBe(
      "note-2"
    );
    expect(getNotesRequiredPlan({ accessPlan: "basic" })).toBe(
      "BASIC"
    );
  });

  test("requires an explicit protected-asset marker", () => {
    expect(hasNotesProtectedAsset({ id: "note-1" })).toBe(false);
    expect(
      hasNotesProtectedAsset({
        id: "note-1",
        hasProtectedAsset: true,
      })
    ).toBe(true);
    expect(
      hasNotesProtectedAsset({ assetId: "asset-1" })
    ).toBe(true);
  });

  test("normalizes the authenticated principal", () => {
    expect(
      normalizeNotesPrincipal({
        uid: " student-1 ",
        email: "STUDENT@AspireNestAcademy.in",
      })
    ).toEqual({
      uid: "student-1",
      email: "student@aspirenestacademy.in",
      role: "",
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  test("recognizes owner and admin roles as admin bypass", () => {
    expect(
      normalizeNotesPrincipal({ role: "OWNER" }).isAdmin
    ).toBe(true);
    expect(
      normalizeNotesPrincipal({ role: "student" }).isAdmin
    ).toBe(false);
  });

  test.each([
    ["allowed", NOTES_ACCESS_STATES.ALLOWED],
    ["active", NOTES_ACCESS_STATES.ALLOWED],
    ["loading", NOTES_ACCESS_STATES.LOADING],
    ["pending", NOTES_ACCESS_STATES.LOADING],
    ["error", NOTES_ACCESS_STATES.ERROR],
    ["failed", NOTES_ACCESS_STATES.ERROR],
    ["denied", NOTES_ACCESS_STATES.DENIED],
  ])("normalizes %s access state", (status, expected) => {
    expect(normalizeNotesAccessState({ status })).toBe(expected);
  });

  test("ITEM access binds only to the exact Notes PDF", () => {
    const access = {
      sourceScope: "item",
      module: "notes",
      itemType: "notesPdf",
      itemId: "note-1",
    };

    expect(isNotesAccessBoundToResource(access, "note-1")).toBe(
      true
    );
    expect(isNotesAccessBoundToResource(access, "note-2")).toBe(
      false
    );
  });

  test("BUNDLE access requires exact membership", () => {
    const access = {
      sourceScope: "bundle",
      module: "notes",
      itemType: "notesPdf",
      itemIds: ["note-1", "note-3"],
    };

    expect(isNotesAccessBoundToResource(access, "note-1")).toBe(
      true
    );
    expect(isNotesAccessBoundToResource(access, "note-2")).toBe(
      false
    );
  });

  test("MODULE access cannot unlock another module", () => {
    expect(
      isNotesAccessBoundToResource(
        { sourceScope: "module", module: "notes" },
        "note-1"
      )
    ).toBe(true);
    expect(
      isNotesAccessBoundToResource(
        { sourceScope: "module", module: "video" },
        "note-1"
      )
    ).toBe(false);
  });

  test("PLAN and FREE evidence bind at the policy boundary", () => {
    expect(
      isNotesAccessBoundToResource(
        { sourceScope: "plan" },
        "note-1"
      )
    ).toBe(true);
    expect(
      isNotesAccessBoundToResource(
        { sourceScope: "free" },
        "note-1"
      )
    ).toBe(true);
  });

  test("unknown access scope fails closed", () => {
    expect(
      isNotesAccessBoundToResource(
        { sourceScope: "mystery" },
        "note-1"
      )
    ).toBe(false);
  });

  test("catalog discovery shows safe locked preview without access", () => {
    const decision = buildNotesActionDecision({
      action: NOTES_ACTIONS.DISCOVER,
      note: NOTE,
      principal: {},
      access: { status: "denied" },
      discoveryMode: NOTES_DISCOVERY_MODES.CATALOG,
    });

    expect(decision.decision).toBe(
      NOTES_DECISIONS.LOCKED_PREVIEW
    );
    expect(decision.visible).toBe(true);
    expect(decision.allowed).toBe(false);
    expect(decision.canExposeCatalogMetadata).toBe(true);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("My Access hides a note without matching access", () => {
    const decision = buildNotesActionDecision({
      action: NOTES_ACTIONS.DISCOVER,
      note: NOTE,
      principal: USER,
      access: { status: "denied" },
      discoveryMode: NOTES_DISCOVERY_MODES.MY_ACCESS,
    });

    expect(decision.decision).toBe(NOTES_DECISIONS.HIDE);
    expect(decision.visible).toBe(false);
  });

  test("matching catalog access produces an allowed preview", () => {
    const decision = buildNotesActionDecision({
      action: NOTES_ACTIONS.DISCOVER,
      note: NOTE,
      principal: USER,
      access: ALLOWED_PLAN,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.canExposeCatalogMetadata).toBe(true);
    expect(decision.canResolveAsset).toBe(false);
  });

  test("OPEN requires authenticated identity even for FREE Notes", () => {
    const decision = decide({
      note: {
        ...NOTE,
        planType: "FREE",
      },
      principal: {},
      access: {
        status: "allowed",
        sourceScope: "free",
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      NOTES_REASON_CODES.LOGIN_REQUIRED
    );
    expect(decision.requiresAuthentication).toBe(true);
  });

  test("loading access fails closed before asset resolution", () => {
    const decision = decide({
      access: { status: "loading" },
    });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.ACCESS_LOADING
    );
    expect(decision.canResolveAsset).toBe(false);
  });

  test("access errors fail closed before asset resolution", () => {
    const decision = decide({
      access: { status: "error" },
    });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.ACCESS_ERROR
    );
    expect(decision.canResolveAsset).toBe(false);
  });

  test("denied access cannot resolve the asset", () => {
    const decision = decide({
      access: { status: "denied" },
    });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.ACCESS_DENIED
    );
    expect(decision.allowed).toBe(false);
  });

  test("sibling ITEM access fails with scope mismatch", () => {
    const decision = decide({
      access: {
        status: "allowed",
        sourceScope: "item",
        module: "notes",
        itemType: "notesPdf",
        itemId: "note-2",
      },
    });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.ACCESS_SCOPE_MISMATCH
    );
  });

  test("OPEN allows only an independently resolvable asset", () => {
    const decision = decide();

    expect(decision.allowed).toBe(true);
    expect(decision.canResolveAsset).toBe(true);
    expect(decision.canOpenAsset).toBe(true);
    expect(decision.canReadAsset).toBe(false);
    expect(decision.canDownloadAsset).toBe(false);
    expect(decision.requiresServerAuthorization).toBe(true);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("native READ and legacy DOWNLOAD expose distinct capabilities", () => {
    const read = decide({
      action: NOTES_ACTIONS.READ,
      note: {
        ...NOTE,
        deliveryMode: "NATIVE_TEXT",
        textbookId: NOTE.id,
        nativeReady: true,
        publicationState: "PUBLISHED",
      },
    });
    const download = decide({ action: NOTES_ACTIONS.DOWNLOAD });

    expect(read.allowed).toBe(true);
    expect(read.canReadAsset).toBe(true);
    expect(read.canResolveAsset).toBe(false);
    expect(read.requiresServerAuthorization).toBe(false);
    expect(download.canDownloadAsset).toBe(true);
    expect(download.canReadAsset).toBe(false);
  });

  test("legacy PDF cannot impersonate a published IntelliText READ", () => {
    const decision = decide({ action: NOTES_ACTIONS.READ });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(
      NOTES_REASON_CODES.NATIVE_CONTENT_REQUIRED
    );
  });

  test("recognizes only published native content as IntelliText-ready", () => {
    expect(
      hasNotesNativeContent({
        id: "note-native",
        deliveryMode: "NATIVE_TEXT",
        nativeReady: true,
        publicationState: "PUBLISHED",
      })
    ).toBe(true);
    expect(
      hasNotesNativeContent({
        id: "note-draft",
        deliveryMode: "NATIVE_TEXT",
        nativeReady: false,
        publicationState: "DRAFT",
      })
    ).toBe(false);
  });

  test("missing protected asset fails closed", () => {
    const decision = decide({
      note: {
        ...NOTE,
        hasProtectedAsset: false,
        protectedAssetId: "",
        assetId: "",
      },
    });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.PROTECTED_ASSET_REQUIRED
    );
  });

  test("unpublished Notes are hidden from discovery", () => {
    const decision = buildNotesActionDecision({
      action: NOTES_ACTIONS.DISCOVER,
      note: { ...NOTE, status: "draft" },
      principal: USER,
      access: ALLOWED_PLAN,
    });

    expect(decision.decision).toBe(NOTES_DECISIONS.HIDE);
    expect(decision.reason).toBe(
      NOTES_REASON_CODES.UNPUBLISHED
    );
  });

  test("non-Notes resources are denied", () => {
    const decision = decide({
      note: { ...NOTE, section: "video" },
    });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.NOT_NOTES
    );
  });

  test("missing Notes resource is denied", () => {
    const decision = decide({ note: null });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.NOT_FOUND
    );
  });

  test("unknown actions fail closed", () => {
    const decision = decide({ action: "SHARE_RAW_URL" });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.INVALID_ACTION
    );
  });

  test("admin action bypass still requires an actual protected asset", () => {
    const allowed = decide({
      principal: { ...USER, isAdmin: true },
      access: { status: "denied" },
    });
    const denied = decide({
      note: { ...NOTE, hasProtectedAsset: false },
      principal: { ...USER, role: "owner" },
      access: { status: "denied" },
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.sourceScope).toBe("admin");
    expect(denied.reason).toBe(
      NOTES_REASON_CODES.PROTECTED_ASSET_REQUIRED
    );
  });

  test("safe metadata projection removes every raw asset field", () => {
    const publicNote = stripNotesRawAssetFields(NOTE);
    const serialized = JSON.stringify(publicNote);

    expect(publicNote.id).toBe("note-1");
    expect(publicNote.hasProtectedAsset).toBe(true);
    expect(serialized).not.toContain("assets.invalid");
    [
      "pdf",
      "pdfUrl",
      "fileUrl",
      "sourceUrl",
      "downloadUrl",
      "assetUrl",
      "urls",
      "asset",
    ].forEach((field) => {
      expect(Object.hasOwn(publicNote, field)).toBe(false);
    });
  });

  test("catalog projection is null for hidden resources", () => {
    expect(
      buildNotesCatalogProjection({
        note: NOTE,
        decision: { visible: false },
      })
    ).toBeNull();
  });

  test("catalog projection carries access state without an asset URL", () => {
    const decision = buildNotesActionDecision({
      action: NOTES_ACTIONS.DISCOVER,
      note: NOTE,
      principal: {},
      access: { status: "denied" },
    });
    const projection = buildNotesCatalogProjection({
      note: NOTE,
      decision,
    });

    expect(projection.locked).toBe(true);
    expect(projection.canOpen).toBe(false);
    expect(projection.accessDecision).toBe(
      NOTES_DECISIONS.LOCKED_PREVIEW
    );
    expect(JSON.stringify(projection)).not.toContain(
      "assets.invalid"
    );
  });
});
