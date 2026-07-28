import {
  normalizeScienceMigratedTextbookForPremiumReader,
} from "./v8ScienceSemanticCompatibility";

export const INTELLITEXT_SEMANTIC_PROFILE =
  "FOUNDER_APPROVED_INTELLITEXT_SEMANTIC_V2";
export const INTELLITEXT_SEMANTIC_MAX_SECTIONS = 30;
export const INTELLITEXT_SEMANTIC_MAX_BLOCKS = 180;
export const INTELLITEXT_SEMANTIC_MAX_PARAGRAPH = 900;
export const INTELLITEXT_SEMANTIC_GROUP_MAX_ITEMS = 48;
export const INTELLITEXT_SEMANTIC_GROUP_MAX_CHARACTERS = 32000;
export const INTELLITEXT_VISUAL_GALLERY_MAX_ITEMS = 24;
export const INTELLITEXT_TABLE_GALLERY_MAX_ITEMS = 8;
export const INTELLITEXT_ADAPTIVE_SEQUENCE_MAX_ENTRIES = 6;
export const INTELLITEXT_ADAPTIVE_SEQUENCE_MAX_CHARACTERS = 700000;

const clean = (value = "") =>
  String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\u00ad/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

const upper = (value = "") => clean(value).toUpperCase();

const safeId = (value = "", fallback = "semantic") =>
  clean(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || fallback;

const fnv1a = (value = "") => {
  let hash = 2166136261;
  const source = String(value || "");

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const pageRangeTitle = (value = "") =>
  /^pages?\s+\d+(?:\s*[-–—]\s*\d+)?$/i.test(clean(value));

const payloadOf = (block = {}) =>
  block?.payload && typeof block.payload === "object"
    ? block.payload
    : block?.content && typeof block.content === "object"
      ? block.content
      : {};

const itemText = (item) =>
  item && typeof item === "object"
    ? clean(
        item.text ||
          item.label ||
          item.description ||
          item.question ||
          item.value ||
          ""
      )
    : clean(item);

const blockTextFragments = (block = {}) => {
  const payload = payloadOf(block);
  const type = upper(block.type || block.blockType || "PARAGRAPH");
  const displayMode = upper(payload.displayMode);

  if (displayMode === "ADAPTIVE_SEQUENCE") {
    return (Array.isArray(payload.entries) ? payload.entries : [])
      .flatMap((entry) => {
        const entryMode = upper(entry?.displayMode);

        if (["SEMANTIC_GROUP", "SOURCE_METADATA_GROUP"].includes(entryMode)) {
          return (Array.isArray(entry?.items) ? entry.items : [])
            .flatMap((item) => {
              if (!item || typeof item !== "object") return [itemText(item)];
              if (Array.isArray(item.fragments)) return item.fragments.map(itemText);
              return [itemText(item)];
            });
        }

        if (entryMode === "TABLE_GALLERY") {
          return (Array.isArray(entry?.tables) ? entry.tables : [])
            .flatMap((table) => [
              ...(Array.isArray(table?.headers) ? table.headers : []).map(itemText),
              ...(Array.isArray(table?.rows) ? table.rows : [])
                .flatMap((row) =>
                  Array.isArray(row) ? row : Object.values(row || {})
                )
                .map(itemText),
            ]);
        }

        return [];
      })
      .filter(Boolean);
  }

  if (displayMode === "SEMANTIC_GROUP") {
    return (Array.isArray(payload.items) ? payload.items : [])
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [itemText(item)];
        if (Array.isArray(item.fragments)) {
          return item.fragments.map(itemText);
        }
        return [itemText(item)];
      })
      .filter(Boolean);
  }

  if (displayMode === "SOURCE_METADATA_GROUP") {
    return (Array.isArray(payload.items) ? payload.items : [])
      .map(itemText)
      .filter(Boolean);
  }

  if (displayMode === "TABLE_GALLERY") {
    return (Array.isArray(payload.tables) ? payload.tables : [])
      .flatMap((table) => [
        ...(Array.isArray(table?.headers) ? table.headers : []).map(itemText),
        ...(Array.isArray(table?.rows) ? table.rows : [])
          .flatMap((row) =>
            Array.isArray(row) ? row : Object.values(row || {})
          )
          .map(itemText),
      ])
      .filter(Boolean);
  }

  if (type === "HEADING") {
    return [clean(payload.title || payload.text)];
  }

  if (type === "BULLET_LIST") {
    return (payload.items || payload.points || [])
      .map(itemText)
      .filter(Boolean);
  }

  if (["TABLE", "COMPARISON"].includes(type)) {
    return [
      ...(Array.isArray(payload.headers) ? payload.headers : []).map(itemText),
      ...(Array.isArray(payload.rows) ? payload.rows : [])
        .flatMap((row) =>
          Array.isArray(row) ? row : Object.values(row || {})
        )
        .map(itemText),
    ].filter(Boolean);
  }

  if (["IMAGE", "DIAGRAM", "FLOWCHART"].includes(type)) {
    return [];
  }

  if (["MCQ", "PRACTICE_SET"].includes(type)) {
    return [
      clean(payload.question || payload.title),
      ...(payload.items || payload.options || []).map(itemText),
    ].filter(Boolean);
  }

  return [
    clean(
      payload.text ||
        payload.body ||
        payload.content ||
        payload.description ||
        payload.explanation ||
        payload.definition ||
        ""
    ),
  ].filter(Boolean);
};

