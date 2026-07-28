jest.mock("../firebase", () => ({
  auth: { currentUser: { uid: "admin_uid", email: "aspirenestplatform@gmail.com" } },
  db: {},
  storage: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...parts) => parts.join("/")),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  updateDoc: jest.fn(async () => undefined),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn((storage, path) => ({ storage, path })),
  uploadString: jest.fn(async () => undefined),
  getDownloadURL: jest.fn(async (objectRef) => `https://storage.test/${objectRef.path}`),
}));

import {
  importIntelliTextMigrationBatch,
  loadIntelliTextMigrationBundle,
  materializeIntelliTextMigrationVisuals,
} from "./intelliTextPdfMigrationClient";

const hash = "a".repeat(64);
const migrationNote = (index) => ({
  textbookId: `note_${index}`,
  title: `Note ${index}`,
  subjectId: "cdp",
  chapterId: `chapter_${index}`,
  planCode: "PREMIUM",
  pageCount: 1,
  sourceSha256: "b".repeat(64),
  sections: [{
    sectionId: `section_${index}`,
    title: "Section",
    blocks: [{ blockId: `block_${index}`, type: "PARAGRAPH", payload: { text: "Text" } }],
  }],
  quality: {
    textFidelity: "PASS",
    sourceTextSha256: hash,
    blockTextSha256: hash,
    visualPages: [],
    visualReviewRequired: false,
    blockingIssues: [],
    autoPublishEligible: false,
  },
});

const bundle = {
  schemaVersion: 1,
  generatedAt: "2026-07-26T00:00:00.000Z",
  projectId: "aspirenest-platform",
  sourceCollection: "contentItems+protectedContentAssets",
  notes: Array.from({ length: 48 }, (_, index) => migrationNote(index + 1)),
};

describe("IntelliText PDF migration client", () => {
  test("loads and validates a local 48-note bundle", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => bundle,
    }));
    const result = await loadIntelliTextMigrationBundle({ fetchImpl });
    expect(result.notes).toHaveLength(48);
  });

  test("uploads inline visuals to deterministic Firebase Storage paths before Firestore", async () => {
    const storageApi = {
      ref: jest.fn((storage, path) => ({ storage, path })),
      uploadString: jest.fn(async () => undefined),
      getDownloadURL: jest.fn(async ({ path }) => `https://storage.test/${path}`),
    };
    const draftInput = {
      textbookId: "note_1",
      versionId: "migration_v1_note_1",
      sections: [{
        sectionId: "section_1",
        title: "Section",
        blocks: [
          {
            blockId: "visual_1",
            type: "IMAGE",
            payload: {
              src: "data:image/jpeg;base64,QUJD",
              sourcePage: 1,
            },
          },
          {
            blockId: "text_1",
            type: "PARAGRAPH",
            payload: { text: "Text" },
          },
        ],
      }],
    };

    const result = await materializeIntelliTextMigrationVisuals({
      draftInput,
      storageAdapter: {},
      storageApi,
    });

    expect(storageApi.uploadString).toHaveBeenCalledTimes(1);
    expect(result.uploadedVisualCount).toBe(1);
    expect(result.sections[0].blocks[0].payload.src).toMatch(/^https:\/\/storage\.test\/notes\/intellitext-migration\//);
    expect(result.sections[0].blocks[0].payload.storageBacked).toBe(true);
    expect(result.sections[0].blocks[1].payload.text).toBe("Text");
  });

  test("imports every canonical Note through the supplied draft adapter", async () => {
    const importDraft = jest.fn(async ({ migrationNote: item }) => ({
      action: "DRAFT_IMPORTED",
      textbookId: item.textbookId,
      versionId: `migration_${item.textbookId}`,
    }));
    const universalContent = [
      ...Array.from({ length: 48 }, (_, index) => ({
        id: `note_${index + 1}`,
        type: "PDF Note",
        status: "Published",
        access: "PREMIUM",
        title: `Note ${index + 1}`,
      })),
      { id: "ca_1", type: "Current Affairs", status: "Published" },
      { id: "draft_note", type: "Native Note", status: "Draft" },
    ];
    const result = await importIntelliTextMigrationBatch({
      bundle,
      universalContent,
      importDraft,
    });
    expect(importDraft).toHaveBeenCalledTimes(48);
    expect(result.imported).toHaveLength(48);
    expect(result.failed).toHaveLength(0);
  });
});
