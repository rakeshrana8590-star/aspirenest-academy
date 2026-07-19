jest.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: { id: "default-db" },
}));

import {
  IntelliTextMasteryClientError,
  createIntelliTextMasteryClient,
} from "./intelliTextMasteryClient";

const now = new Date("2026-07-19T10:00:00.000Z");

const evaluated = (overrides = {}) => ({
  answered: true,
  blockId: "block_1",
  conceptId: "concept_1",
  conceptLabel: "Learning",
  contentVersion: 2,
  correct: false,
  questionId: "question_1",
  questionIndex: 0,
  sectionId: "section_1",
  textbookId: "note_1",
  ...overrides,
});

const testData = {
  chapter: "Learning",
  id: "test_1",
  subject: "Pedagogy",
  title: "Mock 1",
};

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
  existingDocument = null,
  mastery = [],
  mistakes = [],
  revisionItems = [],
  uid = "student_1",
} = {}) => {
  const batches = [];
  const getDocs = jest.fn(async (queryRef) => {
    const path = queryRef.reference.path;

    if (path.endsWith("/mistakeBook")) return createSnapshot(mistakes);
    if (path.endsWith("/masteryProgress")) return createSnapshot(mastery);
    return createSnapshot(revisionItems);
  });
  const getDoc = jest.fn(async () => ({
    data: () => existingDocument,
    exists: () => Boolean(existingDocument),
  }));
  const updateDoc = jest.fn(async () => undefined);
  const firestoreApi = {
    collection: jest.fn((database, path) => ({
      database,
      kind: "collection",
      path,
    })),
    doc: jest.fn((database, path) => ({
      database,
      id: String(path).split("/").pop(),
      kind: "document",
      path,
    })),
    getDoc,
    getDocs,
    limit: jest.fn((count) => ({ count, kind: "limit" })),
    query: jest.fn((reference, constraint) => ({
      constraint,
      kind: "query",
      reference,
    })),
    serverTimestamp: jest.fn(() => ({ kind: "serverTimestamp" })),
    timestampFromDate: jest.fn((date) => new Date(date.getTime())),
    updateDoc,
    writeBatch: jest.fn(() => {
      const operations = [];
      const batch = {
        commit: jest.fn(async () => undefined),
        operations,
        set: jest.fn((reference, value) => {
          operations.push({ reference, value });
        }),
      };
      batches.push(batch);
      return batch;
    }),
  };
  const storage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
  };
  const client = createIntelliTextMasteryClient({
    authAdapter: { currentUser: uid ? { uid } : null },
    dbAdapter: { id: "db" },
    firestoreApi,
    storageAdapter: storage,
  });

  return {
    batches,
    client,
    firestoreApi,
    getDoc,
    getDocs,
    storage,
    updateDoc,
  };
};

test("anonymous workspace load is denied", async () => {
  const { client } = makeHarness({ uid: "" });
  await expect(client.loadWorkspace({ now })).rejects.toMatchObject({
    code: "AUTH_REQUIRED",
  });
});

test("client error uses stable class", async () => {
  const { client } = makeHarness({ uid: "" });

  try {
    await client.loadWorkspace({ now });
    throw new Error("Expected failure");
  } catch (error) {
    expect(error).toBeInstanceOf(IntelliTextMasteryClientError);
    expect(error.name).toBe("IntelliTextMasteryClientError");
  }
});

test("workspace load requires explicit now", async () => {
  const { client } = makeHarness();
  await expect(client.loadWorkspace({})).rejects.toMatchObject({
    code: "EXPLICIT_NOW_REQUIRED",
  });
});

test("workspace load reads mistake and mastery collections", async () => {
  const { client, getDocs } = makeHarness();
  await client.loadWorkspace({ now });
  expect(getDocs).toHaveBeenCalledTimes(2);
});

test("workspace load applies 150 and 100 limits", async () => {
  const { client, firestoreApi } = makeHarness();
  await client.loadWorkspace({ now });
  expect(firestoreApi.limit).toHaveBeenNthCalledWith(1, 150);
  expect(firestoreApi.limit).toHaveBeenNthCalledWith(2, 100);
});

test("workspace paths are owner scoped", async () => {
  const { client, firestoreApi } = makeHarness();
  await client.loadWorkspace({ now });
  expect(firestoreApi.collection).toHaveBeenCalledWith(
    { id: "db" },
    "studentLearning/student_1/mistakeBook"
  );
  expect(firestoreApi.collection).toHaveBeenCalledWith(
    { id: "db" },
    "studentLearning/student_1/masteryProgress"
  );
});

test("workspace derives weak concepts", async () => {
  const { client } = makeHarness({
    mistakes: [
      {
        data: {
          conceptId: "concept_1",
          conceptLabel: "Learning",
          mistakeId: "m1",
          retryDueAt: new Date(now.getTime() - 1000),
          state: "OPEN",
        },
        id: "m1",
      },
    ],
  });
  const result = await client.loadWorkspace({ now });
  expect(result.weakConcepts).toHaveLength(1);
  expect(result.weakConcepts[0].overdueCount).toBe(1);
});

