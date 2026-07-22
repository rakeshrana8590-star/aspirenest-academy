import React from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ROADMAP_ACTIONS,
  buildRoadmapAccessEvidence,
  buildRoadmapActionDecision,
} from "../../access/roadmapActionPolicy.js";
import {
  loadPublishedStudyRoadmaps,
} from "../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapCard,
  RoadmapEmptyState,
  RoadmapSectionHeader,
  RoadmapShell,
} from "./RoadmapShared";

import {
  buildRoadmapMetrics,
} from "./student/roadmapStudentUtils.js";

import MyAspirePathRoute from "./student/MyAspirePathRoute.jsx";
import StudentRoadmapDetailRoute from "./student/StudentRoadmapDetailRoute.jsx";
import StudentRoadmapDayRoute from "./student/StudentRoadmapDayRoute.jsx";

export const StudentRoadmapHub = ({
  user = null,
  userPlanType = "FREE",
  hasPlanAccess,
  isAdminUser = false,
  accessState = {},
}) => {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] =
    React.useState([]);
  const [loading, setLoading] =
    React.useState(true);
  const [loadError, setLoadError] =
    React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const loadRoadmaps = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const publishedRoadmaps =
          await loadPublishedStudyRoadmaps();

        if (mounted) {
          setRoadmaps(publishedRoadmaps);
        }
      } catch (error) {
        console.error(
          "Load student roadmaps error:",
          error
        );

        if (mounted) {
          setLoadError(
            "Unable to load AspirePath roadmaps right now."
          );
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

  const getRoadmapDecision = React.useCallback(
    (roadmap, action) => {
      const access = buildRoadmapAccessEvidence({
        roadmap,
        user,
        isAdmin: isAdminUser,
        hasPlanAccess,
        accessState,
      });

      return buildRoadmapActionDecision({
        action,
        roadmap,
        principal: {
          uid: user?.uid || "",
          email: user?.email || "",
          role: user?.role || "",
          isAuthenticated: Boolean(user),
          isAdmin: isAdminUser,
        },
        access,
      });
    },
    [
      accessState,
      hasPlanAccess,
      isAdminUser,
      user,
    ]
  );

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
              onClick={() =>
                navigate(
                  user
                    ? "/my-aspirepath"
                    : "/login"
                )
              }
            >
              My AspirePath
            </button>

            <Link
              className="aspirePathSecondaryBtn"
              to="/ctet-tet/courses"
            >
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
          <RoadmapEmptyState
            title="Unable to load"
            text={loadError}
          />
        ) : roadmaps.length === 0 ? (
          <RoadmapEmptyState
            title="No roadmap published yet"
            text="Published roadmaps from Roadmap Studio will appear here."
          />
        ) : (
          <div className="aspirePathGrid">
            {roadmaps.map((roadmap) => {
              const discoveryDecision =
                getRoadmapDecision(
                  roadmap,
                  ROADMAP_ACTIONS.DISCOVER
                );

              if (!discoveryDecision.visible) {
                return null;
              }

              const openDecision =
                getRoadmapDecision(
                  roadmap,
                  ROADMAP_ACTIONS.OPEN
                );
              const openRoute =
                `/ctet-tet/roadmaps/${roadmap.id}`;

              return (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  progress={0}
                  to={
                    openDecision.allowed
                      ? openRoute
                      : ""
                  }
                  action={
                    openDecision.allowed ? (
                      <Link
                        className="aspirePathPrimaryBtn"
                        to={openRoute}
                      >
                        Start Roadmap
                      </Link>
                    ) : (
                      <button
                        className="aspirePathSecondaryBtn"
                        type="button"
                        onClick={() =>
                          navigate(
                            user
                              ? "/ctet-tet/pricing"
                              : "/login"
                          )
                        }
                      >
                        {user
                          ? "Unlock Access"
                          : "Login to Open"}
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

export const StudentRoadmapDetail =
  StudentRoadmapDetailRoute;

export const StudentRoadmapDay =
  StudentRoadmapDayRoute;

export const MyAspirePath = MyAspirePathRoute;
