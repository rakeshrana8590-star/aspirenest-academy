"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  HttpsError,
} = require("firebase-functions/v2/https");
const {
  buildMockTestServerTimeResponse,
  buildMockTestLeaderboardProjection,
  buildPrivateLeaderboardId,
  buildPublicLeaderboardId,
  buildPublicLeaderboardName,
  loadOwnedSubmittedMockResult,
  shouldReplaceMockTestLeaderboardEntry,
  normalizeNotesAssetResolverRequest,
  isNotesEntitlementActive,
  notesEntitlementMatchesResource,
  resolveNotesEntitlementEvidence,
  pickNotesProtectedAssetUrl,
  loadNotesEntitlements,
  resolveNotesProtectedAsset,
} = require("./index.js").__test;

const SERVER_TIME_AUTH = {
  uid: "student-1",
};

const AUTH = {
  uid: "student-1",
  token: {
    email: "student@example.com",
    name: "Rakesh Rana",
  },
};

const LEADERBOARD_DATA = {
  testId: "mock-1",
  testTitle: "CTET Mega Mock",
  leaderboardMode: "liveLeaderboard",
  studentEmail: "forged@example.com",
  email: "forged@example.com",
  uid: "forged-uid",
  studentName: "Forged Name",
  subject: "CDP",
  chapter: "Learning",
  planType: "PREMIUM",
  examType: "CTET",
  testType: "Full",
  score: 42,
  totalMarks: 50,
  percentage: 84,
  accuracy: 88,
  correctCount: 42,
  wrongCount: 5,
  skippedCount: 3,
  totalQuestions: 50,
  durationSeconds: 1200,
  attemptId: "attempt-1",
  attemptStartedAt: 1000,
  attemptSubmittedAt: 2000,
  attemptNumber: 1,
  answers: {
    question1: "A",
  },
  correctAnswer: "A",
};

test("returns the minimal authenticated server-time response", () => {
  const result =
    buildMockTestServerTimeResponse({
      auth: SERVER_TIME_AUTH,
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-1",
      },
      now: () => 123456,
      makeRequestId: () => "clock-1",
    });

  assert.deepEqual(result, {
    source: "server",
    serverNowMs: 123456,
    requestId: "clock-1",
    authenticated: true,
    uid: "student-1",
  });
  assert.equal(
    Object.isFrozen(result),
    true
  );
});

test("rejects an unauthenticated server-time request", () => {
  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        data: {
          purpose: "mock_test_attempt",
          testId: "mock-1",
        },
      }),
    (error) =>
      error instanceof HttpsError &&
      error.code === "unauthenticated"
  );
});

test("rejects unsupported purpose and missing test id", () => {
  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: SERVER_TIME_AUTH,
        data: {
          purpose: "other",
          testId: "mock-1",
        },
      }),
    (error) =>
      error.code ===
      "invalid-argument"
  );

  assert.throws(
    () =>
      buildMockTestServerTimeResponse({
        auth: SERVER_TIME_AUTH,
        data: {
          purpose: "mock_test_submit",
          testId: "",
        },
      }),
    (error) =>
      error.code ===
      "invalid-argument"
  );
});

test("never accepts a client supplied timestamp", () => {
  const result =
    buildMockTestServerTimeResponse({
      auth: SERVER_TIME_AUTH,
      data: {
        purpose: "mock_test_attempt",
        testId: "mock-1",
        serverNowMs: 1,
      },
      now: () => 999999,
      makeRequestId: () => "clock-2",
    });

  assert.equal(
    result.serverNowMs,
    999999
  );
});

test("builds separate private and public-safe leaderboard records", () => {
  const projection =
    buildMockTestLeaderboardProjection({
      auth: AUTH,
      data: LEADERBOARD_DATA,
      now: () => 123456789,
    });

  assert.equal(
    projection.privateRecord.ownerUid,
    AUTH.uid
  );
  assert.equal(
    projection.privateRecord.ownerEmail,
    AUTH.token.email
  );
  assert.equal(
    projection.privateRecord.studentEmail,
    AUTH.token.email
  );
  assert.equal(
    projection.privateRecord.studentName,
    AUTH.token.name
  );
  assert.equal(
    projection.publicRecord.displayName,
    "Rakesh R."
  );
  assert.equal(
    projection.publicRecord.testId,
    "mock-1"
  );
  assert.equal(
    projection.publicRecord.score,
    42
  );
  assert.equal(
    projection.publicRecord.publicEntryId,
    projection.publicEntryId
  );

  [
    "uid",
    "ownerUid",
    "email",
    "ownerEmail",
    "studentEmail",
    "studentName",
    "attemptId",
    "attemptStartedAt",
    "attemptSubmittedAt",
    "answers",
    "correctAnswer",
    "leaderboardKey",
    "privateEntryId",
  ].forEach((field) => {
    assert.equal(
      Object.hasOwn(
        projection.publicRecord,
        field
      ),
      false,
      `Public projection exposed ${field}`
    );
  });

  assert.equal(
    Object.isFrozen(
      projection.privateRecord
    ),
    true
  );
  assert.equal(
    Object.isFrozen(
      projection.publicRecord
    ),
    true
  );
});

