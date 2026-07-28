import { buildRealNotesBindingReport } from "./realNotesBinding";

describe("real notes Drive binding", () => {
  test("uses existing contentItems notes without a duplicate database", () => {
    const report = buildRealNotesBindingReport([
      {
        id: "note-1",
        section: "notes",
        status: "Published",
        planType: "PREMIUM",
        subject: "CDP",
        chapter: "Piaget",
        deliveryMode: "LEGACY_PDF",
        pdfUrl: "https://example.com/piaget.pdf",
      },
      {
        id: "video-1",
        section: "videos",
        status: "Published",
      },
    ]);

    expect(report.sourceCollection).toBe("contentItems");
    expect(report.duplicateNotesDatabase).toBe(false);
    expect(report.totalNotes).toBe(1);
    expect(report.readableNotes).toBe(1);
    expect(report.byPlan.PREMIUM).toBe(1);
    expect(report.status).toBe("green");
  });

  test("preserves native IntelliText and protected PDF delivery", () => {
    const report = buildRealNotesBindingReport([
      {
        section: "notes",
        status: "Published",
        planType: "BASIC",
        subject: "English",
        chapter: "Language",
        deliveryMode: "NATIVE_TEXT",
        textbookId: "text-1",
        nativeReady: true,
        sections: [{ id: "s1" }],
      },
      {
        section: "notes",
        status: "Published",
        planType: "PREMIUM",
        subject: "CDP",
        chapter: "Growth",
        hasProtectedAsset: true,
      },
    ]);

    expect(report.nativeIntelliText).toBe(1);
    expect(report.protectedAssets).toBe(1);
    expect(report.readableNotes).toBe(2);
  });
});
