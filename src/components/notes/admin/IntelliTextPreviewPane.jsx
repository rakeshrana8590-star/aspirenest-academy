import React from "react";

import IntelliTextBlockRenderer from "../student/IntelliTextBlockRenderer";

export default function IntelliTextPreviewPane({
  mode = "DESKTOP",
  onModeChange = () => {},
  sections = [],
  title = "Untitled IntelliText note",
}) {
  const normalizedMode = mode === "MOBILE" ? "MOBILE" : "DESKTOP";

  return (
    <section className="intelliTextAuthoringPreview" aria-label="Student preview">
      <header>
        <div>
          <span>STUDENT EXPERIENCE PREVIEW</span>
          <h2>Mobile and desktop parity</h2>
          <p>Preview uses the same approved IntelliText block renderer as the student route.</p>
        </div>
        <div className="intelliTextPreviewModeSwitch" role="group" aria-label="Preview mode">
          {[
            { id: "MOBILE", label: "Mobile" },
            { id: "DESKTOP", label: "Desktop" },
          ].map((option) => (
            <button
              type="button"
              key={option.id}
              className={normalizedMode === option.id ? "isActive" : ""}
              aria-pressed={normalizedMode === option.id}
              onClick={() => onModeChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div
        className={
          normalizedMode === "MOBILE"
            ? "intelliTextPreviewDevice isMobile"
            : "intelliTextPreviewDevice isDesktop"
        }
      >
        <article>
          <div className="intelliTextPreviewBrand">ASPIRENEST INTELLITEXT</div>
          <h1>{title || "Untitled IntelliText note"}</h1>

          {sections.map((section, sectionIndex) => (
            <section className="intelliTextPreviewSection" key={section.sectionId}>
              <span>Section {sectionIndex + 1}</span>
              <h2>{section.title || "Untitled section"}</h2>
              {section.summary ? <p>{section.summary}</p> : null}

              <div className="intelliTextPreviewBlocks">
                {section.blocks.map((block) => (
                  <section
                    key={block.blockId}
                    className="intelliTextBlock"
                    data-block-type={block.type}
                  >
                    <IntelliTextBlockRenderer block={block} />
                  </section>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}