const normalizeFidelity = (value = "") =>
  clean(value)
    .normalize("NFKC")
    .replace(/[📘📖🎯🔴⭐📌💡✅❌⚠️🔬📝📚🧠🚀]/gu, " ")
    .replace(
      /(?:^|\s)(?:•|▪|◦|●|○|►|→|[-–—])\s+/g,
      " "
    )
    .replace(/(?:^|\s)\d+[.)]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const sourceTextFromMigratedSections = (sections = []) =>
  (Array.isArray(sections) ? sections : [])
    .flatMap((section) => [
      ...(!pageRangeTitle(section?.title) && clean(section?.title)
        ? [clean(section.title)]
        : []),
      ...(Array.isArray(section?.blocks) ? section.blocks : [])
        .flatMap(blockTextFragments),
    ])
    .filter(Boolean)
    .join("\n");

export const semanticTextFromSections = (sections = []) =>
  (Array.isArray(sections) ? sections : [])
    .flatMap((section) => [
      ...(section?.sourceTitle === true && clean(section?.title)
        ? [clean(section.title)]
        : []),
      ...(Array.isArray(section?.blocks) ? section.blocks : [])
        .flatMap(blockTextFragments),
    ])
    .filter(Boolean)
    .join("\n");

export const fidelityTokens = (value = "") =>
  normalizeFidelity(value)
    .match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];

export const fidelityTokenInventory = (value = "") =>
  fidelityTokens(value)
    .sort((left, right) => left.localeCompare(right))
    .join("\n");

const tokenCounts = (value = "") => {
  const counts = new Map();

  fidelityTokens(value).forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1);
  });

  return counts;
};

export const fidelityDifference = (
  sourceValue = "",
  targetValue = ""
) => {
  const source = tokenCounts(sourceValue);
  const target = tokenCounts(targetValue);
  const missing = [];
  const extra = [];
  const tokens = new Set([...source.keys(), ...target.keys()]);

  [...tokens]
    .sort((left, right) => left.localeCompare(right))
    .forEach((token) => {
      const sourceCount = source.get(token) || 0;
      const targetCount = target.get(token) || 0;

      if (sourceCount > targetCount) {
        missing.push(`${token}:${sourceCount - targetCount}`);
      }

      if (targetCount > sourceCount) {
        extra.push(`${token}:${targetCount - sourceCount}`);
      }
    });

  return Object.freeze({
    extra: Object.freeze(extra),
    missing: Object.freeze(missing),
    sourceTokenCount: fidelityTokens(sourceValue).length,
    targetTokenCount: fidelityTokens(targetValue).length,
  });
};

const sequenceTextHash = (value = "") =>
  fnv1a(normalizeFidelity(value));

const textHash = (value = "") =>
  fnv1a(fidelityTokenInventory(value));

const splitInlineStructure = (value = "") =>
  String(value || "")
    .replace(/\r/g, "\n")
    .replace(
      /\s+(?=(?:PREFACE|INTRODUCTION|OVERVIEW|CONTENTS|PART\s+[A-Z0-9]+|UNIT\s+\d+|CHAPTER\s+\d+|SECTION\s+\d+|LESSON\s+\d+|MODULE\s+\d+)\b)/gi,
      "\n"
    )
    .replace(
      /\s+(?=(?:📘|📖|🎯|🔴|⭐|📌|💡|✅|❌|⚠️|Q\d+\b))/gu,
      "\n"
    )
    .replace(/\s+•\s*/g, "\n• ")
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n+/)
    .map(clean)
    .filter(Boolean);

const repeatedSourceMetadata = (line = "") =>
  /^(?:prepared by|aspirenest academy|page\s+\d+\s*(?:of\s+\d+)?|copyright|all rights reserved)/i.test(
    clean(line)
  );

