import {
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

export const MOCK_TEST_CONCEPT_LINK_SCHEMA_VERSION = 1;

export const MOCK_TEST_CONCEPT_LINK_FIELDS = Object.freeze([
  "conceptId",
  "conceptLabel",
  "textbookId",
  "sectionId",
  "blockId",
  "contentVersion",
]);

export const MOCK_TEST_CONCEPT_LINK_LIMITS = Object.freeze({
  CONCEPT_LABEL: 180,
});

export class MockTestConceptLinkingContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MockTestConceptLinkingContractError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new MockTestConceptLinkingContractError(code, message);
};

const cleanText = (value = "") => String(value ?? "").trim();

const normalizeContentVersion = (value) => {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 1) {
    fail(
      "CONTENT_VERSION_INVALID",
      "contentVersion must be a positive integer when an exact concept link is used."
    );
  }

  return number;
};

export function hasAnyMockQuestionConceptLink(input = {}) {
  return MOCK_TEST_CONCEPT_LINK_FIELDS.some((field) => {
    if (field === "contentVersion") {
      return cleanText(input[field]) !== "" && Number(input[field]) > 0;
    }

    return cleanText(input[field]) !== "";
  });
}

export function hasCompleteMockQuestionConceptLink(input = {}) {
  return (
    cleanText(input.conceptId) !== "" &&
    cleanText(input.conceptLabel) !== "" &&
    cleanText(input.textbookId) !== "" &&
    cleanText(input.sectionId) !== "" &&
    cleanText(input.blockId) !== "" &&
    Number.isSafeInteger(Number(input.contentVersion)) &&
    Number(input.contentVersion) >= 1
  );
}

export function normalizeMockQuestionConceptLink(
  input = {},
  { allowEmpty = true } = {}
) {
  const hasAny = hasAnyMockQuestionConceptLink(input);

  if (!hasAny) {
    if (!allowEmpty) {
      fail(
        "CONCEPT_LINK_REQUIRED",
        "A complete question-to-concept link is required."
      );
    }

    return null;
  }

  if (!hasCompleteMockQuestionConceptLink(input)) {
    fail(
      "CONCEPT_LINK_INCOMPLETE",
      "Concept ID, concept label, textbook, section, block, and content version must be supplied together."
    );
  }

  const conceptLabel = cleanText(input.conceptLabel);

  if (conceptLabel.length > MOCK_TEST_CONCEPT_LINK_LIMITS.CONCEPT_LABEL) {
    fail(
      "CONCEPT_LABEL_TOO_LONG",
      `conceptLabel must be ${MOCK_TEST_CONCEPT_LINK_LIMITS.CONCEPT_LABEL} characters or fewer.`
    );
  }

  return Object.freeze({
    blockId: normalizeIntelliTextId(input.blockId, "blockId"),
    conceptId: normalizeIntelliTextId(input.conceptId, "conceptId"),
    conceptLabel,
    contentVersion: normalizeContentVersion(input.contentVersion),
    sectionId: normalizeIntelliTextId(input.sectionId, "sectionId"),
    textbookId: normalizeIntelliTextId(input.textbookId, "textbookId"),
  });
}

export function buildMockQuestionConceptFields(input = {}) {
  const link = normalizeMockQuestionConceptLink(input, {
    allowEmpty: true,
  });

  return link
    ? { ...link }
    : {
        blockId: "",
        conceptId: "",
        conceptLabel: "",
        contentVersion: "",
        sectionId: "",
        textbookId: "",
      };
}

export function buildExactTextbookSectionRoute(input = {}) {
  const link = normalizeMockQuestionConceptLink(input, {
    allowEmpty: false,
  });
  const params = new URLSearchParams({
    sectionId: link.sectionId,
    blockId: link.blockId,
    contentVersion: String(link.contentVersion),
    source: "mistake-book",
  });

  return `/ctet-tet/notes/read/${encodeURIComponent(
    link.textbookId
  )}?${params.toString()}`;
}

export function preserveMockQuestionConceptLink(question = {}) {
  return {
    ...question,
    ...buildMockQuestionConceptFields(question),
  };
}
