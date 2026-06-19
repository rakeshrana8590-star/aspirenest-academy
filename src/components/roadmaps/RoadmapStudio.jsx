import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import RoadmapDuplicatePanel from "./import/RoadmapDuplicatePanel.jsx";
import RoadmapImportValidationPanel from "./import/RoadmapImportValidationPanel.jsx";
import RoadmapImportPreviewPanel from "./import/RoadmapImportPreviewPanel.jsx";
import RoadmapImportUploadPanel from "./import/RoadmapImportUploadPanel.jsx";

import {
    archiveStudyRoadmap,
    buildRoadmapProgressAnalytics,
    deleteStudyRoadmapWithDays,
    loadRoadmapProgressByRoadmapId,
    loadStudyRoadmaps,
    loadStudyRoadmapById,
    loadStudyRoadmapWithDays,
    publishStudyRoadmap,
    findDuplicateStudyRoadmaps,
    saveImportedRoadmapAsDraft,
    updateStudyRoadmapMeta,
    unpublishStudyRoadmap,
  } from "../../services/roadmapService";
import {
  downloadRoadmapXlsxTemplate,
  parseRoadmapXlsxFile,
} from "../../utils/roadmapImportUtils";
import {
  AspirePathHero,
  RoadmapBadge,
  RoadmapCard,
  RoadmapDayCard,
  RoadmapEmptyState,
  RoadmapPlanBadge,
  RoadmapSectionHeader,
  RoadmapShell,
  RoadmapStatusBadge,
} from "./RoadmapShared";

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

const buildStudioMetrics = (roadmaps = []) => {
  const published = roadmaps.filter(
    (roadmap) => roadmap.status === "published"
  ).length;

  const drafts = roadmaps.filter((roadmap) => roadmap.status === "draft").length;

  const premium = roadmaps.filter(
    (roadmap) =>
      roadmap.planType === "PREMIUM" || roadmap.planType === "MENTORSHIP"
  ).length;

  return [
    { value: roadmaps.length || 0, label: "Total Paths" },
    { value: published || 0, label: "Published" },
    { value: drafts || 0, label: "Drafts" },
    { value: premium || 0, label: "Premium" },
  ];
};

const groupDaysByWeek = (days = []) => {
  return days.reduce((groups, day) => {
    const weekNumber = Number(day.weekNumber || 1);

    if (!groups[weekNumber]) {
      groups[weekNumber] = [];
    }

    groups[weekNumber].push(day);

    return groups;
  }, {});
};

const RoadmapStudioMessage = ({ type = "info", children }) => {
  if (!children) return null;

  const cardClass =
    type === "error"
      ? "roadmapStudioValidationCard roadmapStudioValidationCardError"
      : type === "warning"
      ? "roadmapStudioValidationCard roadmapStudioValidationCardWarning"
      : "roadmapStudioValidationCard roadmapStudioValidationCardSuccess";

  return <div className={cardClass}>{children}</div>;
};