const majorHeading = (line = "") => {
  const text = clean(line).replace(/^[📘📖🎯🔬⭐📌]+\s*/u, "");

  if (!text || text.length > 150) return "";

  if (
    /^(?:PREFACE|INTRODUCTION|OVERVIEW|CONTENTS|HOW TO USE (?:THIS )?(?:BOOK|NOTE)|EXAM STRATEGY|QUICK REVISION|MEGA REVISION|ANSWER KEY|GLOSSARY)$/i.test(
      text
    )
  ) {
    return text
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  if (
    /^(?:PART|UNIT|CHAPTER|SECTION|LESSON|MODULE)\s+[A-Z0-9IVXLC]+(?:\s*[:.\-–—]\s*|\s+).+/i.test(
      text
    )
  ) {
    return text.replace(/\s+/g, " ");
  }

  const allCaps =
    text.length >= 6 &&
    text.length <= 120 &&
    text === text.toUpperCase() &&
    /[A-Z]/.test(text) &&
    !/[.!?]$/.test(text);

  return allCaps ? text.replace(/\s+/g, " ") : "";
};

const subHeading = (line = "") => {
  const text = clean(line).replace(/^[📘📖🎯🔴⭐📌💡✅]+\s*/u, "");

  if (!text || text.length > 130) return "";

  if (/^\d+(?:\.\d+){1,4}\s+\S+/.test(text)) {
    return text.replace(/\s+/g, " ");
  }

  if (
    /^(?:definition|example|key points?|important|remember|exam point|examiner(?:'s|’s)? (?:trap|favourite)|common (?:mistake|misconception)|classroom implication|pedagogy connection|mentor tip|summary|revision booster|quick revision|practice|activity|learning outcome|objectives?)\b/i.test(
      text
    )
  ) {
    return text.replace(/\s+/g, " ");
  }

  return "";
};

const calloutType = (line = "") => {
  const text = upper(line);

  if (/COMMON (?:MISTAKE|MISCONCEPTION)|EXAMINER['’]S TRAP/.test(text)) {
    return "COMMON_MISTAKE";
  }

  if (
    /EXAM POINT|EXAMINER['’]S FAVOURITE|NCERT LINE|MOST REPEATED|IMPORTANT FOR EXAM/.test(
      text
    )
  ) {
    return "EXAM_POINT";
  }

  if (/MENTOR TIP|CLASSROOM IMPLICATION|PEDAGOGY CONNECTION|TEACHING TIP/.test(text)) {
    return "MENTOR_TIP";
  }

  if (/REVISION BOOSTER|QUICK REVISION|REMEMBER|RECAP/.test(text)) {
    return "REVISION_BOX";
  }

  if (/^SUMMARY\b/.test(text)) return "SUMMARY";
  if (/^DEFINITION\b/.test(text)) return "DEFINITION";
  if (/^EXAMPLE\b/.test(text)) return "EXAMPLE";

  return "";
};

const bulletValue = (line = "") => {
  const text = clean(line);
  const match = text.match(
    /^(?:•|▪|◦|●|○|►|→|[-–—]|\d+[.)])\s+(.+)$/
  );

  return match ? clean(match[1]) : "";
};

const questionLine = (line = "") =>
  /^(?:Q(?:uestion)?\s*\d+|MCQ\s*\d+|\d+[.)])\s*.+[?]/i.test(
    clean(line)
  );

const splitParagraph = (value = "", maximum = 650) => {
  const text = clean(value);
  if (!text) return [];
  if (text.length <= maximum) return [text];

  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9₹📌🔴⭐])/)
    .map(clean)
    .filter(Boolean);
  const chunks = [];
  let current = "";

  for (const sentence of sentences.length ? sentences : [text]) {
    if (!current) {
      current = sentence;
      continue;
    }

    if (`${current} ${sentence}`.length <= maximum) {
      current = `${current} ${sentence}`;
      continue;
    }

    chunks.push(current);
    current = sentence;
  }

  if (current) chunks.push(current);

  if (chunks.length === 1 && chunks[0].length > maximum) {
    const hard = [];
    let remaining = chunks[0];

    while (remaining.length > maximum) {
      let boundary = remaining.lastIndexOf(" ", maximum);
      if (boundary < maximum * 0.55) boundary = maximum;
      hard.push(clean(remaining.slice(0, boundary)));
      remaining = clean(remaining.slice(boundary));
    }

    if (remaining) hard.push(remaining);
    return hard;
  }

  return chunks;
};

const makeBlock = ({
  blockId,
  type,
  payload,
  sourceBlockId = "",
  sourceSectionId = "",
}) => ({
  blockId,
  id: blockId,
  order: 0,
  payload,
  sourceBlockId,
  sourceSectionId,
  type,
});

const makeSection = ({
  title,
  index,
  sourceTitle = false,
  sourceSectionId = "",
}) => {
  const sectionId = safeId(
    `semantic_${String(index + 1).padStart(2, "0")}_${title}`,
    `semantic_${index + 1}`
  );

  return {
    blocks: [],
    id: sectionId,
    order: index,
    sectionId,
    sourceSectionIds: sourceSectionId ? [sourceSectionId] : [],
    sourceTitle,
    summary: null,
    title: clean(title) || `Section ${index + 1}`,
  };
};

const appendBlock = (section, block) => {
  if (!section || !block) return;
  block.order = section.blocks.length;
  section.blocks.push(block);
};

const mergeParagraphBlocks = (blocks = [], maximum = INTELLITEXT_SEMANTIC_MAX_PARAGRAPH) => {
  const output = [];

  for (const block of blocks) {
    const previous = output[output.length - 1];
    const displayMode = upper(block?.payload?.displayMode);

    if (
      previous &&
      previous.type === "PARAGRAPH" &&
      block.type === "PARAGRAPH" &&
      upper(previous?.payload?.displayMode) !== "SOURCE_METADATA" &&
      displayMode !== "SOURCE_METADATA"
    ) {
      const merged = clean(
        `${previous.payload?.text || ""} ${block.payload?.text || ""}`
      );

      if (merged.length <= maximum) {
        previous.payload = {
          ...(previous.payload || {}),
          text: merged,
        };
        continue;
      }
    }

    output.push({
      ...block,
      payload: { ...(block.payload || {}) },
    });
  }

  return output.map((block, index) => ({ ...block, order: index }));
};

