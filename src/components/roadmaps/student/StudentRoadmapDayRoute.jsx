import React from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ROADMAP_ACTIONS,
  ROADMAP_REASON_CODES,
  buildRoadmapAccessEvidence,
  buildRoadmapActionDecision,
} from "../../../access/roadmapActionPolicy.js";
import {
  ROADMAP_LINKED_RESOURCE_REASON_CODES,
  buildRoadmapLinkedResourceAccessEvidence,
  buildRoadmapLinkedResourceDecision,
} from "../../../access/roadmapLinkedResourcePolicy.js";
import {
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
  buildRoadmapTaskToggle,
  formatLongDate,
  getCompletedTaskIdsForDay,
  getRoadmapProgressForUser,
  getRoadmapTaskId,
  getStudentIdentity,
} from "./roadmapStudentUtils.js";

export default function StudentRoadmapDayRoute({
  user = null,
  userPlanType = "FREE",
  hasPlanAccess,
  isAdminUser = false,
  accessState = {},
}) {
  const { roadmapId, dayId } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] =
    React.useState(null);
  const [progressItems, setProgressItems] =
    React.useState([]);
  const [
    smartRecommendations,
    setSmartRecommendations,
  ] = React.useState(null);
  const [loading, setLoading] =
    React.useState(true);
  const [loadError, setLoadError] =
    React.useState("");

  const reloadProgress = React.useCallback(
    async () => {
      const progress =
        await getRoadmapProgressForUser({
          user,
          roadmapId,
        });

      setProgressItems(progress);
    },
    [user, roadmapId]
  );

  React.useEffect(() => {
    let mounted = true;

    const loadDay = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const roadmapWithDays =
          await loadStudyRoadmapWithDays(roadmapId);

        if (!mounted) return;

        setRoadmap(roadmapWithDays);

        if (user?.uid) {
          const progress =
            await getRoadmapProgressForUser({
              user,
              roadmapId,
            });

          if (mounted) {
            setProgressItems(progress);
          }
        }
      } catch (error) {
        console.error(
          "Load roadmap day error:",
          error
        );

        if (mounted) {
          setLoadError(
            "Unable to load this roadmap day right now."
          );
        }
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

  const activeDay = roadmap?.days?.find(
    (day) => day.id === dayId
  );

  const roadmapAccess =
    buildRoadmapAccessEvidence({
      roadmap,
      user,
      isAdmin: isAdminUser,
      hasPlanAccess,
      accessState,
      isLoading: loading,
    });

  const principal = {
    uid: user?.uid || "",
    email: user?.email || "",
    role: user?.role || "",
    isAuthenticated: Boolean(user),
    isAdmin: isAdminUser,
  };

  const dayDecision =
    buildRoadmapActionDecision({
      action: ROADMAP_ACTIONS.VIEW_DAY,
      roadmap,
      principal,
      access: roadmapAccess,
    });

  const progressDecision =
    buildRoadmapActionDecision({
      action: ROADMAP_ACTIONS.UPDATE_PROGRESS,
      roadmap,
      principal,
      access: roadmapAccess,
    });

  const completedTaskIds =
    getCompletedTaskIdsForDay({
      progressItems,
      dayId,
    });

  React.useEffect(() => {
    let mounted = true;

    const loadRecommendations = async () => {
      if (!activeDay || !dayDecision.allowed) {
        setSmartRecommendations(null);
        return;
      }

      try {
        const recommendations =
          await loadRoadmapSmartRecommendations({
            day: activeDay,
            limit: 4,
          });

        if (mounted) {
          setSmartRecommendations(recommendations);
        }
      } catch (error) {
        console.error(
          "Load roadmap smart recommendations error:",
          error
        );

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
  }, [activeDay?.id, dayDecision.allowed]);

  const getLinkedResourceDecision =
    React.useCallback(
      (resource = {}, resourceType = "") => {
        const access =
          buildRoadmapLinkedResourceAccessEvidence({
            resource,
            resourceType,
            parentPlanType:
              roadmap?.planType || "FREE",
            user,
            isAdmin: isAdminUser,
            hasPlanAccess,
            accessState,
          });

        return buildRoadmapLinkedResourceDecision({
          resource,
          resourceType,
          parentPlanType:
            roadmap?.planType || "FREE",
          principal,
          access,
        });
      },
      [
        accessState,
        hasPlanAccess,
        isAdminUser,
        principal.email,
        principal.isAuthenticated,
        principal.role,
        principal.uid,
        roadmap?.planType,
        user,
      ]
    );

  const openLinkedResource = React.useCallback(
    (
      resource = {},
      resourceType = "",
      suppliedDecision = null
    ) => {
      const decision =
        suppliedDecision ||
        getLinkedResourceDecision(
          resource,
          resourceType
        );

      if (!decision?.allowed || !decision.canOpen) {
        if (
          decision?.reason ===
          ROADMAP_LINKED_RESOURCE_REASON_CODES
            .ACCESS_ERROR
        ) {
          window.location.reload();
          return;
        }

        navigate(
          user ? "/ctet-tet/pricing" : "/login"
        );
        return;
      }

      const href = decision.authorizedHref;

      if (!href) return;

      if (href.startsWith("/")) {
        navigate(href);
        return;
      }

      window.open(
        href,
        "_blank",
        "noopener,noreferrer"
      );
    },
    [
      getLinkedResourceDecision,
      navigate,
      user,
    ]
  );

  const handleToggleTask = async (task) => {
    if (
      !progressDecision.allowed ||
      !progressDecision.canUpdateProgress
    ) {
      if (
        progressDecision.reason ===
        ROADMAP_REASON_CODES.ACCESS_ERROR
      ) {
        window.location.reload();
        return;
      }

      navigate(
        user ? "/ctet-tet/pricing" : "/login"
      );
      return;
    }

    const taskToggle = buildRoadmapTaskToggle({
      completedTaskIds,
      task,
    });

    if (!taskToggle.allowed) {
      console.error(
        "Roadmap task progress blocked:",
        taskToggle.reason
      );
      return;
    }

    const nextProgressPercent =
      activeDay?.tasks?.length > 0
        ? Math.round(
            (taskToggle.nextCompletedTaskIds.length /
              activeDay.tasks.length) *
              100
          )
        : 0;

    await saveUserRoadmapDayProgress({
      userId: user.uid,
      roadmapId,
      dayId,
      completedTaskIds:
        taskToggle.nextCompletedTaskIds,
      progressPercent: nextProgressPercent,
      ...getStudentIdentity(user),
    });

    await reloadProgress();
  };

  const accessLoading =
    dayDecision.reason ===
    ROADMAP_REASON_CODES.ACCESS_LOADING;

  const accessError =
    dayDecision.reason ===
    ROADMAP_REASON_CODES.ACCESS_ERROR;

  return (
    <RoadmapShell>
      {loading || accessLoading ? (
        <RoadmapEmptyState
          title="Verifying roadmap day..."
          text="AspireNest is loading this day and checking exact roadmap access before tasks or progress are enabled."
        />
      ) : loadError ? (
        <RoadmapEmptyState
          title="Unable to load"
          text={loadError}
        />
      ) : !roadmap || !activeDay ? (
        <RoadmapEmptyState
          title="Day not found"
          text="This roadmap day may have been removed."
          action={
            <button
              className="aspirePathPrimaryBtn"
              type="button"
              onClick={() =>
                navigate(
                  `/ctet-tet/roadmaps/${roadmapId}`
                )
              }
            >
              Back to Roadmap
            </button>
          }
        />
      ) : accessError ? (
        <RoadmapAccessLock
          title="Roadmap access could not be verified"
          text="AspireNest kept this day, its linked resources, and progress actions closed because the access check was unavailable."
          action={
            <button
              className="aspirePathPrimaryBtn"
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              Reload Access
            </button>
          }
        />
      ) : !dayDecision.allowed ? (
        <RoadmapAccessLock
          title={
            user
              ? "This roadmap day is locked"
              : "Login required to open this roadmap day"
          }
          text="The day route requires exact roadmap authorization. Linked Notes, Videos, Live classes, and Mock Tests are checked independently."
          action={
            <button
              className="aspirePathPrimaryBtn"
              type="button"
              onClick={() =>
                navigate(
                  user
                    ? "/ctet-tet/pricing"
                    : "/login"
                )
              }
            >
              {user ? "View Pricing" : "Login"}
            </button>
          }
        />
      ) : (
        <>
          <AspirePathHero
            eyebrow={`Day ${
              activeDay.dayNumber || "--"
            }`}
            title={
              activeDay.focusArea ||
              activeDay.subject ||
              "Daily Path"
            }
            subtitle={`${formatLongDate(
              activeDay.date
            )} • ${
              activeDay.chapter ||
              roadmap.title ||
              "AspirePath task"
            }`}
            metrics={[
              {
                value:
                  activeDay.tasks?.length || 0,
                label: "Tasks",
              },
              {
                value:
                  activeDay.dayType || "study",
                label: "Type",
              },
              {
                value:
                  activeDay.subject || "Subject",
                label: "Subject",
              },
              {
                value:
                  roadmap.planType || "FREE",
                label: "Plan",
              },
            ]}
            actions={
              <>
                <button
                  className="aspirePathSecondaryBtn"
                  type="button"
                  onClick={() =>
                    navigate(
                      `/ctet-tet/roadmaps/${roadmapId}`
                    )
                  }
                >
                  Back to Roadmap
                </button>

                <Link
                  className="aspirePathGhostBtn"
                  to="/my-aspirepath"
                >
                  My AspirePath
                </Link>
              </>
            }
          />

          <section className="aspirePathSection">
            <RoadmapSectionHeader
              kicker="Daily Tasks"
              title="Complete today’s learning path"
              text="Mark each task complete after exact roadmap access is verified. Every linked resource keeps its own authorization boundary."
            />

            <div className="aspirePathTaskList">
              {(activeDay.tasks || []).map(
                (task) => {
                  const taskId =
                    getRoadmapTaskId(task);

                  return (
                    <RoadmapTaskCard
                      key={taskId || task.title}
                      task={task}
                      completed={
                        taskId
                          ? completedTaskIds.includes(
                              taskId
                            )
                          : false
                      }
                      onToggleComplete={
                        handleToggleTask
                      }
                      getResourceDecision={
                        getLinkedResourceDecision
                      }
                      onOpenResource={
                        openLinkedResource
                      }
                    />
                  );
                }
              )}
            </div>
          </section>

          <section className="aspirePathSection">
            <RoadmapSectionHeader
              kicker="Smart Guide"
              title="Recommended resources"
              text="AspirePath can recommend Notes, Videos, Live classes, and Mock Tests, but roadmap access never authorizes those resources by itself."
            />

            {!smartRecommendations ? (
              <RoadmapEmptyState
                title="Checking recommendations..."
                text="AspirePath is finding useful resources for this day."
              />
            ) : smartRecommendations.all?.length ===
              0 ? (
              <RoadmapEmptyState
                title="No smart recommendations yet"
                text="Add matching notes, videos, or mock tests in Content Studio to enable recommendations for this day."
              />
            ) : (
              <div className="aspirePathGrid">
                {smartRecommendations.all.map(
                  (item) => {
                    const resourceDecision =
                      getLinkedResourceDecision(
                        item,
                        item.type
                      );

                    return (
                      <article
                        className="aspirePathCard"
                        key={item.id}
                      >
                        <div className="aspirePathCardTop">
                          <div>
                            <h3 className="aspirePathCardTitle">
                              {item.title}
                            </h3>

                            <p className="aspirePathCardText">
                              {item.subject ||
                                activeDay.subject ||
                                "Subject"}{" "}
                              •{" "}
                              {item.chapter ||
                                activeDay.chapter ||
                                activeDay.focusArea ||
                                "Recommended resource"}
                            </p>
                          </div>

                          <RoadmapBadge>
                            {item.type === "note"
                              ? "Notes"
                              : item.type ===
                                  "video"
                                ? "Video"
                                : "Mock"}
                          </RoadmapBadge>
                        </div>

                        <div className="aspirePathResourceRow">
                          <RoadmapBadge>
                            {item.planType ||
                              "FREE"}
                          </RoadmapBadge>

                          <RoadmapBadge>
                            {item.contentType ||
                              item.section}
                          </RoadmapBadge>
                        </div>

                        <div className="aspirePathHeroActions">
                          <button
                            className={
                              resourceDecision.allowed
                                ? "aspirePathPrimaryBtn"
                                : "aspirePathSecondaryBtn"
                            }
                            type="button"
                            onClick={() =>
                              openLinkedResource(
                                item,
                                item.type,
                                resourceDecision
                              )
                            }
                          >
                            {resourceDecision.allowed
                              ? "Open Recommendation"
                              : user
                                ? "Unlock Recommendation"
                                : "Login to Open"}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </>
      )}
    </RoadmapShell>
  );
}
