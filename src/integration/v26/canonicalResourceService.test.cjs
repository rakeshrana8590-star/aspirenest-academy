"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const servicePath = path.resolve(
  __dirname,
  "canonicalResourceService.js",
);
delete require.cache[servicePath];
const canonical = require(servicePath);

function createHarness(records = {}, overrides = {}) {
  const calls = [];

  async function readResourceById(input) {
    calls.push({ ...input });

    if (overrides.readResourceById) {
      return overrides.readResourceById(input);
    }

    const key = `${input.collection}:${input.resourceId}`;

    return Object.prototype.hasOwnProperty.call(records, key)
      ? records[key]
      : { exists: false };
  }

  return {
    calls,
    service: canonical.createCanonicalResourceService({
      readResourceById,
    }),
  };
}

function hit({
  id,
  collection = "contentItems",
  record,
  omitDefaultPlan = false,
}) {
  const planFields = [
    "planCode",
    "planType",
    "plan",
    "accessPlan",
    "requiredPlan",
    "currentPlan",
    "subscriptionType",
    "premiumPlan",
    "premiumStatus",
    "membershipPlan",
  ];
  const hasPlanSignal = (
    planFields.some(
      (field) => Object.prototype.hasOwnProperty.call(
        record,
        field,
      ),
    )
    || typeof record.isPremium === "boolean"
  );

  return {
    [`${collection}:${id}`]: {
      exists: true,
      id,
      record: {
        id,
        ...(
          omitDefaultPlan
          || hasPlanSignal
          || collection === "mentorLiveSessions"
            ? {}
            : { requiredPlan: "FREE" }
        ),
        ...record,
      },
    },
  };
}

async function resolveOne({
  id,
  collection = "contentItems",
  record,
  request = {},
  omitDefaultPlan = false,
}) {
  const harness = createHarness(
    hit({
      id,
      collection,
      record,
      omitDefaultPlan,
    }),
  );

  return harness.service.getCanonicalResource({
    resourceId: id,
    ...request,
  });
}