const semanticAtomFromBlock = (block = {}) => {
  const payload = payloadOf(block);
  const type = upper(block.type || "PARAGRAPH");
  const displayMode = upper(payload.displayMode);

  if (displayMode === "SOURCE_METADATA") {
    return Object.freeze({
      displayMode: "SOURCE_METADATA_GROUP",
      fragments: blockTextFragments(block),
      kind: "SOURCE_METADATA",
      sourceBlockId: clean(block.sourceBlockId),
      sourceSectionId: clean(block.sourceSectionId),
    });
  }

  if (["IMAGE", "DIAGRAM", "FLOWCHART"].includes(type)) {
    return Object.freeze({
      displayMode: "SOURCE_REFERENCE_GALLERY",
      kind: "VISUAL",
      sourceBlockId: clean(block.sourceBlockId),
      sourceSectionId: clean(block.sourceSectionId),
      visual: {
        alt: clean(payload.alt),
        caption: clean(payload.caption || payload.description),
        description: clean(payload.description),
        src: clean(payload.src || payload.url || payload.imageUrl),
        type,
      },
    });
  }

  if (["TABLE", "COMPARISON"].includes(type)) {
    return Object.freeze({
      displayMode: "TABLE_GALLERY",
      kind: "TABLE",
      sourceBlockId: clean(block.sourceBlockId),
      sourceSectionId: clean(block.sourceSectionId),
      table: {
        headers: Array.isArray(payload.headers) ? payload.headers : [],
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        text: clean(payload.text),
        title: clean(payload.title),
        type,
      },
    });
  }

  return Object.freeze({
    displayMode: "SEMANTIC_GROUP",
    fragments: blockTextFragments(block),
    item: {
      fragments: blockTextFragments(block),
      kind: type,
      text: blockTextFragments(block).join("\n"),
      title: clean(payload.title || payload.term),
    },
    kind: "TEXT",
    sourceBlockId: clean(block.sourceBlockId),
    sourceSectionId: clean(block.sourceSectionId),
  });
};

const groupedBlock = ({
  blockId,
  displayMode,
  items = [],
  sourceBlockId = "",
  sourceSectionId = "",
  tables = [],
  visuals = [],
} = {}) => {
  if (displayMode === "SOURCE_REFERENCE_GALLERY") {
    return makeBlock({
      blockId,
      type: "IMAGE",
      payload: {
        displayMode,
        visuals,
      },
      sourceBlockId,
      sourceSectionId,
    });
  }

  if (displayMode === "TABLE_GALLERY") {
    return makeBlock({
      blockId,
      type: "TABLE",
      payload: {
        displayMode,
        tables,
      },
      sourceBlockId,
      sourceSectionId,
    });
  }

  return makeBlock({
    blockId,
    type: "BULLET_LIST",
    payload: {
      displayMode,
      items,
    },
    sourceBlockId,
    sourceSectionId,
  });
};

const packSectionBlocks = (section = {}, sectionIndex = 0) => {
  const atoms = (Array.isArray(section.blocks) ? section.blocks : [])
    .map(semanticAtomFromBlock);
  const output = [];
  let group = null;
  let sequence = 1;

  const nextId = (suffix) => safeId(
    `${section.sectionId || section.id || `section_${sectionIndex + 1}`}_${suffix}_${String(sequence++).padStart(3, "0")}`
  );

  const flush = () => {
    if (!group) return;
    const first = group.atoms[0] || {};

    output.push(groupedBlock({
      blockId: nextId(group.displayMode.toLowerCase()),
      displayMode: group.displayMode,
      items: group.items,
      sourceBlockId: first.sourceBlockId,
      sourceSectionId: first.sourceSectionId,
      tables: group.tables,
      visuals: group.visuals,
    }));
    group = null;
  };

  const begin = (displayMode) => {
    group = {
      atoms: [],
      characters: 0,
      displayMode,
      items: [],
      tables: [],
      visuals: [],
    };
  };

  const wouldOverflow = (atom) => {
    if (!group) return false;
    if (group.displayMode !== atom.displayMode) return true;

    if (atom.displayMode === "SOURCE_REFERENCE_GALLERY") {
      return group.visuals.length >= INTELLITEXT_VISUAL_GALLERY_MAX_ITEMS;
    }

    if (atom.displayMode === "TABLE_GALLERY") {
      return group.tables.length >= INTELLITEXT_TABLE_GALLERY_MAX_ITEMS;
    }

    const nextCharacters =
      group.characters + (atom.fragments || []).join("\n").length;
    return (
      group.items.length >= INTELLITEXT_SEMANTIC_GROUP_MAX_ITEMS ||
      nextCharacters > INTELLITEXT_SEMANTIC_GROUP_MAX_CHARACTERS
    );
  };

  atoms.forEach((atom) => {
    if (!group || wouldOverflow(atom)) {
      flush();
      begin(atom.displayMode);
    }

    group.atoms.push(atom);

    if (atom.displayMode === "SOURCE_REFERENCE_GALLERY") {
      group.visuals.push(atom.visual);
      return;
    }

    if (atom.displayMode === "TABLE_GALLERY") {
      group.tables.push(atom.table);
      return;
    }

    if (atom.displayMode === "SOURCE_METADATA_GROUP") {
      group.items.push(...(atom.fragments || []));
      group.characters += (atom.fragments || []).join("\n").length;
      return;
    }

    group.items.push(atom.item);
    group.characters += (atom.fragments || []).join("\n").length;
  });

  flush();

  return output.map((block, index) => ({ ...block, order: index }));
};

const adaptiveEntryFromBlock = (block = {}) => {
  const payload = payloadOf(block);
  const displayMode = upper(payload.displayMode);

  if (displayMode === "SOURCE_REFERENCE_GALLERY") {
    return { displayMode, visuals: Array.isArray(payload.visuals) ? payload.visuals : [] };
  }

  if (displayMode === "TABLE_GALLERY") {
    return { displayMode, tables: Array.isArray(payload.tables) ? payload.tables : [] };
  }

  return {
    displayMode: displayMode || "SEMANTIC_GROUP",
    items: Array.isArray(payload.items) ? payload.items : [],
  };
};

