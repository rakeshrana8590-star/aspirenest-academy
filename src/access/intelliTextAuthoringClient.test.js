import {
  IntelliTextAuthoringClientError,
  createIntelliTextAuthoringClient,
} from "./intelliTextAuthoringClient";

const ADMIN_EMAIL = "aspirenestplatform@gmail.com";

const docSnapshot = (id, data) => ({
  id,
  data: () => data,
  exists: () => data !== null && data !== undefined,
});

const querySnapshot = (records = []) => ({
  forEach(callback) {
    records.forEach((record) => callback(docSnapshot(record.id, record)));
  },
});

const draftInput = (overrides = {}) => ({
  access: {
    publicRead: false,
    readEntitlementIds: ["plan_PREMIUM"],
    requiredPlanCode: "PREMIUM",
  },
  baseContentVersion: 0,
  chapterId: "chapter_1",
  contentVersion: 1,
  previewAudit: {
    desktop: false,
    mobile: false,
    studentExperience: false,
  },
  sections: [
    {
      sectionId: "section_1",
      title: "Foundation",
      blocks: [
        {
          blockId: "block_1",
          type: "PARAGRAPH",
          payload: { text: "Learning content" },
        },
      ],
    },
  ],
  subjectId: "cdp",
  textbookId: "note_1",
  title: "Native Note",
  versionId: "v1",
  ...overrides,
});

const createBatch = () => ({
  commit: jest.fn(async () => true),
  delete: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
});

const createApi = ({
  docs = {},
  queries = {},
  transactionDocs = {},
} = {}) => {
  const batch = createBatch();
  const transaction = {
    delete: jest.fn(),
    get: jest.fn(async (reference) =>
      docSnapshot(reference.path.split("/").pop(), transactionDocs[reference.path])
    ),
    set: jest.fn(),
    update: jest.fn(),
  };
  const api = {
    collection: jest.fn((db, path) => ({ kind: "collection", path })),
    deleteDoc: jest.fn(async () => true),
    doc: jest.fn((...args) => {
      if (args.length === 3) {
        return { kind: "doc", path: `${args[1]}/${args[2]}` };
      }
      return { kind: "doc", path: args[1] };
    }),
    getDoc: jest.fn(async (reference) =>
      docSnapshot(reference.path.split("/").pop(), docs[reference.path])
    ),
    getDocs: jest.fn(async (reference) => {
      const path = reference.source?.path || reference.path;
      return querySnapshot(queries[path] || []);
    }),
    limit: jest.fn((value) => ({ kind: "limit", value })),
    orderBy: jest.fn((field, direction) => ({ kind: "orderBy", field, direction })),
    query: jest.fn((source, ...constraints) => ({ source, constraints })),
    runTransaction: jest.fn(async (db, callback) => callback(transaction)),
    serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
    setDoc: jest.fn(async () => true),
    updateDoc: jest.fn(async () => true),
    writeBatch: jest.fn(() => batch),
  };
  return { api, batch, transaction };
};

const adminAuth = () => ({
  currentUser: { uid: "admin_uid", email: ADMIN_EMAIL },
});

const studentAuth = () => ({
  currentUser: { uid: "student_uid", email: "student@example.com" },
});

test("authoring client requires authentication", async () => {
  const { api } = createApi();
  const client = createIntelliTextAuthoringClient({
    authAdapter: { currentUser: null },
    dbAdapter: {},
    firestoreApi: api,
  });
  await expect(client.loadAuthoringWorkspace("note_1")).rejects.toMatchObject({
    code: "AUTH_REQUIRED",
  });
});

test("authoring client requires the exact admin email", async () => {
  const { api } = createApi();
  const client = createIntelliTextAuthoringClient({
    authAdapter: studentAuth(),
    dbAdapter: {},
    firestoreApi: api,
  });
  await expect(client.loadAuthoringWorkspace("note_1")).rejects.toMatchObject({
    code: "ADMIN_REQUIRED",
  });
});

test("load workspace reads root canonical item and versions", async () => {
  const { api } = createApi({
    docs: {
      "contentItems/note_1": { title: "Canonical" },
      "learningTexts/note_1": { contentVersion: 0 },
    },
  });
  const workspace = await createIntelliTextAuthoringClient({
    authAdapter: adminAuth(),
    dbAdapter: {},
    firestoreApi: api,
  }).loadAuthoringWorkspace("note_1");
  expect(workspace.contentItem.title).toBe("Canonical");
  expect(workspace.root.contentVersion).toBe(0);
  expect(workspace.versions).toEqual([]);
});

test("load workspace keeps canonical note identity", async () => {
  const { api } = createApi({
    docs: { "contentItems/note_1": { title: "Canonical" } },
  });
  await createIntelliTextAuthoringClient({
    authAdapter: adminAuth(),
    dbAdapter: {},
    firestoreApi: api,
  }).loadAuthoringWorkspace("note_1");
  expect(api.doc).toHaveBeenCalledWith({}, "contentItems", "note_1");
});

test("save draft writes root version section and block in one batch", async () => {
  const { api, batch } = createApi();
  const result = await createIntelliTextAuthoringClient({
    authAdapter: adminAuth(),
    dbAdapter: {},
    firestoreApi: api,
  }).saveDraftVersion(draftInput());
  expect(result.graph.blockCount).toBe(1);
  expect(batch.set).toHaveBeenCalledTimes(4);
  expect(batch.commit).toHaveBeenCalledTimes(1);
});

