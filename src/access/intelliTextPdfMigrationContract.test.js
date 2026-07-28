import {
  buildIntelliTextMigrationDraftInput,
  getCanonicalMigrationPlanCode,
  normalizeIntelliTextMigrationBundle,
  normalizeIntelliTextMigrationNote,
  selectCanonicalPublishedMigrationNotes,
} from "./intelliTextPdfMigrationContract";

const hash = "a".repeat(64);
const note = (index = 1, overrides = {}) => ({
  textbookId: `note_${index}`,
  title: `Note ${index}`,
  subjectId: "cdp",
  chapterId: `chapter_${index}`,
  planCode: "PREMIUM",
  pageCount: 2,
  sourceSha256: "b".repeat(64),
  sections: [
    {
      sectionId: `section_${index}`,
      title: "Introduction",
      blocks: [
        {
          blockId: `block_${index}`,
          type: "PARAGRAPH",
          payload: { text: "Exact extracted learning text." },
        },
      ],
    },
  ],
  quality: {
    textFidelity: "PASS",
    sourceTextSha256: hash,
    blockTextSha256: hash,
    visualPages: [],
    visualReviewRequired: false,
    blockingIssues: [],
    autoPublishEligible: false,
  },
  ...overrides,
});

describe("IntelliText PDF migration contract", () => {
  test("requires the complete 48-note migration bundle", () => {
    const bundle = normalizeIntelliTextMigrationBundle({
      schemaVersion: 1,
      generatedAt: "2026-07-26T00:00:00.000Z",
      projectId: "aspirenest-platform",
      sourceCollection: "contentItems+protectedContentAssets",
      notes: Array.from({ length: 48 }, (_, index) => note(index + 1)),
    });
    expect(bundle.notes).toHaveLength(48);
    expect(new Set(bundle.notes.map((item) => item.textbookId)).size).toBe(48);
  });


  test("selects the real normalized Admin catalog shape without requiring raw section fields", () => {
    const resources = [
      ...Array.from({ length: 48 }, (_, index) => ({
        id: `note_${index + 1}`,
        type: "PDF Note",
        status: "Published",
        access: index % 2 === 0 ? "PREMIUM" : "BASIC",
        title: `Note ${index + 1}`,
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `ca_${index + 1}`,
        type: "Current Affairs",
        status: "Published",
        title: `Current Affairs ${index + 1}`,
      })),
      { id: "draft_note", type: "Native Note", status: "Draft" },
      { id: "published_test", type: "Mock Test", status: "Published" },
    ];

    const selected = selectCanonicalPublishedMigrationNotes(resources);
    expect(selected).toHaveLength(48);
    expect(selected.every((item) => item.type === "PDF Note")).toBe(true);
    expect(getCanonicalMigrationPlanCode(selected[0])).toBe("PREMIUM");
    expect(getCanonicalMigrationPlanCode(selected[1])).toBe("BASIC");
  });

  test("rejects any source/block text hash mismatch", () => {
    expect(() =>
      normalizeIntelliTextMigrationNote(
        note(1, {
          quality: {
            ...note(1).quality,
            blockTextSha256: "c".repeat(64),
          },
        })
      )
    ).toThrow("same SHA-256");
  });

  test("keeps the canonical Note ID and maps legacy Mentorship Notes to Premium", () => {
    const draft = buildIntelliTextMigrationDraftInput({
      migrationNote: note(1, { planCode: "MENTORSHIP" }),
      canonicalNote: { id: "note_1", planType: "MENTORSHIP" },
      root: { contentVersion: 3 },
    });
    expect(draft.textbookId).toBe("note_1");
    expect(draft.contentVersion).toBe(4);
    expect(draft.access.requiredPlanCode).toBe("PREMIUM");
    expect(draft.access.readEntitlementIds).toContain("plan_PREMIUM");
  });
});
