import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  loadStudyRoadmapById,
  updateStudyRoadmapMeta,
} from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapEmptyState,
  RoadmapPlanBadge,
  RoadmapSectionHeader,
  RoadmapShell,
  RoadmapStatusBadge,
} from "../RoadmapShared";

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

export default function RoadmapEditRoute() {
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

  const possibleDuplicateWarning = saveMessage.includes(
    "Possible duplicate roadmap found"
  );

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
}