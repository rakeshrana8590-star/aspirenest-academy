import {
  INTELLITEXT_SEMANTIC_PROFILE,
  fidelityDifference,
  fidelityTokenInventory,
  normalizeMigratedTextbookForPremiumReader,
  pageRangeTitle,
  semanticVersionId,
  transformMigratedSectionsToSemantic,
  validateSemanticTextbook,
} from "./v8SemanticMigrationCompatibility";

const roughSections = [
  {
    sectionId: "source_1",
    title: "Pages 1-3",
    blocks: [
      {
        blockId: "source_block_1",
        type: "PARAGRAPH",
        payload: {
          text:
            "PREFACE\n" +
            "This premium guide explains the complete topic clearly for CTET/TET aspirants.\n" +
            "• First learning point\n" +
            "• Second learning point\n" +
            "EXAM POINT: Revise the key distinction before solving MCQs.\n" +
            "CHAPTER 1: FOUNDATIONS OF LEARNING\n" +
            "1.1 Core Concept\n" +
            "Learners actively construct knowledge through experience and reflection.",
        },
      },
      {
        blockId: "source_visual_1",
        type: "IMAGE",
        payload: {
          src: "https://example.com/visual.jpg",
          caption: "Original visual",
        },
      },
    ],
  },
];

describe("R19 semantic PDF migration", () => {
  test("page ranges become semantic sections with exact text fidelity", () => {
    const result = transformMigratedSectionsToSemantic({
      textbookId: "note_1",
      sections: roughSections,
    });

    expect(result.quality.textFidelity).toBe("PASS");
    expect(result.sections.some((section) => pageRangeTitle(section.title))).toBe(false);
    expect(result.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining([
        "Preface",
        "CHAPTER 1: FOUNDATIONS OF LEARNING",
      ])
    );

    const validation = validateSemanticTextbook({
      sections: result.sections,
    });

    expect(validation.semantic).toBe(true);
    expect(validation.giantParagraphCount).toBe(0);
    expect(result.quality.visualReferenceCount).toBe(1);
  });

  test("runtime compatibility keeps approved semantic output", () => {
    const published = normalizeMigratedTextbookForPremiumReader({
      textbookId: "note_1",
      sections: roughSections,
    });

    expect(published.presentationProfile).toBe(
      INTELLITEXT_SEMANTIC_PROFILE
    );
    expect(
      validateSemanticTextbook(published).semantic
    ).toBe(true);
  });

  test("fidelity allows semantic reordering but rejects token loss", () => {
    const source =
      "CHILD DEVELOPMENT Learners construct knowledge Exam Point";
    const reordered =
      "Exam Point knowledge construct Learners DEVELOPMENT CHILD";

    expect(fidelityTokenInventory(source)).toBe(
      fidelityTokenInventory(reordered)
    );
    expect(fidelityDifference(source, reordered)).toEqual(
      expect.objectContaining({
        missing: [],
        extra: [],
        sourceTokenCount: 7,
        targetTokenCount: 7,
      })
    );
    expect(
      fidelityDifference(source, `${reordered} extra`).extra
    ).toEqual(["extra:1"]);
  });

  test("preserves source-title-only sections", () => {
    const result = transformMigratedSectionsToSemantic({
      textbookId: "title_only_note",
      sections: [
        {
          sectionId: "source_title_only",
          title: "CHILD DEVELOPMENT",
          blocks: [],
        },
        {
          sectionId: "source_body",
          title: "Pages 1-3",
          blocks: [
            {
              blockId: "body_1",
              type: "PARAGRAPH",
              payload: {
                text:
                  "Learners construct knowledge through experience.",
              },
            },
          ],
        },
      ],
    });

    expect(result.quality.textFidelity).toBe("PASS");
    expect(result.quality.fidelityMode).toBe(
      "TOKEN_MULTISET_EXACT"
    );
    expect(
      result.sections.some(
        (section) => section.title === "CHILD DEVELOPMENT"
      )
    ).toBe(true);
  });

  test("semantic version IDs are stable", () => {
    expect(
      semanticVersionId({
        textbookId: "note_1",
        contentVersion: 1,
        sourceTextHash: "12345678abcdef",
      })
    ).toBe(
      semanticVersionId({
        textbookId: "note_1",
        contentVersion: 1,
        sourceTextHash: "12345678abcdef",
      })
    );
  });

  test("compacts a 925-block imported Note below the 180-block authoring limit without losing text", () => {
    const blocks = Array.from({ length: 925 }, (_, index) => ({
      blockId: `source_${index + 1}`,
      type: index % 37 === 0 ? "IMAGE" : "PARAGRAPH",
      payload:
        index % 37 === 0
          ? {
              src: `https://example.com/page-${index + 1}.png`,
              caption: `Original page ${index + 1}`,
            }
          : {
              text: `Sentence ${index + 1} preserves the exact imported learning content.`,
            },
    }));

    const result = transformMigratedSectionsToSemantic({
      textbookId: "large_note",
      sections: [
        {
          sectionId: "large_source",
          title: "Pages 1-925",
          blocks,
        },
      ],
    });
    const validation = validateSemanticTextbook({
      sections: result.sections,
    });

    expect(result.quality.textFidelity).toBe("PASS");
    expect(validation.semantic).toBe(true);
    expect(validation.blockCount).toBeLessThanOrEqual(180);
    expect(validation.giantParagraphCount).toBe(0);
    expect(validation.semanticGroupCount).toBeGreaterThan(0);
    expect(validation.sourceReferenceGalleryCount).toBeGreaterThan(0);
  });

});
