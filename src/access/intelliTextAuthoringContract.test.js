import {
  INTELLITEXT_AUTHORING_LIMITS,
  INTELLITEXT_AUTHORING_PREVIEW_MODES,
  INTELLITEXT_AUTHORING_VERSION_STATES,
  IntelliTextAuthoringContractError,
  assertIntelliTextPreviewAuditReady,
  assertIntelliTextVersionPublishable,
  buildIntelliTextCanonicalContentPatch,
  computeIntelliTextDraftFingerprint,
  createIntelliTextAccessMapping,
  createIntelliTextAuthoringVersion,
  createIntelliTextPublishedBlock,
  createIntelliTextPublishedRoot,
  createIntelliTextPublishedSection,
  validateIntelliTextAuthoringDraft,
} from "./intelliTextAuthoringContract";
import {
  INTELLITEXT_BLOCK_TYPES,
} from "./intelliTextConstants";

const baseSections = () => [
  {
    sectionId: "section_1",
    title: "Foundation",
    summary: "Start here",
    blocks: [
      {
        blockId: "block_1",
        type: "HEADING",
        payload: { title: "Concept" },
      },
      {
        blockId: "block_2",
        type: "PARAGRAPH",
        payload: { text: "Explanation" },
      },
    ],
  },
];

const baseDraft = (overrides = {}) => ({
  access: {
    publicRead: false,
    readEntitlementIds: ["plan_PREMIUM"],
    requiredPlanCode: "PREMIUM",
  },
  baseContentVersion: 0,
  chapterId: "chapter_1",
  contentVersion: 1,
  sections: baseSections(),
  subjectId: "cdp",
  textbookId: "note_1",
  title: "Child Development",
  versionId: "v1",
  ...overrides,
});

test("authoring contract exposes the approved version states", () => {
  expect(INTELLITEXT_AUTHORING_VERSION_STATES).toEqual({
    ARCHIVED: "ARCHIVED",
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    READY_FOR_REVIEW: "READY_FOR_REVIEW",
  });
});

test("authoring contract exposes mobile and desktop preview modes", () => {
  expect(INTELLITEXT_AUTHORING_PREVIEW_MODES).toEqual({
    DESKTOP: "DESKTOP",
    MOBILE: "MOBILE",
  });
});

test("authoring limits match the approved boundary", () => {
  expect(INTELLITEXT_AUTHORING_LIMITS).toEqual({
    MAX_BLOCKS_PER_VERSION: 180,
    MAX_PUBLISH_BATCH_WRITES: 450,
    MAX_READ_ENTITLEMENT_IDS: 6,
    MAX_SECTIONS_PER_VERSION: 30,
  });
});

test("protected access requires at least one entitlement ID", () => {
  expect(() => createIntelliTextAccessMapping({ publicRead: false })).toThrow(
    expect.objectContaining({ code: "ACCESS_MAPPING_REQUIRED" })
  );
});

test("explicit public read may omit entitlement IDs", () => {
  expect(createIntelliTextAccessMapping({ publicRead: true })).toEqual({
    publicRead: true,
    readEntitlementIds: [],
    requiredPlanCode: null,
  });
});

test("access mapping normalizes and deduplicates entitlement IDs", () => {
  expect(
    createIntelliTextAccessMapping({
      publicRead: false,
      readEntitlementIds: ["plan_PREMIUM", "plan_PREMIUM", "module_NOTES"],
    }).readEntitlementIds
  ).toEqual(["plan_PREMIUM", "module_NOTES"]);
});

test("access mapping rejects more than six entitlement IDs", () => {
  expect(() =>
    createIntelliTextAccessMapping({
      readEntitlementIds: ["a", "b", "c", "d", "e", "f", "g"],
    })
  ).toThrow(expect.objectContaining({ code: "ENTITLEMENT_IDS_LIMIT_EXCEEDED" }));
});

test("draft validation produces contiguous section and block order", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(graph.sections[0].order).toBe(0);
  expect(graph.sections[0].blocks.map((block) => block.order)).toEqual([0, 1]);
});

test("draft validation counts sections blocks and publish writes", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(graph.sections).toHaveLength(1);
  expect(graph.blockCount).toBe(2);
  expect(graph.publishWriteCount).toBe(6);
});

test("draft validation requires at least one section", () => {
  expect(() => validateIntelliTextAuthoringDraft(baseDraft({ sections: [] }))).toThrow(
    expect.objectContaining({ code: "SECTION_REQUIRED" })
  );
});

test("draft validation requires at least one block", () => {
  expect(() =>
    validateIntelliTextAuthoringDraft(
      baseDraft({ sections: [{ sectionId: "s1", title: "Empty", blocks: [] }] })
    )
  ).toThrow(expect.objectContaining({ code: "BLOCK_REQUIRED" }));
});

test("draft validation denies duplicate section IDs", () => {
  expect(() =>
    validateIntelliTextAuthoringDraft(
      baseDraft({ sections: [...baseSections(), ...baseSections()] })
    )
  ).toThrow(expect.objectContaining({ code: "DUPLICATE_SECTION_ID" }));
});

test("draft validation denies duplicate block IDs inside a section", () => {
  const sections = baseSections();
  sections[0].blocks.push({
    blockId: "block_1",
    type: "SUMMARY",
    payload: { text: "Duplicate" },
  });
  expect(() => validateIntelliTextAuthoringDraft(baseDraft({ sections }))).toThrow(
    expect.objectContaining({ code: "DUPLICATE_BLOCK_ID" })
  );
});

test("draft validation rejects unsupported block types", () => {
  const sections = baseSections();
  sections[0].blocks[0].type = "VIDEO";
  expect(() => validateIntelliTextAuthoringDraft(baseDraft({ sections }))).toThrow();
});

