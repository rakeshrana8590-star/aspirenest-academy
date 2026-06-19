import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import RoadmapDuplicatePanel from "./import/RoadmapDuplicatePanel.jsx";
import RoadmapImportValidationPanel from "./import/RoadmapImportValidationPanel.jsx";
import RoadmapImportPreviewPanel from "./import/RoadmapImportPreviewPanel.jsx";
import RoadmapImportUploadPanel from "./import/RoadmapImportUploadPanel.jsx";
import useRoadmapImportController from "./hooks/useRoadmapImportController.js";
import RoadmapStudioHomeRoute from "./admin/RoadmapStudioHomeRoute.jsx";
import RoadmapImportRoutePage from "./import/RoadmapImportRoute.jsx";
import RoadmapEditRoutePage from "./admin/RoadmapEditRoute.jsx";


import {
    archiveStudyRoadmap,
    buildRoadmapProgressAnalytics,
    deleteStudyRoadmapWithDays,
    loadRoadmapProgressByRoadmapId,
    loadStudyRoadmaps,
    loadStudyRoadmapById,
    loadStudyRoadmapWithDays,
    publishStudyRoadmap,
    
    updateStudyRoadmapMeta,
    unpublishStudyRoadmap,
  } from "../../services/roadmapService";
  import { downloadRoadmapXlsxTemplate } from "../../utils/roadmapImportUtils";
import {
  AspirePathHero,
  RoadmapBadge,
  
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

export const RoadmapStudioHome = RoadmapStudioHomeRoute;



export const RoadmapImportRoute = RoadmapImportRoutePage;


export const RoadmapEditRoute = RoadmapEditRoutePage;


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