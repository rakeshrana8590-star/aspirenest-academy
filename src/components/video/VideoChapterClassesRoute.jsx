import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import VideoAdminCard from "./VideoAdminCard.jsx";
import useVideoLibrary from "./useVideoLibrary.js";

import "../../styles/video/videoManageLibrary.css";

import {
  createVideoSlug,
  getClassroomSourceUrl,
  getLiveClassStatus,
  getLiveStatusLabel,
  isLiveClass,
  isRecordedClass,
  normalizePlanType,
} from "./videoUtils.js";

const PLAN_ORDER = ["FREE", "BASIC", "PREMIUM", "MENTORSHIP"];

const PLAN_BADGE = {
  FREE: "Free",
  BASIC: "Basic",
  PREMIUM: "Premium",
  MENTORSHIP: "Mentorship",
};

const getTimeValue = (value) => {
  if (!value) return 0;

  if (value?.seconds) return value.seconds * 1000;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const buildPlanSummary = (items = []) =>
  PLAN_ORDER.map((plan) => {
    const planItems = items.filter(
      (item) => normalizePlanType(item.planType || "FREE") === plan
    );

    return {
      id: plan,
      label: PLAN_BADGE[plan] || plan,
      count: planItems.length,
    };
  }).filter((plan) => plan.count > 0);

const getFeaturedClass = (items = []) => {
  const premiumItem = items.find(
    (item) => normalizePlanType(item.planType || "FREE") === "PREMIUM"
  );

  const liveItem = items.find(isLiveClass);

  return premiumItem || liveItem || items[0] || null;
};

const getClassSourceLabel = (item = {}) => {
  if (isLiveClass(item)) {
    const liveState = getLiveClassStatus(item);

    if (liveState === "CANCELLED") return "Cancelled";
    if (liveState === "JOIN_NOW") return "Live access";
    if (liveState === "REPLAY_AVAILABLE") return "Replay linked";
    if (liveState === "ENDED") return "Replay pending";
    if (liveState === "UPCOMING") return "Scheduled";

    return "Live setup";
  }

  return getClassroomSourceUrl(item) ? "Classroom video" : "Source pending";
};

export default function VideoChapterClassesRoute({ universalContent = [] }) {
  const navigate = useNavigate();

  const { subjectName = "", chapterName = "" } = useParams();

  const decodedSubject = decodeURIComponent(subjectName || "");
  const decodedChapter = decodeURIComponent(chapterName || "");

  const videoLibrary = useVideoLibrary(universalContent);

  const activeSubject =
    videoLibrary.getSubjectNameFromRoute(decodedSubject) || decodedSubject;

  const matchingChapter =
    videoLibrary
      .getChapters({ subjectId: activeSubject })
      .find(
        (chapter) =>
          chapter.slug === createVideoSlug(decodedChapter) ||
          videoLibrary.normalizeText(chapter.name) ===
            videoLibrary.normalizeText(decodedChapter)
      )?.name || decodedChapter;

  const chapterItems = React.useMemo(
    () =>
      [...videoLibrary.getChapterItems({
        subjectId: activeSubject,
        chapterId: matchingChapter,
      }).all].sort((first, second) => {
        const firstDate =
          getTimeValue(first.updatedAt) || getTimeValue(first.createdAt);

        const secondDate =
          getTimeValue(second.updatedAt) || getTimeValue(second.createdAt);

        return secondDate - firstDate;
      }),
    [videoLibrary, activeSubject, matchingChapter]
  );

  const recordedCount = chapterItems.filter(isRecordedClass).length;
  const liveCount = chapterItems.filter(isLiveClass).length;
  const sourcePending = chapterItems.filter(
    (item) => !getClassroomSourceUrl(item)
  ).length;

  const replayReadyCount = chapterItems.filter((item) => {
    if (isRecordedClass(item)) return Boolean(getClassroomSourceUrl(item));

    return getLiveStatusLabel(getLiveClassStatus(item)) === "Replay Available";
  }).length;

  const planSummary = buildPlanSummary(chapterItems);
  const featuredClass = getFeaturedClass(chapterItems);

  const mentorCount = new Set(
    chapterItems.map((item) => item.mentorName).filter(Boolean)
  ).size;

  const heroStats = [
    {
      label: "Chapter classes",
      value: chapterItems.length,
    },
    {
      label: "Recorded lessons",
      value: recordedCount,
    },
    {
      label: "Live classrooms",
      value: liveCount,
    },
    {
      label: "Replay ready",
      value: replayReadyCount,
    },
  ];

  const healthStats = [
    {
      label: "Source pending",
      value: sourcePending,
      hint: "Needs classroom URL",
    },
    {
      label: "Plan shelves",
      value: planSummary.length,
      hint: "Free / premium access",
    },
    {
      label: "Mentors",
      value: mentorCount,
      hint: "Connected teachers",
    },
    {
      label: "Student visible",
      value: chapterItems.length,
      hint: "Published in this chapter",
    },
  ];

  const openStudentChapter = () => {
    const primaryPlan =
      planSummary[0]?.id ||
      normalizePlanType(featuredClass?.planType || "FREE");

    navigate(
      `/ctet-tet/videos/plan/${primaryPlan}/${encodeURIComponent(
        createVideoSlug(activeSubject)
      )}/${encodeURIComponent(createVideoSlug(matchingChapter))}`
    );
  };

  const openFeatured = () => {
    if (!featuredClass?.id) {
      navigate("/admin/content/videos/add");
      return;
    }

    navigate(`/ctet-tet/videos/watch/${featuredClass.id}`);
  };

  return (
    <section className="coursePages videoAdminChapterClassesPage">
      <div className="videoAdminChapterClassesShell">
        <section className="videoAdminChapterClassesHero">
          <div className="videoAdminChapterClassesHeroCopy">
            <span className="videoAdminChapterClassesKicker">
              CHAPTER CLASSES
            </span>

            <h1>{matchingChapter || "Chapter Classes"}</h1>

            <p>
              {activeSubject || "Subject"} • Review every published recording,
              live session, replay-ready item, plan shelf, source status, and
              student watch route connected with this chapter.
            </p>

            <div className="videoAdminChapterClassesHeroActions">
              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/add")}
              >
                + Add Class
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() =>
                  navigate(
                    `/admin/content/videos/${encodeURIComponent(activeSubject)}`
                  )
                }
              >
                ← Back to Chapters
              </button>

              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>
            </div>
          </div>

          <aside className="videoAdminChapterClassesHeroPanel">
            <div className="videoAdminChapterClassesPanelTop">
              <span>Class Status</span>
              <strong>Chapter ON</strong>
            </div>

            <div className="videoAdminChapterClassesPanelStats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <div className="videoAdminChapterClassesFlowLine">
              <span>Chapter</span>
              <i />
              <span>Class</span>
              <i />
              <span>Watch</span>
            </div>
          </aside>
        </section>

        <section className="videoAdminChapterClassesHealthGrid">
          {healthStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </article>
          ))}
        </section>

        <section className="videoAdminChapterClassesFeatureDeck">
          <div className="videoAdminChapterClassesFeatureCopy">
            <span>Featured Class</span>

            <h2>{featuredClass?.title || "No class published yet"}</h2>

            <p>
              {featuredClass
                ? `${normalizePlanType(featuredClass.planType || "FREE")} • ${
                    featuredClass.subject || activeSubject
                  } • ${featuredClass.chapter || matchingChapter}`
                : "Add a recorded lesson or live class in this chapter to show it here."}
            </p>

            <div className="videoAdminChapterClassesFeatureTags">
              <small>
                {featuredClass && isLiveClass(featuredClass)
                  ? getLiveStatusLabel(getLiveClassStatus(featuredClass))
                  : "Recorded Lesson"}
              </small>

              <small>
                {featuredClass ? getClassSourceLabel(featuredClass) : "No source"}
              </small>

              <small>
                {featuredClass?.mentorName || "AspireNest Mentor"}
              </small>
            </div>

            <button
              type="button"
              className="videoManagerPrimaryButton"
              onClick={openFeatured}
            >
              {featuredClass ? "Preview Classroom →" : "+ Add Class"}
            </button>
          </div>

          <div className="videoAdminChapterClassesPlanRail">
            {planSummary.length === 0 ? (
              <article className="videoAdminChapterClassesMiniCard">
                <span>🧭</span>
                <strong>No plan shelf</strong>
                <small>Publish a class to activate chapter shelves.</small>
                <em>Waiting</em>
              </article>
            ) : (
              planSummary.map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  className="videoAdminChapterClassesMiniCard"
                  onClick={() =>
                    navigate(
                      `/ctet-tet/videos/plan/${plan.id}/${encodeURIComponent(
                        createVideoSlug(activeSubject)
                      )}/${encodeURIComponent(createVideoSlug(matchingChapter))}`
                    )
                  }
                >
                  <span>{plan.id === "PREMIUM" ? "⭐" : "🎓"}</span>

                  <strong>{plan.label} Shelf</strong>

                  <small>
                    {plan.count} class{plan.count === 1 ? "" : "es"} connected
                    with this chapter.
                  </small>

                  <em>Open Student Shelf →</em>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="videoAdminChapterClassesLibraryBlock">
          <div className="videoAdminChapterClassesLibraryHeader">
            <div>
              <span>Published chapter classroom items</span>

              <h2>Classes in {matchingChapter || "chapter"}</h2>

              <p>
                Showing {chapterItems.length} published classroom item
                {chapterItems.length === 1 ? "" : "s"} from this chapter.
              </p>
            </div>

            <div className="videoAdminChapterClassesHeaderActions">
              <button
                type="button"
                className="videoManagerSecondaryButton"
                onClick={openStudentChapter}
              >
                Student View →
              </button>

              <button
                type="button"
                className="videoManagerPrimaryButton"
                onClick={() => navigate("/admin/content/videos/manage")}
              >
                Manage Library
              </button>
            </div>
          </div>

          <div className="videoAdminChapterClassesGrid">
            {chapterItems.length === 0 ? (
              <div className="contentStudioItem videoEmptyState videoAdminChapterClassesEmptyState">
                <strong>No classes found.</strong>

                <p>
                  Add a recorded lesson or live class under this subject and
                  chapter first.
                </p>

                <div className="contentStudioActions">
                  <button
                    type="button"
                    className="publishButton"
                    onClick={() => navigate("/admin/content/videos/add")}
                  >
                    + Add Class
                  </button>
                </div>
              </div>
            ) : (
              chapterItems.map((video) => (
                <VideoAdminCard
                  key={video.id}
                  video={video}
                  onPreview={() =>
                    navigate(`/ctet-tet/videos/watch/${video.id}`)
                  }
                  onEdit={() =>
                    navigate(`/admin/content/videos/add?editId=${video.id}`)
                  }
                  onToggleStatus={null}
                  onDelete={null}
                  onOpenMenu={null}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}