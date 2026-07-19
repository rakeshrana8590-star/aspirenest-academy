jest.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: { id: "default-db" },
}));

import {
  IntelliTextRevisionClientError,
  createIntelliTextRevisionClient,
} from "./intelliTextRevisionClient";

const now = new Date("2026-07-19T10:00:00.000Z");

const selection = (overrides = {}) => ({
  answer: "Core concept",
  blockId: "block_1",
  contentVersion: 2,
  noteTitle: "Learning Note",
  prompt: "What is the core concept?",
  sectionId: "section_1",
  sectionTitle: "Foundation",
  selectionAnchor: {
    endOffset: 12,
    exactText: "Core concept",
    prefix: "Before ",
    startOffset: 0,
    suffix: " after",
  },
  textbookId: "note_1",
  ...overrides,
});

const createSnapshot = (records = []) => ({
  forEach(callback) {
    records.forEach((record) =>
      callback({
        data: () => record.data,
        id: record.id,
      })
    );
  },
});

const makeHarness = ({
  uid = "student_1",
  flashcards = [],
  revisionItems = [],
  existingRevision = null,
} = {}) => {
  let generated = 0;
  const batches = [];
  const setDoc = jest.fn(async () => undefined);
  const updateDoc = jest.fn(async () => undefined);
  const deleteDoc = jest.fn(async () => undefined);
  const getDoc = jest.fn(async () => ({
    data: () => existingRevision,
    exists: () => Boolean(existingRevision),
  }));
  const getDocs = jest.fn(async (queryRef) => {
    const path = queryRef.reference.path;
    return path.endsWith("/flashcards")
      ? createSnapshot(flashcards)
      : createSnapshot(revisionItems);
  });

  const firestoreApi = {
    collection: jest.fn((database, path) => ({
      database,
      kind: "collection",
      path,
    })),
    deleteDoc,
    doc: jest.fn((first, second) => {
      if (first?.kind === "collection" && second === undefined) {
        generated += 1;
        return {
          id: `generated_${generated}`,
          kind: "document",
          path: `${first.path}/generated_${generated}`,
        };
      }

      const path = second;
      return {
        id: String(path).split("/").pop(),
        kind: "document",
        path,
      };
    }),
    getDoc,
    getDocs,
    limit: jest.fn((count) => ({ count, kind: "limit" })),
    query: jest.fn((reference, constraint) => ({
      constraint,
      kind: "query",
      reference,
    })),
    serverTimestamp: jest.fn(() => ({
      kind: "serverTimestamp",
    })),
    setDoc,
    timestampFromDate: jest.fn((date) => new Date(date.getTime())),
    updateDoc,
    writeBatch: jest.fn(() => {
      const operations = [];
      const batch = {
        commit: jest.fn(async () => undefined),
        delete: jest.fn((reference) => {
          operations.push({ kind: "delete", reference });
        }),
        operations,
        set: jest.fn((reference, value) => {
          operations.push({ kind: "set", reference, value });
        }),
      };
      batches.push(batch);
      return batch;
    }),
  };

  const authAdapter = {
    currentUser: uid ? { uid } : null,
  };
  const dbAdapter = { id: "db" };
  const client = createIntelliTextRevisionClient({
    authAdapter,
    dbAdapter,
    firestoreApi,
  });

  return {
    authAdapter,
    batches,
    client,
    dbAdapter,
    deleteDoc,
    firestoreApi,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
  };
};

test("client rejects anonymous workspace load", async () => {
  const { client } = makeHarness({ uid: "" });
  await expect(client.loadWorkspace({ now })).rejects.toMatchObject({
    code: "AUTH_REQUIRED",
  });
});

test("client errors expose stable name", async () => {
  const { client } = makeHarness({ uid: "" });

  try {
    await client.loadWorkspace({ now });
    throw new Error("Expected auth failure");
  } catch (error) {
    expect(error).toBeInstanceOf(IntelliTextRevisionClientError);
    expect(error.name).toBe("IntelliTextRevisionClientError");
  }
});

test("workspace load requires explicit Date", async () => {
  const { client } = makeHarness();
  await expect(client.loadWorkspace({})).rejects.toMatchObject({
    code: "EXPLICIT_NOW_REQUIRED",
  });
});

test("workspace load reads flashcards and revision queue", async () => {
  const { client, getDocs } = makeHarness();
  await client.loadWorkspace({ now });
  expect(getDocs).toHaveBeenCalledTimes(2);
});

test("workspace load applies approved limits", async () => {
  const { client, firestoreApi } = makeHarness();
  await client.loadWorkspace({ now });
  expect(firestoreApi.limit).toHaveBeenNthCalledWith(1, 100);
  expect(firestoreApi.limit).toHaveBeenNthCalledWith(2, 100);
});