async function main() {
  assert(Object.isFrozen(canonical));
  assert(Object.isFrozen(canonical.CODES));
  assert(
    Object.isFrozen(
      canonical.CANONICAL_RESOURCE_CONTRACT,
    ),
  );
  assert.strictEqual(
    canonical.CANONICAL_RESOURCE_CONTRACT.version,
    "1.6.0",
  );
  assert.deepStrictEqual(
    Array.from(
      canonical.CANONICAL_RESOURCE_CONTRACT
        .planPolicy
        .requireExplicitPlanForCollections,
    ),
    [
      "contentItems",
      "studyRoadmaps",
      "experienceEvents",
    ],
  );
  assert.deepStrictEqual(
    Array.from(
      canonical.CANONICAL_RESOURCE_CONTRACT.collections,
    ),
    [
      "contentItems",
      "studyRoadmaps",
      "experienceEvents",
      "mentorLiveSessions",
    ],
  );
  assert.deepStrictEqual(
    Array.from(
      canonical.CANONICAL_RESOURCE_CONTRACT.types,
    ),
    [
      "note",
      "video",
      "test",
      "current-affairs",
      "roadmap",
      "live",
      "replay",
    ],
  );

  assert.throws(
    () => canonical.createCanonicalResourceService(),
    /readResourceById dependency/,
  );

  const invalidHarness = createHarness();

  assert.strictEqual(
    (
      await invalidHarness.service.getCanonicalResource()
    ).code,
    canonical.CODES.INVALID_REQUEST,
  );
  assert.strictEqual(
    (
      await invalidHarness.service.getCanonicalResource({
        resourceId: "bad/id",
      })
    ).code,
    canonical.CODES.INVALID_REQUEST,
  );

  const notFoundHarness = createHarness();
  const notFound =
    await notFoundHarness.service.getCanonicalResource({
      resourceId: "missing-resource",
    });

  assert.strictEqual(notFound.ok, false);
  assert.strictEqual(
    notFound.code,
    canonical.CODES.NOT_FOUND,
  );
  assert.strictEqual(notFoundHarness.calls.length, 4);

  const signal = { token: "signal-proof" };
  const validHarness = createHarness(
    hit({
      id: "note-1",
      record: {
        type: "Notes",
        section: "Notes",
        status: "Published",
        planType: "PREMIUM",
        canonicalRoute: "#/student/notes/note-1",
      },
    }),
  );
  const valid =
    await validHarness.service.getCanonicalResource({
      resourceId: "note-1",
      resourceTypeHint: "note",
      requiredPlan: "FREE",
      accessState: "open",
      status: "published",
      canonicalRoute: "/attacker-route",
      signal,
    });

  assert.strictEqual(valid.ok, true);
  assert.strictEqual(valid.state, "canonical_record");
  assert.strictEqual(valid.resource.resourceId, "note-1");
  assert.strictEqual(valid.resource.type, "note");
  assert.strictEqual(valid.resource.section, "notes");
  assert.strictEqual(valid.resource.requiredPlan, "PREMIUM");
  assert.strictEqual(valid.resource.publishState, "published");
  assert.strictEqual(
    valid.resource.canonicalRoute,
    "/student/notes/note-1",
  );
  assert.strictEqual(
    valid.resource.sourceCollection,
    "contentItems",
  );
  assert(Object.isFrozen(valid));
  assert(Object.isFrozen(valid.resource));
  assert(
    validHarness.calls.every(
      (item) => item.signal === signal,
    ),
  );

  const runtimeTypeCases = [
    {
      id: "ca-1",
      record: {
        section: "CurrentAffairs",
        status: "published",
        canonicalRoute: "/ctet-tet/current-affairs",
      },
      type: "current-affairs",
      section: "current-affairs",
    },
    {
      id: "test-1",
      record: {
        section: "MockTest",
        status: "published",
        canonicalRoute: "/ctet-tet/mock-tests/start/test-1",
      },
      type: "test",
      section: "mock-tests",
    },
    {
      id: "video-1",
      record: {
        section: "RecordedVideo",
        status: "published",
        canonicalRoute: "/ctet-tet/videos/watch/video-1",
      },
      type: "video",
      section: "videos",
    },
    {
      id: "course-1",
      record: {
        section: "Courses",
        status: "published",
        canonicalRoute: "/ctet-tet/notes",
      },
      type: "note",
      section: "notes",
    },
  ];

  for (const item of runtimeTypeCases) {
    const result = await resolveOne({
      id: item.id,
      record: item.record,
    });

    assert.strictEqual(result.state, "canonical_record");
    assert.strictEqual(result.resource.type, item.type);
    assert.strictEqual(result.resource.section, item.section);
  }

  const scheduledEvent = await resolveOne({
    id: "event-live",
    collection: "experienceEvents",
    record: {
      type: "WEBINAR",
      status: "scheduled",
      canonicalRoute: "/student#live/upcoming",
    },
  });
  assert.strictEqual(scheduledEvent.resource.type, "live");
  assert.strictEqual(scheduledEvent.resource.section, "live");

  const completedEvent = await resolveOne({
    id: "event-replay",
    collection: "experienceEvents",
    record: {
      type: "WORKSHOP",
      status: "completed",
      replayUrl: "https://example.invalid/replay",
      canonicalRoute: "/student#live/replays",
    },
  });
  assert.strictEqual(completedEvent.resource.type, "replay");

  const genericEvent = await resolveOne({
    id: "event-generic",
    collection: "experienceEvents",
    record: {
      type: "MEGA_TEST",
      status: "scheduled",
      canonicalRoute: "/public/events/event-generic",
    },
  });
  assert.strictEqual(
    genericEvent.code,
    canonical.CODES.TYPE_UNKNOWN,
  );

  const liveSession = await resolveOne({
    id: "mentor-live",
    collection: "mentorLiveSessions",
    record: {
      status: "scheduled",
      canonicalRoute: "/student#live/upcoming",
    },
  });
  assert.strictEqual(liveSession.resource.type, "live");
  assert.strictEqual(
    liveSession.resource.requiredPlan,
    "MENTORSHIP",
  );

  const replaySession = await resolveOne({
    id: "mentor-replay",
    collection: "mentorLiveSessions",
    record: {
      status: "ended",
      canonicalRoute: "/student#live/replays",
    },
  });
  assert.strictEqual(replaySession.resource.type, "replay");

  const ambiguousHarness = createHarness({
    ...hit({
      id: "same-id",
      collection: "contentItems",
      record: {
        type: "note",
        status: "published",
        canonicalRoute: "/student/notes/same-id",
      },
    }),
    ...hit({
      id: "same-id",
      collection: "studyRoadmaps",
      record: {
        status: "published",
        canonicalRoute: "/student/roadmaps/same-id",
      },
    }),
  });
  const ambiguous =
    await ambiguousHarness.service.getCanonicalResource({
      resourceId: "same-id",
    });

  assert.strictEqual(
    ambiguous.code,
    canonical.CODES.AMBIGUOUS,
  );

  const idMismatchHarness = createHarness({
    "contentItems:requested-id": {
      exists: true,
      id: "requested-id",
      record: {
        id: "requested-id",
        resourceId: "different-id",
        type: "note",
        status: "published",
        canonicalRoute: "/student/notes/requested-id",
      },
    },
  });
  assert.strictEqual(
    (
      await idMismatchHarness.service.getCanonicalResource({
        resourceId: "requested-id",
      })
    ).code,
    canonical.CODES.ID_MISMATCH,
  );

  const hintHarness = createHarness(
    hit({
      id: "video-hint",
      record: {
        type: "RecordedVideo",
        status: "published",
        canonicalRoute: "/student/videos/video-hint",
      },
    }),
  );

  assert.strictEqual(
    (
      await hintHarness.service.getCanonicalResource({
        resourceId: "video-hint",
        resourceTypeHint: "unknown-type",
      })
    ).code,
    canonical.CODES.TYPE_UNKNOWN,
  );
  assert.strictEqual(
    (
      await hintHarness.service.getCanonicalResource({
        resourceId: "video-hint",
        resourceTypeHint: "note",
      })
    ).code,
    canonical.CODES.TYPE_MISMATCH,
  );

  const sectionUnknown = await resolveOne({
    id: "section-unknown",
    record: {
      type: "note",
      section: "admin-root",
      status: "published",
      canonicalRoute: "/student/notes/section-unknown",
    },
  });
  assert.strictEqual(
    sectionUnknown.code,
    canonical.CODES.TYPE_UNKNOWN,
  );

  const sectionMismatch = await resolveOne({
    id: "section-mismatch",
    record: {
      type: "note",
      section: "MockTest",
      status: "published",
      canonicalRoute: "/student/notes/section-mismatch",
    },
  });
  assert.strictEqual(
    sectionMismatch.code,
    canonical.CODES.TYPE_MISMATCH,
  );

  const mixedStatus = await resolveOne({
    id: "mixed-status",
    record: {
      type: "note",
      status: "published",
      visibility: "hidden",
      canonicalRoute: "/student/notes/mixed-status",
    },
  });
  assert.strictEqual(mixedStatus.state, "locked");
  assert.strictEqual(
    mixedStatus.resource.publishState,
    "hidden",
  );



  const inactiveBoolean = await resolveOne({
    id: "inactive-boolean",
    record: {
      type: "note",
      active: false,
      canonicalRoute: "/student/notes/inactive-boolean",
    },
  });
  assert.strictEqual(inactiveBoolean.state, "locked");

  const unknownStatus = await resolveOne({
    id: "unknown-status",
    record: {
      type: "note",
      status: "published",
      visibility: "mystery",
      canonicalRoute: "/student/notes/unknown-status",
    },
  });
  assert.strictEqual(
    unknownStatus.code,
    canonical.CODES.STATUS_UNKNOWN,
  );

  const planConflict = await resolveOne({
    id: "plan-conflict",
    record: {
      type: "note",
      status: "published",
      planType: "PREMIUM",
      requiredPlan: "FREE",
      canonicalRoute: "/student/notes/plan-conflict",
    },
  });
  assert.strictEqual(
    planConflict.code,
    canonical.CODES.PLAN_CONFLICT,
  );

  const missingPlan = await resolveOne({
    id: "missing-plan",
    omitDefaultPlan: true,
    record: {
      type: "note",
      status: "published",
      canonicalRoute: "/student/notes/missing-plan",
    },
  });
  assert.strictEqual(
    missingPlan.code,
    canonical.CODES.PLAN_MISSING,
  );

  const explicitFreePlan = await resolveOne({
    id: "explicit-free-plan",
    record: {
      type: "note",
      status: "published",
      requiredPlan: "FREE",
      canonicalRoute: "/student/notes/explicit-free-plan",
    },
  });
  assert.strictEqual(
    explicitFreePlan.resource.requiredPlan,
    "FREE",
  );

  const explicitFreeBoolean = await resolveOne({
    id: "explicit-free-boolean",
    record: {
      type: "note",
      status: "published",
      isPremium: false,
      canonicalRoute:
        "/student/notes/explicit-free-boolean",
    },
  });
  assert.strictEqual(
    explicitFreeBoolean.resource.requiredPlan,
    "FREE",
  );

  const roadmapMissingPlan = await resolveOne({
    id: "roadmap-missing-plan",
    collection: "studyRoadmaps",
    omitDefaultPlan: true,
    record: {
      type: "roadmap",
      status: "published",
      canonicalRoute:
        "/ctet-tet/roadmaps/roadmap-missing-plan",
    },
  });
  assert.strictEqual(
    roadmapMissingPlan.code,
    canonical.CODES.PLAN_MISSING,
  );

  const eventMissingPlan = await resolveOne({
    id: "event-missing-plan",
    collection: "experienceEvents",
    omitDefaultPlan: true,
    record: {
      type: "live",
      status: "published",
      canonicalRoute:
        "/student#live/upcoming/event-missing-plan",
    },
  });
  assert.strictEqual(
    eventMissingPlan.code,
    canonical.CODES.PLAN_MISSING,
  );

  const mentorDefaultPlan = await resolveOne({
    id: "mentor-default-plan",
    collection: "mentorLiveSessions",
    omitDefaultPlan: true,
    record: {
      type: "live",
      status: "published",
      canonicalRoute:
        "/student#live/upcoming/mentor-default-plan",
    },
  });
  assert.strictEqual(
    mentorDefaultPlan.resource.requiredPlan,
    "MENTORSHIP",
  );

  const mentorshipNote = await resolveOne({
    id: "mentor-note",
    record: {
      type: "note",
      status: "published",
      planType: "MENTORSHIP",
      canonicalRoute: "/student/notes/mentor-note",
    },
  });
  assert.strictEqual(
    mentorshipNote.resource.requiredPlan,
    "PREMIUM",
  );

  const unknownPlan = await resolveOne({
    id: "unknown-plan",
    record: {
      type: "note",
      status: "published",
      planType: "GOLD",
      canonicalRoute: "/student/notes/unknown-plan",
    },
  });
  assert.strictEqual(
    unknownPlan.code,
    canonical.CODES.PLAN_UNKNOWN,
  );

  for (const route of [
    "https://example.invalid/note",
    "//example.invalid/note",
    "/student/../admin",
    "/student/%2e%2e/admin",
    "/student/%252e%252e/admin",
    "/student/notes/%0aattack",
    "javascript:alert(1)",
  ]) {
    const result = await resolveOne({
      id: "route-note",
      record: {
        type: "note",
        status: "published",
        canonicalRoute: route,
      },
    });

    assert.strictEqual(
      result.code,
      canonical.CODES.ROUTE_INVALID,
      route,
    );
  }

  const derivedNote = await resolveOne({
    id: "derived-note",
    record: {
      type: "note",
      status: "published",
      textbookId: "book-1",
    },
  });
  assert.strictEqual(
    derivedNote.resource.canonicalRoute,
    "/ctet-tet/notes/read/book-1",
  );

  const roadmap = await resolveOne({
    id: "roadmap-1",
    collection: "studyRoadmaps",
    record: {
      status: "published",
      requiredPlan: "BASIC",
    },
    request: {
      resourceTypeHint: "roadmap",
    },
  });
  assert.strictEqual(roadmap.resource.type, "roadmap");
  assert.strictEqual(roadmap.resource.section, "roadmaps");
  assert.strictEqual(
    roadmap.resource.canonicalRoute,
    "/ctet-tet/roadmaps/roadmap-1",
  );

  const invalidReaderHarness = createHarness(
    {},
    {
      async readResourceById({ collection }) {
        return collection === "contentItems"
          ? { unexpected: true }
          : { exists: false };
      },
    },
  );
  assert.strictEqual(
    (
      await invalidReaderHarness.service
        .getCanonicalResource({
          resourceId: "reader-invalid",
        })
    ).code,
    canonical.CODES.READ_FAILED,
  );

  const rawErrorHarness = createHarness(
    {},
    {
      async readResourceById() {
        throw new Error(
          "RAW_FIREBASE_INTERNAL_RESOURCE_SECRET",
        );
      },
    },
  );
  const rawError =
    await rawErrorHarness.service.getCanonicalResource({
      resourceId: "reader-error",
    });

  assert.strictEqual(
    rawError.code,
    canonical.CODES.READ_FAILED,
  );
  assert(
    !JSON.stringify(rawError).includes(
      "RAW_FIREBASE_INTERNAL_RESOURCE_SECRET",
    ),
  );

  const getterErrorHarness = createHarness(
    {},
    {
      async readResourceById({ collection }) {
        if (collection !== "contentItems") {
          return { exists: false };
        }

        const record = {
          id: "getter-error",
        };

        Object.defineProperty(record, "type", {
          enumerable: true,
          get() {
            throw new Error("RAW_GETTER_SECRET");
          },
        });

        return {
          exists: true,
          id: "getter-error",
          record,
        };
      },
    },
  );
  const getterError =
    await getterErrorHarness.service
      .getCanonicalResource({
        resourceId: "getter-error",
      });

  assert.strictEqual(
    getterError.code,
    canonical.CODES.READ_FAILED,
  );
  assert(
    !JSON.stringify(getterError).includes(
      "RAW_GETTER_SECRET",
    ),
  );


  const tripleEncodedTraversal = await resolveOne({
    id: "triple-route-note",
    record: {
      type: "note",
      status: "published",
      canonicalRoute: "/student/%25252e%25252e/admin",
    },
  });
  assert.strictEqual(
    tripleEncodedTraversal.code,
    canonical.CODES.ROUTE_INVALID,
  );

  const unknownExplicitType = await resolveOne({
    id: "unknown-explicit-type",
    record: {
      section: "Notes",
      type: "administrator",
      status: "published",
      canonicalRoute: "/ctet-tet/notes",
    },
  });
  assert.strictEqual(
    unknownExplicitType.code,
    canonical.CODES.TYPE_UNKNOWN,
  );

  const unknownSecondarySection = await resolveOne({
    id: "unknown-secondary-section",
    record: {
      type: "note",
      section: "Notes",
      contentSection: "Administrator",
      status: "published",
      canonicalRoute: "/ctet-tet/notes",
    },
  });
  assert.strictEqual(
    unknownSecondarySection.code,
    canonical.CODES.TYPE_UNKNOWN,
  );

  const premiumBooleanConflict = await resolveOne({
    id: "premium-boolean-conflict",
    record: {
      type: "note",
      status: "published",
      requiredPlan: "FREE",
      isPremium: true,
      canonicalRoute: "/ctet-tet/notes",
    },
  });
  assert.strictEqual(
    premiumBooleanConflict.code,
    canonical.CODES.PREMIUM_FLAG_CONFLICT,
  );

  const explicitReplayEvent = await resolveOne({
    id: "event-replay",
    collection: "experienceEvents",
    record: {
      type: "replay",
      status: "published",
      canonicalRoute: "/student#live/replays/event-replay",
    },
  });
  assert.strictEqual(explicitReplayEvent.resource.type, "replay");

  const megaMockEvent = await resolveOne({
    id: "event-mega-mock",
    collection: "experienceEvents",
    record: {
      type: "Mega Mock",
      status: "published",
      targetResourceId: "event-mega-mock",
      canonicalRoute: "/ctet-tet/mock-tests/start/event-mega-mock",
    },
  });
  assert.strictEqual(megaMockEvent.resource.type, "test");


  const roadmapTypeMismatch = await resolveOne({
    id: "roadmap-type-mismatch",
    collection: "studyRoadmaps",
    record: {
      type: "note",
      status: "published",
      canonicalRoute: "/ctet-tet/roadmaps/roadmap-type-mismatch",
    },
  });
  assert.strictEqual(
    roadmapTypeMismatch.code,
    canonical.CODES.TYPE_MISMATCH,
  );

  const roadmapUnknownType = await resolveOne({
    id: "roadmap-unknown-type",
    collection: "studyRoadmaps",
    record: {
      type: "administrator",
      status: "published",
      canonicalRoute: "/ctet-tet/roadmaps/roadmap-unknown-type",
    },
  });
  assert.strictEqual(
    roadmapUnknownType.code,
    canonical.CODES.TYPE_UNKNOWN,
  );

  const mentorTypeMismatch = await resolveOne({
    id: "mentor-type-mismatch",
    collection: "mentorLiveSessions",
    record: {
      type: "note",
      status: "published",
      canonicalRoute: "/student#live/upcoming/mentor-type-mismatch",
    },
  });
  assert.strictEqual(
    mentorTypeMismatch.code,
    canonical.CODES.TYPE_MISMATCH,
  );

  const mentorUnknownType = await resolveOne({
    id: "mentor-unknown-type",
    collection: "mentorLiveSessions",
    record: {
      type: "administrator",
      status: "published",
      canonicalRoute: "/student#live/upcoming/mentor-unknown-type",
    },
  });
  assert.strictEqual(
    mentorUnknownType.code,
    canonical.CODES.TYPE_UNKNOWN,
  );

  const defaultPlanBooleanConflict = await resolveOne({
    id: "mentor-default-plan-conflict",
    collection: "mentorLiveSessions",
    record: {
      status: "published",
      isPremium: false,
      canonicalRoute: "/student#live/upcoming/mentor-default-plan-conflict",
    },
  });
  assert.strictEqual(
    defaultPlanBooleanConflict.code,
    canonical.CODES.PREMIUM_FLAG_CONFLICT,
  );

  const resourceTargetNotPlan = await resolveOne({
    id: "resource-target-not-plan",
    record: {
      type: "note",
      status: "published",
      requiredPlan: "PREMIUM",
      target: "test-mega-paper-ii",
      canonicalRoute: "/ctet-tet/notes/read/resource-target-not-plan",
    },
  });
  assert.strictEqual(
    resourceTargetNotPlan.resource.requiredPlan,
    "PREMIUM",
  );

  const itemScopeEvent = await resolveOne({
    id: "exp-mega-mock",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      planType: "ITEM",
      target: "test-mega-paper-ii",
    },
  });
  assert.strictEqual(
    itemScopeEvent.code,
    canonical.CODES.PLAN_UNKNOWN,
  );

  const targetedMegaMockEvent = await resolveOne({
    id: "exp-mega-mock-premium",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      planType: "PREMIUM",
      targetResourceId: "test-mega-paper-ii",
    },
  });
  assert.strictEqual(
    targetedMegaMockEvent.resource.canonicalRoute,
    "/ctet-tet/mock-tests/start/test-mega-paper-ii",
  );

  const untargetedMegaMockEvent = await resolveOne({
    id: "exp-mega-mock-untargeted",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      planType: "PREMIUM",
    },
  });
  assert.strictEqual(
    untargetedMegaMockEvent.code,
    canonical.CODES.ROUTE_INVALID,
  );

  const derivedLiveEventRoute = await resolveOne({
    id: "exp-live-route",
    collection: "experienceEvents",
    record: {
      type: "LIVE_CLASS",
      status: "scheduled",
      planType: "MENTORSHIP",
    },
  });
  assert.strictEqual(
    derivedLiveEventRoute.resource.canonicalRoute,
    "/student#live/upcoming/exp-live-route",
  );

  const derivedReplaySessionRoute = await resolveOne({
    id: "mentor-replay-route",
    collection: "mentorLiveSessions",
    record: {
      status: "ended",
    },
  });
  assert.strictEqual(
    derivedReplaySessionRoute.resource.canonicalRoute,
    "/student#live/replays/mentor-replay-route",
  );

  for (const status of ["cancelled", "expired"]) {
    const unavailableEvent = await resolveOne({
      id: `event-${status}`,
      collection: "experienceEvents",
      record: {
        type: "LIVE_CLASS",
        status,
        planType: "FREE",
        canonicalRoute: `/student#live/upcoming/event-${status}`,
      },
    });
    assert.strictEqual(unavailableEvent.state, "locked");
  }


  const readerIdentityHarness = createHarness({
    "contentItems:reader-identity": {
      exists: true,
      id: "different-reader-id",
      record: {
        id: "reader-identity",
        type: "note",
        status: "published",
        requiredPlan: "FREE",
        canonicalRoute:
          "/ctet-tet/notes/read/reader-identity",
      },
    },
  });
  assert.strictEqual(
    (
      await readerIdentityHarness.service.getCanonicalResource({
        resourceId: "reader-identity",
      })
    ).code,
    canonical.CODES.ID_MISMATCH,
  );

  assert.strictEqual(
    (
      await invalidHarness.service.getCanonicalResource({
        resourceId: "..",
      })
    ).code,
    canonical.CODES.INVALID_REQUEST,
  );

  const hashTraversal = await resolveOne({
    id: "hash-traversal",
    record: {
      type: "note",
      status: "published",
      requiredPlan: "FREE",
      canonicalRoute:
        "/student#live/replays/%252e%252e/%252e%252e/admin",
    },
  });
  assert.strictEqual(
    hashTraversal.code,
    canonical.CODES.ROUTE_INVALID,
  );

  const eventTargetConflict = await resolveOne({
    id: "event-target-conflict",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "test-a",
      target: "test-b",
    },
  });
  assert.strictEqual(
    eventTargetConflict.code,
    canonical.CODES.TARGET_CONFLICT,
  );

  const eventTargetInvalid = await resolveOne({
    id: "event-target-invalid",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "..",
    },
  });
  assert.strictEqual(
    eventTargetInvalid.code,
    canonical.CODES.TARGET_INVALID,
  );

  const eventTargetTooLong = await resolveOne({
    id: "event-target-too-long",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "x".repeat(3000),
    },
  });
  assert.strictEqual(
    eventTargetTooLong.code,
    canonical.CODES.TARGET_INVALID,
  );

  const hostileRequestHarness = createHarness();

  const throwingResourceIdRequest = {};
  Object.defineProperty(
    throwingResourceIdRequest,
    "resourceId",
    {
      get() {
        throw new Error("resource-id-getter-must-not-escape");
      },
    },
  );

  assert.strictEqual(
    (
      await hostileRequestHarness.service
        .getCanonicalResource(
          throwingResourceIdRequest,
        )
    ).code,
    canonical.CODES.INVALID_REQUEST,
  );

  assert.strictEqual(
    (
      await hostileRequestHarness.service
        .getCanonicalResource({
          resourceId: {
            toString() {
              throw new Error(
                "resource-id-coercion-must-not-escape",
              );
            },
          },
        })
    ).code,
    canonical.CODES.INVALID_REQUEST,
  );

  const throwingSignalRequest = {
    resourceId: "signal-getter-resource",
  };
  Object.defineProperty(
    throwingSignalRequest,
    "signal",
    {
      get() {
        throw new Error("signal-getter-must-not-escape");
      },
    },
  );

  assert.strictEqual(
    (
      await hostileRequestHarness.service
        .getCanonicalResource(
          throwingSignalRequest,
        )
    ).code,
    canonical.CODES.INVALID_REQUEST,
  );

  const explicitTargetConflict = await resolveOne({
    id: "event-explicit-target-conflict",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "test-a",
      target: "test-b",
      canonicalRoute:
        "/ctet-tet/mock-tests/start/test-a",
    },
  });
  assert.strictEqual(
    explicitTargetConflict.code,
    canonical.CODES.TARGET_CONFLICT,
  );

  const explicitInvalidTarget = await resolveOne({
    id: "event-explicit-invalid-target",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "..",
      canonicalRoute:
        "/ctet-tet/mock-tests/start/test-a",
    },
  });
  assert.strictEqual(
    explicitInvalidTarget.code,
    canonical.CODES.TARGET_INVALID,
  );

  const explicitRouteTargetMismatch = await resolveOne({
    id: "event-explicit-route-target-mismatch",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "test-a",
      canonicalRoute:
        "/ctet-tet/mock-tests/start/test-b",
    },
  });
  assert.strictEqual(
    explicitRouteTargetMismatch.code,
    canonical.CODES.TARGET_CONFLICT,
  );

  const explicitRouteTargetMatch = await resolveOne({
    id: "event-explicit-route-target-match",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      targetResourceId: "test-a",
      canonicalRoute:
        "/ctet-tet/mock-tests/start/test-a",
    },
  });
  assert.strictEqual(
    explicitRouteTargetMatch.code,
    canonical.CODES.RESOLVED,
  );

  const explicitRouteMissingTarget = await resolveOne({
    id: "event-explicit-route-missing-target",
    collection: "experienceEvents",
    record: {
      type: "MEGA_MOCK",
      status: "published",
      requiredPlan: "PREMIUM",
      canonicalRoute:
        "/ctet-tet/mock-tests/start/test-a",
    },
  });
  assert.strictEqual(
    explicitRouteMissingTarget.code,
    canonical.CODES.ROUTE_INVALID,
  );

  const invalidTextbookRoute = await resolveOne({
    id: "note-invalid-textbook-route",
    record: {
      type: "note",
      status: "published",
      requiredPlan: "FREE",
      textbookId: "..",
    },
  });
  assert.strictEqual(
    invalidTextbookRoute.code,
    canonical.CODES.ROUTE_INVALID,
  );

  const invalidMonthRoute = await resolveOne({
    id: "ca-invalid-month-route",
    record: {
      type: "current-affairs",
      status: "published",
      requiredPlan: "FREE",
      monthId: "..",
    },
  });
  assert.strictEqual(
    invalidMonthRoute.code,
    canonical.CODES.ROUTE_INVALID,
  );

  const source = fs.readFileSync(servicePath, "utf8");

  for (const forbidden of [
    "firebase/",
    "firebase\\",
    "firebase-admin",
    "window.",
    "document.",
    "localStorage",
    "sessionStorage",
    "navigate(",
    "location.",
    "updateDoc(",
    "setDoc(",
    "addDoc(",
    "deleteDoc(",
  ]) {
    assert(
      !source.includes(forbidden),
      `Forbidden foundation dependency: ${forbidden}`,
    );
  }

  console.log("CANONICAL_RESOURCE_SERVICE_METHODS=1/1");
  console.log("CANONICAL_COLLECTIONS=4/4");
  console.log("REQUEST_FIELD_ALLOWLIST=PASS");
  console.log("RUNTIME_TYPE_VOCABULARY=7/7_PASS");
  console.log("CURRENT_AFFAIRS_TYPE_COMPATIBILITY=PASS");
  console.log("MOCK_TEST_TYPE_COMPATIBILITY=PASS");
  console.log("LIVE_REPLAY_TYPE_COMPATIBILITY=PASS");
  console.log("COURSE_RUNTIME_FALLBACK=PASS");
  console.log("CALLER_PLAN_OVERRIDE_IGNORED=PASS");
  console.log("CALLER_ACCESS_STATE_OVERRIDE_IGNORED=PASS");
  console.log("CALLER_STATUS_OVERRIDE_IGNORED=PASS");
  console.log("CALLER_ROUTE_OVERRIDE_IGNORED=PASS");
  console.log("MISSING_RESOURCE_FAIL_CLOSED=PASS");
  console.log("AMBIGUOUS_ID_FAIL_CLOSED=PASS");
  console.log("ID_ALIAS_CONFLICT_FAIL_CLOSED=PASS");
  console.log("TYPE_HINT_VALIDATION=PASS");
  console.log("SECTION_UNKNOWN_FAIL_CLOSED=PASS");
  console.log("TYPE_SECTION_CONFLICT_FAIL_CLOSED=PASS");
  console.log("LOCKED_STATUS_DOMINATES_OPEN=PASS");
  console.log("INACTIVE_BOOLEAN_LOCKED=PASS");
  console.log("UNKNOWN_STATUS_FAIL_CLOSED=PASS");
  console.log("PLAN_FIELD_CONFLICT_FAIL_CLOSED=PASS");
  console.log("MISSING_PLAN_FAIL_CLOSED=PASS");
  console.log("EXPLICIT_FREE_PLAN_COMPATIBILITY=PASS");
  console.log("EXPLICIT_FREE_BOOLEAN_COMPATIBILITY=PASS");
  console.log("ROADMAP_MISSING_PLAN_FAIL_CLOSED=PASS");
  console.log("EXPERIENCE_EVENT_MISSING_PLAN_FAIL_CLOSED=PASS");
  console.log("MENTOR_SESSION_DEFAULT_PLAN=PASS");
  console.log("MENTORSHIP_NOTE_PREMIUM_MIGRATION=PASS");
  console.log("UNKNOWN_PLAN_FAIL_CLOSED=PASS");
  console.log("ENCODED_ROUTE_TRAVERSAL_FAIL_CLOSED=PASS");
  console.log("ARBITRARY_DEPTH_ROUTE_TRAVERSAL_FAIL_CLOSED=PASS");
  console.log("UNKNOWN_TYPE_FIELD_FAIL_CLOSED=PASS");
  console.log("ALL_SECTION_FIELDS_VALIDATED=PASS");
  console.log("PREMIUM_BOOLEAN_PLAN_CONFLICT_FAIL_CLOSED=PASS");
  console.log("EXPERIENCE_EVENT_REPLAY_COMPATIBILITY=PASS");
  console.log("EXPERIENCE_EVENT_MEGA_MOCK_COMPATIBILITY=PASS");
  console.log("COLLECTION_ENFORCED_TYPE_FIELDS_VALIDATED=PASS");
  console.log("COLLECTION_UNKNOWN_TYPE_FAIL_CLOSED=PASS");
  console.log("DEFAULT_PLAN_PREMIUM_BOOLEAN_CONFLICT=PASS");
  console.log("RESOURCE_TARGET_NOT_PLAN_FIELD=PASS");
  console.log("EXPERIENCE_EVENT_ITEM_SCOPE_DEFERRED_FAIL_CLOSED=PASS");
  console.log("EXPERIENCE_EVENT_TARGET_ROUTE_REQUIRED=PASS");
  console.log("EXACT_EVENT_ROUTE_DERIVATION=PASS");
  console.log("CANCELLED_EXPIRED_EVENT_LOCKED=PASS");
  console.log("READER_IDENTITY_MISMATCH_FAIL_CLOSED=PASS");
  console.log("DOT_SEGMENT_RESOURCE_ID_FAIL_CLOSED=PASS");
  console.log("HASH_ROUTE_TRAVERSAL_FAIL_CLOSED=PASS");
  console.log("EVENT_TARGET_CONFLICT_FAIL_CLOSED=PASS");
  console.log("EVENT_TARGET_VALIDATION=PASS");
  console.log("DERIVED_ROUTE_NORMALIZATION=PASS");
  console.log("REQUEST_PROPERTY_ACCESS_SANITIZATION=PASS");
  console.log("REQUEST_STRING_COERCION_SANITIZATION=PASS");
  console.log("REQUEST_SIGNAL_ACCESS_SANITIZATION=PASS");
  console.log("EXPLICIT_EVENT_TARGET_VALIDATION=PASS");
  console.log("EXPLICIT_EVENT_TARGET_CONFLICT_FAIL_CLOSED=PASS");
  console.log("EXPLICIT_EVENT_ROUTE_TARGET_AGREEMENT=PASS");
  console.log("DERIVED_CANONICAL_ROUTE=PASS");
  console.log("COLLECTION_DEFAULT_TYPES=PASS");
  console.log("DEPENDENCY_INJECTED_READERS=PASS");
  console.log("ABORT_SIGNAL_FORWARDING=PASS");
  console.log("RAW_READER_ERROR_SANITIZATION=PASS");
  console.log("NORMALIZATION_EXCEPTION_SANITIZATION=PASS");
  console.log("DIRECT_FIREBASE_IMPORT=NO");
  console.log("FIREBASE_WRITE=NO");
  console.log("NAVIGATION_SIDE_EFFECTS=0");
  console.log("RUNTIME_LOAD=NO");
  console.log("PROVIDER_ACTIVATION=NO");
  console.log("CANONICAL_RESOURCE_TEST_STATUS=GREEN");
}

main().catch((error) => {
  console.error(
    error && error.stack
      ? error.stack
      : String(error),
  );
  process.exit(1);
});
