import {
  INTELLITEXT_BLOCK_TYPES,
  INTELLITEXT_DELIVERY_MODES,
  INTELLITEXT_PUBLICATION_STATES,
} from "./intelliTextConstants";
import {
  createIntelliTextBlock,
  createIntelliTextSection,
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const INTELLITEXT_READER_ROUTE =
  "/ctet-tet/notes/read";

export const INTELLITEXT_READER_STATES =
  Object.freeze({
    READY: "READY",
    INVALID: "INVALID",
    NOT_NATIVE: "NOT_NATIVE",
    NOT_PUBLISHED: "NOT_PUBLISHED",
    EMPTY: "EMPTY",
  });

const cleanText = (value = "") =>
  String(value ?? "").trim();

const normalizeUpper = (value = "") =>
  cleanText(value).toUpperCase();

const freezeArray = (values = []) =>
  Object.freeze([...values]);

export function buildIntelliTextReaderRoute(
  textbookId
) {
  const normalized = normalizeIntelliTextId(
    textbookId,
    "textbookId"
  );

  return `${INTELLITEXT_READER_ROUTE}/${encodeURIComponent(
    normalized
  )}`;
}

export function getReaderNoteTextbookId(note = {}) {
  return cleanText(
    note.textbookId ||
      note.intelliTextId ||
      note.readerId ||
      note.intelliText?.textbookId ||
      note.nativeContent?.textbookId ||
      note.id ||
      note.itemId ||
      note.contentId ||
      note.noteId
  );
}

export function getReaderNoteDeliveryMode(note = {}) {
  const mode = normalizeUpper(
    note.deliveryMode ||
      note.deliveryType ||
      note.intelliText?.deliveryMode ||
      note.nativeContent?.deliveryMode
  );

  return mode === INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT
    ? INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT
    : INTELLITEXT_DELIVERY_MODES.LEGACY_PDF;
}

export function getReaderNotePublicationState(
  note = {}
) {
  const state = normalizeUpper(
    note.publicationState ||
      note.intelliText?.publicationState ||
      note.nativeContent?.publicationState ||
      note.status
  );

  return state === "PUBLISHED"
    ? INTELLITEXT_PUBLICATION_STATES.PUBLISHED
    : state || INTELLITEXT_PUBLICATION_STATES.DRAFT;
}

export function findIntelliTextNoteById(
  contentItems = [],
  textbookId = ""
) {
  const normalized = cleanText(textbookId);

  if (!normalized) {
    return null;
  }

  return (
    contentItems.find(
      (note) =>
        getReaderNoteTextbookId(note) ===
        normalized
    ) || null
  );
}

function getRawSections(note = {}) {
  const candidates = [
    note.intelliText?.sections,
    note.nativeContent?.sections,
    note.sections,
  ];

  return (
    candidates.find(Array.isArray) || []
  );
}

function getRawBlocks(section = {}) {
  const candidates = [
    section.blocks,
    section.contentBlocks,
    section.items,
  ];

  return (
    candidates.find(Array.isArray) || []
  );
}

function normalizeReaderBlock({
  rawBlock,
  index,
  sectionId,
  textbookId,
  contentVersion,
}) {
  const type = normalizeUpper(
    rawBlock?.type ||
      rawBlock?.blockType ||
      "PARAGRAPH"
  );

  if (!INTELLITEXT_BLOCK_TYPES.includes(type)) {
    throw new Error(
      `Unsupported IntelliText block type: ${type}`
    );
  }

  return createIntelliTextBlock({
    blockId:
      rawBlock?.blockId ||
      rawBlock?.id ||
      `${sectionId}_block_${index + 1}`,
    contentVersion:
      Number(
        rawBlock?.contentVersion ??
          contentVersion
      ),
    order:
      Number(rawBlock?.order ?? index),
    payload:
      rawBlock?.payload ||
      rawBlock?.content ||
      {
        text:
          rawBlock?.text ||
          rawBlock?.title ||
          "",
      },
    sectionId,
    textbookId,
    type,
  });
}

function normalizeReaderSection({
  rawSection,
  index,
  textbookId,
  contentVersion,
}) {
  const sectionId =
    rawSection?.sectionId ||
    rawSection?.id ||
    `section_${index + 1}`;

  const rawBlocks = getRawBlocks(rawSection);

  const section = createIntelliTextSection({
    blockCount: rawBlocks.length,
    contentVersion:
      Number(
        rawSection?.contentVersion ??
          contentVersion
      ),
    order:
      Number(rawSection?.order ?? index),
    published:
      rawSection?.published !== false,
    sectionId,
    summary:
      rawSection?.summary ||
      rawSection?.description ||
      "",
    textbookId,
    title:
      rawSection?.title ||
      `Section ${index + 1}`,
  });

  const blocks = rawBlocks
    .map((rawBlock, blockIndex) =>
      normalizeReaderBlock({
        rawBlock,
        index: blockIndex,
        sectionId: section.sectionId,
        textbookId,
        contentVersion:
          section.contentVersion,
      })
    )
    .sort((left, right) =>
      left.order - right.order
    );

  return Object.freeze({
    ...section,
    blocks: freezeArray(blocks),
  });
}

function countReaderWords(sections = []) {
  const text = sections
    .flatMap((section) =>
      section.blocks.map((block) =>
        JSON.stringify(block.payload)
      )
    )
    .join(" ")
    .replace(/[{}[\]",:]/g, " ");

  return text
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

export function estimateIntelliTextReadingMinutes(
  sections = []
) {
  const wordCount = countReaderWords(sections);

  return Math.max(
    1,
    Math.ceil(wordCount / 180)
  );
}

export function calculateReaderSectionProgress(
  sectionIndex,
  sectionCount
) {
  const count = Number(sectionCount);
  const index = Number(sectionIndex);

  if (
    !Number.isFinite(count) ||
    count <= 0 ||
    !Number.isFinite(index)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((index + 1) / count) * 100
      )
    )
  );
}

export function getAdjacentReaderSection(
  sections = [],
  activeSectionId = ""
) {
  const index = sections.findIndex(
    (section) =>
      section.sectionId === activeSectionId
  );

  return Object.freeze({
    index,
    previous:
      index > 0
        ? sections[index - 1]
        : null,
    next:
      index >= 0 &&
      index < sections.length - 1
        ? sections[index + 1]
        : null,
  });
}

export function buildIntelliTextCatalogReturnRoute(
  note = {}
) {
  const plan = encodeURIComponent(
    cleanText(
      note.planType ||
        note.accessPlan ||
        note.plan ||
        "FREE"
    ).toUpperCase()
  );
  const subject = encodeURIComponent(
    cleanText(
      note.subjectSlug ||
        note.subjectId ||
        note.subject ||
        "general"
    )
  );
  const chapter = encodeURIComponent(
    cleanText(
      note.chapterSlug ||
        note.chapterId ||
        note.chapter ||
        note.topic ||
        "general"
    )
  );

  return (
    `/ctet-tet/notes/plan/${plan}` +
    `/${subject}/${chapter}`
  );
}

export function buildIntelliTextReaderModel(
  note = {}
) {
  try {
    const textbookId = normalizeIntelliTextId(
      getReaderNoteTextbookId(note),
      "textbookId"
    );
    const deliveryMode =
      getReaderNoteDeliveryMode(note);
    const publicationState =
      getReaderNotePublicationState(note);
    const contentVersion = Number(
      note.contentVersion ||
        note.intelliText?.contentVersion ||
        note.nativeContent?.contentVersion ||
        1
    );

    if (
      deliveryMode !==
      INTELLITEXT_DELIVERY_MODES.NATIVE_TEXT
    ) {
      return Object.freeze({
        ready: false,
        state:
          INTELLITEXT_READER_STATES.NOT_NATIVE,
        textbookId,
      });
    }

    if (
      publicationState !==
      INTELLITEXT_PUBLICATION_STATES.PUBLISHED
    ) {
      return Object.freeze({
        ready: false,
        state:
          INTELLITEXT_READER_STATES.NOT_PUBLISHED,
        textbookId,
      });
    }

    const sections = getRawSections(note)
      .filter(
        (rawSection) =>
          rawSection?.published !== false
      )
      .map((rawSection, index) =>
        normalizeReaderSection({
          rawSection,
          index,
          textbookId,
          contentVersion,
        })
      )
      .sort((left, right) =>
        left.order - right.order
      );

    if (sections.length === 0) {
      return Object.freeze({
        ready: false,
        state:
          INTELLITEXT_READER_STATES.EMPTY,
        textbookId,
      });
    }

    const toc = sections.map(
      (section, index) =>
        Object.freeze({
          index,
          sectionId: section.sectionId,
          title: section.title,
          summary: section.summary,
          blockCount: section.blocks.length,
        })
    );

    return Object.freeze({
      ready: true,
      state: INTELLITEXT_READER_STATES.READY,
      textbookId,
      title:
        cleanText(note.title) ||
        "AspireNest IntelliText",
      description:
        cleanText(note.description),
      contentVersion,
      deliveryMode,
      publicationState,
      sections: freezeArray(sections),
      toc: freezeArray(toc),
      estimatedReadingMinutes:
        estimateIntelliTextReadingMinutes(
          sections
        ),
      returnRoute:
        buildIntelliTextCatalogReturnRoute(
          note
        ),
    });
  } catch (error) {
    return Object.freeze({
      ready: false,
      state: INTELLITEXT_READER_STATES.INVALID,
      errorCode:
        error?.code ||
        "INTELLITEXT_READER_INVALID",
      message:
        error?.message ||
        "This native note cannot be opened safely.",
    });
  }
}
