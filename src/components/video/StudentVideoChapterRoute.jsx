import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import LiveClassCard from "./LiveClassCard.jsx";
import RecordedLessonCard from "./RecordedLessonCard.jsx";
import useVideoLibrary from "./useVideoLibrary.js";


export default function StudentVideoChapterRoute({
  universalContent = [],
  isAdmin = false,
  hasPlanAccess,
}) {
  const navigate = useNavigate();

  const { plan = "FREE", subjectId = "", chapterId = "" } = useParams();

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

  const hasAccess =
    isAdmin ||
    (typeof hasPlanAccess === "function" &&
      hasPlanAccess(activePlan, {
        module: "video",
      }));

  const featuredClass =
    chapterItems.liveClasses[0] ||
    chapterItems.recordedLessons[0] ||
    chapterItems.all[0] ||
    null;

  const openClassroom = (item) => {
    if (!item?.id) return;

    navigate(`/ctet-tet/videos/watch/${item.id}`);
  };

  if (!hasAccess) {
    return (
      <section className="coursePages studentVideoShelfPage">
        <div className="studentVideoShelfShell">
          <section className="studentVideoShelfLocked">
            <span>{activePlan} CHAPTER LOCKED</span>

            <h1>{activePlan} Chapter Locked</h1>

            <p>
              This chapter requires {activePlan} access. Upgrade your plan to
              open recorded lessons, live classes, replays, and connected
              classroom resources.
            </p>

            <div className="studentVideoShelfActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={() => navigate("/ctet-tet/pricing")}
              >
                View Plans
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={() => navigate("/ctet-tet/videos")}
              >
                ← Back to Classes
              </button>
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="coursePages studentVideoShelfPage">
      <div className="studentVideoShelfShell">
        <section className="studentVideoShelfHero studentVideoChapterHeroPremium">
          <div className="studentVideoShelfHeroCopy">
            <span className="studentVideoShelfKicker">
              {activePlan} CHAPTER CLASSROOM
            </span>

            <h1>{chapterTitle || "Chapter Classes"}</h1>

            <p>
              {subjectName || "Subject"} • Watch recordings, join live classes,
              open replays, and continue chapter-wise learning inside one
              AspireNest classroom.
            </p>

            <div className="studentVideoShelfActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={() => openClassroom(featuredClass)}
                disabled={!featuredClass}
              >
                Start Chapter →
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
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
            </div>
          </div>

          <aside className="studentVideoPlanSpotlight">
            <div className="studentVideoShelfPanelHeader">
              <span>Chapter Status</span>
              <strong>Classroom ON</strong>
            </div>

            <div className="studentVideoPlanFeatured">
              <span>
                {featuredClass &&
                videoLibrary.getClassMode(featuredClass) === "LIVE"
                  ? "🔴"
                  : "▶️"}
              </span>

              <div>
                <strong>
                  {featuredClass?.title || "Chapter classroom ready"}
                </strong>

                <p>
                  {featuredClass
                    ? `${featuredClass.subject || "Subject"} • ${
                        featuredClass.chapter || "Chapter"
                      }`
                    : "Published classes will appear here after admin adds them."}
                </p>
              </div>

              {featuredClass && (
                <button
                  type="button"
                  onClick={() => openClassroom(featuredClass)}
                >
                  Open Class →
                </button>
              )}
            </div>

            <div className="studentVideoShelfPanelGrid">
              <article>
                <strong>{chapterItems.all.length}</strong>
                <span>Total classes</span>
              </article>

              <article>
                <strong>{chapterItems.recordedLessons.length}</strong>
                <span>Recorded lessons</span>
              </article>

              <article>
                <strong>{chapterItems.liveClasses.length}</strong>
                <span>Live classes</span>
              </article>

              <article>
                <strong>{activePlan}</strong>
                <span>Plan access</span>
              </article>
            </div>

            <div className="studentVideoShelfFlow">
              <span>Chapter</span>
              <i />
              <span>Live</span>
              <i />
              <span>Recording</span>
              <i />
              <span>Replay</span>
            </div>
          </aside>
        </section>

        <section className="studentVideoChapterWorkspace">
          <div className="studentVideoChapterShelfBlock">
            <div className="studentVideoShelfTitle">
              <span>🔴 Live Classroom</span>

              <h2>Live & replay sessions</h2>

              <p>
                Upcoming live classes, join-now state, ended sessions, and
                replay-ready classrooms stay connected here.
              </p>
            </div>

            <div className="studentVideoChapterCardGrid">
              {chapterItems.liveClasses.length === 0 ? (
                <div className="studentVideoShelfEmpty">
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

          <div className="studentVideoChapterShelfBlock">
            <div className="studentVideoShelfTitle">
              <span>🎬 Recorded Lessons</span>

              <h2>Watch chapter recordings</h2>

              <p>
                Open published recordings inside AspireNest classroom with plan
                access guard and connected learning flow.
              </p>
            </div>

            <div className="studentVideoChapterCardGrid">
              {chapterItems.recordedLessons.length === 0 ? (
                <div className="studentVideoShelfEmpty">
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
        </section>
      </div>
    </section>
  );
}