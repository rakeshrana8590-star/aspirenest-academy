import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import LiveClassCard from "./LiveClassCard.jsx";
import RecordedLessonCard from "./RecordedLessonCard.jsx";
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

export default function StudentVideoChapterRoute({
  universalContent = [],
  userPlanType = "FREE",
  isAdmin = false,
}) {
  const navigate = useNavigate();

  const {
    plan = "FREE",
    subjectId = "",
    chapterId = "",
  } = useParams();

  const activePlan = decodeURIComponent(plan || "FREE").toUpperCase();
  const activeSubjectId = decodeURIComponent(subjectId || "");
  const activeChapterId = decodeURIComponent(chapterId || "");

  const videoLibrary = useVideoLibrary(universalContent);

  const subjectName =
    videoLibrary.getSubjectNameFromRoute(activeSubjectId) ||
    activeSubjectId.replace(/-/g, " ");

  const chapterItems = videoLibrary.getChapterItems({
    plan: activePlan,
    subjectId: activeSubjectId,
    chapterId: activeChapterId,
  });

  const chapterTitle =
    chapterItems.all[0]?.chapter ||
    activeChapterId.replace(/-/g, " ").replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

  const hasAccess = canOpenPlan({
    requiredPlan: activePlan,
    userPlanType,
    isAdmin,
  });

  const openClassroom = (item) => {
    if (!item?.id) return;

    navigate(`/ctet-tet/videos/watch/${item.id}`);
  };

  if (!hasAccess) {
    return (
      <section className="coursePages videoLibraryPage">
        <div className="sectionHeader">
          <span className="badge">PLAN LOCKED</span>

          <h1>{activePlan} Chapter Locked</h1>

          <p>
            This chapter requires {activePlan} access. Upgrade your plan to
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
        <span className="badge">{activePlan} CHAPTER CLASSROOM</span>

        <h1>{chapterTitle || "Chapter Classes"}</h1>

        <p>
          {subjectName || "Subject"} • Recorded lessons, upcoming live
          classes, and replay-ready AspireNest classroom sessions.
        </p>
      </div>

      <div className="videoManagerStatsGrid">
        <div className="videoManagerStatCard">
          <span>Total Classes</span>
          <strong>{chapterItems.all.length}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Live Classes</span>
          <strong>{chapterItems.liveClasses.length}</strong>
        </div>

        <div className="videoManagerStatCard">
          <span>Recorded Lessons</span>
          <strong>{chapterItems.recordedLessons.length}</strong>
        </div>
      </div>

      <div className="contentStudioForm videoManagerToolbar">
        <div className="contentStudioActions">
          <button
            className="backButton"
            onClick={() =>
              navigate(
                `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                  activeSubjectId
                )}`
              )
            }
          >
            ← Back to Chapters
          </button>

          <button
            className="backButton"
            onClick={() => navigate("/ctet-tet/videos")}
          >
            Classes & Recordings
          </button>
        </div>
      </div>

      <div className="videoChapterPageGrid">
        <div className="videoShelfBlock">
          <div className="videoShelfHeader">
            <h2>🔴 Upcoming Live Classes</h2>

            <span>{chapterItems.liveClasses.length} Live</span>
          </div>

          <div className="videoChapterShelf">
            {chapterItems.liveClasses.length === 0 ? (
              <div className="videoChapterEmpty">
                No live classes scheduled for this chapter yet.
              </div>
            ) : (
              chapterItems.liveClasses.map((item) => (
                <LiveClassCard
                  key={item.id}
                  item={item}
                  onOpen={openClassroom}
                />
              ))
            )}
          </div>
        </div>

        <div className="videoShelfBlock">
          <div className="videoShelfHeader">
            <h2>🎬 Recorded Lessons</h2>

            <span>{chapterItems.recordedLessons.length} Lessons</span>
          </div>

          <div className="videoChapterShelf">
            {chapterItems.recordedLessons.length === 0 ? (
              <div className="videoChapterEmpty">
                No recorded lessons published in this chapter yet.
              </div>
            ) : (
              chapterItems.recordedLessons.map((item) => (
                <RecordedLessonCard
                  key={item.id}
                  item={item}
                  onOpen={openClassroom}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}