test("derives deterministic opaque private and public document ids", () => {
  const input = {
    uid: "student-1",
    testId: "mock-1",
    leaderboardMode: "liveleaderboard",
  };

  const privateId =
    buildPrivateLeaderboardId(input);
  const publicId =
    buildPublicLeaderboardId(input);

  assert.match(
    privateId,
    /^[a-f0-9]{64}$/
  );
  assert.match(
    publicId,
    /^[a-f0-9]{64}$/
  );
  assert.notEqual(
    privateId,
    publicId
  );
  assert.equal(
    buildPrivateLeaderboardId(input),
    privateId
  );
  assert.equal(
    buildPublicLeaderboardId(input),
    publicId
  );
});

test("masks public names at the server boundary", () => {
  assert.equal(
    buildPublicLeaderboardName(
      "Rakesh Rana"
    ),
    "Rakesh R."
  );
  assert.equal(
    buildPublicLeaderboardName(
      "student@example.com"
    ),
    "st***"
  );
  assert.equal(
    buildPublicLeaderboardName(
      "LongStudentName"
    ),
    "LongSt…"
  );
});

test("rejects unauthenticated and disabled leaderboard submissions", () => {
  assert.throws(
    () =>
      buildMockTestLeaderboardProjection({
        data: LEADERBOARD_DATA,
      }),
    (error) =>
      error.code ===
      "unauthenticated"
  );

  assert.throws(
    () =>
      buildMockTestLeaderboardProjection({
        auth: AUTH,
        data: {
          ...LEADERBOARD_DATA,
          leaderboardMode: "disabled",
        },
      }),
    (error) =>
      error.code ===
      "failed-precondition"
  );
});

test("replaces only the same attempt or a better ranked result", () => {
  const existing = {
    attemptId: "attempt-1",
    rankScore: 80,
    rankTieBreakerScore: 40,
  };

  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-1",
        rankScore: 70,
        rankTieBreakerScore: 35,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 81,
        rankTieBreakerScore: 39,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 80,
        rankTieBreakerScore: 41,
      }
    ),
    true
  );
  assert.equal(
    shouldReplaceMockTestLeaderboardEntry(
      existing,
      {
        attemptId: "attempt-2",
        rankScore: 79,
        rankTieBreakerScore: 100,
      }
    ),
    false
  );
});


test("requires an owned submitted result before projection writes", async () => {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({
      docs: [
        {
          id: "result-1",
          data: () => ({
            attemptKey:
              "attempt-1",
            attemptId:
              "attempt-1",
            testId: "mock-1",
            email:
              "student@example.com",
            score: 42,
          }),
        },
      ],
    }),
  };
  const firestore = {
    collection: (name) => {
      assert.equal(
        name,
        "mockResults"
      );
      return queryChain;
    },
  };

  const owned =
    await loadOwnedSubmittedMockResult({
      auth: AUTH,
      data: LEADERBOARD_DATA,
      firestore,
    });

  assert.equal(
    owned.uid,
    "student-1"
  );
  assert.equal(
    owned.result.id,
    "result-1"
  );
  assert.equal(
    owned.result.score,
    42
  );
});

test("fails closed when no owned submitted result matches", async () => {
  const queryChain = {
    where: () => queryChain,
    limit: () => queryChain,
    get: async () => ({
      docs: [],
    }),
  };
  const firestore = {
    collection: () => queryChain,
  };

  await assert.rejects(
    () =>
      loadOwnedSubmittedMockResult({
        auth: AUTH,
        data: LEADERBOARD_DATA,
        firestore,
      }),
    (error) =>
      error.code ===
      "failed-precondition"
  );
});

