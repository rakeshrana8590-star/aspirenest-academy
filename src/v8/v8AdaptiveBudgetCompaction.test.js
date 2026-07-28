import {
  INTELLITEXT_SEMANTIC_MAX_BLOCKS,
  transformMigratedSectionsToSemantic,
  validateSemanticTextbook,
} from "./v8SemanticMigrationCompatibility";

describe("R20 adaptive budget compaction", () => {
  test("preserves ordered mixed semantic content while bringing oversized graphs under 180 blocks", () => {
    const blocks = Array.from({ length: 240 }, (_, index) => {
      const position = index + 1;

      if (index % 3 === 0) {
        return {
          blockId: `paragraph_${position}`,
          type: "PARAGRAPH",
          payload: {
            text: `Learning sentence ${position} remains exact after adaptive compaction.`,
          },
        };
      }

      if (index % 3 === 1) {
        return {
          blockId: `table_${position}`,
          type: "TABLE",
          payload: {
            title: `Table ${position}`,
            headers: ["Concept", "Value"],
            rows: [[`Concept ${position}`, `Value ${position}`]],
          },
        };
      }

      return {
        blockId: `visual_${position}`,
        type: "IMAGE",
        payload: {
          src: `https://example.com/visual-${position}.png`,
          caption: `Visual ${position}`,
        },
      };
    });

    const result = transformMigratedSectionsToSemantic({
      textbookId: "adaptive_mixed_note",
      sections: [
        {
          sectionId: "source_mixed",
          title: "Pages 1-240",
          blocks,
        },
      ],
    });
    const validation = validateSemanticTextbook({ sections: result.sections });

    expect(result.quality.textFidelity).toBe("PASS");
    expect(validation.semantic).toBe(true);
    expect(validation.blockCount).toBeLessThanOrEqual(
      INTELLITEXT_SEMANTIC_MAX_BLOCKS
    );
    expect(validation.adaptiveSequenceCount).toBeGreaterThan(0);
    expect(validation.semanticGroupCount).toBeGreaterThan(0);
    expect(validation.tableGalleryCount).toBeGreaterThan(0);
    expect(validation.sourceReferenceGalleryCount).toBeGreaterThan(0);
  });
});
