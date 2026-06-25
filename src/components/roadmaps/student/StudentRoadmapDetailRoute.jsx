import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  calculateRoadmapProgressPercent,
  canAccessRoadmap,
  getTodayRoadmapDay,
  getUpcomingRoadmapDays,
  loadStudyRoadmapWithDays,
} from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapAccessLock,
  RoadmapBadge,
  RoadmapDayCard,
  RoadmapEmptyState,
  RoadmapPlanBadge,
  RoadmapProgressBar,
  RoadmapSectionHeader,
  RoadmapShell,
  RoadmapStatusBadge,
} from "../RoadmapShared";

import {
  formatLongDate,
  getCompletedTaskIdsForDay,
  getRoadmapProgressForUser,
  groupDaysByWeek,
} from "./roadmapStudentUtils.js";

export default function StudentRoadmapDetailRoute({
  user = null,
  userPlanType = "FREE",
  hasPlanAccess,
  isAdminUser = false,
}) {
  const { roadmapId } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = React.useState(null);
  const [progressItems, setProgressItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const loadRoadmap = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const roadmapWithDays = await loadStudyRoadmapWithDays(roadmapId);

        if (!mounted) return;

        setRoadmap(roadmapWithDays);

        if (user?.uid) {
          const progress = await getRoadmapProgressForUser({
            user,
            roadmapId,
          });

          if (mounted) {
            setProgressItems(progress);
          }
        }
      } catch (error) {
        console.error("Load roadmap detail error:", error);

        if (mounted) {
          setLoadError("Unable to load this roadmap right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRoadmap();

    return () => {
      mounted = false;
    };
  }, [roadmapId, user]);

  const hasAccess = canAccessRoadmap({
    roadmapPlanType: roadmap?.planType,
    userPlanType,
    isAdmin: isAdminUser,
    hasPlanAccess,
    accessOptions: {
      module: "roadmap",
      itemType: "roadmap",
      itemId: roadmap?.id || roadmapId,
    },
  });

  const progressPercent = calculateRoadmapProgressPercent({
    days: roadmap?.days || [],
    progressItems,
  });

  const todayDay = getTodayRoadmapDay(roadmap?.days || []);

  const upcomingDays = getUpcomingRoadmapDays({
    days: roadmap?.days || [],
    limit: 7,
  });

  const weekGroups = groupDaysByWeek(roadmap?.days || []);

  return (
    <RoadmapShell>
      {loading ? (
        <RoadmapEmptyState
          title="Loading roadmap..."
          text="Please wait while AspirePath loads your guided path."
        />
      ) : loadError ? (
        <RoadmapEmptyState title="Unable to load" text={loadError} />
      ) : !roadmap ? (
        <RoadmapEmptyState
          title="Roadmap not found"
          text="This roadmap may have been removed or unpublished."
        />
      ) : !hasAccess ? (
        <>
          <AspirePathHero
            eyebrow="Locked AspirePath"
            title={roadmap.title || "Premium Roadmap"}
            subtitle="This guided roadmap is available for upgraded students."
            metrics={[
              {
                value: roadmap.totalDays || roadmap.days?.length || 0,
                label: "Days",
              },
              { value: roadmap.planType || "PREMIUM", label: "Plan" },
              { value: roadmap.examType || "Exam", label: "Exam" },
              { value: "Locked", label: "Access" },
            ]}
          />

          <section className="aspirePathSection">
            <RoadmapAccessLock
              action={
                <button
                  className="aspirePathPrimaryBtn"
                  type="button"
                  onClick={() => navigate("/ctet-tet/pricing")}
                >
                  View Pricing
                </button>
              }
            />
          </section>
        </>
      ) : (
        <>
          <AspirePathHero
            eyebrow="My AspirePath"
            title={roadmap.title || "Smart Study Roadmap"}
            subtitle={
              roadmap.description ||
              "Follow your guided preparation plan with daily tasks, live sessions, mock tests, and revision."
            }
            metrics={[
              { value: roadmap.days?.length || 0, label: "Days" },
              { value: `${progressPercent}%`, label: "Progress" },
              { value: roadmap.planType || "FREE", label: "Plan" },
              { value: roadmap.examType || "Exam", label: "Exam" },
            ]}
            actions={
              <>
                <Link
                  className="aspirePathPrimaryBtn"
                  to={
                    todayDay
                      ? `/ctet-tet/roadmaps/${roadmap.id}/day/${todayDay.id}`
                      : "#"
                  }
                >
                  Today’s Task
                </Link>

                <button
                  className="aspirePathSecondaryBtn"
                  type="button"
                  onClick={() => navigate("/ctet-tet/roadmaps")}
                >
                  All Roadmaps
                </button>
              </>
            }
          />

          <section className="aspirePathSection">
            <RoadmapSectionHeader
              kicker="Progress"
              title="Your preparation status"
              text={`${formatLongDate(roadmap.startDate)} to ${formatLongDate(
                roadmap.endDate
              )}`}
              action={
                <>
                  <RoadmapPlanBadge planType={roadmap.planType} />
                  <RoadmapStatusBadge status={roadmap.status} />
                </>
              }
            />

            <div className="aspirePathTodayCard">
              <h3 className="aspirePathCardTitle">
                {todayDay ? "Today’s AspirePath" : "Upcoming AspirePath"}
              </h3>

              <p className="aspirePathCardText">
                {todayDay
                  ? `${todayDay.subject || "Study"} • ${
                      todayDay.focusArea ||
                      todayDay.chapter ||
                      "Daily tasks"
                    }`
                  : upcomingDays[0]
                  ? `${upcomingDays[0].subject || "Study"} • ${
                      upcomingDays[0].focusArea ||
                      upcomingDays[0].chapter ||
                      "Next task"
                    }`
                  : "No upcoming tasks available."}
              </p>

              <RoadmapProgressBar value={progressPercent} />

              <div className="aspirePathHeroActions">
                {todayDay ? (
                  <Link
                    className="aspirePathPrimaryBtn"
                    to={`/ctet-tet/roadmaps/${roadmap.id}/day/${todayDay.id}`}
                  >
                    Open Today
                  </Link>
                ) : null}

                <Link className="aspirePathSecondaryBtn" to="/my-aspirepath">
                  My AspirePath
                </Link>
              </div>
            </div>
          </section>

          <section className="aspirePathSection">
            <RoadmapSectionHeader
              kicker="Timeline"
              title="Complete roadmap"
              text="Every week is organized into focused study, live learning, mock tests, and revision."
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
                      <Link
                        key={day.id}
                        to={`/ctet-tet/roadmaps/${roadmap.id}/day/${day.id}`}
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <RoadmapDayCard
                          day={day}
                          completedTaskIds={getCompletedTaskIdsForDay({
                            progressItems,
                            dayId: day.id,
                          })}
                        />
                      </Link>
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