test("workspace sorts mastery score descending", async () => {
  const { client } = makeHarness({
    mastery: [
      { data: { masteryId: "low", masteryScore: 20 }, id: "low" },
      { data: { masteryId: "high", masteryScore: 90 }, id: "high" },
    ],
  });
  const result = await client.loadWorkspace({ now });
  expect(result.mastery.map((item) => item.masteryId)).toEqual([
    "high",
    "low",
  ]);
});

test("result sync requires authentication", async () => {
  const { client } = makeHarness({ uid: "" });
  await expect(
    client.syncResultLearning({
      attemptId: "attempt_1",
      evaluatedQuestions: [evaluated()],
      now,
      resultId: "result_1",
      test: testData,
    })
  ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
});

test("result sync requires explicit now", async () => {
  const { client } = makeHarness();
  await expect(
    client.syncResultLearning({
      attemptId: "attempt_1",
      evaluatedQuestions: [evaluated()],
      resultId: "result_1",
      test: testData,
    })
  ).rejects.toMatchObject({ code: "EXPLICIT_NOW_REQUIRED" });
});

test("result sync reads three private collections", async () => {
  const { client, getDocs } = makeHarness();
  await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated()],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(getDocs).toHaveBeenCalledTimes(3);
});

test("wrong mapped result writes mistake and mastery", async () => {
  const { client, batches } = makeHarness();
  const result = await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated()],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(result.mistakesCreated).toBe(1);
  expect(result.masteryRecords).toHaveLength(1);
  expect(result.writes).toBe(2);
  expect(batches[0].commit).toHaveBeenCalledTimes(1);
});

test("correct mapped result writes mastery only", async () => {
  const { client } = makeHarness();
  const result = await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated({ correct: true })],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(result.mistakesCreated).toBe(0);
  expect(result.writes).toBe(1);
});

test("unmapped wrong result writes mistake without mastery", async () => {
  const { client } = makeHarness();
  const result = await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [
      evaluated({
        blockId: "",
        conceptId: "",
        conceptLabel: "",
        contentVersion: 0,
        sectionId: "",
        textbookId: "",
      }),
    ],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(result.mistakesCreated).toBe(1);
  expect(result.masteryRecords).toHaveLength(0);
  expect(result.writes).toBe(1);
});

test("existing deterministic mistake is skipped", async () => {
  const first = makeHarness();
  const firstResult = await first.client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated()],
    now,
    resultId: "result_1",
    test: testData,
  });
  const mistakeOperation = first.batches[0].operations.find((operation) =>
    operation.reference.path.includes("/mistakeBook/")
  );
  const second = makeHarness({
    mistakes: [
      {
        data: mistakeOperation.value,
        id: mistakeOperation.value.mistakeId,
      },
    ],
  });
  const secondResult = await second.client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated()],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(firstResult.mistakesCreated).toBe(1);
  expect(secondResult.mistakesCreated).toBe(0);
  expect(secondResult.idempotentSkipped).toBe(1);
});

test("new result carries cumulative occurrence count and first seen time", async () => {
  const firstSeenAt = new Date("2026-07-10T10:00:00.000Z");
  const { client, batches } = makeHarness({
    mistakes: [
      {
        data: {
          firstSeenAt,
          mistakeId: "older_mistake",
          occurrenceCount: 2,
          questionId: "question_1",
          testId: "test_1",
        },
        id: "older_mistake",
      },
    ],
  });

  await client.syncResultLearning({
    attemptId: "attempt_2",
    evaluatedQuestions: [evaluated()],
    now,
    resultId: "result_2",
    test: testData,
  });

  const mistake = batches[0].operations.find((operation) =>
    operation.reference.path.includes("/mistakeBook/")
  ).value;

  expect(mistake.occurrenceCount).toBe(3);
  expect(mistake.firstSeenAt).toEqual(firstSeenAt);
});

test("result sync stores no protected question content", async () => {
  const { client, batches } = makeHarness();
  await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [
      evaluated({
        answer: "secret",
        explanation: "protected",
        options: ["A"],
        question: "protected question",
      }),
    ],
    now,
    resultId: "result_1",
    test: testData,
  });
  const mistake = batches[0].operations.find((operation) =>
    operation.reference.path.includes("/mistakeBook/")
  ).value;
  expect(mistake.question).toBeUndefined();
  expect(mistake.answer).toBeUndefined();
  expect(mistake.explanation).toBeUndefined();
  expect(mistake.options).toBeUndefined();
});

test("result sync uses server timestamps", async () => {
  const { client, batches } = makeHarness();
  await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated()],
    now,
    resultId: "result_1",
    test: testData,
  });
  const values = batches[0].operations.map((operation) => operation.value);
  expect(values.every((value) => value.updatedAt.kind === "serverTimestamp"))
    .toBe(true);
});

