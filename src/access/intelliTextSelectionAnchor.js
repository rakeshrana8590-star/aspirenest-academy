import {
  INTELLITEXT_STUDY_LIMITS,
  createIntelliTextStudySelectionAnchor,
} from "./intelliTextStudyWorkspaceContract";

export const INTELLITEXT_ANCHOR_RESOLUTION = Object.freeze({
  EXACT_VERSION: "RESOLVED_EXACT_VERSION",
  CONTEXT_DRIFT: "RESOLVED_CONTEXT_DRIFT",
  UNRESOLVED: "UNRESOLVED",
});

export class IntelliTextSelectionAnchorError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IntelliTextSelectionAnchorError";
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new IntelliTextSelectionAnchorError(code, message);
};

const normalizeVersion = (value) => {
  const version = Number(value);

  if (!Number.isSafeInteger(version) || version < 1) {
    fail("CONTENT_VERSION_INVALID", "contentVersion must be a positive integer.");
  }

  return version;
};

const getElement = (node) => {
  if (!node) {
    return null;
  }

  return node.nodeType === 1
    ? node
    : node.parentElement || null;
};

const getBlockElement = (node) =>
  getElement(node)?.closest?.('[data-intellitext-block="true"]') || null;

const textOffsetWithin = (blockElement, node, offset) => {
  const documentRef = blockElement?.ownerDocument;

  if (!documentRef?.createRange) {
    fail("RANGE_API_UNAVAILABLE", "Selection range API is unavailable.");
  }

  const range = documentRef.createRange();
  range.selectNodeContents(blockElement);
  range.setEnd(node, offset);
  return range.toString().length;
};

export function createIntelliTextSelectionAnchorFromText({
  blockText,
  startOffset,
  endOffset,
}) {
  const text = String(blockText ?? "");
  const start = Number(startOffset);
  const end = Number(endOffset);

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end > text.length ||
    end <= start
  ) {
    fail("SELECTION_RANGE_INVALID", "Selection offsets are outside the block text.");
  }

  const exactText = text.slice(start, end);
  const context = INTELLITEXT_STUDY_LIMITS.CONTEXT;

  return createIntelliTextStudySelectionAnchor({
    exactText,
    prefix: text.slice(Math.max(0, start - context), start),
    suffix: text.slice(end, Math.min(text.length, end + context)),
    startOffset: start,
    endOffset: end,
  });
}

export function captureIntelliTextSelection({
  selection,
  rootElement,
}) {
  if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) {
    fail("SELECTION_REQUIRED", "Select text inside one learning block.");
  }

  const range = selection.getRangeAt(0);
  const startBlock = getBlockElement(range.startContainer);
  const endBlock = getBlockElement(range.endContainer);

  if (!startBlock || !endBlock) {
    fail("BLOCK_SELECTION_REQUIRED", "Selection must stay inside a learning block.");
  }

  if (startBlock !== endBlock) {
    fail("CROSS_BLOCK_SELECTION_DENIED", "Cross-block selections are not supported.");
  }

  if (rootElement && !rootElement.contains(startBlock)) {
    fail("SELECTION_OUTSIDE_READER", "Selection is outside the active reader.");
  }

  const startOffset = textOffsetWithin(
    startBlock,
    range.startContainer,
    range.startOffset
  );
  const endOffset = textOffsetWithin(
    startBlock,
    range.endContainer,
    range.endOffset
  );
  const blockText = startBlock.textContent || "";
  const selectionAnchor = createIntelliTextSelectionAnchorFromText({
    blockText,
    startOffset,
    endOffset,
  });

  return Object.freeze({
    blockId: String(startBlock.dataset.blockId || ""),
    contentVersion: normalizeVersion(startBlock.dataset.contentVersion),
    sectionId: String(startBlock.dataset.sectionId || ""),
    selectionAnchor,
    textbookId: String(startBlock.dataset.textbookId || ""),
  });
}

const contextMatches = (text, index, anchor) => {
  const prefixStart = Math.max(0, index - anchor.prefix.length);
  const suffixStart = index + anchor.exactText.length;
  const actualPrefix = text.slice(prefixStart, index);
  const actualSuffix = text.slice(
    suffixStart,
    suffixStart + anchor.suffix.length
  );

  return actualPrefix.endsWith(anchor.prefix) && actualSuffix.startsWith(anchor.suffix);
};