const bundleSectionBlocks = (section = {}, sectionIndex = 0, maximumEntries = 2) => {
  const sourceBlocks = Array.isArray(section.blocks) ? section.blocks : [];
  const output = [];
  let pending = [];
  let pendingCharacters = 0;
  let sequence = 1;

  const flush = () => {
    if (pending.length === 0) return;

    if (pending.length === 1) {
      output.push(pending[0]);
    } else {
      const first = pending[0] || {};
      const blockId = safeId(
        `${section.sectionId || section.id || `section_${sectionIndex + 1}`}_adaptive_sequence_${String(sequence++).padStart(3, "0")}`
      );

      output.push(makeBlock({
        blockId,
        type: "BULLET_LIST",
        payload: {
          displayMode: "ADAPTIVE_SEQUENCE",
          entries: pending.map(adaptiveEntryFromBlock),
        },
        sourceBlockId: clean(first.sourceBlockId),
        sourceSectionId: clean(first.sourceSectionId),
      }));
    }

    pending = [];
    pendingCharacters = 0;
  };

  sourceBlocks.forEach((block) => {
    const entry = adaptiveEntryFromBlock(block);
    const entryCharacters = JSON.stringify(entry).length;
    const wouldOverflow =
      pending.length >= maximumEntries ||
      (pending.length > 0 &&
        pendingCharacters + entryCharacters >
          INTELLITEXT_ADAPTIVE_SEQUENCE_MAX_CHARACTERS);

    if (wouldOverflow) flush();

    pending.push(block);
    pendingCharacters += entryCharacters;
  });

  flush();

  return output.map((block, blockIndex) => ({
    ...block,
    order: blockIndex,
  }));
};

const countBlocks = (sections = []) =>
  sections.reduce(
    (total, section) => total + (Array.isArray(section.blocks) ? section.blocks.length : 0),
    0
  );

const compactSections = (sections = []) => {
  const packed = sections.map((section, index) => ({
    ...section,
    order: index,
    blocks: packSectionBlocks(
      {
        ...section,
        blocks: mergeParagraphBlocks(section.blocks),
      },
      index
    ),
  }));

  if (countBlocks(packed) <= INTELLITEXT_SEMANTIC_MAX_BLOCKS) {
    return packed.map((section, index) => ({
      ...section,
      order: index,
      blocks: section.blocks.map((block, blockIndex) => ({
        ...block,
        order: blockIndex,
      })),
    }));
  }

  for (
    let maximumEntries = 2;
    maximumEntries <= INTELLITEXT_ADAPTIVE_SEQUENCE_MAX_ENTRIES;
    maximumEntries += 1
  ) {
    const adaptive = packed.map((section, index) => ({
      ...section,
      order: index,
      blocks: bundleSectionBlocks(section, index, maximumEntries),
    }));
    const adaptiveCount = countBlocks(adaptive);

    if (adaptiveCount <= INTELLITEXT_SEMANTIC_MAX_BLOCKS) {
      return adaptive;
    }
  }

  throw new Error(
    `SEMANTIC_ADAPTIVE_COMPACTION_LIMIT_EXCEEDED:${countBlocks(packed)}`
  );
};

