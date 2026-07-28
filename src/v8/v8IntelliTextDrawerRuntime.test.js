import {
  installV8IntelliTextDrawerRuntime,
  resetV8IntelliTextDrawerRuntimeForTests,
} from "./v8IntelliTextDrawerRuntime";

const createWindowAdapter = () => ({
  CustomEvent: class TestCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  },
  dispatchEvent: jest.fn(),
});

const selection = Object.freeze({
  textbookId: "note_1",
  sectionId: "section_1",
  blockId: "block_1",
  contentVersion: 2,
  selectionAnchor: {
    exactText: "Core concept",
    prefix: "",
    suffix: "",
    startOffset: 0,
    endOffset: 12,
  },
});

describe("V8 founder-approved IntelliText drawer runtime", () => {
  afterEach(() => {
    resetV8IntelliTextDrawerRuntimeForTests(window);
    delete window.__aspirenestIntelliTextDrawerRuntime;
  });

  test("loads the exact published graph and UID-private workspace", async () => {
    const publishedClient = {
      loadPublishedTextbook: jest.fn(async (id) => ({ textbookId: id })),
    };
    const studyClient = {
      loadTextbookWorkspace: jest.fn(async (id) => ({
        textbookId: id,
        annotations: [],
        bookmarks: [],
      })),
    };
    const target = createWindowAdapter();
    resetV8IntelliTextDrawerRuntimeForTests(target);
    const api = installV8IntelliTextDrawerRuntime({
      publishedClient,
      studyClient,
      revisionClient: {},
      windowAdapter: target,
    });

    await expect(api.load("note_1")).resolves.toEqual({ textbookId: "note_1" });
    await expect(api.loadWorkspace("note_1")).resolves.toEqual(
      expect.objectContaining({ annotations: [], bookmarks: [] })
    );
    expect(publishedClient.loadPublishedTextbook).toHaveBeenCalledWith("note_1");
    expect(studyClient.loadTextbookWorkspace).toHaveBeenCalledWith("note_1");
    expect(target.dispatchEvent).toHaveBeenCalled();
  });

  test("creates UID-private annotation and bookmark records", async () => {
    const studyClient = {
      loadTextbookWorkspace: jest.fn(),
      createAnnotation: jest.fn(async (value) => value),
      createBookmark: jest.fn(async (value) => value),
    };
    const target = createWindowAdapter();
    resetV8IntelliTextDrawerRuntimeForTests(target);
    const api = installV8IntelliTextDrawerRuntime({
      publishedClient: {},
      studyClient,
      revisionClient: {},
      windowAdapter: target,
    });

    await api.create("highlight", selection);
    await api.create("bookmark", {
      ...selection,
      selectionAnchor: undefined,
      label: "Section one",
    });

    expect(studyClient.createAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({
        textbookId: "note_1",
        sectionId: "section_1",
        blockId: "block_1",
        type: "HIGHLIGHT",
      })
    );
    expect(studyClient.createBookmark).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Section one" })
    );
  });

  test("creates flashcard and revision records from exact selection identity", async () => {
    const revisionClient = {
      createFlashcardFromSelection: jest.fn(async (value) => value),
      addSelectionToRevision: jest.fn(async (value) => value),
    };
    const target = createWindowAdapter();
    resetV8IntelliTextDrawerRuntimeForTests(target);
    const api = installV8IntelliTextDrawerRuntime({
      publishedClient: {},
      studyClient: {},
      revisionClient,
      windowAdapter: target,
    });

    await api.create("flashcard", {
      ...selection,
      prompt: "What is this?",
      answer: "Core concept",
      noteTitle: "Science",
      sectionTitle: "Overview",
    });
    await api.create("revision", {
      ...selection,
      noteTitle: "Science",
      sectionTitle: "Overview",
    });

    expect(revisionClient.createFlashcardFromSelection).toHaveBeenCalled();
    expect(revisionClient.addSelectionToRevision).toHaveBeenCalled();
  });

  test("uses the existing anchor decorator for persisted highlights", () => {
    global.CSS = global.CSS || { escape: (value) => String(value) };
    const target = createWindowAdapter();
    resetV8IntelliTextDrawerRuntimeForTests(target);
    const api = installV8IntelliTextDrawerRuntime({
      publishedClient: {},
      studyClient: {},
      revisionClient: {},
      windowAdapter: target,
    });
    const root = document.createElement("div");
    root.innerHTML = `
      <p
        data-intellitext-block="true"
        data-block-id="block_1"
      >Core concept</p>
    `;

    const results = api.applyAnnotations({
      rootElement: root,
      contentVersion: 2,
      annotations: [{
        annotationId: "annotation_1",
        blockId: "block_1",
        contentVersion: 2,
        type: "HIGHLIGHT",
        selectionAnchor: {
          exactText: "Core concept",
          prefix: "",
          suffix: "",
          startOffset: 0,
          endOffset: 12,
        },
      }],
    });

    expect(results).toHaveLength(1);
    expect(root.querySelector("mark")).not.toBeNull();
    expect(api.clearAnnotations(root)).toBe(1);
  });
});
