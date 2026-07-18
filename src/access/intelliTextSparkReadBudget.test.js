import {
  assertIntelliTextSparkCompatibleReadPlan,
  createDefaultIntelliTextSparkReadPlan,
  createIntelliTextSparkReadPlan,
  estimateIntelliTextInitialReads,
} from "./intelliTextSparkReadBudget";

describe("IntelliText Spark read-budget contract", () => {
  test("creates the bounded default plan", () => {
    expect(createDefaultIntelliTextSparkReadPlan()).toEqual({
      blockLoadMode: "ON_SECTION_OPEN",
      blockPageSize: 25,
      contentListenerStrategy: "NONE",
      preloadSectionCount: 1,
      progressWriteDebounceMs: 15000,
      progressWriteStrategy: "DEBOUNCED_BATCH",
      rootLoadMode: "ONE_SHOT",
      sectionLoadMode: "PAGINATED",
      sectionPageSize: 5,
    });
  });

  test("accepts a smaller custom page plan", () => {
    expect(
      createIntelliTextSparkReadPlan({
        blockPageSize: 10,
        preloadSectionCount: 0,
        sectionPageSize: 3,
      })
    ).toMatchObject({
      blockPageSize: 10,
      preloadSectionCount: 0,
      sectionPageSize: 3,
    });
  });

  test("forbids a live content listener", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        contentListenerStrategy: "LIVE",
      })
    ).toThrow("Content listeners are not allowed");
  });

  test("requires one-shot textbook root loading", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        rootLoadMode: "LIVE",
      })
    ).toThrow("root loading must be ONE_SHOT");
  });

  test("requires paginated sections", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        sectionLoadMode: "ALL_AT_ONCE",
      })
    ).toThrow("section loading must be PAGINATED");
  });

  test("loads blocks only when a section opens", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        blockLoadMode: "PRELOAD_ALL",
      })
    ).toThrow("Blocks must load only when a section opens");
  });

  test("forbids more than ten sections per page", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        sectionPageSize: 11,
      })
    ).toThrow("sectionPageSize must be an integer");
  });

  test("forbids more than fifty blocks per page", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        blockPageSize: 51,
      })
    ).toThrow("blockPageSize must be an integer");
  });

  test("preloads at most one section", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        preloadSectionCount: 2,
      })
    ).toThrow("preloadSectionCount must be an integer");
  });

  test("requires debounced batched progress writes", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        progressWriteStrategy: "WRITE_EVERY_SCROLL",
      })
    ).toThrow("Progress writes must use DEBOUNCED_BATCH");
  });

  test("requires at least a five-second progress debounce", () => {
    expect(() =>
      createIntelliTextSparkReadPlan({
        progressWriteDebounceMs: 4999,
      })
    ).toThrow("progressWriteDebounceMs must be an integer");
  });

  test("estimates initial reads without an unbounded listener", () => {
    expect(
      estimateIntelliTextInitialReads({
        blockPageSize: 10,
        preloadSectionCount: 1,
        sectionPageSize: 3,
      })
    ).toBe(15);
  });

  test("returns true for a valid explicit plan", () => {
    expect(
      assertIntelliTextSparkCompatibleReadPlan(
        createDefaultIntelliTextSparkReadPlan()
      )
    ).toBe(true);
  });
});
