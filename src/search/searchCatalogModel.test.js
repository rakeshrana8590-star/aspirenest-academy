import {
  SEARCH_CATEGORIES,
  buildUnifiedSearchCatalog,
  searchUnifiedCatalog,
} from "./searchCatalogModel";

describe(
  "AspireNest unified search catalog model",
  () => {
    test(
      "builds safe static learning and account destinations",
      () => {
        const catalog =
          buildUnifiedSearchCatalog();

        expect(
          catalog.entries.map(
            (entry) => entry.route
          )
        ).toEqual(
          expect.arrayContaining([
            "/ctet-tet",
            "/ctet-tet/notes",
            "/ctet-tet/mock-tests",
            "/ctet-tet/videos",
            "/ctet-tet/current-affairs",
            "/ctet-tet/roadmaps",
            "/ctet-tet/courses",
            "/my-access",
          ])
        );
      }
    );

    test(
      "indexes only explicitly published content",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "published-note",
                title: "Published CDP Notes",
                section: "notes",
                status: "Published",
                planType: "FREE",
              },
              {
                id: "draft-note",
                title: "Draft Internal Notes",
                section: "notes",
                status: "Draft",
                planType: "FREE",
              },
              {
                id: "unknown-note",
                title: "Unknown Internal Notes",
                section: "notes",
                planType: "FREE",
              },
            ],
          });

        const titles = catalog.entries.map(
          (entry) => entry.title
        );

        expect(titles).toContain(
          "Published CDP Notes"
        );
        expect(titles).not.toContain(
          "Draft Internal Notes"
        );
        expect(titles).not.toContain(
          "Unknown Internal Notes"
        );
      }
    );

    test(
      "maps supported content categories to existing student routes",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "note-1",
                title: "Learning Theories",
                section: "notes",
                status: "published",
                planType: "BASIC",
                subjectId: "cdp",
                chapterId:
                  "learning-theories",
              },
              {
                id: "video-1",
                title: "Piaget Video",
                section: "videos",
                status: "published",
                planType: "PREMIUM",
              },
              {
                id: "mock-1",
                title: "CDP Mock 1",
                section: "mockTest",
                status: "published",
                planType: "FREE",
              },
              {
                id: "current-1",
                title:
                  "January Current Affairs",
                section:
                  "currentAffairs",
                status: "published",
                month: "January 2026",
                planType: "FREE",
              },
            ],
          });

        const routeByTitle = Object.fromEntries(
          catalog.entries.map((entry) => [
            entry.title,
            entry.route,
          ])
        );

        expect(
          routeByTitle["Learning Theories"]
        ).toBe(
          "/ctet-tet/notes/plan/BASIC/cdp/learning-theories"
        );
        expect(
          routeByTitle["Piaget Video"]
        ).toBe(
          "/ctet-tet/videos/watch/video-1"
        );
        expect(
          routeByTitle["CDP Mock 1"]
        ).toBe(
          "/ctet-tet/mock-tests/start/mock-1"
        );
        expect(
          routeByTitle[
            "January Current Affairs"
          ]
        ).toBe(
          "/ctet-tet/current-affairs/january-2026"
        );
      }
    );

    test(
      "preserves custom dynamic plan identity instead of normalizing it to FREE",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "elite-note",
                title:
                  "Elite Mentorship Notes",
                section: "notes",
                status: "published",
                planCode:
                  "ASPIRE_ELITE_2026",
                planLabel:
                  "Aspire Elite 2026",
              },
            ],
          });

        const item = catalog.entries.find(
          (entry) =>
            entry.title ===
            "Elite Mentorship Notes"
        );

        expect(
          item.accessRequirement.planCode
        ).toBe("ASPIRE_ELITE_2026");
        expect(
          item.accessRequirement.rawPlanCode
        ).toBe("ASPIRE_ELITE_2026");
        expect(item.planLabel).toBe(
          "Aspire Elite 2026"
        );
        expect(item.isFree).toBe(false);
      }
    );

    test(
      "does not expose raw file, PDF, or video URLs",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "note-1",
                title: "Protected Notes",
                section: "notes",
                status: "published",
                planType: "PREMIUM",
                fileUrl:
                  "https://example.com/file.pdf",
                pdfUrl:
                  "https://example.com/secret.pdf",
                videoUrl:
                  "https://example.com/video",
              },
            ],
          });

        const serialized =
          JSON.stringify(catalog);

        expect(serialized).not.toContain(
          "example.com"
        );
        expect(serialized).not.toContain(
          "secret.pdf"
        );
      }
    );

    test(
      "skips unknown content categories",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "internal-1",
                title: "Internal Banner",
                section: "banner",
                status: "published",
              },
            ],
          });

        expect(
          catalog.entries.some(
            (entry) =>
              entry.title ===
              "Internal Banner"
          )
        ).toBe(false);
      }
    );

    test(
      "indexes published roadmap records with safe internal routes",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            roadmaps: [
              {
                id: "roadmap-1",
                title:
                  "30 Day CTET Roadmap",
                description:
                  "Daily guided preparation",
                status: "active",
                planCode: "MENTORSHIP",
              },
              {
                id: "draft-roadmap",
                title:
                  "Draft Roadmap",
                status: "draft",
              },
            ],
          });

        const roadmap =
          catalog.entries.find(
            (entry) =>
              entry.title ===
              "30 Day CTET Roadmap"
          );

        expect(roadmap.route).toBe(
          "/ctet-tet/roadmaps/roadmap-1"
        );
        expect(
          roadmap.accessRequirement.planCode
        ).toBe("MENTORSHIP");
        expect(
          catalog.entries.some(
            (entry) =>
              entry.title ===
              "Draft Roadmap"
          )
        ).toBe(false);
      }
    );

    test(
      "deduplicates equivalent published content",
      () => {
        const duplicate = {
          id: "note-1",
          title: "CDP Revision",
          section: "notes",
          status: "published",
          planType: "FREE",
        };
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              duplicate,
              { ...duplicate },
            ],
          });

        expect(
          catalog.entries.filter(
            (entry) =>
              entry.title ===
              "CDP Revision"
          )
        ).toHaveLength(1);
      }
    );

    test(
      "search ranking prioritizes exact and prefix title matches",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "note-1",
                title:
                  "Child Development",
                description:
                  "Learning and pedagogy",
                section: "notes",
                status: "published",
                planType: "FREE",
              },
              {
                id: "note-2",
                title:
                  "Pedagogy Practice",
                description:
                  "Includes child development",
                section: "notes",
                status: "published",
                planType: "FREE",
              },
            ],
          });
        const search =
          searchUnifiedCatalog(
            catalog,
            "Child Development"
          );

        expect(
          search.results[0].title
        ).toBe("Child Development");
      }
    );

    test(
      "search supports normalized punctuation and case",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: [
              {
                id: "current-1",
                title:
                  "CTET/TET Current Affairs",
                section:
                  "currentAffairs",
                status: "published",
                planType: "FREE",
              },
            ],
          });
        const search =
          searchUnifiedCatalog(
            catalog,
            "ctet tet"
          );

        expect(
          search.results.some(
            (entry) =>
              entry.title ===
              "CTET/TET Current Affairs"
          )
        ).toBe(true);
      }
    );

    test(
      "category filtering returns only requested results",
      () => {
        const catalog =
          buildUnifiedSearchCatalog();
        const search =
          searchUnifiedCatalog(
            catalog,
            "",
            {
              category:
                SEARCH_CATEGORIES.VIDEOS,
            }
          );

        expect(search.results.length).toBe(
          1
        );
        expect(
          search.results[0].category
        ).toBe(
          SEARCH_CATEGORIES.VIDEOS
        );
      }
    );

    test(
      "result limit is safely clamped",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: Array.from(
              { length: 90 },
              (_, index) => ({
                id: `note-${index}`,
                title: `Note ${index}`,
                section: "notes",
                status: "published",
                planType: "FREE",
              })
            ),
          });
        const search =
          searchUnifiedCatalog(
            catalog,
            "note",
            {
              limit: 500,
            }
          );

        expect(
          search.results.length
        ).toBeLessThanOrEqual(60);
      }
    );

    test(
      "invalid inputs return a stable browse catalog",
      () => {
        const catalog =
          buildUnifiedSearchCatalog({
            contentItems: null,
            roadmaps: {},
          });
        const search =
          searchUnifiedCatalog(
            catalog,
            ""
          );

        expect(catalog.total).toBe(8);
        expect(search.hasQuery).toBe(false);
        expect(search.results.length).toBe(
          8
        );
      }
    );

    test(
      "catalog and search outputs are immutable",
      () => {
        const catalog =
          buildUnifiedSearchCatalog();
        const search =
          searchUnifiedCatalog(
            catalog,
            "notes"
          );

        expect(
          Object.isFrozen(catalog)
        ).toBe(true);
        expect(
          Object.isFrozen(catalog.entries)
        ).toBe(true);
        expect(
          Object.isFrozen(search)
        ).toBe(true);
        expect(
          Object.isFrozen(search.results)
        ).toBe(true);
      }
    );
  }
);
