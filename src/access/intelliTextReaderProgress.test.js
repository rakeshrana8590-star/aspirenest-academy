import {
  INTELLITEXT_PROGRESS_SCHEMA_VERSION,
  INTELLITEXT_PROGRESS_STORAGE_PREFIX,
  buildIntelliTextProgressKey,
  clearIntelliTextProgress,
  createIntelliTextProgressRecord,
  readIntelliTextProgress,
  resolveContinueReadingSection,
  writeIntelliTextProgress,
} from "./intelliTextReaderProgress";

function createStorage() {
  const values = new Map();

  return {
    getItem: (key) =>
      values.has(key)
        ? values.get(key)
        : null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe("IntelliText reader progress", () => {
  test("uses the locked progress schema", () => {
    expect(
      INTELLITEXT_PROGRESS_SCHEMA_VERSION
    ).toBe(1);
    expect(
      INTELLITEXT_PROGRESS_STORAGE_PREFIX
    ).toContain("reading-progress");
  });

  test("builds an owner and resource scoped key", () => {
    expect(
      buildIntelliTextProgressKey({
        uid: "student_1",
        textbookId: "note_1",
      })
    ).toBe(
      `${INTELLITEXT_PROGRESS_STORAGE_PREFIX}:student_1:note_1`
    );
  });

  test("rejects unsafe key identities", () => {
    expect(() =>
      buildIntelliTextProgressKey({
        uid: "student/1",
        textbookId: "note_1",
      })
    ).toThrow("uid");
  });

  test("creates a normalized immutable record", () => {
    const record =
      createIntelliTextProgressRecord({
        uid: "student_1",
        textbookId: "note_1",
        contentVersion: 2,
        sectionId: "overview",
        progressPercent: 44.6,
        updatedAt: "2026-07-18T00:00:00.000Z",
      });

    expect(record).toEqual({
      schemaVersion: 1,
      uid: "student_1",
      textbookId: "note_1",
      contentVersion: 2,
      sectionId: "overview",
      blockId: null,
      progressPercent: 45,
      updatedAt: "2026-07-18T00:00:00.000Z",
    });
    expect(Object.isFrozen(record)).toBe(true);
  });

  test("clamps progress to zero and one hundred", () => {
    expect(
      createIntelliTextProgressRecord({
        uid: "student_1",
        textbookId: "note_1",
        sectionId: "overview",
        progressPercent: -20,
      }).progressPercent
    ).toBe(0);

    expect(
      createIntelliTextProgressRecord({
        uid: "student_1",
        textbookId: "note_1",
        sectionId: "overview",
        progressPercent: 500,
      }).progressPercent
    ).toBe(100);
  });

  test("writes and reads progress", () => {
    const storage = createStorage();

    expect(
      writeIntelliTextProgress({
        storage,
        record: {
          uid: "student_1",
          textbookId: "note_1",
          sectionId: "overview",
          contentVersion: 2,
          progressPercent: 30,
        },
      })
    ).toBe(true);

    expect(
      readIntelliTextProgress({
        storage,
        uid: "student_1",
        textbookId: "note_1",
        contentVersion: 2,
      })
    ).toMatchObject({
      sectionId: "overview",
      progressPercent: 30,
    });
  });

  test("rejects a content-version mismatch", () => {
    const storage = createStorage();

    writeIntelliTextProgress({
      storage,
      record: {
        uid: "student_1",
        textbookId: "note_1",
        sectionId: "overview",
        contentVersion: 2,
        progressPercent: 30,
      },
    });

    expect(
      readIntelliTextProgress({
        storage,
        uid: "student_1",
        textbookId: "note_1",
        contentVersion: 3,
      })
    ).toBeNull();
  });

  test("returns null for corrupt storage", () => {
    const storage = createStorage();
    const key =
      buildIntelliTextProgressKey({
        uid: "student_1",
        textbookId: "note_1",
      });

    storage.setItem(key, "{broken");

    expect(
      readIntelliTextProgress({
        storage,
        uid: "student_1",
        textbookId: "note_1",
        contentVersion: 1,
      })
    ).toBeNull();
  });

  test("does not write without a storage adapter", () => {
    expect(
      writeIntelliTextProgress({
        storage: null,
        record: {},
      })
    ).toBe(false);
  });

  test("clears progress", () => {
    const storage = createStorage();

    writeIntelliTextProgress({
      storage,
      record: {
        uid: "student_1",
        textbookId: "note_1",
        sectionId: "overview",
      },
    });

    expect(
      clearIntelliTextProgress({
        storage,
        uid: "student_1",
        textbookId: "note_1",
      })
    ).toBe(true);

    expect(
      readIntelliTextProgress({
        storage,
        uid: "student_1",
        textbookId: "note_1",
      })
    ).toBeNull();
  });

  test("continues from the stored section", () => {
    const sections = [
      { sectionId: "overview" },
      { sectionId: "practice" },
    ];

    expect(
      resolveContinueReadingSection({
        sections,
        progress: {
          sectionId: "practice",
        },
      })
    ).toEqual({
      sectionId: "practice",
    });
  });

  test("falls back to the first section", () => {
    const sections = [
      { sectionId: "overview" },
      { sectionId: "practice" },
    ];

    expect(
      resolveContinueReadingSection({
        sections,
        progress: {
          sectionId: "missing",
        },
      })
    ).toEqual({
      sectionId: "overview",
    });
  });
});