export function transformMigratedSectionsToSemantic({
  textbookId = "",
  sections = [],
} = {}) {
  const sourceSections = Array.isArray(sections) ? sections : [];
  const sourceText = sourceTextFromMigratedSections(sourceSections);
  const transformed = [];
  const counter = { value: 1 };
  let current = null;
  let pendingParagraph = [];
  let pendingBullets = [];
  let pendingSource = { blockId: "", sectionId: "" };

  const nextBlockId = (prefix = "block") =>
    safeId(
      `${textbookId || "note"}_${prefix}_${String(counter.value++).padStart(4, "0")}`
    );

  const ensureSection = ({
    title = "Overview",
    sourceTitle = false,
    sourceSectionId = "",
  } = {}) => {
    if (!current) {
      current = makeSection({
        title,
        index: transformed.length,
        sourceTitle,
        sourceSectionId,
      });
      transformed.push(current);
    }

    if (
      sourceSectionId &&
      !current.sourceSectionIds.includes(sourceSectionId)
    ) {
      current.sourceSectionIds.push(sourceSectionId);
    }

    return current;
  };

  const flushParagraph = () => {
    if (!current || pendingParagraph.length === 0) return;

    const joined = clean(pendingParagraph.join(" "));
    const sourceBlockId = pendingSource.blockId;
    const sourceSectionId = pendingSource.sectionId;

    splitParagraph(joined).forEach((paragraph) => {
      appendBlock(
        current,
        makeBlock({
          blockId: nextBlockId("paragraph"),
          type: "PARAGRAPH",
          payload: { text: paragraph },
          sourceBlockId,
          sourceSectionId,
        })
      );
    });

    pendingParagraph = [];
  };

  const flushBullets = () => {
    if (!current || pendingBullets.length === 0) return;

    appendBlock(
      current,
      makeBlock({
        blockId: nextBlockId("bullets"),
        type: "BULLET_LIST",
        payload: { items: [...pendingBullets] },
        sourceBlockId: pendingSource.blockId,
        sourceSectionId: pendingSource.sectionId,
      })
    );

    pendingBullets = [];
  };

  const flushText = () => {
    flushParagraph();
    flushBullets();
  };

  const startMajorSection = (title, sourceSectionId = "") => {
    flushText();

    if (transformed.length >= INTELLITEXT_SEMANTIC_MAX_SECTIONS) {
      ensureSection({ sourceSectionId });
      appendBlock(
        current,
        makeBlock({
          blockId: nextBlockId("heading"),
          type: "HEADING",
          payload: { title },
          sourceSectionId,
        })
      );
      return;
    }

    current = makeSection({
      title,
      index: transformed.length,
      sourceTitle: true,
      sourceSectionId,
    });
    transformed.push(current);
  };

  const processLine = ({
    line,
    sourceBlockId,
    sourceSectionId,
  }) => {
    const major = majorHeading(line);

    if (major) {
      startMajorSection(major, sourceSectionId);
      return;
    }

    ensureSection({
      title: "Overview",
      sourceTitle: false,
      sourceSectionId,
    });

    if (repeatedSourceMetadata(line)) {
      flushText();
      appendBlock(
        current,
        makeBlock({
          blockId: nextBlockId("source-metadata"),
          type: "PARAGRAPH",
          payload: {
            displayMode: "SOURCE_METADATA",
            text: line,
          },
          sourceBlockId,
          sourceSectionId,
        })
      );
      return;
    }

    const bullet = bulletValue(line);

    if (bullet) {
      flushParagraph();
      pendingSource = {
        blockId: sourceBlockId,
        sectionId: sourceSectionId,
      };
      pendingBullets.push(bullet);
      return;
    }

    const callout = calloutType(line);

    if (callout) {
      flushText();
      appendBlock(
        current,
        makeBlock({
          blockId: nextBlockId(callout.toLowerCase()),
          type: callout,
          payload: {
            text: line,
            title: line.split(":")[0].slice(0, 100),
          },
          sourceBlockId,
          sourceSectionId,
        })
      );
      return;
    }

    if (questionLine(line)) {
      flushText();
      appendBlock(
        current,
        makeBlock({
          blockId: nextBlockId("practice"),
          type: "PRACTICE_SET",
          payload: {
            items: [],
            question: line,
          },
          sourceBlockId,
          sourceSectionId,
        })
      );
      return;
    }

    const heading = subHeading(line);

    if (heading) {
      flushText();
      appendBlock(
        current,
        makeBlock({
          blockId: nextBlockId("heading"),
          type: "HEADING",
          payload: { title: heading },
          sourceBlockId,
          sourceSectionId,
        })
      );
      return;
    }

    flushBullets();
    pendingSource = {
      blockId: sourceBlockId,
      sectionId: sourceSectionId,
    };
    pendingParagraph.push(line);

    if (pendingParagraph.join(" ").length >= 620) {
      flushParagraph();
    }
  };

  sourceSections.forEach((section, sectionIndex) => {
    const sourceSectionId = clean(
      section?.sectionId || section?.id || `source_${sectionIndex + 1}`
    );
    const originalTitle = clean(section?.title);
    const originalTitleIsSource =
      originalTitle && !pageRangeTitle(originalTitle);

    flushText();

    if (originalTitleIsSource) {
      startMajorSection(originalTitle, sourceSectionId);
    } else {
      ensureSection({
        title: "Overview",
        sourceTitle: false,
        sourceSectionId,
      });
    }

    (Array.isArray(section?.blocks) ? section.blocks : []).forEach(
      (block, blockIndex) => {
        const sourceBlockId = clean(
          block?.blockId ||
            block?.id ||
            `${sourceSectionId}_block_${blockIndex + 1}`
        );
        const type = upper(block?.type || block?.blockType || "PARAGRAPH");
        const payload = payloadOf(block);

        if (["IMAGE", "DIAGRAM", "FLOWCHART"].includes(type)) {
          flushText();
          appendBlock(
            ensureSection({ sourceSectionId }),
            makeBlock({
              blockId: nextBlockId("source-reference"),
              type,
              payload: {
                ...payload,
                caption: clean(
                  payload.caption ||
                    payload.description ||
                    `Original PDF visual reference`
                ),
                displayMode: "SOURCE_REFERENCE",
                sourceSectionTitle: originalTitle,
              },
              sourceBlockId,
              sourceSectionId,
            })
          );
          return;
        }

        if (type === "BULLET_LIST") {
          flushText();
          const items = (payload.items || payload.points || [])
            .map(itemText)
            .filter(Boolean);

          if (items.length > 0) {
            appendBlock(
              ensureSection({ sourceSectionId }),
              makeBlock({
                blockId: nextBlockId("bullets"),
                type: "BULLET_LIST",
                payload: { ...payload, items },
                sourceBlockId,
                sourceSectionId,
              })
            );
          }
          return;
        }

        if (!["PARAGRAPH", "HEADING"].includes(type)) {
          flushText();
          appendBlock(
            ensureSection({ sourceSectionId }),
            makeBlock({
              blockId: nextBlockId(type.toLowerCase()),
              type,
              payload: { ...payload },
              sourceBlockId,
              sourceSectionId,
            })
          );
          return;
        }

        const fragments = blockTextFragments(block);

        fragments
          .flatMap(splitInlineStructure)
          .forEach((line) =>
            processLine({
              line,
              sourceBlockId,
              sourceSectionId,
            })
          );
      }
    );

    flushText();
  });

  flushText();

  const sourceCompleteSections = transformed
    .filter((section) => clean(section.title))
    .map((section) => {
      const blocks = Array.isArray(section.blocks)
        ? section.blocks
        : [];

      if (blocks.length > 0) return section;
      if (section.sourceTitle !== true) return null;

      const blockId = safeId(
        `${section.sectionId || section.id}_structural_title`
      );

      return {
        ...section,
        sourceTitle: false,
        blocks: [
          makeBlock({
            blockId,
            type: "HEADING",
            payload: {
              displayMode: "STRUCTURAL_TITLE",
              title: clean(section.title),
            },
            sourceSectionId: clean(
              section.sourceSectionIds?.[0]
            ),
          }),
        ],
      };
    })
    .filter(Boolean);

  const semanticSections = compactSections(
    sourceCompleteSections
  ).map((section, index) => ({
    ...section,
    order: index,
    blocks: section.blocks.map((block, blockIndex) => ({
      ...block,
      order: blockIndex,
    })),
  }));

  const targetText = semanticTextFromSections(semanticSections);
  const sourceInventory = fidelityTokenInventory(sourceText);
  const targetInventory = fidelityTokenInventory(targetText);
  const sourceHash = textHash(sourceText);
  const targetHash = textHash(targetText);
  const sourceSequenceHash = sequenceTextHash(sourceText);
  const targetSequenceHash = sequenceTextHash(targetText);
  const difference = fidelityDifference(sourceText, targetText);

  if (!sourceInventory || sourceInventory !== targetInventory) {
    throw new Error(
      [
        "SEMANTIC_TOKEN_FIDELITY_MISMATCH",
        sourceHash,
        targetHash,
        `SOURCE_TOKENS=${difference.sourceTokenCount}`,
        `TARGET_TOKENS=${difference.targetTokenCount}`,
        `MISSING=${difference.missing.slice(0, 12).join(",") || "NONE"}`,
        `EXTRA=${difference.extra.slice(0, 12).join(",") || "NONE"}`,
      ].join(":")
    );
  }

  return Object.freeze({
    blockCount: semanticSections.reduce(
      (total, section) => total + section.blocks.length,
      0
    ),
    quality: Object.freeze({
      blockSequenceHash: targetSequenceHash,
      blockTextHash: targetHash,
      fidelityMode: "TOKEN_MULTISET_EXACT",
      sourceSequenceHash,
      sourceTextHash: sourceHash,
      sourceTokenCount: difference.sourceTokenCount,
      targetTokenCount: difference.targetTokenCount,
      textFidelity: "PASS",
      visualReferenceCount: semanticSections.reduce(
        (total, section) =>
          total +
          section.blocks.reduce((sectionTotal, block) => {
            if (["IMAGE", "DIAGRAM", "FLOWCHART"].includes(upper(block.type))) {
              return sectionTotal + 1;
            }

            if (upper(payloadOf(block).displayMode) === "ADAPTIVE_SEQUENCE") {
              return (payloadOf(block).entries || []).reduce(
                (entryTotal, entry) =>
                  entryTotal +
                  (upper(entry?.displayMode) === "SOURCE_REFERENCE_GALLERY"
                    ? (entry?.visuals || []).length
                    : 0),
                sectionTotal
              );
            }

            return sectionTotal;
          }, 0),
        0
      ),
    }),
    sections: Object.freeze(semanticSections),
  });
}

