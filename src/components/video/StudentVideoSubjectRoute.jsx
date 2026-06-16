import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import useVideoLibrary from "./useVideoLibrary.js";

const PLAN_LEVEL = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  MENTORSHIP: 3,
};

const canOpenPlan = ({
  requiredPlan = "FREE",
  userPlanType = "FREE",
  isAdmin = false,
}) => {
  if (isAdmin) return true;

  const requiredLevel = PLAN_LEVEL[requiredPlan] ?? 0;
  const userLevel = PLAN_LEVEL[userPlanType] ?? 0;

  return userLevel >= requiredLevel;
};

export default function StudentVideoSubjectRoute({
  universalContent = [],
  userPlanType = "FREE",
  isAdmin = false,
}) {
  const navigate = useNavigate();
  const { plan = "FREE", subjectId = "" } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const activeSubjectId = decodeURIComponent(subjectId || "");

  const videoLibrary = useVideoLibrary(universalContent);

  const subjectName =
    videoLibrary.getSubjectNameFromRoute(activeSubjectId) ||
    activeSubjectId.replace(/-/g, " ");

  const chapters = videoLibrary.getChapters({
    plan: activePlan,
    subjectId: activeSubjectId,
  });

  const hasAccess = canOpenPlan({
    requiredPlan: activePlan,
    userPlanType,
    isAdmin,
  });

  if (!hasAccess) {
    return (
      <section className="coursePages videoLibraryPage">
        <div className="sectionHeader">
          <span className="badge">PLAN LOCKED</span>

          <h1>{activePlan} Subject Locked</h1>

          <p>
            This subject library requires {activePlan} access. Upgrade your plan
            to open chapters, live classes, recordings, and replays.
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
        <span className="badge">{activePlan} SUBJECT</span>

        <h1>{subjectName || "Subject Library"}</h1>

        <p>
          Choose a chapter to open recorded lessons, upcoming live classes,
          replay sessions, and AspireNest classroom resources.
        </p>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() => navigate(`/ctet-tet/videos/plan/${activePlan}`)}
          >
            ← Back to {activePlan} Classes
          </button>

          <button
            className="backButton"
            onClick={() => navigate("/ctet-tet/videos")}
          >
            Classes & Recordings
          </button>
        </div>
      </div>

      <div className="videoShelfBlock">
        <div className="videoShelfHeader">
          <h2>📚 Chapter Library</h2>

          <span>{chapters.length} Chapters</span>
        </div>

        <div className="videoSubjectGrid">
          {chapters.length === 0 ? (
            <div className="videoChapterEmpty">
              No chapters found in this subject yet.
            </div>
          ) : (
            chapters.map((chapter) => (
              <button
                type="button"
                className="videoLibraryCard"
                key={chapter.id}
                onClick={() =>
                  navigate(
                    `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                      activeSubjectId
                    )}/${encodeURIComponent(chapter.slug)}`
                  )
                }
              >
                <div className="videoLibraryCardIcon">📖</div>

                <h3>{chapter.title}</h3>

                <p>
                  Open this chapter’s recordings, scheduled live classes,
                  replay sessions, and classroom resources.
                </p>

                <span className="videoLibraryCardTag">
                  {chapter.count} Classes • {chapter.liveCount} Live •{" "}
                  {chapter.recordedCount} Recorded
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}