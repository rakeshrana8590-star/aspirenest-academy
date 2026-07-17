import {
  NOTES_ACTIONS,
  NOTES_DECISIONS,
  NOTES_DISCOVERY_MODES,
  NOTES_REASON_CODES,
} from "./notesActionPolicy";
import {
  NOTES_RUNTIME_ACCESS_STATES,
  NOTES_RUNTIME_EVIDENCE,
  buildNotesAssetRequest,
  buildNotesCatalogItem,
  buildNotesPrincipal,
  buildNotesRuntimeDecision,
  resolveNotesRuntimeAccess,
} from "./notesRuntimeAdapter";

const USER = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
});

const PREMIUM_NOTE = Object.freeze({
  id: "note-premium-1",
  section: "notes",
  status: "published",
  title: "Premium CDP Notes",
  planType: "PREMIUM",
  accessRank: 2,
  subject: "CDP",
  chapter: "Learning",
  hasProtectedAsset: true,
  pdfUrl: "https://assets.invalid/private.pdf",
});

const profile = (
  accessRecords = [],
  overrides = {}
) => ({
  loading: false,
  error: null,
  isAccessCheckUnavailable: false,
  accessRecords,
  shellState: {
    mode: "active",
    isFailClosed: false,
  },
  ...overrides,
});

const activeRecord = (overrides = {}) => ({
  id: "access-1",
  status: "active",
  planType: "PREMIUM",
  accessRank: 2,
  accessUntil: "2099-12-31T23:59:59.999Z",
  ...overrides,
});

const decide = (overrides = {}) =>
  buildNotesRuntimeDecision({
    action: NOTES_ACTIONS.OPEN,
    note: PREMIUM_NOTE,
    user: USER,
    accessProfile: profile([
      activeRecord({ scopeType: "plan" }),
    ]),
    ...overrides,
  });

