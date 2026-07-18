jest.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: { id: "default-db" },
}));

import {
  createIntelliTextStudyWorkspaceClient,
} from "./intelliTextStudyWorkspaceClient";

const createHarness = ({ uid = "student_1" } = {}) => {
  const writes = [];
  const updates = [];
  const deletes = [];
  const queries = [];
  const snapshots = {
    annotations: [],
    bookmarks: [],
  };
  let nextId = 1;

  const firestoreApi = {
    collection(_db, path) {
      return { kind: "collection", path };
    },
    doc(first, path) {
      if (path) {
        return { kind: "document", path, id: path.split("/").pop() };
      }

      return {
        kind: "document",
        path: `${first.path}/generated_${nextId}`,
        id: `generated_${nextId++}`,
      };
    },
    where(field, operator, value) {
      return { field, operator, value };
    },
    query(reference, condition) {
      const result = { reference, condition };
      queries.push(result);
      return result;
    },
    async getDocs(workspaceQuery) {
      const name = workspaceQuery.reference.path.split("/").pop();
      return {
        forEach(callback) {
          snapshots[name].forEach((record) =>
            callback({
              id: record.id,
              data: () => record.data,
            })
          );
        },
      };
    },
    serverTimestamp() {
      return { __serverTimestamp: true };
    },
    async setDoc(reference, data) {
      writes.push({ reference, data });
    },
    async updateDoc(reference, data) {
      updates.push({ reference, data });
    },
    async deleteDoc(reference) {
      deletes.push(reference);
    },
  };

  const client = createIntelliTextStudyWorkspaceClient({
    authAdapter: {
      currentUser: uid ? { uid } : null,
    },
    dbAdapter: { id: "db" },
    firestoreApi,
  });

  return {
    client,
    deletes,
    queries,
    snapshots,
    updates,
    writes,
  };
};

const annotationInput = (overrides = {}) => ({
  uid: "forged_uid",
  textbookId: "textbook_1",
  sectionId: "section_1",
  blockId: "block_1",
  contentVersion: 2,
  type: "HIGHLIGHT",
  selectionAnchor: {
    exactText: "selected text",
    prefix: "before ",
    suffix: " after",
    startOffset: 7,
    endOffset: 20,
  },
  ...overrides,
});

describe("Phase 8B-4 Firestore workspace client", () => {
  test("requires the authenticated Firebase user", async () => {
    const { client } = createHarness({ uid: "" });
    await expect(client.loadTextbookWorkspace("textbook_1")).rejects.toThrow(
      "Sign in"
    );
  });

  test("loads one annotation query and one bookmark query", async () => {
    const { client, queries } = createHarness();
    await client.loadTextbookWorkspace("textbook_1");
    expect(queries).toHaveLength(2);
  });

  test("scopes both load queries to the authenticated UID", async () => {
    const { client, queries } = createHarness();
    await client.loadTextbookWorkspace("textbook_1");
    expect(queries.map((item) => item.reference.path)).toEqual([
      "studentLearning/student_1/annotations",
      "studentLearning/student_1/bookmarks",
    ]);
  });

  test("filters both load queries by textbookId", async () => {
    const { client, queries } = createHarness();
    await client.loadTextbookWorkspace("textbook_1");
    expect(queries.every((item) => item.condition.value === "textbook_1")).toBe(
      true
    );
  });

  test("returns annotations and bookmarks", async () => {
    const harness = createHarness();
    harness.snapshots.annotations.push({
      id: "annotation_1",
      data: { textbookId: "textbook_1" },
    });
    harness.snapshots.bookmarks.push({
      id: "bookmark_1",
      data: { textbookId: "textbook_1" },
    });

    await expect(
      harness.client.loadTextbookWorkspace("textbook_1")
    ).resolves.toMatchObject({
      uid: "student_1",
      annotations: [{ id: "annotation_1", textbookId: "textbook_1" }],
      bookmarks: [{ id: "bookmark_1", textbookId: "textbook_1" }],
    });
  });

  test("ignores a caller-supplied UID on annotation create", async () => {
    const { client, writes } = createHarness();
    await client.createAnnotation(annotationInput());
    expect(writes[0].data.uid).toBe("student_1");
  });

  test("creates annotations under the owner path", async () => {
    const { client, writes } = createHarness();
    await client.createAnnotation(annotationInput());
    expect(writes[0].reference.path).toBe(
      "studentLearning/student_1/annotations/generated_1"
    );
  });

  test("uses server timestamps for annotation create", async () => {
    const { client, writes } = createHarness();
    await client.createAnnotation(annotationInput());
    expect(writes[0].data.createdAt).toEqual({ __serverTimestamp: true });
    expect(writes[0].data.updatedAt).toEqual({ __serverTimestamp: true });
  });

  test("updates only an owner annotation path", async () => {
    const { client, updates } = createHarness();
    await client.updateAnnotation("annotation_1", { state: "RESOLVED" });
    expect(updates[0].reference.path).toBe(
      "studentLearning/student_1/annotations/annotation_1"
    );
    expect(updates[0].data.state).toBe("RESOLVED");
  });

  test("deletes only an owner annotation path", async () => {
    const { client, deletes } = createHarness();
    await client.deleteAnnotation("annotation_1");
    expect(deletes[0].path).toBe(
      "studentLearning/student_1/annotations/annotation_1"
    );
  });

  test("ignores a caller-supplied UID on bookmark create", async () => {
    const { client, writes } = createHarness();
    await client.createBookmark({
      uid: "forged_uid",
      textbookId: "textbook_1",
      sectionId: "section_1",
      blockId: "block_1",
      contentVersion: 2,
      label: "Return here",
    });
    expect(writes[0].data.uid).toBe("student_1");
  });

  test("creates bookmarks under the owner path", async () => {
    const { client, writes } = createHarness();
    await client.createBookmark({
      textbookId: "textbook_1",
      sectionId: "section_1",
      blockId: "block_1",
      contentVersion: 2,
    });
    expect(writes[0].reference.path).toBe(
      "studentLearning/student_1/bookmarks/generated_1"
    );
  });

  test("updates only a bookmark label", async () => {
    const { client, updates } = createHarness();
    await client.updateBookmark("bookmark_1", { label: "Updated" });
    expect(updates[0]).toMatchObject({
      reference: {
        path: "studentLearning/student_1/bookmarks/bookmark_1",
      },
      data: { label: "Updated" },
    });
  });

  test("deletes only an owner bookmark path", async () => {
    const { client, deletes } = createHarness();
    await client.deleteBookmark("bookmark_1");
    expect(deletes[0].path).toBe(
      "studentLearning/student_1/bookmarks/bookmark_1"
    );
  });
});