test.each(INTELLITEXT_BLOCK_TYPES)("draft accepts supported block type %s", (type) => {
  const sections = [
    {
      sectionId: "section_1",
      title: "Supported",
      blocks: [{ blockId: "block_1", type, payload: { text: "Valid" } }],
    },
  ];
  expect(validateIntelliTextAuthoringDraft(baseDraft({ sections })).blockCount).toBe(1);
});

test("draft fingerprint is deterministic", () => {
  const left = computeIntelliTextDraftFingerprint(baseDraft());
  const right = computeIntelliTextDraftFingerprint(baseDraft());
  expect(left).toBe(right);
});

test("draft fingerprint changes when content changes", () => {
  const left = validateIntelliTextAuthoringDraft(baseDraft()).draftFingerprint;
  const sections = baseSections();
  sections[0].blocks[1].payload.text = "Changed";
  const right = validateIntelliTextAuthoringDraft(baseDraft({ sections })).draftFingerprint;
  expect(right).not.toBe(left);
});

test("authoring version enforces exact monotonic sequence", () => {
  expect(() =>
    createIntelliTextAuthoringVersion({
      ...baseDraft(),
      blockCount: 2,
      createdBy: "admin_uid",
      draftFingerprint: "fingerprint",
      sectionCount: 1,
      updatedBy: "admin_uid",
    })
  ).not.toThrow();
});

test("authoring version rejects skipped content version", () => {
  expect(() =>
    createIntelliTextAuthoringVersion({
      ...baseDraft({ baseContentVersion: 0, contentVersion: 2 }),
      blockCount: 2,
      createdBy: "admin_uid",
      draftFingerprint: "fingerprint",
      sectionCount: 1,
      updatedBy: "admin_uid",
    })
  ).toThrow(expect.objectContaining({ code: "VERSION_SEQUENCE_INVALID" }));
});

test("preview audit requires mobile desktop and student experience", () => {
  expect(() =>
    assertIntelliTextPreviewAuditReady({ mobile: true, desktop: true })
  ).toThrow(expect.objectContaining({ code: "PREVIEW_AUDIT_INCOMPLETE" }));
});

test("complete preview audit passes", () => {
  expect(
    assertIntelliTextPreviewAuditReady({
      desktop: true,
      mobile: true,
      studentExperience: true,
    })
  ).toBe(true);
});

test("publishability denies draft state", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(() =>
    assertIntelliTextVersionPublishable({
      graph,
      root: { contentVersion: 0 },
      version: {
        baseContentVersion: 0,
        draftFingerprint: graph.draftFingerprint,
        previewAudit: { desktop: true, mobile: true, studentExperience: true },
        versionState: "DRAFT",
      },
    })
  ).toThrow(expect.objectContaining({ code: "VERSION_NOT_READY" }));
});

test("publishability denies stale base version", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(() =>
    assertIntelliTextVersionPublishable({
      graph,
      root: { contentVersion: 1 },
      version: {
        baseContentVersion: 0,
        draftFingerprint: graph.draftFingerprint,
        previewAudit: { desktop: true, mobile: true, studentExperience: true },
        versionState: "READY_FOR_REVIEW",
      },
    })
  ).toThrow(expect.objectContaining({ code: "STALE_DRAFT_VERSION" }));
});

test("publishability denies fingerprint mismatch", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(() =>
    assertIntelliTextVersionPublishable({
      graph,
      root: { contentVersion: 0 },
      version: {
        baseContentVersion: 0,
        draftFingerprint: "different",
        previewAudit: { desktop: true, mobile: true, studentExperience: true },
        versionState: "READY_FOR_REVIEW",
      },
    })
  ).toThrow(expect.objectContaining({ code: "DRAFT_FINGERPRINT_MISMATCH" }));
});

test("publishability accepts a current reviewed version", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(
    assertIntelliTextVersionPublishable({
      graph,
      root: { contentVersion: 0 },
      version: {
        baseContentVersion: 0,
        draftFingerprint: graph.draftFingerprint,
        previewAudit: { desktop: true, mobile: true, studentExperience: true },
        versionState: "READY_FOR_REVIEW",
      },
    })
  ).toBe(true);
});

test("canonical content patch contains metadata but no native body", () => {
  const patch = buildIntelliTextCanonicalContentPatch({
    access: baseDraft().access,
    chapterId: "chapter_1",
    contentVersion: 1,
    publishedVersionId: "v1",
    subjectId: "cdp",
    textbookId: "note_1",
    title: "Child Development",
  });
  expect(patch.deliveryType).toBe("NATIVE_TEXT");
  expect(patch.intelliText.sections).toBeUndefined();
  expect(patch.pdfUrl).toBeUndefined();
});

test("published root preserves access mapping and canonical identity", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  const root = createIntelliTextPublishedRoot({
    graph,
    publishedBy: "admin_uid",
    versionId: "v1",
  });
  expect(root.textbookId).toBe("note_1");
  expect(root.access.readEntitlementIds).toEqual(["plan_PREMIUM"]);
  expect(root.publicationState).toBe("PUBLISHED");
});

test("published section is marked published", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(createIntelliTextPublishedSection(graph.sections[0]).published).toBe(true);
});

test("published block is marked published", () => {
  const graph = validateIntelliTextAuthoringDraft(baseDraft());
  expect(createIntelliTextPublishedBlock(graph.sections[0].blocks[0]).published).toBe(
    true
  );
});

test("contract errors expose stable codes", () => {
  try {
    validateIntelliTextAuthoringDraft(baseDraft({ textbookId: "bad id" }));
    throw new Error("Expected failure");
  } catch (error) {
    expect(error).toBeInstanceOf(IntelliTextAuthoringContractError);
    expect(error.code).toBe("ID_INVALID");
  }
});