export function validateSemanticTextbook(input = {}) {
  const sections = Array.isArray(input?.sections)
    ? input.sections
    : Array.isArray(input?.intelliText?.sections)
      ? input.intelliText.sections
      : [];
  const blocks = sections.flatMap((section) =>
    Array.isArray(section?.blocks) ? section.blocks : []
  );
  const pageRanges = sections.filter((section) =>
    pageRangeTitle(section?.title)
  );
  const paragraphLengths = blocks.flatMap((block) => {
    const payload = payloadOf(block);
    const displayMode = upper(payload.displayMode);

    if (upper(block.type) === "PARAGRAPH") {
      return displayMode === "SOURCE_METADATA"
        ? []
        : [clean(payload.text).length];
    }

    if (displayMode === "SEMANTIC_GROUP") {
      return (Array.isArray(payload.items) ? payload.items : [])
        .filter((item) => upper(item?.kind) === "PARAGRAPH")
        .flatMap((item) =>
          Array.isArray(item?.fragments)
            ? item.fragments.map((fragment) => clean(fragment).length)
            : [clean(item?.text).length]
        );
    }

    if (displayMode === "ADAPTIVE_SEQUENCE") {
      return (Array.isArray(payload.entries) ? payload.entries : [])
        .filter((entry) => upper(entry?.displayMode) === "SEMANTIC_GROUP")
        .flatMap((entry) =>
          (Array.isArray(entry?.items) ? entry.items : [])
            .filter((item) => upper(item?.kind) === "PARAGRAPH")
            .flatMap((item) =>
              Array.isArray(item?.fragments)
                ? item.fragments.map((fragment) => clean(fragment).length)
                : [clean(item?.text).length]
            )
        );
    }

    return [];
  });
  const visibleBlocks = blocks.filter((block) =>
    !upper(payloadOf(block).displayMode).startsWith("SOURCE_METADATA")
  );
  const structuredBlockTypes = new Set([
    "BULLET_LIST",
    "COMMON_MISTAKE",
    "COMPARISON",
    "DEFINITION",
    "EXAM_POINT",
    "EXAMPLE",
    "FORMULA",
    "HEADING",
    "MCQ",
    "MENTOR_TIP",
    "PRACTICE_SET",
    "REVISION_BOX",
    "SUMMARY",
    "TABLE",
    "TIMELINE",
  ]);
  const structuredBlockCount = visibleBlocks.filter((block) =>
    structuredBlockTypes.has(upper(block.type))
  ).length;
  const sourceMetadataCount = blocks.filter(
    (block) =>
      upper(payloadOf(block).displayMode) === "SOURCE_METADATA"
  ).length;
  const sourceReferenceCount = blocks.filter(
    (block) =>
      upper(payloadOf(block).displayMode) === "SOURCE_REFERENCE"
  ).length;

  const result = {
    blockCount: blocks.length,
    giantParagraphCount: paragraphLengths.filter(
      (length) => length > INTELLITEXT_SEMANTIC_MAX_PARAGRAPH
    ).length,
    maxParagraphLength: paragraphLengths.length
      ? Math.max(...paragraphLengths)
      : 0,
    pageRangeSectionCount: pageRanges.length,
    sectionCount: sections.length,
    semantic:
      sections.length > 0 &&
      sections.length <= INTELLITEXT_SEMANTIC_MAX_SECTIONS &&
      blocks.length > 0 &&
      blocks.length <= INTELLITEXT_SEMANTIC_MAX_BLOCKS &&
      pageRanges.length === 0 &&
      paragraphLengths.every(
        (length) => length <= INTELLITEXT_SEMANTIC_MAX_PARAGRAPH
      ) &&
      visibleBlocks.length > 0 &&
      (sections.length >= 2 || structuredBlockCount >= 1),
    sourceMetadataCount,
    sourceReferenceCount,
    structuredBlockCount,
    semanticGroupCount:
      blocks.filter(
        (block) => upper(payloadOf(block).displayMode) === "SEMANTIC_GROUP"
      ).length +
      blocks.reduce(
        (total, block) =>
          total +
          (upper(payloadOf(block).displayMode) === "ADAPTIVE_SEQUENCE"
            ? (payloadOf(block).entries || []).filter(
                (entry) => upper(entry?.displayMode) === "SEMANTIC_GROUP"
              ).length
            : 0),
        0
      ),
    sourceReferenceGalleryCount:
      blocks.filter(
        (block) => upper(payloadOf(block).displayMode) === "SOURCE_REFERENCE_GALLERY"
      ).length +
      blocks.reduce(
        (total, block) =>
          total +
          (upper(payloadOf(block).displayMode) === "ADAPTIVE_SEQUENCE"
            ? (payloadOf(block).entries || []).filter(
                (entry) =>
                  upper(entry?.displayMode) === "SOURCE_REFERENCE_GALLERY"
              ).length
            : 0),
        0
      ),
    tableGalleryCount:
      blocks.filter(
        (block) => upper(payloadOf(block).displayMode) === "TABLE_GALLERY"
      ).length +
      blocks.reduce(
        (total, block) =>
          total +
          (upper(payloadOf(block).displayMode) === "ADAPTIVE_SEQUENCE"
            ? (payloadOf(block).entries || []).filter(
                (entry) => upper(entry?.displayMode) === "TABLE_GALLERY"
              ).length
            : 0),
        0
      ),
    adaptiveSequenceCount: blocks.filter(
      (block) => upper(payloadOf(block).displayMode) === "ADAPTIVE_SEQUENCE"
    ).length,
    visibleBlockCount: visibleBlocks.length,
  };

  return Object.freeze(result);
}