test("save draft does not write contentItems", async () => {
  const { api, batch } = createApi();
  await createIntelliTextAuthoringClient({
    authAdapter: adminAuth(),
    dbAdapter: {},
    firestoreApi: api,
  }).saveDraftVersion(draftInput());
  const paths = batch.set.mock.calls.map(([reference]) => reference.path);
  expect(paths.some((path) => path.startsWith("contentItems/"))).toBe(false);
});

test("save draft preserves approved entitlement mapping", async () => {
  const { api, batch } = createApi();
  await createIntelliTextAuthoringClient({
    authAdapter: adminAuth(),
    dbAdapter: {},
    firestoreApi: api,
  }).saveDraftVersion(draftInput());
  const rootWrite = batch.set.mock.calls.find(
    ([reference]) => reference.path === "learningTexts/note_1"
  );
  expect(rootWrite[1].access.readEntitlementIds).toEqual(["plan_PREMIUM"]);
});

test("save draft preserves published and archived version snapshots", async () => {
  for (const versionState of ["PUBLISHED", "ARCHIVED"]) {
    const { api, batch } = createApi({
      docs: {
        "learningTexts/note_1/authoringVersions/v1": {
          versionId: "v1",
          versionState,
        },
      },
    });

    await expect(
      createIntelliTextAuthoringClient({
        authAdapter: adminAuth(),
        dbAdapter: {},
        firestoreApi: api,
      }).saveDraftVersion(draftInput())
    ).rejects.toMatchObject({ code: "VERSION_IMMUTABLE" });

    expect(batch.commit).not.toHaveBeenCalled();
  }
});

test("save draft rejects invalid access mapping before writes", async () => {
  const { api, batch } = createApi();
  await expect(
    createIntelliTextAuthoringClient({
      authAdapter: adminAuth(),
      dbAdapter: {},
      firestoreApi: api,
    }).saveDraftVersion(
      draftInput({ access: { publicRead: false, readEntitlementIds: [] } })
    )
  ).rejects.toBeTruthy();
  expect(batch.commit).not.toHaveBeenCalled();
});

test("mark ready requires the version to exist", async () => {
  const { api } = createApi();
  await expect(
    createIntelliTextAuthoringClient({
      authAdapter: adminAuth(),
      dbAdapter: {},
      firestoreApi: api,
    }).markVersionReadyForReview({
      previewAudit: { desktop: true, mobile: true, studentExperience: true },
      textbookId: "note_1",
      versionId: "v1",
    })
  ).rejects.toMatchObject({ code: "VERSION_NOT_FOUND" });
});

test("mark ready requires all preview audits", async () => {
  const { api } = createApi({
    docs: {
      "learningTexts/note_1/authoringVersions/v1": {
        versionId: "v1",
        versionState: "DRAFT",
      },
    },
  });
  await expect(
    createIntelliTextAuthoringClient({
      authAdapter: adminAuth(),
      dbAdapter: {},
      firestoreApi: api,
    }).markVersionReadyForReview({
      previewAudit: { desktop: true, mobile: true, studentExperience: false },
      textbookId: "note_1",
      versionId: "v1",
    })
  ).rejects.toMatchObject({ code: "PREVIEW_AUDIT_INCOMPLETE" });
});

test("mark ready writes READY_FOR_REVIEW state", async () => {
  const { api } = createApi({
    docs: {
      "learningTexts/note_1/authoringVersions/v1": {
        versionId: "v1",
        versionState: "DRAFT",
      },
    },
  });
  await createIntelliTextAuthoringClient({
    authAdapter: adminAuth(),
    dbAdapter: {},
    firestoreApi: api,
  }).markVersionReadyForReview({
    previewAudit: { desktop: true, mobile: true, studentExperience: true },
    textbookId: "note_1",
    versionId: "v1",
  });
  expect(api.updateDoc).toHaveBeenCalledWith(
    expect.objectContaining({
      path: "learningTexts/note_1/authoringVersions/v1",
    }),
    expect.objectContaining({ versionState: "READY_FOR_REVIEW" })
  );
});

test("published versions cannot return to review", async () => {
  const { api } = createApi({
    docs: {
      "learningTexts/note_1/authoringVersions/v1": {
        versionId: "v1",
        versionState: "PUBLISHED",
      },
    },
  });
  await expect(
    createIntelliTextAuthoringClient({
      authAdapter: adminAuth(),
      dbAdapter: {},
      firestoreApi: api,
    }).markVersionReadyForReview({
      previewAudit: { desktop: true, mobile: true, studentExperience: true },
      textbookId: "note_1",
      versionId: "v1",
    })
  ).rejects.toMatchObject({ code: "VERSION_ALREADY_PUBLISHED" });
});

test("delete draft is idempotent when version does not exist", async () => {
  const { api } = createApi();
  await expect(
    createIntelliTextAuthoringClient({
      authAdapter: adminAuth(),
      dbAdapter: {},
      firestoreApi: api,
    }).deleteDraftVersion({ textbookId: "note_1", versionId: "v1" })
  ).resolves.toBe(true);
});

test("delete draft denies published snapshot deletion", async () => {
  const { api } = createApi({
    docs: {
      "learningTexts/note_1/authoringVersions/v1": {
        versionId: "v1",
        versionState: "PUBLISHED",
      },
    },
  });
  await expect(
    createIntelliTextAuthoringClient({
      authAdapter: adminAuth(),
      dbAdapter: {},
      firestoreApi: api,
    }).deleteDraftVersion({ textbookId: "note_1", versionId: "v1" })
  ).rejects.toMatchObject({ code: "PUBLISHED_DELETE_DENIED" });
});

test("client error exposes stable name and code", () => {
  const error = new IntelliTextAuthoringClientError("CODE", "message");
  expect(error.name).toBe("IntelliTextAuthoringClientError");
  expect(error.code).toBe("CODE");
});