test("result sync preserves existing mastery createdAt", async () => {
  const createdAt = new Date("2026-07-01T00:00:00Z");
  const { client, batches } = makeHarness({
    mastery: [
      {
        data: {
          chapterLabel: "Learning",
          createdAt,
          masteryId: "mastery_existing",
          masteryScore: 40,
        },
        id: "mastery_existing",
      },
    ],
  });
  await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated({ correct: true })],
    now,
    resultId: "result_1",
    test: testData,
  });
  const masteryWrite = batches[0].operations.find((operation) =>
    operation.reference.path.includes("/masteryProgress/")
  );
  expect(masteryWrite.value.createdAt).toBeDefined();
});

test("result sync reads local reading progress", async () => {
  const { client, storage } = makeHarness();
  storage.getItem.mockReturnValue(
    JSON.stringify({
      blockId: "block_1",
      contentVersion: 2,
      progressPercent: 80,
      schemaVersion: 1,
      sectionId: "section_1",
      textbookId: "note_1",
      uid: "student_1",
      updatedAt: now.toISOString(),
    })
  );
  const result = await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated({ correct: true })],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(storage.getItem).toHaveBeenCalled();
  expect(result.masteryRecords[0].readingScore).toBe(80);
});

test("result sync uses revision completion", async () => {
  const { client } = makeHarness({
    revisionItems: [
      { data: { state: "MASTERED", textbookId: "note_1" }, id: "r1" },
    ],
  });
  const result = await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [evaluated({ correct: true })],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(result.masteryRecords[0].revisionScore).toBe(100);
});

test("no mapped questions and no mistakes produces no writes", async () => {
  const { client, batches } = makeHarness();
  const result = await client.syncResultLearning({
    attemptId: "attempt_1",
    evaluatedQuestions: [],
    now,
    resultId: "result_1",
    test: testData,
  });
  expect(result.writes).toBe(0);
  expect(batches[0].commit).not.toHaveBeenCalled();
});

test("update mistake requires authentication", async () => {
  const { client } = makeHarness({ uid: "" });
  await expect(
    client.updateMistakeState("mistake_1", "OPEN", { now })
  ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
});

test("update mistake requires existing document", async () => {
  const { client } = makeHarness();
  await expect(
    client.updateMistakeState("mistake_1", "OPEN", { now })
  ).rejects.toMatchObject({ code: "MISTAKE_NOT_FOUND" });
});

test("update mistake writes owner path", async () => {
  const { client, firestoreApi } = makeHarness({
    existingDocument: {
      retriedAt: null,
      retryDueAt: null,
    },
  });
  await client.updateMistakeState("mistake_1", "OPEN", { now });
  expect(firestoreApi.doc).toHaveBeenCalledWith(
    { id: "db" },
    "studentLearning/student_1/mistakeBook/mistake_1"
  );
});

test("update mistake resolves with server timestamp", async () => {
  const { client, updateDoc } = makeHarness({
    existingDocument: {
      retriedAt: null,
      retryDueAt: null,
    },
  });
  await client.updateMistakeState("mistake_1", "RESOLVED", { now });
  expect(updateDoc.mock.calls[0][1].resolvedAt.kind).toBe("serverTimestamp");
});

test("update mistake retries with server timestamp", async () => {
  const { client, updateDoc } = makeHarness({
    existingDocument: {
      retriedAt: null,
      retryDueAt: null,
    },
  });
  await client.updateMistakeState("mistake_1", "RETRIED", { now });
  expect(updateDoc.mock.calls[0][1].retriedAt.kind).toBe("serverTimestamp");
});

test("update mistake can set advisory retry due date", async () => {
  const retryDueAt = new Date(now.getTime() + 1000);
  const { client, updateDoc } = makeHarness({
    existingDocument: {
      retriedAt: null,
      retryDueAt: null,
    },
  });
  await client.updateMistakeState("mistake_1", "RETRY_DUE", {
    now,
    retryDueAt,
  });
  expect(updateDoc.mock.calls[0][1].retryDueAt).toEqual(retryDueAt);
});

test("exact section route is empty for unmapped mistake", () => {
  const { client } = makeHarness();
  expect(client.buildExactSectionRoute({})).toBe("");
});

test("exact section route uses native reader path", () => {
  const { client } = makeHarness();
  expect(
    client.buildExactSectionRoute({
      blockId: "block_1",
      conceptId: "concept_1",
      conceptLabel: "Learning",
      contentVersion: 2,
      sectionId: "section_1",
      textbookId: "note_1",
    })
  ).toContain("/ctet-tet/notes/read/note_1?");
});

test("source review route uses existing review route", () => {
  const { client } = makeHarness();
  expect(client.buildSourceReviewRoute({ testId: "test_1" })).toBe(
    "/ctet-tet/mock-tests/review/test_1"
  );
});

test("client exposes no realtime listener API", () => {
  const { client } = makeHarness();
  expect(client.onSnapshot).toBeUndefined();
  expect(client.subscribe).toBeUndefined();
});
