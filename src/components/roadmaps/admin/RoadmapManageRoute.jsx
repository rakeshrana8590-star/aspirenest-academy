import React from "react";
import { Link } from "react-router-dom";

import {
  archiveStudyRoadmap,
  deleteStudyRoadmapWithDays,
  loadStudyRoadmaps,
  publishStudyRoadmap,
  unpublishStudyRoadmap,
} from "../../../services/roadmapService";

import { downloadRoadmapXlsxTemplate } from "../../../utils/roadmapImportUtils";

import {
  AspirePathHero,
  RoadmapEmptyState,
  RoadmapPlanBadge,
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

export default function RoadmapManageRoute() {
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
    try {
      await unpublishStudyRoadmap(roadmapId);
      setActionMessage("Roadmap unpublished successfully.");
      await loadRoadmaps();
    } catch (error) {
      console.error("Unpublish roadmap error:", error);
      setActionMessage(error.message || "Unable to unpublish roadmap.");
    }
  };

  const handleArchive = async (roadmapId) => {
    try {
      await archiveStudyRoadmap(roadmapId);
      setActionMessage("Roadmap archived successfully.");
      await loadRoadmaps();
    } catch (error) {
      console.error("Archive roadmap error:", error);
      setActionMessage(error.message || "Unable to archive roadmap.");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete?.id) return;

    try {
      await deleteStudyRoadmapWithDays(pendingDelete.id);
      setActionMessage("Roadmap deleted with its days and progress records.");
      setPendingDelete(null);
      await loadRoadmaps();
    } catch (error) {
      console.error("Delete roadmap error:", error);
      setActionMessage(error.message || "Unable to delete roadmap.");
    }
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
}