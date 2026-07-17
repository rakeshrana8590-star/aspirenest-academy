import {
  NOTES_ASSET_RESOLVER_FUNCTION_NAME,
  buildNotesAssetResolverPayload,
  createFirebaseNotesAssetResolverCall,
  normalizeNotesAssetResolverResponse,
} from "./notesAssetResolverClient";

const buildResponse = (
  overrides = {}
) => ({
  data: {
    authorized: true,
    source: "server_authorized",
    noteId: "note-1",
    action: "OPEN",
    assetUrl:
      "https://assets.example.com/note-1.pdf",
    accessScope: "item",
    serverNowMs: 1800000000000,
    requestId: "notes-request-1",
    ...overrides,
  },
});

describe(
  "Firebase Notes protected asset resolver client",
  () => {
    test("builds a minimal noteId and action payload", () => {
      const payload =
        buildNotesAssetResolverPayload({
          noteId: " note-1 ",
          action: " download ",
          pdfUrl:
            "https://forged.invalid/file.pdf",
          uid: "forged-user",
          entitlementId: "forged",
          planType: "MENTORSHIP",
        });

      expect(payload).toEqual({
        noteId: "note-1",
        action: "DOWNLOAD",
      });
      expect(Object.isFrozen(payload)).toBe(
        true
      );
      expect(JSON.stringify(payload)).not.toContain(
        "http"
      );
    });

    test("supports OPEN, READ, and DOWNLOAD actions", () => {
      [
        "OPEN",
        "READ",
        "DOWNLOAD",
      ].forEach((action) => {
        expect(
          buildNotesAssetResolverPayload({
            noteId: "note-1",
            action,
          })
        ).toEqual({
          noteId: "note-1",
          action,
        });
      });
    });

    test("rejects an unauthenticated request before callable creation", async () => {
      const callableFactory = jest.fn();
      const request =
        createFirebaseNotesAssetResolverCall({
          authInstance: {
            currentUser: null,
          },
          functionsInstance: {},
          callableFactory,
        });

      await expect(
        request({
          noteId: "note-1",
          action: "OPEN",
        })
      ).rejects.toMatchObject({
        code: "auth/unauthenticated",
      });
      expect(callableFactory).not.toHaveBeenCalled();
    });

    test("rejects a missing note id before callable creation", async () => {
      const callableFactory = jest.fn();
      const request =
        createFirebaseNotesAssetResolverCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance: {},
          callableFactory,
        });

      await expect(
        request({
          noteId: "",
          action: "OPEN",
        })
      ).rejects.toMatchObject({
        code: "notes/invalid-note",
      });
      expect(callableFactory).not.toHaveBeenCalled();
    });

    test("rejects an unsupported action before callable creation", async () => {
      const callableFactory = jest.fn();
      const request =
        createFirebaseNotesAssetResolverCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance: {},
          callableFactory,
        });

      await expect(
        request({
          noteId: "note-1",
          action: "DELETE",
        })
      ).rejects.toMatchObject({
        code: "notes/invalid-action",
      });
      expect(callableFactory).not.toHaveBeenCalled();
    });

    test("uses the exact callable name, region instance, timeout, and minimal payload", async () => {
      const callable = jest
        .fn()
        .mockResolvedValue(buildResponse());
      const callableFactory = jest
        .fn()
        .mockReturnValue(callable);
      const functionsInstance = {
        region: "asia-south1",
      };
      const request =
        createFirebaseNotesAssetResolverCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance,
          callableFactory,
        });

      await request({
        noteId: "note-1",
        action: "OPEN",
        pdfUrl:
          "https://forged.invalid/file.pdf",
      });

      expect(callableFactory).toHaveBeenCalledWith(
        functionsInstance,
        NOTES_ASSET_RESOLVER_FUNCTION_NAME,
        { timeout: 15000 }
      );
      expect(callable).toHaveBeenCalledWith({
        noteId: "note-1",
        action: "OPEN",
      });
    });

    test("normalizes the minimal server-authorized response", () => {
      const result =
        normalizeNotesAssetResolverResponse({
          response: buildResponse(),
          request: {
            noteId: "note-1",
            action: "OPEN",
          },
        });

      expect(result).toEqual(
        buildResponse().data
      );
      expect(Object.isFrozen(result)).toBe(
        true
      );
      expect(result).not.toHaveProperty("uid");
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty(
        "entitlementId"
      );
    });

    test("rejects unauthorized and non-server responses", () => {
      for (const overrides of [
        { authorized: false },
        { source: "client" },
      ]) {
        expect(() =>
          normalizeNotesAssetResolverResponse({
            response: buildResponse(overrides),
            request: {
              noteId: "note-1",
              action: "OPEN",
            },
          })
        ).toThrow(
          "Protected Notes authorization response is invalid."
        );
      }
    });

    test("rejects mismatched note identity and action", () => {
      for (const overrides of [
        { noteId: "note-2" },
        { action: "DOWNLOAD" },
      ]) {
        expect(() =>
          normalizeNotesAssetResolverResponse({
            response: buildResponse(overrides),
            request: {
              noteId: "note-1",
              action: "OPEN",
            },
          })
        ).toThrow(
          "Protected Notes authorization response is invalid."
        );
      }
    });

    test("rejects insecure, malformed, or missing asset URLs", () => {
      for (const assetUrl of [
        "http://assets.invalid/file.pdf",
        "not-a-url",
        "",
      ]) {
        expect(() =>
          normalizeNotesAssetResolverResponse({
            response: buildResponse({
              assetUrl,
            }),
            request: {
              noteId: "note-1",
              action: "OPEN",
            },
          })
        ).toThrow(
          "Protected Notes authorization response is invalid."
        );
      }
    });

    test("rejects missing trusted-time and request-id proof", () => {
      for (const overrides of [
        { serverNowMs: 0 },
        { serverNowMs: "invalid" },
        { requestId: "" },
      ]) {
        expect(() =>
          normalizeNotesAssetResolverResponse({
            response: buildResponse(overrides),
            request: {
              noteId: "note-1",
              action: "OPEN",
            },
          })
        ).toThrow(
          "Protected Notes authorization response is invalid."
        );
      }
    });

    test("reuses one callable instance across requests", async () => {
      const callable = jest
        .fn()
        .mockResolvedValueOnce(buildResponse())
        .mockResolvedValueOnce(
          buildResponse({
            action: "READ",
            requestId: "notes-request-2",
          })
        );
      const callableFactory = jest
        .fn()
        .mockReturnValue(callable);
      const request =
        createFirebaseNotesAssetResolverCall({
          authInstance: {
            currentUser: {
              uid: "student-1",
            },
          },
          functionsInstance: {},
          callableFactory,
        });

      await request({
        noteId: "note-1",
        action: "OPEN",
      });
      await request({
        noteId: "note-1",
        action: "READ",
      });

      expect(callableFactory).toHaveBeenCalledTimes(
        1
      );
      expect(callable).toHaveBeenCalledTimes(2);
    });
  }
);
