import {
  IntelliTextPublishedContentClientError,
  createIntelliTextPublishedContentClient,
} from "./intelliTextPublishedContentClient";

const docSnapshot = (id, data) => ({
  id,
  data: () => data,
  exists: () => Boolean(data),
});

const querySnapshot = (records = []) => ({
  forEach(callback) {
    records.forEach((record) => callback(docSnapshot(record.id, record)));
  },
});

const createApi = ({ root, sections, blocksBySection } = {}) => {
  const calls = [];
  const api = {
    collection: jest.fn((db, path) => ({ kind: "collection", path })),
    doc: jest.fn((db, path) => ({ kind: "doc", path })),
    getDoc: jest.fn(async (reference) => {
      calls.push(["getDoc", reference.path]);
      return docSnapshot("note_1", root);
    }),
    getDocs: jest.fn(async (reference) => {
      const path = reference.source.path;
      calls.push(["getDocs", path]);
      if (path.endsWith("/sections")) return querySnapshot(sections || []);
      const sectionId = path.split("/").slice(-2)[0];
      return querySnapshot(blocksBySection?.[sectionId] || []);
    }),
    limit: jest.fn((value) => ({ kind: "limit", value })),
    orderBy: jest.fn((field, direction) => ({ kind: "orderBy", field, direction })),
    query: jest.fn((source, ...constraints) => ({
      kind: "query",
      source,
      constraints,
    })),
  };
  return { api, calls };
};

const readyRoot = (overrides = {}) => ({
  access: { publicRead: false, readEntitlementIds: ["plan_PREMIUM"] },
  contentVersion: 2,
  deliveryMode: "NATIVE_TEXT",
  nativeReady: true,
  publicationState: "PUBLISHED",
  publishedVersionId: "v2",
  textbookId: "note_1",
  title: "Native Note",
  ...overrides,
});

const readySections = () => [
  { id: "section_2", sectionId: "section_2", order: 1, title: "Second" },
  { id: "section_1", sectionId: "section_1", order: 0, title: "First" },
];

const readyBlocks = () => ({
  section_1: [
    { id: "block_2", blockId: "block_2", order: 1, type: "PARAGRAPH", payload: { text: "B" } },
    { id: "block_1", blockId: "block_1", order: 0, type: "HEADING", payload: { title: "A" } },
  ],
  section_2: [
    { id: "block_3", blockId: "block_3", order: 0, type: "SUMMARY", payload: { text: "C" } },
  ],
});

test("loads root only before section queries", async () => {
  const { api, calls } = createApi({
    root: readyRoot(),
    sections: readySections(),
    blocksBySection: readyBlocks(),
  });
  const client = createIntelliTextPublishedContentClient({
    dbAdapter: {},
    firestoreApi: api,
  });
  await client.loadPublishedTextbook("note_1");
  expect(calls[0]).toEqual(["getDoc", "learningTexts/note_1"]);
});

test("returns a reader-compatible native note", async () => {
  const { api } = createApi({
    root: readyRoot(),
    sections: readySections(),
    blocksBySection: readyBlocks(),
  });
  const note = await createIntelliTextPublishedContentClient({
    dbAdapter: {},
    firestoreApi: api,
  }).loadPublishedTextbook("note_1");
  expect(note.deliveryType).toBe("NATIVE_TEXT");
  expect(note.nativeReady).toBe(true);
  expect(note.intelliText.sections).toHaveLength(2);
});

test("sorts sections and blocks by order", async () => {
  const { api } = createApi({
    root: readyRoot(),
    sections: readySections(),
    blocksBySection: readyBlocks(),
  });
  const note = await createIntelliTextPublishedContentClient({
    dbAdapter: {},
    firestoreApi: api,
  }).loadPublishedTextbook("note_1");
  expect(note.sections.map((section) => section.sectionId)).toEqual([
    "section_1",
    "section_2",
  ]);
  expect(note.sections[0].blocks.map((block) => block.blockId)).toEqual([
    "block_1",
    "block_2",
  ]);
});

test("uses one root read one section query and one block query per section", async () => {
  const { api } = createApi({
    root: readyRoot(),
    sections: readySections(),
    blocksBySection: readyBlocks(),
  });
  await createIntelliTextPublishedContentClient({
    dbAdapter: {},
    firestoreApi: api,
  }).loadPublishedTextbook("note_1");
  expect(api.getDoc).toHaveBeenCalledTimes(1);
  expect(api.getDocs).toHaveBeenCalledTimes(3);
});

test("fails when the published root is missing", async () => {
  const { api } = createApi({ root: null, sections: [] });
  await expect(
    createIntelliTextPublishedContentClient({
      dbAdapter: {},
      firestoreApi: api,
    }).loadPublishedTextbook("note_1")
  ).rejects.toMatchObject({ code: "PUBLISHED_ROOT_NOT_FOUND" });
});

test.each([
  ["publicationState", "DRAFT"],
  ["nativeReady", false],
  ["deliveryMode", "LEGACY_PDF"],
])("fails when root %s is not publish-ready", async (field, value) => {
  const { api } = createApi({
    root: readyRoot({ [field]: value }),
    sections: readySections(),
    blocksBySection: readyBlocks(),
  });
  await expect(
    createIntelliTextPublishedContentClient({
      dbAdapter: {},
      firestoreApi: api,
    }).loadPublishedTextbook("note_1")
  ).rejects.toMatchObject({ code: "PUBLISHED_ROOT_NOT_READY" });
});

test("fails when no published sections exist", async () => {
  const { api } = createApi({ root: readyRoot(), sections: [] });
  await expect(
    createIntelliTextPublishedContentClient({
      dbAdapter: {},
      firestoreApi: api,
    }).loadPublishedTextbook("note_1")
  ).rejects.toMatchObject({ code: "PUBLISHED_SECTIONS_EMPTY" });
});

test("fails when a published section has no blocks", async () => {
  const { api } = createApi({
    root: readyRoot(),
    sections: [{ id: "section_1", sectionId: "section_1", order: 0 }],
    blocksBySection: { section_1: [] },
  });
  await expect(
    createIntelliTextPublishedContentClient({
      dbAdapter: {},
      firestoreApi: api,
    }).loadPublishedTextbook("note_1")
  ).rejects.toMatchObject({ code: "PUBLISHED_BLOCKS_EMPTY" });
});

test("rejects invalid textbook IDs before Firestore reads", async () => {
  const { api } = createApi({ root: readyRoot() });
  await expect(
    createIntelliTextPublishedContentClient({
      dbAdapter: {},
      firestoreApi: api,
    }).loadPublishedTextbook("bad id")
  ).rejects.toBeTruthy();
  expect(api.getDoc).not.toHaveBeenCalled();
});

test("published client exposes stable error class", () => {
  const error = new IntelliTextPublishedContentClientError("CODE", "message");
  expect(error.name).toBe("IntelliTextPublishedContentClientError");
  expect(error.code).toBe("CODE");
});
