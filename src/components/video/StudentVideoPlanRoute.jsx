import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import useVideoLibrary from "./useVideoLibrary.js";
import { canAccessVideoPlan } from "./videoUtils.js";

const PLAN_COPY = {
  FREE: {
    icon: "🎓",
    title: "Free Classroom",
    subtitle: "Open free recorded lessons and beginner classroom resources.",
    badge: "Start Learning",
  },
  BASIC: {
    icon: "🔷",
    title: "Basic Classroom",
    subtitle: "Topic-wise classes for structured CTET/TET preparation.",
    badge: "Structured Practice",
  },
  PREMIUM: {
    icon: "⭐",
    title: "Premium Classroom",
    subtitle: "Premium recordings, live classes, replays, and guided learning.",
    badge: "Premium Access",
  },
  MENTORSHIP: {
    icon: "👩‍🏫",
    title: "Mentorship Classroom",
    subtitle: "Mentor-led sessions, advanced classes, and special guidance.",
    badge: "Mentor Led",
  },
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

  const hasAccess =
    isAdmin ||
    canAccessVideoPlan({
      requiredPlan: activePlan,
      userPlanType,
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

  const featuredItems = planItems.slice(0, 3);
  const featuredItem = featuredItems[0];

  if (!hasAccess) {
    return (
      <section className="coursePages studentVideoShelfPage">
        <div className="studentVideoShelfShell">
          <section className="studentVideoShelfLocked">
            <span>{activePlan} PLAN LOCKED</span>

            <h1>{activePlan} Classroom Locked</h1>

            <p>
              This classroom requires {activePlan} access. Upgrade your plan to
              open recorded lessons, live classes, and replays.
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
        <section className="studentVideoShelfHero studentVideoPlanHeroPremium">
          <div className="studentVideoShelfHeroCopy">
            <span className="studentVideoShelfKicker">
              {activePlan} CLASSROOM
            </span>

            <h1>{planCopy.title}</h1>

            <p>{planCopy.subtitle}</p>

            <div className="studentVideoShelfActions">
              <button
                type="button"
                className="studentVideoPrimaryButton"
                onClick={() => {
                  const firstSubject = subjects[0];
                  if (firstSubject?.slug) {
                    navigate(
                      `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                        firstSubject.slug
                      )}`
                    );
                  }
                }}
                disabled={!subjects.length}
              >
                Start This Plan →
              </button>

              <button
                type="button"
                className="studentVideoSecondaryButton"
                onClick={() => navigate("/ctet-tet/videos")}
              >
                ← Classes & Recordings
              </button>
            </div>
          </div>

          <aside className="studentVideoPlanSpotlight">
            <div className="studentVideoShelfPanelHeader">
              <span>{planCopy.badge}</span>
              <strong>{isAdmin ? "Admin Preview" : "Student Access"}</strong>
            </div>

            <div className="studentVideoPlanFeatured">
              <span>{planCopy.icon}</span>

              <div>
                <strong>{featuredItem?.title || "Plan classroom ready"}</strong>
                <p>
                  {featuredItem
                    ? `${featuredItem.subject || "Subject"} • ${
                        featuredItem.chapter || "Chapter"
                      }`
                    : "Published classes will appear here after admin adds them."}
                </p>
              </div>

              {featuredItem && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/ctet-tet/videos/watch/${featuredItem.id}`)
                  }
                >
                  Open Class →
                </button>
              )}
            </div>

            <div className="studentVideoShelfPanelGrid">
              <article>
                <strong>{planItems.length}</strong>
                <span>Total classes</span>
              </article>

              <article>
                <strong>{subjects.length}</strong>
                <span>Subject shelves</span>
              </article>

              <article>
                <strong>{recordedCount}</strong>
                <span>Recorded lessons</span>
              </article>

              <article>
                <strong>{liveCount}</strong>
                <span>Live classes</span>
              </article>
            </div>

            <div className="studentVideoShelfFlow">
              <span>Plan</span>
              <i />
              <span>Subject</span>
              <i />
              <span>Chapter</span>
              <i />
              <span>Watch</span>
            </div>
          </aside>
        </section>

        <section className="studentVideoShelfBlock studentVideoSubjectPremiumBlock">
          <div className="studentVideoShelfTitle studentVideoShelfTitleRow">
            <div>
              <span>{planCopy.icon} Subject Library</span>

              <h2>Choose a subject</h2>

              <p>
                Open subject-wise chapters, recorded lessons, live classes, and
                replay-ready classroom sessions.
              </p>
            </div>

            <button
              type="button"
              className="studentVideoSecondaryButton"
              onClick={() => navigate("/ctet-tet/pricing")}
            >
              Upgrade Plan →
            </button>
          </div>

          <div className="studentVideoSubjectGrid studentVideoSubjectGridPremium">
            {subjects.length === 0 ? (
              <div className="studentVideoShelfEmpty">
                No published classes found in this plan yet.
              </div>
            ) : (
              subjects.map((subject) => (
                <button
                  type="button"
                  className="studentVideoSubjectCard studentVideoSubjectCardPremium"
                  key={subject.id}
                  onClick={() =>
                    navigate(
                      `/ctet-tet/videos/plan/${activePlan}/${encodeURIComponent(
                        subject.slug
                      )}`
                    )
                  }
                >
                  <span className="studentVideoSubjectIcon">📚</span>

                  <strong>{subject.title}</strong>

                  <p>
                    Open chapter-wise recordings, live sessions, replays, and
                    connected classroom learning.
                  </p>

                  <span className="studentVideoSubjectMetaLine">
                    <b>{subject.count}</b> Classes
                    <i />
                    <b>{subject.recordedCount}</b> Recorded
                    <i />
                    <b>{subject.liveCount}</b> Live
                  </span>

                  <em>Open Subject →</em>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}