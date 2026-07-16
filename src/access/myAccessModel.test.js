import {
  MY_ACCESS_ACTIONS,
  MY_ACCESS_MODES,
  buildMyAccessModel,
} from "./myAccessModel";

const NOW =
  new Date(
    "2026-07-16T08:00:00.000Z"
  ).getTime();

describe(
  "AspireNest My Access model",
  () => {
    test(
      "guest mode hides protected access details",
      () => {
        const model =
          buildMyAccessModel({
            user: null,
            accessRecords: [
              {
                id: "grant-1",
                scopeType: "plan",
                planCode: "PREMIUM",
                status: "active",
              },
            ],
            shellState: {
              mode: "guest",
              isAuthenticated: false,
            },
            now: NOW,
          });

        expect(model.mode).toBe(
          MY_ACCESS_MODES.GUEST
        );
        expect(
          model.canShowAccessDetails
        ).toBe(false);
        expect(model.summary.total).toBe(
          0
        );
        expect(model.primaryPlan).toBe(
          null
        );
      }
    );

    test.each([
      ["loading", true, null],
      [
        "error",
        false,
        new Error("offline"),
      ],
    ])(
      "%s mode fails closed",
      (mode, loading, error) => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            accessRecords: [
              {
                id: "grant-1",
                scopeType: "plan",
                planCode: "PREMIUM",
                status: "active",
              },
            ],
            shellState: {
              mode,
              isAuthenticated: true,
              isFailClosed: true,
            },
            loading,
            error,
            now: NOW,
          });

        expect(model.mode).toBe(mode);
        expect(model.isFailClosed).toBe(
          true
        );
        expect(
          model.isVerificationUnavailable
        ).toBe(true);
        expect(
          model.canShowAccessDetails
        ).toBe(false);
        expect(model.summary.total).toBe(
          0
        );
      }
    );

    test(
      "dynamic custom plan identity and no-expiry terms are preserved",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "active",
              isAuthenticated: true,
              isFailClosed: false,
              accountRoleLabel:
                "Student",
              accessLabel:
                "Aspire Elite 2026",
              activePlan: {
                id: "grant-plan",
                planCode:
                  "ASPIRE_ELITE_2026",
                label:
                  "Aspire Elite 2026",
                accessRank: 450,
                productId:
                  "plan_elite_2026",
                noExpiry: true,
                isCustomPlan: true,
              },
            },
            accessRecords: [
              {
                id: "grant-plan",
                scopeType: "plan",
                planCode:
                  "ASPIRE_ELITE_2026",
                planTitle:
                  "Aspire Elite 2026",
                accessRank: 450,
                productId:
                  "plan_elite_2026",
                status: "active",
                noExpiry: true,
              },
            ],
            now: NOW,
          });

        expect(model.primaryPlan).toEqual({
          id: "grant-plan",
          planCode:
            "ASPIRE_ELITE_2026",
          planType:
            "ASPIRE_ELITE_2026",
          label:
            "Aspire Elite 2026",
          accessRank: 450,
          productId:
            "plan_elite_2026",
          accessUntil: null,
          noExpiry: true,
          untilManualChange: false,
          isCustomPlan: true,
        });
        expect(
          model.sections[0].items[0]
            .validityLabel
        ).toBe("No expiry");
      }
    );

    test(
      "partial access is grouped by module, bundle, and item scope",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "partial",
              isAuthenticated: true,
              isFailClosed: false,
              accessLabel:
                "Partial Access",
            },
            accessRecords: [
              {
                id: "module-notes",
                scopeType: "module",
                module: "notes",
                planCode: "BASIC",
                status: "active",
              },
              {
                id: "bundle-mocks",
                scopeType: "bundle",
                module: "mockTest",
                bundleId:
                  "chapter_bundle_1",
                itemIds: [
                  "mock-1",
                  "mock-2",
                ],
                status: "active",
              },
              {
                id: "item-video",
                scopeType: "item",
                module: "video",
                itemType: "video",
                itemId: "video-1",
                itemTitle:
                  "CDP Live Class",
                status: "active",
              },
            ],
            now: NOW,
          });

        expect(model.summary).toMatchObject({
          total: 3,
          active: 3,
          module: 1,
          bundle: 1,
          item: 1,
        });
        expect(
          model.sections.map(
            (section) =>
              [section.id, section.count]
          )
        ).toEqual([
          ["plan", 0],
          ["module", 1],
          ["bundle", 1],
          ["item", 1],
        ]);
        expect(
          model.sections[1].items[0]
            .moduleLabel
        ).toBe("Notes");
        expect(
          model.sections[3].items[0]
            .title
        ).toBe("CDP Live Class");
      }
    );

    test(
      "expired and blocked records remain visible for access recovery",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "expired",
              isAuthenticated: true,
              isFailClosed: true,
              accessLabel:
                "Access expired",
            },
            accessRecords: [
              {
                id: "expired-plan",
                scopeType: "plan",
                planCode: "PREMIUM",
                status: "active",
                accessUntil:
                  "2026-07-15T08:00:00.000Z",
              },
              {
                id: "blocked-item",
                scopeType: "item",
                itemId: "note-1",
                status: "blocked",
              },
            ],
            now: NOW,
          });

        expect(model.isFailClosed).toBe(
          true
        );
        expect(
          model.isVerificationUnavailable
        ).toBe(false);
        expect(
          model.canShowAccessDetails
        ).toBe(true);
        expect(model.summary).toMatchObject({
          total: 2,
          expired: 1,
          blocked: 1,
        });
        expect(model.emptyState).toBe("");
      }
    );

    test(
      "non-fail-closed records classify active, expired, blocked, and pending states",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "partial",
              isAuthenticated: true,
              isFailClosed: false,
            },
            accessRecords: [
              {
                id: "active",
                scopeType: "module",
                module: "notes",
                status: "active",
              },
              {
                id: "expired",
                scopeType: "item",
                itemId: "mock-1",
                status: "active",
                accessUntil:
                  "2026-07-15T08:00:00.000Z",
              },
              {
                id: "blocked",
                scopeType: "item",
                itemId: "mock-2",
                status: "blocked",
              },
              {
                id: "pending",
                scopeType: "bundle",
                bundleId: "bundle-1",
                status: "pending",
              },
            ],
            now: NOW,
          });

        expect(model.summary).toMatchObject({
          total: 4,
          active: 1,
          expired: 1,
          blocked: 1,
          pending: 1,
        });
      }
    );

    test(
      "duplicate record identifiers are deduplicated",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "partial",
              isAuthenticated: true,
              isFailClosed: false,
            },
            accessRecords: [
              {
                id: "same",
                scopeType: "module",
                module: "notes",
                status: "active",
              },
              {
                id: "same",
                scopeType: "module",
                module: "video",
                status: "active",
              },
            ],
            now: NOW,
          });

        expect(model.summary.total).toBe(
          1
        );
      }
    );

    test(
      "only existing safe routes are exposed as actions",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "free",
              isAuthenticated: true,
              isFailClosed: false,
            },
            now: NOW,
          });

        expect(model.actions).toBe(
          MY_ACCESS_ACTIONS
        );
        expect(
          model.actions.map(
            (action) => action.route
          )
        ).toEqual([
          "/ctet-tet",
          "/ctet-tet/redeem",
          "/ctet-tet/pricing",
        ]);
      }
    );

    test(
      "model and nested collections are immutable",
      () => {
        const model =
          buildMyAccessModel({
            user: {
              uid: "student-1",
            },
            shellState: {
              mode: "free",
              isAuthenticated: true,
              isFailClosed: false,
            },
            now: NOW,
          });

        expect(
          Object.isFrozen(model)
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.summary
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.sections
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.sections[0]
          )
        ).toBe(true);
        expect(
          Object.isFrozen(
            model.sections[0].items
          )
        ).toBe(true);
      }
    );
  }
);
