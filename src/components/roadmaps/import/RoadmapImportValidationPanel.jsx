import React from "react";

import { RoadmapSectionHeader } from "../RoadmapShared";

const RoadmapValidationMessage = ({ type = "info", children }) => {
  if (!children) return null;

  const cardClass =
    type === "error"
      ? "roadmapStudioValidationCard roadmapStudioValidationCardError"
      : type === "warning"
      ? "roadmapStudioValidationCard roadmapStudioValidationCardWarning"
      : "roadmapStudioValidationCard roadmapStudioValidationCardSuccess";

  return <div className={cardClass}>{children}</div>;
};

export default function RoadmapImportValidationPanel({ validation = null }) {
  if (!validation) return null;

  return (
    <section className="roadmapStudioSection">
      <RoadmapSectionHeader
        mode="admin"
        kicker="Validation"
        title={validation.isValid ? "Ready to save" : "Fix required issues"}
        text="Roadmap Studio checks the file before Firestore save so broken student timelines are not published."
      />

      <div className="roadmapStudioValidationGrid">
        <RoadmapValidationMessage
          type={validation.isValid ? "success" : "error"}
        >
          <strong>Status</strong>

          <p className="roadmapStudioCardText">
            {validation.isValid
              ? "No blocking errors found."
              : "Blocking errors found. Please fix the XLSX and import again."}
          </p>
        </RoadmapValidationMessage>

        <RoadmapValidationMessage type="warning">
          <strong>Warnings</strong>

          <p className="roadmapStudioCardText">
            {validation.warnings?.length || 0} warning(s)
          </p>
        </RoadmapValidationMessage>

        <RoadmapValidationMessage type="success">
          <strong>Summary</strong>

          <p className="roadmapStudioCardText">
            {validation.summary?.totalDays || 0} days •{" "}
            {validation.summary?.totalTasks || 0} tasks
          </p>
        </RoadmapValidationMessage>
      </div>

      {validation.errors?.length ? (
        <div className="roadmapStudioSection">
          <RoadmapSectionHeader
            mode="admin"
            kicker="Errors"
            title="Blocking issues"
          />

          <div className="roadmapStudioImportPanel">
            {validation.errors.map((error, index) => (
              <p className="roadmapStudioCardText" key={index}>
                ❌ {error}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {validation.warnings?.length ? (
        <div className="roadmapStudioSection">
          <RoadmapSectionHeader
            mode="admin"
            kicker="Warnings"
            title="Review before publishing"
          />

          <div className="roadmapStudioImportPanel">
            {validation.warnings.map((warning, index) => (
              <p className="roadmapStudioCardText" key={index}>
                ⚠️ {warning}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}