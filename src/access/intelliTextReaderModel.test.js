import {
  INTELLITEXT_READER_STATES,
  buildIntelliTextCatalogReturnRoute,
  buildIntelliTextReaderModel,
  buildIntelliTextReaderRoute,
  calculateReaderSectionProgress,
  estimateIntelliTextReadingMinutes,
  findIntelliTextNoteById,
  getAdjacentReaderSection,
  getReaderNoteDeliveryMode,
  getReaderNotePublicationState,
  getReaderNoteTextbookId,
} from "./intelliTextReaderModel";

const createNativeNote = (overrides = {}) => ({
  id: "legacy-note-1",
  section: "notes",
  status: "published",
  title: "Learning Theories",
  textbookId: "note_learning_theories",
  deliveryMode: "NATIVE_TEXT",
  contentVersion: 2,
  planType: "PREMIUM",
  subjectSlug: "cdp",
  chapterSlug: "learning-theories",
  sections: [
    {
      sectionId: "overview",
      order: 0,
      title: "Overview",
      blocks: [
        {
          blockId: "overview_heading",
          order: 0,
          type: "HEADING",
          payload: {
            text: "Learning theories",
          },
        },
        {
          blockId: "overview_text",
          order: 1,
          type: "PARAGRAPH",
          payload: {
            text:
              "A structured explanation for CTET learners.",
          },
        },
      ],
    },
    {
      sectionId: "practice",
      order: 1,
      title: "Practice",
      blocks: [
        {
          blockId: "practice_mcq",
          order: 0,
          type: "MCQ",
          payload: {
            question: "Who proposed constructivism?",
            options: ["Piaget", "Skinner"],
          },
        },
      ],
    },
  ],
  ...overrides,
});

describe("IntelliText reader model", () => {
  test("builds the canonical reader route", () => {
    expect(
      buildIntelliTextReaderRoute(
        "note_learning_theories"
      )
    ).toBe(
      "/ctet-tet/notes/read/note_learning_theories"
    );
  });

  test("rejects unsafe route identities", () => {
    expect(() =>
      buildIntelliTextReaderRoute("note/unsafe")
    ).toThrow("textbookId");
  });

  test("reads textbook identity from the top level", () => {
    expect(
      getReaderNoteTextbookId(
        createNativeNote()
      )
    ).toBe("note_learning_theories");
  });

  test("reads nested textbook identity", () => {
    expect(
      getReaderNoteTextbookId({
        intelliText: {
          textbookId: "note_nested",
        },
      })
    ).toBe("note_nested");
  });

  test("finds a note only by canonical textbook identity", () => {
    const note = createNativeNote();

    expect(
      findIntelliTextNoteById(
        [note],
        "note_learning_theories"
      )
    ).toBe(note);

    expect(
      findIntelliTextNoteById(
        [note],
        "Learning Theories"
      )
    ).toBeNull();
  });

  test("normalizes native and legacy delivery modes", () => {
    expect(
      getReaderNoteDeliveryMode(
        createNativeNote()
      )
    ).toBe("NATIVE_TEXT");

    expect(
      getReaderNoteDeliveryMode({})
    ).toBe("LEGACY_PDF");
  });

  test("normalizes published state from legacy status", () => {
    expect(
      getReaderNotePublicationState({
        status: "published",
      })
    ).toBe("PUBLISHED");
  });

  test("builds an ordered ready reader model", () => {
    const hiddenSection = {
      ...createNativeNote().sections[0],
      sectionId: "hidden",
      order: 2,
      published: false,
    };
    const model =
      buildIntelliTextReaderModel(
        createNativeNote({
          sections: [
            hiddenSection,
            createNativeNote().sections[1],
            createNativeNote().sections[0],
          ],
        })
      );

    expect(model.ready).toBe(true);
    expect(model.state).toBe(
      INTELLITEXT_READER_STATES.READY
    );
    expect(
      model.sections.map(
        (section) => section.sectionId
      )
    ).toEqual(["overview", "practice"]);
  });

  test("orders blocks inside each section", () => {
    const note = createNativeNote();
    note.sections[0].blocks.reverse();

    const model =
      buildIntelliTextReaderModel(note);

    expect(
      model.sections[0].blocks.map(
        (block) => block.blockId
      )
    ).toEqual([
      "overview_heading",
      "overview_text",
    ]);
  });

  test("creates a table of contents", () => {
    const model =
      buildIntelliTextReaderModel(
        createNativeNote()
      );

    expect(model.toc).toEqual([
      expect.objectContaining({
        sectionId: "overview",
        blockCount: 2,
      }),
      expect.objectContaining({
        sectionId: "practice",
        blockCount: 1,
      }),
    ]);
  });

  test("rejects a non-native note", () => {
    const model =
      buildIntelliTextReaderModel(
        createNativeNote({
          deliveryMode: "LEGACY_PDF",
        })
      );

    expect(model.ready).toBe(false);
    expect(model.state).toBe(
      INTELLITEXT_READER_STATES.NOT_NATIVE
    );
  });

  test("rejects an unpublished native note", () => {
    const model =
      buildIntelliTextReaderModel(
        createNativeNote({
          status: "draft",
        })
      );

    expect(model.ready).toBe(false);
    expect(model.state).toBe(
      INTELLITEXT_READER_STATES.NOT_PUBLISHED
    );
  });

  test("rejects an empty native note", () => {
    const model =
      buildIntelliTextReaderModel(
        createNativeNote({
          sections: [],
        })
      );

    expect(model.ready).toBe(false);
    expect(model.state).toBe(
      INTELLITEXT_READER_STATES.EMPTY
    );
  });

  test("rejects unsupported block types safely", () => {
    const note = createNativeNote();
    note.sections[0].blocks[0].type =
      "RAW_HTML";

    const model =
      buildIntelliTextReaderModel(note);

    expect(model.ready).toBe(false);
    expect(model.state).toBe(
      INTELLITEXT_READER_STATES.INVALID
    );
  });

  test("estimates at least one reading minute", () => {
    expect(
      estimateIntelliTextReadingMinutes([])
    ).toBe(1);
  });

  test("calculates bounded section progress", () => {
    expect(
      calculateReaderSectionProgress(0, 4)
    ).toBe(25);
    expect(
      calculateReaderSectionProgress(3, 4)
    ).toBe(100);
    expect(
      calculateReaderSectionProgress(8, 4)
    ).toBe(100);
  });

  test("resolves previous and next sections", () => {
    const model =
      buildIntelliTextReaderModel(
        createNativeNote()
      );

    expect(
      getAdjacentReaderSection(
        model.sections,
        "practice"
      )
    ).toMatchObject({
      index: 1,
      previous: {
        sectionId: "overview",
      },
      next: null,
    });
  });

  test("builds the catalog return route", () => {
    expect(
      buildIntelliTextCatalogReturnRoute(
        createNativeNote()
      )
    ).toBe(
      "/ctet-tet/notes/plan/PREMIUM/cdp/learning-theories"
    );
  });
});
