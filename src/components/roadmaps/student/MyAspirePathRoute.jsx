import React from "react";
import { Link } from "react-router-dom";

import {
  ROADMAP_ACTIONS,
  ROADMAP_DISCOVERY_MODES,
  ROADMAP_REASON_CODES,
  buildRoadmapAccessEvidence,
  buildRoadmapActionDecision,
} from "../../../access/roadmapActionPolicy.js";
import {
  getTodayRoadmapDay,
  getUpcomingRoadmapDays,
  loadPublishedStudyRoadmaps,
  loadStudyRoadmapWithDays,
} from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapBadge,
  RoadmapEmptyState,
  RoadmapPlanBadge,
  RoadmapSectionHeader,
  RoadmapShell,
} from "../RoadmapShared";

import {
  buildCatchUpCards,
  formatLongDate,
  getDateKey,
  getRoadmapProgressForUser,
} from "./roadmapStudentUtils.js";

export default function MyAspirePathRoute({
  user = null,
  userPlanType = "FREE",
  hasPlanAccess,
  isAdminUser = false,
  accessState = {},
}) {
  const [roadmaps, setRoadmaps] =
    React.useState([]);
  const [roadmapDetails, setRoadmapDetails] =
    React.useState([]);
  const [progressByRoadmap, setProgressByRoadmap] =
    React.useState({});
  const [loading, setLoading] =
    React.useState(true);
  const [loadError, setLoadError] =
    React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const loadMyRoadmaps = async () => {
      try {
        setLoading(true);
        setLoadError("");

        if (!user && !isAdminUser) {
          if (mounted) {
            setRoadmaps([]);
            setRoadmapDetails([]);
            setProgressByRoadmap({});
          }
          return;
        }

        if (
          accessState?.loading ||
          accessState?.error ||
          accessState?.isAccessCheckUnavailable
        ) {
          return;
        }

        const publishedRoadmaps =
          await loadPublishedStudyRoadmaps();

        const accessibleRoadmaps =
          publishedRoadmaps.filter((roadmap) => {
            const access =
              buildRoadmapAccessEvidence({
                roadmap,
                user,
                isAdmin: isAdminUser,
                hasPlanAccess,
                accessState,
              });

            const decision =
              buildRoadmapActionDecision({
                action: ROADMAP_ACTIONS.DISCOVER,
                roadmap,
                principal: {
                  uid: user?.uid || "",
                  email: user?.email || "",
                  role: user?.role || "",
                  isAuthenticated: Boolean(user),
                  isAdmin: isAdminUser,
                },
                access,
                discoveryMode:
                  ROADMAP_DISCOVERY_MODES.MY_ACCESS,
              });

            return decision.allowed;
          });

        const details = await Promise.all(
          accessibleRoadmaps.map((roadmap) =>
            loadStudyRoadmapWithDays(roadmap.id)
          )
        );

        const cleanDetails =
          details.filter(Boolean);

        let progressMap = {};

        if (user?.uid) {
          const progressEntries =
            await Promise.all(
              cleanDetails.map(async (roadmap) => {
                const progressItems =
                  await getRoadmapProgressForUser({
                    user,
                    roadmapId: roadmap.id,
                  });

                return [
                  roadmap.id,
                  progressItems,
                ];
              })
            );

          progressMap =
            Object.fromEntries(progressEntries);
        }

        if (mounted) {
          setRoadmaps(accessibleRoadmaps);
          setRoadmapDetails(cleanDetails);
          setProgressByRoadmap(progressMap);
        }
      } catch (error) {
        console.error(
          "Load My AspirePath error:",
          error
        );

        if (mounted) {
          setLoadError(
            "Unable to load your verified AspirePath right now."
          );
        }
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
  }, [
    accessState,
    hasPlanAccess,
    isAdminUser,
    user,
  ]);

  const todayKey = getDateKey();

  const todayCards = roadmapDetails
    .map((roadmap) => ({
      roadmap,
      todayDay: getTodayRoadmapDay(
        roadmap.days || []
      ),
      upcomingDays: getUpcomingRoadmapDays({
        days: roadmap.days || [],
        limit: 3,
      }),
    }))
    .filter(
      (item) =>
        item.todayDay ||
        item.upcomingDays.length > 0
    );

  const catchUpCards = roadmapDetails.flatMap(
    (roadmap) =>
      buildCatchUpCards({
        roadmap,
        progressItems:
          progressByRoadmap[roadmap.id] || [],
        todayKey,
        limit: 6,
      })
  );

  const accessUnavailable =
    Boolean(
      accessState?.error ||
        accessState?.isAccessCheckUnavailable
    );

  const accessLoading =
    Boolean(accessState?.loading);

  return (
    <RoadmapShell>
      <AspirePathHero
        eyebrow="My AspirePath"
        title="Your guided preparation dashboard"
        subtitle="See today’s study tasks, pending catch-up tasks, next live sessions, upcoming mock days, and active roadmaps in one place."
        metrics={[
          {
            value: roadmaps.length || 0,
            label: "Active Paths",
          },
          {
            value: todayCards.length || 0,
            label: "Today Cards",
          },
          {
            value: user
              ? catchUpCards.length || 0
              : "Login",
            label: "Pending",
          },
          {
            value: userPlanType || "FREE",
            label: "Plan",
          },
        ]}
        actions={
          <>
            <Link
              className="aspirePathPrimaryBtn"
              to="/ctet-tet/roadmaps"
            >
              Browse Roadmaps
            </Link>

            {!user ? (
              <Link
                className="aspirePathSecondaryBtn"
                to="/login"
              >
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
          text="Only roadmaps included in the currently verified plan, module, bundle, or exact-item access appear here."
        />

        {!user && !isAdminUser ? (
          <RoadmapEmptyState
            title="Login required"
            text="Login to open My AspirePath and load your authorized roadmaps and progress."
            action={
              <Link
                className="aspirePathPrimaryBtn"
                to="/login"
              >
                Login to Continue
              </Link>
            }
          />
        ) : loading || accessLoading ? (
          <RoadmapEmptyState
            title="Verifying your path..."
            text="AspirePath is checking your exact roadmap access before loading days and progress."
          />
        ) : accessUnavailable ? (
          <RoadmapEmptyState
            title="Access check unavailable"
            text="AspirePath kept your roadmap dashboard closed because access could not be verified."
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
        ) : loadError ? (
          <RoadmapEmptyState
            title="Unable to load"
            text={loadError}
          />
        ) : todayCards.length === 0 ? (
          <RoadmapEmptyState
            title="No active task today"
            text="Browse published roadmaps and start a path included in your verified access."
            action={
              <Link
                className="aspirePathPrimaryBtn"
                to="/ctet-tet/roadmaps"
              >
                Browse Roadmaps
              </Link>
            }
          />
        ) : (
          <div className="aspirePathGrid">
            {todayCards.map(
              ({
                roadmap,
                todayDay,
                upcomingDays,
              }) => {
                const activeDay =
                  todayDay || upcomingDays[0];

                return (
                  <article
                    className="aspirePathTodayCard"
                    key={roadmap.id}
                  >
                    <div className="aspirePathCardTop">
                      <div>
                        <h3 className="aspirePathCardTitle">
                          {roadmap.title}
                        </h3>

                        <p className="aspirePathCardText">
                          {activeDay?.subject ||
                            "Study"}{" "}
                          •{" "}
                          {activeDay?.focusArea ||
                            activeDay?.chapter ||
                            "Next task"}
                        </p>
                      </div>

                      <RoadmapPlanBadge
                        planType={
                          roadmap.planType
                        }
                      />
                    </div>

                    <div className="aspirePathResourceRow">
                      <RoadmapBadge>
                        Day{" "}
                        {activeDay?.dayNumber ||
                          "--"}
                      </RoadmapBadge>

                      <RoadmapBadge>
                        {activeDay?.dayType ||
                          "study"}
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
              }
            )}
          </div>
        )}
      </section>

      <section className="aspirePathSection">
        <RoadmapSectionHeader
          kicker="Catch-up"
          title="Pending / missed tasks"
          text="Progress is loaded and updated only inside a roadmap whose exact access is currently verified."
        />

        {loading || accessLoading ? (
          <RoadmapEmptyState
            title="Checking pending tasks..."
            text="AspirePath is comparing your authorized roadmap progress."
          />
        ) : !user ? (
          <RoadmapEmptyState
            title="Login required"
            text="Login to track completed, pending, and missed roadmap tasks."
            action={
              <Link
                className="aspirePathPrimaryBtn"
                to="/login"
              >
                Login to Track
              </Link>
            }
          />
        ) : accessUnavailable ? (
          <RoadmapEmptyState
            title="Progress unavailable"
            text="Pending tasks remain closed until roadmap access can be verified."
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
                        {isToday
                          ? "Pending Today"
                          : "Catch-up Required"}
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
                    {day.focusArea ||
                      day.chapter ||
                      "Roadmap task"}
                  </p>

                  <div className="aspirePathResourceRow">
                    <RoadmapBadge>
                      {completedCount}/{totalTasks}{" "}
                      Done
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
}
