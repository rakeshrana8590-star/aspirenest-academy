import React, { useMemo, useState } from "react";

import { INTELLITEXT_BLOCK_TYPES } from "../../../access/intelliTextConstants";

const createId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const DEFAULT_PAYLOADS = Object.freeze({
  BULLET_LIST: { items: ["First point", "Second point"] },
  COMMON_MISTAKE: { title: "Common mistake", text: "Explain the mistake." },
  COMPARISON: {
    headers: ["Concept A", "Concept B"],
    rows: [["Difference A", "Difference B"]],
  },
  DEFINITION: { term: "Key term", definition: "Meaning" },
  DIAGRAM: { caption: "Diagram caption", description: "Describe the diagram." },
  EXAM_POINT: { title: "Exam point", text: "High-value exam insight." },
  EXAMPLE: { title: "Example", text: "Worked example." },
  FLOWCHART: { caption: "Flowchart", description: "Describe the process." },
  FORMULA: { formula: "a + b = c", explanation: "Formula explanation." },
  HEADING: { title: "Section heading" },
  IMAGE: { alt: "Educational visual", caption: "Image caption", src: "" },
  MCQ: {
    question: "Question",
    options: ["Option A", "Option B", "Option C", "Option D"],
  },
  MENTOR_TIP: { title: "Mentor tip", text: "Practical guidance." },
  PARAGRAPH: { text: "Write the explanation here." },
  PRACTICE_SET: { title: "Practice set", items: ["Question 1", "Question 2"] },
  REVISION_BOX: { title: "Revision checkpoint", items: ["Recall point 1"] },
  SUMMARY: { title: "Summary", items: ["Key learning 1", "Key learning 2"] },
  TABLE: {
    headers: ["Column 1", "Column 2"],
    rows: [["Value 1", "Value 2"]],
  },
  TIMELINE: {
    items: [
      { label: "Step 1", text: "First event" },
      { label: "Step 2", text: "Second event" },
    ],
  },
});

const createBlock = (type = "PARAGRAPH") => ({
  blockId: createId("block"),
  payload: JSON.parse(JSON.stringify(DEFAULT_PAYLOADS[type] || { text: "" })),
  type,
});

const createSection = () => ({
  blocks: [createBlock("HEADING"), createBlock("PARAGRAPH")],
  sectionId: createId("section"),
  summary: "",
  title: "New section",
});