describe("AspireNest Notes runtime adapter", () => {
  test("builds a normalized authenticated principal", () => {
    expect(
      buildNotesPrincipal({
        user: {
          uid: " student-1 ",
          email: "STUDENT@AspireNestAcademy.in",
        },
      })
    ).toEqual({
      uid: "student-1",
      email: "student@aspirenestacademy.in",
      isAuthenticated: true,
      isAdmin: false,
      role: "",
    });
  });

  test("FREE Notes resolve without a paid grant", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: {
        ...PREMIUM_NOTE,
        id: "note-free-1",
        planType: "FREE",
        accessRank: 0,
      },
      accessProfile: profile([]),
    });

    expect(evidence.status).toBe(
      NOTES_RUNTIME_ACCESS_STATES.ALLOWED
    );
    expect(evidence.sourceScope).toBe(
      NOTES_RUNTIME_EVIDENCE.FREE
    );
  });

  test("missing note identity fails closed", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: { ...PREMIUM_NOTE, id: "" },
      accessProfile: profile([]),
    });

    expect(evidence.status).toBe("denied");
    expect(evidence.reason).toBe("note_not_found");
  });

  test("loading and error access states fail closed", () => {
    const loading = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([], {
        loading: true,
        shellState: {
          mode: "loading",
          isFailClosed: true,
        },
      }),
    });
    const error = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([], {
        error: new Error("Access unavailable"),
        isAccessCheckUnavailable: true,
        shellState: {
          mode: "error",
          isFailClosed: true,
        },
      }),
    });

    expect(loading.status).toBe("loading");
    expect(error.status).toBe("error");
  });

  test("denied evidence is null-safe and retains Notes defaults", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([]),
    });

    expect(evidence.status).toBe("denied");
    expect(evidence.module).toBe("notes");
    expect(evidence.itemType).toBe("notesPdf");
    expect(evidence.accessId).toBeNull();
  });

  test("exact ITEM evidence has highest precedence", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          id: "plan-access",
          scopeType: "plan",
        }),
        activeRecord({
          id: "item-access",
          scopeType: "item",
          module: "notes",
          itemType: "notesPdf",
          itemId: "note-premium-1",
          planType: "FREE",
          accessRank: 0,
        }),
      ]),
    });

    expect(evidence.sourceScope).toBe("item");
    expect(evidence.accessId).toBe("item-access");
    expect(evidence.exactItem).toBe(true);
  });

  test("ITEM evidence cannot unlock a sibling note", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: {
        ...PREMIUM_NOTE,
        id: "note-premium-2",
      },
      accessProfile: profile([
        activeRecord({
          scopeType: "item",
          module: "notes",
          itemType: "notesPdf",
          itemId: "note-premium-1",
          planType: "FREE",
          accessRank: 0,
        }),
      ]),
    });

    expect(evidence.status).toBe("denied");
  });

  test("BUNDLE evidence requires exact note membership", () => {
    const accessProfile = profile([
      activeRecord({
        scopeType: "bundle",
        module: "notes",
        itemType: "notesPdf",
        itemIds: ["note-premium-1", "note-premium-3"],
        planType: "FREE",
        accessRank: 0,
      }),
    ]);
    const allowed = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile,
    });
    const denied = resolveNotesRuntimeAccess({
      note: { ...PREMIUM_NOTE, id: "note-premium-2" },
      accessProfile,
    });

    expect(allowed.sourceScope).toBe("bundle");
    expect(allowed.itemIds).toEqual([
      "note-premium-1",
      "note-premium-3",
    ]);
    expect(denied.status).toBe("denied");
  });

  test("MODULE evidence cannot unlock another module", () => {
    const allowed = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          scopeType: "module",
          module: "notes",
        }),
      ]),
    });
    const denied = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          scopeType: "module",
          module: "video",
        }),
      ]),
    });

    expect(allowed.sourceScope).toBe("module");
    expect(denied.status).toBe("denied");
  });

  test("lower-ranked MODULE access cannot unlock a higher plan note", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          scopeType: "module",
          module: "notes",
          planType: "BASIC",
          accessRank: 1,
        }),
      ]),
    });

    expect(evidence.status).toBe("denied");
  });

  test("PLAN evidence follows plan hierarchy", () => {
    const mentorship = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          scopeType: "plan",
          planType: "MENTORSHIP",
          accessRank: 3,
        }),
      ]),
    });
    const basic = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          scopeType: "plan",
          planType: "BASIC",
          accessRank: 1,
        }),
      ]),
    });

    expect(mentorship.sourceScope).toBe("plan");
    expect(basic.status).toBe("denied");
  });

  test("expired and blocked records do not become evidence", () => {
    const evidence = resolveNotesRuntimeAccess({
      note: PREMIUM_NOTE,
      accessProfile: profile([
        activeRecord({
          id: "expired",
          scopeType: "plan",
          accessUntil: "2000-01-01T00:00:00.000Z",
        }),
        activeRecord({
          id: "blocked",
          scopeType: "plan",
          status: "blocked",
        }),
      ]),
    });

    expect(evidence.status).toBe("denied");
  });

  test("dynamic plan identity uses access rank instead of hardcoded labels", () => {
    const planCatalog = [
      {
        id: "ctet-crash-45",
        planCode: "CTET_CRASH_45",
        accessRank: 4,
        status: "active",
      },
    ];
    const evidence = resolveNotesRuntimeAccess({
      note: {
        ...PREMIUM_NOTE,
        planType: "CTET_CRASH_45",
        accessRank: 4,
      },
      accessProfile: profile([
        activeRecord({
          scopeType: "plan",
          planType: "CTET_CRASH_45",
          planCode: "CTET_CRASH_45",
          accessRank: 4,
        }),
      ]),
      planCatalog,
    });

    expect(evidence.status).toBe("allowed");
    expect(evidence.requiredPlanCode).toBe("CTET_CRASH_45");
  });

  test("OPEN runtime decision requires authentication", () => {
    const decision = decide({ user: null });

    expect(decision.reason).toBe(
      NOTES_REASON_CODES.LOGIN_REQUIRED
    );
  });

  test("OPEN runtime decision authorizes matching access", () => {
    const decision = decide();

    expect(decision.allowed).toBe(true);
    expect(decision.canResolveAsset).toBe(true);
    expect(decision.canExposeAssetUrl).toBe(false);
  });

  test("catalog item strips raw PDF URLs", () => {
    const item = buildNotesCatalogItem({
      note: PREMIUM_NOTE,
      user: null,
      accessProfile: profile([]),
    });

    expect(item.locked).toBe(true);
    expect(item.accessDecision).toBe(
      NOTES_DECISIONS.LOCKED_PREVIEW
    );
    expect(JSON.stringify(item)).not.toContain(
      "assets.invalid"
    );
    expect(Object.hasOwn(item, "pdfUrl")).toBe(false);
  });

  test("My Access catalog hides denied Notes", () => {
    const item = buildNotesCatalogItem({
      note: PREMIUM_NOTE,
      user: USER,
      accessProfile: profile([]),
      discoveryMode: NOTES_DISCOVERY_MODES.MY_ACCESS,
    });

    expect(item).toBeNull();
  });

  test("asset request carries only note identity and action", () => {
    const decision = decide({
      action: NOTES_ACTIONS.DOWNLOAD,
    });
    const request = buildNotesAssetRequest({
      action: NOTES_ACTIONS.DOWNLOAD,
      note: PREMIUM_NOTE,
      decision,
    });

    expect(request).toEqual({
      noteId: "note-premium-1",
      action: "DOWNLOAD",
    });
    expect(JSON.stringify(request)).not.toContain("http");
  });

  test("asset request is null when the policy denies access", () => {
    const decision = decide({
      accessProfile: profile([]),
    });

    expect(
      buildNotesAssetRequest({
        action: NOTES_ACTIONS.OPEN,
        note: PREMIUM_NOTE,
        decision,
      })
    ).toBeNull();
  });

  test("asset request rejects discovery and unknown actions", () => {
    const allowed = decide();

    expect(
      buildNotesAssetRequest({
        action: NOTES_ACTIONS.DISCOVER,
        note: PREMIUM_NOTE,
        decision: allowed,
      })
    ).toBeNull();
    expect(
      buildNotesAssetRequest({
        action: "RAW_URL",
        note: PREMIUM_NOTE,
        decision: allowed,
      })
    ).toBeNull();
  });

  test("unpublished Notes remain hidden through the adapter", () => {
    const item = buildNotesCatalogItem({
      note: { ...PREMIUM_NOTE, status: "draft" },
      user: USER,
      accessProfile: profile([
        activeRecord({ scopeType: "plan" }),
      ]),
    });

    expect(item).toBeNull();
  });

  test("admin runtime bypass does not expose the raw URL", () => {
    const decision = buildNotesRuntimeDecision({
      action: NOTES_ACTIONS.OPEN,
      note: PREMIUM_NOTE,
      user: USER,
      isAdminUser: true,
      accessProfile: profile([]),
    });

    expect(decision.allowed).toBe(true);
    expect(decision.sourceScope).toBe("admin");
    expect(decision.canExposeAssetUrl).toBe(false);
  });
});
