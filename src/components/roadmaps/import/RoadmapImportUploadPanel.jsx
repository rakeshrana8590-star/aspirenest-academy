import React from "react";
import { Link } from "react-router-dom";

import { AspirePathHero, RoadmapSectionHeader } from "../RoadmapShared";

export default function RoadmapImportUploadPanel({
  validation = null,
  importing = false,
  selectedFileName = "",
  onFileChange,
  onDownloadTemplate,
}) {
  return (
    <>
      <AspirePathHero
        mode="admin"
        eyebrow="Import Roadmap"
        title="Create AspirePath from XLSX"
        subtitle="Upload a structured roadmap file and Roadmap Studio will validate it before saving as a draft."
        metrics={[
          {
            value: validation?.summary?.totalDays || 0,
            label: "Days",
          },
          {
            value: validation?.summary?.totalTasks || 0,
            label: "Tasks",
          },
          {
            value: validation?.summary?.mockDays || 0,
            label: "Mock Days",
          },
          {
            value: validation?.isValid ? "Ready" : "Check",
            label: "Status",
          },
        ]}
        actions={
          <>
            <button
              className="roadmapStudioPrimaryBtn"
              type="button"
              onClick={onDownloadTemplate}
            >
              Download Template
            </button>

            <Link
              className="roadmapStudioSecondaryBtn"
              to="/admin/content/roadmaps/manage"
            >
              Manage Roadmaps
            </Link>
          </>
        }
      />

      <section className="roadmapStudioSection">
        <RoadmapSectionHeader
          mode="admin"
          kicker="Upload"
          title="Roadmap XLSX import"
          text="Use the official AspirePath template. Required sheets: Roadmap Info and Schedule. Resources sheet is optional but recommended."
        />

        <div className="roadmapStudioImportPanel">
          <label className="roadmapStudioDropzone">
            <span className="roadmapStudioDropzoneIcon">⬆</span>

            <strong>
              {importing
                ? "Reading file..."
                : selectedFileName || "Choose AspirePath XLSX file"}
            </strong>

            <span className="roadmapStudioCardText">
              Accepted format: .xlsx with Roadmap Info, Schedule, Resources
              sheets.
            </span>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </section>
    </>
  );
}