function PayloadEditor({ block, onChange }) {
  const [draft, setDraft] = useState(() =>
    JSON.stringify(block.payload || {}, null, 2)
  );
  const [error, setError] = useState("");

  const applyJson = () => {
    try {
      const parsed = JSON.parse(draft);
      setError("");
      onChange({ ...block, payload: parsed });
    } catch (parseError) {
      setError("Payload must be valid JSON before saving or publishing.");
    }
  };

  return (
    <div className="intelliTextPayloadEditor">
      <textarea
        aria-label={`Payload for ${block.type}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={applyJson}
        rows={8}
      />
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" onClick={applyJson}>
        Apply payload
      </button>
    </div>
  );
}

export default function IntelliTextBlockEditor({
  sections = [],
  onChange = () => {},
}) {
  const blockCount = useMemo(
    () => sections.reduce((total, section) => total + section.blocks.length, 0),
    [sections]
  );

  const updateSection = (sectionIndex, nextSection) => {
    onChange(
      sections.map((section, index) =>
        index === sectionIndex ? nextSection : section
      )
    );
  };

  const moveSection = (sectionIndex, direction) => {
    const targetIndex = sectionIndex + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const next = [...sections];
    [next[sectionIndex], next[targetIndex]] = [next[targetIndex], next[sectionIndex]];
    onChange(next);
  };

  const removeSection = (sectionIndex) => {
    if (sections.length <= 1) return;
    onChange(sections.filter((section, index) => index !== sectionIndex));
  };

  return (
    <section className="intelliTextAuthoringEditor" aria-label="IntelliText block editor">
      <div className="intelliTextAuthoringEditorHeader">
        <div>
          <span>STRUCTURE</span>
          <h2>Section and block editor</h2>
          <p>
            {sections.length} sections • {blockCount} approved learning blocks
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...sections, createSection()])}
          disabled={sections.length >= 30}
        >
          + Add section
        </button>
      </div>

      <div className="intelliTextAuthoringSections">
        {sections.map((section, sectionIndex) => (
          <article className="intelliTextAuthoringSectionCard" key={section.sectionId}>
            <header>
              <span>Section {sectionIndex + 1}</span>
              <div>
                <button
                  type="button"
                  onClick={() => moveSection(sectionIndex, -1)}
                  disabled={sectionIndex === 0}
                  aria-label="Move section up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sectionIndex, 1)}
                  disabled={sectionIndex === sections.length - 1}
                  aria-label="Move section down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  disabled={sections.length <= 1}
                >
                  Remove
                </button>
              </div>
            </header>

            <div className="intelliTextAuthoringSectionFields">
              <label>
                <span>Section title</span>
                <input
                  value={section.title}
                  onChange={(event) =>
                    updateSection(sectionIndex, {
                      ...section,
                      title: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Section summary</span>
                <textarea
                  value={section.summary || ""}
                  onChange={(event) =>
                    updateSection(sectionIndex, {
                      ...section,
                      summary: event.target.value,
                    })
                  }
                  rows={2}
                />
              </label>
            </div>

            <div className="intelliTextAuthoringBlocksList">
              {section.blocks.map((block, blockIndex) => (
                <section className="intelliTextAuthoringBlockCard" key={block.blockId}>
                  <header>
                    <strong>Block {blockIndex + 1}</strong>
                    <select
                      value={block.type}
                      onChange={(event) => {
                        const type = event.target.value;
                        const nextBlocks = section.blocks.map((item, index) =>
                          index === blockIndex
                            ? {
                                ...item,
                                payload: JSON.parse(
                                  JSON.stringify(DEFAULT_PAYLOADS[type] || { text: "" })
                                ),
                                type,
                              }
                            : item
                        );
                        updateSection(sectionIndex, {
                          ...section,
                          blocks: nextBlocks,
                        });
                      }}
                    >
                      {INTELLITEXT_BLOCK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <div>
                      <button
                        type="button"
                        disabled={blockIndex === 0}
                        onClick={() => {
                          const next = [...section.blocks];
                          [next[blockIndex - 1], next[blockIndex]] = [
                            next[blockIndex],
                            next[blockIndex - 1],
                          ];
                          updateSection(sectionIndex, { ...section, blocks: next });
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={blockIndex === section.blocks.length - 1}
                        onClick={() => {
                          const next = [...section.blocks];
                          [next[blockIndex + 1], next[blockIndex]] = [
                            next[blockIndex],
                            next[blockIndex + 1],
                          ];
                          updateSection(sectionIndex, { ...section, blocks: next });
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(sectionIndex, {
                            ...section,
                            blocks: section.blocks.filter(
                              (item, index) => index !== blockIndex
                            ),
                          })
                        }
                        disabled={section.blocks.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </header>

                  <code>{block.blockId}</code>
                  <PayloadEditor
                    block={block}
                    onChange={(nextBlock) =>
                      updateSection(sectionIndex, {
                        ...section,
                        blocks: section.blocks.map((item, index) =>
                          index === blockIndex ? nextBlock : item
                        ),
                      })
                    }
                  />
                </section>
              ))}
            </div>

            <button
              type="button"
              className="intelliTextAddBlockButton"
              onClick={() =>
                updateSection(sectionIndex, {
                  ...section,
                  blocks: [...section.blocks, createBlock("PARAGRAPH")],
                })
              }
              disabled={blockCount >= 180}
            >
              + Add learning block
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export { createBlock, createSection, DEFAULT_PAYLOADS };
