const SCIENCE_PILOT_TEXTBOOK_ID = "KdOrZcjhf7wo85O5N4sn";

const clean = (value = "") => String(value ?? "").replace(/\u00a0/g, " ").trim();

const slug = (value = "") =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "section";

const pageRangeTitle = (value = "") => /^pages?\s+\d+(?:\s*[-–]\s*\d+)?$/i.test(clean(value));

const sourceText = (block = {}) => {
  const payload = block?.payload && typeof block.payload === "object"
    ? block.payload
    : block?.content && typeof block.content === "object"
      ? block.content
      : {};
  return clean(
    payload.text ||
      payload.body ||
      payload.content ||
      payload.description ||
      payload.explanation ||
      payload.title ||
      payload.term ||
      ""
  );
};

const sourcePayload = (block = {}) =>
  block?.payload && typeof block.payload === "object"
    ? block.payload
    : block?.content && typeof block.content === "object"
      ? block.content
      : {};

const normalizeInlineStructure = (value = "") => {
  let text = String(value || "")
    .replace(/\r/g, "\n")
    .replace(/Prepared by AspireNest Academy SCIENCE Notes for CTET\/TETs/gi, "\n")
    .replace(/\s+(?=(?:📘|📖|🎯|🔴|⭐|📌|💡|PART\s+[A-Z]\s*:|CHAPTER\s+\d+\s*:|\d+\.\d+\s+|Q\d+\s*[\.(]))/g, "\n")
    .replace(/\s+•\s*/g, "\n• ")
    .replace(/\s+(?=(?:Golden Strategy Rules|Exam Pattern at a Glance|Subject-wise Distribution in Science|Most Expected MCQs|Higher-Order Thinking Questions|Common Misconceptions|Classroom Activities|PYQ Trend Analysis|Revision Booster))/gi, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  return text
    .split(/\n+/)
    .map((line) => clean(line))
    .filter(Boolean);
};

const majorHeading = (line = "") => {
  const text = clean(line).replace(/^[📘📖🎯🔬]+\s*/u, "");
  if (/^PREFACE$/i.test(text)) return "Preface";
  if (/^HOW TO USE THIS BOOK$/i.test(text)) return "How to Use This Book";
  if (/^CTET\/TET SCIENCE EXAM STRATEGY$/i.test(text)) return "CTET/TET Science Exam Strategy";
  if (/^PART\s+[A-Z]\s*:/i.test(text)) return text.replace(/\s+/g, " ");
  if (/^CHAPTER\s+\d+\s*:/i.test(text)) {
    return text
      .replace(/\s+/g, " ")
      .replace(/^CHAPTER/i, "Chapter");
  }
  return "";
};

const subHeading = (line = "") => {
  const text = clean(line).replace(/^[📘📖🎯🔴⭐📌💡]+\s*/u, "");
  if (/^\d+\.\d+\s+/.test(text)) return text.replace(/\s+/g, " ");
  if (/^(Golden Strategy Rules|Exam Pattern at a Glance|Subject-wise Distribution in Science|Most Expected MCQs|Higher-Order Thinking Questions|Common Misconceptions|Classroom Activities|PYQ Trend Analysis|Revision Booster)/i.test(text)) {
    return text.replace(/\s+/g, " ");
  }
  if (/^[A-Z][A-Z0-9/&()'’\-–,: ]{8,110}$/.test(text) && !/^PART\s|^CHAPTER\s/i.test(text)) {
    return text.replace(/\s+/g, " ");
  }
  return "";
};

const calloutType = (line = "") => {
  const text = clean(line).toUpperCase();
  if (/EXAMINER['’]S TRAP|COMMON MISCONCEPTION|MISCONCEPTION/.test(text)) return "COMMON_MISTAKE";
  if (/EXAMINER['’]S FAVOURITE|NCERT LINE|EXAM POINT|MOST REPEATED CONCEPT/.test(text)) return "EXAM_POINT";
  if (/SMART NOTES|REVISION BOOSTER|QUICK REVISION/.test(text)) return "REVISION_BOX";
  if (/CLASSROOM IMPLICATION|PEDAGOGY CONNECTION|BEST TEACHING METHOD/.test(text)) return "MENTOR_TIP";
  if (/^DEFINITION\s*:/.test(text)) return "DEFINITION";
  return "";
};

const splitParagraph = (value = "", maximum = 620) => {
  const text = clean(value);
  if (!text) return [];
  if (text.length <= maximum) return [text];

  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9📌🔴⭐])/)
    .map(clean)
    .filter(Boolean);
  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if (!current) {
      current = sentence;
      return;
    }
    if (`${current} ${sentence}`.length <= maximum) {
      current = `${current} ${sentence}`;
      return;
    }
    chunks.push(current);
    current = sentence;
  });
  if (current) chunks.push(current);

  if (chunks.length === 1 && chunks[0].length > maximum) {
    const hard = [];
    let rest = chunks[0];
    while (rest.length > maximum) {
      let cut = rest.lastIndexOf(" ", maximum);
      if (cut < maximum * 0.6) cut = maximum;
      hard.push(clean(rest.slice(0, cut)));
      rest = clean(rest.slice(cut));
    }
    if (rest) hard.push(rest);
    return hard;
  }
  return chunks;
};

const makeBlock = ({ id, type, payload, sourceBlockId = "", sourceSectionId = "" }) => ({
  blockId: id,
  id,
  order: 0,
  payload,
  sourceBlockId,
  sourceSectionId,
  type,
});

const makeSection = (title, index, sourceSectionId = "") => ({
  blocks: [],
  id: `science_semantic_${String(index + 1).padStart(2, "0")}_${slug(title)}`,
  order: index,
  sectionId: `science_semantic_${String(index + 1).padStart(2, "0")}_${slug(title)}`,
  sourceSectionIds: sourceSectionId ? [sourceSectionId] : [],
  summary: null,
  title,
});

const appendBlock = (section, block) => {
  if (!section || !block) return;
  block.order = section.blocks.length;
  section.blocks.push(block);
};

const appendParagraphs = ({ section, text, sourceBlockId, sourceSectionId, counter }) => {
  splitParagraph(text).forEach((paragraph) => {
    const id = `${sourceBlockId || sourceSectionId || "science"}_semantic_${counter.value++}`;
    appendBlock(section, makeBlock({
      id,
      type: "PARAGRAPH",
      payload: { text: paragraph },
      sourceBlockId,
      sourceSectionId,
    }));
  });
};

const transformScienceSections = (sections = []) => {
  const transformed = [];
  const counter = { value: 1 };
  let current = null;
  let pendingBullets = [];
  let pendingSource = { blockId: "", sectionId: "" };

  const flushBullets = () => {
    if (!current || pendingBullets.length === 0) return;
    const id = `${pendingSource.blockId || pendingSource.sectionId || "science"}_semantic_${counter.value++}`;
    appendBlock(current, makeBlock({
      id,
      type: "BULLET_LIST",
      payload: { items: [...pendingBullets] },
      sourceBlockId: pendingSource.blockId,
      sourceSectionId: pendingSource.sectionId,
    }));
    pendingBullets = [];
  };

  const ensureSection = (title = "Overview", sourceSectionId = "") => {
    if (!current) {
      current = makeSection(title, transformed.length, sourceSectionId);
      transformed.push(current);
    }
    if (sourceSectionId && !current.sourceSectionIds.includes(sourceSectionId)) {
      current.sourceSectionIds.push(sourceSectionId);
    }
    return current;
  };

  sections.forEach((section, sectionIndex) => {
    const sourceSectionId = clean(section.sectionId || section.id || `source_${sectionIndex + 1}`);
    const textBlocks = [];
    const visualBlocks = [];

    (Array.isArray(section.blocks) ? section.blocks : []).forEach((block) => {
      const type = clean(block.type || block.blockType).toUpperCase();
      if (["IMAGE", "DIAGRAM", "FLOWCHART"].includes(type)) visualBlocks.push(block);
      else textBlocks.push(block);
    });

    textBlocks.forEach((block, blockIndex) => {
      const sourceBlockId = clean(block.blockId || block.id || `${sourceSectionId}_block_${blockIndex + 1}`);
      const lines = normalizeInlineStructure(sourceText(block));

      lines.forEach((line) => {
        const major = majorHeading(line);
        if (major) {
          flushBullets();
          current = makeSection(major, transformed.length, sourceSectionId);
          transformed.push(current);
          return;
        }

        ensureSection(pageRangeTitle(section.title) ? "Overview" : clean(section.title || "Overview"), sourceSectionId);

        const sub = subHeading(line);
        if (sub) {
          flushBullets();
          const id = `${sourceBlockId}_semantic_${counter.value++}`;
          appendBlock(current, makeBlock({
            id,
            type: "HEADING",
            payload: { title: sub },
            sourceBlockId,
            sourceSectionId,
          }));
          return;
        }

        if (/^(?:•|[-–—]|→)\s+/.test(line) || /^\d+\.\s+/.test(line)) {
          pendingSource = { blockId: sourceBlockId, sectionId: sourceSectionId };
          pendingBullets.push(line.replace(/^(?:•|[-–—]|→|\d+\.)\s+/, ""));
          return;
        }

        flushBullets();
        const callout = calloutType(line);
        if (callout) {
          const cleaned = line.replace(/^[📌🔴⭐💡]+\s*/u, "");
          const id = `${sourceBlockId}_semantic_${counter.value++}`;
          appendBlock(current, makeBlock({
            id,
            type: callout,
            payload: { text: cleaned, title: cleaned.split(":")[0].slice(0, 90) },
            sourceBlockId,
            sourceSectionId,
          }));
          return;
        }

        if (/^Q\d+\b/i.test(line)) {
          const id = `${sourceBlockId}_semantic_${counter.value++}`;
          appendBlock(current, makeBlock({
            id,
            type: "PRACTICE_SET",
            payload: { question: line, items: [] },
            sourceBlockId,
            sourceSectionId,
          }));
          return;
        }

        appendParagraphs({
          section: current,
          text: line,
          sourceBlockId,
          sourceSectionId,
          counter,
        });
      });
      flushBullets();
    });

    visualBlocks.forEach((block, visualIndex) => {
      ensureSection(pageRangeTitle(section.title) ? "Overview" : clean(section.title || "Overview"), sourceSectionId);
      const payload = sourcePayload(block);
      const sourceBlockId = clean(block.blockId || block.id || `${sourceSectionId}_visual_${visualIndex + 1}`);
      const id = `${sourceBlockId}_semantic_reference`;
      appendBlock(current, makeBlock({
        id,
        type: clean(block.type || "IMAGE").toUpperCase(),
        payload: {
          ...payload,
          caption: clean(payload.caption || payload.description || `Original source reference from ${section.title || "the PDF"}`),
          displayMode: "SOURCE_REFERENCE",
          sourceSectionTitle: clean(section.title || ""),
        },
        sourceBlockId,
        sourceSectionId,
      }));
    });
  });

  flushBullets();

  return transformed
    .map((section, index) => ({
      ...section,
      blocks: section.blocks.map((block, blockIndex) => ({ ...block, order: blockIndex })),
      order: index,
      summary: section.summary || null,
    }))
    .filter((section) => section.blocks.length > 0);
};

export function normalizeScienceMigratedTextbookForPremiumReader(published = {}) {
  const textbookId = clean(published.textbookId || published.intelliText?.textbookId);
  const sections = Array.isArray(published.sections)
    ? published.sections
    : Array.isArray(published.intelliText?.sections)
      ? published.intelliText.sections
      : [];
  const migratedPageRangeCount = sections.filter((section) => pageRangeTitle(section.title)).length;

  if (
    textbookId !== SCIENCE_PILOT_TEXTBOOK_ID ||
    sections.length === 0 ||
    migratedPageRangeCount < Math.max(2, Math.ceil(sections.length * 0.35))
  ) {
    return published;
  }

  const semanticSections = transformScienceSections(sections);
  if (semanticSections.length < 3) return published;

  const transformed = {
    ...published,
    compatibilityTransform: "SCIENCE_PDF_SEMANTIC_PRESENTATION_V1",
    presentationProfile: "FOUNDER_APPROVED_INTELLITEXT_SEMANTIC_V1",
    sourceSectionCount: sections.length,
    sections: semanticSections,
    intelliText: {
      ...(published.intelliText || {}),
      sections: semanticSections,
    },
    nativeContent: {
      ...(published.nativeContent || {}),
      sections: semanticSections,
    },
  };

  return transformed;
}

export const __private__ = Object.freeze({
  majorHeading,
  normalizeInlineStructure,
  pageRangeTitle,
  splitParagraph,
  subHeading,
  transformScienceSections,
});
