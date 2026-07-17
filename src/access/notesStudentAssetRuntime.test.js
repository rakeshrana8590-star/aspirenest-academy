import {
  NOTES_ACTIONS,
} from "./notesActionPolicy";
import {
  NOTES_STUDENT_ASSET_ERROR_CODES,
  buildStudentNotesRuntimeDecision,
  classifyStudentNotesRuntimeError,
  getStudentNotesAccessPresentation,
  resolveStudentNotesProtectedAsset,
} from "./notesStudentAssetRuntime";

const USER = Object.freeze({
  uid: "student-1",
  email: "student@aspirenestacademy.in",
});

const NOTE = Object.freeze({
  id: "note-1",
  section: "notes",
  status: "published",
  title: "CDP Revision Notes",
  planType: "PREMIUM",
  accessRank: 2,
  hasProtectedAsset: true,
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

const record = (overrides = {}) => ({
  id: "access-1",
  status: "active",
  scopeType: "item",
  module: "notes",
  itemType: "notesPdf",
  itemId: "note-1",
  planType: "PREMIUM",
  accessRank: 2,
  accessUntil:
    "2099-12-31T23:59:59.999Z",
  ...overrides,
});

const serverAsset = (
  overrides = {}
) => ({
  authorized: true,
  source: "server_authorized",
  noteId: "note-1",
  action: "OPEN",
  assetUrl:
    "https://assets.aspirentest.invalid/note-1.pdf",
  accessScope: "item",
  serverNowMs: 1784280000000,
  requestId: "request-1",
  ...overrides,
});

const resolve = (overrides = {}) =>
  resolveStudentNotesProtectedAsset({
    note: NOTE,
    user: USER,
    accessProfile: profile([
      record(),
    ]),
    resolver: jest.fn().mockResolvedValue(
      serverAsset()
    ),
    ...overrides,
  });

describe(
  "AspireNest student Notes callable runtime",
  () => {
    test(
      "builds an allowed exact ITEM decision",
      () => {
        const decision =
          buildStudentNotesRuntimeDecision({
            note: NOTE,
            user: USER,
            accessProfile: profile([
              record(),
            ]),
          });

        expect(decision.allowed).toBe(true);
        expect(decision.sourceScope).toBe(
          "item"
        );
        expect(
          decision.canResolveAsset
        ).toBe(true);
      }
    );

    test(
      "accepts sufficient PLAN evidence",
      () => {
        const decision =
          buildStudentNotesRuntimeDecision({
            note: NOTE,
            user: USER,
            accessProfile: profile([
              record({
                scopeType: "plan",
                itemId: "",
              }),
            ]),
          });

        expect(decision.allowed).toBe(true);
        expect(decision.sourceScope).toBe(
          "plan"
        );
      }
    );

    test(
      "allows published FREE Notes without a paid grant",
      () => {
        const decision =
          buildStudentNotesRuntimeDecision({
            note: {
              ...NOTE,
              id: "note-free",
              planType: "FREE",
              accessRank: 0,
            },
            user: USER,
            accessProfile: profile([]),
          });

        expect(decision.allowed).toBe(true);
        expect(decision.sourceScope).toBe(
          "free"
        );
      }
    );

    test(
      "denies a sibling ITEM grant",
      () => {
        const decision =
          buildStudentNotesRuntimeDecision({
            note: NOTE,
            user: USER,
            accessProfile: profile([
              record({
                itemId: "note-2",
              }),
            ]),
          });

        expect(decision.allowed).toBe(false);
        expect(decision.reason).toBe(
          "access_denied"
        );
      }
    );

    test(
      "fails closed while access is loading",
      () => {
        const decision =
          buildStudentNotesRuntimeDecision({
            note: NOTE,
            user: USER,
            accessProfile: profile([], {
              loading: true,
              shellState: {
                mode: "loading",
                isFailClosed: true,
              },
            }),
          });

        expect(decision.allowed).toBe(false);
        expect(decision.reason).toBe(
          "access_loading"
        );
      }
    );

    test(
      "fails closed when access loading errors",
      () => {
        const decision =
          buildStudentNotesRuntimeDecision({
            note: NOTE,
            user: USER,
            accessProfile: profile([], {
              error: new Error(
                "Access unavailable"
              ),
              isAccessCheckUnavailable: true,
              shellState: {
                mode: "error",
                isFailClosed: true,
              },
            }),
          });

        expect(decision.allowed).toBe(false);
        expect(decision.reason).toBe(
          "access_error"
        );
      }
    );

    test(
      "requires authenticated identity before resolving an asset",
      async () => {
        await expect(
          resolveStudentNotesProtectedAsset({
            note: NOTE,
            user: null,
            accessProfile: profile([
              record(),
            ]),
            resolver: jest.fn(),
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .LOGIN_REQUIRED,
        });
      }
    );

    test(
      "sends only noteId and action to the callable client",
      async () => {
        const resolver = jest
          .fn()
          .mockResolvedValue(
            serverAsset()
          );

        const result = await resolve({
          resolver,
        });

        expect(resolver).toHaveBeenCalledWith({
          noteId: "note-1",
          action: "OPEN",
        });
        expect(
          JSON.stringify(
            result.resolverRequest
          )
        ).not.toContain("http");
      }
    );

    test(
      "never calls the server for a denied client decision",
      async () => {
        const resolver = jest.fn();

        await expect(
          resolveStudentNotesProtectedAsset({
            note: NOTE,
            user: USER,
            accessProfile: profile([]),
            resolver,
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .ACCESS_DENIED,
        });

        expect(resolver).not.toHaveBeenCalled();
      }
    );

    test(
      "preserves DOWNLOAD action through both authorization layers",
      async () => {
        const resolver = jest
          .fn()
          .mockResolvedValue(
            serverAsset({
              action: "DOWNLOAD",
            })
          );

        const result = await resolve({
          action: NOTES_ACTIONS.DOWNLOAD,
          resolver,
        });

        expect(resolver).toHaveBeenCalledWith({
          noteId: "note-1",
          action: "DOWNLOAD",
        });
        expect(result.asset.action).toBe(
          "DOWNLOAD"
        );
      }
    );

    test(
      "rejects a mismatched server note identity",
      async () => {
        await expect(
          resolve({
            resolver: jest
              .fn()
              .mockResolvedValue(
                serverAsset({
                  noteId: "note-2",
                })
              ),
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .INVALID_SERVER_RESPONSE,
        });
      }
    );

    test(
      "rejects a non-HTTPS server asset URL",
      async () => {
        await expect(
          resolve({
            resolver: jest
              .fn()
              .mockResolvedValue(
                serverAsset({
                  assetUrl:
                    "http://assets.invalid/note.pdf",
                })
              ),
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .INVALID_SERVER_RESPONSE,
        });
      }
    );

    test(
      "normalizes server permission denial",
      async () => {
        const error = new Error(
          "Permission denied"
        );
        error.code =
          "functions/permission-denied";

        await expect(
          resolve({
            resolver: jest
              .fn()
              .mockRejectedValue(error),
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .ACCESS_DENIED,
        });
      }
    );

    test(
      "normalizes server unauthenticated failure",
      async () => {
        const error = new Error(
          "Login required"
        );
        error.code =
          "functions/unauthenticated";

        await expect(
          resolve({
            resolver: jest
              .fn()
              .mockRejectedValue(error),
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .LOGIN_REQUIRED,
        });
      }
    );

    test(
      "normalizes server availability failure",
      async () => {
        const error = new Error(
          "Unavailable"
        );
        error.code =
          "functions/unavailable";

        await expect(
          resolve({
            resolver: jest
              .fn()
              .mockRejectedValue(error),
          })
        ).rejects.toMatchObject({
          code:
            NOTES_STUDENT_ASSET_ERROR_CODES
              .SERVICE_UNAVAILABLE,
        });
      }
    );

    test(
      "builds deterministic UI and navigation classifications",
      () => {
        expect(
          getStudentNotesAccessPresentation({
            allowed: true,
            canResolveAsset: true,
          })
        ).toMatchObject({
          canOpen: true,
          buttonLabel: "Open PDF",
        });

        expect(
          getStudentNotesAccessPresentation({
            reason: "access_loading",
          })
        ).toMatchObject({
          disabled: true,
          busy: true,
        });

        expect(
          classifyStudentNotesRuntimeError({
            code: "notes/login-required",
          })
        ).toMatchObject({
          requiresLogin: true,
          requiresUpgrade: false,
        });

        expect(
          classifyStudentNotesRuntimeError({
            code: "notes/access-denied",
          })
        ).toMatchObject({
          requiresLogin: false,
          requiresUpgrade: true,
        });
      }
    );
  }
);