test("workspace load partitions due and upcoming items", async () => {
  const { client } = makeHarness({
    revisionItems: [
      {
        data: {
          dueAt: new Date(now.getTime() - 1000),
          revisionId: "due",
          state: "ACTIVE",
        },
        id: "due",
      },
      {
        data: {
          dueAt: new Date(now.getTime() + 1000),
          revisionId: "future",
          state: "ACTIVE",
        },
        id: "future",
      },
    ],
  });
  const result = await client.loadWorkspace({ now });
  expect(result.due).toHaveLength(1);
  expect(result.upcoming).toHaveLength(1);
});

test("workspace load sorts flashcards newest first", async () => {
  const { client } = makeHarness({
    flashcards: [
      {
        data: {
          createdAt: new Date("2026-07-18T10:00:00Z"),
          flashcardId: "older",
        },
        id: "older",
      },
      {
        data: {
          createdAt: new Date("2026-07-19T10:00:00Z"),
          flashcardId: "newer",
        },
        id: "newer",
      },
    ],
  });
  const result = await client.loadWorkspace({ now });
  expect(result.flashcards.map((item) => item.flashcardId)).toEqual([
    "newer",
    "older",
  ]);
});

test("selection flashcard creates one atomic two-write batch", async () => {
  const { client, batches } = makeHarness();
  const result = await client.createFlashcardFromSelection(selection(), {
    now,
  });
  expect(result.writes).toBe(2);
  expect(batches).toHaveLength(1);
  expect(batches[0].set).toHaveBeenCalledTimes(2);
  expect(batches[0].commit).toHaveBeenCalledTimes(1);
});

test("selection flashcard writes owner-scoped paths", async () => {
  const { client, batches } = makeHarness();
  await client.createFlashcardFromSelection(selection(), { now });
  expect(batches[0].operations.map((operation) => operation.reference.path)).toEqual([
    "studentLearning/student_1/flashcards/generated_1",
    "studentLearning/student_1/revisionQueue/generated_1",
  ]);
});

test("flashcard and queue share deterministic identity", async () => {
  const { client } = makeHarness();
  const result = await client.createFlashcardFromSelection(selection(), {
    now,
  });
  expect(result.flashcard.flashcardId).toBe("generated_1");
  expect(result.revisionItem.revisionId).toBe("generated_1");
  expect(result.revisionItem.sourceId).toBe("generated_1");
});

test("selection flashcard preserves version-aware anchor", async () => {
  const { client } = makeHarness();
  const result = await client.createFlashcardFromSelection(selection(), {
    now,
  });
  expect(result.flashcard.contentVersion).toBe(2);
  expect(result.flashcard.selectionAnchor.exactText).toBe("Core concept");
  expect(result.revisionItem.selectionAnchor.exactText).toBe("Core concept");
});

test("selection flashcard queue is due immediately", async () => {
  const { client } = makeHarness();
  const result = await client.createFlashcardFromSelection(selection(), {
    now,
  });
  expect(result.revisionItem.dueAt).toEqual(now);
  expect(result.revisionItem.intervalDays).toBe(0);
});

test("annotation flashcard records annotation source id", async () => {
  const { client } = makeHarness();
  const result = await client.createFlashcardFromAnnotation(
    selection({ sourceId: "annotation_1" }),
    { now }
  );
  expect(result.flashcard.sourceKind).toBe("ANNOTATION");
  expect(result.flashcard.sourceId).toBe("annotation_1");
});

test("manual flashcard creates private atomic pair", async () => {
  const { client, batches } = makeHarness();
  const result = await client.createManualFlashcard(
    selection({ selectionAnchor: null }),
    { now }
  );
  expect(result.flashcard.sourceKind).toBe("MANUAL");
  expect(result.flashcard.selectionAnchor).toBeNull();
  expect(batches[0].operations).toHaveLength(2);
});

test("add selection to revision performs one write", async () => {
  const { client, setDoc } = makeHarness();
  const result = await client.addSelectionToRevision(selection(), { now });
  expect(result.writes).toBe(1);
  expect(setDoc).toHaveBeenCalledTimes(1);
});

test("selection revision uses generated identity", async () => {
  const { client } = makeHarness();
  const result = await client.addSelectionToRevision(selection(), { now });
  expect(result.revisionItem.revisionId).toBe("generated_1");
  expect(result.revisionItem.sourceId).toBe("generated_1");
  expect(result.revisionItem.sourceKind).toBe("SELECTION");
});

test("selection revision defaults prompt and answer from anchor", async () => {
  const { client } = makeHarness();
  const result = await client.addSelectionToRevision(
    selection({ answer: "", prompt: "" }),
    { now }
  );
  expect(result.revisionItem.prompt).toBe("Recall this saved concept.");
  expect(result.revisionItem.answer).toBe("Core concept");
});

