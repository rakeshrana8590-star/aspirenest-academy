import {
  INTELLITEXT_ANCHOR_RESOLUTION,
  createIntelliTextSelectionAnchorFromText,
  resolveIntelliTextSelectionAnchor,
} from "./intelliTextSelectionAnchor";

const text = "Before Learning is active construction. After";

const baseAnchor = () =>
  createIntelliTextSelectionAnchorFromText({
    blockText: text,
    startOffset: 7,
    endOffset: 39,
  });

describe("Phase 8B-4 selection anchors", () => {
  test("creates exact text from block offsets", () => {
    expect(baseAnchor().exactText).toBe(
      "Learning is active construction."
    );
  });

  test("captures prefix context", () => {
    expect(baseAnchor().prefix).toBe("Before ");
  });

  test("captures suffix context", () => {
    expect(baseAnchor().suffix).toBe(" After");
  });

  test("denies a negative start offset", () => {
    expect(() =>
      createIntelliTextSelectionAnchorFromText({
        blockText: text,
        startOffset: -1,
        endOffset: 5,
      })
    ).toThrow("outside the block text");
  });

  test("denies an end offset outside the block", () => {
    expect(() =>
      createIntelliTextSelectionAnchorFromText({
        blockText: text,
        startOffset: 1,
        endOffset: text.length + 1,
      })
    ).toThrow("outside the block text");
  });

  test("denies a collapsed range", () => {
    expect(() =>
      createIntelliTextSelectionAnchorFromText({
        blockText: text,
        startOffset: 5,
        endOffset: 5,
      })
    ).toThrow("outside the block text");
  });

  test("resolves same-version offsets exactly", () => {
    expect(
      resolveIntelliTextSelectionAnchor({
        anchor: baseAnchor(),
        blockText: text,
        storedContentVersion: 2,
        currentContentVersion: 2,
      })
    ).toEqual({
      startOffset: 7,
      endOffset: 39,
      status: INTELLITEXT_ANCHOR_RESOLUTION.EXACT_VERSION,
    });
  });

  test("does not trust wrong same-version offsets", () => {
    const anchor = {
      ...baseAnchor(),
      startOffset: 0,
      endOffset: 32,
    };

    expect(
      resolveIntelliTextSelectionAnchor({
        anchor,
        blockText: text,
        storedContentVersion: 2,
        currentContentVersion: 2,
      }).status
    ).toBe(INTELLITEXT_ANCHOR_RESOLUTION.CONTEXT_DRIFT);
  });

  test("resolves unique text after version drift", () => {
    const changed = `New introduction. ${text}`;

    expect(
      resolveIntelliTextSelectionAnchor({
        anchor: baseAnchor(),
        blockText: changed,
        storedContentVersion: 2,
        currentContentVersion: 3,
      })
    ).toMatchObject({
      startOffset: 25,
      status: INTELLITEXT_ANCHOR_RESOLUTION.CONTEXT_DRIFT,
    });
  });

  test("returns unresolved when exact text is missing", () => {
    expect(
      resolveIntelliTextSelectionAnchor({
        anchor: baseAnchor(),
        blockText: "Completely rewritten content.",
        storedContentVersion: 2,
        currentContentVersion: 3,
      }).status
    ).toBe(INTELLITEXT_ANCHOR_RESOLUTION.UNRESOLVED);
  });

  test("returns unresolved for ambiguous duplicated text", () => {
    const anchor = {
      ...baseAnchor(),
      prefix: "",
      suffix: "",
    };
    const duplicate = `${anchor.exactText} ${anchor.exactText}`;

    expect(
      resolveIntelliTextSelectionAnchor({
        anchor,
        blockText: duplicate,
        storedContentVersion: 2,
        currentContentVersion: 3,
      }).status
    ).toBe(INTELLITEXT_ANCHOR_RESOLUTION.UNRESOLVED);
  });

  test("uses prefix to disambiguate repeated text", () => {
    const anchor = {
      exactText: "same phrase",
      prefix: "correct ",
      suffix: " ending",
      startOffset: 0,
      endOffset: 11,
    };
    const changed = "wrong same phrase ending correct same phrase ending";

    expect(
      resolveIntelliTextSelectionAnchor({
        anchor,
        blockText: changed,
        storedContentVersion: 1,
        currentContentVersion: 2,
      })
    ).toMatchObject({
      startOffset: 33,
      status: INTELLITEXT_ANCHOR_RESOLUTION.CONTEXT_DRIFT,
    });
  });

  test("rejects invalid stored content version", () => {
    expect(() =>
      resolveIntelliTextSelectionAnchor({
        anchor: baseAnchor(),
        blockText: text,
        storedContentVersion: 0,
        currentContentVersion: 1,
      })
    ).toThrow("positive integer");
  });

  test("rejects invalid current content version", () => {
    expect(() =>
      resolveIntelliTextSelectionAnchor({
        anchor: baseAnchor(),
        blockText: text,
        storedContentVersion: 1,
        currentContentVersion: "bad",
      })
    ).toThrow("positive integer");
  });
});
