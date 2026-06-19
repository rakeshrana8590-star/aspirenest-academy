import React from "react";
import { Link } from "react-router-dom";

import { loadStudyRoadmaps } from "../../../services/roadmapService";

import {
  AspirePathHero,
  RoadmapCard,
  RoadmapEmptyState,
  RoadmapSectionHeader,
  RoadmapShell,
} from "../RoadmapShared";

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

export default function RoadmapStudioHomeRoute() {
  const [roadmaps, setRoadmaps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadStudio = async () => {
      try {
        setLoading(true);

        const items = await loadStudyRoadmaps({
          includeArchived: false,
        });

        if (mounted) {
          setRoadmaps(items);
        }
      } catch (error) {
        console.error("Load Roadmap Studio error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStudio();

    return () => {
      mounted = false;
    };
  }, []);

  const recentRoadmaps = roadmaps.slice(0, 3);

  return (
    <RoadmapShell mode="admin">
      <AspirePathHero
        mode="admin"
        eyebrow="Roadmap Studio"
        title="AspirePath command center"
        subtitle="Create, import, publish, review, and track study roadmaps connected with notes, videos, live classes, mock tests, and student progress."
        metrics={buildStudioMetrics(roadmaps)}
        actions={
          <>
            <Link
              className="roadmapStudioPrimaryBtn"
              to="/admin/content/roadmaps/import"
            >
              Import Roadmap
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
          kicker="Studio Overview"
          title="Recent AspirePaths"
          text="Review latest saved roadmaps and continue managing schedule, resources, and student progress."
          action={
            <Link
              className="roadmapStudioSecondaryBtn"
              to="/admin/content/roadmaps/import"
            >
              + New Import
            </Link>
          }
        />

        {loading ? (
          <RoadmapEmptyState
            mode="admin"
            title="Loading roadmaps..."
            text="Roadmap Studio is loading saved AspirePaths."
          />
        ) : recentRoadmaps.length === 0 ? (
          <RoadmapEmptyState
            mode="admin"
            title="No roadmaps yet"
            text="Import your first AspirePath roadmap to start building the student study journey."
            action={
              <Link
                className="roadmapStudioPrimaryBtn"
                to="/admin/content/roadmaps/import"
              >
                Import Roadmap
              </Link>
            }
          />
        ) : (
          <div className="roadmapStudioGrid">
            {recentRoadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                mode="admin"
                roadmap={roadmap}
                progress={0}
                action={
                  <div className="roadmapStudioHeroActions">
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
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </RoadmapShell>
  );
}