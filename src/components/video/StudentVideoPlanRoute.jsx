import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import useVideoLibrary from "./useVideoLibrary.js";

const PLAN_LEVEL = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
};

const PLAN_COPY = {
  FREE: {
    icon: "🎓",
    title: "Free Classes",
    subtitle: "Open free recorded lessons and beginner classroom resources.",
  },
  BASIC: {
    icon: "🔷",
    title: "Basic Classes",
    subtitle: "Topic-wise classes for structured preparation.",
  },
  PREMIUM: {
    icon: "⭐",
    title: "Premium Classroom",
    subtitle: "Premium recordings, live classes, replays, and guided learning.",
  },
  MENTORSHIP: {
    icon: "👩‍🏫",
    title: "Mentorship Classroom",
    subtitle: "Mentor-led sessions, advanced classes, and special guidance.",
  },
};

const canOpenPlan = ({ requiredPlan = "FREE", userPlanType = "FREE", isAdmin }) => {
  if (isAdmin) return true;

  const requiredLevel = PLAN_LEVEL[requiredPlan] ?? 0;
  const userLevel = PLAN_LEVEL[userPlanType] ?? 0;

  return userLevel >= requiredLevel;
};

export default function StudentVideoPlanRoute({
  universalContent = [],
  userPlanType = "FREE",
  isAdmin = false,
}) {
  const navigate = useNavigate();
  const { plan = "FREE" } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const planCopy = PLAN_COPY[activePlan] || PLAN_COPY.FREE;

  const videoLibrary = useVideoLibrary(universalContent);

  const hasAccess = canOpenPlan({
    requiredPlan: activePlan,
    userPlanType,
    isAdmin,
  });

  const subjects = videoLibrary.getSubjects(activePlan);

  const planItems = videoLibrary.publishedVideos.filter(
    (item) => videoLibrary.normalizePlan(item.planType) === activePlan
  );

  const liveCount = planItems.filter(
    (item) => videoLibrary.getClassMode(item) === "LIVE"
  ).length;

  const recordedCount = planItems.filter(
    (item) => videoLibrary.getClassMode(item) === "RECORDED"
  ).length;

  if (!hasAccess) {
    return (
      <section className="coursePages videoLibraryPage">
        <div className="sectionHeader">
          <span className="badge">PLAN LOCKED</span>

          <h1>{activePlan} Classroom Locked</h1>

          <p>
            This classroom requires {activePlan} access. Upgrade your plan to
            open recorded lessons, live classes, and replays.
          </p>
        </div>

        <div className="contentStudioForm">
          <div className="contentStudioActions">
            <button
              className="publishButton"
              onClick={() => navigate("/ctet-tet/pricing")}
            >
              View Plans
            </button>

            <button
              className="backButton"
              onClick={() => navigate("/ctet-tet/videos")}
            >
              ← Back to Classes
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="coursePages videoLibraryPage">
      <div className="sectionHeader">
        <span className="badge">{activePlan} CLASSES</span>

        <h1>{planCopy.title}</h1>

        <p>{planCopy.subtitle}</p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{planItems.length}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Subjects</span>
          <strong>{subjects.length}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live Classes</span>
          <strong>{liveCount}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded</span>
          <strong>{recordedCount}</strong>
        </div>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate("/ctet-tet/videos")}
          >
            ← Back to Classes & Recordings
          </button>

          <button
            className="backButton"
            onClick={() => navigate("/ctet-tet")}
          >
            CTET/TET Hub
          </button>
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>{planCopy.icon} Subject Library</h2>
          <span>{subjects.length} Subjects</span>
        </div>

        <div className="videoSubjectGrid">
          {subjects.length === 0 ? (
            <div className="videoChapterEmpty">
              No published classes found in this plan yet.
            </div>
          ) : (
            subjects.map((subject) => (
              <button
                type="button"
                className="videoLibraryCard"
                key={subject.id}
                onClick={() =>
                  navigate(
                    `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                      subject.slug
                    )}`
                  )
                }
              >
                <div className="videoLibraryCardIcon">📚</div>

                <h3>{subject.title}</h3>

                <p>
                  Open chapters, recorded lessons, live classes, and replay
                  resources for this subject.
                </p>

                <span className="videoLibraryCardTag">
                  {subject.count} Classes • {subject.liveCount} Live •{" "}
                  {subject.recordedCount} Recorded
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}