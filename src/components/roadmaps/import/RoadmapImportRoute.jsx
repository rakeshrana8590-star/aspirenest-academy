import React from "react";

import RoadmapDuplicatePanel from "../import/RoadmapDuplicatePanel.jsx";
import RoadmapImportPreviewPanel from "../import/RoadmapImportPreviewPanel.jsx";
import RoadmapImportUploadPanel from "../import/RoadmapImportUploadPanel.jsx";
import RoadmapImportValidationPanel from "../import/RoadmapImportValidationPanel.jsx";

import useRoadmapImportController from "../hooks/useRoadmapImportController.js";

import { RoadmapShell } from "../RoadmapShared";

import { downloadRoadmapXlsxTemplate } from "../../../utils/roadmapImportUtils";

export default function RoadmapImportRoute() {
  const {
    selectedFileName,
    importResult,
    importing,
    saving,
    saveMessage,
    duplicateAudit,
    duplicateChecking,
    allowDuplicateSave,
    validation,
    exactDuplicateRoadmaps,
    potentialDuplicateRoadmaps,
    hasExactDuplicate,
    hasPotentialDuplicate,
    saveBlockedByDuplicate,
    handleFileChange,
    handleSaveDraft,
    confirmPotentialDuplicateSave,
  } = useRoadmapImportController();

  return (
    <RoadmapShell mode="admin">
      <RoadmapImportUploadPanel
        validation={validation}
        importing={importing}
        selectedFileName={selectedFileName}
        onFileChange={handleFileChange}
        onDownloadTemplate={downloadRoadmapXlsxTemplate}
      />

      <RoadmapImportValidationPanel validation={validation} />

      <RoadmapDuplicatePanel
        duplicateChecking={duplicateChecking}
        duplicateAudit={duplicateAudit}
        hasExactDuplicate={hasExactDuplicate}
        hasPotentialDuplicate={hasPotentialDuplicate}
        exactDuplicateRoadmaps={exactDuplicateRoadmaps}
        potentialDuplicateRoadmaps={potentialDuplicateRoadmaps}
        allowDuplicateSave={allowDuplicateSave}
        onConfirmDuplicateSave={confirmPotentialDuplicateSave}
      />

      <RoadmapImportPreviewPanel
        importResult={importResult}
        validation={validation}
        saving={saving}
        duplicateChecking={duplicateChecking}
        saveBlockedByDuplicate={saveBlockedByDuplicate}
        saveMessage={saveMessage}
        onSaveDraft={handleSaveDraft}
      />
    </RoadmapShell>
  );
}