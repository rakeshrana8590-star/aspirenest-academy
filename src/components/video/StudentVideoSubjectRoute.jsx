import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";
import { canAccessVideoPlan } from "./videoUtils.js";

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

  const totalClasses = chapters.reduce(
    (sum, chapter) => sum + Number(chapter.count || 0),
    0
  );

  const totalLive = chapters.reduce(
    (sum, chapter) => sum + Number(chapter.liveCount || 0),
    0
  );

  const totalRecorded = chapters.reduce(
    (sum, chapter) => sum + Number(chapter.recordedCount || 0),
    0
  );

  const hasAccess =
    isAdmin ||
    canAccessVideoPlan({
      requiredPlan: activePlan,
      userPlanType,
    });

  if (!hasAccess) {
    return (
      <section className="coursePages studentVideoShelfPage">
        <div className="studentVideoShelfShell">
          <section className="studentVideoShelfLocked">
            <span>{activePlan} SUBJECT LOCKED</span>

            <h1>{activePlan} Subject Locked</h1>

            <p>
              This subject library requires {activePlan} access. Upgrade your
              plan to open chapters, live classes, recordings, and replays.
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
        <section className="studentVideoShelfHero studentVideoSubjectHeroPremium">
          <div className="studentVideoShelfHeroCopy">
            <span className="studentVideoShelfKicker">
              {activePlan} SUBJECT CLASSROOM
            </span>

            <h1>{subjectName || "Subject Library"}</h1>

            <p>
              Chapter-wise video learning with recordings, live sessions,
              replays, and clean AspireNest classroom access.
            </p>

            <div className="studentVideoShelfActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={() => {
                  const firstChapter = chapters[0];
                  if (firstChapter?.slug) {
                    navigate(
                      `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                        activeSubjectId
                      )}/${encodeURIComponent(firstChapter.slug)}`
                    );
                  }
                }}
                disabled={!chapters.length}
              >
                Start Subject →
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={() => navigate(`/ctet-tet/videos/plan/${activePlan}`)}
              >
                ← Back to {activePlan}
              </button>
            </div>
          </div>

          <aside className="studentVideoPlanSpotlight">
            <div className="studentVideoShelfPanelHeader">
              <span>Subject Status</span>
              <strong>Classroom ON</strong>
            </div>

            <div className="studentVideoSubjectSpotlightIcon">📚</div>

            <div className="studentVideoShelfPanelGrid">
              <article>
                <strong>{chapters.length}</strong>
                <span>Chapters</span>
              </article>

              <article>
                <strong>{totalClasses}</strong>
                <span>Total classes</span>
              </article>

              <article>
                <strong>{totalRecorded}</strong>
                <span>Recorded lessons</span>
              </article>

              <article>
                <strong>{totalLive}</strong>
                <span>Live classes</span>
              </article>
            </div>

            <div className="studentVideoShelfFlow">
              <span>Subject</span>
              <i />
              <span>Chapter</span>
              <i />
              <span>Class</span>
              <i />
              <span>Revision</span>
            </div>
          </aside>
        </section>

        <section className="studentVideoShelfBlock studentVideoSubjectPremiumBlock">
          <div className="studentVideoShelfTitle">
            <span>📖 Chapter Library</span>

            <h2>Choose a chapter</h2>

            <p>
              Every chapter opens a focused classroom with recordings, scheduled
              live classes, and replay-ready learning.
            </p>
          </div>

          <div className="studentVideoSubjectGrid studentVideoSubjectGridPremium">
            {chapters.length === 0 ? (
              <div className="studentVideoShelfEmpty">
                No chapters found in this subject yet.
              </div>
            ) : (
              chapters.map((chapter) => (
                <button
                  type="button"
                  className="studentVideoSubjectCard studentVideoSubjectCardPremium"
                  key={chapter.id}
                  onClick={() =>
                    navigate(
                      `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                        activeSubjectId
                      )}/${encodeURIComponent(chapter.slug)}`
                    )
                  }
                >
                  <span className="studentVideoSubjectIcon">📖</span>

                  <strong>{chapter.title}</strong>

                  <p>
                    Continue into this chapter’s recordings, live classes,
                    replay sessions, and connected resources.
                  </p>

                  <span className="studentVideoSubjectMetaLine">
                    <b>{chapter.count}</b> Classes
                    <i />
                    <b>{chapter.recordedCount}</b> Recorded
                    <i />
                    <b>{chapter.liveCount}</b> Live
                  </span>

                  <em>Open Chapter →</em>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}