const NOTES_AUTH = {
  uid: "student-notes-1",
  token: {
    email: "notes@example.com",
    name: "Notes Learner",
  },
};

const NOTES_NOW = 1_800_000_000_000;

const PUBLISHED_NOTE = Object.freeze({
  id: "note-1",
  section: "notes",
  module: "notes",
  itemType: "notesPdf",
  planType: "PREMIUM",
  accessRank: 2,
  status: "Published",
  hasProtectedAsset: true,
});

const PUBLISHED_ASSET = Object.freeze({
  id: "note-1",
  contentId: "note-1",
  section: "notes",
  status: "published",
  urls: {
    pdfUrl:
      "https://assets.example.com/note-1.pdf",
    downloadUrl:
      "https://assets.example.com/note-1-download.pdf",
  },
});

const buildNotesEntitlement = (
  overrides = {}
) => ({
  id: "item-notes-note-1",
  uid: NOTES_AUTH.uid,
  email: NOTES_AUTH.token.email,
  normalizedEmail:
    NOTES_AUTH.token.email,
  status: "active",
  scopeType: "item",
  module: "notes",
  itemType: "notesPdf",
  itemId: "note-1",
  itemIds: [],
  planType: "PREMIUM",
  planCode: "PREMIUM",
  accessRank: 2,
  accessFrom: NOTES_NOW - 10_000,
  accessUntil: NOTES_NOW + 10_000,
  ...overrides,
});

const createDocumentSnapshot = (
  id,
  value
) => ({
  id,
  exists: Boolean(value),
  data: () => value || undefined,
});

const createNotesFirestore = ({
  note = PUBLISHED_NOTE,
  asset = PUBLISHED_ASSET,
  entitlements = [
    buildNotesEntitlement(),
  ],
  reads = [],
} = {}) => ({
  collection: (name) => {
    reads.push(["collection", name]);

    if (name === "contentItems") {
      return {
        doc: (id) => ({
          get: async () => {
            reads.push([
              "document",
              name,
              id,
            ]);
            return createDocumentSnapshot(
              id,
              note
            );
          },
        }),
      };
    }

    if (name === "protectedContentAssets") {
      return {
        doc: (id) => ({
          get: async () => {
            reads.push([
              "document",
              name,
              id,
            ]);
            return createDocumentSnapshot(
              id,
              asset
            );
          },
        }),
      };
    }

    if (name === "studentEntitlements") {
      return {
        doc: (uid) => ({
          collection: (childName) => ({
            get: async () => {
              reads.push([
                "subcollection",
                name,
                uid,
                childName,
              ]);
              return {
                docs: entitlements.map(
                  (record, index) => ({
                    id:
                      record.id ||
                      `entitlement-${index + 1}`,
                    data: () => record,
                  })
                ),
              };
            },
          }),
        }),
      };
    }

    throw new Error(
      `Unexpected collection ${name}`
    );
  },
});

test("normalizes the minimal authenticated Notes asset request", () => {
  const request =
    normalizeNotesAssetResolverRequest({
      auth: NOTES_AUTH,
      data: {
        noteId: " note-1 ",
        action: " download ",
        pdfUrl:
          "https://forged.example/file.pdf",
        planType: "MENTORSHIP",
        entitlementId: "forged",
      },
    });

  assert.deepEqual(request, {
    uid: NOTES_AUTH.uid,
    email: NOTES_AUTH.token.email,
    tokenName: "Notes Learner",
    noteId: "note-1",
    action: "DOWNLOAD",
  });
  assert.equal(
    Object.hasOwn(request, "pdfUrl"),
    false
  );
  assert.equal(Object.isFrozen(request), true);
});

test("rejects unauthenticated, missing, and unsupported Notes asset requests", () => {
  assert.throws(
    () =>
      normalizeNotesAssetResolverRequest({
        data: {
          noteId: "note-1",
          action: "OPEN",
        },
      }),
    (error) =>
      error.code === "unauthenticated"
  );

  assert.throws(
    () =>
      normalizeNotesAssetResolverRequest({
        auth: NOTES_AUTH,
        data: {
          noteId: "",
          action: "OPEN",
        },
      }),
    (error) =>
      error.code === "invalid-argument"
  );

  assert.throws(
    () =>
      normalizeNotesAssetResolverRequest({
        auth: NOTES_AUTH,
        data: {
          noteId: "note-1",
          action: "DELETE",
        },
      }),
    (error) =>
      error.code === "invalid-argument"
  );
});

