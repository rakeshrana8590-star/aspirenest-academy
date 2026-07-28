import {
  normalizeScienceMigratedTextbookForPremiumReader,
} from "./v8ScienceSemanticCompatibility";

const SCIENCE_ID = "KdOrZcjhf7wo85O5N4sn";

const migrated = () => ({
  textbookId: SCIENCE_ID,
  title: "CTET/TET Paper II Science Master Guide",
  contentVersion: 2,
  sections: [
    {
      sectionId: "pages_1_3",
      title: "Pages 1-3",
      blocks: [
        {
          blockId: "text_1",
          type: "PARAGRAPH",
          payload: {
            text: "📘 PREFACE This guide builds content mastery. 📖 HOW TO USE THIS BOOK • Read concept sections • Solve MCQs 🎯 CTET/TET SCIENCE EXAM STRATEGY Golden Strategy Rules 1. Attempt pedagogy questions first. PART A: SCIENCE CONTENT CHAPTER 1: FOOD — SOURCES, COMPONENTS & CLEANING 1.1 Quick Exam Overview Parameter Details NCERT Source Class VI Science. 1.2 Concept Introduction Food is the foundation of life — every living organism needs food for energy, growth, and protection from disease.",
          },
        },
        {
          blockId: "visual_2",
          type: "IMAGE",
          payload: {
            src: "https://example.com/page-2.png",
            caption: "Original visual reference - page 2",
          },
        },
      ],
    },
    {
      sectionId: "pages_4_6",
      title: "Pages 4-6",
      blocks: [
        {
          blockId: "text_2",
          type: "PARAGRAPH",
          payload: {
            text: "1.3 NCERT-Based Detailed Explanation A. Sources of Food • Roots include carrot and radish • Leaves include spinach 🔴 EXAMINER'S TRAP: Chickens are omnivores. Q1. Which nutrient is identified by iodine?",
          },
        },
      ],
    },
    {
      sectionId: "pages_7_9",
      title: "Pages 7-9",
      blocks: [
        {
          blockId: "text_3",
          type: "PARAGRAPH",
          payload: {
            text: "CHAPTER 2: MATERIALS OF DAILY USE 2.1 Quick Exam Overview Materials can be sorted by transparency, hardness and solubility.",
          },
        },
      ],
    },
  ],
});

test("converts Science page-range migration sections into semantic sections", () => {
  const note = normalizeScienceMigratedTextbookForPremiumReader(migrated());
  expect(note.presentationProfile).toBe("FOUNDER_APPROVED_INTELLITEXT_SEMANTIC_V1");
  expect(note.sections.length).toBeGreaterThanOrEqual(5);
  expect(note.sections.some((section) => /Chapter 1/i.test(section.title))).toBe(true);
  expect(note.sections.some((section) => /Chapter 2/i.test(section.title))).toBe(true);
  expect(note.sections.every((section) => !/^Pages/i.test(section.title))).toBe(true);
});

test("splits oversized migration paragraphs and creates semantic block types", () => {
  const note = normalizeScienceMigratedTextbookForPremiumReader(migrated());
  const blocks = note.sections.flatMap((section) => section.blocks);
  const paragraphs = blocks.filter((block) => block.type === "PARAGRAPH");
  expect(Math.max(...paragraphs.map((block) => block.payload.text.length))).toBeLessThanOrEqual(620);
  expect(blocks.some((block) => block.type === "BULLET_LIST")).toBe(true);
  expect(blocks.some((block) => block.type === "COMMON_MISTAKE")).toBe(true);
  expect(blocks.some((block) => block.type === "PRACTICE_SET")).toBe(true);
});

test("keeps original visuals available as collapsed source references", () => {
  const note = normalizeScienceMigratedTextbookForPremiumReader(migrated());
  const visual = note.sections
    .flatMap((section) => section.blocks)
    .find((block) => block.type === "IMAGE");
  expect(visual.payload.displayMode).toBe("SOURCE_REFERENCE");
  expect(visual.payload.src).toBe("https://example.com/page-2.png");
});

test("does not rewrite other textbooks or already semantic Notes", () => {
  const other = { ...migrated(), textbookId: "another_note" };
  expect(normalizeScienceMigratedTextbookForPremiumReader(other)).toBe(other);

  const semantic = {
    ...migrated(),
    sections: [{ sectionId: "intro", title: "Introduction", blocks: [{ blockId: "b1", type: "PARAGRAPH", payload: { text: "Ready." } }] }],
  };
  expect(normalizeScienceMigratedTextbookForPremiumReader(semantic)).toBe(semantic);
});
