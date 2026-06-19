import React from "react";
import { Link, useParams } from "react-router-dom";

import {
  buildRoadmapProgressAnalytics,
  loadRoadmapProgressByRoadmapId,
  loadStudyRoadmapWithDays,
} from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapBadge,
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

export default function RoadmapProgressRoute() {
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
              text={`${
                analytics?.activeStudentCount || 0
              } student(s) started this roadmap. ${
                analytics?.completedTaskCount || 0
              } task completion(s) recorded out of ${
                analytics?.totalPossibleTasks || 0
              } possible task completions.`}
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
                <h3 className="roadmapStudioCardTitle">Started Days</h3>

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
}