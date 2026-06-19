import React from "react";
import { useNavigate } from "react-router-dom";

import {
  findDuplicateStudyRoadmaps,
  saveImportedRoadmapAsDraft,
} from "../../../services/roadmapService";

import { parseRoadmapXlsxFile } from "../../../utils/roadmapImportUtils";

export default function useRoadmapImportController() {
  const navigate = useNavigate();

  const [selectedFileName, setSelectedFileName] = React.useState("");
  const [importResult, setImportResult] = React.useState(null);
  const [importing, setImporting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");
  const [duplicateAudit, setDuplicateAudit] = React.useState(null);
  const [duplicateChecking, setDuplicateChecking] = React.useState(false);
  const [allowDuplicateSave, setAllowDuplicateSave] = React.useState(false);

  const validation = importResult?.validation;
  const exactDuplicateRoadmaps = duplicateAudit?.exactDuplicates || [];
  const potentialDuplicateRoadmaps = duplicateAudit?.potentialDuplicates || [];
  const hasExactDuplicate = exactDuplicateRoadmaps.length > 0;
  const hasPotentialDuplicate = potentialDuplicateRoadmaps.length > 0;
  const needsDuplicateConfirm = hasPotentialDuplicate && !allowDuplicateSave;
  const saveBlockedByDuplicate = hasExactDuplicate || needsDuplicateConfirm;

  const resetImportState = () => {
    setSaveMessage("");
    setImportResult(null);
    setSelectedFileName("");
    setDuplicateAudit(null);
    setDuplicateChecking(false);
    setAllowDuplicateSave(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    resetImportState();

    if (!file) return;

    try {
      setImporting(true);
      setSelectedFileName(file.name);

      const parsed = await parseRoadmapXlsxFile(file);

      setImportResult(parsed);
      setAllowDuplicateSave(false);

      if (parsed?.roadmap && parsed?.validation?.isValid) {
        setDuplicateChecking(true);

        try {
          const audit = await findDuplicateStudyRoadmaps({
            roadmap: parsed.roadmap,
          });

          setDuplicateAudit(audit);
        } finally {
          setDuplicateChecking(false);
        }
      }
    } catch (error) {
      console.error("Roadmap import parse error:", error);

      setDuplicateAudit(null);
      setAllowDuplicateSave(false);

      setImportResult({
        roadmap: null,
        days: [],
        validation: {
          isValid: false,
          errors: [error.message || "Unable to parse roadmap file."],
          warnings: [],
          summary: {},
        },
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const confirmPotentialDuplicateSave = () => {
    setAllowDuplicateSave(true);
    setSaveMessage(
      "Duplicate warning confirmed. You can now save this as a new draft."
    );
  };

  const handleSaveDraft = async () => {
    if (!importResult?.validation?.isValid) {
      setSaveMessage("Fix validation errors before saving this roadmap.");
      return;
    }

    if (hasExactDuplicate) {
      setSaveMessage(
        "Exact duplicate roadmap found. This import is blocked to avoid accidental duplicate drafts."
      );
      return;
    }

    if (hasPotentialDuplicate && !allowDuplicateSave) {
      setSaveMessage(
        "Possible duplicate roadmap found. Review the warning and confirm before saving as a new draft."
      );
      return;
    }

    try {
      setSaving(true);
      setSaveMessage("");

      const roadmapId = await saveImportedRoadmapAsDraft({
        roadmap: importResult.roadmap,
        days: importResult.days,
        allowPotentialDuplicate: allowDuplicateSave,
      });

      setSaveMessage("Roadmap saved as draft successfully.");

      navigate(`/admin/content/roadmaps/schedule/${roadmapId}`);
    } catch (error) {
      console.error("Save imported roadmap error:", error);
      setSaveMessage(error.message || "Unable to save roadmap as draft.");
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}