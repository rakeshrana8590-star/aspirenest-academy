import React from "react";
import { Link, useParams } from "react-router-dom";

import RoadmapDuplicatePanel from "./import/RoadmapDuplicatePanel.jsx";
import RoadmapImportValidationPanel from "./import/RoadmapImportValidationPanel.jsx";
import RoadmapImportPreviewPanel from "./import/RoadmapImportPreviewPanel.jsx";
import RoadmapImportUploadPanel from "./import/RoadmapImportUploadPanel.jsx";
import useRoadmapImportController from "./hooks/useRoadmapImportController.js";
import RoadmapStudioHomeRoute from "./admin/RoadmapStudioHomeRoute.jsx";
import RoadmapImportRoutePage from "./import/RoadmapImportRoute.jsx";
import RoadmapEditRoutePage from "./admin/RoadmapEditRoute.jsx";
import RoadmapManageRoutePage from "./admin/RoadmapManageRoute.jsx";
import RoadmapScheduleRoutePage from "./admin/RoadmapScheduleRoute.jsx";
import RoadmapProgressRoutePage from "./admin/RoadmapProgressRoute.jsx";

import {
    
    
    
    
    
    loadStudyRoadmapWithDays,
   
    
   
    
  } from "../../services/roadmapService";
  
import {
  AspirePathHero,
  RoadmapBadge,
  
  
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

export const RoadmapStudioHome = RoadmapStudioHomeRoute;



export const RoadmapImportRoute = RoadmapImportRoutePage;


export const RoadmapEditRoute = RoadmapEditRoutePage;


export const RoadmapManageRoute = RoadmapManageRoutePage;


export const RoadmapScheduleRoute = RoadmapScheduleRoutePage;


export const RoadmapProgressRoute = RoadmapProgressRoutePage;


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