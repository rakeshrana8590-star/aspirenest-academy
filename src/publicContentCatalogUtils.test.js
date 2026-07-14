import {
  buildPublicContentPayload,
  extractProtectedAnswerEntries,
  inspectProtectedContentPayload,
  isCanonicalPublicContentItem,
  sanitizePublicContentValue,
} from "./publicContentCatalogUtils";

describe("public content catalog sanitizer", () => {
  const source = {
    title: "Premium Mock",
    status: "published",
    planType: "PREMIUM",
    fileUrl: "https://example.test/private.pdf",
    sourceUrl: "https://example.test/source",
    questions: [
      {
        question: "2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        explanation: "Two plus two equals four.",
      },
    ],
  };

  test("recursively removes protected URLs and answers", () => {
    const publicValue = sanitizePublicContentValue(source);

    expect(publicValue.fileUrl).toBeUndefined();
    expect(publicValue.sourceUrl).toBeUndefined();
    expect(publicValue.questions[0].correctAnswer).toBeUndefined();
    expect(publicValue.questions[0].explanation).toBeUndefined();
    expect(publicValue.questions[0].question).toBe("2 + 2?");
    expect(publicValue.questions[0].options).toEqual(["3", "4", "5", "6"]);
  });

  test("extracts deterministic answer paths", () => {
    expect(extractProtectedAnswerEntries(source)).toEqual([
      {
        path: "questions[0].correctAnswer",
        value: "4",
      },
      {
        path: "questions[0].explanation",
        value: "Two plus two equals four.",
      },
    ]);
  });

  test("builds canonical published public payload", () => {
    const publicItem = buildPublicContentPayload("mock-1", source);

    expect(publicItem.id).toBe("mock-1");
    expect(publicItem.sourceCollection).toBe("contentItems");
    expect(publicItem.sourceId).toBe("mock-1");
    expect(publicItem.status).toBe("published");
    expect(publicItem.publicSchemaVersion).toBe(1);
    expect(publicItem.hasProtectedAsset).toBe(true);
    expect(publicItem.hasProtectedAnswers).toBe(true);
  });


  test("requires exact canonical public identity markers", () => {
    expect(
      isCanonicalPublicContentItem({
        id: "note-1",
        sourceCollection: "contentItems",
        sourceId: "note-1",
        publicSchemaVersion: 1,
      })
    ).toBe(true);

    expect(
      isCanonicalPublicContentItem({
        id: "note-1",
        sourceCollection: "contentItems",
        sourceId: "different-note",
        publicSchemaVersion: 1,
      })
    ).toBe(false);

    expect(
      isCanonicalPublicContentItem({
        id: "note-1",
        sourceCollection: "contentItems",
        sourceId: "note-1",
      })
    ).toBe(false);
  });

  test("removes protected fields nested inside arrays and objects", () => {
    const publicValue = sanitizePublicContentValue({
      resources: [
        {
          title: "Worksheet",
          resourceUrl: "https://example.test/private-resource",
        },
      ],
      metadata: {
        meetingUrl: "https://example.test/private-meeting",
        label: "Live Class",
      },
    });

    expect(publicValue.resources[0].resourceUrl).toBeUndefined();
    expect(publicValue.resources[0].title).toBe("Worksheet");
    expect(publicValue.metadata.meetingUrl).toBeUndefined();
    expect(publicValue.metadata.label).toBe("Live Class");
  });

  test("detects direct and answer protected payloads", () => {
    const result = inspectProtectedContentPayload(source);

    expect(result.directAssets.fileUrl).toBe(
      "https://example.test/private.pdf"
    );
    expect(result.hasDirectAssets).toBe(true);
    expect(result.hasAnswers).toBe(true);
    expect(result.hasProtectedPayload).toBe(true);
  });
});