test("accepts only active principal-bound entitlement windows", () => {
  assert.equal(
    isNotesEntitlementActive(
      buildNotesEntitlement(),
      {
        uid: NOTES_AUTH.uid,
        email: NOTES_AUTH.token.email,
        nowMs: NOTES_NOW,
      }
    ),
    true
  );

  assert.equal(
    isNotesEntitlementActive(
      buildNotesEntitlement({
        status: "verified",
        accessUntil: null,
      }),
      {
        uid: NOTES_AUTH.uid,
        email: NOTES_AUTH.token.email,
        nowMs: NOTES_NOW,
      }
    ),
    true
  );
});

test("fails closed for blocked, future, expired, malformed, or cross-user entitlements", () => {
  const options = {
    uid: NOTES_AUTH.uid,
    email: NOTES_AUTH.token.email,
    nowMs: NOTES_NOW,
  };

  [
    buildNotesEntitlement({
      status: "blocked",
    }),
    buildNotesEntitlement({
      accessFrom: NOTES_NOW + 1,
    }),
    buildNotesEntitlement({
      accessUntil: NOTES_NOW - 1,
    }),
    buildNotesEntitlement({
      accessUntil: "not-a-date",
    }),
    buildNotesEntitlement({
      uid: "student-other",
    }),
    buildNotesEntitlement({
      email: "other@example.com",
      normalizedEmail:
        "other@example.com",
    }),
  ].forEach((record) => {
    assert.equal(
      isNotesEntitlementActive(
        record,
        options
      ),
      false
    );
  });
});