export function semanticVersionId({
  textbookId,
  contentVersion,
  sourceTextHash,
} = {}) {
  return safeId(
    `r19_semantic_v${Number(contentVersion || 1)}_${textbookId}_${clean(
      sourceTextHash
    ).slice(0, 8)}`
  );
}

export function normalizeMigratedTextbookForPremiumReader(
  published = {}
) {
  const science =
    normalizeScienceMigratedTextbookForPremiumReader(published);

  if (science !== published) return science;

  const sections = Array.isArray(published?.sections)
    ? published.sections
    : Array.isArray(published?.intelliText?.sections)
      ? published.intelliText.sections
      : [];
  const validation = validateSemanticTextbook({ sections });
  const migrated =
    sections.some((section) => pageRangeTitle(section?.title)) ||
    validation.giantParagraphCount > 0;

  if (!migrated || sections.length === 0) return published;

  try {
    const transformed = transformMigratedSectionsToSemantic({
      textbookId:
        clean(published?.textbookId) ||
        clean(published?.intelliText?.textbookId),
      sections,
    });
    const nextSections = transformed.sections;

    return {
      ...published,
      compatibilityTransform: "GENERIC_PDF_SEMANTIC_PRESENTATION_R19",
      presentationProfile: INTELLITEXT_SEMANTIC_PROFILE,
      sourceSectionCount: sections.length,
      sections: nextSections,
      intelliText: {
        ...(published.intelliText || {}),
        sections: nextSections,
      },
      nativeContent: {
        ...(published.nativeContent || {}),
        sections: nextSections,
      },
    };
  } catch (_) {
    return published;
  }
}

export const __private__ = Object.freeze({
  blockTextFragments,
  bulletValue,
  calloutType,
  majorHeading,
  normalizeFidelity,
  repeatedSourceMetadata,
  splitInlineStructure,
  splitParagraph,
  subHeading,
  textHash,
});
