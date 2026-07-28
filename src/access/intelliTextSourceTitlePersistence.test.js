import {
  createIntelliTextPublishedSection,
  validateIntelliTextAuthoringDraft,
} from "./intelliTextAuthoringContract";
import {
  fidelityTokenInventory,
  semanticTextFromSections,
} from "../v8/v8SemanticMigrationCompatibility";

const draft = () => ({
  access: {
    publicRead: false,
    readEntitlementIds: ["plan_PREMIUM"],
    requiredPlanCode: "PREMIUM",
  },
  baseContentVersion: 0,
  chapterId: "construction",
  contentVersion: 1,
  sections: [
    {
      sectionId: "semantic_01_construction",
      sourceTitle: true,
      title: "Construction",
      blocks: [
        {
          blockId: "block_1",
          type: "PARAGRAPH",
          payload: { text: "Use a ruler and compass." },
        },
      ],
    },
  ],
  subjectId: "mathematics",
  textbookId: "note_construction",
  title: "Construction Note",
  versionId: "semantic_v1",
});

test("source-derived section title survives draft normalization", () => {
  const graph = validateIntelliTextAuthoringDraft(draft());
  expect(graph.sections[0].sourceTitle).toBe(true);
  expect(semanticTextFromSections(graph.sections)).toContain("Construction");
});

test("source-derived section title survives published section conversion", () => {
  const graph = validateIntelliTextAuthoringDraft(draft());
  const published = createIntelliTextPublishedSection(graph.sections[0]);
  expect(published.sourceTitle).toBe(true);

  const hydratedPublished = {
    ...published,
    blocks: graph.sections[0].blocks,
  };

  expect(
    fidelityTokenInventory(semanticTextFromSections([hydratedPublished]))
  ).toEqual(
    fidelityTokenInventory(semanticTextFromSections(graph.sections))
  );
});