test("matches only the exact Notes ITEM resource", () => {
  assert.equal(
    notesEntitlementMatchesResource({
      record: buildNotesEntitlement(),
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );

  assert.equal(
    notesEntitlementMatchesResource({
      record: buildNotesEntitlement({
        itemId: "note-2",
      }),
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
});

test("matches BUNDLE access only when the bundle contains the note", () => {
  const bundle = buildNotesEntitlement({
    scopeType: "bundle",
    itemId: "",
    itemIds: ["note-1", "note-2"],
    bundleId: "bundle-1",
  });

  assert.equal(
    notesEntitlementMatchesResource({
      record: bundle,
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );

  assert.equal(
    notesEntitlementMatchesResource({
      record: {
        ...bundle,
        itemIds: ["note-2"],
      },
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
});

test("requires sufficient plan rank for MODULE and PLAN access", () => {
  const moduleAccess =
    buildNotesEntitlement({
      scopeType: "module",
      itemId: "",
      accessRank: 2,
    });
  const planAccess =
    buildNotesEntitlement({
      scopeType: "plan",
      module: "",
      itemId: "",
      accessRank: 3,
    });

  assert.equal(
    notesEntitlementMatchesResource({
      record: moduleAccess,
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );
  assert.equal(
    notesEntitlementMatchesResource({
      record: planAccess,
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    true
  );

  assert.equal(
    notesEntitlementMatchesResource({
      record: {
        ...moduleAccess,
        accessRank: 1,
      },
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
  assert.equal(
    notesEntitlementMatchesResource({
      record: {
        ...planAccess,
        accessRank: 1,
      },
      note: PUBLISHED_NOTE,
      noteId: "note-1",
    }),
    false
  );
});

test("resolves FREE Notes without an entitlement", () => {
  const evidence =
    resolveNotesEntitlementEvidence({
      note: {
        ...PUBLISHED_NOTE,
        planType: "FREE",
        accessRank: 0,
      },
      noteId: "note-1",
      entitlements: [],
      uid: NOTES_AUTH.uid,
      email: NOTES_AUTH.token.email,
      nowMs: NOTES_NOW,
    });

  assert.deepEqual(evidence, {
    allowed: true,
    scopeType: "free",
    entitlementId: null,
  });
});

test("prioritizes ITEM over BUNDLE, MODULE, and PLAN evidence", () => {
  const evidence =
    resolveNotesEntitlementEvidence({
      note: PUBLISHED_NOTE,
      noteId: "note-1",
      entitlements: [
        buildNotesEntitlement({
          id: "plan-premium",
          scopeType: "plan",
          module: "",
          itemId: "",
        }),
        buildNotesEntitlement({
          id: "module-notes",
          scopeType: "module",
          itemId: "",
        }),
        buildNotesEntitlement({
          id: "bundle-notes",
          scopeType: "bundle",
          itemId: "",
          itemIds: ["note-1"],
        }),
        buildNotesEntitlement({
          id: "item-note-1",
        }),
      ],
      uid: NOTES_AUTH.uid,
      email: NOTES_AUTH.token.email,
      nowMs: NOTES_NOW,
    });

  assert.equal(evidence.allowed, true);
  assert.equal(evidence.scopeType, "item");
  assert.equal(
    evidence.entitlementId,
    "item-note-1"
  );
});

test("denies when no active entitlement matches the note", () => {
  const evidence =
    resolveNotesEntitlementEvidence({
      note: PUBLISHED_NOTE,
      noteId: "note-1",
      entitlements: [
        buildNotesEntitlement({
          itemId: "note-2",
        }),
        buildNotesEntitlement({
          status: "expired",
        }),
      ],
      uid: NOTES_AUTH.uid,
      email: NOTES_AUTH.token.email,
      nowMs: NOTES_NOW,
    });

  assert.deepEqual(evidence, {
    allowed: false,
    scopeType: "",
    entitlementId: null,
  });
});

test("selects action-aware HTTPS URLs from the protected asset only", () => {
  assert.equal(
    pickNotesProtectedAssetUrl({
      asset: PUBLISHED_ASSET,
      action: "OPEN",
    }),
    PUBLISHED_ASSET.urls.pdfUrl
  );
  assert.equal(
    pickNotesProtectedAssetUrl({
      asset: PUBLISHED_ASSET,
      action: "DOWNLOAD",
    }),
    PUBLISHED_ASSET.urls.downloadUrl
  );
  assert.equal(
    pickNotesProtectedAssetUrl({
      asset: {
        pdfUrl:
          "https://top-level.invalid/file.pdf",
        urls: {
          pdfUrl:
            "http://insecure.invalid/file.pdf",
        },
      },
      action: "OPEN",
    }),
    ""
  );
});

test("loads entitlement projections only from the authenticated UID path", async () => {
  const reads = [];
  const firestore = createNotesFirestore({
    reads,
  });

  const records = await loadNotesEntitlements({
    firestore,
    uid: NOTES_AUTH.uid,
  });

  assert.equal(records.length, 1);
  assert.equal(
    records[0].itemId,
    "note-1"
  );
  assert.deepEqual(
    reads.find(
      (entry) =>
        entry[0] === "subcollection"
    ),
    [
      "subcollection",
      "studentEntitlements",
      NOTES_AUTH.uid,
      "items",
    ]
  );
});

test("resolves an exact ITEM grant with a minimal server-authorized response", async () => {
  const result =
    await resolveNotesProtectedAsset({
      auth: NOTES_AUTH,
      data: {
        noteId: "note-1",
        action: "OPEN",
        pdfUrl:
          "https://forged.invalid/file.pdf",
        uid: "forged-user",
        planType: "MENTORSHIP",
      },
      firestore: createNotesFirestore(),
      now: () => NOTES_NOW,
      makeRequestId: () =>
        "notes-request-1",
    });

  assert.deepEqual(result, {
    authorized: true,
    source: "server_authorized",
    noteId: "note-1",
    action: "OPEN",
    assetUrl:
      PUBLISHED_ASSET.urls.pdfUrl,
    accessScope: "item",
    serverNowMs: NOTES_NOW,
    requestId: "notes-request-1",
  });
  assert.equal(
    Object.hasOwn(result, "uid"),
    false
  );
  assert.equal(
    Object.hasOwn(result, "email"),
    false
  );
  assert.equal(
    Object.hasOwn(result, "entitlementId"),
    false
  );
});

test("resolves BUNDLE access for a contained Notes item", async () => {
  const result =
    await resolveNotesProtectedAsset({
      auth: NOTES_AUTH,
      data: {
        noteId: "note-1",
        action: "READ",
      },
      firestore: createNotesFirestore({
        entitlements: [
          buildNotesEntitlement({
            scopeType: "bundle",
            itemId: "",
            itemIds: ["note-1"],
            bundleId: "bundle-1",
          }),
        ],
      }),
      now: () => NOTES_NOW,
      makeRequestId: () =>
        "notes-request-2",
    });

  assert.equal(result.accessScope, "bundle");
  assert.equal(result.action, "READ");
});

test("resolves sufficient MODULE and PLAN access", async () => {
  for (const [scopeType, moduleName] of [
    ["module", "notes"],
    ["plan", ""],
  ]) {
    const result =
      await resolveNotesProtectedAsset({
        auth: NOTES_AUTH,
        data: {
          noteId: "note-1",
          action: "DOWNLOAD",
        },
        firestore: createNotesFirestore({
          entitlements: [
            buildNotesEntitlement({
              scopeType,
              module: moduleName,
              itemId: "",
              accessRank: 3,
            }),
          ],
        }),
        now: () => NOTES_NOW,
        makeRequestId: () =>
          `notes-${scopeType}`,
      });

    assert.equal(
      result.accessScope,
      scopeType
    );
    assert.equal(
      result.assetUrl,
      PUBLISHED_ASSET.urls.downloadUrl
    );
  }
});

test("resolves authenticated FREE Notes without reading entitlements", async () => {
  const reads = [];
  const result =
    await resolveNotesProtectedAsset({
      auth: NOTES_AUTH,
      data: {
        noteId: "note-1",
        action: "OPEN",
      },
      firestore: createNotesFirestore({
        note: {
          ...PUBLISHED_NOTE,
          planType: "FREE",
          accessRank: 0,
        },
        entitlements: [],
        reads,
      }),
      now: () => NOTES_NOW,
      makeRequestId: () =>
        "notes-free",
    });

  assert.equal(result.accessScope, "free");
  assert.equal(
    reads.some(
      (entry) =>
        entry[0] === "subcollection"
    ),
    false
  );
});

test("rejects missing, non-Notes, and unpublished catalog records", async () => {
  for (const note of [
    null,
    {
      ...PUBLISHED_NOTE,
      section: "video",
    },
    {
      ...PUBLISHED_NOTE,
      status: "Draft",
    },
  ]) {
    await assert.rejects(
      () =>
        resolveNotesProtectedAsset({
          auth: NOTES_AUTH,
          data: {
            noteId: "note-1",
            action: "OPEN",
          },
          firestore: createNotesFirestore({
            note,
          }),
          now: () => NOTES_NOW,
          makeRequestId: () =>
            "notes-denied",
        }),
      (error) =>
        [
          "not-found",
          "failed-precondition",
        ].includes(error.code)
    );
  }
});

test("rejects missing, mismatched, and unpublished protected assets", async () => {
  for (const asset of [
    null,
    {
      ...PUBLISHED_ASSET,
      contentId: "note-2",
    },
    {
      ...PUBLISHED_ASSET,
      status: "draft",
    },
  ]) {
    await assert.rejects(
      () =>
        resolveNotesProtectedAsset({
          auth: NOTES_AUTH,
          data: {
            noteId: "note-1",
            action: "OPEN",
          },
          firestore: createNotesFirestore({
            asset,
          }),
          now: () => NOTES_NOW,
          makeRequestId: () =>
            "notes-asset-denied",
        }),
      (error) =>
        [
          "not-found",
          "failed-precondition",
        ].includes(error.code)
    );
  }
});

test("rejects sibling, expired, and insufficient Notes access", async () => {
  for (const entitlement of [
    buildNotesEntitlement({
      itemId: "note-2",
    }),
    buildNotesEntitlement({
      accessUntil: NOTES_NOW - 1,
    }),
    buildNotesEntitlement({
      scopeType: "plan",
      module: "",
      itemId: "",
      accessRank: 1,
    }),
  ]) {
    await assert.rejects(
      () =>
        resolveNotesProtectedAsset({
          auth: NOTES_AUTH,
          data: {
            noteId: "note-1",
            action: "OPEN",
          },
          firestore: createNotesFirestore({
            entitlements: [entitlement],
          }),
          now: () => NOTES_NOW,
          makeRequestId: () =>
            "notes-access-denied",
        }),
      (error) =>
        error.code === "permission-denied"
    );
  }
});

test("rejects protected assets without an approved HTTPS URL", async () => {
  await assert.rejects(
    () =>
      resolveNotesProtectedAsset({
        auth: NOTES_AUTH,
        data: {
          noteId: "note-1",
          action: "OPEN",
        },
        firestore: createNotesFirestore({
          asset: {
            ...PUBLISHED_ASSET,
            urls: {
              pdfUrl:
                "http://insecure.invalid/file.pdf",
            },
          },
        }),
        now: () => NOTES_NOW,
        makeRequestId: () =>
          "notes-url-denied",
      }),
    (error) =>
      error.code === "failed-precondition"
  );
});
