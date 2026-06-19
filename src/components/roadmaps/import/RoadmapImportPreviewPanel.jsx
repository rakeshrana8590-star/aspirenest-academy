import React from "react";

import {
  RoadmapCard,
  RoadmapDayCard,
  RoadmapSectionHeader,
} from "../RoadmapShared";

export default function RoadmapImportPreviewPanel({
  importResult = null,
  validation = null,
  saving = false,
  duplicateChecking = false,
  saveBlockedByDuplicate = false,
  saveMessage = "",
  onSaveDraft,
}) {
  if (!importResult?.roadmap) return null;

  return (
    <section className="roadmapStudioSection">
      <RoadmapSectionHeader
        mode="admin"
        kicker="Preview"
        title="Imported roadmap preview"
        text="This is the draft that will be saved to Roadmap Studio."
        action={
          <button
            className="roadmapStudioPrimaryBtn"
            type="button"
            disabled={
              !validation?.isValid ||
              saving ||
              duplicateChecking ||
              saveBlockedByDuplicate
            }
            onClick={onSaveDraft}
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        }
      />

      {saveMessage ? (
        <div className="roadmapStudioImportPanel">
          <p className="roadmapStudioCardText">{saveMessage}</p>
        </div>
      ) : null}

      <RoadmapCard
        mode="admin"
        roadmap={{
          ...importResult.roadmap,
          totalDays: importResult.days?.length || 0,
          status: "draft",
        }}
        progress={0}
      />

      <div className="roadmapStudioSection">
        <RoadmapSectionHeader
          mode="admin"
          kicker="First Days"
          title="Schedule sample"
          text="First five days from the imported roadmap."
        />

        <div className="aspirePathDayGrid">
          {(importResult.days || []).slice(0, 5).map((day, index) => (
            <RoadmapDayCard
              key={`${day.date}-${index}`}
              day={{
                ...day,
                id: `${day.date}-${index}`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}