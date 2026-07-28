import { buildV8RealNotesRuntime } from "./v8RealNotesRuntimeModel";

describe("V8 real Notes runtime model", () => {
  const contentItems = [
    {
      id: "note-native",
      section: "notes",
      status: "Published",
      title: "Native Note",
      subject: "CDP",
      chapter: "Learning",
      planType: "PREMIUM",
      deliveryMode: "NATIVE_TEXT",
      textbookId: "note-native",
      nativeReady: true,
      publicationState: "PUBLISHED",
      intelliText: { textbookId: "note-native", publicationState: "PUBLISHED" },
    },
    {
      id: "note-legacy",
      section: "notes",
      status: "Published",
      title: "Legacy Note",
      subject: "English",
      chapter: "Pedagogy",
      planType: "BASIC",
      hasProtectedAsset: true,
    },
  ];

  test("maps every real published note and removes demo identity", () => {
    const model = buildV8RealNotesRuntime({
      contentItems,
      buildNoteAccessDecision: (_note, action) => ({
        allowed: true,
        canReadAsset: action === "READ",
        canResolveAsset: action === "OPEN",
      }),
    });

    expect(model.total).toBe(2);
    expect(model.resources.map((item) => item.id)).toEqual([
      "note-native",
      "note-legacy",
    ]);
    expect(model.resources.every((item) => item.integrated)).toBe(true);
    expect(model.resources[0].subjectName).toBe("CDP");
  });

  test("uses READ for native and OPEN only as migration fallback", () => {
    const calls = [];
    const model = buildV8RealNotesRuntime({
      contentItems,
      buildNoteAccessDecision: (note, action) => {
        calls.push([note.id, action]);
        return {
          allowed: true,
          canReadAsset: action === "READ",
          canResolveAsset: action === "OPEN",
        };
      },
    });

    expect(calls).toContainEqual(["note-native", "READ"]);
    expect(calls).toContainEqual(["note-legacy", "OPEN"]);
    expect(model.nativeReady).toBe(1);
    expect(model.conversionRequired).toBe(1);
    expect(model.byId.get("note-native").resource.canonicalRoute).toBe(
      "/ctet-tet/notes/read/note-native"
    );
  });

  test("fails closed when the shared access decision denies opening", () => {
    const model = buildV8RealNotesRuntime({
      contentItems: [contentItems[0]],
      buildNoteAccessDecision: () => ({
        allowed: false,
        canReadAsset: false,
        canResolveAsset: false,
        reason: "access_denied",
      }),
    });

    expect(model.resources[0].state).toBe("locked");
  });
});