test("update flashcard writes only flashcard document", async () => {
  const { client, updateDoc } = makeHarness();
  await client.updateFlashcard("flashcard_1", { state: "ARCHIVED" });
  expect(updateDoc).toHaveBeenCalledTimes(1);
  expect(updateDoc.mock.calls[0][0].path).toBe(
    "studentLearning/student_1/flashcards/flashcard_1"
  );
});

test("update revision state writes only queue state fields", async () => {
  const { client, updateDoc } = makeHarness();
  const update = await client.updateRevisionState("revision_1", "PAUSED");
  expect(update.state).toBe("PAUSED");
  expect(Object.keys(update).sort()).toEqual(["state", "updatedAt"]);
  expect(updateDoc.mock.calls[0][0].path).toBe(
    "studentLearning/student_1/revisionQueue/revision_1"
  );
});

test("review fails closed when queue item is missing", async () => {
  const { client } = makeHarness({ existingRevision: null });
  await expect(
    client.reviewRevisionItem("revision_1", "GOOD", { now })
  ).rejects.toMatchObject({ code: "REVISION_ITEM_NOT_FOUND" });
});

test("review updates revision queue only", async () => {
  const { client, updateDoc } = makeHarness({
    existingRevision: {
      dueAt: now,
      intervalDays: 0,
      recallStreak: 0,
      reviewCount: 0,
      state: "ACTIVE",
    },
  });
  await client.reviewRevisionItem("revision_1", "GOOD", { now });
  expect(updateDoc).toHaveBeenCalledTimes(1);
  expect(updateDoc.mock.calls[0][0].path).toBe(
    "studentLearning/student_1/revisionQueue/revision_1"
  );
});

test("review never writes flashcard content", async () => {
  const { client, updateDoc } = makeHarness({
    existingRevision: {
      dueAt: now,
      intervalDays: 0,
      recallStreak: 0,
      reviewCount: 0,
      state: "ACTIVE",
    },
  });
  await client.reviewRevisionItem("revision_1", "EASY", { now });
  expect(JSON.stringify(updateDoc.mock.calls)).not.toContain("flashcards");
  expect(updateDoc.mock.calls[0][1].prompt).toBeUndefined();
  expect(updateDoc.mock.calls[0][1].answer).toBeUndefined();
});

test("review GOOD schedules minimum three days", async () => {
  const { client } = makeHarness({
    existingRevision: {
      dueAt: now,
      intervalDays: 0,
      recallStreak: 0,
      reviewCount: 0,
      state: "ACTIVE",
    },
  });
  const update = await client.reviewRevisionItem("revision_1", "GOOD", {
    now,
  });
  expect(update.intervalDays).toBe(3);
  expect(update.reviewCount).toBe(1);
});

test("review requires explicit now", async () => {
  const { client } = makeHarness({
    existingRevision: {
      dueAt: now,
      intervalDays: 0,
      recallStreak: 0,
      reviewCount: 0,
      state: "ACTIVE",
    },
  });
  await expect(
    client.reviewRevisionItem("revision_1", "GOOD", {})
  ).rejects.toMatchObject({ code: "EXPLICIT_NOW_REQUIRED" });
});

test("delete flashcard atomically deletes card and paired queue item", async () => {
  const { client, batches } = makeHarness();
  await client.deleteFlashcard("flashcard_1");
  expect(batches[0].delete).toHaveBeenCalledTimes(2);
  expect(batches[0].operations.map((operation) => operation.reference.path)).toEqual([
    "studentLearning/student_1/flashcards/flashcard_1",
    "studentLearning/student_1/revisionQueue/flashcard_1",
  ]);
});

test("delete revision item performs one queue delete", async () => {
  const { client, deleteDoc } = makeHarness();
  await client.deleteRevisionItem("revision_1");
  expect(deleteDoc).toHaveBeenCalledTimes(1);
  expect(deleteDoc.mock.calls[0][0].path).toBe(
    "studentLearning/student_1/revisionQueue/revision_1"
  );
});

test("client contains no realtime listener API", () => {
  const client = createIntelliTextRevisionClient({
    authAdapter: { currentUser: { uid: "student_1" } },
    dbAdapter: {},
    firestoreApi: makeHarness().firestoreApi,
  });
  expect(client.onSnapshot).toBeUndefined();
});

test("client API exposes preparation operations", () => {
  const { client } = makeHarness();
  expect(Object.keys(client).sort()).toEqual([
    "addSelectionToRevision",
    "createFlashcardFromAnnotation",
    "createFlashcardFromSelection",
    "createManualFlashcard",
    "deleteFlashcard",
    "deleteRevisionItem",
    "loadWorkspace",
    "reviewRevisionItem",
    "updateFlashcard",
    "updateRevisionState",
  ]);
});