export function resolveIntelliTextSelectionAnchor({
  anchor,
  blockText,
  storedContentVersion,
  currentContentVersion,
}) {
  const text = String(blockText ?? "");
  const storedVersion = normalizeVersion(storedContentVersion);
  const currentVersion = normalizeVersion(currentContentVersion);
  const normalizedAnchor = createIntelliTextStudySelectionAnchor(anchor);

  if (
    storedVersion === currentVersion &&
    text.slice(
      normalizedAnchor.startOffset,
      normalizedAnchor.endOffset
    ) === normalizedAnchor.exactText
  ) {
    return Object.freeze({
      endOffset: normalizedAnchor.endOffset,
      startOffset: normalizedAnchor.startOffset,
      status: INTELLITEXT_ANCHOR_RESOLUTION.EXACT_VERSION,
    });
  }

  const candidates = [];
  let index = text.indexOf(normalizedAnchor.exactText);

  while (index >= 0) {
    if (contextMatches(text, index, normalizedAnchor)) {
      candidates.push(index);
    }

    index = text.indexOf(normalizedAnchor.exactText, index + 1);
  }

  if (candidates.length === 1) {
    return Object.freeze({
      endOffset: candidates[0] + normalizedAnchor.exactText.length,
      startOffset: candidates[0],
      status: INTELLITEXT_ANCHOR_RESOLUTION.CONTEXT_DRIFT,
    });
  }

  return Object.freeze({
    endOffset: null,
    startOffset: null,
    status: INTELLITEXT_ANCHOR_RESOLUTION.UNRESOLVED,
  });
}

const textNodesFor = (element) => {
  const documentRef = element?.ownerDocument;

  if (!documentRef?.createTreeWalker) {
    return [];
  }

  const nodes = [];
  const walker = documentRef.createTreeWalker(
    element,
    4,
    {
      acceptNode(node) {
        return node.nodeValue
          ? 1
          : 2;
      },
    }
  );

  let current = walker.nextNode();

  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  return nodes;
};

const wrapSegment = ({
  node,
  start,
  end,
  annotation,
}) => {
  if (!node?.parentNode || end <= start) {
    return;
  }

  const selected = node.splitText(start);
  selected.splitText(end - start);

  const wrapper = node.ownerDocument.createElement(
    annotation.type === "HIGHLIGHT" ? "mark" : "span"
  );
  wrapper.className = `intelliTextAnnotationDecoration intelliTextAnnotationDecoration--${String(
    annotation.type
  ).toLowerCase()}`;
  wrapper.dataset.intellitextAnnotationDecoration = "true";
  wrapper.dataset.annotationId = annotation.annotationId;
  wrapper.title =
    annotation.type === "NOTE" || annotation.type === "DOUBT"
      ? annotation.body || annotation.type
      : annotation.type;

  selected.parentNode.replaceChild(wrapper, selected);
  wrapper.appendChild(selected);
};

export function clearIntelliTextAnnotationDecorations(rootElement) {
  if (!rootElement?.querySelectorAll) {
    return 0;
  }

  const wrappers = Array.from(
    rootElement.querySelectorAll(
      '[data-intellitext-annotation-decoration="true"]'
    )
  ).reverse();

  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentNode;

    if (!parent) {
      return;
    }

    parent.replaceChild(
      wrapper.ownerDocument.createTextNode(wrapper.textContent || ""),
      wrapper
    );
    parent.normalize?.();
  });

  return wrappers.length;
}

export function applyIntelliTextAnnotationDecorations({
  rootElement,
  annotations = [],
  contentVersion,
}) {
  clearIntelliTextAnnotationDecorations(rootElement);

  if (!rootElement?.querySelector) {
    return [];
  }

  const results = [];
  const ordered = [...annotations].sort((left, right) =>
    String(left.annotationId).localeCompare(String(right.annotationId))
  );

  ordered.forEach((annotation) => {
    const blockElement = rootElement.querySelector(
      `[data-intellitext-block="true"][data-block-id="${CSS?.escape ? CSS.escape(annotation.blockId) : annotation.blockId}"]`
    );

    if (!blockElement) {
      return;
    }

    const resolution = resolveIntelliTextSelectionAnchor({
      anchor: annotation.selectionAnchor,
      blockText: blockElement.textContent || "",
      storedContentVersion: annotation.contentVersion,
      currentContentVersion: contentVersion,
    });

    results.push({
      annotationId: annotation.annotationId,
      ...resolution,
    });

    if (resolution.status === INTELLITEXT_ANCHOR_RESOLUTION.UNRESOLVED) {
      return;
    }

    const nodes = textNodesFor(blockElement);
    let cursor = 0;
    const segments = [];

    nodes.forEach((node) => {
      const length = node.nodeValue.length;
      const nodeStart = cursor;
      const nodeEnd = cursor + length;
      const overlapStart = Math.max(resolution.startOffset, nodeStart);
      const overlapEnd = Math.min(resolution.endOffset, nodeEnd);

      if (overlapEnd > overlapStart) {
        segments.push({
          node,
          start: overlapStart - nodeStart,
          end: overlapEnd - nodeStart,
        });
      }

      cursor = nodeEnd;
    });

    segments.reverse().forEach((segment) =>
      wrapSegment({
        ...segment,
        annotation,
      })
    );
  });

  return results;
}
