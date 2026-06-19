import React from "react";
import { Link, useParams } from "react-router-dom";

import { loadStudyRoadmapWithDays } from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapBadge,
  RoadmapDayCard,
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

export default function RoadmapScheduleRoute() {
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
                    <h3 className="aspirePathWeekTitle">Week {weekNumber}</h3>

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
}