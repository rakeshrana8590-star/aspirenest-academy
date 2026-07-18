import {
  INTELLITEXT_SPARK_LIMITS,
} from "./intelliTextConstants";

function normalizeInteger(
  value,
  field,
  minimum,
  maximum
) {
  const normalized = Number(value);

  if (
    !Number.isSafeInteger(normalized) ||
    normalized < minimum ||
    normalized > maximum
  ) {
    throw new Error(
      `${field} must be an integer from ${minimum} to ${maximum}.`
    );
  }

  return normalized;
}

export function createDefaultIntelliTextSparkReadPlan() {
  return Object.freeze({
    blockLoadMode: "ON_SECTION_OPEN",
    blockPageSize:
      INTELLITEXT_SPARK_LIMITS.DEFAULT_BLOCK_PAGE_SIZE,
    contentListenerStrategy: "NONE",
    preloadSectionCount: 1,
    progressWriteDebounceMs:
      INTELLITEXT_SPARK_LIMITS
        .DEFAULT_PROGRESS_WRITE_DEBOUNCE_MS,
    progressWriteStrategy: "DEBOUNCED_BATCH",
    rootLoadMode: "ONE_SHOT",
    sectionLoadMode: "PAGINATED",
    sectionPageSize:
      INTELLITEXT_SPARK_LIMITS.DEFAULT_SECTION_PAGE_SIZE,
  });
}

export function createIntelliTextSparkReadPlan(input = {}) {
  const defaults = createDefaultIntelliTextSparkReadPlan();

  const plan = {
    ...defaults,
    ...input,
  };

  assertIntelliTextSparkCompatibleReadPlan(plan);

  return Object.freeze({
    blockLoadMode: plan.blockLoadMode,
    blockPageSize: Number(plan.blockPageSize),
    contentListenerStrategy:
      plan.contentListenerStrategy,
    preloadSectionCount:
      Number(plan.preloadSectionCount),
    progressWriteDebounceMs:
      Number(plan.progressWriteDebounceMs),
    progressWriteStrategy:
      plan.progressWriteStrategy,
    rootLoadMode: plan.rootLoadMode,
    sectionLoadMode: plan.sectionLoadMode,
    sectionPageSize: Number(plan.sectionPageSize),
  });
}

export function assertIntelliTextSparkCompatibleReadPlan(
  plan = {}
) {
  if (plan.rootLoadMode !== "ONE_SHOT") {
    throw new Error(
      "Spark-compatible root loading must be ONE_SHOT."
    );
  }

  if (plan.sectionLoadMode !== "PAGINATED") {
    throw new Error(
      "Spark-compatible section loading must be PAGINATED."
    );
  }

  if (plan.blockLoadMode !== "ON_SECTION_OPEN") {
    throw new Error(
      "Blocks must load only when a section opens."
    );
  }

  if (plan.contentListenerStrategy !== "NONE") {
    throw new Error(
      "Content listeners are not allowed in the Spark contract."
    );
  }

  if (plan.progressWriteStrategy !== "DEBOUNCED_BATCH") {
    throw new Error(
      "Progress writes must use DEBOUNCED_BATCH."
    );
  }

  normalizeInteger(
    plan.sectionPageSize,
    "sectionPageSize",
    1,
    INTELLITEXT_SPARK_LIMITS.MAX_SECTION_PAGE_SIZE
  );

  normalizeInteger(
    plan.blockPageSize,
    "blockPageSize",
    1,
    INTELLITEXT_SPARK_LIMITS.MAX_BLOCK_PAGE_SIZE
  );

  normalizeInteger(
    plan.preloadSectionCount,
    "preloadSectionCount",
    0,
    INTELLITEXT_SPARK_LIMITS.MAX_PRELOADED_SECTIONS
  );

  normalizeInteger(
    plan.progressWriteDebounceMs,
    "progressWriteDebounceMs",
    INTELLITEXT_SPARK_LIMITS
      .MIN_PROGRESS_WRITE_DEBOUNCE_MS,
    300000
  );

  return true;
}

export function estimateIntelliTextInitialReads(planInput = {}) {
  const plan = createIntelliTextSparkReadPlan(planInput);

  return (
    1 +
    plan.sectionPageSize +
    plan.blockPageSize * plan.preloadSectionCount +
    1
  );
}
