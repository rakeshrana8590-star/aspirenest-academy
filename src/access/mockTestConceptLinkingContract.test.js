import {
  MOCK_TEST_CONCEPT_LINK_FIELDS,
  MockTestConceptLinkingContractError,
  buildExactTextbookSectionRoute,
  buildMockQuestionConceptFields,
  hasAnyMockQuestionConceptLink,
  hasCompleteMockQuestionConceptLink,
  normalizeMockQuestionConceptLink,
  preserveMockQuestionConceptLink,
} from "./mockTestConceptLinkingContract";

const complete = (overrides = {}) => ({
  blockId: "block_1",
  conceptId: "concept_1",
  conceptLabel: "Child Development",
  contentVersion: 3,
  sectionId: "section_1",
  textbookId: "note_1",
  ...overrides,
});

test("contract exposes the six locked mapping fields", () => {
  expect(MOCK_TEST_CONCEPT_LINK_FIELDS).toEqual([
    "conceptId",
    "conceptLabel",
    "textbookId",
    "sectionId",
    "blockId",
    "contentVersion",
  ]);
});

test("empty mapping is allowed", () => {
  expect(normalizeMockQuestionConceptLink({})).toBeNull();
});

test("any-field detector ignores an empty content version", () => {
  expect(hasAnyMockQuestionConceptLink({ contentVersion: "" })).toBe(false);
});

test("any-field detector finds concept id", () => {
  expect(hasAnyMockQuestionConceptLink({ conceptId: "concept_1" })).toBe(true);
});

test("complete detector accepts a full mapping", () => {
  expect(hasCompleteMockQuestionConceptLink(complete())).toBe(true);
});

test("complete detector rejects a missing block", () => {
  expect(
    hasCompleteMockQuestionConceptLink(complete({ blockId: "" }))
  ).toBe(false);
});

test("partial mapping is denied", () => {
  expect(() =>
    normalizeMockQuestionConceptLink({ conceptId: "concept_1" })
  ).toThrowError(MockTestConceptLinkingContractError);
});

test("partial mapping exposes stable code", () => {
  try {
    normalizeMockQuestionConceptLink({ conceptId: "concept_1" });
    throw new Error("Expected failure");
  } catch (error) {
    expect(error.code).toBe("CONCEPT_LINK_INCOMPLETE");
  }
});

test("required mapping rejects empty input", () => {
  expect(() =>
    normalizeMockQuestionConceptLink({}, { allowEmpty: false })
  ).toThrow("A complete question-to-concept link is required.");
});

test("normalizer trims labels", () => {
  expect(
    normalizeMockQuestionConceptLink(
      complete({ conceptLabel: "  Learning Theory  " })
    ).conceptLabel
  ).toBe("Learning Theory");
});

test("normalizer coerces numeric content version", () => {
  expect(
    normalizeMockQuestionConceptLink(
      complete({ contentVersion: "4" })
    ).contentVersion
  ).toBe(4);
});

test("zero content version is denied", () => {
  expect(() =>
    normalizeMockQuestionConceptLink(
      complete({ contentVersion: 0 })
    )
  ).toThrow("must be supplied together");
});

test("fractional content version is denied", () => {
  expect(() =>
    normalizeMockQuestionConceptLink(
      complete({ contentVersion: 1.5 })
    )
  ).toThrow("must be supplied together");
});

test("unsafe concept id is denied", () => {
  expect(() =>
    normalizeMockQuestionConceptLink(
      complete({ conceptId: "concept / unsafe" })
    )
  ).toThrow();
});

test("concept label maximum is enforced", () => {
  expect(() =>
    normalizeMockQuestionConceptLink(
      complete({ conceptLabel: "x".repeat(181) })
    )
  ).toThrow("180 characters or fewer");
});

test("empty field builder returns all six fields", () => {
  expect(buildMockQuestionConceptFields({})).toEqual({
    blockId: "",
    conceptId: "",
    conceptLabel: "",
    contentVersion: "",
    sectionId: "",
    textbookId: "",
  });
});

test("field builder returns a normalized mapping", () => {
  expect(buildMockQuestionConceptFields(complete())).toEqual(
    complete()
  );
});

test("question preservation keeps existing question data", () => {
  const result = preserveMockQuestionConceptLink({
    ...complete(),
    question: "What is learning?",
  });
  expect(result.question).toBe("What is learning?");
  expect(result.conceptId).toBe("concept_1");
});

test("question preservation emits blank optional fields", () => {
  const result = preserveMockQuestionConceptLink({ question: "Q" });
  expect(result.question).toBe("Q");
  expect(result.textbookId).toBe("");
});

test("route builder uses the existing native reader route", () => {
  expect(buildExactTextbookSectionRoute(complete())).toBe(
    "/ctet-tet/notes/read/note_1?sectionId=section_1&blockId=block_1&contentVersion=3&source=mistake-book"
  );
});

test("route builder URL-encodes textbook identity", () => {
  const route = buildExactTextbookSectionRoute(
    complete({ textbookId: "note_1" })
  );
  expect(route.startsWith("/ctet-tet/notes/read/note_1?")).toBe(true);
});

test("normalized mapping is frozen", () => {
  expect(Object.isFrozen(normalizeMockQuestionConceptLink(complete()))).toBe(
    true
  );
});
