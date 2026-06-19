import React from "react";

import { RoadmapBadge, RoadmapSectionHeader } from "../RoadmapShared";

const formatDate = (dateValue = "") => {
  if (!dateValue) return "Not set";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const RoadmapDuplicateMessage = ({ type = "info", children }) => {
  if (!children) return null;

  const cardClass =
    type === "error"
      ? "roadmapStudioValidationCard roadmapStudioValidationCardError"
      : type === "warning"
      ? "roadmapStudioValidationCard roadmapStudioValidationCardWarning"
      : "roadmapStudioValidationCard roadmapStudioValidationCardSuccess";

  return <div className={cardClass}>{children}</div>;
};

export default function RoadmapDuplicatePanel({
  duplicateChecking = false,
  duplicateAudit = null,
  hasExactDuplicate = false,
  hasPotentialDuplicate = false,
  exactDuplicateRoadmaps = [],
  potentialDuplicateRoadmaps = [],
  allowDuplicateSave = false,
  onConfirmDuplicateSave,
}) {
  if (duplicateChecking) {
    return (
      <section className="roadmapStudioSection">
        <RoadmapSectionHeader
          mode="admin"
          kicker="Duplicate Safety"
          title="Checking existing roadmaps..."
          text="Roadmap Studio is comparing this import with saved roadmaps before allowing draft save."
        />
      </section>
    );
  }

  if (!duplicateAudit || (!hasExactDuplicate && !hasPotentialDuplicate)) {
    return null;
  }

  return (
    <section className="roadmapStudioSection">
      <RoadmapSectionHeader
        mode="admin"
        kicker="Duplicate Safety"
        title={
          hasExactDuplicate
            ? "Duplicate roadmap blocked"
            : "Possible duplicate roadmap found"
        }
        text={
          hasExactDuplicate
            ? "A roadmap with the same title, exam type, start date, and end date already exists. This import is blocked."
            : "A roadmap with the same title, exam type, and start date already exists. Confirm only if this should be saved as a separate draft."
        }
      />

      <div className="roadmapStudioValidationGrid">
        {hasExactDuplicate ? (
          <RoadmapDuplicateMessage type="error">
            <strong>Exact duplicate</strong>

            <p className="roadmapStudioCardText">
              Save as Draft is blocked for exact duplicates.
            </p>
          </RoadmapDuplicateMessage>
        ) : null}

        {hasPotentialDuplicate ? (
          <RoadmapDuplicateMessage type="warning">
            <strong>Potential duplicate</strong>

            <p className="roadmapStudioCardText">
              Same title, exam type, and start date found. End date may be
              different.
            </p>
          </RoadmapDuplicateMessage>
        ) : null}

        <RoadmapDuplicateMessage
          type={allowDuplicateSave ? "success" : "warning"}
        >
          <strong>Save permission</strong>

          <p className="roadmapStudioCardText">
            {hasExactDuplicate
              ? "Blocked"
              : allowDuplicateSave
              ? "Confirmed for new draft save"
              : "Confirmation required"}
          </p>
        </RoadmapDuplicateMessage>
      </div>

      <div className="roadmapStudioImportPanel">
        {[...exactDuplicateRoadmaps, ...potentialDuplicateRoadmaps].map(
          (roadmap) => (
            <p className="roadmapStudioCardText" key={roadmap.id}>
              ⚠️ {roadmap.title || "Untitled Roadmap"} •{" "}
              {roadmap.examType || "Exam"} • {formatDate(roadmap.startDate)} →{" "}
              {formatDate(roadmap.endDate)} • {roadmap.status || "draft"}
            </p>
          )
        )}

        {hasPotentialDuplicate && !hasExactDuplicate ? (
          <div className="roadmapStudioHeroActions">
            {allowDuplicateSave ? (
              <RoadmapBadge mode="admin">Duplicate save confirmed</RoadmapBadge>
            ) : (
              <button
                className="roadmapStudioSecondaryBtn"
                type="button"
                onClick={onConfirmDuplicateSave}
              >
                I understand, save as new draft
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}