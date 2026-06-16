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
  loadUserRoadmapProgress,
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

const getRoadmapProgressForUser = async ({ user, roadmapId }) => {
  if (!user?.uid || !roadmapId) return [];

  return loadUserRoadmapProgress({
    userId: user.uid,
    roadmapId,
  });
};

const getCompletedTaskIdsForDay = ({ progressItems = [], dayId = "" }) => {
  const progressItem = progressItems.find((item) => item.dayId === dayId);

  return Array.isArray(progressItem?.completedTaskIds)
    ? progressItem.completedTaskIds
    : [];
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

const formatLongDate = (dateValue = "") => {
  if (!dateValue) return "Date not set";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildRoadmapMetrics = ({ roadmaps = [] }) => {
  const publishedCount = roadmaps.length;
  const freeCount = roadmaps.filter(
    (roadmap) => roadmap.planType === "FREE"
  ).length;
  const premiumCount = roadmaps.filter(
    (roadmap) =>
      roadmap.planType === "PREMIUM" ||
      roadmap.planType === "MENTORSHIP"
  ).length;

  return [
    { value: publishedCount || "0", label: "Roadmaps" },
    { value: freeCount || "0", label: "Free Paths" },
    { value: premiumCount || "0", label: "Premium Paths" },
    { value: "Daily", label: "Guidance" },
  ];
};

const getStudentIdentity = (user = {}) => {
    const email =
      user.email ||
      user.studentEmail ||
      user.emailAddress ||
      user.userEmail ||
      "";
  
    const name =
      user.displayName ||
      user.fullName ||
      user.studentName ||
      user.name ||
      user.firstName ||
      (email ? email.split("@")[0] : "") ||
      "Student";
  
    return {
      studentName: name,
      studentEmail: email,
    };
  };

const getDateKey = (date = new Date()) => {
    return date.toISOString().slice(0, 10);
  };
  
  const buildCatchUpCards = ({
    roadmap,
    progressItems = [],
    todayKey = getDateKey(),
    limit = 6,
  }) => {
    if (!roadmap?.id) return [];
  
    const days = Array.isArray(roadmap.days) ? roadmap.days : [];
  
    return days
      .filter((day) => {
        const dayDate = day.date || "";
        const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  
        return dayDate && dayDate <= todayKey && tasks.length > 0;
      })
      .map((day) => {
        const tasks = Array.isArray(day.tasks) ? day.tasks : [];
        const completedTaskIds = getCompletedTaskIdsForDay({
          progressItems,
          dayId: day.id,
        });
  
        const completedCount = completedTaskIds.length;
        const pendingCount = Math.max(0, tasks.length - completedCount);
  
        return {
          roadmap,
          day,
          completedCount,
          pendingCount,
          totalTasks: tasks.length,
          isToday: day.date === todayKey,
        };
      })
      .filter((item) => item.pendingCount > 0)
      .sort((a, b) => {
        const dateCompare = (a.day.date || "").localeCompare(b.day.date || "");
  
        if (dateCompare !== 0) return dateCompare;
  
        return Number(a.day.dayNumber || 0) - Number(b.day.dayNumber || 0);
      })
      .slice(0, limit);
  };

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
                  to={
                    hasAccess
                      ? `/ctet-tet/roadmaps/${roadmap.id}`
                      : ""
                  }
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
  const [smartRecommendations, setSmartRecommendations] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  const reloadProgress = React.useCallback(async () => {
    const progress = await getRoadmapProgressForUser({
      user,
      roadmapId,
    });

    setProgressItems(progress);
  }, [user, roadmapId]);

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

  const handleToggleTask = async ({ day, task }) => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    const currentCompletedIds = getCompletedTaskIdsForDay({
      progressItems,
      dayId: day.id,
    });

    const alreadyCompleted = currentCompletedIds.includes(task.taskId);

    const nextCompletedIds = alreadyCompleted
      ? currentCompletedIds.filter((taskId) => taskId !== task.taskId)
      : [...currentCompletedIds, task.taskId];

    const nextProgressPercent =
      day.tasks?.length > 0
        ? Math.round((nextCompletedIds.length / day.tasks.length) * 100)
        : 0;

    await saveUserRoadmapDayProgress({
      userId: user.uid,
      roadmapId,
      dayId: day.id,
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
              { value: roadmap.totalDays || roadmap.days?.length || 0, label: "Days" },
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
                  ? `${todayDay.subject || "Study"} • ${todayDay.focusArea || todayDay.chapter || "Daily tasks"}`
                  : upcomingDays[0]
                  ? `${upcomingDays[0].subject || "Study"} • ${upcomingDays[0].focusArea || upcomingDays[0].chapter || "Next task"}`
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
    text="Each task now carries its own Smart Guide. Resources are shown according to the actual task, not as a random day-level grid."
  />

  {!smartRecommendations ? (
    <RoadmapEmptyState
      title="Checking Smart Guide..."
      text="AspirePath is matching notes, videos, and mock tests task by task."
    />
  ) : null}

  <div className="aspirePathTaskList">
    {(activeDay.tasks || []).map((task, index) => {
      const taskKey =
        task.taskId ||
        task.id ||
        task.title ||
        `${task.slot || task.taskType || "task"}-${index + 1}`;

      const taskGuide =
        smartRecommendations?.byTask?.find(
          (entry) =>
            entry.taskId === task.taskId ||
            entry.taskId === task.id ||
            entry.taskId === taskKey
        ) ||
        smartRecommendations?.byTask?.[index] ||
        {};

      const taskTypeKey = (
        taskGuide.taskType ||
        task.taskType ||
        task.slot ||
        activeDay.dayType ||
        ""
      )
        .toString()
        .toLowerCase();

      const taskNotes = Array.isArray(taskGuide.notes)
        ? taskGuide.notes
        : [];

      const taskVideos = Array.isArray(taskGuide.videos)
        ? taskGuide.videos
        : [];

      const taskMocks = Array.isArray(taskGuide.mocks)
        ? taskGuide.mocks
        : [];

      const orderedSmartItems = taskTypeKey.includes("mock")
        ? [...taskMocks, ...taskNotes, ...taskVideos]
        : taskTypeKey.includes("revision")
        ? [...taskNotes, ...taskVideos, ...taskMocks]
        : taskTypeKey.includes("live")
        ? [...taskVideos, ...taskNotes, ...taskMocks]
        : [...taskNotes, ...taskVideos, ...taskMocks];

      return (
        <React.Fragment key={taskKey}>
          <RoadmapTaskCard
            task={task}
            completed={completedTaskIds.includes(task.taskId)}
            onToggleComplete={handleToggleTask}
          />

          {orderedSmartItems.length > 0 ? (
            <article className="aspirePathCard">
              <div className="aspirePathCardTop">
                <div>
                  <h3 className="aspirePathCardTitle">
                    Smart Guide for this task
                  </h3>

                  <p className="aspirePathCardText">
                    {taskGuide.taskTitle ||
                      task.title ||
                      task.description ||
                      "Task resources"}
                  </p>
                </div>

                <RoadmapBadge>
                  {taskGuide.taskSlot ||
                    task.slot ||
                    taskGuide.taskType ||
                    task.taskType ||
                    "Guide"}
                </RoadmapBadge>
              </div>

              <div className="aspirePathTaskList">
                {[
                  {
                    key: "note",
                    label: "Notes",
                    actionLabel: "📘 Open Notes",
                    items: taskNotes,
                  },
                  {
                    key: "video",
                    label: "Videos",
                    actionLabel: "▶️ Watch Video",
                    items: taskVideos,
                  },
                  {
                    key: "mock",
                    label: "Mock Tests",
                    actionLabel: "📝 Start Mock",
                    items: taskMocks,
                  },
                ]
                  .filter((group) => group.items.length > 0)
                  .map((group) => (
                    <div
                      className="aspirePathTodayCard"
                      key={`${taskKey}-${group.key}`}
                    >
                      <div className="aspirePathCardTop">
                        <h4 className="aspirePathCardTitle">
                          {group.label}
                        </h4>

                        <RoadmapBadge>
                          {group.items.length} Found
                        </RoadmapBadge>
                      </div>

                      <div className="aspirePathTaskList">
                        {group.items.map((item) => (
                          <div
                            className="aspirePathCardTop"
                            key={`${taskKey}-${group.key}-${item.id || item.href || item.title}`}
                          >
                            <div>
                              <p className="aspirePathCardText">
                                {item.title || "Recommended resource"}
                              </p>

                              <div className="aspirePathResourceRow">
                                <RoadmapBadge>
                                  {item.planType || "FREE"}
                                </RoadmapBadge>

                                {item.contentType || item.section ? (
                                  <RoadmapBadge>
                                    {item.contentType || item.section}
                                  </RoadmapBadge>
                                ) : null}
                              </div>
                            </div>

                            {item.href ? (
                              item.href.startsWith("/") ? (
                                <Link
                                  className="aspirePathPrimaryBtn"
                                  to={item.href}
                                >
                                  {group.actionLabel}
                                </Link>
                              ) : (
                                <a
                                  className="aspirePathPrimaryBtn"
                                  href={item.href}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {group.actionLabel}
                                </a>
                              )
                            ) : (
                              <button
                                className="aspirePathSecondaryBtn"
                                type="button"
                                disabled
                              >
                                No Link
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </article>
          ) : null}
        </React.Fragment>
      );
    })}
  </div>

  {smartRecommendations &&
  !smartRecommendations.byTask?.some(
    (taskGuide) =>
      taskGuide.notes?.length ||
      taskGuide.videos?.length ||
      taskGuide.mocks?.length
  ) ? (
    <RoadmapEmptyState
      title="No task-wise Smart Guide yet"
      text="Add matching notes, videos, or mock tests in Content Studio, or map manual resources from Roadmap Studio."
    />
  ) : null}
</section>

        </>
      )}
    </RoadmapShell>
  );
};

export const MyAspirePath = ({
    user = null,
    userPlanType = "FREE",
    isAdminUser = false,
  }) => {
    const [roadmaps, setRoadmaps] = React.useState([]);
    const [roadmapDetails, setRoadmapDetails] = React.useState([]);
    const [progressByRoadmap, setProgressByRoadmap] = React.useState({});
    const [loading, setLoading] = React.useState(true);
  
    React.useEffect(() => {
      let mounted = true;
  
      const loadMyRoadmaps = async () => {
        try {
          setLoading(true);
  
          const publishedRoadmaps = await loadPublishedStudyRoadmaps();
  
          const accessibleRoadmaps = publishedRoadmaps.filter((roadmap) =>
            canAccessRoadmap({
              roadmapPlanType: roadmap.planType,
              userPlanType,
              isAdmin: isAdminUser,
            })
          );
  
          const details = await Promise.all(
            accessibleRoadmaps.map((roadmap) =>
              loadStudyRoadmapWithDays(roadmap.id)
            )
          );
  
          const cleanDetails = details.filter(Boolean);
  
          let progressMap = {};
  
          if (user?.uid) {
            const progressEntries = await Promise.all(
              cleanDetails.map(async (roadmap) => {
                const progressItems = await getRoadmapProgressForUser({
                  user,
                  roadmapId: roadmap.id,
                });
  
                return [roadmap.id, progressItems];
              })
            );
  
            progressMap = Object.fromEntries(progressEntries);
          }
  
          if (mounted) {
            setRoadmaps(accessibleRoadmaps);
            setRoadmapDetails(cleanDetails);
            setProgressByRoadmap(progressMap);
          }
        } catch (error) {
          console.error("Load My AspirePath error:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };
  
      loadMyRoadmaps();
  
      return () => {
        mounted = false;
      };
    }, [userPlanType, isAdminUser, user?.uid]);
  
    const todayKey = getDateKey();
  
    const todayCards = roadmapDetails
      .map((roadmap) => ({
        roadmap,
        todayDay: getTodayRoadmapDay(roadmap.days || []),
        upcomingDays: getUpcomingRoadmapDays({
          days: roadmap.days || [],
          limit: 3,
        }),
      }))
      .filter((item) => item.todayDay || item.upcomingDays.length > 0);
  
    const catchUpCards = roadmapDetails.flatMap((roadmap) =>
      buildCatchUpCards({
        roadmap,
        progressItems: progressByRoadmap[roadmap.id] || [],
        todayKey,
        limit: 6,
      })
    );
  
    return (
      <RoadmapShell>
        <AspirePathHero
          eyebrow="My AspirePath"
          title="Your guided preparation dashboard"
          subtitle="See today’s study tasks, pending catch-up tasks, next live sessions, upcoming mock days, and active roadmaps in one place."
          metrics={[
            { value: roadmaps.length || 0, label: "Active Paths" },
            { value: todayCards.length || 0, label: "Today Cards" },
            { value: user ? catchUpCards.length || 0 : "Login", label: "Pending" },
            { value: userPlanType || "FREE", label: "Plan" },
          ]}
          actions={
            <>
              <Link className="aspirePathPrimaryBtn" to="/ctet-tet/roadmaps">
                Browse Roadmaps
              </Link>
  
              {!user ? (
                <Link className="aspirePathSecondaryBtn" to="/login">
                  Login to Track
                </Link>
              ) : null}
            </>
          }
        />
  
        <section className="aspirePathSection">
          <RoadmapSectionHeader
            kicker="Today"
            title="Your current path"
            text="Open a roadmap day and complete your tasks step by step."
          />
  
          {loading ? (
            <RoadmapEmptyState
              title="Loading your path..."
              text="AspirePath is preparing your dashboard."
            />
          ) : todayCards.length === 0 ? (
            <RoadmapEmptyState
              title="No active task today"
              text="Browse published roadmaps and start your guided preparation."
              action={
                <Link className="aspirePathPrimaryBtn" to="/ctet-tet/roadmaps">
                  Browse Roadmaps
                </Link>
              }
            />
          ) : (
            <div className="aspirePathGrid">
              {todayCards.map(({ roadmap, todayDay, upcomingDays }) => {
                const activeDay = todayDay || upcomingDays[0];
  
                return (
                  <article className="aspirePathTodayCard" key={roadmap.id}>
                    <div className="aspirePathCardTop">
                      <div>
                        <h3 className="aspirePathCardTitle">
                          {roadmap.title}
                        </h3>
  
                        <p className="aspirePathCardText">
                          {activeDay?.subject || "Study"} •{" "}
                          {activeDay?.focusArea ||
                            activeDay?.chapter ||
                            "Next task"}
                        </p>
                      </div>
  
                      <RoadmapPlanBadge planType={roadmap.planType} />
                    </div>
  
                    <div className="aspirePathResourceRow">
                      <RoadmapBadge>
                        Day {activeDay?.dayNumber || "--"}
                      </RoadmapBadge>
                      <RoadmapBadge>
                        {activeDay?.dayType || "study"}
                      </RoadmapBadge>
                    </div>
  
                    <div className="aspirePathHeroActions">
                      <Link
                        className="aspirePathPrimaryBtn"
                        to={`/ctet-tet/roadmaps/${roadmap.id}/day/${activeDay.id}`}
                      >
                        Open Task
                      </Link>
  
                      <Link
                        className="aspirePathSecondaryBtn"
                        to={`/ctet-tet/roadmaps/${roadmap.id}`}
                      >
                        Full Roadmap
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
  
        <section className="aspirePathSection">
          <RoadmapSectionHeader
            kicker="Catch-up"
            title="Pending / missed tasks"
            text="AspirePath keeps incomplete current and past tasks here so students can recover without losing their preparation flow."
          />
  
          {loading ? (
            <RoadmapEmptyState
              title="Checking pending tasks..."
              text="AspirePath is comparing your roadmap progress."
            />
          ) : !user ? (
            <RoadmapEmptyState
              title="Login required"
              text="Login to track completed, pending, and missed roadmap tasks."
              action={
                <Link className="aspirePathPrimaryBtn" to="/login">
                  Login to Track
                </Link>
              }
            />
          ) : catchUpCards.length === 0 ? (
            <RoadmapEmptyState
              title="No pending tasks"
              text="Great. Your tracked tasks are complete up to today."
            />
          ) : (
            <div className="aspirePathGrid">
              {catchUpCards.map(
                ({
                  roadmap,
                  day,
                  completedCount,
                  pendingCount,
                  totalTasks,
                  isToday,
                }) => (
                  <article
                    className="aspirePathCard"
                    key={`${roadmap.id}-${day.id}`}
                  >
                    <div className="aspirePathCardTop">
                      <div>
                        <h3 className="aspirePathCardTitle">
                          {isToday ? "Pending Today" : "Catch-up Required"}
                        </h3>
  
                        <p className="aspirePathCardText">
                          {roadmap.title}
                        </p>
                      </div>
  
                      <RoadmapBadge>
                        {pendingCount} Pending
                      </RoadmapBadge>
                    </div>
  
                    <p className="aspirePathCardText">
                      Day {day.dayNumber || "--"} •{" "}
                      {formatLongDate(day.date)}
                      <br />
                      {day.subject || "Study"} •{" "}
                      {day.focusArea || day.chapter || "Roadmap task"}
                    </p>
  
                    <div className="aspirePathResourceRow">
                      <RoadmapBadge>
                        {completedCount}/{totalTasks} Done
                      </RoadmapBadge>
                      <RoadmapBadge>
                        {day.dayType || "study"}
                      </RoadmapBadge>
                    </div>
  
                    <div className="aspirePathHeroActions">
                      <Link
                        className="aspirePathPrimaryBtn"
                        to={`/ctet-tet/roadmaps/${roadmap.id}/day/${day.id}`}
                      >
                        Complete Pending
                      </Link>
  
                      <Link
                        className="aspirePathSecondaryBtn"
                        to={`/ctet-tet/roadmaps/${roadmap.id}`}
                      >
                        Full Roadmap
                      </Link>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </RoadmapShell>
    );
  };