export const RoadmapStudioHome = () => {
  const [roadmaps, setRoadmaps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadStudio = async () => {
      try {
        setLoading(true);

        const items = await loadStudyRoadmaps({
          includeArchived: false,
        });

        if (mounted) {
          setRoadmaps(items);
        }
      } catch (error) {
        console.error("Load Roadmap Studio error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStudio();

    return () => {
      mounted = false;
    };
  }, []);

  const recentRoadmaps = roadmaps.slice(0, 3);

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
        onConfirmDuplicateSave={() => {
          setAllowDuplicateSave(true);
          setSaveMessage(
            "Duplicate warning confirmed. You can now save this as a new draft."
          );
        }}
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
};

export const RoadmapImportRoute = () => {
  const navigate = useNavigate();
  const [selectedFileName, setSelectedFileName] = React.useState("");
  const [importResult, setImportResult] = React.useState(null);
  const [importing, setImporting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");
  const [duplicateAudit, setDuplicateAudit] = React.useState(null);
  const [duplicateChecking, setDuplicateChecking] = React.useState(false);
  const [allowDuplicateSave, setAllowDuplicateSave] = React.useState(false);


  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    setSaveMessage("");
    setImportResult(null);
    setSelectedFileName("");
    setDuplicateAudit(null);
    setDuplicateChecking(false);
    setAllowDuplicateSave(false);

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

  const validation = importResult?.validation;
  const exactDuplicateRoadmaps = duplicateAudit?.exactDuplicates || [];
const potentialDuplicateRoadmaps = duplicateAudit?.potentialDuplicates || [];
const hasExactDuplicate = exactDuplicateRoadmaps.length > 0;
const hasPotentialDuplicate = potentialDuplicateRoadmaps.length > 0;
const needsDuplicateConfirm = hasPotentialDuplicate && !allowDuplicateSave;
const saveBlockedByDuplicate = hasExactDuplicate || needsDuplicateConfirm;

  return (
    <RoadmapShell mode="admin">
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
              onClick={downloadRoadmapXlsxTemplate}
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
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </section>

      <RoadmapImportValidationPanel validation={validation} />

<RoadmapDuplicatePanel
        duplicateChecking={duplicateChecking}
        duplicateAudit={duplicateAudit}
        hasExactDuplicate={hasExactDuplicate}
        hasPotentialDuplicate={hasPotentialDuplicate}
        exactDuplicateRoadmaps={exactDuplicateRoadmaps}
        potentialDuplicateRoadmaps={potentialDuplicateRoadmaps}
        allowDuplicateSave={allowDuplicateSave}
        onConfirmDuplicateSave={() => {
          setAllowDuplicateSave(true);
          setSaveMessage(
            "Duplicate warning confirmed. You can now save this as a new draft."
          );
        }}
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
};

export const RoadmapEditRoute = () => {
    const { roadmapId } = useParams();
    const navigate = useNavigate();
    const [roadmap, setRoadmap] = React.useState(null);
    const [form, setForm] = React.useState({
      title: "",
      description: "",
      course: "CTET/TET",
      examType: "CTET/TET",
      stream: "",
      mentorName: "",
      planType: "FREE",
      status: "draft",
      startDate: "",
      endDate: "",
      examDate: "",
      sourceType: "manual",
      sourceFileName: "",
      sourceFileUrl: "",
    });
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saveMessage, setSaveMessage] = React.useState("");
    const [allowPotentialDuplicate, setAllowPotentialDuplicate] =
      React.useState(false);
  
    React.useEffect(() => {
      let mounted = true;
  
      const loadEditRoadmap = async () => {
        try {
          setLoading(true);
  
          const item = await loadStudyRoadmapById(roadmapId);
  
          if (!mounted) return;
  
          setRoadmap(item);
  
          if (item) {
            setForm({
              title: item.title || "",
              description: item.description || "",
              course: item.course || "CTET/TET",
              examType: item.examType || "CTET/TET",
              stream: item.stream || "",
              mentorName: item.mentorName || "",
              planType: item.planType || "FREE",
              status: item.status || "draft",
              startDate: item.startDate || "",
              endDate: item.endDate || "",
              examDate: item.examDate || "",
              sourceType: item.sourceType || "manual",
              sourceFileName: item.sourceFileName || "",
              sourceFileUrl: item.sourceFileUrl || "",
            });
          }
        } catch (error) {
          console.error("Load roadmap edit error:", error);
          setSaveMessage(error.message || "Unable to load roadmap for edit.");
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };
  
      loadEditRoadmap();
  
      return () => {
        mounted = false;
      };
    }, [roadmapId]);
  
    const handleFormChange = (field, value) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
  
      setAllowPotentialDuplicate(false);
      setSaveMessage("");
    };
  
    const handleSaveMeta = async () => {
      if (!form.title.trim()) {
        setSaveMessage("Roadmap title is required.");
        return;
      }
  
      if (!form.examType.trim()) {
        setSaveMessage("Exam type is required.");
        return;
      }
  
      if (!form.startDate) {
        setSaveMessage("Start date is required.");
        return;
      }
  
      try {
        setSaving(true);
        setSaveMessage("");
  
        await updateStudyRoadmapMeta({
          roadmapId,
          roadmapPayload: form,
          allowPotentialDuplicate,
        });
  
        setSaveMessage("Roadmap details updated successfully.");
  
        navigate(`/admin/content/roadmaps/schedule/${roadmapId}`);
      } catch (error) {
        console.error("Update roadmap meta error:", error);
        setSaveMessage(error.message || "Unable to update roadmap details.");
      } finally {
        setSaving(false);
      }
    };
  
    const possibleDuplicateWarning =
      saveMessage.includes("Possible duplicate roadmap found");
  
    return (
      <RoadmapShell mode="admin">
        {loading ? (
          <RoadmapEmptyState
            mode="admin"
            title="Loading roadmap..."
            text="Roadmap Studio is loading editable roadmap details."
          />
        ) : !roadmap ? (
          <RoadmapEmptyState
            mode="admin"
            title="Roadmap not found"
            text="This roadmap may have been deleted."
            action={
              <Link
                className="roadmapStudioSecondaryBtn"
                to="/admin/content/roadmaps/manage"
              >
                Back to Manage
              </Link>
            }
          />
        ) : (
          <>
            <AspirePathHero
              mode="admin"
              eyebrow="Edit Roadmap"
              title={form.title || "Edit AspirePath"}
              subtitle="Safely update roadmap metadata without replacing imported schedule days or student progress."
              metrics={[
                { value: roadmap.totalDays || 0, label: "Days" },
                { value: form.planType || "FREE", label: "Plan" },
                { value: form.status || "draft", label: "Status" },
                { value: formatDate(form.examDate), label: "Exam Date" },
              ]}
              actions={
                <>
                  <Link
                    className="roadmapStudioPrimaryBtn"
                    to={`/admin/content/roadmaps/schedule/${roadmapId}`}
                  >
                    View Schedule
                  </Link>
  
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
                kicker="Safe Edit"
                title="Roadmap details"
                text="This page edits roadmap metadata only. Schedule days, resources, and student progress are not replaced here."
                action={
                  <>
                    <RoadmapPlanBadge mode="admin" planType={form.planType} />
                    <RoadmapStatusBadge mode="admin" status={form.status} />
                  </>
                }
              />
  
              {saveMessage ? (
                <div className="roadmapStudioImportPanel">
                  <p className="roadmapStudioCardText">{saveMessage}</p>
  
                  {possibleDuplicateWarning && !allowPotentialDuplicate ? (
                    <div className="roadmapStudioHeroActions">
                      <button
                        className="roadmapStudioSecondaryBtn"
                        type="button"
                        onClick={() => {
                          setAllowPotentialDuplicate(true);
                          setSaveMessage(
                            "Duplicate warning confirmed. Click Save Changes again to update this roadmap."
                          );
                        }}
                      >
                        I understand, save this update
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
  
              <div className="roadmapStudioImportPanel">
                <div className="roadmapStudioToolbar">
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Title</label>
                    <input
                      className="roadmapStudioInput"
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        handleFormChange("title", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Course</label>
                    <input
                      className="roadmapStudioInput"
                      type="text"
                      value={form.course}
                      onChange={(event) =>
                        handleFormChange("course", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Exam Type</label>
                    <input
                      className="roadmapStudioInput"
                      type="text"
                      value={form.examType}
                      onChange={(event) =>
                        handleFormChange("examType", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Stream</label>
                    <input
                      className="roadmapStudioInput"
                      type="text"
                      value={form.stream}
                      onChange={(event) =>
                        handleFormChange("stream", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Mentor Name</label>
                    <input
                      className="roadmapStudioInput"
                      type="text"
                      value={form.mentorName}
                      onChange={(event) =>
                        handleFormChange("mentorName", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Plan Type</label>
                    <select
                      className="roadmapStudioSelect"
                      value={form.planType}
                      onChange={(event) =>
                        handleFormChange("planType", event.target.value)
                      }
                    >
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="MENTORSHIP">MENTORSHIP</option>
                    </select>
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Status</label>
                    <select
                      className="roadmapStudioSelect"
                      value={form.status}
                      onChange={(event) =>
                        handleFormChange("status", event.target.value)
                      }
                    >
                      {roadmap.status === "published" ? (
                        <option value="published">Published</option>
                      ) : null}
                      <option value="draft">Draft</option>
                      <option value="unpublished">Unpublished</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Start Date</label>
                    <input
                      className="roadmapStudioInput"
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        handleFormChange("startDate", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">End Date</label>
                    <input
                      className="roadmapStudioInput"
                      type="date"
                      value={form.endDate}
                      onChange={(event) =>
                        handleFormChange("endDate", event.target.value)
                      }
                    />
                  </div>
  
                  <div className="roadmapStudioToolbarGroup">
                    <label className="roadmapStudioCardText">Exam Date</label>
                    <input
                      className="roadmapStudioInput"
                      type="date"
                      value={form.examDate}
                      onChange={(event) =>
                        handleFormChange("examDate", event.target.value)
                      }
                    />
                  </div>
                </div>
  
                <div className="roadmapStudioToolbarGroup">
                  <label className="roadmapStudioCardText">Description</label>
                  <textarea
                    className="roadmapStudioInput"
                    rows="4"
                    value={form.description}
                    onChange={(event) =>
                      handleFormChange("description", event.target.value)
                    }
                  />
                </div>
  
                <div className="roadmapStudioHeroActions">
                  <button
                    className="roadmapStudioPrimaryBtn"
                    type="button"
                    disabled={saving}
                    onClick={handleSaveMeta}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
  
                  <Link
                    className="roadmapStudioSecondaryBtn"
                    to={`/admin/content/roadmaps/schedule/${roadmapId}`}
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </RoadmapShell>
    );
  };

export const RoadmapManageRoute = () => {
  const [roadmaps, setRoadmaps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [actionMessage, setActionMessage] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState(null);

  const loadRoadmaps = React.useCallback(async () => {
    try {
      setLoading(true);

      const items = await loadStudyRoadmaps({
        includeArchived: true,
      });

      setRoadmaps(items);
    } catch (error) {
      console.error("Load roadmap manage error:", error);
      setActionMessage("Unable to load roadmaps.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const searchMatch = [
      roadmap.title,
      roadmap.examType,
      roadmap.course,
      roadmap.stream,
      roadmap.mentorName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const statusMatch =
      statusFilter === "ALL" || roadmap.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const handlePublish = async (roadmapId) => {
    try {
      await publishStudyRoadmap(roadmapId);
      setActionMessage("Roadmap published successfully.");
      await loadRoadmaps();
    } catch (error) {
      console.error("Publish roadmap error:", error);
      setActionMessage(error.message || "Unable to publish roadmap.");
    }
  };

  const handleUnpublish = async (roadmapId) => {
    await unpublishStudyRoadmap(roadmapId);
    setActionMessage("Roadmap unpublished successfully.");
    await loadRoadmaps();
  };

  const handleArchive = async (roadmapId) => {
    await archiveStudyRoadmap(roadmapId);
    setActionMessage("Roadmap archived successfully.");
    await loadRoadmaps();
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete?.id) return;

    await deleteStudyRoadmapWithDays(pendingDelete.id);
    setActionMessage("Roadmap deleted with its days and progress records.");
    setPendingDelete(null);
    await loadRoadmaps();
  };

  return (
    <RoadmapShell mode="admin">
      <AspirePathHero
        mode="admin"
        eyebrow="Manage Roadmaps"
        title="Control every AspirePath"
        subtitle="Search, publish, unpublish, archive, delete, and inspect all imported study roadmaps."
        metrics={buildStudioMetrics(roadmaps)}
        actions={
          <>
            <Link
              className="roadmapStudioPrimaryBtn"
              to="/admin/content/roadmaps/import"
            >
              Import New
            </Link>

            <button
              className="roadmapStudioSecondaryBtn"
              type="button"
              onClick={downloadRoadmapXlsxTemplate}
            >
              Download Template
            </button>
          </>
        }
      />

      <section className="roadmapStudioSection">
        <div className="roadmapStudioToolbar">
          <div className="roadmapStudioToolbarGroup">
            <input
              className="roadmapStudioInput"
              type="search"
              placeholder="Search roadmap, exam, stream, mentor..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="roadmapStudioToolbarGroup">
            <select
              className="roadmapStudioSelect"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {actionMessage ? (
          <div className="roadmapStudioImportPanel">
            <p className="roadmapStudioCardText">{actionMessage}</p>
          </div>
        ) : null}

        {pendingDelete ? (
          <div className="roadmapStudioImportPanel">
            <h3 className="roadmapStudioCardTitle">Confirm delete</h3>
            <p className="roadmapStudioCardText">
              This will permanently delete “{pendingDelete.title}”, its days,
              and progress records.
            </p>

            <div className="roadmapStudioHeroActions">
              <button
                className="roadmapStudioDangerBtn"
                type="button"
                onClick={handleDeleteConfirmed}
              >
                Delete Permanently
              </button>

              <button
                className="roadmapStudioSecondaryBtn"
                type="button"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <RoadmapEmptyState
            mode="admin"
            title="Loading roadmaps..."
            text="Roadmap Studio is loading all saved paths."
          />
        ) : filteredRoadmaps.length === 0 ? (
          <RoadmapEmptyState
            mode="admin"
            title="No matching roadmaps"
            text="Try clearing filters or import a new roadmap."
          />
        ) : (
          <div className="roadmapStudioTableWrap">
            <table className="roadmapStudioTable">
              <thead>
                <tr>
                  <th>Roadmap</th>
                  <th>Exam</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRoadmaps.map((roadmap) => (
                  <tr key={roadmap.id}>
                    <td>
                      <strong>{roadmap.title || "Untitled Roadmap"}</strong>
                      <br />
                      {roadmap.description || "No description"}
                    </td>

                    <td>
                      {roadmap.examType || "Exam"}
                      <br />
                      {roadmap.stream || roadmap.course || "General"}
                    </td>

                    <td>
                      <RoadmapPlanBadge
                        mode="admin"
                        planType={roadmap.planType}
                      />
                    </td>

                    <td>
                      <RoadmapStatusBadge
                        mode="admin"
                        status={roadmap.status}
                      />
                    </td>

                    <td>
                      {formatDate(roadmap.startDate)} →{" "}
                      {formatDate(roadmap.endDate)}
                      <br />
                      Exam: {formatDate(roadmap.examDate)}
                    </td>

                    <td>
                      <div className="roadmapStudioToolbarGroup">
                      <Link
                          className="roadmapStudioGhostBtn"
                          to={`/admin/content/roadmaps/edit/${roadmap.id}`}
                        >
                          Edit
                        </Link>
                        
                        <Link
                          className="roadmapStudioGhostBtn"
                          to={`/admin/content/roadmaps/schedule/${roadmap.id}`}
                        >
                          Schedule
                        </Link>

                        <Link
  className="roadmapStudioGhostBtn"
  to={`/admin/content/roadmaps/resources/${roadmap.id}`}
>
  Resources
</Link>

                        <Link
                          className="roadmapStudioGhostBtn"
                          to={`/admin/content/roadmaps/progress/${roadmap.id}`}
                        >
                          Progress
                        </Link>

                        {roadmap.status === "published" ? (
                          <button
                            className="roadmapStudioSecondaryBtn"
                            type="button"
                            onClick={() => handleUnpublish(roadmap.id)}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            className="roadmapStudioPrimaryBtn"
                            type="button"
                            onClick={() => handlePublish(roadmap.id)}
                          >
                            Publish
                          </button>
                        )}

                        <button
                          className="roadmapStudioSecondaryBtn"
                          type="button"
                          onClick={() => handleArchive(roadmap.id)}
                        >
                          Archive
                        </button>

                        <button
                          className="roadmapStudioDangerBtn"
                          type="button"
                          onClick={() => setPendingDelete(roadmap)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </RoadmapShell>
  );
};

export const RoadmapScheduleRoute = () => {
  const { roadmapId } = useParams();
  const [roadmap, setRoadmap] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadSchedule = async () => {
      try {
        setLoading(true);

        const item = await loadStudyRoadmapWithDays(roadmapId);

        if (mounted) {
          setRoadmap(item);
        }
      } catch (error) {
        console.error("Load roadmap schedule error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      mounted = false;
    };
  }, [roadmapId]);

  const weekGroups = groupDaysByWeek(roadmap?.days || []);

  return (
    <RoadmapShell mode="admin">
      {loading ? (
        <RoadmapEmptyState
          mode="admin"
          title="Loading schedule..."
          text="Roadmap Studio is loading this roadmap timeline."
        />
      ) : !roadmap ? (
        <RoadmapEmptyState
          mode="admin"
          title="Roadmap not found"
          text="This roadmap may have been deleted."
        />
      ) : (
        <>
          <AspirePathHero
            mode="admin"
            eyebrow="Schedule Review"
            title={roadmap.title || "Roadmap Schedule"}
            subtitle="Review imported days, day types, tasks, live sessions, revision, and mock-test slots before publishing."
            metrics={[
              { value: roadmap.days?.length || 0, label: "Days" },
              {
                value: roadmap.days?.reduce(
                  (total, day) => total + Number(day.tasks?.length || 0),
                  0
                ),
                label: "Tasks",
              },
              { value: roadmap.planType || "FREE", label: "Plan" },
              { value: roadmap.status || "draft", label: "Status" },
            ]}
            actions={
              <>
                <Link
                  className="roadmapStudioPrimaryBtn"
                  to="/admin/content/roadmaps/manage"
                >
                  Manage Roadmaps
                </Link>

                <Link
                  className="roadmapStudioSecondaryBtn"
                  to={`/ctet-tet/roadmaps/${roadmap.id}`}
                >
                  Student Preview
                </Link>
              </>
            }
          />

          <section className="roadmapStudioSection">
            <RoadmapSectionHeader
              mode="admin"
              kicker="Timeline"
              title="Imported schedule"
              text={`${formatDate(roadmap.startDate)} to ${formatDate(
                roadmap.endDate
              )} • Exam: ${formatDate(roadmap.examDate)}`}
              action={
                <>
                  <RoadmapPlanBadge
                    mode="admin"
                    planType={roadmap.planType}
                  />
                  <RoadmapStatusBadge
                    mode="admin"
                    status={roadmap.status}
                  />
                </>
              }
            />

            <div className="aspirePathTimeline">
              {Object.entries(weekGroups).map(([weekNumber, days]) => (
                <div className="aspirePathWeekSection" key={weekNumber}>
                  <div className="aspirePathWeekHeader">
                    <h3 className="aspirePathWeekTitle">
                      Week {weekNumber}
                    </h3>

                    <RoadmapBadge>{days.length} days</RoadmapBadge>
                  </div>

                  <div className="aspirePathDayGrid">
                    {days.map((day) => (
                      <RoadmapDayCard key={day.id} day={day} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </RoadmapShell>
  );
};

export const RoadmapProgressRoute = () => {
    const { roadmapId } = useParams();
    const [roadmap, setRoadmap] = React.useState(null);
    const [progressItems, setProgressItems] = React.useState([]);
    const [analytics, setAnalytics] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
  
    React.useEffect(() => {
      let mounted = true;
  
      const loadProgressBase = async () => {
        try {
          setLoading(true);
  
          const [roadmapItem, progressRecords] = await Promise.all([
            loadStudyRoadmapWithDays(roadmapId),
            loadRoadmapProgressByRoadmapId(roadmapId),
          ]);
  
          const builtAnalytics = buildRoadmapProgressAnalytics({
            days: roadmapItem?.days || [],
            progressItems: progressRecords || [],
          });
  
          if (mounted) {
            setRoadmap(roadmapItem);
            setProgressItems(progressRecords || []);
            setAnalytics(builtAnalytics);
          }
        } catch (error) {
          console.error("Load roadmap progress analytics error:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };
  
      loadProgressBase();
  
      return () => {
        mounted = false;
      };
    }, [roadmapId]);
  
    const topStudents = analytics?.studentAnalytics?.slice(0, 10) || [];
    const dayAnalytics = analytics?.dayAnalytics || [];
    const startedDays = dayAnalytics.filter(
      (day) => Number(day.studentsStarted || 0) > 0
    );
    const lowProgressDays = dayAnalytics
      .filter(
        (day) =>
          Number(day.studentsStarted || 0) > 0 &&
          Number(day.completionPercent || 0) < 50
      )
      .slice(0, 10);
  
    return (
      <RoadmapShell mode="admin">
        {loading ? (
          <RoadmapEmptyState
            mode="admin"
            title="Loading progress..."
            text="Roadmap Studio is reading student progress records."
          />
        ) : !roadmap ? (
          <RoadmapEmptyState
            mode="admin"
            title="Roadmap not found"
            text="This roadmap may have been deleted."
          />
        ) : (
          <>
            <AspirePathHero
              mode="admin"
              eyebrow="Progress Analytics"
              title={roadmap.title || "Roadmap Progress"}
              subtitle="Track real student completion, started days, completed tasks, and roadmap-level preparation progress."
              metrics={[
                {
                  value: analytics?.activeStudentCount || 0,
                  label: "Students Started",
                },
                {
                  value: analytics?.completedTaskCount || 0,
                  label: "Tasks Done",
                },
                {
                  value: `${analytics?.averageCompletionPercent || 0}%`,
                  label: "Avg Progress",
                },
                {
                  value: progressItems.length || 0,
                  label: "Progress Records",
                },
              ]}
              actions={
                <>
                  <Link
                    className="roadmapStudioPrimaryBtn"
                    to={`/admin/content/roadmaps/schedule/${roadmap.id}`}
                  >
                    View Schedule
                  </Link>
  
                  <Link
                    className="roadmapStudioSecondaryBtn"
                    to={`/admin/content/roadmaps/resources/${roadmap.id}`}
                  >
                    Resources
                  </Link>
  
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
                kicker="Live Progress"
                title="Roadmap completion overview"
                text={`${analytics?.activeStudentCount || 0} student(s) started this roadmap. ${analytics?.completedTaskCount || 0} task completion(s) recorded out of ${analytics?.totalPossibleTasks || 0} possible task completions.`}
                action={
                  <>
                    <RoadmapPlanBadge
                      mode="admin"
                      planType={roadmap.planType}
                    />
                    <RoadmapStatusBadge
                      mode="admin"
                      status={roadmap.status}
                    />
                  </>
                }
              />
  
              <div className="roadmapStudioGrid">
                <article className="roadmapStudioCard">
                  <h3 className="roadmapStudioCardTitle">
                    Overall Completion
                  </h3>
                  <p className="roadmapStudioCardText">
                    {analytics?.overallCompletionPercent || 0}% total roadmap
                    completion across started students.
                  </p>
                </article>
  
                <article className="roadmapStudioCard">
                  <h3 className="roadmapStudioCardTitle">
                    Fully Completed Students
                  </h3>
                  <p className="roadmapStudioCardText">
                    {analytics?.fullyCompletedStudents || 0} student(s) have
                    completed all tracked tasks.
                  </p>
                </article>
  
                <article className="roadmapStudioCard">
                  <h3 className="roadmapStudioCardTitle">
                    Started Days
                  </h3>
                  <p className="roadmapStudioCardText">
                    {startedDays.length} day(s) have at least one student progress
                    record.
                  </p>
                </article>
              </div>
            </section>
  
            <section className="roadmapStudioSection">
              <RoadmapSectionHeader
                mode="admin"
                kicker="Students"
                title="Student-wise progress"
                text="This table shows real progress created when students mark roadmap tasks complete."
              />
  
              {topStudents.length === 0 ? (
                <RoadmapEmptyState
                  mode="admin"
                  title="No student progress yet"
                  text="Once students mark tasks complete, their progress will appear here."
                />
              ) : (
                <div className="roadmapStudioTableWrap">
                  <table className="roadmapStudioTable">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Completed Tasks</th>
                        <th>Touched Days</th>
                        <th>Completed Days</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
  
                    <tbody>
                      {topStudents.map((student) => (
                        <tr key={student.userId}>
                         <td>
  <strong>
  {student.studentName ||
  student.studentEmail ||
  `Student ${student.userId?.slice(0, 6) || ""}`}
  </strong>
  <br />
  {student.studentEmail ? (
    <>
      {student.studentEmail}
      <br />
    </>
  ) : null}
  <span title={student.userId}>
    {student.progressRecords} progress record(s)
  </span>
</td>
  
                          <td>
                            {student.completedTasks} /{" "}
                            {analytics?.totalTasks || 0}
                          </td>
  
                          <td>{student.touchedDays}</td>
  
                          <td>{student.completedDays}</td>
  
                          <td>
                            <RoadmapBadge mode="admin">
                              {student.completionPercent}%
                            </RoadmapBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
  
            <section className="roadmapStudioSection">
              <RoadmapSectionHeader
                mode="admin"
                kicker="Day Analytics"
                title="Day-wise completion"
                text="Use this view to find which roadmap days students started and which days need follow-up."
              />
  
              <div className="roadmapStudioTableWrap">
                <table className="roadmapStudioTable">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Focus</th>
                      <th>Tasks</th>
                      <th>Students Started</th>
                      <th>Completed Tasks</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {dayAnalytics.map((day) => (
                      <tr key={day.dayId}>
                        <td>
                          <strong>Day {day.dayNumber || "--"}</strong>
                          <br />
                          {formatDate(day.date)}
                          <br />
                          {day.dayType || "study"}
                        </td>
  
                        <td>
                          <strong>
                            {day.subject || day.focusArea || "No subject"}
                          </strong>
                          <br />
                          {day.chapter || day.focusArea || "No chapter"}
                        </td>
  
                        <td>{day.taskCount}</td>
  
                        <td>{day.studentsStarted}</td>
  
                        <td>{day.completedTasks}</td>
  
                        <td>
                          <RoadmapBadge mode="admin">
                            {day.completionPercent}%
                          </RoadmapBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
  
            {lowProgressDays.length > 0 ? (
              <section className="roadmapStudioSection">
                <RoadmapSectionHeader
                  mode="admin"
                  kicker="Follow-up"
                  title="Low progress days"
                  text="These started days are below 50% completion and may need reminders, live support, or revision guidance."
                />
  
                <div className="roadmapStudioGrid">
                  {lowProgressDays.map((day) => (
                    <article className="roadmapStudioCard" key={day.dayId}>
                      <h3 className="roadmapStudioCardTitle">
                        Day {day.dayNumber || "--"} • {day.completionPercent}%
                      </h3>
                      <p className="roadmapStudioCardText">
                        {day.subject || "No subject"} •{" "}
                        {day.chapter || day.focusArea || "No chapter"}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </RoadmapShell>
    );
  };

export const RoadmapResourcesRoute = () => {
    const { roadmapId } = useParams();
    const [roadmap, setRoadmap] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
  
    React.useEffect(() => {
      let mounted = true;
  
      const loadResources = async () => {
        try {
          setLoading(true);
  
          const item = await loadStudyRoadmapWithDays(roadmapId);
  
          if (mounted) {
            setRoadmap(item);
          }
        } catch (error) {
          console.error("Load roadmap resources error:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };
  
      loadResources();
  
      return () => {
        mounted = false;
      };
    }, [roadmapId]);
  
    const days = roadmap?.days || [];
  
    const flattenedTasks = days.flatMap((day) =>
      (day.tasks || []).map((task) => ({
        day,
        task,
        resources: Array.isArray(task.resourceLinks)
          ? task.resourceLinks
          : [],
      }))
    );
  
    const noteLinks = flattenedTasks.reduce((total, item) => {
      return (
        total +
        item.resources.filter((resource) => Boolean(resource.noteUrl)).length
      );
    }, 0);
  
    const videoLinks = flattenedTasks.reduce((total, item) => {
      return (
        total +
        item.resources.filter((resource) => Boolean(resource.videoUrl)).length
      );
    }, 0);
  
    const liveLinks = flattenedTasks.reduce((total, item) => {
      return (
        total +
        item.resources.filter((resource) => Boolean(resource.liveUrl)).length
      );
    }, 0);
  
    const mockLinks = flattenedTasks.reduce((total, item) => {
      return (
        total +
        item.resources.filter((resource) => Boolean(resource.mockId)).length
      );
    }, 0);
  
    const linkedTaskCount = flattenedTasks.filter((item) =>
      item.resources.some(
        (resource) =>
          resource.noteUrl ||
          resource.videoUrl ||
          resource.liveUrl ||
          resource.mockId
      )
    ).length;
  
    const missingTaskCount = flattenedTasks.length - linkedTaskCount;
  
    return (
      <RoadmapShell mode="admin">
        {loading ? (
          <RoadmapEmptyState
            mode="admin"
            title="Loading resources..."
            text="Roadmap Studio is checking linked notes, videos, live classes, and mock tests."
          />
        ) : !roadmap ? (
          <RoadmapEmptyState
            mode="admin"
            title="Roadmap not found"
            text="This roadmap may have been deleted."
          />
        ) : (
          <>
            <AspirePathHero
              mode="admin"
              eyebrow="Resource Mapping"
              title={roadmap.title || "Roadmap Resources"}
              subtitle="Audit which tasks are connected to notes, videos, live classes, and mock tests before students start the roadmap."
              metrics={[
                { value: noteLinks || 0, label: "Notes" },
                { value: videoLinks || 0, label: "Videos" },
                { value: liveLinks || 0, label: "Live Links" },
                { value: mockLinks || 0, label: "Mocks" },
              ]}
              actions={
                <>
                  <Link
                    className="roadmapStudioPrimaryBtn"
                    to={`/admin/content/roadmaps/schedule/${roadmap.id}`}
                  >
                    View Schedule
                  </Link>
  
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
                kicker="Resource Health"
                title="Mapping overview"
                text={`${linkedTaskCount} linked task(s), ${missingTaskCount} task(s) without resources. Blank resources are allowed, but premium guided paths should gradually connect notes, videos, live links, and mock tests.`}
                action={
                  <>
                    <RoadmapPlanBadge
                      mode="admin"
                      planType={roadmap.planType}
                    />
                    <RoadmapStatusBadge
                      mode="admin"
                      status={roadmap.status}
                    />
                  </>
                }
              />
  
              <div className="roadmapStudioGrid">
                <article className="roadmapStudioCard">
                  <h3 className="roadmapStudioCardTitle">Notes Linked</h3>
                  <p className="roadmapStudioCardText">
                    {noteLinks} note URL(s) mapped from the Resources sheet.
                  </p>
                </article>
  
                <article className="roadmapStudioCard">
                  <h3 className="roadmapStudioCardTitle">Videos / Live</h3>
                  <p className="roadmapStudioCardText">
                    {videoLinks} video URL(s) and {liveLinks} live class URL(s)
                    mapped.
                  </p>
                </article>
  
                <article className="roadmapStudioCard">
                  <h3 className="roadmapStudioCardTitle">Mock Tests</h3>
                  <p className="roadmapStudioCardText">
                    {mockLinks} mock test ID(s) mapped to roadmap tasks.
                  </p>
                </article>
              </div>
            </section>
  
            <section className="roadmapStudioSection">
              <RoadmapSectionHeader
                mode="admin"
                kicker="Task Audit"
                title="Task-wise resource map"
                text="Use this table after import to check which daily tasks already have student action links."
              />
  
              <div className="roadmapStudioTableWrap">
                <table className="roadmapStudioTable">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Task</th>
                      <th>Type</th>
                      <th>Resources</th>
                      <th>Status</th>
                    </tr>
                  </thead>
  
                  <tbody>
                    {flattenedTasks.map(({ day, task, resources }, index) => {
                      const hasAnyResource = resources.some(
                        (resource) =>
                          resource.noteUrl ||
                          resource.videoUrl ||
                          resource.liveUrl ||
                          resource.mockId
                      );
  
                      const noteCount = resources.filter((resource) =>
                        Boolean(resource.noteUrl)
                      ).length;
  
                      const videoCount = resources.filter((resource) =>
                        Boolean(resource.videoUrl)
                      ).length;
  
                      const liveCount = resources.filter((resource) =>
                        Boolean(resource.liveUrl)
                      ).length;
  
                      const mockCount = resources.filter((resource) =>
                        Boolean(resource.mockId)
                      ).length;
  
                      return (
                        <tr key={`${day.id}-${task.taskId}-${index}`}>
                          <td>
                            <strong>Day {day.dayNumber || "--"}</strong>
                            <br />
                            {day.date || "No date"}
                            <br />
                            {day.subject || "No subject"}
                          </td>
  
                          <td>
                            <strong>{task.title || "Untitled Task"}</strong>
                            <br />
                            {task.description || "No description"}
                          </td>
  
                          <td>
                            {task.slot || "task"}
                            <br />
                            {task.taskType || day.dayType || "study"}
                          </td>
  
                          <td>
                            Notes: {noteCount}
                            <br />
                            Videos: {videoCount}
                            <br />
                            Live: {liveCount}
                            <br />
                            Mock: {mockCount}
                          </td>
  
                          <td>
                            {hasAnyResource ? (
                              <RoadmapBadge mode="admin">
                                Linked
                              </RoadmapBadge>
                            ) : (
                              <RoadmapBadge mode="admin">
                                No Resource
                              </RoadmapBadge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </RoadmapShell>
    );
  };