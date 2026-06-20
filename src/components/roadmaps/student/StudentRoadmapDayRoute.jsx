import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  canAccessRoadmap,
  loadRoadmapSmartRecommendations,
  loadStudyRoadmapWithDays,
  saveUserRoadmapDayProgress,
} from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapAccessLock,
  RoadmapBadge,
  RoadmapEmptyState,
  RoadmapSectionHeader,
  RoadmapShell,
  RoadmapTaskCard,
} from "../RoadmapShared";

import {
  formatLongDate,
  getCompletedTaskIdsForDay,
  getRoadmapProgressForUser,
  getStudentIdentity,
} from "./roadmapStudentUtils.js";

export default function StudentRoadmapDayRoute({
  user = null,
  userPlanType = "FREE",
  isAdminUser = false,
}) {
  const { roadmapId, dayId } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = React.useState(null);
  const [progressItems, setProgressItems] = React.useState([]);
  const [smartRecommendations, setSmartRecommendations] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const reloadProgress = React.useCallback(async () => {
    const progress = await getRoadmapProgressForUser({
      user,
      roadmapId,
    });

    setProgressItems(progress);
  }, [user, roadmapId]);

  React.useEffect(() => {
    let mounted = true;

    const loadDay = async () => {
      try {
        setLoading(true);

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
        console.error("Load roadmap day error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDay();

    return () => {
      mounted = false;
    };
  }, [roadmapId, user]);

  const hasAccess = canAccessRoadmap({
    roadmapPlanType: roadmap?.planType,
    userPlanType,
    isAdmin: isAdminUser,
  });

  const activeDay = roadmap?.days?.find((day) => day.id === dayId);

  const completedTaskIds = getCompletedTaskIdsForDay({
    progressItems,
    dayId,
  });

  React.useEffect(() => {
    let mounted = true;

    const loadRecommendations = async () => {
      if (!activeDay) {
        setSmartRecommendations(null);
        return;
      }

      try {
        const recommendations = await loadRoadmapSmartRecommendations({
          day: activeDay,
          limit: 4,
        });

        if (mounted) {
          setSmartRecommendations(recommendations);
        }
      } catch (error) {
        console.error("Load roadmap smart recommendations error:", error);

        if (mounted) {
          setSmartRecommendations({
            notes: [],
            videos: [],
            mocks: [],
            all: [],
          });
        }
      }
    };

    loadRecommendations();

    return () => {
      mounted = false;
    };
  }, [activeDay?.id]);

  const handleToggleTask = async (task) => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    const alreadyCompleted = completedTaskIds.includes(task.taskId);

    const nextCompletedIds = alreadyCompleted
      ? completedTaskIds.filter((taskId) => taskId !== task.taskId)
      : [...completedTaskIds, task.taskId];

    const nextProgressPercent =
      activeDay?.tasks?.length > 0
        ? Math.round((nextCompletedIds.length / activeDay.tasks.length) * 100)
        : 0;

    await saveUserRoadmapDayProgress({
      userId: user.uid,
      roadmapId,
      dayId,
      completedTaskIds: nextCompletedIds,
      progressPercent: nextProgressPercent,
      ...getStudentIdentity(user),
    });

    await reloadProgress();
  };

  return (
    <RoadmapShell>
      {loading ? (
        <RoadmapEmptyState
          title="Loading day..."
          text="Please wait while AspirePath loads the selected day."
        />
      ) : !roadmap || !activeDay ? (
        <RoadmapEmptyState
          title="Day not found"
          text="This roadmap day may have been removed."
          action={
            <button
              className="aspirePathPrimaryBtn"
              type="button"
              onClick={() => navigate(`/ctet-tet/roadmaps/${roadmapId}`)}
            >
              Back to Roadmap
            </button>
          }
        />
      ) : !hasAccess ? (
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
      ) : (
        <>
          <AspirePathHero
            eyebrow={`Day ${activeDay.dayNumber || "--"}`}
            title={activeDay.focusArea || activeDay.subject || "Daily Path"}
            subtitle={`${formatLongDate(activeDay.date)} • ${
              activeDay.chapter || roadmap.title || "AspirePath task"
            }`}
            metrics={[
              { value: activeDay.tasks?.length || 0, label: "Tasks" },
              { value: activeDay.dayType || "study", label: "Type" },
              { value: activeDay.subject || "Subject", label: "Subject" },
              { value: roadmap.planType || "FREE", label: "Plan" },
            ]}
            actions={
              <>
                <button
                  className="aspirePathSecondaryBtn"
                  type="button"
                  onClick={() => navigate(`/ctet-tet/roadmaps/${roadmapId}`)}
                >
                  Back to Roadmap
                </button>

                <Link className="aspirePathGhostBtn" to="/my-aspirepath">
                  My AspirePath
                </Link>
              </>
            }
          />

          <section className="aspirePathSection">
            <RoadmapSectionHeader
              kicker="Daily Tasks"
              title="Complete today’s learning path"
              text="Mark each task complete as you finish your study, live session, mock test, or revision."
            />

            <div className="aspirePathTaskList">
              {(activeDay.tasks || []).map((task) => (
                <RoadmapTaskCard
                  key={task.taskId || task.title}
                  task={task}
                  completed={completedTaskIds.includes(task.taskId)}
                  onToggleComplete={handleToggleTask}
                />
              ))}
            </div>
          </section>

          <section className="aspirePathSection">
            <RoadmapSectionHeader
              kicker="Smart Guide"
              title="Recommended resources"
              text="AspirePath matches this day’s subject, chapter, focus area, and tasks with available notes, videos, and mock tests."
            />

            {!smartRecommendations ? (
              <RoadmapEmptyState
                title="Checking recommendations..."
                text="AspirePath is finding useful resources for this day."
              />
            ) : smartRecommendations.all?.length === 0 ? (
              <RoadmapEmptyState
                title="No smart recommendations yet"
                text="Add matching notes, videos, or mock tests in Content Studio to enable recommendations for this day."
              />
            ) : (
              <div className="aspirePathGrid">
                {smartRecommendations.all.map((item) => (
                  <article className="aspirePathCard" key={item.id}>
                    <div className="aspirePathCardTop">
                      <div>
                        <h3 className="aspirePathCardTitle">{item.title}</h3>

                        <p className="aspirePathCardText">
                          {item.subject || activeDay.subject || "Subject"} •{" "}
                          {item.chapter ||
                            activeDay.chapter ||
                            activeDay.focusArea ||
                            "Recommended resource"}
                        </p>
                      </div>

                      <RoadmapBadge>
                        {item.type === "note"
                          ? "Notes"
                          : item.type === "video"
                          ? "Video"
                          : "Mock"}
                      </RoadmapBadge>
                    </div>

                    <div className="aspirePathResourceRow">
                      <RoadmapBadge>{item.planType || "FREE"}</RoadmapBadge>

                      <RoadmapBadge>
                        {item.contentType || item.section}
                      </RoadmapBadge>
                    </div>

                    <div className="aspirePathHeroActions">
                      {item.href ? (
                        item.href.startsWith("/") ? (
                          <Link
                            className="aspirePathPrimaryBtn"
                            to={item.href}
                          >
                            Open Recommendation
                          </Link>
                        ) : (
                          <a
                            className="aspirePathPrimaryBtn"
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Recommendation
                          </a>
                        )
                      ) : (
                        <button
                          className="aspirePathSecondaryBtn"
                          type="button"
                          disabled
                        >
                          No Link Available
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </RoadmapShell>
  );
}