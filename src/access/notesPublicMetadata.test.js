import {
  NOTES_PUBLIC_RAW_ASSET_FIELDS,
  buildPublicNotesMetadata,
  hasNotesRawAssetReference,
  isNotesPublicCatalogItem,
  sanitizeContentItemForClient,
  sanitizeContentItemsForClient,
} from "./notesPublicMetadata";

describe(
  "AspireNest public-safe Notes metadata",
  () => {
    test(
      "recognizes Notes catalog items across legacy classifiers",
      () => {
        expect(
          isNotesPublicCatalogItem({
            section: "notes",
          })
        ).toBe(true);
        expect(
          isNotesPublicCatalogItem({
            contentType: "notesPdf",
          })
        ).toBe(true);
        expect(
          isNotesPublicCatalogItem({
            module: "NOTES",
          })
        ).toBe(true);
        expect(
          isNotesPublicCatalogItem({
            section: "videos",
          })
        ).toBe(false);
      }
    );

    test(
      "detects every supported direct raw asset field",
      () => {
        NOTES_PUBLIC_RAW_ASSET_FIELDS
          .filter(
            (fieldName) =>
              ![
                "urls",
                "asset",
                "protectedAsset",
              ].includes(fieldName)
          )
          .forEach((fieldName) => {
            expect(
              hasNotesRawAssetReference({
                [fieldName]:
                  "https://assets.invalid/note.pdf",
              })
            ).toBe(true);
          });
      }
    );

    test(
      "detects nested URL maps and legacy asset objects",
      () => {
        expect(
          hasNotesRawAssetReference({
            urls: {
              pdfUrl:
                "https://assets.invalid/note.pdf",
            },
          })
        ).toBe(true);
        expect(
          hasNotesRawAssetReference({
            protectedAsset: {
              id: "asset-1",
            },
          })
        ).toBe(true);
      }
    );

    test(
      "treats empty raw asset fields as absent",
      () => {
        expect(
          hasNotesRawAssetReference({
            pdfUrl: " ",
            urls: {},
          })
        ).toBe(false);
      }
    );

    test(
      "removes all raw asset fields from public metadata",
      () => {
        const note = {
          id: "note-1",
          title: "Learning Notes",
          section: "notes",
          status: "published",
          planType: "BASIC",
        };

        NOTES_PUBLIC_RAW_ASSET_FIELDS.forEach(
          (fieldName) => {
            note[fieldName] =
              fieldName === "urls"
                ? {
                    pdfUrl:
                      "https://assets.invalid/note.pdf",
                  }
                : fieldName === "asset" ||
                  fieldName ===
                    "protectedAsset"
                ? { id: "asset-1" }
                : "https://assets.invalid/note.pdf";
          }
        );

        const publicNote =
          buildPublicNotesMetadata(note);

        NOTES_PUBLIC_RAW_ASSET_FIELDS.forEach(
          (fieldName) => {
            expect(publicNote).not.toHaveProperty(
              fieldName
            );
          }
        );
        expect(
          JSON.stringify(publicNote)
        ).not.toContain("https://");
      }
    );

    test(
      "marks a legacy raw URL note as protected before stripping it",
      () => {
        expect(
          buildPublicNotesMetadata({
            id: "note-1",
            title: "Protected Note",
            section: "notes",
            status: "published",
            pdfUrl:
              "https://assets.invalid/note.pdf",
          }).hasProtectedAsset
        ).toBe(true);
      }
    );

    test(
      "preserves an existing protected-asset marker without a raw URL",
      () => {
        expect(
          buildPublicNotesMetadata({
            id: "note-1",
            title: "Protected Note",
            section: "notes",
            status: "published",
            hasProtectedAsset: true,
          }).hasProtectedAsset
        ).toBe(true);
      }
    );

    test(
      "preserves safe Notes display and access metadata",
      () => {
        const publicNote =
          buildPublicNotesMetadata({
            id: "note-1",
            itemId: "note-1",
            title: "Learning Notes",
            description: "Revision",
            section: "notes",
            status: "published",
            planType: "BASIC",
            scopeType: "ITEM",
            module: "notes",
            itemType: "notesPdf",
            bundleId: "bundle-1",
            course: "CTET_TET",
            subject: "CDP",
            subjectId: "cdp",
            chapter: "Learning",
            chapterId: "learning",
            month: "July",
            year: "2026",
            week: "2",
            thumbnailUrl:
              "https://images.invalid/thumb.png",
            order: 2,
            createdAt: "created",
            updatedAt: "updated",
          });

        expect(publicNote).toMatchObject({
          id: "note-1",
          itemId: "note-1",
          title: "Learning Notes",
          description: "Revision",
          section: "notes",
          status: "published",
          planType: "BASIC",
          scopeType: "ITEM",
          module: "notes",
          itemType: "notesPdf",
          bundleId: "bundle-1",
          course: "CTET_TET",
          subject: "CDP",
          subjectId: "cdp",
          chapter: "Learning",
          chapterId: "learning",
          month: "July",
          year: "2026",
          week: "2",
          thumbnailUrl:
            "https://images.invalid/thumb.png",
          order: 2,
          createdAt: "created",
          updatedAt: "updated",
        });
      }
    );

    test(
      "drops unknown private fields instead of copying the whole document",
      () => {
        const publicNote =
          buildPublicNotesMetadata({
            id: "note-1",
            title: "Learning Notes",
            section: "notes",
            status: "published",
            internalAdminNote: "secret",
            ownerEmail:
              "owner@aspirenest.invalid",
          });

        expect(publicNote).not.toHaveProperty(
          "internalAdminNote"
        );
        expect(publicNote).not.toHaveProperty(
          "ownerEmail"
        );
      }
    );

    test(
      "sanitizes Notes items but leaves another module structurally intact",
      () => {
        const note =
          sanitizeContentItemForClient({
            id: "note-1",
            section: "notes",
            status: "published",
            pdfUrl:
              "https://assets.invalid/note.pdf",
          });
        const video =
          sanitizeContentItemForClient({
            id: "video-1",
            section: "videos",
            fileUrl:
              "https://assets.invalid/video.mp4",
          });

        expect(note).not.toHaveProperty(
          "pdfUrl"
        );
        expect(note.hasProtectedAsset).toBe(
          true
        );
        expect(video.fileUrl).toContain(
          "video.mp4"
        );
      }
    );

    test(
      "sanitizes an array without mutating the original Notes record",
      () => {
        const original = {
          id: "note-1",
          title: "Protected Note",
          section: "notes",
          status: "published",
          pdfUrl:
            "https://assets.invalid/note.pdf",
        };

        const result =
          sanitizeContentItemsForClient([
            original,
          ]);

        expect(result).toHaveLength(1);
        expect(result[0]).not.toHaveProperty(
          "pdfUrl"
        );
        expect(original.pdfUrl).toContain(
          "note.pdf"
        );
      }
    );

    test(
      "fails safely for malformed collection input",
      () => {
        expect(
          sanitizeContentItemsForClient(null)
        ).toEqual([]);
      }
    );
  }
);
