import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  calculateRoadmapProgressPercent,
  canAccessRoadmap,
  getTodayRoadmapDay,
  getUpcomingRoadmapDays,
  loadPublishedStudyRoadmaps,
  loadRoadmapSmartRecommendations,
  loadStudyRoadmapWithDays,
  saveUserRoadmapDayProgress,
} from "../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapAccessLock,
  RoadmapBadge,
  RoadmapCard,
  RoadmapDayCard,
  RoadmapEmptyState,
  RoadmapPlanBadge,
  RoadmapProgressBar,
  RoadmapSectionHeader,
  RoadmapShell,
  RoadmapStatusBadge,
  RoadmapTaskCard,
} from "./RoadmapShared";

import {
  buildRoadmapMetrics,
  formatLongDate,
  getCompletedTaskIdsForDay,
  getRoadmapProgressForUser,
  getStudentIdentity,
  groupDaysByWeek,
} from "./student/roadmapStudentUtils.js";

import MyAspirePathRoute from "./student/MyAspirePathRoute.jsx";

export const StudentRoadmapHub = ({
  user = null,
  userPlanType = "FREE",
  isAdminUser = false,
}) => {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const loadRoadmaps = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const publishedRoadmaps = await loadPublishedStudyRoadmaps();

        if (mounted) {
          setRoadmaps(publishedRoadmaps);
        }
      } catch (error) {
        console.error("Load student roadmaps error:", error);

        if (mounted) {
          setLoadError("Unable to load AspirePath roadmaps right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRoadmaps();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <RoadmapShell>
      <AspirePathHero
        eyebrow="AspirePath"
        title="Smart Study Roadmaps"
        subtitle="Follow structured preparation paths with daily study tasks, live sessions, mock tests, revision days, and progress tracking inside AspireNest."
        metrics={buildRoadmapMetrics({ roadmaps })}
        actions={
          <>
            <button
              className="aspirePathPrimaryBtn"
              type="button"
              onClick={() => navigate("/my-aspirepath")}
            >
              My AspirePath
            </button>

            <Link className="aspirePathSecondaryBtn" to="/ctet-tet/courses">
              Explore CTET/TET
            </Link>
          </>
        }
      />

      <section className="aspirePathSection">
        <RoadmapSectionHeader
          kicker="Guided Preparation"
          title="Choose your roadmap"
          text="Pick a plan and follow a clear daily path instead of guessing what to study next."
        />

        {loading ? (
          <RoadmapEmptyState
            title="Loading roadmaps..."
            text="Please wait while AspirePath prepares available study paths."
          />
        ) : loadError ? (
          <RoadmapEmptyState title="Unable to load" text={loadError} />
        ) : roadmaps.length === 0 ? (
          <RoadmapEmptyState
            title="No roadmap published yet"
            text="Published roadmaps from Roadmap Studio will appear here."
          />
        ) : (
          <div className="aspirePathGrid">
            {roadmaps.map((roadmap) => {
              const hasAccess = canAccessRoadmap({
                roadmapPlanType: roadmap.planType,
                userPlanType,
                isAdmin: isAdminUser,
              });

              return (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  progress={0}
                  to={hasAccess ? `/ctet-tet/roadmaps/${roadmap.id}` : ""}
                  action={
                    hasAccess ? (
                      <Link
                        className="aspirePathPrimaryBtn"
                        to={`/ctet-tet/roadmaps/${roadmap.id}`}
                      >
                        Start Roadmap
                      </Link>
                    ) : (
                      <button
                        className="aspirePathSecondaryBtn"
                        type="button"
                        onClick={() => navigate("/ctet-tet/pricing")}
                      >
                        Unlock Access
                      </button>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </RoadmapShell>
  );
};

export const StudentRoadmapDetail = ({
  user = null,
  userPlanType = "FREE",
  isAdminUser = false,
}) => {
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
};

export const StudentRoadmapDay = ({
  user = null,
  userPlanType = "FREE",
  isAdminUser = false,
}) => {
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
                        <h3 className="aspirePathCardTitle">
                          {item.title}
                        </h3>

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
};

export const MyAspirePath = MyAspirePathRoute;