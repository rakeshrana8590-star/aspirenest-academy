import {
  IntelliTextContractError,
  assertIntelliTextIdentityCompatibleUpdate,
  assertNoRawPdfDeliveryFields,
  createIntelliTextAccessDescriptor,
  createIntelliTextBlock,
  createIntelliTextContentAnchor,
  createIntelliTextRoot,
  createIntelliTextSection,
  evaluateIntelliTextDelivery,
  evaluateLegacyPdfRetirement,
  normalizeIntelliTextId,
} from "./intelliTextDataContract";

function createRoot(overrides = {}) {
  return createIntelliTextRoot({
    chapterId: "piaget",
    contentVersion: 1,
    deliveryMode: "NATIVE_TEXT",
    nativeReady: false,
    planCode: "PREMIUM",
    publicationState: "DRAFT",
    scopeId: "plan_PREMIUM",
    scopeType: "PLAN",
    sectionCount: 0,
    subjectId: "child-development",
    textbookId: "note_piaget",
    title: "Piaget Theory",
    ...overrides,
  });
}

describe("IntelliText canonical data contract", () => {
  test("normalizes stable identifiers", () => {
    expect(normalizeIntelliTextId(" note_01 ")).toBe("note_01");
  });

  test("rejects paths inside identifiers", () => {
    expect(() => normalizeIntelliTextId("note/01")).toThrow(
      IntelliTextContractError
    );
  });

  test("rejects blank identifiers", () => {
    expect(() => normalizeIntelliTextId(" ")).toThrow(
      "must use 1-128"
    );
  });

  test("creates an Access Engine-compatible descriptor", () => {
    expect(
      createIntelliTextAccessDescriptor({
        planCode: "PREMIUM",
        scopeId: "plan_PREMIUM",
        scopeType: "PLAN",
        textbookId: "note_piaget",
      })
    ).toEqual({
      planCode: "PREMIUM",
      resourceId: "note_piaget",
      resourceType: "NOTE",
      scopeId: "plan_PREMIUM",
      scopeType: "PLAN",
    });
  });

  test("rejects unsupported access scope types", () => {
    expect(() =>
      createIntelliTextAccessDescriptor({
        scopeId: "anything",
        scopeType: "PUBLIC",
        textbookId: "note_piaget",
      })
    ).toThrow("scopeType must be one of");
  });

  test("creates a native textbook root without a PDF URL", () => {
    const root = createRoot();

    expect(root).toMatchObject({
      deliveryMode: "NATIVE_TEXT",
      resourceType: "NOTE",
      schemaVersion: 1,
      sectionCount: 0,
      textbookId: "note_piaget",
    });
    expect(root).not.toHaveProperty("pdfUrl");
  });

  test("preserves a legacy fallback by reference only", () => {
    const root = createRoot({
      legacyContentId: "legacy_note_01",
      migrationState: "IN_PROGRESS",
    });

    expect(root.migration).toEqual({
      legacyContentId: "legacy_note_01",
      legacyFallbackPreserved: true,
      nativeReady: false,
      state: "IN_PROGRESS",
    });
  });

  test("requires a legacy content reference for LEGACY_PDF", () => {
    expect(() =>
      createRoot({
        deliveryMode: "LEGACY_PDF",
      })
    ).toThrow("LEGACY_PDF delivery requires legacyContentId");
  });

  test("supports a canonical legacy PDF root without copying its URL", () => {
    const root = createRoot({
      deliveryMode: "LEGACY_PDF",
      legacyContentId: "legacy_note_01",
    });

    expect(root.deliveryMode).toBe("LEGACY_PDF");
    expect(root.migration.legacyContentId).toBe("legacy_note_01");
    expect(root).not.toHaveProperty("pdfUrl");
  });

  test("rejects raw PDF URL fields at the root", () => {
    expect(() =>
      createRoot({
        pdfUrl: "https://example.com/file.pdf",
      })
    ).toThrow("raw PDF delivery field");
  });

  test("rejects nested raw PDF delivery fields", () => {
    expect(() =>
      assertNoRawPdfDeliveryFields({
        metadata: {
          downloadUrl: "https://example.com/file.pdf",
        },
      })
    ).toThrow("raw PDF delivery field");
  });

  test("accepts structured content without raw PDF fields", () => {
    expect(
      assertNoRawPdfDeliveryFields({
        metadata: {
          description: "A native textbook chapter",
        },
      })
    ).toBe(true);
  });

  test("requires positive content versions", () => {
    expect(() =>
      createRoot({
        contentVersion: 0,
      })
    ).toThrow("contentVersion must be an integer");
  });

  test("requires non-negative section counts", () => {
    expect(() =>
      createRoot({
        sectionCount: -1,
      })
    ).toThrow("sectionCount must be an integer");
  });

  test("creates an ordered textbook section", () => {
    expect(
      createIntelliTextSection({
        blockCount: 3,
        contentVersion: 2,
        order: 0,
        published: true,
        sectionId: "overview",
        summary: "Core introduction",
        textbookId: "note_piaget",
        title: "Overview",
      })
    ).toEqual({
      blockCount: 3,
      contentVersion: 2,
      order: 0,
      published: true,
      schemaVersion: 1,
      sectionId: "overview",
      summary: "Core introduction",
      textbookId: "note_piaget",
      title: "Overview",
    });
  });

  test("rejects negative section order", () => {
    expect(() =>
      createIntelliTextSection({
        order: -1,
        sectionId: "overview",
        textbookId: "note_piaget",
        title: "Overview",
      })
    ).toThrow("order must be an integer");
  });

  test("creates a canonical definition block", () => {
    const block = createIntelliTextBlock({
      blockId: "definition_01",
      contentVersion: 1,
      order: 0,
      payload: {
        body: "Assimilation integrates experience into an existing schema.",
        term: "Assimilation",
      },
      published: true,
      sectionId: "overview",
      textbookId: "note_piaget",
      type: "DEFINITION",
    });

    expect(block.type).toBe("DEFINITION");
    expect(block.payload.term).toBe("Assimilation");
    expect(Object.isFrozen(block.payload)).toBe(true);
  });

  test("rejects unsupported block types", () => {
    expect(() =>
      createIntelliTextBlock({
        blockId: "unknown_01",
        order: 0,
        payload: {},
        sectionId: "overview",
        textbookId: "note_piaget",
        type: "RAW_HTML",
      })
    ).toThrow("type must be one of");
  });

  test("rejects non-object block payloads", () => {
    expect(() =>
      createIntelliTextBlock({
        blockId: "paragraph_01",
        order: 0,
        payload: "plain string",
        sectionId: "overview",
        textbookId: "note_piaget",
        type: "PARAGRAPH",
      })
    ).toThrow("payload must be a plain object");
  });

  test("rejects undefined inside a block payload", () => {
    expect(() =>
      createIntelliTextBlock({
        blockId: "paragraph_01",
        order: 0,
        payload: {
          body: undefined,
        },
        sectionId: "overview",
        textbookId: "note_piaget",
        type: "PARAGRAPH",
      })
    ).toThrow("cannot be undefined");
  });

  test("rejects non-finite numbers inside payloads", () => {
    expect(() =>
      createIntelliTextBlock({
        blockId: "table_01",
        order: 0,
        payload: {
          score: Number.NaN,
        },
        sectionId: "overview",
        textbookId: "note_piaget",
        type: "TABLE",
      })
    ).toThrow("non-finite number");
  });

  test("creates a stable future annotation anchor", () => {
    expect(
      createIntelliTextContentAnchor({
        blockId: "definition_01",
        contentVersion: 3,
        sectionId: "overview",
        textbookId: "note_piaget",
      })
    ).toEqual({
      blockId: "definition_01",
      contentVersion: 3,
      sectionId: "overview",
      textbookId: "note_piaget",
    });
  });

  test("delivers a published ready native textbook", () => {
    expect(
      evaluateIntelliTextDelivery({
        deliveryMode: "NATIVE_TEXT",
        legacyFallbackAvailable: true,
        nativeReady: true,
        publicationState: "PUBLISHED",
      })
    ).toBe("NATIVE_TEXT");
  });

  test("falls back to the legacy PDF while native content is not ready", () => {
    expect(
      evaluateIntelliTextDelivery({
        deliveryMode: "NATIVE_TEXT",
        legacyFallbackAvailable: true,
        nativeReady: false,
        publicationState: "DRAFT",
      })
    ).toBe("LEGACY_PDF_FALLBACK");
  });

  test("continues legacy PDF delivery during gradual migration", () => {
    expect(
      evaluateIntelliTextDelivery({
        deliveryMode: "LEGACY_PDF",
        legacyFallbackAvailable: true,
        nativeReady: false,
        publicationState: "PUBLISHED",
      })
    ).toBe("LEGACY_PDF");
  });

  test("fails closed when neither native nor legacy delivery is available", () => {
    expect(
      evaluateIntelliTextDelivery({
        deliveryMode: "NATIVE_TEXT",
        legacyFallbackAvailable: false,
        nativeReady: false,
        publicationState: "DRAFT",
      })
    ).toBe("UNAVAILABLE");
  });

  test("does not deliver unpublished native content without a fallback", () => {
    expect(
      evaluateIntelliTextDelivery({
        deliveryMode: "NATIVE_TEXT",
        legacyFallbackAvailable: false,
        nativeReady: true,
        publicationState: "DRAFT",
      })
    ).toBe("UNAVAILABLE");
  });

  test("blocks legacy PDF retirement until every gate is green", () => {
    const result = evaluateLegacyPdfRetirement({
      accessVerified: true,
      annotationVerified: false,
      founderApproved: true,
      nativeReady: true,
      readerVerified: true,
      rollbackReady: true,
      studentTested: true,
    });

    expect(result.approved).toBe(false);
    expect(result.missingGates).toEqual([
      "annotationVerified",
    ]);
  });

  test("approves per-note retirement only with all seven gates", () => {
    const result = evaluateLegacyPdfRetirement({
      accessVerified: true,
      annotationVerified: true,
      founderApproved: true,
      nativeReady: true,
      readerVerified: true,
      rollbackReady: true,
      studentTested: true,
    });

    expect(result.approved).toBe(true);
    expect(result.missingGates).toEqual([]);
  });

  test("protects immutable textbook identity", () => {
    const previous = createRoot({
      contentVersion: 2,
    });
    const next = createRoot({
      contentVersion: 3,
      publicationState: "PUBLISHED",
    });

    expect(
      assertIntelliTextIdentityCompatibleUpdate(previous, next)
    ).toBe(true);
  });

  test("rejects a changed chapter identity", () => {
    const previous = createRoot();
    const next = createRoot({
      chapterId: "vygotsky",
      contentVersion: 2,
    });

    expect(() =>
      assertIntelliTextIdentityCompatibleUpdate(previous, next)
    ).toThrow("chapterId cannot change");
  });

  test("rejects a content-version regression", () => {
    const previous = createRoot({
      contentVersion: 3,
    });
    const next = createRoot({
      contentVersion: 2,
    });

    expect(() =>
      assertIntelliTextIdentityCompatibleUpdate(previous, next)
    ).toThrow("contentVersion cannot decrease");
  });

  test("returns deeply immutable canonical roots", () => {
    const root = createRoot({
      legacyContentId: "legacy_note_01",
    });

    expect(Object.isFrozen(root)).toBe(true);
    expect(Object.isFrozen(root.access)).toBe(true);
    expect(Object.isFrozen(root.migration)).toBe(true);
  });
});
